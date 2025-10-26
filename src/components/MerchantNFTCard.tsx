import React from "react";
import { motion } from "framer-motion";
import { useAccount, useReadContract } from "wagmi";
import { Shield, ExternalLink, Award } from "lucide-react";
import MerchantNFTAbi from "@/abi/MerchantNFT.json";
import merchantLogo from "@/assets/A3A_logo.png";

const MERCHANT_NFT_ADDRESS = "0x1e08cFBd659436F8Fc72C91A9302B6C6F444c0A2" as const;
const BLOCKSCOUT_BASE_URL = "https://eth-sepolia.blockscout.com";

const MerchantNFTCard: React.FC = () => {
  const { address } = useAccount();

  const { data: nftBalance } = useReadContract({
    address: MERCHANT_NFT_ADDRESS,
    abi: MerchantNFTAbi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const { data: tokenId } = useReadContract({
    address: MERCHANT_NFT_ADDRESS,
    abi: MerchantNFTAbi,
    functionName: "getNextId",
    query: {
      // @ts-ignore
      enabled: !!address && nftBalance && Number(nftBalance) > 0,
    },
  });

  if (!nftBalance || Number(nftBalance) === 0) {
    return null;
  }

  const currentTokenId = tokenId ? Number(tokenId) - 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto backdrop-blur-xl backdrop-saturate-[180%] bg-gradient-to-br from-emerald-900/30 to-green-900/40 rounded-3xl border border-emerald-500/30 p-6 mb-6"
    >
      <div className="flex items-center gap-6">
        {/* NFT Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20">
            <img
              src={merchantLogo}
              alt="Merchant NFT"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* NFT Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">
              Merchant NFT #{currentTokenId}
            </h2>
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
              <span className="text-emerald-300 text-xs font-medium flex items-center gap-1">
                <Award className="w-3 h-3" />
                Verified Merchant
              </span>
            </div>
          </div>

          <p className="text-white/70 text-sm mb-4">
            This NFT grants you access to create and manage your restaurant on
            the Fiducia platform. You can accept orders and receive crypto
            payments.
          </p>

          <div className="flex items-center gap-4">
            {/* View on Blockscout */}
            <motion.a
              href={`${BLOCKSCOUT_BASE_URL}/token/${MERCHANT_NFT_ADDRESS}/instance/${currentTokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm hover:bg-emerald-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Blockscout</span>
            </motion.a>

            {/* Contract Address */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">Contract:</span>
              <motion.a
                href={`${BLOCKSCOUT_BASE_URL}/address/${MERCHANT_NFT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="text-emerald-400 text-xs font-mono hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                {`${MERCHANT_NFT_ADDRESS.slice(0, 6)}...${MERCHANT_NFT_ADDRESS.slice(-4)}`}
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MerchantNFTCard;
