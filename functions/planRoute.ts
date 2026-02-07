import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, transport_type } = await req.json();

    // Step 1: Search for the actual route using web search
    const routeSearch = await base44.integrations.Core.InvokeLLM({
      prompt: `Search Google Maps RIGHT NOW for the route from ${origin} to ${destination} ${transport_type === 'ship' ? 'by sea/maritime route' : transport_type === 'truck' ? 'by road/driving' : transport_type === 'train' ? 'by train/rail' : transport_type === 'aircraft' ? 'by plane/flight' : 'direct route'}.

INSTRUCTIONS:
1. Go to Google Maps and search "${origin} to ${destination}"
2. Look at the ACTUAL route shown on the map
3. Write down EVERY major city, port, strait, canal, or junction the route passes through
4. Get the EXACT coordinates (latitude, longitude) for each point

${transport_type === 'ship' ? `
FOR SHIPS: Look for maritime/sea routes. Ships sail ONLY on water (seas, straits, canals).
- Check sites like MarineTraffic or VesselFinder for actual shipping routes
- Identify which bodies of water are crossed (North Sea, Baltic Sea, English Channel, etc.)
- Note important passages (Kiel Canal, Dover Strait, Skagerrak, etc.)
` : ''}

Return ONLY the list of waypoints with names and coordinates that the actual route passes through.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          waypoints_found: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          route_type: { type: "string" },
          main_bodies_crossed: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Step 2: Validate and calculate distances
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You found these waypoints: ${JSON.stringify(routeSearch.waypoints_found)}

NOW:
1. Verify each waypoint is on the actual route from ${origin} to ${destination}
2. Remove any waypoints that don't make sense
3. Calculate the REAL distance in km between consecutive waypoints (use geographic distance formula)
4. Sum up total distance
5. Calculate duration based on transport speed:
   - ship: 25 km/h
   - truck: 80 km/h  
   - train: 120 km/h
   - aircraft: 800 km/h
   - drone: 60 km/h
6. Calculate CO2: distance × factor (ship=0.02, truck=0.8, train=0.04, aircraft=0.9, drone=0.3)

Ensure coordinates are ACCURATE and the route is PHYSICALLY POSSIBLE for ${transport_type}.`,
      add_context_from_internet: false,
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