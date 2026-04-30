import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Key, Zap, TrendingUp, CheckCircle2, AlertCircle, MessageSquare,
  Building2, Users, Brain, Search, ChevronRight, Terminal, Code2,
  Globe, Lock, Activity, Sparkles, BarChart3, Package, Truck, Route,
  Shield, Database, Cpu, ArrowRight, ExternalLink, BookOpen, Layers,
  RefreshCw, Clock, DollarSign, Network, FileCode, PlayCircle, Check,
  AlertTriangle, Info, ChevronDown, Gauge, Rocket, Star
} from "lucide-react";
import { toast } from "sonner";
import OrchestratorDocs from "@/components/api/OrchestratorDocs";

const CATEGORIES = [
  { id: "all", label: "All Endpoints", icon: Layers, color: "#06b6d4" },
  { id: "fleet", label: "Fleet & Vehicles", icon: Truck, color: "#8b5cf6" },
  { id: "routes", label: "Routes & Shipments", icon: Route, color: "#10b981" },
  { id: "analytics", label: "Analytics & KPIs", icon: BarChart3, color: "#f59e0b" },
  { id: "ai", label: "AI & Intelligence", icon: Brain, color: "#ec4899" },
  { id: "alerts", label: "Alerts & Monitoring", icon: AlertCircle, color: "#ef4444" },
  { id: "people", label: "People & Companies", icon: Users, color: "#06b6d4" },
];

