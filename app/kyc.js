/* ═══════════════════════════════════════════════════════════
   NEXUS KYC v2.0 — ยืนยันตัวตนมาตรฐานสากล (100% on-device)
   Flow: 1) เอกสาร: เลขบัตรประชาชนไทย (checksum กรมการปกครอง)
              + วันเกิด/วันหมดอายุ (age ≥ 18, บัตรไม่หมดอายุ)
              หรือ MRZ Passport (ICAO 9303 TD3 — check digits 7-3-1)
         2) Active Liveness: challenge สุ่ม — กระพริบตา (EAR) +
            หันหน้าซ้าย/ขวา (yaw) + anti-photo movement
         3) Face Match: descriptor 128-D euclidean < 0.6 (มาตรฐาน face-api)
   Quality gates: brightness · face size · single-face · frame consistency
   Privacy: ไม่เก็บรูป/เลขบัตร — เก็บเฉพาะ SHA-256 hash + score
   ═══════════════════════════════════════════════════════════ */

const NexusKYC = {
  MODELS_URL: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  MATCH_THRESHOLD: 0.6,     // มาตรฐาน face-api (FAR ต่ำ ~1e-4 บน LFW)
  MIN_AGE: 18,
  _modelsLoaded: false,

  /* ══ 1A) เลขบัตรประชาชนไทย + ข้อมูลเสริม (มาตรฐานกรมการปกครอง) ══ */
  async verifyThaiID(raw, opts = {}) {
    const d = String(raw).replace(/\D/g, '');
    if (d.length !== 13) return { ok: false, msg: 'เลขบัตรต้องมี 13 หลัก (ได้มา ' + d.length + ')' };
    if (!/^[12]/.test(d)) return { ok: false, msg: 'หลักแรกต้องเป็น 1 หรือ 2' };
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
    const check = (11 - (sum % 11)) % 10;
    if (check !== Number(d[12])) return { ok: false, msg: 'เลขบัตรไม่ผ่าน checksum (มาตรฐานกรมการปกครอง)' };
    // ── วันเกิด: ต้องอายุ ≥ MIN_AGE ──
    if (opts.birth) {
      const b = new Date(opts.birth);
      if (isNaN(b)) return { ok: false, msg: 'รูปแบบวันเกิดไม่ถูกต้อง' };
      const age = (Date.now() - b.getTime()) / (365.25 * 86400000);
      if (age < this.MIN_AGE) return { ok: false, msg: 'อายุต้องไม่ต่ำกว่า ' + this.MIN_AGE + ' ปี' };
      if (age > 120 || b > new Date()) return { ok: false, msg: 'วันเกิดไม่สมเหตุสมผล' };
    }
    // ── วันหมดอายุบัตร: ต้องยังไม่หมดอายุ ──
    if (opts.expiry) {
      const e2 = new Date(opts.expiry);
      if (isNaN(e2)) return { ok: false, msg: 'รูปแบบวันหมดอายุไม่ถูกต้อง' };
      if (e2 < new Date()) return { ok: false, msg: '❌ บัตรหมดอายุแล้ว (' + e2.toLocaleDateString('th-TH') + ')' };
      if (e2 < new Date(Date.now() + 30 * 86400000)) return { ok: true, warn: 'บัตรจะหมดอายุใน 30 วัน', idHash: await await_sha256(d), msg: '✓ ผ่าน (แต่บัตรใกล้หมดอายุ)' };
    }
    return { ok: true, msg: '✓ เลขบัตรถูกต้องตามมาตรฐานกรมการปกครอง', idHash: await await_sha256(d) };
  },

  /* ══ 1B) MRZ Passport (ICAO 9303 TD3) — มาตรฐานสากลจริง ══
     รับ 2 บรรทัด 44 ตัวอักษร ตรวจ check digits ทุก field + composite */
  async verifyMRZ(line1, line2) {
    const l1 = String(line1 || '').toUpperCase().replace(/\s/g, '');
    const l2 = String(line2 || '').toUpperCase().replace(/\s/g, '');
    if (l1.length !== 44 || l2.length !== 44)
      return { ok: false, msg: 'MRZ ต้องเป็น 2 บรรทัด × 44 ตัวอักษร (TD3 passport) — ได้มา ' + l1.length + '/' + l2.length };
    if (!l1.startsWith('P<')) return { ok: false, msg: 'บรรทัดแรกต้องขึ้นต้น P< (passport)' };
    const chk = (s) => {
      const W = [7, 3, 1]; let sum = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        const v = c >= '0' && c <= '9' ? +c : c >= 'A' && c <= 'Z' ? c.charCodeAt(0) - 55 : 0;
        sum += v * W[i % 3];
      }
      return sum % 10;
    };
    const docNum = l2.slice(0, 9), docCD = l2[9];
    const dob = l2.slice(13, 19), dobCD = l2[19];
    const exp = l2.slice(21, 27), expCD = l2[27];
    const optional = l2.slice(28, 42), optCD = l2[42];
    const composite = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
    const fails = [];
    if (+docCD !== chk(docNum)) fails.push('เลขหนังสือเดินทาง');
    if (+dobCD !== chk(dob)) fails.push('วันเกิด');
    if (+expCD !== chk(exp)) fails.push('วันหมดอายุ');
    if (+optCD !== chk(optional)) fails.push('personal number');
    if (+l2[43] !== chk(composite)) fails.push('composite');
    if (fails.length) return { ok: false, msg: 'MRZ check digit ไม่ผ่าน: ' + fails.join(', ') };
    // วันหมดอายุ YYMMDD → ปี 20YY; ถ้า > ปี+60 แปลว่า 19YY
    let yy = +exp.slice(0, 2); const fullExp = new Date(2000 + yy > new Date().getFullYear() + 60 ? 1900 + yy : 2000 + yy, +exp.slice(2, 4) - 1, +exp.slice(4, 6));
    if (fullExp < new Date()) return { ok: false, msg: 'Passport หมดอายุแล้ว' };
    const nationality = l1.slice(10, 13).replace(/</g, '');
    return { ok: true, msg: '✓ MRZ ผ่าน ICAO 9303 ครบทุก check digit (สัญชาติ ' + nationality + ')', idHash: await await_sha256(l1 + l2), type: 'passport' };
  },

  /* ══ 2) โหลดโมเดล (~1MB จาก CDN ครั้งเดียว) ══ */
  async loadModels() {
    if (this._modelsLoaded) return true;
    if (typeof faceapi === 'undefined') throw new Error('face-api ยังไม่โหลด');
    await faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL);
    this._modelsLoaded = true;
    return true;
  },

  /* ══ 3) Active Liveness — challenge สุ่ม: กระพริบตา + หันซ้าย/ขวา ══ */
  async scanLiveFace(videoEl, onProgress) {
    await this.loadModels();
    const say = (t) => onProgress && onProgress(t);
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    // ── challenge order สุ่ม (กัน replay video) ──
    const challenges = Math.random() < 0.5 ? ['blink', 'turn'] : ['turn', 'blink'];
    say(challenges[0] === 'blink' ? '👁 กระพริบตาชัดๆ 1 ครั้ง' : '↔️ หันหน้าซ้าย→ขวาช้าๆ');

    let blinkDone = false, turnDone = false;
    let earLow = false, yawSeenLeft = false, yawSeenRight = false;
    const descs = [];
    const t0 = Date.now(), TIMEOUT = 15000;
    let lastDescTime = 0;

    while (Date.now() - t0 < TIMEOUT) {
      let det;
      try {
        det = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks().withFaceDescriptor();
      } catch (e) { break; }
      if (det) {
        const lm = det.landmarks;
        // EAR (eye aspect ratio): <0.22 = หลับตา
        const earOf = (pts) => {
          const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
          return (d(pts[1], pts[5]) + d(pts[2], pts[4])) / (2 * d(pts[0], pts[3]));
        };
        const ear = Math.min(earOf(lm.getLeftEye()), earOf(lm.getRightEye()));
        if (ear < 0.22) earLow = true;
        else if (earLow && ear > 0.28) { blinkDone = true; earLow = false; }

        // Yaw: ตำแหน่งจมูกเทียบ corner ตา (ซ้าย=0 ขวา=1)
        const nose = lm.getNose()[3], le = lm.getLeftEye()[0], re = lm.getRightEye()[3];
        const ratio = (nose.x - le.x) / Math.max(1e-6, re.x - le.x);
        if (ratio < 0.30) yawSeenLeft = true;
        if (ratio > 0.70) yawSeenRight = true;
        if (yawSeenLeft && yawSeenRight) turnDone = true;

        // quality gate: ขนาดหน้า + ความสว่าง
        const w = det.detection.box.width;
        if (w >= 90) {
          const bright = await this._brightness(videoEl);
          if (bright >= 45 && bright <= 225 && Date.now() - lastDescTime > 900 && ear > 0.26) {
            descs.push(det.descriptor); lastDescTime = Date.now();
          }
        }

        const next = challenges.find(c => c === 'blink' && !blinkDone) || challenges.find(c => c === 'turn' && !turnDone);
        say(!next ? '✓ ดีมาก! อยู่นิ่งๆ...' : next === 'blink' ? '👁 กระพริบตาชัดๆ 1 ครั้ง' : '↔️ หันหน้าอีกฝั่ง (ซ้าย→ขวา)');
      } else say('ไม่พบใบหน้า — อยู่กลางกล้อง');

      if (blinkDone && turnDone && descs.length >= 3) break;
      await new Promise(r => setTimeout(r, 120));
    }

    if (!blinkDone) return { ok: false, msg: '❌ ไม่พบการกระพริบตา — อาจเป็นรูป/วิดีโอ (anti-spoof) ลองใหม่แบบสดๆ' };
    if (!turnDone) return { ok: false, msg: '❌ ไม่พบการหันหน้าซ้าย-ขวา — ลองใหม่ช้าๆ ชัดๆ' };
    if (descs.length < 2) return { ok: false, msg: 'ภาพไม่ผ่านคุณภาพ (สว่างพอ? หน้าใหญ่พอ?) — ลองในที่แสงดีกว่า' };
    // frame consistency: ทุกเฟรมต้องเป็นคนเดียวกัน
    for (let i = 1; i < descs.length; i++)
      if (Math.hypot(...descs[0].map((v, j) => v - descs[i][j])) > this.MATCH_THRESHOLD)
        return { ok: false, msg: '❌ ใบหน้าเปลี่ยนระหว่างแสกน — แสกนใหม่ด้วยบุคคลเดียว' };
    return { ok: true, descriptor: avgDescriptor(descs), frames: descs.length, liveness: { blink: blinkDone, turn: turnDone } };
  },

  /* ══ brightness จาก canvas เล็ก (quality gate) ══ */
  async _brightness(videoEl) {
    try {
      const cv = document.createElement('canvas');
      cv.width = 32; cv.height = 24;
      cv.getContext('2d').drawImage(videoEl, 0, 0, 32, 24);
      const px = cv.getContext('2d').getImageData(0, 0, 32, 24).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      return Math.round(s / (px.length / 4));
    } catch (e) { return 128; }
  },

  /* ══ 4) ใบหน้าจากรูปบัตร — multi-face rejection + size gate ══ */
  async faceFromImage(imgEl) {
    await this.loadModels();
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
    const all = await faceapi.detectAllFaces(imgEl, opts);
    if (all.length === 0) return { ok: false, msg: 'ไม่พบใบหน้าในรูปบัตร — ใช้รูปที่เห็นหน้าชัดๆ ไม่เอียง' };
    if (all.length > 1) return { ok: false, msg: 'พบ ' + all.length + ' ใบหน้าในรูป — ต้องเป็นรูปบัตรที่เห็นหน้าเดียว (anti-fraud)' };
    const big = all[0].box.width;
    if (big < 60) return { ok: false, msg: 'ใบหน้าบนบัตรเล็กเกินไป — ถ่ายรูปบัตรให้ใหญ่/ชัดกว่านี้' };
    const det = await faceapi.detectSingleFace(imgEl, opts).withFaceLandmarks().withFaceDescriptor();
    if (!det) return { ok: false, msg: 'ตรวจ landmark ไม่ได้ — รูปเบลอหรือเอียงเกิน' };
    return { ok: true, descriptor: det.descriptor };
  },

  /* ══ 5) เทียบหน้า: euclidean distance < 0.6 = คนเดียวกัน ══ */
  compareFaces(descA, descB) {
    const dist = Math.hypot(...descA.map((v, i) => v - descB[i]));
    const score = Math.max(0, Math.min(100, Math.round((1 - dist / 1.2) * 100)));
    return { match: dist < this.MATCH_THRESHOLD, distance: +dist.toFixed(3), score, threshold: this.MATCH_THRESHOLD };
  },
};

