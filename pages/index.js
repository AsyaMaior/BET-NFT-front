import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import {
  NFT_CONTRACT_ADDRESS,
  abi_nft,
  BETTING_CONTRACT_ADDRESS,
  abi_betting,
} from "constants";
import { Contract, providers, ethers } from "ethers";
import { useState, useEffect, useRef } from "react";
import { Web3Button } from "@web3modal/react";
import { fetchSigner, getContract, getProvider, getAccount } from "@wagmi/core";
import { useAccount } from "wagmi";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [nfts, setNfts] = useState(0);
  const [nftArray, setNftArray] = useState([]);
  const [nftNumber, setNftNumber] = useState("");
  const [accountStatus, setAccountStatus] = useState(false);
  const [timeByRound, setTimeByRound] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  // const [addressInWhitelist, setAddressInWhitelist] = useState(false);

  function convertTime(value) {
    return Math.floor(value / 60) + ":" + (value % 60 ? value % 60 : "00");
  }

  const getCurrentPrice = async () => {
    try {
      const provider = getProvider();
      console.log(provider);
      const bettingContract = getContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: abi_betting,
        signerOrProvider: provider,
      });
      console.log(bettingContract);
      const priceHex = await bettingContract.getLatestPrice();
      console.log(priceHex);
      const price = Math.floor(Number(priceHex) / 1000000) / 100;
      console.log(price);
      setCurrentPrice(price);
    } catch (error) {
      console.error(error);
    }
  };

  const renderBlock = () => {
    if (accountStatus) {
      return (
        <>
          <BetBlock />
          {/* <MintedBlock /> */}
        </>
      );
    }
    return <FirstPageBlock />;
  };

  function FirstPageBlock() {
    return (
      <div className={styles.firstPageText}>
        <p>
          Betting contract takes the prices of BNB every 30 mins automaited by
          chainlink and lets you do a binary option style of bet. The nft
          contract lets you mint an nft if you won the bet only.
        </p>
        <h4>To place a bet, connect your wallet!</h4>
      </div>
    );
  }

  function BetBlock() {
    return (
      <div>
        <p>Get the current price of BTC</p>
        <button className={styles.button} onClick={getCurrentPrice}>
          get price
        </button>
        <p>Current price BTC: {currentPrice}</p>
        <p>Place a bet:</p>
        <div>
          <button className={styles.buttonUpp} onClick={betUpp}>
            Price Up
          </button>

          <button className={styles.buttonDown} onClick={betDown}>
            Price Down
          </button>
        </div>
        <p>Until the end of the round: {convertTime(timeByRound)} </p>
        <p>
          If the round is over, wait for the next one <br />
          (wait no more than 15 minutes)
        </p>
      </div>
    );
  }

  function MintedBlock() {
    return (
      <div>
        <h4>You are {/* {win} */} the winner! You can mint NFT</h4>
        <button className={styles.button} onClick={mintByLine}>
          Mint by queue
        </button>
        <p>
          Input NFT number:
          <input
            className={styles.input}
            type="number"
            step="1"
            min="0"
            max="16"
            id="number"
            onChange={(e) => updateNftNumber(e.target.value)}
          />
          <button className={styles.button} onClick={mintByTokenId}>
            Mint by number
          </button>
        </p>
        <p>Your number of nfts: {nfts}</p>
      </div>
    );
  }

  const betUpp = async () => {
    try {
      const signer = await fetchSigner();

      const bettingContract = getContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: abi_betting,
        signerOrProvider: signer,
      });

      await bettingContract.placeBet(0, {
        value: ethers.utils.parseEther("0.001"),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const betDown = async () => {
    try {
      const signer = await fetchSigner();

      const bettingContract = getContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: abi_betting,
        signerOrProvider: signer,
      });

      await bettingContract.placeBet(1, {
        value: ethers.utils.parseEther("0.001"),
      });
    } catch (error) {
      console.error(error);
    }
  };

  async function getTime() {
    try {
      const provider = getProvider();

      const bettingContract = getContract({
        address: BETTING_CONTRACT_ADDRESS,
        abi: abi_betting,
        signerOrProvider: provider,
      });

      const timeBigNumber = await bettingContract.timeLeftToBet();
      const time = Number(timeBigNumber);
      setTimeByRound(time);
    } catch (error) {
      console.error(error);
    }
  }

  async function getNfts() {
    try {
      const provider = getProvider();

      const nftContract = getContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: abi_nft,
        signerOrProvider: provider,
      });

      let newNfts = [];
      const totalSupplyHex = await nftContract.totalSupply();
      const totalSupply = Number(totalSupplyHex);

      for (let i = 0; i < totalSupply; i++) {
        const nftNumberHex = await nftContract.tokenByIndex(i);
        const nftNumber = Number(nftNumberHex);
        newNfts.push(nftNumber);
      }
      setNftArray(newNfts);
    } catch (error) {
      console.error(error);
    }
  }

  async function getBalanceNft() {
    try {
      const signer = await fetchSigner();

      const nftContract = getContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: abi_nft,
        signerOrProvider: signer,
      });

      const address = await signer.getAddress();
      const nftBalance = Number(await nftContract.balanceOf(address));

      setNfts(nftBalance);
    } catch (error) {
      console.error(error);
    }
  }

  const mintByLine = async () => {
    try {
      const signer = await fetchSigner();

      const nftContract = getContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: abi_nft,
        signerOrProvider: signer,
      });

      await nftContract.mintByLine({
        value: ethers.utils.parseEther("0.001"),
      });
      getNfts();
      getBalanceNft();
    } catch (error) {
      console.error(error);
    }
  };

  function updateNftNumber(number) {
    setNftNumber(number);
  }

  const mintByTokenId = async () => {
    try {
      const signer = await fetchSigner();

      const nftContract = getContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: abi_nft,
        signerOrProvider: signer,
      });

      const tokenId = Number(nftNumber);

      await nftContract.mintByTokenId(tokenId, {
        value: ethers.utils.parseEther("0.001"),
      });
      getNfts();
      getBalanceNft();
    } catch (error) {
      console.error(error);
    }
  };

  const isMinted = (id) => {
    if (nftArray.includes(Number(id), 0)) {
      return <p>NFT has already been minted!</p>;
    }
  };

  function NFTGallery() {
    let content = [];
    for (let i = 1; i < 36; i++) {
      content.push(<NFTCard id={`${i}`} />);
    }
    return <div className={styles.grid}>{content}</div>;
  }

  function NFTCard({ id }) {
    let baseURI = "ipfs://Qmav8DDqcSqG9p7tVKEcpDo9UL7GwMwWyHEqKJWF2buaLB/";
    baseURI = baseURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    let fullURI = `${baseURI}${id}.png`;
    return (
      <>
        <div className={styles.card}>
          <img src={fullURI} width="235" />
          <div align="center">
            <h4>
              <b>DreamTeam Cat with Miracle Glasses {id}</b>
            </h4>
            {isMinted(id)}
          </div>
        </div>
      </>
    );
  }

  useEffect(() => {
    getNfts();
    if (getAccount().isConnected) {
      getBalanceNft();
      setAccountStatus(true);
    }
    if (getAccount().isDisconnected) {
      setNfts(0);
      setAccountStatus(false);
    }
  });

  useEffect(() => {
    if (accountStatus == true) {
      getTime();
    }
  });

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description} align="center">
          <p>Betting dApp</p>
          <div>
            <Web3Button icon="show" label="Connect Wallet" balance="show" />
          </div>
        </div>
        <div className={styles.mintblock}>{renderBlock()}</div>

        <div>
          <h3 align="center">
            You can win one NFT from the collection "DreamTeam Cats with Miracle
            Glasses"
          </h3>
          <NFTGallery />
        </div>
      </main>
    </>
  );
}
