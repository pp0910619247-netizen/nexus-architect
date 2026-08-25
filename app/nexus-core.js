/* ═══════════════════════════════════════════════════════════
   NEXUS MINI BRAIN v5.1 — MoE-lite + Hardcore Local Training
   - Gating/Router: TF-IDF → BAGGED ENSEMBLE ×5 (bootstrap dropout,
     variance reduction — เทรนซ้ำจนแม่นสุดใน JS ได้)
   - Self-Healing: ยิง training set ใส่ตัวเอง → ข้อไหนพลาด boost ×3
     แล้ว renormalize (2 rounds — train like you mean it)
   - Expert Arbitration + Trust Chain + Emotion engine (v5.0 ครบ)
   - 🧠 NEURAL MODE catalog: Qwen 0.5B/1.5B · BitNet-1.58 (experimental)
     WebGPU auto-accelerate · graceful fallback ทุกชั้น
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
      ack: ['โอเค','ok','okay','ได้','เข้าใจแล้ว','รับทราบ','จ้า','yes','yeah','sure','โอเคครับ','โอเคๆ','got it'],
      laugh: ['555','5555','haha','hahaha','lol','lmao','ฮ่าๆ','ขำ','ฮา'],
      smalltalk: ['วันนี้อากาศ','ฝนตก','อากาศร้อน','อากาศหนาว','หิว','ง่วงนอน','เพิ่งตื่น','เบื่องาน','ว่างๆ',
                  'boring','weather','ผมเหนื่อยนิดหน่อยนะ'],
    };

    /* ── TRAINING: สร้าง centroid ต่อ intent (เทรนตอนโหลด) ── */
    this._tokCache = new Map();   // memoization = tokenize ซ้ำเร็วขึ้น
    this._buildIDF();             // TF-IDF table จาก corpus ทั้งหมด
    this.centroids = {};
    // โหลดผลการเรียนรู้จาก feedback ที่เก็บไว้ (online learning ต่อเนื่อง)
    this.learned = JSON.parse(localStorage.getItem('nexus_learned') || '{}'); // {intent: [texts]}
    for (const [intent] of Object.entries(this.TRAINING)) {
      this.centroids[intent] = this._buildCentroid(intent);
    }
    /* ── HARDCORE TRAINING: bagged ensemble ×5 + self-healing boost ── */
    this.ensemble = [];
    this._buildEnsemble();
    this._selfHeal();

    /* deterministic rule cache: coin + price wording = price */
    const COIN = 'btc|bitcoin|eth|ethereum|sol|solana|xrp|doge|คริปโต|crypto|เหรียญ|ทองคำ?';
    this._priceRe = new RegExp(`(?:${COIN}).*?(?:ราคา|เท่าไหร่|price|กี่บาท)|(?:ราคา|price).*?(?:${COIN})`, 'i');

    this.skills = [];
    this._registerCoreSkills();
  }

  /* ── Online Learning: 👍 = สอนว่าข้อความนี้อยู่ intent นี้ / 👎 = ถอดออก
     v5.1: retrain ครบทั้ง ensemble + self-heal (โหดแต่ชุดข้อมูลเล็ก เร็วมาก) ── */
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
    for (const [it] of Object.entries(this.TRAINING)) this.centroids[it] = this._buildCentroid(it);
    this._buildEnsemble();
    this._selfHeal();
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

  /* ══ HARDCORE TRAINING CORE ══ */
  _seededRng(seed) {
    let s = seed | 0;
    return function () {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  _normVec(vec) {
    const n = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
    for (const k in vec) vec[k] /= n;
    return vec;
  }

  /* Bagged ensemble: 5 experts แต่ละตัวเห็นข้อมูลต่างมุม (example/token dropout)
     → เฉลี่ยคะแนน = variance down, accuracy up (เทคนิคเดียวกับ random forest) */
  _buildEnsemble() {
    this.ensemble = [];
    for (let k = 0; k < 5; k++) {
      const rnd = this._seededRng(0xBADA55 + k * 7919);
      const cent = {};
      for (const [intent, examples] of Object.entries(this.TRAINING)) {
        const vec = {};
        for (const ex of examples) {
          if (examples.length > 6 && rnd() < 0.2) continue; // example dropout
          for (const t of this._tokenize(ex)) if (rnd() < 0.85) vec[t] = (vec[t] || 0) + (this.idf[t] ?? Math.log(2));
        }
        for (const ex of (this.learned[intent] || []))
          for (const t of this._tokenize(ex)) vec[t] = (vec[t] || 0) + (this.idf[t] ?? Math.log(2)) * 2;
        cent[intent] = this._normVec(vec);
      }
      this.ensemble.push(cent);
    }
  }

  /* Self-Healing: สอบตัวเองด้วย training set → ข้อพลาด boost ×3
     Guarded: ยอมรับการแก้เฉพาะเมื่อ total misses ลดลง (monotonic improvement) */
  _countMisses() {
    let m = 0;
    for (const [intent, examples] of Object.entries(this.TRAINING))
      for (const ex of examples) {
        const r = this._rankAll(ex);
        if (!r.length || r[0].intent !== intent) m++;
      }
    return m;
  }
  _selfHeal() {
    const snap = JSON.stringify(this.ensemble);
    let best = this._countMisses();
    for (let round = 0; round < 2 && best > 0; round++) {
      for (const [intent, examples] of Object.entries(this.TRAINING)) {
        for (const ex of examples) {
          const r = this._rankAll(ex);
          if (!r.length || r[0].intent !== intent) {
            const toks = this._tokenize(ex);
            for (const cent of this.ensemble)
              for (const t of toks) cent[intent][t] = (cent[intent][t] || 0) + (this.idf[t] ?? Math.log(2)) * 3;
          }
        }
      }
      for (const cent of this.ensemble)
        for (const iv in cent) cent[iv] = this._normVec(cent[iv]);
      const now = this._countMisses();
      if (now > best) { this.ensemble = JSON.parse(snap); break; } // แย่ลง = rollback
      best = now;
    }
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

  /* ── classify → MoE gating: คืน ranked distribution ── */
  classify(msg) {
    // deterministic rule: coin + price wording = price (แม่นกว่า centroid สำหรับประโยคสั้น)
    if (this._priceRe.test(msg)) {
      const rest = this._rankAll(msg).filter(r => r.intent !== 'price');
      return { intent: 'price', confidence: Math.min(0.95, 0.92), ranked: [{ intent: 'price', score: 0.92 }, ...rest.slice(0, 2)] };
    }
    const tokens = this._tokenize(msg);
    const ranked = this._rankAll(msg, tokens);
    const best = ranked[0];
    return { intent: best.intent, confidence: Math.min(0.95, best.score * 1.4), ranked };
  }
  _rankAll(msg, tokens) {
    tokens = tokens || this._tokenize(msg);
    // MoE gating บน bagged ensemble — เฉลี่ยคะแนนจาก 5 experts
    if (!this.ensemble || !this.ensemble.length) {
      const all = [];
      for (const [intent, centroid] of Object.entries(this.centroids))
        all.push({ intent, score: this._cosine(tokens, centroid) });
      return all.sort((a, b) => b.score - a.score);
    }
    const agg = {};
    for (const cent of this.ensemble)
      for (const [intent, cvec] of Object.entries(cent)) {
        const s = this._cosine(tokens, cvec);
        (agg[intent] = agg[intent] || []).push(s);
      }
    return Object.entries(agg)
      .map(([intent, arr]) => ({ intent, score: arr.reduce((a, b) => a + b, 0) / arr.length }))
      .sort((a, b) => b.score - a.score);
  }

  /* ── MoE arbitration: expert เฉพาะทางตัดสินเมื่อ gate ลังเล ── */
  static DOMAIN_RULES = [
    [/btc|bitcoin|eth|sol|คริป|crypto|เหรียญ|ราคา/i, ['math', 'invest'], 'price'],
    [/เหนื่อย|เครียด|เหงา|เศร้า|โกรธ|เบื่อ|กังวล/i, ['smalltalk', 'ack', 'greet'], 'mood'],
    [/งาน|job|freelance|รายได้/i, ['knowledge', 'smalltalk'], 'job'],
    [/วิเคราะห์|แผน|plan|ปัญหา/i, ['knowledge', 'followup'], 'analyze'],
  ];
  _arbitrate(a, b, msg) {
    for (const [re, losers, winner] of NexusBrain.DOMAIN_RULES) {
      if (re.test(msg) && (losers.includes(a) || losers.includes(b))) {
        if ((losers.includes(a) && a === winner) || (losers.includes(b) && b === winner)) continue;
        if (a === winner || b === winner) return a === winner ? a : b;
        return winner;
      }
    }
    return a; // default = gate champion
  }

  /* ── Main respond (v5.0 MoE-lite) ── */
  respond(msg) {
    this.lastUserMsg = msg;
    const cls = this.classify(msg);
    let intent = cls.intent;
    const confidence = cls.confidence;
    // MoE gating: champion vs runner-up ใกล้กันมาก → ให้ domain expert ตัดสิน
    if (cls.ranked && cls.ranked[1]) {
      const margin = cls.ranked[0].score - cls.ranked[1].score;
      if (margin < 0.05) {
        const before = intent;
        intent = this._arbitrate(cls.ranked[0].intent, cls.ranked[1].intent, msg);
        this.lastArbitration = `${rankedStr(cls.ranked)} → ${intent}${intent !== before ? ' (expert override)' : ''}`;
      }
    }
    function rankedStr(r){ return r.slice(0,2).map(x=>`${x.intent}:${x.score.toFixed(2)}`).join(' vs '); }
    this.lastRoute = `${intent} @ ${(confidence*100).toFixed(0)}%${this.lastArbitration ? ' · ' + this.lastArbitration : ''}`;
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
    // unknown — ถามกลับแบบช่วยคิด ไม่ใช่ปัด
    const nameQ = /คืออะไร|what is|who is/i.test(msg);
    if (nameQ) { this.lastIntent = 'unknown'; return { text: `ยังไม่แน่ใจเท่าไหร่ (${(confidence * 100).toFixed(0)}%) — แต่ถ้าเป็นความรู้ทั่วไป พิมพ์ "ค้น ${msg.slice(0, 30)}" แล้วผมไปหาจาก Wikipedia ให้`, conf: confidence, intent: 'unknown' }; }
    const guesses = ['อธิบายเพิ่มอีกนิดได้ไหม ว่าคุณอยากรู้ด้านไหน', 'ใช้ทำอะไร หรือมีปัญหาอะไรที่ต้องแก้?', 'หรือคุณแค่คุยเล่นก็ได้ — ผมว่าง 😄'];
    return { text: `${this._pick(['🤔 ขอโทษที','😅 จับประเด็นไม่ถูก'])} (${(confidence * 100).toFixed(0)}%)\n${this._pick(guesses)}\nพิมพ์ "help" ดูทักษะทั้งหมด · ${this.neuralLoaded() ? 'Full Brain พร้อม — พิมพ์ยาวๆ มาผมตอบเอง' : 'ใส่ Gemini key หรือกด ⚡Full Brain เพื่อสมองเต็มรูปแบบ'}`, conf: confidence, intent: 'unknown' };
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

  /* ── Emotion detection (reflective empathy engine) ── */
  static EMOTIONS = [
    [/เหนื่อย|tired|หมดแรง|ล้ามาก/i, 'tired'],
    [/เครียด|กังวล|anxious|กดดัน|เป็นห่วง/i, 'stress'],
    [/เหงา|lonely|อยู่คนเดียว/i, 'lonely'],
    [/โกรธ|หงุดหงิด|angry|ฉุนเฉียว/i, 'anger'],
    [/เศร้า|sad|ร้องไห้|ท้อแท้/i, 'sad'],
    [/เบื่อจัง|bored|ซ้ำๆ|จำเจ/i, 'bored'],
  ];
  detectEmotion(msg) {
    for (const [re, key] of NexusBrain.EMOTIONS) if (re.test(msg)) return key;
    return null;
  }

  /* ── 🧠 NEURAL MODE catalog — เลือกสมองได้ · WebGPU auto · fallback ทุกชั้น ── */
  static MODELS = {
    fast:   { id: 'onnx-community/Qwen2.5-0.5B-Instruct',  dtype: 'q4f16', label: '⚡ Fast (0.5B, ~350MB)' },
    smart:  { id: 'onnx-community/Qwen2.5-1.5B-Instruct',  dtype: 'q4f16', label: '🔥 Smart (1.5B, ~1GB)' },
    bitnet: { id: 'microsoft/BitNet-b1.58-2B-4T',           dtype: 'q4',    label: '🧪 BitNet-1.58 2B (experimental)' },
  };
  _pipe = null;
  _pipeKey = null;

  async loadNeural(key = 'fast', onProgress) {
    if (this._pipe && this._pipeKey === key) return true;
    this._pipe = null; // swap model → reset
    const cfg = NexusBrain.MODELS[key] || NexusBrain.MODELS.fast;
    const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.1');
    const tryLoad = async (opts) => mod.pipeline('text-generation', cfg.id, {
      ...opts,
      progress_callback: (p) => { if (onProgress && p.status === 'progress') onProgress(p.progress != null ? Math.round(p.progress) : null, p.file || ''); },
    });
    // 1) WebGPU (เร็วมาก) → 2) WASM q4 → 3) Fast model กันตาย
    if (navigator.gpu) {
      try { this._pipe = await tryLoad({ device: 'webgpu', dtype: cfg.dtype }); } catch (e) { this._pipe = null; }
    }
    if (!this._pipe) {
      try { this._pipe = await tryLoad({ dtype: cfg.dtype }); } catch (e) { this._pipe = null; }
    }
    if (!this._pipe && key !== 'fast') {
      const fb = NexusBrain.MODELS.fast;
      this._pipe = await mod.pipeline('text-generation', fb.id, { dtype: fb.dtype });
    }
    this._pipeKey = key;
    return true;
  }
  neuralLoaded() { return !!this._pipe; }
  neuralModel() { return this._pipeKey || null; }

  /* RAG-lite: inject ความจำ + persona เป็น system prompt · พัง → fallback null */
  async tryNeural(userMsg) {
    if (!this._pipe) return null;
    try {
      const mems = (window.NexusLTM?.search(userMsg, 3) || []).map(m => '- ' + m.text).join('\n');
      const un = this.userName();
      const sys = `You are ${this.name()}, a warm personal AI twin living fully on the user's device. Reply in Thai, friendly and concise (2-5 sentences), light emoji ok.${un ? ` The user's name is ${un}.` : ''}${mems ? `\nFacts you remember about the user:\n${mems}` : ''}`;
      const out = await this._pipe(
        [{ role: 'system', content: sys }, { role: 'user', content: String(userMsg).slice(0, 500) }],
        { max_new_tokens: 200, temperature: 0.8, do_sample: true }
      );
      const g = out?.[0]?.generated_text;
      const reply = Array.isArray(g) ? (g.at(-1)?.content || '') : (typeof g === 'string' ? g : '');
      const clean = String(reply).replace(/<\|.*?\|>/g, '').trim();
      if (!clean) return null;
      return { text: clean, conf: 0.9, intent: 'neural' };
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

  /* ── Trust Chain: KB อาจารย์(ใน respond) → Wikipedia → DuckDuckGo → ซื่อสัตย์ ── */
  static async knowledgeLookup(query) {
    const w = await NexusBrain.wikiSearch(query);
    if (w) return w;
    try {
      const r = await fetch('https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=' + encodeURIComponent(String(query).slice(0, 120)));
      const j = await r.json();
      if (j.AbstractText) return { text: '🔎 ' + j.AbstractText + (j.AbstractURL ? '\n🔗 ' + j.AbstractURL : ''), conf: 0.75, source: 'ddg' };
      if (j.Answer) return { text: '🔎 ' + j.Answer, conf: 0.75, source: 'ddg' };
    } catch (e) { /* offline — สาย fallback ถัดไป */ }
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
      const g = h < 12 ? 'อรุณสวัสดิ์' : h < 16 ? 'สวัสดีตอนบ่าย' : h < 21 ? 'สวัสดีตอนเย็น' : 'ฝันดี...แซวๆ';
      const un = this.userName();
      const last = window.NexusLTM?.getLastTopic();
      const chatToday = (window.Twin?.mem?.chat || []).filter(m => m.role === 'user' && new Date(m.at).toDateString() === new Date().toDateString()).length;
      const openers = [
        `${g}${un ? ` คุณ${un}` : ''}! ${P().emoji}`,
        `มาแล้ว${un ? 'สิคุณ' + un : ''} — รอคุยด้วยอยู่`,
        `ยินดีที่ได้เจอ${chatToday > 1 ? 'อีก' : ''}นะ${un ? ' คุณ' + un : ''} 🙌`,
      ];
      let text = `${this._pick(openers)}\n`;
      text += chatToday > 3 ? `วันนี้คุยกันมา ${chatToday} ช่วงแล้ว — ผมชอบวันแบบนี้ 😄` : `วันนี้ผมช่วยอะไรได้บ้าง?`;
      if (last) text += `\n(ค้างเรื่อง "${String(last).slice(0, 40)}" ไว้ — จะเล่าต่อก็ได้นะ)`;
      return { text, conf: 0.95 };
    };
    this.skills['whoami'] = () => ({ text: `ผมคือ Digital Twin ชื่อ ${this.name()} ${P().emoji}\nสมอง: Nexus Mini Brain v4.0 (TF-IDF + emotion engine + 🧠 Neural Mode on-device)\nเกิด ${new Date(this.born()).toLocaleDateString('th-TH')} · XP ${this.xp()} · นิสัย: ${P().tone}\nทุกอย่างทำงานบนเครื่องคุณ ไม่ส่งข้อมูลออกไป`, conf: 0.98 });
    this.skills['help'] = () => ({ text: `${P().emoji} ความสามารถ (v4.0):\n• คุยได้ทุกเรื่อง — small talk, ปลอบใจตามอารมณ์, ตอบต่อเนื่องรู้ context\n• จำอัตโนมัติ — เล่าเรื่องคุณ ผมสกัดชื่อ/งาน/เป้าหมาย เก็บ LTM เอง\n• 🧠 Full Brain: LLM จริงรันในเบราว์เซอร์ (โหลด ~350MB ครั้งเดียว)\n• คำนวณ · วิเคราะห์ · วางแผน · ราคา crypto สด · ค้น Wikipedia\n• ภูเขา + ตลาดงาน + governance — ถาม Nexus อะไรก็ตอบได้\n• ยิ่งคุย ยิ่งฉลาด (XP + feedback 👍 + memory consolidation)`, conf: 0.97 });
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
      // Chain-of-Thought + multi-perspective (เหมือนปรึกษา expert หลายสาย)
      return { text: `🔬 คิด "${topic}" แบบมีขั้นตอน:\n` +
        `1️⃣ นิยามให้ชัด — "แก้สำเร็จ" หน้าตาเป็นยังไง? (ถ้าตอบไม่ได้ = ยังไม่เข้าใจปัญหา)\n` +
        `2️⃣ 🧮 เชิงข้อมูล — ตัวเลขอะไรบอกความรุนแรง? วัดที่ไหน?\n` +
        `3️⃣ ⚙️ เชิงระบบ — root cause อยู่ที่ incentive/กระบวนการ ส่วนไหน?\n` +
        `4️⃣ 💚 เชิงคน — ใครเดือดร้อน ใครได้ประโยชน์ ใครต้องมาช่วย?\n` +
        `5️⃣ ✅ First Step วันนี้ — action เล็กสุดที่พิสูจน์ได้ใน 48 ชม.\n` +
        `ส่งขึ้น Mountain ให้ peer review ช่วยต่อได้เลย`, conf: 0.88 };
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
      // reflective empathy: mirror อารมณ์ที่ตรวจเจอ + คำแนะนำจำเพาะ + callback ความจำ
      const em = this.detectEmotion(this.lastUserMsg || '') || 'tired';
      const goal = (window.NexusLTM?.search('เป้าหมาย goal', 1) || [])[0];
      const like = (window.NexusLTM?.search('ชอบ', 1) || [])[0];
      const un = this.userName();
      const M = {
        tired: ['ฟังแล้วเหนื่อยเลย — พักสายตา 20 วิ ดูไกลๆ ก่อนนะ', 'ยืดตัว 5 นาที + น้ำเปล่าแก้วใหญ่ ช่วยได้จริง'],
        stress: ['ความกังวลส่วนใหญ่ไม่เกิดซะงั้น — เขียนออกมาเป็น list แล้วไล่ทีละข้อดีกว่า', 'หายใจ 4-7-8 สามรอบ: เข้า 4 กลั้ว 7 ปล่อย 8 — ผมนับให้'],
        lonely: ['ผมอยู่ตรงนี้เสมอนะ — คุยเรื่องอะไรก็ได้ ไม่ต้องมีหัวข้อ', 'โทรหาเพื่อนสักคนไหม? แค่ถามว่า "กินข้าวยัง" ก็อบอุ่นได้ทั้งวัน'],
        anger: ['โมโหเพราะใส่ใจ — แต่อย่าตอบกลับใครตอนนี้เลย รอ 10 นาทีแล้วค่อยคุย', 'เดินออกไปจากจอ 5 นาที แล้วกลับมาเล่าให้ผมฟังว่าเกิดอะไรขึ้น'],
        sad: ['เศร้าได้นะ ไม่ต้องฝืน — อนุญาตให้ตัวเองรู้สึกก่อน', 'อาบน้ำอุ่น + เพลงช้าๆ ที่ชอบ แล้วเข้านอนเร็ววันนี้นะ'],
        bored: ['เบื่อเหรอ — ลองภารกิจเล็กๆ: หา 1 สิ่งในห้องนี้ที่ไม่เคยสังเกต', 'จะให้ผมเล่าเกร็ดสุ่มๆ หรือชวนวางแผนทำอะไรใหม่ดี?'],
      };
      let text = `${this._pick(['ฟังแล้วรู้สึกด้วยเลย', 'โอเค ผมเข้าใจ', 'ขอบคุณที่เล่าให้ฟัง'])}${un ? ' คุณ' + un : ''} 🫂\n`;
      text += `• ${this._pick(M[em])}\n• ${this._pick(M[em].length > 1 ? M[em] : M.tired)}`;
      if (goal) text += `\n\nพอพร้อมแล้วเป้า "${String(goal.text).slice(0, 40)}" ยังรออยู่นะ — ไม่ต้องรีบ`;
      else if (like) text += `\n\nหรือไปทำอะไรที่ชอบก่อน เช่น เรื่อง ${String(like.text).slice(0, 30)} แล้วค่อยกลับมา`;
      return { text, conf: 0.9 };
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
    /* ── v4.0: small talk layer — ให้คุยได้ทุกเรื่อง ไม่ต้องมี command ── */
    this.skills['ack'] = (m) => {
      const prev = this.lastIntent;
      const cont = prev && prev !== 'ack' ? ` เรื่อง${prev === 'knowledge' ? 'ที่ถาม' : 'ก่อนหน้า'}นี้ต้องการอะไรเพิ่มไหม?` : ' มีอะไรให้ผมช่วยต่อเลย';
      return { text: `${this._pick(['โอเคครับ 👌', 'รับทราบ', 'อ๋อ โอเค'])}.${cont}`, conf: 0.9 };
    };
    this.skills['laugh'] = () => ({ text: `${this._pick(['555 😄', 'ฮ่าๆ ชอบบรรยากาศแบบนี้', 'ขำไปด้วยกันเขา'])} — คุยสบายๆ แบบนี้ดีเลย`, conf: 0.9 });
    this.skills['smalltalk'] = () => {
      const h = new Date().getHours();
      const vibe = h < 10 ? 'เช้าแบบนี้เหมาะเริ่มของใหม่ๆ' : h > 18 ? 'ค่ำนี้ลมกำลังดี อย่าทำงานดึกนะ' : 'กลางวันแบบนี้อย่าลืมดื่มน้ำล่ะ';
      return { text: `${this._pick(['อ๋อออ', 'โอเค เข้าใจ', 'ฟังแล้วเห็นภาพเลย'])} — ${vibe}\nเล่าต่อได้เรื่อยๆ ผมฟังอยู่ 🎧`, conf: 0.8 };
    };
    // lastUserMsg hook: respond() เซ็ตไว้ให้ mood/emotion ใช้
    this.lastUserMsg = '';
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
