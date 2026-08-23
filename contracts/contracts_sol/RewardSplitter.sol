// SPDX-License-Identifier: MIT
// Nexus Architect — Reward Splitter (20/80 Protocol, MVP)
// รับ reward → 20% ให้ solver / 80% กระจายตามสัดส่วน participation
pragma solidity ^0.8.24;

contract RewardSplitter {
    uint256 public constant SOLVER_SHARE = 2000;   // 20.00%
    uint256 public constant BPS = 10000;

    address public admin;
    address[] public participants;                 // ผู้เข้าร่วมรอบนี้
    mapping(address => uint256) public points;     // participation points
    mapping(address => bool) public isParticipant;
    uint256 public totalPoints;

    event ParticipantAdded(address indexed who);
    event PointsAwarded(address indexed who, uint256 amount);
    event Distributed(uint256 totalAmount, uint256 solverCut);

    error NotAdmin();

    constructor() { admin = msg.sender; }

    function addParticipant(address who) external {
        if (msg.sender != admin) revert NotAdmin();
        if (!isParticipant[who]) {
            participants.push(who);
            isParticipant[who] = true;
            emit ParticipantAdded(who);
        }
    }

    // backend ให้คะแนน: โหวตถูกทิศทาง, peer review, ส่งผลงานไม่ชนะ ฯลฯ
    function awardPoints(address who, uint256 amount) external {
        if (msg.sender != admin) revert NotAdmin();
        if (!isParticipant[who]) revert NotAdmin();
        points[who] += amount;
        totalPoints += amount;
        emit PointsAwarded(who, amount);
    }

    /// @notice แจกจ่าย native token (หรือเรียกพร้อม transfer token เข้า contract ก่อน)
    function distribute(address payable solver) external payable {
        if (msg.sender != admin) revert NotAdmin();
        require(totalPoints > 0, "no participants");

        uint256 solverCut = (msg.value * SOLVER_SHARE) / BPS;
        uint256 pool = msg.value - solverCut;

        // แบ่ง 80% ตามสัดส่วน points — วงเงิน per-participant เพื่อกัน gas loop
        uint256 remaining = pool;
        for (uint256 i = 0; i < participants.length && remaining > 0; i++) {
            address p = participants[i];
            uint256 share = (pool * points[p]) / totalPoints;
            if (share > remaining) share = remaining;
            if (share > 0 && payable(p).send(share)) {
                remaining -= share;
            }
        }
        // เศษเงินจากการปัดทศนิยม + participant ที่ send fail → คืน solver (ป้องกันเงินค้าง)
        if (remaining > 0 && payable(solver).send(remaining)) {
            remaining = 0;
        }

        emit Distributed(msg.value, solverCut);

        // reset รอบใหม่
        for (uint256 i = 0; i < participants.length; i++) points[participants[i]] = 0;
        delete participants;
        delete totalPoints;

        if (solverCut > 0) payable(solver).transfer(solverCut);
    }

    function participantCount() external view returns (uint256) {
        return participants.length;
    }
}
