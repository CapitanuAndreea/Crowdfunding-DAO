import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CrowdfundingData from "./Crowdfunding.json";
import ProjectData from "./Project.json";

const CrowdfundingABI = CrowdfundingData.abi;
const ProjectABI = ProjectData.abi;


const crowdfundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const projectAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const App = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
  
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);
  
        const userAddress = await web3Signer.getAddress();
        setAccount(userAddress);
  
        const userBalance = await web3Provider.getBalance(userAddress);
        setBalance(ethers.formatEther(userBalance));
        
        const crowdfundingContract = new ethers.Contract(
          crowdfundingAddress,
          CrowdfundingABI,
          web3Signer
        );
        setContract(crowdfundingContract);
      } else {
        alert("Please install MetaMask");
      }
    };
    initWeb3();
  }, []);
  

  const contribute = async () => {
    if (!contract || !signer) return;
    const amount = ethers.parseEther("0.001");
    const tx = await contract.contribute({ value: amount });
    await tx.wait();
    alert("Contribution successful!");
  };

  return (
    <div>
      <h1>Crowdfunding Platform</h1>
      <p>Connected Account: {account}</p>
      <p>Balance: {balance} ETH</p>
      <button onClick={contribute}>Contribute 0.001 ETH</button>
    </div>
  );
};

export default App;
