// H.A.R.B.O.R Voice Agent — kvindelig AI-kollega med proaktiv + menneskelig adfærd

const HARBOR_VOICE_NAME = "H.A.R.B.O.R";

// ─── Persistent state helpers (localStorage) ──────────────────────────────
export const STORAGE_KEY = "harbor_agent_state";

export function getAgentState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function setAgentState(patch) {
  try {
    const current = getAgentState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

// ─── Track work session ────────────────────────────────────────────────────
export function recordActivity() {
  const now = Date.now();
  const state = getAgentState();
  // sessionStart: when the current continuous session started
  if (!state.sessionStart) {
    setAgentState({ sessionStart: now, lastActive: now });
  } else {
    // If last activity was > 30 min ago, reset session (user took a break)
    const gap = now - (state.lastActive || now);
    if (gap > 30 * 60 * 1000) {
      setAgentState({ sessionStart: now, lastActive: now, breakSuggested: false });
    } else {
      setAgentState({ lastActive: now });
    }
  }
}

export function getWorkDurationMinutes() {
  const state = getAgentState();
  if (!state.sessionStart) return 0;
  return Math.floor((Date.now() - state.sessionStart) / 60000);
}

// ─── Find best female voice ────────────────────────────────────────────────
export function getBestFemaleVoice(lang = "da-DK") {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const femaleKeywords = [
    "sara", "karen", "anna", "sofie", "ida", "helle", "inger",
    "female", "woman", "fiona", "samantha", "victoria",
    "google dansk", "microsoft helle", "microsoft sara",
  ];

  const langCode = lang.split("-")[0].toLowerCase();
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));

  for (const keyword of femaleKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  if (langVoices.length) return langVoices[0];

  const enVoices = voices.filter(v => v.lang.startsWith("en"));
  for (const keyword of femaleKeywords) {
    const match = enVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return voices[0] || null;
}

export function harborSpeak(text, { lang = "da-DK", rate = 1.0, pitch = 1.1, volume = 1, onStart, onEnd } = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = rate;
  utt.pitch = pitch;
  utt.volume = volume;

  const setVoiceAndSpeak = () => {
    const voice = getBestFemaleVoice(lang);
    if (voice) utt.voice = voice;
    if (onStart) utt.onstart = onStart;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      setVoiceAndSpeak();
    };
  } else {
    setVoiceAndSpeak();
  }
}

// ─── Human-like checks ────────────────────────────────────────────────────

// Returns a "human" proactive message if conditions are met, or null
export function checkHumanCheckins() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay(); // 0=sun, 1=mon, ..., 5=fri, 6=sat
  const state = getAgentState();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  // ─── Monday: how was your weekend? ──────────────────────────────────────
  if (day === 1 && hour >= 8 && hour <= 10) {
    const key = `mondayAsked_${todayKey}`;
    if (!state[key] && !state.workedWeekend) {
      setAgentState({ [key]: true });
      const msgs = [
        "Godmorgen! Jeg håber du har haft en god weekend 😊 Hvad lavede du?",
        "Hej igen! Godt at se dig. Hvordan var weekenden — fik du slappet ordentligt af?",
        "God mandag! Jeg håber weekenden gav lidt energi. Hvad lavede du?",
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", skipFleet: true };
    }
  }

  // ─── Friday: weekend plans? ──────────────────────────────────────────────
  if (day === 5 && hour >= 13 && hour <= 16) {
    const key = `fridayAsked_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      const msgs = [
        "Hej! Det er jo fredag eftermiddag — har du nogle planer for weekenden? 🎉",
        "Fredag allerede! Glæder du dig til weekenden? Har du noget fedt på programmet?",
        "Næsten weekend! Har du planlagt noget sjovt?",
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", skipFleet: true };
    }
  }

  // ─── Breakfast reminder (8–9) ────────────────────────────────────────────
  if (hour === 8 && minute >= 30) {
    const key = `breakfast_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      const msgs = [
        "Husk at spise morgenmad! Det er vigtigt at starte dagen rigtigt. 🥐",
        "Har du spist morgenmad? Hjernen arbejder bedre med lidt brændstof!",
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", action: "breakfast" };
    }
  }

  // ─── Lunch reminder (11:30–12:30) ───────────────────────────────────────
  if (hour === 12 && minute <= 30 || (hour === 11 && minute >= 30)) {
    const key = `lunch_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      const msgs = [
        "Det er ved at være frokosttid! Husk at tage en pause og spise noget 🍽️",
        "Hej! Har du husket frokosten? Det er vigtigt at holde energien oppe.",
        "Frokosten kalder! Skal vi tage en pause og spise lidt?",
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", action: "lunch" };
    }
  }

  // ─── Dinner / end of day (17–18) ─────────────────────────────────────────
  if (hour >= 17 && hour <= 18) {
    const key = `dinner_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      const msgs = [
        "Snart tid til aftensmad! Husk at spise ordentligt efter en lang dag 🍴",
        "Det er ved at blive aften — har du planlagt aftensmad? Husk at tage en ordentlig pause.",
      ];
      return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", action: "dinner" };
    }
  }

  // ─── Coffee reminder (random interval ~every 90 min) ────────────────────
  const lastCoffee = state.lastCoffeeReminder || 0;
  const coffeeInterval = 90 * 60 * 1000 + (Math.random() * 20 - 10) * 60 * 1000; // ~90min ±10min
  if (hour >= 7 && hour <= 17 && Date.now() - lastCoffee > coffeeInterval) {
    setAgentState({ lastCoffeeReminder: Date.now() });
    const msgs = [
      "Har du husket din kaffe? ☕ Et lille kaffepause kan gøre underværker for koncentrationen.",
      "Kaffe-alarm! ☕ Er det ikke tid til en lille pause med en kop?",
      "Tid til kaffe? ☕ Jeg har bemærket du har arbejdet i et stykke tid.",
    ];
    return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", action: "coffee" };
  }

  // ─── Break reminder (every ~50-60 min of work) ───────────────────────────
  const workMins = getWorkDurationMinutes();
  const breakThreshold = 50 + Math.floor(Math.random() * 15); // 50-65 min
  if (workMins >= breakThreshold && !state.breakSuggested) {
    setAgentState({ breakSuggested: true });
    const msgs = [
      `Du har arbejdet i ${workMins} minutter uden pause. Kroppen har brug for en lille pusterum — hvad med 5 minutter væk fra skærmen? 🧘`,
      `Hej! Jeg har lagt mærke til at du har siddet ved computeren i over ${workMins} minutter. Husk at tage en pause — dine øjne og ryg vil takke dig!`,
      `${workMins} minutters fokuseret arbejde — imponerende! Men husk at tage en kort pause. Lidt bevægelse hjælper produktiviteten.`,
    ];
    return { text: msgs[Math.floor(Math.random() * msgs.length)], type: "human", action: "break" };
  }

  return null;
}

