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
  
      // Verifică dacă deja este conectat
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      let userAddress = accounts.length > 0 ? accounts[0] : null;
  
      // Dacă nu este conectat, cere permisiunea
      if (!userAddress) {
        const requestedAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        userAddress = requestedAccounts[0];
      }
  
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);

      userAddress = await web3Signer.getAddress();
      setAccount(userAddress);
      const userBalance = await web3Provider.getBalance(userAddress);
      setBalance(ethers.formatEther(userBalance));
  
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      setBalance(ethers.formatEther(userBalance));
  
      console.log("Connected to MetaMask:", userAddress);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Connection to MetaMask failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          initWeb3(); // Reinitializează pentru noul cont
        } else {
          setAccount(null);
          setProvider(null);
          setSigner(null);
          setBalance("0");
        }
      });
  
      //initWeb3(); // Inițializează aplicația la încărcare
    }
  }, []);

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