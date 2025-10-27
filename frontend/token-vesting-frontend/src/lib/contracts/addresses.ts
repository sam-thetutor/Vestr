// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Flare Testnet (Coston2) - Deployed contract address
  [114]: process.env.NEXT_PUBLIC_VESTING_CONTRACT_ADDRESS_TESTNET || '0x1518b4F2c3Ef48534055f3108104f2D7499D6349',
  
  // Flare Mainnet
  [14]: process.env.NEXT_PUBLIC_VESTING_CONTRACT_ADDRESS_MAINNET || '0x742d35Cc6634C0532925a3b8D0C0C2C8C8C8C8C8',
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
