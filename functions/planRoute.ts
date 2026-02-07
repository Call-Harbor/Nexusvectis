import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, transport_type } = await req.json();

    // Use LLM to plan the route with real geographic data
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a logistics route planner. Plan a precise route from ${origin} to ${destination} for ${transport_type} transport.

Requirements:
1. Return EXACT coordinates for waypoints between origin and destination
2. Use major highways, shipping lanes, or flight paths depending on transport type
3. Include realistic intermediate stops/waypoints (3-6 waypoints)
4. Calculate accurate distance and duration
5. Estimate CO2 emissions based on transport type

Transport type emissions factors:
- truck: 0.8 kg CO2 per km
- ship: 0.02 kg CO2 per km  
- aircraft: 0.9 kg CO2 per km
- train: 0.04 kg CO2 per km
- drone: 0.3 kg CO2 per km

Provide a realistic, geographically accurate route.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          waypoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" }
              }
            }
          },
          distance_km: { type: "number" },
          estimated_duration_hours: { type: "number" },
          co2_estimate: { type: "number" },
          route_description: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      route_data: response
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});