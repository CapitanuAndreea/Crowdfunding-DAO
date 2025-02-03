const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Crowdfunding Contract', function () {
  let crowdfunding;
  let project;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
  
    const CrowdfundingFactory = await ethers.getContractFactory('Crowdfunding');
    crowdfunding = await CrowdfundingFactory.deploy();
    await crowdfunding.waitForDeployment();
  
    const ProjectFactory = await ethers.getContractFactory('Project');
    project = await ProjectFactory.deploy('Project Name', 'Project Description', 100, owner.address);
    await project.waitForDeployment();
  });
  

  it('should deploy the Crowdfunding contract', async function () {
    expect(await crowdfunding.owner()).to.equal(owner.address);
  });

  it('should create a proposal', async function () {
    await crowdfunding.createProposal('New Project', 'Description of new project', 100, 0);
    const proposalCount = await crowdfunding.getProposalsCount();
    expect(proposalCount).to.equal(1);
  });

  it('should allow contributions to a proposal', async function () {
    await crowdfunding.createProposal('New Project', 'Description of new project', 100, 0);
    const proposalId = 0;
    await crowdfunding.connect(addr1).contribute(proposalId, { value: 50 });
    const proposal = await crowdfunding.proposals(proposalId);
    expect(proposal.totalFundsRaised).to.equal(50);
  });

  it('should execute the proposal when funding goal is reached', async function () {
    await crowdfunding.createProposal('New Project', 'Description of new project', 100, 0);
    const proposalId = 0;
    await crowdfunding.connect(addr1).contribute(proposalId, { value: 100 });
    const proposal = await crowdfunding.proposals(proposalId);
    expect(proposal.executed).to.be.true;
  });
});
