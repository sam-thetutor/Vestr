'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { config, privyConfig } from '@/lib/privy';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [mounted, setMounted] = useState(false);
  const [usePrivy, setUsePrivy] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Check if Privy app ID is valid (not the demo one)
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmh3tjbtd00s3k00ca0hafguu';
    if (privyAppId === 'cmh3tjbtd00s3k00ca0hafguu') {
      console.log('Using demo Privy app ID, may not work properly');
    }
  }, []);

  // Prevent hydration mismatch by only rendering on client
  if (!mounted) {
    return <div>{children}</div>;
  }

  // If Privy fails to initialize, fall back to Wagmi only
  if (!usePrivy) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyConfig.appId}
      config={privyConfig.config}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
