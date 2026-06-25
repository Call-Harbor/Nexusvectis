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

    const { organization_id } = await req.json();

    const routes = await base44.asServiceRole.entities.Route.filter({ organization_id });

    // Performance metrics
    const performance = {
      total_routes: routes.length,
      by_status: routes.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      by_priority: routes.reduce((acc, r) => {
        acc[r.priority] = (acc[r.priority] || 0) + 1;
        return acc;
      }, {}),
      by_transport_type: routes.reduce((acc, r) => {
        if (r.transport_type) {
          acc[r.transport_type] = (acc[r.transport_type] || 0) + 1;
        }
        return acc;
      }, {}),
      
      // Distance & Duration
      total_distance_km: routes.reduce((sum, r) => sum + (r.distance_km || 0), 0),
      average_distance_km: (routes.reduce((sum, r) => sum + (r.distance_km || 0), 0) / routes.length).toFixed(1),
      total_estimated_hours: routes.reduce((sum, r) => sum + (r.estimated_duration_hours || 0), 0),
      
      // AI Optimization
      ai_optimized_count: routes.filter(r => r.ai_optimized).length,
      ai_optimization_rate: ((routes.filter(r => r.ai_optimized).length / routes.length) * 100).toFixed(1),
      
      // Sustainability
      total_co2_estimate: routes.reduce((sum, r) => sum + (r.co2_estimate || 0), 0),
      average_co2_per_route: (routes.reduce((sum, r) => sum + (r.co2_estimate || 0), 0) / routes.length).toFixed(2),
      
      // Efficiency comparison
      ai_vs_manual: {
        ai_optimized_avg_distance: routes.filter(r => r.ai_optimized)
          .reduce((sum, r) => sum + (r.distance_km || 0), 0) / routes.filter(r => r.ai_optimized).length || 0,
        manual_avg_distance: routes.filter(r => !r.ai_optimized)
          .reduce((sum, r) => sum + (r.distance_km || 0), 0) / routes.filter(r => !r.ai_optimized).length || 0
      },
      
      // Critical & Delayed
      critical_routes: routes.filter(r => r.priority === 'critical').length,
      delayed_routes: routes.filter(r => r.status === 'delayed').length
    };

    return nvJson(requestId, {
      success: true,
      performance
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});