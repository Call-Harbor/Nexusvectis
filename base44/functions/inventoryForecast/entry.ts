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

        const { resource_id, forecast_days = 30 } = await req.json();

        // Get resource data
        const resource = resource_id 
            ? await base44.entities.Resource.get(resource_id)
            : null;

        // Get all resources for organization
        const resources = await base44.entities.Resource.filter({
            organization_id: user.organization_id
        });

        // Get shipment history for trend analysis
        const shipments = await base44.entities.Shipment.filter({
            organization_id: user.organization_id
        });

        // Get vehicles for capacity planning
        const vehicles = await base44.entities.Vehicle.filter({
            organization_id: user.organization_id
        });

        // Build analysis context
        const analysisContext = {
            resources: resources.map(r => ({
                id: r.id,
                name: r.name,
                type: r.type,
                capacity: r.capacity,
                current_level: r.current_level,
                utilization_rate: r.capacity > 0 ? (r.current_level / r.capacity * 100) : 0
            })),
            shipment_trends: {
                total_shipments: shipments.length,
                pending: shipments.filter(s => s.status === 'pending').length,
                in_transit: shipments.filter(s => s.status === 'in_transit').length,
                delivered: shipments.filter(s => s.status === 'delivered').length
            },
            fleet_capacity: {
                total_vehicles: vehicles.length,
                active_vehicles: vehicles.filter(v => v.status === 'active').length,
                total_cargo_capacity: vehicles.reduce((sum, v) => sum + (v.cargo_capacity || 0), 0),
                used_cargo_capacity: vehicles.reduce((sum, v) => sum + (v.cargo_used || 0), 0)
            },
            forecast_period: forecast_days
        };

        // Route through HARBOR Core
        const harborResp = await base44.functions.invoke('harborCore', {
          prompt: `Analyze warehouse inventory and provide forecast for ${forecast_days} days:

WAREHOUSES: ${JSON.stringify(analysisContext.resources)}
SHIPMENTS: total=${analysisContext.shipment_trends.total_shipments}, pending=${analysisContext.shipment_trends.pending}, in_transit=${analysisContext.shipment_trends.in_transit}, delivered=${analysisContext.shipment_trends.delivered}
FLEET: available_cargo=${analysisContext.fleet_capacity.total_cargo_capacity - analysisContext.fleet_capacity.used_cargo_capacity} tons

Return JSON with: overall_forecast (string), warehouse_forecasts (array of {warehouse_name, predicted_utilization, recommended_stock_level, risk_level, actions}), picking_optimization ({efficiency_score, recommended_routes, time_savings_estimate}), seasonal_trends (array), risk_alerts (array of {type, severity, description, recommendation}), automation_opportunities (array).`,
          mode: 'command',
          context: analysisContext,
        });

        const reply = harborResp.data?.reply;
        let forecast;
        if (typeof reply === 'object' && reply !== null) {
          forecast = reply;
        } else {
          try { forecast = JSON.parse(reply); } catch { forecast = { overall_forecast: typeof reply === 'string' ? reply : 'Forecast generated', warehouse_forecasts: [], picking_optimization: { efficiency_score: 80, recommended_routes: [], time_savings_estimate: 'N/A' }, seasonal_trends: [], risk_alerts: [], automation_opportunities: [] }; }
        }

        // Create alerts for critical risks
        if (forecast.risk_alerts && forecast.risk_alerts.length > 0) {
            for (const alert of forecast.risk_alerts.filter(a => a.severity === 'high' || a.severity === 'critical')) {
                await base44.entities.Alert.create({
                    organization_id: user.organization_id,
                    title: `Inventory Risk: ${alert.type}`,
                    message: alert.description,
                    type: alert.severity === 'critical' ? 'critical' : 'warning',
                    category: 'system',
                    ai_recommendation: alert.recommendation
                });
            }
        }

        return nvJson(requestId, {
            success: true,
            forecast: forecast,
            analysis_context: analysisContext,
            generated_at: new Date().toISOString()
        });


    } catch (error) {
        console.error('Inventory Forecast Error:', error);
        return nvJson(requestId, { 
            error: error.message,
            success: false 
        }, 500);

    }
});