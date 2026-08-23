# Nexus Architect — Starter Kit (ฉบับทำได้จริง)

เอกสารนี้แปลง whitepaper v1.0 ให้เป็นชิ้นงานที่ build ได้วันนี้
พร้อมความเห็นตรงๆ ว่าส่วนไหน feasible / ส่วนไหนต้องแก้ design

## โครงสร้าง

```
nexus-architect/
├── README.md                  ← ไฟล์นี้ (feasibility + แผนจริง)
├── contracts/
│   ├── ProblemRegistry.sol    ← กระดานปัญหาบน chain (Mountain MVP)
│   └── RewardSplitter.sol     ← แบ่งรางวัล 20/80 อัตโนมัติ
└── tools/
    └── tokenomics_sim.py      ← จำลอง Variable Decay — เจอบั๊กดีไซน์ใหญ่!
```

## ⚠️ สิ่งที่ต้องแก้ก่อนอย่างอื่น: Variable Decay มีปัญหา

Whitepaper กำหนด "Genesis phase: halve **ทุก block (~10 วินาที)**"
→ รางวัล = 0 ภายใน ~5 นาที ดู `tools/tokenomics_sim.py` สำหรับตัวเลขจริง
**ข้อเสนอ:** halving ตาม "ปริมาณการแก้ปัญหาสะสม" (solutions mined) ไม่ใช่เวลา

## Feasibility Matrix (ตรงไปตรงมา)

| ฟีเจอร์ใน Whitepaper | สถานะจริง | ทางที่เป็นไปได้ |
|---|---|---|
| Mountain board (โพสต์+โหวต) | ✅ ทำได้เดือนเดียว | Web app + contract ด้านล่าง |
| Reward Splitter 20/80 | ✅ Solidity ธรรมดา | `contracts/RewardSplitter.sol` |
| Level 0–1 Identity (Google/Device) | ✅ มาตรฐาน | Google OAuth + Play Integrity |
| Level 2 KYC + Selfie liveness | ✅ ซื้อบริการได้ | Sumsub / Onfido / Persona (~$1-3/คน) |
| ZK Proof "Verified Human" | ⚠️ ซับซ้อน | ใช้ World ID / zkTLS แทนการเขียน circuit เอง |
| Level 3 Bank API + ZK | ⚠️ ยาก | เริ่มด้วย NDID (TH) ไม่ต้อง custom ZK ก่อน |
| AI Agent on-device 1:1 | ⚠️ ครึ่งจริง | Fine-tune open model (Llama/Qwen) ต่อ user = แพงมาก; MVP = RAG memory ต่อ device |
| "AI ไม่ pretrained, เรียนจากเจ้าของเท่านั้น" | ❌ ไม่ realistic | LLM ที่ไม่ pretrained ไม่ฉลาดพอ; เปลี่ยน pitch เป็น "memory ส่วนตัว 100%" |
| Anti-bot Soft Reset | ✅ ทำได้ | Heuristic + rate limit (แต่จะโดน farm ทางอื่น) |
| Sovereign Chain (Cosmos SDK) | ❌ ปี 1-2 ยังไม่ต้อง | Polygon → Arbitrum พอ; sovereign = $500k+ และทีม 6+ คน |
| VR Master World | ❌ Phase 5 ค่อยคุย | — |

## แผน 90 วันแรก (ที่วัดผลได้)

1. **สัปดาห์ 1–2:** Deploy ProblemRegistry + RewardSplitter บน Sepolia/Polygon Amoy (testnet)
2. **สัปดาห์ 3–6:** MVP web: Google Sign-In → โพสต์/โหวตปัญหา → อ่านจาก contract
3. **สัปดาห์ 7–10:** Reward simulation จริง (testnet token) + Waitlist
4. **สัปดาห์ 11–13:** Gitcoin Grant application (มี demo แล้วโอกาสสูงขึ้นมาก)