const ENDPOINTS = [
  { id: "route-optimization", category: "fleet", name: "Route Optimization", method: "POST", endpoint: "/api/v1/calculate", tag: "CORE", tagColor: "#06b6d4", description: "Calculate optimal routes with multi-modal cost, time, fuel, and CO₂ analysis", params: { calculation_type: "ROUTE_OPTIMIZATION", params: { origin: "Copenhagen", destination: "Aarhus", vehicle_type: "truck", constraints: { fuel_price: 1.5, hourly_rate: 25 } } }, response: { distance_km: 284.5, duration_hours: 3.56, fuel_cost_eur: 342.6, total_cost_eur: 432.1, co2_kg: 34.14, efficiency_score: 78.5 }, latency: "~120ms", costPer100: 5 },
  { id: "track-vehicle", category: "fleet", name: "Track Vehicle", method: "POST", endpoint: "/api/v1/track/vehicle", tag: "REALTIME", tagColor: "#10b981", description: "Real-time vehicle location, speed, fuel and ETA with historical telemetry", params: { vehicle_id: "SHIP-001", include_history: true, history_hours: 24 }, response: { vehicle_id: "SHIP-001", latitude: 55.6761, longitude: 12.5683, status: "active", speed_kmh: 45, fuel_level: 87, eta: "2026-04-30T14:30:00Z", signal_strength: 98 }, latency: "~80ms", costPer100: 5 },
  { id: "batch-update-vehicles", category: "fleet", name: "Batch Update Vehicles", method: "PUT", endpoint: "/api/v1/vehicles/batch", tag: "WRITE", tagColor: "#f59e0b", description: "Atomically update multiple vehicles in a single transactional request", params: { updates: [{ vehicle_id: "TRUCK-001", status: "maintenance", fuel_level: 50 }, { vehicle_id: "TRUCK-002", status: "active", destination: "Aarhus" }] }, response: { updated_count: 2, success: true, failed: 0, transaction_id: "TXN-20260430" }, latency: "~200ms", costPer100: 5 },
  { id: "cost-analysis", category: "fleet", name: "TCO Cost Analysis", method: "POST", endpoint: "/api/v1/calculate", tag: "FINANCE", tagColor: "#f59e0b", description: "Total Cost of Ownership modeling with fuel, maintenance, insurance and depreciation", params: { calculation_type: "COST_ANALYSIS", params: { vehicle_type: "truck", annual_miles: 50000, age_years: 3 } }, response: { fuel_cost_eur: 60000, maintenance_cost_eur: 8500, insurance_cost_eur: 2000, depreciation_eur: 4000, total_annual_cost_eur: 74500, cost_per_km_eur: 0.93 }, latency: "~150ms", costPer100: 5 },
  { id: "maintenance-prediction", category: "fleet", name: "Predictive Maintenance", method: "POST", endpoint: "/api/v1/predict", tag: "AI", tagColor: "#ec4899", description: "Predict failure probability, days-to-failure, and maintenance costs using sensor fusion", params: { prediction_type: "failure", data: { vehicle_sensors: { vibration_level: 0.45, temperature: 95 }, vehicle_age_years: 5 } }, response: { fault_probability_percent: 65, days_until_failure: 187, next_maintenance_date: "2026-09-10", estimated_repair_cost_eur: 12500, critical_alert: false }, latency: "~300ms", costPer100: 5 },
  { id: "plan-route", category: "routes", name: "Plan Route", method: "POST", endpoint: "/api/v1/routes/plan", tag: "CORE", tagColor: "#06b6d4", description: "AI-optimized route planning with waypoints, CO₂ estimates and traffic avoidance", params: { origin: "Copenhagen", destination: "Stockholm", vehicle_type: "truck", waypoints: ["Malmö", "Helsingborg"] }, response: { route_id: "ROUTE-001", distance_km: 650, duration_hours: 8.5, co2_estimate: 78, toll_cost_eur: 42 }, latency: "~180ms", costPer100: 5 },
  { id: "create-shipment", category: "routes", name: "Create Shipment", method: "POST", endpoint: "/api/v1/shipments", tag: "WRITE", tagColor: "#f59e0b", description: "Create a tracked shipment with cold chain, hazmat and priority support", params: { tracking_number: "SHIP-AUTO", origin: "Copenhagen", destination: "Hamburg", cargo_type: "general", weight_kg: 5000, priority: "high" }, response: { tracking_number: "SHIP-20260430-001", status: "pending", eta: "2026-05-01T16:00:00Z" }, latency: "~200ms", costPer100: 5 },
  { id: "track-shipment", category: "routes", name: "Track Shipment", method: "GET", endpoint: "/api/v1/shipments/{tracking_number}", tag: "REALTIME", tagColor: "#10b981", description: "Live shipment tracking with GPS, temperature, humidity and ETA confidence", params: { tracking_number: "SHIP-20260430-001" }, response: { status: "in_transit", current_location: { lat: 55.6761, lng: 12.5683 }, eta_confidence: 92, temperature: 18 }, latency: "~70ms", costPer100: 5 },
  { id: "co2-emissions", category: "routes", name: "CO₂ Emissions", method: "POST", endpoint: "/api/v1/calculate", tag: "ESG", tagColor: "#22c55e", description: "Scope 1/2/3 carbon emissions with EU ETS compliance and offset cost calculation", params: { calculation_type: "CO2_EMISSIONS", params: { vehicle_type: "ship", distance_km: 1500, shipments: [{ weight_kg: 50000 }] } }, response: { base_emissions_kg: 30, weight_adjusted_emissions_kg: 37.5, carbon_offset_cost_eur: 1.88, sustainability_score: 87.5 }, latency: "~130ms", costPer100: 5 },
  { id: "fleet-analytics", category: "analytics", name: "Fleet Analytics", method: "GET", endpoint: "/api/v1/analytics/fleet", tag: "ANALYTICS", tagColor: "#f59e0b", description: "Comprehensive fleet performance dashboard — efficiency, costs, emissions, utilization", params: { period_days: 30, include_metrics: ["efficiency", "cost", "emissions"] }, response: { total_vehicles: 45, active_vehicles: 38, total_distance_km: 125000, avg_efficiency: 82, total_fuel_cost: 45000 }, latency: "~300ms", costPer100: 5 },
  { id: "calculate-kpis", category: "analytics", name: "Calculate KPIs", method: "POST", endpoint: "/api/v1/analytics/kpis", tag: "ANALYTICS", tagColor: "#f59e0b", description: "Compute custom logistics KPIs across delivery, cost, efficiency and sustainability axes", params: { metrics: ["on_time_delivery", "cost_per_km", "efficiency", "sustainability"], period_days: 30 }, response: { on_time_delivery: 94, cost_per_km: 1.23, efficiency_score: 82, sustainability_score: 78 }, latency: "~200ms", costPer100: 5 },
  { id: "company-benchmarking", category: "analytics", name: "Industry Benchmarking", method: "POST", endpoint: "/api/v1/analytics/benchmark", tag: "INTEL", tagColor: "#8b5cf6", description: "Benchmark fleet KPIs against industry peers — percentile rank, strengths & gaps", params: { organization_id: "ORG-001", industry: "maritime_logistics", metrics: ["efficiency", "cost_per_km", "on_time_delivery"] }, response: { your_score: 82, industry_average: 76, percentile_rank: 68, strengths: ["on_time_delivery"], improvement_areas: ["co2_per_ton"] }, latency: "~500ms", costPer100: 5 },
  { id: "fleet-ai-chat", category: "ai", name: "Fleet AI Chat", method: "POST", endpoint: "/api/v1/ai/chat", tag: "AI", tagColor: "#ec4899", description: "Natural language fleet intelligence — ask questions, get multi-turn insights and actionable recommendations", params: { message: "Which vehicles need maintenance soon?", conversation_history: [], context: { vehicles_count: 45, alerts_count: 3 } }, response: { reply: "3 vehicles flagged: TRUCK-004 (brake pads), SHIP-002 (oil overdue), DRONE-01 (battery).", role: "assistant", model: "mistral-large-latest", usage: { total_tokens: 274 } }, latency: "~1.2s", costPer100: 5 },
  { id: "harbor-intelligence", category: "ai", name: "Harbor Core Intelligence", method: "POST", endpoint: "/api/v1/harbor/intelligence", tag: "PREMIUM", tagColor: "#f59e0b", premium: true, description: "Advanced AI with live fleet enrichment. Mistral Large — strategic intelligence, anomaly detection, predictive insights.", params: { command: "Analyze fleet risk exposure and recommend immediate actions", mode: "analyze" }, response: { reply: "3 high-priority risks identified. Estimated exposure: €18,400.", model: "mistral-large-2411", billing: { cost_per_call_eur: 0.25 } }, latency: "~2.0s", costPer100: 25 },
  { id: "harbor-intellect", category: "ai", name: "H.A.R.B.O.R. Intellect", method: "POST", endpoint: "/functions/harborIntellectAPI", tag: "ULTRA", tagColor: "#a78bfa", premium: true, description: "Ultra-premium Claude Sonnet 4.6 — full logistics superintelligence, multi-turn reasoning, structured JSON output.", params: { message: "Risk profile this week and what to prioritize?", conversation_history: [], context: { organization: "Demo Logistics ApS" } }, response: { reply: "**24h:** TRUCK-004 brake inspection. **Strategic:** CPH→HAM 31% delays — reroute via Odense.", model: "claude_sonnet_4_6", billing: { cost_per_call_eur: 0.50 } }, latency: "~2.5s", costPer100: 50 },
  { id: "harbor-orchestrator", category: "ai", name: "H.A.R.B.O.R. Orchestrator", method: "POST", endpoint: "/functions/harborOrchestratorAPI", tag: "ULTRA", tagColor: "#a78bfa", premium: true, description: "50+ specialized AI agents — parallel, sequential, auto-routing and broadcast orchestration modes.", params: { message: "Analyze fleet health and optimize all active routes", mode: "auto", agents: ["harbor_fleet_analyst", "harbor_route_optimizer"] }, response: { mode: "auto", total_agents: 50, results: [{ agent: "harbor_fleet_analyst", output: "Fleet at 84% utilization..." }], total_latency_ms: 3200 }, latency: "~3-8s", costPer100: 50 },
  { id: "get-alerts", category: "alerts", name: "Get Alerts", method: "GET", endpoint: "/api/v1/alerts", tag: "MONITOR", tagColor: "#ef4444", description: "Retrieve active operational alerts with severity, vehicle context and AI recommendations", params: { status: "unresolved", category: "all", limit: 50 }, response: { alerts: [{ id: "ALERT-001", title: "Fuel Low", type: "warning", vehicle_id: "TRUCK-001" }], total: 5 }, latency: "~90ms", costPer100: 5 },
  { id: "create-alert", category: "alerts", name: "Create Alert", method: "POST", endpoint: "/api/v1/alerts", tag: "WRITE", tagColor: "#f59e0b", description: "Create operational alerts with severity levels, vehicle linking and auto-notification routing", params: { title: "Emergency Maintenance Required", message: "Vehicle requires immediate attention", type: "critical", vehicle_id: "TRUCK-001" }, response: { alert_id: "ALERT-NEW-001", status: "open", notified: 3 }, latency: "~100ms", costPer100: 5 },
  { id: "company-analytics", category: "people", name: "Company Analytics", method: "POST", endpoint: "/api/v1/analytics/company", tag: "INTEL", tagColor: "#8b5cf6", description: "Deep company analysis — fleet utilization, revenue trends, ESG scores and risk indicators", params: { company_name: "Maersk", include: ["financials", "fleet_metrics", "sustainability"] }, response: { company: "Maersk", fleet_utilization_percent: 87, revenue_trend_percent: 12.4, sustainability_score: 74, risk_score: "low" }, latency: "~800ms", costPer100: 5 },
  { id: "people-search", category: "people", name: "People Search", method: "POST", endpoint: "/api/v1/people/search", tag: "INTEL", tagColor: "#8b5cf6", description: "Search logistics professionals, drivers and operators by role, location and certifications", params: { query: "senior logistics manager", filters: { location: "Copenhagen", experience_years_min: 5 }, limit: 10 }, response: { total: 3, results: [{ id: "USR-001", full_name: "Anders Nielsen", role: "Logistics Manager", certifications: ["ADR"] }] }, latency: "~200ms", costPer100: 5 },
  { id: "export-data", category: "analytics", name: "Export Data", method: "POST", endpoint: "/api/v1/export", tag: "CORE", tagColor: "#06b6d4", description: "Export fleet data in CSV, JSON or XLSX with date range and entity filtering", params: { format: "csv", data_type: "shipments", period_days: 30 }, response: { file_url: "https://api.nexusvectis.com/files/export-123.csv", format: "csv", records: 850 }, latency: "~500ms", costPer100: 5 },
];

