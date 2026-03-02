import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Geocode a location name to lat/lng using Nominatim (OpenStreetMap)
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } });
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Could not find location: ${query}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
}

// Get real road/driving route from OSRM (free, no API key)
async function getOSRMRoute(originCoords, destCoords, profile = 'driving') {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM could not find a route');
  return data.routes[0];
}

// Sample geometry points to get evenly spaced waypoints
function sampleGeometry(coordinates, numPoints = 15) {
  if (coordinates.length <= numPoints) return coordinates;
  const step = (coordinates.length - 1) / (numPoints - 1);
  const sampled = [];
  for (let i = 0; i < numPoints; i++) {
    const idx = Math.round(i * step);
    sampled.push(coordinates[Math.min(idx, coordinates.length - 1)]);
  }
  return sampled;
}

// Get a readable name for a coordinate using reverse geocoding
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } });
    const data = await res.json();
    const parts = data.address || {};
    return parts.city || parts.town || parts.village || parts.county || parts.state || `${lat.toFixed(2)},${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }
}

// For ships: use OpenSeaMap routing via OSRM maritime or fallback to great circle with coast avoidance
async function getSeaRoute(originCoords, destCoords) {
  // Try sea routing via OSRM (it has a maritime profile on some servers)
  // Fallback: use the LLM to generate a realistic sea route with proper waypoints
  return null; // Will use LLM for ships
}

// CO2 and speed factors per transport type
const TRANSPORT_FACTORS = {
  truck:    { speed: 80,   co2: 0.8,  osrmProfile: 'driving' },
  train:    { speed: 120,  co2: 0.04, osrmProfile: 'driving' }, // OSRM for train not available, use driving as approx
  aircraft: { speed: 800,  co2: 0.9,  osrmProfile: null },
  drone:    { speed: 60,   co2: 0.1,  osrmProfile: null },
  ship:     { speed: 25,   co2: 0.02, osrmProfile: null },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { origin, destination, transport_type = 'truck' } = await req.json();
    if (!origin || !destination) return Response.json({ error: 'Origin and destination required' }, { status: 400 });

    const factors = TRANSPORT_FACTORS[transport_type] || TRANSPORT_FACTORS.truck;

    // Step 1: Geocode both endpoints
    const [originCoords, destCoords] = await Promise.all([
      geocode(origin),
      geocode(destination)
    ]);

    let waypoints = [];
    let distance_km = 0;
    let estimated_duration_hours = 0;
    let co2_estimate = 0;
    let route_description = '';

    if (factors.osrmProfile && transport_type !== 'ship' && transport_type !== 'aircraft' && transport_type !== 'drone') {
      // Use OSRM for real road routing (truck, train approximation)
      const osrmProfile = transport_type === 'truck' ? 'driving' : 'driving';
      const route = await getOSRMRoute(originCoords, destCoords, osrmProfile);

      distance_km = Math.round(route.distance / 1000);
      estimated_duration_hours = Math.round((route.duration / 3600) * 10) / 10;
      co2_estimate = Math.round(distance_km * factors.co2 * 10) / 10;

      // Sample waypoints from actual route geometry
      const coords = route.geometry.coordinates; // [lng, lat] pairs
      const sampled = sampleGeometry(coords, Math.min(20, Math.max(8, Math.floor(coords.length / 50))));

      // Reverse geocode key points (start, end, and a few in between)
      const keyIndices = [0, Math.floor(sampled.length / 4), Math.floor(sampled.length / 2), Math.floor(3 * sampled.length / 4), sampled.length - 1];
      const uniqueIndices = [...new Set(keyIndices)];

      const names = await Promise.all(
        uniqueIndices.map(i => reverseGeocode(sampled[i][1], sampled[i][0]))
      );

      // Build full waypoint list with named key points
      waypoints = sampled.map((coord, idx) => {
        const keyIdx = uniqueIndices.indexOf(idx);
        const name = keyIdx >= 0 ? names[keyIdx] : null;
        return {
          lat: Math.round(coord[1] * 100000) / 100000,
          lng: Math.round(coord[0] * 100000) / 100000,
          name: name || (idx === 0 ? originCoords.name : idx === sampled.length - 1 ? destCoords.name : `Route point ${idx + 1}`)
        };
      });

      // Always set correct names for first and last
      waypoints[0].name = originCoords.name;
      waypoints[waypoints.length - 1].name = destCoords.name;

      // Get major city names along the route from steps
      const stepNames = route.legs?.[0]?.steps
        ?.filter(s => s.maneuver?.type === 'turn' || s.maneuver?.type === 'roundabout')
        ?.map(s => s.name)
        ?.filter(n => n && n.length > 3) || [];

      route_description = `Real road route via OSRM. ${distance_km} km on road network. Passes through key junctions along the way.`;

    } else {
      // For ships, aircraft, drones: use AI with internet to plan realistic route
      const prompt = transport_type === 'ship'
        ? `Plan a realistic maritime shipping route from ${origin} (${originCoords.lat}, ${originCoords.lng}) to ${destination} (${destCoords.lat}, ${destCoords.lng}).

CRITICAL RULES FOR SHIP ROUTES:
- Ships ONLY sail on water (seas, oceans, canals, straits)
- Routes MUST go around land masses - NO lines crossing land
- Add enough waypoints so each segment stays in water
- Include real shipping lanes, straits, and canals (Kiel Canal, English Channel, Strait of Gibraltar, Suez Canal, etc.)
- Use 10-20 waypoints for complex routes to ensure water-only path
- Start at port near ${origin}, end at port near ${destination}

Give precise lat/lng coordinates that follow actual shipping lanes.
Distance should be calculated along the actual water route (not straight line).`

        : transport_type === 'aircraft'
        ? `Plan a realistic aircraft flight route from ${origin} (${originCoords.lat}, ${originCoords.lng}) to ${destination} (${destCoords.lat}, ${destCoords.lng}).
Use standard aviation waypoints and airways. Include departure, en-route waypoints, and arrival.
Aircraft fly at ~800 km/h. Include 5-8 realistic waypoints along the great circle route.`

        : `Plan a realistic drone route from ${origin} (${originCoords.lat}, ${originCoords.lng}) to ${destination} (${destCoords.lat}, ${destCoords.lng}).
Drones fly in fairly straight lines but may avoid urban areas and restricted airspace.
Include 4-6 waypoints. Drone speed ~60 km/h.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
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

      waypoints = result.waypoints || [];
      distance_km = result.distance_km || 0;
      estimated_duration_hours = result.estimated_duration_hours || Math.round(distance_km / factors.speed * 10) / 10;
      co2_estimate = result.co2_estimate || Math.round(distance_km * factors.co2 * 10) / 10;
      route_description = result.route_description || '';
    }

    return Response.json({
      success: true,
      route_data: {
        waypoints,
        distance_km,
        estimated_duration_hours,
        co2_estimate,
        route_description,
        origin: { ...originCoords },
        destination: { ...destCoords },
        transport_type
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});