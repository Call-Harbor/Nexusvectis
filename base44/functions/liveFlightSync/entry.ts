import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { airport_iata, organization_id } = body;

  if (!airport_iata) return Response.json({ error: 'airport_iata required' }, { status: 400 });

  const orgId = organization_id || user.organization_id;
  const apiKey = Deno.env.get("AVIATIONSTACK_API_KEY");

  // Fetch departures only (free plan supports one endpoint)
  const depRes = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${airport_iata}&limit=50`);
  const depData = await depRes.json();
  const allFlights = depData.data || [];

  if (!allFlights.length) {
    return Response.json({ synced: 0, message: "Ingen fly returneret fra API - tjek IATA kode og API plan", raw_error: depData.error });
  }

  // Load existing flights and gates for this org
  const [existingFlights, existingGates] = await Promise.all([
    base44.asServiceRole.entities.Flight.filter({ organization_id: orgId }, "-created_date", 200),
    base44.asServiceRole.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 80)
  ]);

  const flightByNumber = {};
  existingFlights.forEach(f => { if (f.flight_number) flightByNumber[f.flight_number] = f; });

  const gateByCode = {};
  existingGates.forEach(g => { if (g.gate_code) gateByCode[g.gate_code.toUpperCase()] = g; });

  let synced = 0;
  let created = 0;
  let updated = 0;
  const gateUpdates = {};
  const toCreate = [];
  const toUpdate = [];

  for (const raw of allFlights) {
    const fn = raw.flight?.iata || raw.flight?.icao;
    if (!fn) continue;

    const isDep = raw.departure?.iata === airport_iata;

    const statusMap = {
      "scheduled": "on_time",
      "active": isDep ? "boarding" : "on_time",
      "landed": "landed",
      "cancelled": "cancelled",
      "incident": "cancelled",
      "diverted": "delayed",
      "unknown": "on_time",
    };
    const status = statusMap[raw.flight_status] || "on_time";

    let delayMinutes = 0;
    if (isDep && raw.departure?.delay) delayMinutes = parseInt(raw.departure.delay) || 0;
    else if (raw.arrival?.delay) delayMinutes = parseInt(raw.arrival.delay) || 0;

    const gateCode = isDep ? (raw.departure?.gate || null) : (raw.arrival?.gate || null);

    const flightData = {
      flight_number: fn,
      airline: raw.airline?.name || "",
      origin: isDep ? airport_iata : (raw.departure?.iata || raw.departure?.airport || ""),
      destination: isDep ? (raw.arrival?.iata || raw.arrival?.airport || "") : airport_iata,
      status,
      delay_minutes: delayMinutes,
      scheduled_departure: raw.departure?.scheduled || null,
      scheduled_arrival: raw.arrival?.scheduled || null,
      estimated_departure: raw.departure?.estimated || null,
      estimated_arrival: raw.arrival?.estimated || null,
      actual_departure: raw.departure?.actual || null,
      actual_arrival: raw.arrival?.actual || null,
      gate: gateCode,
      aircraft_type: raw.aircraft?.iata || raw.aircraft?.icao || null,
      organization_id: orgId,
    };

    const existing = flightByNumber[fn];
    if (existing) {
      toUpdate.push({ id: existing.id, ...flightData });
      if (gateCode) {
        const gate = gateByCode[gateCode.toUpperCase()];
        if (gate) gateUpdates[gate.id] = { current_flight_id: existing.id, status: "occupied" };
      }
    } else {
      toCreate.push(flightData);
    }
    synced++;
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Bulk create new flights in batches of 10
  for (let i = 0; i < toCreate.length; i += 10) {
    const batch = toCreate.slice(i, i + 10);
    await base44.asServiceRole.entities.Flight.bulkCreate(batch);
    created += batch.length;
    if (i + 10 < toCreate.length) await sleep(300);
  }

  // Update changed flights one by one with small delay
  for (let i = 0; i < toUpdate.length; i++) {
    const { id, ...d } = toUpdate[i];
    await base44.asServiceRole.entities.Flight.update(id, d);
    updated++;
    if (i % 5 === 4) await sleep(200);
  }

  // Apply gate updates
  for (const [gateId, data] of Object.entries(gateUpdates)) {
    await base44.asServiceRole.entities.AirportGate.update(gateId, data);
  }

  return Response.json({
    synced,
    created,
    updated,
    gate_updates: Object.keys(gateUpdates).length,
    airport: airport_iata,
    timestamp: new Date().toISOString()
  });
});