const METHOD_COLORS = {
  GET: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.5)", text: "#10b981" },
  POST: { bg: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.5)", text: "#06b6d4" },
  PUT: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.5)", text: "#f59e0b" },
  DELETE: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)", text: "#ef4444" },
};

const RATE_LIMITS = [
  { tier: "Free", color: "#64748b", rps: 10, monthly: "10,000", price: "€0" },
  { tier: "Growth", color: "#06b6d4", rps: 100, monthly: "500,000", price: "€99/mo" },
  { tier: "Pro", color: "#8b5cf6", rps: 1000, monthly: "5M", price: "€299/mo" },
  { tier: "Enterprise", color: "#f59e0b", rps: "∞", monthly: "Unlimited", price: "Custom" },
];

const ERROR_CODES = [
  { code: 200, label: "OK", color: "#10b981", desc: "Request succeeded" },
  { code: 400, label: "Bad Request", color: "#f59e0b", desc: "Invalid parameters or missing required fields" },
  { code: 401, label: "Unauthorized", color: "#ef4444", desc: "Missing or invalid X-API-Key header" },
  { code: 403, label: "Forbidden", color: "#ef4444", desc: "Insufficient permissions for this endpoint" },
  { code: 429, label: "Rate Limited", color: "#f59e0b", desc: "Exceeded your tier's requests per second limit" },
  { code: 500, label: "Server Error", color: "#ef4444", desc: "Internal error — support notified automatically" },
];

