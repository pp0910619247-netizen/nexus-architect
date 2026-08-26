import fs from 'node:fs';
const p = 'app/index.html';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// แทนบรรทัด neuralBtn (index 251 = บรรทัด 252) + แทรก Lite ต่อท้าย
const i = lines.findIndex(l => l.includes('id="neuralBtn"'));
if (i < 0) { console.log('neuralBtn not found'); process.exit(1); }
lines[i] = '      <button class="ghost" id="neuralBtn" onclick="loadNeuralBrain()" title="Nexus One \u2014 single model">\uD83E\uDDE0 Full Brain</button>';
lines.splice(i + 1, 0, '      <button class="ghost" id="liteBtn" onclick="toggleLite()" title="\u0E42\u0E2B\u0E21\u0E14\u0E40\u0E1A\u0E32: RAM \u0E19\u0E49\u0E2D\u0E22 \u00B7 \u0E15\u0E2D\u0E1A\u0E2A\u0E31\u0E49\u0E19">\uD83E\uDED8 Lite</button>');
fs.writeFileSync(p, lines.join('\n'));
console.log('buttons fixed @', i + 1);
