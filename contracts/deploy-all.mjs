// deploy-all.mjs — Deploy NEX Token (1B) + Presale (500M) ใหม่ทั้งหมด
// Run: cd contracts && node deploy-all.mjs
// ใช้ wallet ใหม่: 0xaA15b2871F844dB9Bd4076e78293FB797646fc64

import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'node:fs';

const RPC = 'https://polygon-bor-rpc.publicnode.com';
const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; // Polygon Mainnet USDT
const KEY = process.env.PRIVATE_KEY;

if (!KEY) { console.error('❌ ใส่ PRIVATE_KEY ใน .env'); process.exit(1); }

// Load compiled artifacts
let NEX_BYTECODE, NEX_ABI_FULL;
let PS_BYTECODE, PS_ABI_FULL;
try {
  const nexArt = JSON.parse(readFileSync('./artifacts/contracts_sol/NexusToken.sol/NexusToken.json','utf8'));
  NEX_BYTECODE = nexArt.bytecode;
  NEX_ABI_FULL = nexArt.abi;
  const psArt = JSON.parse(readFileSync('./artifacts/contracts_sol/NexusPresaleUSDT.sol/NexusPresaleUSDT.json','utf8'));
  PS_BYTECODE = psArt.bytecode;
  PS_ABI_FULL = psArt.abi;
} catch(e) {
  console.error('❌ ไม่พบ artifacts — รัน npx hardhat compile ก่อน');
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(KEY, provider);
  const addr = await signer.getAddress();

  console.log('═══════════════════════════════════════════');
  console.log('  NEXUS ARCHITECT — FULL DEPLOY (NEW)');
  console.log('═══════════════════════════════════════════');
  console.log('Owner:', addr);
  const polBal = ethers.formatEther(await provider.getBalance(addr));
  console.log('POL:', polBal);
  if (parseFloat(polBal) < 0.1) {
    console.error('❌ POL ไม่พอ — ต้องมีอย่างน้อย 0.1 POL');
    process.exit(1);
  }

  // ═══════════════════════════════════════
  // STEP 1: DEPLOY NEX TOKEN (1B supply)
  // ═══════════════════════════════════════
  console.log('\n═══ STEP 1: DEPLOY NEX TOKEN ═══');
  const nexFactory = new ethers.ContractFactory(NEX_ABI_FULL, NEX_BYTECODE, signer);
  const nex = await nexFactory.deploy();
  await nex.waitForDeployment();
  const nexAddr = await nex.getAddress();
  console.log('✅ NEX Token deployed:', nexAddr);
  console.log('   https://polygonscan.com/address/' + nexAddr);

  // Genesis mint = 100M (automatic in constructor)
  const genesisBal = ethers.formatEther(await nex.balanceOf(addr));
  console.log('   Genesis minted:', genesisBal, 'NEX');

  // Mint remaining 900M to reach 1B
  const currentSupply = await nex.totalSupply();
  const targetSupply = 1_000_000_000n * 10n ** 18n;
  const need = targetSupply - currentSupply;
  if (need > 0n) {
    console.log('   Minting', ethers.formatEther(need), 'more NEX...');
    const tx1 = await nex.mint(addr, need);
    await tx1.wait();
    const newSupply = ethers.formatEther(await nex.totalSupply());
    console.log('   ✅ Total supply:', newSupply, 'NEX');
  }

  // ═══════════════════════════════════════
  // STEP 2: DEPLOY PRESALE
  // ═══════════════════════════════════════
  console.log('\n═══ STEP 2: DEPLOY PRESALE ═══');

  // Parameters
  const startDelaySec = 60;                    // เริ่มขายใน 60 วินาที
  const basePriceUSDT = 100n;                  // $0.0001/NEX (round 1) → 100M × $0.0001 = $10,000
  const basePricePOLWei = ethers.parseEther('0.0000005'); // ~$0.0001 in POL
  const capPerRound = 100_000_000n * 10n ** 18n;        // 100M NEX per round
  const requireWhitelist = false;

  console.log('Start delay:', startDelaySec, 'sec');
  console.log('Price R1: $' + (Number(basePriceUSDT) / 1e6).toFixed(6) + '/NEX');
  console.log('Cap/round:', ethers.formatEther(capPerRound), 'NEX');
  console.log('Rounds: 5 (total 500M NEX)');

  const psFactory = new ethers.ContractFactory(PS_ABI_FULL, PS_BYTECODE, signer);
  const presale = await psFactory.deploy(
    nexAddr,           // NEX token
    USDT,              // USDT
    startDelaySec,     // start in 60 sec
    basePriceUSDT,     // $0.0001/NEX
    basePricePOLWei,   // POL equivalent
    capPerRound,       // 100M per round
    requireWhitelist   // no whitelist
  );
  await presale.waitForDeployment();
  const psAddr = await presale.getAddress();
  console.log('✅ Presale deployed:', psAddr);
  console.log('   https://polygonscan.com/address/' + psAddr);

  // ═══════════════════════════════════════
  // STEP 3: TRANSFER 500M NEX → PRESALE
  // ═══════════════════════════════════════
  console.log('\n═══ STEP 3: TRANSFER 500M NEX TO PRESALE ═══');
  const presaleAmount = 500_000_000n * 10n ** 18n;
  const tx3 = await nex.transfer(psAddr, presaleAmount);
  await tx3.wait();
  const psBal = ethers.formatEther(await nex.balanceOf(psAddr));
  const walletBal = ethers.formatEther(await nex.balanceOf(addr));
  console.log('✅ Presale balance:', psBal, 'NEX');
  console.log('   Wallet balance:', walletBal, 'NEX');

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ DEPLOY COMPLETE!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('/update index.html:');
  console.log('  NEX_ADDR="' + nexAddr + '"');
  console.log('  PS_ADDR="' + psAddr + '"');
  console.log('');
  console.log('NEX Token: ', nexAddr);
  console.log('Presale:   ', psAddr);
  console.log('USDT:      ', USDT);
  console.log('Owner:     ', addr);
  console.log('');
  console.log('Tokenomics:');
  console.log('  Total Supply:    1,000,000,000 NEX');
  console.log('  Public Sale:       500,000,000 NEX (50%)');
  console.log('  Founder (wallet):  500,000,000 NEX');
  console.log('');
  console.log('Round pricing:');
  console.log('  R1: $0.0001 × 100M = $10,000');
  console.log('  R2: $0.00015 × 100M = $15,000');
  console.log('  R3: $0.000225 × 100M = $22,500');
  console.log('  R4: $0.0003375 × 100M = $33,750');
  console.log('  R5: $0.00050625 × 100M = $50,625');
  console.log('  Total: $131,875');
  console.log('');
  console.log('/run: node deploy-all.mjs');
}

main().catch(console.error);
