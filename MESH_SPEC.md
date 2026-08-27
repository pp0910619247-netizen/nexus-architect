# NEXUS MESH — AI สิงทั่วเน็ต (No Server) Spec v0.1

> AI ไม่ได้อยู่บน server หรือบนเชน แต่อยู่บนเครื่องผู้ใช้ทุกเครื่องแล้วคุยกันเองผ่าน P2P, เชนทำแค่จ่ายเงิน+เก็บ hash

## 1. สถาปัตยกรรม 4 ชั้น

```
Layer 4: App UI (Flutter `nexus-twin/lib/src/chat_screen.dart:1` + Web `app/twin.js:104`)
Layer 3: Memory Mesh (IPFS + OrbitDB) <- แทน server
Layer 2: P2P Gossip (libp2p + WebRTC + Waku) <- แทน backend
Layer 1: Polygon (NexusToken `contracts/contracts_sol/NexusToken.sol:9` + Presale `NexusPresaleUSDT.sol:13`) <- แค่ hash + payment + zk-proof
Layer 0: Compute (Local BitNet 400MB -> ถ้าไม่ไหวค่อยยืม Bittensor/Gensyn)
```

## 2. Data Flow — ส่งข้อความ 1 ครั้งเกิดอะไรขึ้น

1. User พิมพ์ -> `NexusMemory.extractFacts()` (`app/nexus-memory.js:20`) ดึง fact -> เข้ารหัส AES-GCM -> push ขึ้น IPFS ได้ CID `Qm...`
2. ส่ง CID ผ่าน libp2p pubsub topic `nexus/mesh/1` -> เครื่องเพื่อนทุกเครื่องที่ online ได้ CID ทันที
3. ส่ง hash ของ CID ขึ้น Polygon (call `MeshRegistry.publish(CID)`) ราคา ~$0.002
4. AI ตอบ: รัน local `BitNet-b1.58-2B-4T` (400MB) บนเครื่องตัวเอง ถ้า RAM ไม่พอ -> ส่ง prompt ไป worker ใน `Akash/Ritual` แล้วรับ `zk-proof` กลับมา verify บนเชน
5. คำตอบ + CID ใหม่ gossip ต่อ -> ทุกเครื่อง sync

> ไม่มี server กลาง: ถ้าเครื่องใดเครื่องหนึ่งดับ ข้อความยังอยู่บน IPFS + เพื่อนอีก n เครื่อง

## 3. Tech Stack ที่ใช้ได้วันนี้ (ไม่ต้องสร้างเชนใหม่)

| หน้าที่ | ใช้ตัวนี้ | ทำไม |
|---------|----------|------|
| P2P transport | `js-libp2p` (web) / `flutter_libp2p` (apk) + WebRTC | วิ่งใน browser ได้เลย ไม่ต้อง VPS |
| Message gossip | `Waku v2` หรือ `libp2p pubsub` | แทน websocket server |
| Storage | `web3.storage` / `Pinata` + `OrbitDB` | เอาไว้ pin CID ให้อยู่ถาวร, ถูกกว่า Arweave สำหรับ data เปลี่ยนบ่อย |
| Permanent log | `Arweave` | เก็บ hash ประวัติแบบถาวร |
| Compute | Local BitNet -> fallback `Phala Network` / `Ritual` | มี TEE + zk-proof ราคาถูก |
| Proof | `EZKL` | สร้าง proof ว่า inference นี้มาจาก model hash นี้จริง |

## 4. Contract ที่ต้องเพิ่ม (ต่อจากของเดิม)

```solidity
// MeshRegistry.sol — เก็บแค่ hash ไม่เก็บข้อมูลจริง
contract MeshRegistry is Ownable {
    mapping(address => string) public lastCID; // address -> IPFS CID ล่าสุด
    mapping(bytes32 => bool) public validProof; // zk-proof hash -> verified
    event Published(address indexed who, string cid, uint256 time);
    event ProofVerified(bytes32 proofHash, address worker);
    function publish(string calldata cid) external { lastCID[msg.sender]=cid; emit Published(msg.sender,cid,block.timestamp); }
    function submitProof(bytes32 h, bytes calldata proof) external { /* verify EZKL */ validProof[h]=true; }
}
```
Deployment เดิม `0xC30F...93fe` ไม่ต้องแตะ, เพิ่ม contract นี้ข้างๆ

## 5. Flutter/Web ต้องแก้ตรงไหน

- `nexus-twin/lib/src/memory.dart:130` — จาก `SharedPreferences` อย่างเดียว -> เพิ่ม `OrbitDB` sync + `publish()` ขึ้นเชน
- `nexus-twin/lib/src/bitnet_bridge.dart:6` — จาก `MethodChannel` -> เพิ่ม `libp2p` channel สำหรับส่ง prompt ไป worker
- `app/nexus-core.js:377` — `Qwen2.5-1.5B` -> สลับเป็น `BitNet-b1.58-2B-4T` GGUF `i2_s` (400MB) ที่โหลดจาก IPFS แทน HuggingFace

## 6. ต้นทุน (Polygon Mainnet)

- publish CID: ~30k gas = $0.002
- เก็บ 1GB บน web3.storage: ฟรี 5GB แรก, หลังจากนั้น $0.15/GB/เดือน
- เทียบกับสร้าง L1 ใหม่: ต้องหา validator 50-100 เครื่อง + audit $50k+

## 7. Roadmap 3 เฟส (ทำได้เลยไม่ต้องรอทุน)

**Phase 1 (2 สัปดาห์): Mesh Chat P2P** — Web + Flutter คุยกันเองผ่าน Waku + IPFS, ไม่ต้อง server, demo ได้ทันที
**Phase 2 (1 เดือน): Fallback Compute + Proof** — เพิ่ม Ritual/Phala + EZKL proof, เครื่องกากก็ตอบได้
**Phase 3 (หลังได้ทุน): Permanent AI** — pin ลง Arweave + เปิดให้ใครก็รัน worker ได้ + จ่ายด้วย NEX

---
> ไฟล์นี้เป็น spec ตั้งต้น — ต่อยอดจากของที่มี (`index.html:543` NEX, `app/` ทั้งชุด, `nexus-twin/`) ได้เลย ไม่ต้องทิ้งของเก่า
