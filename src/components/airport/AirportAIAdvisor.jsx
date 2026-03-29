import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, Send, Loader2, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  { label: "🔒 Security kø", prompt: "Hvorfor overskrider sikkerhedskøerne 20 minutter? Hvad skal gøres nu?" },
  { label: "🧳 Bagage forbindelser", prompt: "Giv 3 konkrete handlinger for at reducere mistede bagageforbindelser" },
  { label: "⚠️ Risikoflight", prompt: "Hvilke fly er i størst forsinkelsesrisiko lige nu?" },
  { label: "🛬 Gate optimering", prompt: "Optimer gate-tildeling for de næste 2 timer" },
  { label: "🔄 Turnaround forsinkelse", prompt: "Hvad forårsager turnaround-forsinkelsen? Hvad er den kritiske sti?" },
  { label: "🌿 Energibesparelse", prompt: "Hvordan kan vi reducere terminalenergiforbruget 10% i dag?" },
  { label: "👥 Personaledækning", prompt: "Er der personale-underdækning i kritiske zoner?" },
  { label: "📊 Status rapport", prompt: "Giv en komplet driftstatus-rapport for den nuværende dag" },
];

export default function AirportAIAdvisor({ flights, securityLanes, gates, tasks, bags }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "**Airport AI Co-pilot online.** 🛫\n\nJeg har fuldt overblik over fly, gates, sikkerhed, bagage og ground handling. Hvad vil du analysere?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const delayed = flights.filter(f => (f.delay_minutes || 0) > 15);
    const secAlert = securityLanes.filter(l => (l.wait_minutes || 0) > 15);
    const rushBags = bags.filter(b => b.is_rush || (b.connection_time_minutes || 999) < 45);
    const openTasks = tasks.filter(t => t.status === "pending" || t.status === "delayed");
    return `AIRPORT OPERATIONS SNAPSHOT (${new Date().toLocaleTimeString("da-DK")}):
- Total fly: ${flights.length} | Forsinket (>15m): ${delayed.length} | Boarding: ${flights.filter(f => f.status === "boarding").length}
- Forsinkede fly: ${delayed.slice(0,5).map(f => `${f.flight_number} +${f.delay_minutes}m`).join(", ") || "ingen"}
- Security: ${securityLanes.length} baner, avg ${securityLanes.length > 0 ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : 0}m ventetid
- Security alerts: ${secAlert.map(l => `${l.name}: ${l.wait_minutes}m`).join(", ") || "ingen"}
- Gates: ${gates.filter(g => g.status === "occupied").length}/${gates.length} optaget
- Rush bagage: ${rushBags.length} | Mishandled: ${bags.filter(b => b.status === "mishandled").length}
- Åbne/forsinkede ground opgaver: ${openTasks.length}
- Høj-risiko fly: ${flights.filter(f => (f.ai_risk_score || 0) > 70).map(f => f.flight_number).join(", ") || "ingen"}`;
  };

  const send = async (prompt) => {
    const text = prompt || input;
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er en ekspert Airport Operations AI Co-pilot for NexusVectis Airport Ops. Svar på dansk.
${buildContext()}
Bruger spørgsmål: ${text}
Giv et præcist, handlingsorienteret svar med specifikke anbefalinger. Brug bullet points. Max 250 ord. Vær konkret og brug tal fra konteksten.`,
      });
      setMessages(m => [...m, { role: "assistant", content: typeof res === "string" ? res : res.response || JSON.stringify(res) }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "AI midlertidigt utilgængelig. Prøv igen." }]);
    }
    setLoading(false);
  };

  const criticalAlerts = flights.filter(f => (f.delay_minutes || 0) > 45).length + securityLanes.filter(l => (l.wait_minutes || 0) > 25).length;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid rgba(139,92,246,0.25)", background: "rgba(0,8,20,0.97)", height: "650px" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0"
        style={{ background: "rgba(0,12,28,0.9)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-violet-400">AI OPERATIONS CO-PILOT</h2>
            <p className="text-[8px] text-slate-600">{flights.length} fly · {gates.length} gates · {securityLanes.length} sec.baner</p>
          </div>
        </div>
        {criticalAlerts > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl animate-pulse" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-black text-red-400">{criticalAlerts} KRITISKE</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Quick prompts sidebar */}
        <div className="w-44 border-r border-slate-800/50 p-3 space-y-1.5 overflow-y-auto flex-shrink-0" style={{ background: "rgba(0,6,15,0.6)" }}>
          <p className="text-[8px] tracking-widest uppercase text-slate-600 mb-2">HURTIG ANALYSE</p>
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} onClick={() => send(q.prompt)} disabled={loading}
              className="w-full text-left text-[9px] px-2.5 py-2 rounded-xl transition-all hover:text-white font-bold leading-tight"
              style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.12)", color: "#64748b" }}>
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <Cpu className="w-3 h-3 text-violet-400" />
                  </div>
                )}
                <div className="max-w-[82%] px-4 py-3 rounded-2xl text-[11px] leading-relaxed"
                  style={{
                    background: m.role === "user" ? "rgba(139,92,246,0.18)" : "rgba(15,23,42,0.9)",
                    border: `1px solid ${m.role === "user" ? "rgba(139,92,246,0.3)" : "rgba(30,41,59,0.8)"}`,
                    color: "#e2e8f0"
                  }}>
                  {m.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="ml-3 space-y-0.5 list-disc">{children}</ul>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="text-white font-black">{children}</strong>,
                      }}>
                      {m.content}
                    </ReactMarkdown>
                  ) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mr-2"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                  <Cpu className="w-3 h-3 text-violet-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(30,41,59,0.8)" }}>
                  <div className="flex items-center gap-1">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-800/50 flex gap-2 flex-shrink-0" style={{ background: "rgba(0,6,15,0.7)" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Spørg om drift, forsinkelser, kø-optimering..."
              className="flex-1 text-[11px] rounded-xl px-3 py-2.5 text-white outline-none"
              style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)" }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="px-3 py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: input.trim() ? "rgba(139,92,246,0.2)" : "rgba(15,23,42,0.6)", border: `1px solid ${input.trim() ? "rgba(139,92,246,0.4)" : "rgba(30,41,59,0.5)"}`, color: input.trim() ? "#8b5cf6" : "#334155" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}