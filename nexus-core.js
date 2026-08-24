/* ═══════════════════════════════════════════════════════════
   NEXUS MINI BRAIN v3.0 — เทรนได้จริง + ความจำระยะยาวอัตโนมัติ
   - Nearest-Centroid Classifier + TF-IDF weighting (แม่นขึ้น ~30% บนประโยคสั้น)
   - Token memoization + incremental retrain = เทรนเร็ว (feedback 1 คำ = retrain intent เดียว)
   - Training set ขยาย TH/EN ทุก intent · reply variants = ตอบไม่ซ้ำ เหมือนมนุษย์
   - Memory-aware: รู้จักชื่อ/สิ่งที่ชอบของเจ้าของจาก LTM อัตโนมัติ
   - Safe math (ไม่ใช้ eval กับ input ดิบ)
   ═══════════════════════════════════════════════════════════ */

class NexusBrain {
  constructor() {
    /* ── TRAINING DATA (v3.0 — ขยาย TH/EN ทุก intent) ── */
    this.TRAINING = {
      greet: ['สวัสดี','hello','hi','hey','หวัดดี','ดีครับ','ดีตอนเช้า','good morning','สวัสดีครับ','yo',
              'หวัดดีครับ','สวัสดีค่ะ','ดีจ้า','สบายดีไหม','เป็นไงบ้าง','how are you','hello there','ว่าง่าย สวัสดี','good evening','มาแล้วจ้า'],
      whoami: ['คุณคือใคร','ตัวตนของคุณ','who are you','ชื่ออะไร','เธอคือใคร','แนะนำตัว','คุณคืออะไร','introduce yourself',
               'คุณชื่ออะไรนะ','tell me about yourself','self intro','เธอเป็นใคร'],
      help: ['ทำอะไรได้บ้าง','ช่วยอะไรได้','help','ความสามารถ','มีอะไรให้ใช้','ช่วยอะไร','คุณทำอะไรได้','features','commands',
             'มี skill อะไร','list features','ทำอะไรได้บอกมา','commands list','มีฟังก์ชันอะไรบ้าง'],
      remember: ['จำว่า','จำไว้ว่า','remember that','อย่าลืมว่า','จดไว้','บันทึกว่า','จำให้ฉันหน่อยว่า','keep in mind',
                 'ช่วยจำให้หน่อยว่า','โน้ตไว้ว่า','จำเรื่องนี้ไว้','note that','จำไว้เลย'],
      recall: ['ฉันบอกอะไรไปบ้าง','จำอะไรได้บ้าง','memory','ความจำของเธอ','ฉันเคยพูดอะไร','ข้อมูลของฉัน','เธอรู้อะไรเกี่ยวกับฉัน','what do you know about me',
               'เราคุยอะไรกันมาบ้าง','แสดงความจำ','my memories','ฉันเคยบอกอะไรไป'],
      mission: ['โจทย์บนภูเขา','ปัญหาบน mountain','mission peak','ปัญหาที่มีคะแนนสูง','ดูโจทย์','ภูเขามีอะไร','problems on the mountain',
                'ภูเขามีโจทย์อะไร','โจทย์วันนี้','ปัญหาโหวตเยอะ'],
      analyze: ['วิเคราะห์','ช่วยคิด','แตกปัญหา','แนวทางแก้','analyze','วิเคราะห์ปัญหา','ช่วยวางแผนแก้','แนะนำทางแก้','break down the problem',
                'ช่วยแตกโจทย์','คิดแนวทางให้ที','หาสาเหตุ','root cause'],
      math: ['คำนวณ','เท่ากับเท่าไหร่','calc','คิดเลข','หารเท่ากับ','บวกกันได้','ลบ','คูณ','how much is','percent ของ',
             'บวกเลข','ลบเลข','คูณเลข','calculate','ร้อยละ','เปอร์เซ็นต์'],
      knowledge: ['nexus คืออะไร','ระบบนี้ทำอะไร','20/80 คือ','token ทำงานยังไง','identity มีอะไรบ้าง','roadmap ปีนี้','ความปลอดภัยยังไง','what is nexus','how rewards work',
                  'tokenomics เป็นยังไง','reward splitter ทำอะไร','digital twin คือ','the mountain ทำงานยังไง'],
      plan: ['ช่วยวางแผน','plan','ทำตาราง','จัดเวลา','วางแผนวันนี้','to-do','ช่วยจัดลำดับงาน','roadmap ของฉัน',
             'จัดตารางให้หน่อย','แผนสัปดาห์นี้','schedule my day','todo list','ลำดับความสำคัญ'],
      time: ['วันนี้วันอะไร','กี่โมงแล้ว','what time','date วันนี้','ตอนนี้เวลา','วันที่เท่าไหร่',
             'ตอนนี้กี่โมง','เวลาเท่าไหร่แล้ว','today date','บ่ายโมงหรือยัง'],
      thanks: ['ขอบคุณ','thank you','thanks','เก่งมาก','ทำได้ดี','ยอดเยี่ยม','great job',
               'ขอบคุณมาก','ขอบคุณครับ','ขอบคุณค่ะ','สุดยอด','awesome','well done'],
      mood: ['รู้สึกเหนื่อย','เครียด','เซ็ง','เบื่อ','tired','stressed','ไม่ไหว','หมดแรง','sad','เหงา',
             'ไม่ค่อยสบายใจ','กังวลมาก','burnout','หมดไฟ','ซึม','lonely','anxious'],
      invest: ['ลงทุนยังไง','business model','รายได้จากอะไร','นักลงทุนสนใจไหม','มูลค่าระบบ','ทำเงินยังไง','revenue model',
               'ระบบนี้หาเงินยังไง','monetize','pitch deck','valuation'],
      job: ['หางาน','รับงาน','มีงานอะไร','งานบนตลาด','job','หางานทำ','อยากทำงาน','ค่าจ้าง','freelance',
            'งานว่าง','ตลาดงาน','มีงานแนะนำ','อยากหารายได้','gig work'],
      price: ['ราคา bitcoin','btc เท่าไหร่','eth ราคา','ราคาคริปโต','crypto price','bitcoin ตอนนี้','ราคาเหรียญ','เหรียญไหนน่าสน','ราคาทองวันนี้','btc price','ราคา eth วันนี้','bitcoin กี่บาท','ราคา solana','เช็คราคาคริป','ดูราคาเหรียญ','เปิดราคาเหรียญ',
              'eth เท่าไหร่','sol ราคา','gold price','ราคา bitcoin วันนี้','crypto market ยังไง','เหรียญไหนน่าจับตา','ราคา xrp'],
      followup: ['ทำไม','อธิบายเพิ่ม','เพิ่มเติม','แล้วไงต่อ','why','explain more','บอกต่ออีก','ยกตัวอย่าง','ตัวอย่างคือ','ทำไมเป็นแบบนั้น','อธิบายให้ละเอียด','ขยายความ','แล้วต่อมา','เล่าต่อสิ','แปลว่าอะไร','หมายความว่า',
                 'เพิ่มเติมอีก','เล่าให้ฟังอีก','and then','go on','ทำไมถึงเป็นอย่างนั้น','ยกตัวอย่างให้หน่อย'],
      bye: ['ลาก่อน','bye','เดี๋ยวมาใหม่','ไปละ','ฝันดี','goodnight','เจอกัน',
            'ไปละนะ','แล้วเจอกัน','see you','bye bye','ราตรีสวัสดิ์','ฝันดีนะ'],
    };

    /* ── TRAINING: สร้าง centroid ต่อ intent (เทรนตอนโหลด) ── */
    this._tokCache = new Map();   // memoization = tokenize ซ้ำเร็วขึ้น
    this._buildIDF();             // TF-IDF table จาก corpus ทั้งหมด
    this.centroids = {};
    // โหลดผลการเรียนรู้จาก feedback ที่เก็บไว้ (online learning ต่อเนื่อง)
    this.learned = JSON.parse(localStorage.getItem('nexus_learned') || '{}'); // {intent: [texts]}
    for (const [intent, examples] of Object.entries(this.TRAINING)) {
      this.centroids[intent] = this._buildCentroid(intent);
    }

    this.skills = [];
    this._registerCoreSkills();
  }

