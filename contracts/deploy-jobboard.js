// Deploy เฉพาะ JobBoard (ใช้ NEX Token ที่ deploy ไปแล้ว)
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy-jobboard.js --network amoy
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const RPC = process.env.AMOY_RPC || "https://polygon-amoy-bor-rpc.publicnode.com"; // RPC สำรอง กัน drpc ล่ม
const KEY = process.env.PRIVATE_KEY;
const NEX_TOKEN = "0xed116f20630368a31A23aa57A0e37914937bba47";

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(KEY, provider);
  const net = await provider.getNetwork();
  console.log("Deployer :", wallet.address);
  console.log("Balance  :", ethers.formatEther(await provider.getBalance(wallet.address)), "POL");
  if (Number(net.chainId) !== 80002) throw new Error("Wrong network");
  console.log("NEX Token:", NEX_TOKEN);

  const art = JSON.parse(readFileSync(new URL("./artifacts/contracts_sol/JobBoard.sol/JobBoard.json", import.meta.url), "utf8"));
  const board = await (new ethers.ContractFactory(art.abi, art.bytecode, wallet)).deploy(NEX_TOKEN);
  await board.waitForDeployment();
  const addr = await board.getAddress();
  console.log("OK JobBoard:", addr);

  console.log("\n--- address for app ---");
  console.log(JSON.stringify({ nexus_token: NEX_TOKEN, job_board: addr }, null, 2));
}
main().catch(e => { console.error("FAILED:", e.message || e); console.error("RPC ล่มชั่วคราว? ลองรันใหม่อีกครั้งได้เลย"); process.exitCode = 1; });
