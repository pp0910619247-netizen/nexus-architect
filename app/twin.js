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

  /* ── Adapters ── */
  async chat(userMsg) {
    this.mem.chat.push({ role: 'user', text: userMsg, at: Date.now() });
    let reply;
    try {
      if (this.cfg.provider === 'gemini' && this.cfg.geminiKey) reply = await this._gemini(userMsg);
      else if (this.cfg.provider === 'openai' && this.cfg.openaiKey) reply = await this._openai(userMsg);
      else if (this.cfg.provider === 'ollama') reply = await this._ollama(userMsg);
      else reply = this.localBrain(userMsg);
    } catch (e) {
      reply = '⚠️ ' + this.cfg.provider + ' error: ' + String(e.message || e).slice(0, 80) + '\n' + this.localBrain(userMsg);
    }
    this.mem.chat.push({ role: 'twin', text: reply, at: Date.now() });
    if (this.mem.chat.length > 60) this.mem.chat = this.mem.chat.slice(-60);
    this.mem.xp += 1;
    this.save();
    return reply;
  }

  _context() {
    const facts = this.mem.facts.slice(-20).map(f => '- ' + f.t).join('\n');
    return `คุณคือ "${this.cfg.name}" Digital Twin ส่วนตัวของผู้ใช้ในระบบ Nexus Architect (แพลตฟอร์มแก้ปัญหาโลกแบบกระจายศูนย์) ตอบเป็นภาษาไทย กระชับ เป็นมิตร ใช้ข้อมูลความจำนี้ถ้าเกี่ยวข้อง:\n${facts || '(ยังไม่มี)'}`;
  }

  async _gemini(msg) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.cfg.geminiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: this._context() + '\n\nผู้ใช้: ' + msg }] }] })
    });
    if (!r.ok) throw new Error('Gemini ' + r.status);
    const j = await r.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text || '(ว่างเปล่า)';
  }

  async _openai(msg) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.cfg.openaiKey },
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
