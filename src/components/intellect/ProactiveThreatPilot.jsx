import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Shield, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedThreatDetection } from "./AdvancedThreatDetection";

const THREAT_SCENARIOS_BY_LANGUAGE = {
  da: [
    {
      id: 1,
      title: "GPS-spoofing detekteret",
      message: "GPS-signal kompromitteret på lastbil #47 – Position fejler 2.3 km",
      severity: "critical",
      speech: "Sir, GPS-spoofing detekteret på lastbil nummer 47. Position fejler 2 komma 3 kilometer"
    },
    {
      id: 2,
      title: "Brute force attack",
      message: "Multiple failed login attempts fra Rusland – auto-blocked",
      severity: "critical",
      speech: "Brute force attack på API fra Rusland. Automatisk blokeret. Truslen er nu lukket"
    },
    {
      id: 3,
      title: "Høj neuro-risiko",
      message: "Neuro-risk score 92/100 – Chaufør skal holde pause nu",
      severity: "high",
      speech: "Neuro-risk score 92 ud af 100. Threat posture udsendelse. Chaufør skal holde pause nu"
    },
    {
      id: 4,
      title: "Uautoriseret adgang",
      message: "Uautoriseret adgang til Fleet API fra IP 192.168.1.100",
      severity: "critical",
      speech: "Uautoriseret adgang til Fleet API. IP-adresse er blokeret permanent"
    }
  ],
  en: [
    {
      id: 1,
      title: "GPS spoofing detected",
      message: "GPS signal compromised on truck #47 – Position error 2.3 km",
      severity: "critical",
      speech: "Sir, GPS spoofing detected on truck number 47. Position error 2 point 3 kilometers"
    },
    {
      id: 2,
      title: "Brute force attack",
      message: "Multiple failed login attempts from Russia – auto-blocked",
      severity: "critical",
      speech: "Brute force attack on API from Russia. Automatically blocked. Threat is now closed"
    },
    {
      id: 3,
      title: "High neuro-risk",
      message: "Neuro-risk score 92/100 – Driver must take break now",
      severity: "high",
      speech: "Neuro-risk score 92 out of 100. Threat posture broadcast. Driver must take break now"
    },
    {
      id: 4,
      title: "Unauthorized access",
      message: "Unauthorized access to Fleet API from IP 192.168.1.100",
      severity: "critical",
      speech: "Unauthorized access to Fleet API. IP address is now permanently blocked"
    }
  ],
  de: [
    {
      id: 1,
      title: "GPS-Spoofing erkannt",
      message: "GPS-Signal gefährdet auf Lastkraftwagen #47 – Positionsfehler 2,3 km",
      severity: "critical",
      speech: "Sir, GPS-Spoofing auf Lastkraftwagen Nummer 47 erkannt. Positionsfehler 2 Komma 3 Kilometer"
    },
    {
      id: 2,
      title: "Brute-Force-Angriff",
      message: "Mehrere fehlgeschlagene Anmeldeversuche aus Russland – automatisch blockiert",
      severity: "critical",
      speech: "Brute Force Angriff auf API aus Russland. Automatisch blockiert. Bedrohung ist jetzt geschlossen"
    },
    {
      id: 3,
      title: "Hohe Neuro-Risiko",
      message: "Neuro-Risiko-Bewertung 92/100 – Fahrer muss jetzt Pause machen",
      severity: "high",
      speech: "Neuro Risiko Score 92 von 100. Bedrohungsstatus übertragen. Fahrer muss jetzt Pause machen"
    },
    {
      id: 4,
      title: "Unbefugter Zugriff",
      message: "Unbefugter Zugriff auf Fleet API von IP 192.168.1.100",
      severity: "critical",
      speech: "Unbefugter Zugriff auf Fleet API. IP-Adresse ist jetzt dauerhaft blockiert"
    }
  ],
  fr: [
    {
      id: 1,
      title: "Usurpation GPS détectée",
      message: "Signal GPS compromis sur le camion #47 – Erreur de position 2,3 km",
      severity: "critical",
      speech: "Monsieur, usurpation GPS détectée sur le camion numéro 47. Erreur de position 2 virgule 3 kilomètres"
    },
    {
      id: 2,
      title: "Attaque par force brute",
      message: "Plusieurs tentatives de connexion échouées depuis la Russie – bloquées automatiquement",
      severity: "critical",
      speech: "Attaque par force brute sur API depuis la Russie. Bloquée automatiquement. La menace est maintenant fermée"
    },
    {
      id: 3,
      title: "Neuro-risque élevé",
      message: "Score neuro-risque 92/100 – Le conducteur doit faire une pause maintenant",
      severity: "high",
      speech: "Score neuro-risque 92 sur 100. Diffusion de la posture de menace. Le conducteur doit faire une pause maintenant"
    },
    {
      id: 4,
      title: "Accès non autorisé",
      message: "Accès non autorisé à l'API Fleet depuis l'IP 192.168.1.100",
      severity: "critical",
      speech: "Accès non autorisé à l'API Fleet. L'adresse IP est maintenant bloquée de manière permanente"
    }
  ],
  es: [
    {
      id: 1,
      title: "Suplantación de GPS detectada",
      message: "Señal GPS comprometida en camión #47 – Error de posición 2,3 km",
      severity: "critical",
      speech: "Señor, suplantación de GPS detectada en camión número 47. Error de posición 2 punto 3 kilómetros"
    },
    {
      id: 2,
      title: "Ataque de fuerza bruta",
      message: "Múltiples intentos de inicio de sesión fallidos desde Rusia – bloqueados automáticamente",
      severity: "critical",
      speech: "Ataque de fuerza bruta en API desde Rusia. Bloqueado automáticamente. La amenaza ahora está cerrada"
    },
    {
      id: 3,
      title: "Neuro-riesgo alto",
      message: "Puntuación neuro-riesgo 92/100 – El conductor debe descansar ahora",
      severity: "high",
      speech: "Puntuación neuro-riesgo 92 de 100. Difusión de postura de amenaza. El conductor debe descansar ahora"
    },
    {
      id: 4,
      title: "Acceso no autorizado",
      message: "Acceso no autorizado a Fleet API desde IP 192.168.1.100",
      severity: "critical",
      speech: "Acceso no autorizado a Fleet API. La dirección IP ahora está bloqueada permanentemente"
    }
  ]
};

function detectBrowserLanguage() {
  const lang = navigator.language?.split('-')[0];
  return THREAT_SCENARIOS_BY_LANGUAGE[lang] ? lang : 'en';
}

export default function ProactiveThreatPilot() {
  const [threats, setThreats] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [language, setLanguage] = useState(detectBrowserLanguage());
  const synth = useRef(null);
  const hasSpoken = useRef(new Set());

  useEffect(() => {
    synth.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.75 && threats.length < 3) {
        const threatList = THREAT_SCENARIOS_BY_LANGUAGE[language];
        const randomThreat = threatList[Math.floor(Math.random() * threatList.length)];
        
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
  }, [threats.length, language]);

  const speakThreat = (threat) => {
    if (!synth.current) return;
    const utterance = new SpeechSynthesisUtterance(threat.speech);
    
    const langMap = { da: 'da-DK', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    utterance.lang = langMap[language] || 'en-US';
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