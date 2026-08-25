/* ═══════════ PRESALE DUAL (USDT/POL) — rounds ═══════════ */
const PRESALE_ABI = [
  "function buyWithUSDT(uint256)",
  "function buyWithPOL(uint256) payable",
  "function quote(uint256,bool) view returns (uint256,uint8)",
  "function currentRound() view returns (uint8)",
  "function priceOfUSDT(uint8) view returns (uint256)",
  "function priceOfPOL(uint8) view returns (uint256)",
  "function perRoundCap() view returns (uint256)",
  "function roundSold(uint8) view returns (uint256)",
  "function startAt() view returns (uint256)",
  "function ROUNDS() view returns (uint256)",
];
const PS_SYM_BY_CHAIN = { 80002:'POL', 97:'tBNB', 137:'POL', 421614:'ETH' };
const PRESALE_DEFAULT = NET().presale;
function presaleAddr(){ return localStorage.getItem('nx_presale_'+g_net) || PRESALE_DEFAULT; }
function payTokenAddr(){ return localStorage.getItem('nx_pay_token_'+g_net) || NET().usdt || ''; }
function presaleReady(){ return !!(presaleAddr() && nexToken()); }
async function psContract(withSigner){
  if(withSigner){ const bp=chainSigner(); if(!bp) return null; return new ethers.Contract(presaleAddr(),PRESALE_ABI,await bp.getSigner()); }
  return new ethers.Contract(presaleAddr(),PRESALE_ABI,chainProvider());
}
function presaleConfig(){
  const p=prompt('Presale (dual) contract address:',localStorage.getItem('nx_presale_'+g_net)||PRESALE_DEFAULT);
  if(p===null) return;
  localStorage.setItem('nx_presale_'+g_net,p.trim());
  const pt=prompt('Payment token address (USDT on this network):',localStorage.getItem('nx_pay_token_'+g_net)||payTokenAddr());
  if(pt!==null) localStorage.setItem('nx_pay_token_'+g_net,pt.trim());
  toast('⚙️ Presale config saved'); renderPresale();
}

async function renderPresale(){
  const addrTxt=document.getElementById('psAddrTxt');
  document.querySelectorAll('.psSym').forEach(el=>el.textContent=PS_SYM_BY_CHAIN[Number(NET().chainId)]||'POL');
  addrTxt.textContent = presaleAddr()? presaleAddr().slice(0,10)+'… · pay:'+String(payTokenAddr()||'—').slice(0,10)+'…' : 'ยังไม่ตั้งค่า presale/pay-token';
  const stats=document.getElementById('psStats'), bar=document.getElementById('psBar'),
        prog=document.getElementById('psProgress'), est=document.getElementById('psEstimate');
  if(!presaleReady()){ stats.innerHTML=''; bar.style.width='0%'; prog.textContent=''; est.textContent=''; return; }
  try{
    const c=await psContract(false);
    const rounds=Number(await c.ROUNDS());
    let cur=Number(await c.currentRound());
    const cap=Number(await c.perRoundCap());
    const pol=true;
    const [qCost]=await c.quote(ethers.parseEther("1"),pol);
    const pNow=Number(ethers.formatEther(qCost));
    let soldNEX=0;
    const rows=[`<tr><th>รอบ</th><th style="text-align:right">USDT/NEX</th><th style="text-align:right">${PS_SYM_BY_CHAIN[Number(NET().chainId)]||'POL'}/NEX</th><th>สถานะ</th></tr>`];
    for(let i=0;i<rounds;i++){
      const pu=Number(ethers.formatUnits(await c.priceOfUSDT(i),6));
      const pp=Number(ethers.formatEther(await c.priceOfPOL(i)));
      const s=Number(await c.roundSold(i));
      soldNEX+=s;
      rows.push(`<tr><td>${i+1}</td><td class="num">${pu.toFixed(4)}</td><td class="num">${pp.toFixed(6)}</td><td class="num">${i<cur?'✅ เต็ม':i===cur?'🔥 กำลังขาย':'⏳ ถัดไป'}</td></tr>`);
    }
    stats.innerHTML=rows.join('');
    bar.style.width=Math.min(100,(soldNEX/(cap*rounds))*100)+'%';
    prog.textContent=`🔥 Round ${cur+1}/${rounds} · ขายแล้ว ${Math.floor(soldNEX/1e18).toLocaleString()} / ${(cap*rounds/1e18).toLocaleString()} NEX`;
    estimateOut();
  }catch(e){
    stats.innerHTML=`<tr><td class="neg">${esc(String(e.message||e).slice(0,80))}</td></tr>`;
    if(String(e).includes('SoldOut')){ prog.textContent='🏁 Presale ปิดแล้ว — ขายหมดทุกรอบ!'; bar.style.width='100%'; }
  }
}
function estimateOut(){
  const nex=parseFloat(document.getElementById('psAmount').value)||0;
  const est=document.getElementById('psEstimate');
  if(nex<=0||!presaleReady()){ est.textContent=''; return; }
  psContract(false).then(async c=>{
    try{
      const pol=(document.getElementById('psPay').value==='POL');
      const cost=BigInt((await c.quote(ethers.parseEther(String(nex)),pol))[0]);
      const sym=pol?(PS_SYM_BY_CHAIN[Number(NET().chainId)]||'POL'):'USDT';
      const dec=sym==='USDT'?6:18;
      const fmt=Number(cost)/10**dec;
      est.textContent=`≈ จ่าย ${fmt.toLocaleString(undefined,{maximumFractionDigits:dec===6?2:6})} ${sym} @ราคาปัจจุบัน (เกินรอบ → roll อัตโนมัติ)`;
    }catch(e){ est.textContent='⚠️ '+String(e.message||e).slice(0,50); }
  }).catch(()=>est.textContent='');
}
document.getElementById('psAmount').addEventListener?.('input',estimateOut);
document.getElementById('psPay').addEventListener?.('change',estimateOut);

async function presaleBuy(){
  if(!presaleReady()){ toast('ตั้งค่า Presale + NEX ก่อน (⚙️)'); return; }
  const amt=parseFloat(document.getElementById('psAmount').value);
  if(!(amt>0)){ toast('ใส่จำนวน NEX ก่อน'); return; }
  const amtWei=ethers.parseEther(String(amt));
  const useUSDT=(document.getElementById('psPay').value==='USDT');
  try{
    if(useUSDT && !payTokenAddr()){ toast('ต้องมี USDT address ก่อน (⚙️)'); return; }
    if(!window._myAddr){ toast('Connect Wallet ก่อน'); return; }
    const rd=await psContract(false);
    const [cost]=await rd.quote(amtWei,!useUSDT);
    if(useUSDT){
      toast('1/2 approve '+symOf()+'...');
      const tk=await tokenContract(true); if(!tk) return;
      await (await tk.approve(presaleAddr(),cost)).wait();
      toast('2/2 ซื้อ NEX ด้วย USDT...');
      const c=await psContract(true); if(!c) return;
      await (await c.buyWithUSDT(amtWei)).wait();
    }else{
      toast('🛒 ซื้อด้วย POL...');
      const c=await psContract(true); if(!c) return;
      await (await c.buyWithPOL(amtWei,{value:cost,gasLimit:600000})).wait();
    }
    toast('🎉 ซื้อสำเร็จ! NEX เข้า wallet แล้ว'); renderPresale(); jobRefresh();
  }catch(e){ toast('❌ '+String(e.message||e).slice(0,90)); }
}
function symOf(){ return document.getElementById('psPay').value==='USDT'?'USDT':(PS_SYM_BY_CHAIN[Number(NET().chainId)]||'POL'); }
