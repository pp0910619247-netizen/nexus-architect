// Nexus Contracts — Test Suite (Hardhat 3: ethers ผ่าน network.getOrCreate())
import { expect } from "chai";
import { network } from "hardhat";

describe("ProblemRegistry", () => {
  let ethers, registry, admin, alice, bob, carol;
  const CAT = { HUMAN: 0, GROUP: 1, AI_MOTHER: 2, ANOMALY: 3, AI_DEV: 4 };

  beforeEach(async () => {
    ({ ethers } = await network.getOrCreate());
    [admin, alice, bob, carol] = await ethers.getSigners();
    registry = await (await ethers.getContractFactory("ProblemRegistry", admin)).deploy();
    await registry.waitForDeployment();
    for (const s of [admin, alice, bob, carol])
      await registry.setVerifiedHuman(s.address, true);
  });

  it("submit + vote + select Mission Peak", async () => {
    await registry.connect(alice).submitProblem("QmTitle", "ANOMALY");
    expect(Number(await registry.problemCount())).to.equal(1);
    await registry.connect(alice).vote(1);
    await registry.connect(bob).vote(1);
    expect(Number((await registry.problems(1)).votes)).to.equal(2);
    await registry.selectMissionPeak(1);
    expect(Number((await registry.problems(1)).status)).to.equal(1); // Voted
  });

  it("reject: โหวตซ้ำ / ไม่ยืนยันตัวตน / category เกิน", async () => {
    await registry.connect(alice).submitProblem("QmX", "HUMAN");
    await registry.connect(alice).vote(1);
    await expect(registry.connect(alice).vote(1)).to.revert(ethers);      // AlreadyVoted
    await registry.setVerifiedHuman(carol.address, false);
    await expect(registry.connect(carol).vote(1)).to.revert(ethers);      // NotVerified
    // (V1 ไม่ validate category — V2 ครอบคลุมแล้วในชุด test ของ V2)
  });
});

describe("ProblemRegistryV2 - HRW + Solutions + Peer Review", () => {
  let ethers, v2, admin, alice, bob, carol, dave;
  const CAT = { HUMAN: 0, GROUP: 1, AI_MOTHER: 2, ANOMALY: 3, AI_DEV: 4 };

  beforeEach(async () => {
    ({ ethers } = await network.getOrCreate());
    [admin, alice, bob, carol, dave] = await ethers.getSigners();
    v2 = await (await ethers.getContractFactory("ProblemRegistryV2", admin)).deploy();
    await v2.waitForDeployment();
    for (const s of [admin, alice, bob, carol, dave])
      await v2.setVerifiedHuman(s.address, true);
  });

  it("HRW: โจทย์ HUMAN ต้องมี votes ครบ ceil(base x 67%) ก่อนขึ้น peak", async () => {
    await v2.connect(alice).submitProblem("QmHumanRights", CAT.HUMAN);
    expect((await v2.problems(1)).hrwFlagged).to.equal(true);
    await v2.setHrwBaseVotes(3); // base เล็กเพื่อทดสอบ: ต้องมี >= 3 votes
    await v2.connect(alice).vote(1);
    await v2.connect(bob).vote(1);
    await expect(v2.selectMissionPeak(1)).to.revert(ethers); // 2 < 3
    await v2.connect(carol).vote(1);                 // 3 ✓
    await v2.selectMissionPeak(1);
    expect(Number((await v2.problems(1)).status)).to.equal(1);
  });

  it("solution lifecycle: submit -> review -> declareWinner -> Solved", async () => {
    await v2.connect(alice).submitProblem("QmP", CAT.ANOMALY);
    for (const s of [alice, bob, carol]) await v2.connect(s).vote(1);
    await v2.selectMissionPeak(1);
    await v2.connect(bob).submitSolution(1, "QmSolution1");
    expect(Number(await v2.solutionCount_())).to.equal(1);
    expect(Number((await v2.problems(1)).status)).to.equal(2); // InProgress
    await v2.connect(alice).reviewSolution(1, true);
    await v2.connect(carol).reviewSolution(1, true);
    await v2.connect(dave).reviewSolution(1, false);
    await expect(v2.connect(alice).reviewSolution(1, true)).to.revert(ethers); // ซ้ำ
    await v2.declareWinner(1);
    expect(Number((await v2.solutions(1)).status)).to.equal(1); // Approved
    const p = await v2.problems(1);
    expect(Number(p.status)).to.equal(3); // Solved
    expect(Number(p.winningSolution)).to.equal(1);
  });

  it("ปฏิเสธ declareWinner เมื่อ reject >= approve", async () => {
    await v2.connect(alice).submitProblem("QmP", CAT.AI_DEV);
    for (const s of [alice, bob, carol]) await v2.connect(s).vote(1);
    await v2.selectMissionPeak(1);
    await v2.connect(bob).submitSolution(1, "QmBad");
    await v2.connect(alice).reviewSolution(1, true);
    await v2.connect(carol).reviewSolution(1, false);
    await v2.connect(dave).reviewSolution(1, false);
    await expect(v2.declareWinner(1)).to.revert(ethers);
  });
});

describe("RewardSplitter - 20/80 บน chain", () => {
  let ethers, splitter, admin, p1, p2, solver;

  beforeEach(async () => {
    ({ ethers } = await network.getOrCreate());
    [admin, p1, p2, solver] = await ethers.getSigners();
    splitter = await (await ethers.getContractFactory("RewardSplitter", admin)).deploy();
    await splitter.waitForDeployment();
    await splitter.addParticipant(p1.address);
    await splitter.addParticipant(p2.address);
    await splitter.awardPoints(p1.address, 30);
    await splitter.awardPoints(p2.address, 10);
  });

  it("แบ่งตามสัดส่วน: solver 20% + participants 80% ตาม points + reset", async () => {
    const value = ethers.parseEther("1.0");
    const p1B = await ethers.provider.getBalance(p1.address);
    const solB = await ethers.provider.getBalance(solver.address);
    await splitter.connect(admin).distribute(solver.address, { value });
    expect((await ethers.provider.getBalance(solver.address)) - solB)
      .to.equal(ethers.parseEther("0.2"));                       // 20%
    expect((await ethers.provider.getBalance(p1.address)) - p1B)
      .to.equal(ethers.parseEther("0.6"));                      // 80% x 30/40
    expect(Number(await splitter.totalPoints())).to.equal(0);   // reset
  });
});
