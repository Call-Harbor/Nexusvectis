import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, Move, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import { TrendingUp, Sparkles, CheckCircle, Mic } from "lucide-react";

const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const HOLOGRAM_THEMES = [
  { id: "nexus", label: "Nexus Blue", primary: "#06b6d4", secondary: "#8b5cf6", bg: "from-slate-950 via-cyan-950/30 to-slate-950" },
  { id: "aurora", label: "Aurora", primary: "#10b981", secondary: "#06b6d4", bg: "from-slate-950 via-emerald-950/30 to-slate-950" },
  { id: "solar", label: "Solar Storm", primary: "#f59e0b", secondary: "#ef4444", bg: "from-slate-950 via-amber-950/20 to-slate-950" },
  { id: "violet", label: "Deep Violet", primary: "#8b5cf6", secondary: "#ec4899", bg: "from-slate-950 via-violet-950/30 to-slate-950" },
  { id: "crimson", label: "Crimson", primary: "#ef4444", secondary: "#f97316", bg: "from-slate-950 via-red-950/20 to-slate-950" },
  { id: "ice", label: "Ice White", primary: "#e2e8f0", secondary: "#94a3b8", bg: "from-slate-900 via-slate-800/50 to-slate-900" },
];

// Inline editable text component
function EditableText({ value, onChange, className, style, multiline = false, placeholder = "Klik for at redigere" }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef(null);

  const startEdit = (e) => {
    e.stopPropagation();
    setLocalVal(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finish = () => {
    setEditing(false);
    if (localVal !== value) onChange(localVal);
  };

  if (editing) {
    const commonProps = {
      ref: inputRef,
      value: localVal,
      onChange: e => setLocalVal(e.target.value),
      onBlur: finish,
      onKeyDown: e => { if (!multiline && e.key === "Enter") finish(); if (e.key === "Escape") { setEditing(false); } },
      style: { ...style, background: "rgba(6,182,212,0.1)", border: "1.5px solid rgba(6,182,212,0.6)", borderRadius: 4, outline: "none", color: "inherit", width: "100%", resize: "none", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit" },
      className: "p-1",
      autoFocus: true,
    };
    return multiline
      ? <textarea {...commonProps} rows={3} />
      : <input {...commonProps} type="text" />;
  }

  return (
    <span
      className={`${className} cursor-pointer hover:outline hover:outline-1 hover:outline-cyan-400/50 rounded px-0.5 transition-all`}
      style={style}
      onClick={startEdit}
      title="Klik for at redigere"
    >
      {value || <span className="opacity-30 italic text-sm">{placeholder}</span>}
    </span>
  );
}

// Draggable image element on slide
function DraggableImage({ img, onUpdate, onDelete, containerRef }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef(null);

  const handleDragStart = (e) => {
    e.stopPropagation();
    setDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    startRef.current = { mx: e.clientX, my: e.clientY, ox: img.x, oy: img.y, rect };
    const onMove = (ev) => {
      const dx = (ev.clientX - startRef.current.mx) / startRef.current.rect.width * 100;
      const dy = (ev.clientY - startRef.current.my) / startRef.current.rect.height * 100;
      onUpdate({ x: Math.max(0, Math.min(90, startRef.current.ox + dx)), y: Math.max(0, Math.min(85, startRef.current.oy + dy)) });
    };
    const onUp = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setResizing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    startRef.current = { mx: e.clientX, ow: img.w, rect };
    const onMove = (ev) => {
      const dw = (ev.clientX - startRef.current.mx) / startRef.current.rect.width * 100;
      onUpdate({ w: Math.max(10, Math.min(80, startRef.current.ow + dw)) });
    };
    const onUp = () => { setResizing(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{ position: "absolute", left: `${img.x}%`, top: `${img.y}%`, width: `${img.w}%`, zIndex: 20 }}
      className="group"
    >
      <div
        className={`relative cursor-move rounded-lg overflow-hidden border-2 ${dragging ? "border-cyan-400" : "border-transparent group-hover:border-cyan-400/60"}`}
        onMouseDown={handleDragStart}
      >
        <img src={img.url} alt="" className="w-full h-auto block rounded-lg" draggable={false} />
        {/* Delete button */}
        <button
          onMouseDown={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
        >
          <X className="w-3 h-3" />
        </button>
        {/* Move icon */}
        <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Move className="w-3 h-3" />
        </div>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 rounded-tl-md cursor-se-resize opacity-0 group-hover:opacity-100 transition-all"
        title="Træk for at ændre størrelse"
      />
    </div>
  );
}

export default function SlideCanvas({ slide, theme, fontSize = "medium", onUpdate, editable = true }) {
  const t = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];
  const fontScale = fontSize === "small" ? 0.85 : fontSize === "large" ? 1.15 : 1;
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const images = slide.images || [];

  const addImage = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res?.file_url || res?.data?.file_url;
      if (!url) throw new Error("Upload fejlede");
      onUpdate({ images: [...images, { id: Date.now(), url, x: 30, y: 20, w: 35 }] });
      toast.success("Billede tilføjet");
    } catch (e) {
      toast.error("Kunne ikke uploade billede");
    }
    setUploading(false);
  };

  const updateImage = (id, changes) => {
    onUpdate({ images: images.map(img => img.id === id ? { ...img, ...changes } : img) });
  };

  const deleteImage = (id) => {
    onUpdate({ images: images.filter(img => img.id !== id) });
  };

  const gridLines = (
    <div className="absolute inset-0 pointer-events-none opacity-10"
      style={{ backgroundImage: `linear-gradient(${t.primary}33 1px, transparent 1px), linear-gradient(90deg, ${t.primary}33 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
  );

  const glow = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: t.primary }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: t.secondary }} />
    </div>
  );

  const up = editable ? onUpdate : null;
  const ET = ({ value, field, className, style, multiline, placeholder }) =>
    editable ? (
      <EditableText
        value={value || ""}
        onChange={v => up({ [field]: v })}
        className={className}
        style={style}
        multiline={multiline}
        placeholder={placeholder}
      />
    ) : <span className={className} style={style}>{value}</span>;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-gradient-to-br ${t.bg} relative overflow-hidden rounded-xl border`}
      style={{ borderColor: t.primary + "30" }}
    >
      {gridLines}{glow}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(transparent 50%, ${t.primary}05 50%)`, backgroundSize: "100% 4px" }} />

      {/* Corner accents */}
      {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl", "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl"
      ].map((cls, i) => (
        <div key={i} className={`absolute w-14 h-14 ${cls} opacity-50`} style={{ borderColor: t.primary }} />
      ))}

      {/* Slide tag */}
      <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-60 z-10">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.primary }} />
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.primary }}>FLEET SLIDE</span>
      </div>

      {/* Image upload button (editable mode) */}
      {editable && (
        <div className="absolute top-3 right-4 z-30">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && addImage(e.target.files[0])} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 rounded bg-black/40 border border-white/10 text-white/60 hover:text-white hover:bg-black/60 text-[9px] transition-all"
            title="Tilføj billede"
          >
            <Image className="w-3 h-3" />
            {uploading ? "..." : "Billede"}
          </button>
        </div>
      )}

      {/* Draggable images */}
      {images.map(img => (
        editable ? (
          <DraggableImage key={img.id} img={img} onUpdate={c => updateImage(img.id, c)} onDelete={() => deleteImage(img.id)} containerRef={containerRef} />
        ) : (
          <div key={img.id} style={{ position: "absolute", left: `${img.x}%`, top: `${img.y}%`, width: `${img.w}%`, zIndex: 20 }}>
            <img src={img.url} alt="" className="w-full h-auto block rounded-lg" />
          </div>
        )
      ))}

      {/* Slide content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 pt-8 pb-6" style={{ fontSize: `${fontScale}em` }}>

        {slide.type === "title" && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-semibold tracking-widest uppercase"
              style={{ borderColor: t.primary + "60", color: t.primary, background: t.primary + "15" }}>
              <Sparkles className="w-3 h-3" />
              <ET value={slide.subtitle || "Fleet Intelligence"} field="subtitle" className="" />
            </div>
            <h1 className="text-5xl font-black text-white mb-5 leading-tight block"
              style={{ textShadow: `0 0 60px ${t.primary}80` }}>
              <ET value={slide.title || "Presentation Title"} field="title" className="text-white" style={{ textShadow: `0 0 60px ${t.primary}80` }} />
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              <ET value={slide.body || "AI-Powered Strategic Intelligence"} field="body" className="text-slate-300" multiline />
            </p>
            {(slide.author || editable) && (
              <p className="mt-8 text-sm text-slate-500">
                <ET value={slide.author || ""} field="author" className="text-slate-500" placeholder="Forfatter..." />
              </p>
            )}
          </div>
        )}

        {slide.type === "content" && (
          <div>
            <h2 className="text-3xl font-bold mb-5 block" style={{ color: t.primary }}>
              <ET value={slide.title} field="title" className="font-bold" style={{ color: t.primary }} />
            </h2>
            {(slide.body || editable) && (
              <p className="text-slate-400 text-base mb-4 leading-relaxed">
                <ET value={slide.body || ""} field="body" className="text-slate-400" multiline placeholder="Brødtekst..." />
              </p>
            )}
            <div className="space-y-2.5">
              {(slide.bullets || []).map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                    style={{ background: t.primary + "20", color: t.primary, border: `1px solid ${t.primary}40` }}>
                    {i + 1}
                  </div>
                  <p className="text-slate-200 text-lg leading-snug flex-1">
                    {editable ? (
                      <EditableText
                        value={b}
                        onChange={v => {
                          const nb = [...slide.bullets];
                          nb[i] = v;
                          onUpdate({ bullets: nb });
                        }}
                        className="text-slate-200"
                      />
                    ) : b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.type === "chart" && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white" style={{ color: t.primary }}>
                <ET value={slide.title} field="title" className="font-bold" style={{ color: t.primary }} />
              </h2>
              {slide.chartInsight && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: t.primary + "15", color: t.primary }}>
                  <TrendingUp className="w-3 h-3" />{slide.chartInsight}
                </div>
              )}
            </div>
            {slide.chartData && (
              <ResponsiveContainer width="100%" height={200}>
                {slide.chartType === "radar" ? (
                  <RadarChart data={slide.chartData}>
                    <PolarGrid stroke={t.primary + "30"} />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Radar dataKey="value" stroke={t.primary} fill={t.primary + "30"} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                  </RadarChart>
                ) : slide.chartType === "line" ? (
                  <LineChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke={t.primary} strokeWidth={3} dot={{ fill: t.primary, r: 4 }} />
                  </LineChart>
                ) : slide.chartType === "area" ? (
                  <AreaChart data={slide.chartData}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={t.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" stroke={t.primary} fill="url(#cg)" strokeWidth={2} />
                  </AreaChart>
                ) : slide.chartType === "pie" ? (
                  <PieChart>
                    <Pie data={slide.chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={30}
                      label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {slide.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                ) : (
                  <BarChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Bar dataKey="value" fill={t.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
            {(slide.body || editable) && (
              <p className="mt-2 text-slate-400 text-sm">
                <ET value={slide.body || ""} field="body" className="text-slate-400" placeholder="Beskrivelse..." />
              </p>
            )}
          </div>
        )}

        {slide.type === "split" && (
          <div className="grid grid-cols-2 gap-8 h-full items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 block" style={{ color: t.primary }}>
                <ET value={slide.title} field="title" className="font-bold" style={{ color: t.primary }} />
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                <ET value={slide.body || ""} field="body" className="text-slate-300" multiline />
              </p>
              {slide.bullets?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.primary }} />
                      {editable ? (
                        <EditableText value={b} onChange={v => { const nb = [...slide.bullets]; nb[i] = v; onUpdate({ bullets: nb }); }} className="text-slate-300 flex-1" />
                      ) : b}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl p-5 border space-y-2" style={{ background: t.primary + "08", borderColor: t.primary + "30" }}>
              {(slide.stats || []).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: t.primary + "20" }}>
                  <span className="text-slate-400 text-sm">
                    {editable ? <EditableText value={s.label} onChange={v => { const ns = [...slide.stats]; ns[i] = { ...ns[i], label: v }; onUpdate({ stats: ns }); }} className="text-slate-400" /> : s.label}
                  </span>
                  <div className="text-right">
                    <span className="font-black text-xl" style={{ color: t.primary }}>
                      {editable ? <EditableText value={s.value} onChange={v => { const ns = [...slide.stats]; ns[i] = { ...ns[i], value: v }; onUpdate({ stats: ns }); }} className="font-black text-xl" style={{ color: t.primary }} /> : s.value}
                    </span>
                    {s.delta && <span className={`ml-2 text-xs ${s.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.delta}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.type === "impact" && (
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="text-8xl font-black" style={{ color: t.primary, textShadow: `0 0 80px ${t.primary}, 0 0 40px ${t.primary}80` }}>
                <ET value={slide.metric || "94%"} field="metric" className="font-black" style={{ color: t.primary, textShadow: `0 0 80px ${t.primary}` }} />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 block">
              <ET value={slide.title} field="title" className="text-white font-bold" />
            </h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              <ET value={slide.body || ""} field="body" className="text-slate-300" multiline />
            </p>
            {slide.submetrics?.length > 0 && (
              <div className="flex justify-center gap-8 mt-6">
                {slide.submetrics.map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold" style={{ color: t.secondary }}>
                      {editable ? <EditableText value={m.value} onChange={v => { const sm = [...slide.submetrics]; sm[i] = { ...sm[i], value: v }; onUpdate({ submetrics: sm }); }} className="font-bold" style={{ color: t.secondary }} /> : m.value}
                    </div>
                    <div className="text-xs text-slate-500">
                      {editable ? <EditableText value={m.label} onChange={v => { const sm = [...slide.submetrics]; sm[i] = { ...sm[i], label: v }; onUpdate({ submetrics: sm }); }} className="text-slate-500" /> : m.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slide.type === "comparison" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-5" style={{ color: t.primary }}>
              <ET value={slide.title} field="title" className="font-bold" style={{ color: t.primary }} />
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(slide.columns || []).map((col, ci) => (
                <div key={ci} className="rounded-xl p-4 border" style={{ background: (ci === 0 ? t.primary : t.secondary) + "10", borderColor: (ci === 0 ? t.primary : t.secondary) + "30" }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: ci === 0 ? t.primary : t.secondary }}>
                    {editable ? <EditableText value={col.label} onChange={v => { const cols = [...slide.columns]; cols[ci] = { ...cols[ci], label: v }; onUpdate({ columns: cols }); }} className="font-bold" style={{ color: ci === 0 ? t.primary : t.secondary }} /> : col.label}
                  </h3>
                  <div className="space-y-2">
                    {(col.items || []).map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ci === 0 ? t.primary : t.secondary }} />
                        {editable ? (
                          <EditableText value={item} onChange={v => { const cols = [...slide.columns]; cols[ci] = { ...cols[ci], items: col.items.map((it, idx) => idx === ii ? v : it) }; onUpdate({ columns: cols }); }} className="text-slate-300 flex-1" />
                        ) : item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.type === "timeline" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-5" style={{ color: t.primary }}>
              <ET value={slide.title} field="title" className="font-bold" style={{ color: t.primary }} />
            </h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 opacity-30" style={{ background: t.primary }} />
              <div className="space-y-4">
                {(slide.events || []).map((ev, i) => (
                  <div key={i} className="flex gap-4 items-start pl-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2"
                      style={{ background: t.primary + "20", borderColor: t.primary, color: t.primary }}>
                      {editable ? <EditableText value={ev.period || String(i+1)} onChange={v => { const evs = [...slide.events]; evs[i] = { ...evs[i], period: v }; onUpdate({ events: evs }); }} className="font-bold text-xs" style={{ color: t.primary }} /> : (ev.period || i+1)}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="font-semibold text-white text-sm">
                        {editable ? <EditableText value={ev.title} onChange={v => { const evs = [...slide.events]; evs[i] = { ...evs[i], title: v }; onUpdate({ events: evs }); }} className="font-semibold text-white" /> : ev.title}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {editable ? <EditableText value={ev.description || ""} onChange={v => { const evs = [...slide.events]; evs[i] = { ...evs[i], description: v }; onUpdate({ events: evs }); }} className="text-slate-400" /> : ev.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {slide.type === "closing" && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: t.primary, background: t.primary + "20", boxShadow: `0 0 40px ${t.primary}40` }}>
              <CheckCircle className="w-10 h-10" style={{ color: t.primary }} />
            </div>
            <h2 className="text-5xl font-black text-white mb-5 block" style={{ textShadow: `0 0 40px ${t.primary}60` }}>
              <ET value={slide.title || "Thank You"} field="title" className="text-white font-black" />
            </h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              <ET value={slide.body || ""} field="body" className="text-slate-300" multiline />
            </p>
            {(slide.contact || editable) && (
              <p className="mt-6 text-sm font-mono" style={{ color: t.primary }}>
                <ET value={slide.contact || ""} field="contact" className="font-mono" style={{ color: t.primary }} placeholder="Kontakt info..." />
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notes indicator */}
      {slide.notes && (
        <div className="absolute bottom-2 left-4 flex items-center gap-1 opacity-30 z-10">
          <Mic className="w-3 h-3" style={{ color: t.primary }} />
          <span className="text-[8px]" style={{ color: t.primary }}>Notes</span>
        </div>
      )}

      {/* Slide number */}
      <div className="absolute bottom-3 right-5 text-xs font-mono opacity-30 z-10" style={{ color: t.primary }}>
        {slide.index != null ? String(slide.index + 1).padStart(2, "0") : ""}
      </div>

      {/* Edit hint */}
      {editable && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-white/20 pointer-events-none">
          Klik på tekst for at redigere
        </div>
      )}
    </div>
  );
}