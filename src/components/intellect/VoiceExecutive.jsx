import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VOICE_COMMANDS = [
  { trigger: "show fleet", command: "SHOW_FLEET_STATUS", response: "Displaying fleet status dashboard" },
  { trigger: "analyze dsv", command: "ANALYZE_DSV", response: "Analyzing DSV company data" },
  { trigger: "optimize routes", command: "OPTIMIZE_ROUTES", response: "Optimizing routes for efficiency" },
  { trigger: "swarm intelligence", command: "ACTIVATE_SWARM", response: "Activating swarm coordination" },
  { trigger: "threat status", command: "THREAT_STATUS", response: "Showing threat pilot status" },
  { trigger: "hologram dashboard", command: "SHOW_FLEET_STATUS", response: "Opening hologram dashboard" },
];

export default function VoiceExecutive({ onVoiceCommand, isListening, setIsListening }) {
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const recognitionRef = useRef(null);
  const synth = useRef(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    // Initialize Speech Recognition
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            processVoiceInput(text);
          } else {
            interim += text;
          }
        }
        if (interim) setTranscript(interim);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Voice error:", event.error);
      };
    }
  }, []);

  const processVoiceInput = (text) => {
    const lowerText = text.toLowerCase();
    setTranscript(text);

    for (const cmd of VOICE_COMMANDS) {
      if (lowerText.includes(cmd.trigger)) {
        setIsProcessing(true);
        setLastCommand({ command: cmd.command, response: cmd.response });

        // Speak response
        speakResponse(cmd.response);

        // Execute command
        setTimeout(() => {
          onVoiceCommand(cmd.command);
          setIsProcessing(false);
          setTranscript("");
        }, 1500);

        return;
      }
    }

    // No command matched - give feedback
    speakResponse("Command not recognized. Try 'show fleet', 'analyze DSV', or 'optimize routes'");
  };

  const speakResponse = (text) => {
    if (!synth.current) return;

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = text;
    utterance.rate = 0.9;
    utterance.pitch = 1;

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
        {/* Voice Control Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleListening}
          className={`p-3 rounded-full shadow-lg transition-all ${
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

        {/* Status Card */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 w-64 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, 20, 8] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-gradient-to-t from-cyan-500 to-violet-500 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-cyan-300">Listening...</span>
              </div>

              {transcript && (
                <p className="text-xs text-white mb-2 italic">"{transcript}"</p>
              )}

              {lastCommand && !isProcessing && (
                <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-xs text-emerald-300 font-semibold">{lastCommand.response}</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-violet-400 animate-spin" />
                  <span className="text-xs text-violet-300">Processing...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}