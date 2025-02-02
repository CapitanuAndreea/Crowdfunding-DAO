import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CrowdfundingABI from "../Crowdfunding.json";
import "../styles/FundraisingList.css";

const crowdfundingAddress = "0x306e170b5D16b15bA17E7F0a37c3191aDd47E581";

const FundraisingList = ({ provider }) => {
  const [fundraisings, setFundraisings] = useState([]);
  const [contract, setContract] = useState(null);
  const [contributionAmounts, setContributionAmounts] = useState({});

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

      for (let i = 0; i < count; i++) {
        const proposal = await crowdfundingContract.proposals(i);
        console.log(`Proposal ${i}:`, {
          description: proposal.description,
          fundRequest: ethers.formatEther(proposal.fundRequest),
          executed: proposal.executed,
          projectContract: proposal.projectContract,
        });

        fundraisers.push({
          id: i,
          description: proposal.description,
          fundRequest: ethers.formatEther(proposal.fundRequest),
          executed: proposal.executed,
          projectContract: proposal.projectContract, // Adresa contractului proiectului
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

  const sendTestTransaction = async (projectContractAddress) => {
    if (!provider) {
      console.error("Provider not found");
      alert("Conectează-te la MetaMask înainte de a testa!");
      return;
    }

    if (!ethers.isAddress(projectContractAddress)) {
      alert("Adresa contractului nu este validă!");
      return;
    }

    try {
      const signer = await provider.getSigner();

      console.log("📢 Trimit ETH către:", projectContractAddress);

      const tx = await signer.sendTransaction({
        to: projectContractAddress,
        value: ethers.parseEther("0.001"),
        gasLimit: ethers.toBigInt(300000),
      });

      await tx.wait();
      console.log("✅ Tranzacția a fost trimisă cu succes:", tx);
      alert("Tranzacție reușită! Verifică în MetaMask.");
    } catch (error) {
      console.error("⛔ Eroare la trimiterea ETH:", error);
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

            {/* Buton pentru trimiterea de ETH către contractul proiectului */}
            {fund.projectContract !== ethers.ZeroAddress && (
              <button onClick={() => sendTestTransaction(fund.projectContract)}>
                Test Send ETH to Project
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default FundraisingList;
