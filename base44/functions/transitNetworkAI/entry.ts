import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * TRANSIT NETWORK DESIGN AI
 * Analyzes passenger flows, demographics, and existing network to suggest new lines,
 * knot points, express routes, and network restructuring
 */

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return nvError(requestId, String('Forbidden'), 403);

    }

    const { organization_id } = await req.json();

    // Fetch existing network data
    const [lines, stops, demandData, trips] = await Promise.all([
      base44.asServiceRole.entities.BusLine.filter({ organization_id }),
      base44.asServiceRole.entities.BusStop.filter({ organization_id }),
      base44.asServiceRole.entities.PassengerDemand.filter({ organization_id }, '-timestamp', 5000),
      base44.asServiceRole.entities.BusTrip.filter({ organization_id }, '-scheduled_date', 1000)
    ]);

    // Analyze with AI
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a transit network optimization expert analyzing a bus network.

Current network:
- ${lines.length} lines
- ${stops.length} stops
- Recent passenger demand data: ${demandData.length} records
- Recent trips: ${trips.length}

Analyze the data and provide:
1. New line proposals (routes that would improve coverage)
2. Express route opportunities (high-demand corridors)
3. Knot point recommendations (transfer hubs to create)
4. Network restructuring ideas (backbone + feeder model)
5. Coverage gaps (areas underserved)

For each proposal, estimate:
- Passenger coverage increase
- Operating cost
- CO2 impact
- Service level improvement

Provide actionable, specific recommendations.`,
      model: "gemini_3_pro",
      response_json_schema: {
        type: "object",
        properties: {
          new_lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                proposed_name: { type: "string" },
                route_description: { type: "string" },
                estimated_passengers_daily: { type: "number" },
                estimated_cost_monthly: { type: "number" },
                priority: { type: "string" }
              }
            }
          },
          express_routes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                corridor: { type: "string" },
                justification: { type: "string" },
                time_saving_minutes: { type: "number" }
              }
            }
          },
          knot_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                location: { type: "string" },
                connecting_lines: { type: "array", items: { type: "string" } },
                transfer_volume_estimate: { type: "number" }
              }
            }
          },
          network_restructuring: {
            type: "object",
            properties: {
              concept: { type: "string" },
              backbone_lines: { type: "array", items: { type: "string" } },
              feeder_lines: { type: "array", items: { type: "string" } },
              benefits: { type: "array", items: { type: "string" } }
            }
          },
          coverage_gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                population_estimate: { type: "number" },
                solution: { type: "string" }
              }
            }
          }
        }
      }
    });

    return nvJson(requestId, {
      success: true,
      analysis,
      metrics: {
        lines_analyzed: lines.length,
        stops_analyzed: stops.length,
        demand_records: demandData.length
      }
    });

  } catch (error) {
    console.error('Transit Network AI Error:', error);
    return nvJson(requestId, { 
      success: false, 
      error: error.message 
    }, 500);

  }
});