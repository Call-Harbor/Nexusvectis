import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COMMANDS_BY_LANGUAGE = {
  da: {
    lang: "da-DK",
    langName: "Dansk",
    commands: [
      { 
        trigger: ["vis flåde status", "show fleet", "fleet status"],
        action: "SHOW_FLEET",
        response: "Åbner flåde hologram dashboard",
        responseSpeech: "Fleet hologram dashboard åbnet"
      },
      {
        trigger: ["analyser dsv", "analyze dsv", "dsv kunde"],
        action: "ANALYZE_DSV",
        response: "Analyserer DSV som kunde",
        responseSpeech: "DSV firma analyse startet med fire hologrammer"
      },
      {
        trigger: ["optimer ruter", "optimize routes", "trafikkaos"],
        action: "OPTIMIZE_ROUTES",
        response: "Aktiverer Swarm Intelligence for ruteoptimerning",
        responseSpeech: "Swarm Intelligence koordinering aktiveret"
      }
    ],
    listeningText: "Lytter...",
    helpText: "Sig: 'vis flåde status', 'analyser DSV', eller 'optimer ruter'"
  },
  en: {
    lang: "en-US",
    langName: "English",
    commands: [
      { 
        trigger: ["show fleet", "fleet status", "display fleet"],
        action: "SHOW_FLEET",
        response: "Opening fleet hologram dashboard",
        responseSpeech: "Fleet hologram dashboard opened"
      },
      {
        trigger: ["analyze dsv", "dsv customer", "dsv analysis"],
        action: "ANALYZE_DSV",
        response: "Analyzing DSV as customer",
        responseSpeech: "DSV company analysis started with four holograms"
      },
      {
        trigger: ["optimize routes", "route optimization", "traffic chaos"],
        action: "OPTIMIZE_ROUTES",
        response: "Activating Swarm Intelligence for route optimization",
        responseSpeech: "Swarm Intelligence coordination activated"
      }
    ],
    listeningText: "Listening...",
    helpText: "Say: 'show fleet status', 'analyze DSV', or 'optimize routes'"
  },
  de: {
    lang: "de-DE",
    langName: "Deutsch",
    commands: [
      { 
        trigger: ["zeige flotte status", "flotte anzeigen", "flottenstatus"],
        action: "SHOW_FLEET",
        response: "Öffne Flotten-Hologramm-Dashboard",
        responseSpeech: "Flotten Hologramm Dashboard geöffnet"
      },
      {
        trigger: ["analysiere dsv", "dsv kunde", "dsv analyse"],
        action: "ANALYZE_DSV",
        response: "Analysiere DSV als Kunde",
        responseSpeech: "DSV Firma Analyse mit vier Hologrammen gestartet"
      },
      {
        trigger: ["optimiere routen", "routenoptimierung", "verkehrschaos"],
        action: "OPTIMIZE_ROUTES",
        response: "Aktiviere Schwarm-Intelligenz für Routenoptimierung",
        responseSpeech: "Schwarm Intelligenz Koordinierung aktiviert"
      }
    ],
    listeningText: "Höre zu...",
    helpText: "Sagen Sie: 'Zeige Flottenstatus', 'Analysiere DSV', oder 'Optimiere Routen'"
  },
  fr: {
    lang: "fr-FR",
    langName: "Français",
    commands: [
      { 
        trigger: ["afficher statut flotte", "afficher flotte", "statut flotte"],
        action: "SHOW_FLEET",
        response: "Ouverture du tableau de bord holographique de la flotte",
        responseSpeech: "Tableau de bord holographique de la flotte ouvert"
      },
      {
        trigger: ["analyser dsv", "client dsv", "analyse dsv"],
        action: "ANALYZE_DSV",
        response: "Analyse de DSV en tant que client",
        responseSpeech: "Analyse d'entreprise DSV démarrée avec quatre hologrammes"
      },
      {
        trigger: ["optimiser itinéraires", "optimisation d'itinéraires", "chaos trafic"],
        action: "OPTIMIZE_ROUTES",
        response: "Activation de l'intelligence collective pour l'optimisation des itinéraires",
        responseSpeech: "Coordination de l'intelligence collective activée"
      }
    ],
    listeningText: "Écoute...",
    helpText: "Dites: 'afficher statut flotte', 'analyser DSV', ou 'optimiser itinéraires'"
  },
  es: {
    lang: "es-ES",
    langName: "Español",
    commands: [
      { 
        trigger: ["mostrar estado flota", "mostrar flota", "estado flota"],
        action: "SHOW_FLEET",
        response: "Abriendo panel holográfico de flota",
        responseSpeech: "Panel holográfico de flota abierto"
      },
      {
        trigger: ["analizar dsv", "cliente dsv", "análisis dsv"],
        action: "ANALYZE_DSV",
        response: "Analizando DSV como cliente",
        responseSpeech: "Análisis de empresa DSV iniciado con cuatro hologramas"
      },
      {
        trigger: ["optimizar rutas", "optimización de rutas", "caos tráfico"],
        action: "OPTIMIZE_ROUTES",
        response: "Activando inteligencia de enjambre para optimización de rutas",
        responseSpeech: "Coordinación de inteligencia de enjambre activada"
      }
    ],
    listeningText: "Escuchando...",
    helpText: "Diga: 'mostrar estado flota', 'analizar DSV', u 'optimizar rutas'"
  }
};

