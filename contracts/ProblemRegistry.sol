// SPDX-License-Identifier: MIT
// Nexus Architect — Problem Registry (The Mountain, MVP)
// เก็บปัญหาบน chain + ระบบโหวตเลือก Mission Peak
pragma solidity ^0.8.24;

contract ProblemRegistry {
    enum Status { Open, Voted, InProgress, Solved, Rejected }

    struct Problem {
        uint256 id;
        address proposer;
        string  title;        // IPFS hash แนะนำให้เก็บ hash แทนข้อความยาว
        string  category;     // HUMAN | GROUP | AI_MOTHER | ANOMALY | AI_DEV
        uint256 votes;
        Status  status;
        uint64  createdAt;
    }

    mapping(uint256 => Problem) public problems;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // 1 vote/คน/ปัญหา
    mapping(address => bool) public verifiedHuman;               // Level 1+ (ผูกกับ Identity layer)
    uint256 public problemCount;
    address public admin;

    event ProblemSubmitted(uint256 indexed id, address indexed proposer, string category);
    event ProblemVoted(uint256 indexed id, address indexed voter, uint256 totalVotes);
    event MissionPeakSelected(uint256 indexed id);

    error NotVerified();
    error AlreadyVoted();
    error NotAdmin();

    modifier onlyVerified() {
        if (!verifiedHuman[msg.sender]) revert NotVerified();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // เรียกโดย backend หลังผู้ใช้ผ่าน Google Sign-In + Play Integrity
    function setVerifiedHuman(address user, bool v) external {
        if (msg.sender != admin) revert NotAdmin();
        verifiedHuman[user] = v;
    }

    function submitProblem(string calldata title, string calldata category)
        external onlyVerified returns (uint256)
    {
        uint256 id = ++problemCount;
        problems[id] = Problem(id, msg.sender, title, category, 0, Status.Open, uint64(block.timestamp));
        emit ProblemSubmitted(id, msg.sender, category);
        return id;
    }

    function vote(uint256 id) external onlyVerified {
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();
        hasVoted[id][msg.sender] = true;
        problems[id].votes += 1;
        emit ProblemVoted(id, msg.sender, problems[id].votes);
    }

    // DAO/backend เลือกปัญหา top ขึ้นเป็น Mission Peak (MVP: admin; Phase 3: on-chain governance)
    function selectMissionPeak(uint256 id) external {
        if (msg.sender != admin) revert NotAdmin();
        problems[id].status = Status.Voted;
        emit MissionPeakSelected(id);
    }
}
