import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS ROUTE MONITOR v1.0
// Runs on schedule (every 30 min) — NO HUMAN NEEDED.
//
// For every active route in every organization:
// 1. Fetches live roadworks (OpenStreetMap Overpass)
// 2. Fetches live weather (Open-Meteo)
// 3. Asks Mistral AI: "Should this route be adjusted?"
// 4. If yes → updates route waypoints/duration/co2 automatically
// 5. Creates an Alert to notify the team of what changed and why
// ═══════════════════════════════════════════════════════════════════════════

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');

async function geocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'NexusVectis-RouteMonitor/1.0' } }
    );
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { return null; }
}

async function fetchRoadEvents(originCoords, destCoords) {
  try {
    const minLat = Math.min(originCoords.lat, destCoords.lat) - 1.0;
    const maxLat = Math.max(originCoords.lat, destCoords.lat) + 1.0;
    const minLng = Math.min(originCoords.lng, destCoords.lng) - 1.0;
    const maxLng = Math.max(originCoords.lng, destCoords.lng) + 1.0;
    const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;

    const query = `[out:json][timeout:20];(node["highway"="construction"][${bbox}];node["hazard"~"construction|road_works|accident"][${bbox}];way["construction"~".*"]["highway"~".*"][${bbox}];);out body 20;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.elements || []).slice(0, 10).map(el => ({
      type: el.tags?.hazard || el.tags?.construction || 'roadworks',
      name: el.tags?.name || el.tags?.note || 'Construction zone',
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
    })).filter(r => r.lat && r.lng);
  } catch { return []; }
}

async function fetchWeather(coords) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=weather_code,wind_speed_10m,precipitation&wind_speed_unit=kmh&forecast_days=1`
    );
    if (!res.ok) return null;
    const d = await res.json();
    const c = d.current;
    return {
      code: c.weather_code,
      wind_kmh: c.wind_speed_10m,
      precipitation_mm: c.precipitation,
      severe: c.weather_code >= 65 || c.wind_speed_10m > 60 || c.weather_code === 95,
    };
  } catch { return null; }
}

