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
      prompt: `You are an expert logistics route planner with deep knowledge of European geography and transport infrastructure.

TASK: Plan a realistic route from ${origin} to ${destination} using ${transport_type} transport.

STEP 1 - UNDERSTAND THE GEOGRAPHY:
- Look up the actual locations of ${origin} and ${destination}
- Identify what bodies of water, land masses, and infrastructure exist between them
- Consider the physical constraints of ${transport_type} transport

STEP 2 - APPLY TRANSPORT-SPECIFIC RULES:
${transport_type === 'ship' ? `
🚢 SHIPS - WATER ONLY RULES:
- Ships sail ONLY on seas, oceans, rivers, and canals - NEVER over land
- Between ports, verify there is a continuous water route
- Example: Copenhagen to London = sail through Øresund → Kattegat → Skagerrak → North Sea → English Channel
- Must go AROUND peninsulas (e.g., around Jutland, not through it)
- Each waypoint must be a real port accessible by previous waypoint via water
- Use: Kiel Canal (Baltic to North Sea), English Channel, North Sea routes, Baltic Sea routes
- NO straight lines across land - follow the coastline and shipping lanes
` : transport_type === 'truck' ? `
🚛 TRUCKS - ROAD ONLY RULES:
- Follow highways and major road networks (E-roads, motorways)
- Include highway junctions and cities as waypoints
- Route must follow existing paved roads
- Consider ferry crossings where needed (e.g., Denmark to Sweden via Øresund Bridge or ferry)
` : transport_type === 'train' ? `
🚂 TRAINS - RAIL ONLY RULES:
- Trains run ONLY on existing railway tracks - cannot deviate
- NO straight lines across water unless there's a rail bridge/tunnel (Øresund Bridge, Great Belt Bridge, Channel Tunnel)
- Route must follow the actual rail network curves and connections
- Include major train stations as waypoints (e.g., Hamburg Hbf, Copenhagen Central, Malmö Central)
- Example: Aarhus to Hamburg = follow rail through Fredericia → cross Great Belt → through Zealand → Øresund Bridge → Swedish rail → back to German rail
- If no direct rail exists, the route is NOT POSSIBLE
` : transport_type === 'aircraft' ? `
✈️ AIRCRAFT - AIR ONLY RULES:
- Aircraft fly in relatively straight lines at high altitude
- Include major airports as origin/destination
- Can add 1-2 waypoints for very long distances (fuel stops or air corridors)
- Much simpler routing than ground/sea transport
` : `
🚁 DRONES - LOW ALTITUDE RULES:
- Drones fly low and need recharge stations every 50-150km
- Must avoid restricted airspace (airports, military zones)
- Semi-direct routing with necessary stops
`}

STEP 3 - CHECK LIVE CONDITIONS:
- Search for CURRENT weather conditions between ${origin} and ${destination}
- Check for road works, construction, or infrastructure disruptions on the route
- Look for traffic incidents, strikes, or delays affecting ${transport_type}
- Check maritime conditions if ship (storms, port closures, ice)
- Check rail disruptions if train (track work, signal failures)
- Check airspace restrictions if aircraft

STEP 4 - BUILD THE ROUTE:
- Start at ${origin} (find exact coordinates)
- Plan 4-8 intermediate waypoints that physically make sense
- AVOID areas with severe weather, closures, or major disruptions
- Choose alternative routes if main route is blocked or dangerous
- End at ${destination} (find exact coordinates)
- Each segment must be physically possible for ${transport_type}

STEP 6 - VERIFY:
- Check: Can you actually ${transport_type === 'ship' ? 'sail' : transport_type === 'train' ? 'take a train' : transport_type === 'truck' ? 'drive' : 'fly'} from waypoint 1 to waypoint 2? 
- Check: Is there continuous ${transport_type === 'ship' ? 'water' : transport_type === 'train' ? 'rail' : transport_type === 'truck' ? 'road' : 'air'} between each pair?
- If not, REVISE the route

STEP 7 - CALCULATE:
- Total distance in km (sum of all segments)
- Duration: Adjust base speed for conditions (bad weather = slower, traffic = delays)
  Base speeds: ship=30km/h, truck=80km/h, train=120km/h, aircraft=800km/h, drone=60km/h
- CO2 emissions: ship=0.02, truck=0.8, aircraft=0.9, train=0.04, drone=0.3 kg per km
- Add delay estimates from disruptions (e.g., +2h for storm, +1h for road work)

STEP 8 - DOCUMENT CONDITIONS:
- In route_description, mention any weather, disruptions, or delays found
- Explain why certain routes were chosen or avoided
- Note any real-time conditions affecting the route

Output a route that is GEOGRAPHICALLY ACCURATE, PHYSICALLY POSSIBLE, and OPTIMIZED for CURRENT CONDITIONS for ${transport_type} transport.`,
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