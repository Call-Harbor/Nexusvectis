import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { organizationId, lineId } = await req.json();

    // Fetch trips for calculation
    const trips = await base44.asServiceRole.entities.BusTrip.filter({
      organization_id: organizationId,
      line_id: lineId,
      status: 'completed'
    }, '-scheduled_date', 50);

    // Fetch related buses
    const buses = await base44.asServiceRole.entities.Bus.filter({
      organization_id: organizationId
    }, null, 50);

    // Calculate CO2 metrics
    let totalCO2 = 0;
    let totalPassengers = 0;
    let electricCount = 0;
    let totalDistance = 0;

    for (const trip of trips) {
      totalCO2 += trip.co2_kg || 0;
      totalPassengers += trip.total_passengers || 0;
      totalDistance += trip.distance_km || 0;

      const bus = buses.find(b => b.id === trip.assigned_bus_id);
      if (bus && bus.fuel_type === 'electric') {
        electricCount++;
      }
    }

    const co2PerPassengerKm = totalPassengers > 0 
      ? totalCO2 / (totalPassengers * (totalDistance / trips.length || 1))
      : 0;

    // Generate optimization suggestion
    let suggestion = '';
    let reduction = 0;

    const electricPercentage = (electricCount / trips.length) * 100;
    if (electricPercentage < 30) {
      suggestion = `Increase electric bus deployment on this line. Currently only ${electricPercentage.toFixed(0)}% of trips use electric.`;
      reduction = 15;
    } else if (electricPercentage > 50) {
      suggestion = `Consider increasing frequency to improve load factor and reduce CO2 per passenger.`;
      reduction = 8;
    }

    // Save metric
    const metric = await base44.asServiceRole.entities.SustainabilityMetric.create({
      organization_id: organizationId,
      metric_date: new Date().toISOString().split('T')[0],
      line_id: lineId,
      co2_per_passenger_km: co2PerPassengerKm,
      total_co2_kg: totalCO2,
      electric_percentage: electricPercentage,
      fuel_consumption_liter: trips.length * 30, // Estimate
      passengers_transported: totalPassengers,
      optimization_suggestion: suggestion,
      potential_co2_reduction: reduction
    });

    return nvJson(requestId, { success: true, metric, suggestion });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});