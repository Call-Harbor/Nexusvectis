// H.A.R.B.O.R Voice Agent — charmerende AI-kollega med dyb menneskelig adfærd

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
  if (!state.sessionStart) {
    setAgentState({ sessionStart: now, lastActive: now });
  } else {
    const gap = now - (state.lastActive || now);
    if (gap > 30 * 60 * 1000) {
      // Reset session after 30 min inactivity
      setAgentState({ sessionStart: now, lastActive: now, breakSuggested: false, stretchSuggested: false });
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

// ─── Tidsinformeret hilsen ─────────────────────────────────────────────────
export function getTimeBasedGreeting(vehicleCount = 0, unreadAlerts = 0) {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const mins = getWorkDurationMinutes();
  const isWeekend = day === 0 || day === 6;
  const name = ""; // placeholder — ville normalt trækkes fra brugerdata

  if (isWeekend) {
    if (hour < 10) {
      return [
        "Hej! Du er tidlig oppe i weekenden 😄 Noget vigtigt der trænger sig på?",
        "God weekend-morgen! Håber det er noget godt der bringer dig herind.",
      ][Math.floor(Math.random() * 2)];
    }
    return [
      "Hej! Du arbejder i weekenden — det er dedikeret 💪 Hvad kan jeg hjælpe med?",
      "Hej! Weekend-arbejde? Du er flittig! Lad os gøre det hurtigt og effektivt 😊",
    ][Math.floor(Math.random() * 2)];
  }

  if (hour >= 4 && hour < 6) {
    return "Hej natteravn! Du er tidlig oppe 🌙 Kaffe anbefales kraftigt. Hvad er der sket?";
  }
  if (hour >= 6 && hour < 8) {
    return [
      `God tidlig morgen! Du er frisk i dag 🌅 ${vehicleCount} køretøjer venter. Hvad starter vi med?`,
      "Hej! Tidlig start — jeg kan godt lide din energi! Flåden er klar. Hvad vil du?",
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 8 && hour < 10) {
    const alerts = unreadAlerts > 0 ? ` Du har ${unreadAlerts} ulæste advarsler.` : " Alt ser roligt ud.";
    return [
      `God morgen! Klar til en ny dag? ☀️${alerts} Hvad skal vi starte med?`,
      `Hej! Godt du er her. Morgenmad spist?${alerts} Hvad kan jeg hjælpe med?`,
      `Godmorgen! Håber du fik sovet godt 😊 ${vehicleCount} køretøjer er aktive. Hvad siger du?`,
    ][Math.floor(Math.random() * 3)];
  }
  if (hour >= 10 && hour < 12) {
    return [
      `Hej! Godt gang i formiddagen? Flåden kører fint. Hvad har du brug for?`,
      `God formiddag! Du har arbejdet godt i dag — hvad kan jeg hjælpe dig med nu?`,
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 12 && hour < 14) {
    return [
      "Hej! Frokostpause snart? Husk at spise — du yder bedst med mad i maven 🍽️",
      "God middag! Håber du spiser en ordentlig frokost. Hvad kan jeg hjælpe med?",
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 14 && hour < 16) {
    return [
      "Hej! Eftermiddagen er i gang — hold fokus 💪 Hvad skal vi løse?",
      "God eftermiddag! Du er halvvejs igennem dagen. Hvad er næste skridt?",
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 16 && hour < 18) {
    return [
      "Hej! Dagen nærmer sig sin afslutning 🌇 Hvad vil du nå inden fyraften?",
      "God sen eftermiddag! Er der noget der skal lukkes ned eller følges op på inden du går?",
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 18 && hour < 21) {
    return [
      "Hej! Du arbejder sent i dag 🌆 Husk at koble af til sidst. Hvad mangler du?",
      "God aften! Du er flittig — hvad kan jeg hjælpe dig med at afslutte?",
    ][Math.floor(Math.random() * 2)];
  }
  return [
    "Hej natteravn! 🌙 Du arbejder sent — hvad kan jeg hjælpe dig med?",
    "Hej! Sent på aftenen — hvad er der? Flåden kører stadig. Hvad har du brug for?",
  ][Math.floor(Math.random() * 2)];
}

// ─── Find best female voice ────────────────────────────────────────────────
export function getBestFemaleVoice(lang = "da-DK") {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const langCode = lang.split("-")[0].toLowerCase();
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));

  // Priority 1: Neural/natural voices (Google/Microsoft neural are most human)
  const neuralKeywords = ["neural", "natural", "premium", "enhanced", "wavenet", "journey"];
  for (const keyword of neuralKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // Priority 2: Known good female voices
  const femaleKeywords = [
    "sara", "karen", "anna", "sofie", "ida", "helle", "inger",
    "female", "woman", "fiona", "samantha", "victoria",
    "google dansk", "microsoft helle", "microsoft sara",
  ];
  for (const keyword of femaleKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // Priority 3: Any lang match, prefer Google voices (tend to be more natural)
  const googleVoice = langVoices.find(v => v.name.toLowerCase().includes("google"));
  if (googleVoice) return googleVoice;
  if (langVoices.length) return langVoices[0];

  // Fallback: English neural
  const enVoices = voices.filter(v => v.lang.startsWith("en"));
  const enNeural = enVoices.find(v => neuralKeywords.some(k => v.name.toLowerCase().includes(k)));
  if (enNeural) return enNeural;
  const enGoogle = enVoices.find(v => v.name.toLowerCase().includes("google"));
  if (enGoogle) return enGoogle;
  return voices[0] || null;
}

// ─── Make text sound more natural for TTS ────────────────────────────────
function humanizeTextForTTS(text) {
  return text
    // Short pause after exclamation mid-sentence
    .replace(/! ([A-ZÆØÅa-zæøå])/g, "! ... $1")
    // Slight pause after question mid-sentence
    .replace(/\? ([A-ZÆØÅa-zæøå])/g, "? ... $1")
    // Remove markdown
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`(.+?)`/g, "$1")
    // Replace bullet points with natural pause
    .replace(/^[•\-\*]\s*/gm, "... ")
    // Numbers: make them sound natural
    .replace(/(\d+)%/g, "$1 procent")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    // Collapse multiple spaces/newlines
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function harborSpeak(text, { lang = "da-DK", rate = 0.92, pitch = 1.05, volume = 1, onStart, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();

  const processedText = humanizeTextForTTS(text);

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(processedText);
    utt.lang = lang;
    utt.rate = rate;   // 0.92 = slightly slower, more natural
    utt.pitch = pitch; // 1.05 = subtle, not robotic high pitch
    utt.volume = volume;

    const voice = getBestFemaleVoice(lang);
    if (voice) utt.voice = voice;
    if (onStart) utt.onstart = onStart;

    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    utt.onend = () => { clearInterval(keepAlive); onEnd?.(); };
    utt.onerror = () => { clearInterval(keepAlive); onEnd?.(); };

    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(utt);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let retries = 0;
    const trySpeak = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0 || retries >= 5) { doSpeak(); return; }
      retries++;
      setTimeout(trySpeak, 250);
    };
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
    setTimeout(trySpeak, 300);
  } else {
    doSpeak();
  }
}

// ─── Rig menneskelige check-ins baseret på tid + arbejdssession ────────────
export function checkHumanCheckins() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  const state = getAgentState();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const workMins = getWorkDurationMinutes();

  // ─── MANDAG: Hvordan var weekenden? ─────────────────────────────────────
  if (day === 1 && hour >= 8 && hour <= 10) {
    const key = `mondayAsked_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "God mandag! 😊 Håber weekenden gav dig noget energi. Hvad lavede du? Noget hyggeligt?",
        "Hej! Mandag igen — men vi klarer det! Fik du slappet ordentligt af i weekenden?",
        "Godmorgen mandag! ☀️ Weekenden er slut, men lad os gøre denne uge god. Hvad er din plan i dag?",
      ]), type: "human", skipFleet: true };
    }
  }

  // ─── FREDAG EFTERMIDDAG: Weekend-planer ──────────────────────────────────
  if (day === 5 && hour >= 13 && hour <= 16) {
    const key = `fridayAsked_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Det er fredag eftermiddag! 🎉 Har du noget fedt planlagt for weekenden?",
        "Næsten weekend! Hvad glæder du dig til? Du fortjener en god pause 😊",
        "Fredag — den bedste dag! Hvad har du planlagt for de næste to dage?",
      ]), type: "human", skipFleet: true };
    }
  }

  // ─── TIDLIG MORGEN: Kaffe-start ──────────────────────────────────────────
  if (hour >= 6 && hour < 8) {
    const key = `earlyMorning_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Du er tidlig på den i dag! ☕ Husk at starte med en god kop kaffe inden du kaster dig over flåden.",
        "Tidlig fugl! 🌅 Har du fået din morgenkop? Det er vigtigt at starte dagen rigtigt.",
      ]), type: "human", action: "coffee" };
    }
  }

  // ─── MORGENMAD (7:30–9:00) ───────────────────────────────────────────────
  if ((hour === 7 && minute >= 30) || (hour === 8 && minute <= 59)) {
    const key = `breakfast_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Hej! Husk at spise morgenmad 🥐 Hjernen kører meget bedre med lidt brændstof i tanken!",
        "Har du spist morgenmad endnu? Seriøst — det er det vigtigste måltid. Et lille øjeblik væk fra skærmen!",
        "Morgenmads-påmindelsen fra mig: Spis noget godt! 🍳 Du behøver energi til at håndtere flåden.",
        "Hvornår spiste du sidst? Morgenmad giver dig 3 gange bedre fokus — det er videnskab! 😄",
      ]), type: "human", action: "breakfast" };
    }
  }

  // ─── FORMIDDAG KAFFE (9:30–11:00) ───────────────────────────────────────
  if ((hour === 9 && minute >= 30) || hour === 10) {
    const key = `midMorningCoffee_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Formiddagskaffe-tid! ☕ En kort pause giver frisk energi til resten af formiddagen.",
        "Har du fået din anden kop kaffe? Du har arbejdet koncentreret — tag et lille åndehul!",
        "Kaffe-alarm 🔔 Det er tid til en lille pause. Flåden klarer sig fint i 5 minutter!",
      ]), type: "human", action: "coffee" };
    }
  }

  // ─── FROKOST (11:30–13:00) ──────────────────────────────────────────────
  if ((hour === 11 && minute >= 30) || (hour === 12)) {
    const key = `lunch_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Frokosten kalder! 🍽️ Det er vigtigt at holde energien oppe — tag en ordentlig pause og spis noget godt.",
        "Hej! Har du husket frokosten? Du har arbejdet hårdt i formiddags — du fortjener en pause!",
        "Frokosttid! 🥗 Vidste du at en god frokostpause øger produktiviteten med op til 30%? Gå nu!",
        "Stop hvad du laver og spis noget! 😄 Flåden er i mine hænder i 20 minutter. Gå og lad op.",
      ]), type: "human", action: "lunch" };
    }
  }

  // ─── EFTERMIDDAGSKAFFE (14:00–15:30) ────────────────────────────────────
  if ((hour === 14) || (hour === 15 && minute <= 30)) {
    const key = `afternoonCoffee_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Eftermiddagsslump? ☕ Det er præcis det rigtige tidspunkt for en kop kaffe og et øjebliks pause.",
        "Det er kaffe-tid igen! 14-slumpen er real — en kop kaffe og 5 min fra skærmen hjælper!",
        "Hej! Har du energi til resten af dagen? Kaffe og et lille stykke chokolade gør underværker 🍫☕",
      ]), type: "human", action: "coffee" };
    }
  }

  // ─── SENT PÅ EFTERMIDDAGEN / AFTENSMAD (17:00–18:30) ────────────────────
  if ((hour >= 17 && hour <= 18) || (hour === 18 && minute <= 30)) {
    const key = `dinner_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Det er snart aftensmad-tid! 🍴 Husk at spise ordentligt efter en lang dag og koble lidt af.",
        "Hej! Du har arbejdet en hel dag — snart tid til at slappe af og spise noget godt 🍝",
        "Aftensmads-alarm! Er der styr på maden i aften? Du fortjener et godt måltid efter i dag.",
        "Klokken er mange — har du tænkt på hvad du spiser i aften? Et godt måltid er det bedste afsæt til morgen!",
      ]), type: "human", action: "dinner" };
    }
  }

  // ─── SENT AFTENSESSION ──────────────────────────────────────────────────
  if (hour >= 20 && hour <= 23) {
    const key = `lateNight_${todayKey}`;
    if (!state[key]) {
      setAgentState({ [key]: true });
      return { text: pick([
        "Hej natteravn! 🌙 Du arbejder sent — husk at søvn er vigtigere end overarbejde. Prøv at afslutte inden for en time.",
        "Det er sent! 🌙 Du giver den gas — men husk at hjernen har brug for at slukke. Hvad er det vigtigste du skal nå i dag?",
        "Sent på aftenen... Imponerende dedikation! Men prøv at give hjernen et frirum snart 🌙",
      ]), type: "human", action: "night" };
    }
  }

  // ─── PAUSE EFTER LANG ARBEJDSSESSION ────────────────────────────────────
  const breakThreshold = 45 + Math.floor(Math.random() * 20); // 45-65 min
  if (workMins >= breakThreshold && !state.breakSuggested) {
    setAgentState({ breakSuggested: true });
    return { text: pick([
      `Du har siddet koncentreret i ${workMins} minutter! 🧘 Vidste du at et 5-minutters pauser øger produktiviteten? Stå op, stræk ud!`,
      `${workMins} minutters fokuseret arbejde — det er flot! Men dine øjne og ryg har brug for en kort pause nu. 5 minutter. Gå!`,
      `Hej! Jeg har holdt øje — du har arbejdet uafbrudt i næsten en time. Tag en pause! Gå en lille tur, hent kaffe, stræk ud 🚶`,
      `Pause-alarm! ⏰ ${workMins} min arbejde uden pause er grænsen. Kroppen og koncentrationen takker dig for 5-10 min fra skærmen.`,
    ]), type: "human", action: "break" };
  }

  // ─── STRÆK-PÅMINDELSEN (efter 90+ min) ──────────────────────────────────
  if (workMins >= 90 && !state.stretchSuggested) {
    setAgentState({ stretchSuggested: true });
    return { text: pick([
      `Wow, ${workMins} minutter! Du er en arbejdsmaskine 💪 Men nu MÅ du rejse dig op og strække ud. Nakke og ryg siger tak!`,
      `Du har siddet i næsten to timer! 😅 Stå op, gå en lille tur rundt — selv 2 minutter hjælper din koncentration dramatisk.`,
    ]), type: "human", action: "stretch" };
  }

  // ─── VAND-PÅMINDELSE (tilfældig ~hver 2 time) ───────────────────────────
  const lastWater = state.lastWaterReminder || 0;
  if (Date.now() - lastWater > 2 * 60 * 60 * 1000 && hour >= 7 && hour <= 20) {
    setAgentState({ lastWaterReminder: Date.now() });
    return { text: pick([
      "Husk at drikke vand! 💧 Dehydrering er en af de mest oversete årsager til træthed og dårlig koncentration.",
      "Har du drukket noget vand i dag? 💧 Hjernens ydeevne falder allerede ved 1% dehydrering. Drik!",
      "Lille påmindelse: Vand! 💧 Kaffe tæller ikke 😄 Prøv at drikke et glas nu.",
    ]), type: "human", action: "water" };
  }

  return null;
}

