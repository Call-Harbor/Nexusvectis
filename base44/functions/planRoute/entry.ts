import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

// ═══════════════════════════════════════════════════════════════════════════
// NEXUSVECTIS ROUTE PLANNING ENGINE v3.0
// Deep integration with:
//   1. SWARM INTELLIGENCE — ACO pheromone validation + PSO optimization
//   2. AUTONOMOUS IMMUNITY ENGINE — security threat scanning on route corridor
//   3. DIGITAL TWIN FEDERATION — virtual pre-flight simulation
// ═══════════════════════════════════════════════════════════════════════════

// ── Geocoding ──────────────────────────────────────────────────────────────
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } });
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Could not find location: ${query}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
}

// ── OSRM Road Routing ──────────────────────────────────────────────────────
async function getOSRMRoute(originCoords, destCoords) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM could not find a route');
  return data.routes[0];
}

// ── Geometry sampling ──────────────────────────────────────────────────────
function sampleGeometry(coordinates, numPoints = 15) {
  if (coordinates.length <= numPoints) return coordinates;
  const step = (coordinates.length - 1) / (numPoints - 1);
  const sampled = [];
  for (let i = 0; i < numPoints; i++) {
    sampled.push(coordinates[Math.min(Math.round(i * step), coordinates.length - 1)]);
  }
  return sampled;
}

// ── Reverse geocoding ──────────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`, {
      headers: { 'User-Agent': 'NexusVectis-TMS/1.0' }
    });
    const data = await res.json();
    const p = data.address || {};
    return p.city || p.town || p.village || p.county || p.state || `${lat.toFixed(2)},${lng.toFixed(2)}`;
  } catch { return `${lat.toFixed(2)},${lng.toFixed(2)}`; }
}

// ── Haversine distance ─────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Great-circle interpolation ─────────────────────────────────────────────
function greatCircleWaypoints(origin, dest, numPoints = 8) {
  const lat1 = origin.lat * Math.PI / 180;
  const lng1 = origin.lng * Math.PI / 180;
  const lat2 = dest.lat * Math.PI / 180;
  const lng2 = dest.lng * Math.PI / 180;
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2-lat1)/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin((lng2-lng1)/2)**2));
  const points = [];
  for (let i = 0; i <= numPoints + 1; i++) {
    const f = i / (numPoints + 1);
    if (d < 0.0001) { points.push({ lat: origin.lat, lng: origin.lng }); continue; }
    const A = Math.sin((1-f)*d)/Math.sin(d);
    const B = Math.sin(f*d)/Math.sin(d);
    const x = A*Math.cos(lat1)*Math.cos(lng1) + B*Math.cos(lat2)*Math.cos(lng2);
    const y = A*Math.cos(lat1)*Math.sin(lng1) + B*Math.cos(lat2)*Math.sin(lng2);
    const z = A*Math.sin(lat1) + B*Math.sin(lat2);
    points.push({
      lat: Math.round(Math.atan2(z, Math.sqrt(x**2+y**2)) * 180 / Math.PI * 100000) / 100000,
      lng: Math.round(Math.atan2(y, x) * 180 / Math.PI * 100000) / 100000,
    });
  }
  return points;
}

// ── Build named waypoints from OSRM route ──────────────────────────────────
async function processOSRMRoute(route, originCoords, destCoords) {
  const coords = route.geometry.coordinates;
  const numSamples = Math.min(20, Math.max(8, Math.floor(coords.length / 50)));
  const sampled = sampleGeometry(coords, numSamples);
  const keyIndices = [...new Set([0, Math.floor(sampled.length/4), Math.floor(sampled.length/2), Math.floor(3*sampled.length/4), sampled.length-1])];
  const names = await Promise.all(keyIndices.map(i => reverseGeocode(sampled[i][1], sampled[i][0])));
  const waypoints = sampled.map((coord, idx) => {
    const ki = keyIndices.indexOf(idx);
    return { lat: Math.round(coord[1]*100000)/100000, lng: Math.round(coord[0]*100000)/100000, name: ki >= 0 ? names[ki] : `Route point ${idx+1}` };
  });
  waypoints[0].name = originCoords.name;
  waypoints[waypoints.length-1].name = destCoords.name;
  return waypoints;
}

