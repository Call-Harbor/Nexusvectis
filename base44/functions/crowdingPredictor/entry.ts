import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, lineId, busId, organizationId } = await req.json();

    // Fetch trip, bus, and historical data
    const trip = await base44.asServiceRole.entities.BusTrip.get(tripId);
    const bus = await base44.asServiceRole.entities.Bus.get(busId);
    const recentDemand = await base44.asServiceRole.entities.PassengerDemand.filter({
      organization_id: organizationId,
      line_id: lineId
    }, '-timestamp', 100);

    // Calculate average occupancy for this line at this time
    const currentHour = new Date().getHours();
    const avgForHour = recentDemand
      .filter(d => new Date(d.timestamp).getHours() === currentHour)
      .reduce((sum, d) => sum + d.passenger_count, 0) / (recentDemand.length || 1);

    // Predict crowding (simple model: historical + current load)
    const currentLoad = trip.total_passengers || 0;
    const capacity = bus.capacity_seated + bus.capacity_standing;
    const predictedLoad = Math.min(capacity, Math.round(avgForHour * 1.1 + currentLoad * 0.2));
    const occupancyPct = (predictedLoad / capacity) * 100;

    // Determine level
    let crowdingLevel = 'low';
    let riskLeftBehind = false;
    if (occupancyPct > 85) {
      crowdingLevel = 'high';
      riskLeftBehind = true;
    } else if (occupancyPct > 60) {
      crowdingLevel = 'medium';
    }

    // Save prediction
    const prediction = await base44.asServiceRole.entities.CrowdingPrediction.create({
      organization_id: organizationId,
      trip_id: tripId,
      bus_id: busId,
      line_id: lineId,
      predicted_at: new Date().toISOString(),
      prediction_timestamp: new Date(Date.now() + 20 * 60000).toISOString(),
      crowding_level: crowdingLevel,
      occupancy_percentage: occupancyPct,
      standing_passengers: Math.max(0, predictedLoad - bus.capacity_seated),
      capacity_total: capacity,
      left_behind_risk: riskLeftBehind,
      confidence: 75,
      factors: [
        { factor: 'historical_demand', impact: 0.6 },
        { factor: 'current_load', impact: 0.3 },
        { factor: 'time_of_day', impact: 0.1 }
      ]
    });

    return Response.json({ success: true, prediction });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});