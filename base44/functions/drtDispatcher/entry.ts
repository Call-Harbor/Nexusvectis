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

    // Fetch pending demand requests
    const pendingRequests = await base44.asServiceRole.entities.DemandRequest.filter({
      organization_id: organizationId,
      status: 'pending'
    }, '-requested_time', 50);

    if (pendingRequests.length === 0) {
      return nvJson(requestId, { assignments: [] });

    }

    // Fetch available DRT vehicles (minibuses, shuttles)
    const vehicles = await base44.asServiceRole.entities.Bus.filter({
      organization_id: organizationId,
      vehicle_type: { $in: ['minibus', 'shuttle'] },
      status: 'idle'
    }, null, 10);

    if (vehicles.length === 0) {
      return nvJson(requestId, { assignments: [], message: 'No available vehicles' });

    }

    // Simple greedy assignment: match each request to nearest vehicle
    const assignments = [];
    const usedVehicles = new Set();

    for (const request of pendingRequests.slice(0, 5)) {
      let bestVehicle = null;
      let bestDistance = Infinity;

      for (const vehicle of vehicles) {
        if (usedVehicles.has(vehicle.id)) continue;

        const distance = Math.hypot(
          vehicle.latitude - request.pickup_location.latitude,
          vehicle.longitude - request.pickup_location.longitude
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestVehicle = vehicle;
        }
      }

      if (bestVehicle) {
        usedVehicles.add(bestVehicle.id);
        const assignment = await base44.asServiceRole.entities.DRTAssignment.create({
          organization_id: organizationId,
          drt_vehicle_id: bestVehicle.id,
          route: [
            {
              stop_order: 1,
              request_id: request.id,
              location: request.pickup_location,
              arrival_time: new Date(Date.now() + 5 * 60000).toISOString()
            },
            {
              stop_order: 2,
              request_id: request.id,
              location: request.dropoff_location,
              arrival_time: new Date(Date.now() + 15 * 60000).toISOString()
            }
          ],
          status: 'planning',
          requests_count: 1,
          total_passengers: request.passenger_count,
          efficiency_score: 80
        });

        // Update request
        await base44.asServiceRole.entities.DemandRequest.update(request.id, {
          status: 'assigned',
          assigned_vehicle_id: bestVehicle.id
        });

        assignments.push(assignment);
      }
    }

    return nvJson(requestId, { success: true, assignments, count: assignments.length });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});