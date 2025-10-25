import React, { useState, useEffect, useMemo } from "react";
import { ConnectKitButton } from "connectkit";
import {
  useAccount,
  useSignMessage,
  useBalance,
  useWriteContract,
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useDisconnect,
} from "wagmi";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useNotification } from "@blockscout/app-sdk";
import {
  User,
  Shield,
  Loader2,
  Wallet,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { erc20Abi, parseEther } from "viem";
import MerchantNFTAbi from "@/abi/MerchantNFT.json";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://fiduciademo.123a.club/api";
const MERCHANT_NFT_ADDRESS =
  "0xe2d8c380db7d124D03DACcA07645Fea659De9738" as const;

type ContractAddresses = {
  a3a: `0x${string}` | undefined;
  pyusd: `0x${string}` | undefined;
  orderContract: `0x${string}` | undefined;
};

const MaxUint256: bigint = 2n ** 256n - 1n;

interface BuyA3AModalProps {
  onClose: () => void;
  pyusdBalance: string | undefined;
  pyusdAllowance: bigint | undefined;
  orderContractAddress: `0x${string}` | undefined;
  pyusdAddress: `0x${string}` | undefined;
}

const BuyA3AModal: React.FC<BuyA3AModalProps> = ({
  onClose,
  pyusdBalance,
  pyusdAllowance,
  orderContractAddress,
  pyusdAddress,
}) => {
  const [pyusdAmount, setPyusdAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<
    `0x${string}` | undefined
  >(undefined);

  const { token } = useAuthStore();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { openTxToast } = useNotification();
  const { chainId } = useAccount();
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // When approval is confirmed, proceed with purchase
  useEffect(() => {
    if (isApprovalConfirmed && approvalTxHash) {
      console.log("Approval confirmed! Proceeding with purchase...");
      setApprovalTxHash(undefined);
      handlePurchase();
    }
  }, [isApprovalConfirmed, approvalTxHash]);

  const a3aAmount = useMemo(() => {
    const num = parseFloat(pyusdAmount);
    if (isNaN(num) || num < 0) {
      return { value: "Invalid Input", error: true };
    }
    return { value: (num * 100).toFixed(2), error: false };
  }, [pyusdAmount]);

  const hasInsufficientBalance = useMemo(() => {
    const amount = parseFloat(pyusdAmount);
    const balance = parseFloat(pyusdBalance || "0");
    return !isNaN(amount) && amount > 0 && amount > balance;
  }, [pyusdAmount, pyusdBalance]);

  const needsApproval = useMemo(() => {
    if (!pyusdAllowance || !orderContractAddress) return true;
    const amount = parseFloat(pyusdAmount);
    if (isNaN(amount) || amount <= 0) return false;
    const requiredAmount = parseEther(pyusdAmount);
    return pyusdAllowance < requiredAmount;
  }, [pyusdAllowance, orderContractAddress, pyusdAmount]);

  const handleApprovePYUSD = async () => {
    if (!orderContractAddress || !pyusdAddress) {
      setError("Contract addresses not loaded. Please try again.");
      return;
    }

    if (!chainId) {
      setError(
        "Chain ID not detected. Please ensure your wallet is connected."
      );
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      console.log(`Approving PYUSD for spender: ${orderContractAddress}`);
      const txHash = await writeContractAsync({
        address: pyusdAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [orderContractAddress, MaxUint256],
      });
      console.log(
        "PYUSD Approved! Tx:",
        txHash,
        "- Waiting for confirmation..."
      );
      openTxToast(chainId.toString(), txHash);

      setApprovalTxHash(txHash);
    } catch (err: any) {
      console.error("Approval failed:", err);
      setError(err.shortMessage || "Approval failed. Please try again.");
      setIsApproving(false);
    }
  };

  const handlePurchase = async () => {
    setError(null);
    setIsApproving(false);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/token/buya3a`,
        { pyusd: parseFloat(pyusdAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Response from backend:", response.data);

      const { status, transaction } = response.data;
      if (status !== "ok" || !transaction) {
        throw new Error(status || "Error with backend.");
      }

      const txData = JSON.parse(transaction);

      const txHash = await sendTransactionAsync({
        to: txData.to as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.value || 0),
      });

      console.log("A3A purchase transaction successful! Tx:", txHash);

      if (chainId) {
        openTxToast(chainId.toString(), txHash);
      }

      setIsSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      console.error("Failed to purchase A3A:", err);
      setError(
        err.shortMessage || err.response?.data?.status || "Transaction failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async () => {
    if (hasInsufficientBalance) {
      setError("Insufficient PYUSD balance. Please get PYUSD from the faucet.");
      return;
    }

    if (needsApproval) {
      await handleApprovePYUSD();
    } else {
      await handlePurchase();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 0 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full shadow-2xl"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Purchase succeed!</h2>
            <p className="text-white/60 mt-2">
              Your A3A token balance is updated.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Buy A3A token
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Use your PYUSD to purchase A3A token <br /> (1 PYUSD = 100 A3A)
            </p>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs text-white/50 block mb-2">
                  Input PYUSD amount below
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={pyusdAmount}
                    onChange={(e) => setPyusdAmount(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                  <ArrowRight className="text-white/30" />
                  <div
                    className={`w-full p-3 bg-black/20 border border-transparent rounded-lg text-right ${
                      a3aAmount.error ? "text-red-400" : "text-green-300"
                    }`}
                  >
                    {a3aAmount.value} A3A
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Your balance:{" "}
                  {pyusdBalance
                    ? `${parseFloat(pyusdBalance).toFixed(2)} PYUSD`
                    : "..."}{" "}
                </p>
              </div>

              {hasInsufficientBalance && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <p className="text-yellow-400 text-sm mb-2">
                    Insufficient PYUSD balance
                  </p>
                  <motion.a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia/pyusd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-300 text-xs hover:bg-yellow-500/30 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Get PYUSD from Faucet</span>
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuy}
                disabled={
                  isLoading ||
                  isApproving ||
                  a3aAmount.error ||
                  !pyusdAmount ||
                  parseFloat(pyusdAmount) <= 0 ||
                  hasInsufficientBalance ||
                  !!approvalTxHash
                }
                className="w-full p-4 bg-green-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {approvalTxHash && !isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Waiting for confirmation...</span>
                  </>
                ) : isApproving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Approving PYUSD...</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Purchasing A3A...</span>
                  </>
                ) : needsApproval && parseFloat(pyusdAmount) > 0 ? (
                  "Approve & Buy A3A"
                ) : (
                  "Buy A3A"
                )}
              </motion.button>
            </div>

            {error && (
              <p className="text-red-400 text-center text-sm mt-4">{error}</p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

interface MintNFTModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MintNFTModal: React.FC<MintNFTModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { openTxToast } = useNotification();
  const { chainId } = useAccount();

  const handleMintNFT = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: MERCHANT_NFT_ADDRESS,
        abi: MerchantNFTAbi,
        functionName: "applyForMerchantNft",
      });

      console.log("Merchant NFT minted successfully! Tx:", hash);
      setTxHash(hash);

      if (chainId) {
        openTxToast(chainId.toString(), hash);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Failed to mint Merchant NFT:", err);
      setError(
        err.shortMessage ||
          err.message ||
          "Transaction failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute top-6 right-6 z-[60]">
        <ConnectKitButton />
      </div>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 0 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full shadow-2xl"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Application Submitted!
            </h2>
            <p className="text-white/60 mt-2">
              Your merchant NFT application has been submitted successfully.
            </p>
            {txHash && chainId && (
              <motion.a
                href={`https://eth-sepolia.blockscout.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm hover:bg-green-500/20 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>View Transaction</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Become a Merchant
                </h2>
                <p className="text-white/60 text-sm">Apply for Merchant NFT</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/80 text-sm leading-relaxed">
                  To become a merchant on Fiducia, you need to mint a Merchant
                  NFT. This NFT grants you access to create and manage your
                  restaurant, accept orders, and receive payments.
                </p>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <h3 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Benefits</span>
                </h3>
                <ul className="text-white/70 text-sm space-y-1 ml-6 list-disc">
                  <li>Create and manage your restaurant</li>
                  <li>List menu items and accept orders</li>
                  <li>Receive crypto payments instantly</li>
                  <li>Access merchant dashboard</li>
                </ul>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMintNFT}
              disabled={isLoading}
              className="w-full p-4 bg-green-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Minting NFT...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Mint Merchant NFT</span>
                </>
              )}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const AuthButton: React.FC = () => {
  const { address, isConnected, status, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { token, role, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showMintNFTModal, setShowMintNFTModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<
    "customer" | "merchant" | null
  >(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isApprovingA3A, setIsApprovingA3A] = useState(false);

  const navigate = useNavigate();
  const { writeContractAsync } = useWriteContract();
  const { openTxToast } = useNotification();

  const [contractAddrs, setContractAddrs] = useState<ContractAddresses>({
    a3a: undefined,
    pyusd: undefined,
    orderContract: undefined,
  });

  useEffect(() => {
    const fetchContractAddresses = async () => {
      if (!token) return;

      try {
        const a3aResponse = await axios.get(
          `${API_BASE_URL}/contract/a3atoken`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const pyusdResponse = await axios.get(
          `${API_BASE_URL}/contract/pyusd`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const orderContractResponse = await axios.get(
          `${API_BASE_URL}/contract/order`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const a3aAddr = a3aResponse.data as `0x${string}`;
        const pyusdAddr = pyusdResponse.data as `0x${string}`;
        const orderContractAddr = orderContractResponse.data as `0x${string}`;

        // console.log("Fetched A3A address:", a3aAddr);
        // console.log("Fetched PYUSD address:", pyusdAddr);
        // console.log("Fetched OrderContract (Spender) address:", orderContractAddr);

        setContractAddrs({
          a3a: a3aAddr,
          pyusd: pyusdAddr,
          orderContract: orderContractAddr,
        });
      } catch (err) {
        console.error("Failed to fetch contract addresses:", err);
      }
    };

    fetchContractAddresses();
  }, [token]);

  const { data: a3aBalance, isLoading: isA3aLoading } = useBalance({
    address: address,
    token: contractAddrs.a3a,
  });

  const { data: pyusdBalance, isLoading: isPyusdLoading } = useBalance({
    address: address,
    token: contractAddrs.pyusd,
  });

  const isBalanceLoading = isA3aLoading || isPyusdLoading;

  const { data: pyusdAllowance } = useReadContract({
    address: contractAddrs.pyusd,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, contractAddrs.orderContract!],
  });

  const { data: a3aAllowance } = useReadContract({
    address: contractAddrs.a3a,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, contractAddrs.orderContract!],
  });

  const needsA3AApproval = useMemo(() => {
    if (!a3aAllowance || !contractAddrs.orderContract) return true;
    const sufficientAllowance = parseEther("1000000");
    return a3aAllowance < sufficientAllowance;
  }, [a3aAllowance, contractAddrs.orderContract]);

  const { data: merchantNFTBalance, refetch: refetchMerchantNFT } =
    useReadContract({
      address: MERCHANT_NFT_ADDRESS,
      abi: MerchantNFTAbi,
      functionName: "balanceOf",
      args: [address!],
      query: {
        enabled: !!address,
      },
    });

  useEffect(() => {
    // trigger logout if the status is disconnected
    if (token && status === "disconnected") {
      handleLogout();
    }
  }, [status, token]);

  useEffect(() => {
    console.log("balance", a3aBalance, pyusdBalance);
  }, [a3aBalance, pyusdBalance, isBalanceLoading]);

  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem("fiducia_jwt");
      const storedRole = localStorage.getItem("fiducia_role") as
        | "customer"
        | "merchant"
        | null;
      const storedMerchantId = localStorage.getItem("fiducia_merchant_id");

      // Only restore session if we have a token, an address, and we're not already authenticated
      if (storedToken && address && !token) {
        try {
          setAuth(storedToken, address, storedRole, storedMerchantId);
          console.log("Session restored for:", address);
        } catch (err) {
          console.error("Session validation failed", err);
          localStorage.removeItem("fiducia_jwt");
          localStorage.removeItem("fiducia_role");
          localStorage.removeItem("fiducia_merchant_id");
          clearAuth();
        }
      } else if (
        isConnected &&
        address &&
        !storedToken &&
        !token &&
        !showRoleSelector
      ) {
        setShowRoleSelector(true);
      }
    };
    checkSession();
  }, [address, token, isConnected, showRoleSelector, setAuth, clearAuth]);

  const extractNonce = (message: string): string => {
    // Extract nonce from message format: "Sign this message to log in to Fiducia. Domain:a2a.com Nonce: f3139d1717365ae8"
    const nonceMatch = message.match(/Nonce:\s*([a-f0-9]+)/i);
    if (nonceMatch && nonceMatch[1]) {
      return nonceMatch[1];
    }
    throw new Error("Could not extract nonce from challenge message");
  };

  const handleLogin = async () => {
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get challenge message
      console.log("Step 1: Requesting challenge for address:", address);
      const challengeResponse = await axios.get(
        `${API_BASE_URL}/auth/challenge`,
        {
          params: { address },
        }
      );
      const fullMessage = challengeResponse.data.message;
      console.log("Received full challenge message:", fullMessage);

      // Step 2: Extract only the nonce
      const nonce = extractNonce(fullMessage);
      console.log("Extracted nonce:", nonce);

      // Step 3: Sign only the nonce
      console.log("Step 3: Signing nonce...");
      const signature = await signMessageAsync({
        message: nonce,
      });
      console.log("Generated signature:", signature);
      console.log("Signature length:", signature.length);

      // Step 4: Login with signature
      console.log("Step 4: Sending login request with:", {
        address,
        signature,
      });

      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        address,
        signature,
      });

      console.log("Login response:", loginResponse.data);
      const { token, user } = loginResponse.data;

      // Step 5: Check if role needs to be set
      if (!user.role) {
        setAuth(token, user.address, null, user.merchant_id || null);
        localStorage.setItem("fiducia_jwt", token);
        if (user.merchant_id) {
          localStorage.setItem("fiducia_merchant_id", user.merchant_id);
        }

        // If we have a pending role (from role selection), complete the setup
        if (pendingRole) {
          await completeRoleSetup(pendingRole);
        } else {
          setIsReturningUser(false);
          setShowRoleSelector(true);
        }
      } else {
        setAuth(token, user.address, user.role, user.merchant_id || null);
        localStorage.setItem("fiducia_jwt", token);
        localStorage.setItem("fiducia_role", user.role);
        if (user.merchant_id) {
          localStorage.setItem("fiducia_merchant_id", user.merchant_id);
        }
        setPendingRole(null);
        console.log("Login successful!", user);

        setShowRoleSelector(false);
        navigate("/home");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Login failed. Please try again.";
      setError(errorMsg);
      localStorage.removeItem("fiducia_jwt");
      localStorage.removeItem("fiducia_role");
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (selectedRole: "customer" | "merchant") => {
    setPendingRole(selectedRole);

    const hasExistingToken = !!localStorage.getItem("fiducia_jwt");
    setIsReturningUser(hasExistingToken);

    setLoading(true);

    if (selectedRole === "customer") {
      if (!address) {
        setError("Please connect your wallet first.");
        setLoading(false);
        return;
      }
      await handleLogin();
    } else {
      const hasMerchantNFT =
        merchantNFTBalance && Number(merchantNFTBalance) > 0;

      if (hasMerchantNFT) {
        console.log("User already has Merchant NFT, proceeding to sign-in");
        await handleLogin();
      } else {
        console.log("User doesn't have Merchant NFT, showing mint modal");
        setLoading(false);
        setShowRoleSelector(false);
        setShowMintNFTModal(true);
      }
    }
  };

  const handleNFTMintSuccess = async () => {
    setShowMintNFTModal(false);
    await refetchMerchantNFT();

    if (address) {
      await handleLogin();
    }
  };

  const completeRoleSetup = async (selectedRole: "customer" | "merchant") => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Setting role to:", selectedRole);
      const response = await axios.post(
        `${API_BASE_URL}/user/role`,
        { role: selectedRole === "customer" ? "consumer" : "merchant" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Role set response:", response.data);
      const { token: newToken, user } = response.data;
      setAuth(newToken, user.address, user.role, user.merchant_id || null);
      localStorage.setItem("fiducia_jwt", newToken);
      localStorage.setItem("fiducia_role", user.role);
      if (user.merchant_id) {
        localStorage.setItem("fiducia_merchant_id", user.merchant_id);
      }
      setPendingRole(null);
      console.log("Role set successfully:", user);

      setShowRoleSelector(false);
      navigate("/home");
    } catch (err: any) {
      console.error("Failed to set role:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to set role. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveA3A = async () => {
    if (!contractAddrs.orderContract || !contractAddrs.a3a) {
      setError("Contract addresses are not loaded yet. Cannot approve.");
      return;
    }

    if (!chainId) {
      setError(
        "Chain ID not detected. Please ensure your wallet is connected."
      );
      return;
    }

    setIsApprovingA3A(true);
    setError(null);

    try {
      console.log(`Approving A3A for spender: ${contractAddrs.orderContract}`);
      const a3aTxHash = await writeContractAsync({
        address: contractAddrs.a3a,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddrs.orderContract, MaxUint256],
      });
      console.log("A3A Approved successfully! Tx:", a3aTxHash);
      openTxToast(chainId.toString(), a3aTxHash);
    } catch (err: any) {
      console.error("A3A Approval failed:", err);
      setError(
        err.shortMessage ||
          "User rejected the transaction or an error occurred."
      );
    } finally {
      setIsApprovingA3A(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("fiducia_jwt");
    localStorage.removeItem("fiducia_role");
    localStorage.removeItem("fiducia_merchant_id");
    setShowRoleSelector(false);
    disconnect();
    console.log("Logged out and wallet disconnected.");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {token && role && needsA3AApproval && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleApproveA3A}
              disabled={isApprovingA3A || !contractAddrs.orderContract}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:border-green-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Approve A3A tokens for the Order Contract"
            >
              {isApprovingA3A ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <span>Approve A3A</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {token && role && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setShowBuyModal(true)}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-purple-800/50 text-white/90 text-sm font-medium transition-all hover:border-purple-700/60 flex items-center gap-2"
              title="Buy A3A token with PYUSD"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy A3A</span>
            </motion.button>
          )}
        </AnimatePresence>
        {/* Sign In Button (when connected but not authenticated) */}
        <AnimatePresence>
          {isConnected && !token && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleLogin}
              disabled={loading}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:border-green-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Logout Button (when authenticated) */}
        <AnimatePresence>
          {token && role && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:bg-red-500/10 hover:border-red-500/50"
              title="Logout"
            >
              Sign Out
            </motion.button>
          )}
        </AnimatePresence>

        <ConnectKitButton />

        <AnimatePresence>
          {token && (contractAddrs.a3a || contractAddrs.pyusd) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] border border-green-800/50 text-white/90 text-sm font-medium flex items-center gap-2"
              title={`Balances for ${address}`}
            >
              {isBalanceLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5 text-green-400/70 flex-shrink-0" />
                  <div className="flex items-center gap-2 divide-x divide-gray-600/50">
                    {a3aBalance && (
                      <div className="flex items-baseline gap-1 pr-2">
                        <span>
                          {parseFloat(a3aBalance.formatted).toFixed(2)}
                        </span>
                        <span className="text-white/50 text-xs">
                          {a3aBalance.symbol}
                        </span>
                      </div>
                    )}
                    {pyusdBalance && (
                      <div className="flex items-baseline gap-1 pr-2 last:pr-0">
                        <span>
                          {parseFloat(pyusdBalance.formatted).toFixed(2)}
                        </span>
                        <span className="text-white/50 text-xs">
                          {pyusdBalance.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Role Selector Modal */}
      <AnimatePresence>
        {showRoleSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) {
                setShowRoleSelector(false);
              }
            }}
          >
            <div className="absolute top-6 right-6 z-[60]">
              <ConnectKitButton />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full shadow-2xl"
            >
              {loading ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                  >
                    <Loader2 className="w-16 h-16 text-green-400 mx-auto animate-spin" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isReturningUser
                      ? "Signing you in..."
                      : "Setting up your account..."}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {isReturningUser
                      ? "Welcome back! Please confirm the signature request in your wallet."
                      : "Please confirm the signature request in your wallet to complete setup."}
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Choose Your Role
                  </h2>
                  <p className="text-white/60 text-sm mb-6">
                    Select how you want to use Fiducia
                  </p>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSetRole("customer")}
                      disabled={loading}
                      className="w-full p-4 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] hover:bg-[rgba(17,25,20,0.60)] border border-green-800/50 hover:border-green-700/70 rounded-2xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center group-hover:border-green-500/50 transition-all">
                          <User className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Customer</h3>
                          <p className="text-white/50 text-sm">
                            Browse and order from restaurants
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSetRole("merchant")}
                      disabled={loading}
                      className="w-full p-4 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] hover:bg-[rgba(17,25,20,0.60)] border border-green-800/50 hover:border-green-700/70 rounded-2xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/50 transition-all">
                          <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Merchant</h3>
                          <p className="text-white/50 text-sm">
                            Manage your restaurant and orders
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-6 left-1/2 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] border border-red-500/50 rounded-2xl px-6 py-4 max-w-md z-50 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs">!</span>
              </div>
              <div className="flex-1">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBuyModal && (
          <BuyA3AModal
            onClose={() => setShowBuyModal(false)}
            pyusdBalance={pyusdBalance?.formatted}
            pyusdAllowance={pyusdAllowance}
            orderContractAddress={contractAddrs.orderContract}
            pyusdAddress={contractAddrs.pyusd}
          />
        )}
      </AnimatePresence>

      {/* Mint NFT Modal for Merchants */}
      <AnimatePresence>
        {showMintNFTModal && (
          <MintNFTModal
            onClose={() => {
              setShowMintNFTModal(false);
              setPendingRole(null);
            }}
            onSuccess={handleNFTMintSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AuthButton;