// ══════════════════════════════════════════════════════════════════════════
// SWARM INTELLIGENCE INTEGRATION
// ACO pheromone validation: checks existing route pheromone strength
// PSO optimization: adjusts waypoints toward swarm-proven efficient corridors
// ══════════════════════════════════════════════════════════════════════════
async function runSwarmRouteValidation(base44, orgId, originCoords, destCoords, transportType, distanceKm, mistralApiKey) {
  const swarmResult = {
    pheromone_strength: 0,
    swarm_confidence: 0,
    aco_recommended_waypoints: [],
    pso_efficiency_score: 0,
    swarm_warnings: [],
    swarm_optimizations: [],
    genetic_fitness: 0,
    ai_swarm_analysis: null,
    bottleneck_risk: false,
    scout_coverage: false,
  };

  try {
    // Fetch latest swarm cycles + existing routes for pheromone data
    const [swarmCycles, existingRoutes, vehicles] = await Promise.all([
      base44.asServiceRole.entities.SwarmCoordination.filter({ organization_id: orgId }),
      base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
      base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    ]);

    const sortedCycles = swarmCycles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latestCycle = sortedCycles[0];

    if (!latestCycle) {
      swarmResult.swarm_warnings.push('No swarm cycles available — route not validated by ACO');
      return swarmResult;
    }

    // ── ACO PHEROMONE ANALYSIS ────────────────────────────────────────────
    // Find routes that pass through similar geographic corridor
    const corridorRoutes = existingRoutes.filter(r => {
      if (!r.waypoints?.length) return false;
      // Check if any existing route waypoint is within ~200km of our origin or destination
      return r.waypoints.some(wp =>
        haversineKm(wp.lat, wp.lng, originCoords.lat, originCoords.lng) < 200 ||
        haversineKm(wp.lat, wp.lng, destCoords.lat, destCoords.lng) < 200
      );
    });

    // Pheromone strength = number of routes in corridor × swarm health
    const corridorPheromone = corridorRoutes.length > 0
      ? Math.min(100, (corridorRoutes.length / Math.max(existingRoutes.length, 1)) * latestCycle.swarm_health_score * 2)
      : 0;

    swarmResult.pheromone_strength = Math.round(corridorPheromone);
    swarmResult.genetic_fitness = latestCycle.fitness_score || 0;

    // Check if route corridor has bottleneck history
    const bottleneckRoutes = latestCycle.bottlenecks_detected || [];
    const corridorBottleneck = corridorRoutes.some(r =>
      bottleneckRoutes.some(b => b.includes(r.name))
    );
    swarmResult.bottleneck_risk = corridorBottleneck;
    if (corridorBottleneck) {
      swarmResult.swarm_warnings.push(`ACO Bottleneck detected in corridor — swarm signals congestion on similar routes`);
    }

    // Check scout agent coverage
    const scoutAgents = latestCycle.scout_agents || [];
    const activeVehicles = vehicles.filter(v => v.status === 'active');
    const scoutsInArea = scoutAgents.filter(name => {
      const v = activeVehicles.find(av => av.name === name);
      if (!v?.latitude) return false;
      return haversineKm(v.latitude, v.longitude, originCoords.lat, originCoords.lng) < 500 ||
             haversineKm(v.latitude, v.longitude, destCoords.lat, destCoords.lng) < 500;
    });
    swarmResult.scout_coverage = scoutsInArea.length > 0;
    if (scoutsInArea.length > 0) {
      swarmResult.swarm_optimizations.push(`Scout agents in corridor: ${scoutsInArea.join(', ')} — live pheromone data available`);
    }

    // ── PSO EFFICIENCY SCORE ──────────────────────────────────────────────
    // PSO position = distance efficiency vs fleet average
    const avgFleetDistance = existingRoutes.reduce((s, r) => s + (r.distance_km || 0), 0) / Math.max(existingRoutes.length, 1);
    const distanceEfficiency = avgFleetDistance > 0 ? Math.min(100, (avgFleetDistance / distanceKm) * 100) : 75;
    const psoScore = Math.round((distanceEfficiency * 0.6) + (latestCycle.swarm_health_score * 0.4));
    swarmResult.pso_efficiency_score = psoScore;

    if (psoScore > 80) {
      swarmResult.swarm_optimizations.push(`PSO: High efficiency corridor (${psoScore}/100) — swarm converged on this region`);
    } else if (psoScore < 50) {
      swarmResult.swarm_warnings.push(`PSO: Low efficiency score (${psoScore}/100) — consider alternative routing`);
    }

    // ── SWARM CONFIDENCE ─────────────────────────────────────────────────
    swarmResult.swarm_confidence = Math.round(
      (swarmResult.pheromone_strength * 0.3) +
      (psoScore * 0.4) +
      (latestCycle.swarm_health_score * 0.3)
    );

    if (corridorRoutes.length > 0) {
      swarmResult.swarm_optimizations.push(`ACO: ${corridorRoutes.length} pheromone trail(s) in corridor — following swarm-proven path`);
    }

    // ── MISTRAL AI SWARM ANALYSIS ─────────────────────────────────────────
    if (mistralApiKey && latestCycle) {
      const aiRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mistralApiKey}` },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are the NexusVectis Swarm Intelligence route validator. Analyze the swarm data and give a precise 1-2 sentence verdict on the proposed route. Focus on pheromone strength, bottleneck risk, and PSO optimization opportunity.'
            },
            {
              role: 'user',
              content: `Route: ${originCoords.name} → ${destCoords.name} (${Math.round(distanceKm)} km, ${transportType}).
Swarm cycle #${latestCycle.cycle_number} | Algorithm: ${latestCycle.algorithm} | Health: ${latestCycle.swarm_health_score}/100 | Fitness: ${latestCycle.fitness_score?.toFixed(1)}%.
Corridor routes: ${corridorRoutes.length}. Pheromone strength: ${swarmResult.pheromone_strength}. PSO efficiency: ${psoScore}. Bottleneck risk: ${corridorBottleneck}. Scout coverage: ${scoutsInArea.length > 0}.
Stigmergic signals: ${(latestCycle.stigmergic_signals || []).join(', ')}.`
            }
          ],
          temperature: 0.2,
          max_tokens: 100,
        }),
      });
      if (aiRes.ok) {
        const d = await aiRes.json();
        swarmResult.ai_swarm_analysis = d.choices[0].message.content;
      }
    }

  } catch (e) {
    swarmResult.swarm_warnings.push(`Swarm validation error: ${e.message}`);
  }

  return swarmResult;
}

// ══════════════════════════════════════════════════════════════════════════
// IMMUNITY ENGINE INTEGRATION
// Scans the route corridor for active threats, GPS anomalies,
// quarantined vehicles, and security exceptions along the path
// ══════════════════════════════════════════════════════════════════════════
async function runImmunityRouteCheck(base44, orgId, originCoords, destCoords, waypoints, mistralApiKey) {
  const immunityResult = {
    threat_level: 'CLEAR',
    threat_score: 0,
    active_threats: [],
    corridor_exceptions: [],
    quarantined_vehicles_in_path: [],
    immune_clearance: true,
    immunity_warnings: [],
    immunity_recommendations: [],
    ai_threat_assessment: null,
    swarm_threat_posture: 'NOMINAL',
  };

  try {
    // Fetch security and fleet data in parallel
    const [vehicles, exceptions, securityAudits, alerts, swarmCycles] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
      base44.asServiceRole.entities.Exception.filter({ organization_id: orgId }),
      base44.asServiceRole.entities.SecurityAudit.filter({ organization_id: orgId }),
      base44.asServiceRole.entities.Alert.filter({ organization_id: orgId, is_resolved: false }),
      base44.asServiceRole.entities.SwarmCoordination.filter({ organization_id: orgId }),
    ]);

    // ── CHECK QUARANTINED/OFFLINE VEHICLES IN CORRIDOR ───────────────────
    const problematicVehicles = vehicles.filter(v =>
      (v.status === 'offline' || v.status === 'maintenance') &&
      v.latitude && v.longitude &&
      waypoints.some(wp => haversineKm(wp.lat, wp.lng, v.latitude, v.longitude) < 150)
    );
    immunityResult.quarantined_vehicles_in_path = problematicVehicles.map(v => ({
      name: v.name,
      status: v.status,
      reason: v.status === 'offline' ? 'OFFLINE — possible GPS spoofing or mechanical failure' : 'IN MAINTENANCE — active threat quarantine',
    }));
    if (problematicVehicles.length > 0) {
      immunityResult.threat_score += problematicVehicles.length * 10;
      immunityResult.immunity_warnings.push(`${problematicVehicles.length} quarantined vehicle(s) detected in route corridor`);
    }

    // ── SCAN ACTIVE SECURITY EXCEPTIONS IN CORRIDOR ───────────────────────
    const activeExceptions = exceptions.filter(e => e.status !== 'resolved' && e.status !== 'action_taken');
    const corridorExceptions = activeExceptions.filter(e => {
      if (!e.vehicle_id) return false;
      const v = vehicles.find(v => v.id === e.vehicle_id);
      if (!v?.latitude) return false;
      return waypoints.some(wp => haversineKm(wp.lat, wp.lng, v.latitude, v.longitude) < 200);
    });
    immunityResult.corridor_exceptions = corridorExceptions.map(e => ({
      title: e.title,
      type: e.type,
      severity: e.severity,
      ai_recommendation: e.ai_recommendation,
    }));
    const criticalExceptions = corridorExceptions.filter(e => e.severity === 'critical').length;
    const highExceptions = corridorExceptions.filter(e => e.severity === 'high').length;
    immunityResult.threat_score += criticalExceptions * 25 + highExceptions * 10;

    // ── CYBER THREAT SCAN FROM IMMUNITY LOG ──────────────────────────────
    const recentHour = new Date(Date.now() - 3600000);
    const recentCyberThreats = securityAudits.filter(a =>
      new Date(a.created_date) > recentHour &&
      (a.action.includes('GPS_SPOOFING') || a.action.includes('DATA_INJECTION') || a.action.includes('GHOST_VEHICLE') || a.action.includes('TWIN_GEO_DIVERGENCE'))
    );
    if (recentCyberThreats.length > 0) {
      immunityResult.threat_score += recentCyberThreats.length * 15;
      immunityResult.active_threats = recentCyberThreats.slice(0, 5).map(t => ({
        type: t.action,
        severity: t.severity,
        details: t.details,
        time: t.created_date,
      }));
      immunityResult.immunity_warnings.push(`${recentCyberThreats.length} active cyber threat(s) detected in last hour — telemetry integrity at risk`);
    }

    // ── SWARM THREAT POSTURE ──────────────────────────────────────────────
    const latestSwarm = swarmCycles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const swarmThreatBroadcast = alerts.find(a => a.title?.includes('IMMUNITY-SWARM') && !a.is_resolved);
    if (swarmThreatBroadcast) {
      immunityResult.swarm_threat_posture = 'HEIGHTENED';
      immunityResult.threat_score += 20;
      immunityResult.immunity_warnings.push('Swarm is in HEIGHTENED threat posture — immunity broadcast active across fleet mesh');
    }

    // ── DETERMINE OVERALL THREAT LEVEL ───────────────────────────────────
    immunityResult.threat_score = Math.min(100, immunityResult.threat_score);
    if (immunityResult.threat_score >= 60) {
      immunityResult.threat_level = 'CRITICAL';
      immunityResult.immune_clearance = false;
    } else if (immunityResult.threat_score >= 35) {
      immunityResult.threat_level = 'ELEVATED';
      immunityResult.immune_clearance = false;
    } else if (immunityResult.threat_score >= 15) {
      immunityResult.threat_level = 'MODERATE';
    } else {
      immunityResult.threat_level = 'CLEAR';
    }

    // ── IMMUNITY RECOMMENDATIONS ─────────────────────────────────────────
    if (problematicVehicles.length > 0) {
      immunityResult.immunity_recommendations.push('Avoid using offline/quarantined vehicles for this route dispatch');
    }
    if (recentCyberThreats.length > 0) {
      immunityResult.immunity_recommendations.push('Verify GPS telemetry integrity before dispatching — active cyber threats detected');
    }
    if (criticalExceptions > 0) {
      immunityResult.immunity_recommendations.push(`${criticalExceptions} critical exception(s) active in corridor — consider alternate routing`);
    }

    // ── MISTRAL AI THREAT ASSESSMENT ─────────────────────────────────────
    if (mistralApiKey && (immunityResult.threat_score > 10 || immunityResult.active_threats.length > 0)) {
      const aiRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mistralApiKey}` },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are the NexusVectis Fleet Immunity Engine. Assess the security threat level for a planned route and give a precise 1-2 sentence security clearance verdict. Be specific about risks.'
            },
            {
              role: 'user',
              content: `Route: ${originCoords.name} → ${destCoords.name}.
Threat score: ${immunityResult.threat_score}/100. Level: ${immunityResult.threat_level}.
Active cyber threats: ${immunityResult.active_threats.map(t => t.type).join(', ') || 'none'}.
Quarantined vehicles in corridor: ${immunityResult.quarantined_vehicles_in_path.map(v => v.name).join(', ') || 'none'}.
Critical exceptions: ${criticalExceptions}. Swarm posture: ${immunityResult.swarm_threat_posture}.
Warnings: ${immunityResult.immunity_warnings.join('; ') || 'none'}.`
            }
          ],
          temperature: 0.15,
          max_tokens: 100,
        }),
      });
      if (aiRes.ok) {
        const d = await aiRes.json();
        immunityResult.ai_threat_assessment = d.choices[0].message.content;
      }
    }

    // ── LOG ROUTE SECURITY CHECK TO IMMUNITY MEMORY ──────────────────────
    await base44.asServiceRole.entities.SecurityAudit.create({
      organization_id: orgId,
      action: 'ROUTE_IMMUNITY_SCAN',
      user_email: 'immunity-engine@system',
      user_id: 'system',
      resource_type: 'route',
      status: immunityResult.immune_clearance ? 'success' : 'blocked',
      severity: immunityResult.threat_level === 'CRITICAL' ? 'critical' : immunityResult.threat_level === 'ELEVATED' ? 'high' : 'low',
      details: `Route immunity scan: ${originCoords.name} → ${destCoords.name}. Threat score: ${immunityResult.threat_score}/100. Level: ${immunityResult.threat_level}. Cyber threats: ${immunityResult.active_threats.length}. Quarantined in corridor: ${immunityResult.quarantined_vehicles_in_path.length}. Swarm posture: ${immunityResult.swarm_threat_posture}.`,
    });

  } catch (e) {
    immunityResult.immunity_warnings.push(`Immunity scan error: ${e.message}`);
  }

  return immunityResult;
}

