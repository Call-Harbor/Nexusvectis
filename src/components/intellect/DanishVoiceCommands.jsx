import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DANISH_COMMANDS = [
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
];

export default function DanishVoiceCommands({ onCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState(null);
  const recognitionRef = useRef(null);
  const synth = useRef(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "da-DK";

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
  }, []);

  const processCommand = (text) => {
    for (const cmd of DANISH_COMMANDS) {
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
    utterance.lang = "da-DK";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40"
    >
      <div className="flex flex-col gap-3">
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

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-4 w-72 shadow-xl"
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
                <span className="text-xs font-semibold text-cyan-300">Lytter...</span>
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
                Sig: "vis flåde status", "analyser DSV", eller "optimer ruter"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}