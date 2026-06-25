import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    // Only admins can perform security checks
    if (user.role !== 'admin') {
      return nvError(requestId, String('Forbidden'), 403);

    }

    const { timeframe = 3600000 } = await req.json(); // Default 1 hour
    const cutoffTime = new Date(Date.now() - timeframe).toISOString();

    // Get recent audit logs
    const auditLogs = await base44.asServiceRole.entities.SecurityAudit.filter({
      created_date: { $gte: cutoffTime }
    });

    // Analyze security threats
    const failedAttempts = auditLogs.filter(log => log.status === 'failed');
    const blockedAttempts = auditLogs.filter(log => log.status === 'blocked');
    const criticalEvents = auditLogs.filter(log => log.severity === 'critical');
    const highSeverityEvents = auditLogs.filter(log => log.severity === 'high');

    // Check for suspicious patterns
    const ipAttempts = {};
    failedAttempts.forEach(log => {
      ipAttempts[log.ip_address] = (ipAttempts[log.ip_address] || 0) + 1;
    });

    const suspiciousIPs = Object.entries(ipAttempts)
      .filter(([_, count]) => count > 5)
      .map(([ip, count]) => ({ ip, attempts: count }));

    // User activity analysis
    const userActivity = {};
    auditLogs.forEach(log => {
      userActivity[log.user_email] = (userActivity[log.user_email] || 0) + 1;
    });

    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, actions: count }));

    // Calculate security score (0-100)
    let securityScore = 100;
    securityScore -= Math.min(failedAttempts.length * 2, 30);
    securityScore -= Math.min(blockedAttempts.length * 3, 30);
    securityScore -= Math.min(criticalEvents.length * 10, 30);
    securityScore = Math.max(securityScore, 0);

    const report = {
      timeframe_ms: timeframe,
      total_events: auditLogs.length,
      failed_attempts: failedAttempts.length,
      blocked_attempts: blockedAttempts.length,
      critical_events: criticalEvents.length,
      high_severity_events: highSeverityEvents.length,
      suspicious_ips: suspiciousIPs,
      top_users: topUsers,
      security_score: securityScore,
      status: securityScore >= 80 ? 'healthy' : securityScore >= 60 ? 'warning' : 'critical',
      generated_at: new Date().toISOString()
    };

    return nvJson(requestId, report);

  } catch (error) {
    console.error('Security check error:', error);
    return nvError(requestId, String(error.message), 500);

  }
});