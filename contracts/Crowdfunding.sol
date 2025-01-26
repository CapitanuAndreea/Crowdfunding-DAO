pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Proposal {
        string description;
        uint256 fundRequest;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        address payable recipient;
    }

    address public owner;
    mapping(address => uint256) public contributions;
    uint256 public totalContributions;
    Proposal[] public proposals;

    mapping(address => mapping(uint256 => bool)) public hasVoted; // Tracks if an address voted on a proposal

    event ContributionReceived(address contributor, uint256 amount);
    event ProposalCreated(uint256 proposalId, string description, uint256 fundRequest, address recipient);
    event Voted(uint256 proposalId, address voter, bool inFavor);
    event FundsReleased(uint256 proposalId, address recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier hasContributed() {
        require(contributions[msg.sender] > 0, "You need to contribute first");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function contribute() external payable {
        require(msg.value > 0, "Contribution must be greater than 0");
        contributions[msg.sender] += msg.value;
        totalContributions += msg.value;

        emit ContributionReceived(msg.sender, msg.value);
    }

    function createProposal(string memory _description, uint256 _fundRequest, address payable _recipient) external onlyOwner {
        require(_fundRequest <= totalContributions, "Requested funds exceed total contributions");
        
        proposals.push(Proposal({
            description: _description,
            fundRequest: _fundRequest,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            recipient: _recipient
        }));

        emit ProposalCreated(proposals.length - 1, _description, _fundRequest, _recipient);
    }

    function vote(uint256 _proposalId, bool _inFavor) external hasContributed {
        Proposal storage proposal = proposals[_proposalId];
        require(!hasVoted[msg.sender][_proposalId], "You have already voted on this proposal");
        require(!proposal.executed, "Proposal already executed");

        hasVoted[msg.sender][_proposalId] = true;

        if (_inFavor) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit Voted(_proposalId, msg.sender, _inFavor);
    }

    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal was not approved");
        require(address(this).balance >= proposal.fundRequest, "Insufficient contract balance");

        proposal.executed = true;
        proposal.recipient.transfer(proposal.fundRequest);

        emit FundsReleased(_proposalId, proposal.recipient, proposal.fundRequest);
    }

    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }
}