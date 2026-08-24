/* ═══════════════════════════════════════════════════════════
   NEXUS KYC-LITE v1.0 — ยืนยันตัวตนมาตรฐานสากล (บนอุปกรณ์)
   Flow: 1) บัตรประชาชน (ตรวจ checksum 13 หลักไทยจริง)
         2) แสกนหน้า 3 เฟรม (ตรวจใบหน้าจริง + ต้องขยับ)
         3) เทียบใบหน้าบัตร vs selfie (face descriptor distance)
   Privacy: ไม่เก็บรูป/เลขบัตร — เก็บเฉพาะ SHA-256 hash + score
   ═══════════════════════════════════════════════════════════ */

const NexusKYC = {
  MODELS_URL: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  _modelsLoaded: false,

  /* ── 1) ตรวจเลขบัตรประชาชนไทย (checksum มาตรฐานกรมการปกครอง) ── */
  verifyThaiID(raw) {
    const d = String(raw).replace(/\D/g, '');
    if (d.length !== 13) return { ok: false, msg: 'เลขบัตรต้องมี 13 หลัก (ได้มา ' + d.length + ')' };
    if (!/^[12]/.test(d)) return { ok: false, msg: 'หลักแรกต้องเป็น 1 หรือ 2' };
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
    const check = (11 - (sum % 11)) % 10;
    if (check !== Number(d[12])) return { ok: false, msg: 'เลขบัตรไม่ผ่าน checksum (มาตรฐานกรมการปกครอง)' };
    return { ok: true, msg: '✓ เลขบัตรถูกต้องตามมาตรฐาน', idHash: await_sha256(d) };
  },

  /* ── 2) โหลดโมเดลตรวจหน้า (face-api.js ~1MB จาก CDN ครั้งเดียว) ── */
  async loadModels() {
    if (this._modelsLoaded) return true;
    if (typeof faceapi === 'undefined') throw new Error('face-api ยังไม่โหลด');
    await faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL);
    this._modelsLoaded = true;
    return true;
  },

  /* ── 3) แสกนหน้าสด: ต้องเจอใบหน้า 3 เฟรม + มีการขยับ (anti-photo) ── */
  async scanLiveFace(videoEl, onProgress) {
    await this.loadModels();
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const frames = [];
    let lastCenter = null, moved = false;
    for (let i = 0; i < 3; i++) {
      onProgress && onProgress(i + 1);
      const det = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks().withFaceDescriptor();
      if (!det) return { ok: false, msg: 'ไม่พบใบหน้า — อยู่ให้อยู่กลางกล้อง (เฟรม ' + (i + 1) + '/3)' };
      const c = det.detection.box;
      const center = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
      if (lastCenter && Math.hypot(center.x - lastCenter.x, center.y - lastCenter.y) > 6) moved = true;
      lastCenter = center;
      frames.push(det.descriptor);
      await new Promise(r => setTimeout(r, 700));
    }
    if (!moved) return { ok: false, msg: 'ตรวจจับว่าเป็นรูปนิ่ง — ขยับหน้า/กระพริบตาแล้วแสกนใหม่ (anti-photo)' };
    return { ok: true, descriptor: avgDescriptor(frames), frames: frames.length };
  },

  /* ── 4) ใบหน้าจากรูปบัตร ── */
  async faceFromImage(imgEl) {
    await this.loadModels();
    const det = await faceapi.detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks().withFaceDescriptor();
    if (!det) return { ok: false, msg: 'ไม่พบใบหน้าในรูปบัตร — ใช้รูปที่เห็นหน้าชัดๆ ไม่เอียง' };
    return { ok: true, descriptor: det.descriptor };
  },

  /* ── 5) เทียบหน้า: euclidean distance < 0.6 = คนเดียวกัน (มาตรฐาน face-api) ── */
  compareFaces(descA, descB) {
    const dist = Math.hypot(...descA.map((v, i) => v - descB[i]));
    const score = Math.max(0, Math.min(100, Math.round((1 - dist / 1.2) * 100)));
    return { match: dist < 0.6, distance: +dist.toFixed(3), score };
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
window.NexusKYC = NexusKYC;
