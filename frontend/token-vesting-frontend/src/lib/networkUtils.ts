import { flareTestnet } from 'wagmi/chains';

export async function switchToFlareTestnet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }

  try {
    // Try to switch to Flare Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${flareTestnet.id.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If the network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${flareTestnet.id.toString(16)}`,
              chainName: flareTestnet.name,
              nativeCurrency: {
                name: flareTestnet.nativeCurrency.name,
                symbol: flareTestnet.nativeCurrency.symbol,
                decimals: flareTestnet.nativeCurrency.decimals,
              },
              rpcUrls: flareTestnet.rpcUrls.default.http,
              blockExplorerUrls: [flareTestnet.blockExplorers.default.url],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add Flare Testnet:', addError);
        throw addError;
      }
    } else {
      console.error('Failed to switch to Flare Testnet:', switchError);
      throw switchError;
    }
  }
}
