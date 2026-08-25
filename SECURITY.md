# Security Policy

## Reporting a Vulnerability
Email: [your-email] · หรือเปิด GitHub Security Advisory (Private)
เราตอบกลับภายใน **72 ชั่วโมง** · ขอบคุณผู้รายงานใน CHANGELOG (ถ้าต้องการ)

## Scope
- `contracts/contracts_sol/*` — smart contracts
- `app/*` — PWA frontend (XSS/CSP/key handling)
- Presale/JobBoard/Vesting flows

## Out of scope
- Testnet-only fund loss (ไม่มีมูลค่าจริง)
- Self-XSS บนอุปกรณ์ตัวเองโดยแก้ localStorage เอง
- Automated bot spam บน waitlist form

## Current security posture (honest)
- ✅ CSP strict + no eval + XSS-escape sinks
- ✅ AES-256-GCM key vault (local) · WebAuthn passkey · wallet signature proofs
- ✅ KYC on-device only (hash storage)
- ⚠️ Contracts: internal tests 28/28 + checklist — **external audit pending** (pre-mainnet gate)

## Bug bounty
หลัง mainnet-beta: bounty pool ประกาศพร้อม launch
