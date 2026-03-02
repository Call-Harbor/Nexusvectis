import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organization_id, analyze_depth = 'standard' } = body;

    // Get all vehicles
    const vehicles = await base44.entities.Vehicle.filter({ organization_id });
    
    // Get maintenance history
    const maintenanceRecords = await base44.entities.Maintenance.filter({ organization_id });
    
    // Analyze each vehicle
    const maintenanceRisks = vehicles.map(vehicle => {
      const vehicleMaintenanceHistory = maintenanceRecords.filter(m => m.vehicle_id === vehicle.id);
      
      // Calculate risk factors
      const ageInMonths = vehicle.last_maintenance ? 
        (Date.now() - new Date(vehicle.last_maintenance).getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
      
      const utilizationScore = Math.min((vehicle.total_distance_km || 0) / 100000, 1) * 100;
      const maintenanceGap = ageInMonths > 3 ? (ageInMonths - 3) * 15 : 0;
      const fuelLevelRisk = vehicle.fuel_level && vehicle.fuel_level < 20 ? 20 : 0;
      
      // Calculate failure probability
      const failureProbability = Math.min(
        (maintenanceGap + utilizationScore * 0.3 + fuelLevelRisk) / 100 * 100,
        100
      );

      // Predict components needing service
      const recommendedServices = [];
      if (ageInMonths > 1) recommendedServices.push('Oil Change');
      if (ageInMonths > 6) recommendedServices.push('Filter Replacement');
      if (ageInMonths > 12) recommendedServices.push('Transmission Service');
      if (fuelLevelRisk > 0) recommendedServices.push('Fuel System Check');
      if (vehicle.signal_strength && vehicle.signal_strength < 30) recommendedServices.push('Sensor Calibration');

      return {
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        failure_probability: Math.round(failureProbability),
        recommended_services: recommendedServices,
        last_maintenance: vehicle.last_maintenance,
        days_since_maintenance: Math.round(ageInMonths * 30),
        urgency: failureProbability > 80 ? 'critical' : failureProbability > 50 ? 'high' : 'medium',
        estimated_downtime_hours: recommendedServices.length * 2,
        cost_estimate: recommendedServices.length * 50
      };
    }).sort((a, b) => b.failure_probability - a.failure_probability);

    // Create maintenance orders for critical vehicles
    const criticalVehicles = maintenanceRisks.filter(m => m.urgency === 'critical');
    const createdOrders = [];

    for (const risk of criticalVehicles) {
      const vehicle = vehicles.find(v => v.id === risk.vehicle_id);
      if (vehicle) {
        const order = await base44.entities.Maintenance.create({
          organization_id,
          vehicle_id: risk.vehicle_id,
          type: 'predictive',
          priority: 'high',
          component: risk.recommended_services[0] || 'General Service',
          description: `Predictive maintenance: ${risk.recommended_services.join(', ')}`,
          predicted_failure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cost_estimate: risk.cost_estimate,
          downtime_hours: risk.estimated_downtime_hours,
          ai_confidence: risk.failure_probability,
          status: 'pending'
        });
        createdOrders.push(order);
      }
    }

    // Generate optimization suggestions
    const optimizedSchedule = maintenanceRisks
      .filter(m => m.urgency !== 'critical')
      .slice(0, 5)
      .map((risk, idx) => ({
        ...risk,
        suggested_schedule_date: new Date(Date.now() + (7 + idx * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batch_group: Math.floor(idx / 2) + 1
      }));

    return Response.json({
      summary: {
        total_vehicles: vehicles.length,
        critical_vehicles: criticalVehicles.length,
        maintenance_orders_created: createdOrders.length,
        potential_downtime_avoidance_hours: criticalVehicles.reduce((sum, m) => sum + m.estimated_downtime_hours, 0)
      },
      risks: maintenanceRisks,
      created_orders: createdOrders,
      optimized_schedule: optimizedSchedule,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Maintenance scheduling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});