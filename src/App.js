import React, { useState, useEffect, useRef } from 'react';
import './App.css';
// Web3 Dependencies
import { Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "./constants";
import DoughnutChart from './charts/DoughnutChart'
import BarChart from './charts/BarChart'



function App() {

  const [walletConnected, setWalletConnected] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState('')
  const [formattedConnectedAddress, setFormettedConnectedAddress] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [marketTitle, setMarketTitle] = useState('')
  const [marketType, setMarketType] = useState('')
  const [selectionOneTitle, setSelectionOneTitle] = useState('')
  const [selectionTwoTitle, setSelectionTwoTitle] = useState('')
  const [loadingBetInfo, setLoadingBetInfo] = useState(false)
  const [outcomeOneBetAmount, setOutcomeOneBetAmount] = useState(0)
  const [outcomeTwoBetAmount, setOutcomeTwoBetAmount] = useState(0)
  const [outcomeOneStake, setOutcomeOneStake] = useState(0)
  const [outcomeTwoStake, setOutcomeTwoStake] = useState(0)
  const [marketInfo, setMarketInfo] =useState({})
  
  const [takingBets, setTakingBets] = useState(false)
  // Web3ModalRef
  const web3ModalRef = useRef();

  useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false,
    })
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      connectWallet();
    }
    setMarketInfo({
      outcomeOneBetAmount,
      outcomeTwoBetAmount,
      selectionOneTitle,
      selectionTwoTitle
    })
  }, [
    walletConnected,
    outcomeOneBetAmount,
    outcomeTwoBetAmount,
    selectionOneTitle,
    selectionTwoTitle
  ])

  const requestAccounts = async () => {
    if(window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts"
        })
        setConnectedAddress(accounts[0])
        formatAndSetAddress(accounts[0])
        checkOwner(accounts[0])
        resolveENS(accounts[0])
        renderMarketInfo()
      } catch (error) {
        console.err(error)
      }
    } else {
      alert('please install metamask')
    }
  }

  const formatAndSetAddress = (addressString) => {
    const Arr = addressString.split('')
    const formattedArr = [
      Arr[0],Arr[1],Arr[2],Arr[3],Arr[4], // First 5 digits
      '.','.','.',
      Arr[Arr.length-4], Arr[Arr.length-3], Arr[Arr.length-2], Arr[Arr.length-1] // Last 4
    ]
    setFormettedConnectedAddress(formattedArr.join(''))
  }

  const renderMarketInfo = async () => {

    setLoadingBetInfo(true);
    
    const signer = await getProviderOrSigner()

    const bettingContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

    const marketTitle = bettingContract.marketTitle();
    marketTitle.then((response) => {
      setMarketTitle(response);
    })

    const marketType = bettingContract.marketType();
    marketType.then((response) => {
      setMarketType(response);
    })
    
    const selectionOneTitle = bettingContract.selectionOneTitle();
    selectionOneTitle.then((response) => {
      setSelectionOneTitle(response);
    })
    
    const selectionTwoTitle = bettingContract.selectionTwoTitle();
    selectionTwoTitle.then((response) => {
      setSelectionTwoTitle(response);
    })

    const outcomeOneBetAmount = bettingContract.outcomeOneBetAmount();
    outcomeOneBetAmount.then((response) => {
      setOutcomeOneBetAmount(utils.formatUnits(response, 18));
    })
    const outcomeTwoBetAmount = bettingContract.outcomeTwoBetAmount();
    outcomeTwoBetAmount.then((response) => {
      setOutcomeTwoBetAmount(utils.formatUnits(response, 18));
    })

    setLoadingBetInfo(false);
  }

  const checkOwner = async (account) => {

    const signer = await getProviderOrSigner()

    const bettingContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

    const owner = await bettingContract.owner()

    if (account === owner.toLowerCase()){
      setIsOwner(true)
    }
  }

  //Returns a Provider or Signer object representing the Ethereum RPC with or without the signing capabilities of metamask attached
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // connectWallet: Connects the MetaMask wallet
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      const signer = await getProviderOrSigner();
      requestAccounts()
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const resolveENS  = async (address) => {
    const signer = await getProviderOrSigner();
    const name = await signer.lookupAddress(address);
    name && setFormettedConnectedAddress(name)
  }

  const toggleTakingBets = async () => {

    setLoadingBetInfo(true);

    const signer = await getProviderOrSigner(true)

    const bettingContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

    if(!takingBets) {
      const tx = await bettingContract.startTakingBets()
      await tx.wait();
      const takingBets = await bettingContract.takingBets()
      takingBets.then((result) => {
        setTakingBets(result)
      })
    }

    if(takingBets) {
      const tx = await bettingContract.stopTakingBets()
      await tx.wait();
      const takingBets = await bettingContract.takingBets()
      takingBets.then((result) => {
        setTakingBets(result)
      })
    }

    setLoadingBetInfo(false);
  }

  const handleSubmitMarketInformation = async () => {

    setLoadingBetInfo(true);

    const signer = await getProviderOrSigner(true)

    const bettingContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

    const tx = await bettingContract.initializeMarket(marketTitle, marketType, selectionOneTitle, selectionTwoTitle)
    await tx.wait()

    setLoadingBetInfo(true);
  }

  const incrementOutcomeOneStake = (value) => {

    let localValue = value;
    let localStake = outcomeOneStake

    if(typeof(localStake) === 'string') {
      localStake = parseFloat(localStake);
    }

    let newStake = (localStake + localValue).toFixed(2)

    setOutcomeOneStake(newStake)
  }

  const incrementOutcomeTwoStake = (value) => {

    let localValue = value;
    let localStake = outcomeTwoStake

    if(typeof(localStake) === 'string') {
      localStake = parseFloat(localStake);
    }

    let newStake = (localStake + localValue).toFixed(2)

    setOutcomeTwoStake(newStake)
  }

  const handleBetOnOutcomeOne = () => {
    // TODO
  }
  const handleBetOnOutcomeTwo = () => {
    // TODO
  }
  

  return (
    <div className="App">
      <header>
        {
        connectedAddress ? 
        <button className='connectWalletBtn'>{formattedConnectedAddress}</button> :
        <button className='connectWalletBtn' onClick={connectWallet}>Connect Wallet</button>
        }
      </header>
      { !isOwner ?
      <>
        <h1>{marketTitle ? marketTitle : 'Market Title'}</h1>
        <h2>{marketType ? marketType : 'Market Type'}</h2>
        <div className='betHolder'>
          <div className='betCards'>
            <h3>{selectionOneTitle ? selectionOneTitle : "Selection One Title"}</h3>
            <div className='stakeBtnContainer'>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(0.01)}>+ 0.01 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(0.02)}>+ 0.02 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(0.05)}>+ 0.05 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(0.1)}>+ 0.1 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(0.5)}>+ 0.5 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeOneStake(1)}>+ 1 Ξ</button>
              <button className='clearStakeBtn' onClick={() => setOutcomeOneStake(0)}>Clear</button>
              <button className={`submitBetBtn outcomeOne ${outcomeOneStake? 'readyToBet':'notReadyToBet'}`} onClick={handleBetOnOutcomeOne}>{!outcomeOneStake? "Enter Stake" : `Bet ${outcomeOneStake} Ξ on ${selectionOneTitle}`}</button>
            </div>
          </div>
          <div className='betCards'>
            <h3>{selectionTwoTitle ? selectionTwoTitle : "Selection Two Title"}</h3>
            <div className='stakeBtnContainer'>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(0.01)}>+ 0.01 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(0.02)}>+ 0.02 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(0.05)}>+ 0.05 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(0.1)}>+ 0.1 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(0.5)}>+ 0.5 Ξ</button>
              <button className='incrementStakeBtn' onClick={() => incrementOutcomeTwoStake(1)}>+ 1 Ξ</button>
              <button className='clearStakeBtn' onClick={() => setOutcomeTwoStake(0)}>Clear</button>
              <button className={`submitBetBtn outcomeTwo ${outcomeTwoStake? 'readyToBet':'notReadyToBet'}`} onClick={handleBetOnOutcomeTwo}>{!outcomeTwoStake? "Enter Stake" : `Bet ${outcomeTwoStake} Ξ on ${selectionTwoTitle}`}</button>
            </div>
          </div>
        </div>
        { // If market all market data exists then render charts
          outcomeOneBetAmount &&
          outcomeTwoBetAmount &&
          selectionOneTitle && // TODO add > 0 
          selectionTwoTitle ? // TODO add > 0 
          <div className='chartsContainer'>
            <div className="DoughnutChartHolder">
              <DoughnutChart marketInfo={marketInfo}/>
            </div>
            <div className="DoughnutChartHolder">
              <BarChart marketInfo={marketInfo}/>
            </div>
          </div> : ""}

      </>
      :
      <>          
        <div className='ownerDiv'>
          <h3>{marketTitle? marketTitle : 'Market Title'}</h3>
          <input placeholder='Market Title' type='text' onChange={(e) => setMarketTitle(e.target.value)}></input>
          <h3>{marketType? marketType : 'Market Type'}</h3>
          <input placeholder='Market Type' type='text' onChange={(e) => setMarketType(e.target.value)}></input>
          <h3>{selectionOneTitle? selectionOneTitle : 'Market Type'}</h3>
          <input placeholder='Market Type' type='text' onChange={(e) => setSelectionOneTitle(e.target.value)}></input>
          <h3>{selectionTwoTitle? selectionTwoTitle : 'Market Type'}</h3>
          <input placeholder='Market Type' type='text' onChange={(e) => setSelectionTwoTitle(e.target.value)}></input>
          <button onClick={handleSubmitMarketInformation}>Submit Market Information</button>
          <button onClick={toggleTakingBets}>{takingBets? 'Stop Taking Bets' : 'Start Taking Bets'}</button>
        </div>
      </>
      }
    </div>
  );
}

export default App;
