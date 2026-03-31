import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Realistic load fluctuation based on time of day and asset type
function simulateLoad(asset, now) {
  const hour = now.getUTCHours() + 2; // Copenhagen UTC+2
  const minute = now.getUTCMinutes();
  const timeRatio = (hour + minute / 60) / 24;

  // Daily load curve (typical Danish grid pattern)
  const dailyCurve = Math.sin((timeRatio - 0.1) * Math.PI) * 0.35 + 0.65;
  // Small random fluctuation ±3%
  const noise = (Math.random() - 0.5) * 0.06;

  let baseLoad = 0;
  let loadPercent = 0;

  switch (asset.asset_type) {
    case 'wind': {
      // Wind is inverse of daily demand curve + random
      const windFactor = 0.5 + Math.random() * 0.45;
      baseLoad = Math.round(asset.capacity_mw * windFactor);
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    case 'solar': {
      // Solar follows sunlight — zero at night
      const solarHour = hour % 24;
      const solarFactor = solarHour >= 6 && solarHour <= 20
        ? Math.sin(((solarHour - 6) / 14) * Math.PI) * (0.7 + Math.random() * 0.25)
        : 0;
      baseLoad = Math.round(asset.capacity_mw * solarFactor);
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    case 'battery': {
      // Battery charges/discharges based on grid need
      if (asset.status === 'maintenance') { baseLoad = 0; loadPercent = 0; break; }
      const batteryFactor = dailyCurve + noise;
      baseLoad = Math.round(asset.capacity_mw * Math.min(Math.max(batteryFactor * 0.7, 0), 1));
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    case 'generator': {
      // Gas generator: standby at night, ramps up at peak demand
      const peakHour = hour % 24;
      const isPeak = (peakHour >= 7 && peakHour <= 9) || (peakHour >= 17 && peakHour <= 21);
      const genFactor = isPeak ? 0.6 + Math.random() * 0.35 : 0.2 + Math.random() * 0.2;
      baseLoad = Math.round(asset.capacity_mw * genFactor);
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    case 'line':
    case 'transformer': {
      const lineFactor = dailyCurve + noise;
      baseLoad = Math.round(asset.capacity_mw * Math.min(Math.max(lineFactor, 0.3), 0.97));
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    case 'load_node': {
      // Load nodes follow daily curve + module-specific patterns
      let factor = dailyCurve + noise;
      if (asset.linked_module === 'transit') {
        // Transit depots charge mostly at night
        const transitHour = hour % 24;
        factor = transitHour >= 22 || transitHour <= 6 ? 0.7 + Math.random() * 0.25 : 0.2 + Math.random() * 0.3;
      } else if (asset.linked_module === 'airport') {
        // Airport 24/7 but dips at 3-5am
        const airHour = hour % 24;
        factor = (airHour >= 3 && airHour <= 5) ? 0.4 + Math.random() * 0.15 : 0.75 + Math.random() * 0.2;
      }
      baseLoad = Math.round(asset.capacity_mw * Math.min(Math.max(factor, 0.05), 0.99));
      loadPercent = Math.round((baseLoad / asset.capacity_mw) * 100);
      break;
    }
    default:
      baseLoad = asset.current_load_mw || 0;
      loadPercent = asset.load_percent || 0;
  }

  return { current_load_mw: baseLoad, load_percent: loadPercent, last_reading_at: now.toISOString() };
}

function determineStatus(asset, loadPercent) {
  if (asset.status === 'maintenance' || asset.status === 'offline') return asset.status;
  if (loadPercent === 0 && asset.asset_type === 'generator') return 'standby';
  if (loadPercent >= 97) return 'fault'; // Auto-fault at 97%+ 
  return 'online';
}

async function checkAndCreateAlerts(base44, asset, newLoad, orgId) {
  // Only create new alert if critically overloaded and not already flagged
  if (newLoad.load_percent >= 90 && asset.asset_type !== 'load_node') {
    const existing = await base44.asServiceRole.entities.GridEvent.filter({
      asset_name: asset.name,
      status: 'open',
      event_type: 'overload',
    });
    if (existing.length === 0) {
      await base44.asServiceRole.entities.GridEvent.create({
        organization_id: orgId,
        event_type: 'overload',
        asset_name: asset.name,
        asset_id: asset.id,
        severity: newLoad.load_percent >= 95 ? 'critical' : 'warning',
        description: `${asset.name} er ${newLoad.load_percent}% belastet (${newLoad.current_load_mw}/${asset.capacity_mw} MW) — over kritisk grænse.`,
        ai_recommendation: `Reducer belastning på ${asset.name} øjeblikkeligt. Aktiver fleksible ressourcer eller omlæg last.`,
        status: 'open',
        linked_module: asset.linked_module || 'none',
        flex_mw_requested: Math.round((newLoad.load_percent - 85) / 100 * asset.capacity_mw),
      });
    }
  }
  // Auto-resolve overload events if load drops below 85%
  if (newLoad.load_percent < 85) {
    const openOverloads = await base44.asServiceRole.entities.GridEvent.filter({
      asset_name: asset.name,
      status: 'open',
      event_type: 'overload',
    });
    for (const ev of openOverloads) {
      await base44.asServiceRole.entities.GridEvent.update(ev.id, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      });
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled calls (no user auth needed for automated updates)
    const assets = await base44.asServiceRole.entities.GridAsset.list();

    if (!assets.length) {
      return Response.json({ message: 'No grid assets found', updated: 0 });
    }

    const now = new Date();
    let updated = 0;
    let alertsCreated = 0;

    await Promise.all(assets.map(async (asset) => {
      if (asset.status === 'offline') return;

      const newLoad = simulateLoad(asset, now);
      const newStatus = determineStatus(asset, newLoad.load_percent);

      await base44.asServiceRole.entities.GridAsset.update(asset.id, {
        ...newLoad,
        status: newStatus,
      });
      updated++;

      // Check for overload events
      const orgId = asset.organization_id || 'system';
      await checkAndCreateAlerts(base44, asset, newLoad, orgId);
    }));

    return Response.json({
      success: true,
      updated,
      timestamp: now.toISOString(),
      message: `Updated ${updated} grid assets`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});