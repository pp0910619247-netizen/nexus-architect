// Deploy ProblemRegistry + RewardSplitter ไป Amoy (plain ethers v6, ไม่พึ่ง plugin)
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy.js --network amoy
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const RPC = process.env.AMOY_RPC || "https://polygon-amoy.drpc.org";
const KEY = process.env.PRIVATE_KEY;

function loadArtifact(name) {
  const p = `./artifacts/contracts_sol/${name}.sol/${name}.json`;
  return JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
}

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY env var not set");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(KEY, provider);

  const net = await provider.getNetwork();
  const bal = ethers.formatEther(await provider.getBalance(wallet.address));
  console.log("Deployer :", wallet.address);
  console.log("Balance  :", bal, "POL");
  console.log("Network  : chainId", Number(net.chainId), RPC);
  if (Number(net.chainId) !== 80002) throw new Error("Wrong network! Expected Amoy 80002");
  if (parseFloat(bal) <= 0) throw new Error("No POL balance - claim faucet first");

  async function deploy(name) {
    const art = loadArtifact(name);
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const c = await factory.deploy();
    await c.waitForDeployment();
    const addr = await c.getAddress();
    console.log(`OK ${name}: ${addr}`);
    return addr;
  }

  const registry = await deploy("ProblemRegistry");
  const splitter = await deploy("RewardSplitter");

  console.log("\n--- address for nexus.config.toml ---");
  console.log(JSON.stringify({
    problem_registry: registry,
    reward_splitter: splitter,
  }, null, 2));
}

main().catch((e) => { console.error("DEPLOY FAILED:", e.message || e); process.exitCode = 1; });
