import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { organizationId } = await req.json();

    // Fetch current crowding predictions
    const predictions = await base44.asServiceRole.entities.CrowdingPrediction.filter({
      organization_id: organizationId,
      crowding_level: { $in: ['medium', 'high'] }
    }, '-predicted_at', 20);

    const recommendations = [];

    for (const pred of predictions) {
      // Generate recommendations based on crowding
      if (pred.crowding_level === 'high' && pred.left_behind_risk) {
        const impact = -18; // Example: 18% reduction in left-behind passengers

        const action = await base44.asServiceRole.entities.RecommendedAction.create({
          organization_id: organizationId,
          action_type: 'extra_trip',
          line_id: pred.line_id,
          description: `Deploy additional trip 15 minutes after scheduled departure on line ${pred.line_id} to handle predicted high crowding (${pred.occupancy_percentage.toFixed(0)}% capacity).`,
          expected_impact: {
            metric: 'left_behind_passengers',
            change_percentage: impact,
            description: 'Reduce stranded passengers by additional trip'
          },
          confidence: pred.confidence,
          triggered_by: 'crowding_prediction',
          status: 'pending',
          valid_until: new Date(Date.now() + 30 * 60000).toISOString()
        });

        recommendations.push(action);
      } else if (pred.crowding_level === 'medium') {
        const action = await base44.asServiceRole.entities.RecommendedAction.create({
          organization_id: organizationId,
          action_type: 'frequency_increase',
          line_id: pred.line_id,
          description: `Increase frequency slightly for line ${pred.line_id} (currently ${pred.occupancy_percentage.toFixed(0)}% capacity predicted).`,
          expected_impact: {
            metric: 'passenger_satisfaction',
            change_percentage: 8,
            description: 'Reduce wait times'
          },
          confidence: pred.confidence - 10,
          triggered_by: 'crowding_prediction',
          status: 'pending',
          valid_until: new Date(Date.now() + 60 * 60000).toISOString()
        });

        recommendations.push(action);
      }
    }

    return nvJson(requestId, { success: true, recommendations, count: recommendations.length });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});