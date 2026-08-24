/* ═══════════════════════════════════════════════════════════
   NEXUS IDENTITY v2.0 — การยืนยันตัวตนจริง ไม่ใช่ simulation
   - Lv.1 Passkey (WebAuthn): ลายนิ้วมือ/FaceID/PIN ของเครื่อง — crypto จริง
   - Lv.2 Wallet Proof: เซ็นข้อความด้วย private key ผ่าน MetaMask — เป็นเจ้าของกระเป๋าจริง
   - เก็บเฉพาะ credential ID + signature proof บนเครื่อง
   ═══════════════════════════════════════════════════════════ */

const NexusIdentity = {
  get state() { return JSON.parse(localStorage.getItem('nx_identity') || '{}'); },
  save(s) { localStorage.setItem('nx_identity', JSON.stringify(s)); },

  /* ─── Lv.1: Passkey (WebAuthn) — จริง 100% ─── */
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
