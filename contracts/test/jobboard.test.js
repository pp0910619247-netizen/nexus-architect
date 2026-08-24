// Test: JobBoard escrow + ค่าธรรมเนียม 10%
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

describe("NexusToken + JobBoard — ตลาดงาน escrow หัก 10%", () => {
  let hEthers, nex, board, admin, employer, worker, feeTreasurer;
  const REWARD = ethers.parseEther("1000"); // 1000 NEX

  beforeEach(async () => {
    ({ ethers: hEthers } = await network.getOrCreate());
    [admin, employer, worker, feeTreasurer] = await hEthers.getSigners();
    nex = await (await hEthers.getContractFactory("NexusToken", admin)).deploy();
    await nex.waitForDeployment();
    board = await (await hEthers.getContractFactory("JobBoard", admin)).deploy(await nex.getAddress());
    await board.waitForDeployment();
    await nex.mint(employer.address, ethers.parseEther("10000"));
    await board.setFeeCollector(feeTreasurer.address);
  });

  it("โพสต์งาน = เงินเข้า escrow ของ contract", async () => {
    await nex.connect(employer).approve(await board.getAddress(), REWARD);
    await board.connect(employer).postJob(REWARD, "QmSpec");
    const bal = await nex.balanceOf(await board.getAddress());
    expect(bal).to.equal(REWARD);
    expect(Number(await board.jobCount())).to.equal(1);
  });

  it("flow เต็ม: รับงาน → ส่งงาน → อนุมัติ → worker 90% + fee 10%", async () => {
    await nex.connect(employer).approve(await board.getAddress(), REWARD);
    await board.connect(employer).postJob(REWARD, "QmSpec");
    await board.connect(worker).takeJob(1);
    await board.connect(worker).submitWork(1, "QmResult");

    const wB = await nex.balanceOf(worker.address);
    const fB = await nex.balanceOf(feeTreasurer.address);
    await board.connect(employer).approveWork(1);

    expect((await nex.balanceOf(worker.address) - wB).toString()).to.equal(ethers.parseEther("900").toString());   // 90%
    expect((await nex.balanceOf(feeTreasurer.address) - fB).toString()).to.equal(ethers.parseEther("100").toString()); // 10%
    expect(Number((await board.jobs(1)).status)).to.equal(3); // Done
    expect((await board.totalFeesCollected()).toString()).to.equal(ethers.parseEther("100").toString());
  });

  it("ปฏิเสธ: คนอื่น submit งาน / อนุมัติซ้ำ / โพสต์ reward=0", async () => {
    await nex.connect(employer).approve(await board.getAddress(), REWARD);
    await board.connect(employer).postJob(REWARD, "QmSpec");
    await board.connect(worker).takeJob(1);
    await expect(board.connect(employer).submitWork(1, "QmFake")).to.revert(ethers);
    await board.connect(worker).submitWork(1, "QmResult");
    await board.connect(employer).approveWork(1);
    await expect(board.connect(employer).approveWork(1)).to.revert(ethers); // Done แล้ว
    await expect(board.connect(employer).postJob(0, "QmZ")).to.revert(ethers);
  });

  it("ยกเลิกงานที่ยังไม่มีคารับ = คืนเงินเต็มจำนวน", async () => {
    await nex.connect(employer).approve(await board.getAddress(), REWARD);
    await board.connect(employer).postJob(REWARD, "QmSpec");
    const eB = await nex.balanceOf(employer.address);
    await board.connect(employer).cancelJob(1);
    expect(await nex.balanceOf(employer.address) - eB).to.equal(REWARD);
  });

  it("ข้อพิพาท: ตัดสินแล้วโอนให้ฝ่ายที่ชนะ", async () => {
    await nex.connect(employer).approve(await board.getAddress(), REWARD);
    await board.connect(employer).postJob(REWARD, "QmSpec");
    await board.connect(worker).takeJob(1);
    await board.connect(worker).raiseDispute(1);
    const wB = await nex.balanceOf(worker.address);
    await board.resolveDispute(1, worker.address);
    expect(await nex.balanceOf(worker.address) - wB).to.equal(REWARD);
  });
});
