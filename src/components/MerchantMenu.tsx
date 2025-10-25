import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import {
  Store,
  Clock,
  MapPin,
  DollarSign,
  Loader2,
  ChefHat,
  Info,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

const API_BASE_URL = "https://fiduciademo.123a.club/api";

interface MenuItem {
  name: string;
  price: string;
  description: string | null;
}

interface MerchantProfile {
  merchant_id: string;
  wallet: string;
  description: string;
  hours: string;
  location: string;
  menu: MenuItem[];
}

interface MerchantMenuProps {
  onActionClick: (action: "add" | "update" | "delete", itemName?: string) => void;
}

const MerchantMenu: React.FC<MerchantMenuProps> = ({ onActionClick }) => {
  const { token, merchantId } = useAuthStore();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchantProfile = async () => {
      if (!token || !merchantId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/merchant/${merchantId}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Merchant profile:", response.data);
        setProfile(response.data);
      } catch (err: any) {
        console.error("Failed to fetch merchant profile:", err);
        if (err.response?.status === 404) {
          // Profile doesn't exist yet - this is fine
          setProfile(null);
        } else {
          setError("Failed to load merchant profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantProfile();
  }, [token, merchantId]);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!profile) {
    // No profile yet - will show chatbot
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] rounded-3xl border border-green-800/50 p-8"
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
            <Store className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Your Restaurant
            </h1>
            <p className="text-white/60">{profile.description}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <Clock className="w-5 h-5 text-green-400/70" />
            <div>
              <p className="text-xs text-white/50">Operating Hours</p>
              <p className="text-white/90">{profile.hours}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <MapPin className="w-5 h-5 text-green-400/70" />
            <div>
              <p className="text-xs text-white/50">Location</p>
              <p className="text-white/90">{profile.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Menu</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onActionClick("add")}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm hover:bg-green-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </motion.button>
        </div>

        {profile.menu && profile.menu.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.menu.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-green-500/30 transition-all group relative"
              >
                {/* Action Icon Buttons - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onActionClick("update", item.name)}
                    className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/20 transition-all"
                    title="Update price"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onActionClick("delete", item.name)}
                    className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/20 transition-all"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div className="flex justify-between items-start mb-3 pr-16">
                  <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 font-bold">
                      {parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/60">{item.description}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <ChefHat className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No menu items added yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MerchantMenu;
