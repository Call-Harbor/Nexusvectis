import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { organization_id, period = 'month' } = await req.json();

    // Fetch all relevant data
    const [vehicles, routes, shipments, resources, alerts] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }),
      base44.asServiceRole.entities.Route.filter({ organization_id }),
      base44.asServiceRole.entities.Shipment.filter({ organization_id }),
      base44.asServiceRole.entities.Resource.filter({ organization_id }),
      base44.asServiceRole.entities.Alert.filter({ organization_id })
    ]);

    // Calculate KPIs
    const kpis = {
      // Fleet Performance
      fleet_utilization: vehicles.filter(v => v.status === 'active').length / vehicles.length * 100,
      average_fuel_level: vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicles.length,
      vehicles_in_maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      
      // Route Efficiency
      total_routes: routes.length,
      active_routes: routes.filter(r => r.status === 'active').length,
      completed_routes: routes.filter(r => r.status === 'completed').length,
      average_route_distance: routes.reduce((sum, r) => sum + (r.distance_km || 0), 0) / routes.length,
      ai_optimized_routes: routes.filter(r => r.ai_optimized).length,
      
      // Delivery Performance
      total_shipments: shipments.length,
      in_transit_shipments: shipments.filter(s => s.status === 'in_transit').length,
      delivered_shipments: shipments.filter(s => s.status === 'delivered').length,
      delayed_shipments: shipments.filter(s => s.status === 'delayed').length,
      on_time_delivery_rate: (shipments.filter(s => s.status === 'delivered').length / shipments.length * 100) || 0,
      
      // Sustainability
      total_co2_emissions: vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0),
      average_co2_per_vehicle: vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0) / vehicles.length,
      
      // Resource Management
      total_resources: resources.length,
      operational_resources: resources.filter(r => r.status === 'operational').length,
      resource_capacity_utilization: resources.reduce((sum, r) => sum + ((r.current_level || 0) / (r.capacity || 1)), 0) / resources.length * 100,
      
      // Alerts & Issues
      total_alerts: alerts.length,
      unresolved_alerts: alerts.filter(a => !a.is_resolved).length,
      critical_alerts: alerts.filter(a => a.type === 'critical').length,
      
      // Cost Metrics
      estimated_fuel_costs: vehicles.reduce((sum, v) => {
        const fuelUsed = 100 - (v.fuel_level || 100);
        return sum + (fuelUsed * 1.5); // €1.5 per liter estimate
      }, 0),
      
      // Efficiency Score
      overall_efficiency_score: vehicles.reduce((sum, v) => sum + (v.efficiency_score || 50), 0) / vehicles.length,
      
      // Time metrics
      average_eta_accuracy: shipments.filter(s => s.eta_confidence).reduce((sum, s) => sum + s.eta_confidence, 0) / shipments.filter(s => s.eta_confidence).length || 0
    };

    return nvJson(requestId, {
      success: true,
      period,
      calculated_at: new Date().toISOString(),
      kpis
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});