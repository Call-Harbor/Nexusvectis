import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, CheckCircle2, Loader2, X, Zap, ChevronRight,
  BarChart3, Activity, Package, Users, Globe, Cpu, Star, Shield,
  ArrowUpRight, Layers, Sparkles, Store
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "all", label: "ALL SYSTEMS", icon: Layers },
  { id: "analytics", label: "ANALYTICS", icon: BarChart3 },
  { id: "monitoring", label: "MONITORING", icon: Activity },
  { id: "operations", label: "OPERATIONS", icon: Package },
  { id: "crm", label: "CRM", icon: Users },
  { id: "productivity", label: "PRODUCTIVITY", icon: Zap },
  { id: "custom", label: "CUSTOM", icon: Sparkles },
];

const CATEGORY_ACCENT = {
  analytics: { border: "border-cyan-500/40", glow: "shadow-cyan-500/20", text: "text-cyan-400", bg: "bg-cyan-500/10", bar: "bg-cyan-400" },
  monitoring: { border: "border-amber-500/40", glow: "shadow-amber-500/20", text: "text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-400" },
  operations: { border: "border-violet-500/40", glow: "shadow-violet-500/20", text: "text-violet-400", bg: "bg-violet-500/10", bar: "bg-violet-400" },
  crm: { border: "border-emerald-500/40", glow: "shadow-emerald-500/20", text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-400" },
  productivity: { border: "border-pink-500/40", glow: "shadow-pink-500/20", text: "text-pink-400", bg: "bg-pink-500/10", bar: "bg-pink-400" },
  custom: { border: "border-slate-500/40", glow: "shadow-slate-500/20", text: "text-slate-400", bg: "bg-slate-500/10", bar: "bg-slate-400" },
};

// Animated scanner line
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none z-10"
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Corner brackets decoration
function CornerBrackets({ color = "border-cyan-500/40" }) {
  return (
    <>
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${color}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${color}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${color}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${color}`} />
    </>
  );
}

// App card
function AppCard({ app, isInstalled, isInstalling, onInstall, onUninstall, onPreview }) {
  const accent = CATEGORY_ACCENT[app.category] || CATEGORY_ACCENT.custom;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative rounded-xl border bg-slate-950/80 backdrop-blur-sm cursor-pointer overflow-hidden transition-all duration-300 ${
        hovered ? `${accent.border} shadow-lg ${accent.glow}` : "border-slate-800/60"
      }`}
      onClick={() => onPreview(app)}
    >
      {/* Top accent line */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-px ${accent.bar} opacity-0`}
        animate={{ opacity: hovered ? 0.8 : 0 }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`relative w-10 h-10 rounded-lg ${accent.bg} ${accent.border} border flex items-center justify-center text-xl`}>
              {app.icon_emoji || "⚡"}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.15 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`absolute inset-0 rounded-lg ${accent.bar}`}
                  />
                )}
              </AnimatePresence>
            </div>
            <div>
              <p className="text-sm font-bold text-white font-mono tracking-wide">{app.name}</p>
              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${accent.bg} ${accent.text} border ${accent.border}`}>
                {app.category || "custom"}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
            className="text-slate-500"
          >
            <ArrowUpRight className="w-4 h-4" />
          </motion.div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{app.description || "No description available"}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {app.store_installs || 0}
            </span>
            <span className="text-slate-600">·</span>
            <span className="truncate max-w-[80px]">{app.created_by_name || "Anonymous"}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={isInstalling}
            onClick={e => { e.stopPropagation(); isInstalled ? onUninstall(app) : onInstall(app); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
              isInstalled
                ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
            }`}
          >
            {isInstalling ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isInstalled ? (
              <><X className="w-3 h-3" /> REMOVE</>
            ) : (
              <><Download className="w-3 h-3" /> ADD</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Scan effect on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Detail panel
function AppDetailPanel({ app, isInstalled, isInstalling, onInstall, onUninstall, onClose }) {
  const accent = CATEGORY_ACCENT[app.category] || CATEGORY_ACCENT.custom;
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`relative flex flex-col h-full bg-slate-950/95 border-l-2 ${accent.border} overflow-hidden`}
    >
      <ScanLine />
      <CornerBrackets color={accent.border} />

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800/60">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 rounded-2xl ${accent.bg} ${accent.border} border-2 flex items-center justify-center text-4xl shadow-lg`}>
            {app.icon_emoji || "⚡"}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className={`text-2xl font-black font-mono tracking-widest ${accent.text} mb-1`}>{app.name?.toUpperCase()}</h2>
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest ${accent.bg} ${accent.text} border ${accent.border} mb-3`}>
          <Shield className="w-3 h-3" /> {app.category || "custom"} module
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{app.description || "No description available."}</p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-3 p-4 border-b border-slate-800/60">
        {[
          { label: "INSTALLS", value: app.store_installs || 0, icon: Download },
          { label: "AUTHOR", value: app.created_by_name || "Anonymous", icon: Users },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/40">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">
              <stat.icon className="w-3 h-3" /> {stat.label}
            </div>
            <p className={`text-sm font-bold font-mono ${accent.text} truncate`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tags / prompt preview */}
      {app.tags?.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-slate-800/60">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">TAGS</p>
          <div className="flex flex-wrap gap-1.5">
            {app.tags.map(tag => (
              <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-mono ${accent.bg} ${accent.text} border ${accent.border}`}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Install button */}
      <div className="flex-shrink-0 p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={isInstalled || isInstalling}
          onClick={() => onInstall(app)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-black text-sm tracking-widest transition-all ${
            isInstalled
              ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 cursor-default"
              : `bg-gradient-to-r from-cyan-500/20 to-violet-500/20 ${accent.text} border-2 ${accent.border} hover:from-cyan-500/30 hover:to-violet-500/30 shadow-lg ${accent.glow}`
          }`}
        >
          {isInstalling ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> INSTALLING...</>
          ) : isInstalled ? (
            <><CheckCircle2 className="w-4 h-4" /> INSTALLED</>
          ) : (
            <><Download className="w-4 h-4" /> DEPLOY TO ORG</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function FleetStore({ orgId, onInstall, onUninstall, installedIds = [], onClose }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [installing, setInstalling] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [tick, setTick] = useState(0);
  const [localInstalledIds, setLocalInstalledIds] = useState([...installedIds]);

  // Holographic clock tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { loadStore(); }, []);

  const loadStore = async () => {
    setLoading(true);
    const data = await base44.entities.HarborApp.filter({ published_to_store: true }, '-store_installs', 100);
    setApps(data);
    setLoading(false);
  };

  const handleInstall = async (app) => {
    if (localInstalledIds.includes(app.id)) return;
    setInstalling(app.id);
    try {
      await base44.entities.HarborApp.update(app.id, { store_installs: (app.store_installs || 0) + 1 });
      setLocalInstalledIds(prev => [...prev, app.id]);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, store_installs: (a.store_installs || 0) + 1 } : a));
      if (selectedApp?.id === app.id) setSelectedApp(prev => ({ ...prev, store_installs: (prev.store_installs || 0) + 1 }));
      onInstall?.(app.id);
      toast.success(`✅ "${app.name}" added to your library!`);
    } catch (err) {
      toast.error("Failed to add app: " + err.message);
    }
    setInstalling(null);
  };

  const handleUninstall = async (app) => {
    setInstalling(app.id);
    try {
      const count = Math.max(0, (app.store_installs || 1) - 1);
      await base44.entities.HarborApp.update(app.id, { store_installs: count });
      setLocalInstalledIds(prev => prev.filter(id => id !== app.id));
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, store_installs: count } : a));
      if (selectedApp?.id === app.id) setSelectedApp(prev => ({ ...prev, store_installs: count }));
      onUninstall?.(app.id);
      toast.success(`"${app.name}" removed from your library.`);
    } catch (err) {
      toast.error("Failed to remove app: " + err.message);
    }
    setInstalling(null);
  };

  const filtered = apps.filter(app => {
    const matchCat = activeCategory === "all" || app.category === activeCategory;
    const matchSearch = !search || app.name?.toLowerCase().includes(search.toLowerCase()) || app.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col font-mono">

      {/* Animated grid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Radial glow center */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.04) 0%, transparent 70%)" }} />
        {/* Side glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Top HUD bar */}
      <div className="relative flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl z-20">
        {/* Left: Logo & title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-2 border-cyan-500/40 flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full border border-cyan-400/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
            </motion.div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-black tracking-[0.3em] text-sm">FLEET</span>
              <span className="text-white font-black tracking-[0.3em] text-sm">STORE</span>
              <div className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[9px] text-cyan-400 tracking-widest">v2.0</div>
            </div>
            <p className="text-[9px] text-slate-500 tracking-widest">H.A.R.B.O.R MARKETPLACE</p>
          </div>
        </div>

        {/* Center: stats */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "MODULES", value: apps.length },
            { label: "ONLINE", value: apps.filter(a => a.store_installs > 0).length },
            { label: "CATEGORY", value: activeCategory.toUpperCase() },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[9px] text-slate-500 tracking-widest">{s.label}</p>
              <p className="text-sm font-black text-cyan-400">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Right: clock & close */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-white tracking-widest tabular-nums">{timeStr}</p>
            <p className="text-[9px] text-slate-500 tracking-widest">{dateStr}</p>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="p-2 rounded-lg border border-slate-700/60 text-slate-400 hover:text-white hover:border-red-500/40 hover:bg-red-500/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main body */}
      <div className="relative flex-1 flex overflow-hidden z-10">

        {/* Left sidebar: categories */}
        <div className="flex-shrink-0 w-48 border-r border-cyan-500/10 bg-slate-950/60 backdrop-blur flex flex-col py-4 gap-1 px-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest px-2 mb-2">MODULES</p>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === "all" ? apps.length : apps.filter(a => a.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveCategory(cat.id); setSelectedApp(null); }}
                className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-[11px] group ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && (
                    <motion.div
                      layoutId="activeCatIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-full"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="tracking-wider font-bold">{cat.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isActive ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* System status */}
          <div className="mt-auto pt-4 px-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 tracking-widest">ONLINE</span>
            </div>
            <p className="text-[9px] text-slate-600 tracking-wide">HARBOR NETWORK CONNECTED</p>
          </div>
        </div>

        {/* Center: app grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-slate-800/40 bg-slate-950/40">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH MODULES..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 tracking-wider font-mono transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
                />
                <p className="text-xs text-cyan-400 tracking-widest animate-pulse">SCANNING HARBOR NETWORK...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
                <Store className="w-12 h-12 opacity-20" />
                <p className="text-sm tracking-widest">NO MODULES FOUND</p>
                <p className="text-xs">Build and publish your first app to the store</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map(app => (
                    <AppCard
                      key={app.id}
                      app={app}
                      isInstalled={localInstalledIds.includes(app.id)}
                      isInstalling={installing === app.id}
                      onInstall={handleInstall}
                      onPreview={setSelectedApp}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <AnimatePresence>
          {selectedApp && (
            <div className="flex-shrink-0 w-72 xl:w-80">
              <AppDetailPanel
                app={selectedApp}
                isInstalled={localInstalledIds.includes(selectedApp.id)}
                isInstalling={installing === selectedApp.id}
                onInstall={handleInstall}
                onClose={() => setSelectedApp(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom HUD bar */}
      <div className="relative flex-shrink-0 flex items-center justify-between px-6 py-2 border-t border-cyan-500/10 bg-slate-950/80 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="text-[9px] text-slate-600 tracking-widest">H.A.R.B.O.R FLEET INTELLIGENCE PLATFORM</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-slate-600 tracking-widest">
          <span>MODULES: {filtered.length}/{apps.length}</span>
          <span className="text-slate-700">|</span>
          <span>STATUS: OPERATIONAL</span>
        </div>
      </div>
    </div>
  );
}