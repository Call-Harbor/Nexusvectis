import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THREAT_SCENARIOS = [
  { id: 1, name: "GPS Spoofing Detected", severity: "critical", message: "Vehicle GPS signal compromised on Route-5" },
  { id: 2, name: "Brute Force Attack", severity: "high", message: "Multiple failed login attempts detected" },
  { id: 3, name: "High Neuro-Risk Score", severity: "medium", message: "Driver cognitive load at 89% - recommend break" },
  { id: 4, name: "Unauthorized Access", severity: "critical", message: "Unauthorized access attempt to Fleet API" },
  { id: 5, name: "Fuel Anomaly", severity: "medium", message: "Unusual fuel consumption pattern detected" },
];

export default function ThreatPilot() {
  const [threats, setThreats] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const synth = useRef(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;
  }, []);

  // Simulate threat detection
  useEffect(() => {
    const threatInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomThreat = THREAT_SCENARIOS[Math.floor(Math.random() * THREAT_SCENARIOS.length)];
        const newThreat = { ...randomThreat, timestamp: Date.now() };
        setThreats((prev) => [newThreat, ...prev].slice(0, 3));
        setActiveAlert(newThreat);

        // Voice alert
        speakThreat(newThreat);
      }
    }, 8000);

    return () => clearInterval(threatInterval);
  }, []);

  const speakThreat = (threat) => {
    if (!synth.current) return;

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = `THREAT ALERT! ${threat.name}. ${threat.message}`;
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 1;

    synth.current.cancel();
    synth.current.speak(utterance);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "from-red-600 to-red-700 border-red-500";
      case "high":
        return "from-orange-600 to-orange-700 border-orange-500";
      case "medium":
        return "from-yellow-600 to-yellow-700 border-yellow-500";
      default:
        return "from-blue-600 to-blue-700 border-blue-500";
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl border border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/20 z-30 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400 animate-pulse" />
          <h3 className="text-sm font-bold text-red-200">THREAT PILOT</h3>
          <div className="ml-auto text-xs text-red-300 font-mono">ACTIVE</div>
        </div>
      </div>

      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`m-3 p-3 bg-gradient-to-r ${getSeverityColor(
              activeAlert.severity
            )} rounded-xl border-2 shadow-lg`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-white mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{activeAlert.name}</p>
                <p className="text-xs text-white/90 mt-1">{activeAlert.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-2 max-h-64 overflow-y-auto space-y-2">
        {threats.map((threat) => (
          <motion.div
            key={threat.timestamp}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <Zap className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                threat.severity === "critical"
                  ? "text-red-400"
                  : threat.severity === "high"
                  ? "text-orange-400"
                  : "text-yellow-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{threat.name}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">{threat.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}