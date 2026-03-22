import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BusStopEditor({ stop, onSave, onClose }) {
  const [formData, setFormData] = useState(stop || {
    stop_code: "",
    stop_name: "",
    latitude: 55.6761,
    longitude: 12.5683,
    address: "",
    zone: "1",
    stop_type: "standard",
    accessibility: true,
    status: "active",
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {stop ? 'Edit Stop' : 'Add New Stop'}
              </h2>
              <p className="text-sm text-slate-400">Configure stop details</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Stop Code *</Label>
              <Input
                required
                value={formData.stop_code}
                onChange={(e) => setFormData({...formData, stop_code: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., ST001"
              />
            </div>
            <div>
              <Label className="text-slate-300">Stop Name *</Label>
              <Input
                required
                value={formData.stop_name}
                onChange={(e) => setFormData({...formData, stop_name: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
                placeholder="e.g., Central Station"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="bg-slate-800/50 border-slate-700"
              placeholder="Full address"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Latitude *</Label>
              <Input
                required
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Longitude *</Label>
              <Input
                required
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Zone</Label>
              <Input
                value={formData.zone}
                onChange={(e) => setFormData({...formData, zone: e.target.value})}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300">Stop Type</Label>
              <Select value={formData.stop_type} onValueChange={(val) => setFormData({...formData, stop_type: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="station">Station</SelectItem>
                  <SelectItem value="terminal">Terminal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Save className="w-4 h-4 mr-2" />
              {stop ? 'Update' : 'Create'} Stop
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}