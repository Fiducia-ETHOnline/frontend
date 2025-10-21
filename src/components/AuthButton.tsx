import React, {useState, useEffect, useMemo} from "react";
import {ConnectKitButton} from "connectkit";
import {useAccount, useSignMessage, useBalance, useWriteContract, useReadContract, useSendTransaction} from "wagmi";
import axios from "axios";
import {motion, AnimatePresence} from "framer-motion";
import {User, Shield, Loader2, Wallet, ShoppingCart, CheckCircle2, ArrowRight} from "lucide-react";
import {useAuthStore} from "@/store/authStore";
import {erc20Abi, parseEther} from "viem";

const API_BASE_URL = "https://fiduciademo.123a.club/api";

type ContractAddresses = {
    a3a: `0x${string}` | undefined;
    pyusd: `0x${string}` | undefined;
    orderContract: `0x${string}` | undefined;
};

const MaxUint256: bigint = 2n ** 256n - 1n;

interface BuyA3AModalProps {
    onClose: () => void;
    pyusdBalance: string | undefined;
}

const BuyA3AModal: React.FC<BuyA3AModalProps> = ({onClose, pyusdBalance}) => {
    const [pyusdAmount, setPyusdAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const {token} = useAuthStore();
    const {sendTransactionAsync} = useSendTransaction();

    const a3aAmount = useMemo(() => {
        const num = parseFloat(pyusdAmount);
        if (isNaN(num) || num < 0) {
            return {value: "Invalid Input", error: true};
        }
        return {value: (num * 100).toFixed(2), error: false};
    }, [pyusdAmount]);

    const handleBuy = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/token/buya3a`,
                {pyusd: parseFloat(pyusdAmount)},
                {headers: {Authorization: `Bearer ${token}`}}
            );

            console.log("Response from backend:", response.data);

            const {status, transaction} = response.data;
            if (status !== 'ok' || !transaction) {
                throw new Error(status || "Error with backend.");
            }

            const txData = JSON.parse(transaction);

            await sendTransactionAsync({
                to: txData.to as `0x${string}`,
                data: txData.data as `0x${string}`,
                value: BigInt(txData.value || 0),
            });

            setIsSuccess(true);
            setTimeout(() => onClose(), 1000);

        } catch (err: any) {
            console.error("Failed to purchase A3A:", err);
            setError(err.shortMessage || err.response?.data?.status || "Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{scale: 0.9, opacity: 0, y: 0}}
                animate={{scale: 1, opacity: 1, y: 0}}
                exit={{scale: 0.9, opacity: 0, y: 0}}
                onClick={(e) => e.stopPropagation()}
                className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full shadow-2xl"
            >
                {isSuccess ? (
                    <div className="text-center py-8">
                        <motion.div initial={{scale: 0}} animate={{scale: 1}}
                                    transition={{type: 'spring', stiffness: 200, damping: 10}}>
                            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">Purchase succeed!</h2>
                        <p className="text-white/60 mt-2">Your A3A token balance is updated.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2">Buy A3A token</h2>
                        <p className="text-white/60 text-sm mb-6">
                            Use your PYUSD to purchase A3A token <br /> (1 PYUSD = 100 A3A)
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs text-white/50 block mb-2">Input PYUSD amount below</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={pyusdAmount}
                                        onChange={(e) => setPyusdAmount(e.target.value)}
                                        placeholder="e.g. 10.5"
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                    <ArrowRight className="text-white/30"/>
                                    <div
                                        className={`w-full p-3 bg-black/20 border border-transparent rounded-lg text-right ${a3aAmount.error ? 'text-red-400' : 'text-green-300'}`}>
                                        {a3aAmount.value} A3A
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 mt-1">Your balance: {pyusdBalance ? `${parseFloat(pyusdBalance).toFixed(2)} PYUSD` : '...'} </p>
                            </div>

                            <motion.button
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                onClick={handleBuy}
                                disabled={isLoading || a3aAmount.error || !pyusdAmount}
                                className="w-full p-4 bg-green-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin"/>
                                        <span>Please confirm the transaction...</span>
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </motion.button>
                        </div>

                        {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

const AuthButton: React.FC = () => {
    const {address, isConnected, status} = useAccount();
    const {signMessageAsync} = useSignMessage();
    const {token, role, setAuth, clearAuth} = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);

    const {writeContractAsync} = useWriteContract();

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
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                const pyusdResponse = await axios.get(
                    `${API_BASE_URL}/contract/pyusd`,
                    {headers: {Authorization: `Bearer ${token}`}}
                );
                const orderContractResponse = await axios.get(
                    `${API_BASE_URL}/contract/order`,
                    {headers: {Authorization: `Bearer ${token}`}}
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

    const {data: a3aBalance, isLoading: isA3aLoading} = useBalance({
        address: address,
        token: contractAddrs.a3a,
    });

    const {data: pyusdBalance, isLoading: isPyusdLoading} = useBalance({
        address: address,
        token: contractAddrs.pyusd,
    });

    const isBalanceLoading = isA3aLoading || isPyusdLoading;

    const {data: pyusdAllowance} = useReadContract({
        address: contractAddrs.pyusd,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address!, contractAddrs.orderContract!],
    });

    const {data: a3aAllowance} = useReadContract({
        address: contractAddrs.a3a,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address!, contractAddrs.orderContract!],
    });

    useEffect(() => {
        if (pyusdAllowance !== undefined && a3aAllowance !== undefined) {
            const sufficientAllowance = parseEther('1000000');
            if (pyusdAllowance >= sufficientAllowance && a3aAllowance >= sufficientAllowance) {
                setNeedsApproval(false);
            } else {
                setNeedsApproval(true);
            }
        }
    }, [pyusdAllowance, a3aAllowance]);

    useEffect(() => {
        // trigger logout if the status is disconnected
        if (token && status === 'disconnected') {
            handleLogout();
        }
    }, [status, token]);

    const handleApproveAll = async () => {
        if (!contractAddrs.orderContract || !contractAddrs.pyusd || !contractAddrs.a3a) {
            setError("Contract addresses are not loaded yet. Cannot approve.");
            return;
        }

        setIsApproving(true);
        setError(null);

        try {
            console.log(`Approving PYUSD for spender: ${contractAddrs.orderContract}`);
            await writeContractAsync({
                address: contractAddrs.pyusd,
                abi: erc20Abi,
                functionName: 'approve',
                args: [contractAddrs.orderContract, MaxUint256],
            });
            console.log("PYUSD Approved successfully!");

            console.log(`Approving A3A for spender: ${contractAddrs.orderContract}`);
            await writeContractAsync({
                address: contractAddrs.a3a,
                abi: erc20Abi,
                functionName: 'approve',
                args: [contractAddrs.orderContract, MaxUint256],
            });
            console.log("A3A Approved successfully!");

        } catch (err: any) {
            console.error("Approval failed:", err);
            setError(err.shortMessage || "User rejected the transaction or an error occurred.");
        } finally {
            setIsApproving(false);
        }
    };

    useEffect(() => {
        console.log("balance", a3aBalance, pyusdBalance)
    }, [a3aBalance, pyusdBalance, isBalanceLoading]);

    useEffect(() => {
        const checkSession = async () => {
            const storedToken = localStorage.getItem("fiducia_jwt");
            const storedRole = localStorage.getItem("fiducia_role") as
                | "customer"
                | "merchant"
                | null;

            if (storedToken && address) {
                try {
                    setAuth(storedToken, address, storedRole);
                    console.log("Session restored for:", address);
                } catch (err) {
                    console.error("Session validation failed", err);
                    localStorage.removeItem("fiducia_jwt");
                    localStorage.removeItem("fiducia_role");
                    clearAuth();
                }
            }
        };
        checkSession();
    }, [address, setAuth, clearAuth]);

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
                    params: {address},
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
            const {token, user} = loginResponse.data;

            // Step 5: Check if role needs to be set
            if (!user.role) {
                setAuth(token, user.address, null);
                localStorage.setItem("fiducia_jwt", token);
                setShowRoleSelector(true);
            } else {
                setAuth(token, user.address, user.role);
                localStorage.setItem("fiducia_jwt", token);
                localStorage.setItem("fiducia_role", user.role);
                console.log("Login successful!", user);
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
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            console.log("Setting role to:", selectedRole);
            const response = await axios.post(
                `${API_BASE_URL}/user/role`,
                {role: selectedRole === "customer" ? "consumer" : "merchant"},
                {headers: {Authorization: `Bearer ${token}`}}
            );

            console.log("Role set response:", response.data);
            const {token: newToken, user} = response.data;
            setAuth(newToken, user.address, user.role);
            localStorage.setItem("fiducia_jwt", newToken);
            localStorage.setItem("fiducia_role", user.role);
            setShowRoleSelector(false);
            console.log("Role set successfully:", user);
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

    const handleLogout = () => {
        clearAuth();
        localStorage.removeItem("fiducia_jwt");
        localStorage.removeItem("fiducia_role");
        setShowRoleSelector(false);
        console.log("Logged out.");
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <AnimatePresence>
                    {token && role && needsApproval && (
                        <motion.button
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            onClick={handleApproveAll}
                            disabled={isApproving || !contractAddrs.orderContract}
                            className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:border-green-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title="Approve tokens for the Order Contract"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                                    <span>Approving...</span>
                                </>
                            ) : (
                                <>
                                    <span>Approve Tokens</span>
                                </>
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {token && role && (
                        <motion.button
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            onClick={() => setShowBuyModal(true)}
                            className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-purple-800/50 text-white/90 text-sm font-medium transition-all hover:border-purple-700/60 flex items-center gap-2"
                            title="Buy A3A token with PYUSD"
                        >
                            <ShoppingCart className="w-3.5 h-3.5"/>
                            <span>Buy A3A</span>
                        </motion.button>
                    )}
                </AnimatePresence>
                {/* Sign In Button (when connected but not authenticated) */}
                <AnimatePresence>
                    {isConnected && !token && (
                        <motion.button
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            onClick={handleLogin}
                            disabled={loading}
                            className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:border-green-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin"/>
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
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={handleLogout}
                            className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:bg-red-500/10 hover:border-red-500/50"
                            title="Logout"
                        >
                            Sign Out
                        </motion.button>
                    )}
                </AnimatePresence>

                <ConnectKitButton/>

                <AnimatePresence>
                    {token && (contractAddrs.a3a || contractAddrs.pyusd) && (
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] border border-green-800/50 text-white/90 text-sm font-medium flex items-center gap-2"
                            title={`Balances for ${address}`}
                        >
                            {isBalanceLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                            ) : (
                                <>
                                    <Wallet className="w-3.5 h-3.5 text-green-400/70 flex-shrink-0"/>
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
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !loading && setShowRoleSelector(false)}
                    >
                        <motion.div
                            initial={{scale: 0.9, opacity: 0, y: 20}}
                            animate={{scale: 1, opacity: 1, y: 0}}
                            exit={{scale: 0.9, opacity: 0, y: 20}}
                            onClick={(e) => e.stopPropagation()}
                            className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Choose Your Role
                            </h2>
                            <p className="text-white/60 text-sm mb-6">
                                Select how you want to use Fiducia
                            </p>

                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{scale: 1.02}}
                                    whileTap={{scale: 0.98}}
                                    onClick={() => handleSetRole("customer")}
                                    disabled={loading}
                                    className="w-full p-4 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] hover:bg-[rgba(17,25,20,0.60)] border border-green-800/50 hover:border-green-700/70 rounded-2xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center group-hover:border-green-500/50 transition-all">
                                            <User className="w-6 h-6 text-green-400"/>
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
                                    whileHover={{scale: 1.02}}
                                    whileTap={{scale: 0.98}}
                                    onClick={() => handleSetRole("merchant")}
                                    disabled={loading}
                                    className="w-full p-4 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] hover:bg-[rgba(17,25,20,0.60)] border border-green-800/50 hover:border-green-700/70 rounded-2xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/50 transition-all">
                                            <Shield className="w-6 h-6 text-emerald-400"/>
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

                            {loading && (
                                <div className="mt-6 flex items-center justify-center gap-2 text-white/60">
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    <span className="text-sm">Setting role...</span>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{opacity: 0, y: -20, x: "-50%"}}
                        animate={{opacity: 1, y: 0, x: "-50%"}}
                        exit={{opacity: 0, y: -20, x: "-50%"}}
                        className="fixed top-6 left-1/2 backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.95)] border border-red-500/50 rounded-2xl px-6 py-4 max-w-md z-50 shadow-2xl"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                {showBuyModal && <BuyA3AModal onClose={() => setShowBuyModal(false)} pyusdBalance={pyusdBalance?.formatted} />}
            </AnimatePresence>
        </>
    );
};

export default AuthButton;
