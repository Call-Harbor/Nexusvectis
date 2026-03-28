import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Stepper, Chips, StatusGrid, SaveBtn, Field, Card, Loader, Empty } from "./StaffShared";

const SC = { open: "#10b981", limited: "#f59e0b", closed: "#f43f5e" };
const SL = { open: "Åben", limited: "Begrænset", closed: "Lukket" };
const FI = { taxi: "🚕", bus: "🚌", train: "🚆", parking: "🅿️", checkin: "✈️", security: "🛡️", immigration: "🛂", baggage_reclaim: "🧳" };

export default function LandsideTab({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["sp_landside", orgId],
    queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.LandsideZone.update(id, d),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["sp_landside"] }); logAdd(`Zone ${v.name} opdateret`, "success"); setOpenId(null); }
  });

  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));
  const toggle = (z) => {
    const next = openId === z.id ? null : z.id;
    setOpenId(next);
    if (next && !drafts[z.id]) setDrafts(d => ({ ...d, [z.id]: { ...z } }));
  };

  if (isLoading) return <Loader />;
  if (!zones.length) return <Empty text="Ingen landside zoner endnu" />;

  return (
    <div className="space-y-2">
      {zones.map(z => {
        const isOpen = openId === z.id;
        const d = drafts[z.id] || z;
        const sc = SC[z.status] || "#64748b";
        const occ = z.capacity > 0 ? Math.round((z.current_occupancy || 0) / z.capacity * 100) : 0;
        const isTransport = z.facility_type === "bus" || z.facility_type === "train";

        return (
          <Card key={z.id} color={sc} isOpen={isOpen}>
            <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(z)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${sc}18` }}>
                {FI[z.facility_type] || "🏢"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{z.name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{SL[z.status]}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Kø: {z.queue_count || 0}</span>
                  <span className={(z.wait_minutes || 0) > 15 ? "text-amber-400" : ""}>Vent: {z.wait_minutes || 0}m</span>
                  {z.capacity > 0 && <span className={occ > 90 ? "text-red-400 font-bold" : ""}>{occ}% belægning</span>}
                  {isTransport && z.next_departure_minutes != null && <span className="text-violet-400">Afgang: {z.next_departure_minutes}m</span>}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                <Field label="Zone Status">
                  <StatusGrid value={d.status} onChange={v => setD(z.id, "status", v)}
                    options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))} />
                </Field>

                <Field label="Kø antal">
                  <Stepper value={d.queue_count || 0} onChange={v => setD(z.id, "queue_count", v)} step={1} color="#f59e0b" />
                  <Chips options={[0, 5, 10, 20, 30, 50]} value={d.queue_count} onChange={v => setD(z.id, "queue_count", v)} color="#f59e0b" />
                </Field>

                <Field label="Ventetid" hint={(d.wait_minutes || 0) > 15 ? { text: "Høj ventetid", color: "#f59e0b" } : null}>
                  <Stepper value={d.wait_minutes || 0} onChange={v => setD(z.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                  <Chips options={[0, 5, 10, 15, 20, 30]} value={d.wait_minutes} onChange={v => setD(z.id, "wait_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                </Field>

                {z.capacity > 0 && (
                  <Field label={`Belægning (max ${z.capacity})`}>
                    <Stepper value={d.current_occupancy || 0} onChange={v => setD(z.id, "current_occupancy", v)} step={5} color="#8b5cf6" />
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, occ)}%`, background: occ > 90 ? "#f43f5e" : occ > 70 ? "#f59e0b" : "#8b5cf6" }} />
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-1">{d.current_occupancy || 0} / {z.capacity} ({occ}%)</p>
                  </Field>
                )}

                {isTransport && (
                  <>
                    <Field label="Næste afgang (minutter)">
                      <Stepper value={d.next_departure_minutes || 0} onChange={v => setD(z.id, "next_departure_minutes", v)} step={1} color="#10b981" />
                      <Chips options={[0, 5, 10, 15, 20, 30, 45, 60]} value={d.next_departure_minutes} onChange={v => setD(z.id, "next_departure_minutes", v)} color="#10b981" fmt={v => `${v}m`} />
                    </Field>
                    <Field label="Forsinkelse" hint={(d.delay_minutes || 0) > 0 ? { text: "⚠ Forsinket", color: "#f43f5e" } : null}>
                      <Stepper value={d.delay_minutes || 0} onChange={v => setD(z.id, "delay_minutes", v)} step={1} color="#f43f5e" />
                      <Chips options={[0, 5, 10, 15, 20, 30]} value={d.delay_minutes} onChange={v => setD(z.id, "delay_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                    </Field>
                  </>
                )}

                <SaveBtn onClick={() => update.mutate({ ...d, name: z.name })} loading={update.isPending} color="#8b5cf6" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}