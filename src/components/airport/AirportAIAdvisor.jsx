import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, Send, Loader2 } from "lucide-react";

const QUICK_PROMPTS = [
  "Why are security queues exceeding 20 minutes?",
  "Give 3 actions to reduce missed bag connections",
  "Which flights are at highest risk of delay right now?",
  "Optimize gate assignments for next 2 hours",
  "What's causing the turnaround delay on the current flight?",
  "Sustainability: how to cut terminal energy 10% today?",
];

export default function AirportAIAdvisor({ flights, securityLanes, gates, tasks, bags }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Airport AI Co-pilot online. I have full visibility of flights, gates, security, baggage and ground handling. Ask me anything about current operations." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const buildContext = () => {
    const delayed = flights.filter(f => (f.delay_minutes || 0) > 15);
    const securityAlert = securityLanes.filter(l => (l.wait_minutes || 0) > 15);
    const rushBags = bags.filter(b => b.is_rush || (b.connection_time_minutes || 999) < 45);
    const openTasks = tasks.filter(t => t.status === "pending" || t.status === "delayed");
    return `
AIRPORT OPERATIONS SNAPSHOT:
- Total flights: ${flights.length} | Delayed (>15m): ${delayed.length}
- Delayed flights: ${delayed.map(f => `${f.flight_number} +${f.delay_minutes}m`).join(", ") || "none"}
- Security lanes: ${securityLanes.length} open, avg wait ${securityLanes.length > 0 ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : 0} min
- Security alerts (>15m): ${securityAlert.map(l => `${l.name}: ${l.wait_minutes}m`).join(", ") || "none"}
- Gates occupied: ${gates.filter(g => g.status === "occupied").length}/${gates.length}
- Rush baggage tags: ${rushBags.length}
- Mishandled bags: ${bags.filter(b => b.status === "mishandled").length}
- Open/delayed ground tasks: ${openTasks.length}
- High risk flights (score>70): ${flights.filter(f => (f.ai_risk_score || 0) > 70).map(f => f.flight_number).join(", ") || "none"}
`;
  };

  const send = async (prompt) => {
    const text = prompt || input;
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Airport Operations AI Co-pilot for NexusVectis Airport Ops. 
${buildContext()}
User question: ${text}
Give a concise, actionable answer with specific recommendations. Use bullet points. Max 200 words.`,
      });
      setMessages(m => [...m, { role: "assistant", content: typeof res === "string" ? res : res.response || JSON.stringify(res) }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "AI temporarily unavailable. Please retry." }]);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl overflow-hidden h-full flex flex-col" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-2">
        <Cpu className="w-4 h-4" style={{ color: "#8b5cf6" }} />
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#8b5cf6" }}>AI OPERATIONS CO-PILOT</h2>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Quick prompts */}
        <div className="w-48 border-r border-slate-800/60 p-3 space-y-1.5 overflow-auto flex-shrink-0">
          <p className="text-[8px] tracking-widest uppercase text-slate-500 mb-2">QUICK ANALYSIS</p>
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} onClick={() => send(q)}
              className="w-full text-left text-[10px] px-2.5 py-2 rounded-lg text-slate-400 hover:text-white transition-all"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
              {q}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-line"
                  style={{ background: m.role === "user" ? "rgba(139,92,246,0.2)" : "rgba(15,23,42,0.8)", border: `1px solid ${m.role === "user" ? "rgba(139,92,246,0.3)" : "rgba(30,41,59,1)"}`, color: "#e2e8f0" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,1)" }}>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-800/60 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about operations, delays, queues..."
              className="flex-1 text-[11px] bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white outline-none"
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg transition-all"
              style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}