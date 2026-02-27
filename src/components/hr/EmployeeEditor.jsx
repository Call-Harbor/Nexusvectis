import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, User, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = ["Operations", "Logistics", "Fleet", "Finance", "HR", "IT", "Sales", "Management"];
const EMP_TYPES = [
  { value: "full_time", label: "Fuldtid" },
  { value: "part_time", label: "Deltid" },
  { value: "contractor", label: "Konsulent" },
  { value: "intern", label: "Praktikant" },
];
const STATUSES = [
  { value: "active", label: "Aktiv" },
  { value: "probation", label: "Prøvetid" },
  { value: "on_leave", label: "På orlov" },
  { value: "terminated", label: "Fratrådt" },
];

export default function EmployeeEditor({ employee, orgId, onSave, onClose }) {
  const isEdit = !!employee?.id;
  const [form, setForm] = useState(employee || {
    organization_id: orgId,
    first_name: "", last_name: "", email: "", phone: "",
    job_title: "", department: "Operations", employment_type: "full_time",
    status: "active", hire_date: "", location: "", salary: "", currency: "EUR",
    manager_name: "", skills: [], notes: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    leave_balance: { annual: 25, sick: 10, personal: 3 }
  });
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addSkill = () => {
    if (!newSkill.trim()) return;
    set("skills", [...(form.skills || []), newSkill.trim()]);
    setNewSkill("");
  };

  const removeSkill = (i) => set("skills", form.skills.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    if (isEdit) {
      await base44.entities.Employee.update(employee.id, form);
    } else {
      await base44.entities.Employee.create(form);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-white font-semibold">{isEdit ? "Rediger medarbejder" : "Ny medarbejder"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal info */}
          <Section title="Personlige oplysninger">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fornavn *">
                <Input value={form.first_name} onChange={e => set("first_name", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Efternavn *">
                <Input value={form.last_name} onChange={e => set("last_name", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="E-mail *">
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Telefon">
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Medarbejder ID">
                <Input value={form.employee_id || ""} onChange={e => set("employee_id", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Lokation">
                <Input value={form.location || ""} onChange={e => set("location", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
            </div>
          </Section>

          {/* Job info */}
          <Section title="Joboplysninger">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stilling">
                <Input value={form.job_title || ""} onChange={e => set("job_title", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Afdeling *">
                <Select value={form.department} onValueChange={v => set("department", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ansættelsestype">
                <Select value={form.employment_type} onValueChange={v => set("employment_type", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {EMP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ansættelsesdato">
                <Input type="date" value={form.hire_date || ""} onChange={e => set("hire_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Leder">
                <Input value={form.manager_name || ""} onChange={e => set("manager_name", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
            </div>
          </Section>

          {/* Salary */}
          <Section title="Løn & økonomi">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label="Årsløn">
                  <Input type="number" value={form.salary || ""} onChange={e => set("salary", Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-white" />
                </Field>
              </div>
              <Field label="Valuta">
                <Select value={form.currency || "EUR"} onValueChange={v => set("currency", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {["EUR", "DKK", "USD", "GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* Leave balance */}
          <Section title="Orlovssaldo">
            <div className="grid grid-cols-3 gap-4">
              {[["annual", "Ferie"], ["sick", "Sygedage"], ["personal", "Personlig orlov"]].map(([k, label]) => (
                <Field key={k} label={label}>
                  <Input
                    type="number"
                    value={form.leave_balance?.[k] ?? ""}
                    onChange={e => set("leave_balance", { ...form.leave_balance, [k]: Number(e.target.value) })}
                    className="bg-slate-800/60 border-slate-700 text-white"
                  />
                </Field>
              ))}
            </div>
          </Section>

          {/* Skills */}
          <Section title="Kompetencer">
            <div className="flex gap-2 mb-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Tilføj kompetence..."
                className="bg-slate-800/60 border-slate-700 text-white"
                onKeyDown={e => e.key === "Enter" && addSkill()}
              />
              <Button size="sm" onClick={addSkill} className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((s, i) => (
                <span key={i} className="flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-full">
                  {s}
                  <button onClick={() => removeSkill(i)}><X className="w-3 h-3 text-slate-500 hover:text-rose-400" /></button>
                </span>
              ))}
            </div>
          </Section>

          {/* Emergency contact */}
          <Section title="Nødkontakt">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Navn">
                <Input value={form.emergency_contact_name || ""} onChange={e => set("emergency_contact_name", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
              <Field label="Telefon">
                <Input value={form.emergency_contact_phone || ""} onChange={e => set("emergency_contact_phone", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white" />
              </Field>
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Annuller</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Gemmer..." : "Gem medarbejder"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-800" />
        {title}
        <span className="flex-1 h-px bg-slate-800" />
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      {children}
    </div>
  );
}