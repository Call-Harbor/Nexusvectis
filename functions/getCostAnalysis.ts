import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id, currency = 'EUR' } = await req.json();

    const [vehicles, routes, maintenance, shipments] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }),
      base44.asServiceRole.entities.Route.filter({ organization_id }),
      base44.asServiceRole.entities.Maintenance.filter({ organization_id }),
      base44.asServiceRole.entities.Shipment.filter({ organization_id })
    ]);

    // Cost calculations (estimates)
    const fuelCostPerLiter = 1.5; // EUR
    const maintenanceCosts = maintenance.reduce((sum, m) => sum + (m.cost_estimate || 0), 0);
    
    // Fuel costs (estimated from fuel levels)
    const fuelCosts = vehicles.reduce((sum, v) => {
      const fuelUsed = 100 - (v.fuel_level || 100);
      const tankSize = v.type === 'truck' ? 400 : v.type === 'ship' ? 5000 : v.type === 'aircraft' ? 20000 : 100;
      return sum + ((fuelUsed / 100) * tankSize * fuelCostPerLiter);
    }, 0);

    // Route costs (distance-based)
    const routeCosts = routes.reduce((sum, r) => {
      const costPerKm = r.transport_type === 'truck' ? 0.8 : 
                        r.transport_type === 'ship' ? 0.3 : 
                        r.transport_type === 'aircraft' ? 2.5 : 
                        r.transport_type === 'train' ? 0.4 : 0.5;
      return sum + ((r.distance_km || 0) * costPerKm);
    }, 0);

    // Operational costs per transport type
    const costsByType = vehicles.reduce((acc, v) => {
      const type = v.type;
      if (!acc[type]) {
        acc[type] = { vehicles: 0, fuel_cost: 0, maintenance_cost: 0, estimated_daily_cost: 0 };
      }
      acc[type].vehicles++;
      
      const fuelUsed = 100 - (v.fuel_level || 100);
      const tankSize = type === 'truck' ? 400 : type === 'ship' ? 5000 : type === 'aircraft' ? 20000 : 100;
      acc[type].fuel_cost += ((fuelUsed / 100) * tankSize * fuelCostPerLiter);
      
      const dailyCost = type === 'truck' ? 150 : type === 'ship' ? 2000 : type === 'aircraft' ? 10000 : type === 'train' ? 500 : 80;
      acc[type].estimated_daily_cost += dailyCost;
      
      return acc;
    }, {});

    // Add maintenance costs per vehicle type
    maintenance.forEach(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      if (vehicle && costsByType[vehicle.type]) {
        costsByType[vehicle.type].maintenance_cost += m.cost_estimate || 0;
      }
    });

    // Carbon costs (if applying carbon tax)
    const carbonTaxPerTon = 80; // EUR per ton CO2
    const totalCO2Tons = (vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0) + 
                          routes.reduce((sum, r) => sum + (r.co2_estimate || 0), 0)) / 1000;
    const carbonCosts = totalCO2Tons * carbonTaxPerTon;

    const analysis = {
      currency,
      total_costs: {
        fuel: fuelCosts.toFixed(2),
        maintenance: maintenanceCosts.toFixed(2),
        routes: routeCosts.toFixed(2),
        carbon_tax: carbonCosts.toFixed(2),
        total: (fuelCosts + maintenanceCosts + routeCosts + carbonCosts).toFixed(2)
      },
      costs_by_transport_type: costsByType,
      maintenance_breakdown: {
        scheduled: maintenance.filter(m => m.type === 'scheduled').length,
        predictive: maintenance.filter(m => m.type === 'predictive').length,
        emergency: maintenance.filter(m => m.type === 'emergency').length,
        total_estimated: maintenanceCosts.toFixed(2)
      },
      cost_per_shipment: (routeCosts / shipments.length).toFixed(2),
      cost_per_km: (routeCosts / routes.reduce((sum, r) => sum + (r.distance_km || 0), 0)).toFixed(3),
      potential_savings: {
        ai_optimization: (routeCosts * 0.15).toFixed(2), // 15% potential savings
        predictive_maintenance: (maintenanceCosts * 0.2).toFixed(2), // 20% savings
        fuel_efficiency: (fuelCosts * 0.1).toFixed(2) // 10% savings
      }
    };

    return Response.json({
      success: true,
      analysis
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});