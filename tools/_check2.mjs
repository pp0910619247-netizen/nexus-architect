import fs from 'node:fs';
const s = fs.readFileSync('app/index.html', 'utf8');
console.log('thai:', s.includes('ภูเขา'), '· tabbar:', s.includes('id="tabbar"'), '· router go():', s.includes('function go(pg)'));
const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
let m, arr = [];
while ((m = re.exec(s))) arr.push(m);
console.log('inline blocks:', arr.length);
let bad = 0;
arr.forEach((b, i) => {
  try { new Function(b[1]); console.log('  #' + i, 'OK len', b[1].length); }
  catch (e) { bad++; console.log('  #' + i, 'ERR:', e.message); }
});
process.exit(bad ? 1 : 0);
