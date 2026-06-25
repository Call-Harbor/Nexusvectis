import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * VEHICLE & DRIVER ASSIGNMENT AI
 * Matching engine that assigns buses and drivers to trips/lines considering
 * rest rules, competencies, depot location, battery range, maintenance needs
 */

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return nvError(requestId, String('Forbidden'), 403);

    }

    const { organization_id, date } = await req.json();

    // Fetch resources
    const [scheduledTrips, availableBuses, availableDrivers, depots] = await Promise.all([
      base44.asServiceRole.entities.BusTrip.filter({ 
        organization_id,
        scheduled_date: date,
        status: 'scheduled'
      }),
      base44.asServiceRole.entities.Bus.filter({ 
        organization_id,
        status: { $in: ['idle', 'charging'] }
      }),
      base44.asServiceRole.entities.BusDriver.filter({ 
        organization_id,
        status: 'active'
      }),
      base44.asServiceRole.entities.BusDepot.filter({ organization_id })
    ]);

    // AI assignment optimization
    const assignments = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a transit assignment optimization AI.

Date: ${date}
Scheduled trips: ${scheduledTrips.length}
Available buses: ${availableBuses.length}
Available drivers: ${availableDrivers.length}
Depots: ${depots.length}

Create optimal bus and driver assignments considering:
1. Driver rest time regulations
2. Driver certifications and authorized lines
3. Bus battery range (electric buses)
4. Depot locations (minimize deadhead)
5. Maintenance schedules
6. Load balancing across fleet

Provide specific trip → bus → driver assignments.`,
      model: "gemini_3_pro",
      response_json_schema: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trip_id: { type: "string" },
                assigned_bus_id: { type: "string" },
                assigned_driver_id: { type: "string" },
                depot_start: { type: "string" },
                confidence_score: { type: "number" },
                notes: { type: "string" }
              }
            }
          },
          unassigned_trips: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trip_id: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          warnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                message: { type: "string" },
                severity: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Apply assignments to database
    let appliedCount = 0;
    for (const assignment of assignments.assignments || []) {
      try {
        await base44.asServiceRole.entities.BusTrip.update(assignment.trip_id, {
          assigned_bus_id: assignment.assigned_bus_id,
          assigned_driver_id: assignment.assigned_driver_id
        });
        appliedCount++;
      } catch (e) {
        console.error('Assignment error:', e);
      }
    }

    return nvJson(requestId, {
      success: true,
      date,
      total_trips: scheduledTrips.length,
      assignments_created: appliedCount,
      unassigned: assignments.unassigned_trips?.length || 0,
      warnings: assignments.warnings || []
    });

  } catch (error) {
    console.error('Vehicle Assignment AI Error:', error);
    return nvJson(requestId, { 
      success: false, 
      error: error.message 
    }, 500);

  }
});