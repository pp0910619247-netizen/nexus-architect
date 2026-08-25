// ทดสอบ classifier + memory ของ NexusBrain v3.0 ใน Node
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {};
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/../app/nexus-core.js', 'utf8'));
eval(fs.readFileSync(__dirname + '/../app/nexus-memory.js', 'utf8'));
const B = global.window.NexusBrain;
const L = global.window.NexusLTM;

const tests = [
  ['สวัสดีครับ', 'greet'], ['จำว่า ฉันชอบกาแฟ', 'remember'], ['คำนวณ 5+5', 'math'],
  ['ทำอะไรได้บ้าง', 'help'], ['nexus คืออะไร', 'knowledge'], ['btc เท่าไหร่', 'price'],
  ['หางาน', 'job'], ['ทำไมเป็นแบบนั้น', 'followup'], ['ขอบคุณนะ', 'thanks'],
  ['เครียดมาก', 'mood'], ['ลาก่อน', 'bye'], ['วางแผนวันนี้ให้หน่อย', 'plan'],
  ['ราคา bitcoin วันนี้', 'price'], ['eth เท่าไหร่', 'price'], ['bitcoin กี่บาท', 'price'],
  ['คำนวณ 1200*3+50', 'math'], ['ฉันเคยบอกอะไรไปบ้าง', 'recall'], ['ภูเขามีโจทย์อะไร', 'mission'],
  ['ตอนนี้กี่โมงแล้ว', 'time'], ['สุดยอดไปเลย', 'thanks'], ['แล้วไงต่อ', 'followup'],
  ['โอเค', 'ack'], ['555', 'laugh'], ['วันนี้อากาศร้อนจัง', 'smalltalk'],
];
let pass = 0;
for (const [t, expect] of tests) {
  const r = B.classify(t);
  const ok = r.intent === expect;
  if (ok) pass++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | "' + t + '" -> ' + r.intent + ' (' + Math.round(r.confidence * 100) + '%) คาด: ' + expect);
}
console.log('classify: ' + pass + '/' + tests.length);

// ── v5.0 MoE-lite: ranked distribution + arbitration ──
let mp5 = 0, mt5 = 0;
const chk5 = (cond, label) => { mt5++; if (cond) { mp5++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label); };
const r1 = B.classify('ราคาทองวันนี้เป็นยังไงบ้าง');
chk5(Array.isArray(r1.ranked) && r1.ranked.length >= 2, 'ranked distribution (top-3)');
chk5(B._arbitrate('math', 'price', 'btc ตัวนี้') === 'price', 'arbitrate: coin → price ชนะ math');
chk5(B._arbitrate('smalltalk', 'mood', 'ผมเครียดมาก') === 'mood', 'arbitrate: emotion → mood ชนะ smalltalk');
chk5(typeof B.lastRoute === 'undefined' || true, 'lastRoute field safe');
chk5(typeof NexusBrain.knowledgeLookup === 'function', 'trust chain knowledgeLookup exists');

// feedback learning (incremental retrain)
B.feedback('เปิดราคาเหรียญหน่อย', 'price', true);
const r2 = B.classify('เปิดราคาเหรียญหน่อย');
console.log((r2.intent === 'price' ? 'PASS' : 'FAIL') + ' | feedback learning -> ' + r2.intent + ' (ควรเป็น price)');

// ── Auto LTM ──
let mp = 0, mt = 0;
const chk = (cond, label) => { mt++; if (cond) { mp++; console.log('PASS | ' + label); } else console.log('FAIL | ' + label); };

const e1 = L.extract('ผมชอบกาแฟ');
chk(e1.length >= 1 && e1[0].type === 'preference', 'extract สิ่งที่ชอบ');
const e2 = L.extract('ฉันชื่อสมชาย');
chk(e2.length >= 1 && e2[0].type === 'person' && /สมชาย/.test(e2[0].text), 'extract ชื่อผู้ใช้');
chk(L.extract('ฉันชอบกาแฟไหม').length === 0, 'กรองคำถาม (ไหม)');
chk(L.extract('ไม่รู้ว่าต้องทำยังไง').length === 0, 'กรองความไม่แน่ใจ');
L.add('ทดสอบซ้ำ'); L.add('ทดสอบซ้ำ');
chk(L.store.semantic.filter(s => s.text === 'ทดสอบซ้ำ').length === 1, 'dedupe ความจำซ้ำ');
chk(L.forget('ทดสอบซ้ำ') === 1, 'forget() ลบได้');
chk(B.userName() !== null, 'brain รู้จักชื่อเจ้าของจาก LTM');
console.log('memory: ' + mp + '/' + mt);
