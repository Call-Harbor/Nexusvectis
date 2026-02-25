import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActivityPanel({ customerId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "call",
    subject: "",
    description: "",
    activity_date: new Date().toISOString().split('T')[0],
    priority: "medium"
  });

  useEffect(() => {
    loadActivities();
  }, [customerId]);

  const loadActivities = async () => {
    if (!customerId) return;
    setLoading(true);
    const data = await base44.entities.Activity.filter({
      customer_id: customerId
    });
    setActivities(data ? data.sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date)) : []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await base44.auth.me();
    await base44.entities.Activity.create({
      ...formData,
      customer_id: customerId,
      organization_id: user.organization_id,
      assigned_to: user.email,
      status: "planned"
    });
    setFormData({ activity_type: "call", subject: "", description: "", activity_date: new Date().toISOString().split('T')[0], priority: "medium" });
    setShowForm(false);
    loadActivities();
  };

  const handleComplete = async (id) => {
    await base44.entities.Activity.update(id, {
      status: "completed",
      completed_date: new Date().toISOString()
    });
    loadActivities();
  };

  const handleDelete = async (id) => {
    await base44.entities.Activity.delete(id);
    loadActivities();
  };

  const typeIcons = {
    call: "☎️",
    email: "📧",
    meeting: "📅",
    task: "✓",
    note: "📝",
    follow_up: "🔔"
  };

  const typeLabels = {
    call: "Opkald",
    email: "E-mail",
    meeting: "Møde",
    task: "Opgave",
    note: "Notat",
    follow_up: "Opfølgning"
  };

  if (loading) return <div className="text-slate-400">Indlæser aktiviteter...</div>;

  const openActivities = activities.filter(a => a.status !== "completed");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Aktiviteter ({openActivities.length})</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tilføj
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.activity_type} onValueChange={(value) => setFormData({...formData, activity_type: value})}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="call">Opkald</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="meeting">Møde</SelectItem>
                  <SelectItem value="task">Opgave</SelectItem>
                  <SelectItem value="note">Notat</SelectItem>
                  <SelectItem value="follow_up">Opfølgning</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="low">Lav</SelectItem>
                  <SelectItem value="medium">Normal</SelectItem>
                  <SelectItem value="high">Høj</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Emne"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="bg-slate-900 border-slate-700"
              required
            />
            <textarea
              placeholder="Beskrivelse"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
              rows="3"
            />
            <Input
              type="date"
              value={formData.activity_date}
              onChange={(e) => setFormData({...formData, activity_date: e.target.value})}
              className="bg-slate-900 border-slate-700"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-cyan-600">Gemme</Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1">Annuller</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {activities.map((activity) => (
          <Card key={activity.id} className={`p-4 border-slate-700 ${activity.status === "completed" ? "bg-slate-900/50 opacity-60" : "bg-slate-800"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{typeIcons[activity.activity_type]}</span>
                  <h4 className="font-semibold text-white">{activity.subject}</h4>
                </div>
                <p className="text-sm text-slate-400 mb-2">{typeLabels[activity.activity_type]}</p>
                {activity.description && <p className="text-sm text-slate-300 mb-2">{activity.description}</p>}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(activity.activity_date).toLocaleDateString('da-DK')}
                </div>
              </div>
              <div className="flex gap-2">
                {activity.status !== "completed" && (
                  <Button
                    onClick={() => handleComplete(activity.id)}
                    size="icon"
                    variant="ghost"
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(activity.id)}
                  size="icon"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}