import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ResiliencePanel from "@/components/energy/ResiliencePanel";
import OutagePlanner from "@/components/energy/OutagePlanner";
import EnergyLayout from "@/components/energy/EnergyLayout";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, AlertTriangle, CheckCircle2, Activity, Wind, Sun, Battery,
  Cpu, TrendingUp, TrendingDown, RefreshCw, Sparkles, Brain,
  Anchor, Plane, Bus, Leaf, Shield, BarChart3, GitBranch, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import moment from "moment";

const MOCK_EVENTS = [
  { id: "e1", event_type: "overload", asset_name: "132kV Line Rødby-CPH", severity: "critical", description: "Load at 93% — critical threshold is 90%. Weather forecast shows additional 8% increase in 40 min.", ai_recommendation: "Activate battery storage Kastrup (+22 MW) and send flex-request to Shore Power Pier 7 (−5 MW for 20 min). Expected reduction: 7%.", status: "open", detected_at: new Date(Date.now() - 8e5).toISOString(), linked_module: "port" },
  { id: "e2", event_type: "flex_request", asset_name: "Bus Depot Charging Park Valby", severity: "info", description: "Grid has surplus from wind farm (87% capacity). Shift charging window to transit depot now.", ai_recommendation: "Move 6 buses to fast-charging for the next 45 min. Save 12% on off-peak tariff. Coordinated with TransitControl charging schedule.", status: "open", detected_at: new Date(Date.now() - 2e6).toISOString(), linked_module: "transit" },
  { id: "e3", event_type: "anomaly", asset_name: "Substation Nordhavn", severity: "warning", description: "Temperature rise of 4°C above norm in transformer core. Indicates potential insulation degradation.", ai_recommendation: "Schedule preventive inspection within 72h. Reduce load to 75% if temperature rises further.", status: "open", detected_at: new Date(Date.now() - 3e6).toISOString(), linked_module: "port" },
  { id: "e4", event_type: "dispatch_action", asset_name: "Gas Power Plant Avedøre", severity: "info", description: "AI Dispatch: Gas held on standby as wind+solar covers 239 MW. CO₂ saving: 94 tons/hour vs. full gas operation.", ai_recommendation: "Maintain standby. Activate automatically if grid load exceeds 95% on the 132kV line.", status: "acknowledged", detected_at: new Date(Date.now() - 5e6).toISOString(), linked_module: "none" },
];

const LOAD_FORECAST = [
  { time: "Now", load: 712, wind: 187, solar: 52, gas: 180, battery: 38 },
  { time: "+15m", load: 735, wind: 191, solar: 50, gas: 180, battery: 45 },
  { time: "+30m", load: 768, wind: 195, solar: 48, gas: 200, battery: 55 },
  { time: "+1h", load: 801, wind: 189, solar: 44, gas: 240, battery: 58 },
  { time: "+2h", load: 820, wind: 182, solar: 38, gas: 280, battery: 60 },
  { time: "+4h", load: 795, wind: 201, solar: 20, gas: 260, battery: 50 },
  { time: "+8h", load: 730, wind: 210, solar: 0, gas: 180, battery: 35 },
];

const CO2_DATA = [
  { day: "Mon", co2: 142 }, { day: "Tue", co2: 118 }, { day: "Wed", co2: 134 },
  { day: "Thu", co2: 97 }, { day: "Fri", co2: 88 }, { day: "Sat", co2: 76 }, { day: "Sun", co2: 71 },
];

const ASSET_TYPE_ICON = {
  wind: Wind, solar: Sun, battery: Battery, generator: Flame,
  line: Activity, transformer: Cpu, substation: Zap, load_node: TrendingUp,
};

const ASSET_TYPE_COLOR = {
  wind: "cyan", solar: "amber", battery: "emerald", generator: "orange",
  line: "violet", transformer: "blue", substation: "indigo", load_node: "rose",
};

const MODULE_ICON = { port: Anchor, airport: Plane, transit: Bus, none: null };

