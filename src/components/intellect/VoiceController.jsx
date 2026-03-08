import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Settings, X, Zap, Radio, Activity } from "lucide-react";
import { toast } from "sonner";

// ── Voice Commands Mapping ─────────────────────────────────────────────────
const VOICE_COMMANDS = [
  { pattern: /^(send|send it|go|execute)$/i, action: "SEND" },
  { pattern: /^(clear|delete|erase)$/i, action: "CLEAR" },
  { pattern: /^(stop listening|cancel voice|close voice)$/i, action: "STOP" },
  { pattern: /^open (fleet|vehicles|routes|shipments|alerts|dashboard|settings)/i, action: "OPEN_WINDOW" },
  { pattern: /^(deep analysis|run analysis|analyze)$/i, action: "SEND" },
];

// ── Waveform Visualizer ────────────────────────────────────────────────────
function WaveformBars({ isActive, amplitude = 0 }) {
  const BAR_COUNT = 16;
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const centerDist = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const base = 0.15 + (1 - centerDist) * 0.4;
        return (
          <motion.div
            key={i}
            className="w-0.5 rounded-full"
            style={{ background: "linear-gradient(to top, #06b6d4, #8b5cf6)" }}
            animate={isActive ? {
              scaleY: [base, base + amplitude * (0.5 + Math.random() * 0.5), base],
              opacity: [0.5, 1, 0.5],
            } : { scaleY: 0.1, opacity: 0.2 }}
            transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, repeatType: "mirror", delay: i * 0.04 }}
          />
        );
      })}
    </div>
  );
}

// ── Transcript Bubble ─────────────────────────────────────────────────────
function TranscriptBubble({ text, isFinal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 py-2 rounded-xl text-sm font-mono max-w-xs text-center leading-snug"
      style={{
        background: isFinal ? "rgba(6,182,212,0.15)" : "rgba(139,92,246,0.1)",
        border: isFinal ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(139,92,246,0.3)",
        color: isFinal ? "#67e8f9" : "#c4b5fd",
      }}
    >
      {text || <span style={{ opacity: 0.5 }}>Listening…</span>}
    </motion.div>
  );
}

