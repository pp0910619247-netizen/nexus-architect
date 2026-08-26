import fs from 'node:fs';
const s = fs.readFileSync('app/index.html', 'utf8');
console.log('thai:', s.includes('ภูเขา'), '· tabbar:', s.includes('id="tabbar"'), '· pg sections:', (s.match(/class="pg/g) || []).length);
const m = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/i.exec(s);
try { new Function(m[1]); console.log('inline JS OK'); }
catch (e) { console.log('JS ERR:', e.message); process.exit(1); }
