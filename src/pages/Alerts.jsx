import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, AlertTriangle, Info, AlertCircle, CheckCircle,
  Sparkles, X, Check, Filter, Download, BarChart3
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

const typeIcons = { info: Info, warning: AlertTriangle, critical: AlertCircle, success: CheckCircle };
const typeColors = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
const typeLabels = { info: "Information", warning: "Warning", critical: "Critical", success: "Success" };
const categoryLabels = {
  maintenance: "Maintenance", delay: "Delay", weather: "Weather",
  fuel: "Fuel", route: "Route", system: "System"
};

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("unresolved");
  const [sortBy, setSortBy] = useState("date");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "", message: "", type: "info", category: "system", ai_recommendation: ""
  });
  const [visibleCount, setVisibleCount] = useState(20);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Alert.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      return base44.entities.Alert.create({ ...data, organization_id: orgId });
    },
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
                          a.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.ai_recommendation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "unresolved" && !a.is_resolved) ||
                          (statusFilter === "resolved" && a.is_resolved);
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "date") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "priority") {
      const priority = { critical: 3, warning: 2, info: 1, success: 0 };
      return priority[b.type] - priority[a.type];
    }
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    return 0;
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

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredAlerts.length));
  }, [filteredAlerts.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredAlerts.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, filteredAlerts.length, loadMore]);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, typeFilter, categoryFilter, statusFilter, sortBy]);

  const exportToCSV = () => {
    const headers = ["Title", "Message", "Type", "Category", "Status", "AI Recommendation", "Created Date"];
    const rows = filteredAlerts.map(a => [
      a.title || "-",
      a.message || "-",
      typeLabels[a.type] || "-",
      categoryLabels[a.category] || "-",
      a.is_resolved ? "Resolved" : "Unresolved",
      a.ai_recommendation || "-",
      a.created_date ? format(new Date(a.created_date), "dd-MM-yyyy HH:mm") : "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const visibleAlerts = filteredAlerts.slice(0, visibleCount);

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
            <h1 className="text-3xl font-bold text-white">Alerts</h1>
            <p className="text-slate-400 mt-1">
              {filteredAlerts.length} of {alerts.length} alerts
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={exportToCSV}
              className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Alerts", value: stats.total },
            { label: "Unresolved", value: stats.unresolved },
            { label: "Critical", value: stats.critical },
            { label: "Today", value: stats.today },
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
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by title, message, or AI recommendation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-800/50 border border-slate-700/50">
                <TabsTrigger value="unresolved" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                  Unresolved
                </TabsTrigger>
                <TabsTrigger value="resolved" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  Resolved
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="route">Route</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort: Date</SelectItem>
                  <SelectItem value="priority">Sort: Priority</SelectItem>
                  <SelectItem value="title">Sort: Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || typeFilter !== "all" || categoryFilter !== "all") && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Active filters:</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Search: {searchTerm}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {typeFilter !== "all" && (
                  <Badge variant="outline" className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                    Type: {typeFilter}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setTypeFilter("all")}
                    />
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                    Category: {categoryFilter}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setCategoryFilter("all")}
                    />
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="text-slate-500 hover:text-white text-xs ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleAlerts.map((alert, index) => {
              const Icon = typeIcons[alert.type] || AlertCircle;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
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
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                        {alert.ai_recommendation && !alert.is_resolved && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-violet-300 mb-1">AI Recommendation</p>
                              <p className="text-xs text-violet-400">{alert.ai_recommendation}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {alert.created_date && format(new Date(alert.created_date), "MMMM d, yyyy 'at' HH:mm")}
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
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-rose-400"
                        onClick={() => {
                          if (confirm('Delete this alert?')) {
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

          {/* Load More Trigger */}
          {visibleCount < filteredAlerts.length && (
            <div ref={loadMoreRef} className="py-8 text-center">
              <div className="inline-flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm">Loading more alerts...</span>
              </div>
            </div>
          )}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-400">No alerts match your search</p>
          </div>
        )}

        {visibleCount >= filteredAlerts.length && filteredAlerts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">
              Showing all {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Add Alert Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Low Fuel Level"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Describe the alert..."
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
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="route">Route</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>AI Recommendation (optional)</Label>
              <Textarea
                value={formData.ai_recommendation}
                onChange={(e) => setFormData({...formData, ai_recommendation: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Suggested action..."
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-rose-500 to-violet-500 text-black font-semibold"
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title || !formData.message || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}