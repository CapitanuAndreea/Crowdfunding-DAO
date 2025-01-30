import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CrowdfundingData from "./Crowdfunding.json";
import ProjectData from "./Project.json";
import CreateFundraisingForm from "./components/CreateFundraisingForm";
import FundraisingList from "./components/FundraisingList";
import "./App.css";

const CrowdfundingABI = CrowdfundingData.abi;
const ProjectABI = ProjectData.abi;

const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const App = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);

  const initWeb3 = async () => {
    if (window.ethereum) {
      setLoading(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);

      const userAddress = await web3Signer.getAddress();
      setAccount(userAddress);

      const userBalance = await web3Provider.getBalance(userAddress);
      setBalance(ethers.formatEther(userBalance));

      setLoading(false);
    } else {
      alert("Please install MetaMask");
    }
  };

  useEffect(() => {
    if (account) return; // Dacă deja e conectat, nu mai inițializăm din nou
    initWeb3();
  }, [account]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Welcome to the Crowdfunding Platform</h1>
        {loading ? (
          <p>Loading...</p>
        ) : account ? (
          <>
            <p>Connected Account: {account}</p>
            <p>Balance: {balance} ETH</p>
          </>
        ) : (
          <button onClick={initWeb3} className="connect-button">
            Connect to MetaMask
          </button>
        )}
      </div>
      
      {account && (
        <div className="main-content">
          <div className="create-fundraising">
            <CreateFundraisingForm provider={provider} />
          </div>
          
          <div className="fundraising-list">
            <FundraisingList provider={provider} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
