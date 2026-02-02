import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Use AI for inventory forecasting
        const forecast = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an advanced warehouse and inventory management AI. Analyze this logistics data and provide intelligent forecasts:

CURRENT WAREHOUSE STATUS:
${JSON.stringify(analysisContext.resources, null, 2)}

SHIPMENT TRENDS:
- Total: ${analysisContext.shipment_trends.total_shipments}
- Pending: ${analysisContext.shipment_trends.pending}
- In Transit: ${analysisContext.shipment_trends.in_transit}
- Delivered: ${analysisContext.shipment_trends.delivered}

FLEET CAPACITY:
- Available Cargo Space: ${analysisContext.fleet_capacity.total_cargo_capacity - analysisContext.fleet_capacity.used_cargo_capacity} tons
- Utilization: ${((analysisContext.fleet_capacity.used_cargo_capacity / analysisContext.fleet_capacity.total_cargo_capacity) * 100).toFixed(1)}%

FORECAST PERIOD: ${forecast_days} days

Provide:
1. Inventory needs forecast for each warehouse
2. Optimal stock levels to prevent over/understocking
3. Recommended picking routes optimization
4. Seasonal trends and predictions
5. Risk alerts (potential stockouts or overstocking)
6. Automation opportunities`,
            response_json_schema: {
                type: "object",
                properties: {
                    overall_forecast: { type: "string" },
                    warehouse_forecasts: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                warehouse_name: { type: "string" },
                                predicted_utilization: { type: "number" },
                                recommended_stock_level: { type: "number" },
                                risk_level: { type: "string" },
                                actions: { type: "array", items: { type: "string" } }
                            }
                        }
                    },
                    picking_optimization: {
                        type: "object",
                        properties: {
                            efficiency_score: { type: "number" },
                            recommended_routes: { type: "array", items: { type: "string" } },
                            time_savings_estimate: { type: "string" }
                        }
                    },
                    seasonal_trends: {
                        type: "array",
                        items: { type: "string" }
                    },
                    risk_alerts: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { type: "string" },
                                severity: { type: "string" },
                                description: { type: "string" },
                                recommendation: { type: "string" }
                            }
                        }
                    },
                    automation_opportunities: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

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

        return Response.json({
            success: true,
            forecast: forecast,
            analysis_context: analysisContext,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Inventory Forecast Error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});