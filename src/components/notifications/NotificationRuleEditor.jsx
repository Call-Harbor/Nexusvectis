import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Mail, Bell, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ENTITY_FIELDS = {
  Vehicle: [
    { key: "status", label: "Status", operators: ["equals", "not_equals", "changes_to"], values: ["active", "idle", "maintenance", "offline"] },
    { key: "fuel_level", label: "Brændstofniveau (%)", operators: ["less_than", "greater_than"] },
    { key: "speed", label: "Hastighed (km/h)", operators: ["less_than", "greater_than"] },
    { key: "type", label: "Type", operators: ["equals", "not_equals"], values: ["truck", "ship", "drone", "train", "aircraft"] },
    { key: "efficiency_score", label: "Effektivitetsscore", operators: ["less_than", "greater_than"] },
  ],
  Shipment: [
    { key: "status", label: "Status", operators: ["equals", "not_equals", "changes_to"], values: ["pending", "in_transit", "delayed", "delivered", "cancelled"] },
    { key: "priority", label: "Prioritet", operators: ["equals"], values: ["low", "normal", "high", "urgent"] },
    { key: "cargo_type", label: "Cargo-type", operators: ["equals"], values: ["general", "cold_chain", "hazardous", "fragile", "bulk"] },
    { key: "current_temperature", label: "Temperatur (°C)", operators: ["less_than", "greater_than"] },
    { key: "eta_confidence", label: "ETA-tillid (%)", operators: ["less_than", "greater_than"] },
  ],
  Route: [
    { key: "status", label: "Status", operators: ["equals", "not_equals", "changes_to"], values: ["planned", "active", "completed", "delayed"] },
    { key: "priority", label: "Prioritet", operators: ["equals"], values: ["low", "normal", "high", "critical"] },
    { key: "transport_type", label: "Transporttype", operators: ["equals"], values: ["truck", "ship", "drone", "train", "aircraft"] },
  ],
  Alert: [
    { key: "type", label: "Type", operators: ["equals"], values: ["info", "warning", "critical", "success"] },
    { key: "category", label: "Kategori", operators: ["equals"], values: ["maintenance", "delay", "weather", "fuel", "route", "system"] },
    { key: "is_resolved", label: "Løst", operators: ["equals"], values: ["true", "false"] },
  ],
  Maintenance: [
    { key: "priority", label: "Prioritet", operators: ["equals", "changes_to"], values: ["low", "medium", "high", "critical"] },
    { key: "status", label: "Status", operators: ["equals", "changes_to"], values: ["pending", "in_progress", "completed", "cancelled"] },
    { key: "type", label: "Type", operators: ["equals"], values: ["scheduled", "predictive", "emergency"] },
    { key: "ai_confidence", label: "AI-tillid (%)", operators: ["less_than", "greater_than"] },
  ],
  Exception: [
    { key: "severity", label: "Alvorlighed", operators: ["equals", "changes_to"], values: ["low", "medium", "high", "critical"] },
    { key: "status", label: "Status", operators: ["equals", "changes_to"], values: ["detected", "analyzing", "action_taken", "resolved", "escalated"] },
    { key: "type", label: "Type", operators: ["equals"], values: ["delay", "shortage", "damage", "route_blocked", "weather", "mechanical", "customs"] },
  ],
};

const OPERATOR_LABELS = {
  equals: "er lig med",
  not_equals: "er ikke lig med",
  contains: "indeholder",
  less_than: "er mindre end",
  greater_than: "er større end",
  changes_to: "skifter til",
};

const DEFAULT_TEMPLATES = {
  Vehicle: "Køretøj {{name}} ({{type}}): {{status}} — Hastighed: {{speed}} km/h, Brændstof: {{fuel_level}}%",
  Shipment: "Forsendelse {{tracking_number}} fra {{origin}} → {{destination}}: Status er {{status}}. Kunde: {{customer_name}}",
  Route: "Rute {{name}} ({{origin}} → {{destination}}): {{status}}",
  Alert: "Alert: {{title}} — {{message}}",
  Maintenance: "Vedligehold på {{component}}: {{description}} — Prioritet: {{priority}}",
  Exception: "Undtagelse: {{title}} — Alvorlighed: {{severity}}",
};

