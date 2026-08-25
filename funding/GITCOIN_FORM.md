# GITCOIN GRANTS — Form Answers (copy-paste ready)
> Round: Web3 Community / OSS · ใช้คู่กับ GRANT_APPLICATION_EN.md
> ⚠️ เติม [brackets] ก่อน submit

## Project Name
Nexus Architect

## Project Description (short)
An open-source protocol where every human owns a private AI Twin that runs 100% on their device (memory never leaves), plus an on-chain "Mountain" where communities vote on world problems and rewards split 20/80 automatically — solvers earn 20%, voters/reviewers/AI-contributors share 80%.

## How does your project align with this round's goals?
- Public goods: open-source (MIT/CC-BY-SA), no walled garden
- AI × Blockchain done ethically: on-device inference option (browser LLM via transformers.js), privacy-first identity (on-device KYC hashing)
- Real usage today: working PWA + 9 deployed contracts on Polygon Amoy, verifiable addresses in repo

## Problem being solved
1. Bounty platforms pay winner-take-all → contributors churn
2. Centralized AI assistants harvest user data
3. No transparent, prioritized global problem queue

## Solution summary
On-chain ProblemRegistry with daily community culling (>10 votes/24h or removed), Mission Peak selection, escrowed JobBoard (90% worker / 10% platform), RewardSplitter distributing 20/80 automatically, private Digital Twin brain (TF-IDF MoE-lite classifier + optional browser-native LLM), 5-level identity ladder (Google/WebAuthn/wallet/KYC-lite MRZ+liveness all client-side).

## What makes your project unique?
- Everything is LIVE and verifiable today (contracts + PWA + test suites 28 contracts / 31 brain+memory)
- Founder tokens locked on-chain with 12-month cliff (trustless vesting contract)
- Honest posture: public SECURITY.md states external audit is still pending — we communicate testnet-only status

## Impact goals (6 months)
1. 1,000+ waitlist, 100+ active Twins
2. First real 20/80 reward distributions for solved problems
3. Thai-language community as beachhead → SEA expansion

## Budget breakdown ($7,000)
| Item | Amount |
|---|---|
| Dev time (part-time Solidity/AI) | $4,000 |
| Design/content/demo video | $1,000 |
| Infra + KYC API fees | $500 |
| Audit prep (Slither CI, fuzz tests) | $1,500 |

## Milestones
M1 (mo 1): regulated-KYC integration + 250 waitlist — verifiable via app release
M2 (mo 2): first on-chain 20/80 distribution for a solved problem — tx hash published
M3 (mo 3): 10 problems solved end-to-end via JobMarket escrow — dashboard

## Team
Solo builder ("The Architect") shipped everything above; recruiting 1 part-time engineer + 1 CM from grant funds.

## Links
Demo: https://pp0910619247-netizen.github.io/nexus-architect/
Repo: https://github.com/pp0910619247-netizen/nexus-architect
Waitlist: https://pp0910619247-netizen.github.io/nexus-architect/waitlist.html
Contracts (Amoy): see TOKENOMICS.md table

## Funding address
[polygon wallet address]

---
### AFTER SUBMISSION CHECKLIST (Gitcoin-specific)
- [ ] Verify GitHub org/repo linked & README badge
- [ ] Post project on X + tag @gitcoin — matching needs donors: rally 30+ small donations
- [ ] Prepare 60s video walkthrough (script in LAUNCH_KIT.md §2)
