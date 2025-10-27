import { createConfig, http } from 'wagmi';
import { flare, flareTestnet } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Get environment variables with fallbacks
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmh3tjbtd00s3k00ca0hafguu';
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Use the correct RPC URLs from wagmi chains
const flareTestnetRpc = flareTestnet.rpcUrls.default.http[0];
const flareMainnetRpc = flare.rpcUrls.default.http[0];

console.log('Flare Testnet RPC:', flareTestnetRpc);
console.log('Flare Testnet Chain ID:', flareTestnet.id);
console.log('Flare Testnet Name:', flareTestnet.name);

// Configure Wagmi with Flare networks
const config = createConfig({
  chains: [flareTestnet, flare],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: walletConnectProjectId,
    }),
  ],
  transports: {
    [flareTestnet.id]: http(flareTestnetRpc),
    [flare.id]: http(flareMainnetRpc),
  },
});

// Privy configuration
const privyConfig = {
  appId: privyAppId,
  config: {
    // Configure supported chains
    supportedChains: [flareTestnet, flare],
    defaultChain: flareTestnet,
    
    // Configure appearance
    appearance: {
      theme: 'light' as const,
      accentColor: '#676FFF' as const,
    },
    
    // Configure login methods
    loginMethods: ['wallet'] as ('wallet' | 'email' | 'sms' | 'google' | 'twitter' | 'discord' | 'github' | 'linkedin' | 'spotify' | 'instagram' | 'tiktok' | 'line' | 'twitch' | 'apple' | 'farcaster' | 'telegram' | 'passkey')[],
    
    // Configure embedded wallets
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets' as const,
      },
    },
  },
};

export { config, privyConfig };
export default config;