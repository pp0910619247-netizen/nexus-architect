// Deploy NexusToken + NexusPresale (ขายเป็นรอบ ราคาขึ้นทีละรอบ)
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy-presale.js --network amoy
//     (หรือ --network arbitrumSepolia / bscTestnet)
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const NETWORK = process.argv[2] && process.argv[2].startsWith("--network=")
  ? process.argv[2].split("=")[1] : (process.env.HH_NETWORK || "amoy");

const CFG = {
  amoy:            { rpc: "https://polygon-amoy.drpc.org",           chainId: 80002,  sym: "POL" },
  bscTestnet:      { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", chainId: 97,   sym: "tBNB" },
  arbitrumSepolia: { rpc: "https://sepolia-rollup.arbitrum.io/rpc",  chainId: 421614, sym: "ETH" },
};
const cfg = CFG[NETWORK];
if (!cfg) throw new Error("network ไม่รู้จัก: " + NETWORK);

const KEY = process.env.PRIVATE_KEY;

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  const wallet = new ethers.Wallet(KEY, provider);
  const net = await provider.getNetwork();
  console.log(`Deploy presale on ${NETWORK} (${cfg.sym}) — deployer ${wallet.address}`);
  console.log("Balance :", ethers.formatEther(await provider.getBalance(wallet.address)));
  if (Number(net.chainId) !== cfg.chainId) throw new Error(`Wrong chain: got ${net.chainId} want ${cfg.chainId}`);

  async function deploy(name, args = []) {
    const art = JSON.parse(readFileSync(new URL(`./artifacts/contracts_sol/${name}.sol/${name}.json`, import.meta.url), "utf8"));
    const c = await (new ethers.ContractFactory(art.abi, art.bytecode, wallet)).deploy(...args);
    await c.waitForDeployment();
    console.log(`OK ${name}:`, await c.getAddress());
    return c;
  }

  // ── params (แก้ได้ก่อน deploy) ──
  const START_DELAY = 0;                       // เปิดขายทันที
  const BASE_PRICE  = ethers.parseEther("0.0001"); // wei native ต่อ 1 NEX (รอบแรก)
  const CAP         = ethers.parseEther("200000"); // 200k NEX ต่อรอบ ×5 รอบ

  let tokenAddr;
  try {
    const t = await deploy("NexusToken");      // genesis mint ให้ deployer
    tokenAddr = await t.getAddress();
    var token = t;
  } catch { throw new Error("NexusToken deploy failed"); }

  const presale = await deploy("NexusPresale", [tokenAddr, START_DELAY, BASE_PRICE, CAP]);
  const psAddr = await presale.getAddress();

  // โอนเหรียญสำหรับขาย (1M NEX = cap×5) เข้า presale contract
  const sellAmount = CAP * 5n;
  await token.transfer(psAddr, sellAmount);
  console.log(`Funded presale with ${ethers.formatEther(sellAmount)} NEX`);

  console.log("\n--- วาง address ผ่านปุ่ม ⚙️ บนเว็บ หรือ localStorage ---");
  console.log(JSON.stringify({ nexus_token: tokenAddr, presale: psAddr, network: NETWORK }, null, 2));
}
main().catch(e => { console.error("FAILED:", e.message || e); process.exitCode = 1; });
