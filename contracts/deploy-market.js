// Deploy NexusToken + JobBoard (ตลาดงาน escrow 10%)
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy-market.js --network amoy
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const RPC = process.env.AMOY_RPC || "https://polygon-amoy.drpc.org";
const KEY = process.env.PRIVATE_KEY;

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(KEY, provider);
  const net = await provider.getNetwork();
  console.log("Deployer :", wallet.address);
  console.log("Balance  :", ethers.formatEther(await provider.getBalance(wallet.address)), "POL");
  if (Number(net.chainId) !== 80002) throw new Error("Wrong network");

  async function deploy(name, args = []) {
    const art = JSON.parse(readFileSync(new URL(`./artifacts/contracts_sol/${name}.sol/${name}.json`, import.meta.url), "utf8"));
    const c = await (new ethers.ContractFactory(art.abi, art.bytecode, wallet)).deploy(...args);
    await c.waitForDeployment();
    console.log(`OK ${name}:`, await c.getAddress());
    return c;
  }

  const token = await deploy("NexusToken");
  const board = await deploy("JobBoard", [await token.getAddress()]);

  // แจก NEX ทดสอบให้ deployer ใช้โพสต์งาน (genesis 100M อยู่กับ deployer อยู่แล้ว)
  console.log("\nNEX balance ของ deployer:", ethers.formatEther(await token.balanceOf(wallet.address)), "NEX");

  console.log("\n--- address for nexus.config.toml / app ---");
  console.log(JSON.stringify({ nexus_token: await token.getAddress(), job_board: await board.getAddress() }, null, 2));
}
main().catch(e => { console.error("FAILED:", e.message || e); process.exitCode = 1; });
