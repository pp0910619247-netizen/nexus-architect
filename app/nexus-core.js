/* ═══════════════════════════════════════════════════════════
   NEXUS MINI BRAIN v1.0 — AI Engine ของเราเอง 100%
   - Intent classification (TH/EN) + Confidence scoring
   - Knowledge retrieval + On-device memory recall
   - Safe math evaluator (ไม่ใช้ eval — กัน code injection)
   - Skill registry ต่อยอดได้
   ═══════════════════════════════════════════════════════════ */

class NexusBrain {
  constructor() {
    this.skills = [];
    this._registerCoreSkills();
  }

  /* ── Knowledge Base ── */
  static KB = [
    { k: ['nexus', 'คืออะไร', 'ระบบนี้', 'architect'],
      a: 'Nexus Architect คือระบบปฏิบัติการทางปัญญา: 1 มนุษย์ = 1 AI Twin, ภูเขาปัญหาโลก (Mountain), และเศรษฐกิจ 20/80 บน blockchain — contracts live บน Polygon Amoy แล้ว' },
    { k: ['20/80', 'รางวัล', 'reward', 'แบ่ง'],
      a: '20/80 Protocol: ผู้แก้ปัญหาได้ 20% อีก 80% กระจายให้ผู้โหวต/ผู้ตรวจ/AI ร่วมคิด/Impact Fund — ทำงานผ่าน RewardSplitter contract อัตโนมัติ' },
    { k: ['token', 'decay', 'โทเค็น', 'emission'],
      a: 'Tokenomics v1.1 ใช้ Solution-Mined Halving: รางวัลลดครึ่งเมื่อ solutions สะสมครบ milestone (ไม่ใช่ตามเวลา) + tail floor กัน emission = 0' },
    { k: ['identity', 'ยืนยัน', 'kyc', 'level'],
      a: 'Identity 5 ระดับ: เงา(อ่าน) → มนุษย์(Google+โหวต) → พลเมือง(KYC+ถอนได้) → ธนาคาร(เสนอปัญหา+governance) → อธิปไตย(validator)' },
    { k: ['roadmap', 'แผน', 'phase', 'ปี'],
      a: 'Roadmap: Q1 contracts+MVP ✅ → Q2 Google OAuth+Gitcoin → Q3 KYCจริง+rewardจริง → Q4 Arbitrum mainnet+audit' },
    { k: ['ปลอดภัย', 'hack', 'security', 'แฮก'],
      a: 'Security: XSS-escaped rendering, CSP, AES-GCM key encryption, rate limiting, ไม่มี eval, private key ไม่เคยออกจาก MetaMask' },
    { k: ['ลงทุน', 'invest', 'มูลค่า', 'business'],
      a: 'โมเดลธุรกิจ: transaction fees จาก reward distribution + B2B problem sponsorship + premium twin features. Traction: contracts deployed, MVP ใช้งานได้, PWA installable' },
  ];

  /* ── Intent patterns (TH/EN) ── */
  static INTENTS = [
    { name: 'remember', re: /^(จำว่า|จำไว้|remember)\s*[:：]?\s*(.+)/i, skill: 'remember' },
    { name: 'math', re: /^(คำนวณ|calc|เท่ากับ|how much is)\s*(.+)/i, skill: 'math' },
    { name: 'recall', re: /(จำอะไรได้|บันทึก|memory|จำได้|ฉันบอก)/i, skill: 'recall' },
    { name: 'mission', re: /(โจทย์|ปัญหาบน|mission|ภูเขา|mountain)/i, skill: 'mission' },
    { name: 'analyze', re: /(วิเคราะห์|analyze|ช่วยคิด|แตกปัญหา|แนวทางแก้)/i, skill: 'analyze' },
    { name: 'greet', re: /^(สวัสดี|hello|hi|hey|ดี|หวัดดี)/i, skill: 'greet' },
    { name: 'whoami', re: /(คุณคือใคร|ตัวตน|who are you|ชื่ออะไร)/i, skill: 'whoami' },
    { name: 'help', re: /(ทำอะไรได้|ช่วยอะไร|help|ความสามารถ)/i, skill: 'help' },
  ];

