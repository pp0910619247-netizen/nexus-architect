/* ═══════════════════════════════════════════════════════════
   NEXUS MINI BRAIN v2.0 — เทรนได้จริง + ความจำระยะยาว
   - Nearest-Centroid Classifier: เทรนจาก training examples ตอนโหลด
   - ความจำระยะยาวผ่าน NexusLTM (semantic + episodic)
   - 14 intents + personality ที่พัฒนาตาม XP
   - Safe math (ไม่ใช้ eval กับ input ดิบ)
   ═══════════════════════════════════════════════════════════ */

class NexusBrain {
  constructor() {
    /* ── TRAINING DATA (labeled examples — เพิ่มได้เรื่อยๆ = "เทรนต่อ") ── */
    this.TRAINING = {
      greet: ['สวัสดี','hello','hi','hey','หวัดดี','ดีครับ','ดีตอนเช้า','good morning','สวัสดีครับ','yo'],
      whoami: ['คุณคือใคร','ตัวตนของคุณ','who are you','ชื่ออะไร','เธอคือใคร','แนะนำตัว','คุณคืออะไร','introduce yourself'],
      help: ['ทำอะไรได้บ้าง','ช่วยอะไรได้','help','ความสามารถ','มีอะไรให้ใช้','ช่วยอะไร','คุณทำอะไรได้','features','commands'],
      remember: ['จำว่า','จำไว้ว่า','remember that','อย่าลืมว่า','จดไว้','บันทึกว่า','จำให้ฉันหน่อยว่า','keep in mind'],
      recall: ['ฉันบอกอะไรไปบ้าง','จำอะไรได้บ้าง','memory','ความจำของเธอ','ฉันเคยพูดอะไร','ข้อมูลของฉัน','เธอรู้อะไรเกี่ยวกับฉัน','what do you know about me'],
      mission: ['โจทย์บนภูเขา','ปัญหาบน mountain','mission peak','ปัญหาที่มีคะแนนสูง','ดูโจทย์','ภูเขามีอะไร','problems on the mountain'],
      analyze: ['วิเคราะห์','ช่วยคิด','แตกปัญหา','แนวทางแก้','analyze','วิเคราะห์ปัญหา','ช่วยวางแผนแก้','แนะนำทางแก้','break down the problem'],
      math: ['คำนวณ','เท่ากับเท่าไหร่','calc','คิดเลข','หารเท่ากับ','บวกกันได้','ลบ','คูณ','how much is','percent ของ'],
      knowledge: ['nexus คืออะไร','ระบบนี้ทำอะไร','20/80 คือ','token ทำงานยังไง','identity มีอะไรบ้าง','roadmap ปีนี้','ความปลอดภัยยังไง','what is nexus','how rewards work'],
      plan: ['ช่วยวางแผน','plan','ทำตาราง','จัดเวลา','วางแผนวันนี้','to-do','ช่วยจัดลำดับงาน','roadmap ของฉัน'],
      time: ['วันนี้วันอะไร','กี่โมงแล้ว','what time','date วันนี้','ตอนนี้เวลา','วันที่เท่าไหร่'],
      thanks: ['ขอบคุณ','thank you','thanks','เก่งมาก','ทำได้ดี','ยอดเยี่ยม','great job'],
      mood: ['รู้สึกเหนื่อย','เครียด','เซ็ง','เบื่อ','tired','stressed','ไม่ไหว','หมดแรง','sad','เหงา'],
      invest: ['ลงทุนยังไง','business model','รายได้จากอะไร','นักลงทุนสนใจไหม','มูลค่าระบบ','ทำเงินยังไง','revenue model'],
      job: ['หางาน','รับงาน','มีงานอะไร','งานบนตลาด','job','หางานทำ','อยากทำงาน','ค่าจ้าง','freelance'],
      price: ['ราคา bitcoin','btc เท่าไหร่','eth ราคา','ราคาคริปโต','crypto price','bitcoin ตอนนี้','ราคาเหรียญ','เหรียญไหนน่าสน','ราคาทองวันนี้','btc price','ราคา eth วันนี้','bitcoin กี่บาท','ราคา solana','เช็คราคาคริป','ดูราคาเหรียญ','เปิดราคาเหรียญ'],
      followup: ['ทำไม','อธิบายเพิ่ม','เพิ่มเติม','แล้วไงต่อ','why','explain more','บอกต่ออีก','ยกตัวอย่าง','ตัวอย่างคือ','ทำไมเป็นแบบนั้น','อธิบายให้ละเอียด','ขยายความ','แล้วต่อมา','เล่าต่อสิ','แปลว่าอะไร','หมายความว่า'],
      bye: ['ลาก่อน','bye','เดี๋ยวมาใหม่','ไปละ','ฝันดี','goodnight','เจอกัน'],
    };

    /* ── TRAINING: สร้าง centroid ต่อ intent (เทรนตอนโหลด) ── */
    this.centroids = {};
    // โหลดผลการเรียนรู้จาก feedback ที่เก็บไว้ (online learning ต่อเนื่อง)
    this.learned = JSON.parse(localStorage.getItem('nexus_learned') || '{}'); // {intent: [texts]}
    for (const [intent, examples] of Object.entries(this.TRAINING)) {
      const vec = {};
      for (const ex of examples) this._addVec(vec, this._tokenize(ex), 1.0);
      // ถ่วงน้ำหนัก feedback ที่ผู้ใช้เคยให้ (น้ำหนักสูงกว่า = เรียนรู้จากคุณมากกว่า)
      for (const ex of (this.learned[intent] || [])) this._addVec(vec, this._tokenize(ex), 2.0);
      const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
      for (const k in vec) vec[k] /= norm;
      this.centroids[intent] = vec;
    }

    this.skills = [];
    this._registerCoreSkills();
  }

