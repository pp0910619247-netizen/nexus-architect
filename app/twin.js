/* ═════════════════════════════════════════════════════
   NEXUS DIGITAL TWIN ENGINE v1.0
   - On-device memory (localStorage) — ข้อมูลไม่ออกจากเครื่อง
   - Multi-provider: Local Brain (ฟรี ใช้ได้ทันที) / Ollama / Gemini / OpenAI
   ═════════════════════════════════════════════════════ */

class TwinEngine {
  constructor() {
    this.cfg = JSON.parse(localStorage.getItem('twin_cfg') || 'null') ||
      { provider: 'local', geminiKey: '', openaiKey: '', ollamaModel: 'llama3.2', name: 'Aurora' };
    this.mem = JSON.parse(localStorage.getItem('twin_mem') || 'null') ||
      { facts: [], chat: [], born: Date.now(), xp: 0 };
  }
  save() {
    localStorage.setItem('twin_cfg', JSON.stringify(this.cfg));
    localStorage.setItem('twin_mem', JSON.stringify(this.mem));
  }
  remember(text) {
    this.mem.facts.push({ t: text, at: Date.now() });
    if (this.mem.facts.length > 200) this.mem.facts.shift();
    this.mem.xp += 5;
    this.save();
  }
  setCfg(patch) { Object.assign(this.cfg, patch); this.save(); }

  /* ── Local Brain: ตอบได้ทันทีไม่ต้องมี API ── */
  localBrain(userMsg) {
    const m = userMsg.toLowerCase();
    const name = this.cfg.name || 'Aurora';

    // คำสั่งจำความจำ
    const rememberMatch = userMsg.match(/^(จำว่า|จำไว้|remember)[:\s]+(.+)/i);
    if (rememberMatch) {
      this.remember(rememberMatch[2].trim());
      return `🧠 จดจำแล้ว: "${rememberMatch[2].trim()}" — ผมจะใช้ข้อมูลนี้ในการช่วยคุณต่อไป (XP +5)`;
    }

    if (/ทำอะไรได้|ช่วยอะไร|help|ability/.test(m))
      return `🐉 ผมคือ ${name} Digital Twin ของคุณ\n` +
        `• จดจำข้อมูลส่วนตัว (พิมพ์ "จำว่า ...")\n` +
        `• ช่วยคิดโจทย์บน Mountain\n` +
        `• สรุป/วิเคราะห์ปัญหา\n` +
        `• ตอบคำถามจากความจำที่มี (${this.mem.facts.length} บันทึก)\n` +
        `💡 อัปเกรด: ใส่ Gemini API key (ฟรี) เพื่อเปิดสมองเต็มรูปแบบ`;

    if (/โจทย์|ปัญหา|mission|problem/.test(m)) {
      const probs = JSON.parse(localStorage.getItem('nx_probs') || '[]');
      if (!probs.length) return 'ยังไม่มีโจทย์บนภูเขา — เสนอปัญหาแรกก่อนไหม?';
      const top = probs.sort((a, b) => b.votes - a.votes)[0];
      return `🏔 โจทย์ที่คะแนนสูงสุดตอนนี้: "${top.title}" (${top.votes} votes)\n` +
        `มุมที่ผมแนะนำ:\n1. แตกปัญหาเป็น 3 ย่อยที่แก้ได้จริง\n2. หาว่า AI ประเภทไหนช่วยได้\n3. วัดผลยังไงถึงเรียกว่า "แก้แล้ว"`;
    }

    if (/สวัสดี|hello|hi|hey|ดี/.test(m)) {
      const hours = new Date().getHours();
      const greet = hours < 12 ? 'สวัสดีตอนเช้า' : hours < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนค่ำ';
      return `${greet}ครับ 🐉 ผม ${name} — ความจำของผมมี ${this.mem.facts.length} บันทึก, XP ${this.mem.xp} อยากให้ช่วยอะไร?`;
    }

    if (/ใคร|who are you|ตัวตน/.test(m))
      return `ผมคือ Digital Twin ของคุณ ชื่อ ${name} เกิด ${new Date(this.mem.born).toLocaleDateString('th-TH')} — เรียนรู้จากคุณเท่านั้น ความจำทั้งหมดอยู่บนเครื่องนี้ ไม่มีวันออกไปไหน`;

    // ถามจากความจำ
    const fact = this.mem.facts.find(f => m.split(/\s+/).some(w => w.length > 3 && f.t.toLowerCase().includes(w)));
    if (fact) return `จากความจำของผม: "${fact.t}" (จดไว้เมื่อ ${new Date(fact.at).toLocaleDateString('th-TH')})`;

    return `รับทราบ 🐉 (โหมด Local Brain — ตอบเชิงต้นแบบ)\n` +
      `ลองพิมพ์: "จำว่า ฉันชอบ..." หรือถาม "ทำอะไรได้บ้าง" หรือ "โจทย์บนภูเขา"\n` +
      `ใส่ Gemini API key ในช่องตั้งค่าเพื่อปลุกสมองเต็มรูปแบบ`;
  }