// ─── Professional fleet proactive messages ───────────────────────────────
export function generateProactiveMessage(vehicles = [], alerts = [], routes = []) {
  const idleVehicles = vehicles.filter(v => v.status === "idle").length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const activeRoute = routes.find(r => r.status === "active");
  const hour = new Date().getHours();
  const workMins = getWorkDurationMinutes();

  const suggestions = [];

  if (unreadAlerts > 2) {
    suggestions.push({
      text: `Du har ${unreadAlerts} ulæste advarsler 🔔 Vil du have mig til at gennemgå dem og anbefale handlinger?`,
      action: "open_alerts", priority: 3,
    });
  }
  if (idleVehicles > 3) {
    suggestions.push({
      text: `Jeg kan se ${idleVehicles} køretøjer i tomgang 🚛 Skal jeg analysere ruterne og foreslå optimering?`,
      action: "analyze_fleet", priority: 2,
    });
  }
  if (activeRoute) {
    suggestions.push({
      text: `Ruten "${activeRoute.name}" er aktiv. Vil du have en live statusopdatering?`,
      action: "check_route", priority: 1,
    });
  }
  if (hour >= 7 && hour <= 9 && workMins < 10) {
    suggestions.push({
      text: `God morgen! ☀️ Din flåde har ${vehicles.length} køretøjer klar. Vil du starte med et morgenbriefing?`,
      action: "morning_briefing", priority: 4,
    });
  }
  if (hour >= 16 && hour <= 17) {
    suggestions.push({
      text: `Dagen nærmer sig sin afslutning 🌇 Skal jeg lave en opsummering af dagens aktivitet og hvad der venter i morgen?`,
      action: "daily_summary", priority: 3,
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority)[0] || null;
}

// ─── Detect human/conversational replies ─────────────────────────────────
export function detectHumanConversation(text) {
  const t = text.toLowerCase().trim();

  const greetings = /^(hej|hey|godmorgen|goddag|god morgen|hi|hallo|halløj|godaften|god aften)/i;
  const howAreYou = /(hvordan har du det|hvordan går det|hvad sker der|alt godt|har du det godt)/i;
  const weekend = /(weekend|lørdag|søndag|hygge|afslappet|festival|fest|sport|tur|rejse|ferie)/i;
  const plans = /(planer|planlagt|skal|tænker|overvejer|glæder)/i;
  const breakReply = /^(ja|okay|ok|jep|jo|selvfølgelig|straks|nu|godt|tak|det gør jeg|god idé)$/i;
  const negative = /^(nej|nope|ikke nu|måske|senere|ingen planer|kan ikke)$/i;
  const tired = /(træt|udmattet|søvnig|er ikke frisk|sover dårligt|lang dag|hård dag)/i;
  const happy = /(super|fantastisk|skønt|dejligt|glad|tilfreds|fedt|awesome|perfekt)/i;

  if (greetings.test(t)) return "greeting";
  if (tired.test(t)) return "tired";
  if (happy.test(t)) return "happy";
  if (howAreYou.test(t)) return "howAreYou";
  if (weekend.test(t)) return "weekendChat";
  if (plans.test(t)) return "plansChat";
  if (breakReply.test(t)) return "affirmative";
  if (negative.test(t)) return "negative";
  return null;
}

export function getHumanReply(type, text = "") {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "God morgen" : hour < 17 ? "God eftermiddag" : "God aften";

  const replies = {
    greeting: [
      `${timeGreeting}! Dejligt at se dig 😊 Hvad kan jeg hjælpe dig med i dag?`,
      "Hej hej! Klar til at tage fat? Hvad kan jeg gøre for dig?",
      "Hejsa! Godt du er her 😊 Hvad er på programmet?",
    ],
    tired: [
      "Åh, du er træt? Det forstår jeg godt — husk at tage en pause. Hvad er det vigtigste du skal nå i dag? Lad os prioritere!",
      "Træt i dag? Det sker for os alle! Prøv 5 min frisk luft — det er overraskende effektivt. Hvad skal vi have gjort?",
      "Hørt! Lad mig hjælpe dig med at gøre det nemt i dag. Hvad er absolut nødvendigt, og hvad kan vente?",
    ],
    happy: [
      "Det lyder godt! Din positive energi smitter! 😄 Hvad kan vi udrette i dag?",
      "Perfekt! Godt humør + god flådestyring = en super dag! Hvad starter vi med?",
      "Fantastisk! Lad os udnytte den energi! Hvad vil du?",
    ],
    howAreYou: [
      "Jeg har det fint, tak for du spørger! 😊 Altid klar til at hjælpe dig. Hvad med dig — har du det godt?",
      "Jeg er frisk og klar! Systemerne kører fint i dag. Hvad med dig?",
      "Det går rigtig godt! Flåden er under kontrol. Hvad med dig — hvad er din dag?",
    ],
    weekendChat: [
      "Det lyder hyggeligt! 😊 Godt at du fik ladet op. Klar til at tage fat?",
      "Skønt! Gode weekender giver energi til ugen. Hvad starter vi med?",
      "Dejligt at høre! Hvil og restitution er så vigtig. Nu er vi klar til ugen!",
    ],
    plansChat: [
      "Det lyder sjovt! 🎉 Husk at nyde det — arbejdet kan vente. Hvad har du brug for nu?",
      "Sikke noget at se frem til! Det fortjener du 😊 Hvad kan jeg hjælpe dig med inden da?",
      "Godt at du har noget at glæde dig til — det er vigtigt med fritid! Hvad skal vi ordne nu?",
    ],
    affirmative: [
      "Perfekt! Tag bare en god pause. Jeg holder øje med tingene her. 💪",
      "Godt! Kom tilbage når du er klar — flåden er i gode hænder.",
      "Rigtig god idé. Lidt frisk luft gør underværker — vi ses!",
    ],
    negative: [
      "Ingen problem! Sig til hvis du har brug for mig. Jeg er her. 😊",
      "Okay, ingen pres! Du ved bedst. Bare sig til!",
      "Det er helt fint. Arbejd videre — jeg holder øje.",
    ],
  };

  const options = replies[type] || ["Forstået! Hvad kan jeg ellers hjælpe med?"];
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Hjælpefunktion ───────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}