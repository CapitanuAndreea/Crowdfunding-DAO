// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Project.sol";

contract Crowdfunding {
    struct Proposal {
        string name;
        string description;
        uint256 fundRequest;
        uint256 totalFundsRaised;
        bool executed;
        address projectContract;
        uint256 executionTime;
    }

    address public owner;
    Proposal[] public proposals;
    mapping(address => uint256) public contributions;
    mapping(uint256 => address) public projectAddresses;

    event ContributionReceived(address contributor, uint256 amount, address project);
    event ProposalCreated(uint256 proposalId, string name, string description, uint256 fundRequest, address projectContract, uint256 executionTime);
    event FundsReleased(uint256 proposalId, address projectContract, uint256 amount);
    event ProposalExecuted(uint256 proposalId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProposal(
        string memory _name,
        string memory _description,
        uint256 _fundRequest,
        uint256 _executionTime
    ) external {
        Project newProject = new Project(_name, _description, _fundRequest, msg.sender);
        address projectAddress = address(newProject);

        proposals.push(Proposal({
            name: _name,
            description: _description,
            fundRequest: _fundRequest,
            totalFundsRaised: 0,
            executed: false,
            projectContract: projectAddress,
            executionTime: _executionTime
        }));

        uint256 proposalId = proposals.length - 1;
        projectAddresses[proposalId] = projectAddress;
        emit ProposalCreated(proposalId, _name, _description, _fundRequest, projectAddress, _executionTime);
    }

    function contribute(uint256 proposalId) external payable {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Proposal already executed");

        proposal.totalFundsRaised += msg.value;

        if (proposal.totalFundsRaised >= proposal.fundRequest) {
            proposal.executed = true;
            emit ProposalExecuted(proposalId);
        }

        address payable projectContract = payable(proposal.projectContract);
        (bool sent, ) = projectContract.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        contributions[msg.sender] += msg.value;
        emit ContributionReceived(msg.sender, msg.value, projectContract);
    }

    function getProposalsCount() public view returns (uint) {
        return proposals.length;
    }
}
