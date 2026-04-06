import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Volume2, VolumeX, X,
  Zap, Sparkles, Brain, BarChart3, Truck,
  AlertTriangle, Package, Settings, Globe,
  MessageSquare, LayoutDashboard, FileText, Navigation, Send, Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { harborSpeak, getBestFemaleVoice, generateProactiveMessage, checkHumanCheckins, recordActivity, detectHumanConversation, getHumanReply, getTimeBasedGreeting } from "./HarborVoiceAgent";

// ─── i18n Messages ────────────────────────────────────────────────────────────
const MESSAGES = {
  "en-US": {
    listening: "Listening... say your command",
    standby: "STANDBY",
    activate: "CLICK TO ACTIVATE",
    speaking: "SPEAKING",
    listeningStatus: "LISTENING",
    activeBanner: "● ACTIVELY LISTENING — SAY YOUR COMMAND",
    noSpeech: "⚠️ Speech recognition not supported. Use the text input below.",
    noMic: "⚠️ Microphone access denied. Allow microphone access in your browser.",
    greeting: (v, a) => getTimeBasedGreeting(v, a),
    sending: (t) => `Sending: "${t}"`,
    understood: "Understood. Analyzing now.",
    navigating: (p) => `Navigating to ${p}.`,
    opening: (w) => `Opening ${w}.`,
    closingWindows: "Closing all windows.",
    cleared: "Cleared.",
    sendingCmd: "Sending command.",
    farewell: "Goodbye! Call me when you need help.",
    briefing: (v, a, r) => `Here is your briefing. You have ${v} vehicles, ${a} unread alerts and ${r} active routes.`,
    help: "You can say: open fleet, open alerts, open routes, open dashboard, close all windows, or ask me a question.",
    typeHint: "Type a command...",
    fallbackLabel: "Text input (speech not available)",
    quickNav: "Quick navigation",
    voiceShortcuts: "Voice shortcuts",
  },
  "da-DK": {
    listening: "Lytter... sig din kommando",
    standby: "STANDBY",
    activate: "KLIK FOR AT AKTIVERE",
    speaking: "TALER",
    listeningStatus: "LYTTER",
    activeBanner: "● LYTTER AKTIVT — SIG DIN KOMMANDO",
    noSpeech: "⚠️ Stemmegenkendelse ikke understøttet. Brug tekstfeltet nedenfor.",
    noMic: "⚠️ Mikrofon adgang nægtet. Tillad mikrofon adgang i din browsers adresselinje.",
    greeting: (v, a) => getTimeBasedGreeting(v, a),
    sending: (t) => `Sender: "${t}"`,
    understood: "Forstået. Analyserer nu.",
    navigating: (p) => `Navigerer til ${p}.`,
    opening: (w) => `Åbner ${w}.`,
    closingWindows: "Lukker alle vinduer.",
    cleared: "Ryddet.",
    sendingCmd: "Sender kommando.",
    farewell: "Farvel! Kalder på mig når du har brug for hjælp.",
    briefing: (v, a, r) => `Her er din briefing. Du har ${v} køretøjer, ${a} ulæste advarsler og ${r} aktive ruter.`,
    help: "Du kan sige: åbn flåde, åbn advarsler, åbn ruter, åbn dashboard, luk alle vinduer, eller stil mig et spørgsmål.",
    typeHint: "Skriv en kommando...",
    fallbackLabel: "Tekstinput (tale ikke tilgængeligt)",
    quickNav: "Hurtig navigation",
    voiceShortcuts: "Stemmesnarvejer",
  },
  "de-DE": {
    listening: "Ich höre... sagen Sie Ihren Befehl",
    standby: "BEREIT",
    activate: "KLICKEN ZUM AKTIVIEREN",
    speaking: "SPRICHT",
    listeningStatus: "HÖRT ZU",
    activeBanner: "● AKTIV ZUHÖREN — SAGEN SIE IHREN BEFEHL",
    noSpeech: "⚠️ Spracherkennung nicht unterstützt. Bitte Texteingabe verwenden.",
    noMic: "⚠️ Mikrofonzugriff verweigert. Erlauben Sie den Mikrofonzugriff im Browser.",
    greeting: (v, a) => getTimeBasedGreeting(v, a),
    sending: (t) => `Sende: "${t}"`,
    understood: "Verstanden. Analysiere jetzt.",
    navigating: (p) => `Navigiere zu ${p}.`,
    opening: (w) => `Öffne ${w}.`,
    closingWindows: "Schließe alle Fenster.",
    cleared: "Gelöscht.",
    sendingCmd: "Befehl wird gesendet.",
    farewell: "Auf Wiedersehen!",
    briefing: (v, a, r) => `Briefing: ${v} Fahrzeuge, ${a} ungelesene Warnungen, ${r} aktive Routen.`,
    help: "Sie können sagen: Flotte öffnen, Warnungen öffnen, Dashboard öffnen.",
    typeHint: "Befehl eingeben...",
    fallbackLabel: "Texteingabe (Sprache nicht verfügbar)",
    quickNav: "Schnellnavigation",
    voiceShortcuts: "Sprachkürzel",
  },
  "sv-SE": {
    listening: "Lyssnar... säg ditt kommando",
    standby: "STANDBY",
    activate: "KLICKA FÖR ATT AKTIVERA",
    speaking: "TALAR",
    listeningStatus: "LYSSNAR",
    activeBanner: "● LYSSNAR AKTIVT — SÄG DITT KOMMANDO",
    noSpeech: "⚠️ Taligenkänning stöds inte. Använd textinmatningen nedan.",
    noMic: "⚠️ Mikrofonåtkomst nekad. Tillåt mikrofonåtkomst i din webbläsare.",
    greeting: (v, a) => getTimeBasedGreeting(v, a),
    sending: (t) => `Skickar: "${t}"`,
    understood: "Förstått. Analyserar nu.",
    navigating: (p) => `Navigerar till ${p}.`,
    opening: (w) => `Öppnar ${w}.`,
    closingWindows: "Stänger alla fönster.",
    cleared: "Rensat.",
    sendingCmd: "Skickar kommando.",
    farewell: "Hej då! Ring mig när du behöver hjälp.",
    briefing: (v, a, r) => `Här är din briefing. Du har ${v} fordon, ${a} olästa varningar och ${r} aktiva rutter.`,
    help: "Du kan säga: öppna flotta, öppna varningar, öppna rutter, öppna dashboard.",
    typeHint: "Skriv ett kommando...",
    fallbackLabel: "Textinmatning (tal ej tillgängligt)",
    quickNav: "Snabbnavigation",
    voiceShortcuts: "Röstgenvägar",
  },
};

