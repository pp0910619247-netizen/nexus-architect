// Token Allocation — จัดสรรเหรียญตามแผน (มาตรฐานสากล)
// ┌────────────────────────┬───────┬───────────┬──────────────────────────────┐
// │ Pool                   │ %     │ NEX       │ กลไก                          │
// ├────────────────────────┼───────┼───────────┼──────────────────────────────┤
// │ Sale                   │ 50%   │ 500M      │ Presale phases (Genesis live) │
// │ Mining / Rewards       │ 30%   │ 300M      │ Vesting 48mo → RewardSplitter │
// │ Founder & Project Fund │ 20%   │ 200M      │ Vesting cliff 12mo + 36mo     │
// └────────────────────────┴───────┴───────────┴──────────────────────────────┘
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy-allocation.js --network amoy
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const RPC = process.env.AMOY_RPC || "https://polygon-amoy-bor-rpc.publicnode.com";
const KEY = process.env.PRIVATE_KEY;
const NEX_ADDR = process.env.NEX_ADDR || "0x999dec3a199335e0a83d0Dc03d8d0ABB48542035";
const PRESALE_ADDR = process.env.PRESALE_ADDR || "0x8b6EC8d481A583d788B9C9d2c914E9bc0a220e24";

const M = (n) => ethers.parseEther(n + "000000"); // million helper

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(KEY, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("Deployer:", wallet.address, "· Balance:", ethers.formatEther(bal), "POL");
  if (bal < ethers.parseEther("0.06")) throw new Error("POL ไม่พอ — เติม faucet ก่อน (ต้อง ~0.08)");

  const art = (n) => JSON.parse(readFileSync(new URL(`./artifacts/contracts_sol/${n}.sol/${n}.json`, import.meta.url), "utf8"));
  const nex = new ethers.Contract(NEX_ADDR, ["function mint(address,uint256)","function balanceOf(address) view returns (uint256)","function approve(address,uint256) returns (bool)","function totalSupply() view returns (uint256)"], wallet);

  // 1) Mint เพิ่มให้ครบ 1B total supply (genesis อยู่ 100M)
  const ts = await nex.totalSupply();
  const need = M(1000) - ts;
  if (need > 0n) { console.log("Mint เพิ่ม", ethers.formatEther(need), "NEX ..."); await (await nex.mint(wallet.address, need)).wait(); }

  // 2) Mining/Emission treasury: 300M · ปลดล็อค linear 48 เดือน (ไม่มี cliff)
  const now = Math.floor(Date.now() / 1000);
  const vMine = await (new ethers.ContractFactory(art("TokenVesting").abi, art("TokenVesting").bytecode, wallet))
    .deploy(NEX_ADDR, wallet.address, now, 0, 48 * 30 * 86400);
  await vMine.waitForDeployment();
  const mineAddr = await vMine.getAddress();
  await (await nex.approve(mineAddr, M(300))).wait();
  await (await vMine.fund(M(300))).wait();
  console.log("OK Mining Treasury:", mineAddr);

  // 3) Founder & Project fund: 200M · cliff 12 เดือน + linear ถึงเดือนที่ 48
  const vFounder = await (new ethers.ContractFactory(art("TokenVesting").abi, art("TokenVesting").bytecode, wallet))
    .deploy(NEX_ADDR, wallet.address, now, 365 * 86400, 48 * 30 * 86400);
  await vFounder.waitForDeployment();
  const fAddr = await vFounder.getAddress();
  await (await nex.approve(fAddr, M(200))).wait();
  await (await vFounder.fund(M(200))).wait();
  console.log("OK Founder Vesting:", fAddr);

  // สรุป
  const inv = await nex.balanceOf(PRESALE_ADDR);
  console.log("\n════════ ALLOCATION FINAL ════════");
  console.log("Sale (Presale Genesis):", ethers.formatEther(inv), "NEX ขายได้จริงตอนนี้");
  console.log("Sale Reserve          :", ethers.formatEther(await nex.balanceOf(wallet.address)), "NEX (wallet deployer — ไว้ phase ถัดไป)");
  console.log("Mining locked         : 300,000,000 (linear 48mo)");
  console.log("Founder locked        : 200,000,000 (cliff 12mo → 48mo)");
  console.log("Total supply          :", ethers.formatEther(await nex.totalSupply()), "NEX");
  console.log("\n→ บันทึก addresses ลง TOKENOMICS.md");
}
main().catch(e => { console.error("FAILED:", e.message || e); process.exitCode = 1; });
