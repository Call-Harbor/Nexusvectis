// H.A.R.B.O.R Voice Agent — kvindelig AI-kollega med proaktiv adfærd
// Håndterer TTS med prioriteret kvindelig stemme + proaktive forslag

const HARBOR_VOICE_NAME = "H.A.R.B.O.R";

// Proaktive sætninger H.A.R.B.O.R siger på eget initiativ
export const PROACTIVE_LINES = [
  "Jeg har set på din flåde — du har {count} køretøjer i tomgang. Vil du have mig til at optimere ruterne?",
  "Der er {alerts} ulæste advarsler. Skal jeg gennemgå dem med dig?",
  "Baseret på dit mønster er det normalt ved den her tid at tjekke leveringer. Vil jeg trække en rapport?",
  "Jeg har opdaget en mulig forsinkelse på rute {route}. Vil du have detaljer?",
  "Det ser ud til at du er ved at starte din dag. God morgen — her er status: {status}",
  "Jeg har beregnet at du kan spare {savings} DKK denne måned ved at konsolidere disse ruter. Skal jeg vise dig?",
  "Vedligeholdelse på {vehicle} er forfalden. Vil du have mig til at planlægge det?",
  "Jeg bemærkede du arbejder sent. Skal jeg lave en hurtig opsummering af dagens vigtigste hændelser?",
];

// Find den bedste kvindelige stemme tilgængelig
export function getBestFemaleVoice(lang = "da-DK") {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Prioriteret liste over kendte kvindelige stemme-navne
  const femaleKeywords = [
    "sara", "karen", "anna", "sofie", "ida", "helle", "inger",
    "female", "woman", "fiona", "samantha", "victoria", "karen",
    "google dansk", "microsoft helle", "microsoft sara",
  ];

  // 1. Prøv at finde dansk kvindelig stemme
  const langCode = lang.split("-")[0].toLowerCase();
  const langVoices = voices.filter(v =>
    v.lang.toLowerCase().startsWith(langCode)
  );

  for (const keyword of femaleKeywords) {
    const match = langVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // 2. Første tilgængelig i det sprog
  if (langVoices.length) return langVoices[0];

  // 3. Engelsk fallback med kvindelig stemme
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

  // Forsøg at sætte kvindelig stemme
  const setVoiceAndSpeak = () => {
    const voice = getBestFemaleVoice(lang);
    if (voice) utt.voice = voice;
    if (onStart) utt.onstart = onStart;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Stemmer loader asynkront første gang
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      setVoiceAndSpeak();
    };
  } else {
    setVoiceAndSpeak();
  }
}

// Generer proaktiv besked baseret på fleet data
export function generateProactiveMessage(vehicles = [], alerts = [], routes = []) {
  const idleVehicles = vehicles.filter(v => v.status === "idle").length;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const activeRoute = routes.find(r => r.status === "active");
  const hour = new Date().getHours();

  const suggestions = [];

  if (unreadAlerts > 2) {
    suggestions.push({
      text: `Du har ${unreadAlerts} ulæste advarsler. Vil du have mig til at gennemgå dem?`,
      action: "open_alerts",
      priority: 3,
    });
  }

  if (idleVehicles > 3) {
    suggestions.push({
      text: `Jeg kan se ${idleVehicles} køretøjer i tomgang. Jeg kan optimere ruterne og spare dig tid — skal jeg?`,
      action: "analyze_fleet",
      priority: 2,
    });
  }

  if (activeRoute) {
    suggestions.push({
      text: `Ruten ${activeRoute.name} er aktiv. Vil du have en statusopdatering?`,
      action: "check_route",
      priority: 1,
    });
  }

  if (hour >= 8 && hour <= 9) {
    suggestions.push({
      text: `God morgen! Din flåde har ${vehicles.length} køretøjer. Vil du starte dagen med et overblik?`,
      action: "morning_briefing",
      priority: 4,
    });
  }

  if (hour >= 16 && hour <= 17) {
    suggestions.push({
      text: `Dagen nærmer sig sin slutning. Skal jeg lave en opsummering af hvad der er sket i dag?`,
      action: "daily_summary",
      priority: 2,
    });
  }

  // Returner den vigtigste
  return suggestions.sort((a, b) => b.priority - a.priority)[0] || null;
}