function syntaxHL(json) {
  return json
    .replace(/("[\w_-]+")(\s*:)/g, '<span style="color:#06b6d4">$1</span>$2')
    .replace(/:\s*(".*?")/g, ': <span style="color:#10b981">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#f59e0b">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span style="color:#a78bfa">$1</span>');
}

function generateCode(ep, lang) {
  const url = `https://api.nexusvectis.com${ep.endpoint}`;
  const body = JSON.stringify(ep.params, null, 2);
  if (lang === "curl") return `curl -X ${ep.method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: sk_live_YOUR_API_KEY" \\\n  -d '${body}'`;
  if (lang === "python") return `import requests\n\nurl = "${url}"\nheaders = {\n    "Content-Type": "application/json",\n    "X-API-Key": "sk_live_YOUR_API_KEY"\n}\npayload = ${body}\n\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)\nprint(response.json())`;
  if (lang === "javascript") return `const response = await fetch("${url}", {\n  method: "${ep.method}",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "sk_live_YOUR_API_KEY"\n  },\n  body: JSON.stringify(${body})\n});\nconst data = await response.json();\nconsole.log(data);`;
  if (lang === "typescript") return `const response = await fetch("${url}", {\n  method: "${ep.method}",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": process.env.NEXUSVECTIS_API_KEY!,\n  },\n  body: JSON.stringify(${body}),\n});\nconst data = await response.json();\nconsole.log(data);`;
  if (lang === "go") return `req, _ := http.NewRequest("${ep.method}", "${url}", bytes.NewBuffer(payload))\nreq.Header.Set("Content-Type", "application/json")\nreq.Header.Set("X-API-Key", "sk_live_YOUR_API_KEY")\nclient := &http.Client{}\nresp, _ := client.Do(req)`;
  return "";
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all"
      style={{ background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#10b981" : "#64748b", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}` }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MethodBadge({ method }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.POST;
  return <span className="px-2 py-0.5 rounded text-[11px] font-black font-mono" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>{method}</span>;
}

function TagBadge({ label, color }) {
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono tracking-widest" style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>{label}</span>;
}

function JsonBlock({ data, label, maxH = 280 }) {
  const str = JSON.stringify(data, null, 2);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: "#64748b" }}>{label}</span>
        <CopyButton text={str} />
      </div>
      <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <pre className="p-4 text-[11px] font-mono overflow-auto" style={{ maxHeight: maxH, color: "#94a3b8", lineHeight: 1.6 }}>
          <code dangerouslySetInnerHTML={{ __html: syntaxHL(str) }} />
        </pre>
      </div>
    </div>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-[11px] font-mono overflow-auto text-slate-300" style={{ maxHeight: 280, lineHeight: 1.7 }}>{code}</pre>
    </div>
  );
}

