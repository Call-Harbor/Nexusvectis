import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Smartphone, Download, RefreshCw, CheckCircle, AlertCircle, Info, ExternalLink, Package, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const APPS = [
  {
    id: "staffportal",
    name: "Staff Portal",
    description: "Medarbejder-app til airport/port/transit staff — skifteplaner, opgaver, incidents og real-time opdateringer.",
    packageName: "com.nexusvectis.staffportal",
    version: "1.0.0",
    buildDate: "2026-04-03",
    color: "cyan",
    icon: "👷",
    route: "/StaffPortal",
    playStoreId: null,
    features: [
      "Skifteplaner & vagter",
      "Opgave-håndtering",
      "Incident rapportering",
      "Real-time push notifikationer",
      "Offline-support",
    ],
    downloadUrl: null, // Will be generated via TWA/PWA builder
  },
  {
    id: "nexusorbit",
    name: "Nexus Orbit",
    description: "Kommunikations- og koordinations-app til feltstyrker — messaging, maps og live fleet status.",
    packageName: "com.nexusvectis.nexusorbit",
    version: "1.0.0",
    buildDate: "2026-04-03",
    color: "violet",
    icon: "🛰️",
    route: "/NexusOrbit",
    playStoreId: null,
    features: [
      "Orbit messaging & kanaler",
      "Live fleet tracking",
      "Push-to-talk koordination",
      "Geo-fencing alerts",
      "AI-assistent adgang",
    ],
    downloadUrl: null,
  },
];

const STEPS = [
  { step: 1, title: "Download APK", desc: "Download den genererede APK-fil via knappen nedenfor." },
  { step: 2, title: "Google Play Console", desc: "Gå til play.google.com/console og vælg din app." },
  { step: 3, title: "Upload til Play", desc: "Under 'Production' → 'Create new release' → upload APK/AAB filen." },
  { step: 4, title: "Udrulning", desc: "Vælg rollout-procent (fx 100%) og klik 'Save & Publish'." },
];

function AppCard({ app }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const colorMap = {
    cyan: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      btn: "bg-cyan-600 hover:bg-cyan-500",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    },
    violet: {
      border: "border-violet-500/30",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      btn: "bg-violet-600 hover:bg-violet-500",
      badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    },
  };

  const c = colorMap[app.color];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2500);
  };

  const handleDownload = () => {
    // Generate a TWA (Trusted Web Activity) manifest JSON for guidance
    const twaConfig = {
      app_name: app.name,
      package_name: app.packageName,
      version: app.version,
      start_url: `https://app.nexusvectis.com${app.route}`,
      display: "standalone",
      theme_color: app.color === "cyan" ? "#06b6d4" : "#8b5cf6",
      background_color: "#020617",
      icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
      note: "Build med Bubblewrap CLI: npx @bubblewrap/cli init --manifest=this_file.json",
      build_command: "npx @bubblewrap/cli build",
    };

    const blob = new Blob([JSON.stringify(twaConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${app.id}-twa-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-2xl border ${c.border} bg-slate-900/60 backdrop-blur p-6 flex flex-col gap-5`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center text-2xl`}>
            {app.icon}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{app.name}</h2>
            <p className={`text-xs font-mono ${c.text}`}>{app.packageName}</p>
          </div>
        </div>
        <Badge className={`${c.badge} text-xs`}>v{app.version}</Badge>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{app.description}</p>

      {/* Features */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Indeholder</p>
        <div className="flex flex-wrap gap-2">
          {app.features.map((f) => (
            <span key={f} className="text-xs bg-slate-800 text-slate-300 rounded-full px-2.5 py-1 border border-slate-700">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-700/50 pt-4">
        <span>Build: {app.buildDate}</span>
        <span>•</span>
        <span>TWA / PWA</span>
        <span>•</span>
        <span>Android 8.0+</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleDownload}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium transition-all ${c.btn}`}
        >
          <Download className="w-4 h-4" />
          Download TWA Config (JSON)
        </button>

        <a
          href={`https://play.google.com/console`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-300 text-sm border border-slate-700 hover:bg-slate-800 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Åbn Google Play Console
        </a>
      </div>

      {generated && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Konfiguration genereret — download og følg build-guiden nedenfor.
        </div>
      )}
    </div>
  );
}

export default function MobileAppPublisher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" /></div>;

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center p-8">
      <div>
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-white text-xl font-semibold mb-2">Adgang nægtet</h2>
        <p className="text-slate-400 text-sm">Denne side kræver admin-rettigheder.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mobile App Publisher</h1>
            <p className="text-slate-400 text-sm">Download og udgiv NexusVectis apps til Google Play</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 mb-8 flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-200">Trusted Web Activity (TWA)</strong> — Begge apps pakkes som native Android APK/AAB via Google's TWA-standard, som wrapper PWA-appen. 
            Download JSON-konfigurationen, kør <code className="bg-blue-900/40 px-1.5 py-0.5 rounded font-mono text-xs">npx @bubblewrap/cli build</code>, og upload den genererede <code className="bg-blue-900/40 px-1.5 py-0.5 rounded font-mono text-xs">.aab</code> fil til Google Play Console.
          </div>
        </div>

        {/* App Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {APPS.map((app) => <AppCard key={app.id} app={app} />)}
        </div>

        {/* Build Guide */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Trin-for-trin: Upload til Google Play
          </h2>
          <p className="text-slate-400 text-sm mb-6">Følg disse trin for at udgive eller opdatere en app.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-bold flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <p className="text-white text-sm font-medium mb-1">{s.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CLI Commands */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Build kommandoer (terminal)</p>
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-700/50">
              <p><span className="text-slate-500"># Installer Bubblewrap CLI</span></p>
              <p><span className="text-cyan-400">npm install</span> <span className="text-white">-g @bubblewrap/cli</span></p>
              <p className="pt-1"><span className="text-slate-500"># Initialiser med din config fil</span></p>
              <p><span className="text-cyan-400">bubblewrap init</span> <span className="text-white">--manifest=staffportal-twa-config.json</span></p>
              <p className="pt-1"><span className="text-slate-500"># Byg APK/AAB</span></p>
              <p><span className="text-cyan-400">bubblewrap build</span></p>
              <p className="pt-1"><span className="text-slate-500"># Output: app-release-bundle.aab (upload denne til Play Console)</span></p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Kræver Java 11+ og Android SDK installeret. Se <a href="https://developer.chrome.com/docs/android/trusted-web-activity/" target="_blank" className="underline">Chrome TWA dokumentation</a> for fuld opsætning.</span>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Play Console", url: "https://play.google.com/console", icon: "🎮" },
            { label: "TWA Dokumentation", url: "https://developer.chrome.com/docs/android/trusted-web-activity/", icon: "📚" },
            { label: "Bubblewrap CLI", url: "https://github.com/GoogleChromeLabs/bubblewrap", icon: "🔧" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <span>{link.icon}</span>
              {link.label}
              <ExternalLink className="w-3 h-3 ml-auto text-slate-500" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}