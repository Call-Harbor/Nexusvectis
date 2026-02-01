import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse incoming GPS data
        const gpsData = await req.json();
        
        // Expected format:
        // {
        //   "vehicle_id": "abc123",
        //   "latitude": 55.6761,
        //   "longitude": 12.5683,
        //   "speed": 85,
        //   "heading": 180,
        //   "altitude": 45,
        //   "timestamp": "2026-02-01T10:30:00Z"
        // }
        
        const { vehicle_id, latitude, longitude, speed, heading, altitude, fuel_level, signal_strength } = gpsData;
        
        if (!vehicle_id || latitude === undefined || longitude === undefined) {
            return Response.json({ 
                error: 'Missing required fields: vehicle_id, latitude, longitude' 
            }, { status: 400 });
        }
        
        // Find and update the vehicle
        const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ name: vehicle_id });
        
        if (vehicles.length === 0) {
            return Response.json({ 
                error: `Vehicle not found: ${vehicle_id}` 
            }, { status: 404 });
        }
        
        const vehicle = vehicles[0];
        
        // Update vehicle position and telemetry
        const updateData = {
            latitude,
            longitude,
            ...(speed !== undefined && { speed }),
            ...(heading !== undefined && { heading }),
            ...(altitude !== undefined && { altitude }),
            ...(fuel_level !== undefined && { fuel_level }),
            ...(signal_strength !== undefined && { signal_strength }),
        };
        
        await base44.asServiceRole.entities.Vehicle.update(vehicle.id, updateData);
        
        return Response.json({ 
            success: true,
            message: `Vehicle ${vehicle_id} updated successfully`,
            vehicle_id: vehicle.id,
            position: { latitude, longitude }
        });
        
    } catch (error) {
        console.error('GPS Webhook Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});