// ─── Professional fleet proactive messages ───────────────────────────────
export function generateProactiveMessage(vehicles = [], alerts = [], routes = []) {
  const idleVehicles = vehicles.filter(v => v.status === "idle").length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const activeRoute = routes.find(r => r.status === "active");
  const hour = new Date().getHours();

  const suggestions = [];

  if (unreadAlerts > 2) {
    suggestions.push({
      text: `Du har ${unreadAlerts} ulæste advarsler. Vil du have mig til at gennemgå dem?`,
      action: "open_alerts", priority: 3,
    });
  }
  if (idleVehicles > 3) {
    suggestions.push({
      text: `Jeg kan se ${idleVehicles} køretøjer i tomgang. Skal jeg optimere ruterne og spare dig tid?`,
      action: "analyze_fleet", priority: 2,
    });
  }
  if (activeRoute) {
    suggestions.push({
      text: `Ruten ${activeRoute.name} er aktiv. Vil du have en statusopdatering?`,
      action: "check_route", priority: 1,
    });
  }
  if (hour >= 8 && hour <= 9) {
    suggestions.push({
      text: `God morgen! Din flåde har ${vehicles.length} køretøjer. Vil du starte dagen med et overblik?`,
      action: "morning_briefing", priority: 4,
    });
  }
  if (hour >= 16 && hour <= 17) {
    suggestions.push({
      text: `Dagen nærmer sig sin slutning. Skal jeg lave en opsummering af hvad der er sket i dag?`,
      action: "daily_summary", priority: 2,
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority)[0] || null;
}

// ─── Detect human/conversational replies ─────────────────────────────────
export function detectHumanConversation(text) {
  const t = text.toLowerCase().trim();

  const greetings = /^(hej|hey|godmorgen|goddag|god morgen|hi|hallo|halløj)/i;
  const howAreYou = /(hvordan har du det|hvordan går det|hvad sker der|alt godt)/i;
  const weekend = /(weekend|lørdag|søndag|hygge|afslappet|festival|fest|sport|tur|rejse)/i;
  const plans = /(planer|planlagt|skal|tænker|overvejer)/i;
  const breakReply = /(ja|okay|ok|jep|jo|selvfølgelig|straks|nu|godt|tak)/i;
  const negative = /(nej|nope|ikke nu|måske|senere|ingen planer)/i;

  if (greetings.test(t)) return "greeting";
  if (howAreYou.test(t)) return "howAreYou";
  if (weekend.test(t)) return "weekendChat";
  if (plans.test(t)) return "plansChat";
  if (breakReply.test(t) && t.length < 20) return "affirmative";
  if (negative.test(t) && t.length < 20) return "negative";
  return null;
}

export function getHumanReply(type, text = "") {
  const replies = {
    greeting: [
      "Hej! Dejligt at se dig 😊 Hvad kan jeg hjælpe dig med i dag?",
      "Hejsa! Klar til en ny dag? Hvad har du på programmet?",
      "Goddag! Hvad kan jeg gøre for dig?",
    ],
    howAreYou: [
      "Jeg har det fint, tak for du spørger! Altid klar til at hjælpe dig. Hvad med dig?",
      "Jeg er frisk og klar! Systemerne kører fint i dag. Hvad med dig — har du det godt?",
      "Det går fint her! Fuldt overblik over flåden. Hvad kan jeg hjælpe dig med?",
    ],
    weekendChat: [
      "Det lyder hyggeligt! Godt at du fik ladet op. Klar til en ny uge?",
      "Skønt! Gode weekender giver energi til ugen. Hvad vil vi starte med i dag?",
      "Dejligt at høre! Hvil og restitution er vigtig. Nu er vi klar til ugen!",
    ],
    plansChat: [
      "Det lyder sjovt! Husk at nyde det — arbejdet kan vente. 😊",
      "Sikke noget at se frem til! Weekenden fortjener du.",
      "Godt at du har noget at glæde dig til. Det er vigtigt med fritid!",
    ],
    affirmative: [
      "Perfekt! Tag bare en god pause. Jeg holder øje med tingene her. 💪",
      "Godt! Kom tilbage når du er klar — flåden er i gode hænder.",
      "Rigtig god idé. Lidt frisk luft gør underværker!",
    ],
    negative: [
      "Ingen problem! Sig til hvis du har brug for mig. Jeg er her. 😊",
      "Okay, ingen pres! Du ved bedst. Jeg er her hvis du har brug for hjælp.",
      "Det er helt fint. Bare arbejd videre — jeg holder øje.",
    ],
  };

  const options = replies[type] || ["Forstået! Hvad kan jeg ellers hjælpe med?"];
  return options[Math.floor(Math.random() * options.length)];
}