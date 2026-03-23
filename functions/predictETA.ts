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

        // Route through HARBOR Core
        const harborResp = await base44.functions.invoke('harborCore', {
          prompt: `Predict accurate ETA for this delivery:
Current Location: ${context.current_location ? `${context.current_location.lat}, ${context.current_location.lng}` : 'Starting point'}
Destination: ${context.destination}
Transport Type: ${context.transport_type}
Current Speed: ${context.current_location?.speed || 0} km/h
Traffic: ${context.current_traffic}
Historical routes: ${context.historical_routes.length} similar completed
Priority: ${context.shipment_priority}

Return JSON with: eta_hours (number), eta_timestamp (ISO string), confidence (0-100), risk_factors (array), recommendations (array), delay_probability (number 0-100).`,
          mode: 'command',
          context,
        });

        const reply = harborResp.data?.reply;
        let aiResponse;
        if (typeof reply === 'object' && reply !== null) {
          aiResponse = reply;
        } else {
          try { aiResponse = JSON.parse(reply); } catch { aiResponse = { eta_hours: 4, eta_timestamp: new Date(Date.now() + 4 * 3600000).toISOString(), confidence: 75, risk_factors: [], recommendations: [], delay_probability: 20 }; }
        }

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