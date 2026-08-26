// Deploy NexusPresaleUSDT v2 — Full Tokenomics
// 500M NEX / 5 rounds / 100M per round
// ใช้บน Polygon Mainnet (chainId 137)
import { ethers } from 'ethers';
import 'dotenv/config';

const RPC  = 'https://polygon-bor-rpc.publicnode.com';
const NEX  = '0x65A56978A60733B28cD1FD61C760AB5dC8FD3081';
const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const PRIVATE_KEY = process.env.DEPLOY_KEY;

// ══════════════════════════════════════════════
// ส่ง 0x72d...d72 ไปให้เลือกว่า:
//   A) Mint 900M NEX (total supply = 1B)
//   B) Deploy Presale ใหม่ (500M NEX / 5 rounds)
//   C) ทั้งสองอย่าง (A แล้ว B)
// ══════════════════════════════════════════════

const ACTION = process.argv[2] || 'B'; // A=mint, B=deploy, C=both

const NEX_ABI = [
  'function mint(address,uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
];

const PRESALE_ABI = [
  'constructor(address,uint256,uint256,uint256,uint256,address,address)',
  'function ROUNDS() view returns (uint256)',
  'function currentRound() view returns (uint256)',
  'function perRoundCap() view returns (uint256)',
  'function basePriceUSDT() view returns (uint256)',
  'function priceOfUSDT(uint8) view returns (uint256)',
  'function nexToken() view returns (address)',
  'function owner() view returns (address)',
];

const PRESALE_BYTECODE = process.env.PRESALE_BYTECODE; // pre-compiled

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const addr = await signer.getAddress();
  console.log('Owner:', addr);

  // Check POL balance
  const polBal = ethers.formatEther(await provider.getBalance(addr));
  console.log('POL balance:', polBal);

  // Check NEX balance
  const nex = new ethers.Contract(NEX, NEX_ABI, signer);
  const nexBal = ethers.formatEther(await nex.balanceOf(addr));
  console.log('NEX balance:', nexBal);
  const total = ethers.formatEther(await nex.totalSupply());
  console.log('Total supply:', total);

  if (ACTION === 'A' || ACTION === 'C') {
    // ═══ MINT 900M NEX ═══
    const mintAmount = 900_000_000n * 10n ** 18n;
    console.log('\n=== MINTING 900,000,000 NEX ===');
    const tx = await nex.mint(addr, mintAmount);
    console.log('Tx:', tx.hash);
    await tx.wait();
    const newTotal = ethers.formatEther(await nex.totalSupply());
    console.log('New total supply:', newTotal);
  }

  if (ACTION === 'B' || ACTION === 'C') {
    // ═══ DEPLOY NEW PRESALE ═══
    // Constructor params:
    // (nexToken, basePriceUSDT, basePricePOL, capPerRound, totalRounds, usdtToken, _owner)
    const basePriceUSDT = 500n;            // $0.0005 per NEX (500 / 1e6)
    const basePricePOL  = ethers.parseEther('0.000001'); // ~$0.0005 in POL
    const capPerRound   = 100_000_000n * 10n ** 18n;    // 100M NEX per round
    const totalRounds   = 5n;                             // 5 rounds = 500M total

    console.log('\n=== DEPLOYING NEW PRESALE ===');
    console.log('Price USDT:', basePriceUSDT.toString(), '(= $' + (Number(basePriceUSDT) / 1e6).toFixed(6) + '/NEX)');
    console.log('Cap/round:', ethers.formatEther(capPerRound), 'NEX');
    console.log('Rounds:', totalRounds.toString());
    console.log('Total presale:', ethers.formatEther(capPerRound * totalRounds), 'NEX');

    // Need compiled bytecode — use hardhat
    console.log('\n⚠️ ต้อง compile contract ก่อน deploy:');
    console.log('   npx hardhat compile');
    console.log('   แล้วรัน script นี้อีกครั้ง');
  }
}

main().catch(console.error);
