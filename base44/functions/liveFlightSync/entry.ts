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

  let synced = 0;
  let created = 0;
  let updated = 0;
  const gateUpdates = {};

  for (const raw of allFlights) {
    const fn = raw.flight?.iata || raw.flight?.icao;
    if (!fn) continue;

    const isDep = raw.departure?.iata === airport_iata;
    const isArr = raw.arrival?.iata === airport_iata;

    // Map AviationStack status → our status
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

    // Parse delay
    let delayMinutes = 0;
    if (isDep && raw.departure?.delay) delayMinutes = parseInt(raw.departure.delay) || 0;
    if (isArr && raw.arrival?.delay) delayMinutes = parseInt(raw.arrival.delay) || 0;
    if (delayMinutes > 0 && status === "on_time") {}  // keep delayed implicit from delay_minutes

    // Gate
    const gateCode = isDep ? (raw.departure?.gate || null) : (raw.arrival?.gate || null);

    // ETA/ETD
    const eta = isArr
      ? (raw.arrival?.estimated || raw.arrival?.actual || raw.arrival?.scheduled)
      : (raw.departure?.estimated || raw.departure?.actual || raw.departure?.scheduled);

    const flightData = {
      flight_number: fn,
      airline: raw.airline?.name || "",
      origin: isArr ? (raw.departure?.iata || raw.departure?.airport || "") : airport_iata,
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
      await base44.asServiceRole.entities.Flight.update(existing.id, flightData);
      updated++;
      // Update gate assignment if gate is known
      if (gateCode) {
        const gc = gateCode.toUpperCase();
        const gate = gateByCode[gc];
        if (gate && gate.current_flight_id !== existing.id) {
          gateUpdates[gate.id] = { current_flight_id: existing.id, status: "occupied" };
        }
      }
    } else {
      const newFlight = await base44.asServiceRole.entities.Flight.create(flightData);
      created++;
      if (gateCode) {
        const gc = gateCode.toUpperCase();
        const gate = gateByCode[gc];
        if (gate) gateUpdates[gate.id] = { current_flight_id: newFlight.id, status: "occupied" };
      }
    }
    synced++;
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