import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * REAL-TIME TRANSIT CONTROL AI
 * Monitors all trips in real-time and suggests short-turns, extra insertions,
 * rerouting based on live traffic, weather, and load data
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organization_id } = await req.json();

    // Fetch active trips and buses
    const [activeTrips, activeBuses, alerts] = await Promise.all([
      base44.asServiceRole.entities.BusTrip.filter({ 
        organization_id, 
        status: 'in_progress' 
      }),
      base44.asServiceRole.entities.Bus.filter({ 
        organization_id, 
        status: 'in_service' 
      }),
      base44.asServiceRole.entities.Alert.filter({ 
        organization_id, 
        is_resolved: false 
      })
    ]);

    // AI real-time control
    const recommendations = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a real-time transit control AI monitoring active operations.

Active trips: ${activeTrips.length}
Buses in service: ${activeBuses.length}
Active alerts: ${alerts.length}

Analyze the current situation and provide immediate recommendations:
1. Short-turn opportunities (turn bus early to recover main route)
2. Extra trip insertions (if loads exceed capacity)
3. Rerouting suggestions (for traffic/incidents)
4. Resource reallocation (reassign buses/drivers)

Prioritize by urgency and impact on passengers.`,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          short_turns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trip_id: { type: "string" },
                turn_at_stop: { type: "string" },
                reason: { type: "string" },
                passenger_impact: { type: "string" }
              }
            }
          },
          extra_insertions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line: { type: "string" },
                insert_at: { type: "string" },
                available_bus: { type: "string" },
                justification: { type: "string" }
              }
            }
          },
          rerouting: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trip_id: { type: "string" },
                avoid_area: { type: "string" },
                alternative_route: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          urgency_score: {
            type: "number",
            description: "Overall urgency 0-100"
          }
        }
      }
    });

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      recommendations,
      system_status: {
        active_trips: activeTrips.length,
        active_buses: activeBuses.length,
        unresolved_alerts: alerts.length
      }
    });
  } catch (error) {
    console.error('Real-time Control AI Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});