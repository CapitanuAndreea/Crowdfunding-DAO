const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding Contract", function () {
    let Crowdfunding, crowdfunding, owner, contributor1, contributor2, project;

    beforeEach(async function () {
        [owner, contributor1, contributor2, project] = await ethers.getSigners();
        Crowdfunding = await ethers.getContractFactory("Crowdfunding");
        crowdfunding = await Crowdfunding.deploy();
        await crowdfunding.waitForDeployment();
    });

    it("should allow contributions to the crowdfunding contract", async function () {
        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("2") });
        expect(await crowdfunding.contributions(contributor1.address)).to.equal(ethers.parseEther("2"));
        expect(await crowdfunding.totalContributions()).to.equal(ethers.parseEther("2"));
    });

    it("should allow creating a proposal", async function () {
        await crowdfunding.createProposal(
            "Test Proposal",
            ethers.parseEther("3"),
            project.address,
            Math.floor(Date.now() / 1000) + 60
        );
        const proposal = await crowdfunding.proposals(0);
        expect(proposal.description).to.equal("Test Proposal");
        expect(proposal.fundRequest).to.equal(ethers.parseEther("3"));
        expect(proposal.projectContract).to.equal(project.address);
    });

    it("should execute a proposal if funds are sufficient", async function () {
        await crowdfunding.createProposal(
            "Test Proposal",
            ethers.parseEther("3"),
            project.address,
            Math.floor(Date.now() / 1000) + 60
        );

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("3") });

        await ethers.provider.send("evm_increaseTime", [61]);
        await ethers.provider.send("evm_mine");

        const balanceBefore = await ethers.provider.getBalance(project.address);

        await crowdfunding.executeProposal(0);

        const balanceAfter = await ethers.provider.getBalance(project.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("3"));
    });

    it("should allow contributors to withdraw funds", async function () {
        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("2") });
        await crowdfunding.connect(contributor2).contribute({ value: ethers.parseEther("3") });

        const balanceBefore1 = await ethers.provider.getBalance(contributor1.address);
        const balanceBefore2 = await ethers.provider.getBalance(contributor2.address);

        await crowdfunding.connect(contributor1).withdraw();
        await crowdfunding.connect(contributor2).withdraw();

        const balanceAfter1 = await ethers.provider.getBalance(contributor1.address);
        const balanceAfter2 = await ethers.provider.getBalance(contributor2.address);

        expect(balanceAfter1).to.be.gt(balanceBefore1);
        expect(balanceAfter2).to.be.gt(balanceBefore2);
    });
});
