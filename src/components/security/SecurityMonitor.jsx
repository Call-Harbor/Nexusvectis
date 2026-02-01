import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, AlertTriangle, Activity, Lock, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function SecurityMonitor() {
  const { data: securityReport, isLoading } = useQuery({
    queryKey: ['securityReport'],
    queryFn: async () => {
      const response = await base44.functions.invoke('securityCheck', { 
        timeframe: 3600000 // Last hour
      });
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">Loading security status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!securityReport) return null;

  const statusColors = {
    healthy: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
  };

  const colors = statusColors[securityReport.status] || statusColors.healthy;

  return (
    <div className="space-y-4">
      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className={`bg-slate-800/50 border ${colors.border}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${colors.text}`} />
                <span className="text-white">Security Score</span>
              </div>
              <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
                {securityReport.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-4xl font-bold ${colors.text}`}>
                  {securityReport.security_score}
                </span>
                <span className="text-slate-400">/ 100</span>
              </div>
              <Progress 
                value={securityReport.security_score} 
                className="h-2"
              />
              <p className="text-sm text-slate-400">
                Based on {securityReport.total_events} events in the last hour
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Total Events</span>
              </div>
              <p className="text-2xl font-bold text-white">{securityReport.total_events}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-500">Failed Attempts</span>
              </div>
              <p className="text-2xl font-bold text-white">{securityReport.failed_attempts}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-500">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-white">{securityReport.blocked_attempts}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-500">Critical Events</span>
              </div>
              <p className="text-2xl font-bold text-white">{securityReport.critical_events}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Suspicious Activity */}
      {securityReport.suspicious_ips?.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Suspicious Activity Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityReport.suspicious_ips.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-white font-mono">{item.ip}</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {item.attempts} failed attempts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Active Users */}
      {securityReport.top_users?.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Most Active Users (Last Hour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityReport.top_users.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span className="text-white">{item.email}</span>
                  </div>
                  <span className="text-slate-400">{item.actions} actions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}