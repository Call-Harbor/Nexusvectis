import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, transport_type } = await req.json();

    // Use LLM with web search to get REAL, ACCURATE geographic route planning
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional maritime/logistics route planner. Plan a REALISTIC route from ${origin} to ${destination} using ${transport_type}.

🔴 CRITICAL REQUIREMENTS - READ CAREFULLY:

1. SEARCH THE WEB FIRST:
   - Search Google Maps for the exact route from ${origin} to ${destination}
   - Look at REAL shipping lanes, roads, or rail tracks
   - Use actual geographic data - DO NOT guess or make up coordinates

2. TRANSPORT RULES - FOLLOW PHYSICS:
${transport_type === 'ship' ? `
   🚢 SHIPS SAIL ON WATER ONLY:
   - Ships CANNOT cross land - they must follow seas, straits, and canals
   - Example Copenhagen→London: 
     * Sail AROUND Denmark through Kattegat, Skagerrak, North Sea
     * OR use Kiel Canal shortcut (Baltic→North Sea)
     * Then English Channel to London
   - Each waypoint = a real port or passage (Kiel Canal, Dover Strait, etc.)
   - Follow actual shipping routes you find on Google Maps or MarineTraffic
` : transport_type === 'truck' ? `
   🚛 TRUCKS USE ROADS:
   - Follow E-roads and highways (E45, E20, A1, M1, etc.)
   - Include real cities/junctions as waypoints
   - Use bridges/ferries where needed (Øresund Bridge, Great Belt Bridge)
   - Look up the actual highway route on Google Maps
` : transport_type === 'train' ? `
   🚂 TRAINS USE RAIL TRACKS:
   - Follow existing rail networks only
   - Include real train stations (Hamburg Hbf, Brussels-Zuid, etc.)
   - Use rail bridges/tunnels (Øresund Bridge, Channel Tunnel)
   - If no rail connection exists, say "NO RAIL ROUTE AVAILABLE"
` : transport_type === 'aircraft' ? `
   ✈️ AIRCRAFT FLY DIRECT:
   - Planes fly relatively straight (great circle route)
   - Include departure/arrival airports
   - Add 1 waypoint for very long routes
` : `
   🚁 DRONES:
   - Low altitude, need stops every 100km
   - Relatively direct with charging stops
`}

3. GET ACCURATE COORDINATES:
   - Search for REAL coordinates of each city/port/waypoint
   - Double-check they are correct (London ≈ 51.5°N, Copenhagen ≈ 55.7°N)
   - DO NOT invent coordinates

4. WAYPOINTS (5-10 points):
   - Start: ${origin} (search exact coordinates)
   - Middle: Real geographic points on the route (ports, straits, cities, junctions)
   - End: ${destination} (search exact coordinates)
   ${transport_type === 'ship' ? '- For ships: Include major passages like "Skaw (tip of Denmark)", "Kiel Canal exit", "Dover Strait"' : ''}

5. CALCULATE REALISTIC VALUES:
   - Distance: Measure the ACTUAL route distance in km
   - Duration: Use realistic speeds (ship=25km/h, truck=80km/h, train=120km/h, aircraft=800km/h)
   - CO2: distance × emission_factor (ship=0.02, truck=0.8, train=0.04, aircraft=0.9 kg/km)

6. DESCRIPTION:
   - Explain the route clearly: which waters/roads/rails are used
   - Mention any interesting passages (Kiel Canal, Channel Tunnel, etc.)
   - Keep it factual and professional

🚨 FINAL CHECK BEFORE OUTPUT:
- Is every waypoint actually on the route? (not random points)
- Can ${transport_type} physically travel between each consecutive waypoint?
- Are coordinates realistic? (Europe = 40-70°N, -10 to 30°E)
- Does the route make geographic sense?

If you're not confident, SEARCH GOOGLE MAPS for "${origin} to ${destination} by ${transport_type}" and use that route.`,
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