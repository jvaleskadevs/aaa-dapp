'use client';
import { useEffect, useState } from "react";
import styles from "./homeComponent.module.css";

import {
  //SimpleSmartContractAccount,
  SmartAccountProvider,
  type SimpleSmartAccountOwner,
} from "@alchemy/aa-core";
import { CustomSimpleSmartContractAccount } from "@/libs/CustomSimpleSmartContractAccount";
import { polygonMumbai } from "viem/chains";
import { toHex, parseEther, formatEther, parseAbiItem, encodeFunctionData } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import {
  ENTRYPOINT_ADDRESS,
  ENTRYPOINT_ABI,
  SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  CustomSimpleAccountAbi
} from "@/app/constants";
import { useCustomAccountOwner } from "@/hooks/useCustomAccountOwner";
import ModalComponent from "@/components/modalComponent";


export default function HomeComponent() {
  const [smartAccountProvider, setSmartAccountProvider] = useState<SmartAccountProvider>(null);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string>("");
  const [smartWalletBalance, setSmartWalletBalance] = useState<string>("");
  const [entryPointBalance, setEntryPointBalance] = useState<string>("");
  const [recoveryWallet, setRecoveryWallet] = useState<string>("");
  const [smartWalletAddressToRecover, setSmartWalletAddressToRecover] = useState<string>("");
  const [ownerAddressToRecover, setOwnerAddressToRecover] = useState<string>("");
  const [message, setMessage] = useState<string>("Welcome to AAA!");
  const [showModal, setShowModal] = useState<number>(0);
  const [refresh, setRefresh] = useState<number>(0);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  // this hook makes some magic converting our signer
  // into an aaa valid owner for our custom account
  const ownerResult = useCustomAccountOwner();
  
  
  // Allow users to create our CustomSmartWallet
  // or connect to one previously created 
  const createSmartWallet = async () => {
    if (!ownerResult) return;

    const provider = new SmartAccountProvider(
      "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      ENTRYPOINT_ADDRESS,
      polygonMumbai // chain
    ).connect(
      (rpcClient) => new CustomSimpleSmartContractAccount({
        entryPointAddress: ENTRYPOINT_ADDRESS,
        chain: polygonMumbai,
        factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
        owner: ownerResult.owner, // aka the signer (owner* || recovery)
        ownerAddress: address, // smart wallet owner address
        index: 0n, // smart account nonce
        rpcClient,
    }));
    
    const accountAddress = await provider.getAddress();
    setSmartAccountProvider(provider);
    setSmartWalletAddress(accountAddress);
  };
  
  
  // Allow users to connect to their CustomSmartWallet using a Recovery Wallet
  const connectSmartWalletFromRecovery = async () => {
    setShowModal(0);
    if (!ownerResult) return;
    
    const provider = new SmartAccountProvider(
      "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      ENTRYPOINT_ADDRESS,
      polygonMumbai // chain
    ).connect(
      (rpcClient) => new CustomSimpleSmartContractAccount({
        entryPointAddress: ENTRYPOINT_ADDRESS,
        chain: polygonMumbai,
        factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
        owner: ownerResult.owner, // aka the signer (owner || recovery*)
        ownerAddress: ownerAddressToRecover, // smart wallet owner address
        index: 0n, // smart account nonce
        rpcClient,
    }));
    
    const accountAddress = await provider.getAddress();
    setSmartAccountProvider(provider);
    setSmartWalletAddress(accountAddress);
  };
  
  
  // Allow users to fund their CustomSmartWallet
  const fundSmartWallet = async () => {
    if (!walletClient || !smartWalletAddress) return;
    
    const hash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      value: parseEther('0.01')
    });
    
    setMessage("Waiting for confirmation...");
    
    const receipt = await smartAccountProvider?.rpcClient.waitForTransactionReceipt({ hash });
    console.log(receipt);
    
    setMessage("You successfully funded your Smart Wallet!");
    setRefresh(prevRefresh => prevRefresh + 1);
    //fetchSmartWalletBalance();
  };
  

  // Allow users to add a deposit to the CustomSmartWallet EntryPoint
  const fundEntryPoint = async () => {
    setShowModal(0);
    if (!walletClient || !smartWalletAddress) return;
    
    const hash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      data: encodeFunctionData({
        abi: CustomSimpleAccountAbi,
        functionName: "addDeposit"
      }),
      value: parseEther('0.01')
    });  
    
    setMessage("Waiting for confirmation...");
    
    // print the tx receipt
    const receipt = await smartAccountProvider?.rpcClient.waitForTransactionReceipt({ hash });
    console.log(receipt);    
    
    setMessage("Deposit successfully added to the EntryPoint!"); 
    setRefresh(prevRefresh => prevRefresh + 1); 
  };
  
  
  // Allow users to withdraw from the CustomSmartWallet EntryPoint
  const withdrawFromEntryPoint = async () => {
    setShowModal(0);
    if (!walletClient || !smartWalletAddress) return;
    
    const hash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      data: encodeFunctionData({
        abi: CustomSimpleAccountAbi,
        functionName: "withdrawDepositTo",
        args: [
          address, 
          parseEther('0.1')
        ]
      }),
      value: 0n
    });  
    
    setMessage("Waiting for confirmation...");
    
    // print the tx receipt
    const receipt = await smartAccountProvider?.rpcClient.waitForTransactionReceipt({ hash });
    console.log(receipt);    
    
    setMessage("Deposit successfully added to the EntryPoint!"); 
    setRefresh(prevRefresh => prevRefresh + 1); 
  };

  
  // Allow users to mint an NFT using their CustomSmartWallet
  const mintNftWithSmartWallet = async () => {
    if (!smartAccountProvider) return;
    
    // the magic happens here:
    const { hash } = await smartAccountProvider.sendUserOperation({
      target: NFT_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: NFT_CONTRACT_ABI,
        functionName: "mintTo",
        args: [smartWalletAddress]
      }),
      value: 0n
    });
    
    setMessage("Waiting for confirmation...");
    
    // watch event, then print logs, remove listener and print a message
    const unwatch = smartAccountProvider.rpcClient.watchEvent({
      address: NFT_CONTRACT_ADDRESS,
      event: parseAbiItem("event Transfer(address from, address to, uint256 value)"),
      args: {
        from: "0x0000000000000000000000000000000000000000",
        to: smartWalletAddress
      },
      onLogs: (logs) => {
        console.log(logs);        
        unwatch();
        setMessage("NFT successfully minted with your Smart Wallet!");
        setRefresh(prevRefresh => prevRefresh + 1);
      }
    });
  };
  
  
  // Allow users to add a recovery address to their CustomSmartWallet
  const addRecoveryWallet = async () => {
    setShowModal(0);
    if (!recoveryWallet || !walletClient || !smartWalletAddress) return;
    
    const hash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      data: encodeFunctionData({
        abi: CustomSimpleAccountAbi,
        functionName: "addRecoveryWallet",
        args: [recoveryWallet]
      }),
      value: 0n
    });  
    
    setMessage("Waiting for confirmation...");
    
    // print the tx receipt
    const receipt = await smartAccountProvider?.rpcClient.waitForTransactionReceipt({ hash });
    console.log(receipt);    
    
    setMessage("Recovery wallet successfully added to your Smart Wallet!");  
  };
  
  // Allow users to remove an authorized address from their CustomSmartWallet
  const removeRecoveryWallet = async () => {
    setShowModal(0);
    if (!recoveryWallet || !walletClient) return;
    
    const hash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      data: encodeFunctionData({
        abi: CustomSimpleAccountAbi,
        functionName: "removeRecoveryWallet",
        args: [recoveryWallet]
      }),
      value: 0n
    });  
    
    setMessage("Waiting for confirmation...");
    
    // print the tx receipt
    const receipt = await smartAccountProvider?.rpcClient.waitForTransactionReceipt({ hash });
    console.log(receipt);    
    
    setMessage("Recovery wallet successfully removed from your Smart Wallet!");  
  };
  

  const openModal = async (modalType: number) => {
    if (!walletClient) return;
    
    setMessage("");
    setShowModal(modalType);    
  };
  
  
  const fetchSmartWalletBalance = async () => {
    const balance = await smartAccountProvider?.rpcClient.getBalance({
      address: smartWalletAddress
    });
    setSmartWalletBalance(balance);    
  };
  
  const fetchEntryPointBalance = async () => {
    console.log(smartAccountProvider?.rpcClient);
    const balance = await smartAccountProvider?.rpcClient.readContract({
      address: ENTRYPOINT_ADDRESS,
      abi: ENTRYPOINT_ABI,
      functionName: "balanceOf",
      args: [ smartWalletAddress ]
    });
    setEntryPointBalance(balance);    
  };
  
  useEffect(() => {
    fetchSmartWalletBalance();
    fetchEntryPointBalance();
  }, [smartWalletAddress, refresh]);
  
  return (
  <>
    <div className={styles.container}>
      <header className={styles.header_container}>
        <div className={styles.header}>
          <h1>
            aa<span>a-dapp</span>
          </h1>
          <h3>The ultimate solution to create smart wallets</h3>
        </div>
      </header>
      
      <div className={styles.buttons_container}>
        <button
          className={styles.button}
          onClick={createSmartWallet}
        >
          Create Smart Wallet
        </button>
        <button
          className={styles.button}
          onClick={fundSmartWallet}
        >
          Fund Smart Wallet
        </button>
        <button
          className={styles.button}
          onClick={fundEntryPoint}
        >
          Fund EntryPoint
        </button>
        <button
          className={styles.button}
          onClick={withdrawFromEntryPoint}
        >
          Withdraw from EntryPoint
        </button>
        <button
          className={styles.button}
          onClick={() => openModal(1)}
        >
          Add Recovery Wallet
        </button>
        <button
          className={styles.button}
          onClick={() => openModal(2)}
        >
          Remove Recovery Wallet
        </button>
        <button
          className={styles.button}
          onClick={mintNftWithSmartWallet}
        >
          Mint NFT with Smart Wallet
        </button>
        <button
          className={styles.button}
          onClick={() => openModal(3)}
        >
          Connect to SW From Recovery
        </button>
      </div>
      
      { smartWalletAddress && <p>Smart Wallet address: {smartWalletAddress}</p> }
      
      { smartWalletBalance && <p>Smart Wallet balance: {formatEther(smartWalletBalance.toString())} MATIC</p> }
      
      { entryPointBalance && <p>EntryPoint balance: {formatEther(entryPointBalance.toString())} MATIC</p> }
      
      { message && <p className={styles.get_started}><span>{message}</span></p> }
      
      
      { showModal === 1 && 
          <ModalComponent title="Add Recovery Wallet" onClose={() => setShowModal(false)}>
            <div className={styles.modal_form}>
              <label htmlFor="address-input">
                Your recovery wallet address:
              </label>
              <input 
                id="address-input"
                type="text"
                placeholder="0x0000000000000...."
                value={recoveryWallet}
                onChange={(e) => setRecoveryWallet(e.target.value)}
                className={styles.address_input}
              />
              <button
                className={styles.button_small}
                onClick={addRecoveryWallet}
                type="button"
              >
                Add Wallet
              </button>              
              {message}
            </div>
          </ModalComponent> 
      }
      
      { showModal === 2 && 
          <ModalComponent title="Remove Recovery Wallet" onClose={() => setShowModal(false)}>
            <div className={styles.modal_form}>
              <label htmlFor="address-input">
                Wallet address to remove:
              </label>
              <input 
                id="address-input"
                type="text"
                placeholder="0x0000000000000...."
                value={recoveryWallet}
                onChange={(e) => setRecoveryWallet(e.target.value)}
                className={styles.address_input}
              />
              <button
                className={styles.button_small}
                onClick={removeRecoveryWallet}
                type="button"
              >
                Remove Wallet
              </button>              
              {message}
            </div>
          </ModalComponent> 
      }
      
      { showModal === 3 && 
          <ModalComponent title="Connect from Recovery" onClose={() => setShowModal(false)}>
            <div className={styles.modal_form}>
{/* 
              <label htmlFor="address-input">
                Your smart wallet address to recover:
              </label>
              <input 
                id="address-input"
                type="text"
                placeholder="0x0000000000000...."
                value={smartWalletAddressToRecover}
                onChange={(e) => setSmartWalletAddressToRecover(e.target.value)}
                className={styles.address_input}
              />
*/}
              <label htmlFor="address-owner-input">
                Smart Wallet owner address:
              </label>
              <input 
                id="address-owner-input"
                type="text"
                placeholder="0x0000000000000...."
                value={ownerAddressToRecover}
                onChange={(e) => setOwnerAddressToRecover(e.target.value)}
                className={styles.address_input}
              />
              <button
                className={styles.button_small}
                onClick={connectSmartWalletFromRecovery}
                type="button"
              >
                Connect
              </button>              
              {message}
            </div>
          </ModalComponent> 
      }
    </div>
  </>
  );
}
