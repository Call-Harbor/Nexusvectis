import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Wifi, WifiOff, CheckCircle2, AlertTriangle, Plane, Settings2 } from "lucide-react";

const IATA_SUGGESTIONS = ["CPH", "OSL", "ARN", "HEL", "AAL", "BLL", "ODE", "LHR", "AMS", "FRA", "CDG", "DXB", "JFK"];

const STORAGE_KEY = "flight_sync_iata";

export default function FlightSyncPanel({ orgId, logAdd }) {
  const [iata, setIata] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(false);
  const [showConfig, setShowConfig] = useState(!localStorage.getItem(STORAGE_KEY));

  // Auto-sync every 2 minutes when enabled
  useEffect(() => {
    if (!autoSync || !iata) return;
    const t = setInterval(() => runSync(true), 120000);
    return () => clearInterval(t);
  }, [autoSync, iata]);

  const runSync = async (silent = false) => {
    if (!iata || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("liveFlightSync", {
        airport_iata: iata.toUpperCase(),
        organization_id: orgId,
      });
      setResult(res.data);
      setLastSync(new Date());
      if (!silent) logAdd(`Sync fuldført: ${res.data.synced} fly fra ${iata.toUpperCase()}`, "success");
    } catch (e) {
      setError(e.message || "Sync fejlede");
      if (!silent) logAdd(`Sync fejl: ${e.message}`, "alert");
    }
    setLoading(false);
  };

  const saveIata = (v) => {
    setIata(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(6,182,212,0.3)", background: "rgba(2,8,23,0.8)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(6,182,212,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Plane className="w-4 h-4 text-cyan-400" />
            {autoSync && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />}
          </div>
          <span className="text-sm font-bold text-cyan-300">Live Flydata Sync</span>
          {iata && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-400">{iata.toUpperCase()}</span>}
        </div>
        <div className="flex items-center gap-2">
          {lastSync && <span className="text-[10px] text-slate-500">{lastSync.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={() => setShowConfig(s => !s)} className="w-7 h-7 rounded-lg flex items-center justify-center active:bg-slate-800 transition-colors">
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="px-4 py-4 space-y-3" style={{ borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Lufthavn IATA-kode</p>
            <input value={iata} onChange={e => saveIata(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="f.eks. CPH"
              maxLength={3}
              className="w-full h-11 rounded-xl px-4 text-base font-black text-white tracking-widest uppercase outline-none"
              style={{ background: "rgba(30,41,59,0.9)", border: "1.5px solid rgba(6,182,212,0.4)", letterSpacing: "0.2em" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {IATA_SUGGESTIONS.map(c => (
              <button key={c} onClick={() => { saveIata(c); setShowConfig(false); }}
                className="h-8 px-3 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{ background: iata === c ? "rgba(6,182,212,0.2)" : "rgba(30,41,59,0.6)", color: iata === c ? "#06b6d4" : "#64748b", border: `1px solid ${iata === c ? "rgba(6,182,212,0.5)" : "rgba(51,65,85,0.4)"}` }}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white font-bold">Auto-sync</p>
              <p className="text-[10px] text-slate-500">Opdater automatisk hvert 2. minut</p>
            </div>
            <button onClick={() => setAutoSync(s => !s)}
              className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: autoSync ? "rgba(16,185,129,0.4)" : "rgba(51,65,85,0.5)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow"
                style={{ background: autoSync ? "#10b981" : "#64748b", left: autoSync ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
          {iata && (
            <button onClick={() => { setShowConfig(false); runSync(); }}
              className="w-full h-11 rounded-xl font-bold text-sm"
              style={{ background: "rgba(6,182,212,0.2)", border: "1.5px solid rgba(6,182,212,0.5)", color: "#06b6d4" }}>
              Gem & sync nu
            </button>
          )}
        </div>
      )}

      {/* Result / status */}
      <div className="px-4 py-3 space-y-3">
        {result && !error && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Fly synket", value: result.synced, color: "#06b6d4" },
              { label: "Nye", value: result.created, color: "#10b981" },
              { label: "Opdaterede", value: result.updated, color: "#8b5cf6" },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-2.5 text-center" style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                <p className="text-lg font-black" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[9px] text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)" }}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-400">Sync fejl</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result?.message && (
          <p className="text-[11px] text-amber-400">{result.message}</p>
        )}

        {/* Sync button */}
        <button onClick={() => runSync()} disabled={loading || !iata}
          className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40"
          style={{ background: loading ? "rgba(6,182,212,0.08)" : "rgba(6,182,212,0.18)", border: `2px solid rgba(6,182,212,${loading ? "0.2" : "0.5"})`, color: "#06b6d4" }}>
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Synkroniserer...</>
            : result
              ? <><RefreshCw className="w-4 h-4" />Opdater flydata</>
              : <><Wifi className="w-4 h-4" />Start live flydata sync</>}
        </button>

        {!iata && <p className="text-[10px] text-slate-500 text-center">Indstil lufthavn IATA-kode for at starte</p>}
        {autoSync && iata && <p className="text-[10px] text-emerald-500 text-center flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Auto-sync aktiv · opdaterer hvert 2. min</p>}
      </div>
    </div>
  );
}