// deploy-full.mjs — Deploy NEW Presale + Mint NEX to 1B
// Run: node deploy-full.mjs
// Requires: PRIVATE_KEY in .env

import 'dotenv/config';
import { ethers } from 'ethers';

const RPC    = 'https://polygon-bor-rpc.publicnode.com';
const NEX    = '0x65A56978A60733B28cD1FD61C760AB5dC8FD3081';
const USDT   = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const KEY    = process.env.PRIVATE_KEY;

if (!KEY) { console.error('❌ ใส่ PRIVATE_KEY ในไฟล์ contracts/.env'); process.exit(1); }

const NEX_ABI = [
  'function mint(address,uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
];

const PS_ABI = [
  'constructor(address,uint256,uint256,uint256,uint256,address,address)',
  'function ROUNDS() view returns (uint256)',
  'function currentRound() view returns (uint256)',
  'function perRoundCap() view returns (uint256)',
  'function basePriceUSDT() view returns (uint256)',
  'function priceOfUSDT(uint8) view returns (uint256)',
  'function nexToken() view returns (address)',
  'function owner() view returns (address)',
  'function quote(uint256,bool) view returns (uint256)',
];

// Presale v2 bytecode — pre-compiled with Hardhat
// If not available, compile first: npx hardhat compile
import { readFileSync } from 'node:fs';
let PS_BYTECODE;
try {
  const artifact = JSON.parse(readFileSync('./artifacts/contracts_sol/NexusPresaleUSDT.sol/NexusPresaleUSDT.json','utf8'));
  PS_BYTECODE = artifact.bytecode;
} catch(e) {
  console.error('❌ ไม่พบ bytecode — รัน npx hardhat compile ก่อน');
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer   = new ethers.Wallet(KEY, provider);
  const addr     = await signer.getAddress();

  console.log('═══════════════════════════════════════');
  console.log('  NEXUS ARCHITECT — FULL DEPLOY');
  console.log('═══════════════════════════════════════');
  console.log('Owner:  ', addr);
  console.log('POL:    ', ethers.formatEther(await provider.getBalance(addr)));

  const nex = new ethers.Contract(NEX, NEX_ABI, signer);
  const currentSupply = await nex.totalSupply();
  const balance       = await nex.balanceOf(addr);
  console.log('Supply: ', ethers.formatEther(currentSupply), 'NEX');
  console.log('Wallet: ', ethers.formatEther(balance), 'NEX');

  // ══════════════════════════════════════════
  // STEP 1: Mint 900M NEX (total = 1B)
  // ══════════════════════════════════════════
  const targetSupply = 1_000_000_000n * 10n ** 18n;
  const need = targetSupply - currentSupply;

  if (need > 0n) {
    console.log('\n═══ STEP 1: MINT ' + ethers.formatEther(need) + ' NEX ═══');
    const tx = await nex.mint(addr, need);
    console.log('Tx:', tx.hash);
    await tx.wait();
    console.log('✅ Minted! New supply:', ethers.formatEther(await nex.totalSupply()));
  } else {
    console.log('\n═══ STEP 1: SKIP (supply already 1B) ═══');
  }

  // ══════════════════════════════════════════
  // STEP 2: DEPLOY NEW PRESALE
  // ══════════════════════════════════════════
  console.log('\n═══ STEP 2: DEPLOY PRESALE v2 ═══');

  // Parameters
  const basePriceUSDT   = 100n;              // $0.0001/NEX (round 1)
  const basePricePOLWei = ethers.parseEther('0.0000005'); // ~$0.0001 in POL
  const capPerRound     = 100_000_000n * 10n ** 18n;     // 100M NEX/round
  const totalRounds     = 5n;                               // 5 rounds = 500M

  console.log('Price (R1): $' + (Number(basePriceUSDT) / 1e6).toFixed(6) + '/NEX');
  console.log('Cap/round:  ' + ethers.formatEther(capPerRound) + ' NEX');
  console.log('Rounds:     ' + totalRounds);
  console.log('Total:      ' + ethers.formatEther(capPerRound * totalRounds) + ' NEX');

  const factory = new ethers.ContractFactory(PS_ABI, PS_BYTECODE, signer);
  const presale = await factory.deploy(NEX, basePriceUSDT, basePricePOLWei, capPerRound, totalRounds, USDT, addr);
  await presale.waitForDeployment();
  const psAddr = await presale.getAddress();
  console.log('✅ Presale deployed:', psAddr);
  console.log('   Polygonscan: https://polygonscan.com/address/' + psAddr);

  // ══════════════════════════════════════════
  // STEP 3: TRANSFER 500M NEX TO PRESALE
  // ══════════════════════════════════════════
  console.log('\n═══ STEP 3: TRANSFER 500M NEX TO PRESALE ═══');
  const presaleAmount = 500_000_000n * 10n ** 18n;
  const tx3 = await nex.transfer(psAddr, presaleAmount);
  console.log('Tx:', tx3.hash);
  await tx3.wait();
  const psBal = ethers.formatEther(await nex.balanceOf(psAddr));
  console.log('✅ Presale balance:', psBal, 'NEX');

  // ══════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log('  DEPLOY COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log('NEX Token:  ', NEX);
  console.log('Presale v2: ', psAddr);
  console.log('USDT:       ', USDT);
  console.log('Owner:      ', addr);
  console.log('');
  console.log('/update ข้อมูลนี้ใน index.html:');
  console.log('  PS_ADDR="' + psAddr + '"');
  console.log('');
  console.log('Round 1: $' + (Number(basePriceUSDT) / 1e6).toFixed(6) + '/NEX × 100M = $10,000');
  console.log('Total 5 rounds: $50,000+');
}

main().catch(console.error);
