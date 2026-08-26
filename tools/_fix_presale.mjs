import fs from 'node:fs';
let s = fs.readFileSync('index.html', 'utf8');
let fixes = [];

// ═══ BUG 1: window._myAddr never set ═══
// In connectWallet(), add window._myAddr = addr
s = s.replace(
  /localStorage\.setItem\('nx_wallet',addr\);\s*showWallet\(addr/,
  "localStorage.setItem('nx_wallet',addr);\n    window._myAddr=addr;\n    showWallet(addr"
);
fixes.push('BUG1: _myAddr set in connectWallet');

// In auto-reconnect, add window._myAddr = saved
s = s.replace(
  /if\(accounts\.length && accounts\[0\]\.toLowerCase\(\)===saved\.toLowerCase\(\)\)\{/,
  "if(accounts.length && accounts[0].toLowerCase()===saved.toLowerCase()){\n        window._myAddr=saved;"
);
fixes.push('BUG2: _myAddr set in auto-reconnect');

// In disconnectWallet, add window._myAddr = null
s = s.replace(
  /function disconnectWallet\(\)\{\s*localStorage\.removeItem\('nx_wallet'\);/,
  "function disconnectWallet(){\n  window._myAddr=null;\n  localStorage.removeItem('nx_wallet');"
);
fixes.push('BUG3: _myAddr cleared in disconnectWallet');

// ═══ BUG 2+3: ABI wrong function signatures ═══
s = s.replace("'function roundSold(uint256) view returns (uint256)'", "'function roundSold(uint8) view returns (uint256)'");
s = s.replace("'function priceOfUSDT() view returns (uint256)'", "'function priceOfUSDT(uint8) view returns (uint256)'");
s = s.replace("'function priceOfPOL() view returns (uint256)'", "'function priceOfPOL(uint8) view returns (uint256)'");
fixes.push('BUG4: ABI roundSold/priceOfUSDT/priceOfPOL fixed');

// ═══ BUG 2b: Add uint8 param to calls ═══
s = s.replace('await c.priceOfUSDT()', 'await c.priceOfUSDT(cur)');
s = s.replace('await c.priceOfPOL()', 'await c.priceOfPOL(cur)');
fixes.push('BUG5: priceOfUSDT/POL calls updated with cur param');

// ═══ BUG 4+5: quote booleans swapped ═══
// USDT path should use false (not pol=true)
s = s.replace(
  /const cost=await c\.quote\(amt,true\);\s*const tx1=await tk\.approve/,
  'const cost=await c.quote(amt,false);\n      const tx1=await tk.approve'
);
fixes.push('BUG6: USDT quote(amt,false)');

// POL path should use true (pol=true)
s = s.replace(
  /const cost=await c\.quote\(amt,false\);\s*const tx=await c\.buyWithPOL/,
  'const cost=await c.quote(amt,true);\n      const tx=await c.buyWithPOL'
);
fixes.push('BUG7: POL quote(amt,true)');

// ═══ BUG 6: Round display 0-indexed ═══
s = s.replace('for(let i=1;i<=rounds;i++)', 'for(let i=0;i<rounds;i++)');
s = s.replace(
  /Round \'\+cur\+\'\/\'+rounds/,
  "Round '+(cur+1)+'/'+rounds"
);
fixes.push('BUG8: Round display 0-indexed');

// ═══ BUG 7: Estimate disclaimer ═══
s = s.replace(
  /document\.getElementById\('psCost'\)\.textContent=cost\.toFixed\(pay==='USDT'\?4:6\)\+' '+pay;/,
  "document.getElementById('psCost').textContent=cost.toFixed(pay==='USDT'?4:6)+' '+pay;\n  document.getElementById('psCost').title='ราคาจริงคำนวณจาก chain · อาจสูงกว่าเล็กน้อย';"
);
fixes.push('BUG9: Estimate tooltip');

// ═══ SECURITY: Input validation + rate limit ═══
s = s.replace(
  /if\(n<100\)\{alert\('ขั้นต่ำ 100 NEX'\);return;\}/,
  "if(!Number.isFinite(n)||n<100){alert('ขั้นต่ำ 100 NEX');return;}\n  if(n>1000000000){alert('สูงสุด 1,000,000,000 NEX');return;}\n  if(_buying){return;}\n  _buying=true;"
);
fixes.push('SEC1: Input validation + rate limit');

// Add _buying flag before psBuy
s = s.replace(
  'async function psBuy(){',
  'let _buying=false;\nasync function psBuy(){'
);
fixes.push('SEC2: _buying flag declared');

// Reset _buying on success
s = s.replace(
  /btn\.style\.background='var\(--good\)';\s*psLoad\(\);/,
  "btn.style.background='var(--good)';\n    psLoad();\n    _buying=false;"
);
fixes.push('SEC3: _buying reset on success');

// Reset _buying on error + better error messages
s = s.replace(
  /\}catch\(e\)\{\s*status\.textContent='❌ ล้มเหลว: '\+String\(e\.message\|\|e\)\.slice\(0,40\);\s*btn\.textContent='🛒 ซื้อ NEX';btn\.style\.opacity='1';btn\.style\.pointerEvents='';\s*\}/,
  `}catch(e){
    const msg=String(e.message||e);
    if(msg.includes('user rejected')||msg.includes('User denied')){status.textContent='❌ ผู้ใช้ยกเลิก';}
    else if(msg.includes('insufficient funds')){status.textContent='❌ เงินไม่พอ';}
    else{status.textContent='❌ ล้มเหลว: '+msg.slice(0,50);}
    btn.textContent='🛒 ซื้อ NEX';btn.style.opacity='1';btn.style.pointerEvents='';
    _buying=false;
  }`
);
fixes.push('SEC4: Better error messages + rate limit reset');

// ═══ USDT balance in nav ═══
// Add USDT element in nav HTML
s = s.replace(
  /<span style="color:var\(--txt3\);font-size:\.7rem">·<\/span>\s*<span style="font-size:\.78rem"><span style="color:var\(--txt3\)">NEX<\/span> <b id="navNex" style="color:var\(--acc2\)">—<\/b><\/span>\s*<button onclick="disconnectWallet\(\)"/,
  `<span style="color:var(--txt3);font-size:.7rem">·</span>
          <span style="font-size:.78rem"><span style="color:var(--txt3)">USDT</span> <b id="navUsdt" style="color:var(--good)">—</b></span>
          <span style="color:var(--txt3);font-size:.7rem">·</span>
          <span style="font-size:.78rem"><span style="color:var(--txt3)">NEX</span> <b id="navNex" style="color:var(--acc2)">—</b></span>
          <button onclick="disconnectWallet()"`
);
fixes.push('NAV: USDT balance element added');

// Update showWallet signature to include usdtBal
s = s.replace(
  'function showWallet(addr,bal,nexBal,chainId){',
  'function showWallet(addr,bal,nexBal,usdtBal,chainId){'
);
s = s.replace(
  /document\.getElementById\('navNex'\)\.textContent=nexBal;/,
  "document.getElementById('navNex').textContent=nexBal;\n  document.getElementById('navUsdt').textContent=usdtBal;"
);
fixes.push('NAV: showWallet updated with usdtBal');

// Add USDT balance fetch in connectWallet
s = s.replace(
  /localStorage\.setItem\('nx_wallet',addr\);\s*window._myAddr=addr;\s*showWallet\(addr,bal,nexBal/,
  `let usdtBal='0';
    try{const u=new ethers.Contract(USDT_ADDR,USDT_ABI,provider);usdtBal=Number(ethers.formatUnits(await u.balanceOf(addr),6)).toLocaleString();}catch(e){}
    localStorage.setItem('nx_wallet',addr);
    window._myAddr=addr;
    showWallet(addr,bal,nexBal,usdtBal`
);
fixes.push('NAV: USDT balance fetch in connectWallet');

// Add USDT balance fetch in auto-reconnect
s = s.replace(
  /showWallet\(saved,bal,nexBal,parseInt\(chainId,16\)\);/,
  `let usdtBal='0';
          try{const u=new ethers.Contract(USDT_ADDR,USDT_ABI,provider);usdtBal=Number(ethers.formatUnits(await u.balanceOf(saved),6)).toLocaleString();}catch(e){}
          showWallet(saved,bal,nexBal,usdtBal,parseInt(chainId,16));`
);
fixes.push('NAV: USDT balance fetch in auto-reconnect');

// ═══ SECURITY: CSP meta tag ═══
s = s.replace(
  '<meta name="description"',
  '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: blob:; connect-src *; object-src \'none\'; base-uri \'self\'; frame-ancestors \'none\'">\n<meta name="description"'
);
fixes.push('SEC: CSP meta tag added');

fs.writeFileSync('index.html', s, 'utf8');
console.log('Fixed ' + fixes.length + ' issues:');
fixes.forEach(f => console.log('  ✓ ' + f));