export default function NotificationRuleEditor({ rule, onSave, onClose, open }) {
  const isNew = !rule?.id;
  const [form, setForm] = useState({
    name: rule?.name || "",
    is_active: rule?.is_active ?? true,
    entity_type: rule?.entity_type || "Vehicle",
    event_type: rule?.event_type || "status_change",
    conditions: rule?.conditions || [],
    channels: rule?.channels || { in_app: true, email: false, email_address: "" },
    severity: rule?.severity || "info",
    message_template: rule?.message_template || "",
    cooldown_minutes: rule?.cooldown_minutes ?? 60,
  });
  const [saving, setSaving] = useState(false);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addCondition = () => {
    const fields = ENTITY_FIELDS[form.entity_type] || [];
    if (!fields.length) return;
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: fields[0].key, operator: fields[0].operators[0], value: "" }]
    }));
  };

  const updateCondition = (idx, key, value) => {
    setForm(prev => {
      const conds = [...prev.conditions];
      conds[idx] = { ...conds[idx], [key]: value };
      // Reset value when field changes
      if (key === "field") conds[idx].value = "";
      return { ...prev, conditions: conds };
    });
  };

  const removeCondition = (idx) => {
    setForm(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Regel-navn er påkrævet"); return; }
    if (!form.channels.in_app && !form.channels.email) { toast.error("Vælg mindst én leveringskanal"); return; }
    if (form.channels.email && !form.channels.email_address) { toast.error("E-mail adresse er påkrævet for e-mail kanal"); return; }

    setSaving(true);
    await onSave({
      ...form,
      message_template: form.message_template || DEFAULT_TEMPLATES[form.entity_type],
    });
    setSaving(false);
  };

  const fields = ENTITY_FIELDS[form.entity_type] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{isNew ? "Opret notifikationsregel" : "Rediger notifikationsregel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name & Active */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-slate-300 text-xs mb-1.5 block">Regel-navn *</Label>
              <Input
                value={form.name}
                onChange={e => updateForm("name", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="f.eks. Kritisk brændstofniveau"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.is_active} onCheckedChange={v => updateForm("is_active", v)} />
              <Label className="text-slate-300 text-sm">Aktiv</Label>
            </div>
          </div>

          {/* Entity & Event */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Overvåg enhedstype</Label>
              <Select value={form.entity_type} onValueChange={v => { updateForm("entity_type", v); updateForm("conditions", []); updateForm("message_template", ""); }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ENTITY_FIELDS).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Begivenhedstype</Label>
              <Select value={form.event_type} onValueChange={v => updateForm("event_type", v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Ny post oprettet</SelectItem>
                  <SelectItem value="update">Post opdateret</SelectItem>
                  <SelectItem value="status_change">Statusændring</SelectItem>
                  <SelectItem value="threshold">Grænseværdi overskredet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300 text-xs">Betingelser (alle skal opfyldes)</Label>
              <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 h-7 text-xs gap-1" onClick={addCondition}>
                <Plus className="w-3 h-3" /> Tilføj betingelse
              </Button>
            </div>
            {form.conditions.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Ingen betingelser — reglen vil udløses for alle {form.entity_type}-hændelser</p>
            ) : (
              <div className="space-y-2">
                {form.conditions.map((cond, idx) => {
                  const fieldDef = fields.find(f => f.key === cond.field) || fields[0];
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-800/60 rounded-lg p-2">
                      <Select value={cond.field} onValueChange={v => updateCondition(idx, "field", v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={cond.operator} onValueChange={v => updateCondition(idx, "operator", v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(fieldDef?.operators || ["equals"]).map(op => (
                            <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldDef?.values ? (
                        <Select value={cond.value} onValueChange={v => updateCondition(idx, "value", v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs flex-1">
                            <SelectValue placeholder="Vælg..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldDef.values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={cond.value}
                          onChange={e => updateCondition(idx, "value", e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white h-8 text-xs flex-1"
                          placeholder="Værdi..."
                        />
                      )}
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-500 hover:text-rose-400 flex-shrink-0" onClick={() => removeCondition(idx)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Severity */}
          <div>
            <Label className="text-slate-300 text-xs mb-1.5 block">Alvorlighed</Label>
            <div className="flex gap-2">
              {["info", "warning", "critical"].map(s => (
                <button
                  key={s}
                  onClick={() => updateForm("severity", s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.severity === s
                      ? s === "critical" ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                        : s === "warning" ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "border-slate-700 text-slate-500 hover:border-slate-600"
                  }`}
                >
                  {s === "critical" ? "Kritisk" : s === "warning" ? "Advarsel" : "Info"}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <Label className="text-slate-300 text-xs mb-2 block">Leveringskanaler</Label>
            <div className="space-y-3 bg-slate-800/40 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.channels.in_app} onCheckedChange={v => updateForm("channels", { ...form.channels, in_app: v })} />
                <Bell className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-sm text-white">In-app notifikation</p>
                  <p className="text-xs text-slate-500">Vises i notifikationsklokken øverst</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.channels.email} onCheckedChange={v => updateForm("channels", { ...form.channels, email: v })} />
                <Mail className="w-4 h-4 text-violet-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">E-mail notifikation</p>
                  <p className="text-xs text-slate-500">Send en e-mail til en adresse</p>
                </div>
              </div>
              {form.channels.email && (
                <Input
                  value={form.channels.email_address}
                  onChange={e => updateForm("channels", { ...form.channels, email_address: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white text-sm ml-10"
                  placeholder="email@example.com"
                  type="email"
                />
              )}
            </div>
          </div>

          {/* Message Template */}
          <div>
            <Label className="text-slate-300 text-xs mb-1.5 block">
              Beskedskabelon <span className="text-slate-600">(valgfri — brug {"{{felt}}"} for dynamiske værdier)</span>
            </Label>
            <Textarea
              value={form.message_template}
              onChange={e => updateForm("message_template", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-xs"
              placeholder={DEFAULT_TEMPLATES[form.entity_type]}
              rows={2}
            />
          </div>

          {/* Cooldown */}
          <div>
            <Label className="text-slate-300 text-xs mb-1.5 block">Afkøling (minutter mellem notifikationer)</Label>
            <Input
              type="number"
              value={form.cooldown_minutes}
              onChange={e => updateForm("cooldown_minutes", parseInt(e.target.value) || 0)}
              className="bg-slate-800 border-slate-700 text-white w-32"
              min={0}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <Button variant="ghost" onClick={onClose} className="text-slate-400">Annuller</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isNew ? "Opret regel" : "Gem ændringer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}