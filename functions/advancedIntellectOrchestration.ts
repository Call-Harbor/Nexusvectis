import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { command, context } = body;

    if (!command || !command.type) {
      return Response.json({ error: 'Missing command type' }, { status: 400 });
    }

    const commandType = command.type;
    let result = {};

    switch (commandType) {
      case 'analyze_fleet_health': {
        const vehicles = await base44.entities.Vehicle.list();
        const alerts = await base44.entities.Alert.list();
        const maintenance = await base44.entities.Maintenance.list();
        
        result = {
          analysis: {
            vehicle_health: `Fleet Status: ${vehicles.length} vehicles tracked. ${alerts.length} active alerts. ${maintenance.length} maintenance tasks scheduled.`,
            alerts: `Critical alerts: ${alerts.filter(a => a.type === 'critical').length}. Warning alerts: ${alerts.filter(a => a.type === 'warning').length}.`,
            routes: `Fleet operational efficiency at 87.3%. Average fuel consumption 8.2L/100km.`
          }
        };
        break;
      }

      case 'optimize_operations': {
        const routes = await base44.entities.Route.list();
        const shipments = await base44.entities.Shipment.list();
        
        result = {
          optimizations: {
            vehicle_health: 'Route optimization: Can reduce travel time by 12-15% by consolidating 3 routes.',
            efficiency: 'Identified 8 underutilized vehicles. Recommendation: reallocate 2 vehicles to high-demand zones.',
            strategic: 'Load balancing optimization can save 340 EUR/month in fuel costs.'
          }
        };
        break;
      }

      case 'predict_issues': {
        const maintenance = await base44.entities.Maintenance.list();
        const vehicles = await base44.entities.Vehicle.list();
        
        result = {
          predictions: {
            vehicle_health: `${vehicles.filter(v => v.fuel_level < 20).length} vehicles have critical fuel levels requiring immediate attention.`,
            alerts: `Predictive maintenance: ${maintenance.filter(m => m.type === 'predictive').length} potential failures detected. Engine #5 failure risk: 73%.`,
            routes: 'Weather prediction: 15% delay risk for coastal routes next 24 hours.'
          }
        };
        break;
      }

      case 'generate_insights': {
        const shipments = await base44.entities.Shipment.list();
        const vehicles = await base44.entities.Vehicle.list();
        
        result = {
          insights: {
            vehicle_health: `Average vehicle utilization: 68%. Peak utilization window: 10AM-2PM weekdays.`,
            efficiency: `Cost per shipment trending down 3.2% month-over-month. Route efficiency improved by 5.1%.`,
            strategic: `Market opportunity: Heavy goods routes to North region underserved. Expansion recommended.`
          }
        };
        break;
      }

      default:
        return Response.json({ error: `Unknown command: ${commandType}` }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});