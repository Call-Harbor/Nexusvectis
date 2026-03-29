import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, Zap, TrendingUp, AlertTriangle, Leaf, Send } from "lucide-react";

const QUICK_PROMPTS = [
  { label: "Optimize berth allocation", icon: "⚓", prompt: "Analyze all planned calls and suggest optimal berth allocation based on size, draft, and crane availability." },
  { label: "Crane sequencing", icon: "🏗️", prompt: "Optimize crane sequence and equipment usage for all active operations to minimize turnaround time." },
  { label: "Yard stowage plan", icon: "📦", prompt: "Analyze yard occupancy and suggest optimal placement of incoming containers to minimize internal moves." },
  { label: "Gate flow peak", icon: "🚛", prompt: "Predict truck-flow peaks in the next 8 hours and suggest gate adjustments to avoid queues." },
  { label: "CO₂ reduction", icon: "🌱", prompt: "Identify the 3 largest CO₂ savings opportunities at the port right now and estimate potential reduction." },
  { label: "Backlog analysis", icon: "📊", prompt: "Analyze current backlog and suggest concrete actions to reduce delays within 24 hours." },
];

export default function PortAIAdvisor({ portCalls, vessels, cranes, yardZones, gates, orgId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Port Operations AI. I have access to all live data from the port — berths, cranes, yard, gates and vessels. What can I help with?",
      ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const buildContext = () => {
    const active = portCalls.filter(p => ["operations", "berthed", "approaching"].includes(p.status));
    const totalMoves = cranes.reduce((s, c) => s + (c.total_moves_today || 0), 0);
    const avgYardOcc = yardZones.length ? (yardZones.reduce((s, z) => s + (z.occupancy_pct || 0), 0) / yardZones.length).toFixed(0) : "unknown";
    const totalQueue = gates.reduce((s, g) => s + (g.queue_trucks || 0), 0);
    return `PORT STATUS OVERVIEW:
- Active calls: ${active.length} (${portCalls.filter(p => p.status === "planned").length} planned)
- Active cranes: ${cranes.filter(c => c.status === "working").length}/${cranes.length} · Total moves today: ${totalMoves}
- Yard occupancy: ${avgYardOcc}% avg. · Zones: ${yardZones.length}
- Truck queue at gate: ${totalQueue} trucks
- Critical calls: ${portCalls.filter(p => p.priority === "critical").length}
- Delayed calls: ${portCalls.filter(p => p.status === "delayed").length}`;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text, ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const ctx = buildContext();
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an experienced Port Operations AI for NexusVectis Port. Answer precisely and action-oriented in English.

${ctx}

User asks: ${text}

Provide concrete, numbered recommendations. Include estimated effects (time savings, cost, CO₂) where relevant. Max 250 words.`,
    });

    setMessages(prev => [...prev, {
      role: "assistant",
      content: res,
      ts: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }]);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
      {/* Quick Prompts */}
      <div className="space-y-3">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: "rgba(139,92,246,0.7)" }}>QUICK AI ANALYSIS</p>
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.02]"
            style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.04)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{qp.icon}</span>
              <p className="text-[10px] font-bold" style={{ color: "#c4b5fd" }}>{qp.label}</p>
            </div>
            <p className="text-[8px] text-slate-500 leading-relaxed">{qp.prompt.slice(0, 70)}...</p>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="col-span-2 flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,8,20,0.6)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.06)" }}>
          <Cpu className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#8b5cf6" }}>PORT AI ADVISOR</p>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[8px] tracking-widest" style={{ color: "#10b981" }}>LIVE DATA</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3`}
                style={{
                  background: msg.role === "user" ? "rgba(139,92,246,0.15)" : "rgba(6,182,212,0.08)",
                  border: `1px solid ${msg.role === "user" ? "rgba(139,92,246,0.3)" : "rgba(6,182,212,0.15)"}`,
                }}>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[7px] mt-1" style={{ color: "rgba(100,116,139,0.4)" }}>{msg.ts}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-3" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.06)" }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask port AI about operations, optimization, planning..."
            className="flex-1 px-3 py-2 rounded-lg text-xs text-white bg-slate-900 border border-slate-700 focus:outline-none focus:border-purple-500 placeholder-slate-600"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-lg transition-all"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}