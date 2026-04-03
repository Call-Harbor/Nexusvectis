import { useState } from "react";
import { Smartphone, Download, CheckCircle, AlertCircle, Info, ExternalLink, Package, History, Trash2, Clock, Apple } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../components/admin/AdminLayout";

const APPS = [
  {
    id: "staffportal",
    name: "Staff Portal",
    description: "Employee app for airport/port/transit staff — shift schedules, tasks, incidents and real-time updates.",
    packageName: "com.nexusvectis.staffportal",
    bundleId: "com.nexusvectis.staffportal",
    version: "1.0.0",
    buildDate: "2026-04-03",
    color: "cyan",
    icon: "👷",
    route: "/StaffPortal",
    features: ["Shift schedules & rosters", "Task management", "Incident reporting", "Real-time push notifications", "Offline support"],
  },
  {
    id: "nexusorbit",
    name: "Nexus Orbit",
    description: "Communication and coordination app for field forces — messaging, maps and live fleet status.",
    packageName: "com.nexusvectis.nexusorbit",
    bundleId: "com.nexusvectis.nexusorbit",
    version: "1.0.0",
    buildDate: "2026-04-03",
    color: "violet",
    icon: "🛰️",
    route: "/NexusOrbit",
    features: ["Orbit messaging & channels", "Live fleet tracking", "Push-to-talk coordination", "Geo-fencing alerts", "AI assistant access"],
  },
];

const ANDROID_STEPS = [
  { step: 1, title: "Download Config", desc: "Download the TWA JSON configuration file using the button below." },
  { step: 2, title: "Google Play Console", desc: "Go to play.google.com/console and select your app." },
  { step: 3, title: "Upload to Play", desc: "Under 'Production' → 'Create new release' → upload your APK/AAB file." },
  { step: 4, title: "Publish", desc: "Select rollout percentage (e.g. 100%) and click 'Save & Publish'." },
];

const IOS_STEPS = [
  { step: 1, title: "Download Config", desc: "Download the Capacitor JSON configuration file using the button below." },
  { step: 2, title: "Install Capacitor", desc: "Run npm install @capacitor/cli @capacitor/core @capacitor/ios in your project." },
  { step: 3, title: "Build iOS app", desc: "Run npx cap init → npx cap add ios → npx cap open ios to open in Xcode." },
  { step: 4, title: "App Store Connect", desc: "Archive in Xcode → upload via Organizer → publish at appstoreconnect.apple.com." },
];

