import fs from 'node:fs';
const p = 'app/index.html';
let s = fs.readFileSync(p, 'utf8');

// 1) ดึง NAV block ที่หลุดเข้าไปใน popup string ออก
const navStart = s.indexOf('<nav id="tabbar">');
if (navStart < 0) { console.log('nav not found (nothing to fix)'); process.exit(0); }
const closeTag = '</scr' + 'ipt>';
const navEnd = s.indexOf(closeTag, navStart) + closeTag.length;
const navBlock = s.slice(navStart, navEnd);
s = s.slice(0, navStart) + s.slice(navEnd);
console.log('removed misplaced nav @', navStart);

// 2) ใส่กลับก่อน </body> ตัวสุดท้าย (ของจริง)
const lastBody = s.lastIndexOf('</body>');
if (lastBody < 0) { console.log('no </body>'); process.exit(1); }
s = s.slice(0, lastBody) + navBlock + '\n' + s.slice(lastBody);
console.log('nav re-inserted before real </body> @', lastBody);

fs.writeFileSync(p, s);
console.log('fixed ✓');
