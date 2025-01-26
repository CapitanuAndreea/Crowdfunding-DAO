const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding Contract", function () {
    let Crowdfunding, crowdfunding;
    let owner, contributor1, contributor2, recipient;

    beforeEach(async function () {
        [owner, contributor1, contributor2, recipient] = await ethers.getSigners();

        Crowdfunding = await ethers.getContractFactory("Crowdfunding");
        crowdfunding = await Crowdfunding.deploy();
        await crowdfunding.waitForDeployment();
    });

    it("should allow contributions and update balances", async function () {
        const contributionAmount = ethers.parseEther("1");
        await crowdfunding.connect(contributor1).contribute({ value: contributionAmount });

        const totalContributions = await crowdfunding.totalContributions();
        const contribution1Balance = await crowdfunding.contributions(contributor1.address);

        expect(totalContributions).to.equal(contributionAmount);
        expect(contribution1Balance).to.equal(contributionAmount);
    });

    it("should allow the owner to create a proposal", async function () {
        const fundRequest = ethers.parseEther("0.5");
        const description = "Fund a project";

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("1") });

        await crowdfunding.connect(owner).createProposal(description, fundRequest, recipient.address);

        const proposal = await crowdfunding.proposals(0);
        expect(proposal.description).to.equal(description);
        expect(proposal.fundRequest).to.equal(fundRequest);
        expect(proposal.recipient).to.equal(recipient.address);
    });

    it("should allow contributors to vote on proposals", async function () {
        const fundRequest = ethers.parseEther("0.5");
        const description = "Fund a project";

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("1") });
        await crowdfunding.connect(owner).createProposal(description, fundRequest, recipient.address);

        await crowdfunding.connect(contributor1).vote(0, true);

        const proposal = await crowdfunding.proposals(0);
        expect(proposal.votesFor).to.equal(1);
        expect(proposal.votesAgainst).to.equal(0);
    });

    it("should not allow double voting", async function () {
        const fundRequest = ethers.parseEther("0.5");

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("1") });
        await crowdfunding.connect(owner).createProposal("Test Proposal", fundRequest, recipient.address);

        await crowdfunding.connect(contributor1).vote(0, true);

        await expect(
            crowdfunding.connect(contributor1).vote(0, true)
        ).to.be.revertedWith("You have already voted on this proposal");
    });

    it("should allow owner to execute approved proposals", async function () {
        const fundRequest = ethers.parseEther("0.5");

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("1") });
        await crowdfunding.connect(owner).createProposal("Test Proposal", fundRequest, recipient.address);
        await crowdfunding.connect(contributor1).vote(0, true);

        await crowdfunding.connect(owner).executeProposal(0);

        const proposal = await crowdfunding.proposals(0);
        expect(proposal.executed).to.be.true;
        expect(await ethers.provider.getBalance(recipient.address)).to.equal(
            ethers.parseEther("10000.5")
        );
    });

    it("should not execute proposals with more votes against", async function () {
        const fundRequest = ethers.parseEther("0.5");

        await crowdfunding.connect(contributor1).contribute({ value: ethers.parseEther("1") });
        await crowdfunding.connect(owner).createProposal("Test Proposal", fundRequest, recipient.address);

        await crowdfunding.connect(contributor1).vote(0, false);

        await expect(
            crowdfunding.connect(owner).executeProposal(0)
        ).to.be.revertedWith("Proposal was not approved");
    });

    it("should not allow non-owners to create proposals", async function () {
        const fundRequest = ethers.parseEther("0.5");

        await expect(
            crowdfunding.connect(contributor1).createProposal("Unauthorized Proposal", fundRequest, recipient.address)
        ).to.be.revertedWith("Only owner can call this function");
    });
});
