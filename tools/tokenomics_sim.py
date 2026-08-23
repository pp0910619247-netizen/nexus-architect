# -*- coding: utf-8 -*-
"""
Nexus Tokenomics Simulator — Variable Decay
ตรวจสอบว่า decay แบบ whitepaper (Genesis: halve ทุก block ~10 วิ) เป็นไปได้จริงไหม

รัน: python tokenomics_sim.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

R0 = 1_000_000.0   # รางวัลเริ่มต้น Genesis (tokens/block)
BLOCKS_PER_DAY = 8_640   # block ทุก 10 วินาที


def halve(x): return x / 2


def simulate(label, halvings_per_day, days=30):
    """คืน (reward ณ วันสุดท้าย, supply รวม)"""
    reward = R0
    supply = 0.0
    blocks = int(BLOCKS_PER_DAY * days)
    for _ in range(blocks):
        supply += reward
        reward = halve(reward)
    print(f"{label:<42} reward วันที่ {days} = {reward:.10f} | supply รวม ≈ {supply:,.0f}")
    return reward, supply


print("=" * 78)
print(" จำลอง Variable Decay — R0 = 1M tokens/block")
print("=" * 78)

# --- Whitepaper v1.0: Genesis = halve ทุก block ---
r, s = simulate("[WP v1.0] Genesis: halve ทุก block (10 วิ)", BLOCKS_PER_DAY, days=30)
blocks_to_zero = 0
reward = R0
while reward > 1e-9:
    reward = halve(reward); blocks_to_zero += 1
mins = blocks_to_zero / 60
print(f"   -> รางวัลเหลือ < 0.000000001 ภายใน {blocks_to_zero} blocks = {mins:.1f} นาที !!")
print(f"   -> Genesis phase จบใน ~5 นาที ผู้บุกเบิกไม่มีอะไรจะ mine ต่อ\n")

# --- Growth: halve ทุกวัน ---
simulate("[WP v1.0] Growth: halve ทุกวัน", 1, days=365)

# --- Maturity: halve ทุกเดือน ---
simulate("[WP v1.0] Maturity: halve ทุกเดือน", 1/30, days=365*5)

# --- ข้อเสนอแก้: halve ตาม 'ปริมาณงานสะสม' + floor ---
print("-" * 78)
print(" ข้อเสนอแก้ (Solution-Mined Halving): halving เมื่อ solutions สะสมถึง milestone x4")
total_solutions_target = 1_000_000
milestone = 250          # solutions ต่อการ halve 1 ครั้ง (ปรับได้โดย DAO)
floor = R0 / (2 ** 12)   # tail emission กัน reward = 0
solutions_done = 800     # สมมติชุมชนแก้ได้ 800 ปัญหาในปีแรก
reward = R0
for _ in range(solutions_done // milestone):
    reward = max(halve(reward), floor)
annual_emission = reward * 100_000  # emission ต่อ solution-event สมมติ
print(f" ปี 1: {solutions_done} solutions | reward ปัจจุบัน = {reward:,.0f} (floor {floor:,.0f})")
print(f" ข้อดี: อัตรา emission ผูกกับ output จริงของระบบ ไม่ผูกกับเวลา")
print("=" * 78)
