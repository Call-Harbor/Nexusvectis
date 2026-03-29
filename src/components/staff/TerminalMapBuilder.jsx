import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, Plus, Trash2, Move, Eye, Settings, RefreshCw, Layers, Info } from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────
const PIN_TYPES = {
  gate: { label: "Gate", emoji: "✈", baseColor: "#06b6d4" },
  security: { label: "Security Lane", emoji: "🛡", baseColor: "#f59e0b" },
  landside: { label: "Landside Zone", emoji: "🚕", baseColor: "#8b5cf6" },
  label: { label: "Område-label", emoji: "🏷", baseColor: "#64748b" },
};

function loadColor(status, queueRatio, waitMin) {
  if (status === "closed" || status === "cancelled") return "#f43f5e";
  if (waitMin > 30 || queueRatio > 0.9) return "#f43f5e";
  if (waitMin > 15 || queueRatio > 0.6) return "#f59e0b";
  if (status === "open" || status === "on_duty") return "#10b981";
  if (status === "occupied" || status === "in_progress") return "#06b6d4";
  if (status === "limited" || status === "degraded") return "#f97316";
  return "#64748b";
}

function pinColor(pin, liveData) {
  const d = liveData[pin.entityId];
  if (!d) return PIN_TYPES[pin.type]?.baseColor || "#64748b";
  const queue = pin.type === "gate" ? (d.pax_waiting || 0) / 200 : (d.queue_length || d.queue_count || 0) / 150;
  return loadColor(d.status, queue, d.wait_minutes || 0);
}

function PulsePin({ x, y, color, label, sub, selected, onClick, onDrag, editMode }) {
  const [hover, setHover] = useState(false);
  const drag = useRef(false);
  const start = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const handlePointerDown = (e) => {
    if (!editMode) return onClick?.();
    e.stopPropagation();
    drag.current = false;
    start.current = { mx: e.clientX, my: e.clientY, px: x, py: y };
    window.addEventListener("pointermove", handlePM);
    window.addEventListener("pointerup", handlePU);
  };
  const handlePM = useCallback((e) => {
    const dx = e.clientX - start.current.mx;
    const dy = e.clientY - start.current.my;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current = true;
    onDrag?.(start.current.px + dx, start.current.py + dy);
  }, [onDrag]);
  const handlePU = useCallback(() => {
    window.removeEventListener("pointermove", handlePM);
    window.removeEventListener("pointerup", handlePU);
    if (!drag.current) onClick?.();
  }, [handlePM, onClick]);

  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: editMode ? "grab" : "pointer" }}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      {/* pulse ring */}
      <circle r="18" fill={color} fillOpacity={0.12}>
        <animate attributeName="r" values="16;22;16" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" values="0.15;0.04;0.15" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* outer ring */}
      {selected && <circle r="17" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 3" opacity="0.9">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
      </circle>}
      {/* dot */}
      <circle r="11" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
      <circle r="6" fill={color} />
      {/* label */}
      {(hover || selected) && (
        <g>
          <rect x="-38" y="16" width="76" height="34" rx="6" fill="rgba(2,8,23,0.92)" stroke={color} strokeWidth="1.2" />
          <text x="0" y="29" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">{label}</text>
          {sub && <text x="0" y="41" textAnchor="middle" fill={color} fontSize="7.5" fontFamily="system-ui">{sub}</text>}
        </g>
      )}
      {!hover && !selected && (
        <text x="0" y="-14" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="600" fontFamily="system-ui" opacity="0.8">{label}</text>
      )}
    </g>
  );
}

