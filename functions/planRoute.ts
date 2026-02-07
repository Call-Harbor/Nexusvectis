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

CRITICAL REQUIREMENTS FOR ${transport_type.toUpperCase()}:
${transport_type === 'ship' ? `
- SHIPS CANNOT TRAVEL THROUGH LAND - only water routes allowed
- Follow actual shipping lanes through seas, oceans, straits, and canals
- Include major ports as waypoints (e.g., Rotterdam, Hamburg, Copenhagen ports)
- Route MUST go around land masses via coastlines and international waters
- Consider canals like Kiel Canal, English Channel, etc.
` : transport_type === 'truck' ? `
- Follow major highways and road networks
- Include highway junctions and major cities as waypoints
- Routes must follow existing road infrastructure
` : transport_type === 'train' ? `
- Follow existing rail networks and major rail lines
- Include major train stations and rail hubs as waypoints
- Routes must follow actual railway infrastructure
` : transport_type === 'aircraft' ? `
- Use typical flight corridors and air routes
- Include major airports or air waypoints
- Can fly direct but consider typical aviation routes
` : `
- Consider drone flight regulations and no-fly zones
- Include recharge/rest stops if needed for long distances
`}

Requirements:
1. Return EXACT coordinates for waypoints that follow ${transport_type} infrastructure
2. Include 4-8 realistic intermediate stops/waypoints
3. Calculate accurate distance and duration based on transport type
4. Ensure route is physically possible for ${transport_type}

Transport type emissions factors:
- truck: 0.8 kg CO2 per km
- ship: 0.02 kg CO2 per km  
- aircraft: 0.9 kg CO2 per km
- train: 0.04 kg CO2 per km
- drone: 0.3 kg CO2 per km

Provide a realistic, geographically accurate route that is ACTUALLY POSSIBLE for ${transport_type}.`,
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