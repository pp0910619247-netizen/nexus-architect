// Test: ProblemRegistryV3 — midnight culling on-chain
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

describe("ProblemRegistryV3 — culling บน chain", () => {
  let hEthers, reg, admin, alice, bob, carol;

  beforeEach(async () => {
    ({ ethers: hEthers } = await network.getOrCreate());
    [admin, alice, bob, carol] = await hEthers.getSigners();
    reg = await (await hEthers.getContractFactory("ProblemRegistryV3", admin)).deploy();
    await reg.waitForDeployment();
    for (const s of [admin, alice, bob, carol]) await reg.setVerifiedHuman(s.address, true);
  });

  const warp = async (sec) => {
    await hEthers.provider.send("evm_increaseTime", [sec]);
    await hEthers.provider.send("evm_mine", []);
  };

  it("โหวตไม่ถึงเกณฑ์หลังหมดเวลา → ใครก็ cull ได้ (permissionless)", async () => {
    await reg.connect(alice).submitProblem("QmA", 0);
    await reg.connect(bob).vote(1);
    await reg.connect(carol).vote(1); // 2 votes ≤ survive(10)
    await warp(24 * 3600 + 10);
    await expect(reg.connect(carol).cullExpired(1))
      .to.emit(reg, "ProblemCulled").withArgs(1, 2);
    expect(Number((await reg.problems(1)).status)).to.equal(5); // Culled
  });

  it("โหวตมากกว่า surviveVotes → cull ไม่ได้ (Survived)", async () => {
    await reg.setSurviveVotes(1); // shrink เพื่อ test: >1 = รอด
    await reg.connect(alice).submitProblem("QmB", 3);
    await reg.connect(bob).vote(1);
    await reg.connect(carol).vote(1); // 2 votes > 1 → รอด
    await warp(24 * 3600 + 10);
    await expect(reg.cullExpired(1)).to.be.revertedWithCustomError(reg, "Survived");
    expect(Number((await reg.problems(1)).status)).to.equal(0); // ยัง Open
  });

  it("ยังไม่หมดเวลา → TooEarly", async () => {
    await reg.connect(alice).submitProblem("QmC", 2);
    await expect(reg.cullExpired(1)).to.be.revertedWithCustomError(reg, "TooEarly");
  });

  it("โจทย์ที่ผ่านไปแล้ว (InProgress/Solved) culled ซ้ำไม่ได้", async () => {
    await reg.connect(alice).submitProblem("QmD", 4);
    await reg.setVotingWindow(3600); // min 1 hour
    await warp(3700);
    await reg.cullExpired(1);
    await expect(reg.cullExpired(1)).to.be.revertedWithCustomError(reg, "BadInput");
  });

  it("culled ส่ง solution/ขึ้น peak ไม่ได้ · setVotingWindow guard", async () => {
    await reg.connect(alice).submitProblem("QmE", 0);
    await expect(reg.setVotingWindow(30 * 60)) // < 1h → guard
      .to.be.revertedWithCustomError(reg, "BadInput");
    await warp(24 * 3600);
    await reg.cullExpired(1);
    await expect(reg.connect(alice).submitSolution(1, "Qmsol")).to.be.revertedWithCustomError(reg, "BadInput");
  });
});
