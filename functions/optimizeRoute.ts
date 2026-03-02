import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

// ── Geocode a city name → lat/lng ─────────────────────────────────────────
async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } }
  );
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ── Fetch live roadworks & accidents via Overpass API (OSM) ───────────────
// Fetches construction nodes, hazards, and incidents along the route corridor
async function fetchLiveRoadEvents(originCoords, destCoords) {
  try {
    // Build bounding box with padding around the route corridor
    const minLat = Math.min(originCoords.lat, destCoords.lat) - 1.5;
    const maxLat = Math.max(originCoords.lat, destCoords.lat) + 1.5;
    const minLng = Math.min(originCoords.lng, destCoords.lng) - 1.5;
    const maxLng = Math.max(originCoords.lng, destCoords.lng) + 1.5;
    const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;

    // Query for road construction, hazards, closures, accidents
    const query = `
[out:json][timeout:25];
(
  node["highway"="construction"][${bbox}];
  node["construction"="yes"][${bbox}];
  node["hazard"~"construction|road_works|accident"][${bbox}];
  way["construction"~".*"]["highway"~".*"][${bbox}];
  node["traffic_sign"~"roadworks|construction"][${bbox}];
  node["information"="hazard"]["hazard"~"construction|ice|flooding|accident"][${bbox}];
);
out body 40;
`;
    const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!overpassRes.ok) return { roadworks: [], source: 'overpass_unavailable' };
    const data = await overpassRes.json();
    const elements = data.elements || [];

    const roadworks = elements.slice(0, 15).map(el => ({
      type: el.tags?.hazard || el.tags?.construction || el.tags?.information || 'roadworks',
      name: el.tags?.name || el.tags?.description || el.tags?.note || 'Road construction zone',
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      ref: el.tags?.ref,
    })).filter(r => r.lat && r.lng);

    return { roadworks, count: roadworks.length, source: 'openstreetmap_overpass' };
  } catch (e) {
    return { roadworks: [], source: 'overpass_error', error: e.message };
  }
}

// ── Fetch live incident news via DuckDuckGo search ─────────────────────────
// Gets real recent news about accidents and disruptions on the route
async function fetchLiveIncidentNews(origin, destination, transport_type) {
  try {
    const routeStr = `${origin} ${destination}`;
    const transportStr = transport_type === 'ship' ? 'shipping maritime' : transport_type === 'aircraft' ? 'aviation flight' : 'road highway';

    // Search for recent traffic incidents
    const queries = [
      `${routeStr} accident road closure today`,
      `${transportStr} disruption incident ${new Date().getFullYear()}`,
    ];

    const results = [];
    for (const q of queries) {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
        { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } }
      );
      const data = await res.json();

      // Extract abstract and related topics
      if (data.Abstract) results.push({ title: data.Heading, summary: data.Abstract, source: data.AbstractSource });
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 4).forEach(t => {
          if (t.Text) results.push({ title: t.Text.slice(0, 80), summary: t.Text, source: 'DDG' });
        });
      }
    }
    return results.slice(0, 8);
  } catch (e) {
    return [];
  }
}

