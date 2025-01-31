import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/FundraisingList.css";

const crowdfundingAddress = "0x3B34be004Ac4283914Ee833F00450cC8b116C6E2";

const FundraisingList = ({ provider }) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [contract, setContract] = useState(null);
  const [contributionAmounts, setContributionAmounts] = useState({}); // Stochează sumele introduse

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
    
    const amount = contributionAmounts[fundraisingId];

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert("Introduceți o sumă validă!");
        return;
    }

    try {
        const crowdfundingWithSigner = contract.connect(signer);
        const tx = await crowdfundingWithSigner.contribute(fundraisingId, { value: ethers.parseEther(amount) });
        await tx.wait();
        alert("Contribuție efectuată cu succes!");
    } catch (error) {
        console.error("Eroare la contribuție:", error);
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

            {/* Input pentru suma de contribuție */}
            <input
              type="number"
              placeholder="Enter amount (ETH)"
              value={contributionAmounts[index] || ""}
              onChange={(e) => setContributionAmounts({
                ...contributionAmounts,
                [index]: e.target.value,
              })}
              className="input-field"
              disabled={fund.executed}
            />

            {/* Buton pentru contribuție */}
            <button onClick={() => contribute(index)} disabled={fund.executed}>
              Contribute
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default FundraisingList;