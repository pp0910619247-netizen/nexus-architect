# Smart Contract Audit Checklist (Q4 gate)

> ก่อน mainnet-beta ต้องผ่านครบทุกข้อ + external audit โดย firm
> Scope: `contracts/contracts_sol/*` (ProblemRegistry, RewardSplitter, NEXToken, JobBoard)

## 1. Static analysis
- [ ] `npx hardhat test` — 11/11 ผ่าน (รันก่อนทุก commit)
- [ ] Slither: `pip install slither-analyzer; slither contracts_sol/` — 0 critical/high
- [ ] Aderyn / semgrep-eth — 0 high

## 2. Reentrancy & call safety
- [ ] JobBoard escrow: ทุก external call ใช้ Checks-Effects-Interactions
- [ ] `nonReentrant` guard ที่ withdraw/release/dispute paths
- [ ] ไม่มี call ไป untrusted address โดยไม่ limit gas

## 3. Access control
- [ ] เฉพาะ deployer แก้ fee/treasury params (Ownable หรือ role-based)
- [ ] ไม่มี function public ที่ mint ฟรี
- [ ] Transfer ownership 2-step (propose → accept)

## 4. Arithmetic
- [ ] Solidity 0.8.x built-in overflow check ใช้ครบ (ไม่มี unchecked block ที่ไม่จำเป็น)
- [ ] Fee calculation: round-down สำหรับ protocol, ผู้ใช้ไม่โดนหักเกิน 10%
- [ ] Edge: points = 0, total = 0, address(0), self-transfer

## 5. Tokenomics invariants
- [ ] RewardSplitter: solver 20% + pool 80% ≡ total (ไม่มี dust หาย)
- [ ] Tail floor emission ไม่ติดลบ/ไม่ล้น uint256
- [ ] Halving milestone เปลี่ยนได้เฉพาะ DAO vote 67%

## 6. Frontend ↔ contract
- [ ] ABI ทุกอัน match deployed bytecode (verify บน explorer)
- [ ] ไม่ hardcode private key ทุกกรณี (grep repo)
- [ ] CSP ปัจจุบัน + rate-limit client-side ยังผ่าน (`_headers`)

## 7. Process
- [ ] Freeze code → tag release candidate
- [ ] External audit (Summit/Lightclient/Hats ฯลฯ) budget ~$8–15k
- [ ] Fix findings → re-test → audit sign-off
- [ ] Bug bounty program ประกาศพร้อม launch

---
*Self-audit ไม่ใช่ audit — checklist นี้เป็นการ "เตรียม" เท่านั้น*
