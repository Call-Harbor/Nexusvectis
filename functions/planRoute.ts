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
- SHIPS CAN ONLY SAIL ON WATER - ABSOLUTELY NO CROSSING LAND OR INLAND AREAS
- Route must follow seas, oceans, navigable rivers, straits, and maritime canals ONLY
- Must sail AROUND landmasses and peninsulas (e.g., sail around Jutland/Denmark via Skagerrak, not through land)
- Each waypoint must be a real port or coastal location accessible by water
- VERIFY that you can sail from one waypoint to the next without crossing land
- Use major shipping lanes: North Sea, English Channel, Baltic Sea routes, etc.
- Include canals when relevant (Kiel Canal between Baltic and North Sea, for example)
- Route should realistically follow coastal shipping patterns
` : transport_type === 'truck' ? `
- Follow major highways and road networks
- Include highway junctions and major cities as waypoints
- Routes must follow existing road infrastructure
` : transport_type === 'train' ? `
- TRAINS CANNOT LEAVE RAIL TRACKS OR CROSS WATER (except via bridges/tunnels like Öresund)
- Follow ONLY existing rail networks with actual physical tracks
- Route must follow land-based rail corridors - NO straight lines across water
- Include major train stations as waypoints along the actual rail route
- Consider realistic connections via existing rail infrastructure
- If water crossing needed, verify bridge/tunnel exists (e.g., Öresund Bridge, Channel Tunnel)
- Route should follow the curvature of rail lines, not straight lines
` : transport_type === 'aircraft' ? `
- AIRCRAFT FLY IN STRAIGHT LINES at high altitude (unless avoiding restricted airspace)
- Include major airports as origin/destination and potential fuel stops
- Can mostly fly direct but include realistic waypoints for very long routes
- Consider typical commercial flight paths between major airports
` : `
- DRONES fly at low altitude and need line-of-sight or pre-approved corridors
- Include recharge stations every 50-150km depending on payload
- Must avoid restricted airspace (military zones, airports)
- Route should be semi-direct but with necessary stops for battery/fuel
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