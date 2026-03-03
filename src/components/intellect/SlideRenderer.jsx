import React from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const HOLOGRAM_THEMES = [
  { id: "nexus", label: "Nexus Blue", primary: "#06b6d4", secondary: "#8b5cf6", accent: "#0e7490", bg: "from-slate-950 via-cyan-950/30 to-slate-950" },
  { id: "aurora", label: "Aurora", primary: "#10b981", secondary: "#06b6d4", accent: "#065f46", bg: "from-slate-950 via-emerald-950/30 to-slate-950" },
];

const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function SlideRenderer({ slide, theme = "nexus" }) {
  const t = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];

  // Apply animations
  const animationVariants = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slide: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    zoom: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
    rotate: { initial: { opacity: 0, rotate: -10 }, animate: { opacity: 1, rotate: 0 } },
    bounce: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
  };

  const baseAnimation = animationVariants[slide?.animations?.[0]?.type] || animationVariants.fade;
  const duration = slide?.animations?.[0]?.duration || 0.5;

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${t.bg} relative overflow-hidden rounded-xl border border-opacity-20 flex items-center justify-center p-8`}
      style={{ borderColor: t.primary + "30" }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(${t.primary}33 1px, transparent 1px), linear-gradient(90deg, ${t.primary}33 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: t.primary }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: t.secondary }} />

      <motion.div
        {...baseAnimation}
        transition={{ duration }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        {slide?.type === "title" && (
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-4" style={{ textShadow: `0 0 60px ${t.primary}80` }}>
              {slide.title || "Title"}
            </h1>
            <p className="text-xl text-slate-300">{slide.body || "Description"}</p>
          </div>
        )}

        {slide?.type === "content" && (
          <div className="text-left max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4" style={{ color: t.primary }}>
              {slide.title}
            </h2>
            <div className="space-y-3">
              {(slide.bullets || []).map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ background: t.primary }} />
                  <p className="text-slate-200 text-lg">{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide?.type === "chart" && slide.chartData && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ color: t.primary }}>
              {slide.title}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              {slide.chartType === "line" ? (
                <LineChart data={slide.chartData}>
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40` }} />
                  <Line type="monotone" dataKey="value" stroke={t.primary} strokeWidth={3} />
                </LineChart>
              ) : slide.chartType === "area" ? (
                <AreaChart data={slide.chartData}>
                  <defs>
                    <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={t.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40` }} />
                  <Area type="monotone" dataKey="value" stroke={t.primary} fill="url(#colorGrad)" />
                </AreaChart>
              ) : slide.chartType === "pie" ? (
                <PieChart>
                  <Pie data={slide.chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                    {slide.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40` }} />
                </PieChart>
              ) : (
                <BarChart data={slide.chartData}>
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40` }} />
                  <Bar dataKey="value" fill={t.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {slide?.type === "impact" && (
          <div className="text-center">
            <div className="text-8xl font-black mb-4" style={{ color: t.primary, textShadow: `0 0 80px ${t.primary}` }}>
              {slide.metric || "94%"}
            </div>
            <h2 className="text-4xl font-bold text-white">{slide.title}</h2>
            <p className="text-xl text-slate-300 mt-4">{slide.body}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}