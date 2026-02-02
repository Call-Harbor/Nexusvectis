import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { vehicle_id, shipment_id } = await req.json();

        // Get vehicle or shipment data
        let vehicle, shipment;
        if (vehicle_id) {
            vehicle = await base44.entities.Vehicle.get(vehicle_id);
        }
        if (shipment_id) {
            shipment = await base44.entities.Shipment.get(shipment_id);
        }

        // Get historical routes for this type of transport
        const routes = await base44.entities.Route.filter({
            organization_id: user.organization_id,
            status: 'completed'
        });

        // Build context for AI prediction
        const context = {
            current_location: vehicle ? {
                lat: vehicle.latitude,
                lng: vehicle.longitude,
                speed: vehicle.speed,
                heading: vehicle.heading
            } : null,
            destination: vehicle?.destination || shipment?.destination,
            transport_type: vehicle?.type || 'truck',
            weather_conditions: 'current', // Could integrate real weather API
            historical_routes: routes.slice(0, 10).map(r => ({
                distance: r.distance_km,
                duration: r.estimated_duration_hours,
                transport_type: r.transport_type
            })),
            current_traffic: 'moderate', // Could integrate traffic API
            shipment_priority: shipment?.priority || 'normal'
        };

        // Use AI to predict ETA
        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an advanced logistics AI system. Predict the accurate ETA for this delivery based on:
            
Current Location: ${context.current_location ? `${context.current_location.lat}, ${context.current_location.lng}` : 'Starting point'}
Destination: ${context.destination}
Transport Type: ${context.transport_type}
Current Speed: ${context.current_location?.speed || 0} km/h
Traffic Conditions: ${context.current_traffic}
Historical Data: ${context.historical_routes.length} similar routes completed

Analyze the data and provide:
1. Estimated arrival time (hours from now)
2. Confidence level (0-100%)
3. Potential delays or risks
4. Recommended actions for optimization

Be precise and data-driven in your predictions.`,
            response_json_schema: {
                type: "object",
                properties: {
                    eta_hours: { type: "number" },
                    eta_timestamp: { type: "string" },
                    confidence: { type: "number" },
                    risk_factors: { 
                        type: "array",
                        items: { type: "string" }
                    },
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    },
                    delay_probability: { type: "number" }
                }
            }
        });

        // Update vehicle or shipment with new ETA
        if (vehicle_id && aiResponse.eta_timestamp) {
            await base44.entities.Vehicle.update(vehicle_id, {
                eta: aiResponse.eta_timestamp,
                efficiency_score: Math.round(aiResponse.confidence)
            });
        }

        if (shipment_id && aiResponse.eta_timestamp) {
            await base44.entities.Shipment.update(shipment_id, {
                eta: aiResponse.eta_timestamp,
                eta_confidence: aiResponse.confidence
            });
        }

        return Response.json({
            success: true,
            prediction: aiResponse,
            context: context
        });

    } catch (error) {
        console.error('ETA Prediction Error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});