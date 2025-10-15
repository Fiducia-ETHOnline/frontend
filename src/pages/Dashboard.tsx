import DarkVeil from "@/components/DarkVeil";
import AuthButton from "../components/AuthButton";
import Chatbot from "../components/Chatbot";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] relative">
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={60} />
      </div>
      <header className="flex justify-between items-center px-8 py-6 relative z-10">
        <div className="bg-[#0B1410] py-3 px-6 rounded-4xl flex items-center gap-5">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className="bg-[#1A2620]  text-white flex items-center space-x-2"
          >
            <span>Dashboard</span>
          </HoverBorderGradient>

          <span className="text-white">Home</span>
        </div>
        <div className="auth-area">
          <AuthButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 py-2 relative z-10">
        <Chatbot />
      </main>

      <footer className="px-8 py-6 text-center bg-white/[0.03] border-t border-white/10 relative z-10">
        <p className="text-white/60 text-sm">
          &copy; 2025 Fiducia. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
