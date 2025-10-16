import React, { useState, useEffect } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Loader2 } from "lucide-react";

const API_BASE_URL = "http://fiduciademo.123a.club/api";

interface AuthInfo {
  token: string;
  address: string;
  role: "customer" | "merchant" | null;
}

const AuthButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem("fiducia_jwt");
      const storedRole = localStorage.getItem("fiducia_role") as
        | "customer"
        | "merchant"
        | null;

      if (storedToken && address) {
        try {
          setAuthInfo({
            token: storedToken,
            address,
            role: storedRole,
          });
          console.log("Session restored for:", address);
        } catch (err) {
          console.error("Session validation failed", err);
          localStorage.removeItem("fiducia_jwt");
          localStorage.removeItem("fiducia_role");
          setAuthInfo(null);
        }
      }
    };
    checkSession();
  }, [address]);

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
        setAuthInfo({ token, address: user.address, role: null });
        localStorage.setItem("fiducia_jwt", token);
        setShowRoleSelector(true);
      } else {
        setAuthInfo({ token, address: user.address, role: user.role });
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
      setAuthInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (role: "customer" | "merchant") => {
    if (!authInfo?.token) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Setting role to:", role);
      const response = await axios.post(
        `${API_BASE_URL}/user/role`,
        { role: role === "customer" ? "consumer" : "merchant" },
        { headers: { Authorization: `Bearer ${authInfo.token}` } }
      );

      console.log("Role set response:", response.data);
      const { token, user } = response.data;
      setAuthInfo({ token, address: user.address, role: user.role });
      localStorage.setItem("fiducia_jwt", token);
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
    setAuthInfo(null);
    localStorage.removeItem("fiducia_jwt");
    localStorage.removeItem("fiducia_role");
    setShowRoleSelector(false);
    console.log("Logged out.");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Sign In Button (when connected but not authenticated) */}
        <AnimatePresence>
          {isConnected && !authInfo && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleLogin}
              disabled={loading}
              className="px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-[180%] bg-[rgba(17,25,20,0.40)] border border-green-800/50 text-white/90 text-sm font-medium transition-all hover:bg-[rgba(17,25,20,0.60)] hover:border-green-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Logout Button (when authenticated) */}
        <AnimatePresence>
          {authInfo && authInfo.role && (
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
      </div>

      {/* Role Selector Modal */}
      <AnimatePresence>
        {showRoleSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !loading && setShowRoleSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
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

              {loading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-white/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
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
    </>
  );
};

export default AuthButton;
