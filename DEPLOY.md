# Nexus Deployment Kit — Polygon Amoy Testnet

คู่มือ deploy contracts 2 ตัวขึ้น testnet ให้ได้ภายใน 30 นาที

## 0. เตรียม

```powershell
# ติดตั้ง Foundry (toolchain deploy contract)
curl -L https://foundry.paradigm.xyz | iex   # หรือดาวน์โหลด foundryup สำหรับ Windows
foundryup
```

## 1. Wallet + Testnet ETH

1. ติดตั้ง MetaMask → Create Wallet
2. เปิด network "Polygon Amoy" (chainId 80002)
3. ก๊อบ address ไปรับฟรีที่ faucet:
   - https://faucet.polygon.technology/ (เลือก Amoy)
   - https://www.alchemy.com/faucets/polygon-amoy
4. Export Private Key จาก MetaMask (Account details → Export)

## 2. Deploy

```powershell
cd nexus-architect\contracts

# ตั้ง environment (อย่า commit key จริง!)
$env:PRIVATE_KEY="0xใส่privatekeyของคุณ"
$env:RPC_URL="https://rpc-amoy.polygon.technology"

forge init --no-commit --force
forge build

forge create ProblemRegistry.sol:ProblemRegistry --rpc-url $env:RPC_URL --private-key $env:PRIVATE_KEY
forge create RewardSplitter.sol:RewardSplitter   --rpc-url $env:RPC_URL --private-key $env:PRIVATE_KEY
```

บันทึก address ที่ output แล้วนำไปใส่ใน `app/index.html` (ผ่าน ethers.js ภายหลัง)
+ verify บน explorer: https://amoy.polygonscan.com

## 3. เชื่อม App กับ Contract

เพิ่มใน `app/index.html`:
```js
const REGISTRY = "0x<address ProblemRegistry>";
const SPLITTER = "0x<address RewardSplitter>";
// ethers v6 CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js"></script>
// const c = new ethers.Contract(REGISTRY, ABI, signer); await c.submitProblem(title, cat);
```

## ⚠️ Security Rules

- **NEVER** commit private key / .env ลง git (ใช้ `.gitignore` ที่ให้มา)
- Key testnet ใช้ wallet แยกจาก mainnet เสมอ
- ก่อน mainnet: audit โดย third party (ไม่ใช่ self-audit)
