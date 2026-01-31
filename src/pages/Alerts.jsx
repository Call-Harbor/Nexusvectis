import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Plus, Search, AlertTriangle, Info, AlertCircle, CheckCircle,
  Sparkles, Filter, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { da } from "date-fns/locale";

const typeIcons = { info: Info, warning: AlertTriangle, critical: AlertCircle, success: CheckCircle };
const typeColors = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
const typeLabels = { info: "Information", warning: "Advarsel", critical: "Kritisk", success: "Succes" };
const categoryLabels = {
  maintenance: "Vedligeholdelse", delay: "Forsinkelse", weather: "Vejr",
  fuel: "Brændstof", route: "Rute", system: "System"
};

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("unresolved");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "", message: "", type: "info", category: "system", ai_recommendation: ""
  });

  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Alert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resetForm = () => {
    setFormData({ title: "", message: "", type: "info", category: "system", ai_recommendation: "" });
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "unresolved" && !a.is_resolved) ||
                          (statusFilter === "resolved" && a.is_resolved);
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.is_resolved).length,
    critical: alerts.filter(a => a.type === 'critical' && !a.is_resolved).length,
    today: alerts.filter(a => {
      const today = new Date();
      const alertDate = new Date(a.created_date);
      return alertDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Alarmer</h1>
            <p className="text-slate-400 mt-1">{stats.unresolved} kræver handling</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Opret Alarm
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Alarmer", value: stats.total, color: "slate" },
            { label: "Uløste", value: stats.unresolved, color: "amber" },
            { label: "Kritiske", value: stats.critical, color: "rose" },
            { label: "I dag", value: stats.today, color: "blue" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Søg i alarmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="unresolved" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Uløste
              </TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                Løste
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                Alle
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="warning">Advarsel</SelectItem>
              <SelectItem value="critical">Kritisk</SelectItem>
              <SelectItem value="success">Succes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert, index) => {
              const Icon = typeIcons[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-5 rounded-2xl border backdrop-blur-xl ${
                    alert.is_resolved 
                      ? 'bg-slate-800/30 border-slate-700/30 opacity-60' 
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${typeColors[alert.type]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{alert.title}</h3>
                          <Badge variant="outline" className={typeColors[alert.type]}>
                            {typeLabels[alert.type]}
                          </Badge>
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {categoryLabels[alert.category]}
                          </Badge>
                          {alert.is_resolved && (
                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <Check className="w-3 h-3 mr-1" />
                              Løst
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                        {alert.ai_recommendation && !alert.is_resolved && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-violet-300 mb-1">AI Anbefaling</p>
                              <p className="text-xs text-violet-400">{alert.ai_recommendation}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {alert.created_date && format(new Date(alert.created_date), "d. MMMM yyyy 'kl.' HH:mm", { locale: da })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!alert.is_resolved && (
                        <Button
                          size="sm"
                          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                          onClick={() => updateMutation.mutate({ id: alert.id, data: { is_resolved: true }})}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Løst
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-rose-400"
                        onClick={() => {
                          if (confirm('Slet denne alarm?')) {
                            deleteMutation.mutate(alert.id);
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-400">Ingen alarmer matcher din søgning</p>
          </div>
        )}
      </div>

      {/* Add Alert Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Opret Ny Alarm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="F.eks. Lavt brændstofniveau"
              />
            </div>
            <div>
              <Label>Besked</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Beskriv alarmen..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Advarsel</SelectItem>
                    <SelectItem value="critical">Kritisk</SelectItem>
                    <SelectItem value="success">Succes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="maintenance">Vedligeholdelse</SelectItem>
                    <SelectItem value="delay">Forsinkelse</SelectItem>
                    <SelectItem value="weather">Vejr</SelectItem>
                    <SelectItem value="fuel">Brændstof</SelectItem>
                    <SelectItem value="route">Rute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>AI Anbefaling (valgfri)</Label>
              <Textarea
                value={formData.ai_recommendation}
                onChange={(e) => setFormData({...formData, ai_recommendation: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Foreslået handling..."
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-rose-500 to-violet-500"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title || !formData.message || createMutation.isPending}
            >
              {createMutation.isPending ? 'Opretter...' : 'Opret Alarm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}