import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * FREQUENCY & TIMETABLE OPTIMIZER
 * Calculates optimal frequency per time period and line based on live load,
 * delay patterns, and bottlenecks. Suggests dynamic timetables.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organization_id, line_id } = await req.json();

    // Fetch line and trip data
    const [line, trips, demandData] = await Promise.all([
      base44.asServiceRole.entities.BusLine.filter({ organization_id, id: line_id }),
      base44.asServiceRole.entities.BusTrip.filter({ organization_id, line_id }, '-scheduled_date', 500),
      base44.asServiceRole.entities.PassengerDemand.filter({ organization_id, line_id }, '-timestamp', 2000)
    ]);

    if (!line || line.length === 0) {
      return Response.json({ error: 'Line not found' }, { status: 404 });
    }

    const lineData = line[0];

    // AI optimization
    const optimization = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a transit frequency optimization AI.

Line: ${lineData.line_number} - ${lineData.line_name}
Recent trips: ${trips.length}
Passenger demand records: ${demandData.length}

Analyze the data and suggest:
1. Optimal frequency for different time periods (peak, off-peak, night, weekend)
2. Dynamic timetable adjustments
3. Identify bottlenecks causing delays
4. Recommend service improvements

Provide specific frequencies in minutes (e.g., "5 min headway during peak").`,
      model: "gemini_3_pro",
      response_json_schema: {
        type: "object",
        properties: {
          recommended_frequencies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time_period: { type: "string" },
                days: { type: "string" },
                frequency_minutes: { type: "number" },
                justification: { type: "string" }
              }
            }
          },
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                location: { type: "string" },
                impact: { type: "string" },
                solution: { type: "string" }
              }
            }
          },
          dynamic_adjustments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trigger: { type: "string" },
                adjustment: { type: "string" }
              }
            }
          },
          cost_impact: {
            type: "object",
            properties: {
              current_monthly_cost: { type: "number" },
              optimized_monthly_cost: { type: "number" },
              savings: { type: "number" }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      line: lineData.line_number,
      optimization,
      analyzed_trips: trips.length
    });
  } catch (error) {
    console.error('Frequency Optimizer Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});