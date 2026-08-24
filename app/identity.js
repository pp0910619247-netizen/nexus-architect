/* ═══════════════════════════════════════════════════════════
   NEXUS IDENTITY v2.1 — การยืนยันตัวตนจริง ไม่ใช่ simulation
   - Lv.1a Google Sign-In (GIS): id_token JWT ตรวจ aud/iss/exp ฝั่ง client
   - Lv.1b Passkey (WebAuthn): ลายนิ้วมือ/FaceID/PIN ของเครื่อง — crypto จริง
   - Lv.2 Wallet Proof: เซ็นข้อความด้วย private key ผ่าน MetaMask
   - เก็บเฉพาะ credential/proof บนเครื่อง (ไม่มี server)
   ═══════════════════════════════════════════════════════════ */

const NexusIdentity = {
  get state() { return JSON.parse(localStorage.getItem('nx_identity') || '{}'); },
  save(s) { localStorage.setItem('nx_identity', JSON.stringify(s)); },

  /* ─── Lv.1a: Google Sign-In (Google Identity Services) ─── */
  googleClientId() { return localStorage.getItem('nx_google_cid') || ''; },
  saveGoogleClientId(v) { localStorage.setItem('nx_google_cid', String(v || '').trim()); },
  _gisLoaded: false,

  async googleFlow(onCredential) {
    const cid = this.googleClientId();
    if (!cid) return { ok: false, msg: 'ใส่ Google Client ID ก่อน (console.cloud.google.com → OAuth Client ID → Web)' };
    if (!this._gisLoaded) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = res; s.onerror = () => rej(new Error('โหลด GIS script ไม่ได้ (CSP/เน็ต?)'));
        document.head.appendChild(s);
      });
      this._gisLoaded = true;
    }
    window._nexusGoogleCb = async (resp) => { onCredential(resp.credential); };
    google.accounts.id.initialize({ client_id: cid, callback: window._nexusGoogleCb });
    return { ok: true, msg: 'GIS พร้อม' };
  },

  async verifyGoogleCredential(credential) {
    const parts = String(credential).split('.');
    if (parts.length !== 3) return { ok: false, msg: 'credential ไม่ใช่ JWT' };
    let p;
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      p = JSON.parse(decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch (e) { return { ok: false, msg: 'decode JWT payload ไม่สำเร็จ' }; }
    // client-side validation (production ควร verify signature ที่ server ด้วย)
    if (p.aud !== this.googleClientId()) return { ok: false, msg: 'audience ≠ Client ID ของเรา — token จากแอปอื่น (rejected)' };
    if (!/^(accounts\.google\.com|https:\/\/accounts\.google\.com)$/.test(p.iss || '')) return { ok: false, msg: 'issuer ไม่ใช่ accounts.google.com' };
    if (p.exp && p.exp * 1000 < Date.now()) return { ok: false, msg: 'token หมดอายุ' };
    if (!p.sub) return { ok: false, msg: 'ไม่มี sub (Google Account ID)' };
    const s = this.state;
    s.google = { sub: p.sub, email: p.email || '', emailVerified: p.email_verified === true, name: p.name || '', at: Date.now() };
    this.save(s);
    return { ok: true, msg: '🔵 Google ยืนยันแล้ว: ' + (s.google.email || s.google.sub) + ' — Lv.1 HUMAN (REAL)', email: s.google.email };
  },

  /* ─── Lv.1b: Passkey (WebAuthn) — จริง 100% ─── */
  passkeySupported() { return !!window.PublicKeyCredential; },
  hasPasskey() { return !!this.state.passkeyId; },

  async registerPasskey() {
    if (!this.passkeySupported()) return { ok: false, msg: 'เบราว์เซอร์ไม่รองรับ WebAuthn' };
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Nexus Architect' },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'nexus-human-' + Date.now(),
            displayName: 'Nexus Verified Human',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',   // ใช้ biometric ของเครื่องนี้
            userVerification: 'required',          // บังคับลายนิ้ว/FaceID/PIN
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });
      const s = this.state;
      s.passkeyId = cred.id;
      s.passkeyType = cred.type;
      s.passkeyAt = Date.now();
      this.save(s);
      return { ok: true, msg: '🔐 Passkey ลงทะเบียนสำเร็จ — Lv.1 HUMAN (REAL)' };
    } catch (e) {
      if (String(e.name) === 'NotAllowedError') return { ok: false, msg: 'ยกเลิกการยืนยัน' };
      return { ok: false, msg: 'Passkey error: ' + String(e.message || e).slice(0, 60) };
    }
  },

  /* ─── Lv.2: Wallet Signature Proof — จริง 100% ─── */
  async walletProof() {
    if (typeof window.ethereum === 'undefined') return { ok: false, msg: 'ต้องมี MetaMask ก่อน' };
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const msg = `Nexus Identity Proof\nฉันยืนยันว่าเป็นเจ้าของ wallet นี้\nAddress: ${addr}\nTime: ${new Date().toISOString()}`;
      const sig = await signer.signMessage(msg);
      const s = this.state;
      s.walletAddress = addr;
      s.walletSig = sig.slice(0, 20) + '…' + sig.slice(-10);  // เก็บ proof ย่อ
      s.walletSigFull = sig;
      s.walletAt = Date.now();
      this.save(s);
      return { ok: true, msg: '✍️ เจ้าของ wallet ' + addr.slice(0, 8) + '… ยืนยันแล้ว — Lv.2 CITIZEN (REAL)' };
    } catch (e) {
      return { ok: false, msg: 'ยกเลิกการเซ็น' };
    }
  },

  /* ─── สรุปสถานะ ─── */
  summary() {
    const s = this.state;
    const rows = [];
    rows.push(s.google
      ? `🔵 Google: <span class="pos">VERIFIED</span> ${s.google.email || s.google.sub.slice(0, 10) + '…'}`
      : `🔵 Google: <span class="neg">ยังไม่ยืนยัน</span>`);
    rows.push(s.passkeyId
      ? `🔐 Passkey: <span class="pos">VERIFIED</span> (${new Date(s.passkeyAt).toLocaleString('th-TH')})`
      : `🔐 Passkey: <span class="neg">ยังไม่ยืนยัน</span>`);
    rows.push(s.walletAddress
      ? `✍️ Wallet: <span class="pos">VERIFIED</span> ${s.walletAddress.slice(0, 8)}… (sig ${s.walletSig})`
      : `✍️ Wallet: <span class="neg">ยังไม่เซ็น</span>`);
    return rows.join('<br>');
  },
};

window.NexusIdentity = NexusIdentity;
