import React, { useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/CreateFundraisingForm.css";

const crowdfundingAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const CreateFundraisingForm = ({ provider }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fundRequest, setFundRequest] = useState("");
  const [executionTime, setExecutionTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !fundRequest || !executionTime) {
      alert("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const crowdfundingContract = new ethers.Contract(
        crowdfundingAddress,
        CrowdfundingABI.abi,
        signer
      );

      const fundAmount = ethers.parseEther(fundRequest);
      const tx = await crowdfundingContract.createProposal(
        name,
        description,
        fundAmount,
        executionTime
      );

      const receipt = await tx.wait();

      // Extrage adresa noului contract Project din evenimentul ProposalCreated
      const event = receipt.logs.find(log => log.fragment.name === "ProposalCreated");

      if (event) {
        const projectAddress = event.args.projectContract;
        alert(`Fundraising created successfully! Project Contract Address: ${projectAddress}`);
      } else {
        alert("Fundraising created, but couldn't fetch the project address.");
      }

    } catch (error) {
      console.error("Error creating fundraising:", error);
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="create-fundraising-form">
      <h2>Create a Fundraising</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input-field"
      />
      <input
        type="number"
        placeholder="Required Amount (ETH)"
        value={fundRequest}
        onChange={(e) => setFundRequest(e.target.value)}
        className="input-field"
      />
      <input
        type="number"
        placeholder="Execution Time (timestamp)"
        value={executionTime}
        onChange={(e) => setExecutionTime(e.target.value)}
        className="input-field"
      />
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Processing..." : "Create Fundraising"}
      </button>
    </form>
  );
};

export default CreateFundraisingForm;
