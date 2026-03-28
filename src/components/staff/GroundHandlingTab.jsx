import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { SaveBtn, Card, Loader, Empty, KPI } from "./StaffShared";

const TASK_TYPES = ["fueling", "cleaning", "catering", "baggage_load", "baggage_offload", "towing", "deboarding", "boarding_stairs", "technical_check"];
const TASK_LABELS = { fueling: "⛽ Tankning", cleaning: "🧹 Rengøring", catering: "🍱 Catering", baggage_load: "📦 Baggage på", baggage_offload: "📦 Baggage af", towing: "🚛 Bugsering", deboarding: "🚶 Afstigning", boarding_stairs: "🪜 Boardingtrappe", technical_check: "🔧 Teknisk check" };
const STATUS_CFG = [
  { val: "pending", label: "Afventer", color: "#64748b" },
  { val: "in_progress", label: "I gang", color: "#06b6d4" },
  { val: "completed", label: "Udført ✓", color: "#10b981" },
  { val: "delayed", label: "Forsinket", color: "#f59e0b" },
  { val: "cancelled", label: "Annulleret", color: "#f43f5e" },
];
const PRIO_CFG = [
  { val: "low", label: "Lav", color: "#64748b" },
  { val: "normal", label: "Normal", color: "#06b6d4" },
  { val: "high", label: "Høj", color: "#f59e0b" },
  { val: "critical", label: "Kritisk 🚨", color: "#f43f5e" },
];

