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
  const [refreshProjects, setRefreshProjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metamaskInstalled, setMetamaskInstalled] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [showMyProjects, setShowMyProjects] = useState(false);
  const [disabledWithdraws, setDisabledWithdraws] = useState({});

  const handleProjectCreated = () => {
    setRefreshProjects(prev => !prev); // Toggling va re-randa lista de proiecte
  };

  useEffect(() => {
    if (window.ethereum) {
      setMetamaskInstalled(true);
      setShowMyProjects(false); // 🔄 Închide automat bara cu proiecte la schimbarea contului
      setMyProjects([]);

      
      
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
  }, [account, provider]);

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

  const loadMyProjects = async () => {
    if (!account || !provider) return;
    try {
      const crowdfundingContract = new ethers.Contract(
        crowdfundingAddress,
        CrowdfundingABI,
        provider
      );
      const count = await crowdfundingContract.getProposalsCount();
      const projects = [];

      for (let i = 0; i < count; i++) {
        const proposal = await crowdfundingContract.proposals(i);
        if (proposal.projectContract) {
          const projectContract = new ethers.Contract(
            proposal.projectContract,
            ProjectABI,
            provider
          );
          const projectOwner = await projectContract.owner();
          if (projectOwner.toLowerCase() === account.toLowerCase()) {
            const raisedAmount = await projectContract.getFinalAmount();
            const fundRequest = ethers.formatEther(proposal.fundRequest);
            projects.push({
              id: i,
              name: proposal.name,
              description: proposal.description,
              raisedAmount: ethers.formatEther(raisedAmount),
              fundRequest: fundRequest,
              completed: raisedAmount >= ethers.parseEther(fundRequest),
              contractAddress: proposal.projectContract,
            });
          }
        }
      }
      setMyProjects(projects);
      setShowMyProjects(prev => !prev);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const withdrawFunds = async (contractAddress) => {
    if (!signer) return;
    try {
      setDisabledWithdraws((prev) => ({ ...prev, [contractAddress]: true }));
      const projectContract = new ethers.Contract(contractAddress, ProjectABI, signer);
      const tx = await projectContract.withdrawFunds();
      await tx.wait();
      alert("Funds withdrawn successfully!");
      loadMyProjects();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Withdrawal failed.");
      setDisabledWithdraws((prev) => ({ ...prev, [contractAddress]: false }));
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
            <button onClick={loadMyProjects} className="connect-button">
              Show My Projects
            </button>
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
            <CreateFundraisingForm provider={provider} onProjectCreated={handleProjectCreated}/>
          </div>

          <div className="fundraising-list">
            <FundraisingList provider={provider} refresh={refreshProjects}/>
          </div>

          {showMyProjects && (
            <div className="my-projects">
              <h2>My Projects</h2>
              {myProjects.length === 0 ? (
                <p>No projects created.</p>
              ) : (
                myProjects.map((project, index) => (
                  <div key={index} className="project-item">
                    <p><strong>Name:</strong> {project.name}</p>
                    <p><strong>Description:</strong> {project.description}</p>
                    <p><strong>Required Amount:</strong> {project.fundRequest} ETH</p>
                    <p><strong>Raised Amount:</strong> {project.raisedAmount} ETH</p>
                    <p><strong>Status:</strong> {project.completed ? "Completed ✅" : "Active ⏳"}</p>
                    
                    {project.completed && (
                      <button 
                        onClick={() => withdrawFunds(project.contractAddress)} 
                        disabled={disabledWithdraws[project.contractAddress]}
                      >
                        Withdraw Funds
                      </button>
                    )}

                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