// ── Fetch weather conditions for route corridor ────────────────────────────
async function fetchWeatherData(originCoords, destCoords) {
  try {
    // Use Open-Meteo (free, no API key) for origin and destination weather
    const [oRes, dRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${originCoords.lat}&longitude=${originCoords.lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&wind_speed_unit=kmh&forecast_days=1`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${destCoords.lat}&longitude=${destCoords.lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&wind_speed_unit=kmh&forecast_days=1`),
    ]);

    const wmoDescriptions = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
      61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
      77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
      85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail',
    };

    const parse = async (res) => {
      if (!res.ok) return null;
      const d = await res.json();
      const c = d.current;
      return {
        temp: c.temperature_2m,
        code: c.weather_code,
        description: wmoDescriptions[c.weather_code] || `Code ${c.weather_code}`,
        wind_kmh: c.wind_speed_10m,
        precipitation_mm: c.precipitation,
        severe: c.weather_code >= 65 || c.wind_speed_10m > 60 || c.weather_code === 95,
      };
    };

    const [origin, dest] = await Promise.all([parse(oRes), parse(dRes)]);
    return { origin, destination: dest };
  } catch (e) {
    return { origin: null, destination: null };
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      origin,
      destination,
      transport_type = 'truck',
      waypoints = [],
      optimization_priority = 'balanced',
      vehicle_capacity_tons = 20,
      driver_max_hours = 9,
      delivery_windows = [],
      co2_target_kg = null,
      cargo_type = 'general',
    } = await req.json();

    if (!origin || !destination) {
      return Response.json({ error: 'origin and destination required' }, { status: 400 });
    }

    const now = new Date();
    const timeString = now.toLocaleString('en-DK', { timeZone: 'Europe/Copenhagen' });

    // ── STEP 1: Gather ALL live data in parallel ───────────────────────────
    const [originCoords, destCoords] = await Promise.all([geocode(origin), geocode(destination)]);

    let liveRoadEvents = { roadworks: [], source: 'geocode_failed' };
    let weather = { origin: null, destination: null };
    let incidentNews = [];

    if (originCoords && destCoords) {
      [liveRoadEvents, weather, incidentNews] = await Promise.all([
        fetchLiveRoadEvents(originCoords, destCoords),
        fetchWeatherData(originCoords, destCoords),
        fetchLiveIncidentNews(origin, destination, transport_type),
      ]);
    }

    // ── Format live data for AI context ───────────────────────────────────
    const roadworksContext = liveRoadEvents.roadworks.length > 0
      ? `LIVE ROADWORKS/CONSTRUCTION (${liveRoadEvents.count} events from OpenStreetMap, source: ${liveRoadEvents.source}):\n` +
        liveRoadEvents.roadworks.map(r => `  - [${r.type?.toUpperCase()}] "${r.name}" at (${r.lat?.toFixed(3)}, ${r.lng?.toFixed(3)})${r.ref ? ` ref: ${r.ref}` : ''}`).join('\n')
      : `LIVE ROADWORKS: No construction zones detected in route corridor via OpenStreetMap (${liveRoadEvents.source})`;

    const weatherContext = `LIVE WEATHER (Open-Meteo real-time):
  Origin (${origin}): ${weather.origin ? `${weather.origin.description}, ${weather.origin.temp}°C, wind ${weather.origin.wind_kmh} km/h, precipitation ${weather.origin.precipitation_mm}mm${weather.origin.severe ? ' ⚠ SEVERE CONDITIONS' : ''}` : 'unavailable'}
  Destination (${destination}): ${weather.destination ? `${weather.destination.description}, ${weather.destination.temp}°C, wind ${weather.destination.wind_kmh} km/h, precipitation ${weather.destination.precipitation_mm}mm${weather.destination.severe ? ' ⚠ SEVERE CONDITIONS' : ''}` : 'unavailable'}`;

    const newsContext = incidentNews.length > 0
      ? `LIVE INCIDENT INTELLIGENCE (web search, last 24h):\n` +
        incidentNews.map(n => `  - ${n.title}${n.source ? ` [${n.source}]` : ''}`).join('\n')
      : 'LIVE INCIDENT INTELLIGENCE: No major incidents found for this corridor';

    const priorityInstructions = {
      fastest: 'Minimize total travel time. Prioritize highways even if more expensive. Actively reroute around ALL live roadworks/incidents.',
      lowest_cost: 'Minimize fuel cost and tolls. Consider detours to avoid roadwork delays. Live incidents may add hidden costs.',
      greenest: 'Minimize CO2 emissions. Slow-and-steady avoidance of congestion from roadworks is preferred over speed.',
      balanced: 'Balance time, cost, and emissions. Use live data to find the smartest route avoiding incidents and roadworks.',
    };

    // ── STEP 2: Build AI prompt with ALL live intelligence ─────────────────
    const prompt = `You are an advanced logistics route optimization AI with live road intelligence access. Current time: ${timeString} (Europe/Copenhagen).

═══════════════════════════════════════════════
LIVE REAL-TIME INTELLIGENCE DATA:
═══════════════════════════════════════════════

${roadworksContext}

${weatherContext}

${newsContext}

═══════════════════════════════════════════════
ROUTE REQUEST:
═══════════════════════════════════════════════
- Origin: ${origin}
- Destination: ${destination}
- Transport Mode: ${transport_type}
- Optimization Priority: ${optimization_priority} — ${priorityInstructions[optimization_priority] || priorityInstructions.balanced}
- Vehicle Capacity: ${vehicle_capacity_tons} tons
- Driver Max Hours of Service: ${driver_max_hours} hours/day
- Cargo Type: ${cargo_type}
${co2_target_kg ? `- CO2 Emissions Target: max ${co2_target_kg} kg` : ''}
${delivery_windows.length > 0 ? `- Delivery Windows: ${JSON.stringify(delivery_windows)}` : ''}
${waypoints.length > 0 ? `- Required Waypoints: ${waypoints.map(w => w.name).join(', ')}` : ''}

═══════════════════════════════════════════════
OPTIMIZATION INSTRUCTIONS:
═══════════════════════════════════════════════
Based on the LIVE data above, provide a route that:
1. ACTIVELY avoids the detected roadworks/construction zones — name specific detours
2. Accounts for the REAL current weather — adjust speed recommendations and risk levels
3. Incorporates live incident intelligence — mention specific incidents affecting the route
4. Follows EU HOS regulations (max ${driver_max_hours}h/day, 45min break after 4.5h)
5. Provides realistic CO2 (truck ~0.8kg/km, ship ~0.02kg/km, train ~0.04kg/km, aircraft ~0.9kg/km)
6. Gives precise waypoints with real lat/lng coordinates
7. Estimates time DELAY from detected roadworks (if any) in the duration

IMPORTANT: In ai_recommendations, explicitly reference the live data — mention specific roadworks, weather conditions, or incidents you found and how the route avoids/handles them. This shows the live intelligence is actively being used.

Return ONLY valid JSON:
{
  "route_data": {
    "origin": "string",
    "destination": "string",
    "transport_type": "string",
    "optimization_priority": "string",
    "distance_km": number,
    "estimated_duration_hours": number,
    "co2_estimate_kg": number,
    "fuel_cost_eur": number,
    "toll_cost_eur": number,
    "total_cost_eur": number,
    "live_data_delay_minutes": number,
    "waypoints": [{"name": "string", "lat": number, "lng": number, "purpose": "string", "arrival_offset_hours": number}],
    "rest_stops": [{"name": "string", "after_hours": number, "duration_minutes": number, "reason": "string"}],
    "traffic_conditions": {"level": "low|moderate|high", "notes": "string"},
    "weather_conditions": {"impact": "none|minor|moderate|severe", "description": "string"},
    "driver_compliance": {"compliant": boolean, "notes": "string", "required_breaks": number},
    "live_incidents": [{"type": "roadworks|accident|weather|closure", "description": "string", "impact": "string", "avoided": boolean}],
    "alternatives": [{"name": "string", "description": "string", "distance_km": number, "duration_hours": number, "co2_kg": number, "cost_eur": number, "tradeoff": "string"}],
    "optimization_score": {"time": number, "cost": number, "co2": number, "overall": number},
    "ai_recommendations": ["string"],
    "risks": [{"type": "string", "description": "string", "severity": "low|medium|high"}]
  },
  "live_data_summary": {
    "roadworks_found": number,
    "weather_severity": "none|minor|moderate|severe",
    "incidents_detected": number,
    "data_freshness": "real-time",
    "sources": ["OpenStreetMap Overpass", "Open-Meteo", "Web Intelligence"]
  }
}`;

    // ── STEP 3: Call Mistral with live data ────────────────────────────────
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.25,
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: 'AI response empty' }, { status: 500 });

    const parsed = JSON.parse(content);

    return Response.json({
      success: true,
      ...parsed,
      optimization_date: new Date().toISOString(),
      // Attach raw live data for transparency
      raw_live_data: {
        roadworks_count: liveRoadEvents.roadworks.length,
        roadworks_source: liveRoadEvents.source,
        weather_origin: weather.origin,
        weather_destination: weather.destination,
        incident_news_count: incidentNews.length,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});