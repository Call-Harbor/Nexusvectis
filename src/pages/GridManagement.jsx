import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, Pencil, Trash2, Save, X, RefreshCw, Wind, Sun, Battery,
  Flame, Activity, Cpu, TrendingUp, Wifi, WifiOff, Wrench, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const ASSET_TYPES = ["line","transformer","substation","generator","battery","solar","wind","load_node"];
const STATUSES = ["online","offline","maintenance","fault","standby"];
const MODULES = ["port","airport","transit","none"];
const ASSET_ICON = { wind: Wind, solar: Sun, battery: Battery, generator: Flame, line: Activity, transformer: Cpu, substation: Zap, load_node: TrendingUp };
const ASSET_COLOR = { wind:"cyan", solar:"amber", battery:"emerald", generator:"orange", line:"violet", transformer:"blue", substation:"indigo", load_node:"rose" };

const EMPTY = {
  name: "", asset_type: "wind", voltage_kv: 132, capacity_mw: 100,
  current_load_mw: 0, load_percent: 0, status: "online",
  co2_kg_per_mwh: 0, is_flexible: false, linked_module: "none",
  location: "", organization_id: "system",
};

function AssetForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Navn", key: "name", type: "text" },
          { label: "Lokation", key: "location", type: "text" },
          { label: "Kapacitet (MW)", key: "capacity_mw", type: "number" },
          { label: "Nuværende last (MW)", key: "current_load_mw", type: "number" },
          { label: "Spænding (kV)", key: "voltage_kv", type: "number" },
          { label: "CO₂ (kg/MWh)", key: "co2_kg_per_mwh", type: "number" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-slate-400 text-xs mb-1 block">{label}</label>
            <input
              type={type}
              value={form[key] ?? ""}
              onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        ))}
        {[
          { label: "Asset-type", key: "asset_type", options: ASSET_TYPES },
          { label: "Status", key: "status", options: STATUSES },
          { label: "Tilknyttet modul", key: "linked_module", options: MODULES },
        ].map(({ label, key, options }) => (
          <div key={key}>
            <label className="text-slate-400 text-xs mb-1 block">{label}</label>
            <select
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <label className="text-slate-400 text-xs">Fleksibel ressource</label>
          <button
            type="button"
            onClick={() => set("is_flexible", !form.is_flexible)}
            className={`w-10 h-5 rounded-full transition-all ${form.is_flexible ? "bg-cyan-500" : "bg-slate-700"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_flexible ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(form)} disabled={saving || !form.name}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Gemmer..." : "Gem"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-all">
          <X className="w-4 h-4" /> Annuller
        </button>
      </div>
    </div>
  );
}

export default function GridManagement() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // id or "new"
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["grid-assets-admin"],
    queryFn: () => base44.entities.GridAsset.list(),
    refetchInterval: 10000,
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ["grid-assets-admin"] });

  const handleSave = async (form) => {
    setSaving(true);
    const load_percent = form.capacity_mw > 0 ? Math.round((form.current_load_mw / form.capacity_mw) * 100) : 0;
    const data = { ...form, load_percent, last_reading_at: new Date().toISOString() };
    if (editing === "new") {
      await base44.entities.GridAsset.create(data);
    } else {
      await base44.entities.GridAsset.update(editing, data);
    }
    setSaving(false);
    setEditing(null);
    refetch();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await base44.entities.GridAsset.delete(id);
    setDeleting(null);
    refetch();
  };

  const handleSync = async (fn) => {
    setSyncing(fn);
    const res = await base44.functions.invoke(fn, {});
    setSyncResult({ fn, data: res.data });
    setSyncing(false);
    refetch();
  };

  const statusColor = { online:"emerald", offline:"red", maintenance:"amber", fault:"red", standby:"slate" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Grid Asset Management</h1>
              <p className="text-slate-500 text-xs">{assets.length} assets · Realtids-opdatering hvert 10s</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleSync("gridRealtimeUpdater")} disabled={!!syncing}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing === "gridRealtimeUpdater" ? "animate-spin text-cyan-400" : ""}`} />
              Simuler load-opdatering
            </button>
            <button onClick={() => handleSync("energinetSync")} disabled={!!syncing}
              className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
              <Wifi className={`w-3.5 h-3.5 ${syncing === "energinetSync" ? "animate-spin" : ""}`} />
              Hent Energinet.dk live
            </button>
            <button onClick={() => setEditing("new")}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all">
              <Plus className="w-3.5 h-3.5" /> Nyt asset
            </button>
          </div>
        </div>

        {/* Sync result */}
        <AnimatePresence>
          {syncResult && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-emerald-300 text-sm font-semibold">
                  {syncResult.fn === "energinetSync" ? "Energinet.dk data hentet" : "Load-simulation kørt"}
                </p>
                {syncResult.fn === "energinetSync" && syncResult.data?.live_data && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {Object.entries(syncResult.data.live_data).map(([k, v]) => (
                      <span key={k} className="text-xs text-slate-400"><span className="text-slate-300">{k}:</span> {v}</span>
                    ))}
                  </div>
                )}
                {syncResult.fn === "gridRealtimeUpdater" && (
                  <p className="text-slate-400 text-xs mt-1">{syncResult.data?.message}</p>
                )}
              </div>
              <button onClick={() => setSyncResult(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New asset form */}
        <AnimatePresence>
          {editing === "new" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
              <h3 className="text-white font-semibold text-sm mb-3">Nyt Grid Asset</h3>
              <AssetForm onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assets list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => {
              const Icon = ASSET_ICON[asset.asset_type] || Zap;
              const color = ASSET_COLOR[asset.asset_type] || "cyan";
              const sc = statusColor[asset.status] || "slate";
              const isEdit = editing === asset.id;

              return (
                <motion.div key={asset.id} layout>
                  {isEdit ? (
                    <div className="mb-1">
                      <AssetForm initial={asset} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
                    </div>
                  ) : (
                    <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-lg bg-${color}-500/15 border border-${color}-500/30 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 text-${color}-400`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-semibold text-sm">{asset.name}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 bg-${sc}-500/20 text-${sc}-300 border-${sc}-500/30`}>{asset.status}</Badge>
                              {asset.is_flexible && <Badge className="text-[10px] px-1.5 py-0 bg-cyan-500/15 text-cyan-300 border-cyan-500/25">flex</Badge>}
                              {asset.linked_module && asset.linked_module !== "none" && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-violet-500/15 text-violet-300 border-violet-500/25">{asset.linked_module}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex-1 bg-slate-800 rounded-full h-1.5 max-w-32">
                                <div
                                  className={`h-1.5 rounded-full ${(asset.load_percent||0) >= 90 ? "bg-red-500" : (asset.load_percent||0) >= 75 ? "bg-amber-400" : "bg-emerald-400"}`}
                                  style={{ width: `${Math.min(asset.load_percent || 0, 100)}%` }}
                                />
                              </div>
                              <span className="text-slate-400 text-xs">{asset.current_load_mw}/{asset.capacity_mw} MW ({asset.load_percent}%)</span>
                              {asset.location && <span className="text-slate-600 text-xs hidden md:block">{asset.location}</span>}
                              {asset.last_reading_at && <span className="text-slate-700 text-[10px] hidden lg:block">{moment(asset.last_reading_at).fromNow()}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => setEditing(asset.id)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(asset.id)} disabled={deleting === asset.id}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all disabled:opacity-50">
                              {deleting === asset.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}