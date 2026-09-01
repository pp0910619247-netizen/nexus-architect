/* ═════════════════════════════════════════════════════════════════
   NEXUS AI-PIPE v1.0 — ท่อเชื่อม (unified knowledge pipe)
   ขุดความรู้จากหน้าแรก → KYC Lv.3 (อธิปไตย) → สมองหลายค่าย → การ์ดความรู้
   - รู้จัก "สมอง" ทุกแบบ: llama-server GGUF / Ollama (GGUF ใดก็ได้)
     Gemini / OpenAI / OpenRouter / Claude / Endpoint ใดก็ได้ (OpenAI-compatible)
   - เก็บ API keys ด้วย AES-GCM (key vault ในเครื่อง) — ไม่มี server
   - เหรียญที่ขุดได้ → บันทึก nx_mined_kb ให้เว็บ+แอป (Flutter DataPipe) ใช้ร่วมกัน
   - Minting Reward ตาม Whitepaper v1.1: ฝังใน JSON การ์ด (reward_nex)
   ═════════════════════════════════════════════════════════════════ */

const AIPipe = {
  /* ── config: ผู้ใช้เลือกค่ายสมอง + ตั้ง key ── */
  get cfg() {
    return JSON.parse(localStorage.getItem('pipe_cfg') || 'null') ||
      { brain: 'local', localUrl: 'http://127.0.0.1:8080', localModel: 'local-gguf',
        ollamaUrl: 'http://localhost:11434', ollamaModel: '',
        geminiModel: 'gemini-1.5-flash', openaiModel: 'gpt-4o-mini',
        openrouterModel: 'meta-llama/llama-3.1-70b-instruct', claudeModel: 'claude-sonnet-4-20250514',
        customUrl: '', customModel: '' };
  },
  saveCfg(patch) { localStorage.setItem('pipe_cfg', JSON.stringify(Object.assign(this.cfg, patch))); },

  /* ── ผู้ใช้/ระดับ ── */
  user() { return JSON.parse(localStorage.getItem('nx_user') || '{"level":0}'); },
  LEVEL_NAMES = ['เงา Shadow', 'มนุษย์ Human', 'พลเมือง Citizen', 'อธิปไตย Sovereign'],

  /* ── KYC Lv.3 (Bank-Grade) — ต้องผ่าน KYC จริง (nx_identity.kycScore) + wallet จริง ── */
  lv3Status() {
    const id = JSON.parse(localStorage.getItem('nx_identity') || '{}');
    const user = this.user();
    const kyc = Number(id.kycScore || 0);
    const wallet = !!(id.walletAddress && id.walletSig);
    const human = !!(id.passkeyId || id.google);
    if (user.level >= 3) return { ok: true, ready: true, msg: 'Lv.3 อธิปไตย Sovereign — พร้อมขุดความรู้' };
    if (!human)  return { ok: false, msg: '⛔ ต้องยืนยันตัวตนก่อน: กด "Passkey จริง / Google Sign-In (Lv.1)"' };
    if (!wallet) return { ok: false, msg: '⛔ เหลือขั้นที่ 2/3: กด "เซ็น Wallet จริง (Lv.2)" เพื่อยืนยันเจ้าของตัวจริง' };
    if (kyc < 70) return { ok: false, msg: '⛔ เหลือขั้นสุดท้าย 3/3: ทำ "KYC บัตร+ใบหน้า" ให้ผ่าน (score ≥ 70) แล้วจึงเป็น Sovereign' };
    return { ok: true, ready: true, msg: 'Lv.3 อธิปไตย Sovereign — พร้อมขุดความรู้' };
  },

  /* ── สมอง: รายชื่อค่ายที่รองรับ ── */
  BRAINS: {
    local:      { name: '🖥 Local GGUF (llama-server)', note: 'รันในเครื่อง: python yuri_rag.py --serve หรือ llama-server · ใช้ไฟล์ GGUF ใดก็ได้' },
    ollama:     { name: '🐳 Ollama (GGUF ใดก็ได้)',     note: 'ollama pull <model> แล้วตั้งชื่อโมเดล (ทุกไฟล์ GGUF รองรับผ่าน Modelfile)' },
    gemini:     { name: '🔷 Gemini',                    note: 'aistudio.google.com → API key ฟรี' },
    openai:     { name: '⚫ OpenAI',                    note: 'platform.openai.com → API key' },
    openrouter:  { name: '🔀 OpenRouter',               note: 'openrouter.ai → ใช้ AI หลายค่ายใน API เดียว' },
    claude:     { name: '🍊 Anthropic Claude',         note: 'console.anthropic.com → API key' },
    custom:     { name: '🧩 Endpoint เอง (OpenAI-compatible)', note: 'เช่น vLLM / LM Studio / llama.cpp บน server ของคุณ — ใส่ URL กับ model เอง' },
  },
  brainList() { return Object.keys(this.BRAINS).map(k => ({ id: k, ...this.BRAINS[k] })); },

  /* ── Key vault (AES-GCM) — reuse TwinEngine ของ twin.js ── */
  async _dek() {
    if (window.Twin && window.Twin._deviceKey) return window.Twin;
    return null;
  },
  async saveBrainKey(keyEncName) {
    const k = document.getElementById('pipeKey').value.trim();
    if (!k) return { ok: false, msg: 'ใส่ API key ก่อน' };
    const twin = await this._dek();
    const enc = twin ? await twin.enc(k) : 'plain:' + k;
    const patch = {}; patch[keyEncName] = enc;
    this.saveCfg(patch);
    return { ok: true, msg: '🔐 บันทึก key แล้ว (เข้ารหัส AES-GCM บนเครื่อง)' };
  },
  async brainKey(encName) {
    const twin = await this._dek();
    const v = this.cfg[encName] || '';
    if (!v) return '';
    if (v.startsWith('plain:')) return v.slice(6);
    return twin ? await twin.dec(v) : '';
  },

  /* ── call: เรียกสมองที่เลือก (รองรับทุกค่าย + GGUF ทั้งหมด) ── */
  async _call(system, user) {
    const c = this.cfg;
    const sysMsg = { role: 'system', content: system };
    const usrMsg = { role: 'user', content: user };
    const jsonHeaders = { 'Content-Type': 'application/json' };
    let body, url;
    const fetchIt = async (u, h, b) => {
      const r = await fetch(u, { method: 'POST', headers: h, body: JSON.stringify(b) });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
      return r.json();
    };

    switch (c.brain) {
      case 'local': { // llama.cpp / llama-server — รองรับ .gguf ทั้งหมด (OpenAI-compatible)
        url = (c.localUrl || 'http://127.0.0.1:8080').replace(/\/+$/, '') + '/v1/chat/completions';
        body = { messages: [sysMsg, usrMsg], max_tokens: 320, temperature: 0.3, enable_thinking: false, stream: false };
        const j = await fetchIt(url, jsonHeaders, body);
        return j.choices?.[0]?.message?.content || '';
      }
      case 'ollama': {
        url = (c.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '') + '/api/chat';
        body = { model: c.ollamaModel || 'llama3.2', stream: false, messages: [sysMsg, usrMsg], options: { temperature: 0.3 } };
        const j = await fetchIt(url, jsonHeaders, body);
        return j.message?.content || '';
      }
      case 'gemini': {
        const key = await this.brainKey('geminiKeyEnc'); if (!key) throw new Error('ยังไม่ตั้ง Gemini key');
        url = `https://generativelanguage.googleapis.com/v1beta/models/${c.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${encodeURIComponent(key)}`;
        const j = await fetchIt(url, jsonHeaders, { contents: [{ parts: [{ text: system + '\n\nผู้ใช้:\n' + user }] }] });
        return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      case 'openai': {
        const key = await this.brainKey('openaiKeyEnc'); if (!key) throw new Error('ยังไม่ตั้ง OpenAI key');
        url = 'https://api.openai.com/v1/chat/completions';
        body = { model: c.openaiModel || 'gpt-4o-mini', messages: [sysMsg, usrMsg], max_tokens: 320, temperature: 0.3 };
        const j = await fetchIt(url, Object.assign({ Authorization: 'Bearer ' + key }, jsonHeaders), body);
        return j.choices?.[0]?.message?.content || '';
      }
      case 'openrouter': {
        const key = await this.brainKey('openrouterKeyEnc'); if (!key) throw new Error('ยังไม่ตั้ง OpenRouter key');
        url = 'https://openrouter.ai/api/v1/chat/completions';
        body = { model: c.openrouterModel || 'meta-llama/llama-3.1-70b-instruct', messages: [sysMsg, usrMsg], max_tokens: 320, temperature: 0.3 };
        const j = await fetchIt(url, Object.assign({ Authorization: 'Bearer ' + key, 'HTTP-Referer': location.origin }, jsonHeaders), body);
        return j.choices?.[0]?.message?.content || '';
      }
      case 'claude': {
        const key = await this.brainKey('claudeKeyEnc'); if (!key) throw new Error('ยังไม่ตั้ง Claude key');
        url = 'https://api.anthropic.com/v1/messages';
        const j = await fetchIt(url, Object.assign({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }, jsonHeaders),
          { model: c.claudeModel || 'claude-sonnet-4-20250514', max_tokens: 320, system, messages: [{ role: 'user', content: user }] });
        return j.content?.map?.(x => x.text || '').join('') || '';
      }
      case 'custom': {
        if (!c.customUrl) throw new Error('ตั้ง Endpoint URL ก่อน');
        url = c.customUrl.replace(/\/+$/, '') + '/v1/chat/completions';
        const apikey = await this.brainKey('customKeyEnc');
        const h = apikey ? Object.assign({ Authorization: apikey.startsWith('Bearer') ? apikey : ('Bearer ' + apikey) }, jsonHeaders) : jsonHeaders;
        body = { model: c.customModel || '', messages: [sysMsg, usrMsg], max_tokens: 320, temperature: 0.3 };
        const j = await fetchIt(url, h, body);
        return j.choices?.[0]?.message?.content || '';
      }
      default: throw new Error('ไม่รู้จักสมอง: ' + c.brain);
    }
  },

  /* ── Knowledge Minting Oracle (prompt เดียวกับแอป Flutter) ── */
  ORACLE_PROMPT:
    'You are the Knowledge Minting Oracle of Nexus Architect (Polygon). ' +
    'Mint the user\'s hard-won knowledge into a community asset card.\nRules:\n' +
    '- Must be real and specific (a solved problem, a proven technique, or an original invention). Reject vague or trivial input.\n' +
    '- Reply ONLY with valid JSON, no markdown, no commentary:\n' +
    '{"title":"..","keywords":["..","..",".."],"difficulty":1..10,' +
    '"summary":"one refined paragraph: the problem, why hard, how solved (or how the invention works)",' +
    '"reward_nex":<number>}\n' +
    '- Reward scale by difficulty: 1-3->10, 4-6->40, 7->100, 8->200, 9->400, 10->1000 NEX ' +
    'from the 300M Mining Pool. Add +20% when the submission is complete (3+ keywords and clear how/why steps).\n' +
    '- difficulty 10 = world-changing invention or zero-to-one breakthrough; 1 = trivial fact.',

  rewardFor(diff) { return { 1:10, 2:10, 3:10, 4:40, 5:40, 6:40, 7:100, 8:200, 9:400, 10:1000 }[Math.min(10, Math.max(1, diff))] || 10; },

  /* ── ขุดความรู้ จากหน้าแรก — เกท KYC Lv.3 ── */
  async mine({ title, text, el }) {
    if (el) el.disabled = true;
    try {
      if (String(text || '').trim().length < 20) return { ok: false, msg: 'ความรู้สั้นเกินไป — เขียนวิธี/ผลลัพธ์/ขั้นตอนให้ครบอย่างน้อย 1 ประโยค' };
      const gate = this.lv3Status();
      if (!gate.ok) return { ok: false, msg: gate.msg };
      let raw = '';
      try { raw = await this._call(this.ORACLE_PROMPT, 'TITLE: ' + (title || '') + '\n\nKNOWLEDGE:\n' + text); }
      catch (e) { return { ok: false, msg: '💡 ' + this.BRAINS[this.cfg.brain].name + ' ไม่ตอบ (เปิด/ตั้งก่อน): ' + String(e.message || e).slice(0, 70) }; }
      const m = String(raw).match(/\{[\s\S]*\}/);
      let j; try { j = JSON.parse(m ? m[0] : raw); } catch (e) { return { ok: false, msg: 'สมองตอบไม่ใช่ JSON — ลองค่ายอื่น' }; }
      if (!j || !j.summary) return { ok: false, msg: 'การ์ดไม่สมบูรณ์ — ลองอีกครั้ง' };
      const diff = Math.min(10, Math.max(1, Number(j.difficulty) || 3));
      let reward = Number(j.reward_nex) || this.rewardFor(diff);
      reward = Math.min(1200, Math.max(5, Math.round(reward)));
      const card = {
        title: (j.title || title || 'Untitled knowledge').trim(),
        keywords: Array.isArray(j.keywords) ? j.keywords.map(String).slice(0, 6) : ['experience'],
        difficulty: diff,
        summary: String(j.summary).trim(),
        reward_nex: reward,
        brain: this.cfg.brain, at: Date.now(),
      };
      this._pushMined(card);
      return { ok: true, card, msg: `🎉 ขุดความรู้สำเร็จ! +${reward} NEX — ลง "${card.title}" ไว้ในคลังแล้ว` };
    } finally { if (el) el.disabled = false; }
  },

  /* ── ออฟไลน์ (ไม่มีสมอง) — การ์ดแบบไม่ใช้ AI ── */
  offlineMine({ title, text }) {
    const words = String(text).trim().split(/\s+/).filter(x => x).length;
    const steps = /(step|first|then|finally|because|result|how|why|ขั้น|วิธี|แล้ว|เพราะ)/i.test(text);
    const diff = Math.min(10, Math.max(1, 1 + Math.round(words / 25) + (steps ? 1 : 0)));
    const kws = String(text).split(/[\s,;.()]+/).filter(w => w.length >= 5).slice(0, 4);
    return {
      title: (title && title.trim()) || (words > 3 ? text.trim().split(/\s+/).slice(0, 8).join(' ') + '…' : 'Untitled knowledge'),
      keywords: kws.length ? kws : ['experience'],
      difficulty: diff,
      summary: '(Offline mint) ' + text.trim(),
      reward_nex: this.rewardFor(diff),
      brain: 'offline', at: Date.now(),
    };
  },

  /* ── คลังที่ขุด (nx_mined_kb = ท่อร่วมเว็บ↔แอป) ── */
  mined() { try { return JSON.parse(localStorage.getItem('nx_mined_kb') || '[]'); } catch (e) { return []; } },
  _pushMined(card) {
    const arr = this.mined(); arr.push(card);
    if (arr.length > 200) arr.shift();
    localStorage.setItem('nx_mined_kb', JSON.stringify(arr));
  },
  totalReward() { return this.mined().reduce((s, c) => s + (Number(c.reward_nex) || 0), 0); },

  /* ── ข้อมูล NEX32 (Chainlink) — เรนเดอร์เหรียญบนหน้าแรก ── */
  async nex32Live() {
    const sale = JSON.parse(localStorage.getItem('nx_presale_137') || 'null') || '0xB1293Ed631e4bDf568e91727F78fAd170cC58304';
    const tokenAddr = localStorage.getItem('nx_nex_token') || '0x770AFC829e87d9A3467b20d6f3E5122BBa9BA0af';
    const p = new ethers.JsonRpcProvider('https://polygon-bor-rpc.publicnode.com');
    const abi = ['function currentRound() view returns (uint8)','function usdtPriceOfRound(uint8) view returns (uint256)',
                 'function polPerNex(uint8) view returns (uint256)','function roundSold() view returns (uint256)',
                 'function TOTAL_FOR_SALE() view returns (uint256)'];
    const c = new ethers.Contract(sale, abi, p);
    const cur = Number(await c.currentRound());
    const sold = Number(await c.roundSold());
    const total = Number(await c.TOTAL_FOR_SALE());
    const usd = Number(await c.usdtPriceOfRound(cur)) / 1e6;
    let polPerNex = '—';
    try { polPerNex = Number(ethers.formatEther(await c.polPerNex(cur))).toFixed(8); } catch (e) {}
    let bal = 0;
    const addr = this.user().walletAddress || (window._myAddr || '');
    if (addr) { try { bal = Number(ethers.formatEther(await new ethers.Contract(tokenAddr, ['function balanceOf(address) view returns (uint256)'], p).balanceOf(addr))); } catch (e) {} }
    return { cur, round: cur + 1, sold, total, usd, polPerNex, bal, chain: 'Polygon Mainnet',
             addr: sale, labelUsd: '$' + usd.toFixed(6) + '/NEX' };
  },
};

window.AIPipe = AIPipe;