function LiveTooltip({ pin, liveData, onClose }) {
  const d = liveData[pin.entityId];
  const color = pinColor(pin, liveData);
  return (
    <div className="absolute inset-0 flex items-end justify-center p-4 pointer-events-none z-20">
      <div className="pointer-events-auto rounded-2xl p-4 w-full max-w-xs shadow-2xl"
        style={{ background: "rgba(2,8,23,0.97)", border: `2px solid ${color}50` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{PIN_TYPES[pin.type]?.emoji}</span>
            <div>
              <p className="font-bold text-white">{pin.label}</p>
              <p className="text-xs text-slate-400">{PIN_TYPES[pin.type]?.label}</p>
            </div>
          </div>
          <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        </div>
        {d ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {d.status && <div className="rounded-lg p-2" style={{ background: `${color}15` }}>
              <p className="text-slate-400">Status</p>
              <p className="font-bold text-white capitalize">{d.status?.replace(/_/g, " ")}</p>
            </div>}
            {d.pax_waiting != null && <div className="rounded-lg p-2 bg-slate-800/50">
              <p className="text-slate-400">Pax venter</p>
              <p className="font-bold text-white">{d.pax_waiting}</p>
            </div>}
            {(d.queue_length != null || d.queue_count != null) && <div className="rounded-lg p-2 bg-slate-800/50">
              <p className="text-slate-400">Kø</p>
              <p className="font-bold text-white">{d.queue_length ?? d.queue_count}</p>
            </div>}
            {d.wait_minutes != null && <div className="rounded-lg p-2" style={{ background: d.wait_minutes > 20 ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.1)" }}>
              <p className="text-slate-400">Ventetid</p>
              <p className="font-bold" style={{ color: d.wait_minutes > 20 ? "#f43f5e" : "#10b981" }}>{d.wait_minutes} min</p>
            </div>}
            {d.staff_assigned != null && <div className="rounded-lg p-2 bg-slate-800/50">
              <p className="text-slate-400">Staff</p>
              <p className="font-bold text-white">{d.staff_assigned}/{d.staff_required || "?"}</p>
            </div>}
            {d.current_occupancy != null && d.capacity > 0 && <div className="rounded-lg p-2 bg-slate-800/50">
              <p className="text-slate-400">Belægning</p>
              <p className="font-bold text-white">{Math.round(d.current_occupancy / d.capacity * 100)}%</p>
            </div>}
          </div>
        ) : <p className="text-xs text-slate-500 text-center py-2">Ingen live data tilknyttet</p>}
        <button onClick={onClose}
          className="mt-3 w-full h-9 rounded-xl text-xs font-bold text-slate-400 active:bg-slate-800 transition-colors">
          Luk ✕
        </button>
      </div>
    </div>
  );
}

// ─── AI Layout Builder ──────────────────────────────────────────────────────
function AIBuilder({ orgId, gates, lanes, zones, onLayout }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=intro, 1=input, 2=done

  const generate = async () => {
    setLoading(true);
    try {
      const entities = {
        gates: gates.map(g => ({ id: g.id, code: g.gate_code, terminal: g.terminal, concourse: g.concourse })),
        security_lanes: lanes.map(l => ({ id: l.id, name: l.name, terminal: l.terminal, type: l.lane_type })),
        landside_zones: zones.map(z => ({ id: z.id, name: z.name, type: z.facility_type })),
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er ekspert i lufthavn layout-design. Baseret på følgende lufthavn entiteter og brugerens beskrivelse, generér et kortlayout med X,Y koordinater (0-700 X, 0-500 Y) for hvert element.

LUFTHAVN BESKRIVELSE: ${prompt}

ENTITETER: ${JSON.stringify(entities, null, 2)}

Regler:
- Gates skal gruppers logisk (f.eks. terminal A til venstre, B til højre)
- Security lanes skal placeres foran/ved gate-adgangen
- Landside zoner skal placeres i bunden/yderkanten
- Labels kan bruges til terminal-navne og gang-vejledning
- Hvert pin skal have et forståeligt label (kort, maks 12 tegn)
- Sørg for at pins er spredt ud og ikke overlapper (min 50px afstand)

Giv JSON med pins array. Hvert pin:
{ "id": unik_string, "type": "gate"|"security"|"landside"|"label", "label": string, "x": number, "y": number, "entityId": entity_id_or_null }

Tilføj også et "walls" array med SVG path strings til at tegne terminalbygningens omrids (simple rektangler/linjer som "M10,10 L690,10 L690,490 L10,490 Z" stil).`,
        response_json_schema: {
          type: "object",
          properties: {
            pins: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  label: { type: "string" },
                  x: { type: "number" },
                  y: { type: "number" },
                  entityId: { type: "string" }
                }
              }
            },
            walls: { type: "array", items: { type: "string" } },
            description: { type: "string" }
          }
        }
      });

      onLayout(res.pins || [], res.walls || []);
      setStep(2);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (step === 0) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-violet-600/20 flex items-center justify-center border-2 border-violet-500/30">
        <Zap className="w-10 h-10 text-violet-400" />
      </div>
      <div>
        <p className="text-xl font-black text-white">AI Terminal Kortbuilder</p>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">Beskriv din lufthavn og lad AI'en automatisk placere alle gates, security lanes og zoner på et interaktivt kort.</p>
      </div>
      <button onClick={() => setStep(1)}
        className="h-14 px-8 rounded-2xl font-bold text-base flex items-center gap-2 active:scale-98 transition-all"
        style={{ background: "rgba(139,92,246,0.25)", border: "2px solid rgba(139,92,246,0.6)", color: "#a78bfa" }}>
        <Zap className="w-5 h-5" /> Byg layout med AI
      </button>
    </div>
  );

  if (step === 1) return (
    <div className="p-5 space-y-5">
      <p className="text-sm font-bold text-violet-300">🏗 Beskriv din lufthavn</p>
      <p className="text-xs text-slate-400">AI'en kender allerede alle dine gates, security lanes og zoner. Beskriv blot terminalens struktur og layout.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
        placeholder="Eks: Vi har 2 terminaler. Terminal A er til venstre med gates A1-A12 og 3 security lanes. Terminal B er til højre med gates B1-B20 og 4 security lanes. Taxiranken og busserne er foran ankomsthal..."
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none"
        style={{ background: "rgba(30,41,59,0.8)", border: "1.5px solid rgba(139,92,246,0.4)" }}
      />
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Hurtige skabeloner:</p>
        {[
          "Enkelt terminal med gates i en bue, security i midten, landside i bunden",
          "To terminaler parallelt, fælles security checkpoint, separate landside ankomster",
          "H-formet terminal med tre concourses, security ved indgangen til hver concourse"
        ].map(t => (
          <button key={t} onClick={() => setPrompt(t)}
            className="w-full text-left text-xs p-3 rounded-xl text-slate-300 active:bg-slate-800 transition-colors"
            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(51,65,85,0.4)" }}>
            💡 {t}
          </button>
        ))}
      </div>
      <button onClick={generate} disabled={!prompt || loading}
        className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        style={{ background: "rgba(139,92,246,0.25)", border: "2px solid rgba(139,92,246,0.6)", color: "#a78bfa" }}>
        {loading ? <><RefreshCw className="w-5 h-5 animate-spin" />AI genererer layout...</> : <><Zap className="w-5 h-5" />Generer kortet nu</>}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
      <p className="text-4xl">✅</p>
      <p className="font-bold text-white">Layout genereret!</p>
      <button onClick={() => setStep(1)}
        className="text-xs text-violet-400 underline">Regenerer med ny beskrivelse</button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
const STORAGE_KEY = "terminal_map_v1";

export default function TerminalMapBuilder({ orgId }) {
  const [mode, setMode] = useState("view"); // view | edit | add | ai
  const [pins, setPins] = useState([]);
  const [walls, setWalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [addType, setAddType] = useState("gate");
  const [addEntityId, setAddEntityId] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const { data: gates = [] } = useQuery({ queryKey: ["sp_gates", orgId], queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 80), enabled: !!orgId, refetchInterval: 15000 });
  const { data: lanes = [] } = useQuery({ queryKey: ["sp_lanes", orgId], queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30), enabled: !!orgId, refetchInterval: 15000 });
  const { data: zones = [] } = useQuery({ queryKey: ["sp_landside", orgId], queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50), enabled: !!orgId, refetchInterval: 20000 });

  // Build live data map
  const liveData = {};
  gates.forEach(g => { liveData[g.id] = g; });
  lanes.forEach(l => { liveData[l.id] = l; });
  zones.forEach(z => { liveData[z.id] = z; });

  // Load saved layout
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_" + orgId);
      if (saved) { const p = JSON.parse(saved); setPins(p.pins || []); setWalls(p.walls || []); }
    } catch {}
  }, [orgId]);

  const save = (p, w) => {
    setPins(p); setWalls(w);
    try { localStorage.setItem(STORAGE_KEY + "_" + orgId, JSON.stringify({ pins: p, walls: w })); } catch {}
  };

  const movePin = (id, x, y) => {
    setPins(prev => {
      const next = prev.map(p => p.id === id ? { ...p, x: Math.max(20, Math.min(680, Math.round(x))), y: Math.max(20, Math.min(480, Math.round(y))) } : p);
      try { localStorage.setItem(STORAGE_KEY + "_" + orgId, JSON.stringify({ pins: next, walls })); } catch {}
      return next;
    });
  };

  const addPin = (e) => {
    if (mode !== "add") return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);
    const newPin = { id: Date.now().toString(), type: addType, label: addLabel || `${PIN_TYPES[addType]?.emoji} Pin`, x, y, entityId: addEntityId || null };
    save([...pins, newPin], walls);
    setAddLabel("");
    setAddEntityId("");
  };

  const deletePin = (id) => {
    save(pins.filter(p => p.id !== id), walls);
    setSelected(null);
    setTooltip(null);
  };

  const handlePinClick = (pin) => {
    if (mode === "edit") { setSelected(pin.id === selected ? null : pin.id); return; }
    setTooltip(pin);
  };

  const legends = [
    { color: "#10b981", label: "Normal / Åben" },
    { color: "#f59e0b", label: "Moderat belastning" },
    { color: "#f43f5e", label: "Høj belast. / Lukket" },
    { color: "#06b6d4", label: "I brug / Aktiv" },
    { color: "#64748b", label: "Ingen data" },
  ];

  const entityOptions = [
    { group: "Gates", items: gates.map(g => ({ id: g.id, label: `${g.gate_code}${g.terminal ? ` (${g.terminal})` : ""}` })) },
    { group: "Security Lanes", items: lanes.map(l => ({ id: l.id, label: l.name })) },
    { group: "Landside Zones", items: zones.map(z => ({ id: z.id, label: z.name })) },
  ];

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(51,65,85,0.5)", background: "rgba(2,8,23,0.8)" }}>
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-none flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
        {[
          { id: "view", icon: Eye, label: "Se", color: "#10b981" },
          { id: "edit", icon: Move, label: "Flyt pins", color: "#06b6d4" },
          { id: "add", icon: Plus, label: "Tilføj pin", color: "#f59e0b" },
          { id: "ai", icon: Zap, label: "AI Builder", color: "#8b5cf6" },
        ].map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
              style={{ background: mode === m.id ? `${m.color}20` : "transparent", color: mode === m.id ? m.color : "#64748b", border: `1.5px solid ${mode === m.id ? m.color + "50" : "transparent"}` }}>
              <Icon className="w-3.5 h-3.5" />{m.label}
            </button>
          );
        })}
        {pins.length > 0 && (
          <span className="ml-auto text-xs text-slate-500 whitespace-nowrap flex-shrink-0">{pins.length} pins</span>
        )}
      </div>

      {/* add pin form */}
      {mode === "add" && (
        <div className="px-4 py-3 space-y-3 flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.05)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-xs text-amber-400 font-bold">👆 Tryk på kortet for at placere en pin</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Type</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(PIN_TYPES).map(([k, v]) => (
                  <button key={k} onClick={() => setAddType(k)}
                    className="h-9 rounded-lg text-xs font-bold transition-all"
                    style={{ background: addType === k ? `${v.baseColor}20` : "rgba(30,41,59,0.6)", color: addType === k ? v.baseColor : "#64748b", border: `1px solid ${addType === k ? v.baseColor + "50" : "rgba(51,65,85,0.4)"}` }}>
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div>
                <p className="text-xs text-slate-500 mb-1">Label</p>
                <input value={addLabel} onChange={e => setAddLabel(e.target.value)}
                  placeholder="Gate B14"
                  className="w-full h-9 rounded-lg px-3 text-xs text-white outline-none"
                  style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.5)" }} />
              </div>
              {addType !== "label" && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tilknyt live data</p>
                  <select value={addEntityId} onChange={e => setAddEntityId(e.target.value)}
                    className="w-full h-9 rounded-lg px-2 text-xs text-white outline-none"
                    style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.5)" }}>
                    <option value="">Ingen</option>
                    {entityOptions.map(g => g.items.length > 0 && (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI builder panel */}
      {mode === "ai" && (
        <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
          <AIBuilder orgId={orgId} gates={gates} lanes={lanes} zones={zones}
            onLayout={(p, w) => { save(p, w); setMode("view"); }} />
        </div>
      )}

      {/* SVG Map */}
      {mode !== "ai" && (
        <div className="relative flex-1 min-h-0" style={{ minHeight: "340px" }}>
          <svg ref={svgRef} viewBox="0 0 700 500" className="w-full h-full"
            style={{ cursor: mode === "add" ? "crosshair" : "default", background: "radial-gradient(ellipse at 50% 50%, rgba(6,18,40,0.9) 0%, rgba(2,6,15,1) 100%)" }}
            onClick={addPin}>
            {/* Grid dots */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="rgba(51,65,85,0.3)" />
              </pattern>
            </defs>
            <rect width="700" height="500" fill="url(#grid)" />

            {/* Terminal walls */}
            {walls.map((w, i) => (
              <path key={i} d={w} fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" strokeDasharray="8 4" />
            ))}

            {/* Pins */}
            {pins.map(pin => {
              const d = liveData[pin.entityId] || {};
              const color = pinColor(pin, liveData);
              const sub = pin.type === "gate" ? (d.pax_waiting != null ? `${d.pax_waiting} pax` : "") :
                pin.type === "security" ? (d.wait_minutes != null ? `${d.wait_minutes}m vent` : "") :
                pin.type === "landside" ? (d.queue_count != null ? `kø ${d.queue_count}` : "") : "";

              return (
                <PulsePin key={pin.id}
                  x={pin.x} y={pin.y}
                  color={color}
                  label={pin.label}
                  sub={sub}
                  selected={selected === pin.id}
                  editMode={mode === "edit"}
                  onClick={() => handlePinClick(pin)}
                  onDrag={(nx, ny) => movePin(pin.id, nx, ny)}
                />
              );
            })}

            {/* Empty state */}
            {pins.length === 0 && (
              <text x="350" y="250" textAnchor="middle" fill="rgba(100,116,139,0.5)" fontSize="14" fontFamily="system-ui">
                Ingen pins endnu — brug AI Builder eller tilføj manuelt
              </text>
            )}
          </svg>

          {/* Tooltip overlay */}
          {tooltip && (
            <LiveTooltip pin={tooltip} liveData={liveData} onClose={() => setTooltip(null)} />
          )}

          {/* Delete selected pin */}
          {mode === "edit" && selected && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <button onClick={() => deletePin(selected)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
                style={{ background: "rgba(244,63,94,0.2)", border: "2px solid rgba(244,63,94,0.5)", color: "#f43f5e" }}>
                <Trash2 className="w-4 h-4" /> Slet valgt pin
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-2 right-2 rounded-xl p-2.5 space-y-1.5"
            style={{ background: "rgba(2,8,23,0.85)", border: "1px solid rgba(30,41,59,0.8)", backdropFilter: "blur(8px)" }}>
            {legends.map(l => (
              <div key={l.color} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color, boxShadow: `0 0 4px ${l.color}80` }} />
                <span className="text-[9px] text-slate-400 whitespace-nowrap">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Live refresh badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}