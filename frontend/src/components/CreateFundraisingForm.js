import React, { useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/CreateFundraisingForm.css";

const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CreateFundraisingForm = ({ provider }) => {
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
        description,
        fundAmount,
        crowdfundingAddress,
        executionTime
      );
      await tx.wait();
      alert("Fundraising created successfully!");
    } catch (error) {
      console.error("Error creating fundraising:", error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="create-fundraising-form">
      <h2>Create a Fundraising</h2>
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
