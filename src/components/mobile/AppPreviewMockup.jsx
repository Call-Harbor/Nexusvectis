import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Tablet, RotateCcw, Monitor, CheckCircle, Info, Wifi, Battery, Signal } from "lucide-react";

const colorMap = {
  cyan: {
    border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-400",
    glow: "shadow-cyan-500/20", gradFrom: "from-cyan-500", gradTo: "to-cyan-600",
    ring: "ring-cyan-400/40",
  },
  violet: {
    border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400",
    glow: "shadow-violet-500/20", gradFrom: "from-violet-500", gradTo: "to-violet-600",
    ring: "ring-violet-400/40",
  },
};

const DEVICE_MODES = [
  { id: "phone", label: "Phone", icon: Smartphone },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "desktop", label: "Desktop", icon: Monitor },
];

const OS_MODES = [
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
];

function StatusBar({ os, time }) {
  return (
    <div className={`flex items-center justify-between px-4 py-1 text-[10px] font-medium ${os === "ios" ? "text-white" : "text-slate-200"}`}>
      <span>{time}</span>
      <div className="flex items-center gap-1">
        <Signal className="w-3 h-3" />
        <Wifi className="w-3 h-3" />
        <Battery className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

function IOSFrame({ app, landscape, children }) {
  const c = colorMap[app.color];
  const w = landscape ? 520 : 280;
  const h = landscape ? 280 : 560;

  return (
    <div className="relative flex items-center justify-center" style={{ width: w + 32, height: h + 32 }}>
      {/* Outer shell */}
      <div
        className={`relative rounded-[44px] bg-gradient-to-b from-slate-700 to-slate-800 shadow-2xl ${c.glow}`}
        style={{ width: w + 24, height: h + 24, boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px rgba(0,0,0,0.8), 0 0 60px var(--glow-color, rgba(6,182,212,0.15))" }}
      >
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-[100px] w-1 h-8 bg-slate-600 rounded-l-sm" />
        <div className="absolute left-[-3px] top-[140px] w-1 h-10 bg-slate-600 rounded-l-sm" />
        <div className="absolute left-[-3px] top-[160px] w-1 h-10 bg-slate-600 rounded-l-sm" />
        <div className="absolute right-[-3px] top-[120px] w-1 h-14 bg-slate-600 rounded-r-sm" />

        {/* Screen bezel */}
        <div className="absolute inset-[3px] rounded-[42px] bg-slate-950 overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-950 rounded-full z-20 border border-slate-800/80" />
          {/* Screen content */}
          <div className="w-full h-full bg-slate-950 overflow-hidden relative">
            <div className="absolute top-3 left-0 right-0 z-10 px-4 flex items-center justify-between text-[10px] text-white/70">
              <span className="ml-8">{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="flex items-center gap-1">
                <Signal className="w-2.5 h-2.5" />
                <Wifi className="w-2.5 h-2.5" />
                <Battery className="w-3 h-2.5" />
              </div>
            </div>
            <div className="w-full h-full pt-8">
              {children}
            </div>
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-20" />
        </div>
      </div>
    </div>
  );
}

function AndroidFrame({ app, landscape, children }) {
  const c = colorMap[app.color];
  const w = landscape ? 520 : 280;
  const h = landscape ? 280 : 560;

  return (
    <div className="relative flex items-center justify-center" style={{ width: w + 32, height: h + 32 }}>
      <div
        className={`relative rounded-[28px] bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl ${c.glow}`}
        style={{ width: w + 20, height: h + 20, boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.8)" }}
      >
        {/* Buttons */}
        <div className="absolute right-[-3px] top-[90px] w-1 h-12 bg-slate-700 rounded-r-sm" />
        <div className="absolute left-[-3px] top-[110px] w-1 h-8 bg-slate-700 rounded-l-sm" />

        {/* Screen */}
        <div className="absolute inset-[4px] rounded-[24px] bg-slate-950 overflow-hidden">
          {/* Punch hole camera */}
          <div className="absolute top-3 right-6 w-4 h-4 bg-slate-950 rounded-full z-20 border border-slate-800/60" />
          <div className="w-full h-full overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 z-10 h-8 flex items-center px-4">
              <span className="text-[10px] text-white/60">{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Signal className="w-2.5 h-2.5 text-white/60" />
                <Wifi className="w-2.5 h-2.5 text-white/60" />
                <Battery className="w-3 h-2.5 text-white/60" />
              </div>
            </div>
            <div className="w-full h-full pt-8">
              {children}
            </div>
          </div>
          {/* Nav bar */}
          <div className="absolute bottom-0 left-0 right-0 h-7 flex items-center justify-center gap-8 bg-slate-950/80 z-20">
            <div className="w-4 h-4 border border-white/20 rounded-sm" />
            <div className="w-4 h-4 border border-white/20 rounded-full" />
            <div className="w-4 h-4 border-l-2 border-b-2 border-white/20 rotate-45 translate-x-0.5 -translate-y-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({ app, children }) {
  return (
    <div className="relative">
      {/* Monitor */}
      <div className="relative rounded-xl bg-slate-800 border border-slate-600/60 shadow-2xl overflow-hidden"
        style={{ width: 580, height: 370 }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
      <div className="flex-1 mx-4">
            <div className="bg-slate-700/60 rounded-md px-3 py-0.5 text-[10px] text-slate-400 font-mono text-center">
              app.nexusvectis.com{app.route}
            </div>
          </div>
        </div>
        <div className="w-full" style={{ height: 340 }}>
          {children}
        </div>
      </div>
      {/* Stand */}
      <div className="mx-auto w-16 h-4 bg-slate-700 rounded-b-lg" />
      <div className="mx-auto w-28 h-2 bg-slate-800 rounded-full" />
    </div>
  );
}

function IframeContent({ url, device, landscape }) {
  // Scale is computed so the iframe fills the visible screen area
  // Container sizes (inner screen minus status bar):
  //   phone portrait:  ~254 x 482  → scale = 254/375 = 0.677
  //   phone landscape: ~474 x 222  → scale = 474/667 = 0.711
  //   tablet portrait: ~334 x 490  → scale = 334/768 = 0.435
  //   tablet landscape:~490 x 334  → scale = 490/1024 = 0.479
  //   desktop:          500 x 285  → scale = 500/1280 = 0.390
  const scaleMap = {
    phone_portrait:   { iW: 375,  iH: 812,  scale: 0.677 },
    phone_landscape:  { iW: 667,  iH: 400,  scale: 0.711 },
    tablet_portrait:  { iW: 768,  iH: 1124, scale: 0.435 },
    tablet_landscape: { iW: 1024, iH: 698,  scale: 0.479 },
    desktop:          { iW: 1280, iH: 730,  scale: 0.390 },
  };

  const key = device === "desktop" ? "desktop" : `${device}_${landscape ? "landscape" : "portrait"}`;
  const { iW, iH, scale } = scaleMap[key] || scaleMap["phone_portrait"];

  return (
    <div className="w-full h-full overflow-hidden relative">
      <iframe
        src={url}
        title="App preview"
        style={{
          width: iW,
          height: iH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          border: "none",
          display: "block",
        }}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}

export default function AppPreviewMockup({ apps }) {
  const [activeApp, setActiveApp] = useState(0);
  const [device, setDevice] = useState("phone");
  const [os, setOs] = useState("ios");
  const [landscape, setLandscape] = useState(false);

  const app = apps[activeApp];
  const c = colorMap[app.color];
  const previewUrl = window.location.origin + app.route + "?hologram=true";

  const FrameComponent = device === "desktop"
    ? DesktopFrame
    : os === "ios" ? IOSFrame : AndroidFrame;


  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Smartphone className={`w-4 h-4 ${c.text}`} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">App Preview</h2>
            <p className="text-slate-500 text-xs">Live preview with device simulation</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* OS toggle (only for phone/tablet) */}
          {device !== "desktop" && (
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              {OS_MODES.map(m => (
                <button key={m.id} onClick={() => setOs(m.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${os === m.id ? "bg-slate-600 text-white" : "bg-slate-800/50 text-slate-400 hover:text-white"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Device toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {DEVICE_MODES.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setDevice(m.id)}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all ${device === m.id ? `${c.bg} ${c.text}` : "bg-slate-800/50 text-slate-400 hover:text-white"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Rotate (only phone/tablet) */}
          {device !== "desktop" && (
            <button onClick={() => setLandscape(l => !l)}
              className={`p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${landscape ? "bg-slate-700 text-white" : "bg-slate-800/50"}`}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* App selector tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {apps.map((a, idx) => {
          const ac = colorMap[a.color];
          return (
            <button key={a.id} onClick={() => setActiveApp(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeApp === idx ? `${ac.bg} ${ac.border} ${ac.text}` : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
              }`}>
              <span>{a.icon}</span>
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-8 p-6 pt-6 items-center lg:items-start">
        {/* Device frame */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ minHeight: 400 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${app.id}-${device}-${os}-${landscape}`}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <FrameComponent app={app} landscape={landscape}>
                <IframeContent url={previewUrl} device={device} landscape={landscape} />
              </FrameComponent>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* App info panel */}
        <div className="flex-1 max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div key={app.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}>

              {/* App identity */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center text-3xl shadow-lg`}>
                  {app.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg leading-tight">{app.name}</h3>
                  <p className={`text-xs font-mono ${c.text} mt-0.5`}>{app.bundleId || app.packageName}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">v{app.version}</span>
                    <span className={`text-[10px] ${c.bg} ${c.text} rounded-full px-2 py-0.5 border ${c.border}`}>
                      {device === "desktop" ? "Web" : os === "ios" ? "iOS 14+" : "Android 8+"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-5">{app.description}</p>

              {/* Features */}
              <div className="mb-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Included features</p>
                <div className="space-y-2">
                  {app.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Version", value: `v${app.version}` },
                  { label: "Build", value: app.buildDate },
                  { label: "Platform", value: "PWA/Native" },
                ].map(stat => (
                  <div key={stat.label} className={`rounded-xl p-3 ${c.bg} border ${c.border} text-center`}>
                    <p className={`text-sm font-semibold ${c.text}`}>{stat.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-amber-300/80 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Preview runs in a sandboxed iframe. Push notifications & camera require the native app.</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}