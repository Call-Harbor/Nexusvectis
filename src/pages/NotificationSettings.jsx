import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Plus, Trash2, Edit2, Truck, Package, Route, Wrench,
  AlertTriangle, Info, AlertCircle, Mail, Check, X, Loader2, Zap,
  CheckCircle2, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import NotificationRuleEditor from "../components/notifications/NotificationRuleEditor";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

const entityColors = {
  Vehicle: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  Shipment: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Route: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  Alert: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Maintenance: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Exception: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const entityIcons = { Vehicle: Truck, Shipment: Package, Route, Maintenance: Wrench, Alert: AlertTriangle, Exception: AlertCircle };

const severityColors = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const eventTypeLabels = {
  create: "New record created",
  update: "Record updated",
  status_change: "Status change",
  threshold: "Threshold",
};

const PRESETS = [
  {
    name: "Critical fuel level",
    entity_type: "Vehicle",
    event_type: "threshold",
    severity: "warning",
    conditions: [{ field: "fuel_level", operator: "less_than", value: "20" }],
    channels: { in_app: true, email: false },
    message_template: "Vehicle {{name}} has low fuel level: {{fuel_level}}%. Destination: {{destination}}",
    cooldown_minutes: 120,
  },
  {
    name: "Shipment delayed",
    entity_type: "Shipment",
    event_type: "status_change",
    severity: "warning",
    conditions: [{ field: "status", operator: "equals", value: "delayed" }],
    channels: { in_app: true, email: false },
    message_template: "Shipment {{tracking_number}} ({{origin}} → {{destination}}) is delayed. Customer: {{customer_name}}",
    cooldown_minutes: 60,
  },
  {
    name: "Critical maintenance",
    entity_type: "Maintenance",
    event_type: "create",
    severity: "critical",
    conditions: [{ field: "priority", operator: "equals", value: "critical" }],
    channels: { in_app: true, email: false },
    message_template: "Critical maintenance created: {{component}} — {{description}}",
    cooldown_minutes: 0,
  },
  {
    name: "Vehicle offline",
    entity_type: "Vehicle",
    event_type: "status_change",
    severity: "critical",
    conditions: [{ field: "status", operator: "equals", value: "offline" }],
    channels: { in_app: true, email: false },
    message_template: "Vehicle {{name}} went offline. Last seen: {{updated_date}}",
    cooldown_minutes: 30,
  },
];

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const orgId = user?.organization_id || user?.data?.organization_id;
  const email = user?.email;

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["notificationRules", orgId, email],
    queryFn: () => base44.entities.NotificationRule.filter({ organization_id: orgId, user_email: email }, "-created_date"),
    enabled: !!(orgId && email),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", orgId, email],
    queryFn: () => base44.entities.Notification.filter({ organization_id: orgId, user_email: email }, "-created_date", 50),
    enabled: !!(orgId && email),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingRule?.id) {
        return base44.entities.NotificationRule.update(editingRule.id, data);
      }
      return base44.entities.NotificationRule.create({ ...data, organization_id: orgId, user_email: email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationRules"] });
      setShowEditor(false);
      setEditingRule(null);
      toast.success(editingRule?.id ? "Rule updated" : "Rule created");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.NotificationRule.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificationRules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationRules"] });
      toast.success("Rule deleted");
    },
  });

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("All notifications marked as read");
  };

  const handlePreset = async (preset) => {
    await base44.entities.NotificationRule.create({ ...preset, organization_id: orgId, user_email: email, is_active: true });
    queryClient.invalidateQueries({ queryKey: ["notificationRules"] });
    toast.success(`Rule "${preset.name}" created`);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-cyan-400" />
              Notification Settings
            </h1>
            <p className="text-slate-400 mt-1">Configure rules for automatic notifications based on fleet events</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPresets(!showPresets)}
              className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50"
            >
              <Zap className="w-4 h-4 mr-2 text-amber-400" />
              Quick templates
            </Button>
            <Button
              onClick={() => { setEditingRule(null); setShowEditor(true); }}
              className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New rule
            </Button>
          </div>
        </div>

        {/* Presets */}
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-amber-400 text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Quick-start templates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handlePreset(preset)}
                      className="text-left p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 hover:bg-slate-800 transition-all group"
                    >
                      <p className="text-white text-sm font-medium group-hover:text-amber-300 transition-colors">{preset.name}</p>
                      <p className="text-slate-500 text-xs mt-1">{preset.entity_type} · {eventTypeLabels[preset.event_type]}</p>
                      <Badge className={`mt-2 text-[10px] ${severityColors[preset.severity]}`}>{preset.severity}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Aktive regler
              <Badge className="bg-slate-800 text-slate-400 border-slate-700">{rules.length}</Badge>
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Ingen regler endnu</p>
                <p className="text-slate-600 text-sm mt-1 mb-4">Opret din første notifikationsregel for at komme i gang</p>
                <Button
                  onClick={() => { setEditingRule(null); setShowEditor(true); }}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                >
                  <Plus className="w-4 h-4 mr-2" /> Opret første regel
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {rules.map((rule, idx) => {
                  const EntityIcon = entityIcons[rule.entity_type] || Bell;
                  const colorClass = entityColors[rule.entity_type] || entityColors.Vehicle;
                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`p-4 rounded-2xl border backdrop-blur-xl transition-all ${
                        rule.is_active ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-800/20 border-slate-700/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                          <EntityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-white">{rule.name}</h3>
                            <Badge variant="outline" className={colorClass}>{rule.entity_type}</Badge>
                            <Badge variant="outline" className={severityColors[rule.severity]}>{rule.severity}</Badge>
                            {!rule.is_active && <Badge className="bg-slate-700 text-slate-400">Inaktiv</Badge>}
                          </div>
                          <p className="text-xs text-slate-400">{eventTypeLabels[rule.event_type]}</p>

                          {rule.conditions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {rule.conditions.map((c, i) => (
                                <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                                  {c.field} {c.operator} "{c.value}"
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            {rule.channels?.in_app && (
                              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                                <Bell className="w-3 h-3" /> In-app
                              </span>
                            )}
                            {rule.channels?.email && (
                              <span className="flex items-center gap-1 text-[10px] text-violet-400">
                                <Mail className="w-3 h-3" /> E-mail
                              </span>
                            )}
                            {rule.trigger_count > 0 && (
                              <span className="text-[10px] text-slate-500">
                                Udløst {rule.trigger_count} gang{rule.trigger_count !== 1 ? "e" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, is_active: v })}
                            className="scale-90"
                          />
                          <Button
                            size="icon" variant="ghost"
                            className="w-8 h-8 text-slate-400 hover:text-cyan-400"
                            onClick={() => { setEditingRule(rule); setShowEditor(true); }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="w-8 h-8 text-slate-400 hover:text-rose-400"
                            onClick={() => { if (confirm("Slet denne regel?")) deleteMutation.mutate(rule.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Recent notifications feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Seneste notifikationer
              </h2>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" className="text-xs text-slate-400 hover:text-cyan-400" onClick={markAllRead}>
                  <Check className="w-3 h-3 mr-1" /> Marker alle læst
                </Button>
              )}
            </div>

            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 overflow-hidden">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Ingen notifikationer endnu</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
                  {notifications.map(notif => {
                    const dotColor = { info: "bg-blue-400", warning: "bg-amber-400", critical: "bg-rose-400" }[notif.severity] || "bg-slate-400";
                    return (
                      <div key={notif.id} className={`p-3 ${!notif.is_read ? "bg-slate-800/40" : ""}`}>
                        <div className="flex gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.is_read ? dotColor : "bg-slate-700"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notif.is_read ? "text-slate-400" : "text-white"}`}>{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            {notif.entity_details && Object.keys(notif.entity_details).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.entries(notif.entity_details).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">
                                    {k}: <span className="text-slate-300">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-slate-600">
                                {notif.created_date && format(new Date(notif.created_date), "d. MMM HH:mm", { locale: da })}
                              </span>
                              <div className="flex gap-0.5">
                                {notif.channels_sent?.map(ch => (
                                  <span key={ch} className="text-[9px] text-slate-600 border border-slate-700 px-1 rounded">{ch}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {!notif.is_read && (
                            <button
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors"
                              onClick={() => base44.entities.Notification.update(notif.id, { is_read: true }).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NotificationRuleEditor
        open={showEditor}
        rule={editingRule}
        onSave={(data) => saveMutation.mutateAsync(data)}
        onClose={() => { setShowEditor(false); setEditingRule(null); }}
      />
    </div>
  );
}