# Nexus Architect — Whitepaper v1.1 (Changelog & Revisions)

**วันที่:** 24 สิงหาคม 2026 · แก้ไขจาก Genesis Draft v1.0 โดยอิงผล simulation จริง

---

## 🔴 การแก้ไขที่จำเป็น (Critical)

### C1. Variable Decay แบบเวลา = ตายใน 1 นาที
**v1.0 เดิม:** "Genesis: halve ทุก block (~10 วิ)"
**ผล simulate (`tools/tokenomics_sim.py`):** รางวัล → 0 ภายใน **50 blocks ≈ 48 วินาที**
supply ทุก phase ตันที่ ~2M tokens — ไม่มี emission ให้ผู้มาหลัง

**v1.1 ใหม่: Solution-Mined Halving**
```
Reward(n+1) = max( Reward(n) × 0.5 , TAIL_FLOOR )
โดย halving trigger เมื่อ solutions สะสมครบ milestone (×4 growth)
TAIL_FLOOR = R0 / 4096   (tail emission ถาวร)
```
- Emission ผูกกับ output จริงของระบบ (ปัญหาที่แก้ได้จริง) ไม่ใช่นาฬิกา
- DAO ปรับ milestone ได้ (67% vote, Level 3+)

### C2. "AI ไม่ Pretrained" ไม่เป็นความจริงทางเทคนิค
LLM ที่ไม่ pretrained ไม่มีความฉลาดพอจะช่วยใครได้
**v1.1 pitch ใหม่:** *"Memory 100% เป็นของเจ้าของ"* — base model เป็น open-source
(Llama/Qwen/Mistral) แต่ความทรงจำ/บุคลิก/context อยู่ on-device 100% และ export/delete ได้

### C3. Anti-Bot Soft Reset เพียงอย่างเดียวไม่พอ
Bot farm จะ bypass heuristics ภายในสัปดาห์
**v1.1:** Soft Reset + sybil cost (Level 2 KYC ก่อนถอน) + rate-limit rewards ต่อ device fingerprint

## 🟡 การปรับ Scope (Feasibility)

| รายการ | v1.0 | v1.1 |
|---|---|---|
| Blockchain | Sovereign Chain ปี 2-4 | Polygon Amoy testnet → Arbitrum; sovereign เมื่อ TVL/DAU ถึงเกณฑ์ |
| Identity L2 KYC | ทำเอง | ซื้อ Sumsub/Persona API ($1–3/verify) |
| ZK Verified Human | เขียน circuit เอง | World ID / zkTLS integration ก่อน |
| AI Agent 1:1 | Fine-tune per-user | RAG memory per-device + shared open model |
| Reward Splitter | concept | ✅ `contracts/RewardSplitter.sol` deploy-ready |
| The Mountain | concept | ✅ `contracts/ProblemRegistry.sol` + `app/index.html` MVP |

## 🟢 สิ่งที่ v1.0 พูดถูก (คงไว้)

- 20/80 split — แก้ incentive misalignment ของ bounty platform ทั่วไป
- 1 Human : 1 Vote (ไม่ใช่ token-weighted)
- Privacy-first identity ladder (Shadow → Sovereign)
- Treasury 50/50 operational : direct impact

## Roadmap v1.1 (realistic)

| ไตรมาส | Deliverable | เกณฑ์ผ่าน |
|---|---|---|
| Q1 | Contracts บน Amoy + MVP app + Waitlist | 500 signups, demo video |
| Q2 | Google OAuth + Play Integrity (Lv.1 จริง), Gitcoin Grant | grant $5k+ |
| Q3 | KYC Lv.2 จริง, reward จริงบน testnet, 10 problems แก้สำเร็จ | solver ได้เงินจริง |
| Q4 | Mainnet-beta บน Arbitrum, audit contract | audit pass, 1k MAU |

---
*Nexus Architect v1.1 — "สร้างในสิ่งที่พิสูจน์ได้ แล้วค่อยขยาย"*
