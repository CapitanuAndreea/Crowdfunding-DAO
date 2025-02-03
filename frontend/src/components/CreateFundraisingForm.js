import React, { useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/CreateFundraisingForm.css";
import { toast } from "react-toastify";

const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CreateFundraisingForm = ({ provider, onProjectCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fundRequest, setFundRequest] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !fundRequest) {
      toast.error("All fields are required!");
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
      const executionTime = 0;

      const tx = await crowdfundingContract.createProposal(
        name,
        description,
        fundAmount,
        executionTime
      );

      await tx.wait();

      toast.success("🎉 Fundraising created successfully!");

      if (onProjectCreated) {
        onProjectCreated();
      }

      setName("");
      setDescription("");
      setFundRequest("");
    } catch (error) {
      console.error("Error creating fundraising:", error);
      toast.error(`❌ Error: ${error.message}`);
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
      
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Processing..." : "Create Fundraising"}
      </button>
    </form>
  );
};

export default CreateFundraisingForm;
