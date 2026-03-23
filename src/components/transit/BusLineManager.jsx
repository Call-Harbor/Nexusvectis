import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Network, Plus, X, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BusLineManager({ organizationId, lines = [], stops = [] }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    line_number: "",
    line_name: "",
    status: "active"
  });

  const queryClient = useQueryClient();

  const createLineMutation = useMutation({
    mutationFn: (data) => base44.entities.BusLine.create({
      ...data,
      organization_id: organizationId,
      directions: [],
      service_windows: [],
      daily_trips: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busLines'] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Bus line created');
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (id) => base44.entities.BusLine.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busLines'] });
      toast.success('Bus line deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      line_number: "",
      line_name: "",
      status: "active"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Network className="w-7 h-7 text-violet-400" />
          Bus Lines ({lines.length})
        </h3>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Line
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lines.map((line, i) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-bold text-lg">Line {line.line_number}</h4>
                <p className="text-sm text-slate-400">{line.line_name}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-400"
                onClick={() => {
                  if (confirm('Delete this line?')) {
                    deleteLineMutation.mutate(line.id);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Badge className={
                line.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                line.status === 'suspended' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {line.status}
              </Badge>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Directions</p>
                  <p className="text-white font-semibold">{line.directions?.length || 0}</p>
                </div>
                <div className="p-2 rounded bg-slate-900/50">
                  <p className="text-slate-500">Daily Trips</p>
                  <p className="text-white font-semibold">{line.daily_trips || 0}</p>
                </div>
              </div>

              {line.route_length_km > 0 && (
                <div className="text-xs text-cyan-400">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {line.route_length_km} km route
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Line Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Bus Line</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Line Number</Label>
              <Input
                value={formData.line_number}
                onChange={(e) => setFormData({...formData, line_number: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. 5A, 42, Express 1"
              />
            </div>
            <div>
              <Label>Line Name</Label>
              <Input
                value={formData.line_name}
                onChange={(e) => setFormData({...formData, line_name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. City Center - Airport"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              onClick={() => createLineMutation.mutate(formData)}
              disabled={!formData.line_number || !formData.line_name || createLineMutation.isPending}
            >
              {createLineMutation.isPending ? 'Creating...' : 'Create Line'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}