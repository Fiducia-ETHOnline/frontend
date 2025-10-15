import React, {useEffect} from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

const config = createConfig(
    getDefaultConfig({
        chains: [mainnet],
        transports: {
            [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
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
    useEffect(() => {
        console.log(alchemyApiKey, walletConnectProjectId);
    }, []);
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider theme="midnight" mode="dark">{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};