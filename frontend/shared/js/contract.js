import { config, setContractAddress } from './config.js';
import { ethers } from 'https://esm.sh/ethers@6.13.5';

export const CONTRACT_ABI = [
  "event DocumentCertified(address indexed student, string cid, uint256 timestamp)",
  "function certifyDocument(string memory cid) external returns (uint256)",
  "function getMyDocuments(address student) external view returns (tuple(string cid, uint256 timestamp)[] memory)",
  "function getStudentDocuments(address student) external view returns (tuple(string cid, uint256 timestamp)[] memory)",
  "function verifyDocument(address student, string memory cid) external view returns (bool)",
  "function documentCount() external view returns (uint256)"
];

let contract = null;
let studentWallet = null;

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask non è installato.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) !== config.chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: config.chainIdHex }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: config.chainIdHex,
                chainName: 'Sepolia',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: [config.sepoliaRpcUrl],
              },
            ],
          });
        } else {
          throw new Error('Retina non supportata.');
        }
      }
    }

    const signer = await provider.getSigner();
    studentWallet = signer;
    contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, signer);

    const address = await signer.getAddress();
    return { address, provider };
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Connessione a MetaMask annullata.');
    }
    throw err;
  }
}

export async function getWalletAddress() {
  if (!studentWallet) {
    throw new Error('Wallet non connesso.');
  }
  return await studentWallet.getAddress();
}

export async function certifyDocument(cid) {
  if (!contract) {
    throw new Error('Contratto non inizializzato.');
  }

  try {
    const tx = await contract.certifyDocument(cid);
    await tx.wait();
    return true;
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Transazione annullata.');
    }
    throw err;
  }
}

export async function getMyDocuments(studentAddress) {
  if (!contract) {
    throw new Error('Contratto non inizializzato.');
  }

  try {
    const documents = await contract.getMyDocuments(studentAddress);
    return documents.map(d => ({ cid: d.cid, timestamp: Number(d.timestamp) }));
  } catch (err) {
    throw err;
  }
}

export function createReadOnlyProvider() {
  return new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
}

export function createReadOnlyContract(provider) {
  return new ethers.Contract(config.contractAddress, CONTRACT_ABI, provider);
}

export async function getStudentDocumentsReadOnly(contractReadOnly, studentAddress) {
  try {
    const documents = await contractReadOnly.getStudentDocuments(studentAddress);
    return documents.map(d => ({ cid: d.cid, timestamp: Number(d.timestamp) }));
  } catch (err) {
    throw err;
  }
}

export async function verifyDocumentReadOnly(contractReadOnly, studentAddress, cid) {
  try {
    const isValid = await contractReadOnly.verifyDocument(studentAddress, cid);
    return isValid;
  } catch (err) {
    throw err;
  }
}

export { setContractAddress };