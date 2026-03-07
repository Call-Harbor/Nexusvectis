import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Download, Star, Zap, Package, BarChart3, Activity, Users, Route, AlertTriangle, Globe, Search, X, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORY_COLORS = {
  analytics: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  monitoring: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  operations: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  crm: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  productivity: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  custom: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

export default function FleetStore({ orgId, onInstall, installedIds = [] }) {
  const [storeApps, setStoreApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [installing, setInstalling] = useState(null);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    setLoading(true);
    const apps = await base44.entities.HarborApp.filter({ published_to_store: true }, '-store_installs', 50);
    setStoreApps(apps);
    setLoading(false);
  };

  const handleInstall = async (app) => {
    setInstalling(app.id);
    // Save a copy to this org
    await base44.entities.HarborApp.create({
      organization_id: orgId,
      name: app.name,
      description: app.description,
      prompt: app.prompt,
      code: app.code,
      published_to_store: false,
      category: app.category,
      icon_emoji: app.icon_emoji,
      tags: app.tags,
      created_by_name: app.created_by_name,
    });
    // Increment install count on original
    await base44.entities.HarborApp.update(app.id, { store_installs: (app.store_installs || 0) + 1 });
    toast.success(`"${app.name}" added to your Apps!`);
    onInstall?.();
    setInstalling(null);
  };

  const categories = ["all", "analytics", "monitoring", "operations", "crm", "productivity", "custom"];

  const filtered = storeApps.filter(app => {
    const matchCat = activeCategory === "all" || app.category === activeCategory;
    const matchSearch = !search || app.name.toLowerCase().includes(search.toLowerCase()) || app.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-violet-500/20 bg-slate-900/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono tracking-wider">FLEET STORE</h2>
            <p className="text-[10px] text-slate-400">Community apps for Intellect Mode</p>
          </div>
          <Badge className="ml-auto bg-violet-500/20 text-violet-300 border-violet-500/40 text-[10px]">{storeApps.length} apps</Badge>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search store..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all border ${
                activeCategory === cat
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                  : "text-slate-500 border-slate-700/40 hover:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* App grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading store...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <Store className="w-8 h-8 opacity-40" />
            <p>No apps found</p>
            {storeApps.length === 0 && <p className="text-xs text-slate-600">Be the first to publish an app!</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => {
              const isInstalled = installedIds.includes(app.id);
              const isInstalling = installing === app.id;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/60 hover:border-violet-500/30 hover:bg-slate-900/80 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                      {app.icon_emoji || "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{app.name}</p>
                        {app.category && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${CATEGORY_COLORS[app.category] || CATEGORY_COLORS.custom}`}>
                            {app.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mb-1.5">{app.description || "No description"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>by {app.created_by_name || "Anonymous"}</span>
                        <span>•</span>
                        <Download className="w-3 h-3" />
                        <span>{app.store_installs || 0} installs</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isInstalled || isInstalling}
                      onClick={() => handleInstall(app)}
                      className={`flex-shrink-0 text-[11px] h-7 px-2.5 font-mono ${
                        isInstalled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20"
                          : "bg-violet-600 hover:bg-violet-500 text-white border-0"
                      }`}
                    >
                      {isInstalling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isInstalled ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" />Added</>
                      ) : (
                        <><Download className="w-3 h-3 mr-1" />Add</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}