# NexusApp — Android Studio Project (WebView Shell)

แอป Android จริงที่โหลด Nexus Architect เว็บของเรา · พร้อม mic permission · icon ภูเขาทอง

## 🚀 เปิดใช้ครั้งแรก (5 นาที)

1. ติดตั้ง **Android Studio** (ฟรี): https://developer.android.com/studio
2. Open → เลือกโฟลเดอร์ `mobile/NexusApp` นี้
3. รอ Gradle sync (โหลด dependencies ครั้งแรก ~2-5 นาที)
   - ถ้าถาม Gradle wrapper: กด OK ให้ Android Studio สร้างให้อัตโนมัติ
4. เสียบมือถือ (เปิด USB Debugging) หรือใช้ Emulator
5. กด ▶️ Run

## 📦 Build APK แจกจ่าย

```
Build → Build Bundle(s)/APK(s) → Build APK(s)
→ app/build/outputs/apk/debug/app-debug.apk
```
Release signed: Build → Generate Signed App Bundle/APK → สร้าง keystore ตาม wizard

## 🧩 สิ่งที่ Shell นี้ให้ (เหนือกว่าเปิดผ่าน browser)

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Mic permission | ขอครั้งเดียวตอนเปิดแอป — ปุ่ม 🎤 ใน Twin ใช้ได้ทันที |
| Camera (KYC liveness) | WebView grant อัตโนมัติ |
| Fullscreen theme | พื้นดำ + status bar ดำสนิต |
| Icon ภูเขาทอง | adaptive icon |
| Back button | = goBack ในเว็บ |

## 🔁 การอัปเดตหน้าแอป

**ไม่ต้อง build ใหม่!** หน้าจอทั้งหมดโหลดจากเว็บ:
- แก้ `nexus-deploy/index.html` → push → user เห็นทันที (SW cache จะ update เอง)

## 📲 ขึ้น Play Store (ภายหลัง)
1. เปลี่ยน applicationId เป็น package ของคุณ
2. Generate Signed AAB (keystore เดียวกับ assetlinks.json → แก้ SHA256 ให้ตรง)
3. Play Console ($25 ครั้งเดียว) + screenshots + privacy policy (มีใน repo)

## ⚠️ หมายเหตุ
- minSdk 26 (Android 8.0+ ครอบคลุม ~97% เครื่อง)
- ถ้าอยากได้ Push notification ("Mountain มีโจทย์ใหม่") → sprint ถัดไปเพิ่ม FCM
