/* ═══════════════════════════════════════════════════════════
   NEXUS LONG-TERM MEMORY v1.0
   - ความจำ 3 ชั้น: Working (chat) → Episodic (สรุปบทสนทนา) → Semantic (ความจำถาวร)
   - สกัดความจำอัตโนมัติจากบทสนทนา (auto-extraction)
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
    { re: /(?:ฉัน|ผม|เรา|กู|i)\s*(?:ชอบ|รัก|like|love)\s*(.+)/i, type: 'preference', tags: ['ชอบ'], imp: 0.8 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:เกลียด|ไม่ชอบ|hate|dislike)\s*(.+)/i, type: 'preference', tags: ['ไม่ชอบ'], imp: 0.8 },
    { re: /(?:ฉัน|ผม|ดิฉัน)\s*(?:ชื่อ|my name is)\s*(\S+)/i, type: 'person', tags: ['ชื่อ'], imp: 1.0 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:ทำงาน|work)\s*(?:เป็น|as)?\s*(.+)/i, type: 'fact', tags: ['งาน'], imp: 0.9 },
    { re: /(?:ฉัน|ผม|เรา|i)\s*(?:อยู่|อยู่ที่|live in)\s*(.+)/i, type: 'fact', tags: ['ที่อยู่'], imp: 0.9 },
    { re: /(?:เป้าหมาย|goal|ฉัน|ผม)\s*(?:ของฉัน|ของผม)?\s*(?:คือ|is|อยาก|want to)\s*(.+)/i, type: 'goal', tags: ['เป้าหมาย'], imp: 1.0 },
    { re: /(?:จำว่า|จำไว้|remember)\s*[:：]?\s*(.+)/i, type: 'fact', tags: ['สั่งจำ'], imp: 1.0 },
    { re: /(?:ครอบครัว|family|แฟน|wife|husband|ลูก)\s*(.+)/i, type: 'person', tags: ['ครอบครัว'], imp: 0.7 },
  ];

  extract(text) {
    const found = [];
    for (const p of NexusMemory.PATTERNS) {
      const m = text.match(p.re);
      if (m) found.push(this.add(m[1].trim().slice(0, 200), p.type, p.tags, p.imp));
    }
    return found;
  }

  /* ── เพิ่มความจำถาวร ── */
  add(text, type = 'fact', tags = [], importance = 0.6) {
    // รวมความจำซ้ำ (dedupe คร่าวๆ)
    const dup = this.store.semantic.find(s => s.text.toLowerCase() === text.toLowerCase());
    if (dup) { dup.accessCount++; dup.lastAccess = Date.now(); dup.importance = Math.min(1, dup.importance + 0.1); this.save(); return dup; }
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text, type, tags,
      importance,
      created: Date.now(), lastAccess: Date.now(), accessCount: 0,
      words: text.toLowerCase().split(/\s+/).filter(w => w.length > 2), // index คำ
    };
    this.store.semantic.push(item);
    if (this.store.semantic.length > 500) this._prune();
    this.save();
    return item;
  }

  /* ── ค้นความจำแบบถ่วงน้ำหนัก ── */
  search(query, limit = 3) {
    const q = query.toLowerCase();
    const qWords = q.split(/\s+/).filter(w => w.length > 2);
    const now = Date.now();
    const scored = this.store.semantic.map(s => {
      let score = s.importance * 2;
      for (const w of qWords) {
        if (s.text.toLowerCase().includes(w)) score += 3;
        if (s.words.includes(w)) score += 2;
        if (s.tags.some(t => q.includes(t))) score += 2.5;
      }
      score += s.accessCount * 0.3;
      score += Math.max(0, 1 - (now - s.lastAccess) / (86400000 * 30)) * 1.5; // recency 30 วัน
      return { s, score };
    }).filter(x => x.score > 1.5).sort((a, b) => b.score - a.score).slice(0, limit);
    scored.forEach(x => { x.s.accessCount++; x.s.lastAccess = now; });
    if (scored.length) this.save();
    return scored.map(x => x.s);
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
