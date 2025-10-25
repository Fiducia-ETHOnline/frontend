import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Loader,
  Package,
  Clock,
  XCircle,
  MessageSquare,
  History,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import DarkVeil from "@/components/DarkVeil";
import AuthButton from "@/components/AuthButton";
import { useTransactionPopup } from "@blockscout/app-sdk";
import {
  useAccount,
  useReadContract,
  useWatchContractEvent,
  useConfig,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import A3ALogo from "@/assets/A3A_logo.png";
import OrderContractAbi from "@/abi/OrderContract.json";
import { formatEther } from "viem";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const API_BASE_URL = "https://fiduciademo.123a.club/api";
const ORDER_CONTRACT_ADDRESS =
  "0x1417178178d35E5638c30B4070eB4F4ccC0aEaD0" as const;

interface Order {
  orderId: string;
  cid: string;
  status: string;
  amount: string;
  buyer?: string;
  seller?: string;
  price?: string;
  timestamp?: number;
}

interface OrderDetails {
  wallet: string;
  desc: string;
  price: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ReactNode;
      label: string;
    }
  > = {
    AWAITING_FULFILLMENT: {
      variant: "outline",
      icon: <Clock className="w-3.5 h-3.5" />,
      label: "Awaiting Fulfillment",
    },
    CONFIRMED: {
      variant: "default",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Confirmed",
    },
    COMPLETED: {
      variant: "default",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Completed",
    },
    DISPUTED: {
      variant: "destructive",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: "Disputed",
    },
    DELIVERING: {
      variant: "secondary",
      icon: <Package className="w-3.5 h-3.5" />,
      label: "Delivering",
    },
  };

  const config = statusConfig[status] || statusConfig.AWAITING_FULFILLMENT;

  return (
    <Badge
      variant={config.variant}
      className="flex items-center gap-1.5 px-3 py-1.5 text-white"
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

const OrderRow: React.FC<{
  order: Order;
  onConfirm: (orderId: string) => void;
  onDispute: (orderId: string, reason: string) => void;
  isLoading: boolean;
  isMerchant?: boolean;
}> = ({ order, onConfirm, onDispute, isLoading, isMerchant = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [copied, setCopied] = useState(false);
  const { openPopup } = useTransactionPopup();
  const { address } = useAccount();

  const handleCopyAddress = async () => {
    if (orderDetails?.wallet) {
      await navigator.clipboard.writeText(orderDetails.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoadingDetails(true);
        const response = await fetch(
          `https://gateway.lighthouse.storage/ipfs/${order.cid}`
        );
        if (!response.ok) throw new Error("Failed to fetch order details");

        const text = await response.text();
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        const data = JSON.parse(jsonMatch[0]);
        setOrderDetails(data);
      } catch (err) {
        console.error("Failed to fetch order details from IPFS:", err);
        console.error("CID:", order.cid);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (order.cid) {
      fetchOrderDetails();
    }
  }, [order.cid]);

  const handleDisputeSubmit = () => {
    if (disputeReason.trim()) {
      onDispute(order.orderId, disputeReason);
      setShowDisputeForm(false);
      setDisputeReason("");
    }
  };

  const canTakeAction =
    order.status === "AWAITING_FULFILLMENT" ||
    order.status === "DELIVERING" ||
    order.status === "CONFIRMED";

  const handleViewTransactions = () => {
    openPopup({
      chainId: "11155111",
      address: address,
    });
  };

  return (
    <>
      <TableRow
        className="border-b border-white/10 hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <TableCell className="py-5 first:pl-5 pl-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-base">
                #{order.orderId}
              </p>
              {isMerchant ? (
                // For merchant: show buyer address
                order.buyer ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-white/50 text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">
                      {order.buyer.slice(0, 6)}...
                      {order.buyer.slice(-4)}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(order.buyer!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-white/40 hover:text-white/80 transition-colors p-0.5 hover:bg-white/10 rounded"
                      title="Copy buyer address"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : null
              ) : // For customer: show merchant address from orderDetails
              loadingDetails ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Loader className="w-3 h-3 text-white/40 animate-spin" />
                  <span className="text-white/40 text-xs">Loading...</span>
                </div>
              ) : orderDetails ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-white/50 text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">
                    {orderDetails.wallet.slice(0, 6)}...
                    {orderDetails.wallet.slice(-4)}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAddress();
                    }}
                    className="text-white/40 hover:text-white/80 transition-colors p-0.5 hover:bg-white/10 rounded"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-5">
          {isMerchant ? (
            // For merchant: show timestamp
            order.timestamp ? (
              <p className="text-white/80 text-sm">
                {new Date(order.timestamp * 1000).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : (
              <p className="text-white/50 text-sm">N/A</p>
            )
          ) : // For customer: show description
          loadingDetails ? (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 text-white/40 animate-spin" />
              <span className="text-white/50 text-sm">
                Loading description...
              </span>
            </div>
          ) : orderDetails ? (
            <p
              className="text-white/80 text-sm max-w-md line-clamp-2"
              title={orderDetails.desc}
            >
              {orderDetails.desc}
            </p>
          ) : (
            <p className="text-red-400/60 text-sm">Failed to load</p>
          )}
        </TableCell>

        <TableCell className="py-5">
          <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {order.amount}
          </p>
        </TableCell>

        <TableCell className="py-5">
          <StatusBadge status={order.status} />
        </TableCell>

        {/* Actions column - only for customers */}
        {!isMerchant && (
          <TableCell className="py-5">
            <div className="flex items-center gap-1">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewTransactions();
                }}
                variant="ghost"
                size="sm"
                title="View transaction history"
                className="text-white/60 hover:text-white h-8 w-8 p-0"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white h-8 w-8 p-0"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      {/* Expanded Details Row */}
      <AnimatePresence>
        {showDetails && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="p-0 border-b border-white/10 bg-white/[0.01]"
            >
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-8 py-6 space-y-6">
                  {/* Full Description */}
                  {orderDetails && (
                    <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5">
                      <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        Full Description
                      </p>
                      <p className="text-white/90 text-base leading-relaxed">
                        {orderDetails.desc}
                      </p>
                    </div>
                  )}

                  {/* Dispute Form */}
                  <AnimatePresence>
                    {showDisputeForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gradient-to-br from-red-950/30 via-orange-950/20 to-red-950/30 rounded-xl p-6 border border-red-500/20 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                Raise a Dispute
                              </h4>
                              <p className="text-white/50 text-xs">
                                Describe the issue with your order
                              </p>
                            </div>
                          </div>
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Please provide detailed information about the issue with your order..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 min-h-[100px]"
                            rows={4}
                          />
                          <div className="flex gap-3">
                            <Button
                              onClick={handleDisputeSubmit}
                              disabled={!disputeReason.trim() || isLoading}
                              variant="destructive"
                              className="flex-1 h-11 gap-2"
                            >
                              {isLoading ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4" />
                                  Submit Dispute
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowDisputeForm(false);
                                setDisputeReason("");
                              }}
                              variant="outline"
                              className="h-11 px-6 border-white/20 hover:bg-white/5"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons - Only for customers */}
                  {!isMerchant && canTakeAction && !showDisputeForm && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => onConfirm(order.orderId)}
                        disabled={isLoading}
                        variant="default"
                        className="flex-1 h-12 text-base gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirm Received
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDisputeForm(true)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 h-12 text-base gap-2 border-white/20 hover:bg-white/5"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Raise Dispute
                      </Button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {order.status === "DISPUTED" && (
                    <div className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-xl p-5 border border-orange-500/20">
                      <div className="flex items-center gap-3 text-orange-300">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            Dispute in Progress
                          </p>
                          <p className="text-xs text-orange-200/60">
                            Awaiting resolution from mediator
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === "COMPLETED" && (
                    <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-xl p-5 border border-green-500/20">
                      <div className="flex items-center gap-3 text-green-300">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            Order Completed
                          </p>
                          <p className="text-xs text-green-200/60">
                            Transaction successful and funds released
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
};

interface FinalizedOrder {
  orderId: string;
  amount: string;
  timestamp: number;
}

const CustomerDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueData, setRevenueData] = useState<
    Array<{ date: string; revenue: number }>
    >([]);
  // @ts-ignore
  const [finalizedOrders, setFinalizedOrders] = useState<FinalizedOrder[]>([]);
  const { openPopup } = useTransactionPopup();
  const { address } = useAccount();
  const { token, role } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/home";
  const config = useConfig();

  // Merchant: Get order IDs from contract
  const { data: merchantOrderIds, refetch: refetchMerchantOrders } =
    useReadContract({
      address: ORDER_CONTRACT_ADDRESS,
      abi: OrderContractAbi,
      functionName: "getOrderIDsByMerchant",
      args: [address!],
      query: {
        enabled: role === "merchant" && !!address,
      },
    });
  console.log(merchantOrderIds);

  // Watch for orderFinalized events for merchants
  useWatchContractEvent({
    address: ORDER_CONTRACT_ADDRESS,
    abi: OrderContractAbi,
    eventName: "orderFinalized",
    onLogs(logs: any[]) {
      console.log("Order finalized event:", logs);
      if (role === "merchant") {
        // Process finalized orders from event logs to update revenue
        const newFinalizedOrders: FinalizedOrder[] = [];
        logs.forEach((log: any) => {
          const offerId = log.args?.offerId?.toString();
          if (offerId) {
            newFinalizedOrders.push({
              orderId: offerId,
              amount: "0", // Will be updated from contract
              timestamp: Date.now(),
            });
          }
        });

        if (newFinalizedOrders.length > 0) {
          setFinalizedOrders((prev) => [...prev, ...newFinalizedOrders]);
        }

        refetchMerchantOrders();
      }
    },
  });

  const fetchMerchantOrders = async () => {
    if (!merchantOrderIds || (Array.isArray(merchantOrderIds) && merchantOrderIds.length === 0) || !address) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch order details from contract using offers function for each order ID
      const orderPromises = (merchantOrderIds as bigint[]).map(
        async (orderId) => {
          try {
            // Call the offers function from the contract to get order details
            const offerData = (await readContract(config, {
              address: ORDER_CONTRACT_ADDRESS,
              abi: OrderContractAbi,
              functionName: "offers",
              args: [orderId],
            })) as any;

            console.log(`Offer data for order ${orderId}:`, offerData);

            // Access the named fields from the offer struct
            const buyer = offerData.buyer || offerData[0];
            const seller = offerData.seller || offerData[1];
            const price = offerData.price || offerData[4];
            const paid = offerData.paid || offerData[5];
            const timestamp = offerData.timestamp || offerData[6];
            const statusEnum = offerData.status ?? offerData[7];

            // Map contract status enum to string
            const statusMap = [
              "AWAITING_FULFILLMENT",
              "CONFIRMED",
              "DELIVERING",
              "COMPLETED",
              "DISPUTED",
            ];
            const status = statusMap[statusEnum] || "AWAITING_FULFILLMENT";

            // Fetch CID from API for description
            let cid = "";
            try {
              const apiResponse = await fetch(
                `${API_BASE_URL}/orders/merchant/${orderId.toString()}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                cid = apiData.cid || "";
              }
            } catch (err) {
              console.error(`Failed to fetch CID for order ${orderId}:`, err);
            }

            // For merchant orders, multiply the amount by 10^12
            const amountValue = paid || 0n;
            const multipliedAmount = amountValue * BigInt(1e12);

            return {
              orderId: orderId.toString(),
              cid: cid,
              status: status,
              amount: formatEther(multipliedAmount) + " PyUSD",
              buyer,
              seller,
              price: formatEther(price || 0n),
              timestamp: timestamp ? Number(timestamp) : Date.now(),
            };
          } catch (err) {
            console.error(
              `Failed to fetch offer details for order ${orderId}:`,
              err
            );
            return null;
          }
        }
      );

      const fetchedOrders = (await Promise.all(orderPromises)).filter(
        (o) => o !== null
      ) as Order[];
      console.log("Fetched merchant orders from contract:", fetchedOrders);
      setOrders(fetchedOrders);

      // Calculate revenue from completed orders only
      const completed = fetchedOrders.filter((o) => o.status === "COMPLETED");
      const total = completed.reduce((sum, order) => {
        const amount = parseFloat(order.amount.replace(/[^0-9.]/g, ""));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      setTotalRevenue(total);

      // Generate revenue growth data (last 7 days) based on actual timestamps
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Initialize chart data for last 7 days
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: 0,
          timestamp: date.getTime(),
        };
      });

      // Map completed orders to their actual dates based on timestamp
      completed.forEach((order) => {
        if (!order.timestamp) return;

        const orderDate = new Date(order.timestamp * 1000);
        const orderDateOnly = new Date(
          orderDate.getFullYear(),
          orderDate.getMonth(),
          orderDate.getDate()
        );
        const orderTimestamp = orderDateOnly.getTime();

        // Find the matching day in chartData
        const dayIndex = chartData.findIndex(
          (day) => day.timestamp === orderTimestamp
        );

        if (dayIndex !== -1) {
          const amount = parseFloat(order.amount.replace(/[^0-9.]/g, ""));
          if (!isNaN(amount)) {
            chartData[dayIndex].revenue += amount;
          }
        }
      });

      // Remove the timestamp property before setting state (only needed for calculation)
      const finalChartData = chartData.map(({ date, revenue }) => ({
        date,
        revenue,
      }));
      setRevenueData(finalChartData);
    } catch (err) {
      console.error("Failed to fetch merchant orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    if (!token) {
      setError("Please sign in to view your orders.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      console.log("Fetched orders:", data);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "merchant") {
      fetchMerchantOrders();
    } else {
      fetchCustomerOrders();
    }
  }, [token, role, merchantOrderIds]);

  const handleConfirmOrder = async (orderId: string) => {
    if (!token) return;

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/confirm-finish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to confirm order");

      const data = await response.json();
      setSuccessMessage(data.message || "Order confirmed successfully!");

      // Refetch orders based on role
      if (role === "merchant") {
        await fetchMerchantOrders();
      } else {
        await fetchCustomerOrders();
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to confirm order:", err);
      setError("Failed to confirm order. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (orderId: string, reason: string) => {
    if (!token) return;

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/dispute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) throw new Error("Failed to raise dispute");

      const data = await response.json();
      setSuccessMessage(data.message || "Dispute raised successfully!");

      // Refetch orders based on role
      if (role === "merchant") {
        await fetchMerchantOrders();
      } else {
        await fetchCustomerOrders();
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to raise dispute:", err);
      setError("Failed to raise dispute. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewAllTransactions = () => {
    openPopup({
      chainId: "11155111",
      address: address,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <DarkVeil hueShift={60} />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center px-4 md:px-6 lg:px-8 py-4 md:py-6 relative z-10">
        <div className="flex gap-2 md:gap-3 items-center">
          {" "}
          <img
            src={A3ALogo}
            alt="A3A Logo"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full"
          />
          <div className="bg-[#0B1410] py-2 px-3 md:py-3 md:px-6 rounded-4xl flex items-center gap-3 md:gap-5">
            {isHome ? (
              <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className="bg-[#1A2620] text-white flex items-center space-x-2"
                onClick={() => navigate("/home")}
              >
                <span>Home</span>
              </HoverBorderGradient>
            ) : (
              <span
                className="text-white/60 hover:text-white cursor-pointer transition-colors px-2 py-1 md:px-4 md:py-2 text-xs md:text-base"
                onClick={() => navigate("/home")}
              >
                Home
              </span>
            )}

            {!isHome ? (
              <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className="bg-[#1A2620] text-white flex items-center space-x-2 text-xs md:text-base"
                onClick={() => navigate("/dashboard")}
              >
                <span className="whitespace-nowrap">
                  {role
                    ? `${
                        role.charAt(0).toUpperCase() + role.slice(1)
                      } Dashboard`
                    : "Dashboard"}
                </span>
              </HoverBorderGradient>
            ) : (
              <span
                className="text-white/60 hover:text-white cursor-pointer transition-colors px-2 py-1 md:px-4 md:py-2 text-xs md:text-base whitespace-nowrap"
                onClick={() => navigate("/dashboard")}
              >
                {role
                  ? `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`
                  : "Dashboard"}
              </span>
            )}
          </div>
        </div>
        <div className="auth-area">
          <AuthButton />
        </div>
      </header>

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-2">
                {role === "merchant" ? "Merchant Orders" : "My Orders"}
              </h1>
              <p className="text-sm md:text-base text-white/60">
                {role === "merchant"
                  ? "View funds and orders from customers"
                  : "Track and manage your orders"}
              </p>
            </div>
            <Button
              onClick={handleViewAllTransactions}
              variant="outline"
              className="gap-2 border-white/20 hover:bg-white/5 text-xs md:text-sm whitespace-nowrap"
            >
              <History className="w-3 h-3 md:w-4 md:h-4" />
              View All Transactions
            </Button>
          </div>
        </motion.div>

        {/* Merchant Revenue Stats - Only show when there are orders */}
        {role === "merchant" && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          >
            {/* Total Revenue Card */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Total Revenue
                </CardTitle>
                <CardDescription className="text-white/60">
                  Completed orders only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${totalRevenue.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* Revenue Growth Chart */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Revenue Growth
                </CardTitle>
                <CardDescription className="text-white/60">
                  Last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(142.1 76.2% 36.3%)",
                    },
                  }}
                  className="h-[150px] w-full"
                >
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient
                        id="fillRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(142.1 76.2% 36.3%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(142.1 76.2% 36.3%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                      tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(142.1 76.2% 36.3%)"
                      fill="url(#fillRevenue)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-200 text-sm">{successMessage}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-green-800/30 p-12 text-center"
          >
            <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No orders yet
            </h3>
            <p className="text-white/60">
              {role === "merchant"
                ? "Orders from customers will appear here."
                : "Your orders will appear here once you make a purchase."}
            </p>
          </motion.div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60 first:pl-5 pl-0 font-semibold">
                    {role === "merchant"
                      ? "Order ID & Customer"
                      : "Order ID & Merchant"}
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    {role === "merchant" ? "Timestamp" : "Description"}
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Amount
                  </TableHead>
                  <TableHead className="text-white/60 font-semibold">
                    Status
                  </TableHead>
                  {role !== "merchant" && (
                    <TableHead className="text-white/60 font-semibold">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    onConfirm={handleConfirmOrder}
                    onDispute={handleDispute}
                    isLoading={actionLoading}
                    isMerchant={role === "merchant"}
                  />
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;
