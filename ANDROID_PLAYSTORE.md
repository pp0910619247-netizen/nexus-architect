# Nexus — Android APK & Play Store Build Guide

แอปของเราเป็น **PWA** (install ได้จาก Chrome ทันที) และแปลงเป็น **APK/AAB** ขึ้น Play Store ได้ 2 ทาง

---

## ทางที่ 1: Install ฟรี ทันที (PWA) — ทำได้วันนี้

1. Deploy เว็บขึ้น HTTPS (Netlify Drop / Vercel — ฟรี)
2. เปิดเว็บจากมือถือ → Chrome → เมนู ⋮ → **"Install app" / "เพิ่มไปยังหน้าแรก"**
3. ได้ไอคอนแอป หน้าจอเต็ม เหมือน native app — ใช้งานได้จริงทันที

---

## ทางที่ 2: APK จริงผ่าน Bubblewrap (TWA) — แนะนำสำหรับ Play Store

**เตรียม:** JDK 17+ (`winget install Microsoft.OpenJDK.17`) + เว็บ live บน HTTPS

```powershell
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.json
bubblewrap build          # ได้ app-release-signed.apk + .aab
```

ครั้งแรกจะถาม:
- Key store password (ตั้งใหม่ — **เก็บให้ปลอดภัย ห้ามหาย** ถ้าหาย = อัปเดตแอปไม่ได้ตลอดชีพ)
- จะสร้าง signing key ให้อัตโนมัติ

ทดสอบ: `bubblewrap install --apk app-release-signed.apk` (ต่อมือถือผ่าน USB + เปิด USB debugging)

---

## ทางที่ 3: Capacitor (ถ้าอนาคตต้องใช้ native API)

```powershell
npm install @capacitor/core @capacitor/cli
npx cap init Nexus com.nexusarchitect.app --web-dir=../app
npx cap add android
npx cap open android    # ต้องติดตั้ง Android Studio
```
Build ใน Android Studio: Build > Generate Signed Bundle (AAB)

---

## Play Store Checklist

| ขั้น | รายละเอียด | ค่าใช้จ่าย |
|---|---|---|
| 1 | สมัคร Google Play Console (developer account) | $25 ครั้งเดียว |
| 2 | เตรียม AAB (จาก Bubblewrap/Capacitor) | — |
| 3 | Store listing: ชื่อ/คำอธิบาย (มีให้ด้านล่าง) + สกรีนช็อต 2-8 ภาพ + ไอคอน 512px | — |
| 4 | **Privacy Policy URL** (บังคับ! — ใช้ไฟล์ PRIVACY_POLICY.md ของเรา โพสต์เป็นเว็บ) | — |
| 5 | Data safety form: ระบุว่าเก็บข้อมูลอะไรบ้าง | — |
| 6 | Content rating questionnaire + Target audience | — |
| 7 | ส่ง review (ใช้เวลา 1-7 วัน) | — |

### Store Listing (พร้อมใช้)

**Title:** Nexus Architect — AI Twin & The Mountain

**Short description (80 ตัวอักษร):**
> AI Twin ส่วนตัวของคุณ + ภูเขาปัญญาร่วมแก้ปัญหาโลกบน blockchain

**Full description:**
> 🐉 DIGITAL TWIN ของคุณเอง
> AI ส่วนตัวที่จดจำทุกอย่างเกี่ยวกับคุณ ความจำ 100% อยู่บนเครื่อง (on-device) เข้ารหัส AES-256 ไม่มีเซิร์ฟเวอร์กลาง ไม่มีใครอ่านได้
>
> 🏔 THE MOUNTAIN — กระดานปัญหาโลก
> เสนอปัญหา โหวต และร่วมกันแก้ ปัญหาที่คะแนนสูงสุดกลายเป็น Mission Peak บันทึกถาวรบน Polygon blockchain
>
> ⚖️ เศรษฐกิจ 20/80
> ผู้แก้ปัญหาได้รับรางวัล 20% อีก 80% กระจายสู่ทุกคนที่ร่วม — smart contract แบ่งให้อัตโนมัติ
>
> 🔒 ความปลอดภัยระดับโปรดักชัน
> • Private key ไม่เคยออกจาก MetaMask
> • API keys เข้ารหัส AES-GCM
> • XSS protection + CSP + rate limiting
> • Offline mode ครบทุกฟีเจอร์หลัก
>
> ดาวน์โหลดฟรี — เริ่มต้นใช้ได้ทันทีไม่ต้องสมัครสมาชิก

### สกรีนช็อตที่ต้องมี (1080×1920)
1. หน้า Mountain มีปัญหา + votes
2. หน้าคุยกับ Twin
3. หน้า On-chain แสดง transaction สำเร็จ
4. หน้า Reward Splitter
