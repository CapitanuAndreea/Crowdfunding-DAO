// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

contract Crowdfunding {
    struct Proposal {
        string description;
        uint256 fundRequest;
        bool executed;
        address payable projectContract;
        uint256 executionTime;
    }

    address public owner;
    mapping(address => uint256) public contributions;
    uint256 public totalContributions;
    Proposal[] public proposals;
    mapping(address => uint256) public balances;

    event ContributionReceived(address contributor, uint256 amount);
    event ProposalCreated(uint256 proposalId, string description, uint256 fundRequest, address projectContract, uint256 executionTime);
    event FundsReleased(uint256 proposalId, address projectContract, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function contribute() external payable {
        require(msg.value > 0, "Contribution must be greater than 0");
        contributions[msg.sender] += msg.value;
        totalContributions += msg.value;
        balances[msg.sender] += msg.value;

        emit ContributionReceived(msg.sender, msg.value);
    }

    function createProposal(string memory _description, uint256 _fundRequest, address payable _projectContract, uint256 _executionTime) external onlyOwner {
        proposals.push(Proposal({
            description: _description,
            fundRequest: _fundRequest,
            executed: false,
            projectContract: _projectContract,
            executionTime: _executionTime
        }));

        emit ProposalCreated(proposals.length - 1, _description, _fundRequest, _projectContract, _executionTime);
    }

    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(address(this).balance >= proposal.fundRequest, "Insufficient contract balance");
        require(block.timestamp >= proposal.executionTime, "Proposal execution time has not been reached");

        require(totalContributions >= proposal.fundRequest, "Requested funds exceed total contributions");
        
        proposal.executed = true;
        totalContributions -= proposal.fundRequest;
        payable(proposal.projectContract).transfer(proposal.fundRequest);

        emit FundsReleased(_proposalId, proposal.projectContract, proposal.fundRequest);
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");

        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Withdrawal(msg.sender, amount);
    }

    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }
}
