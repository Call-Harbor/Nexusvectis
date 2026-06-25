import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

// OBD-II PID mappings
const OBD_PIDS = {
  '010C': 'speed',           // Engine RPM
  '010D': 'speed',           // Vehicle speed
  '010F': 'engine_temp',     // Engine coolant temp
  '012F': 'fuel_level',      // Fuel tank level
  '0142': 'engine_load',     // Engine load
};

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

    try {
        const base44 = createClientFromRequest(req);
        
        // Parse OBD-II data
        const obdData = await req.json();
        
        // Expected format:
        // {
        //   "vin": "WVWZZZ3CZ9E...",
        //   "device_id": "obd_001",
        //   "timestamp": "2026-02-01T10:30:00Z",
        //   "data": {
        //     "010D": "85",        // Speed: 85 km/h
        //     "012F": "75",        // Fuel: 75%
        //     "010F": "95"         // Temp: 95°C
        //   },
        //   "gps": {
        //     "latitude": 55.6761,
        //     "longitude": 12.5683,
        //     "heading": 180
        //   }
        // }
        
        const { vin, device_id, data, gps, latitude, longitude, heading } = obdData;
        
        if (!vin && !device_id) {
            return nvError(requestId, String('Missing VIN or device_id'), 400);

        }
        
        // Find vehicle by VIN or device ID
        let vehicles = [];
        if (vin) {
            vehicles = await base44.asServiceRole.entities.Vehicle.filter({ 
                name: vin 
            });
        } else if (device_id) {
            vehicles = await base44.asServiceRole.entities.Vehicle.filter({ 
                name: device_id 
            });
        }
        
        if (vehicles.length === 0) {
            return nvJson(requestId, { 
                error: `Vehicle not found: ${vin || device_id}` 
            }, 404);

        }
        
        const vehicle = vehicles[0];
        
        // Parse OBD-II data
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        
        // Process OBD-II PIDs
        if (data) {
            Object.entries(data).forEach(([pid, value]) => {
                const numValue = parseInt(value, 16) || 0;
                
                if (pid === '010D') {
                    updateData.speed = Math.round(numValue / 2.56); // km/h
                } else if (pid === '012F') {
                    updateData.fuel_level = Math.round((numValue / 255) * 100); // %
                } else if (pid === '010F') {
                    updateData.engine_temperature = numValue - 40; // °C
                } else if (pid === '0142') {
                    updateData.engine_load = Math.round((numValue / 255) * 100); // %
                } else if (pid === '010C') {
                    updateData.rpm = Math.round(numValue / 4);
                }
            });
        }
        
        // Add GPS data if available
        if (gps) {
            updateData.latitude = gps.latitude;
            updateData.longitude = gps.longitude;
            updateData.heading = gps.heading;
        } else if (latitude !== undefined && longitude !== undefined) {
            updateData.latitude = latitude;
            updateData.longitude = longitude;
            if (heading !== undefined) {
                updateData.heading = heading;
            }
        }
        
        // Update vehicle
        await base44.asServiceRole.entities.Vehicle.update(vehicle.id, updateData);
        
        return nvJson(requestId, { 
            success: true,
            message: `Vehicle ${vin || device_id} updated from OBD-II`,
            vehicle_id: vehicle.id,
            data_received: Object.keys(data || {}).length,
        });

        
    } catch (error) {
        console.error('OBD-II Webhook Error:', error);
        return nvError(requestId, String(error.message), 500);

    }
});