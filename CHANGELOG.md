# Changelog — Nexus Architect

รูปแบบอิง Keep a Changelog · เวอร์ชันตาม milestone จริงของ repo

## [v2.5] — Architect Edition — 2026-08-26
### Added
- **Brain distillation**: `twin-persona.md` (persona card) + `kb-nexus.json` (12 verified facts)
  → auto-loaded into Neural system prompt & Local KB
- Neural multi-turn context (8 turns) + **token streaming UI** + persona few-shot
- Model catalog: Fast 0.5B / Smart 1.5B / Llama-1B / Big 3B / BitNet-1.58 (exp) · WebGPU auto · fallback chain
- LAUNCH_KIT.md: press release, demo script, deck outline, DM templates, Genesis onboarding sequence
- LICENSE (MIT), SECURITY.md, this CHANGELOG

### Fixed
- XSS hardening: chat feedback buttons → index-based lookup (no text in inline handlers)

## [v2.4] — 2026-08-26
### Added
- Brain v5.1 Hardcore Training: bagged ensemble ×5 + guarded self-healing (monotonic improvement)
- Token Allocation executed on-chain: 1B supply · Mining 300M linear48 · Founder 200M cliff12mo
- `TokenVesting.sol` (+5 tests) · `deploy-allocation.js` · TOKENOMICS.md

## [v2.3] — 2026-08-26
### Added
- JobBoard deployed (`0xD6CA…358A`, fee 10% → feeCollector) + wired as defaults
- Presale live on Amoy (`0x8b6E…0e24`) + UI card (round table/progress/estimate/buy)
### Fixed
- ethers v6 signer flow for contract writes; role checks in market actions

## [v2.2] — 2026-08-25
### Added
- Mountain midnight culling (>10 votes or vanish): countdown, graveyard view, peak excludes culled
- Waitlist page (Netlify Forms + local fallback), donation block
- Google OAuth Lv.1 via GIS (default Client ID baked) + CSP/frame-src updates
### Changed
- KYC popup: birth/expiry validation + MRZ passport path + liveness flags stored

## [v2.1] — 2026-08-25
### Added
- KYC v2.0 international: ICAO 9303 MRZ verifier, ID birth/expiry checks,
  active liveness (blink EAR + yaw challenge), quality gates, single-face rejection
- Brain v3→v5 line: TF-IDF classifier, MoE-lite ranked gating + expert arbitration,
  trust chain (KB→Wikipedia→DuckDuckGo), emotion engine, small-talk layer,
  hardcore local training (bagged ensemble ×5 + self-heal), Neural Mode (transformers.js)
### Fixed
- idHash stored as real SHA-256 (was Promise object)
- price intent rule (btc เท่าไหร่ → price) — test suite green

## [v2.0] — 2026-08-24
### Added
- ProblemRegistryV2 on Amoy + RewardSplitter wiring + admin panel
- DAO governance 67% + HRW module + AI lifecycle + anti-bot soft reset (nexus-gov.js)
- Digital Twin chat + LTM v1 (semantic/episodic + auto-extract + consolidation)
- KYC-Lite v1 (Thai ID checksum + face scan) + Passkey/WebAuthn + wallet proofs
- PWA shell (manifest/SW/icons), Netlify headers, Play Store kit, investor one-pager
- NEX token + JobBoard contracts (+tests), deploy kits (amoy/arbitrum/bsc)