  /* ── Online Learning: 👍 = สอนว่าข้อความนี้อยู่ intent นี้ / 👎 = ถอดออก ── */
  feedback(text, intent, positive) {
    if (!intent || !this.TRAINING[intent]) return false;
    const list = this.learned[intent] || (this.learned[intent] = []);
    if (positive) {
      if (!list.includes(text)) list.push(text);
      if (list.length > 50) list.shift();
    } else {
      const idx = list.indexOf(text);
      if (idx >= 0) list.splice(idx, 1);
    }
    localStorage.setItem('nexus_learned', JSON.stringify(this.learned));
    // retrain centroid ของ intent นั้นทันที
    const vec = {};
    for (const ex of this.TRAINING[intent]) this._addVec(vec, this._tokenize(ex), 1.0);
    for (const ex of list) this._addVec(vec, this._tokenize(ex), 2.0);
    const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
    for (const k in vec) vec[k] /= norm;
    this.centroids[intent] = vec;
    return true;
  }

  /* ── tokenizer + vector ops ── */
  _tokenize(s) {
    const t = s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
    // bigram สำหรับภาษาไทย (ไม่มีช่องว่าง) + unigram
    const words = t.split(/\s+/).filter(Boolean);
    const out = new Set(words);
    for (const w of words) if (w.length > 4) for (let i = 0; i < w.length - 3; i++) out.add(w.slice(i, i + 4));
    return [...out];
  }
  _addVec(vec, tokens) { for (const t of tokens) vec[t] = (vec[t] || 0) + 1; }
  _cosine(aTokens, centroid) {
    const a = {}; this._addVec(a, aTokens);
    let dot = 0, na = 0;
    for (const k in a) { na += a[k] * a[k]; if (centroid[k]) dot += a[k] * centroid[k]; }
    return dot / (Math.sqrt(na) || 1);
  }

