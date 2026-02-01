import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Activity, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SecurityMonitor from "@/components/security/SecurityMonitor";
import { motion } from "framer-motion";

export default function Security() {
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is admin
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      return user;
    },
  });

  // Fetch recent audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.SecurityAudit.list('-created_date', 50),
    enabled: currentUser?.role === 'admin',
  });

  if (currentUser?.role !== 'admin') {
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-cyan-500/20 border border-red-500/30">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Security Center</h1>
              <p className="text-slate-400">Real-time security monitoring and audit logs</p>
            </div>
          </div>
        </div>

        {/* Security Monitor */}
        <SecurityMonitor />

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
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No security events logged yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => {
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