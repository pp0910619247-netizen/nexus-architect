// ทดสอบ classifier ของ NexusBrain ใน Node
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {};
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/../app/nexus-core.js', 'utf8'));
const B = global.window.NexusBrain;
const tests = [
  ['สวัสดีครับ', 'greet'], ['จำว่า ฉันชอบกาแฟ', 'remember'], ['คำนวณ 5+5', 'math'],
  ['ทำอะไรได้บ้าง', 'help'], ['nexus คืออะไร', 'knowledge'], ['btc เท่าไหร่', 'price'],
  ['หางาน', 'job'], ['ทำไมเป็นแบบนั้น', 'followup'], ['ขอบคุณนะ', 'thanks'],
  ['เครียดมาก', 'mood'], ['ลาก่อน', 'bye'], ['วางแผนวันนี้ให้หน่อย', 'plan'],
];
let pass = 0;
for (const [t, expect] of tests) {
  const r = B.classify(t);
  const ok = r.intent === expect;
  if (ok) pass++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | "' + t + '" -> ' + r.intent + ' (' + Math.round(r.confidence * 100) + '%) คาด: ' + expect);
}
console.log('ผล: ' + pass + '/' + tests.length);
// ทดสอบ feedback learning
B.feedback('เปิดราคาเหรียญหน่อย', 'price', true);
const r2 = B.classify('เปิดราคาเหรียญหน่อย');
console.log('หลังเทรน feedback: "เปิดราคาเหรียญหน่อย" -> ' + r2.intent + ' (ควรเป็น price)');
