import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function BusEditor({ bus, onSave, onClose }) {
  const [formData, setFormData] = useState(bus || {
    bus_number: "",
    registration_plate: "",
    bus_type: "city_bus",
    capacity: 50,
    status: "active",
    current_passengers: 0,
    fuel_level: 100,
    resource_id: "",
    heading: 0,
    speed: 0,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('-name', 100),
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Bus className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                {bus ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <p className="text-sm text-slate-400">Configure bus details</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Bus Number *</Label>
              <Input
                required
                value={formData.bus_number}
                onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., 5A"
              />
            </div>
            <div>
              <Label className="text-slate-300">Registration Plate</Label>
              <Input
                value={formData.registration_plate}
                onChange={(e) => setFormData({...formData, registration_plate: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., AB12345"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Bus Type *</Label>
              <Select value={formData.bus_type} onValueChange={(val) => setFormData({...formData, bus_type: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city_bus">City Bus</SelectItem>
                  <SelectItem value="articulated_bus">Articulated Bus</SelectItem>
                  <SelectItem value="double_decker">Double Decker</SelectItem>
                  <SelectItem value="minibus">Minibus</SelectItem>
                  <SelectItem value="electric_bus">Electric Bus</SelectItem>
                  <SelectItem value="hybrid_bus">Hybrid Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Capacity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Fuel Level (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.fuel_level}
                onChange={(e) => setFormData({...formData, fuel_level: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Resource / Depot *</Label>
            <Select value={formData.resource_id} onValueChange={(val) => setFormData({...formData, resource_id: val})}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Select a depot or parking location" />
              </SelectTrigger>
              <SelectContent>
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name} - {resource.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">Bus location will be set to the resource's coordinates</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
              <Save className="w-4 h-4 mr-2" />
              {bus ? 'Update' : 'Create'} Bus
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}