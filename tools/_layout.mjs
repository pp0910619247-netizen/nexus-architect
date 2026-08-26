import fs from 'node:fs';
const p = 'app/index.html';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('id="tabbar"')) { console.log('already applied'); process.exit(0); }
let patch = 0;
const rep = (anchor, insert) => {
  if (!s.includes(anchor)) { console.log('MISS:', anchor.slice(0, 50)); process.exit(1); }
  s = s.replace(anchor, insert); patch++;
};

/* ── 1) HOME section ── */
rep('<main>', `<main>
<section class="pg on" data-p="home">
  <div class="hero">
    <div class="hero-ava">🐉</div>
    <div style="flex:1">
      <div class="muted" style="font-size:11px;letter-spacing:.5px">NEXUS ARCHITECT</div>
      <div id="homeGreet" style="font-weight:800;font-size:17px">Hello Hunter 👋</div>
    </div>
    <button class="ghost" style="padding:6px 10px;font-size:11px" onclick="go('more')">⚙️</button>
  </div>
  <div class="bal" id="homeBal">🔗 Connect Wallet เพื่อดูยอดและซื้อ NEX</div>
  <div class="qgrid">
    <button onclick="go('presale')"><span class="ic">🚀</span><span>Buy NEX</span></button>
    <button onclick="go('jobs')"><span class="ic">💼</span><span>Jobs</span></button>
    <button onclick="go('mountain')"><span class="ic">🏔️</span><span>Mountain</span></button>
    <button onclick="go('chat')"><span class="ic">💬</span><span>Twin AI</span></button>
  </div>
</section>`);

/* ── 2) section boundaries ── */
rep('<!-- ══ MOUNTAIN ══ -->', '</section>\n<section class="pg" data-p="mountain">\n<!-- ══ MOUNTAIN ══ -->');
rep('<!-- ══ ECONOMY ══ -->', '</section>\n<section class="pg" data-p="presale">\n<!-- ══ ECONOMY ══ -->');
rep('<!-- ══ DIGITAL TWIN CHAT ══ -->', '</section>\n<section class="pg" data-p="chat">\n<!-- ══ DIGITAL TWIN CHAT ══ -->');
rep('<!-- ══ ON-CHAIN ══ -->', '</section>\n<section class="pg" data-p="more">\n<!-- ══ ON-CHAIN ══ -->');
rep('<!-- ══ JOB MARKET PRO', '</section>\n<section class="pg" data-p="jobs">\n<!-- ══ JOB MARKET PRO');
rep('<!-- ══ PRESALE', '</section>\n<section class="pg" data-p="presale">\n<!-- ══ PRESALE');
rep('<!-- ═══ GOVERNANCE', '</section>\n<section class="pg" data-p="more">\n<!-- ═══ GOVERNANCE');
rep('<footer>', '</section>\n<footer>');

/* ── 3) MODERN CSS ── */
const CSS = `
/* ───────── APP SHELL v6.2 · MODERN MOBILE ───────── */
.pg{display:none}
.pg.on{display:block;animation:pgIn .22s ease-out}
@keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.hero{display:flex;gap:12px;align-items:center;border-radius:20px;padding:16px;margin-bottom:14px;
  background:radial-gradient(120% 140% at 0% 0%, #1b2540 0%, #0e1424 55%, #0a0f1c 100%);border:1px solid var(--line);
  box-shadow:0 10px 30px -12px rgba(245,158,11,.15)}
.hero-ava{width:54px;height:54px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;
  background:linear-gradient(135deg,var(--acc),#d97706);box-shadow:0 6px 18px -6px rgba(245,158,11,.6)}

.qgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}
.qgrid button{background:linear-gradient(180deg,var(--panel),#0f1626);border:1px solid var(--line);border-radius:16px;
  padding:13px 4px 10px;color:var(--txt);transition:transform .08s,border-color .15s}
.qgrid button:active{transform:scale(.94)}
.qgrid button .ic{display:block;font-size:22px;margin-bottom:4px}
.qgrid button span:last-child{font-size:10px;color:var(--dim)}

.bal{background:linear-gradient(135deg,#13203a,#0d1526);border:1px solid #24406b;border-radius:14px;
  padding:12px 15px;font-size:13px;color:#bcd3ff;margin-bottom:14px}

#tabbar{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;
  background:rgba(10,14,23,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border-top:1px solid rgba(255,255,255,.07);padding-bottom:env(safe-area-inset-bottom)}
#tabbar button{flex:1;background:none;border:0;color:#7d8ba5;font-size:10px;padding:8px 0 10px;position:relative}
#tabbar button .ic{display:block;font-size:21px;margin-bottom:2px;filter:grayscale(.6);transition:.15s}
#tabbar button.on{color:var(--acc)}
#tabbar button.on .ic{filter:none;transform:translateY(-1px)}
#tabbar button.on::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:26px;height:3px;border-radius:0 0 4px 4px;background:var(--acc)}

@media(max-width:900px){
  main{padding:12px 12px 92px}
  header{position:sticky;top:0;z-index:55;background:rgba(10,14,23,.9);backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line);padding:10px 12px}
  .logo{font-size:17px}.tag{display:none}
  [data-p="chat"] #chatBox{height:calc(100vh - 315px)!important;max-height:none!important}
  #micBtn{width:48px;height:48px;border-radius:50%;background:var(--acc);color:#111;border:none;font-size:20px;flex:none}
  .card{border-radius:16px}
}
@media(min-width:901px){ #tabbar{display:none} .pg{display:block!important} }`;
s = s.replace('</style>', CSS + '\n</style>'); patch++;

