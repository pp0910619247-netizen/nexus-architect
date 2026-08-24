// SPDX-License-Identifier: MIT
// Nexus Presale — ขาย NEX เป็นรอบ (round-based) มาตรฐานสากล
// • จ่ายด้วยเหรียญ native (POL/MATIC · ETH · BNB — ใช้ได้ทุก EVM chain)
// • 5 รอบ ราคาขึ้น 50% ต่อรอบ · cap ต่อรอบ
// • Overpay = spill ไปรอบถัดไปอัตโนมัติ · เงินเหลือคืนผู้ซื้อทันที
// • Proceeds ถอนโดย owner (wallet โครงการ)
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NexusPresale is ReentrancyGuard, Ownable {
    IERC20 public immutable token;
    uint256 public immutable startAt;
    uint256 public basePrice;              // wei ต่อ 1 NEX ในรอบแรก
    uint256 public perRoundCap;            // NEX สูงสุดต่อรอบ
    uint256 public constant ROUNDS = 5;
    uint256 public constant TOTAL_FOR_SALE = 0; // informational: sum of caps = perRoundCap*ROUNDS
    uint256 public totalRaised;

    uint256[] public roundSold;

    event Purchased(address indexed buyer, uint256 spent, uint256 nexOut, uint8 upToRound);
    event Withdrawn(address indexed to, uint256 amount);

    error BadInput();
    error NotStarted();
    error SoldOut();
    error TooSmall();

    constructor(address tokenAddr, uint256 startDelaySec, uint256 basePriceWeiPerNex, uint256 capPerRoundNex)
        Ownable(msg.sender) ReentrancyGuard()
    {
        if (tokenAddr == address(0) || basePriceWeiPerNex == 0 || capPerRoundNex == 0) revert BadInput();
        token = IERC20(tokenAddr);
        startAt = block.timestamp + startDelaySec;
        basePrice = basePriceWeiPerNex;
        perRoundCap = capPerRoundNex;
        for (uint8 i = 0; i < ROUNDS; i++) roundSold.push(0);
    }

    /// @notice ราคา wei/NEX ของรอบ r (escalate ×1.5 ต่อรอบ)
    function priceOf(uint8 r) public view returns (uint256 p) {
        if (r >= ROUNDS) revert BadInput();
        p = basePrice;
        for (uint8 i = 0; i < r; i++) p = p * 150 / 100;
    }

    /// @notice รอบปัจจุบัน (รอบแรกที่ยังไม่เต็ม cap) — revert ถ้ายังไม่เปิด/ขายหมด
    function currentRound() public view returns (uint8 r) {
        if (block.timestamp < startAt) revert NotStarted();
        for (r = 0; r < ROUNDS; r++) if (roundSold[r] < perRoundCap) return r;
        revert SoldOut();
    }

    function remainingInRound(uint8 r) external view returns (uint256) {
        return perRoundCap - roundSold[r];
    }

    /// @notice ซื้อ NEX — จ่าย native currency, เกินเงินคืนอัตโนมัติ, ล้นรอบไปรอบถัดไป
    function buy() external payable nonReentrant {
        if (msg.value == 0) revert BadInput();
        if (block.timestamp < startAt) revert NotStarted();

        uint256 remainingValue = msg.value;
        uint256 boughtTotal;
        uint8 lastRound;

        for (uint8 r = 0; r < ROUNDS && remainingValue > 0; r++) {
            uint256 leftTokens = perRoundCap - roundSold[r];
            if (leftTokens == 0) continue;
            uint256 price = priceOf(r);                       // wei ต่อ 1e18 base units
            uint256 affordable = remainingValue * 1e18 / price;
            if (affordable == 0) break;                       // เงินไม่พอซื้อเพิ่ม
            uint256 getTokens = affordable > leftTokens ? leftTokens : affordable;
            uint256 cost = getTokens * price / 1e18;
            roundSold[r] += getTokens;
            boughtTotal += getTokens;
            remainingValue -= cost;
            lastRound = r;
        }
        if (boughtTotal == 0) revert TooSmall();

        require(token.transfer(msg.sender, boughtTotal), "token transfer failed");
        totalRaised += (msg.value - remainingValue);
        emit Purchased(msg.sender, msg.value - remainingValue, boughtTotal, lastRound);

        if (remainingValue > 0) {                      // คืนส่วนเกิน
            (bool ok, ) = payable(msg.sender).call{value: remainingValue}("");
            require(ok, "refund failed");
        }
    }

    /// @notice ถอน proceeds เข้า wallet โครงการ
    function withdrawProceeds() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawn(owner(), bal);
    }
}
