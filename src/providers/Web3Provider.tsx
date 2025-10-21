import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { TransactionPopupProvider } from "@blockscout/app-sdk";


const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const sepoliaRpcUrl = "https://sepolia.infura.io/v3/80446f4b733d4b27aef859104aa333d1";

const config = createConfig(
    getDefaultConfig({
        chains: [sepolia],

        transports: {
            [sepolia.id]: http(sepoliaRpcUrl),
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
                <ConnectKitProvider theme="midnight" mode="dark">
                    <TransactionPopupProvider>
                        {children}
                </TransactionPopupProvider></ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

