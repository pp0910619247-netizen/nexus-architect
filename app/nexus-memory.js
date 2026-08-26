/* ═══════════════════════════════════════════════════════════
   NEXUS LONG-TERM MEMORY v1.1
   - ความจำ 3 ชั้น: Working (chat) → Episodic (สรุปบทสนทนา) → Semantic (ความจำถาวร)
   - สกัดความจำอัตโนมัติจากบทสนทนา (auto-extraction, กรองคำถาม/ปฏิเสธ)
   - ค้นแบบถ่วงน้ำหนัก: tag match + keywords + importance + recency + access count
   - Consolidation: ย่อยความจำเก่าเป็น episodic notes เหมือนการนอนหลับ
   ═══════════════════════════════════════════════════════════ */

class NexusMemory {
  constructor() {
    this.store = JSON.parse(localStorage.getItem('nexus_ltm') || 'null') || {
      semantic: [],    // ความจำถาวร {id,text,type,tags[],importance,created,lastAccess,accessCount}
      episodic: [],    // สรุปช่วงเวลา {id,text,from,to}
      lastTopic: null, // หัวข้อล่าสุด (working memory ต่อเนื่อง)
    };
  }
  save() { localStorage.setItem('nexus_ltm', JSON.stringify(this.store)); }

  /* ── สกัดความจำจากประโยคอัตโนมัติ (TH/EN patterns) ── */
  static PATTERNS = [
    { re: /(?:ฉัน|ผม|เรา|กู|i)\s*(?:ชอบ|รัก|like|love)\s*(.{2,})/i, type: 'preference', tags: ['ชอบ'], imp: 0.8 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:เกลียด|ไม่ชอบ|hate|dislike)\s*(.{2,})/i, type: 'preference', tags: ['ไม่ชอบ'], imp: 0.8 },
    { re: /(?:ฉัน|ผม|ดิฉัน|แฟน|พ่อ|แม่)\s*(?:ชื่อ|my name is)\s*([\p{L}\s]{1,40})/u, type: 'person', tags: ['ชื่อ'], imp: 1.0 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:ทำงาน|work)\s*(?:เป็น|as)?\s*(.{2,})/i, type: 'fact', tags: ['งาน'], imp: 0.9 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:อยู่|live in|based in)\s*(?:ที่)?\s*(.{2,})/i, type: 'fact', tags: ['ที่อยู่'], imp: 0.9 },
    { re: /(?:เป้าหมาย|goal)\s*(?:ของฉัน|ของผม|of mine)?\s*(?:คือ|is|อยาก|want to)?\s*(.{2,})/i, type: 'goal', tags: ['เป้าหมาย'], imp: 1.0 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:อยาก|want to|wanna)\s*(.{2,})/i, type: 'goal', tags: ['ความฝัน'], imp: 0.7 },
    { re: /(?:จำว่า|จำไว้|remember)\s*[:：]?\s*(.{2,})/i, type: 'fact', tags: ['สั่งจำ'], imp: 1.0 },
    { re: /(?:เกิด|born)\s*(?:วันที่|on)?\s*(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)/i, type: 'fact', tags: ['วันเกิด'], imp: 0.95 },
    { re: /(?:ฉัน|ผม)\s*(?:เรียน|study|graduated)\s*(?:จบ)?\s*(.{2,})/i, type: 'fact', tags: ['การศึกษา'], imp: 0.75 },
    { re: /(?:สัตว์เลี้ยง|pet|แมว|cat|หมา|dog)\s*(?:ชื่อ)?\s*(.{0,30})?$/i, type: 'person', tags: ['สัตว์เลี้ยง'], imp: 0.6 },
  ];

  /* ── กรอง noise: คำถาม / ปฏิเสธ / สั่งลืม ── */
  static NOISE = /\?|ไหม|หรือเปล่า|หรือยัง|เท่าไหร่|กี่|อะไรนะ|don'?t know|ไม่รู้|ไม่แน่ใจ|maybe|มั้ง/i;

  extract(text) {
    if (NexusMemory.NOISE.test(text)) return [];           // ไม่จำคำถาม/ความไม่แน่ใจ
    const found = [];
    for (const p of NexusMemory.PATTERNS) {
      const m = text.match(p.re);
      if (!m) continue;
      let val = (m[1] || '').trim().slice(0, 200);
      if (!val || val.length < 2) continue;
      found.push(this.add(val, p.type, p.tags, p.imp));
    }
    return found;
  }

  /* ── เพิ่มความจำถาวร (dedupe normalize + quality gate v1.2) ── */
  static JUNK = /^(เข้า|ไป|มา|ดี|ใช่|ไม่|ok|yes|no|555|ครับ|ค่ะ|จ้า)$/i;
  add(text, type = 'fact', tags = [], importance = 0.6) {
    const clean = String(text || '').trim();
    // quality gate: สั้นเกิน/คำขยะ/ไม่มีสาระ → เก็บแต่ทำเครื่องหมาย ไม่ให้ search หยิบ
    const lowQuality =
      clean.length < 4 ||
      NexusMemory.JUNK.test(clean) ||
      (!/[0-9]/.test(clean) && clean.split(/\s+/).length < 2 && [...clean].filter(c => c === c.toUpperCase() && /[A-Z]/.test(c)).length === 0 && clean.length < 6);
    const key = clean.toLowerCase().replace(/\s+/g, ' ');
    const dup = this.store.semantic.find(s => s.text.toLowerCase().replace(/\s+/g, ' ') === key);
    if (dup) {
      dup.accessCount++; dup.lastAccess = Date.now();
      dup.importance = Math.min(1, dup.importance + 0.1);
      this.save(); return dup;
    }
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: clean, type, tags,
      importance,
      lowQuality,
      created: Date.now(), lastAccess: Date.now(), accessCount: 0,
      words: clean.toLowerCase().split(/\s+/).filter(w => w.length > 2),
    };
    this.store.semantic.push(item);
    if (this.store.semantic.length > 500) this._prune();
    this.save();
    return item;
  }

  /* ── migration: mark legacy junk จากเวอร์ชันเก่า ── */
  _sanitizeLegacy() {
    let changed = false;
    for (const s of this.store.semantic) {
      if (s.lowQuality === undefined) {
        s.lowQuality = String(s.text || '').trim().length < 4 || NexusMemory.JUNK.test(String(s.text || '').trim());
        changed = true;
      }
    }
    if (changed) this.save();
  }

  /* ── ลืมตามคำ (GDPR-style: เจ้าของสั่งลบได้) ── */
  forget(q) {
    const before = this.store.semantic.length;
    this.store.semantic = this.store.semantic.filter(s => !s.text.toLowerCase().includes(String(q).toLowerCase()));
    this.save();
    return before - this.store.semantic.length;
  }

  /* ── ค้นความจำแบบถ่วงน้ำหนัก (v1.2: ต้องมี keyword/tag overlap จริงเท่านั้น) ── */
  search(query, limit = 3) {
    this._sanitizeLegacy();
    const q = query.toLowerCase();
    const qWords = q.split(/\s+/).filter(w => w.length > 2);
    if (!qWords.length) return [];
    const now = Date.now();
    const scored = [];
    for (const s of this.store.semantic) {
      if (s.lowQuality) continue;
      let matchScore = 0;
      for (const w of qWords) {
        if (w.length > 2 && s.text.toLowerCase().includes(w)) matchScore += 3;
        if ((s.words || []).includes(w)) matchScore += 2;
      }
      for (const t of (s.tags || [])) if (q.includes(t)) matchScore += 2.5;
      if (matchScore <= 0) continue;              // ← ไม่มี overlap = ไม่ใช่ความจำที่เกี่ยว
      let score = matchScore + s.importance * 2
                + s.accessCount * 0.3
                + Math.max(0, 1 - (now - s.lastAccess) / (86400000 * 30)) * 1.5;
      scored.push({ s, score });
    }
    const out = scored.filter(x => x.score >= 3)
      .sort((a, b) => b.score - a.score).slice(0, limit);
    out.forEach(x => { x.s.accessCount++; x.s.lastAccess = now; });
    if (out.length) this.save();
    return out.map(x => x.s);
  }

  /* ── Consolidation: ย่อยแชทเก่า → episodic (เหมือนการหลับ) ── */
  consolidate(chat) {
    if (!chat || chat.length < 40) return false;
    const old = chat.slice(0, 20);
    const topics = old.filter(m => m.role === 'user').map(m => m.text.slice(0, 40)).slice(0, 5);
    this.store.episodic.push({
      id: Date.now(), from: old[0].at, to: old[old.length - 1].at,
      text: 'ช่วงหนึ่งผู้ใช้คุยเรื่อง: ' + topics.join(' | '),
    });
    if (this.store.episodic.length > 50) this.store.episodic.shift();
    this.save();
    return true;
  }

  _prune() {
    // ลบความจำอ่อนที่ไม่ถูกเรียกใช้นาน
    this.store.semantic.sort((a, b) =>
      (b.importance * 2 + b.accessCount * 0.3) - (a.importance * 2 + a.accessCount * 0.3));
    this.store.semantic = this.store.semantic.slice(0, 400);
  }

  count() { return this.store.semantic.length; }
  setLastTopic(t) { this.store.lastTopic = t; this.save(); }
  getLastTopic() { return this.store.lastTopic; }
}

window.NexusLTM = new NexusMemory();
