import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, transport_type } = await req.json();

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Plan a realistic ${transport_type} route from ${origin} to ${destination}.

STEP 1: Search Google Maps/web for the ACTUAL route:
- Type "${origin} to ${destination}" in Google Maps
- Look at the real route shown
- Note major points along the way

STEP 2: Create waypoints (${transport_type === 'ship' ? '8-15' : '6-10'} points):
- Start at ${origin} (get real coordinates)
- Add major intermediate points on the route
- End at ${destination} (get real coordinates)

${transport_type === 'ship' ? `SHIP RULES - CRITICAL:
- Ships ONLY sail on water (seas, oceans, canals, straits)
- Follow REAL shipping lanes that curve around coastlines
- Add MORE waypoints to curve routes around land masses
- Include straits/canals (Kiel Canal, English Channel, Strait of Gibraltar, etc.)
- NO straight lines across land - routes must bend around coastlines
- Example: Copenhagen→London = 8-10 waypoints curving around Denmark through North Sea
- Example: Barcelona→Naples = 10+ waypoints following Mediterranean coastline
- Use enough waypoints so lines between them stay in water` : ''}
${transport_type === 'truck' ? `TRUCK RULES:
- Follow major highways (E-roads, motorways)
- Include cities/junctions as waypoints
- Use bridges/ferries where needed` : ''}
${transport_type === 'train' ? `TRAIN RULES:
- Follow existing rail networks only
- Include major train stations
- Use rail bridges/tunnels
- If no rail exists, say "NO ROUTE"` : ''}

STEP 3: Verify waypoints are:
- On the actual route (not random)
- In correct order
- Have accurate coordinates

STEP 4: Calculate:
- Distance (km): sum of all segments
- Duration: distance ÷ speed (ship=25, truck=80, train=120, aircraft=800 km/h)
- CO2: distance × factor (ship=0.02, truck=0.8, train=0.04, aircraft=0.9 kg/km)

Be precise and realistic. Use web search to get accurate data.`,
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