function getMsg(lang) {
  return MESSAGES[lang] || MESSAGES["en-US"];
}

// ─── Voice Command Registry ───────────────────────────────────────────────
const COMMAND_MAP = [
  { patterns: [/^(open|show|go to|åbn|vis|gå til|öppna|öffne)\s+(dashboard|overview|overblik)/i, /^dashboard$/i], action: "nav:Dashboard" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(fleet|flåde|biler|flotta|flotte|fahrzeuge)/i, /^fleet$/i], action: "nav:Fleet" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(alerts|advarsler|varningar|warnungen|alarmer)/i], action: "nav:Alerts" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(routes|ruter|rutter|routen)/i], action: "nav:Routes" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(shipments|forsendelser|leveringer|lieferungen)/i], action: "nav:Shipments" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(customers|kunder|kunder|kunden)/i], action: "nav:CustomerManagement" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(invoices|fakturaer|fakturor|rechnungen)/i], action: "nav:Invoices" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(settings|indstillinger|inställningar|einstellungen)/i], action: "nav:Settings" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(reports|rapporter|rapporter|berichte)/i], action: "nav:Reports" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(map|kort|karta|karte|live)/i], action: "nav:MapMonitor" },
  { patterns: [/^(open|start|åbn|öppna|öffne)\s+(app builder|harbor app|harbor)/i], action: "window:harbor_app_builder" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(store|butik|fleet store)/i], action: "window:fleet_store" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(analysis|analyse|analys|analyse|deep analysis)/i], action: "window:deep_analysis" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(maintenance|vedligeholdelse|underhåll|wartung)/i], action: "window:predictive_maintenance" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(3d|globe|globus)/i], action: "window:fleet_3d_viewer" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(weather|vejr|väder|wetter|satellite|satellit)/i], action: "window:satellite_weather" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(news|nyheder|nyheter|nachrichten)/i], action: "window:news_intelligence" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(project|projekt|projekt|projekt)/i], action: "window:project_management" },
  { patterns: [/^(open|show|åbn|vis|öppna|öffne)\s+(document|dokument|dokument|dokument|editor)/i], action: "window:document_editor" },
  { patterns: [/^(close|luk|stäng|schließe)\s+(all|alle|alla|alles|windows|vinduer|fönster|fenster)/i], action: "cmd:close_windows" },
  { patterns: [/^(close|stop|bye|goodbye|luk|stäng|schließe|farvel|hej da)/i], action: "cmd:close_voice" },
  { patterns: [/^(send|execute|go|udfør|skicka|senden)/i], action: "cmd:send" },
  { patterns: [/^(clear|delete|ryd|slet|rensa|löschen)/i], action: "cmd:clear" },
  { patterns: [/^(help|hjælp|hjälp|hilfe|commands|kommandoer)/i], action: "cmd:help" },
  { patterns: [/^(briefing|status|morning briefing|morgen briefing|daglig status)/i], action: "cmd:morning_briefing" },
];

