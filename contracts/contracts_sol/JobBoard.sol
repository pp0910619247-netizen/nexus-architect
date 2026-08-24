// SPDX-License-Identifier: MIT
// Nexus JobBoard — ตลาดงาน Escrow มาตรฐานสากล
// นายจ้างฝาก NEX ไว้ใน contract → ผู้รับงาน (คน/AI agent) ทำงาน
// → อนุมัติงาน = จ่าย 90% ให้ผู้รับงาน, 10% เป็นค่าธรรมเนียมแพลตฟอร์ม
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract JobBoard is ReentrancyGuard, Ownable {
    IERC20 public immutable token;
    address public feeCollector;
    uint16 public constant FEE_BPS = 1000; // 10.00% ต่องานสำเร็จ

    enum Status {Open, Taken, Submitted, Done, Cancelled, Disputed}

    struct Job {
        uint256 id;
        address employer;
        address worker;      // คนหรือ AI agent wallet ก็ได้
        uint256 reward;      // NEX ที่ฝากไว้ (escrow)
        string  specHash;    // IPFS/CID รายละเอียดงาน
        string  resultHash;  // CID ผลงาน
        Status  status;
        uint64  createdAt;
    }

    mapping(uint256 => Job) public jobs;
    uint256 public jobCount;
    uint256 public totalFeesCollected;

    event JobPosted(uint256 indexed id, address indexed employer, uint256 reward, string specHash);
    event JobTaken(uint256 indexed id, address indexed worker);
    event WorkSubmitted(uint256 indexed id, string resultHash);
    event JobCompleted(uint256 indexed id, address indexed worker, uint256 payout, uint256 fee);
    event JobCancelled(uint256 indexed id, address indexed employer);
    event DisputeRaised(uint256 indexed id);
    event DisputeResolved(uint256 indexed id, address indexed winner, uint256 amount);

    error BadInput();
    error NotAuthorized();

    constructor(address tokenAddr) Ownable(msg.sender) ReentrancyGuard() {
        require(tokenAddr != address(0), "token=0");
        token = IERC20(tokenAddr);
        feeCollector = msg.sender;
    }

    function setFeeCollector(address a) external onlyOwner {
        require(a != address(0), "fee=0");
        feeCollector = a;
    }

    /// @notice นายจ้างโพสต์งาน + โอน reward เข้า escrow ทันที
    function postJob(uint256 reward, string calldata specHash)
        external nonReentrant returns (uint256 id)
    {
        if (reward == 0 || bytes(specHash).length == 0) revert BadInput();
        require(token.transferFrom(msg.sender, address(this), reward), "transfer failed");
        id = ++jobCount;
        jobs[id] = Job(id, msg.sender, address(0), reward, specHash, "", Status.Open, uint64(block.timestamp));
        emit JobPosted(id, msg.sender, reward, specHash);
    }

    /// @notice ผู้รับงาน (คน หรือ AI agent wallet) กดรับงาน
    function takeJob(uint256 id) external {
        Job storage j = jobs[id];
        if (j.status != Status.Open) revert BadInput();
        j.worker = msg.sender;
        j.status = Status.Taken;
        emit JobTaken(id, msg.sender);
    }

    function submitWork(uint256 id, string calldata resultHash) external {
        Job storage j = jobs[id];
        if (j.worker != msg.sender || j.status != Status.Taken) revert NotAuthorized();
        if (bytes(resultHash).length == 0) revert BadInput();
        j.resultHash = resultHash;
        j.status = Status.Submitted;
        emit WorkSubmitted(id, resultHash);
    }

    /// @notice นายจ้างอนุมัติงาน → จ่าย 90% ผู้รับงาน + 10% ค่าธรรมเนียม
    function approveWork(uint256 id) external nonReentrant {
        Job storage j = jobs[id];
        if (j.employer != msg.sender || j.status != Status.Submitted) revert NotAuthorized();
        uint256 fee = (j.reward * FEE_BPS) / 10000;
        uint256 payout = j.reward - fee;
        j.status = Status.Done;
        require(token.transfer(j.worker, payout), "pay failed");
        if (fee > 0) {
            require(token.transfer(feeCollector, fee), "fee failed");
            totalFeesCollected += fee;
        }
        emit JobCompleted(id, j.worker, payout, fee);
    }

    /// @notice ยกเลิกงานที่ยังไม่มีใครรับ → คืนเงินนายจ้าง
    function cancelJob(uint256 id) external nonReentrant {
        Job storage j = jobs[id];
        if (j.employer != msg.sender || j.status != Status.Open) revert NotAuthorized();
        j.status = Status.Cancelled;
        require(token.transfer(j.employer, j.reward), "refund failed");
        emit JobCancelled(id, msg.sender);
    }

    /// @notice ผู้รับงาน/นายจ้างเปิดข้อพิพาทได้ (กันโกงสองทาง)
    function raiseDispute(uint256 id) external {
        Job storage j = jobs[id];
        if (msg.sender != j.employer && msg.sender != j.worker) revert NotAuthorized();
        if (j.status != Status.Taken && j.status != Status.Submitted) revert BadInput();
        j.status = Status.Disputed;
        emit DisputeRaised(id);
    }

    /// @dev Phase แรก: admin ตัดสิน (ต่อยอดเป็น Kleros/DAO arbitration ภายหลัง)
    function resolveDispute(uint256 id, address winner) external onlyOwner nonReentrant {
        Job storage j = jobs[id];
        if (j.status != Status.Disputed) revert BadInput();
        uint256 amount = j.reward;
        j.status = Status.Done;
        require(token.transfer(winner, amount), "transfer failed");
        emit DisputeResolved(id, winner, amount);
    }
}