export default function APIDocumentation() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("harbor-orchestrator");
  const [searchQuery, setSearchQuery] = useState("");
  const [codeLang, setCodeLang] = useState("curl");
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeSection, setActiveSection] = useState("endpoints");

  const filtered = ENDPOINTS.filter(ep => {
    const matchCat = activeCategory === "all" || ep.category === activeCategory;
    const matchSearch = !searchQuery || ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || ep.description.toLowerCase().includes(searchQuery.toLowerCase()) || ep.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const selected = ENDPOINTS.find(e => e.id === selectedId);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020818 0%, #0a0f1e 50%, #020818 100%)", fontFamily: "monospace" }}>

      {/* Top nav */}
      <div className="border-b sticky top-0 z-20" style={{ borderColor: "rgba(6,182,212,0.15)", background: "rgba(2,8,24,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.3)" }}>
                <Terminal className="w-4 h-4" style={{ color: "#06b6d4" }} />
              </div>
              <div>
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#06b6d4" }}>NexusVectis</p>
                <p className="text-[9px] tracking-widest" style={{ color: "#475569" }}>API Reference v2.0</p>
              </div>
            </div>
            <div className="hidden md:flex gap-1">
              {["endpoints", "orchestrator", "sdks", "errors"].map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all"
                  style={{ background: activeSection === s ? "rgba(6,182,212,0.15)" : "transparent", color: activeSection === s ? "#06b6d4" : "#475569", border: activeSection === s ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "#10b981" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              OPERATIONAL
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>● LIVE</span>
            <span className="text-[11px] font-mono" style={{ color: "#475569" }}>50+ endpoints · 5 AI models · &lt;100ms p50</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3" style={{ background: "linear-gradient(135deg, #fff 0%, #06b6d4 50%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Fleet Intelligence API
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: "#64748b" }}>
            The world's most advanced logistics AI infrastructure. From real-time telemetry to multi-agent orchestration with 50+ specialized workers — all behind a single REST API.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: Zap, label: "50+ Endpoints", color: "#06b6d4" },
              { icon: Brain, label: "5 AI Models", color: "#8b5cf6" },
              { icon: Activity, label: "99.9% SLA", color: "#10b981" },
              { icon: Globe, label: "Global CDN", color: "#f59e0b" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-bold text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Banner */}
        <div className="mb-8 p-5 rounded-2xl" style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.15)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>Base URL</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-white">https://api.nexusvectis.com</code>
                <CopyButton text="https://api.nexusvectis.com" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>Authentication</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono" style={{ color: "#06b6d4" }}>X-API-Key: sk_live_••••••••</code>
                <button onClick={() => setShowApiKey(p => !p)} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors">{showApiKey ? "hide" : "reveal"}</button>
              </div>
              {showApiKey && (
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-xs font-mono text-green-400">sk_live_1234567890abcdefghijk</code>
                  <CopyButton text="sk_live_1234567890abcdefghijk" />
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>Content Type</p>
              <code className="text-sm font-mono" style={{ color: "#8b5cf6" }}>application/json</code>
            </div>
          </div>
        </div>

        {activeSection === "endpoints" && (
          <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Left sidebar */}
            <div className="flex flex-col" style={{ background: "rgba(255,255,255,0.015)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Search */}
              <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#475569" }} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search endpoints..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0" }} />
                </div>
              </div>

              {/* Category tabs — vertical */}
              <div className="p-2 border-b space-y-0.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const count = ENDPOINTS.filter(e => cat.id === "all" || e.category === cat.id).length;
                  return (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all group"
                      style={{ background: activeCategory === cat.id ? `${cat.color}15` : "transparent", color: activeCategory === cat.id ? cat.color : "#475569" }}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-mono tracking-wide uppercase text-[10px]">{cat.label}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: activeCategory === cat.id ? `${cat.color}20` : "rgba(255,255,255,0.05)", color: activeCategory === cat.id ? cat.color : "#334155" }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Endpoint list */}
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {filtered.map(ep => (
                  <motion.button key={ep.id} onClick={() => setSelectedId(ep.id)} whileHover={{ x: 1 }}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-all group"
                    style={{ background: selectedId === ep.id ? `${ep.tagColor}12` : "transparent", borderLeft: selectedId === ep.id ? `2px solid ${ep.tagColor}` : "2px solid transparent" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <MethodBadge method={ep.method} />
                      <TagBadge label={ep.tag} color={ep.tagColor} />
                    </div>
                    <p className="text-[12px] font-bold text-white leading-tight">{ep.name}</p>
                    <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: "#334155" }}>{ep.endpoint}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Right detail panel */}
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-auto" style={{ maxHeight: "80vh" }}>

                {/* Header */}
                <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MethodBadge method={selected.method} />
                        <TagBadge label={selected.tag} color={selected.tagColor} />
                        {selected.premium && <TagBadge label="PREMIUM" color="#f59e0b" />}
                      </div>
                      <h2 className="text-2xl font-black text-white mb-1">{selected.name}</h2>
                      <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#64748b" }}>{selected.description}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      {[
                        { label: "Latency", value: selected.latency, color: "#10b981" },
                        { label: "Per call", value: `€${(selected.costPer100 / 100).toFixed(2)}`, color: "#f59e0b" },
                      ].map(stat => (
                        <div key={stat.label} className="text-center px-4 py-3 rounded-xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>{stat.label}</p>
                          <p className="text-base font-black" style={{ color: stat.color }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Endpoint URL bar */}
                  <div className="flex items-center gap-2 mt-4 p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <MethodBadge method={selected.method} />
                    <code className="text-sm font-mono text-white flex-1">{selected.endpoint}</code>
                    <CopyButton text={`https://api.nexusvectis.com${selected.endpoint}`} />
                  </div>

                  {selected.premium && (
                    <div className="flex items-center gap-3 p-3 rounded-xl mt-3" style={{ background: `${selected.tagColor}0a`, border: `1px solid ${selected.tagColor}25` }}>
                      <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selected.tagColor }} />
                      <p className="text-xs" style={{ color: `${selected.tagColor}cc` }}>
                        Billed at <strong style={{ color: selected.tagColor }}>€{selected.response?.billing?.cost_per_call_eur ?? (selected.costPer100 / 100).toFixed(2)}/call</strong>.
                        {selected.id === "harbor-orchestrator" && " Orchestrates 50+ AI workers in parallel, sequential, or auto-routing modes."}
                        {selected.id === "harbor-intellect" && " Powered by Claude Sonnet 4.6 — multi-turn reasoning, structured JSON output."}
                        {selected.id === "harbor-intelligence" && " Uses mistral-large-2411 with live fleet data enrichment."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Body: code + payloads */}
                <div className="p-6 space-y-5">

                  {/* Code examples */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-white uppercase tracking-widest">Code Example</p>
                      <div className="flex gap-1">
                        {["curl", "python", "javascript", "typescript", "go"].map(l => (
                          <button key={l} onClick={() => setCodeLang(l)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                            style={{ background: codeLang === l ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)", color: codeLang === l ? "#06b6d4" : "#475569", border: codeLang === l ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CodeBlock code={generateCode(selected, codeLang)} lang={codeLang} />
                  </div>

                  {/* Request + Response side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <JsonBlock data={selected.params} label="Request Body" />
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <JsonBlock data={selected.response} label="Response · 200 OK" />
                    </div>
                  </div>

                  {/* Meta stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Latency p50", value: selected.latency, icon: Gauge, color: "#10b981" },
                      { label: "Cost / 100", value: `€${selected.costPer100}`, icon: DollarSign, color: "#f59e0b" },
                      { label: "Auth", value: "X-API-Key", icon: Lock, color: "#06b6d4" },
                      { label: "Version", value: "v2.0", icon: RefreshCw, color: "#8b5cf6" },
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#475569" }}>{s.label}</p>
                            <p className="text-xs font-black text-white">{s.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeSection === "orchestrator" && (
          <OrchestratorDocs />
        )}

        {activeSection === "sdks" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white">Official SDKs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { lang: "JavaScript / TypeScript", icon: "⚡", pkg: "npm install @nexusvectis/sdk", color: "#f59e0b", desc: "Full TypeScript types, automatic retry, streaming support" },
                { lang: "Python", icon: "🐍", pkg: "pip install nexusvectis", color: "#10b981", desc: "Sync/async client, pandas integration, Jupyter helpers" },
                { lang: "Go", icon: "🔵", pkg: "go get github.com/nexusvectis/go-sdk", color: "#06b6d4", desc: "High-performance client with goroutine-safe design" },
                { lang: "PHP", icon: "🐘", pkg: "composer require nexusvectis/sdk", color: "#8b5cf6", desc: "Laravel/Symfony integration, PSR-18 compliant" },
                { lang: "Ruby", icon: "💎", pkg: "gem install nexusvectis", color: "#ec4899", desc: "Rails plugin, ActiveJob integration for async calls" },
                { lang: "REST", icon: "🌐", pkg: "No install needed", color: "#a78bfa", desc: "Use any HTTP client with JSON and your API key" },
              ].map(sdk => (
                <div key={sdk.lang} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-2xl mb-3">{sdk.icon}</div>
                  <h3 className="text-sm font-black text-white mb-1">{sdk.lang}</h3>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{sdk.desc}</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <code className="text-xs font-mono flex-1" style={{ color: sdk.color }}>{sdk.pkg}</code>
                    <CopyButton text={sdk.pkg} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {activeSection === "errors" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white">Error Reference</h2>
            <div className="space-y-3">
              {ERROR_CODES.map(e => (
                <div key={e.code} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-sm font-black font-mono w-12 flex-shrink-0" style={{ color: e.color }}>{e.code}</span>
                  <span className="text-xs font-bold text-white w-28 flex-shrink-0">{e.label}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{e.desc}</span>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-black text-white mb-3">Error Response Format</h3>
              <JsonBlock data={{ error: "validation_error", message: "Missing required field: origin", code: 400, request_id: "req_01HVXYZABC123", timestamp: "2026-04-30T10:00:00Z" }} label="Error Response" />
            </div>
            <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-black text-white mb-3">Rate Limit Headers</h3>
              <div className="space-y-2">
                {[
                  ["X-RateLimit-Limit", "Maximum requests per second for your tier"],
                  ["X-RateLimit-Remaining", "Remaining requests in current window"],
                  ["X-RateLimit-Reset", "Unix timestamp when the limit resets"],
                  ["Retry-After", "Seconds to wait before retrying (on 429)"],
                ].map(([h, d]) => (
                  <div key={h} className="flex items-center gap-4 p-2.5 rounded-lg" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <code className="text-xs font-mono flex-shrink-0" style={{ color: "#06b6d4" }}>{h}</code>
                    <span className="text-xs" style={{ color: "#64748b" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-16 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-[11px] font-mono" style={{ color: "#334155" }}>NexusVectis API v2.0 · Built on H.A.R.B.O.R. Infrastructure</span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "#10b981" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />OPERATIONAL
          </span>
        </div>
      </div>
    </div>
  );
}