export default function GroundHandlingTab({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ task_type: "fueling", status: "pending", priority: "normal", assigned_team: "" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["sp_ghtasks", orgId],
    queryFn: () => base44.entities.GroundHandlingTask.filter({ organization_id: orgId }, "-created_date", 50),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.GroundHandlingTask.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_ghtasks"] }); logAdd("Task opdateret", "success"); setOpenId(null); }
  });

  const create = useMutation({
    mutationFn: d => base44.entities.GroundHandlingTask.create({ ...d, organization_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_ghtasks"] }); logAdd("Ny task oprettet", "success"); setShowNew(false); }
  });

  const quickStatus = (task, status) => {
    update.mutate({ id: task.id, status });
    logAdd(`Task ${TASK_LABELS[task.task_type] || task.task_type}: → ${status}`, "success");
  };

  if (isLoading) return <Loader />;

  const pending = tasks.filter(t => t.status === "pending").length;
  const inProg = tasks.filter(t => t.status === "in_progress").length;
  const done = tasks.filter(t => t.status === "completed").length;
  const critical = tasks.filter(t => t.priority === "critical" && t.status !== "completed").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <KPI label="Afventer" value={pending} color="#64748b" />
        <KPI label="I gang" value={inProg} color="#06b6d4" />
        <KPI label="Udført" value={done} color="#10b981" />
        <KPI label="Kritisk" value={critical} color="#f43f5e" alert={critical > 0} />
      </div>

      {/* New task button */}
      <button onClick={() => setShowNew(s => !s)}
        className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
        style={{ background: "rgba(16,185,129,0.1)", border: "2px dashed rgba(16,185,129,0.4)", color: "#10b981" }}>
        <Plus className="w-5 h-5" /> Ny ground handling task
      </button>

      {/* New task form */}
      {showNew && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: "rgba(16,185,129,0.06)", border: "2px solid rgba(16,185,129,0.25)" }}>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">+ Ny Task</p>

          <div>
            <p className="text-xs text-slate-400 mb-2">Task type</p>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TYPES.map(t => (
                <button key={t} onPointerDown={e => { e.preventDefault(); setNewTask(n => ({ ...n, task_type: t })); }}
                  className="h-11 rounded-xl text-xs font-bold active:scale-95 transition-all text-left px-3"
                  style={{ background: newTask.task_type === t ? "rgba(16,185,129,0.2)" : "rgba(20,30,50,0.6)", color: newTask.task_type === t ? "#10b981" : "#64748b", border: `1.5px solid ${newTask.task_type === t ? "#10b981" : "rgba(51,65,85,0.4)"}` }}>
                  {TASK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Prioritet</p>
            <div className="grid grid-cols-4 gap-2">
              {PRIO_CFG.map(p => (
                <button key={p.val} onPointerDown={e => { e.preventDefault(); setNewTask(n => ({ ...n, priority: p.val })); }}
                  className="h-11 rounded-xl text-xs font-bold active:scale-95 transition-all"
                  style={{ background: newTask.priority === p.val ? `${p.color}25` : "rgba(20,30,50,0.6)", color: p.color, border: `1.5px solid ${newTask.priority === p.val ? p.color : "rgba(51,65,85,0.4)"}` }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Hold / gate (valgfrit)</p>
            <input
              value={newTask.assigned_team}
              onChange={e => setNewTask(n => ({ ...n, assigned_team: e.target.value }))}
              placeholder="f.eks. Team A / Gate B14"
              className="w-full h-12 rounded-xl px-4 text-sm text-white placeholder-slate-600 outline-none"
              style={{ background: "rgba(30,41,59,0.8)", border: "1.5px solid rgba(51,65,85,0.5)" }}
            />
          </div>

          <SaveBtn onClick={() => create.mutate(newTask)} loading={create.isPending} color="#10b981" label="Opret task" />
        </div>
      )}

      {/* Task list */}
      {!tasks.length && !showNew && <Empty text="Ingen tasks i dag" />}
      <div className="space-y-2">
        {tasks.map(task => {
          const isOpen = openId === task.id;
          const sc = STATUS_CFG.find(s => s.val === task.status)?.color || "#64748b";
          const pc = PRIO_CFG.find(p => p.val === task.priority)?.color || "#64748b";

          return (
            <Card key={task.id} color={sc} isOpen={isOpen}>
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => setOpenId(isOpen ? null : task.id)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${sc}15` }}>
                  {TASK_LABELS[task.task_type]?.split(" ")[0] || "📋"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{TASK_LABELS[task.task_type] || task.task_type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>
                      {STATUS_CFG.find(s => s.val === task.status)?.label || task.status}
                    </span>
                    {task.priority === "critical" && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${pc}20`, color: pc }}>🚨 Kritisk</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.assigned_team || "Ikke tildelt"} · {task.aircraft_registration || ""}
                    {task.gate_code && ` · Gate ${task.gate_code}`}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 border-t-2 border-slate-800/60 pt-4 space-y-4">
                  {/* Quick actions */}
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hurtig statusskift</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_CFG.map(s => (
                      <button key={s.val} onPointerDown={e => { e.preventDefault(); quickStatus(task, s.val); }}
                        className="h-13 rounded-xl text-sm font-bold active:scale-95 transition-all"
                        style={{ background: task.status === s.val ? `${s.color}30` : "rgba(20,30,50,0.6)", color: s.color, border: `2px solid ${task.status === s.val ? s.color : "rgba(51,65,85,0.4)"}` }}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Priority */}
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Prioritet</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIO_CFG.map(p => (
                      <button key={p.val} onPointerDown={e => { e.preventDefault(); update.mutate({ id: task.id, priority: p.val }); }}
                        className="h-11 rounded-xl text-xs font-bold active:scale-95 transition-all"
                        style={{ background: task.priority === p.val ? `${p.color}25` : "rgba(20,30,50,0.6)", color: p.color, border: `1.5px solid ${task.priority === p.val ? p.color : "rgba(51,65,85,0.4)"}` }}>
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Complete button */}
                  {task.status !== "completed" && (
                    <button onPointerDown={e => { e.preventDefault(); quickStatus(task, "completed"); }}
                      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
                      style={{ background: "rgba(16,185,129,0.2)", border: "2px solid rgba(16,185,129,0.5)", color: "#10b981" }}>
                      <CheckCircle2 className="w-5 h-5" /> Marker som udført
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}