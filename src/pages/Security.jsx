import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Activity, AlertTriangle, FileText, Download, Search, User, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SecurityMonitor from "@/components/security/SecurityMonitor";
import { motion } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";

export default function Security() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Check if user is admin
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      return user;
    },
  });

  // Get organization
  const { data: organization } = useQuery({
    queryKey: ['organization', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  // Fetch recent audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.SecurityAudit.filter({ organization_id: orgId }, '-created_date', 50);
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const isAdmin = currentUser?.role === 'admin';
  const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
  const isOrgAdmin = currentUser?.email === organization?.admin_email;

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  // Stats
  const stats = {
    total: auditLogs.length,
    critical: auditLogs.filter(a => a.severity === 'critical').length,
    high: auditLogs.filter(a => a.severity === 'high').length,
    last24h: auditLogs.filter(a => moment(a.created_date).isAfter(moment().subtract(24, 'hours'))).length,
    uniqueUsers: [...new Set(auditLogs.map(a => a.user_email))].length,
    failed: auditLogs.filter(a => a.status === 'failed' || a.status === 'blocked').length
  };

  const exportAuditLog = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Status", "Severity", "IP Address", "Details"].join(","),
      ...filteredLogs.map(a => [
        moment(a.created_date).format('YYYY-MM-DD HH:mm:ss'),
        a.user_email,
        a.action,
        a.status || '',
        a.severity,
        a.ip_address || '',
        `"${a.details || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_audit_${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success("Audit log exported");
  };
  
  if (!isAdmin && !isOrgAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="bg-slate-800/50 border-slate-700/50 max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only administrators can access security monitoring.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const severityColors = {
    low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
    medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    high: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
  };

  const statusColors = {
    success: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
    blocked: { bg: 'bg-orange-500/20', text: 'text-orange-400' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-cyan-500/20 border border-red-500/30">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Security Center</h1>
                <p className="text-slate-400">Real-time security monitoring and audit logs</p>
              </div>
            </div>
            <Button onClick={exportAuditLog} variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export Log
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Events</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Critical</p>
                  <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">High</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Last 24h</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.last24h}</p>
                </div>
                <Activity className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Users</p>
                  <p className="text-2xl font-bold text-violet-400">{stats.uniqueUsers}</p>
                </div>
                <User className="w-8 h-8 text-violet-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
                </div>
                <Lock className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Monitor */}
        <SecurityMonitor />

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap mt-8">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {["all", "critical", "high", "medium", "low"].map((severity) => (
              <Button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                variant={severityFilter === severity ? "default" : "outline"}
                className={severityFilter === severity ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
                size="sm"
              >
                {severity === "all" ? "All" : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-cyan-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No security events found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map((log) => {
                    const severityColor = severityColors[log.severity] || severityColors.low;
                    const statusColor = statusColors[log.status] || statusColors.success;
                    
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{log.action}</span>
                            <Badge className={`${statusColor.bg} ${statusColor.text} border-0`}>
                              {log.status}
                            </Badge>
                            <Badge className={`${severityColor.bg} ${severityColor.text} ${severityColor.border}`}>
                              {log.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>{log.user_email}</span>
                            {log.ip_address && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{log.ip_address}</span>
                              </>
                            )}
                            {log.resource_type && (
                              <>
                                <span>•</span>
                                <span>{log.resource_type}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(log.created_date).toLocaleString()}</span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-slate-500 mt-2">{log.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}