import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import DarkVeil from "@/components/DarkVeil";
import AuthButton from "@/components/AuthButton";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useNotification } from "@blockscout/app-sdk";
import MerchantNFTAbi from "@/abi/MerchantNFT.json";
import { useNavigate } from "react-router-dom";

const ADMIN_ADDRESS = "0xcf19f5d480390A638f3c6986323892Bc1D08125e";
const MERCHANT_NFT_ADDRESS =
  "0xe2d8c380db7d124D03DACcA07645Fea659De9738" as const;

const AdminPage: React.FC = () => {
  const { address, chainId } = useAccount();
  const navigate = useNavigate();
  const [applicantAddress, setApplicantAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContractAsync, isPending } = useWriteContract();
  const { openTxToast } = useNotification();

  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const handleApprove = async () => {
    if (!applicantAddress) {
      setError("Please enter an applicant address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(applicantAddress)) {
      setError("Invalid Ethereum address");
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      const hash = await writeContractAsync({
        address: MERCHANT_NFT_ADDRESS,
        abi: MerchantNFTAbi,
        functionName: "approveApplicant",
        args: [applicantAddress as `0x${string}`],
      });

      console.log("Approval transaction submitted:", hash);
      setTxHash(hash);

      if (chainId) {
        openTxToast(chainId.toString(), hash);
      }

      setSuccess(true);
      setApplicantAddress("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to approve applicant:", err);
      setError(err.shortMessage || err.message || "Transaction failed");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0a0a0a] relative">
        <div className="absolute inset-0 z-0">
          <DarkVeil hueShift={60} />
        </div>

        <header className="flex justify-end items-center px-8 py-6 relative z-20">
          <AuthButton />
        </header>

        <main className="flex-1 flex items-center justify-center relative z-10 px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] rounded-3xl border border-red-800/50 p-12 text-center max-w-md"
          >
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h1>
            <p className="text-white/60 mb-6">
              This page is only accessible to authorized administrators.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/home")}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
            >
              Go to Home
            </motion.button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] relative">
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={60} />
      </div>

      <header className="flex justify-end items-center px-8 py-6 relative z-20">
        <AuthButton />
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] rounded-3xl border border-green-800/50 p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-white/60 text-sm">
                Approve Merchant NFT Applications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">
                Applicant Address
              </label>
              <input
                type="text"
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-sm"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApprove}
              disabled={isPending || !applicantAddress}
              className="w-full p-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve Applicant</span>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Applicant approved successfully!</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/50 text-xs">
              <span className="text-white/70 font-medium">Contract:</span>{" "}
              <code className="font-mono">{MERCHANT_NFT_ADDRESS}</code>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPage;