function matchCommand(text) {
  for (const entry of COMMAND_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(text.trim())) return entry.action;
    }
  }
  return null;
}

// ─── Check browser speech support ────────────────────────────────────────
function hasSpeechSupport() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
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
const getHumanActionLabels = (lang) => {
  if (lang === "en-US") {
    return {
      breakfast:  { yes: "Yes, eating now! 🥐",    no: "Eating later" },
      lunch:      { yes: "Yes, taking break! 🍽️",  no: "Coming soon" },
      dinner:     { yes: "Good idea! 🍝",          no: "Not yet" },
      coffee:     { yes: "Yes please! ☕",         no: "Maybe later" },
      break:      { yes: "Yes, taking break! 🧘",  no: "In a moment" },
      stretch:    { yes: "OK, standing up! 🚶",    no: "5 more min" },
      water:      { yes: "Getting water now 💧",   no: "Already drank" },
      night:      { yes: "Shutting down soon 🌙",  no: "Just a bit more" },
    };
  } else if (lang === "da-DK") {
    return {
      breakfast:  { yes: "Ja, jeg spiser nu! 🥐",    no: "Spiser lidt efter" },
      lunch:      { yes: "Ja, jeg holder pause! 🍽️",  no: "Kommer snart" },
      dinner:     { yes: "God idé! 🍝",               no: "Lidt endnu" },
      coffee:     { yes: "Ja tak til kaffe! ☕",       no: "Måske om lidt" },
      break:      { yes: "Ja, jeg tager en pause! 🧘", no: "Lige om lidt" },
      stretch:    { yes: "Godt, rejser mig nu! 🚶",    no: "5 min mere" },
      water:      { yes: "Henter et glas nu 💧",       no: "Har drukket" },
      night:      { yes: "Lukker ned snart 🌙",        no: "Bare lidt mere" },
    };
  } else if (lang === "de-DE") {
    return {
      breakfast:  { yes: "Ja, esse jetzt! 🥐",        no: "Esse später" },
      lunch:      { yes: "Ja, Pause! 🍽️",              no: "Komme bald" },
      dinner:     { yes: "Gute Idee! 🍝",              no: "Noch nicht" },
      coffee:     { yes: "Ja bitte! ☕",               no: "Vielleicht später" },
      break:      { yes: "Ja, Pause! 🧘",              no: "Gleich" },
      stretch:    { yes: "OK, aufstehen! 🚶",          no: "5 Min mehr" },
      water:      { yes: "Wasser holen 💧",            no: "Schon getrunken" },
      night:      { yes: "Bald herunterfahren 🌙",     no: "Noch ein bisschen" },
    };
  } else if (lang === "sv-SE") {
    return {
      breakfast:  { yes: "Ja, äter nu! 🥐",           no: "Äter senare" },
      lunch:      { yes: "Ja, tar paus! 🍽️",          no: "Kommer snart" },
      dinner:     { yes: "Bra idé! 🍝",               no: "Inte än" },
      coffee:     { yes: "Ja tack! ☕",                no: "Kanske senare" },
      break:      { yes: "Ja, tar paus! 🧘",           no: "Strax" },
      stretch:    { yes: "OK, står upp! 🚶",           no: "5 min till" },
      water:      { yes: "Hämtar vatten 💧",           no: "Redan druckit" },
      night:      { yes: "Stänger snart 🌙",           no: "Lite mer" },
    };
  }
  // Default to English
  return {
    breakfast:  { yes: "Yes, eating now! 🥐",    no: "Eating later" },
    lunch:      { yes: "Yes, taking break! 🍽️",  no: "Coming soon" },
    dinner:     { yes: "Good idea! 🍝",          no: "Not yet" },
    coffee:     { yes: "Yes please! ☕",         no: "Maybe later" },
    break:      { yes: "Yes, taking break! 🧘",  no: "In a moment" },
    stretch:    { yes: "OK, standing up! 🚶",    no: "5 more min" },
    water:      { yes: "Getting water now 💧",   no: "Already drank" },
    night:      { yes: "Shutting down soon 🌙",  no: "Just a bit more" },
  };
};

