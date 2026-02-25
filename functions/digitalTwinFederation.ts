import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════════════════
// DIGITAL TWIN FEDERATION ENGINE
// Runs virtual doubles of all vehicles/resources in parallel with live data
// Detects reality divergence = imminent anomaly/attack
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let organizationIds = [];
    try {
      const user = await base44.auth.me();
      if (user?.organization_id) organizationIds = [user.organization_id];
    } catch {
      // Scheduled run
    }

    if (organizationIds.length === 0) {
      const orgs = await base44.asServiceRole.entities.Organization.list();
      organizationIds = orgs.map(o => o.id);
    }

    const twinResults = [];
    for (const orgId of organizationIds) {
      const result = await runDigitalTwinCycle(base44, orgId);
      twinResults.push(result);
    }

    return Response.json({
      status: 'digital_twin_cycle_complete',
      timestamp: new Date().toISOString(),
      organizations_processed: organizationIds.length,
      total_divergence_detected: twinResults.reduce((sum, r) => sum + r.divergence_count, 0),
      results: twinResults,
    });
  } catch (error) {
    console.error('[TWIN] Federation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DIGITAL TWIN CYCLE
// ─────────────────────────────────────────────────────────────────────────────
async function runDigitalTwinCycle(base44, orgId) {
  const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId });
  const shipments = await base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId });
  const resources = await base44.asServiceRole.entities.Resource.filter({ organization_id: orgId });
  const routes = await base44.asServiceRole.entities.Route.filter({ organization_id: orgId });

  const divergences = [];
  const twins = {};

  // ─────────────────────────────────────────────────────────────────────────
  // VEHICLE TWINS: Simulate ideal state vs. reality
  // ─────────────────────────────────────────────────────────────────────────
  for (const vehicle of vehicles) {
    const twin = createVehicleTwin(vehicle, routes, shipments);
    twins[`vehicle_${vehicle.id}`] = twin;

    const divergence = detectVehicleDivergence(vehicle, twin);
    if (divergence.severity > 0) {
      divergences.push({
        entity_type: 'vehicle',
        entity_id: vehicle.id,
        entity_name: vehicle.name,
        ...divergence,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHIPMENT TWINS: Simulate ideal delivery state
  // ─────────────────────────────────────────────────────────────────────────
  for (const shipment of shipments) {
    const twin = createShipmentTwin(shipment, vehicles, routes);
    twins[`shipment_${shipment.id}`] = twin;

    const divergence = detectShipmentDivergence(shipment, twin);
    if (divergence.severity > 0) {
      divergences.push({
        entity_type: 'shipment',
        entity_id: shipment.id,
        entity_name: shipment.tracking_number,
        ...divergence,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESOURCE TWINS: Simulate capacity & availability
  // ─────────────────────────────────────────────────────────────────────────
  for (const resource of resources) {
    const twin = createResourceTwin(resource, vehicles);
    twins[`resource_${resource.id}`] = twin;

    const divergence = detectResourceDivergence(resource, twin);
    if (divergence.severity > 0) {
      divergences.push({
        entity_type: 'resource',
        entity_id: resource.id,
        entity_name: resource.name,
        ...divergence,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERSIST TWINS FOR THIS CYCLE
  // ─────────────────────────────────────────────────────────────────────────
  await base44.asServiceRole.entities.DigitalTwin.filter({ organization_id: orgId, active: true }).then(existing => {
    if (existing && existing.length > 0) {
      existing.forEach(et => {
        base44.asServiceRole.entities.DigitalTwin.update(et.id, { active: false });
      });
    }
  }).catch(() => {});

  // Create new twin records
  for (const [twinKey, twinData] of Object.entries(twins)) {
    try {
      await base44.asServiceRole.entities.DigitalTwin.create({
        organization_id: orgId,
        twin_key: twinKey,
        entity_type: twinData.entity_type,
        entity_id: twinData.entity_id,
        simulated_state: JSON.stringify(twinData.simulated_state),
        active: true,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`[TWIN] Failed to persist ${twinKey}:`, e.message);
    }
  }

  return {
    organization_id: orgId,
    total_twins_created: Object.keys(twins).length,
    divergence_count: divergences.length,
    divergences: divergences.slice(0, 50), // Top 50 anomalies
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE TWIN: Physics-based simulation
// ─────────────────────────────────────────────────────────────────────────────
function createVehicleTwin(vehicle, routes, shipments) {
  const currentRoute = routes.find(r => r.id === vehicle.route_id);
  const assignedShipments = shipments.filter(s => s.vehicle_id === vehicle.id && s.status !== 'delivered');

  // Expected location based on route progress
  let expectedLat = vehicle.latitude || 55.6761;
  let expectedLon = vehicle.longitude || 12.5683;
  let expectedSpeed = 0;
  let expectedFuel = vehicle.fuel_level || 50;

  if (currentRoute && vehicle.status === 'active') {
    // Interpolate expected position along route waypoints
    if (currentRoute.waypoints && currentRoute.waypoints.length > 1) {
      const progress = Math.random() * 0.8; // Assume 80% max progress
      const idx = Math.floor(progress * (currentRoute.waypoints.length - 1));
      const wp = currentRoute.waypoints[idx];
      if (wp) {
        expectedLat = wp.lat;
        expectedLon = wp.lng;
      }
    }

    // Expected speed: vehicle type dependent
    const avgSpeeds = { truck: 80, ship: 25, aircraft: 400, drone: 50, train: 100 };
    expectedSpeed = avgSpeeds[vehicle.type] || 50;

    // Fuel consumption model
    const fuelBurnRate = {
      truck: 0.08,
      ship: 0.05,
      aircraft: 1.5,
      drone: 0.3,
      train: 0.02,
    }[vehicle.type] || 0.1;
    expectedFuel = Math.max(0, vehicle.fuel_level - fuelBurnRate);
  }

  const twinState = {
    entity_type: 'vehicle',
    entity_id: vehicle.id,
    expected_latitude: expectedLat,
    expected_longitude: expectedLon,
    expected_speed: expectedSpeed,
    expected_fuel: expectedFuel,
    expected_cargo_load: assignedShipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0),
    expected_status: vehicle.status,
    simulated_eta_minutes: currentRoute ? (currentRoute.estimated_duration_hours * 60 * Math.random()) : null,
  };

  return { entity_type: 'vehicle', entity_id: vehicle.id, simulated_state: twinState };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIPMENT TWIN: Delivery state simulation
// ─────────────────────────────────────────────────────────────────────────────
function createShipmentTwin(shipment, vehicles, routes) {
  const vehicle = vehicles.find(v => v.id === shipment.vehicle_id);
  const route = routes.find(r => r.id === shipment.route_id);

  let expectedStatus = shipment.status;
  let expectedArrivalTime = shipment.eta;
  let expectedTemperature = shipment.current_temperature || 20;
  let expectedHumidity = shipment.humidity_current || 50;

  if (vehicle && route && shipment.status === 'in_transit') {
    // Cold chain simulation
    if (shipment.cargo_type === 'cold_chain') {
      const tempFluctuation = (Math.random() - 0.5) * 3;
      expectedTemperature = (shipment.temperature_max + shipment.temperature_min) / 2 + tempFluctuation;
    }

    // ETA recalculation
    const remainingKm = route.distance_km * (1 - Math.random() * 0.5);
    const avgSpeed = { truck: 80, ship: 25, aircraft: 400, drone: 50, train: 100 }[vehicle.type] || 50;
    const remainingHours = remainingKm / avgSpeed;
    expectedArrivalTime = new Date(Date.now() + remainingHours * 3600000).toISOString();
  }

  const twinState = {
    entity_type: 'shipment',
    entity_id: shipment.id,
    expected_status: expectedStatus,
    expected_arrival: expectedArrivalTime,
    expected_temperature: expectedTemperature,
    expected_humidity: expectedHumidity,
    expected_location_accuracy: Math.random() * 100,
  };

  return { entity_type: 'shipment', entity_id: shipment.id, simulated_state: twinState };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE TWIN: Capacity & availability simulation
// ─────────────────────────────────────────────────────────────────────────────
function createResourceTwin(resource, vehicles) {
  const assignedVehicles = vehicles.filter(v => v.resource_id === resource.id);

  const twinState = {
    entity_type: 'resource',
    entity_id: resource.id,
    expected_current_level: Math.min(resource.capacity, assignedVehicles.length),
    expected_available_capacity: Math.max(0, resource.capacity - assignedVehicles.length),
    expected_status: resource.status,
    expected_utilization_percent: (assignedVehicles.length / resource.capacity) * 100,
  };

  return { entity_type: 'resource', entity_id: resource.id, simulated_state: twinState };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVERGENCE DETECTION: Reality vs. Simulated
// ─────────────────────────────────────────────────────────────────────────────
function detectVehicleDivergence(vehicle, twin) {
  const twinState = twin.simulated_state;
  const issues = [];
  let severity = 0;

  // Geo divergence > 5km
  const latDiff = Math.abs(vehicle.latitude - twinState.expected_latitude) * 111; // 1 degree ≈ 111km
  const lonDiff = Math.abs(vehicle.longitude - twinState.expected_longitude) * 111;
  const geoDist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  if (geoDist > 5) {
    issues.push(`Geo divergence ${geoDist.toFixed(1)}km (expected ${twinState.expected_latitude}, ${twinState.expected_longitude})`);
    severity = Math.max(severity, 2);
  }

  // Speed divergence
  if (Math.abs(vehicle.speed - twinState.expected_speed) > 30) {
    issues.push(`Speed divergence: ${vehicle.speed} vs expected ${twinState.expected_speed}`);
    severity = Math.max(severity, 1);
  }

  // Fuel divergence > 20%
  if (Math.abs(vehicle.fuel_level - twinState.expected_fuel) > 20) {
    issues.push(`Fuel divergence: ${vehicle.fuel_level}% vs expected ${twinState.expected_fuel}%`);
    severity = Math.max(severity, 2);
  }

  // Status mismatch
  if (vehicle.status !== twinState.expected_status) {
    issues.push(`Status divergence: ${vehicle.status} vs expected ${twinState.expected_status}`);
    severity = Math.max(severity, 2);
  }

  return {
    divergence_type: 'vehicle_state',
    severity,
    issues,
    divergence_score: geoDist * 0.3 + Math.abs(vehicle.speed - twinState.expected_speed) * 0.2 + Math.abs(vehicle.fuel_level - twinState.expected_fuel) * 0.2,
  };
}

function detectShipmentDivergence(shipment, twin) {
  const twinState = twin.simulated_state;
  const issues = [];
  let severity = 0;

  // Status mismatch
  if (shipment.status !== twinState.expected_status) {
    issues.push(`Status: ${shipment.status} vs expected ${twinState.expected_status}`);
    severity = Math.max(severity, 1);
  }

  // Cold chain violation
  if (shipment.cargo_type === 'cold_chain') {
    if (shipment.current_temperature < shipment.temperature_min - 2 || shipment.current_temperature > shipment.temperature_max + 2) {
      issues.push(`Cold chain breach: ${shipment.current_temperature}°C outside bounds [${shipment.temperature_min}, ${shipment.temperature_max}]`);
      severity = Math.max(severity, 3);
    }
  }

  // ETA divergence > 30 minutes
  if (shipment.eta && twinState.expected_arrival) {
    const diff = Math.abs(new Date(shipment.eta) - new Date(twinState.expected_arrival)) / 60000;
    if (diff > 30) {
      issues.push(`ETA divergence: ${diff.toFixed(0)} minutes`);
      severity = Math.max(severity, 1);
    }
  }

  return {
    divergence_type: 'shipment_state',
    severity,
    issues,
    divergence_score: severity * 25,
  };
}

function detectResourceDivergence(resource, twin) {
  const twinState = twin.simulated_state;
  const issues = [];
  let severity = 0;

  // Capacity mismatch
  if (Math.abs(resource.current_level - twinState.expected_current_level) > 2) {
    issues.push(`Capacity divergence: ${resource.current_level} vs expected ${twinState.expected_current_level}`);
    severity = Math.max(severity, 1);
  }

  // Status mismatch
  if (resource.status !== twinState.expected_status) {
    issues.push(`Status: ${resource.status} vs expected ${twinState.expected_status}`);
    severity = Math.max(severity, 2);
  }

  return {
    divergence_type: 'resource_state',
    severity,
    issues,
    divergence_score: severity * 20,
  };
}