const colorMap = {
  cyan: {
    border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400",
    btn: "bg-cyan-600 hover:bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
  violet: {
    border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400",
    btn: "bg-violet-600 hover:bg-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  },
};

const STORAGE_KEY = "nv_build_history";

function useBuildHistory() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  const addBuild = (app, configBlob, filename, platform) => {
    const entry = {
      id: Date.now(),
      appId: app.id,
      appName: app.name,
      appIcon: app.icon,
      packageName: app.packageName,
      version: app.version,
      filename,
      platform,
      generatedAt: new Date().toISOString(),
      status: "config_ready",
      blobUrl: URL.createObjectURL(configBlob),
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    const toStore = updated.map(({ blobUrl, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    return entry;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addBuild, clearHistory };
}

function PhoneMockup({ app, isActive }) {
  const c = colorMap[app.color];
  const previewUrl = window.location.origin + app.route + "?hologram=true";

  return (
    <div className={`flex flex-col items-center transition-all duration-300 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute"}`}>
      <div className="relative">
        <div className="relative w-[220px] h-[440px] rounded-[36px] bg-slate-800 border-4 border-slate-600 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-xl z-10" />
          <div className="w-full h-full bg-slate-950 overflow-hidden">
            <iframe
              src={previewUrl}
              title={`${app.name} preview`}
              className="w-[375px] h-[667px] origin-top-left pointer-events-none"
              style={{ transform: "scale(0.587)", transformOrigin: "top left" }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-500 rounded-full" />
        </div>
        <div className={`absolute inset-0 rounded-[36px] blur-xl -z-10 opacity-30 ${c.bg}`} />
      </div>
      <p className={`mt-3 text-sm font-medium ${c.text}`}>{app.name}</p>
      <p className="text-xs text-slate-500 font-mono">{app.packageName}</p>
    </div>
  );
}

function AppPreview() {
  const [activeApp, setActiveApp] = useState(0);

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 mb-10">
      <h2 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-cyan-400" />
        App Preview
      </h2>
      <p className="text-slate-400 text-sm mb-6">Live preview of how the app will look on a mobile screen with the downloaded configuration.</p>

      <div className="flex gap-2 mb-8">
        {APPS.map((app, idx) => {
          const c = colorMap[app.color];
          return (
            <button
              key={app.id}
              onClick={() => setActiveApp(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeApp === idx
                  ? `${c.bg} ${c.border} ${c.text}`
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <span>{app.icon}</span>
              {app.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
        <div className="relative w-[220px] h-[440px] flex-shrink-0">
          {APPS.map((app, idx) => (
            <PhoneMockup key={app.id} app={app} isActive={activeApp === idx} />
          ))}
        </div>

        <div className="flex-1">
          {APPS.map((app, idx) => {
            const c = colorMap[app.color];
            if (activeApp !== idx) return null;
            return (
              <div key={app.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center text-2xl`}>{app.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{app.name}</h3>
                    <p className={`text-xs font-mono ${c.text}`}>{app.bundleId}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{app.description}</p>
                <div className="space-y-2 mb-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Included features</p>
                  {app.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Preview runs in a sandboxed iframe — some features (push notifications, camera) require the native app.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AppCard({ app, onBuildGenerated }) {
  const c = colorMap[app.color];

  const handleAndroidDownload = () => {
    const twaConfig = {
      app_name: app.name,
      package_name: app.packageName,
      version: app.version,
      start_url: `https://app.nexusvectis.com${app.route}`,
      display: "standalone",
      theme_color: app.color === "cyan" ? "#06b6d4" : "#8b5cf6",
      background_color: "#020617",
      icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
      note: "Build with Bubblewrap CLI: npx @bubblewrap/cli init --manifest=this_file.json",
      build_command: "npx @bubblewrap/cli build",
    };
    downloadJSON(twaConfig, `${app.id}-twa-config.json`, app, "android", onBuildGenerated);
  };

  const handleIOSDownload = () => {
    const capacitorConfig = {
      appId: app.bundleId,
      appName: app.name,
      webDir: "dist",
      server: {
        url: `https://app.nexusvectis.com${app.route}`,
        cleartext: false,
      },
      ios: {
        scheme: app.name,
        backgroundColor: "#020617",
        contentInset: "automatic",
        preferredContentMode: "mobile",
      },
      plugins: {
        SplashScreen: {
          launchShowDuration: 2000,
          backgroundColor: "#020617",
          androidSplashResourceName: "splash",
          androidScaleType: "CENTER_CROP",
        },
        PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
      },
      note: "Run: npm install @capacitor/cli @capacitor/core @capacitor/ios → npx cap init → npx cap add ios → npx cap open ios",
      xcode_requirements: "Requires macOS + Xcode 15+ + Apple Developer Account",
    };
    downloadJSON(capacitorConfig, `${app.id}-capacitor-config.json`, app, "ios", onBuildGenerated);
  };

  return (
    <div className={`rounded-2xl border ${c.border} bg-slate-900/60 backdrop-blur p-6 flex flex-col gap-5`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center text-2xl`}>{app.icon}</div>
          <div>
            <h2 className="text-white font-semibold text-lg">{app.name}</h2>
            <p className={`text-xs font-mono ${c.text}`}>{app.packageName}</p>
          </div>
        </div>
        <Badge className={`${c.badge} text-xs`}>v{app.version}</Badge>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{app.description}</p>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Includes</p>
        <div className="flex flex-wrap gap-2">
          {app.features.map((f) => (
            <span key={f} className="text-xs bg-slate-800 text-slate-300 rounded-full px-2.5 py-1 border border-slate-700">{f}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-700/50 pt-4">
        <span>Build: {app.buildDate}</span><span>•</span><span>TWA / Capacitor</span><span>•</span><span>Android 8+ / iOS 14+</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-green-400">🤖</span> Android
          </p>
          <button onClick={handleAndroidDownload} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-medium transition-all ${c.btn}`}>
            <Download className="w-3.5 h-3.5" />
            TWA Config
          </button>
          <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-slate-300 text-xs border border-slate-700 hover:bg-slate-800 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            Play Console
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Apple className="w-3.5 h-3.5 text-slate-400" /> iOS
          </p>
          <button onClick={handleIOSDownload} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-medium transition-all bg-slate-700 hover:bg-slate-600">
            <Download className="w-3.5 h-3.5" />
            Capacitor Config
          </button>
          <a href="https://appstoreconnect.apple.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-slate-300 text-xs border border-slate-700 hover:bg-slate-800 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            App Store Connect
          </a>
        </div>
      </div>
    </div>
  );
}

function downloadJSON(config, filename, app, platform, onBuildGenerated) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  onBuildGenerated(app, blob, filename, platform);
}

function BuildHistory({ history, onClear }) {
  if (history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Build History
        </h2>
        <p className="text-slate-500 text-sm mt-4 text-center py-8">No builds yet — download a configuration to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Build History
          <span className="text-xs font-normal text-slate-500 ml-1">({history.length} builds)</span>
        </h2>
        <button onClick={onClear} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          Clear history
        </button>
      </div>

      <div className="space-y-3">
        {history.map((entry, idx) => {
          const isLatest = idx === 0;
          const date = new Date(entry.generatedAt);
          const formatted = date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
          const appColor = APPS.find(a => a.id === entry.appId)?.color || "cyan";
          const c = colorMap[appColor];
          const isIOS = entry.platform === "ios";

          return (
            <div key={entry.id} className={`flex items-center gap-4 rounded-xl p-4 border ${isLatest ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-700/40 bg-slate-800/40"}`}>
              <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center text-lg flex-shrink-0`}>
                {entry.appIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium">{entry.appName}</span>
                  <span className="text-slate-500 text-xs">v{entry.version}</span>
                  <Badge className={`text-[10px] ${isIOS ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-green-900/40 text-green-300 border-green-700/50"}`}>
                    {isIOS ? "iOS" : "Android"}
                  </Badge>
                  {isLatest && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">LATEST</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono truncate">{entry.filename}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatted}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Config ready
                </div>
                {entry.blobUrl && (
                  <a href={entry.blobUrl} download={entry.filename}
                    className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3.5 h-3.5" />
                    Re-download
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BuildGuide({ platform }) {
  const steps = platform === "android" ? ANDROID_STEPS : IOS_STEPS;
  const isAndroid = platform === "android";

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
        <Package className="w-5 h-5 text-amber-400" />
        {isAndroid ? "Android: Upload to Google Play" : "iOS: Upload to Apple App Store"}
      </h2>
      <p className="text-slate-400 text-sm mb-6">Follow these steps to publish or update the app.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {steps.map((s) => (
          <div key={s.step} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-bold flex items-center justify-center mb-3">{s.step}</div>
            <p className="text-white text-sm font-medium mb-1">{s.title}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {isAndroid ? (
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Build commands (terminal)</p>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-700/50">
            <p><span className="text-slate-500"># Install Bubblewrap CLI</span></p>
            <p><span className="text-cyan-400">npm install</span> <span className="text-white">-g @bubblewrap/cli</span></p>
            <p className="pt-1"><span className="text-slate-500"># Initialize with your config file</span></p>
            <p><span className="text-cyan-400">bubblewrap init</span> <span className="text-white">--manifest=staffportal-twa-config.json</span></p>
            <p className="pt-1"><span className="text-cyan-400">bubblewrap build</span></p>
            <p className="pt-1"><span className="text-slate-500"># Output: app-release-bundle.aab → upload to Play Console</span></p>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Requires Java 11+ and Android SDK. See <a href="https://developer.chrome.com/docs/android/trusted-web-activity/" target="_blank" className="underline">Chrome TWA documentation</a>.</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Build commands (terminal)</p>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-700/50">
            <p><span className="text-slate-500"># Install Capacitor</span></p>
            <p><span className="text-cyan-400">npm install</span> <span className="text-white">@capacitor/cli @capacitor/core @capacitor/ios</span></p>
            <p className="pt-1"><span className="text-slate-500"># Initialize project</span></p>
            <p><span className="text-cyan-400">npx cap init</span></p>
            <p className="pt-1"><span className="text-slate-500"># Add iOS platform and open in Xcode</span></p>
            <p><span className="text-cyan-400">npx cap add ios</span></p>
            <p><span className="text-cyan-400">npx cap open ios</span></p>
            <p className="pt-1"><span className="text-slate-500"># Archive in Xcode → Product → Archive → Upload to App Store</span></p>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Requires macOS, Xcode 15+ and an active Apple Developer Program ($99/year). See <a href="https://capacitorjs.com/docs/ios" target="_blank" className="underline">Capacitor iOS documentation</a>.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileAppPublisher() {
  const { history, addBuild, clearHistory } = useBuildHistory();
  const [guideTab, setGuideTab] = useState("android");

  return (
    <AdminLayout currentPage="MobileAppPublisher">
      <div className="text-white p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mobile App Publisher</h1>
              <p className="text-slate-400 text-sm">Download and publish NexusVectis apps to Google Play & Apple App Store</p>
            </div>
          </div>

          <div className="mt-6 mb-8 flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-200">TWA (Android) + Capacitor (iOS)</strong> — Android is built as a native APK/AAB via Google's TWA standard.
              iOS is built via Capacitor, which wraps the PWA in a native Xcode app for the App Store. Download the desired configuration file and follow the build guide below.
            </div>
          </div>

          {/* App Preview */}
          <AppPreview />

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {APPS.map((app) => (
              <AppCard key={app.id} app={app} onBuildGenerated={addBuild} />
            ))}
          </div>

          {/* Build History */}
          <div className="mb-10">
            <BuildHistory history={history} onClear={clearHistory} />
          </div>

          {/* Build Guide with platform toggle */}
          <div className="mb-10">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setGuideTab("android")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${guideTab === "android" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                <span>🤖</span> Android Guide
              </button>
              <button
                onClick={() => setGuideTab("ios")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${guideTab === "ios" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                <Apple className="w-4 h-4" /> iOS Guide
              </button>
            </div>
            <BuildGuide platform={guideTab} />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Play Console", url: "https://play.google.com/console", icon: "🎮" },
              { label: "App Store Connect", url: "https://appstoreconnect.apple.com", icon: "🍎" },
              { label: "TWA Documentation", url: "https://developer.chrome.com/docs/android/trusted-web-activity/", icon: "📚" },
              { label: "Capacitor iOS Docs", url: "https://capacitorjs.com/docs/ios", icon: "📱" },
              { label: "Bubblewrap CLI", url: "https://github.com/GoogleChromeLabs/bubblewrap", icon: "🔧" },
              { label: "Apple Developer", url: "https://developer.apple.com", icon: "🏗️" },
            ].map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                <span>{link.icon}</span>
                {link.label}
                <ExternalLink className="w-3 h-3 ml-auto text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}