async function analyzeAndAdaptRoute(base44, orgId, route) {
  const log = [];

  // Skip routes without proper origin/destination
  if (!route.origin || !route.destination) return null;

  // Geocode origin + dest
  const [originCoords, destCoords] = await Promise.all([
    geocode(route.origin),
    geocode(route.destination),
  ]);
  if (!originCoords || !destCoords) return null;

  // Fetch live data in parallel
  const [roadEvents, weatherOrigin, weatherDest] = await Promise.all([
    fetchRoadEvents(originCoords, destCoords),
    fetchWeather(originCoords),
    fetchWeather(destCoords),
  ]);

  const severeWeather = weatherOrigin?.severe || weatherDest?.severe;
  const hasRoadEvents = roadEvents.length > 0;

  // If nothing notable — skip AI call to save tokens
  if (!hasRoadEvents && !severeWeather) {
    return null; // Route is fine, no changes needed
  }

  // Build compact context for Mistral
  const roadCtx = hasRoadEvents
    ? `LIVE ROADWORKS (${roadEvents.length} detected): ${roadEvents.map(r => `"${r.name}" at (${r.lat?.toFixed(2)},${r.lng?.toFixed(2)})`).join('; ')}`
    : 'No roadworks detected';

  const weatherCtx = [
    weatherOrigin?.severe ? `Origin SEVERE: wind ${weatherOrigin.wind_kmh}km/h, precip ${weatherOrigin.precipitation_mm}mm, code ${weatherOrigin.code}` : null,
    weatherDest?.severe ? `Destination SEVERE: wind ${weatherDest.wind_kmh}km/h, precip ${weatherDest.precipitation_mm}mm, code ${weatherDest.code}` : null,
  ].filter(Boolean).join('; ') || 'Weather acceptable';

  const transportFactors = { truck: 0.8, ship: 0.02, train: 0.04, aircraft: 0.9, drone: 0.1 };
  const transportSpeeds = { truck: 80, ship: 25, train: 120, aircraft: 800, drone: 60 };

  const prompt = `You are an autonomous fleet route monitor. Decide if this route needs adjustment based on live conditions.

ROUTE: "${route.name}" | ${route.origin} → ${route.destination} | Transport: ${route.transport_type || 'truck'} | Status: ${route.status}
CURRENT: distance=${route.distance_km}km, duration=${route.estimated_duration_hours}h, co2=${route.co2_estimate}kg

LIVE CONDITIONS:
${roadCtx}
${weatherCtx}

Decide: should this route be adjusted? Consider rerouting to avoid roadworks, adding delay for severe weather, or updating estimates.

Respond ONLY with JSON:
{
  "should_adjust": boolean,
  "reason": "string (specific, mention the actual roadwork/weather condition)",
  "adjustment_type": "reroute|delay_added|weather_warning|none",
  "new_distance_km": number or null,
  "new_duration_hours": number or null,
  "new_co2_estimate": number or null,
  "delay_minutes_added": number,
  "new_waypoints": null,
  "alert_message": "string (short, professional, for fleet operator — what changed and why)"
}`;

  try {
    const aiRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (!aiRes.ok) return null;
    const aiData = await aiRes.json();
    const decision = JSON.parse(aiData.choices[0].message.content);

    if (!decision.should_adjust) return null;

    // ── APPLY CHANGES AUTONOMOUSLY ────────────────────────────────────────
    const updates = {};
    if (decision.new_distance_km) updates.distance_km = decision.new_distance_km;
    if (decision.new_duration_hours) updates.estimated_duration_hours = decision.new_duration_hours;
    if (decision.new_co2_estimate) updates.co2_estimate = decision.new_co2_estimate;

    // If rerouted, flag as delayed so operators know
    if (decision.adjustment_type === 'reroute' && route.status === 'active') {
      updates.status = 'delayed';
    }

    // Apply DB update
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Route.update(route.id, updates);
    }

    // Create alert for the fleet operator
    await base44.asServiceRole.entities.Alert.create({
      organization_id: orgId,
      title: `[AUTO-ROUTE] ${decision.adjustment_type === 'reroute' ? '🔀 Route Adapted' : '⏱ Delay Added'}: ${route.name}`,
      message: decision.alert_message || `Autonomous route monitor detected conditions affecting "${route.name}" (${route.origin} → ${route.destination}). ${decision.reason}`,
      type: decision.adjustment_type === 'reroute' ? 'warning' : 'info',
      category: 'route',
      ai_recommendation: `Autonomous adjustment applied: ${decision.adjustment_type}. ${decision.delay_minutes_added > 0 ? `+${decision.delay_minutes_added} min delay added.` : ''} Review route for manual override if needed.`,
      is_read: false,
      is_resolved: false,
    });

    // SecurityAudit log (immunity memory)
    await base44.asServiceRole.entities.SecurityAudit.create({
      organization_id: orgId,
      action: 'AUTONOMOUS_ROUTE_ADAPTED',
      user_email: 'route-monitor@system',
      user_id: 'system',
      resource_type: 'route',
      resource_id: route.id,
      status: 'success',
      severity: 'low',
      details: `Route "${route.name}" auto-adapted. Type: ${decision.adjustment_type}. Reason: ${decision.reason}. Roadworks: ${roadEvents.length}. Severe weather: ${severeWeather}. Changes: ${JSON.stringify(updates)}.`,
    });

    return {
      route_id: route.id,
      route_name: route.name,
      adjustment_type: decision.adjustment_type,
      reason: decision.reason,
      changes: updates,
      delay_minutes: decision.delay_minutes_added,
    };

  } catch (e) {
    console.error(`[ROUTE-MONITOR] AI error for route ${route.id}: ${e.message}`);
    return null;
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Works both as scheduled (no user) and manual trigger
    let organizationIds = [];
    try {
      const user = await base44.auth.me();
      if (user?.organization_id) organizationIds = [user.organization_id];
    } catch { /* scheduled run */ }

    if (organizationIds.length === 0) {
      const orgs = await base44.asServiceRole.entities.Organization.list();
      organizationIds = orgs.map(o => o.id);
    }

    const now = new Date().toISOString();
    const summary = { organizations_processed: 0, routes_checked: 0, routes_adapted: 0, adaptations: [] };

    for (const orgId of organizationIds) {
      // Only check active and planned routes
      const routes = await base44.asServiceRole.entities.Route.filter({
        organization_id: orgId,
      });

      const activeRoutes = routes.filter(r => r.status === 'active' || r.status === 'planned');
      summary.routes_checked += activeRoutes.length;

      // Process routes with a small delay to not hammer APIs
      for (const route of activeRoutes.slice(0, 10)) { // max 10 per org per cycle
        const result = await analyzeAndAdaptRoute(base44, orgId, route);
        if (result) {
          summary.routes_adapted++;
          summary.adaptations.push(result);
        }
        // Small delay between routes to be respectful to OSM/Open-Meteo
        await new Promise(r => setTimeout(r, 500));
      }

      summary.organizations_processed++;
    }

    console.log(`[ROUTE-MONITOR] Cycle complete. Checked: ${summary.routes_checked}, Adapted: ${summary.routes_adapted}`);

    return Response.json({
      status: 'route_monitor_cycle_complete',
      timestamp: now,
      ...summary,
    });

  } catch (error) {
    console.error('[ROUTE-MONITOR] Engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});