  _registerCoreSkills() {
    this.skills['greet'] = () => {
      const h = new Date().getHours();
      const g = h < 12 ? 'สวัสดีตอนเช้า' : h < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนค่ำ';
      return { text: `${g}ครับ 🐉 ผม ${this.name()} — สมอง Nexus Mini Brain ของคุณ (ทำงาน 100% บนเครื่อง)\nความจำ: ${this.memCount()} บันทึก\nลองถาม: "nexus คืออะไร" / "โจทย์บนภูเขา" / "คำนวณ 25*4+10" / "จำว่า ..."`, conf: 0.95 };
    };
    this.skills['whoami'] = () => ({ text: `ผมคือ Digital Twin ของคุณ ชื่อ ${this.name()}\nสมอง: Nexus Mini Brain v1.0 — engine ที่เขียนขึ้นเอง ทำงาน offline ได้ ไม่ส่งข้อมูลไปเซิร์ฟเวอร์ใด\nเกิด: ${new Date(this.born()).toLocaleDateString('th-TH')} · XP: ${this.xp()}`, conf: 0.98 });
    this.skills['help'] = () => ({ text: `🐉 ความสามารถของผม:\n• จดจำ/เรียกคืนข้อมูลส่วนตัว ("จำว่า...", "ฉันบอกว่า...")\n• คำนวณเลขปลอดภัย ("คำนวณ 1200/7")\n• วิเคราะห์+แตกโจทย์ ("วิเคราะห์ ขยะพลาสติก")\n• อ่านโจทย์บน Mountain\n• ตอบความรู้ระบบ Nexus ทั้งหมด\n• ต่อยอดเป็น LLM จริงได้ทันทีเมื่อใส่ key`, conf: 0.97 });
    this.skills['remember'] = (m, mt) => {
      const t = mt && mt[2] ? mt[2].trim() : m.replace(/^(จำว่า|จำไว้|remember)\s*/i, '');
      if (window.Twin) window.Twin.remember(t);
      return { text: `🧠 จดจำแล้ว: "${t}"\n(เก็บ on-device — ปิดแอปก็ไม่หาย)`, conf: 0.99 };
    };
    this.skills['recall'] = () => {
      const n = this.memCount();
      if (!n) return { text: 'ยังไม่มีบันทึก — ลอง "จำว่า ฉันชอบ..."', conf: 0.9 };
      const facts = (window.Twin ? window.Twin.mem.facts : []).slice(-5).map((f, i) => `${i + 1}. ${f.t}`).join('\n');
      return { text: `🧠 ความจำทั้งหมด ${n} รายการ ล่าสุด:\n${facts}`, conf: 0.95 };
    };
    this.skills['mission'] = () => {
      const probs = JSON.parse(localStorage.getItem('nx_probs') || '[]');
      if (!probs.length) return { text: 'ภูเขาว่างเปล่า — เสนอปัญหาแรกเลยไหม?', conf: 0.9 };
      const top = [...probs].sort((a, b) => b.votes - a.votes)[0];
      return { text: `🏔 โจทย์ Top: "${top.title}" (${top.votes} votes, ${top.cat})\nแตกเป็นแนวทาง:\n1. กำหนด "แก้สำเร็จ" วัดยังไงให้ชัด\n2. แบ่งเป็น 3 งานย่อยที่ลงมือได้ทันที\n3. หา partner/AI skill ที่เกี่ยว`, conf: 0.92 };
    };
    this.skills['analyze'] = (m) => {
      const topic = m.replace(/.*(วิเคราะห์|analyze|ช่วยคิด|แตกปัญหา)\s*/i, '').trim() || 'ปัญหานี้';
      return { text: `🔬 กรอบวิเคราะห์ "${topic}":\n• รากปัญหา (5 Whys): ถามว่าทำไม 5 รอบ\n• ผู้เกี่ยวข้อง: ใครเจ็บ/ใครได้ประโยชน์\n• ทรัพยากรที่มี: คน/เงิน/ข้อมูล/AI\n• ทางแก้ 3 ระดับ: ทำได้ทันที / 3 เดือน / เชิงระบบ\n• ตัวชี้วัด: ตัวเลขอะไรเปลี่ยนถ้าแก้สำเร็จ\nส่งโจทย์ขึ้น Mountain ให้ชุมชนช่วยคิดต่อได้เลย`, conf: 0.85 };
    };
    this.skills['math'] = (m, mt) => {
      const expr = (mt && mt[2] ? mt[2] : m.replace(/(คำนวณ|calc|เท่ากับ|how much is)/i, '')).replace(/[^\d+\-*/().\s%]/g, '').trim();
      if (!expr) return { text: 'ใส่ตัวเลขด้วย เช่น "คำนวณ 1200*3+50"', conf: 0.6 };
      try {
        const val = Function(`"use strict";return (${expr.replace(/%/g, '/')})`)();
        if (!isFinite(val)) throw new Error('div by zero');
        return { text: `🧮 ${expr} = ${Number(val.toFixed(6))}`, conf: 0.99 };
      } catch { return { text: 'สมการไม่เข้าใจ — ใช้เฉพาะ + - * / ( ) ได้เท่านั้น (ความปลอดภัย)', conf: 0.5 }; }
    };

    // Knowledge fallback skill
    this.skills['knowledge'] = (m) => {
      const words = m.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let best = null, bestScore = 0;
      for (const item of NexusBrain.KB) {
        const score = item.k.reduce((s, k) => s + (m.toLowerCase().includes(k) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; best = item; }
      }
      if (best && bestScore > 0) return { text: '📚 ' + best.a, conf: 0.8 + bestScore * 0.05 };
      return null;
    };
  }

  /* ── Main entry ── */
  respond(msg) {
    for (const intent of NexusBrain.INTENTS) {
      const mt = msg.match(intent.re);
      if (mt && this.skills[intent.skill]) {
        const r = this.skills[intent.skill](msg, mt);
        if (r) return { ...r, intent: intent.name };
      }
    }
    const kb = this.skills['knowledge'](msg);
    if (kb) return { ...kb, intent: 'knowledge' };
    // memory keyword recall
    if (window.Twin) {
      const words = msg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const fact = window.Twin.mem.facts.find(f => words.some(w => f.t.toLowerCase().includes(w)));
      if (fact) return { text: `จากความจำ: "${fact.t}" (${new Date(fact.at).toLocaleDateString('th-TH')})`, conf: 0.75, intent: 'recall' };
    }
    return { text: `🤔 ยังไม่แน่ใจคำถามนี้ (โหมด offline brain)\nลอง: "help" ดูความสามารถ · หรือเปิดสมอง Gemini เพื่อตอบทุกเรื่อง`, conf: 0.3, intent: 'unknown' };
  }

  /* bridge to Twin state */
  name() { return window.Twin?.cfg?.name || 'Aurora'; }
  born() { return window.Twin?.mem?.born || Date.now(); }
  xp() { return window.Twin?.mem?.xp || 0; }
  memCount() { return window.Twin?.mem?.facts?.length || 0; }
}

window.NexusBrain = new NexusBrain();
