import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const userData = await base44.entities.User.filter({ email: user.email });
    if (!userData || userData.length === 0 || !userData[0].organization_id) {
      return Response.json({ error: 'User must be assigned to an organization' }, { status: 400 });
    }

    const organization_id = userData[0].organization_id;

    // Fetch all API usage for this organization
    const usageData = await base44.asServiceRole.entities.APIUsage.filter({ organization_id });

    // Calculate statistics
    const totalCalls = usageData.length;
    
    const endpointStats = {};
    const methodStats = { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
    const statusStats = {};
    let totalResponseTime = 0;
    let errorCount = 0;

    usageData.forEach(call => {
      // Count by endpoint
      if (!endpointStats[call.endpoint]) {
        endpointStats[call.endpoint] = 0;
      }
      endpointStats[call.endpoint]++;

      // Count by method
      if (call.method) {
        methodStats[call.method] = (methodStats[call.method] || 0) + 1;
      }

      // Count by status code
      const statusGroup = Math.floor(call.status_code / 100) * 100;
      statusStats[statusGroup] = (statusStats[statusGroup] || 0) + 1;

      // Sum response times
      if (call.response_time_ms) {
        totalResponseTime += call.response_time_ms;
      }

      // Count errors
      if (call.status_code >= 400) {
        errorCount++;
      }
    });

    const avgResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;

    // Get top 10 most used endpoints
    const topEndpoints = Object.entries(endpointStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return Response.json({
      success: true,
      stats: {
        total_calls: totalCalls,
        error_count: errorCount,
        error_rate: totalCalls > 0 ? (errorCount / totalCalls * 100).toFixed(2) : 0,
        avg_response_time_ms: avgResponseTime.toFixed(2),
        by_endpoint: endpointStats,
        by_method: methodStats,
        by_status: statusStats,
        top_endpoints: topEndpoints
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});