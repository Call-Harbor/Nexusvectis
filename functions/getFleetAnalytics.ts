import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, transport_type, date_from, date_to } = await req.json();

    const filters = { organization_id };
    if (transport_type) filters.type = transport_type;

    const vehicles = await base44.asServiceRole.entities.Vehicle.filter(filters);

    // Analytics by transport type
    const byType = vehicles.reduce((acc, v) => {
      if (!acc[v.type]) {
        acc[v.type] = { count: 0, active: 0, total_emissions: 0, avg_efficiency: 0 };
      }
      acc[v.type].count++;
      if (v.status === 'active') acc[v.type].active++;
      acc[v.type].total_emissions += v.co2_emissions || 0;
      acc[v.type].avg_efficiency += v.efficiency_score || 0;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(byType).forEach(type => {
      byType[type].avg_efficiency = byType[type].avg_efficiency / byType[type].count;
      byType[type].utilization_rate = (byType[type].active / byType[type].count * 100).toFixed(1);
    });

    // Status distribution
    const statusDistribution = vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    // Signal quality analysis
    const signalAnalysis = vehicles.reduce((acc, v) => {
      if (v.signal_type) {
        if (!acc[v.signal_type]) {
          acc[v.signal_type] = { count: 0, avg_strength: 0 };
        }
        acc[v.signal_type].count++;
        acc[v.signal_type].avg_strength += v.signal_strength || 0;
      }
      return acc;
    }, {});

    Object.keys(signalAnalysis).forEach(signal => {
      signalAnalysis[signal].avg_strength = 
        (signalAnalysis[signal].avg_strength / signalAnalysis[signal].count).toFixed(1);
    });

    return Response.json({
      success: true,
      analytics: {
        total_fleet_size: vehicles.length,
        by_transport_type: byType,
        status_distribution: statusDistribution,
        signal_quality: signalAnalysis,
        average_fuel_level: (vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicles.length).toFixed(1),
        low_fuel_vehicles: vehicles.filter(v => (v.fuel_level || 100) < 20).length,
        total_cargo_capacity: vehicles.reduce((sum, v) => sum + (v.cargo_capacity || 0), 0),
        cargo_utilization: (vehicles.reduce((sum, v) => sum + ((v.cargo_used || 0) / (v.cargo_capacity || 1)), 0) / vehicles.length * 100).toFixed(1)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});