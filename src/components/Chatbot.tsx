import React, {useState, useRef, useCallback, useEffect} from "react";
import axios from "axios";
import {motion, AnimatePresence} from "framer-motion";
import {
    Paperclip,
    Command,
    Send,
    X,
    Loader,
    Image,
    Figma,
    Monitor,
    Sparkles, CheckCircle, ShieldCheck, Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {cn} from "@/lib/utils";
import {useAuthStore} from "@/store/authStore";
import {useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useAccount} from "wagmi";
import {erc20Abi} from "viem";
import { useNotification } from "@blockscout/app-sdk";

const MaxUint256: bigint = 2n ** 256n - 1n;

const API_BASE_URL = "https://fiduciademo.123a.club/api";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
                                   minHeight,
                                   maxHeight,
                               }: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return {textareaRef, adjustHeight};
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface OrderContent {
    cid: string;
    desc: string;
    orderId: string;
    price: string;
    transaction: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    order?: OrderContent;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    initial={{opacity: 0.3}}
                    animate={{
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)",
                    }}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                />
            ))}
        </div>
    );
}

interface OrderConfirmationProps {
    order: OrderContent;
    pyusdAddress: `0x${string}`;
    a3aAddress: `0x${string}`;
    orderContractAddress: `0x${string}`;
    onOrderPaid: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
                                                                 order,
                                                                 pyusdAddress,
                                                                 a3aAddress,
                                                                 orderContractAddress,
                                                                 onOrderPaid
                                                             }) => {

    const [approveState, setApproveState] = useState<'needed' | 'approving' | 'confirming' | 'approved'>('needed');
    const [payState, setPayState] = useState<'idle' | 'paying' | 'confirming' | 'paid'>('idle');
    const [txError, setTxError] = useState<string | null>(null);

    const {data: approveHash, writeContractAsync: approveAsync} = useWriteContract();
    const {data: payHash, sendTransactionAsync} = useSendTransaction();
    const { chainId } = useAccount();
    const { openTxToast } = useNotification();

    const {
        isLoading: isApproveConfirming,
        isSuccess: isApproveSuccess,
        isError: isApproveError,
        error: approveTxError
    } = useWaitForTransactionReceipt({hash: approveHash});

    const {isLoading: isPayConfirming, isSuccess: isPaySuccess, isError: isPayError, error: payTxError} = useWaitForTransactionReceipt({hash: payHash});

    useEffect(() => {
        if (isApproveSuccess) {
            setApproveState('approved');
        }
    }, [isApproveSuccess]);

    useEffect(() => {
        if (isApproveError) {
            console.error("On-chain approve transaction failed:", approveTxError);
            setTxError("Approval transaction failed on the blockchain.");
            setApproveState('needed'); // Reset the button state
        }
    }, [isApproveError, approveTxError]);

    useEffect(() => {
        if (isPaySuccess) {
            setPayState('paid');
            onOrderPaid();
        }
    }, [isPaySuccess, onOrderPaid]);

    useEffect(() => {
        if (isPayError) {
            console.error("On-chain payment transaction failed:", payTxError);
            setTxError("Payment transaction failed on the blockchain.");
            setPayState('idle'); // Reset the button state
        }
    }, [isPayError, payTxError]);

    const handleApprove = async () => {
        setTxError(null);
        setApproveState('approving');
        try {
            const pyusdTxHash = await approveAsync({
                address: pyusdAddress,
                abi: erc20Abi,
                functionName: 'approve',
                args: [orderContractAddress, MaxUint256],
            });
            if (chainId && pyusdTxHash) {
                openTxToast(chainId.toString(), pyusdTxHash);
            }

            const a3aTxHash = await approveAsync({
                address: a3aAddress,
                abi: erc20Abi,
                functionName: 'approve',
                args: [orderContractAddress, MaxUint256],
            });
            if (chainId && a3aTxHash) {
                openTxToast(chainId.toString(), a3aTxHash);
            }
        } catch (err: any) {
            console.error("Approve failed:", err);
            setTxError(err.shortMessage || "User rejected the transaction.");
            setApproveState('needed');
        }
    };

    const handleConfirmOrder = async () => {
        setTxError(null);
        setPayState('paying');
        try {
            const txData = JSON.parse(order.transaction);
            const txHash = await sendTransactionAsync({
                to: txData.to as `0x${string}`,
                data: txData.data as `0x${string}`,
                value: BigInt(txData.value || 0),
            });
            if (chainId && txHash) {
                openTxToast(chainId.toString(), txHash);
            }
        } catch (err: any) {
            console.error("Payment failed:", err);
            setTxError(err.shortMessage || "User rejected the transaction.");
            setPayState('idle');
        }
    };

    return (
        <div
            className="bg-gradient-to-br from-green-700/30 to-green-800/40 text-white/90 rounded-2xl p-4 w-full border border-green-500/20">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0"/>
                <h3 className="text-lg font-semibold text-white">Order Confirmation (ID: {order.orderId})</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">{order.desc}</p>
            <div className="flex justify-between items-center bg-black/20 rounded-lg p-3">
                <span className="text-sm text-white/60">Total amount:</span>
                <span className="text-xl font-bold text-green-300">${parseFloat(order.price).toFixed(2)}</span>
            </div>

            <div className="mt-4 space-y-2">
                {payState === 'paid' ? (
                    <div
                        className="flex items-center justify-center gap-2 text-lg text-green-300 font-medium p-3 bg-green-500/10 rounded-lg">
                        <ShieldCheck className="w-5 h-5"/>
                        <span>Order confirmed and paid!</span>
                    </div>
                ) : (
                    <>
                        {/* Approve Button */}
                        <button
                            onClick={handleApprove}
                            disabled={approveState !== 'needed'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {approveState === 'approving' && !isApproveConfirming && <><Loader className="w-4 h-4 animate-spin"/><span>Please approve in your wallet...</span></>}
                            {isApproveConfirming && <><Loader className="w-4 h-4 animate-spin"/><span>Waiting for user approval...</span></>}
                            {approveState === 'needed' && !isApproveConfirming && <><Zap className="w-4 h-4"/><span>Approve in your wallet first.</span></>}
                            {approveState === 'approved' && <><ShieldCheck
                                className="w-4 h-4"/><span>Approved!</span></>}
                        </button>

                        {/* Pay Button */}
                        <button
                            onClick={handleConfirmOrder}
                            disabled={approveState !== 'approved' || isPayConfirming || payState === 'paying'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all bg-green-500 text-black hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {payState === 'paying' && !isPayConfirming && <><Loader className="w-4 h-4 animate-spin"/><span>Please confirm payment in your wallet...</span></>}
                            {isPayConfirming && <><Loader className="w-4 h-4 animate-spin"/><span>Waiting for user payment...</span></>}
                            {payState === 'idle' && !isPayConfirming && <><Zap className="w-4 h-4"/><span>Confirm payment.</span></>}
                        </button>
                    </>
                )}
                {txError && (<p className="text-red-300 text-xs text-center mt-2">{txError}</p>)}
            </div>
        </div>
    );
};

const OrderStatusPlaceholder: React.FC = () => {
    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="mt-4 w-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] rounded-3xl border border-green-800/50 p-8 text-center"
        >
            <h3 className="text-xl font-semibold text-white mb-2">Current Order Status</h3>
            <p className="text-white/60">Waiting for status update...</p>
        </motion.div>
    );
};

type ContractAddresses = {
    a3a: `0x${string}` | undefined;
    pyusd: `0x${string}` | undefined;
    orderContract: `0x${string}` | undefined;
};

const Chatbot: React.FC = () => {
    // @ts-ignore
    const {role} = useAuthStore();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    // const [mousePosition, setMousePosition] = useState({x: 0, y: 0});
    // const [inputFocused, setInputFocused] = useState(false);
    const [isOrderFinalized, setIsOrderFinalized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const {token} = useAuthStore();

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

                console.log("Fetched A3A address:", a3aAddr);
                console.log("Fetched PYUSD address:", pyusdAddr);
                console.log("Fetched OrderContract (Spender) address:", orderContractAddr);

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

    const {textareaRef, adjustHeight} = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const commandSuggestions: CommandSuggestion[] = [
        {
            icon: <Image className="w-4 h-4"/>,
            label: "Book Table",
            description: "Reserve a table at a restaurant",
            prefix: "/book",
        },
        {
            icon: <Figma className="w-4 h-4"/>,
            label: "Order Food",
            description: "Order food delivery",
            prefix: "/order",
        },
        {
            icon: <Monitor className="w-4 h-4"/>,
            label: "Find Restaurants",
            description: "Search for nearby restaurants",
            prefix: "/find",
        },
        {
            icon: <Sparkles className="w-4 h-4"/>,
            label: "Get Recommendations",
            description: "Get personalized suggestions",
            prefix: "/recommend",
        },
    ];

    useEffect(() => {
        if (input.startsWith("/") && !input.includes(" ")) {
            setShowCommandPalette(true);

            const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) =>
                cmd.prefix.startsWith(input)
            );

            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [input]);

    // useEffect(() => {
    //     const handleMouseMove = (e: MouseEvent) => {
    //         setMousePosition({x: e.clientX, y: e.clientY});
    //     };
    //
    //     window.addEventListener("mousemove", handleMouseMove);
    //     return () => {
    //         window.removeEventListener("mousemove", handleMouseMove);
    //     };
    // }, []);

    useEffect(() => {
        if (messages.length > 0) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            }, 100);
        }
    }, [messages.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector("[data-command-button]");

            if (
                commandPaletteRef.current &&
                !commandPaletteRef.current.contains(target) &&
                !commandButton?.contains(target)
            ) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestion((prev) =>
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestion((prev) =>
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setInput(selectedCommand.prefix + " ");
                    setShowCommandPalette(false);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                sendMessage();
            }
        }
    };

    const sendMessage = async () => {
        if (input.trim() === "" || loading) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, {role: "user", content: userMessage}]);
        setInput("");
        adjustHeight(true);
        setAttachments([]);

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("fiducia_jwt");
            if (!token) {
                setError("Please sign in to start a conversation.");
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/chat/messages`,
                {
                    messages: [
                        ...messages.map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                        })),
                        {
                            role: "user",
                            content: userMessage,
                        },
                    ],
                },
                {headers: {Authorization: `Bearer ${token}`}}
            );

            console.log("Received API response:", response.data);

            if (response.data && response.data.type === 'order' && response.data.content) {
                // It's an order
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "",
                        order: response.data.content,
                    },
                ]);
            } else if (response.data && response.data.content) {
                // It's regular text
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: response.data.content.toString(),
                    },
                ]);
            }
        } catch (err) {
            console.error("Chatbot error:", err);
            setError("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments((prev) => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setInput(selectedCommand.prefix + " ");
        setShowCommandPalette(false);
        textareaRef.current?.focus();
    };

    return (
        <div
            className="w-[60%] h-[70vh] backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] rounded-3xl border border-green-800/50 flex flex-col p-8 relative overflow-hidden">
            <div className="w-full max-w-5xl mx-auto relative z-10 flex-1 flex flex-col min-h-0">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, ease: "easeOut"}}
                        className="space-y-8 flex-1 flex flex-col justify-center"
                    >
                        <div className="text-center space-y-3">
                            <motion.div
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.2, duration: 0.5}}
                                className="inline-block"
                            >
                                <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                                    How can I help today?
                                </h1>
                                <motion.div
                                    initial={{width: 0, opacity: 0}}
                                    animate={{width: "100%", opacity: 1}}
                                    transition={{delay: 0.5, duration: 0.8}}
                                    className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            </motion.div>
                            <motion.p
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{delay: 0.3}}
                                className="text-sm text-white/40"
                            >
                                Type a command or ask a question
                            </motion.p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {commandSuggestions.map((suggestion, index) => (
                                <motion.button
                                    key={suggestion.prefix}
                                    onClick={() => selectCommandSuggestion(index)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: index * 0.1}}
                                >
                                    {suggestion.icon}
                                    <span>{suggestion.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div
                        className="flex-1 overflow-y-auto mb-4 space-y-4 px-2 py-2"
                        style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(255,255,255,0.1) transparent",
                        }}
                    >
                        {messages.map((message, index) => {
                            // Check if this message is an order
                            if (message.role === "assistant" && message.order) {
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{opacity: 0, y: 10}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{duration: 0.3}}
                                        className="w-full"
                                    >
                                        <OrderConfirmation
                                            order={message.order}
                                            pyusdAddress={contractAddrs.pyusd || "0x"}
                                            a3aAddress={contractAddrs.a3a || "0x"}
                                            orderContractAddress={contractAddrs.orderContract || "0x"}
                                            onOrderPaid={() => setIsOrderFinalized(true)}
                                        />
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={index}
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.3}}
                                    className={cn(
                                        "flex",
                                        message.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] px-4 py-3 text-sm relative prose prose-invert prose-sm",
                                            message.role === "user"
                                                ? "bg-gradient-to-br from-green-700/30 to-green-800/40 text-white/90 rounded-2xl rounded-br-sm"
                                                : "bg-gradient-to-br from-gray-800/80 to-gray-900/90 text-white/80 rounded-2xl rounded-bl-sm"
                                        )}
                                        style={{
                                            backdropFilter: "blur(10px)",
                                            border:
                                                message.role === "user"
                                                    ? "1px solid rgba(34, 197, 94, 0.2)"
                                                    : "1px solid rgba(255, 255, 255, 0.1)",
                                        }}
                                    >
                                        <ReactMarkdown
                                            components={{
                                                p: ({children}) => (
                                                    <p className="mb-2 last:mb-0">{children}</p>
                                                ),
                                                strong: ({children}) => (
                                                    <strong className="font-semibold text-white">
                                                        {children}
                                                    </strong>
                                                ),
                                                ul: ({children}) => (
                                                    <ul className="ml-4 mb-2 space-y-1">{children}</ul>
                                                ),
                                                li: ({children}) => (
                                                    <li className="list-disc">{children}</li>
                                                ),
                                                em: ({children}) => (
                                                    <em className="italic">{children}</em>
                                                ),
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {loading && (
                            <motion.div
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                className="flex justify-start"
                            >
                                <div
                                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl px-4 py-3">
                                    <TypingDots/>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>
                )}

                <motion.div
                    className="relative backdrop-blur-2xl bg-white/[0.01] rounded-3xl border-1 border-green-900/54 shadow-2xl"
                    initial={{scale: 0.98}}
                    animate={{scale: 1}}
                    transition={{delay: 0.1}}
                >
                    <AnimatePresence>
                        {showCommandPalette && (
                            <motion.div
                                ref={commandPaletteRef}
                                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                initial={{opacity: 0, y: 5}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: 5}}
                                transition={{duration: 0.15}}
                            >
                                <div className="py-1 bg-black/95">
                                    {commandSuggestions.map((suggestion, index) => (
                                        <motion.div
                                            key={suggestion.prefix}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                activeSuggestion === index
                                                    ? "bg-white/10 text-white"
                                                    : "text-white/70 hover:bg-white/5"
                                            )}
                                            onClick={() => selectCommandSuggestion(index)}
                                            initial={{opacity: 0}}
                                            animate={{opacity: 1}}
                                            transition={{delay: index * 0.03}}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                {suggestion.icon}
                                            </div>
                                            <div className="font-medium">{suggestion.label}</div>
                                            <div className="text-white/40 text-xs ml-1">
                                                {suggestion.prefix}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isOrderFinalized && (<>
                        <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            // onFocus={() => setInputFocused(true)}
                            // onBlur={() => setInputFocused(false)}
                            placeholder="Ask me to book a table, order food, etc."
                            disabled={loading}
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-white/90 text-sm",
                                "focus:outline-none",
                                "placeholder:text-white/20",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                        <AnimatePresence>
                    {attachments.length > 0 && (
                        <motion.div
                        className="px-4 pb-3 flex gap-2 flex-wrap"
                        initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: "auto"}}
                    exit={{opacity: 0, height: 0}}
                >
                    {attachments.map((file, index) => (
                        <motion.div
                            key={index}
                            className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                        >
                            <span>{file}</span>
                            <button
                                onClick={() => removeAttachment(index)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3"/>
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4 border-t border-green-700/15 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <motion.button
                        type="button"
                        onClick={handleAttachFile}
                        whileTap={{scale: 0.94}}
                        className="p-2 text-green-800/70 hover:text-white/90 rounded-lg transition-colors relative group"
                    >
                        <Paperclip className="w-4 h-4"/>
                        <motion.span
                            className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </motion.button>
                    <motion.button
                        type="button"
                        data-command-button
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setShowCommandPalette((prev) => !prev);
                        }}
                        whileTap={{scale: 0.94}}
                        className={cn(
                            "p-2 text-green-800/70 hover:text-white/90 rounded-lg transition-colors relative group",
                            showCommandPalette && "bg-white/10 text-white/90"
                        )}
                    >
                        <Command className="w-4 h-4"/>
                        <motion.span
                            className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </motion.button>
                </div>

                <motion.button
                    type="button"
                    onClick={sendMessage}
                    whileHover={{scale: 1.01}}
                    whileTap={{scale: 0.98}}
                    disabled={loading || !input.trim()}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "flex items-center gap-2",
                        input.trim() && !loading
                            ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                            : "bg-white/[0.05] text-white/40"
                    )}
                >
                    {loading ? (
                        <Loader className="w-4 h-4 animate-spin"/>
                    ) : (
                        <Send className="w-4 h-4"/>
                    )}
                    <span>Send</span>
                </motion.button>
            </div>
                        </>
                    )}
                </motion.div>

                {error && (
                    <motion.p
                        className="text-red-400 text-center text-sm mt-2"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                    >
                        {error}
                    </motion.p>
                )}
            </div>

            {/*{inputFocused && (*/}
            {/*    <motion.div*/}
            {/*        className="absolute w-[30rem] h-[30rem] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 blur-[96px]"*/}
            {/*        animate={{*/}
            {/*            x: mousePosition.x - 240,*/}
            {/*            y: mousePosition.y - 240,*/}
            {/*        }}*/}
            {/*        transition={{*/}
            {/*            type: "spring",*/}
            {/*            damping: 25,*/}
            {/*            stiffness: 150,*/}
            {/*            mass: 0.5,*/}
            {/*        }}*/}
            {/*    />*/}
            {/*)}*/}
            <AnimatePresence>
                {isOrderFinalized && <OrderStatusPlaceholder/>}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
