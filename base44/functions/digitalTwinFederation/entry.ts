import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let orgIds = [];
    if (body.organization_id) {
      orgIds = [body.organization_id];
    } else {
      const orgs = await base44.asServiceRole.entities.Organization.list();
      orgIds = Array.isArray(orgs) ? orgs.map(o => o.id) : (orgs?.data ?? []).map(o => o.id);
    }

    if (orgIds.length === 0) {
      return nvJson(requestId, { status: 'success', message: 'No organizations found', total_twins_created: 0 });

    }

    const allResults = [];

    for (const orgId of orgIds) {
      const result = await processOrg(base44, orgId);
      allResults.push(result);
    }

    return nvJson(requestId, {
      status: 'success',
      organizations_processed: allResults.length,
      results: allResults,
    });

  } catch (error) {
    console.error('[DIGITAL-TWIN] Error:', error.message);
    return nvError(requestId, String(error.message), 500);

  }
});

async function processOrg(base44, orgId) {
  // Fetch all data in parallel
  const [vehiclesRaw, shipmentsRaw, resourcesRaw] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId, status: 'in_transit' }),
    base44.asServiceRole.entities.Resource.filter({ organization_id: orgId }),
  ]);

  const toArray = (r) => Array.isArray(r) ? r : (r?.data ?? []);
  const vehicles = toArray(vehiclesRaw);
  const shipments = toArray(shipmentsRaw);
  const resources = toArray(resourcesRaw);

  const now = new Date();
  const divergences = [];
  const twins = [];

  // ── VEHICLE TWINS ──────────────────────────────────────────────────────
  for (const v of vehicles) {
    let expectedLat = v.latitude || 0;
    let expectedLon = v.longitude || 0;

    if (v.route_id && v.eta) {
      const etaDate = new Date(v.eta);
      const timeToEta = (etaDate - now) / (1000 * 60);
      const speedKmH = v.speed || 60;
      const speedDegMin = (speedKmH / 111) / 60;
      const minutesElapsed = Math.max(0, -timeToEta);
      expectedLat += speedDegMin * minutesElapsed * Math.cos((v.heading || 0) * Math.PI / 180);
      expectedLon += speedDegMin * minutesElapsed * Math.sin((v.heading || 0) * Math.PI / 180);
    }

    const simulatedState = {
      expected_latitude: expectedLat,
      expected_longitude: expectedLon,
      expected_speed: v.speed || 0,
      fuel_degradation: Math.max(0, (v.fuel_level || 100) - 2),
    };

    twins.push({
      organization_id: orgId,
      twin_key: `vehicle_${v.id}`,
      entity_type: 'vehicle',
      entity_id: v.id,
      simulated_state: JSON.stringify(simulatedState),
      active: true,
    });

    // Detect geo divergence
    const latDiff = Math.abs(v.latitude - expectedLat) * 111;
    const lonDiff = Math.abs(v.longitude - expectedLon) * 111;
    const geoDist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    if (geoDist > 5) {
      divergences.push({ entity_id: v.id, entity_type: 'vehicle', divergence_type: 'geo_position', distance_km: geoDist, severity: geoDist > 20 ? 'critical' : 'high' });
    }
  }

  // ── SHIPMENT TWINS ─────────────────────────────────────────────────────
  for (const s of shipments) {
    const expectedTemp = s.temperature_max || 20;
    const simulatedState = {
      expected_temperature: expectedTemp,
      expected_humidity: s.humidity_current || 50,
      expected_location: s.destination || 'unknown',
    };

    twins.push({
      organization_id: orgId,
      twin_key: `shipment_${s.id}`,
      entity_type: 'shipment',
      entity_id: s.id,
      simulated_state: JSON.stringify(simulatedState),
      active: true,
    });

    const tempDiff = Math.abs((s.current_temperature || 0) - expectedTemp);
    if (tempDiff > 3 && s.temperature_max) {
      divergences.push({ entity_id: s.id, entity_type: 'shipment', divergence_type: 'temperature_breach', temp_diff: tempDiff, severity: tempDiff > 10 ? 'critical' : 'high' });
    }
  }

  // ── RESOURCE TWINS ─────────────────────────────────────────────────────
  for (const r of resources) {
    twins.push({
      organization_id: orgId,
      twin_key: `resource_${r.id}`,
      entity_type: 'resource',
      entity_id: r.id,
      simulated_state: JSON.stringify({ expected_capacity: r.capacity || 100, expected_usage: r.current_level || 0, expected_status: r.status || 'operational' }),
      active: true,
    });
  }

  // ── PERSIST TWINS IN BATCHES OF 20 to avoid timeout ───────────────────
  const BATCH_SIZE = 20;
  let createdCount = 0;
  for (let i = 0; i < twins.length; i += BATCH_SIZE) {
    const batch = twins.slice(i, i + BATCH_SIZE);
    await base44.asServiceRole.entities.DigitalTwin.bulkCreate(batch);
    createdCount += batch.length;
  }

  // ── CREATE ALERTS FOR CRITICAL DIVERGENCES ─────────────────────────────
  const criticalDivergences = divergences.filter(d => d.severity === 'critical');
  for (const d of criticalDivergences.slice(0, 5)) {
    const msg = d.divergence_type === 'geo_position'
      ? `Digital Twin detected position divergence of ${d.distance_km?.toFixed(1)}km. Possible theft, rerouting, or navigation attack.`
      : `Digital Twin detected temperature breach of ${d.temp_diff?.toFixed(1)}°C. Cold chain integrity at risk.`;
    await base44.asServiceRole.entities.Alert.create({
      organization_id: orgId,
      title: `[TWIN] ${d.divergence_type === 'geo_position' ? 'Position Anomaly' : 'Temperature Breach'} Detected`,
      message: msg,
      type: 'critical',
      category: 'system',
      vehicle_id: d.entity_type === 'vehicle' ? d.entity_id : undefined,
      ai_recommendation: 'Physical verification required.',
      is_read: false,
      is_resolved: false,
    });
  }

  console.log(`[DIGITAL-TWIN] Org: ${orgId} | Twins: ${createdCount} | Divergences: ${divergences.length}`);

  return {
    organization_id: orgId,
    total_twins_created: createdCount,
    divergence_count: divergences.length,
    divergences: divergences.slice(0, 10),
    twin_types: { vehicles: vehicles.length, shipments: shipments.length, resources: resources.length },
  };
}