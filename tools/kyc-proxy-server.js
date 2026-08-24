// KYC Proxy Example — server จิ๋วสำหรับ NexusKYC.remote (Lv.2 regulated)
// หลักการ: API secret ของ provider (Sumsub/Persona) ต้องอยู่ฝั่ง server เท่านั้น
// Run: node kyc-proxy-server.js   → http://localhost:8787
// เว็บ: localStorage.setItem('nx_kyc_proxy','http://localhost:8787')
//
// Production: deploy บน Cloudflare Worker/Vercel Edge + ใส่ CORS origin ของเว็บจริงเท่านั้น

import { createServer } from 'node:http';

// ── ใส่ credentials จริงผ่าน env (ห้าม commit!) ──
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || '';
const SUMSUB_SECRET    = process.env.SUMSUB_SECRET || '';
const ALLOW_ORIGIN     = process.env.ALLOW_ORIGIN || 'https://pp0910619247-netizen.github.io';

const json = (res, code, obj) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  });
  res.end(JSON.stringify(obj));
};

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  // ── DEMO mode (ไม่มี key): คืน fake token ไว้ทดสอบ flow กับแอป ──
  if (!SUMSUB_APP_TOKEN) {
    const userId = 'demo-' + Date.now().toString(36);
    console.log('[demo] issuing mock verification for', userId);
    return json(res, 200, {
      token: 'demo_' + userId,
      url: 'https://developers.sumsub.com/demo/step-by-step-verification/', // demo page
      userId,
      note: 'DEMO MODE — set SUMSUB_APP_TOKEN/SUMSUB_SECRET for real checks',
    });
  }

  // ── REAL Sumsub flow (outline): ──
  // 1. POST /resources/applicants  → create applicant (levelName= basic-kyc)
  // 2. POST /resources/accessTokens?userId={id}&levelName=basic-kyc → {token,userId}
  // 3. ส่ง url = https://sdk.sumsub.com/ + token กลับไปให้ frontend เปิด WebSDK/HOSTED
  // 4. webhook ของ Sumsub ยิง ApplicantReviewed → server ตรวจ signature → sign proof on-chain
  try {
    const body = await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d||'{}'))); });
    if ((body.provider || '') !== 'sumsub') return json(res, 400, { error: 'unsupported provider' });

    // TODO(real): implement HMAC-SHA256 signed Sumsub requests here (docs.sumsub.com)
    return json(res, 501, { error: 'wire real Sumsub calls here (see comments)' });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e).slice(0, 120) });
  }
}).listen(8787, () => console.log('KYC proxy on http://localhost:8787 — CORS:', ALLOW_ORIGIN));