function LoadBar({ percent, className = "" }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 75 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className={`w-full bg-slate-800 rounded-full h-1.5 ${className}`}>
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function AssetCard({ asset }) {
  const Icon = ASSET_TYPE_ICON[asset.asset_type] || Zap;
  const color = ASSET_TYPE_COLOR[asset.asset_type] || "cyan";
  const ModIcon = MODULE_ICON[asset.linked_module];
  const overload = asset.load_percent >= 90;
  const warn = asset.load_percent >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3.5 rounded-xl border transition-all ${
        overload ? "bg-red-500/5 border-red-500/30" :
        warn ? "bg-amber-500/5 border-amber-500/20" :
        asset.status === "maintenance" ? "bg-slate-800/40 border-slate-700/40" :
        "bg-slate-900/50 border-slate-800/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-${color}-500/15 border border-${color}-500/30`}>
          <Icon className={`w-4 h-4 text-${color}-400`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">{asset.name}</span>
            {ModIcon && <ModIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <LoadBar percent={asset.load_percent} className="flex-1" />
            <span className={`text-xs font-bold flex-shrink-0 ${overload ? "text-red-400" : warn ? "text-amber-400" : "text-slate-400"}`}>
              {asset.load_percent}%
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-white text-sm font-bold">{asset.current_load_mw}<span className="text-slate-500 text-xs font-normal"> MW</span></div>
          <div className={`text-xs mt-0.5 ${asset.status === "online" ? "text-emerald-400" : asset.status === "fault" ? "text-red-400" : asset.status === "maintenance" ? "text-amber-400" : "text-slate-400"}`}>
            {asset.status}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EventCard({ event, onAck }) {
  const colors = { critical: "red", warning: "amber", info: "cyan" };
  const c = colors[event.severity];
  const ModIcon = MODULE_ICON[event.linked_module];
  const typeLabels = {
    overload: "OVERLOAD", fault: "FAULT", flex_request: "FLEX REQUEST",
    maintenance_window: "MAINTENANCE", anomaly: "ANOMALY", dispatch_action: "AI DISPATCH", islanding: "ISLANDING"
  };

  return (
    <div className={`p-4 rounded-xl border mb-3 ${
      event.severity === "critical" ? "bg-red-500/5 border-red-500/30" :
      event.severity === "warning" ? "bg-amber-500/5 border-amber-500/20" :
      "bg-cyan-500/5 border-cyan-500/15"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold text-${c}-400 bg-${c}-500/15 px-2 py-0.5 rounded`}>
            {typeLabels[event.event_type]}
          </span>
          {ModIcon && <ModIcon className="w-3.5 h-3.5 text-slate-500" />}
          <span className="text-white text-sm font-semibold">{event.asset_name}</span>
        </div>
        <span className="text-slate-600 text-[10px] flex-shrink-0">{moment(event.detected_at).fromNow()}</span>
      </div>
      <p className="text-slate-300 text-xs leading-relaxed mb-2">{event.description}</p>
      {event.ai_recommendation && (
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-[10px] font-semibold">AI RECOMMENDATION</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">{event.ai_recommendation}</p>
        </div>
      )}
      {event.status === "open" && (
        <button onClick={() => onAck(event.id)} className="mt-2.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1 transition-all">
          Acknowledge
        </button>
      )}
    </div>
  );
}

export default function EnergyOpsCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [ackedEvents, setAckedEvents] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  const { data: dbAssets = [] } = useQuery({
    queryKey: ["grid-assets"],
    queryFn: () => base44.entities.GridAsset.list(),
    refetchInterval: 10000,
  });

  const { data: dbEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ["grid-events"],
    queryFn: () => base44.entities.GridEvent.filter({ status: "open" }),
  });

  const assets = dbAssets;
  const liveEvents = [
    ...MOCK_EVENTS.filter(e => !ackedEvents.has(e.id)),
    ...dbEvents,
  ];

  const stats = useMemo(() => {
    const totalGen = assets.filter(a => ["wind","solar","generator","battery"].includes(a.asset_type))
      .reduce((s, a) => s + (a.current_load_mw || 0), 0);
    const overloaded = assets.filter(a => a.load_percent >= 90).length;
    const renewable = assets.filter(a => ["wind","solar"].includes(a.asset_type))
      .reduce((s, a) => s + (a.current_load_mw || 0), 0);
    const renewablePct = totalGen > 0 ? Math.round((renewable / totalGen) * 100) : 0;
    return { totalGen, overloaded, renewablePct, assetCount: assets.length };
  }, [assets]);

  const handleAck = (id) => setAckedEvents(prev => new Set([...prev, id]));

  const handleDispatchAI = async () => {
    setGenerating(true);
    const overloadedAssets = assets.filter(a => a.load_percent >= 80);
    const flexAssets = assets.filter(a => a.is_flexible);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are NexusVectis Energy & Utilities Ops AI. Generate a concrete dispatch plan for the next 2 hours.

GRID STATUS:
- Total generation: ${stats.totalGen} MW (${stats.renewablePct}% renewable)
- Overloaded assets (>80%): ${overloadedAssets.map(a => `${a.name} (${a.load_percent}%)`).join(", ") || "none"}
- Flexible resources: ${flexAssets.map(a => `${a.name} (${a.asset_type}, ${a.current_load_mw}/${a.capacity_mw} MW)`).join(", ")}

ACTIVE EVENTS: ${liveEvents.filter(e => e.severity === "critical" || e.severity === "warning").map(e => e.description).join(" | ")}

Generate a concrete dispatch plan with:
1. Which assets should ramp up/down and by how many MW
2. Flex-requests to Port/Airport/Transit modules
3. CO₂ impact of the plan
4. Estimated risk reduction
Be specific with numbers and timeframes.`,
    });
    setAiPlan(result);
    setGenerating(false);
  };

  const tabs = [
    ["overview", "Grid Overview"],
    ["events", `Events (${liveEvents.length})`],
    ["forecast", "Load Forecast"],
    ["dispatch", "AI Dispatch"],
    ["resilience", "Resilience & Islanding"],
    ["outage", "Outage Planner"],
    ["co2", "CO₂ Optimizer"],
  ];

  return (
    <EnergyLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Energy & Utilities Ops</h1>
                <p className="text-slate-500 text-xs">Neural Grid Control · Digital Twin · Mobility Nexus</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {stats.overloaded > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  {stats.overloaded} overloaded assets
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                <Leaf className="w-3.5 h-3.5" />
                {stats.renewablePct}% renewable now
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Grid Twin Active
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Generation", value: `${stats.totalGen} MW`, sub: `${stats.renewablePct}% renewable`, color: "amber", icon: Zap },
              { label: "Flex Load Nodes", value: `${assets.filter(a=>a.asset_type==="load_node").reduce((s,a)=>s+(a.current_load_mw||0),0)} MW`, sub: `${assets.filter(a=>a.is_flexible&&a.asset_type==="load_node").length} flex nodes`, color: "cyan", icon: Activity },
              { label: "Critical Events", value: liveEvents.filter(e=>e.severity==="critical").length, sub: `${liveEvents.filter(e=>e.status==="open").length} open total`, color: liveEvents.filter(e=>e.severity==="critical").length > 0 ? "red" : "emerald", icon: AlertTriangle },
              { label: "CO₂ Today", value: `${CO2_DATA[CO2_DATA.length-1].co2} g/kWh`, sub: "−50% vs. baseline", color: "emerald", icon: Leaf },
            ].map((kpi, i) => (
              <Card key={i} className="bg-slate-900/60 border-slate-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className={`w-3.5 h-3.5 text-${kpi.color}-400`} />
                    <p className="text-slate-400 text-xs">{kpi.label}</p>
                  </div>
                  <p className={`text-2xl font-black text-${kpi.color}-400`}>{kpi.value}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-900/60 border border-slate-800 rounded-lg p-1 overflow-x-auto w-fit">
            {tabs.map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* GRID OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">Generation & Storage</h3>
                <div className="space-y-2">
                  {assets.filter(a => ["wind","solar","battery","generator"].includes(a.asset_type)).map(a => (
                    <AssetCard key={a.id} asset={a} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">Grid & Load Nodes</h3>
                <div className="space-y-2">
                  {assets.filter(a => ["line","transformer","substation","load_node"].includes(a.asset_type)).map(a => (
                    <AssetCard key={a.id} asset={a} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EVENTS */}
          {activeTab === "events" && (
            <div>
              {liveEvents.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/40" />
                  <p>No active grid events</p>
                </div>
              ) : liveEvents.map(ev => (
                <EventCard key={ev.id} event={ev} onAck={handleAck} />
              ))}
            </div>
          )}

          {/* LOAD FORECAST */}
          {activeTab === "forecast" && (
            <div className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> Load Forecast — next 8 hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={LOAD_FORECAST}>
                      <XAxis dataKey="time" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit=" MW" />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="load" stroke="#f59e0b" fill="#f59e0b22" name="Total load" />
                      <Area type="monotone" dataKey="wind" stroke="#22d3ee" fill="#22d3ee11" name="Wind" />
                      <Area type="monotone" dataKey="solar" stroke="#fbbf24" fill="#fbbf2411" name="Solar" />
                      <Area type="monotone" dataKey="gas" stroke="#f97316" fill="#f9731611" name="Gas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Expected Peak", value: "820 MW", time: "+2h", color: "red", icon: TrendingUp },
                  { label: "Wind Optimum", value: "210 MW", time: "+8h", color: "cyan", icon: Wind },
                  { label: "Gas Demand", value: "Min 180 MW", time: "Overnight", color: "orange", icon: Flame },
                ].map((item, i) => (
                  <Card key={i} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="pt-4 pb-4">
                      <item.icon className={`w-5 h-5 text-${item.color}-400 mb-2`} />
                      <p className={`text-xl font-black text-${item.color}-400`}>{item.value}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{item.label} · {item.time}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI DISPATCH */}
          {activeTab === "dispatch" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { module: "Port", icon: Anchor, color: "blue", flex: "Shore Power Pier 7", action: "−5 MW for 20 min", reason: "132kV overload mitigation", saving: "€ 840" },
                  { module: "Airport", icon: Plane, color: "violet", flex: "Terminal 2 HVAC", action: "−3 MW for 30 min", reason: "Peak shaving 17:00–18:00", saving: "€ 540" },
                  { module: "Transit", icon: Bus, color: "emerald", flex: "Bus Depot Valby", action: "+6 MW charging now", reason: "Wind surplus utilization", saving: "€ 320" },
                ].map((item, i) => (
                  <Card key={i} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/15 border border-${item.color}-500/30 flex items-center justify-center`}>
                          <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                        </div>
                        <span className="text-white font-semibold text-sm">{item.module}</span>
                      </div>
                      <p className="text-slate-300 text-xs font-medium mb-1">{item.flex}</p>
                      <p className={`text-${item.color}-400 text-sm font-bold mb-1`}>{item.action}</p>
                      <p className="text-slate-500 text-xs mb-2">{item.reason}</p>
                      <p className="text-emerald-400 text-xs font-semibold">Savings: {item.saving}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-slate-900/60 border-slate-800 mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">AI Dispatch Plan</h3>
                      <p className="text-slate-400 text-xs">Optimal balance of generation, storage and flex-load</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDispatchAI}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-amber-600 to-cyan-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? "Calculating dispatch plan..." : "Generate AI Dispatch Plan (2 hours)"}
                  </button>
                </CardContent>
              </Card>

              <AnimatePresence>
                {aiPlan && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-slate-900/60 border-amber-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" /> AI Dispatch Plan · {moment().format("HH:mm")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{aiPlan}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "resilience" && <ResiliencePanel />}
          {activeTab === "outage" && <OutagePlanner />}

          {/* CO2 OPTIMIZER */}
          {activeTab === "co2" && (
            <div className="space-y-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" /> CO₂ Intensity — this week (g/kWh)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CO2_DATA}>
                      <XAxis dataKey="day" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} unit=" g" />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      <Bar dataKey="co2" fill="#10b981" radius={[4,4,0,0]} name="CO₂ g/kWh" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Renewable share now", value: `${stats.renewablePct}%`, target: "85% target", color: "emerald", icon: Wind, trend: "+12% vs. last week" },
                  { label: "Gas avoided today", value: "1,420 MWh", target: "CO₂ saving: 597t", color: "cyan", icon: Leaf, trend: "Gas on standby since 06:00" },
                  { label: "CSRD Scope 2 status", value: "On track", target: "−45% vs. 2019", color: "violet", icon: Shield, trend: "EU Fit for 55 compliance" },
                ].map((item, i) => (
                  <Card key={i} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                        <p className="text-slate-400 text-xs">{item.label}</p>
                      </div>
                      <p className={`text-2xl font-black text-${item.color}-400 mb-1`}>{item.value}</p>
                      <p className="text-slate-400 text-xs">{item.target}</p>
                      <p className="text-slate-600 text-[10px] mt-1">{item.trend}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </EnergyLayout>
  );
}