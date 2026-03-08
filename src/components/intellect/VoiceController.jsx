import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Volume2, VolumeX, X, ChevronRight,
  Zap, Radio, Sparkles, Brain, BarChart3, Truck,
  AlertTriangle, Package, Route, Settings, Globe,
  MessageSquare, LayoutDashboard, FileText, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { harborSpeak, getBestFemaleVoice, generateProactiveMessage } from "./HarborVoiceAgent";

// ─── Voice Command Registry ───────────────────────────────────────────────
// Maps spoken phrases → action identifiers
const COMMAND_MAP = [
  // Navigation
  { patterns: [/^(åbn|åbn op|vis|gå til)\s+(dashboard|overblik)/i, /^dashboard$/i], action: "nav:Dashboard" },
  { patterns: [/^(åbn|vis)\s+(flåde|fleet|biler|køretøjer)/i, /^flåde$/i], action: "nav:Fleet" },
  { patterns: [/^(åbn|vis)\s+(advarsler|alerts|alarmer)/i, /^advarsler$/i], action: "nav:Alerts" },
  { patterns: [/^(åbn|vis)\s+(ruter|routes)/i, /^ruter$/i], action: "nav:Routes" },
  { patterns: [/^(åbn|vis)\s+(forsendelser|shipments|leveringer)/i], action: "nav:Shipments" },
  { patterns: [/^(åbn|vis)\s+(kunder|customers)/i], action: "nav:CustomerManagement" },
  { patterns: [/^(åbn|vis)\s+(fakturaer|invoices)/i], action: "nav:Invoices" },
  { patterns: [/^(åbn|vis)\s+(indstillinger|settings)/i], action: "nav:Settings" },
  { patterns: [/^(åbn|vis)\s+(rapporter|reports)/i], action: "nav:Reports" },
  { patterns: [/^(åbn|vis)\s+(kort|map|live)/i], action: "nav:MapMonitor" },
  // Windows
  { patterns: [/^(åbn|start)\s+(app builder|harbor|harbor app)/i], action: "window:harbor_app_builder" },
  { patterns: [/^(åbn|vis)\s+(fleet store|store|butik)/i], action: "window:fleet_store" },
  { patterns: [/^(åbn|vis)\s+(analyse|analysis|deep analysis)/i], action: "window:deep_analysis" },
  { patterns: [/^(åbn|vis)\s+(vedligeholdelse|maintenance)/i], action: "window:predictive_maintenance" },
  { patterns: [/^(åbn|vis)\s+(3d|globe|globus)/i], action: "window:fleet_3d_viewer" },
  { patterns: [/^(åbn|vis)\s+(vejr|weather|satellit)/i], action: "window:satellite_weather" },
  { patterns: [/^(åbn|vis)\s+(nyheder|news)/i], action: "window:news_intelligence" },
  { patterns: [/^(åbn|vis)\s+(projekt|projects)/i], action: "window:project_management" },
  { patterns: [/^(åbn|vis)\s+(dokument|document|editor)/i], action: "window:document_editor" },
  { patterns: [/^(åbn|vis)\s+(regneark|spreadsheet)/i], action: "window:spreadsheet_editor" },
  { patterns: [/^(luk|close)\s+(alle|alt|vinduer|windows)/i], action: "cmd:close_windows" },
  // AI
  { patterns: [/^(luk|stop|farvel|close|exit)/i, /^(luk op|stop lyt)/i], action: "cmd:close_voice" },
  { patterns: [/^(send|udfør|go|execute|afsendt)/i], action: "cmd:send" },
  { patterns: [/^(ryd|slet|clear|delete)/i], action: "cmd:clear" },
  { patterns: [/^(hvad kan du|hjælp|help|kommandoer)/i], action: "cmd:help" },
  { patterns: [/^(morgen briefing|daglig status|status)/i], action: "cmd:morning_briefing" },
];

function matchCommand(text) {
  for (const entry of COMMAND_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(text.trim())) return entry.action;
    }
  }
  return null;
}

