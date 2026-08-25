// Test: TokenVesting — cliff + linear + onlyBeneficiary
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

describe("TokenVesting — ล็อคเหรียญแบบมาตรฐานสากล", () => {
  let hEthers, nex, admin, founder;
  const AMOUNT = ethers.parseEther("1000");

  async function deployVesting(startOffset, cliffSec, durationSec) {
    const block = await hEthers.provider.getBlock("latest");
    const v = await (await hEthers.getContractFactory("TokenVesting", admin))
      .deploy(await nex.getAddress(), founder.address, Number(block.timestamp) + startOffset, cliffSec, durationSec);
    await v.waitForDeployment();
    await nex.approve(await v.getAddress(), AMOUNT);
    await v.fund(AMOUNT);
    return v;
  }

  beforeEach(async () => {
    ({ ethers: hEthers } = await network.getOrCreate());
    [admin, , , founder] = await hEthers.getSigners();
    nex = await (await hEthers.getContractFactory("NexusToken", admin)).deploy();
    await nex.waitForDeployment();
    await nex.mint(admin.address, AMOUNT);
  });

  it("ก่อน cliff → vested=0 ถอนไม่ได้", async () => {
    const v = await deployVesting(0, 3600, 7200); // เริ่มตอนนี้, cliff 1 ชม.
    expect(await v.vested()).to.equal(0n);
    await expect(v.connect(founder).release()).to.be.revertedWithCustomError(v, "NothingToRelease");
    expect(await nex.balanceOf(founder.address)).to.equal(0n);
  });

  it("ครึ่งทาง duration → vested = 50% (หลัง cliff)", async () => {
    const block = await hEthers.provider.getBlock("latest");
    const start = Number(block.timestamp) - 1800; // เริ่มไปแล้ว 30 นาที (backdated)
    const v = await (await hEthers.getContractFactory("TokenVesting", admin))
      .deploy(await nex.getAddress(), founder.address, start, 600, 3600);
    await v.waitForDeployment();
    await nex.approve(await v.getAddress(), AMOUNT);
    await v.fund(AMOUNT);
    const expected = AMOUNT * 1800n / 3600n;
    const vestedAmt = await v.vested();
    // sanity range: 50% ± 2 นาที drift (block time จริงระหว่าง tx)
    expect(vestedAmt).to.be.at.least(AMOUNT * 1800n / 3600n);
    expect(vestedAmt).to.be.at.most(AMOUNT * 1920n / 3600n);
    await v.connect(founder).release();
    // เวลาเดินต่อระหว่าง read→tx ดังนั้นเทียบกับสถานะ released จริงใน contract
    expect(await v.released()).to.equal(await nex.balanceOf(founder.address));
    expect(await v.releasable()).to.equal(0n);
  });

  it("หมด duration → ถอนได้ทั้งหมด", async () => {
    const block = await hEthers.provider.getBlock("latest");
    const start = Number(block.timestamp) - 4000; // ผ่าน duration มาแล้ว
    const v = await (await hEthers.getContractFactory("TokenVesting", admin))
      .deploy(await nex.getAddress(), founder.address, start, 100, 3600);
    await v.waitForDeployment();
    await nex.approve(await v.getAddress(), AMOUNT);
    await v.fund(AMOUNT);
    await v.connect(founder).release();
    expect(await nex.balanceOf(founder.address)).to.equal(AMOUNT);
    expect(await nex.balanceOf(await v.getAddress())).to.equal(0n);
  });

  it("คนอื่น release แทน beneficiary ไม่ได้", async () => {
    const block = await hEthers.provider.getBlock("latest");
    const v = await (await hEthers.getContractFactory("TokenVesting", admin))
      .deploy(await nex.getAddress(), founder.address, Number(block.timestamp) - 4000, 100, 3600);
    await v.waitForDeployment();
    await nex.approve(await v.getAddress(), AMOUNT);
    await v.fund(AMOUNT);
    await expect(v.connect(admin).release()).to.be.revertedWithCustomError(v, "OnlyBeneficiary");
  });

  it("cliff > duration → revert BadInput", async () => {
    const block = await hEthers.provider.getBlock("latest");
    const f = await hEthers.getContractFactory("TokenVesting", admin);
    await expect(f.deploy(await nex.getAddress(), founder.address, Number(block.timestamp), 7200, 3600))
      .to.be.revertedWithCustomError(f, "BadInput");
  });
});
