import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function MaintenanceEditor({ maintenance, vehicles, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    type: "scheduled",
    priority: "medium",
    component: "",
    description: "",
    scheduled_date: moment().add(7, 'days').format('YYYY-MM-DD'),
    cost_estimate: 0,
    downtime_hours: 0,
    status: "pending",
    ...maintenance
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.component) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        organization_id: user.organization_id
      };

      if (maintenance?.id) {
        await base44.entities.Maintenance.update(maintenance.id, data);
        toast.success("Maintenance updated");
      } else {
        await base44.entities.Maintenance.create(data);
        toast.success("Maintenance scheduled");
      }
      
      onSave();
    } catch (error) {
      toast.error("Error saving maintenance");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onClose} variant="outline" size="icon" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{maintenance ? "Edit Maintenance" : "Schedule Maintenance"}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Select Vehicle *</Label>
                <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Choose a vehicle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="predictive">Predictive</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Maintenance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Component *</Label>
                <Input value={formData.component} onChange={(e) => setFormData({...formData, component: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" placeholder="e.g., Engine, Brakes, Transmission" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Scheduled Date</Label>
                  <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Cost Estimate (€)</Label>
                  <Input type="number" value={formData.cost_estimate} onChange={(e) => setFormData({...formData, cost_estimate: parseFloat(e.target.value)})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Downtime (hours)</Label>
                  <Input type="number" value={formData.downtime_hours} onChange={(e) => setFormData({...formData, downtime_hours: parseFloat(e.target.value)})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-cyan-600 to-violet-600">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}