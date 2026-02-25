import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THREAT_SCENARIOS = [
  {
    id: 1,
    title: "GPS-spoofing detekteret",
    message: "GPS-signal kompromitteret på lastbil #47 – Position fejler 2.3 km",
    severity: "critical",
    speechDanish: "Sir, GPS-spoofing detekteret på lastbil nummer 47. Position fejler 2 komma 3 kilometer"
  },
  {
    id: 2,
    title: "Brute force attack",
    message: "Multiple failed login attempts fra Rusland – auto-blocked",
    severity: "critical",
    speechDanish: "Brute force attack på API fra Rusland. Automatisk blokeret. Trueanmodning er nu lukket"
  },
  {
    id: 3,
    title: "Høj neuro-risiko",
    message: "Neuro-risk score 92/100 – Chaufør skal holde pause nu",
    severity: "high",
    speechDanish: "Neuro-risk score 92 ud af 100. Threat posture udsendelse. Chaufør skal holde pause nu"
  },
  {
    id: 4,
    title: "Uautoriseret adgang",
    message: "Uautoriseret adgang til Fleet API fra IP 192.168.1.100",
    severity: "critical",
    speechDanish: "Uautoriseret adgang til Fleet API. IP-adresse er blokeret permanent"
  }
];

export default function ProactiveThreatPilot() {
  const [threats, setThreats] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const synth = useRef(null);
  const hasSpoken = useRef(new Set());

  useEffect(() => {
    synth.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.75 && threats.length < 3) {
        const randomThreat = THREAT_SCENARIOS[Math.floor(Math.random() * THREAT_SCENARIOS.length)];
        
        // Avoid duplicate alerts
        if (!hasSpoken.current.has(randomThreat.id)) {
          hasSpoken.current.add(randomThreat.id);
          const newThreat = { ...randomThreat, timestamp: Date.now() };
          setThreats(prev => [newThreat, ...prev].slice(0, 4));
          setActiveAlert(newThreat);
          speakThreat(newThreat);
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [threats.length]);

  const speakThreat = (threat) => {
    if (!synth.current) return;
    const utterance = new SpeechSynthesisUtterance(threat.speechDanish);
    utterance.lang = "da-DK";
    utterance.rate = 1.1;
    utterance.pitch = threat.severity === "critical" ? 1.2 : 1;
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
      default:
        return "from-yellow-600 to-yellow-700 border-yellow-500";
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl border border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/20 z-30 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400 animate-pulse" />
          <h3 className="text-sm font-bold text-red-200">THREAT PILOT</h3>
          <div className="ml-auto text-xs text-red-300 font-mono">AKTIV</div>
        </div>
      </div>

      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`m-3 p-3 bg-gradient-to-r ${getSeverityColor(activeAlert.severity)} rounded-xl border-2 shadow-lg`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-white mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{activeAlert.title}</p>
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
            <p className="text-xs font-semibold text-white">{threat.title}</p>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{threat.message}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}