function avgDescriptor(frames) {
  const out = new Array(frames[0].length).fill(0);
  for (const f of frames) for (let i = 0; i < f.length; i++) out[i] += f[i];
  return out.map(v => v / frames.length);
}
async function await_sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
/* ══ 6) Remote KYC provider adapter (Lv.2 regulated — Q3 roadmap) ══
   Sumsub/Persona/Onfido ต้องมี server-side token (API secret ห้ามอยู่ใน browser เด็ดขาด)
   Operator ต้องรัน proxy เล็กๆ: POST / → {token, url, userId} แล้วเก็บ endpoint ใน nx_kyc_proxy
   ผลยืนยันจริงเดินทางผ่าน provider webhook → server → sign on-chain proof */
NexusKYC.remote = {
  providers: ['sumsub', 'persona', 'onfido'],
  async start(provider = 'sumsub') {
    if (!this.providers.includes(provider)) return { ok: false, msg: 'provider ไม่รู้จัก: ' + provider };
    const proxyUrl = localStorage.getItem('nx_kyc_proxy') || '';
    if (!proxyUrl) return { ok: false, msg: 'ตั้งค่า nx_kyc_proxy ก่อน (endpoint ที่คืน {token,url,userId} จาก provider API)' };
    try {
      const r = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) });
      const j = await r.json();
      if (!j.token || !j.url) return { ok: false, msg: 'proxy ตอบไม่ตรง format {token,url,userId}' };
      const w = window.open(j.url, '_blank', 'width=480,height=720');
      if (!w) return { ok: false, msg: 'popup ถูกบล็อก — อนุญาตแล้วลองใหม่' };
      localStorage.setItem('nx_kyc_remote', JSON.stringify({ provider, userId: j.userId || '', at: Date.now() }));
      return { ok: true, msg: 'เปิดหน้ายืนยัน ' + provider + ' แล้ว — สถานะจะอัปเดตผ่าน webhook' };
    } catch (e) { return { ok: false, msg: 'proxy error: ' + String(e.message || e).slice(0, 60) }; }
  },
};

window.NexusKYC = NexusKYC;
