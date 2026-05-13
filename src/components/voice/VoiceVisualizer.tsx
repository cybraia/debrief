"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type Props = {
  vadScore: number;
  audioLevel: number;
  mode: "idle" | "listening" | "speaking" | "thinking";
};

export function VoiceVisualizer({ vadScore, audioLevel, mode }: Props) {
  const userSpring = useSpring(0, { stiffness: 180, damping: 22, mass: 0.4 });
  const agentSpring = useSpring(0, { stiffness: 200, damping: 24, mass: 0.35 });

  useEffect(() => {
    userSpring.set(Math.min(1, vadScore * 1.4));
  }, [vadScore, userSpring]);

  useEffect(() => {
    agentSpring.set(Math.min(1, audioLevel * 1.2));
  }, [audioLevel, agentSpring]);

  const userScale = useTransform(userSpring, [0, 1], [1, 1.22]);
  const agentScale = useTransform(agentSpring, [0, 1], [1, 1.18]);
  const coreGlow = mode === "speaking" ? 1 : mode === "listening" ? 0.65 : 0.35;

  return (
    <div className="relative flex h-52 w-52 items-center justify-center md:h-64 md:w-64">
      <motion.div
        className="absolute rounded-full border border-cyan-400/25"
        style={{ scale: userScale }}
        animate={{ opacity: 0.35 + vadScore * 0.5 }}
      />
      <motion.div
        className="absolute h-[78%] w-[78%] rounded-full border border-sky-300/30"
        style={{ scale: agentScale }}
        animate={{ opacity: 0.25 + audioLevel * 0.55 }}
      />
      <motion.div
        className="absolute h-[52%] w-[52%] rounded-full bg-gradient-to-br from-cyan-500/30 via-sky-500/15 to-transparent blur-[2px]"
        animate={{
          scale: [1, 1.04 + coreGlow * 0.06, 1],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative h-24 w-24 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(56,189,248,0.45),rgba(15,23,42,0.95))] shadow-[0_0_40px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/50" />
    </div>
  );
}
