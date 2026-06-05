// Configurazione condivisa frontend ErasmusChain

export const config = {
  // Blockchain
  sepoliaRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  chainId: 11155111,
  chainIdHex: '0xaa36a7', // 11155111 in esadecimale
  contractAddress: '0x19Cf1D99798d7Da8b23f8a79db8f65DAF4737F5C', // DA AGGIORNARE dopo il deploy

  // Pinata
  pinataGatewayBaseUrl: 'https://sapphire-magnetic-lizard-195.mypinata.cloud/ipfs',

  // Backend
  backendBaseUrl: 'http://localhost/api',
};

// Funzione per aggiornare l'indirizzo del contratto dopo il deploy
export function setContractAddress(address) {
  config.contractAddress = address;
  console.log('[config] Contract address aggiornato a:', address);
}

// Helper per verificare se il contract address è ancora il default
export function isContractAddressDefault() {
  return config.contractAddress === '0x0000000000000000000000000000000000000000';
}