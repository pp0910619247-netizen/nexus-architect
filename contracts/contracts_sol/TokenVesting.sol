// SPDX-License-Identifier: MIT
// TokenVesting — มาตรฐานสากลสำหรับ founder/team/investor allocations
// • ล็อคเหรียญใน contract ตั้งแต่ต้น (trustless — ถอนเกินสิทธิ์ไม่ได้)
// • Cliff: ก่อนถึงวันครบ cliff ถอนไม่ได้เลย
// • Linear: ปลดล็อคเชิงเส้นจนครบ duration
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenVesting is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable cliffEnd;   // start + cliff
    uint256 public immutable endTime;    // start + duration
    uint256 public total;                // เหรียญที่ล็อค (set ครั้งเดียวตอน fund)
    uint256 public released;
    bool public funded;

    event Released(uint256 amount);
    event Funded(uint256 amount);

    error BadInput();
    error NothingToRelease();
    error OnlyBeneficiary();
    error AlreadyFunded();

    /// @notice deploy ก่อน แล้ว approve + เรียก fund(amount) 1 ครั้ง
    constructor(
        address tokenAddr,
        address beneficiary_,
        uint256 start_,
        uint256 cliffSec,
        uint256 durationSec
    ) ReentrancyGuard() {
        if (tokenAddr == address(0) || beneficiary_ == address(0)) revert BadInput();
        if (durationSec == 0 || cliffSec > durationSec) revert BadInput();
        token = IERC20(tokenAddr);
        beneficiary = beneficiary_;
        start = start_;
        cliffEnd = start_ + cliffSec;
        endTime = start_ + durationSec;
    }

    /// @notice ล็อคเหรียญครั้งเดียว (approve ให้ contract ก่อนเรียก)
    function fund(uint256 amount) external nonReentrant {
        if (funded || amount == 0) revert BadInput();
        require(token.transferFrom(msg.sender, address(this), amount), "fund failed");
        total = amount;
        funded = true;
        emit Funded(amount);
    }

    /// @notice จำนวนที่ vested แล้วตามเวลา (cliff-gated linear)
    function vested() public view returns (uint256) {
        if (!funded) return 0;
        if (block.timestamp < cliffEnd) return 0;
        if (block.timestamp >= endTime) return total;
        return (total * (block.timestamp - start)) / (endTime - start);
    }

    function releasable() external view returns (uint256) {
        return vested() - released;
    }

    /// @notice เฉพาะ beneficiary เรียกถอนส่วนที่ vested
    function release() external nonReentrant {
        if (msg.sender != beneficiary) revert OnlyBeneficiary();
        uint256 amount = vested() - released;
        if (amount == 0) revert NothingToRelease();
        released += amount;
        require(token.transfer(beneficiary, amount), "transfer failed");
        emit Released(amount);
    }
}