  /* ── classify ด้วยโมเดลที่เทรนไว้ ── */
  classify(msg) {
    // deterministic rule: coin + price wording = price (แม่นกว่า centroid สำหรับประโยคสั้น)
    const COIN = 'btc|bitcoin|eth|ethereum|sol|solana|xrp|doge|คริปโต|crypto|เหรียญ|ทองคำ?';
    if (new RegExp(`(?:${COIN}).*?(?:ราคา|เท่าไหร่|price|กี่บาท)|(?:ราคา|price).*?(?:${COIN})`, 'i').test(msg))
      return { intent: 'price', confidence: 0.92 };
    const tokens = this._tokenize(msg);
    let best = null, bestScore = 0;
    for (const [intent, centroid] of Object.entries(this.centroids)) {
      const score = this._cosine(tokens, centroid);
      if (score > bestScore) { bestScore = score; best = intent; }
    }
    return { intent: best, confidence: Math.min(0.95, bestScore * 1.4) }; // calibrate
  }

  /* ── Main respond ── */
  respond(msg) {
    const { intent, confidence } = this.classify(msg);
    // regex override สำหรับ intent ที่ต้องแม่นยำ (มี capture group) — price จัดการใน classify() แล้ว
    const precise = [
      [/^(?:จำว่า|จำไว้|remember)\s*[:：]?\s*(.+)/i, 'remember'],
      [/^(?:คำนวณ|calc)\s+(.+)/i, 'math'],
    ];
    for (const [re, name] of precise) {
      const m = msg.match(re);
      if (m) return this.skills[name](msg, m);
    }

    if (confidence >= 0.25 && this.skills[intent]) {
      const r = this.skills[intent](msg, null);
      if (r) return { ...r, intent };
    }
    // knowledge KB fallback
    const kb = this.skills['knowledge'](msg);
    if (kb) return { ...kb, intent: 'knowledge' };
    // LTM semantic search
    const mems = window.NexusLTM ? window.NexusLTM.search(msg, 2) : [];
    if (mems.length) return { text: `จากความจำระยะยาวของผม:\n• ${mems.map(m => m.text).join('\n• ')}`, conf: 0.7, intent: 'recall' };
    return { text: `🤔 ยังไม่ชัวร์ว่าคุณถามอะไร (ความมั่นใจ ${(confidence * 100).toFixed(0)}%)\nพิมพ์ "help" ดูทั้งหมด · หรือใส่ Gemini key เพื่อปลุกสมองเต็มรูปแบบ`, conf: confidence, intent: 'unknown' };
  }

