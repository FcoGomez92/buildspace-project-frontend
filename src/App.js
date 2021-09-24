import * as React from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [allWaves, setAllWaves] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [connectionError, setConnectionError] = React.useState("");
  const contractAddress = "0xEFc26673128cd281F0B170c2028C3a318051C675";
  const contractABI = abi.abi;

  const checkWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("You need to conect to metamask first");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found.");
      }
    });
  };
  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Get Metamask first!");
      return;
    }

    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        console.log("Connected", accounts[0]);
        setCurrAccount(accounts[0]);
        getAllWaves();
      })
      .catch((err) => console.log(err));
  };

  React.useEffect(() => {
    checkWallet();
  }, []);

  const wave = async () => {
    verifyInput();
    if (error) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let count = await wavePortalContract.getTotalWaves();
    console.log("Retrieved total waves count...", count.toNumber());

    setIsLoading(true);
    setStatus("Waiting for MetaMask");
    try {
      let waveTxn = await wavePortalContract.wave(message, {
        gasLimit: 300000,
      });
      setStatus("Mining..." + waveTxn.hash);
      console.log("Mining...", waveTxn.hash);
      await waveTxn.wait();
      setStatus("Mined --" + waveTxn.hash);
      console.log("Mined --", waveTxn.hash);

      count = await wavePortalContract.getTotalWaves();
      console.log("Retrieved total waves count...", count.toNumber());
      setMessage("");
      setIsLoading(false);
    } catch (err) {
      setStatus("Transaction Cancelled");
      setIsLoading(false);
    }
  };

  async function getAllWaves() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    const network = await provider.detectNetwork();
    if (network.chainId !== 4) {
      setConnectionError("Please connect your wallet to Rinkeby Testnet");
      return;
    }

    let waves = await wavePortalContract.getAllWaves();

    let wavesCleaned = [];
    waves.forEach((wave) => {
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      });
    });
    setAllWaves(wavesCleaned);
    console.log(allWaves);

    wavePortalContract.on("NewWave", (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((oldArray) => [
        ...oldArray,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    });
  }

  const verifyInput = () => {
    // eslint-disable-next-line
    const pattern =
      /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm;
    const okUrl = pattern.test(message.toLowerCase());
    if (message) {
      okUrl
        ? setError(false)
        : setError("Input pattern: http://example.com or https://example.com");
    } else {
      setError(false);
    }
  };

  return (
    <div className="background">
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">👋 Hey there _buildspace community!</div>

          <div className="bio">
            I am Francisco Gómez. I worked on finance and now looking for learn
            about the amazing crypto world. <br />
            <br /> Connect your Ethereum wallet and share the link of your
            _buildspace project.
          </div>
          <div className="action-div">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={verifyInput}
              placeholder="Share your project with the community"
              style={error ? { borderColor: "rgb(177 40 57)" } : null}
              disabled={!currAccount}
              title={
                !currAccount
                  ? "Connect a Wallet first"
                  : "Type or paste your project link here."
              }
            />
            <button
              className="waveButton"
              onClick={
                message.trim() ? wave : () => alert("The input can't be blank")
              }
            >
              Share Link
            </button>
          </div>
          {error && (
            <p
              style={{
                color: "rgb(177 40 57)",
                margin: "-15px 0 0 0",
                fontSize: "13px",
              }}
            >
              {error}
            </p>
          )}
          {connectionError && (
            <div className="errorConnection">
              <p>
                Please, connect your wallet to Rinkeby Testnet and refresh the
                page.
              </p>
            </div>
          )}
          {currAccount ? null : (
            <button className="waveButton" onClick={connectWallet}>
              Connect a Wallet
            </button>
          )}
        </div>
        <div className="data-content">
          {isLoading ? (
            <div className="loading-div">
              <p>Loading</p>
              <p>{status}</p>
            </div>
          ) : (
            <div className="transaction-div">
              {allWaves
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((wave) => {
                  return (
                    <div className="data">
                      <div className="data-pair">
                        <h4>Address:</h4>
                        <p>{wave.address}</p>
                      </div>
                      <div className="data-pair">
                        <h4>Time:</h4>
                        <p>{wave.timestamp.toString()}</p>
                      </div>
                      <div className="data-pair">
                        <h4>Project:</h4>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <p style={{ width: "95%", marginRight: "10px" }}>
                            {wave.message}
                          </p>
                          <a
                            href={wave.message}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🚀
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
