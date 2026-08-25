# 📱 Nexus Mobile — APK & iOS Kit

## 🤖 Android (APK/AAB) — PWA → TWA ด้วย Bubblewrap

### ขั้นที่ 1: เตรียม assetlinks.json (เชื่อม app ↔ เว็บ)
1. สร้าง keystore:
```powershell
keytool -genkeypair -v -keystore nexus-release.keystore -alias nexus -keyalg RSA -keysize 2048 -validity 10000
```
2. ดึง fingerprint:
```powershell
keytool -list -v -keystore nexus-release.keystore -alias nexus | Select-String "SHA256"
```
3. วาง SHA256 ลง `assetlinks.json` (template อยู่ข้างล่าง) → upload ไปที่ repo `nexus-deploy/.well-known/assetlinks.json`
4. Push → verify: https://pp0910619247-netizen.github.io/nexus-architect/.well-known/assetlinks.json

### ขั้นที่ 2: Build APK
```powershell
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://pp0910619247-netizen.github.io/nexus-architect/manifest.json
bubblewrap build          # ได้ app-release-signed.apk + .aab
```

## 🍎 iOS — 2 ทาง

| ทาง | ต้นทุน | ขั้นตอน |
|---|---|---|
| **PWA Add to Home** (แนะนำเริ่ม) | ฟรี | Safari → Share → Add to Home Screen — ทำงาน fullscreen ครบ (manifest+SW พร้อมอยู่แล้ว) |
| App Store จริง | $99/ปี + Mac | Capacitor wrapper: `npx cap init` + load URL → Xcode build (Apple ไม่ค่อยรับ thin wrapper — ต้องมี native feature เพิ่น เช่น push) |

---

## Templates

### `.well-known/assetlinks.json` (แก้ SHA256 + package name)
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.nexusarchitect.twa",
    "sha256_cert_fingerprints": ["AA:BB:CC:...:ZZ"]
  }
}]
```

### bubblewrap answers cheat-sheet
```
Application ID : io.nexusarchitect.twa
App name       : Nexus Architect
Short name     : Nexus
Theme color    : #0a0e17
Background     : #0a0e17
Start URL      : https://pp0910619247-netizen.github.io/nexus-architect/
Icon           : 512px (มีใน repo แล้ว)
```
