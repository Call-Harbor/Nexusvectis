import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Mail, Users, FileText, CheckSquare, Presentation, Send, Brain, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  task: CheckSquare,
  demo: Presentation,
  proposal_sent: Send,
  follow_up: CheckSquare,
  ai_insight: Brain
};

const activityColors = {
  call: "text-blue-400 bg-blue-500/10",
  email: "text-cyan-400 bg-cyan-500/10",
  meeting: "text-violet-400 bg-violet-500/10",
  note: "text-slate-400 bg-slate-500/10",
  task: "text-amber-400 bg-amber-500/10",
  demo: "text-emerald-400 bg-emerald-500/10",
  proposal_sent: "text-orange-400 bg-orange-500/10",
  follow_up: "text-pink-400 bg-pink-500/10",
  ai_insight: "text-violet-400 bg-violet-500/10"
};

export default function CRMActivityFeed({ activities, dealId, orgId, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: "note", title: "", description: "" });

  const handleAdd = async () => {
    if (!newActivity.title.trim()) return;
    await base44.entities.CRMActivity.create({
      organization_id: orgId,
      deal_id: dealId,
      ...newActivity,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
    setNewActivity({ type: "note", title: "", description: "" });
    setShowAdd(false);
    onRefresh();
    toast.success("Activity logged");
  };

  const handleComplete = async (activity) => {
    await base44.entities.CRMActivity.update(activity.id, { is_completed: true, completed_at: new Date().toISOString() });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold text-sm">Activity Timeline</h4>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(s => !s)} className="h-7 text-xs border-slate-600">
          <Plus className="w-3 h-3 mr-1" /> Log Activity
        </Button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-2">
          <select
            value={newActivity.type}
            onChange={e => setNewActivity(p => ({ ...p, type: e.target.value }))}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            {Object.keys(activityIcons).filter(t => t !== 'ai_insight').map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input
            value={newActivity.title}
            onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
            placeholder="Activity title..."
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-slate-500"
          />
          <textarea
            value={newActivity.description}
            onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))}
            placeholder="Notes or outcome..."
            rows={2}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-slate-500 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-700 text-xs">Save</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="text-xs border-slate-600">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {activities.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No activities yet</p>
        )}
        {activities.map(activity => {
          const Icon = activityIcons[activity.type] || FileText;
          const colorClass = activityColors[activity.type] || activityColors.note;
          return (
            <div key={activity.id} className="flex gap-3 p-2.5 bg-slate-800/30 rounded-lg group">
              <div className={`p-1.5 rounded-lg ${colorClass} flex-shrink-0 h-fit`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-xs font-medium truncate">{activity.title}</p>
                  {activity.ai_generated && <Badge className="text-[9px] bg-violet-500/20 text-violet-300 border-violet-500/30">AI</Badge>}
                </div>
                {activity.description && <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">{activity.description}</p>}
                <p className="text-slate-600 text-[10px] mt-1">
                  {new Date(activity.created_date || activity.completed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!activity.is_completed && (
                <button onClick={() => handleComplete(activity)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-all flex-shrink-0">
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}