  /* ── AES-GCM key vault (API keys ถูกเข้ารหัสก่อนเก็บ) ── */
  async _deviceKey() {
    if (this._dk) return this._dk;
    let raw = localStorage.getItem('twin_dk');
    if (!raw) {
      const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const exp = new Uint8Array(await crypto.subtle.exportKey('raw', k));
      raw = btoa(String.fromCharCode(...exp));
      localStorage.setItem('twin_dk', raw);
    }
    const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
    this._dk = await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
    return this._dk;
  }
  async enc(t) {
    const k = await this._deviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(t));
    return btoa(String.fromCharCode(...iv)) + '.' + btoa(String.fromCharCode(...new Uint8Array(ct)));
  }
  async dec(t) {
    try {
      const [ivS, ctS] = String(t).split('.');
      if (!ctS) return '';
      const iv = Uint8Array.from(atob(ivS), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(ctS), c => c.charCodeAt(0));
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await this._deviceKey(), ct);
      return new TextDecoder().decode(pt);
    } catch { return ''; }
  }

  /* ── Adapters ── */
  async chat(userMsg) {
    this.mem.chat.push({ role: 'user', text: userMsg, at: Date.now() });

    // ── ความจำระยะยาว: สกัดข้อมูลอัตโนมัติ + บันทึกหัวข้อ ──
    let learned = [];
    if (window.NexusLTM) {
      learned = window.NexusLTM.extract(userMsg);
      window.NexusLTM.setLastTopic(userMsg.slice(0, 60));
    }

    let reply;
    try {
      if (this.cfg.provider === 'gemini') {
        const key = await this.dec(this.cfg.geminiKeyEnc || '');
        reply = key ? await this._gemini(userMsg, key) : (window.NexusBrain ? window.NexusBrain.respond(userMsg).text : this.localBrain(userMsg)) + '\n(ยังไม่มี key — ใช้ Local Brain)';
      }
      else if (this.cfg.provider === 'openai') {
        const key = await this.dec(this.cfg.openaiKeyEnc || '');
        reply = key ? await this._openai(userMsg, key) : (window.NexusBrain ? window.NexusBrain.respond(userMsg).text : this.localBrain(userMsg)) + '\n(ยังไม่มี key — ใช้ Local Brain)';
      }
      else if (this.cfg.provider === 'ollama') reply = await this._ollama(userMsg);
      else {
        // ── 🧠 NEURAL MODE: LLM จริงในเบราว์เซอร์ (โหลดแล้วเท่านั้น) ──
        if (window.NexusBrain && window.NexusBrain.neuralLoaded()) {
          const nr = await window.NexusBrain.tryNeural(userMsg);
          if (nr) { reply = nr.text; }
        }
        if (!reply) {
          // ── ดึงราคา crypto สด (CoinGecko ฟรี ไม่มี key) ก่อนเข้าสมอง ──
          if (/ราคา|เท่าไหร่|price/i.test(userMsg) && /btc|bitcoin|eth|ethereum|คริปโต|crypto|เหรียญ/i.test(userMsg)) {
          try {
            const pr = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,thb&include_24hr_change=true');
            const pj = await pr.json();
            const f = (x) => pj[x] ? `$${pj[x].usd.toLocaleString()} (฿${pj[x].thb.toLocaleString()}) ${pj[x].usd_24h_change >= 0 ? '📈+' : '📉'}${pj[x].usd_24h_change.toFixed(1)}%` : 'N/A';
            reply = `💰 ราคาสด (CoinGecko):\n• BTC: ${f('bitcoin')}\n• ETH: ${f('ethereum')}\n• SOL: ${f('solana')}\n\nข้อมูลเมื่อ ${new Date().toLocaleTimeString('th-TH')} — ไม่ใช่คำแนะนำการลงทุนนะ`;
          } catch (e) { reply = 'ดึงราคาไม่สำเร็จ (เน็ต/Coingecko ล่ม)'; }
        } else {
          const br = window.NexusBrain ? window.NexusBrain.respond(userMsg) : { text: this.localBrain(userMsg), intent: 'local' };
          reply = br.text;
          // ── ความรู้รอบด้าน: ถ้าสมอง local ไม่รู้ → ค้น Wikipedia ทันที ──
          if ((br.intent === 'unknown' || br.conf < 0.35) && window.NexusBrain) {
            try {
              // Trust Chain: KB → Wikipedia → DuckDuckGo ("อาจารย์ไปดูมาแล้ว")
              const found = await NexusBrain.knowledgeLookup(userMsg);
              if (found) reply = found.text;
            } catch (e) { /* offline ก็ยังมีคำตอบเดิม */ }
          }
        }
        }
      }
    } catch (e) {
      reply = '⚠️ ' + this.cfg.provider + ' error: ' + String(e.message || e).slice(0, 80) + '\n' + this.localBrain(userMsg);
    }
    this.mem.chat.push({ role: 'twin', text: reply, at: Date.now() });
    if (this.mem.chat.length > 60) this.mem.chat = this.mem.chat.slice(-60);
    this.mem.xp += 1;
    this.save();

    // ── Consolidation: ย่อยความจำเก่าเป็น episodic เมื่อแชทยาว ──
    if (window.NexusLTM && this.mem.chat.length >= 40) window.NexusLTM.consolidate(this.mem.chat);

    // ── แจ้งสิ่งที่เรียนรู้ใหม่ ──
    if (learned.length) reply += `\n🧠 (เรียนรู้อัตโนมัติ: ${learned.map(l => l.type).join(', ')})`;
    return reply;
  }

  _context() {
    const facts = this.mem.facts.slice(-20).map(f => '- ' + f.t).join('\n');
    return `คุณคือ "${this.cfg.name}" Digital Twin ส่วนตัวของผู้ใช้ในระบบ Nexus Architect (แพลตฟอร์มแก้ปัญหาโลกแบบกระจายศูนย์) ตอบเป็นภาษาไทย กระชับ เป็นมิตร ใช้ข้อมูลความจำนี้ถ้าเกี่ยวข้อง:\n${facts || '(ยังไม่มี)'}`;
  }

  async _gemini(msg, key) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: this._context() + '\n\nผู้ใช้: ' + msg }] }] })
    });
    if (!r.ok) throw new Error('Gemini ' + r.status);
    const j = await r.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text || '(ว่างเปล่า)';
  }

  async _openai(msg, key) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: this._context() }, { role: 'user', content: msg }] })
    });
    if (!r.ok) throw new Error('OpenAI ' + r.status);
    const j = await r.json();
    return j.choices?.[0]?.message?.content || '(ว่างเปล่า)';
  }

  async _ollama(msg) {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.cfg.ollamaModel, stream: false, messages: [{ role: 'system', content: this._context() }, { role: 'user', content: msg }] })
    });
    if (!r.ok) throw new Error('Ollama ' + r.status + ' (ต้องรัน ollama serve)');
    const j = await r.json();
    return j.message?.content || '(ว่างเปล่า)';
  }
}

window.Twin = new TwinEngine();
