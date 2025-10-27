// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Flare Testnet (Coston2)
  [114]: process.env.NEXT_PUBLIC_VESTING_CONTRACT_ADDRESS_TESTNET || '',
  
  // Flare Mainnet
  [14]: process.env.NEXT_PUBLIC_VESTING_CONTRACT_ADDRESS_MAINNET || '',
} as const;

// Get contract address for current chain
export const getContractAddress = (chainId: number): string => {
  const address = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!address) {
    throw new Error(`No contract address found for chain ID: ${chainId}`);
  }
  return address;
};

// Default contract address (testnet)
export const DEFAULT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[114];
