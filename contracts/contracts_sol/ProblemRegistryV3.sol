// SPDX-License-Identifier: MIT
// Nexus Architect — Problem Registry V3
// เพิ่มจาก V2: Midnight Culling บน chain — โจทย์ต้องได้ >surviveVotes ภายใน votingWindow
// ไม่งั้นใครก็เรียก cullExpired() ได้ (permissionless cleanup)
pragma solidity ^0.8.24;

contract ProblemRegistryV3 {
    enum Status { Open, Voted, InProgress, Solved, Rejected, Culled }
    enum SolutionStatus { Submitted, Approved, Rejected }

    struct Problem {
        uint256 id;
        address proposer;
        string  titleHash;      // IPFS CID
        uint8   category;       // 0=HUMAN 1=GROUP 2=AI_MOTHER 3=ANOMALY 4=AI_DEV
        bool    hrwFlagged;
        uint256 votes;
        Status  status;
        uint64  createdAt;
        uint256 winningSolution;
    }

    struct Solution {
        uint256 id;
        uint256 problemId;
        address solver;
        string  solutionHash;
        uint8   status;
        uint256 approvals;
        uint256 rejections;
        uint64  submittedAt;
    }

    mapping(uint256 => Problem) public problems;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => Solution) public solutions;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;
    mapping(address => bool) public verifiedHuman;

    uint256 public problemCount;
    uint256 public solutionCount;
    address public admin;
    uint16 public constant HRW_SUPERMAJORITY_PCT = 6700;
    uint256 public hrwBaseVotes = 50;

    // ── Culling params (ปรับได้ทาง governance) ──
    uint256 public votingWindow = 24 hours; // ระยะเวลาโหวตต่อโจทย์
    uint256 public surviveVotes = 10;       // ต้องได้ "มากกว่า" ค่านี้ถึงรอด

    event ProblemSubmitted(uint256 indexed id, address indexed proposer, uint8 category, bool hrw);
    event ProblemVoted(uint256 indexed id, address indexed voter, uint256 totalVotes);
    event MissionPeakSelected(uint256 indexed id);
    event SolutionSubmitted(uint256 indexed sid, uint256 indexed problemId, address indexed solver);
    event SolutionReviewed(uint256 indexed sid, address indexed reviewer, bool approve);
    event SolutionWinner(uint256 indexed sid, uint256 indexed problemId, address indexed solver);
    event ProblemCulled(uint256 indexed id, uint256 finalVotes);

    error NotVerified();
    error AlreadyVoted();
    error NotAdmin();
    error BadInput();
    error TooEarly();
    error Survived();

    modifier onlyVerified() {
        if (!verifiedHuman[msg.sender]) revert NotVerified();
        _;
    }
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor() { admin = msg.sender; }

    function setVerifiedHuman(address user, bool v) external onlyAdmin { verifiedHuman[user] = v; }
    function setHrwBaseVotes(uint256 n) external onlyAdmin { hrwBaseVotes = n; }
    function setVotingWindow(uint256 sec) external onlyAdmin {
        if (sec < 1 hours || sec > 7 days) revert BadInput();
        votingWindow = sec;
    }
    function setSurviveVotes(uint256 n) external onlyAdmin { surviveVotes = n; }

    function submitProblem(string calldata titleHash, uint8 category)
        external onlyVerified returns (uint256)
    {
        if (category > 4) revert BadInput();
        uint256 id = ++problemCount;
        bool hrw = (category == 0 || category == 1);
        problems[id] = Problem(id, msg.sender, titleHash, category, hrw, 0, Status.Open, uint64(block.timestamp), 0);
        emit ProblemSubmitted(id, msg.sender, category, hrw);
        return id;
    }

    function vote(uint256 id) external onlyVerified {
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();
        hasVoted[id][msg.sender] = true;
        problems[id].votes += 1;
        emit ProblemVoted(id, msg.sender, problems[id].votes);
    }

    /// @dev HRW: votes ≥ ceil(base × 67%) ก่อนขึ้น Mission Peak · culled ขึ้นไม่ได้
    function selectMissionPeak(uint256 id) external onlyAdmin {
        Problem storage p = problems[id];
        if (p.id == 0 || p.status == Status.Culled) revert BadInput();
        if (p.hrwFlagged) {
            uint256 required = (hrwBaseVotes * uint256(HRW_SUPERMAJORITY_PCT) + 9999) / 10000;
            if (p.votes < required) revert BadInput();
        }
        p.status = Status.Voted;
        emit MissionPeakSelected(id);
    }

    /// @notice permissionless cull — หมดเวลาแล้วโหวตไม่ผ่านเกณฑ์ → ล้างออก
    function cullExpired(uint256 id) external {
        Problem storage p = problems[id];
        if (p.id == 0 || p.status != Status.Open) revert BadInput();
        if (block.timestamp < p.createdAt + votingWindow) revert TooEarly();
        if (p.votes > surviveVotes) revert Survived();
        p.status = Status.Culled;
        emit ProblemCulled(id, p.votes);
    }

    function submitSolution(uint256 problemId, string calldata solutionHash)
        external onlyVerified returns (uint256)
    {
        if (problemId == 0 || problemId > problemCount) revert BadInput();
        if (problems[problemId].status == Status.Culled) revert BadInput();
        uint256 sid = ++solutionCount;
        solutions[sid] = Solution(sid, problemId, msg.sender, solutionHash, uint8(SolutionStatus.Submitted), 0, 0, uint64(block.timestamp));
        problems[problemId].status = Status.InProgress;
        emit SolutionSubmitted(sid, problemId, msg.sender);
        return sid;
    }

    function reviewSolution(uint256 sid, bool approve) external onlyVerified {
        if (hasReviewed[sid][msg.sender]) revert AlreadyVoted();
        hasReviewed[sid][msg.sender] = true;
        if (approve) solutions[sid].approvals += 1; else solutions[sid].rejections += 1;
        emit SolutionReviewed(sid, msg.sender, approve);
    }

    function declareWinner(uint256 sid) external onlyAdmin {
        Solution storage s = solutions[sid];
        if (s.approvals <= s.rejections) revert BadInput();
        Problem storage p = problems[s.problemId];
        p.status = Status.Solved;
        p.winningSolution = sid;
        s.status = uint8(SolutionStatus.Approved);
        emit SolutionWinner(sid, s.problemId, s.solver);
    }
}
