/**
 * IntellectSidebar — Compact vertical action bar for IntellectMode
 * Replaces the scattered floating buttons with a unified, elegant sidebar
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Sliders, Network, Shield, Target, ChevronRight } from "lucide-react";

const BUTTONS = [
  {
    key: "outcome",
    label: "Digital COO",
    icon: Target,
    color: "#06b6d4",
    activeKey: "showOutcomePanel",
  },
  {
    key: "governance",
    label: "Governance",
    icon: Shield,
    color: "#10b981",
    activeKey: "showGovernanceCenter",
  },
  {
    key: "loadmap",
    label: "Load Map",
    icon: Network,
    color: "#a78bfa",
    activeKey: null,
  },
  {
    key: "agents",
    label: "Agents",
    icon: Sliders,
    color: "#8b5cf6",
    activeKey: "showAgentControlPanel",
  },
  {
    key: "execute",
    label: "AI Execute",
    icon: Zap,
    color: "#10b981",
    activeKey: "showAITaskRunner",
  },
  {
    key: "chat",
    label: "H.A.R.B.O.R",
    icon: Brain,
    color: "#06b6d4",
    activeKey: "showHarborAgentChat",
  },
];

export default function IntellectSidebar({
  showOutcomePanel,
  showGovernanceCenter,
  showAgentControlPanel,
  showAITaskRunner,
  showHarborAgentChat,
  onToggle,
}) {
  const [hovered, setHovered] = useState(null);

  const activeMap = {
    showOutcomePanel,
    showGovernanceCenter,
    showAgentControlPanel,
    showAITaskRunner,
    showHarborAgentChat,
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5">
      {BUTTONS.map((btn, i) => {
        const Icon = btn.icon;
        const isActive = btn.activeKey ? activeMap[btn.activeKey] : false;
        const isHovered = hovered === btn.key;

        return (
          <motion.div
            key={btn.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative flex items-center justify-end"
          >
            {/* Tooltip label */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-12 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none"
                  style={{
                    background: "rgba(5,10,25,0.95)",
                    border: `1px solid ${btn.color}40`,
                    color: btn.color,
                    boxShadow: `0 0 12px ${btn.color}20`,
                  }}
                >
                  {btn.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Button */}
            <motion.button
              onClick={() => onToggle(btn.key)}
              onMouseEnter={() => setHovered(btn.key)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: isActive
                  ? `${btn.color}22`
                  : "rgba(5,10,25,0.85)",
                border: `1px solid ${isActive ? btn.color + "70" : btn.color + "25"}`,
                boxShadow: isActive
                  ? `0 0 16px ${btn.color}30, inset 0 0 8px ${btn.color}10`
                  : "none",
              }}
            >
              <Icon
                className="w-4 h-4 transition-all"
                style={{ color: isActive ? btn.color : btn.color + "80" }}
              />

              {/* Active dot */}
              {isActive && (
                <motion.span
                  layoutId={`dot-${btn.key}`}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{
                    background: btn.color,
                    boxShadow: `0 0 6px ${btn.color}`,
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          </motion.div>
        );
      })}

      {/* Subtle divider line */}
      <div
        className="w-px h-6 mx-auto mt-1 rounded-full"
        style={{
          background: "linear-gradient(to bottom, rgba(6,182,212,0.3), transparent)",
          marginLeft: "auto",
          marginRight: "auto",
          width: 1,
        }}
      />
    </div>
  );
}