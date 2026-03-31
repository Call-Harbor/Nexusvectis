import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Scale, Shield, Zap, CheckCircle2, AlertTriangle, XCircle, Brain, Truck, Globe, Plane, Satellite, Leaf, ArrowRight, BookOpen, RefreshCw } from "lucide-react";

const DOMAINS = [
  { icon: Truck, label: "Road & Logistics", rules: ["EU 561/2006 driving hours", "Cabotage limits", "Max axle weight", "ICS2 customs data"], color: "cyan" },
  { icon: Globe, label: "Transit & Bus", rules: ["Driver working time (DK)", "Night shift limits", "School bus safety", "Break requirements"], color: "emerald" },
  { icon: Satellite, label: "Port & Maritime", rules: ["ISPS security levels", "MARPOL SOx limits", "DG cargo segregation", "Port dwell windows"], color: "blue" },
  { icon: Plane, label: "Airport & Ground", rules: ["A-CDM TOBT accuracy", "Min. ground handling time", "Night noise curfew", "ICS2 pre-loading"], color: "violet" },
  { icon: Leaf, label: "CO₂ & ESG", rules: ["Fit for 55 targets", "EU ETS port reporting", "CSRD Scope 3", "CBAM carbon levy"], color: "green" },
];

const MOCK_OVERLAY = [
  { label: "Klaus Møller — Route DK-41", status: "violation", detail: "10h 45min continuous driving · Art. 4(c)" },
  { label: "MSC GAIA — Berth 7", status: "compliant", detail: "SOx 0.08% · MARPOL compliant" },
  { label: "SK903 Turnaround", status: "warning", detail: "19 min ground handling · EASA min. 25 min" },
  { label: "AF8812 CDG→CPH", status: "violation", detail: "ICS2 declaration missing 3 fields" },
  { label: "Bus Route 47 — Amina Osei", status: "warning", detail: "Night avg. 8.4h · limit 8.0h" },
];

const STATUS = {
  compliant: { color: "bg-emerald-500", ring: "ring-emerald-500/30", text: "text-emerald-400", label: "✓ Compliant" },
  warning: { color: "bg-amber-400 animate-pulse", ring: "ring-amber-400/30", text: "text-amber-400", label: "⚠ Warning" },
  violation: { color: "bg-red-500 animate-pulse", ring: "ring-red-500/30", text: "text-red-400", label: "✗ Violation" },
};

export default function RegulatoryIntellectModule() {
  return (
    <section className="relative py-24 sm:py-36 px-4 sm:px-6 z-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 mb-6">
            <Scale className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-300 text-sm font-semibold">New · Regulatory Intellect Layer</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
            Operations <em className="not-italic text-slate-400">&</em> Compliance
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              In One Neural Layer
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-2">
            NexusVectis doesn't just optimize — it continuously verifies that every plan, route, schedule, and cargo move is <strong className="text-white">legally compliant</strong> across all EU and local regulations.
            <br className="hidden md:block" />
            <span className="text-violet-300">One rule brain. Every module. Real-time.</span>
          </p>
        </motion.div>

        {/* Three questions */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {[
            { icon: CheckCircle2, q: "Is this plan legal?", color: "emerald", desc: "Every route, shift, gate assignment and cargo move is checked against a live regulatory graph before execution." },
            { icon: BookOpen, q: "Which rule is violated?", color: "amber", desc: "Pinpoint the exact article, directive, or local regulation — with human-readable AI explanations, not just error codes." },
            { icon: RefreshCw, q: "How do we fix it?", color: "violet", desc: "AI generates alternative plans that meet both business goals and compliance requirements — automatically or with one click." },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`p-7 rounded-2xl bg-${item.color}-500/5 border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-all`}
              >
                <Icon className={`w-8 h-8 text-${item.color}-400 mb-4`} />
                <h3 className="text-white font-bold text-lg mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Live overlay mock */}
        <div className="grid lg:grid-cols-2 gap-10 mb-20 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">Live Compliance Overlay</h3>
            <p className="text-slate-400 mb-6 text-sm">Every entity across all modules — drivers, vessels, flights, containers — gets a real-time compliance status you can act on instantly.</p>
            <div className="space-y-3">
              {MOCK_OVERLAY.map((item, i) => {
                const cfg = STATUS[item.status];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all ring-1 ${cfg.ring}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.label}</p>
                      <p className="text-slate-500 text-xs truncate">{item.detail}</p>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${cfg.text}`}>{cfg.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Rule packs */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">Regulatory Graph — 5 Domains</h3>
            <p className="text-slate-400 mb-6 text-sm">Rules modelled as structured constraints — the same way NexusVectis models vehicles, routes, and terminals.</p>
            <div className="space-y-3">
              {DOMAINS.map((domain, i) => {
                const Icon = domain.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl bg-${domain.color}-500/5 border border-${domain.color}-500/20 hover:border-${domain.color}-500/35 transition-all`}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <Icon className={`w-4 h-4 text-${domain.color}-400`} />
                      <span className={`text-${domain.color}-300 font-semibold text-sm`}>{domain.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {domain.rules.map((rule, j) => (
                        <span key={j} className={`text-[10px] bg-${domain.color}-500/10 text-${domain.color}-300/70 border border-${domain.color}-500/15 px-2 py-0.5 rounded-full`}>{rule}</span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Auto-repair CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-slate-900/80 to-cyan-950/40 p-10 md:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Auto-Repair & Negotiation</h3>
                  <p className="text-violet-300 text-sm">Regulatory Intellect Layer</p>
                </div>
              </div>
              <p className="text-slate-300 text-base leading-relaxed mb-4">
                Tell the system: <em className="text-white">"Make this plan compliant with minimal changes"</em> or <em className="text-white">"Prioritise CO₂ goals while staying within the law."</em>
              </p>
              <p className="text-slate-400 text-sm">Regulatory Intellect generates alternative plans, lets you compare cost and KPI impact, and can auto-execute — across all modules simultaneously.</p>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-64">
              {[
                { icon: Zap, text: "Insert break — Hamburg depot", color: "cyan" },
                { icon: RefreshCw, text: "Swap driver — Lars Bonde", color: "emerald" },
                { icon: Shield, text: "Delay pushback 6 min", color: "violet" },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-${action.color}-500/10 border border-${action.color}-500/25`}>
                    <Icon className={`w-4 h-4 text-${action.color}-400 flex-shrink-0`} />
                    <span className="text-white text-sm">{action.text}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                );
              })}
              <p className="text-slate-600 text-xs text-center">AI-generated repair actions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/RegulatoryIntelligence"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Scale className="w-5 h-5" />
            Open Regulatory Cockpit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}