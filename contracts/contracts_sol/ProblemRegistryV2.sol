// SPDX-License-Identifier: MIT
// Nexus Architect — Problem Registry V2
// เพิ่มจาก V1: Solutions + Peer Review + Mission Peak Solver + HRW flag
pragma solidity ^0.8.24;

contract ProblemRegistryV2 {
    enum Status { Open, Voted, InProgress, Solved, Rejected }
    enum SolutionStatus { Submitted, Approved, Rejected }

    struct Problem {
        uint256 id;
        address proposer;
        string  titleHash;      // IPFS CID
        uint8   category;       // 0=HUMAN 1=GROUP 2=AI_MOTHER 3=ANOMALY 4=AI_DEV
        bool    hrwFlagged;     // Human Rights Watch module
        uint256 votes;
        Status  status;
        uint64  createdAt;
        uint256 winningSolution; // solutionId ที่ชนะ Mission Peak
    }

    struct Solution {
        uint256 id;
        uint256 problemId;
        address solver;
        string  solutionHash;   // IPFS CID
        uint8   status;         // SolutionStatus
        uint256 approvals;      // peer review yes
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
    uint16 public constant HRW_SUPERMAJORITY_PCT = 6700; // 67.00%
    uint256 public hrwBaseVotes = 50;                    // ปรับได้โดย admin/DAO

    event ProblemSubmitted(uint256 indexed id, address indexed proposer, uint8 category, bool hrw);
    event ProblemVoted(uint256 indexed id, address indexed voter, uint256 totalVotes);
    event MissionPeakSelected(uint256 indexed id);
    event SolutionSubmitted(uint256 indexed sid, uint256 indexed problemId, address indexed solver);
    event SolutionReviewed(uint256 indexed sid, address indexed reviewer, bool approve);
    event SolutionWinner(uint256 indexed sid, uint256 indexed problemId, address indexed solver);

    error NotVerified();
    error AlreadyVoted();
    error NotAdmin();
    error BadInput();

    modifier onlyVerified() {
        if (!verifiedHuman[msg.sender]) revert NotVerified();
        _;
    }

    constructor() { admin = msg.sender; }

    function setVerifiedHuman(address user, bool v) external {
        if (msg.sender != admin) revert NotAdmin();
        verifiedHuman[user] = v;
    }

    function submitProblem(string calldata titleHash, uint8 category)
        external onlyVerified returns (uint256)
    {
        if (category > 4) revert BadInput();
        uint256 id = ++problemCount;
        bool hrw = (category == 0 || category == 1); // HUMAN/GROUP → เข้า HRW pipeline
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

    /// @dev HRW: ต้องมี votes ≥ ceil(base × 67%) ก่อนขึ้น Mission Peak
    function selectMissionPeak(uint256 id) external {
        if (msg.sender != admin) revert NotAdmin();
        Problem storage p = problems[id];
        if (p.hrwFlagged) {
            uint256 required = (hrwBaseVotes * uint256(HRW_SUPERMAJORITY_PCT) + 9999) / 10000;
            if (p.votes < required) revert BadInput();
        }
        p.status = Status.Voted;
        emit MissionPeakSelected(id);
    }

    function setHrwBaseVotes(uint256 n) external {
        if (msg.sender != admin) revert NotAdmin();
        hrwBaseVotes = n;
    }

    function submitSolution(uint256 problemId, string calldata solutionHash)
        external onlyVerified returns (uint256)
    {
        if (problemId == 0 || problemId > problemCount) revert BadInput();
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

    /// @dev เลือก solution ชนะ → solver พร้อมรับ 20% จาก RewardSplitter
    function declareWinner(uint256 sid) external {
        if (msg.sender != admin) revert NotAdmin();
        Solution storage s = solutions[sid];
        if (s.approvals <= s.rejections) revert BadInput();
        Problem storage p = problems[s.problemId];
        p.status = Status.Solved;
        p.winningSolution = sid;
        s.status = uint8(SolutionStatus.Approved);
        emit SolutionWinner(sid, s.problemId, s.solver);
    }

    function solutionCount_() external view returns (uint256) { return solutionCount; }
}
