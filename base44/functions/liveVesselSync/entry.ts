import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Syncs live AIS vessel data to PortCall + Vessel entities
// Uses AISHub (free at aishub.net) - set AISHUB_USERNAME in secrets
// Area defaults to the Øresund / Kattegat / Baltic entrance region

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { locode, lat_min, lat_max, lon_min, lon_max, organization_id } = body;

  const orgId = organization_id || user.organization_id;
  const username = Deno.env.get("AISHUB_USERNAME");

  if (!username) {
    return Response.json({
      synced: 0,
      message: "AISHUB_USERNAME not configured. Register free at aishub.net and set AISHUB_USERNAME in secrets.",
      no_key: true
    });
  }

  // Default area: Danish waters / Øresund strait
  const latMin = lat_min ?? 54.5;
  const latMax = lat_max ?? 57.8;
  const lonMin = lon_min ?? 9.5;
  const lonMax = lon_max ?? 13.5;

  const url = `https://data.aishub.net/ws.php?username=${username}&format=1&output=json&compress=0&latmin=${latMin}&latmax=${latMax}&lonmin=${lonMin}&lonmax=${lonMax}`;

  let rawVessels = [];
  let apiError = null;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`AISHub HTTP ${res.status}`);
    const data = await res.json();
    if (data[0]?.ERROR === false && Array.isArray(data[1])) {
      rawVessels = data[1].slice(0, 200);
    } else {
      apiError = data[0]?.DESCRIPTION || "No data from AISHub";
    }
  } catch (e) {
    apiError = e.message;
  }

  if (apiError && rawVessels.length === 0) {
    return Response.json({ synced: 0, error: apiError });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Load existing vessels
  const existingVessels = await base44.asServiceRole.entities.Vessel.filter({ organization_id: orgId }, "-created_date", 500);
  const vesselByMMSI = {};
  existingVessels.forEach(v => { if (v.mmsi) vesselByMMSI[v.mmsi] = v; });

  // Load existing port calls
  const existingCalls = await base44.asServiceRole.entities.PortCall.filter({ organization_id: orgId }, "-created_date", 200);
  const callByVesselId = {};
  existingCalls.forEach(pc => { if (pc.vessel_id) callByVesselId[pc.vessel_id] = pc; });

  const typeMap = {
    70: "cargo", 71: "cargo", 72: "cargo", 73: "cargo", 74: "cargo", 79: "cargo",
    80: "tanker", 81: "tanker", 82: "tanker", 83: "tanker", 84: "tanker", 89: "tanker",
    60: "passenger", 61: "passenger", 62: "passenger", 63: "passenger", 69: "passenger",
    30: "fishing", 31: "tug", 52: "tug",
    40: "highspeed", 50: "pilot",
    1: "unknown"
  };

  const toCreateVessel = [];
  const toUpdateVessel = [];
  const toCreateCall = [];
  const toUpdateCall = [];

  for (const raw of rawVessels) {
    const mmsi = String(raw.MMSI || "").trim();
    if (!mmsi || mmsi === "0") continue;

    const lat = parseFloat(raw.LATITUDE);
    const lon = parseFloat(raw.LONGITUDE);
    if (!lat || !lon || lat < -90 || lat > 90) continue;

    const shipTypeCode = Math.floor((parseInt(raw.TYPE) || 0) / 10) * 10;
    const vesselClass = typeMap[shipTypeCode] || typeMap[parseInt(raw.TYPE)] || "cargo";

    const vesselData = {
      mmsi,
      name: (raw.NAME || "UNKNOWN").trim(),
      type: "ship",
      vessel_class: vesselClass,
      latitude: lat,
      longitude: lon,
      speed: parseFloat(raw.SOG) || 0,
      heading: parseFloat(raw.COG) || 0,
      destination: (raw.DESTINATION || "").trim(),
      callsign: (raw.CALLSIGN || "").trim(),
      status: parseFloat(raw.SOG) > 0.5 ? "active" : "idle",
      organization_id: orgId,
    };

    const existing = vesselByMMSI[mmsi];
    let vesselId;
    if (existing) {
      toUpdateVessel.push({ id: existing.id, ...vesselData });
      vesselId = existing.id;
    } else {
      // we'll create and track id later; store placeholder
      toCreateVessel.push({ ...vesselData, _mmsi_ref: mmsi });
      vesselId = null; // will be resolved post-create
    }

    // Only create port calls for vessels heading to/stopped at a port (speed < 2 kn or LOCODE match)
    const isAtPort = parseFloat(raw.SOG) < 2.0;
    if (isAtPort && existing) {
      const dest = (raw.DESTINATION || "").trim();
      const callData = {
        vessel_id: existing.id,
        status: parseFloat(raw.SOG) < 0.3 ? "berthed" : "approaching",
        destination_locode: locode || dest,
        delay_minutes: 0,
        organization_id: orgId,
      };
      const existingCall = callByVesselId[existing.id];
      if (existingCall) {
        toUpdateCall.push({ id: existingCall.id, ...callData });
      } else {
        toCreateCall.push(callData);
      }
    }
  }

  let created = 0, updated = 0, callsCreated = 0, callsUpdated = 0;

  // Create new vessels in batches
  for (let i = 0; i < toCreateVessel.length; i += 10) {
    const batch = toCreateVessel.slice(i, i + 10).map(({ _mmsi_ref, ...v }) => v);
    await base44.asServiceRole.entities.Vessel.bulkCreate(batch);
    created += batch.length;
    if (i + 10 < toCreateVessel.length) await sleep(300);
  }

  // Update existing vessels
  for (let i = 0; i < toUpdateVessel.length; i++) {
    const { id, ...d } = toUpdateVessel[i];
    await base44.asServiceRole.entities.Vessel.update(id, d);
    updated++;
    if (i % 5 === 4) await sleep(200);
  }

  // Create/update port calls
  for (const call of toCreateCall) {
    await base44.asServiceRole.entities.PortCall.create(call);
    callsCreated++;
    await sleep(100);
  }
  for (const { id, ...d } of toUpdateCall) {
    await base44.asServiceRole.entities.PortCall.update(id, d);
    callsUpdated++;
    await sleep(100);
  }

  return Response.json({
    synced: rawVessels.length,
    vessels_created: created,
    vessels_updated: updated,
    port_calls_created: callsCreated,
    port_calls_updated: callsUpdated,
    area: { latMin, latMax, lonMin, lonMax },
    timestamp: new Date().toISOString()
  });
});