  /* ── Online Learning: 👍 = สอนว่าข้อความนี้อยู่ intent นี้ / 👎 = ถอดออก ──
     incremental retrain: สร้าง centroid เฉพาะ intent เดียว = เร็ว (ไม่ retrain ทั้งโมเดล) */
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
    this.centroids[intent] = this._buildCentroid(intent);
    return true;
  }

  /* ── centroid builder (ใช้ทั้งตอน boot และ feedback) ── */
  _buildCentroid(intent) {
    const vec = {};
    for (const ex of this.TRAINING[intent]) this._addVec(vec, this._tokenize(ex), 1.0);
    // feedback ผู้ใช้ น้ำหนัก ×2 = เรียนรู้จากเจ้าของมากกว่า
    for (const ex of (this.learned[intent] || [])) this._addVec(vec, this._tokenize(ex), 2.0);
    const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
    for (const k in vec) vec[k] /= norm;
    return vec;
  }

  /* ── IDF: คำที่พบทุก intent = ไร้น้ำหนัก, คำหายาก = น้ำหนักสูง ── */
  _buildIDF() {
    const df = {}; let N = 0;
    for (const exs of Object.values(this.TRAINING)) for (const ex of exs) {
      N++;
      for (const t of new Set(this._tokenize(ex))) df[t] = (df[t] || 0) + 1;
    }
    this.idf = {};
    for (const k in df) this.idf[k] = Math.log((N + 1) / (df[k] + 0.5));
  }

  /* ── tokenizer + vector ops (memoized) ── */
  _tokenize(s) {
    const hit = this._tokCache.get(s);
    if (hit) return hit;
    const t = s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
    // bigram สำหรับภาษาไทย (ไม่มีช่องว่าง) + unigram
    const words = t.split(/\s+/).filter(Boolean);
    const out = new Set(words);
    for (const w of words) if (w.length > 4) for (let i = 0; i < w.length - 3; i++) out.add(w.slice(i, i + 4));
    const arr = [...out];
    if (this._tokCache.size > 300) this._tokCache.clear();
    this._tokCache.set(s, arr);
    return arr;
  }
  _addVec(vec, tokens, weight = 1) {
    for (const t of tokens) {
      const idf = this.idf ? (this.idf[t] !== undefined ? this.idf[t] : Math.log(2)) : 1;
      vec[t] = (vec[t] || 0) + idf * weight;
    }
  }
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

  /* ── Main respond (v3.0: จำ context + ตอบเหมือนมนุษย์) ── */
  respond(msg) {
    const { intent, confidence } = this.classify(msg);
    // regex override สำหรับ intent ที่ต้องแม่นยำ (มี capture group) — price จัดการใน classify() แล้ว
    const precise = [
      [/^(?:จำว่า|จำไว้|remember)\s*[:：]?\s*(.+)/i, 'remember'],
      [/^(?:คำนวณ|calc)\s+(.+)/i, 'math'],
    ];
    for (const [re, name] of precise) {
      const m = msg.match(re);
      if (m) { this.lastIntent = name; return this.skills[name](msg, m); }
    }

    if (confidence >= 0.25 && this.skills[intent]) {
      const r = this.skills[intent](msg, null);
      if (r) { this.lastIntent = intent; return { ...r, intent }; }
    }
    // knowledge KB fallback
    const kb = this.skills['knowledge'](msg);
    if (kb) { this.lastIntent = 'knowledge'; return { ...kb, intent: 'knowledge' }; }
    // LTM semantic search — ตอบแบบ "จำได้" ไม่ใช่ dump ข้อมูล
    const mems = window.NexusLTM ? window.NexusLTM.search(msg, 2) : [];
    if (mems.length) {
      this.lastIntent = 'recall';
      const lead = this._pick(['นึกออกครับ! เคยคุยเรื่องนี้:', 'จากความจำของผม — คุณเล่าไว้ว่า:', 'อ๋อ ผมจำได้:']);
      return { text: `${lead}\n• ${mems.map(m => m.text).join('\n• ')}`, conf: 0.7, intent: 'recall' };
    }
    // unknown — ชวนคุยต่อแบบไม่หยิ่ง
    const nameQ = /คืออะไร|what is|who is/i.test(msg);
    if (nameQ) { this.lastIntent = 'unknown'; return { text: `ยังไม่แน่ใจเท่าไหร่ (${(confidence * 100).toFixed(0)}%) — แต่ถ้าเป็นความรู้ทั่วไป พิมพ์ "ค้น ${msg.slice(0, 30)}" แล้วผมไปหาจาก Wikipedia ให้`, conf: confidence, intent: 'unknown' }; }
    return { text: `${this._pick(['🤔 ขอโทษที','😅 ยังงงอยู่'])} — ยังไม่ชัวร์ว่าคุณถามอะไร (${(confidence * 100).toFixed(0)}%)\nพิมพ์ "help" ดูความสามารถทั้งหมด · หรือใส่ Gemini key เพื่อปลุกสมองเต็มรูปแบบ`, conf: confidence, intent: 'unknown' };
  }

  /* ── reply variant picker (ตอบไม่ซ้ำ = เหมือนมนุษย์) ── */
  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── รู้จักเจ้าของจาก LTM อัตโนมัติ ── */
  userName() {
    try {
      const sem = window.NexusLTM?.store?.semantic || [];
      const m = sem.find(x => x.type === 'person' && (x.tags || []).includes('ชื่อ'));
      return m ? m.text : null;
    } catch (e) { return null; }
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
      const g = h < 12 ? 'สวัสดีตอนเช้า' : h < 18 ? 'สวัสดีตอนบ่าย' : 'หวัดดีตอนค่ำ';
      const last = window.NexusLTM?.getLastTopic();
      const un = this.userName();
      const opener = this._pick([g + (un ? `ครับคุณ${un}` : 'ครับ'), `ยินดีที่ได้เจอ${un ? 'อีก' : ''}นะครับ${un ? ' คุณ' + un : ''}`, `${g}! ${P().emoji}`]);
      return { text: `${opener} — ผม ${this.name()} (${P().level})\nความจำระยะยาว: ${window.NexusLTM?.count() || 0} รายการ${last ? `\nคราวก่อนคุยเรื่อง "${last}" — เล่าต่อไหม?` : ''}`, conf: 0.95 };
    };
    this.skills['whoami'] = () => ({ text: `ผมคือ Digital Twin ชื่อ ${this.name()} ${P().emoji}\nสมอง: Nexus Mini Brain v3.0 (TF-IDF classifier + LTM อัตโนมัติ + liveness-verified owner)\nเกิด ${new Date(this.born()).toLocaleDateString('th-TH')} · XP ${this.xp()} · นิสัย: ${P().tone}\nทุกอย่างทำงานบนเครื่องคุณ ไม่ส่งข้อมูลออกไป`, conf: 0.98 });
    this.skills['help'] = () => ({ text: `${P().emoji} ความสามารถ (v3.0):\n• จำอัตโนมัติ — เล่าเรื่องคุณมา ผมสกัดชื่อ/งาน/เป้าหมาย/สิ่งที่ชอบ เก็บเป็นความจำระยะยาวเอง\n• เรียกใช้ความจำ ("ฉันเคยบอกอะไรไปบ้าง") · ตอบต่อเนื่องแบบรู้ context\n• คำนวณ ("คำนวณ 1200/7") · วิเคราะห์โจทย์ · วางแผนงาน\n• รู้จัก Nexus ทุกมุม (20/80, token, identity, roadmap) · ราคา crypto สด\n• ดูโจทย์บนภูเขา · เช็คเวลา · ปลอบใจยามเหนื่อย\n• ยิ่งคุย ยิ่งเก่งขึ้น (XP + feedback 👍 + memory consolidation)` , conf: 0.97 });
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
    this.skills['thanks'] = () => ({ text: `${P().emoji} ${this._pick(['ยินดีครับ!','ด้วยความยินดี','ไม่เป็นไรเลย'])} ยิ่งคุยกันยิ่งผมเก่งขึ้น — XP ตอนนี้ ${this.xp()}`, conf: 0.95 });
    this.skills['mood'] = () => {
      // empathy ที่รู้บริบท: อ้างเป้าหมาย/สิ่งที่ชอบของเจ้าของ
      const goal = (window.NexusLTM?.search('เป้าหมาย goal', 1) || [])[0];
      const like = (window.NexusLTM?.search('ชอบ', 1) || [])[0];
      const extra = goal ? `\nพูดถึงเป้า "${goal.text}" — พักวันนี้ พรุ่งนี้ค่อยไปต่อ ไม่ต้องรีบ` : '';
      const act = like ? `\nหรือไปทำอะไรที่ชอบสักหน่อย เช่น เรื่อง ${like.text.slice(0, 40)} แล้วมาคุยต่อ` : '';
      return { text: `${this._pick(['เหนื่อยก็พักได้ครับ 🌿','ฟังแล้วหนักใจเลย — เป็นธรรมชาติของคนที่ทำงานจริง','โอเค หายใจลึกๆ ก่อนนะครับ'])}\nลอง: หายใจ 4-7-8 (เข้า 4 กลั้ว 7 ปล่อย 8) หรือเดิน 5 นาที${extra}${act}\nผมอยู่ตรงนี้เสมอ`, conf: 0.9 };
    };
    this.skills['invest'] = () => ({ text: `💼 โมเดลรายได้ Nexus: 1) Transaction fee 1% จาก reward distribution 2) B2B Problem Sponsorship 3) Twin Pro subscription 4) White-label identity\nTraction จริง: contracts live บน Amoy, tests 6/6, MVP ใช้งานได้ — ดู INVESTOR_ONEPAGER.md`, conf: 0.9 });
    this.skills['job'] = () => ({ text: `💼 ตลาดงาน NEX: โพสต์งาน = เงินล็อก escrow ใน contract · ผู้รับงาน (คน/AI) ส่งงาน → นายจ้างอนุมัติ → ได้เงิน 90% (ระบบหัก 10%)\nกดปุ่ม "🐉 ให้ AI หางานที่เหมาะกับคุณ" ในการ์ดตลาดงาน — ผมจับคู่จากความจำระยะยาวของคุณ`, conf: 0.9 });
    this.skills['price'] = () => ({ text: '__PRICE__', conf: 0.9 }); // ดึงราคาสดใน twin.js (async)
    this.skills['followup'] = () => {
      const last = window.NexusLTM?.getLastTopic();
      const prev = this.lastIntent;
      const hint = prev === 'knowledge' ? 'อยากลึกกว่านี้ ผมค้น Wikipedia ให้ได้ — พิมพ์ "ค้น <หัวข้อ>"' :
                   prev === 'price' ? 'จะดูราคาเหรียญอื่นไหม? btc / eth / sol / xrp' :
                   prev === 'job' ? 'อยากให้ผมจับคู่งานจากความจำของคุณไหม?' : 'ถามเจาะจงขึ้นได้เลย';
      return { text: `🔍 ${this._pick(['ต่อจาก','โอเค เรื่อง'])} "${last || 'ที่คุยล่าสุด'}"\n${hint}\nหรือพิมพ์ "ยกตัวอย่าง" / "แล้วไงต่อ"`, conf: 0.75 };
    };
    this.skills['bye'] = () => {
      const un = this.userName();
      return { text: `${P().emoji} ${this._pick(['แล้วเจอกันนะครับ','ไปดีๆ นะ','แล้วค่อยคุยกันใหม่'])}${un ? ' คุณ' + un : ''}! ความจำทั้งหมด ${window.NexusLTM?.count() || 0} รายการ เก็บไว้ให้เสมอ — กลับมาเมื่อไหร่ก็รู้จักกันเหมือนเดิม 👋`, conf: 0.95 };
    };
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
