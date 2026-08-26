import fs from 'node:fs';
const p = 'app/index.html';
let s = fs.readFileSync(p, 'utf8');
let n = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log('MISS:', a.slice(0, 50)); process.exit(1); } s = s.replace(a, b); n++; };

// 1) Hero/profile section → ย้ายไปหน้า Hub (more) และไม่ on ค่าเริ่ม
rep('<section class="pg on" data-p="home">', '<section class="pg" data-p="more">');

// 2) Chat section → เปิดแอปเจอทันที
rep('<section class="pg" data-p="chat">', '<section class="pg on" data-p="chat">');

// 3) Tabbar ใหม่: Chat ตัวแรก · ไม่มี Home · More สุดท้าย
const oldTabs = s.slice(s.indexOf('<nav id="tabbar">'), s.indexOf('</nav>') + 6);
const newTabs = `<nav id="tabbar">
  <button data-p="chat" class="on" onclick="go('chat')"><span class="ic">💬</span>Twin</button>
  <button data-p="presale" onclick="go('presale')"><span class="ic">🚀</span>Sale</button>
  <button data-p="mountain" onclick="go('mountain')"><span class="ic">🏔️</span>Peak</button>
  <button data-p="jobs" onclick="go('jobs')"><span class="ic">💼</span>Jobs</button>
  <button data-p="more" onclick="go('more')"><span class="ic">🧩</span>Hub</button>
</nav>`;
s = s.replace(oldTabs, newTabs); n++;

// 4) router default → chat
rep("if(pg==='home') try{renderHome()}catch(e){}", "if(pg==='more') try{renderHome()}catch(e){}");

// 5) Whitepapers ลิงก์ไว้บนหน้า Hub
rep('<!-- ═══ GOVERNANCE', `<!-- ═══ GOVERNANCE ═══ -->
<div class="card" style="margin-top:14px">
  <h3>📄 Whitepapers</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
    <a class="ghost" style="text-decoration:none;padding:8px 12px;border-radius:9px;border:1px solid var(--line);font-size:12px" target="_blank" rel="noopener"
       href="https://github.com/pp0910619247-netizen/nexus-architect/blob/main/WHITEPAPER_v1.0_GENESIS.md">📜 WP v1.0 Genesis</a>
    <a class="ghost" style="text-decoration:none;padding:8px 12px;border-radius:9px;border:1px solid var(--line);font-size:12px" target="_blank" rel="noopener"
       href="https://github.com/pp0910619247-netizen/nexus-architect/blob/main/WHITEPAPER_v1.1_CHANGELOG.md">🧪 WP v1.1 Changelog</a>
  </div>
</div>
<!-- ═══ GOVERNANCE ═══ -->`);

fs.writeFileSync(p, s);
console.log('v6.3 layout applied · patches:', n);
