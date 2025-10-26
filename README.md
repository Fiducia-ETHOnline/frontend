# Fiducia Agents - Frontend

This repository contains the frontend application for the Fiducia Agents platform, allowing users to interact with AI agents for decentralized commerce using Web3 technologies.

## Overview

The Fiducia Frontend provides a user-friendly interface for:

- Connecting Web3 wallets (via ConnectKit).

- Authenticating with the backend using a Sign-In-with-Ethereum-like flow.

- Interacting with an AI chatbot to place orders or perform other actions.

- Approving token spending caps for smart contracts.Confirming and paying for orders by signing transactions provided by the backend agent.

- Viewing token balances and transaction statuses, enhanced with Blockscout integration.

## Tech Stack

This project is built with a modern frontend stack:

- Framework: React

- Build Tool: Vite

- Web3 Integration:

  - wagmi: Core hooks for interacting with Ethereum (connecting wallets, reading/writing contracts, signing messages, sending transactions).

  - viem: Underlying library used by wagmi for blockchain interactions.

  - connectkit: UI component library for easy wallet connection.

- State Management: Zustand

- API Communication: Axios

- UI & Styling:

  - Tailwind CSS: Utility-first CSS framework.

  - Framer Motion: Animations and transitions.

  - Lucide React: Icon library.

  - react-markdown: Rendering markdown content from the chatbot.

- Blockchain Interaction Feedback: Blockscout SDK (for fetching and displaying transaction details/status).

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)

- pnpm (or npm/yarn) package manager

- A configured Web3 wallet like MetaMask connected to the appropriate network (e.g., Sepolia testnet or a local Anvil instance proxied via Nginx).

### Installation

Clone the repository:

```
git clone <your-frontend-repo-url>
cd <your-frontend-repo-directory>
```

Install dependencies:

```
pnpm install
# or npm install / yarn install
```

Set up environment variables:

Create a .env file in the project root and add the necessary variables. Refer to .env.example for the required keys (e.g., VITE_WALLETCONNECT_PROJECT_ID, VITE_API_BASE_URL, VITE_SEPOLIA_RPC_URL).VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

Running the Development Server

```
pnpm dev
# or npm run dev / yarn dev
```

This will start the Vite development server, typically available at http://localhost:5173.

## Key Features

- Wallet Connection: Smooth integration with various wallets via ConnectKit.

- Secure Authentication: Signature-based login linked to the user's wallet address.

- AI Chat Interface: Conversational UI for interacting with Consumer/Merchant agents.

- Token Approval Flow: Standard ERC20 approve mechanism for granting spending permission to the OrderContract.

- Order Confirmation & Payment: Securely sign and send pre-built transaction data received from the backend agent.

- Real-time Balance Display: Uses wagmi to show user balances for relevant tokens (PYUSD, A3A).

- On-Chain Status Tracking: Leverages the Blockscout SDK to provide users with transparent, real-time feedback on their transaction status directly from the blockchain explorer.
