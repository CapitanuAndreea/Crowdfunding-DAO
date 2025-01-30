import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/FundraisingList.css";

const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const FundraisingList = ({ provider }) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const loadFundraisings = async () => {
      if (!provider) return;
      const signer = await provider.getSigner();
      const crowdfundingContract = new ethers.Contract(
        crowdfundingAddress,
        CrowdfundingABI.abi,
        signer
      );
      setContract(crowdfundingContract);

      const count = await crowdfundingContract.getProposalsCount();
      const fundraisers = [];

      for (let i = 0; i < count; i++) {
        const proposal = await crowdfundingContract.proposals(i);
        fundraisers.push({
          id: i,
          description: proposal.description,
          fundRequest: ethers.formatEther(proposal.fundRequest),
          executed: proposal.executed,
          projectContract: proposal.projectContract,
        });
      }

      setFundraisings(fundraisers);
    };

    loadFundraisings();
  }, [provider]);

  const contribute = async (fundraisingId) => {
    if (!contract) return;
    const signer = await provider.getSigner();
    const amount = ethers.parseEther("0.01"); // suma fixă de contribuție

    try {
      const tx = await signer.sendTransaction({
        to: fundraisings[fundraisingId].projectContract,
        value: amount,
      });
      await tx.wait();
      alert("Contribuție efectuată cu succes!");
    } catch (error) {
      alert(`Eroare: ${error.message}`);
    }
  };

  return (
    <div className="fundraising-list-container">
      <h2>Available Fundraisings</h2>
      {fundraisings.length === 0 ? (
        <p>No active fundraisers available.</p>
      ) : (
        fundraisings.map((fund, index) => (
          <div key={index} className="fundraising-item">
            <p><strong>Description:</strong> {fund.description}</p>
            <p><strong>Required Amount:</strong> {fund.fundRequest} ETH</p>
            <p><strong>Status:</strong> {fund.executed ? "Completed" : "Active"}</p>
            <button onClick={() => contribute(index)} disabled={fund.executed}>
              Contribute 0.01 ETH
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default FundraisingList;
