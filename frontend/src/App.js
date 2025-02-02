import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CrowdfundingData from "./Crowdfunding.json";
import ProjectData from "./Project.json";
import CreateFundraisingForm from "./components/CreateFundraisingForm";
import FundraisingList from "./components/FundraisingList";
import "./App.css";

const CrowdfundingABI = CrowdfundingData.abi;
const ProjectABI = ProjectData.abi;
const crowdfundingAddress = "0x306e170b5D16b15bA17E7F0a37c3191aDd47E581";

const App = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metamaskInstalled, setMetamaskInstalled] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      setMetamaskInstalled(true);

      window.ethereum.on("accountsChanged", async (accounts) => {
        try {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            updateBalance(accounts[0]);
          } else {
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setBalance("0");
          }
        } catch (error) {
          console.error("Error handling account change:", error);
        }
      });
    }
  }, []);

  const initWeb3 = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);

      updateBalance(userAddress);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Connection to MetaMask failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (userAddress) => {
    if (!provider) return;
    try {
      const userBalance = await provider.getBalance(userAddress);
      setBalance(ethers.formatEther(userBalance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

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
          <>
            {metamaskInstalled ? (
              <button onClick={initWeb3} className="connect-button">
                Connect to MetaMask
              </button>
            ) : (
              <p>Please install MetaMask to use this platform.</p>
            )}
          </>
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
