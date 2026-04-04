import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Fetches real Danish grid data from Energinet's open DataHub API
// Docs: https://api.energidataservice.dk/

async function fetchEnerginetData() {
  const now = new Date();

  // Fetch current production mix (wind, solar, etc.)
  const productionUrl = `https://api.energidataservice.dk/dataset/PowerSystemRightNow?limit=1&sort=Minutes5UTC desc&timezone=dk`;
  const productionRes = await fetch(productionUrl);
  
  if (!productionRes.ok) {
    throw new Error(`Energinet API error: ${productionRes.status} ${productionRes.statusText}`);
  }
  
  const productionText = await productionRes.text();
  let productionData;
  try {
    productionData = JSON.parse(productionText);
  } catch (e) {
    throw new Error(`Invalid JSON from Energinet production API: ${productionText.slice(0, 100)}`);
  }
  const latest = productionData?.records?.[0] || null;

  // Fetch CO2 emission intensity
  const co2Url = `https://api.energidataservice.dk/dataset/CO2Emis?limit=1&sort=Minutes5UTC desc&timezone=dk`;
  const co2Res = await fetch(co2Url);
  
  if (!co2Res.ok) {
    throw new Error(`Energinet CO2 API error: ${co2Res.status} ${co2Res.statusText}`);
  }
  
  const co2Text = await co2Res.text();
  let co2Data;
  try {
    co2Data = JSON.parse(co2Text);
  } catch (e) {
    throw new Error(`Invalid JSON from Energinet CO2 API: ${co2Text.slice(0, 100)}`);
  }
  const latestCO2 = co2Data?.records?.[0] || null;

  return { latest, latestCO2 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { latest, latestCO2 } = await fetchEnerginetData();

    if (!latest) {
      return Response.json({ error: 'No data from Energinet API' }, { status: 502 });
    }

    // Map Energinet data to our grid assets
    const assets = await base44.asServiceRole.entities.GridAsset.list();
    const now = new Date().toISOString();

    const updates = [];

    // Update wind asset with real DK wind production
    const windTotal = (latest.OffshoreWindPower || 0) + (latest.OnshoreWindPower || 0);
    const windAsset = assets.find(a => a.asset_type === 'wind');
    if (windAsset && windTotal > 0) {
      const windMW = Math.round(windTotal); // Already in MW from Energinet
      const windPct = Math.min(Math.round((windMW / windAsset.capacity_mw) * 100), 100);
      await base44.asServiceRole.entities.GridAsset.update(windAsset.id, {
        current_load_mw: Math.min(windMW, windAsset.capacity_mw),
        load_percent: windPct,
        last_reading_at: now,
        co2_kg_per_mwh: 0,
      });
      updates.push({ asset: windAsset.name, mw: windMW, source: 'energinet_live' });
    }

    // Update solar asset with real DK solar production
    const solarTotal = latest.SolarPower || 0;
    const solarAsset = assets.find(a => a.asset_type === 'solar');
    if (solarAsset && solarTotal >= 0) {
      const solarMW = Math.round(solarTotal);
      const solarPct = Math.min(Math.round((solarMW / solarAsset.capacity_mw) * 100), 100);
      await base44.asServiceRole.entities.GridAsset.update(solarAsset.id, {
        current_load_mw: Math.min(solarMW, solarAsset.capacity_mw),
        load_percent: solarPct,
        last_reading_at: now,
      });
      updates.push({ asset: solarAsset.name, mw: solarMW, source: 'energinet_live' });
    }

    // Update CO2 intensity for generator
    const co2Intensity = latestCO2?.CO2Emission || null;
    const genAsset = assets.find(a => a.asset_type === 'generator');
    if (genAsset && co2Intensity) {
      await base44.asServiceRole.entities.GridAsset.update(genAsset.id, {
        co2_kg_per_mwh: Math.round(co2Intensity),
        last_reading_at: now,
      });
      updates.push({ asset: genAsset.name, co2_g_per_kwh: co2Intensity, source: 'energinet_co2' });
    }

    // Create a GridEvent with the real-time snapshot
    const totalProduction = (latest.TotalLoad || 0);
    const renewableShare = totalProduction > 0
      ? Math.round(((windTotal + solarTotal) / totalProduction) * 100)
      : 0;

    // Store latest grid snapshot as a flex_request event if renewable share is high
    if (renewableShare > 70) {
      const existing = await base44.asServiceRole.entities.GridEvent.filter({
        event_type: 'flex_request',
        status: 'open',
        asset_name: 'Energinet.dk Live Feed',
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.GridEvent.create({
          organization_id: 'system',
          event_type: 'flex_request',
          asset_name: 'Energinet.dk Live Feed',
          severity: 'info',
          description: `Vedvarende energiandel: ${renewableShare}% (Vind: ${Math.round(windTotal)} MW, Sol: ${Math.round(solarTotal)} MW). CO₂: ${Math.round(co2Intensity || 0)} g/kWh. Godt tidspunkt for flex-forbrug.`,
          ai_recommendation: `Udnyt det høje VE-overskud: aktiver PtX, fremryl lade-cyklus for Transit-depoter og shore power.`,
          status: 'open',
          linked_module: 'none',
        });
      }
    }

    return Response.json({
      success: true,
      source: 'Energinet.dk DataHub API',
      timestamp: now,
      live_data: {
        wind_mw: Math.round(windTotal),
        solar_mw: Math.round(solarTotal),
        total_load_mw: Math.round(latest.TotalLoad || 0),
        renewable_pct: renewableShare,
        co2_g_per_kwh: Math.round(co2Intensity || 0),
        exchange_dk1: Math.round(latest.ExchangeGreatBelt || 0),
        exchange_no: Math.round(latest.ExchangeNorway || 0),
        exchange_se: Math.round(latest.ExchangeSweden || 0),
      },
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});