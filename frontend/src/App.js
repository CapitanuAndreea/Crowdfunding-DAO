import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CrowdfundingData from "./Crowdfunding.json";
import ProjectData from "./Project.json";
import CreateFundraisingForm from "./components/CreateFundraisingForm";
import FundraisingList from "./components/FundraisingList";
import "./App.css";

const CrowdfundingABI = CrowdfundingData.abi;
const ProjectABI = ProjectData.abi;

const crowdfundingAddress = "0x3B34be004Ac4283914Ee833F00450cC8b116C6E2";

const App = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);

  const initWeb3 = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
  
    try {
      setLoading(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" }); // CERE ACCES LA CONT
  
      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();
      const userBalance = await web3Provider.getBalance(userAddress);
  
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      setBalance(ethers.formatEther(userBalance));
  
      console.log("Connected account:", userAddress);
      console.log("Balance:", ethers.formatEther(userBalance));
      const network = await web3Provider.getNetwork();
console.log("Connected to network:", network.chainId);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Connection to MetaMask failed!");
    } finally {
      setLoading(false);
    }
    console.log("Provider:", provider);
console.log("Signer:", signer);
console.log("Contract Address:", crowdfundingAddress);
console.log("ABI:", CrowdfundingABI);

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

