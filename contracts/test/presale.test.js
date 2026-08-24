// Test: NexusPresale — ขายเป็นรอบ ราคาขึ้น + spillover + refund
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

describe("NexusPresale — round-based sale", () => {
  let hEthers, nex, presale, admin, buyer2, buyer3;
  const CAP = ethers.parseEther("1000");            // 1000 NEX / รอบ
  const BASE_PRICE = ethers.parseEther("0.0001");   // 0.0001 native ต่อ NEX

  beforeEach(async () => {
    ({ ethers: hEthers } = await network.getOrCreate());
    [admin, , buyer2, buyer3] = await hEthers.getSigners();
    nex = await (await hEthers.getContractFactory("NexusToken", admin)).deploy();
    await nex.waitForDeployment();
    presale = await (await hEthers.getContractFactory("NexusPresale", admin))
      .deploy(await nex.getAddress(), 0, BASE_PRICE, CAP);
    await presale.waitForDeployment();
    // โอน NEX เข้า contract ให้พอขาย 5 รอบ
    await nex.mint(admin.address, CAP * 5n);
    await nex.transfer(await presale.getAddress(), CAP * 5n);
  });

  it("ราคา escalate ×1.5 ต่อรอบ", async () => {
    expect(await presale.priceOf(0)).to.equal(BASE_PRICE);
    expect(await presale.priceOf(1)).to.equal(BASE_PRICE * 150n / 100n);
    expect((await presale.priceOf(4) * 10000n) / BASE_PRICE).to.equal(50625n); // 1.5^4 = 5.0625
  });

  it("ซื้อพื้นฐาน: จ่าย native → ได้ NEX ทันที + totalRaised ถูกต้อง", async () => {
    const payValue = ethers.parseEther("0.1"); // = 1000 NEX @ รอบแรก → เต็ม cap รอบเดียว
    await presale.connect(buyer2).buy({ value: payValue });
    const bal = await nex.balanceOf(buyer2.address);
    expect(bal).to.equal(CAP);                  // ได้เต็ม cap รอบแรก (spill เกิดแล้ว)
    expect(await presale.roundSold(0)).to.equal(CAP);
    expect(Number(await presale.currentRound())).to.equal(1);
  });

  it("จ่ายพอดี 2 รอบ → ได้ 2000 NEX หยุดที่ boundary", async () => {
    // ต้นทุน 2 รอบแรก: CAP@p0 + CAP@p1 (tokens*price/1e18)
    const costAll = CAP * BASE_PRICE / 10n ** 18n + CAP * (BASE_PRICE * 150n / 100n) / 10n ** 18n;
    await presale.connect(buyer3).buy({ value: costAll });
    const got = await nex.balanceOf(buyer3.address);
    expect(got).to.equal(CAP * 2n);
    expect(await presale.totalRaised()).to.equal(costAll);
    expect(Number(await presale.currentRound())).to.equal(2);
  });

  it("จ่ายเว่อร์มากหลังขายหมดทุกรอบ → ได้ NEX สูงสุด + refund เงินเกิน", async () => {
    const before = await hEthers.provider.getBalance(buyer3.address);
    await presale.connect(buyer3).buy({ value: ethers.parseEther("5") }); // เกิน capacity ทั้ง market
    expect(await nex.balanceOf(buyer3.address)).to.equal(CAP * 5n);       // ได้ทุกรอบ
    const after = await hEthers.provider.getBalance(buyer3.address);
    expect(after > before - ethers.parseEther("5") + ethers.parseEther("3")).to.equal(true); // refund ~3.68
    expect(await presale.totalRaised()).to.equal(await hEthers.provider.getBalance(await presale.getAddress()));
  });

  it("ยังไม่เปิดขาย → revert NotStarted", async () => {
    const p2 = await (await hEthers.getContractFactory("NexusPresale", admin))
      .deploy(await nex.getAddress(), 3600, BASE_PRICE, CAP);
    await p2.waitForDeployment();
    await nex.mint(admin.address, CAP);
    await nex.transfer(await p2.getAddress(), CAP);
    await expect(p2.connect(buyer2).buy({ value: ethers.parseEther("0.01") }))
      .to.be.revertedWithCustomError(p2, "NotStarted");
  });

  it("ขายครบทุกรอบ → SoldOut", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await presale.priceOf(i);
      await presale.connect(buyer2).buy({ value: CAP * r / 10n ** 18n });
    }
    await expect(presale.currentRound()).to.be.revertedWithCustomError(presale, "SoldOut");
    await expect(presale.connect(buyer2).buy({ value: ethers.parseEther("0.01") }))
      .to.be.revertedWithCustomError(presale, "TooSmall");
  });

  it("owner ถอน proceeds ได้", async () => {
    await presale.connect(buyer2).buy({ value: ethers.parseEther("0.05") });
    const balBefore = await hEthers.provider.getBalance(admin.address);
    await presale.withdrawProceeds();
    const balAfter = await hEthers.provider.getBalance(admin.address);
    expect(balAfter > balBefore).to.equal(true);
  });
});
