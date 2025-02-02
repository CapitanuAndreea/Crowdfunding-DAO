import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/FundraisingList.css";

const crowdfundingAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const FundraisingList = ({ provider }) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [contract, setContract] = useState(null);
  const [contributionAmounts, setContributionAmounts] = useState({});
  const [currentFunds, setCurrentFunds] = useState({});

  useEffect(() => {
    console.log("Provider in FundraisingList:", provider);

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
      const fundsRaised = {};

      for (let i = 0; i < count; i++) {
        const proposal = await crowdfundingContract.proposals(i);

        const projectContract = new ethers.Contract(
          proposal.projectContract,
          ["function getBalance() public view returns (uint256)"],
          provider
        );
        const raisedAmount = await projectContract.getBalance();

        fundsRaised[i] = ethers.formatEther(raisedAmount);

        console.log(`Proposal ${i}:`, {
          name: proposal.name,
          description: proposal.description,
          fundRequest: ethers.formatEther(proposal.fundRequest),
          executed: proposal.executed,
          projectContract: proposal.projectContract,
        });

        fundraisers.push({
          id: i,
          name: proposal.name,
          description: proposal.description,
          fundRequest: ethers.formatEther(proposal.fundRequest),
          executed: proposal.executed,
          projectContract: proposal.projectContract, // Adresa contractului proiectului
        });
      }

      setFundraisings(fundraisers);
      setCurrentFunds(fundsRaised);
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
        const tx = await crowdfundingWithSigner.contribute(fundraisingId, {
          value: ethers.parseEther(amount)
        });
        await tx.wait();
        alert("Contribuție efectuată cu succes!");
        window.location.reload();
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
        fundraisings.map((fund, index) => {
          const fundsRaised = currentFunds[index] || "0";
          const isFullyFunded = parseFloat(fundsRaised) >= parseFloat(fund.fundRequest);

          return (
            <div key={index} className="fundraising-item">
              <p><strong>Name:</strong> {fund.name}</p>
              <p><strong>Description:</strong> {fund.description}</p>
              <p><strong>Required Amount:</strong> {fund.fundRequest} ETH</p>
              <p><strong>Raised Amount:</strong> {fundsRaised} ETH</p>
              <p><strong>Status:</strong> {isFullyFunded ? "Completed" : "Active"}</p>

              {/* Input pentru suma de contribuție */}
              <input
                type="number"
                placeholder="Enter amount (ETH)"
                value={contributionAmounts[index] || ""}
                onChange={(e) =>
                  setContributionAmounts({
                    ...contributionAmounts,
                    [index]: e.target.value,
                  })
                }
                className="input-field"
                disabled={isFullyFunded}
              />

              {/* Buton pentru contribuție */}
              <button onClick={() => contribute(index)} disabled={isFullyFunded}>
                Contribute
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default FundraisingList;
