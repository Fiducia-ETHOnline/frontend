import DarkVeil from "@/components/DarkVeil";
import AuthButton from "../components/AuthButton";
import Chatbot from "../components/Chatbot";
import MerchantMenu from "../components/MerchantMenu";
import MerchantNFTCard from "../components/MerchantNFTCard";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import A3ALogo from "@/assets/A3A_logo.png";

const API_BASE_URL = "https://fiduciademo.123a.club/api";

function Dashboard() {
  const { role, token, merchantId } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/home";
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [menuAction, setMenuAction] = useState<{
    action: "add" | "update" | "delete";
    itemName?: string;
  } | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const checkMerchantProfile = async () => {
      if (role !== "merchant" || !token || !merchantId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/merchant/${merchantId}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const profileData = response.data;
        const isProfileComplete = profileData &&
          profileData.wallet &&
          profileData.description &&
          profileData.location;

        setHasProfile(isProfileComplete);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasProfile(false);
        } else {
          console.error("Failed to check merchant profile:", err);
          setHasProfile(false);
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    checkMerchantProfile();
  }, [role, token, merchantId]);

  const handleMenuAction = (
    action: "add" | "update" | "delete",
    itemName?: string
  ) => {
    setMenuAction({ action, itemName });
    setShowChatbot(true);
  };

  const handleMenuActionComplete = async () => {
    setMenuAction(null);
    setShowChatbot(false);

    // Refetch profile to update menu
    if (role === "merchant" && token && merchantId) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/merchant/${merchantId}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const profileData = response.data;
        const isProfileComplete = profileData &&
          profileData.wallet &&
          profileData.description &&
          profileData.location;

        setHasProfile(isProfileComplete);
      } catch (err: any) {
        console.error("Failed to refresh merchant profile:", err);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] relative">
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={60} />
      </div>
      <header className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 lg:px-8 py-4 md:py-6 relative z-20 gap-4 md:gap-0">
        <div className="flex gap-2 md:gap-3 items-center w-full md:w-auto justify-start md:justify-start">
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
                <span>
                  {role
                    ? `${
                        role.charAt(0).toUpperCase() + role.slice(1)
                      } Dashboard`
                    : "Dashboard"}
                </span>
              </HoverBorderGradient>
            ) : (
              <span
                className="text-white/60 hover:text-white cursor-pointer transition-colors px-2 py-1 md:px-4 md:py-2 text-xs md:text-base"
                onClick={() => navigate("/dashboard")}
              >
                {role
                  ? `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`
                  : "Dashboard"}
              </span>
            )}
          </div>
        </div>
        <div className="auth-area w-full md:w-auto flex justify-start md:justify-end">
          <AuthButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 md:px-4 py-2 md:py-4 relative z-10">
        {role === "merchant" &&
        !loadingProfile &&
        hasProfile &&
        !showChatbot ? (
          <div className="w-full max-w-6xl flex flex-col items-center gap-4 md:gap-6">
            <MerchantNFTCard />
            <MerchantMenu onActionClick={handleMenuAction} />
          </div>
        ) : (
          <Chatbot
            menuAction={menuAction}
            onMenuActionComplete={handleMenuActionComplete}
            autoEnableAdminMode={!!menuAction || (role === "merchant" && !hasProfile)}
          />
        )}
      </main>

      <footer className="px-4 md:px-6 lg:px-8 py-4 md:py-6 text-center bg-white/[0.03] border-t border-white/10 relative z-10">
        <p className="text-white/60 text-xs md:text-sm">
          &copy; 2025 Fiducia. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
