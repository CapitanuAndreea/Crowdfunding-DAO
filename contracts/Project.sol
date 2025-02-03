// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Project {
    string public name;
    string public description;
    address public owner;
    uint256 public fundingGoal;
    uint256 public receivedFunds;
    uint256 public finalAmount;
    bool public completed;

    event FundsReceived(address contributor, uint256 amount);
    event ProjectCompleted(address projectOwner, uint256 totalFunds);
    event FundsWithdrawn(address projectOwner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(string memory _name, string memory _description, uint256 _fundingGoal, address _owner) {
        name = _name;
        description = _description;
        fundingGoal = _fundingGoal;
        owner = _owner;
        receivedFunds = 0;
        finalAmount = 0;
        completed = false;
    }

    receive() external payable {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(!completed, "Project already completed");

        receivedFunds += msg.value;
        emit FundsReceived(msg.sender, msg.value);

        if (receivedFunds >= fundingGoal) {
            completeProject();
        }
    }

    function completeProject() internal {
        require(receivedFunds >= fundingGoal, "Funding goal not reached");
        completed = true;
        finalAmount = receivedFunds;
        emit ProjectCompleted(owner, receivedFunds);
    }

    function withdrawFunds() external onlyOwner {
        require(completed, "Project not completed yet");
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds available");

        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getFinalAmount() public view returns (uint256) {
        return finalAmount;
    }
}
