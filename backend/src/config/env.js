import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  pinataJwt: process.env.PINATA_JWT || '',
  pinataGatewayBaseUrl:
  process.env.PINATA_GATEWAY_BASE_URL ||
  'https://sapphire-magnetic-lizard-195.mypinata.cloud/ipfs',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  chainId: Number(process.env.CHAIN_ID) || 11155111,
  
  publicBackendBaseUrl: process.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost/api',
  publicSepoliaRpcUrl: process.env.PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  publicPinataGatewayBaseUrl: process.env.PUBLIC_PINATA_GATEWAY_BASE_URL || 'https://gateway.pinata.cloud/ipfs',
};

// Validazione base
if (!env.pinataJwt) {
  console.warn('[env] Attenzione: PINATA_JWT non impostato. L\'upload su IPFS non funzionerà.');
}

if (!env.contractAddress) {
  console.warn('[env] Attenzione: CONTRACT_ADDRESS non impostato. La registrazione on-chain non funzionerà.');
}