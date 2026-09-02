# NEX Tokenomics — Token Allocation (ฉบับมาตรฐานสากล)

**Total Supply:** 1,000,000,000 NEX (hard cap · burnable)

## การจัดสรร

| Pool | % | NEX | กลไก | ล็อค |
|---|---|---|---|---|
| 🛒 **Sale** | **50%** | 500M | Presale เป็นรอบ (Genesis live: 5 rounds ×200k) + phase ถัดไป | ขายได้ทันทีตามรอบ |
| ⛏️ **Mining / Rewards** | **30%** | 300M | Vesting linear 48 เดือน → ป้อน RewardSplitter แจก solver 20% + community 80% | linear เดือนละ ~6.25M |
| 👤 **Founder & Project Fund** | **20%** | 200M | Vesting **cliff 12 เดือน** + linear จนครบเดือน 48 | ปีแรกถอนไม่ได้เลย |

## ทำไมโครงสร้างนี้น่าเชื่อถือ (สิ่งที่นักลงทุนดู)

1. **Founder โดนล็อคจริง on-chain** — ผ่าน `TokenVesting.sol` trustless: ถอนเกินสูตรไม่ได้แม้ deployer จะอยาก
2. **Cliff 12 เดือน** = founder ไม่ dump ปีแรงแน่ (มาตรฐาน VC)
3. **Mining ผูกกับ output จริง** — 30% หลั่งเข้า reward engine v1.1 (solution-mined halving + tail floor) ตาม whitepaper ไม่ใช่ปล่อยฟรี
4. **Supply ตายตัว 1B** — mint เพิ่มเกิน cap ไม่ได้ (enforce ใน contract)

## Contract Addresses (Polygon Mainnet — LIVE)

| Contract | Address |
|---|---|
| NexusToken (NEX32) | `0x770AFC829e87d9A3467b20d6f3E5122BBa9BA0af` |
| NexusPresale (PublicSale) | `0xB1293Ed631e4bDf568e91727F78fAd170cC58304` |
| ⛏️ MiningRewards | `0x9B3eDdd22210861D5b24aEBB392dcd47876Aa08C` |
| 🕘 TeamVesting | `0xf596558e93Ca6d1e9A873389b50D1ccfae8cA796` |

> ตรวจสอบได้บน Polygonscan · presale เปิดขาย 500M NEX (POL ผ่าน Chainlink Oracle) · ดูราคาเรียลไทม์ที่ landing.html / app

### Testnet (Polygon Amoy) — สำหรับทดสอบ dev

| Contract | Address |
|---|---|
| NexusToken (NEX) | `0x999dec3a199335e0a83d0Dc03d8d0ABB48542035` |
| NexusPresale (Genesis Sale) | `0x8b6EC8d481A583d788B9C9d2c914E9bc0a220e24` |
| JobBoard (fee 10%) | `0xD6CA3267356f91E3c43097adf8F02caFa42D358A` |
| ProblemRegistry | `0x5dDA958680e4Cf99200906bF7F357310D51F9157` |
| RewardSplitter | `0x97fb5CEada36C721a4b82BF6a6ddFa565AC79ecF` |
| ⛏️ Mining Treasury Vesting | `0xf0B7104aAbb2a42587464B004c3dd14034B86B07` (300M locked) |
| 👤 Founder Vesting | `0x0f9f528514d5920a6261524E9fA8D8A9F3D76375` (200M locked) |

✅ **Allocation executed on-chain** — total supply = 1,000,000,000 NEX · Sale Reserve 499M ใน deployer wallet สำหรับ phase ถัดไป

## 🔒 Governance Upgrade (มาตรฐานสากล — กำลังทำ)

| กลไก | สถานะ | รายละเอียด |
|---|---|---|
| TimelockController (OZ) 24h | ⏳ deploy ผ่าน `upgrade-mainnet.mjs` | ownership ของ presale → timelock → ถอน POL/USDT ต้อง schedule + รอ 24 ชม. |
| SaleReserveLock (cliff 6m → linear 48m) | ⏳ deploy ผ่าน `upgrade-mainnet.mjs` | ล็อกพูลขาย ~499.9M → ไหลเข้า presale ตามตารางเท่านั้น (dump เปล่าไม่ได้) |

> อัปเดต address ตรงนี้ + index.html หลังรัน script สำเร็จ

## Emission Schedule (Mining pool → rewards)

```
Reward(n+1) = max( Reward(n) × 0.5 , TAIL_FLOOR )
halving trigger: solutions สะสมครบ milestone (×250)   [WP v1.1]
TAIL_FLOOR     = R0 / 4096  (emission ไม่ตาย)
```

## วิธี execute allocation

> Allocation ได้ทำบน Mainnet แล้ว; `contracts/` ย้ายออกจาก repo นี้ชั่วคราว (ดู git history / repo แยกสำหรับ deploy) · ตัวอย่างเดิม (testnet) เก็บไว้ให้ดู flow:

```powershell
cd contracts
$env:PRIVATE_KEY="0x..."        # wallet โครงการ (ต้องมี POL ~0.08)
npx hardhat run deploy-allocation.js --network amoy
```
