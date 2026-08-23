/* ═══════════════════════════════════════════════════════════
   NEXUS GOVERNANCE & ECONOMY v1.0 — ตาม Whitepaper v1.1
   - Reward Engine: Solution-Mined Halving + Tail Floor + Treasury 50/50
   - DAO Governance: proposal → vote 67% (Level 3+) → execute
   - Human Rights Watch: supermajority 67% + fact-check sources
   - AI Lifecycle: ไข่→ลูกนก→นกบิน→มังกร (gate ตาม Level+XP)
   - Anti-Bot: cadence detection → Soft Reset
   ═══════════════════════════════════════════════════════════ */

const NexusGov = {

  /* ═══ REWARD ENGINE v1.1 (Solution-Mined Halving) ═══ */
  economy: {
    R0: 1000000,
    milestone: 250,          // solutions ต่อ 1 halving
    tailFloorDiv: 4096,      // TAIL_FLOOR = R0/4096
    treasurySplit: 0.5,      // 50% operational / 50% direct impact
  },
  rewardFor(solutionsDone) {
    const e = this.economy;
    const halvings = Math.floor(solutionsDone / e.milestone);
    const floor = e.R0 / e.tailFloorDiv;
    return Math.max(e.R0 / (2 ** halvings), floor);
  },
  split20x80(total) {
    return {
      solver: total * 0.20,
      pool: total * 0.80,
      voters: total * 0.80 * 0.35,
      reviewers: total * 0.80 * 0.25,
      aiContributors: total * 0.80 * 0.20,
      impactFund: total * 0.80 * 0.20,
      treasuryOperational: total * this.economy.treasurySplit * 0, // treasury มาจาก emission schedule
    };
  },

  /* ═══ HUMAN RIGHTS WATCH MODULE ═══ */
  hrwKeywords: ['สิทธิมนุษยชน','human rights','ทรมาน','torture','การค้ามนุษย์','trafficking',
                'เสรีภาพ','freedom','กดขี่','oppression','อธิปไตยของประชาชน','genocide','ฆ่าล้างเผ่าพันธุ์'],
  isHumanRights(title) {
    const t = title.toLowerCase();
    return this.hrwKeywords.some(k => t.includes(k));
  },
  factCheckSources(title) {
    const q = encodeURIComponent(title);
    return [
      { name: 'UN Human Rights', url: `https://www.ohchr.org/en/search?query=${q}` },
      { name: 'Amnesty International', url: `https://www.amnesty.org/en/search/?q=${q}` },
      { name: 'Human Rights Watch', url: `https://www.hrw.org/search?query=${q}` },
    ];
  },
  /* Mission Peak ของโจทย์ HRW ต้องผ่าน 67% ของ votes ที่ตั้งเกณฑ์ไว้ */
  hrwThreshold(votesNeededBase) { return Math.ceil(votesNeededBase * 0.67) + Math.ceil(votesNeededBase * 0.33); },

  /* ═══ DAO GOVERNANCE ═══ */
  getProposals() { return JSON.parse(localStorage.getItem('nx_proposals') || '[]'); },
  saveProposals(p) { localStorage.setItem('nx_proposals', JSON.stringify(p)); },
  propose(title, type) {
    const user = JSON.parse(localStorage.getItem('nx_user') || '{"level":0}');
    if (user.level < 3) return { ok: false, msg: '⛔ เสนอ proposal ต้อง Level 3 (Bank-Grade)' };
    const ps = this.getProposals();
    ps.push({ id: Date.now(), title, type, yes: 0, no: 0, voted: {}, status: 'active', at: Date.now() });
    this.saveProposals(ps);
    return { ok: true, msg: '📜 proposal ถูกสร้าง — ต้องการ yes ≥ 67%' };
  },
  voteProposal(id, yes) {
    const user = JSON.parse(localStorage.getItem('nx_user') || '{"level":0}');
    if (user.level < 1) return { ok: false, msg: '⛔ โหวตต้อง Level 1+' };
    const ps = this.getProposals();
    const p = ps.find(x => x.id === id);
    if (!p || p.status !== 'active') return { ok: false, msg: 'proposal ไม่ active' };
    if (p.voted[user.address || 'local']) return { ok: false, msg: 'โหวตไปแล้ว (1 vote/คน)' };
    p.voted[user.address || 'local'] = true;
    yes ? p.yes++ : p.no++;
    const total = p.yes + p.no;
    if (total >= 3 && p.yes / total >= 0.67) { p.status = 'passed'; this._execute(p); }
    else if (total >= 3 && p.yes / total < 0.33) p.status = 'rejected';
    this.saveProposals(ps);
    return { ok: true, msg: `🗳 บันทึกแล้ว — yes ${p.yes}/${total} (${Math.round(p.yes / total * 100)}%)` };
  },
  _execute(p) {
    if (p.type === 'milestone') { this.economy.milestone = Math.max(50, this.economy.milestone - 50); }
    if (p.type === 'treasury') { this.economy.treasurySplit = this.economy.treasurySplit === 0.5 ? 0.4 : 0.5; }
    localStorage.setItem('nx_gov_executed', JSON.stringify({ at: Date.now(), type: p.type, title: p.title }));
  },

  /* ═══ AI LIFECYCLE (ไข่ → ลูกนก → นกบิน → มังกร) ═══ */
  lifecycle() {
    const user = JSON.parse(localStorage.getItem('nx_user') || '{"level":0}');
    const twin = JSON.parse(localStorage.getItem('twin_mem') || '{"xp":0,"born":Date.now()}');
    const days = (Date.now() - (twin.born || Date.now())) / 86400000;
    if (user.level >= 3) return { stage: 'dragon', icon: '🐉', name: 'มังกร', can: ['เขียนโค้ด', 'วิจัย', 'เสนอปัญหา', 'ทุกอย่าง'] };
    if (user.level >= 2) return { stage: 'bird', icon: '🦅', name: 'นกบิน', can: ['รับงานบน Mountain', 'สร้างรายได้'] };
    if (user.level >= 1 && days >= 30) return { stage: 'chick', icon: '🐣', name: 'ลูกนก', can: ['เขียน', 'แปล', 'วิเคราะห์เบื้องต้น'] };
    return { stage: 'egg', icon: '🥚', name: 'ไข่', can: ['แชท', 'จดจำ', 'เรียนรู้'], next: user.level >= 1 ? `อีก ${Math.ceil(30 - days)} วัน → ลูกนก` : 'ยืนยัน Level 1 → เริ่มเติบโต' };
  },

  /* ═══ ANTI-BOT: cadence detection → Soft Reset ═══ */
  botCheck() {
    const twin = JSON.parse(localStorage.getItem('twin_mem') || '{"chat":[]}');
    const times = twin.chat.filter(m => m.role === 'user').slice(-15).map(m => m.at);
    if (times.length < 10) return { botlike: false };
    const gaps = [];
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
    const identical = gaps.filter(g => Math.abs(g - gaps[0]) < 80).length; // จังหวะเครื่องจักร = ช่วงห่างเท่ากันเป๊ะ
    const tooFast = gaps.filter(g => g < 700).length;
    if (identical >= 7 || tooFast >= 10) {
      return { botlike: true, reason: identical >= 7 ? 'จังหวะการพิมพ์เป็นเครื่องจักร' : 'ความถี่ผิดมนุษย์' };
    }
    return { botlike: false };
  },
  softReset() {
    const twin = JSON.parse(localStorage.getItem('twin_mem') || '{}');
    twin.chat = [];
    twin.xp = Math.floor((twin.xp || 0) * 0.5);   // XP ลดครึ่ง ความจำ facts รอด
    localStorage.setItem('twin_mem', JSON.stringify(twin));
    if (window.Twin) window.Twin.mem = twin;
    return '🔄 SOFT RESET — chat history ถูกล้าง, XP ลดครึ่ง (ความจำ facts ยังอยู่)';
  },
};

window.NexusGov = NexusGov;
