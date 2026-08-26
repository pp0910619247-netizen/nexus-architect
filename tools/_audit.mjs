import fs from 'node:fs';
const s = fs.readFileSync('app/index.html', 'utf8');
const lines = s.split('\n');
let issues = [];

// 1) replacement char / mojibake markers
lines.forEach((l, i) => {
  if (l.includes('\uFFFD')) issues.push(`L${i + 1}: U+FFFD replacement char`);
  if (/โ€|เธ|เธ/.test(l)) issues.push(`L${i + 1}: legacy mojibake pattern`);
});

// 2) duplicate function declarations in inline script
const m = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/i.exec(s);
const js = m ? m[1] : '';
const fns = [...js.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(x => x[1]);
const dup = fns.filter((f, i) => fns.indexOf(f) !== i);
if (dup.length) issues.push('Duplicate functions: ' + [...new Set(dup)].join(', '));

// 3) every getElementById target must exist as id= in html
for (const id of new Set([...js.matchAll(/getElementById\('([^']+)'\)/g)].map(x => x[1]))) {
  if (!s.includes(`id="${id}"`)) issues.push(`MISSING element id="${id}"`);
}

// 4) key feature flags
const need = {
  CSP: 'Content-Security-Policy', SW: "serviceWorker", tabbar: 'id="tabbar"',
  router: 'function go(pg)', dual: 'buyWithUSDT', lite: 'nx_lite',
  quantum: '_amplitudes', persona: 'twin-persona.md', kb: 'kb-nexus.json',
  netSel: 'id="netSel"', mainnet: 'Polygon Mainnet',
};
for (const [k, v] of Object.entries(need))
  if (!s.includes(v)) issues.push('FEATURE MISSING: ' + k);

console.log(issues.length ? issues.join('\n') : 'ALL CHECKS PASS ✅');
process.exit(issues.length ? 1 : 0);
