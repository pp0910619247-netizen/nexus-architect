import fs from 'node:fs';
const p = 'app/index.html';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes("NexusBrain.liteMode()")) {
  const anchor = 'window.renderChatSafe = ';
  s = s.replace(anchor,
    "try{ if(NexusBrain.liteMode()){ const b=document.getElementById('liteBtn'); if(b) b.style.borderColor='var(--good)'; } }catch(e){}\n" + anchor);
  fs.writeFileSync(p, s);
  console.log('lite init patched');
} else console.log('already');