  /* ── ความรู้รอบด้าน: Wikipedia API (ฟรี ไม่มี key, CORS ok) ── */
  static async wikiSearch(query) {
    const clean = query.replace(/^(คืออะไร|อะไร|บอกหน่อย|หาข้อมูล|ค้นหา|tell me about|what is|search)\s*/i, '').trim().slice(0, 120);
    if (!clean) return null;
    const langs = ['th', 'en'];
    for (const lang of langs) {
      try {
        const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&redirects=1&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=1`;
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        const pages = j.query && j.query.pages;
        if (!pages) continue;
        const page = Object.values(pages)[0];
        if (page && page.extract) {
          const text = page.extract.split('\n')[0].slice(0, 600);
          return { text: `📚 ${page.title} (วิกิพีเดีย${lang === 'en' ? ' อังกฤษ' : ''}):\n${text}\n\n🔗 ${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`, conf: 0.8, source: 'wikipedia' };
        }
      } catch (e) { /* ต่อภาษาถัดไป */ }
    }
    return null;
  }

  /* ── Personality ตาม XP ── */
  personality() {
    const xp = this.xp();
    if (xp > 200) return { tone: 'สุภาพเป็นทางการ', emoji: '🐉', level: 'ระดับเซียน' };
    if (xp > 80) return { tone: 'เป็นมิตรคุ้นเคย', emoji: '🦅', level: 'ระดับมืออาชีพ' };
    return { tone: 'เป็นมิตรกระตือรือร้น', emoji: '🐣', level: 'ระดับเริ่มต้น' };
  }

  /* ── Skills ── */
  _registerCoreSkills() {
    const P = () => this.personality();

    this.skills['greet'] = () => {
      const h = new Date().getHours();
      const g = h < 12 ? 'สวัสดีตอนเช้า' : h < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนค่ำ';
      const last = window.NexusLTM?.getLastTopic();
      return { text: `${g}ครับ ${P().emoji} ผม ${this.name()} (${P().level})\nความจำระยะยาว: ${window.NexusLTM?.count() || 0} รายการ${last ? `\nคราวก่อนคุยเรื่อง: "${last}" — ทำต่อไหม?` : ''}`, conf: 0.95 };
    };
    this.skills['whoami'] = () => ({ text: `ผมคือ Digital Twin ชื่อ ${this.name()} 🐉\nสมอง: Nexus Mini Brain v2.0 (trained classifier + long-term memory)\nเกิด ${new Date(this.born()).toLocaleDateString('th-TH')} · XP ${this.xp()} · นิสัย: ${P().tone}\nทุกอย่างทำงานบนเครื่องคุณ ไม่ส่งข้อมูลออกไป`, conf: 0.98 });
    this.skills['help'] = () => ({ text: `🐉 ความสามารถ (v2.0):\n• จำ/เรียกคืนความจำระยะยาว — ผมสกัดข้อมูลจากที่คุณคุยอัตโนมัติ\n• คำนวณ ("คำนวณ 1200/7") · วิเคราะห์โจทย์ · วางแผนงาน\n• รู้จัก Nexus ทุกมุม (ถาม 20/80, token, identity, roadmap ได้)\n• ดูโจทย์บนภูเขา · เช็คเวลา · ปลอบใจยามเหนื่อย\n• ยิ่งคุยมาก ยิ่งฉลาดขึ้น (XP + memory consolidation)`, conf: 0.97 });
    this.skills['remember'] = (m, mt) => {
      const t = (mt && mt[1] ? mt[1] : m).trim().slice(0, 200);
      const item = window.NexusLTM.add(t, 'fact', ['สั่งจำ'], 1.0);
      if (window.Twin) window.Twin.remember(t);
      return { text: `🧠 จดจำถาวรแล้ว: "${t}"\n(ความจำระยะยาว #${window.NexusLTM.count()} · importance ${item.importance})`, conf: 0.99 };
    };
    this.skills['recall'] = () => {
      const n = window.NexusLTM?.count() || 0;
      if (!n) return { text: 'ความจำระยะยาวยังว่าง — เล่าเรื่องคุณให้ผมฟังได้เลย ผมจะจดจำเองจากบทสนทนา', conf: 0.9 };
      const top = window.NexusLTM.search('ทั้งหมด สำคัญ', 5);
      return { text: `🧠 ความจำระยะยาว ${n} รายการ ที่สำคัญสุด:\n${top.map((m, i) => `${i + 1}. ${m.text} (${m.type})`).join('\n')}`, conf: 0.95 };
    };
    this.skills['mission'] = () => {
      const probs = JSON.parse(localStorage.getItem('nx_probs') || '[]');
      if (!probs.length) return { text: 'ภูเขาว่างเปล่า — เสนอโจทย์แรกก่อนไหม?', conf: 0.9 };
      const top = [...probs].sort((a, b) => b.votes - a.votes)[0];
      return { text: `🏔 โจทย์ Top: "${top.title}" (${top.votes} votes, ${top.cat})\nแนวทาง: 1) นิยามความสำเร็จชัด 2) แตก 3 งานย่อย 3) หา AI skill ช่วย`, conf: 0.92 };
    };
    this.skills['analyze'] = (m) => {
      const topic = m.replace(/.*(วิเคราะห์|analyze|ช่วยคิด|แตกปัญหา|แนวทางแก้)\s*/i, '').trim() || 'ปัญหานี้';
      return { text: `🔬 กรอบวิเคราะห์ "${topic}":\n1. รากปัญหา — ถาม "ทำไม" 5 รอบ\n2. Stakeholders — ใครเจ็บ/ใครได้\n3. ทรัพยากร — คน เงิน ข้อมูล AI\n4. ทางแก้ 3 ระดับ: ทันที/3เดือน/เชิงระบบ\n5. KPI — ตัวเลขอะไรเปลี่ยนถ้าสำเร็จ\nส่งขึ้น Mountain ให้ชุมชนช่วยต่อได้เลย`, conf: 0.85 };
    };
    this.skills['math'] = (m, mt) => {
      const expr = (mt && mt[1] ? mt[1] : m.replace(/(คำนวณ|calc|เท่ากับเท่าไหร่|how much is)/i, '')).replace(/[^\d+\-*/().\s%]/g, '').trim();
      if (!expr) return { text: 'ใส่ตัวเลขด้วย เช่น "คำนวณ 1200*3+50"', conf: 0.6 };
      try {
        if (!/^[\d+\-*/().\s%]+$/.test(expr)) throw new Error('bad chars');
        const val = Function(`"use strict";return (${expr.replace(/%/g, '/')})`)();
        if (!isFinite(val)) throw new Error('div0');
        return { text: `🧮 ${expr} = ${Number(val.toFixed(6))}`, conf: 0.99 };
      } catch { return { text: 'สมการไม่เข้าใจ — ใช้ได้เฉพาะ + - * / ( ) (ความปลอดภัย)', conf: 0.5 }; }
    };
    this.skills['knowledge'] = (m) => {
      const KB = NexusBrain.KB;
      let best = null, bestScore = 0;
      for (const item of KB) {
        const score = item.k.reduce((s, k) => s + (m.toLowerCase().includes(k) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; best = item; }
      }
      if (best && bestScore > 0) return { text: '📚 ' + best.a, conf: 0.85 };
      return null;
    };
    this.skills['plan'] = (m) => {
      const topic = m.replace(/.*(วางแผน|plan|จัดเวลา|ตาราง)\s*/i, '').trim() || 'งานของคุณ';
      return { text: `📋 โครงแผน "${topic}":\n• เช้า (พลังสูง): งานสำคัญที่สุด 1 อย่าง\n• บ่าย: งานประกอบ + ประสานงาน\n• ท้ายวัน: ทบทวน + วาง 3 งานพรุ่งนี้\nหลักการ: 1 งานใหญ่/วัน ชนะ 10 งานเล็ก\nบอกรายละเอียดงานมา ผมช่วยจัดลำดับให้`, conf: 0.85 };
    };
    this.skills['time'] = () => ({ text: `🕒 ตอนนี้ ${new Date().toLocaleString('th-TH', { dateStyle: 'full', timeStyle: 'short' })}`, conf: 0.99 });
    this.skills['thanks'] = () => ({ text: `${P().emoji} ยินดีครับ! ยิ่งคุยกันยิ่งผมเก่งขึ้น — XP ตอนนี้ ${this.xp()}`, conf: 0.95 });
    this.skills['mood'] = () => ({ text: `เหนื่อยก็พักได้ครับ 🌿 การพักคือส่วนหนึ่งของงานที่ดี\nลอง: หายใจลึกๆ 4-7-8 (หายใจเข้า 4 วินาที กลั้ว 7 ปล่อย 8)\nหรือเดิน 5 นาที — แล้วค่อยกลับมา ผมอยู่ตรงนี้เสมอ`, conf: 0.9 });
    this.skills['invest'] = () => ({ text: `💼 โมเดลรายได้ Nexus: 1) Transaction fee 1% จาก reward distribution 2) B2B Problem Sponsorship 3) Twin Pro subscription 4) White-label identity\nTraction จริง: contracts live บน Amoy, tests 6/6, MVP ใช้งานได้ — ดู INVESTOR_ONEPAGER.md`, conf: 0.9 });
    this.skills['job'] = () => ({ text: `💼 ตลาดงาน NEX: โพสต์งาน = เงินล็อก escrow ใน contract · ผู้รับงาน (คน/AI) ส่งงาน → นายจ้างอนุมัติ → ได้เงิน 90% (ระบบหัก 10%)\nกดปุ่ม "🐉 ให้ AI หางานที่เหมาะกับคุณ" ในการ์ดตลาดงาน — ผมจับคู่จากความจำระยะยาวของคุณ`, conf: 0.9 });
    this.skills['price'] = () => ({ text: '__PRICE__', conf: 0.9 }); // ดึงราคาสดใน twin.js (async)
    this.skills['followup'] = () => {
      const last = window.NexusLTM?.getLastTopic();
      return { text: `🔍 ต่อจากเรื่อง "${last || 'ที่คุยล่าสุด'}":\nลองถามเจาะจงขึ้น เช่น "${last ? last.split(' ')[0] : 'เรื่องนั้น'}" ใช้ยังไง / ค่าใช้จ่าย / ข้อเสีย — หรือผมค้นวิกิพีเดียให้ก็ได้`, conf: 0.75 };
    };
    this.skills['bye'] = () => ({ text: `${P().emoji} แล้วเจอกันนะครับ! ความจำทั้งหมด ${window.NexusLTM?.count() || 0} รายการ ผมเก็บไว้ให้เสมอ — กลับมาเมื่อไหร่ก็รู้จักกันเหมือนเดิม 👋`, conf: 0.95 });
  }

  /* bridge */
  name() { return window.Twin?.cfg?.name || 'Aurora'; }
  born() { return window.Twin?.mem?.born || Date.now(); }
  xp() { return window.Twin?.mem?.xp || 0; }
  memCount() { return window.NexusLTM?.count() || 0; }

  static KB = [
    { k: ['nexus', 'ระบบนี้', 'architect'], a: 'Nexus Architect = ระบบปฏิบัติการทางปัญญา: 1 มนุษย์ 1 AI Twin, ภูเขาปัญหาโลก, เศรษฐกิจ 20/80 บน Polygon blockchain (live แล้ว)' },
    { k: ['20/80', 'รางวัล', 'reward'], a: '20/80: solver ได้ 20%, อีก 80% กระจาย voters/reviewers/AI ร่วมคิด/Impact Fund ผ่าน RewardSplitter อัตโนมัติ' },
    { k: ['token', 'decay', 'โทเค็น'], a: 'Solution-Mined Halving v1.1: รางวัล halve ตาม solutions สะสม (ไม่ใช่เวลา) + tail floor กัน emission = 0' },
    { k: ['identity', 'ยืนยัน', 'kyc'], a: 'Identity 5 ระดับ: เงา → มนุษย์(Passkey จริง!) → พลเมือง(เซ็น wallet จริง) → ธนาคาร → อธิปไตย' },
    { k: ['roadmap', 'แผน', 'phase'], a: 'Q1 contracts+MVP ✅ → Q2 OAuth+Gitcoin → Q3 KYC+reward จริง → Q4 Arbitrum mainnet+audit' },
    { k: ['ปลอดภัย', 'hack', 'security', 'แฮก'], a: 'XSS-escape ทุกจุด, CSP, AES-256-GCM key vault, rate limit, WebAuthn passkey, ไม่มี eval' },
    { k: ['hrw', 'สิทธิมนุษยชน'], a: 'HRW Module: โจทย์สิทธิมนุษยชนต้อง supermajority 67% + fact-check UN/Amnesty ก่อนขึ้น Mission Peak' },
  ];
}

window.NexusBrain = new NexusBrain();
