import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Ship, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABS = [
  { id: "vessel", label: "Skibe (Vessels)" },
  { id: "crane", label: "Kraner" },
  { id: "equipment", label: "Havn-udstyr" },
];

function VesselForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", imo: "", type: "container", operator: "", service: "", flag: "", length_m: "", teu_capacity: "", status: "at_sea", shore_power_capable: false });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Skibsnavn *</Label><Input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="MSC AURORA" /></div>
        <div><Label>IMO Nummer</Label><Input value={f.imo} onChange={e => setF({...f, imo: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="9876543" /></div>
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={v => setF({...f, type: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="container">Container</SelectItem>
              <SelectItem value="roro">RoRo</SelectItem>
              <SelectItem value="bulk">Bulk</SelectItem>
              <SelectItem value="tanker">Tanker</SelectItem>
              <SelectItem value="general_cargo">General Cargo</SelectItem>
              <SelectItem value="cruise">Cruise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v => setF({...f, status: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="at_sea">At Sea</SelectItem>
              <SelectItem value="approaching">Approaching</SelectItem>
              <SelectItem value="berthed">Berthed</SelectItem>
              <SelectItem value="departing">Departing</SelectItem>
              <SelectItem value="anchored">Anchored</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Rederi/Operatør</Label><Input value={f.operator} onChange={e => setF({...f, operator: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Maersk" /></div>
        <div><Label>Servicelinje</Label><Input value={f.service} onChange={e => setF({...f, service: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="AE-1" /></div>
        <div><Label>Flagstat</Label><Input value={f.flag} onChange={e => setF({...f, flag: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Denmark" /></div>
        <div><Label>Længde (m)</Label><Input type="number" value={f.length_m} onChange={e => setF({...f, length_m: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="347" /></div>
        <div><Label>TEU Kapacitet</Label><Input type="number" value={f.teu_capacity} onChange={e => setF({...f, teu_capacity: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="11000" /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={f.shore_power_capable} onChange={e => setF({...f, shore_power_capable: e.target.checked})} id="shore" />
        <Label htmlFor="shore">Shore Power Capable</Label>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => onSave(f)} disabled={!f.name}>Opret Skib</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

function CraneForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", type: "STS", status: "available", moves_per_hour: "", outreach_m: "", max_lift_tons: "", year_installed: "" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Kranenavn *</Label><Input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="STS-01" /></div>
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={v => setF({...f, type: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="STS">STS (Ship-to-Shore)</SelectItem>
              <SelectItem value="RTG">RTG (Rubber Tyred Gantry)</SelectItem>
              <SelectItem value="RMG">RMG (Rail Mounted Gantry)</SelectItem>
              <SelectItem value="mobile">Mobile Kran</SelectItem>
              <SelectItem value="reachstacker">Reachstacker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v => setF({...f, status: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
              <SelectItem value="standby">Standby</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Moves/time (kapacitet)</Label><Input type="number" value={f.moves_per_hour} onChange={e => setF({...f, moves_per_hour: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="30" /></div>
        <div><Label>Rækkevidde (m)</Label><Input type="number" value={f.outreach_m} onChange={e => setF({...f, outreach_m: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="65" /></div>
        <div><Label>Max løft (tons)</Label><Input type="number" value={f.max_lift_tons} onChange={e => setF({...f, max_lift_tons: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="65" /></div>
        <div><Label>Installationsår</Label><Input type="number" value={f.year_installed} onChange={e => setF({...f, year_installed: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="2020" /></div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => onSave(f)} disabled={!f.name}>Opret Kran</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

function EquipmentForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", type: "terminal_tractor", status: "available", fuel_type: "diesel", operator_name: "" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Navn *</Label><Input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="TT-01" /></div>
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={v => setF({...f, type: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="terminal_tractor">Terminal Traktor</SelectItem>
              <SelectItem value="reachstacker">Reachstacker</SelectItem>
              <SelectItem value="straddle_carrier">Straddle Carrier</SelectItem>
              <SelectItem value="AGV">AGV (Autonom)</SelectItem>
              <SelectItem value="forklift">Gaffeltruck</SelectItem>
              <SelectItem value="empty_handler">Empty Handler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Brændstof</Label>
          <Select value={f.fuel_type} onValueChange={v => setF({...f, fuel_type: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="electric">Elektrisk</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="hydrogen">Hydrogen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v => setF({...f, status: v})}>
            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Operatør</Label><Input value={f.operator_name} onChange={e => setF({...f, operator_name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Jens K." /></div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => onSave(f)} disabled={!f.name}>Opret Udstyr</Button>
        <Button variant="outline" className="border-slate-700 text-white" onClick={onClose}>Annuller</Button>
      </div>
    </div>
  );
}

export default function PortFleetManager() {
  const [activeTab, setActiveTab] = useState("vessel");
  const [showDialog, setShowDialog] = useState(false);
  const qc = useQueryClient();

  const { data: vessels = [] } = useQuery({ queryKey: ["vessels_port"], queryFn: () => base44.entities.Vessel.list("-created_date", 100) });
  const { data: cranes = [] } = useQuery({ queryKey: ["cranes_port"], queryFn: () => base44.entities.PortCrane.list("-created_date", 100) });
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment_port"], queryFn: () => base44.entities.PortEquipment.list("-created_date", 100) });

  const saveMutations = {
    vessel: useMutation({ mutationFn: d => base44.entities.Vessel.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["vessels_port"]}); setShowDialog(false); } }),
    crane: useMutation({ mutationFn: d => base44.entities.PortCrane.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["cranes_port"]}); setShowDialog(false); } }),
    equipment: useMutation({ mutationFn: d => base44.entities.PortEquipment.create(d), onSuccess: () => { qc.invalidateQueries({queryKey:["equipment_port"]}); setShowDialog(false); } }),
  };

  const deleteMutations = {
    vessel: useMutation({ mutationFn: id => base44.entities.Vessel.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["vessels_port"]}) }),
    crane: useMutation({ mutationFn: id => base44.entities.PortCrane.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["cranes_port"]}) }),
    equipment: useMutation({ mutationFn: id => base44.entities.PortEquipment.delete(id), onSuccess: () => qc.invalidateQueries({queryKey:["equipment_port"]}) }),
  };

  const lists = { vessel: vessels, crane: cranes, equipment: equipment };
  const currentList = lists[activeTab] || [];

  const statusColor = (s) => ({ working: "text-emerald-400", available: "text-cyan-400", maintenance: "text-amber-400", breakdown: "text-red-400", berthed: "text-cyan-400", at_sea: "text-blue-400", approaching: "text-yellow-400" }[s] || "text-slate-400");

  return (
    <div className="mt-8 rounded-2xl bg-slate-800/40 border border-cyan-500/20 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50" style={{ background: "rgba(6,182,212,0.06)" }}>
        <div className="flex items-center gap-3">
          <Ship className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Port Fleet</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-4 py-1.5 text-xs font-medium transition-all"
                style={{ background: activeTab === t.id ? "rgba(6,182,212,0.2)" : "transparent", color: activeTab === t.id ? "#06b6d4" : "#64748b" }}>
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Tilføj
          </Button>
        </div>
      </div>

      <div className="p-4">
        {currentList.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Ship className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ingen {TABS.find(t=>t.id===activeTab)?.label} endnu. Klik "Tilføj" for at oprette.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentList.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.type?.replace("_"," ")}</p>
                  {item.status && <p className={`text-xs mt-1 font-medium ${statusColor(item.status)}`}>{item.status}</p>}
                  {item.operator && <p className="text-xs text-slate-500">{item.operator}</p>}
                  {item.moves_per_hour && <p className="text-xs text-slate-500">{item.moves_per_hour} mv/h</p>}
                  {item.teu_capacity && <p className="text-xs text-slate-500">{item.teu_capacity} TEU</p>}
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
          {activeTab === "vessel" && <VesselForm onSave={d => saveMutations.vessel.mutate(d)} onClose={() => setShowDialog(false)} />}
          {activeTab === "crane" && <CraneForm onSave={d => saveMutations.crane.mutate(d)} onClose={() => setShowDialog(false)} />}
          {activeTab === "equipment" && <EquipmentForm onSave={d => saveMutations.equipment.mutate(d)} onClose={() => setShowDialog(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}