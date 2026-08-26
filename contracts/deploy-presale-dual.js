// Deploy NEX + NexusPresaleUSDT (DUAL: USDT + POL) — mainnet-ready
// ใช้: $env:PRIVATE_KEY="0x..." ; npx hardhat run deploy-presale-dual.js --network amoy
//     --network amoy | mainnet | bscTestnet | arbitrumSepolia
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const NETWORK = (process.argv[2] || "").startsWith("--network=")
  ? process.argv[2].split("=")[1] : (process.env.HH_NETWORK || "amoy");

const CFG = {
  amoy:            { rpc:"https://polygon-amoy.drpc.org",                    chainId:80002,  sym:"POL",  usdt:"0x0000000000000000000000000000000000000000" },
  mainnet:         { rpc:"https://polygon-bor-rpc.publicnode.com",           chainId:137,    sym:"POL",  usdt:"0xc2132D05D31c914a87C6611C10748AEb04B58e8F" }, // USDT PoS 6dec
  bscTestnet:      { rpc:"https://data-seed-prebsc-1-s1.binance.org:8545",   chainId:97,     sym:"tBNB", usdt:"0x0000000000000000000000000000000000000000" },
};
const cfg = CFG[NETWORK];
if (!cfg) throw new Error("unknown network: " + NETWORK);
const KEY = process.env.PRIVATE_KEY;

async function main() {
  if (!KEY) throw new Error("PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  const wallet = new ethers.Wallet(KEY, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log(`[${NETWORK}] deployer ${wallet.address} · ${ethers.formatEther(bal)} ${cfg.sym}`);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== cfg.chainId) throw new Error(`wrong chain ${net.chainId} != ${cfg.chainId}`);

  const art = (n) => JSON.parse(readFileSync(new URL(`./artifacts/contracts_sol/${n}.sol/${n}.json`, import.meta.url), "utf8"));
  async function deploy(name, args = [], opts = {}) {
    const f = new ethers.ContractFactory(art(name).abi, art(name).bytecode, wallet);
    const c = await f.deploy(...args, opts);
    await c.waitForDeployment();
    console.log("OK", name, ":", await c.getAddress());
    return c;
  }

  // ── params (แก้ได้) ── หน่วย: CAP เป็น 'whole NEX' -> แปลง wei ที่นี่ที่เดียว
  const START_DELAY = 0;
  const BASE_USDT   = process.env.PRESALE_BASE_USDT || "1000";            // 0.001 USDT (6dec) / NEX
  const BASE_POL    = process.env.PRESALE_BASE_POL  || ethers.parseEther("0.00002").toString();
  const CAP         = ethers.parseEther(process.env.PRESALE_CAP || "200000").toString(); // → wei
  const NEED_WHITELIST = (process.env.PRESALE_WHITELIST === "true");

  let token;
  const existingNex = process.env.NEX_ADDR || "";
  if (existingNex) {
    token = new ethers.Contract(existingNex, ["function transfer(address,uint256) returns (bool)","function mint(address,uint256)","function balanceOf(address) view returns (uint256)"], wallet);
    console.log("Using existing NEX:", existingNex);
  } else {
    token = await deploy("NexusToken");
  }
  const tokenAddr = await token.getAddress();

  // ให้ supply พอสำหรับขาย (mint เพิ่มถ้าขาด)
  
  const saleAmt = BigInt(CAP) * 5n; // wei
  if ((await token.balanceOf(wallet.address)) < saleAmt) {
    await (await token.mint(wallet.address, saleAmt)).wait();
  }

  const ps = await deploy("NexusPresaleUSDT", [
    tokenAddr, cfg.usdt, START_DELAY, BASE_USDT, BASE_POL, CAP, NEED_WHITELIST,
  ]);
  const psAddr = await ps.getAddress();

  await (await token.transfer(psAddr, saleAmt)).wait();
  console.log(`Funded presale with ${ethers.formatEther(saleAmt)} NEX`);

  console.log("\n--- addresses ---");
  console.log(JSON.stringify({
    network: NETWORK, nexus_token: tokenAddr, presale_dual: psAddr,
    pay_token: cfg.usdt, base_usdt_per_nex: BASE_USDT, base_pol_wei_per_nex: BASE_POL,
    cap_per_round_nex: CAP, whitelist: NEED_WHITELIST,
  }, null, 2));
}
main().catch(e => { console.error("FAILED:", e.message || e); process.exitCode = 1; });
