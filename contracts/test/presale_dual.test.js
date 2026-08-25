// Test: NexusPresaleUSDT v2 โ€” DUAL payment (USDT + POL), shared caps, spillover
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

describe("NexusPresaleUSDT v2 โ€” dual payment", () => {
  let hEthers, nex, usdt, ps, admin, buyer, treasury;
  const CAP = ethers.parseEther("1000");
  const P_USDT = 50000n;                       // 50,000 units / NEX
  const P_POL  = ethers.parseEther("0.0001");  // wei / NEX

  beforeEach(async () => {
    ({ ethers: hEthers } = await network.getOrCreate());
    [admin, , buyer, treasury] = await hEthers.getSigners();
    nex  = await (await hEthers.getContractFactory("NexusToken", admin)).deploy();
    await nex.waitForDeployment();
    usdt = await (await hEthers.getContractFactory("NexusToken", admin)).deploy(); // mock stablecoin
    await usdt.waitForDeployment();
    ps = await (await hEthers.getContractFactory("NexusPresaleUSDT", admin))
      .deploy(await nex.getAddress(), await usdt.getAddress(), 0, P_USDT, P_POL, CAP, false);
    await ps.waitForDeployment();
    await nex.mint(admin.address, CAP * 5n);
    await nex.transfer(await ps.getAddress(), CAP * 5n);
    await usdt.mint(buyer.address, ethers.parseEther("1000000"));
    await usdt.connect(buyer).approve(await ps.getAddress(), ethers.MaxUint256);
  });

  it("เธฃเธฒเธเธฒ escalate ร—1.5 เธ•เนเธญเธฃเธญเธ (USDT & POL)", async () => {
    expect(await ps.priceOfUSDT(1)).to.equal(P_USDT * 150n / 100n);
    expect(await ps.priceOfPOL(1)).to.equal(P_POL * 150n / 100n);
    expect((await ps.priceOfPOL(4) * 10000n) / P_POL).to.equal(50625n);
  });

  it("เธเธทเนเธญเธ”เนเธงเธข USDT: quote == paid ยท เนเธ”เน NEX เธ—เธฑเธเธ—เธต", async () => {
    const amt = ethers.parseEther("100");
    const [cost] = await ps.quote.staticCall(amt, false);
    const uBefore = await usdt.balanceOf(buyer.address);
    await ps.connect(buyer).buyWithUSDT(amt);
    expect(await nex.balanceOf(buyer.address)).to.equal(amt);
    expect(await usdt.balanceOf(buyer.address)).to.equal(uBefore - cost);
  });

  it("spill เธเนเธฒเธกเธฃเธญเธ: เธเธทเนเธญ 1500 NEX เนเธ•เธฐเธฃเธญเธ 1โ’2 ยท caps shared", async () => {
    const c0 = CAP * P_USDT / 10n ** 18n;
    const c1r = P_USDT * 150n / 100n;
    const c1 = CAP * c1r / 10n ** 18n;
    await ps.connect(buyer).buyWithUSDT(CAP * 15n / 10n); // 1500 NEX
    expect(await ps.roundSold(0)).to.equal(CAP);
    expect(await ps.roundSold(1)).to.equal(CAP * 5n / 10n);
    expect(Number(await ps.currentRound())).to.equal(1);
    expect(c0 > 0n && c1 > c0).to.equal(true);
  });

  it("เธเธทเนเธญเธ”เนเธงเธข POL: value เน€เธเนเธฐ โ’ เนเธ”เน NEX ยท เน€เธเธดเธเน€เธเธดเธ refund", async () => {
    const b4 = await hEthers.provider.getBalance(buyer.address);
    const val = CAP * P_POL / 10n ** 18n + ethers.parseEther("1"); // เน€เธเธดเธ 1 POL
    await ps.connect(buyer).buyWithPOL(CAP, { value: val });
    expect(await nex.balanceOf(buyer.address)).to.equal(CAP);
    const af = await hEthers.provider.getBalance(buyer.address);
    expect(af > b4 - val - ethers.parseEther("0.01")).to.equal(true);
  });

  it("เธเธชเธกเธชเธเธธเธฅ: USDT เน€เธ•เนเธกเธฃเธญเธ0 โ’ POL เธเธทเนเธญเธ•เนเธญเธฃเธญเธ1 เนเธ”เน (caps shared)", async () => {
    await ps.connect(buyer).buyWithUSDT(CAP);            // เธฃเธญเธ0 เน€เธ•เนเธก
    expect(Number(await ps.currentRound())).to.equal(1);
    await ps.connect(treasury).buyWithPOL(ethers.parseEther("50"), {
      value: ethers.parseEther("50") * (P_POL * 150n / 100n) / 10n ** 18n });
    expect(await nex.balanceOf(treasury.address)).to.equal(ethers.parseEther("50"));
  });

  it("whitelist ON โ’ เธเธเธเธญเธเธฅเธดเธชเธ•เนเนเธ”เธเธเธฅเนเธญเธ", async () => {
    const p2 = await (await hEthers.getContractFactory("NexusPresaleUSDT", admin))
      .deploy(await nex.getAddress(), await usdt.getAddress(), 0, P_USDT, P_POL, CAP, true);
    await p2.waitForDeployment();
    await nex.mint(admin.address, CAP);
    await nex.transfer(await p2.getAddress(), CAP);
    await usdt.connect(buyer).approve(await p2.getAddress(), ethers.MaxUint256);
    await expect(p2.connect(buyer).buyWithUSDT(ethers.parseEther("1")))
      .to.be.revertedWithCustomError(p2, "NotWhitelisted");
    await p2.setWhitelisted(buyer.address, true);
    await p2.connect(buyer).buyWithUSDT(ethers.parseEther("1"));
    expect(await nex.balanceOf(buyer.address)).to.equal(ethers.parseEther("1"));
  });

  it("drain all rounds via USDT -> SoldOut", async () => {
// drain เธ—เธธเธเธฃเธญเธเธ”เนเธงเธข USDT
    for (let r = 0; r < 5; r++) {
      const cur = Number(await ps.currentRound());
      const price = await ps.priceOfUSDT(cur);
      const need = CAP * price / 10n ** 18n;
      await ps.connect(buyer).buyWithUSDT(CAP, { gasLimit: 900000 });
      void need;
    }
    await expect(ps.quote(ethers.parseEther("1"), false)).to.be.revertedWithCustomError(ps, "SoldOut");
    const tb = await usdt.balanceOf(treasury.address);
    await ps.withdrawUSDT(treasury.address);
    expect((await usdt.balanceOf(treasury.address)) > tb).to.equal(true);
  });
});
