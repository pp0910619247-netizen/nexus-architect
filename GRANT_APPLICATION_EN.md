# Gitcoin / Polygon CGP Grant Application — Nexus Architect

> English version for Questbook & Gitcoin submission forms.
> Thai original: `GRANT_APPLICATION.md` · Fill real links before submitting.

## Project Name
Nexus Architect

## One-liner
An open-source protocol where every human owns a private, on-device AI Twin, and the world's problems are crowdfunded on-chain with a fair 20/80 reward split.

## Category
- AI × Blockchain (Polygon AI track fit)
- Public goods / Open source
- Consumer dApp

## Problem
1. **Misaligned incentives** — bounty platforms pay only "the winner"; contributors churn and collaboration dies.
2. **Centralized AI** — today's assistants train on your private conversations to benefit someone else's model.
3. **No shared queue for world problems** — war, climate, poverty have no transparent, community-prioritized backlog anyone can work on.

## Solution
**Nexus Architect = Identity + AI Twin + The Mountain + Fair Economy**, all live on Polygon:

1. **The Mountain** — on-chain problem registry (`ProblemRegistryV2`) with community voting → top problem becomes *Mission Peak*. Human Rights Watch module enforces 67% supermajority on HR-related problems.
2. **20/80 Reward Splitter** — solver earns 20%; remaining 80% flows automatically to voters, peer reviewers, contributing AIs, and a Direct Impact Fund. Deployed, verified, tested on-chain.
3. **Digital Twin** — a personal AI that runs **100% on-device**: trained classifier (TF-IDF nearest-centroid, 21/21 tests), 3-tier long-term memory with automatic extraction & consolidation, feedback learning (👍/👎 retrains instantly), voice input/TTS. No conversations ever leave the device.
4. **Privacy-first identity ladder (L0→L4)** — Google Sign-In (GIS) + WebAuthn passkeys + wallet signature proofs + KYC-Lite with **ICAO 9303 MRZ passport support**, Thai ID checksum validation, birth/expiry checks, and **active liveness** (randomized blink+yaw challenges). Everything computed client-side; we store only SHA-256 hashes and scores.
5. **Job Market Pro** — escrowed gig marketplace (`JobBoard.sol`): employer locks NEX in escrow → worker (human or AI agent wallet) delivers → approval releases 90% to worker, **10% platform fee** to fee collector. Full dispute flow with admin/DAO arbitration.

## Why it matters
This is not another bounty board. The 20/80 split means every participant — voter, reviewer, losing AI, impact fund — gets paid. It turns "solving problems" into a positive-sum economy instead of a zero-sum contest.

## Traction (all verifiable)
- ✅ Contracts live on Polygon Amoy testnet: ProblemRegistry `0x5dDA958680e4Cf99200906bF7F357310D51F9157`, RewardSplitter `0x97fb5CEada36C721a4b82BF6a6ddFa565AC79ecF`
- ✅ Production PWA deployed (offline shell, installable): https://pp0910619247-netizen.github.io/nexus-architect/
- ✅ Test suites: contracts 11/11 · AI classifier 21/21 · long-term memory 7/7
- ✅ Tokenomics redesign validated by simulation (`tools/tokenomics_sim.py`) — we found and fixed a fatal flaw in our own v1.0 design (time-based halving dies in ~48 seconds) and replaced it with solution-mined halving + tail floor
- ✅ Whitepaper v1.0 + evidence-based v1.1 changelog published in-repo
- 🎯 Waitlist live (Genesis cohort target: 500)

## What the grant funds (3-month scope)
| Item | Amount | Detail |
|---|---|---|
| Dev time (1 part-time dev) | $4,000 | Sumsub-style regulated KYC integration, presale/vesting contracts, reward engine hardening |
| Design & content | $1,000 | Demo video, i18n docs, community kit |
| Infrastructure | $500 | Hosting, RPC, KYC API fees (~$1–3/verify × 100 users) |
| Audit prep | $1,500 | Slither/aderyn CI, test expansion, audit checklist execution |
| **Total requested** | **$7,000 ≈ 22,000 POL** | |

## Milestones
| # | Deliverable | Verification | Timeline |
|---|---|---|---|
| M1 | Regulated KYC provider integrated + waitlist 250+ | app release + waitlist analytics | month 1 |
| M2 | First real 20/80 reward distribution for a solved problem | on-chain tx on Amoy | month 2 |
| M3 | 10 problems solved end-to-end via Job Market escrow | public dashboard + tx history | month 3 |

## Team
- **The Architect** — product & protocol design, author of whitepaper v1.0/v1.1, solo builder of current MVP
- Recruiting (grant-funded): 1 Solidity/AI engineer (part-time), 1 community manager (Thai/EN)

## Links
- Repo (full source, MIT + CC BY-SA 4.0): https://github.com/pp0910619247-netizen/nexus-architect
- Live demo: https://pp0910619247-netizen.github.io/nexus-architect/
- Waitlist: https://pp0910619247-netizen.github.io/nexus-architect/waitlist.html
- Whitepapers: `WHITEPAPER_v1.0_GENESIS.md`, `WHITEPAPER_v1.1_CHANGELOG.md`
- Audit readiness checklist: `AUDIT_CHECKLIST.md`

## Prior funding
None — this would be our first grant.

## Long-term plan
Testnet → external audit → Arbitrum/Polygon mainnet-beta → regulated ICO via licensed portal where required by jurisdiction (e.g., Thai SEC-approved ICO portal) → sovereign chain at scale.

---

*"Build what you can prove — then expand." — Nexus Architect v1.1*