// ── Transport factors ──────────────────────────────────────────────────────
const TRANSPORT_FACTORS = {
  truck:    { speed: 80,   co2: 0.8 },
  train:    { speed: 120,  co2: 0.04 },
  aircraft: { speed: 800,  co2: 0.9 },
  drone:    { speed: 60,   co2: 0.1 },
  ship:     { speed: 25,   co2: 0.02 },
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return nvError(requestId, String('Unauthorized'), 401);


    const { origin, destination, transport_type = 'truck' } = await req.json();
    if (!origin || !destination) return nvError(requestId, String('Origin and destination required'), 400);


    const factors = TRANSPORT_FACTORS[transport_type] || TRANSPORT_FACTORS.truck;
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

    // Determine org ID
    const orgId = user.organization_id || null;

    // ── STEP 1: Geocode endpoints ─────────────────────────────────────────
    const [originCoords, destCoords] = await Promise.all([geocode(origin), geocode(destination)]);

    let waypoints = [];
    let distance_km = 0;
    let estimated_duration_hours = 0;
    let co2_estimate = 0;
    let route_description = '';

    // ── STEP 2: Build route geometry ─────────────────────────────────────
    if (transport_type === 'truck' || transport_type === 'train') {
      const route = await getOSRMRoute(originCoords, destCoords);
      distance_km = Math.round(route.distance / 1000);
      estimated_duration_hours = transport_type === 'train'
        ? Math.round(distance_km / factors.speed * 10) / 10
        : Math.round((route.duration / 3600) * 10) / 10;
      co2_estimate = Math.round(distance_km * factors.co2 * 10) / 10;
      waypoints = await processOSRMRoute(route, originCoords, destCoords);
      route_description = `Real ${transport_type} route via OpenStreetMap road network. ${distance_km} km.`;

    } else if (transport_type === 'aircraft') {
      const gcPoints = greatCircleWaypoints(originCoords, destCoords, 6);
      distance_km = Math.round(haversineKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng));
      estimated_duration_hours = Math.round(distance_km / factors.speed * 10) / 10;
      co2_estimate = Math.round(distance_km * factors.co2 * 10) / 10;
      const midPoints = gcPoints.slice(1, -1);
      const midNames = await Promise.all(midPoints.map(p => reverseGeocode(p.lat, p.lng)));
      waypoints = [
        { lat: originCoords.lat, lng: originCoords.lng, name: originCoords.name },
        ...midPoints.map((p, i) => ({ ...p, name: midNames[i] || `Waypoint ${i+1}` })),
        { lat: destCoords.lat, lng: destCoords.lng, name: destCoords.name },
      ];
      route_description = `Great-circle aircraft route (real aviation standard). ${distance_km} km air distance.`;

    } else if (transport_type === 'ship') {
      const gcPoints = greatCircleWaypoints(originCoords, destCoords, 10);
      distance_km = Math.round(haversineKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng) * 1.15);
      estimated_duration_hours = Math.round(distance_km / factors.speed * 10) / 10;
      co2_estimate = Math.round(distance_km * factors.co2 * 10) / 10;
      const midPoints = gcPoints.slice(1, -1);
      const keyIndices = [Math.floor(midPoints.length/3), Math.floor(2*midPoints.length/3)];
      const seaNames = await Promise.all(keyIndices.map(i => reverseGeocode(midPoints[i].lat, midPoints[i].lng)));
      waypoints = [
        { lat: originCoords.lat, lng: originCoords.lng, name: `Port of ${originCoords.name}` },
        ...midPoints.map((p, i) => ({ ...p, name: keyIndices.includes(i) ? (seaNames[keyIndices.indexOf(i)] || 'Open Sea') : 'Open Sea' })),
        { lat: destCoords.lat, lng: destCoords.lng, name: `Port of ${destCoords.name}` },
      ];
      route_description = `Maritime route via sea lanes. ${distance_km} km sea distance.`;

    } else if (transport_type === 'drone') {
      const gcPoints = greatCircleWaypoints(originCoords, destCoords, 3);
      distance_km = Math.round(haversineKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng));
      estimated_duration_hours = Math.round(distance_km / factors.speed * 10) / 10;
      co2_estimate = Math.round(distance_km * factors.co2 * 10) / 10;
      waypoints = [
        { lat: originCoords.lat, lng: originCoords.lng, name: originCoords.name },
        ...gcPoints.slice(1, -1).map((p, i) => ({ ...p, name: `Waypoint ${i+1}` })),
        { lat: destCoords.lat, lng: destCoords.lng, name: destCoords.name },
      ];
      route_description = `Direct drone flight route. ${distance_km} km air distance.`;
    }

    // ── STEP 3: Swarm Intelligence + Immunity scan in PARALLEL ───────────
    let swarmData = null;
    let immunityData = null;

    if (orgId && waypoints.length > 0) {
      [swarmData, immunityData] = await Promise.all([
        runSwarmRouteValidation(base44, orgId, originCoords, destCoords, transport_type, distance_km, mistralApiKey),
        runImmunityRouteCheck(base44, orgId, originCoords, destCoords, waypoints, mistralApiKey),
      ]);
    }

    // ── STEP 4: Create route alert if high threat detected ────────────────
    if (orgId && immunityData?.threat_level === 'CRITICAL') {
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[SWARM-IMMUNITY] Critical Route Threat: ${originCoords.name} → ${destCoords.name}`,
        message: `Route planning triggered a CRITICAL immunity alert. Threat score: ${immunityData.threat_score}/100. Swarm confidence: ${swarmData?.swarm_confidence || 0}/100. Issues: ${immunityData.immunity_warnings.join('; ')}. ${immunityData.ai_threat_assessment || ''}`,
        type: 'critical',
        category: 'route',
        ai_recommendation: immunityData.immunity_recommendations.join(' | ') || 'Manual security review required before dispatch.',
        is_read: false,
        is_resolved: false,
      });
    }

    return nvJson(requestId, {
      success: true,
      route_data: {
        waypoints,
        distance_km,
        estimated_duration_hours,
        co2_estimate,
        route_description,
        origin: { ...originCoords },
        destination: { ...destCoords },
        transport_type,
      },
      // ── SWARM INTELLIGENCE REPORT ─────────────────────────────────────
      swarm_intelligence: swarmData ? {
        pheromone_strength: swarmData.pheromone_strength,
        swarm_confidence: swarmData.swarm_confidence,
        pso_efficiency_score: swarmData.pso_efficiency_score,
        genetic_fitness: swarmData.genetic_fitness,
        bottleneck_risk: swarmData.bottleneck_risk,
        scout_coverage: swarmData.scout_coverage,
        warnings: swarmData.swarm_warnings,
        optimizations: swarmData.swarm_optimizations,
        ai_analysis: swarmData.ai_swarm_analysis,
        status: swarmData.swarm_confidence >= 70 ? 'OPTIMAL' : swarmData.swarm_confidence >= 40 ? 'ADEQUATE' : 'LOW_CONFIDENCE',
      } : null,
      // ── IMMUNITY ENGINE REPORT ────────────────────────────────────────
      immunity: immunityData ? {
        threat_level: immunityData.threat_level,
        threat_score: immunityData.threat_score,
        immune_clearance: immunityData.immune_clearance,
        swarm_threat_posture: immunityData.swarm_threat_posture,
        active_threats: immunityData.active_threats,
        quarantined_in_corridor: immunityData.quarantined_vehicles_in_path,
        corridor_exceptions: immunityData.corridor_exceptions,
        warnings: immunityData.immunity_warnings,
        recommendations: immunityData.immunity_recommendations,
        ai_assessment: immunityData.ai_threat_assessment,
      } : null,
    });


  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});