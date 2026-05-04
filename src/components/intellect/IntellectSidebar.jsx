/**
 * IntellectSidebar — Compact vertical action bar for IntellectMode
 * H.A.R.B.O.R Chat & Orchestrator are primary — always visible with labels.
 * Secondary tools are compact icon-only buttons.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Sliders, Network, Shield, Target, Sparkles } from "lucide-react";

const PRIMARY = [
  {
    key: "chat",
    label: "H.A.R.B.O.R Chat",
    sublabel: "Multi-agent AI",
    icon: Brain,
    color: "#06b6d4",
    activeKey: "showHarborAgentChat",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.2))",
    activeBorder: "rgba(6,182,212,0.7)",
    glow: "0 0 24px rgba(6,182,212,0.35), 0 0 48px rgba(139,92,246,0.15)",
  },
  {
    key: "execute",
    label: "AI Execute",
    sublabel: "Agent task runner",
    icon: Sparkles,
    color: "#a78bfa",
    activeKey: "showAITaskRunner",
    gradient: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(6,182,212,0.15))",
    activeBorder: "rgba(167,139,250,0.7)",
    glow: "0 0 24px rgba(167,139,250,0.35)",
  },
];

const SECONDARY = [
  { key: "outcome",    label: "Digital COO",  icon: Target,   color: "#06b6d4", activeKey: "showOutcomePanel" },
  { key: "governance", label: "Governance",   icon: Shield,   color: "#10b981", activeKey: "showGovernanceCenter" },
  { key: "loadmap",    label: "Load Map",     icon: Network,  color: "#a78bfa", activeKey: null },
  { key: "agents",     label: "Agents",       icon: Sliders,  color: "#8b5cf6", activeKey: "showAgentControlPanel" },
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
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2">

      {/* ── PRIMARY BUTTONS — always show label ───────────────── */}
      {PRIMARY.map((btn, i) => {
        const Icon = btn.icon;
        const isActive = btn.activeKey ? activeMap[btn.activeKey] : false;

        return (
          <motion.button
            key={btn.key}
            onClick={() => onToggle(btn.key)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ scale: 1.03, x: -2 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl transition-all"
            style={{
              background: isActive ? btn.gradient : "rgba(5,10,25,0.88)",
              border: `1px solid ${isActive ? btn.activeBorder : btn.color + "30"}`,
              boxShadow: isActive ? btn.glow : "none",
              backdropFilter: "blur(12px)",
              minWidth: 148,
            }}
          >
            {/* Icon */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: isActive ? `${btn.color}25` : `${btn.color}12`,
                border: `1px solid ${btn.color}${isActive ? "50" : "20"}`,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: btn.color }} />
            </div>

            {/* Text */}
            <div className="text-left leading-none">
              <div
                className="text-[11px] font-bold font-mono tracking-wide"
                style={{ color: isActive ? btn.color : btn.color + "cc" }}
              >
                {btn.label}
              </div>
              <div className="text-[9px] mt-0.5 font-mono" style={{ color: "#475569" }}>
                {btn.sublabel}
              </div>
            </div>

            {/* Live dot */}
            <motion.span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: isActive ? btn.color : "#334155",
                boxShadow: isActive ? `0 0 6px ${btn.color}` : "none",
              }}
            />
          </motion.button>
        );
      })}

      {/* ── DIVIDER ───────────────────────────────────────────── */}
      <div className="w-full flex items-center gap-1.5 px-1 my-0.5">
        <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.12)" }} />
        <div className="w-1 h-1 rounded-full" style={{ background: "rgba(6,182,212,0.2)" }} />
        <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.12)" }} />
      </div>

      {/* ── SECONDARY BUTTONS — icon only with tooltip ────────── */}
      <div className="flex flex-col items-end gap-1.5">
        {SECONDARY.map((btn, i) => {
          const Icon = btn.icon;
          const isActive = btn.activeKey ? activeMap[btn.activeKey] : false;
          const isHovered = hovered === btn.key;

          return (
            <motion.div
              key={btn.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.04, duration: 0.3 }}
              className="relative flex items-center justify-end"
            >
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-10 px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap pointer-events-none"
                    style={{
                      background: "rgba(5,10,25,0.97)",
                      border: `1px solid ${btn.color}35`,
                      color: btn.color,
                    }}
                  >
                    {btn.label}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => onToggle(btn.key)}
                onMouseEnter={() => setHovered(btn.key)}
                onMouseLeave={() => setHovered(null)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: isActive ? `${btn.color}18` : "rgba(5,10,25,0.7)",
                  border: `1px solid ${isActive ? btn.color + "55" : btn.color + "20"}`,
                  boxShadow: isActive ? `0 0 10px ${btn.color}25` : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? btn.color : btn.color + "70" }} />
                {isActive && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: btn.color, boxShadow: `0 0 4px ${btn.color}` }}
                  />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}