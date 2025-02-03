import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/FundraisingList.css";

const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const FundraisingList = ({ provider, refresh }) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [contract, setContract] = useState(null);
  const [contributionAmounts, setContributionAmounts] = useState({});
  const [currentFunds, setCurrentFunds] = useState({});

  useEffect(() => {
    if (!provider) return;
    loadFundraisings();
  }, [provider, refresh]);

  const loadFundraisings = async () => {
    try {
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
  
        const projectContract = new ethers.Contract(
          proposal.projectContract,
          ["function getBalance() public view returns (uint256)", "function getFinalAmount() public view returns (uint256)"],
          provider
        );
  
        let raisedAmount;
        if (proposal.executed) {
          raisedAmount = await projectContract.getFinalAmount();
        } else {
          raisedAmount = await projectContract.getBalance();
        }
  
        const raisedEth = ethers.formatEther(raisedAmount);
        const fundRequestEth = ethers.formatEther(proposal.fundRequest);
  
        fundraisers.push({
          id: i,
          name: proposal.name,
          description: proposal.description,
          fundRequest: fundRequestEth,
          raisedAmount: raisedEth,
          executed: proposal.executed,
          projectContract: proposal.projectContract,
        });
      }
  
      setFundraisings(fundraisers);
    } catch (error) {
      console.error("Error loading fundraisings:", error);
    }
  };
  

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
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      alert("Contribuție efectuată cu succes!");

      // 🔄 Reactualizează doar datele, fără refresh
      loadFundraisings();
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
            <p><strong>Name:</strong> {fund.name}</p>
            <p><strong>Description:</strong> {fund.description}</p>
            <p><strong>Required Amount:</strong> {fund.fundRequest} ETH</p>
            <p><strong>Raised Amount:</strong> {fund.raisedAmount} ETH</p>
            <p><strong>Status:</strong> {fund.executed ? "Completed ✅" : "Active ⏳"}</p>

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