// ─── Waveform ─────────────────────────────────────────────────────────────
function Waveform({ isActive, amplitude = 0, isSpeaking = false }) {
  const count = 24;
  return (
    <div className="flex items-center justify-center gap-0.5" style={{ height: 48 }}>
      {Array.from({ length: count }, (_, i) => {
        const center = Math.abs(i - count / 2) / (count / 2);
        const base = 0.08 + (1 - center) * 0.35;
        const color = isSpeaking
          ? `rgba(167,139,250,${0.5 + (1 - center) * 0.5})`
          : `linear-gradient(to top, #06b6d4, #8b5cf6)`;
        return (
          <motion.div
            key={i}
            style={{
              width: 2,
              borderRadius: 2,
              background: isSpeaking ? color : "linear-gradient(to top, #06b6d4, #8b5cf6)",
            }}
            animate={isActive || isSpeaking ? {
              scaleY: [base, base + amplitude * (0.3 + (1 - center) * 0.7) + (isSpeaking ? 0.4 : 0), base],
            } : { scaleY: base * 0.3 }}
            transition={{
              duration: 0.25 + (i % 4) * 0.07,
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.03,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Quick Command Chip ───────────────────────────────────────────────────
function CommandChip({ label, icon: IconComp, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all"
      style={{
        background: "rgba(6,182,212,0.06)",
        border: "1px solid rgba(6,182,212,0.2)",
        color: "#67e8f9",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.15)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,0.06)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)"; }}
    >
      {IconComp && <IconComp className="w-3 h-3" />}
      <span>{label}</span>
    </button>
  );
}

// ─── Proactive Suggestion Bubble ─────────────────────────────────────────
function SuggestionBubble({ suggestion, onAccept, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "rgba(139,92,246,0.1)",
        border: "1px solid rgba(139,92,246,0.3)",
      }}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#c4b5fd" }} />
        <p className="text-xs font-mono leading-relaxed" style={{ color: "#e2d9ff" }}>{suggestion.text}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-widest transition-all"
          style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.5)", color: "#c4b5fd" }}
        >
          JA, GØR DET
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all"
          style={{ background: "transparent", border: "1px solid rgba(71,85,105,0.4)", color: "#64748b" }}
        >
          Ikke nu
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main VoiceController ─────────────────────────────────────────────────
export default function VoiceController({
  onTranscript,
  onSend,
  onClose,
  onNavigate,      // (pageName: string) => void
  onOpenWindow,    // (windowType: string) => void
  onCloseWindows,  // () => void
  vehicles = [],
  alerts = [],
  routes = [],
  fleetData = {},
  language = "da-DK",
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState(language);
  const [showCommands, setShowCommands] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [harborMessage, setHarborMessage] = useState("Hej! Jeg er H.A.R.B.O.R. Sig en kommando eller stil mig et spørgsmål.");
  const [history, setHistory] = useState([]);
  const [continuous, setContinuous] = useState(true);

  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isContinuousRef = useRef(continuous);
  const ttsEnabledRef = useRef(ttsEnabled);

  useEffect(() => { isContinuousRef.current = continuous; }, [continuous]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  // ─── Speak ──────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    if (!ttsEnabledRef.current) { onDone?.(); return; }
    setIsSpeaking(true);
    harborSpeak(text, {
      lang,
      rate: 1.0,
      pitch: 1.15,
      onStart: () => setIsSpeaking(true),
      onEnd: () => { setIsSpeaking(false); onDone?.(); },
    });
  }, [lang]);

  // ─── Proactive suggestions ─────────────────────────────────────────────
  useEffect(() => {
    if (!vehicles.length && !alerts.length) return;
    const timeout = setTimeout(() => {
      const msg = generateProactiveMessage(vehicles, alerts, routes);
      if (msg) {
        setSuggestion(msg);
        speak(msg.text);
        setHarborMessage(msg.text);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, []); // Only on mount

  // ─── Amplitude tracking ────────────────────────────────────────────────
  const startAmplitude = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* mic denied */ }
  }, []);

  const stopAmplitude = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    setAmplitude(0);
  }, []);

  // ─── Handle recognized text ────────────────────────────────────────────
  const handleFinalText = useCallback((text) => {
    setLastCommand(text);
    setHistory(p => [text, ...p].slice(0, 8));

    const action = matchCommand(text);

    if (action === "cmd:close_voice") {
      speak("Farvel! Kalder på mig når du har brug for hjælp.");
      setTimeout(() => onClose?.(), 800);
      return;
    }
    if (action === "cmd:send") {
      speak("Sender kommando.");
      onSend?.();
      return;
    }
    if (action === "cmd:clear") {
      onTranscript?.("");
      speak("Ryddet.");
      return;
    }
    if (action === "cmd:close_windows") {
      onCloseWindows?.();
      speak("Lukker alle vinduer.");
      setHarborMessage("Lukker alle vinduer.");
      return;
    }
    if (action === "cmd:help") {
      const helpMsg = "Du kan sige åbn flåde, åbn advarsler, åbn ruter, åbn dashboard, luk alle vinduer, eller stil mig et spørgsmål.";
      speak(helpMsg);
      setHarborMessage(helpMsg);
      setShowCommands(true);
      return;
    }
    if (action === "cmd:morning_briefing") {
      const briefing = `Her er din morgen briefing. Du har ${vehicles.length} køretøjer, ${alerts.filter(a => !a.is_read).length} ulæste advarsler og ${routes.filter(r => r.status === "active").length} aktive ruter.`;
      speak(briefing);
      setHarborMessage(briefing);
      return;
    }
    if (action?.startsWith("nav:")) {
      const page = action.split(":")[1];
      const msg = `Navigerer til ${page}.`;
      speak(msg);
      setHarborMessage(msg);
      onNavigate?.(page);
      return;
    }
    if (action?.startsWith("window:")) {
      const windowType = action.split(":")[1];
      const msg = `Åbner ${windowType.replace(/_/g, " ")}.`;
      speak(msg);
      setHarborMessage(msg);
      onOpenWindow?.(windowType);
      return;
    }

    // Free-form — pass to chat input and auto-send
    onTranscript?.(text);
    setHarborMessage(`Behandler: "${text}"`);
    speak("Forstået. Analyserer nu.");
    setTimeout(() => onSend?.(), 700);
  }, [speak, onClose, onSend, onTranscript, onCloseWindows, onNavigate, onOpenWindow, vehicles, alerts, routes]);

  // ─── Start / Stop recognition ──────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Stemmegenkendelse ikke understøttet i denne browser"); return; }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = isContinuousRef.current;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setIsListening(true); setInterimText(""); startAmplitude(); };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final) { setInterimText(""); handleFinalText(final.trim()); }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") toast.error(`Stemme fejl: ${e.error}`);
      setIsListening(false);
      stopAmplitude();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAmplitude();
      // Auto-restart if continuous
      if (isContinuousRef.current && recognitionRef.current) {
        try { recognitionRef.current = new SR(); recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null; startListening(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, handleFinalText, startAmplitude, stopAmplitude]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAmplitude();
  }, [stopAmplitude]);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Greet on open
  useEffect(() => {
    const greetings = [
      "Hej! H.A.R.B.O.R her. Klar til at hjælpe dig.",
      `Goddag. Du har ${vehicles.length} køretøjer og ${alerts.filter(a => !a.is_read).length} ulæste advarsler. Hvad har du brug for?`,
      "H.A.R.B.O.R online. Sig en kommando eller stil mig et spørgsmål.",
    ];
    const msg = greetings[Math.floor(Math.random() * greetings.length)];
    setHarborMessage(msg);
    setTimeout(() => speak(msg), 400);
    return () => { stopListening(); window.speechSynthesis?.cancel(); };
  }, []);

  const LANGS = [
    { code: "da-DK", label: "DK" },
    { code: "en-US", label: "EN" },
    { code: "de-DE", label: "DE" },
    { code: "sv-SE", label: "SV" },
  ];

  const NAV_COMMANDS = [
    { label: "Dashboard", icon: LayoutDashboard, action: () => onNavigate?.("Dashboard") },
    { label: "Flåde", icon: Truck, action: () => onOpenWindow?.("fleet") },
    { label: "Advarsler", icon: AlertTriangle, action: () => onNavigate?.("Alerts") },
    { label: "Ruter", icon: Route, action: () => onOpenWindow?.("routes") },
    { label: "Forsendelser", icon: Package, action: () => onOpenWindow?.("shipments") },
    { label: "Analyse", icon: BarChart3, action: () => onOpenWindow?.("deep_analysis") },
    { label: "App Builder", icon: Zap, action: () => onOpenWindow?.("harbor_app_builder") },
    { label: "Fleet Store", icon: Globe, action: () => onOpenWindow?.("fleet_store") },
    { label: "3D Globe", icon: Brain, action: () => onOpenWindow?.("fleet_3d_viewer") },
    { label: "Vedligehold", icon: Settings, action: () => onOpenWindow?.("predictive_maintenance") },
    { label: "Nyheder", icon: FileText, action: () => onOpenWindow?.("news_intelligence") },
    { label: "Luk vinduer", icon: X, action: () => onCloseWindows?.() },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center pb-2 px-2 pointer-events-none"
    >
      <div
        className="w-full max-w-2xl pointer-events-auto rounded-2xl overflow-hidden"
        style={{
          background: "rgba(2,6,18,0.97)",
          border: "1px solid rgba(6,182,212,0.3)",
          boxShadow: isListening
            ? "0 -4px 60px rgba(6,182,212,0.2), 0 0 120px rgba(139,92,246,0.1)"
            : "0 -4px 40px rgba(0,0,0,0.8)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Top strip */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ background: isSpeaking ? "#a78bfa" : isListening ? "#22c55e" : "#334155" }}
            />
            <span className="text-[10px] font-bold font-mono tracking-[0.2em]" style={{ color: "#06b6d4" }}>
              H.A.R.B.O.R
            </span>
            <span className="text-[9px] font-mono" style={{ color: "#334155" }}>
              {isSpeaking ? "TALER" : isListening ? "LYTTER" : "STANDBY"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* TTS toggle */}
            <button
              onClick={() => setTtsEnabled(p => !p)}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: ttsEnabled ? "#06b6d4" : "#334155" }}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            {/* Continuous toggle */}
            <button
              onClick={() => setContinuous(p => { const next = !p; isContinuousRef.current = next; return next; })}
              className="px-2 py-1 rounded text-[9px] font-mono transition-all"
              style={{
                background: continuous ? "rgba(6,182,212,0.12)" : "rgba(30,41,59,0.5)",
                border: `1px solid ${continuous ? "rgba(6,182,212,0.35)" : "rgba(51,65,85,0.5)"}`,
                color: continuous ? "#67e8f9" : "#475569",
              }}
            >
              KONTINU
            </button>
            {/* Language */}
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="px-1.5 py-1 rounded text-[9px] font-mono transition-all"
                style={{
                  background: lang === l.code ? "rgba(6,182,212,0.12)" : "transparent",
                  color: lang === l.code ? "#67e8f9" : "#334155",
                }}
              >
                {l.label}
              </button>
            ))}
            {/* Show commands */}
            <button
              onClick={() => setShowCommands(p => !p)}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: showCommands ? "#8b5cf6" : "#334155" }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:bg-red-500/10" style={{ color: "#334155" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Suggestion bubble */}
        <AnimatePresence>
          {suggestion && (
            <div className="px-5 pt-3">
              <SuggestionBubble
                suggestion={suggestion}
                onAccept={() => {
                  setSuggestion(null);
                  if (suggestion.action === "open_alerts") onNavigate?.("Alerts");
                  else if (suggestion.action === "analyze_fleet") onOpenWindow?.("deep_analysis");
                  else if (suggestion.action === "check_route") onOpenWindow?.("routes");
                  else if (suggestion.action === "morning_briefing" || suggestion.action === "daily_summary") onOpenWindow?.("deep_analysis");
                  speak("Godt. Åbner nu.");
                }}
                onDismiss={() => { setSuggestion(null); speak("Ingen problem."); }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Harbor message / transcript */}
        <div className="px-5 pt-3 pb-2 min-h-[44px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={interimText || harborMessage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-mono leading-relaxed"
              style={{ color: interimText ? "#c4b5fd" : isSpeaking ? "#e2d9ff" : "#94a3b8" }}
            >
              {interimText ? `"${interimText}"` : (isSpeaking ? `🔊 ${harborMessage}` : harborMessage)}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Waveform + mic button */}
        <div className="flex items-center gap-4 px-5 pb-3">
          <motion.button
            onClick={toggleListening}
            whileTap={{ scale: 0.92 }}
            className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: isListening
                ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))"
                : "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))",
              border: isListening ? "2px solid rgba(239,68,68,0.6)" : "2px solid rgba(6,182,212,0.5)",
              boxShadow: isListening ? "0 0 20px rgba(239,68,68,0.3)" : "0 0 16px rgba(6,182,212,0.15)",
            }}
          >
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(239,68,68,0.4)" }}
              />
            )}
            {isListening
              ? <MicOff className="w-5 h-5" style={{ color: "#f87171" }} />
              : <Mic className="w-5 h-5" style={{ color: "#06b6d4" }} />
            }
          </motion.button>

          <div className="flex-1">
            <Waveform isActive={isListening} amplitude={amplitude} isSpeaking={isSpeaking} />
          </div>

          <span className="text-[9px] font-mono tracking-wider flex-shrink-0" style={{ color: isListening ? "#22c55e" : "#334155" }}>
            {isListening ? "LYTTER" : "TRYK"}
          </span>
        </div>

        {/* Quick command chips */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              style={{ borderTop: "1px solid rgba(6,182,212,0.1)" }}
            >
              <div className="px-5 py-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2">Tryk for at navigere / åbne</p>
                <div className="flex flex-wrap gap-2">
                  {NAV_COMMANDS.map(cmd => (
                    <CommandChip
                      key={cmd.label}
                      label={cmd.label}
                      icon={cmd.icon}
                      onClick={() => {
                        cmd.action();
                        speak(`${cmd.label} åbnet.`);
                        setHarborMessage(`${cmd.label} åbnet.`);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="px-5 pb-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-1.5">Stemmesnarvejer</p>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono" style={{ color: "#475569" }}>
                  {[
                    ["åbn flåde", "navigér til flåde"],
                    ["åbn advarsler", "navigér til advarsler"],
                    ["luk alle vinduer", "lukker alle"],
                    ["send", "udfør kommando"],
                    ["morgen briefing", "daglig status"],
                    ["stop lyt", "luk voice control"],
                  ].map(([cmd, desc]) => (
                    <div key={cmd} className="flex gap-1">
                      <span style={{ color: "#67e8f9" }}>"{cmd}"</span>
                      <span>— {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}