// SPDX-License-Identifier: MIT
// NexusPresaleUSDT v2 โ€” DUAL PAYMENT: เธเธทเนเธญ NEX เน€เธเนเธเธฃเธญเธ เธเนเธฒเธขเนเธ”เนเธ—เธฑเนเธ **USDT** เนเธฅเธฐ **POL**
// โ€ข caps เนเธเธฃเนเธเธฑเธเธ—เธธเธเธชเธเธธเธฅ ยท เธฃเธฒเธเธฒเนเธขเธเธ•เธฒเธกเธชเธเธธเธฅ (ร—1.5 เธ•เนเธญเธฃเธญเธเน€เธซเธกเธทเธญเธเธเธฑเธ)
// โ€ข USDT: approve โ’ buyWithUSDT(nexAmount)   (exact pull)
// โ€ข POL : buyWithPOL{value}  เน€เธเธดเธเน€เธเธดเธเธเธทเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด
// โ€ข whitelist compliance switch ยท proceeds เธ–เธญเธเนเธขเธเธชเธเธธเธฅเนเธ”เธข owner
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NexusPresaleUSDT is ReentrancyGuard, Ownable {
    IERC20 public immutable payToken;   // USDT-style stablecoin
    IERC20 public immutable token;      // NEX
    uint256 public immutable startAt;
    uint256 public basePriceUSDT;       // payToken units เธ•เนเธญ 1e18 NEX (round1)
    uint256 public basePricePOL;        // wei เธ•เนเธญ 1e18 NEX (round1)
    uint256 public perRoundCap;
    uint256 public constant ROUNDS = 5;

    bool    public whitelistOn;
    mapping(address => bool) public whitelisted;
    mapping(uint8 => uint256) public roundSold;         // shared across currencies
    mapping(address => uint256) public purchasedNex;

    event Purchased(address indexed buyer, uint256 nexOut, string ccy, uint256 paid, uint8 upToRound);
    event Withdrawn(string ccy, address indexed to, uint256 amount);
    event WhitelistChanged(address indexed who, bool ok);

    error BadInput();
    error NotStarted();
    error SoldOut();
    error NotWhitelisted();
    error InsufficientValue();

    constructor(
        address tokenAddr,
        address payAddr,
        uint256 startDelaySec,
        uint256 basePriceUSDT_,
        uint256 basePricePOLWei,
        uint256 capPerRoundNex,
        bool requireWhitelist
    ) Ownable(msg.sender) ReentrancyGuard() {
        if (tokenAddr == address(0) || payAddr == address(0) ||
            basePriceUSDT_ == 0 || basePricePOLWei == 0 || capPerRoundNex == 0) revert BadInput();
        token = IERC20(tokenAddr);
        payToken = IERC20(payAddr);
        startAt = block.timestamp + startDelaySec;
        basePriceUSDT = basePriceUSDT_;
        basePricePOL = basePricePOLWei;
        perRoundCap = capPerRoundNex;
        whitelistOn = requireWhitelist;
    }

    /* โ”€โ”€ compliance โ”€โ”€ */
    function setWhitelisted(address who, bool ok) external onlyOwner { whitelisted[who] = ok; emit WhitelistChanged(who, ok); }
    function setWhitelistOn(bool v) external onlyOwner { whitelistOn = v; }

    /* โ”€โ”€ pricing โ”€โ”€ */
    function _price(uint8 r, bool pol) private view returns (uint256 p) {
        p = pol ? basePricePOL : basePriceUSDT;
        for (uint8 i = 0; i < r; i++) p = p * 150 / 100;
    }
    function priceOfUSDT(uint8 r) external view returns (uint256) { return _price(r, false); }
    function priceOfPOL(uint8 r)  external view returns (uint256) { return _price(r, true); }

    function currentRound() public view returns (uint8 r) {
        if (block.timestamp < startAt) revert NotStarted();
        for (r = 0; r < ROUNDS; r++) if (roundSold[r] < perRoundCap) return r;
        revert SoldOut();
    }
    function remainingInRound(uint8 r) external view returns (uint256) { return perRoundCap - roundSold[r]; }

    /// @notice เธเธดเธงเธเธทเนเธญ nexAmount: เธเธทเธ cost เนเธเธชเธเธธเธฅเธ—เธตเนเน€เธฅเธทเธญเธ (spill เธเนเธฒเธกเธฃเธญเธ) ยท revert SoldOut เธ–เนเธฒเนเธกเนเธเธญ
    /// @notice internal quote across rounds (reverts SoldOut if insufficient inventory)
    function _quote(uint256 nexAmount, bool pol) private view returns (uint256 cost) {
        uint256 left = nexAmount;
        for (uint8 r = 0; r < ROUNDS && left > 0; r++) {
            uint256 roomLeft = perRoundCap - roundSold[r];
            if (roomLeft == 0) continue;
            uint256 take = left > roomLeft ? roomLeft : left;
            cost += take * _price(r, pol) / 1e18;
            left -= take;
        }
        if (left > 0) revert SoldOut();
    }

    function quote(uint256 nexAmount, bool pol) public view returns (uint256 cost, uint8 lastRound) {
        cost = _quote(nexAmount, pol);
        lastRound = currentRound();
    }

    modifier gate(address who) {
        if (block.timestamp < startAt) revert NotStarted();
        if (whitelistOn && !whitelisted[who]) revert NotWhitelisted();
        _;
    }

    /// @notice เธเธทเนเธญเธ”เนเธงเธข USDT โ€” approve เธเนเธญเธเน€เธฃเธตเธขเธ
    function buyWithUSDT(uint256 nexAmount) external nonReentrant gate(msg.sender) returns (uint256 paid) {
        if (nexAmount == 0) revert BadInput();
        paid = _quote(nexAmount, false);
        uint256 left = nexAmount;
        for (uint8 r = 0; r < ROUNDS && left > 0; r++) {
            uint256 roomLeft = perRoundCap - roundSold[r];
            if (roomLeft == 0) continue;
            uint256 take = left > roomLeft ? roomLeft : left;
            roundSold[r] += take;
            left -= take;
        }
        require(payToken.transferFrom(msg.sender, address(this), paid), "pay failed");
        require(token.transfer(msg.sender, nexAmount), "token failed");
        purchasedNex[msg.sender] += nexAmount;
        emit Purchased(msg.sender, nexAmount, "USDT", paid, uint8(ROUNDS - 1));
    }

    /// @notice เธเธทเนเธญเธ”เนเธงเธข POL (native) โ€” เธชเนเธ value เธกเธฒ เธชเนเธงเธเน€เธเธดเธ refund
    function buyWithPOL(uint256 nexAmount) external payable nonReentrant gate(msg.sender) returns (uint256 paid) {
        if (nexAmount == 0) revert BadInput();
        uint256 cost = _quote(nexAmount, true);
        if (msg.value < cost) revert InsufficientValue();
        uint256 left = nexAmount;
        for (uint8 r = 0; r < ROUNDS && left > 0; r++) {
            uint256 roomLeft = perRoundCap - roundSold[r];
            if (roomLeft == 0) continue;
            uint256 take = left > roomLeft ? roomLeft : left;
            roundSold[r] += take;
            left -= take;
        }
        require(token.transfer(msg.sender, nexAmount), "token failed");
        purchasedNex[msg.sender] += nexAmount;
        emit Purchased(msg.sender, nexAmount, "POL", cost, uint8(ROUNDS - 1));
        if (msg.value > cost) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(ok, "refund failed");
        }
        paid = cost;
    }

    /* โ”€โ”€ treasury โ”€โ”€ */
    function withdrawUSDT(address to) external onlyOwner nonReentrant {
        uint256 bal = payToken.balanceOf(address(this));
        require(payToken.transfer(to, bal), "wd failed");
        emit Withdrawn("USDT", to, bal);
    }
    function withdrawPOL(address to) external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(to).call{value: bal}("");
        require(ok, "wd failed");
        emit Withdrawn("POL", to, bal);
    }
}