/* ── 4) TABBAR + ROUTER ── */
const CLOSE = '</scr' + 'ipt>';
const NAV = `
<nav id="tabbar">
  <button data-p="home" class="on" onclick="go('home')"><span class="ic">🏠</span>Home</button>
  <button data-p="chat" onclick="go('chat')"><span class="ic">💬</span>Twin</button>
  <button data-p="mountain" onclick="go('mountain')"><span class="ic">🏔️</span>Peak</button>
  <button data-p="presale" onclick="go('presale')"><span class="ic">🚀</span>Sale</button>
  <button data-p="jobs" onclick="go('jobs')"><span class="ic">💼</span>Jobs</button>
  <button data-p="more" onclick="go('more')"><span class="ic">⋯</span>More</button>
</nav>
<script>
function _setPg(pg){
  document.querySelectorAll('.pg').forEach(el=>{
    const on = el.dataset.p===pg;
    if(window.innerWidth<=900) el.classList.toggle('on',on);
    else el.classList.add('on');
  });
  document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on', b.dataset.p===pg));
  window.scrollTo({top:0});
}
function go(pg){
  _setPg(pg);
  if(pg==='jobs') try{jobRefresh()}catch(e){}
  if(pg==='presale') try{renderPresale()}catch(e){}
  if(pg==='home') try{renderHome()}catch(e){}
}
function renderHome(){
  const g=document.getElementById('homeGreet'); if(!g) return;
  const h=new Date().getHours();
  const t=h<12?'สวัสดียามเช้า':h<18?'สวัสดียามบ่าย':'สวัสดียามค่ำ';
  g.textContent=t+' — '+(window.Twin?.cfg?.name||'Hunter');
  const lm=(window.Twin?.mem?.chat||[]).filter(m=>m.role==='twin').slice(-1)[0];
  document.getElementById('homeLast').textContent =
    lm ? ('“'+String(lm.text).replace(/\\n/g,' ').slice(0,70)+'…”') : 'เริ่มคุยกับ Twin ของคุณได้เลย';
  (async()=>{ try{
    const el=document.getElementById('homeBal'); if(!el) return;
    if(!window._myAddr){ el.innerHTML='🔗 Connect Wallet เพื่อดูยอดและซื้อ NEX'; return; }
    const prov=new ethers.JsonRpcProvider(NET().rpc);
    const pol=Number(ethers.formatEther(await prov.getBalance(window._myAddr))).toFixed(3);
    let nx='—';
    if(nexToken()){
      const c=new ethers.Contract(nexToken(),['function balanceOf(address) view returns (uint256)'],prov);
      nx=Number(ethers.formatEther(await c.balanceOf(window._myAddr))).toLocaleString(undefined,{maximumFractionDigits:2});
    }
    el.innerHTML='💰 '+pol+' '+(PS_SYM_BY_CHAIN[Number(NET().chainId)]||'POL')+' &nbsp;·&nbsp; ⚡ '+nx+' NEX';
  }catch(e){} })();
}
window.addEventListener('resize',()=>{ if(window.innerWidth>900){document.querySelectorAll('.pg').forEach(el=>el.classList.add('on'));} });
${CLOSE}`;
s = s.replace('</body>', NAV + '\n</body>'); patch++;

fs.writeFileSync(p, s);
console.log('layout applied · patches:', patch);
