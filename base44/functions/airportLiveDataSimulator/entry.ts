import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Simulates realistic live fluctuations for airport operational data:
// - SecurityLane: queue_length, wait_minutes
// - LandsideZone: queue_count, wait_minutes, current_occupancy
// - AirportGate: pax_waiting

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = user.organization_id;
  if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });

  const hour = new Date().getHours();
  // Peak hours: 6-9, 11-13, 16-20 → higher load
  const isPeak = (hour >= 6 && hour <= 9) || (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 20);
  const loadFactor = isPeak ? 1.0 : 0.4;

  const [lanes, zones, gates] = await Promise.all([
    base44.asServiceRole.entities.SecurityLane.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.LandsideZone.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.AirportGate.filter({ organization_id: orgId }),
  ]);

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const fluctuate = (current, min, max, delta) => {
    const change = rand(-delta, delta);
    return Math.min(max, Math.max(min, (current || 0) + change));
  };

  const updates = [];

  // Update Security Lanes
  for (const lane of lanes) {
    if (lane.status === 'closed') continue;
    const baseQueue = lane.status === 'open' ? rand(5, 80) * loadFactor : rand(0, 20) * loadFactor;
    const newQueue = Math.round(fluctuate(lane.queue_length, 0, 200, 15 * loadFactor));
    const throughput = lane.throughput_per_hour || 180;
    const newWait = Math.round((newQueue / throughput) * 60);
    updates.push(
      base44.asServiceRole.entities.SecurityLane.update(lane.id, {
        queue_length: newQueue,
        wait_minutes: newWait,
      })
    );
  }

  // Update Landside Zones
  for (const zone of zones) {
    if (zone.status === 'closed') continue;
    const capacity = zone.capacity || 100;

    let newOccupancy, newQueue, newWait;
    if (zone.facility_type === 'parking') {
      newOccupancy = Math.round(fluctuate(zone.current_occupancy, 0, capacity, Math.round(capacity * 0.05)));
      newQueue = 0;
      newWait = 0;
    } else if (zone.facility_type === 'bus' || zone.facility_type === 'train') {
      newOccupancy = Math.round(fluctuate(zone.current_occupancy, 0, capacity, 10));
      newQueue = Math.round(fluctuate(zone.queue_count, 0, 80, 8) * loadFactor);
      newWait = Math.round(fluctuate(zone.wait_minutes, 0, 30, 3));
      // next departure countdown
      const nextDep = zone.next_departure_minutes != null
        ? Math.max(0, zone.next_departure_minutes - rand(1, 5))
        : rand(2, 20);
      updates.push(
        base44.asServiceRole.entities.LandsideZone.update(zone.id, {
          current_occupancy: newOccupancy,
          queue_count: newQueue,
          wait_minutes: newWait,
          next_departure_minutes: nextDep,
        })
      );
      continue;
    } else {
      newOccupancy = Math.round(fluctuate(zone.current_occupancy, 0, capacity, 8));
      newQueue = Math.round(fluctuate(zone.queue_count, 0, 100, 10) * loadFactor);
      newWait = Math.round(fluctuate(zone.wait_minutes, 0, 45, 4));
    }

    updates.push(
      base44.asServiceRole.entities.LandsideZone.update(zone.id, {
        current_occupancy: newOccupancy,
        queue_count: newQueue,
        wait_minutes: newWait,
      })
    );
  }

  // Update Gate pax_waiting
  for (const gate of gates) {
    if (gate.status === 'closed' || gate.status === 'maintenance') continue;
    if (!gate.boarding_active && gate.status !== 'occupied') continue;
    const newPax = Math.round(fluctuate(gate.pax_waiting, 0, 250, 20) * loadFactor);
    updates.push(
      base44.asServiceRole.entities.AirportGate.update(gate.id, { pax_waiting: newPax })
    );
  }

  await Promise.all(updates);

  return Response.json({
    success: true,
    updated: {
      lanes: lanes.filter(l => l.status !== 'closed').length,
      zones: zones.filter(z => z.status !== 'closed').length,
      gates: gates.filter(g => g.boarding_active || g.status === 'occupied').length,
    },
    isPeak,
    timestamp: new Date().toISOString(),
  });
});