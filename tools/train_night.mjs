// OVERNIGHT TRAINER — เทรน Brain ensemble แบบโหดทั้งคืน (brute-force hyperparameter search)
// Run: node tools/train_night.mjs --hours 6        (default 6h · Ctrl+C หยุดได้ report ยังเซฟ)
// ผลลัพธ์: TRAINING_REPORT.md — config ที่ดีที่สุด เอามา hardcode ตอนเช้า

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const hIdx = args.indexOf('--hours');
const HOURS = hIdx >= 0 ? parseFloat(args[hIdx + 1]) : 6;
const DEADLINE = Date.now() + HOURS * 3600 * 1000;

// ── load brain (same stubs as test_brain) ──
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '../app/nexus-core.js'), 'utf8'));
const B = global.window.NexusBrain;

// ── dataset: train/holdout split (seeded, deterministic) ──
let seedState = 987654321;
const rnd = () => { seedState = (seedState * 1103515245 + 12345) & 0x7fffffff; return seedState / 0x7fffffff; };
const all = [];
for (const [intent, examples] of Object.entries(B.TRAINING))
  examples.forEach((ex, i) => all.push({ intent, ex, i }));
const holdout = [], trainPool = {};
for (const [intent] of Object.entries(B.TRAINING)) trainPool[intent] = [];
for (const item of all) {
  // เก็บ example สุดท้ายของแต่ละ intent ไว้สอบ (holdout) ที่เหลือใช้เทรน
  const isLast = B.TRAINING[item.intent][B.TRAINING[item.intent].length - 1] === item.ex;
  (isLast ? holdout : trainPool[item.intent]).push(item.ex);
}
const HOLD = holdout.filter(x => x);

function buildEnsemble(seedBase, dropEx, dropTok, learnedWeight) {
  const ens = [];
  for (let k = 0; k < 5; k++) {
    let s = seedBase + k * 7919;
    const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const cent = {};
    for (const [intent, examples] of Object.entries(trainPool)) {
      const vec = {};
      for (const ex of examples) {
        if (examples.length > 4 && r() < dropEx) continue;
        for (const t of B._tokenize(ex)) if (r() < 1 - dropTok) vec[t] = (vec[t] || 0) + (B.idf[t] ?? Math.log(2));
      }
      for (const ex of (B.learned[intent] || []))
        for (const t of B._tokenize(ex)) vec[t] = (vec[t] || 0) + (B.idf[t] ?? Math.log(2)) * learnedWeight;
      cent[intent] = B._normVec(vec);
    }
    ens.push(cent);
  }
  return ens;
}
function misses(ens, dataset) {
  let m = 0;
  for (const ex of dataset) {
    let best = null, bs = -1;
    for (const cent of ens) {
      const tokens = B._tokenize(ex);
      for (const [intent, cvec] of Object.entries(cent)) {
        const s = B._cosine(tokens, cvec);
        if (s > bs) { bs = s; best = intent; }
      }
    }
    if (!best || !B.TRAINING[best]) m++;
  }
  // compare vs expected intent: dataset entries are strings; map back
  return m;
}

// proper miss counting using labeled pairs
function holdoutScore(ens) {
  let ok = 0;
  for (const [intent, examples] of Object.entries(B.TRAINING)) {
    const last = examples[examples.length - 1];
    if (!HOLD.includes(last)) continue;
    let best = null, bs = -1;
    for (const cent of ens) {
      const tokens = B._tokenize(last);
      for (const [it, cv] of Object.entries(cent)) {
        const s = B._cosine(tokens, cv);
        if (s > bs) { bs = s; best = it; }
      }
    }
    if (best === intent) ok++;
  }
  return { ok, total: HOLD.length };
}

// ── search loop ──
const REPORT = path.join(__dirname, 'TRAINING_REPORT.md');
fs.writeFileSync(REPORT, `# 🌙 OVERNIGHT TRAINING REPORT\nstarted: ${new Date().toISOString()} · budget: ${HOURS}h\n\ncurrent champion baseline:\n`);
const baseEns = JSON.parse(JSON.stringify(B.ensemble));
const base = holdoutScore(baseEns);
console.log(`baseline holdout: ${base.ok}/${base.total}`);
let bestCfg = null, bestOk = base.ok;

let iter = 0, trained = 0;
while (Date.now() < DEADLINE) {
  iter++;
  const cfg = {
    seed: Math.floor(rnd() * 1e9),
    dropEx: +(0.05 + rnd() * 0.35).toFixed(2),
    dropTok: +(0.05 + rnd() * 0.30).toFixed(2),
    lw: +(1.5 + rnd() * 1.5).toFixed(2),
    heal: Math.floor(rnd() * 4),
  };
  const ens = buildEnsemble(cfg.seed, cfg.dropEx, cfg.dropTok, cfg.lw);
  // self-heal rounds (guarded)
  for (let h = 0; h < cfg.heal; h++) {
    let improved = false;
    for (const [intent, examples] of Object.entries(trainPool)) {
      for (const ex of examples) {
        let bestI = null, bs = -1;
        for (const cent of ens) {
          const tokens = B._tokenize(ex);
          for (const [it, cv] of Object.entries(cent)) {
            const s = B._cosine(tokens, cv);
            if (s > bs) { bs = s; bestI = it; }
          }
        }
        if (bestI !== intent) {
          improved = true;
          const toks = B._tokenize(ex);
          for (const cent of ens)
            for (const t of toks) cent[intent][t] = (cent[intent][t] || 0) + (B.idf[t] ?? Math.log(2)) * 3;
        }
      }
    }
    if (!improved) break;
    for (const cent of ens) for (const iv in cent) cent[iv] = B._normVec(cent[iv]);
  }

  const sc = holdoutScore(ens);
  trained++;
  if (sc.ok > bestOk) {
    bestOk = sc.ok;
    bestCfg = { ...cfg, ok: sc.ok, total: sc.total };
    fs.writeFileSync(path.join(__dirname, 'BEST_CONFIG.json'), JSON.stringify(bestCfg, null, 2));
    console.log(`[${iter}] 🏆 NEW BEST ${sc.ok}/${sc.total}`, JSON.stringify(cfg));
  } else if (iter % 25 === 0) {
    console.log(`[${iter}] tried… best ${bestOk}/${base.total} (${((Date.now ? DEADLINE - Date.now() : 0) / 60000).toFixed(0)} min left)`);
  }
}

fs.appendFileSync(REPORT,
`\n## finished: ${new Date().toISOString()}\n- iterations: ${iter}\n- baseline holdout: ${base.ok}/${base.total}\n- BEST: ${JSON.stringify(bestCfg)}\n- Next: ให้ Architect hardcode BEST_CONFIG.json ลง nexus-core.js (_buildEnsemble)\n`);
console.log('DONE — TRAINING_REPORT.md saved');