// ── Main VoiceController ───────────────────────────────────────────────────
export default function VoiceController({
  onTranscript,       // (text: string) => void  — fills input
  onSend,             // () => void              — fires processCommand
  onClose,            // () => void
  language = "da-DK", // default: Danish
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState(language);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [continuous, setContinuous] = useState(false);

  const recognitionRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── Audio amplitude via Web Audio API ─────────────────────────────────
  const startAmplitudeTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* no mic access */ }
  }, []);

  const stopAmplitudeTracking = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    setAmplitude(0);
  }, []);

  // ── Speech synthesis ──────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 1.1;
    utt.pitch = 0.9;
    window.speechSynthesis.speak(utt);
  }, [ttsEnabled, lang]);

  // ── Start / Stop recognition ──────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice input not supported in this browser"); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
      setFinalText("");
      startAmplitudeTracking();
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final) {
        setFinalText(final);
        setInterimText("");

        // Check for built-in voice commands
        const cmd = VOICE_COMMANDS.find(c => c.pattern.test(final.trim()));
        if (cmd?.action === "SEND") {
          speak("Sending command");
          onSend?.();
          return;
        }
        if (cmd?.action === "CLEAR") {
          onTranscript?.("");
          speak("Cleared");
          return;
        }
        if (cmd?.action === "STOP") {
          stopListening();
          return;
        }

        onTranscript?.(final.trim());
        setHistory(prev => [{ text: final.trim(), ts: Date.now() }, ...prev].slice(0, 10));

        if (!continuous) {
          // Auto-send short commands after a brief pause
          if (final.trim().split(" ").length > 2) {
            setTimeout(() => onSend?.(), 600);
          }
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") toast.error(`Voice error: ${e.error}`);
      setIsListening(false);
      stopAmplitudeTracking();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAmplitudeTracking();
      if (continuous && recognitionRef.current) {
        // Restart for continuous mode
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, continuous, onTranscript, onSend, speak, startAmplitudeTracking, stopAmplitudeTracking]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAmplitudeTracking();
  }, [stopAmplitudeTracking]);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Cleanup on unmount
  useEffect(() => () => { stopListening(); window.speechSynthesis?.cancel(); }, []);

  const LANGS = [
    { code: "da-DK", label: "Dansk" },
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "de-DE", label: "Deutsch" },
    { code: "sv-SE", label: "Svenska" },
    { code: "nb-NO", label: "Norsk" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3"
      style={{ minWidth: 300 }}
    >
      {/* Main panel */}
      <div
        className="relative flex flex-col items-center gap-4 px-6 py-5 rounded-2xl backdrop-blur-xl"
        style={{
          background: "rgba(2,8,20,0.92)",
          border: "1px solid rgba(6,182,212,0.35)",
          boxShadow: isListening
            ? "0 0 40px rgba(6,182,212,0.25), 0 0 80px rgba(139,92,246,0.1)"
            : "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono" style={{ color: "#06b6d4" }}>
              VOICE CONTROL
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTtsEnabled(p => !p)}
              className="p-1.5 rounded-lg transition-all hover:bg-slate-800"
              style={{ color: ttsEnabled ? "#06b6d4" : "#475569" }}
              title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowSettings(p => !p)}
              className="p-1.5 rounded-lg transition-all hover:bg-slate-800"
              style={{ color: showSettings ? "#8b5cf6" : "#475569" }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all hover:bg-red-500/20"
              style={{ color: "#64748b" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="pt-2 pb-1 border-t border-slate-800 space-y-3">
                <div>
                  <p className="text-[9px] tracking-widest uppercase font-mono text-slate-500 mb-1.5">Language</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGS.map(l => (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className="px-2 py-1 rounded text-[10px] font-mono transition-all"
                        style={{
                          background: lang === l.code ? "rgba(6,182,212,0.15)" : "rgba(30,41,59,0.6)",
                          border: `1px solid ${lang === l.code ? "rgba(6,182,212,0.5)" : "rgba(51,65,85,0.5)"}`,
                          color: lang === l.code ? "#67e8f9" : "#94a3b8",
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] tracking-widest uppercase font-mono text-slate-500">Continuous mode</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Keep listening after each command</p>
                  </div>
                  <button
                    onClick={() => setContinuous(p => !p)}
                    className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
                    style={{
                      background: continuous ? "rgba(6,182,212,0.3)" : "rgba(51,65,85,0.5)",
                      border: `1px solid ${continuous ? "rgba(6,182,212,0.5)" : "rgba(71,85,105,0.5)"}`,
                    }}
                  >
                    <motion.div
                      animate={{ x: continuous ? 16 : 2 }}
                      className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
                      style={{ background: continuous ? "#06b6d4" : "#475569" }}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform */}
        <WaveformBars isActive={isListening} amplitude={amplitude} />

        {/* Big mic button */}
        <motion.button
          onClick={toggleListening}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isListening
              ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))"
              : "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))",
            border: isListening
              ? "2px solid rgba(239,68,68,0.6)"
              : "2px solid rgba(6,182,212,0.5)",
            boxShadow: isListening
              ? "0 0 20px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.1)"
              : "0 0 20px rgba(6,182,212,0.2), inset 0 0 20px rgba(6,182,212,0.05)",
          }}
        >
          {/* Pulse ring when active */}
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(239,68,68,0.5)" }}
            />
          )}
          {isListening
            ? <MicOff className="w-6 h-6" style={{ color: "#f87171" }} />
            : <Mic className="w-6 h-6" style={{ color: "#06b6d4" }} />
          }
        </motion.button>

        {/* Transcript display */}
        <AnimatePresence mode="wait">
          {(interimText || finalText || isListening) && (
            <TranscriptBubble
              text={interimText || finalText}
              isFinal={!!finalText && !interimText}
            />
          )}
        </AnimatePresence>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={isListening ? { scale: [1, 1.4, 1], opacity: [1, 0.4, 1] } : { scale: 1, opacity: 0.3 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isListening ? "#22c55e" : "#475569" }}
          />
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: isListening ? "#86efac" : "#475569" }}>
            {isListening ? "Listening..." : "Press to speak"}
          </span>
        </div>

        {/* Voice command hints */}
        {!showSettings && (
          <div className="text-[9px] font-mono text-slate-600 text-center leading-relaxed">
            Say <span style={{ color: "#67e8f9" }}>"send"</span> to execute •{" "}
            <span style={{ color: "#67e8f9" }}>"clear"</span> to reset •{" "}
            <span style={{ color: "#67e8f9" }}>"stop listening"</span> to close
          </div>
        )}
      </div>

      {/* Recent transcripts */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full px-3 py-2 rounded-xl text-[9px] font-mono space-y-0.5"
          style={{ background: "rgba(2,8,20,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}
        >
          <p className="text-slate-600 uppercase tracking-widest mb-1">Recent</p>
          {history.slice(0, 3).map((h, i) => (
            <p key={i} style={{ color: i === 0 ? "#67e8f9" : "#475569" }} className="truncate">
              › {h.text}
            </p>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}