import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BusRouteEditor({ route, onSave, onClose }) {
  const [formData, setFormData] = useState(route || {
    route_number: "",
    route_name: "",
    route_type: "urban",
    frequency_minutes: 15,
    status: "active",
    estimated_duration_minutes: 45,
    total_distance_km: 12,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Route className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {route ? 'Edit Route' : 'Add New Route'}
              </h2>
              <p className="text-sm text-slate-400">Configure route details</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Route Number *</Label>
              <Input
                required
                value={formData.route_number}
                onChange={(e) => setFormData({...formData, route_number: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., 5A"
              />
            </div>
            <div>
              <Label className="text-slate-300">Route Name *</Label>
              <Input
                required
                value={formData.route_name}
                onChange={(e) => setFormData({...formData, route_name: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., City Center Loop"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Route Type</Label>
              <Select value={formData.route_type} onValueChange={(val) => setFormData({...formData, route_type: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="suburban">Suburban</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="airport">Airport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Frequency (min)</Label>
              <Input
                type="number"
                value={formData.frequency_minutes}
                onChange={(e) => setFormData({...formData, frequency_minutes: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Duration (min)</Label>
              <Input
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({...formData, estimated_duration_minutes: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.total_distance_km}
                onChange={(e) => setFormData({...formData, total_distance_km: parseFloat(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
              <Save className="w-4 h-4 mr-2" />
              {route ? 'Update' : 'Create'} Route
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}