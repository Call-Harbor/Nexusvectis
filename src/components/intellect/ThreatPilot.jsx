import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Shield, AlertTriangle, MapPin, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ThreatAlert = ({ threat, onDismiss }) => {
  const synthRef = useRef(window.speechSynthesis);
  const typeConfig = {
    gps_spoof: {
      icon: MapPin,
      color: 'from-red-500 to-orange-500',
      title: 'GPS-Spoofing Detekteret',
      severity: 'KRITISK'
    },
    brute_force: {
      icon: Lock,
      color: 'from-orange-500 to-yellow-500',
      title: 'Brute Force Angreb',
      severity: 'ALT'
    },
    neuro_risk: {
      icon: AlertTriangle,
      color: 'from-yellow-500 to-amber-500',
      title: 'Neuro-Risk Alarm',
      severity: 'HØJTPRIORITERET'
    }
  };

  const config = typeConfig[threat.type] || typeConfig.neuro_risk;
  const Icon = config.icon;

  useEffect(() => {
    speak(threat.voiceAlert);
  }, [threat.voiceAlert]);

  const speak = (text) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'da-DK';
    utterance.rate = 0.95;
    synthRef.current.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`bg-gradient-to-br ${config.color} rounded-xl p-4 text-white max-w-md shadow-2xl border border-white/20`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base">{config.title}</h3>
            <span className="text-xs font-semibold bg-black/30 px-2 py-0.5 rounded">
              {config.severity}
            </span>
          </div>
          <p className="text-sm mb-3 opacity-95">{threat.message}</p>
          <div className="text-xs space-y-1 opacity-90 mb-3">
            {threat.details && threat.details.map((detail, i) => (
              <p key={i}>• {detail}</p>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDismiss(threat.id)}
              className="text-xs px-3 py-1 rounded bg-black/30 hover:bg-black/50 transition-colors font-medium"
            >
              Bekræftet
            </button>
            <button
              onClick={() => speak(threat.voiceAlert)}
              className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors font-medium"
            >
              Gentag Alert
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ThreatPilot() {
  const [threats, setThreats] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const threatIdRef = useRef(0);

  useEffect(() => {
    // Simulate threat detection
    const simulateThreats = () => {
      const threatChance = Math.random();
      if (threatChance < 0.15) {
        const threatTypes = [
          {
            type: 'gps_spoof',
            message: 'Lastbil #47 - GPS-signal anomali detekteret på rute København-Odense',
            voiceAlert: 'Advarsel: GPS-spoofing detekteret på lastbil nummer 47. Position ukendt. Handler straks.',
            details: ['Signal-anomali: -45 dB', 'Lokation: 55.4°N, 12.1°E', 'Varighed: 12 sekunder']
          },
          {
            type: 'brute_force',
            message: 'API-endpoint angreb fra IP-adresse 195.154.x.x. Automatisk blokeret.',
            voiceAlert: 'Sikkerhedsadvarsel: Brute force angreb detekteret på API fra Rusland. Forbindelse blokeret. System er sikret.',
            details: ['Forsøg: 2,847 per minut', 'IP: Rusland', 'Status: Auto-blokeret']
          },
          {
            type: 'neuro_risk',
            message: 'Neuro-Risk Score: 92/100 - Trusselpostur broadcast til alle systemer',
            voiceAlert: 'Kritisk: Neuro-risk score 92 ud af 100. Threat posture broadcast til alle systemer. Eskaleringsniveau: Maksimum.',
            details: ['Confidence: 92%', 'Trend: Stigende', 'Reaktionstid: 4.2 sekunder']
          }
        ];

        const selectedThreat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
        const newThreat = {
          id: threatIdRef.current++,
          ...selectedThreat,
          timestamp: new Date()
        };

        setThreats(prev => [newThreat, ...prev.slice(0, 4)]);
        setRiskScore(Math.min(100, riskScore + Math.random() * 30));
      }
    };

    const interval = setInterval(simulateThreats, 8000);
    return () => clearInterval(interval);
  }, [riskScore]);

  const dismissThreat = (id) => {
    setThreats(prev => prev.filter(t => t.id !== id));
    setRiskScore(Math.max(0, riskScore - 10));
  };

  const getRiskColor = () => {
    if (riskScore < 30) return 'from-green-500 to-emerald-500';
    if (riskScore < 60) return 'from-yellow-500 to-amber-500';
    if (riskScore < 85) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-700';
  };

  return (
    <div className="fixed top-24 right-6 z-50 max-w-md">
      {/* Risk Score Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-gradient-to-r ${getRiskColor()} rounded-xl p-3 mb-3 text-white border border-white/20 shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold text-sm">Threat Posture</span>
          </div>
          <span className="text-lg font-bold">{Math.round(riskScore)}/100</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-1.5 mt-2">
          <motion.div
            animate={{ width: `${riskScore}%` }}
            transition={{ duration: 0.5 }}
            className={`bg-white h-full rounded-full`}
          />
        </div>
      </motion.div>

      {/* Threat Alerts Stack */}
      <AnimatePresence mode="popLayout">
        {threats.map((threat) => (
          <div key={threat.id} className="mb-3">
            <ThreatAlert threat={threat} onDismiss={dismissThreat} />
          </div>
        ))}
      </AnimatePresence>

      {threats.length === 0 && riskScore < 30 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-slate-400 mt-2"
        >
          ✓ Alle systemer sikret
        </motion.div>
      )}
    </div>
  );
}