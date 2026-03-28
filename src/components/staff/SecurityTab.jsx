import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Stepper, Chips, StatusGrid, SaveBtn, Field, Card, KPI, Loader, Empty } from "./StaffShared";

const SC = { open: "#10b981", closed: "#f43f5e", degraded: "#f59e0b" };
const SL = { open: "Åben", closed: "Lukket", degraded: "Degraderet" };

export default function SecurityTab({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: lanes = [], isLoading } = useQuery({
    queryKey: ["sp_lanes", orgId],
    queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.SecurityLane.update(id, d),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["sp_lanes"] }); logAdd(`Lane ${v.name} opdateret`, "success"); setOpenId(null); }
  });

  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));
  const toggle = (l) => {
    const next = openId === l.id ? null : l.id;
    setOpenId(next);
    if (next && !drafts[l.id]) setDrafts(d => ({ ...d, [l.id]: { ...l } }));
  };

  const totalQueue = lanes.reduce((s, l) => s + (l.queue_length || 0), 0);
  const avgWait = lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0;
  const openLanes = lanes.filter(l => l.status === "open").length;

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      {lanes.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <KPI label="Total kø" value={totalQueue} unit="pax" color="#f59e0b" alert={totalQueue > 200} />
          <KPI label="Avg. vent" value={`${avgWait}m`} color={avgWait > 20 ? "#f43f5e" : "#10b981"} alert={avgWait > 20} />
          <KPI label="Åbne" value={openLanes} unit={`/ ${lanes.length}`} color="#10b981" />
        </div>
      )}

      {!lanes.length && <Empty text="Ingen security lanes endnu" />}
      <div className="space-y-2">
        {lanes.map(l => {
          const isOpen = openId === l.id;
          const d = drafts[l.id] || l;
          const sc = SC[l.status] || "#64748b";
          const short = (l.staff_assigned || 0) < (l.staff_required || 2);

          return (
            <Card key={l.id} color={sc} isOpen={isOpen}>
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(l)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${sc}18` }}>
                  <Shield className="w-6 h-6" style={{ color: sc }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{l.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{SL[l.status]}</span>
                    {short && <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold">⚠ Understaffed</span>}
                  </div>
                  <div className="flex gap-3 text-xs mt-0.5">
                    <span className={(l.queue_length || 0) > 75 ? "text-amber-400 font-bold" : "text-slate-500"}>Kø: {l.queue_length || 0}</span>
                    <span className={(l.wait_minutes || 0) > 20 ? "text-red-400 font-bold" : "text-slate-500"}>Vent: {l.wait_minutes || 0}m</span>
                    <span className="text-slate-500">Staff: {l.staff_assigned || 0}/{l.staff_required || 2}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                  <Field label="Lane Status">
                    <StatusGrid value={d.status} onChange={v => setD(l.id, "status", v)}
                      options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))} />
                  </Field>

                  <Field label="Kø størrelse (pax)" hint={(d.queue_length || 0) > 75 ? { text: "Høj belastning", color: "#f59e0b" } : null}>
                    <Stepper value={d.queue_length || 0} onChange={v => setD(l.id, "queue_length", v)} step={5} color="#f59e0b" />
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (d.queue_length || 0) / 2)}%`, background: (d.queue_length || 0) > 150 ? "#f43f5e" : (d.queue_length || 0) > 75 ? "#f59e0b" : "#10b981" }} />
                    </div>
                    <Chips options={[0, 25, 50, 75, 100, 150, 200]} value={d.queue_length} onChange={v => setD(l.id, "queue_length", v)} color="#f59e0b" />
                  </Field>

                  <Field label="Ventetid (minutter)" hint={(d.wait_minutes || 0) > 20 ? { text: "Over SLA 🔴", color: "#f43f5e" } : null}>
                    <Stepper value={d.wait_minutes || 0} onChange={v => setD(l.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                    <Chips options={[0, 5, 10, 15, 20, 25, 30, 45]} value={d.wait_minutes} onChange={v => setD(l.id, "wait_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                  </Field>

                  <Field label="Personale — Til stede / Krævet">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-2 text-center">Til stede</p>
                        <Stepper value={d.staff_assigned || 0} onChange={v => setD(l.id, "staff_assigned", v)} step={1} color="#10b981" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2 text-center">Krævet</p>
                        <Stepper value={d.staff_required || 2} onChange={v => setD(l.id, "staff_required", v)} step={1} color="#8b5cf6" />
                      </div>
                    </div>
                  </Field>

                  <Field label="Throughput (pax/time)">
                    <Stepper value={d.throughput_per_hour || 180} onChange={v => setD(l.id, "throughput_per_hour", v)} step={10} color="#06b6d4" />
                    <Chips options={[120, 150, 180, 200, 240, 300]} value={d.throughput_per_hour} onChange={v => setD(l.id, "throughput_per_hour", v)} color="#06b6d4" />
                  </Field>

                  <SaveBtn onClick={() => update.mutate({ ...d, name: l.name })} loading={update.isPending} color="#f59e0b" />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}