function SuggestionBubble({ suggestion, onAccept, onDismiss, lang = "en-US" }) {
  const labels = getHumanActionLabels(lang)[suggestion.action] || { yes: "Yes! 👍", no: "Not now" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: suggestion.type === "human"
          ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))"
          : "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))",
        border: suggestion.type === "human"
          ? "1px solid rgba(16,185,129,0.25)"
          : "1px solid rgba(139,92,246,0.25)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: suggestion.type === "human" ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.2)",
            border: suggestion.type === "human" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(139,92,246,0.4)"
          }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: suggestion.type === "human" ? "#6ee7b7" : "#c4b5fd" }} />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: suggestion.type === "human" ? "#d1fae5" : "#e2d9ff" }}>
          {suggestion.text}
        </p>
      </div>
      {!suggestion.skipFleet && (
        <div className="flex gap-2 ml-10">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onAccept}
            className="flex-1 py-2 rounded-xl text-[10px] font-mono font-bold tracking-wider transition-all"
            style={{
              background: suggestion.type === "human" ? "rgba(16,185,129,0.25)" : "rgba(139,92,246,0.3)",
              border: suggestion.type === "human" ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(139,92,246,0.5)",
              color: suggestion.type === "human" ? "#6ee7b7" : "#c4b5fd"
            }}>
            {labels.yes}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-[10px] font-mono transition-all"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.5)", color: "#64748b" }}>
            {labels.no}
          </motion.button>
        </div>
      )}
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
  language = "en-US",
  autoStart = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [processingText, setProcessingText] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState(() => language || 'en-US');
  const [showCommands, setShowCommands] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [harborMessage, setHarborMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [continuous, setContinuous] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [speechSupported] = useState(hasSpeechSupport);
  const [textInput, setTextInput] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentReply, setAgentReply] = useState("");

  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isContinuousRef = useRef(continuous);
  const ttsEnabledRef = useRef(ttsEnabled);
  const intentionalStopRef = useRef(false);
  const restartTimerRef = useRef(null);
  const agentConvRef = useRef(null);
  const agentUnsubRef = useRef(null);
  const lastAgentMsgIdRef = useRef(null);
  const isSpeakingAgentRef = useRef(false);

  const m = getMsg(lang);

  useEffect(() => { isContinuousRef.current = continuous; }, [continuous]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { if (language) setLang(language); }, [language]);

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

  // ─── Init Harbor Super Agent conversation + subscribe to replies ─────
  useEffect(() => {
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "harbor_intellect",
          metadata: { name: "VoiceController Session" }
        });
        agentConvRef.current = conv;

        // Subscribe to agent responses and speak them
        agentUnsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
          const msgs = data.messages || [];
          const last = msgs[msgs.length - 1];
          if (!last || last.role !== "assistant" || !last.content) return;
          if (last.id === lastAgentMsgIdRef.current) return; // already spoken
          if (isSpeakingAgentRef.current) return; // don't interrupt
          lastAgentMsgIdRef.current = last.id;

          // Extract clean text for TTS (strip markdown)
          const clean = last.content
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/#{1,6}\s*/g, "")
            .replace(/`(.+?)`/g, "$1")
            .replace(/\n{2,}/g, ". ")
            .replace(/\n/g, " ")
            .slice(0, 600); // cap to avoid super-long TTS

          setAgentReply(last.content);
          setHarborMessage(last.content.slice(0, 200));
          setIsAgentLoading(false);
          setProcessingText("");

          isSpeakingAgentRef.current = true;
          speakRef.current?.(clean, () => { isSpeakingAgentRef.current = false; });
        });
      } catch (e) {
        console.warn("Could not init harbor agent for voice:", e);
      }
    };
    init();
    return () => { agentUnsubRef.current?.(); };
  }, []);

  // ─── Speak ──────────────────────────────────────────────────────────────
  const speakRef = useRef(null);
  const speak = useCallback((text, onDone) => {
    if (!ttsEnabledRef.current) { onDone?.(); return; }
    setIsSpeaking(true);
    harborSpeak(text, {
      lang,
      rate: 0.92,   // naturlig taletempo
      pitch: 1.05,  // subtil, ikke robotisk
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
    // First check-in after 5 sec — give human time to settle in
    const humanTimeout = setTimeout(() => {
      const humanMsg = checkHumanCheckins(lang);
      if (humanMsg) { setSuggestion(humanMsg); speakRef.current?.(humanMsg.text); setHarborMessage(humanMsg.text); return; }
      const fleetMsg = generateProactiveMessage(vehicles, alerts, routes, lang);
      if (fleetMsg) { setSuggestion(fleetMsg); speakRef.current?.(fleetMsg.text); setHarborMessage(fleetMsg.text); }
    }, 5000);
    // Check every 5 min for new contextual messages
    const periodicInterval = setInterval(() => {
      const humanMsg = checkHumanCheckins(lang);
      if (humanMsg && !suggestion) {
        setSuggestion(humanMsg);
        speakRef.current?.(humanMsg.text);
        setHarborMessage(humanMsg.text);
        return;
      }
      const fleetMsg = generateProactiveMessage(vehicles, alerts, routes, lang);
      if (fleetMsg && !suggestion) {
        setSuggestion(fleetMsg);
        speakRef.current?.(fleetMsg.text);
        setHarborMessage(fleetMsg.text);
      }
    }, 5 * 60 * 1000);
    return () => { clearTimeout(humanTimeout); clearInterval(periodicInterval); };
  }, [lang, vehicles, alerts, routes, suggestion]);

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

  // ─── Send text to Harbor Super Agent ──────────────────────────────────
  const initAgentConversation = useCallback(async () => {
    if (agentConvRef.current) return;
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "harbor_intellect",
        metadata: { name: "Voice Session" }
      });
      agentConvRef.current = conv;
      agentUnsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        const msgs = (data.messages || []).filter(m => m.role !== 'system');
        const last = msgs[msgs.length - 1];
        if (!last || last.role !== 'assistant' || !last.content) return;
        if (last.id === lastAgentMsgIdRef.current) return;
        if (isSpeakingAgentRef.current) return;
        lastAgentMsgIdRef.current = last.id;
        const clean = last.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/#{1,6}\s*/g, '').replace(/`(.+?)`/g, '$1').replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').slice(0, 600);
        setAgentReply(last.content);
        setHarborMessage(last.content.slice(0, 200));
        setIsAgentLoading(false);
        setProcessingText('');
        isSpeakingAgentRef.current = true;
        speakRef.current?.(clean, () => { isSpeakingAgentRef.current = false; });
      });
    } catch (e) {
      console.warn('Could not init agent:', e);
    }
  }, []);

  const sendToAgent = useCallback(async (text) => {
    if (!agentConvRef.current) await initAgentConversation();
    if (!agentConvRef.current) return;
    setIsAgentLoading(true);
    try {
      await base44.agents.addMessage(agentConvRef.current, { role: 'user', content: text });
    } catch (e) {
      toast.error('Agent error: ' + e.message);
      setIsAgentLoading(false);
    }
  }, [initAgentConversation]);

  // ─── Handle recognized text ────────────────────────────────────────────
  const handleFinalText = useCallback((text) => {
    const msgs = getMsg(lang);
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
      speakRef.current?.(msgs.farewell);
      setTimeout(() => onCloseRef.current?.(), 800);
      return;
    }
    if (action === "cmd:send") {
      speakRef.current?.(msgs.sendingCmd);
      onSendRef.current?.();
      setProcessingText("");
      return;
    }
    if (action === "cmd:clear") {
      onTranscriptRef.current?.("");
      speakRef.current?.(msgs.cleared);
      setProcessingText("");
      return;
    }
    if (action === "cmd:close_windows") {
      onCloseWindowsRef.current?.();
      speakRef.current?.(msgs.closingWindows);
      setHarborMessage(msgs.closingWindows);
      setProcessingText("");
      return;
    }
    if (action === "cmd:help") {
      speakRef.current?.(msgs.help);
      setHarborMessage(msgs.help);
      setShowCommands(true);
      setProcessingText("");
      return;
    }
    if (action === "cmd:morning_briefing") {
      const getMsgFuncs = { "en-US": () => msgs, "da-DK": () => msgs, "de-DE": () => msgs, "sv-SE": () => msgs };
      const briefing = msgs.briefing(vehicles.length, alerts.filter(a => !a.is_read).length, routes.filter(r => r.status === "active").length);
      speakRef.current?.(briefing);
      setHarborMessage(briefing);
      setProcessingText("");
      return;
    }
    if (action?.startsWith("nav:")) {
      const page = action.split(":")[1];
      const msg = msgs.navigating(page);
      setHarborMessage(msg);
      speakRef.current?.(msg);
      onNavigateRef.current?.(page);
      setProcessingText("");
      return;
    }
    if (action?.startsWith("window:")) {
      const windowType = action.split(":")[1];
      const msg = msgs.opening(windowType.replace(/_/g, " "));
      setHarborMessage(msg);
      speakRef.current?.(msg);
      onOpenWindowRef.current?.(windowType);
      setProcessingText("");
      return;
    }

    // Hologram-opening intelligence: detect analysis/window requests and open + send
    const lower = text.toLowerCase();
    const hologramMap = [
      { patterns: [/multidimensional|deep analysis|fleet analysis|analyse.*flåde|fleet.*analys|run.*analysis|show.*analysis/], window: "deep_analysis" },
      { patterns: [/predictive.*maintenance|maintenance.*predict|vedligeholdelse|forudsig/], window: "predictive_maintenance" },
      { patterns: [/risk.*assess|assess.*risk|risk analysis|risiko/], window: "risk_assessment" },
      { patterns: [/demand.*forecast|forecast|efterspørgsel/], window: "demand_forecast" },
      { patterns: [/performance.*analytic|kpi|nøgletal/], window: "performance_analytics" },
      { patterns: [/satellite|weather|vejr|væjret|storm/], window: "satellite_weather" },
      { patterns: [/news|nyheder|latest.*news/], window: "news_intelligence" },
      { patterns: [/3d.*globe|globe|3d.*flåde|globus/], window: "fleet_3d_viewer" },
      { patterns: [/project|projekt|task/], window: "project_management" },
      { patterns: [/document|dokument|report.*doc/], window: "document_editor" },
    ];
    for (const entry of hologramMap) {
      if (entry.patterns.some(p => p.test(lower))) {
        const msg = msgs.opening(entry.window.replace(/_/g, " "));
        speakRef.current?.(msgs.understood);
        setHarborMessage(msg);
        onOpenWindowRef.current?.(entry.window);
        // Also send to agent for analysis content
        setTimeout(() => { sendToAgent(text); setProcessingText(""); }, 400);
        return;
      }
    }

    // Free-form — send to Harbor Super Agent
    const sendMsg = msgs.sending(text);
    setHarborMessage(sendMsg);
    speakRef.current?.(msgs.understood, () => {
      setTimeout(() => {
        sendToAgent(text);
        setProcessingText("");
      }, 500);
    });
  }, [lang, vehicles, alerts, routes, sendToAgent]);

  const handleFinalTextRef = useRef(handleFinalText);
  useEffect(() => { handleFinalTextRef.current = handleFinalText; }, [handleFinalText]);

  // ─── Start recognition ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    intentionalStopRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setHarborMessage(getMsg(lang).noSpeech);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
      setHarborMessage(getMsg(lang).listening);
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
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        intentionalStopRef.current = true;
        setHarborMessage(getMsg(lang).noMic);
        setIsListening(false);
        stopAmplitude();
        recognitionRef.current = null;
      } else if (e.error === "no-speech") {
        // Normal: restart with longer delay
        recognitionRef.current = null;
        if (!intentionalStopRef.current) {
          restartTimerRef.current = setTimeout(() => startListening(), 1200);
        }
      } else if (e.error !== "aborted") {
        recognitionRef.current = null;
        setIsListening(false);
        stopAmplitude();
        if (!intentionalStopRef.current) {
          restartTimerRef.current = setTimeout(() => startListening(), 800);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAmplitude();
      recognitionRef.current = null;
      if (isContinuousRef.current && !intentionalStopRef.current) {
        restartTimerRef.current = setTimeout(() => startListening(), 1500);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang, startAmplitude, stopAmplitude]);

  const stopListening = useCallback(() => {
    intentionalStopRef.current = true;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAmplitude();
  }, [stopAmplitude]);

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      stopListening();
    } else {
      initAgentConversation();
      if (!voiceReady) {
        setVoiceReady(true);
        speakRef.current?.(greetingRef.current, () => startListening());
      } else {
        startListening();
      }
    }
  };

  useEffect(() => {
    if (autoStart && speechSupported) {
      initAgentConversation();
      setVoiceReady(true);
      speakRef.current?.(greetingRef.current, () => startListening());
    }
  }, [autoStart, initAgentConversation]);

  const greetingRef = useRef("");
  useEffect(() => {
    const msgs = getMsg(lang);
    const greeting = msgs.greeting(vehicles.length, alerts.filter(a => !a.is_read).length, lang);
    greetingRef.current = greeting;
    setHarborMessage(greeting);
    return () => { stopListening(); window.speechSynthesis?.cancel(); };
  }, [lang, vehicles, alerts, stopListening]);

  // ─── Text input submit (fallback for all browsers) ─────────────────────
  const handleTextSubmit = (e) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    setProcessingText(text);
    setHarborMessage(getMsg(lang).sending(text));
    setTimeout(() => {
      handleFinalTextRef.current(text);
    }, 100);
  };

  const LANGS = [
    { code: "en-US", label: "EN" },
    { code: "da-DK", label: "DK" },
    { code: "de-DE", label: "DE" },
    { code: "sv-SE", label: "SV" },
  ];

  const NAV_COMMANDS = [
    { label: "Dashboard", icon: LayoutDashboard, action: () => { onNavigate?.("Dashboard"); speak("Navigating to dashboard"); } },
    { label: "Fleet", icon: Truck, action: () => { onOpenWindow?.("fleet"); speak(lang === "da-DK" ? "Åbner flåde" : "Opening fleet"); } },
    { label: "Alerts", icon: AlertTriangle, action: () => { onNavigate?.("Alerts"); speak(lang === "da-DK" ? "Åbner advarsler" : "Opening alerts"); } },
    { label: "Routes", icon: Navigation, action: () => { onOpenWindow?.("routes"); speak(lang === "da-DK" ? "Åbner ruter" : "Opening routes"); } },
    { label: "Shipments", icon: Package, action: () => { onOpenWindow?.("shipments"); speak(lang === "da-DK" ? "Åbner forsendelser" : "Opening shipments"); } },
    { label: "Analysis", icon: BarChart3, action: () => { onOpenWindow?.("deep_analysis"); speak(lang === "da-DK" ? "Åbner dybdeanalyse" : "Opening analysis"); } },
    { label: "App Builder", icon: Zap, action: () => { onOpenWindow?.("harbor_app_builder"); speak(lang === "da-DK" ? "Åbner app builder" : "Opening app builder"); } },
    { label: "Fleet Store", icon: Globe, action: () => { onOpenWindow?.("fleet_store"); speak(lang === "da-DK" ? "Åbner fleet store" : "Opening fleet store"); } },
    { label: "3D Globe", icon: Brain, action: () => { onOpenWindow?.("fleet_3d_viewer"); speak(lang === "da-DK" ? "Åbner 3D verden" : "Opening 3D globe"); } },
    { label: "Maintenance", icon: Settings, action: () => { onOpenWindow?.("predictive_maintenance"); speak(lang === "da-DK" ? "Åbner vedligeholdelse" : "Opening maintenance"); } },
    { label: "News", icon: FileText, action: () => { onOpenWindow?.("news_intelligence"); speak(lang === "da-DK" ? "Åbner nyheder" : "Opening news"); } },
    { label: "Close All", icon: X, action: () => { onCloseWindows?.(); speak(lang === "da-DK" ? "Lukker alle vinduer" : "Closing all windows"); } },
  ];

  const statusColor = isSpeaking ? "#a78bfa" : isListening ? "#22d3ee" : "#334155";
  const statusLabel = isSpeaking ? m.speaking : isListening ? m.listeningStatus : voiceReady ? m.standby : m.activate;

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
                {!speechSupported && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1"
                    style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <Keyboard className="w-2.5 h-2.5" /> TEXT MODE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setTtsEnabled(p => !p)}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: ttsEnabled ? "#06b6d4" : "#475569" }}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {speechSupported && (
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
            )}
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
                  {m.activeBanner}
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
               lang={lang}
               onAccept={() => {
                  setSuggestion(null);
                  if (suggestion.action === "open_alerts") { onNavigate?.("Alerts"); speak(lang === "da-DK" ? "Åbner advarsler." : "Opening alerts."); }
                  else if (suggestion.action === "analyze_fleet") { onOpenWindow?.("deep_analysis"); speak(lang === "da-DK" ? "Åbner flådeanalyse." : "Opening fleet analysis."); }
                  else { speak(lang === "da-DK" ? "Åbner nu." : "Opening now."); }
                }}
                onDismiss={() => { setSuggestion(null); speak(lang === "da-DK" ? "Ingen problem." : "No problem."); }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Main interaction area */}
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Mic button — only shown when speech is supported */}
          {speechSupported && (
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
          )}

          {/* Live transcript + text input */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <AnimatePresence mode="wait">
              {interimText ? (
                <motion.div key="interim" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.4)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div className="w-2 h-2 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.4, repeat: Infinity }}
                      style={{ background: "#22d3ee", boxShadow: "0 0 8px #22d3ee" }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(6,182,212,0.7)" }}>Detecting...</span>
                  </div>
                  <p className="text-base font-semibold leading-snug" style={{ color: "#e0f9ff" }}>„{interimText}"</p>
                </motion.div>
              ) : processingText ? (
                <motion.div key="processing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div className="w-2 h-2 rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                      style={{ background: "#a78bfa" }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Understood:</span>
                  </div>
                  <p className="text-base font-semibold leading-snug" style={{ color: "#e2d9ff" }}>„{processingText}"</p>
                </motion.div>
              ) : (
                <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm leading-relaxed"
                  style={{ color: isSpeaking ? "#e2d9ff" : "#4b5563" }}
                >
                  {harborMessage}
                </motion.p>
              )}
            </AnimatePresence>

            {speechSupported ? (
              <Waveform isActive={isListening} amplitude={amplitude} isSpeaking={isSpeaking} />
            ) : (
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={m.typeHint}
                  className="flex-1 rounded-xl px-4 py-3 text-base bg-transparent text-white placeholder-slate-500 outline-none font-medium"
                  style={{ border: "1.5px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.08)" }}
                />
                <motion.button type="submit" whileTap={{ scale: 0.93 }}
                  disabled={!textInput.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.4)" }}>
                  <Send className="w-4 h-4" style={{ color: "#06b6d4" }} />
                </motion.button>
              </form>
            )}
          </div>
        </div>

        {/* Always-visible text input (even when speech is supported) */}
        {speechSupported && (
          <form onSubmit={handleTextSubmit} className="px-5 pb-4 flex items-center gap-2">
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={m.typeHint}
              className="flex-1 rounded-xl px-4 py-3 text-base bg-transparent text-white placeholder-slate-500 outline-none font-medium"
              style={{ border: "1.5px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.08)" }}
            />
            <motion.button type="submit" whileTap={{ scale: 0.93 }}
              disabled={!textInput.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.4)" }}>
              <Send className="w-4 h-4" style={{ color: "#06b6d4" }} />
            </motion.button>
          </form>
        )}

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
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] mb-2.5" style={{ color: "#334155" }}>{m.quickNav}</p>
                  <div className="flex flex-wrap gap-2">
                    {NAV_COMMANDS.map(cmd => (
                      <CommandChip key={cmd.label} label={cmd.label} icon={cmd.icon}
                        onClick={() => { cmd.action(); }} />
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