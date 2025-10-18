import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const anvilChain = defineChain({
    id: 31337,
    name: 'Fiducia Localnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://fiduciademo.123a.club/rpc'],
        },
    },
    // blockExplorers: {
    //   default: { name: 'Etherscan', url: 'https://etherscan.io' },
    // },
    testnet: true,
});

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const config = createConfig(
    getDefaultConfig({
        chains: [anvilChain],

        transports: {
            [anvilChain.id]: http('https://fiduciademo.123a.club/rpc'),
        },

        walletConnectProjectId,
        appName: 'Fiducia',
        appDescription: 'A decentralized protocol for AI agent communication.',
        appUrl: 'https://fiduciademo.netlify.app/',
        appIcon: '',
    }),
);

const queryClient = new QueryClient();

type Web3ProviderProps = {
    children: React.ReactNode;
};

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider theme="midnight" mode="dark">{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
