# Gitcoin Grant Application — Nexus Architect

> แพ็กเกจสมัคร Gitcoin Grants (Web3 Community / Open Source track)
> สถานะ: DRAFT v1.0 — เติมชื่อ/ลิงก์จริงก่อน submit

## Project Name
Nexus Architect

## One-liner
Open-source protocol where every human owns a private, on-device AI Twin and the world's problems are crowdfunded on-chain with a fair 20/80 reward split.

## Problem
- Bounty platforms pay only "the winner" → contributors churn, incentives misaligned
- AI assistants are centralized: your conversations train someone else's model
- World problems lack a transparent, community-prioritized queue

## Solution
1. **The Mountain** — on-chain problem registry with community voting (Mission Peak) — live on Polygon Amoy (`ProblemRegistryV2`, verified)
2. **20/80 Reward Splitter** — solver gets 20%, 80% flows to voters/reviewers/AI-contributors/Impact Fund — deployed & tested (`RewardSplitter.sol`, 11/11 tests incl. JobBoard escrow)
3. **Digital Twin** — 100% on-device brain (trained classifier + TF-IDF, 3-tier long-term memory with auto-extraction & consolidation). No data leaves the device.
4. **Privacy-first identity ladder L0→L4** — Passkey/WebAuthn, wallet signature proof, KYC-Lite with ICAO 9303 MRZ support + active liveness (blink+yaw), all computed client-side; we store only SHA-256 hashes.

## Traction (verifiable)
- ✅ Contracts live on Polygon Amoy testnet (registry + splitter + NEX token + JobBoard escrow)
- ✅ Working PWA MVP (installable, offline shell, Thai/English)
- ✅ Test suite: contracts 11/11 · AI classifier 21/21 · memory 7/7
- ✅ Tokenomics redesign validated by simulation (`tools/tokenomics_sim.py`) — fixed the halving-every-block design flaw from WP v1.0
- 🎯 Waitlist target: 500 signups (Genesis cohort)

## What the grant funds (budget for 3 months)
| Item | Amount | Detail |
|---|---|---|
| Dev time (1 part-time dev) | $4,000 | OAuth Lv.1 completion, Sumsub KYC integration, reward engine on testnet |
| Design & content | $1,000 | Demo video, docs i18n, community kit |
| Infrastructure | $500 | Netlify hosting, RPC endpoints, KYC API fees (~$1–3/verify × 100 users) |
| Audit prep | $1,500 | Static analysis (Slither), test expansion, audit checklist execution |
| **Total** | **$7,000** | |

## Milestones
1. M1 (month 1): Google OAuth Lv.1 real + waitlist 250+ — *verifiable: app release + analytics*
2. M2 (month 2): First real reward distribution to a solved problem on Amoy — *on-chain tx*
3. M3 (month 3): KYC Lv.2 via provider + 10 problems solved end-to-end — *dashboard*

## Team
- The Architect (product/protocol) — author of whitepaper v1.0/v1.1
- Blockchain developer (contract work, deploy kits)
- Community manager (Thai/EN)

## Links
- Repo: `<github-url>`
- Live demo: `<netlify-url>` (waitlist + MVP)
- Whitepaper v1.0 + v1.1 changelog: repo root
- Contract addresses (Amoy): see `app/index.html` On-Chain section

## Match funding / prior grants
None yet — this would be our first public-goods grant.

## Open-source license
MIT (code) + CC BY-SA 4.0 (docs)
