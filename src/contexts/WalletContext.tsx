import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { bsc, bscTestnet } from 'wagmi/chains';

// Import RainbowKit CSS
import '@rainbow-me/rainbowkit/styles.css';

interface WalletContextProviderProps {
  children: React.ReactNode;
}

// Create a query client for React Query
const queryClient = new QueryClient();

// Get WalletConnect project ID from environment
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// Configure connectors manually to avoid compatibility issues
const wallets = [
  metaMaskWallet,
  injectedWallet,
];

// Only add WalletConnect if we have a valid project ID
if (walletConnectProjectId && walletConnectProjectId.trim() !== '' && walletConnectProjectId !== 'your-project-id-here') {
  wallets.push(walletConnectWallet);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets,
    },
  ],
  {
    appName: 'Four.Fun - Digital Signature Platform',
    projectId: walletConnectProjectId || undefined,
  }
);

// Configure wagmi with BNB Chain networks using manual config
const config = createConfig({
  connectors,
  chains: [bsc, bscTestnet],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: false,
});

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};