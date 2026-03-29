import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FlightSyncPanel from "./FlightSyncPanel";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Stepper, Chips, StatusGrid, SaveBtn, Field, Card, Loader, Empty } from "./StaffShared";

// Airport config
const AIRPORT_CONFIG = {
  statuses: { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" },
  statusLabels: { open: "Åben", occupied: "Optaget", maintenance: "Vedligehold", closed: "Lukket" },
  entity: "AirportGate",
  relatedEntity: "Flight",
  codeField: "gate_code",
  relatedCodeField: "flight_number",
  displayText: (item) => `${item.flight_number} · ${item.origin} → ${item.destination}`,
  syncPanel: true,
};

// Port config
const PORT_CONFIG = {
  statuses: { available: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", unavailable: "#f43f5e" },
  statusLabels: { available: "Tilgængelig", occupied: "Optaget", maintenance: "Vedligehold", unavailable: "Utilgængelig" },
  entity: "Berth",
  relatedEntity: "Vessel",
  codeField: "berth_code",
  relatedCodeField: "vessel_name",
  displayText: (item) => `${item.vessel_name}`,
  syncPanel: false,
};

export default function GateAgentTab({ orgId, logAdd, modality = "airport" }) {
  const config = modality === "port" ? PORT_CONFIG : AIRPORT_CONFIG;
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: [`sp_${config.entity}`, orgId],
    queryFn: () => base44.entities[config.entity].filter({ organization_id: orgId }, config.codeField, 50),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const { data: relatedItems = [] } = useQuery({
    queryKey: [`sp_${config.relatedEntity}`, orgId],
    queryFn: () => base44.entities[config.relatedEntity].filter({ organization_id: orgId }, "-created_date", 100),
    enabled: !!orgId,
    refetchInterval: 20000,
  });

  const relatedMap = Object.fromEntries(relatedItems.map(f => [f.id, f]));

  const updateItem = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities[config.entity].update(id, d),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [`sp_${config.entity}`] });
      logAdd(`${config.entity} ${v[config.codeField]} opdateret`, "success");
      setOpenId(null);
    }
  });

  const updateRelated = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities[config.relatedEntity].update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`sp_${config.relatedEntity}`] });
      logAdd(`${config.relatedEntity} status opdateret`, "success");
    }
  });

  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));
  const toggle = (item) => {
    const next = openId === item.id ? null : item.id;
    setOpenId(next);
    if (next && !drafts[item.id]) setDrafts(d => ({ ...d, [item.id]: { ...item } }));
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      {config.syncPanel && <FlightSyncPanel orgId={orgId} logAdd={logAdd} />}
      {!items.length && <Empty text={`Ingen ${config.entity.toLowerCase()} oprettet endnu`} />}
      {items.map(item => {
        const isOpen = openId === item.id;
        const d = drafts[item.id] || item;
        const sc = config.statuses[item.status] || "#64748b";
        const relatedItem = item.current_flight_id || item.current_vessel_id ? relatedMap[item.current_flight_id || item.current_vessel_id] : null;

        return (
          <Card key={item.id} color={sc} isOpen={isOpen}>
            <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(item)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg" style={{ background: `${sc}18`, color: sc }}>
                {item[config.codeField]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base">{item[config.codeField]}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{config.statusLabels[item.status]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {relatedItem ? config.displayText(relatedItem) : `Ingen ${config.relatedEntity.toLowerCase()}`}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                <Field label="Status">
                  <StatusGrid value={d.status} onChange={v => setD(item.id, "status", v)}
                    options={Object.entries(config.statusLabels).map(([val, label]) => ({ val, label, color: config.statuses[val] }))} />
                </Field>

                <SaveBtn onClick={() => updateItem.mutate({ ...d, [config.codeField]: item[config.codeField] })} loading={updateItem.isPending} color={sc} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}