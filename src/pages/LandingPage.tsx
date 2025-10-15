import Beams from "../components/Beams";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "../lib/utils";

function LandingPage() {
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
        overflow: "hidden",
      }}
    >
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

      <div
        className="relative z-10 container mx-auto px-4 md:px-6 flex items-center justify-center"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          minHeight: "100vh",
          paddingTop: "120px",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            // @ts-ignore
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.5] mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 fill-rose-500/80" />
            <span className="text-sm text-white/80 tracking-wide">Fiducia</span>
          </motion.div>

          <motion.div
            custom={1}
            // @ts-ignore
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                A3A
              </span>
              <br />
              <span
                className={cn(
                  "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 "
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
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Secure daily AI-to-Ai communication & payments under Web3 for
              Fiducia Agents.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
