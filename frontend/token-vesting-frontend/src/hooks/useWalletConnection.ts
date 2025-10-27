'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { flareTestnet } from 'wagmi/chains';
import { switchToFlareTestnet } from '@/lib/networkUtils';

export function useWalletConnection() {
  const privy = usePrivy();
  const [useWagmiFallback, setUseWagmiFallback] = useState(false);
  const chainId = useChainId();
  
  // Only call Wagmi hooks when we're in fallback mode
  let wagmiAccount, wagmiConnect, wagmiDisconnect;
  
  try {
    wagmiAccount = useAccount();
    wagmiConnect = useConnect();
    wagmiDisconnect = useDisconnect();
  } catch (error) {
    // Wagmi hooks not available, use fallback values
    wagmiAccount = { address: null, isConnected: false };
    wagmiConnect = { connect: () => {}, connectors: [] };
    wagmiDisconnect = { disconnect: () => {} };
  }

  useEffect(() => {
    // If Privy doesn't initialize within 10 seconds, fall back to Wagmi
    const timer = setTimeout(() => {
      if (!privy.ready) {
        console.log('Privy failed to initialize, falling back to Wagmi');
        setUseWagmiFallback(true);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [privy.ready]);

  // Check if we're on the correct network
  useEffect(() => {
    if (useWagmiFallback && wagmiAccount.isConnected && chainId !== flareTestnet.id) {
      console.log(`Wrong network detected. Current: ${chainId}, Expected: ${flareTestnet.id}`);
      // Automatically switch to Flare Testnet
      switchToFlareTestnet().catch(console.error);
    }
  }, [useWagmiFallback, wagmiAccount.isConnected, chainId]);

  const isConnected = useWagmiFallback ? wagmiAccount.isConnected : privy.authenticated;
  const address = useWagmiFallback ? wagmiAccount.address : privy.user?.wallet?.address;

  const connect = async () => {
    if (useWagmiFallback) {
      if (wagmiConnect.connectors.length > 0) {
        await wagmiConnect.connect({ connector: wagmiConnect.connectors[0] });
        // Switch to Flare Testnet after connecting
        try {
          await switchToFlareTestnet();
        } catch (error) {
          console.error('Failed to switch to Flare Testnet:', error);
        }
      }
    } else {
      await privy.login();
    }
  };

  const disconnect = () => {
    if (useWagmiFallback) {
      wagmiDisconnect.disconnect();
    } else {
      privy.logout();
    }
  };

  return {
    isConnected,
    address,
    connect,
    disconnect,
    ready: privy.ready || useWagmiFallback,
    useWagmiFallback,
    chainId,
    isCorrectNetwork: chainId === flareTestnet.id,
  };
}
