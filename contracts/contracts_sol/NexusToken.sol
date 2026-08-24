// SPDX-License-Identifier: MIT
// Nexus Token (NEX) — ERC-20 สำหรับระบบนิเวศ (จ่ายค่างาน/reward)
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NexusToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B hard cap

    constructor() ERC20("Nexus Token", "NEX") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000 * 10**decimals()); // genesis 100M
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "cap exceeded");
        _mint(to, amount);
    }
}
