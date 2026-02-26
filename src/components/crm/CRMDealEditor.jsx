import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, X, Save, Trash2, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CRMActivityFeed from "./CRMActivityFeed";
import ReactMarkdown from "react-markdown";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const SOURCES = ["inbound", "outbound", "referral", "partner", "website", "linkedin", "cold_call", "other"];

export default function CRMDealEditor({ deal, orgId, onClose, onSave }) {
  const [form, setForm] = useState(deal || {
    title: "", stage: "lead", value: "", probability: 50,
    contact_name: "", contact_email: "", contact_phone: "",
    company_name: "", expected_close_date: "", source: "inbound", notes: ""
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: activities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['crm-activities', deal?.id],
    queryFn: () => base44.entities.CRMActivity.filter({ deal_id: deal.id }, '-created_date', 50),
    enabled: !!deal?.id
  });

  const runAIScoring = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert B2B sales coach. Score this deal and provide recommendations.

DEAL:
- Title: ${form.title}
- Stage: ${form.stage}
- Value: €${form.value}
- Company: ${form.company_name}
- Contact: ${form.contact_name}
- Source: ${form.source}
- Expected close: ${form.expected_close_date}
- Notes: ${form.notes}

Activities logged: ${activities.length}

Return JSON with:
{
  "ai_score": 0-100 (overall deal health),
  "probability": 0-100 (win probability),
  "ai_risk_level": "low"|"medium"|"high"|"critical",
  "ai_next_action": "specific next action (max 100 chars)",
  "ai_insights": "2-3 sentence analysis"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          ai_score: { type: "number" },
          probability: { type: "number" },
          ai_risk_level: { type: "string" },
          ai_next_action: { type: "string" },
          ai_insights: { type: "string" }
        }
      }
    });
    setForm(prev => ({ ...prev, ...result }));
    setAiLoading(false);
    toast.success("AI scoring complete");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const data = { ...form, organization_id: orgId, value: Number(form.value) || 0 };
    if (deal?.id) {
      await base44.entities.CRMDeal.update(deal.id, data);
    } else {
      await base44.entities.CRMDeal.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    setSaving(false);
    toast.success(deal?.id ? "Deal updated" : "Deal created");
    onSave();
  };

  const handleDelete = async () => {
    if (!deal?.id) return;
    if (!window.confirm("Delete this deal?")) return;
    await base44.entities.CRMDeal.delete(deal.id);
    queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    toast.success("Deal deleted");
    onClose();
  };

  const f = (field) => ({ value: form[field] || '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="text-white font-bold text-lg">{deal?.id ? 'Edit Deal' : 'New Deal'}</h2>
          <div className="flex gap-2">
            {deal?.id && (
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Basic info */}
          <Input {...f('title')} placeholder="Deal title *" className="bg-slate-800/50 border-slate-700 text-white" />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Stage</label>
              <select
                value={form.stage}
                onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Source</label>
              <select
                value={form.source}
                onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Value (EUR)</label>
              <Input {...f('value')} type="number" placeholder="0" className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Expected Close</label>
              <Input {...f('expected_close_date')} type="date" className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input {...f('company_name')} placeholder="Company name" className="bg-slate-800/50 border-slate-700 text-white" />
            <Input {...f('contact_name')} placeholder="Contact name" className="bg-slate-800/50 border-slate-700 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input {...f('contact_email')} placeholder="Contact email" className="bg-slate-800/50 border-slate-700 text-white" />
            <Input {...f('contact_phone')} placeholder="Contact phone" className="bg-slate-800/50 border-slate-700 text-white" />
          </div>

          <textarea
            {...f('notes')}
            placeholder="Notes..."
            rows={2}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 resize-none"
          />

          {/* AI Scoring */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-white text-sm font-semibold">AI Deal Intelligence</span>
              </div>
              <Button size="sm" onClick={runAIScoring} disabled={aiLoading} className="bg-violet-600 hover:bg-violet-700 text-xs h-7">
                {aiLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                {aiLoading ? 'Scoring...' : 'Score Deal'}
              </Button>
            </div>
            {form.ai_score != null && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-[10px] mb-0.5">AI Score</p>
                  <p className={`text-lg font-bold ${form.ai_score >= 70 ? 'text-emerald-400' : form.ai_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{form.ai_score}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-[10px] mb-0.5">Win %</p>
                  <p className="text-lg font-bold text-cyan-400">{form.probability}%</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-[10px] mb-0.5">Risk</p>
                  <p className={`text-sm font-bold capitalize ${form.ai_risk_level === 'low' ? 'text-emerald-400' : form.ai_risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{form.ai_risk_level}</p>
                </div>
              </div>
            )}
            {form.ai_next_action && (
              <div className="bg-slate-800/50 rounded-lg p-2 mb-2">
                <p className="text-[10px] text-slate-400 mb-1">Next Action</p>
                <p className="text-white text-xs">{form.ai_next_action}</p>
              </div>
            )}
            {form.ai_insights && (
              <p className="text-slate-300 text-xs leading-relaxed">{form.ai_insights}</p>
            )}
          </div>

          {/* Activity feed (existing deals only) */}
          {deal?.id && (
            <div className="border-t border-slate-700/50 pt-4">
              <CRMActivityFeed
                activities={activities}
                dealId={deal.id}
                orgId={orgId}
                onRefresh={refetchActivities}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-slate-700/50">
          <Button variant="outline" onClick={onClose} className="border-slate-600">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cyan-600 to-violet-600">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {deal?.id ? 'Save Changes' : 'Create Deal'}
          </Button>
        </div>
      </div>
    </div>
  );
}