export default function MultilingualVoiceCommands({ onCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState(null);
  const [language, setLanguage] = useState(detectBrowserLanguage());
  const recognitionRef = useRef(null);
  const synth = useRef(null);

  function detectBrowserLanguage() {
    const lang = navigator.language?.split('-')[0];
    return COMMANDS_BY_LANGUAGE[lang] ? lang : 'en';
  }

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = COMMANDS_BY_LANGUAGE[language].lang;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            processCommand(text);
          } else {
            interim += text;
          }
        }
        if (interim) setTranscript(interim);
      };
    }
  }, [language]);

  const processCommand = (text) => {
    const cmdSet = COMMANDS_BY_LANGUAGE[language].commands;
    for (const cmd of cmdSet) {
      if (cmd.trigger.some(t => text.includes(t))) {
        setLastCommand(cmd);
        speakResponse(cmd.responseSpeech);
        setTimeout(() => {
          onCommand(cmd.action, cmd.response);
          setTranscript("");
        }, 800);
        return;
      }
    }
  };

  const speakResponse = (text) => {
    if (!synth.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = COMMANDS_BY_LANGUAGE[language].lang;
    utterance.rate = 0.95;
    synth.current.cancel();
    synth.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const langConfig = COMMANDS_BY_LANGUAGE[language];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40"
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={`p-4 rounded-full shadow-xl transition-all ${
              isListening
                ? "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50 animate-pulse"
                : "bg-gradient-to-r from-cyan-500 to-violet-500 shadow-cyan-500/50 hover:shadow-cyan-500/70"
            }`}
          >
            {isListening ? (
              <Mic className="w-6 h-6 text-white animate-bounce" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium cursor-pointer hover:border-cyan-500/50 transition-colors"
          >
            {Object.entries(COMMANDS_BY_LANGUAGE).map(([code, cfg]) => (
              <option key={code} value={code}>{cfg.langName}</option>
            ))}
          </select>
        </div>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-4 w-80 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, 24, 8] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-gradient-to-t from-cyan-500 to-violet-500 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-cyan-300">{langConfig.listeningText}</span>
              </div>

              {transcript && (
                <p className="text-xs text-white mb-2 italic p-2 bg-slate-800/50 rounded">"{transcript}"</p>
              )}

              {lastCommand && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg">
                  <p className="text-xs text-emerald-300 font-semibold">{lastCommand.response}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-3">
                {langConfig.helpText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}