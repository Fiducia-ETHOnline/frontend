import Beams from "../components/Beams";
import { motion } from "framer-motion";
import { Circle, Github,  } from "lucide-react";
import { cn } from "../lib/utils";
import {useNavigate} from "react-router-dom";
import { Features } from "../components/blocks/features-8";
import DarkVeil from "../components/DarkVeil";
import CustomerAgentImg from "../assets/A3A_Customer.png";
import MerchantAgentImg from "../assets/A3A_merchant.png";
import TeamImg from "../assets/team.png";
import A3ALogo from "../assets/A3A_logo.png";
import AuthButton from "../components/AuthButton";
import { StardustButton } from "@/components/ui/stardust-button";

function LandingPage() {
  const navigate = useNavigate();
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };


  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={16}
          lightColor="#469b6d"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={20}
        />
      </div>

      {/* Top Bar with Logo and Auth Button */}
      <div className="relative z-20 flex justify-between items-center px-4 md:px-8 py-4 md:py-6">
        <img
          src={A3ALogo}
          alt="A3A Logo"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full"
        />
        <AuthButton />
      </div>

      <div className="relative z-10 -mt-30">
        {/* Hero Section */}
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-center" style={{ minHeight: "100vh", paddingTop: "60px" }}>
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              custom={0}
              // @ts-ignore
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.5] mb-6 md:mb-12 cursor-pointer"
            >
              <Circle className="h-2 w-2 fill-emerald-500/80" />
              <span className="text-sm text-white/80 tracking-wide" onClick={() => navigate('/home')}>Fiducia</span>
            </motion.div>

            <motion.div
              custom={1}
              // @ts-ignore
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-4 md:mb-8 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                  A3A
                </span>
                <br />
                <span
                  className={cn(
                    "bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-white/90 to-emerald-600 "
                  )}
                >
                  Protocol
                </span>
              </h1>


            </motion.div>

            <motion.div
              custom={2}
              // @ts-ignore
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-sm sm:text-base md:text-xl text-white/80 mb-6 md:mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-2 md:px-4">
                Secure daily AI-to-AI communication & payments under Web3 for Fiducia Agents.
              </p>
               <StardustButton    onClick={() => navigate("/home")} className="cursor-pointer">
                 Launch App
               </StardustButton>
            </motion.div>

          </div>
        </div>

        {/* Features Section */}
        <div className="relative">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.3 }}>
            <DarkVeil
              hueShift={180}
              noiseIntensity={0.05}
              scanlineIntensity={0.1}
              speed={0.3}
              scanlineFrequency={0.5}
              warpAmount={0.5}
              resolutionScale={0.5}
            />
          </div>
          <div className="relative z-10">
            <Features />
          </div>
        </div>

        {/* Agent Cards Section */}
        <div className="relative py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-white to-emerald-400"
            >
              Explore Our AI Agents
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onClick={() => window.open('https://agentverse.ai/agents/details/agent1qvuadg2lwxfyjkuzny0mj6v7v4xkecdk2at3fgvrwjr7mpjtcqqq2j0y8up/profile', '_blank')}
                className="cursor-pointer"
              >
                <div className="group w-full overflow-hidden rounded-lg md:rounded-xl border-2 border-emerald-800 backdrop-blur-xl bg-white/[0.05] text-card-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-emerald-600 hover:scale-105">
                  <div className="overflow-hidden h-48 md:h-56">
                    <img
                      src={CustomerAgentImg}
                      alt="A3A Customer Agent"
                      className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2 p-4 md:p-5">
                    <h3 className="text-base md:text-lg font-semibold tracking-tight text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      A3A Customer Agent
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                      Intelligent assistant that helps you discover items, checks merchant menus, finds the best options within your budget, and prepares your order for seamless payment.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onClick={() => window.open('https://agentverse.ai/agents/details/agent1qf9ua6p2gz6nx47emvsf5d9840h7wpfwlcqhsqt4zz0dun8tj43l23jtuch/profile', '_blank')}
                className="cursor-pointer"
              >
                <div className="group w-full overflow-hidden rounded-lg md:rounded-xl border-2 border-emerald-800 backdrop-blur-xl bg-white/[0.05] text-card-foreground shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-emerald-600 hover:scale-105">
                  <div className="overflow-hidden h-48 md:h-56">
                    <img
                      src={MerchantAgentImg}
                      alt="A3A Merchant Agent"
                      className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2 p-4 md:p-5">
                    <h3 className="text-base md:text-lg font-semibold tracking-tight text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      A3A Merchant Agent
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                      Smart merchant assistant that showcases live menus, provides real-time pricing, suggests alternatives, and responds with clear recommendations for quick decisions.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="relative py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <div className="rounded-lg md:rounded-xl border-2 border-emerald-800 backdrop-blur-xl bg-white/[0.05] overflow-hidden shadow-2xl">
                <img
                  src={TeamImg}
                  alt="A3A Team"
                  className="w-full h-auto object-cover !scale-102"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative border-t border-emerald-900/30 backdrop-blur-sm py-6 md:py-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <Circle className="h-2.5 md:h-3 w-2.5 md:w-3 fill-emerald-500 text-emerald-500" />
                <span className="text-base md:text-lg font-semibold bg-clip-text text-transparent bg-emerald-600">
                  A3A Protocol
                </span>
              </div>

              {/* Social Links */}
              <div className="flex gap-2 md:gap-3">
                <a
                  href="https://github.com/Fiducia-ETHOnline"
                  className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 md:h-5 w-4 md:w-5" />
                </a>
              </div>

              {/* Copyright */}
              <p className="text-xs md:text-sm text-gray-500 text-center md:text-left">
                © {new Date().getFullYear()} A3A Protocol
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
