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
export function getTimeBasedGreeting(vehicleCount = 0, unreadAlerts = 0, lang = "da-DK") {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const mins = getWorkDurationMinutes();
  const isWeekend = day === 0 || day === 6;
  const name = "";

  if (lang === "en-US") {
    if (isWeekend) {
      if (hour < 10) {
        return ["Hi! You're up early on the weekend 😄 Something important?", "Good weekend morning! Hope something good brings you here."][Math.floor(Math.random() * 2)];
      }
      return ["Hi! You're working on the weekend — that's dedication 💪 What can I help with?", "Hi! Weekend work? You're diligent! Let's make it quick and efficient 😊"][Math.floor(Math.random() * 2)];
    }
    if (hour >= 4 && hour < 6) return "Hi night owl! You're up early 🌙 Coffee highly recommended. What's going on?";
    if (hour >= 6 && hour < 8) {
      return [
        `Good early morning! You're fresh today 🌅 ${vehicleCount} vehicles waiting. What shall we start with?`,
        "Hi! Early start — I like your energy! Fleet is ready. What do you want?",
      ][Math.floor(Math.random() * 2)];
    }
    if (hour >= 8 && hour < 10) {
      const alerts = unreadAlerts > 0 ? ` You have ${unreadAlerts} unread alerts.` : " Everything looks quiet.";
      return [
        `Good morning! Ready for a new day? ☀️${alerts} What should we start with?`,
        `Hi! Glad you're here. Had breakfast?${alerts} What can I help with?`,
        `Good morning! Hope you slept well 😊 ${vehicleCount} vehicles are active. What do you say?`,
      ][Math.floor(Math.random() * 3)];
    }
    if (hour >= 10 && hour < 12) {
      return ["Hi! Good morning progress? Fleet running smoothly. What do you need?", "Good morning! You've worked well — what can I help you with now?"][Math.floor(Math.random() * 2)];
    }
    if (hour >= 12 && hour < 14) {
      return ["Hi! Lunch break soon? Remember to eat — you perform best with food in your belly 🍽️", "Good afternoon! Hope you're eating a proper lunch. What can I help with?"][Math.floor(Math.random() * 2)];
    }
    if (hour >= 14 && hour < 16) {
      return ["Hi! Afternoon is underway — stay focused 💪 What should we solve?", "Good afternoon! You're halfway through the day. What's next?"][Math.floor(Math.random() * 2)];
    }
    if (hour >= 16 && hour < 18) {
      return ["Hi! The day is wrapping up 🌇 What do you want to accomplish before leaving?", "Good late afternoon! Anything that needs wrapping up or following up before you go?"][Math.floor(Math.random() * 2)];
    }
    if (hour >= 18 && hour < 21) {
      return ["Hi! You're working late today 🌆 Remember to disconnect. What's missing?", "Good evening! You're diligent — what can I help you finish?"][Math.floor(Math.random() * 2)];
    }
    return ["Hi night owl! 🌙 You're working late — what can I help you with?", "Hi! Late evening — what's up? Fleet is still running. What do you need?"][Math.floor(Math.random() * 2)];
  }

  // Danish (default)
  if (isWeekend) {
    if (hour < 10) {
      return ["Hej! Du er tidlig oppe i weekenden 😄 Noget vigtigt der trænger sig på?", "God weekend-morgen! Håber det er noget godt der bringer dig herind."][Math.floor(Math.random() * 2)];
    }
    return ["Hej! Du arbejder i weekenden — det er dedikeret 💪 Hvad kan jeg hjælpe med?", "Hej! Weekend-arbejde? Du er flittig! Lad os gøre det hurtigt og effektivt 😊"][Math.floor(Math.random() * 2)];
  }

  if (hour >= 4 && hour < 6) return "Hej natteravn! Du er tidlig oppe 🌙 Kaffe anbefales kraftigt. Hvad er der sket?";
  if (hour >= 6 && hour < 8) {
    return [
      `God tidlig morgen! Du er frisk i dag 🌅 ${vehicleCount} køretøjer venter. Hvad starter vi med?`,
      "Hej! Tidlig start — jeg kan godt lide din energi! Flåden er klar. Hvad vil du?"
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 8 && hour < 10) {
    const alerts = unreadAlerts > 0 ? ` Du har ${unreadAlerts} ulæste advarsler.` : " Alt ser roligt ud.";
    return [
      `God morgen! Klar til en ny dag? ☀️${alerts} Hvad skal vi starte med?`,
      `Hej! Godt du er her. Morgenmad spist?${alerts} Hvad kan jeg hjælpe med?`,
      `Godmorgen! Håber du fik sovet godt 😊 ${vehicleCount} køretøjer er aktive. Hvad siger du?`
    ][Math.floor(Math.random() * 3)];
  }
  if (hour >= 10 && hour < 12) {
    return [
      "Hej! Godt gang i formiddagen? Flåden kører fint. Hvad har du brug for?",
      "God formiddag! Du har arbejdet godt i dag — hvad kan jeg hjælpe dig med nu?"
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 12 && hour < 14) {
    return ["Hej! Frokostpause snart? Husk at spise — du yder bedst med mad i maven 🍽️", "God middag! Håber du spiser en ordentlig frokost. Hvad kan jeg hjælpe med?"][Math.floor(Math.random() * 2)];
  }
  if (hour >= 14 && hour < 16) {
    return [
      "Hej! Eftermiddagen er i gang — hold fokus 💪 Hvad skal vi løse?",
      "God eftermiddag! Du er halvvejs igennem dagen. Hvad er næste skridt?"
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 16 && hour < 18) {
    return [
      "Hej! Dagen nærmer sig sin afslutning 🌇 Hvad vil du nå inden fyraften?",
      "God sen eftermiddag! Er der noget der skal lukkes ned eller følges op på inden du går?"
    ][Math.floor(Math.random() * 2)];
  }
  if (hour >= 18 && hour < 21) {
    return [
      "Hej! Du arbejder sent i dag 🌆 Husk at koble af til sidst. Hvad mangler du?",
      "God aften! Du er flittig — hvad kan jeg hjælpe dig med at afslutte?"
    ][Math.floor(Math.random() * 2)];
  }
  return ["Hej natteravn! 🌙 Du arbejder sent — hvad kan jeg hjælpe dig med?", "Hej! Sent på aftenen — hvad er der? Flåden kører stadig. Hvad har du brug for?"][Math.floor(Math.random() * 2)];
}

// ─── Find best female voice ────────────────────────────────────────────────
export function getBestFemaleVoice(lang = "da-DK") {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const langCode = lang.split("-")[0].toLowerCase();
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));

  // Priority 1: Neural/natural voices (Google/Microsoft neural sound most human)
  const neuralKeywords = ["neural", "natural", "premium", "enhanced", "wavenet", "journey", "cloud"];
  for (const keyword of neuralKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // Priority 2: Known high-quality female voices
  const femaleKeywords = [
    "sara", "karen", "anna", "sofie", "ida", "helle", "inger", "nynne",
    "female", "woman", "fiona", "samantha", "victoria", "moira",
    "google", "microsoft", "apple",
  ];
  for (const keyword of femaleKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // Fallback: Any language match
  if (langVoices.length) return langVoices[0];
  return voices[0] || null;
}

// ─── Make text sound more natural for TTS ────────────────────────────────
function humanizeTextForTTS(text, lang = "da-DK") {
  let result = text;
  
  // Remove emoji (they break TTS)
  result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]/gu, '');
  
  // Remove markdown
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/\*(.+?)\*/g, "$1");
  result = result.replace(/#{1,6}\s*/g, "");
  result = result.replace(/`(.+?)`/g, "$1");
  
  // Add natural pauses
  result = result.replace(/\. ([A-ZÆØÅa-zæøå])/g, ". ... $1");
  result = result.replace(/! ([A-ZÆØÅa-zæøå])/g, "! ... $1");
  result = result.replace(/\? ([A-ZÆØÅa-zæøå])/g, "? ... $1");
  
  // Handle dashes (replace with comma + pause)
  result = result.replace(/—/g, ", ... ");
  result = result.replace(/–/g, ", ");
  
  // Make numbers sound natural
  if (lang === "da-DK") {
    result = result.replace(/(\d+)%/g, "$1 procent");
    result = result.replace(/(\d+) (km|kilometer)/gi, "$1 kilometer");
    result = result.replace(/(\d+)( dkk| kr)/gi, "$1 kroner");
  } else if (lang === "en-US") {
    result = result.replace(/(\d+)%/g, "$1 percent");
    result = result.replace(/(\d+) (km|kilometer)/gi, "$1 kilometer");
    result = result.replace(/(\d+)( usd| \$)/gi, "$1 dollars");
  }
  
  // Remove URLs
  result = result.replace(/https?:\/\/[^\s]+/g, "");
  
  // Collapse excess whitespace
  result = result.replace(/\n{2,}/g, ". ");
  result = result.replace(/\n/g, " ");
  result = result.replace(/\s{2,}/g, " ");
  
  return result.trim();
}

export function harborSpeak(text, { lang = "da-DK", rate = 0.85, pitch = 1.0, volume = 0.85, onStart, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();

  const processedText = humanizeTextForTTS(text, lang);

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(processedText);
    utt.lang = lang;
    // Slower rate (0.85) for clarity + natural female voice
    utt.rate = Math.max(0.5, Math.min(2, rate));
    // Natural pitch (1.0 = default, not robotic)
    utt.pitch = Math.max(0.5, Math.min(2, pitch));
    // Slightly lower volume to reduce harshness
    utt.volume = Math.max(0.1, Math.min(1, volume));

    const voice = getBestFemaleVoice(lang);
    if (voice) {
      utt.voice = voice;
    }
    
    if (onStart) utt.onstart = onStart;

    // Keep alive interval to prevent browser timeout
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { 
        clearInterval(keepAlive);
        return;
      }
      // Resume if paused (handles browser suspension)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 8000);

    utt.onend = () => { 
      clearInterval(keepAlive);
      onEnd?.();
    };
    
    utt.onerror = (e) => {
      clearInterval(keepAlive);
      onEnd?.();
    };

    // Resume if paused
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(utt);
  };

  // Wait for voices to load if needed
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let retries = 0;
    const trySpeak = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0 || retries >= 5) { 
        doSpeak();
        return;
      }
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
export function checkHumanCheckins(lang = "da-DK") {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  const state = getAgentState();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const workMins = getWorkDurationMinutes();

  // Only return Danish messages for now - can expand with other languages
  if (lang !== "da-DK") return null;

  // MANDAG: Hvordan var weekenden?
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

  // FREDAG EFTERMIDDAG: Weekend-planer
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

  // Continue with rest of the checks as before
  // TIDLIG MORGEN: Kaffe-start
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

  // MORGENMAD (7:30–9:00)
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

  // Continue with remaining checks...
  // (pauses, stretches, water, etc.) - keeping original Danish only for now
  
  return null;
}

// ─── Professional fleet proactive messages ───────────────────────────────
export function generateProactiveMessage(vehicles = [], alerts = [], routes = [], lang = "da-DK") {
  const idleVehicles = vehicles.filter(v => v.status === "idle").length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const activeRoute = routes.find(r => r.status === "active");
  const hour = new Date().getHours();
  const workMins = getWorkDurationMinutes();

  const suggestions = [];

  // Only return Danish messages for now
  if (lang !== "da-DK") return null;

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