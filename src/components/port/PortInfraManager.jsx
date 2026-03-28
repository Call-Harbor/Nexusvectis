import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABS = [
  { id: "berth", label: "Kajer (Berths)" },
  { id: "yard", label: "Yard Zoner" },
  { id: "gate", label: "Gates" },
  { id: "rail", label: "Jernbane Slots" },
];

function BerthForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", terminal: "", length_m: "", max_draft_m: "", crane_count: 0, status: "available", shore_power_available: false, reefer_points: 0 });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Kajnavn *</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Kaj 1" /></div>
        <div><Label>Terminal</Label><Input value={f.terminal} onChange={e=>setF({...f,terminal:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Nordterminal" /></div>
        <div><Label>Kajlængde (m)</Label><Input type="number" value={f.length_m} onChange={e=>setF({...f,length_m:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="350" /></div>
        <div><Label>Max dybgang (m)</Label><Input type="number" value={f.max_draft_m} onChange={e=>setF({...f,max_draft_m:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="15" /></div>
        <div><Label>Antal kraner</Label><Input type="number" value={f.crane_count} onChange={e=>setF({...f,crane_count:parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Reefer tilslutninger</Label><Input type="number" value={f.reefer_points} onChange={e=>setF({...f,reefer_points:parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f,status:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={f.shore_power_available} onChange={e=>setF({...f,shore_power_available:e.target.checked})} id="sp" />
        <Label htmlFor="sp">Shore Power tilgængeligt</Label>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={()=>onSave(f)} disabled={!f.name}>Opret Kaj</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

function YardForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", type: "standard", rows: "", bays: "", max_stack_height: 4, total_slots: "", occupied_slots: 0, reefer_slots: 0, status: "operational" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Zone navn *</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="A-BLOK" /></div>
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={v=>setF({...f,type:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="reefer">Reefer</SelectItem>
              <SelectItem value="dangerous_goods">Farligt Gods</SelectItem>
              <SelectItem value="empty">Empty</SelectItem>
              <SelectItem value="customs">Toldklarering</SelectItem>
              <SelectItem value="rail_connection">Rail Connection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Rækker</Label><Input type="number" value={f.rows} onChange={e=>setF({...f,rows:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="8" /></div>
        <div><Label>Bays</Label><Input type="number" value={f.bays} onChange={e=>setF({...f,bays:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="40" /></div>
        <div><Label>Max stakhøjde</Label><Input type="number" value={f.max_stack_height} onChange={e=>setF({...f,max_stack_height:parseInt(e.target.value)||4})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Total slots</Label><Input type="number" value={f.total_slots} onChange={e=>setF({...f,total_slots:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="1600" /></div>
        {f.type === "reefer" && <div><Label>Reefer slots</Label><Input type="number" value={f.reefer_slots} onChange={e=>setF({...f,reefer_slots:parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>}
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f,status:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="congested">Congested</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={()=>onSave(f)} disabled={!f.name}>Opret Yard Zone</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

function GateForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", lanes_total: 4, lanes_open: 2, direction: "both", status: "open", avg_processing_min: 5, anpr_enabled: true, booking_required: false });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Gate navn *</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Nordport Gate" /></div>
        <div><Label>Retning</Label>
          <Select value={f.direction} onValueChange={v=>setF({...f,direction:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Begge (in/ud)</SelectItem>
              <SelectItem value="in">Kun ind</SelectItem>
              <SelectItem value="out">Kun ud</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Total baner</Label><Input type="number" value={f.lanes_total} onChange={e=>setF({...f,lanes_total:parseInt(e.target.value)||1})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Åbne baner</Label><Input type="number" value={f.lanes_open} onChange={e=>setF({...f,lanes_open:parseInt(e.target.value)||1})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Behandlingstid (min)</Label><Input type="number" value={f.avg_processing_min} onChange={e=>setF({...f,avg_processing_min:parseInt(e.target.value)||5})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f,status:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Åben</SelectItem>
              <SelectItem value="closed">Lukket</SelectItem>
              <SelectItem value="limited">Begrænset</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2"><input type="checkbox" checked={f.anpr_enabled} onChange={e=>setF({...f,anpr_enabled:e.target.checked})} id="anpr" /><Label htmlFor="anpr">ANPR aktivt</Label></div>
        <div className="flex items-center gap-2"><input type="checkbox" checked={f.booking_required} onChange={e=>setF({...f,booking_required:e.target.checked})} id="bk" /><Label htmlFor="bk">Booking krævet</Label></div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={()=>onSave(f)} disabled={!f.name}>Opret Gate</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

function RailForm({ onSave, onClose }) {
  const [f, setF] = useState({ train_id: "", track: "", direction: "inbound", scheduled_arrival: "", scheduled_departure: "", wagons: "", teu_capacity: "", status: "planned", operator: "" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Tog ID</Label><Input value={f.train_id} onChange={e=>setF({...f,train_id:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="IC-3847" /></div>
        <div><Label>Spor *</Label><Input value={f.track} onChange={e=>setF({...f,track:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Spor 1" /></div>
        <div><Label>Retning</Label>
          <Select value={f.direction} onValueChange={v=>setF({...f,direction:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f,status:v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="arriving">Arriving</SelectItem>
              <SelectItem value="loading">Loading</SelectItem>
              <SelectItem value="departing">Departing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Planlagt ankomst</Label><Input type="datetime-local" value={f.scheduled_arrival} onChange={e=>setF({...f,scheduled_arrival:e.target.value})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Planlagt afgang</Label><Input type="datetime-local" value={f.scheduled_departure} onChange={e=>setF({...f,scheduled_departure:e.target.value})} className="bg-slate-800 border-slate-700" /></div>
        <div><Label>Antal vogne</Label><Input type="number" value={f.wagons} onChange={e=>setF({...f,wagons:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="22" /></div>
        <div><Label>TEU kapacitet</Label><Input type="number" value={f.teu_capacity} onChange={e=>setF({...f,teu_capacity:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="88" /></div>
        <div className="col-span-2"><Label>Operatør</Label><Input value={f.operator} onChange={e=>setF({...f,operator:e.target.value})} className="bg-slate-800 border-slate-700" placeholder="DSB Cargo" /></div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={()=>onSave(f)} disabled={!f.track}>Opret Togslot</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

export default function PortInfraManager() {
  const [activeTab, setActiveTab] = useState("berth");
  const [showDialog, setShowDialog] = useState(false);
  const qc = useQueryClient();

  const { data: berths = [] } = useQuery({ queryKey: ["berths_mgr"], queryFn: () => base44.entities.Berth.list("-created_date", 50) });
  const { data: yards = [] } = useQuery({ queryKey: ["yards_mgr"], queryFn: () => base44.entities.YardZone.list("-created_date", 50) });
  const { data: gates = [] } = useQuery({ queryKey: ["gates_mgr"], queryFn: () => base44.entities.PortGate.list("-created_date", 20) });
  const { data: rails = [] } = useQuery({ queryKey: ["rails_mgr"], queryFn: () => base44.entities.RailSlot.list("-created_date", 30) });

  const saveMutations = {
    berth: useMutation({ mutationFn: d => base44.entities.Berth.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["berths_mgr"]}); setShowDialog(false); } }),
    yard: useMutation({ mutationFn: d => base44.entities.YardZone.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["yards_mgr"]}); setShowDialog(false); } }),
    gate: useMutation({ mutationFn: d => base44.entities.PortGate.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["gates_mgr"]}); setShowDialog(false); } }),
    rail: useMutation({ mutationFn: d => base44.entities.RailSlot.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["rails_mgr"]}); setShowDialog(false); } }),
  };

  const deleteMutations = {
    berth: useMutation({ mutationFn: id => base44.entities.Berth.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["berths_mgr"]}) }),
    yard: useMutation({ mutationFn: id => base44.entities.YardZone.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["yards_mgr"]}) }),
    gate: useMutation({ mutationFn: id => base44.entities.PortGate.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["gates_mgr"]}) }),
    rail: useMutation({ mutationFn: id => base44.entities.RailSlot.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["rails_mgr"]}) }),
  };

  const lists = { berth: berths, yard: yards, gate: gates, rail: rails };
  const currentList = lists[activeTab] || [];

  const statusColor = (s) => ({ available:"text-emerald-400", operational:"text-emerald-400", open:"text-emerald-400", planned:"text-purple-400", occupied:"text-amber-400", maintenance:"text-yellow-400", congested:"text-red-400", loading:"text-cyan-400" }[s] || "text-slate-400");

  return (
    <div className="mt-8 rounded-2xl bg-slate-800/40 border border-amber-500/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50" style={{ background: "rgba(245,158,11,0.06)" }}>
        <div className="flex items-center gap-3">
          <Anchor className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Port Infrastruktur</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-4 py-1.5 text-xs font-medium transition-all"
                style={{ background: activeTab === t.id ? "rgba(245,158,11,0.2)" : "transparent", color: activeTab === t.id ? "#f59e0b" : "#64748b" }}>
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-amber-600 hover:bg-amber-700 text-white" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Tilføj
          </Button>
        </div>
      </div>

      <div className="p-4">
        {currentList.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Anchor className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ingen {TABS.find(t=>t.id===activeTab)?.label} endnu. Klik "Tilføj" for at oprette.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentList.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{item.name || item.train_id || item.track}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.terminal || item.type?.replace("_"," ") || item.direction || ""}</p>
                  {item.status && <p className={`text-xs mt-1 font-medium ${statusColor(item.status)}`}>{item.status}</p>}
                  {item.length_m && <p className="text-xs text-slate-500">{item.length_m}m · {item.max_draft_m}m dybgang</p>}
                  {item.total_slots && <p className="text-xs text-slate-500">{item.occupied_slots||0}/{item.total_slots} slots</p>}
                  {item.lanes_total && <p className="text-xs text-slate-500">{item.lanes_open}/{item.lanes_total} baner · kø: {item.queue_trucks||0}</p>}
                  {item.wagons && <p className="text-xs text-slate-500">{item.wagons} vogne · {item.teu_capacity} TEU</p>}
                </div>
                <button onClick={() => { if(confirm("Slet?")) deleteMutations[activeTab].mutate(item.id); }} className="text-slate-600 hover:text-red-400 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tilføj {TABS.find(t=>t.id===activeTab)?.label}</DialogTitle></DialogHeader>
          {activeTab === "berth" && <BerthForm onSave={d => saveMutations.berth.mutate(d)} onClose={() => setShowDialog(false)} />}
          {activeTab === "yard" && <YardForm onSave={d => saveMutations.yard.mutate(d)} onClose={() => setShowDialog(false)} />}
          {activeTab === "gate" && <GateForm onSave={d => saveMutations.gate.mutate(d)} onClose={() => setShowDialog(false)} />}
          {activeTab === "rail" && <RailForm onSave={d => saveMutations.rail.mutate(d)} onClose={() => setShowDialog(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}