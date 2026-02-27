import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // When called as a scheduled automation there's no body — run for all orgs
    let orgIds = [];
    if (body.organization_id) {
      orgIds = [body.organization_id];
    } else {
      const orgs = await base44.asServiceRole.entities.Organization.list();
      orgIds = orgs.map(o => o.id);
    }

    if (orgIds.length === 0) {
      return Response.json({ status: 'success', message: 'No organizations found', total_twins_created: 0 });
    }

    const allResults = [];

    for (const orgId of orgIds) {
    // ── SPAWN DIGITAL TWINS FOR ALL VEHICLES ──────────────────────────────
    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId });
    const twins = [];

    for (const v of vehicles) {
      const twinKey = `vehicle_${v.id}`;
      
      // Simulate expected position based on route + time elapsed
      let expectedLat = v.latitude || 0;
      let expectedLon = v.longitude || 0;
      let expectedSpeed = v.speed || 0;
      
      if (v.route_id && v.eta) {
        const etaDate = new Date(v.eta);
        const now = new Date();
        const timeToEta = (etaDate - now) / (1000 * 60); // minutes
        
        // Simulate forward movement (simplified)
        const speedKmH = v.speed || 60;
        const speedDegMin = (speedKmH / 111) / 60;
        const minutesElapsed = Math.max(0, -timeToEta);
        expectedLat += speedDegMin * minutesElapsed * Math.cos((v.heading || 0) * Math.PI / 180);
        expectedLon += speedDegMin * minutesElapsed * Math.sin((v.heading || 0) * Math.PI / 180);
      }

      const simulatedState = {
        expected_latitude: expectedLat,
        expected_longitude: expectedLon,
        expected_speed: expectedSpeed,
        fuel_degradation: Math.max(0, (v.fuel_level || 100) - 2),
        heading_variance: (Math.random() - 0.5) * 10,
      };

      twins.push({
        organization_id: orgId,
        twin_key: twinKey,
        entity_type: 'vehicle',
        entity_id: v.id,
        simulated_state: JSON.stringify(simulatedState),
        active: true,
      });
    }

    // ── SPAWN DIGITAL TWINS FOR SHIPMENTS ────────────────────────────────
    const shipments = await base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId, status: 'in_transit' });
    
    for (const s of shipments) {
      const twinKey = `shipment_${s.id}`;
      
      const simulatedState = {
        expected_temperature: s.temperature_max || 20,
        expected_humidity: s.humidity_current || 50,
        expected_location: s.destination || 'unknown',
        temp_variance: (Math.random() - 0.5) * 5,
      };

      twins.push({
        organization_id: orgId,
        twin_key: twinKey,
        entity_type: 'shipment',
        entity_id: s.id,
        simulated_state: JSON.stringify(simulatedState),
        active: true,
      });
    }

    // ── SPAWN DIGITAL TWINS FOR RESOURCES ────────────────────────────────
    const resources = await base44.asServiceRole.entities.Resource.filter({ organization_id: orgId });
    
    for (const r of resources) {
      const twinKey = `resource_${r.id}`;
      
      const simulatedState = {
        expected_capacity: r.capacity || 100,
        expected_usage: r.current_level || 0,
        expected_status: r.status || 'operational',
      };

      twins.push({
        organization_id: orgId,
        twin_key: twinKey,
        entity_type: 'resource',
        entity_id: r.id,
        simulated_state: JSON.stringify(simulatedState),
        active: true,
      });
    }

    // ── PERSIST TWINS TO DATABASE ────────────────────────────────────────
    let createdCount = 0;
    if (twins.length > 0) {
      await base44.asServiceRole.entities.DigitalTwin.bulkCreate(twins);
      createdCount = twins.length;
    }

    // ── DETECT DIVERGENCES ───────────────────────────────────────────────
    const divergences = [];
    
    // Vehicle geo divergence
    for (const v of vehicles) {
      const vehicleTwins = twins.filter(t => t.entity_id === v.id && t.entity_type === 'vehicle');
      if (vehicleTwins.length > 0) {
        const sim = JSON.parse(vehicleTwins[0].simulated_state);
        const latDiff = Math.abs(v.latitude - sim.expected_latitude) * 111;
        const lonDiff = Math.abs(v.longitude - sim.expected_longitude) * 111;
        const geoDist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        if (geoDist > 5) {
          divergences.push({
            entity_id: v.id,
            entity_type: 'vehicle',
            divergence_type: 'geo_position',
            distance_km: geoDist,
            severity: geoDist > 20 ? 'critical' : 'high',
          });
        }
      }
    }

    // Shipment temperature divergence
    for (const s of shipments) {
      const shipmentTwins = twins.filter(t => t.entity_id === s.id && t.entity_type === 'shipment');
      if (shipmentTwins.length > 0) {
        const sim = JSON.parse(shipmentTwins[0].simulated_state);
        const tempDiff = Math.abs((s.current_temperature || 0) - sim.expected_temperature);
        
        if (tempDiff > 3 && s.temperature_max) {
          divergences.push({
            entity_id: s.id,
            entity_type: 'shipment',
            divergence_type: 'temperature_breach',
            temp_diff: tempDiff,
            severity: tempDiff > 10 ? 'critical' : 'high',
          });
        }
      }
    }

    console.log(`[DIGITAL-TWIN] Org: ${orgId}. Twins: ${createdCount}. Divergences: ${divergences.length}`);

    allResults.push({
      organization_id: orgId,
      total_twins_created: createdCount,
      divergence_count: divergences.length,
      divergences: divergences.slice(0, 10),
      twin_types: {
        vehicles: vehicles.length,
        shipments: shipments.length,
        resources: resources.length,
      },
    });
    } // end for orgId loop

    return Response.json({
      status: 'success',
      organizations_processed: allResults.length,
      results: allResults,
    });
  } catch (error) {
    console.error('[DIGITAL-TWIN] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});