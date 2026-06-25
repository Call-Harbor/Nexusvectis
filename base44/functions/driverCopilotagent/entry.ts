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

    const { driverId, organizationId } = await req.json();

    // Fetch current trips and predictions
    const trips = await base44.asServiceRole.entities.BusTrip.filter({
      organization_id: organizationId,
      assigned_driver_id: driverId,
      status: { $in: ['in_progress', 'scheduled'] }
    }, '-scheduled_departure', 3);

    const hints = [];

    for (const trip of trips) {
      // Check delay
      if (trip.delay_minutes !== undefined && trip.delay_minutes > 2) {
        hints.push({
          type: 'timing',
          severity: 'warning',
          message: `You're ${trip.delay_minutes} min ahead of schedule. Drive a bit slower to stay on time.`,
          actionable: true
        });
      }

      // Check crowding prediction for next stops
      const prediction = await base44.asServiceRole.entities.CrowdingPrediction.filter({
        organization_id: organizationId,
        trip_id: trip.id
      }, '-predicted_at', 1);

      if (prediction.length > 0 && prediction[0].crowding_level === 'high') {
        hints.push({
          type: 'boarding',
          severity: 'info',
          message: `High crowding expected at next 2 stops. Prepare for longer boarding times.`,
          actionable: false
        });
      }
    }

    return nvJson(requestId, { success: true, hints, count: hints.length });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});