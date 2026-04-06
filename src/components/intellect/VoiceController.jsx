import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Volume2, VolumeX, X,
  Zap, Sparkles, Brain, BarChart3, Truck,
  AlertTriangle, Package, Settings, Globe,
  MessageSquare, LayoutDashboard, FileText, Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { harborSpeak, getBestFemaleVoice, generateProactiveMessage, checkHumanCheckins, recordActivity, detectHumanConversation, getHumanReply } from "./HarborVoiceAgent";

// ─── Voice Command Registry ───────────────────────────────────────────────
const COMMAND_MAP = [
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
  const count = 40;
  return (
    <div className="flex items-center justify-center gap-[2px]" style={{ height: 48 }}>
      {Array.from({ length: count }, (_, i) => {
        const center = Math.abs(i - count / 2) / (count / 2);
        const base = 0.05 + (1 - center) * 0.4;
        const grad = isSpeaking
          ? `rgba(167,139,250,${0.4 + (1 - center) * 0.6})`
          : isActive
          ? `rgba(6,182,212,${0.5 + (1 - center) * 0.5})`
          : `rgba(51,65,85,0.4)`;
        return (
          <motion.div
            key={i}
            style={{ width: 2.5, borderRadius: 4, background: grad }}
            animate={isActive || isSpeaking ? {
              scaleY: [base, base + amplitude * (0.6 + (1 - center) * 1.4) + (isSpeaking ? 0.6 : 0.2), base],
            } : { scaleY: base * 0.2 }}
            transition={{
              duration: 0.15 + (i % 5) * 0.05,
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.015,
              ease: "easeInOut",
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono transition-colors"
      style={{
        background: "rgba(6,182,212,0.07)",
        border: "1px solid rgba(6,182,212,0.18)",
        color: "#67e8f9",
      }}
    >
      {IconComp && <IconComp className="w-3 h-3 opacity-70" />}
      <span>{label}</span>
    </motion.button>
  );
}

// ─── Proactive Suggestion Bubble ─────────────────────────────────────────
function SuggestionBubble({ suggestion, onAccept, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#c4b5fd" }} />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#e2d9ff" }}>{suggestion.text}</p>
      </div>
      <div className="flex gap-2 ml-10">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onAccept}
          className="flex-1 py-2 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all"
          style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.5)", color: "#c4b5fd" }}>
          JA, GØR DET
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onDismiss}
          className="px-4 py-2 rounded-xl text-[10px] font-mono transition-all"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.5)", color: "#64748b" }}>
          Ikke nu
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main VoiceController ─────────────────────────────────────────────────
export default function VoiceController({
  onTranscript,
  onSend,
  onClose,
  onNavigate,
  onOpenWindow,
  onCloseWindows,
  vehicles = [],
  alerts = [],
  routes = [],
  fleetData = {},
  language = "da-DK",
  autoStart = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [processingText, setProcessingText] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState(language);
  const [showCommands, setShowCommands] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [harborMessage, setHarborMessage] = useState("Hej! Jeg er H.A.R.B.O.R. Sig en kommando eller stil mig et spørgsmål.");
  const [history, setHistory] = useState([]);
  const [continuous, setContinuous] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);

  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isContinuousRef = useRef(continuous);
  const ttsEnabledRef = useRef(ttsEnabled);

  useEffect(() => { isContinuousRef.current = continuous; }, [continuous]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  const onSendRef = useRef(onSend);
  const onTranscriptRef = useRef(onTranscript);
  const onCloseRef = useRef(onClose);
  const onNavigateRef = useRef(onNavigate);
  const onOpenWindowRef = useRef(onOpenWindow);
  const onCloseWindowsRef = useRef(onCloseWindows);
  useEffect(() => { onSendRef.current = onSend; }, [onSend]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);
  useEffect(() => { onOpenWindowRef.current = onOpenWindow; }, [onOpenWindow]);
  useEffect(() => { onCloseWindowsRef.current = onCloseWindows; }, [onCloseWindows]);

  // ─── Speak ──────────────────────────────────────────────────────────────
  const speakRef = useRef(null);
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
  speakRef.current = speak;

  useEffect(() => {
    recordActivity();
    const activityInterval = setInterval(recordActivity, 60 * 1000);
    return () => clearInterval(activityInterval);
  }, []);

  useEffect(() => {
    const humanTimeout = setTimeout(() => {
      const humanMsg = checkHumanCheckins();
      if (humanMsg) { setSuggestion(humanMsg); speakRef.current?.(humanMsg.text); setHarborMessage(humanMsg.text); return; }
      const fleetMsg = generateProactiveMessage(vehicles, alerts, routes);
      if (fleetMsg) { setSuggestion(fleetMsg); speakRef.current?.(fleetMsg.text); setHarborMessage(fleetMsg.text); }
    }, 3000);
    const periodicInterval = setInterval(() => {
      const humanMsg = checkHumanCheckins();
      if (humanMsg && !suggestion) { setSuggestion(humanMsg); speak(humanMsg.text); setHarborMessage(humanMsg.text); }
    }, 15 * 60 * 1000);
    return () => { clearTimeout(humanTimeout); clearInterval(periodicInterval); };
  }, []);

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
    } catch { }
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
    setProcessingText(text);
    setHistory(p => [text, ...p].slice(0, 8));
    recordActivity();

    const humanType = detectHumanConversation(text);
    if (humanType) {
      const reply = getHumanReply(humanType, text);
      speakRef.current?.(reply);
      setHarborMessage(reply);
      setProcessingText("");
      setSuggestion(null);
      return;
    }

    const action = matchCommand(text);

    if (action === "cmd:close_voice") {
      speakRef.current?.("Farvel! Kalder på mig når du har brug for hjælp.");
      setTimeout(() => onCloseRef.current?.(), 800);
      return;
    }
    if (action === "cmd:send") {
      speakRef.current?.("Sender kommando.");
      onSendRef.current?.();
      setProcessingText("");
      return;
    }
    if (action === "cmd:clear") {
      onTranscriptRef.current?.("");
      speakRef.current?.("Ryddet.");
      setProcessingText("");
      return;
    }
    if (action === "cmd:close_windows") {
      onCloseWindowsRef.current?.();
      speakRef.current?.("Lukker alle vinduer.");
      setHarborMessage("Lukker alle vinduer.");
      setProcessingText("");
      return;
    }
    if (action === "cmd:help") {
      const helpMsg = "Du kan sige åbn flåde, åbn advarsler, åbn ruter, åbn dashboard, luk alle vinduer, eller stil mig et spørgsmål.";
      speakRef.current?.(helpMsg);
      setHarborMessage(helpMsg);
      setShowCommands(true);
      setProcessingText("");
      return;
    }
    if (action === "cmd:morning_briefing") {
      const briefing = `Her er din morgen briefing. Du har ${vehicles.length} køretøjer, ${alerts.filter(a => !a.is_read).length} ulæste advarsler og ${routes.filter(r => r.status === "active").length} aktive ruter.`;
      speakRef.current?.(briefing);
      setHarborMessage(briefing);
      setProcessingText("");
      return;
    }
    if (action?.startsWith("nav:")) {
      const page = action.split(":")[1];
      const msg = `Navigerer til ${page}.`;
      speakRef.current?.(msg);
      setHarborMessage(msg);
      onNavigateRef.current?.(page);
      setProcessingText("");
      return;
    }
    if (action?.startsWith("window:")) {
      const windowType = action.split(":")[1];
      const msg = `Åbner ${windowType.replace(/_/g, " ")}.`;
      speakRef.current?.(msg);
      setHarborMessage(msg);
      onOpenWindowRef.current?.(windowType);
      setProcessingText("");
      return;
    }

    // Free-form — pass to chat and send
    onTranscriptRef.current?.(text);
    setHarborMessage(`Sender: "${text}"`);
    speakRef.current?.("Forstået. Analyserer nu.");
    setTimeout(() => {
      onSendRef.current?.(text);
      setProcessingText("");
    }, 700);
  }, [vehicles, alerts, routes]);

  const handleFinalTextRef = useRef(handleFinalText);
  useEffect(() => { handleFinalTextRef.current = handleFinalText; }, [handleFinalText]);

  // ─── Start / Stop recognition ──────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Stemmegenkendelse ikke understøttet — brug Chrome eller Edge");
      setHarborMessage("⚠️ Stemmegenkendelse ikke understøttet i denne browser. Brug Chrome eller Edge.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;  // Keep listening without restart gaps
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
      setHarborMessage("Lytter... sig din kommando");
      startAmplitude();
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
      if (final) { setInterimText(""); handleFinalTextRef.current(final.trim()); }
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        toast.error("Mikrofon adgang nægtet — tillad mikrofon i browser-indstillinger");
        setHarborMessage("⚠️ Mikrofon adgang nægtet. Tillad mikrofon adgang i din browsers adresselinje.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error(`Stemme fejl: ${e.error}`);
      }
      setIsListening(false);
      stopAmplitude();
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // continuous=true means onend only fires when explicitly stopped
      setIsListening(false);
      stopAmplitude();
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      toast.error("Kunne ikke starte mikrofon: " + e.message);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang, startAmplitude, stopAmplitude]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAmplitude();
  }, [stopAmplitude]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!voiceReady) {
        setVoiceReady(true);
        speakRef.current?.(greetingRef.current, () => startListening());
      } else {
        startListening();
      }
    }
  };

  useEffect(() => {
    if (autoStart) {
      setVoiceReady(true);
      speakRef.current?.(greetingRef.current, () => startListening());
    }
  }, [autoStart]);

  const greetingRef = useRef("");
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 10) greeting = `Godmorgen! Her er H.A.R.B.O.R. Jeg håber du har sovet godt. Du har ${vehicles.length} køretøjer klar. Hvad starter vi med?`;
    else if (hour < 12) greeting = `Hej! H.A.R.B.O.R her. Formiddagen er i gang — ${alerts.filter(a => !a.is_read).length} advarsler venter. Hvad kan jeg hjælpe med?`;
    else if (hour < 14) greeting = `God eftermiddag! H.A.R.B.O.R online. Har du fået spist frokost? Hvad kan jeg gøre for dig?`;
    else if (hour < 17) greeting = `Hej igen! Eftermiddagen er i fuld gang. ${vehicles.length} køretøjer i flåden. Hvad har du brug for?`;
    else greeting = `God aften! H.A.R.B.O.R her. Det er ved at blive sent — husk at tage en pause. Hvad kan jeg hjælpe med?`;
    greetingRef.current = greeting;
    setHarborMessage(greeting);
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
    { label: "Ruter", icon: Navigation, action: () => onOpenWindow?.("routes") },
    { label: "Forsendelser", icon: Package, action: () => onOpenWindow?.("shipments") },
    { label: "Analyse", icon: BarChart3, action: () => onOpenWindow?.("deep_analysis") },
    { label: "App Builder", icon: Zap, action: () => onOpenWindow?.("harbor_app_builder") },
    { label: "Fleet Store", icon: Globe, action: () => onOpenWindow?.("fleet_store") },
    { label: "3D Globe", icon: Brain, action: () => onOpenWindow?.("fleet_3d_viewer") },
    { label: "Vedligehold", icon: Settings, action: () => onOpenWindow?.("predictive_maintenance") },
    { label: "Nyheder", icon: FileText, action: () => onOpenWindow?.("news_intelligence") },
    { label: "Luk vinduer", icon: X, action: () => onCloseWindows?.() },
  ];

  const statusColor = isSpeaking ? "#a78bfa" : isListening ? "#22d3ee" : "#334155";
  const statusLabel = isSpeaking ? "TALER" : isListening ? "LYTTER" : voiceReady ? "STANDBY" : "KLIK FOR AT AKTIVERE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center pb-3 px-3 pointer-events-none"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-24 pointer-events-none"
        style={{
          background: isListening
            ? "radial-gradient(ellipse, rgba(6,182,212,0.15) 0%, transparent 70%)"
            : isSpeaking
            ? "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)"
            : "transparent",
          filter: "blur(12px)",
          transition: "background 0.5s ease",
        }}
      />

      <div className="w-full max-w-2xl pointer-events-auto overflow-hidden"
        style={{
          borderRadius: 24,
          background: "linear-gradient(180deg, rgba(5,10,30,0.98) 0%, rgba(2,6,18,0.99) 100%)",
          border: `1px solid ${isListening ? "rgba(6,182,212,0.4)" : isSpeaking ? "rgba(139,92,246,0.35)" : "rgba(30,41,59,0.8)"}`,
          boxShadow: isListening
            ? "0 -8px 60px rgba(6,182,212,0.18), 0 0 0 1px rgba(6,182,212,0.08) inset"
            : isSpeaking
            ? "0 -8px 60px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.06) inset"
            : "0 -4px 40px rgba(0,0,0,0.7)",
          backdropFilter: "blur(32px)",
          transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <motion.div className="absolute inset-0 rounded-full"
                animate={isListening || isSpeaking ? { scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] } : { scale: 1, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ background: statusColor }}
              />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-[0.25em]" style={{ color: "#06b6d4" }}>H.A.R.B.O.R</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.04)", color: statusColor, border: `1px solid ${statusColor}30` }}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setTtsEnabled(p => !p)}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: ttsEnabled ? "#06b6d4" : "#475569" }}
              title={ttsEnabled ? "Sluk stemme" : "Tænd stemme"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setContinuous(p => { const next = !p; isContinuousRef.current = next; return next; })}
              className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all"
              style={{
                background: continuous ? "rgba(6,182,212,0.1)" : "transparent",
                border: `1px solid ${continuous ? "rgba(6,182,212,0.3)" : "rgba(51,65,85,0.4)"}`,
                color: continuous ? "#67e8f9" : "#475569",
              }}
            >
              AUTO
            </button>
            <div className="flex items-center gap-0.5 ml-1">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className="px-2 py-1 rounded-lg text-[9px] font-mono transition-all"
                  style={{
                    background: lang === l.code ? "rgba(6,182,212,0.12)" : "transparent",
                    color: lang === l.code ? "#67e8f9" : "#475569",
                    fontWeight: lang === l.code ? 700 : 400,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCommands(p => !p)}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: showCommands ? "#8b5cf6" : "#475569" }}>
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl transition-all hover:bg-red-500/10" style={{ color: "#475569" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ACTIVE LISTENING BANNER */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
              style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.15), rgba(6,182,212,0.08), rgba(6,182,212,0.15))" }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)", width: "40%" }}
              />
              <div className="relative flex items-center justify-center gap-3 py-2.5">
                <motion.div className="w-2.5 h-2.5 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(6,182,212,0.8)" }}
                />
                <span className="text-xs font-black font-mono tracking-[0.3em] uppercase"
                  style={{ color: "#22d3ee", textShadow: "0 0 12px rgba(6,182,212,0.6)" }}>
                  ● LYTTER AKTIVT — SIG DIN KOMMANDO
                </span>
                <motion.div className="w-2.5 h-2.5 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: 0.35 }}
                  style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(6,182,212,0.8)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion bubble */}
        <AnimatePresence>
          {suggestion && (
            <div className="px-5 pt-4">
              <SuggestionBubble
                suggestion={suggestion}
                onAccept={() => {
                  setSuggestion(null);
                  if (suggestion.action === "open_alerts") { onNavigate?.("Alerts"); speak("Åbner advarsler nu."); }
                  else if (suggestion.action === "analyze_fleet") { onOpenWindow?.("deep_analysis"); speak("Åbner flådeanalyse."); }
                  else if (suggestion.action === "check_route") { onOpenWindow?.("routes"); speak("Her er ruteoversigten."); }
                  else if (suggestion.action === "morning_briefing" || suggestion.action === "daily_summary") { onOpenWindow?.("deep_analysis"); speak("Åbner daglig briefing."); }
                  else if (suggestion.action === "break") { speak("Godt! Tag en god pause. Jeg holder øje med tingene. Vi ses om lidt!"); }
                  else if (suggestion.action === "coffee") { speak("God idé! Nyd din kaffe. Jeg er her når du er klar."); }
                  else if (suggestion.action === "breakfast") { speak("Dejligt! Spis en god morgenmad. Det er dagens vigtigste måltid!"); }
                  else if (suggestion.action === "lunch") { speak("Rigtig god idé! Nyd frokosten. Gå fra computeren og lad op."); }
                  else if (suggestion.action === "dinner") { speak("God aften! Nyd maden og slap af efter en lang dag."); }
                  else { speak("Godt. Åbner nu."); }
                }}
                onDismiss={() => { setSuggestion(null); speak("Ingen problem."); }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Main interaction area */}
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Big mic button */}
          <motion.button
            onClick={toggleListening}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: isListening
                ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))"
                : "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.12))",
              border: isListening
                ? "1.5px solid rgba(239,68,68,0.7)"
                : "1.5px solid rgba(6,182,212,0.5)",
              boxShadow: isListening
                ? "0 0 24px rgba(239,68,68,0.35), 0 0 0 8px rgba(239,68,68,0.05)"
                : "0 0 20px rgba(6,182,212,0.2), 0 0 0 8px rgba(6,182,212,0.04)",
            }}
          >
            {isListening && (
              <>
                <motion.div animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(239,68,68,0.5)" }} />
                <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
                  className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(239,68,68,0.2)" }} />
              </>
            )}
            {isListening
              ? <MicOff className="w-6 h-6" style={{ color: "#f87171" }} />
              : <Mic className="w-6 h-6" style={{ color: "#22d3ee" }} />
            }
          </motion.button>

          {/* Live transcript area */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <AnimatePresence mode="wait">
              {interimText ? (
                /* Currently hearing something */
                <motion.div key="interim" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.4)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div className="w-2 h-2 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.4, repeat: Infinity }}
                      style={{ background: "#22d3ee", boxShadow: "0 0 8px #22d3ee" }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(6,182,212,0.7)" }}>Registrerer...</span>
                  </div>
                  <p className="text-base font-semibold leading-snug" style={{ color: "#e0f9ff" }}>„{interimText}"</p>
                </motion.div>
              ) : processingText ? (
                /* Just said something, processing */
                <motion.div key="processing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div className="w-2 h-2 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                      style={{ background: "#a78bfa" }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Forstod:</span>
                  </div>
                  <p className="text-base font-semibold leading-snug" style={{ color: "#e2d9ff" }}>„{processingText}"</p>
                </motion.div>
              ) : (
                /* Idle message */
                <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm leading-relaxed"
                  style={{ color: isSpeaking ? "#e2d9ff" : "#4b5563" }}
                >
                  {harborMessage}
                </motion.p>
              )}
            </AnimatePresence>
            <Waveform isActive={isListening} amplitude={amplitude} isSpeaking={isSpeaking} />
          </div>
        </div>

        {/* Quick command chips */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2.5" style={{ color: "#334155" }}>Hurtig navigation</p>
                  <div className="flex flex-wrap gap-2">
                    {NAV_COMMANDS.map(cmd => (
                      <CommandChip key={cmd.label} label={cmd.label} icon={cmd.icon}
                        onClick={() => { cmd.action(); speak(`${cmd.label} åbnet.`); setHarborMessage(`${cmd.label} åbnet.`); }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#334155" }}>Stemmesnarvejer</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono">
                    {[
                      ["åbn flåde", "navigér til flåde"],
                      ["åbn advarsler", "navigér til advarsler"],
                      ["luk alle vinduer", "lukker alle"],
                      ["send", "udfør kommando"],
                      ["morgen briefing", "daglig status"],
                      ["stop lyt", "luk voice control"],
                    ].map(([cmd, desc]) => (
                      <div key={cmd} className="flex gap-1.5 items-center">
                        <span style={{ color: "#22d3ee" }}>"{cmd}"</span>
                        <span style={{ color: "#334155" }}>— {desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}