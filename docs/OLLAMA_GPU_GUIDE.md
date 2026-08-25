# Ollama GPU Guide — รัน "AI ฉลาดระดับแข็ง" บนเครื่องเราเอง
> เป้าหมาย: ใช้การ์ดจอ ~300k THB (RTX 4090/5090 24-32GB) กลายเป็นสมองกลางของ Nexus Twin
> — ผู้ใช้ใน app เลือก provider **Ollama** → ตอบด้วยโมเดลใหญ่ · ฟรี · privacy ยังอยู่

## 1) ซื้ออะไรดี

| Budget | Spec แนะนำ | โมเดลที่รันได้สบาย |
|---|---|---|
| ~300k | RTX 4090/5090 24GB + 64GB RAM + NVMe 2TB | Qwen2.5-32B q4 (~20GB) เร็วดี · Llama-3.3-70B q4 (~40GB) ช้ากว่าแต่ฉลาด |
| ~150k | RTX 4080S/5070Ti 16GB | Qwen2.5-14B / Gemma2-27B q4 |
| 0 บาท (มีเครื่องธรรมดา) | CPU/RAM 16GB | Qwen2.5-7B q4 ช้าแต่ใช้ได้ |

## 2) ติดตั้ง Ollama (5 นาที)

```powershell
winget install Ollama.Ollama
ollama pull qwen2.5:32b          # หรือโมเดลตาม spec
ollama serve                     # เปิด API ที่ http://localhost:11434
```

## 3) เปิดให้คนนอก LAN เข้าถึง (ถ้าจะให้ user ใช้ผ่าน Twin)

```powershell
# Environment variable (Windows):
OLLAMA_HOST=0.0.0.0:11434        # และเปิด port ใน firewall
# Production: ครอบด้วย Cloudflare Tunnel แทน expose ตรงๆ:
cloudflared tunnel --url http://localhost:11434
```
> ⚠️ ห้าม expose ตรงสู่ internet ไม่มี auth — ใช้ tunnel + access policy

## 4) เชื่อมกับ Nexus Twin

เว็บ → การ์ด Digital Twin → **สมอง:** เลือก `Ollama` → กรอก endpoint
(เช่น `http://localhost:11434` หรือ tunnel URL) → คุยได้เลย

## 5) ทำไม path นี้ = จุดขายระดับโลก

- **"Your AI, your hardware"** — คู่กับ on-device memory = privacy story สมบูรณ์ 100%
- ต้นทุน token = 0 บาท ตลอดชีพ (เทียบ API คิดต่อ request)
- ปรับโมเดลได้อิสระ (swap 32B→70B→future) ไม่ผูก vendor
- ต่อยอดได้: fine-tune LoRA บนข้อมูลภาษาไทยของชุมชน (Phase หลัง audit)

## 6) Checklist ก่อนเปิด public node
- [ ] Rate limit ต่อ IP (nginx/caddy หน้า Ollama)
- [ ] Log rotation + monitor VRAM/temp
- [ ] Model license เช็ค commercial use (Qwen/Llama Apache/Llama license)
- [ ] Backup config + script auto-restart
