# NEXUS CHAIN — สร้าง Blockchain ของเราเอง (แบบเป็นขั้นจริง)

> ความฝัน "chain ของตัวเอง" ทำได้จริง — แต่ต้องไปให้ถึง**ทีละชั้น** (ข้ามชั้น = ล้ม)

## 🟢 Level 1 — Nexus Chain Private (วันนี้ · 0 บาท · 30 นาที)
Chain EVM ของเราเองรันบนเครื่อง/เซิร์ฟเวอร์ — deploy contracts ทุกตัวขึ้น chain นี้
```powershell
cd contracts
npx hardhat node                       # เปิด chain local: http://127.0.0.1:8545 (20 accounts เงินฟรี)
# terminal 2:
$env:PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # account #0 ของ hardhat node
npx hardhat run deploy-allocation.js --network localhost
npx hardhat run deploy-presale.js   --network localhost
```
MetaMask → Add network manually → RPC `http://127.0.0.1:8545` chainId 31337
= **Nexus Chain v0 (dev)** ✅ ใช้ demo ที่ไม่พึ่ง public testnet

## 🟡 Level 2 — Nexus TestNet (Public) — เมื่อมี server เดียว (~$20/เดือน)
- เปิด Hardhat node บน VPS + Cloudflare Tunnel → คนภายนอก connect ได้
- หรือใช้ **op-geth / Erigon private network** (PoA Clique): 2 validators, block 2s
- ผูก ChainID ของเรา: `1337` → "NexusChain"

## 🔴 Level 3 — Sovereign L1 จริง (Roadmap Phase 3 — หลัง audit+users)
| ทาง | ต้นทุน | เวลา |
|---|---|---|
| Polygon Supernets / Edge (Polygon CDK) | validator set + infra | ~2-3 เดือน |
| Cosmos SDK + IBC | dev team 2+ | ~4-6 เดือน |
| Arbitrum Orbit chain | ต่อยอด security ของ Ethereum | ~1-2 เดือน |

**เกณฑ์ก่อนขึ้น L3:** DAU ≥5k · TVL/tokens staked มีมูลค่าจริง · audit ผ่าน 2 firm · legal entity พร้อม

---
*จำไว้: Bitcoin เริ่มจาก 1 node ในโรงรถ — Level 1 วันนี้ = seed ของ Level 3 วันหน้า*
