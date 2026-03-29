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

  // Fetch both arrivals and departures from AviationStack
  const [arrRes, depRes] = await Promise.all([
    fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&arr_iata=${airport_iata}&flight_status=active&limit=50`),
    fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${airport_iata}&limit=100`)
  ]);

  const [arrData, depData] = await Promise.all([arrRes.json(), depRes.json()]);

  const allFlights = [
    ...(arrData.data || []),
    ...(depData.data || [])
  ];

  if (!allFlights.length) {
    return Response.json({ synced: 0, message: "Ingen fly returneret fra API - tjek IATA kode og API plan", raw_error: arrData.error || depData.error });
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

  const toCreate = [];
  const toUpdate = []; // [{id, data}]
  const gateUpdates = {};

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
    if (!isDep && raw.arrival?.delay) delayMinutes = parseInt(raw.arrival.delay) || 0;

    const gateCode = isDep ? (raw.departure?.gate || null) : (raw.arrival?.gate || null);

    const flightData = {
      flight_number: fn,
      airline: raw.airline?.name || "",
      origin: (!isDep) ? (raw.departure?.iata || raw.departure?.airport || "") : airport_iata,
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
      toUpdate.push({ id: existing.id, data: flightData });
      if (gateCode) {
        const gate = gateByCode[gateCode.toUpperCase()];
        if (gate) gateUpdates[gate.id] = { current_flight_id: existing.id, status: "occupied" };
      }
    } else {
      toCreate.push(flightData);
    }
  }

  // Bulk create new flights
  let created = 0;
  if (toCreate.length > 0) {
    await base44.asServiceRole.entities.Flight.bulkCreate(toCreate);
    created = toCreate.length;
  }

  // Batch update existing (in chunks of 20 to avoid rate limits)
  let updated = 0;
  const CHUNK = 20;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    await Promise.all(chunk.map(({ id, data }) => base44.asServiceRole.entities.Flight.update(id, data)));
    updated += chunk.length;
    if (i + CHUNK < toUpdate.length) await new Promise(r => setTimeout(r, 300));
  }

  const synced = created + updated;

  // Apply gate updates
  if (Object.keys(gateUpdates).length > 0) {
    await Promise.all(Object.entries(gateUpdates).map(([gid, d]) => base44.asServiceRole.entities.AirportGate.update(gid, d)));
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