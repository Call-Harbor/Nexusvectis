import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Platform Orchestrator - Updates all dynamic data based on real-time input
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all organizations (service role)
        const toArray = (r) => {
            if (Array.isArray(r)) return r;
            if (r && Array.isArray(r.data)) return r.data;
            if (r && Array.isArray(r.results)) return r.results;
            return [];
        };
        const [vehicles, shipments, maintenance, alerts] = await Promise.all([
            base44.asServiceRole.entities.Vehicle.list().then(toArray),
            base44.asServiceRole.entities.Shipment.list().then(toArray),
            base44.asServiceRole.entities.Maintenance.list().then(toArray),
            base44.asServiceRole.entities.Alert.list().then(toArray),
        ]);
        
        let updates = {
            vehicles_updated: 0,
            shipments_updated: 0,
            maintenance_triggered: 0,
            alerts_created: 0
        };
        
        const current_time = new Date();

        // Process each vehicle
        for (const vehicle of vehicles) {
            const updates_vehicle = {};
            
            // 1. Auto-calculate efficiency score based on fuel consumption and speed
            if (vehicle.speed && vehicle.fuel_level !== undefined) {
                const efficiencyScore = Math.max(0, Math.min(100, 
                    100 - (vehicle.speed > 100 ? 30 : 0) - 
                    (vehicle.fuel_level < 20 ? 20 : vehicle.fuel_level < 50 ? 10 : 0)
                ));
                if (efficiencyScore !== vehicle.efficiency_score) {
                    updates_vehicle.efficiency_score = efficiencyScore;
                }
            }
            
            // 2. Calculate CO2 emissions dynamically
            if (vehicle.speed && vehicle.type) {
                const co2_per_km = {
                    truck: 0.8, ship: 0.3, drone: 0.1, train: 0.2, aircraft: 2.0
                }[vehicle.type] || 0.5;
                const daily_co2 = (vehicle.speed * 8 * co2_per_km) || 0;
                if (daily_co2 !== vehicle.co2_emissions) {
                    updates_vehicle.co2_emissions = Math.round(daily_co2);
                }
            }
            
            // 3. Auto-update status based on fuel and signal
            const current_time = new Date();
            if (vehicle.status === 'active') {
                if (vehicle.fuel_level < 10) {
                    updates_vehicle.status = 'idle';
                } else if (!vehicle.signal_strength || vehicle.signal_strength < 20) {
                    updates_vehicle.status = 'offline';
                }
            }
            
            // 4. Check for low fuel and create alert
            if (vehicle.fuel_level < 20 && vehicle.fuel_level !== undefined) {
                const existing_alert = alerts.find(a => 
                    a.vehicle_id === vehicle.id && 
                    a.category === 'fuel' && 
                    !a.is_resolved
                );
                if (!existing_alert) {
                    await base44.asServiceRole.entities.Alert.create({
                        organization_id: vehicle.organization_id,
                        title: `Low Fuel: ${vehicle.name}`,
                        message: `${vehicle.name} fuel level at ${vehicle.fuel_level}%`,
                        type: vehicle.fuel_level < 10 ? 'critical' : 'warning',
                        category: 'fuel',
                        vehicle_id: vehicle.id,
                        ai_recommendation: vehicle.fuel_level < 10 ? 
                            'Immediate refueling required' : 
                            'Schedule refueling soon'
                    });
                    updates.alerts_created++;
                }
            }
            
            // 5. Check for speed violations and create alert
            const max_speeds = { truck: 90, ship: 30, drone: 50, train: 120, aircraft: 900 };
            const max_speed = max_speeds[vehicle.type] || 100;
            if (vehicle.speed > max_speed) {
                const existing_alert = alerts.find(a => 
                    a.vehicle_id === vehicle.id && 
                    a.category === 'route' && 
                    !a.is_resolved
                );
                if (!existing_alert) {
                    await base44.asServiceRole.entities.Alert.create({
                        organization_id: vehicle.organization_id,
                        title: `Overspeed: ${vehicle.name}`,
                        message: `${vehicle.name} traveling at ${vehicle.speed} km/h (limit: ${max_speed})`,
                        type: 'warning',
                        category: 'route',
                        vehicle_id: vehicle.id,
                        ai_recommendation: 'Reduce speed for safety and efficiency'
                    });
                    updates.alerts_created++;
                }
            }
            
            // 6. Trigger predictive maintenance
            if (vehicle.next_maintenance) {
                const next_maint = new Date(vehicle.next_maintenance);
                const days_to_maintenance = Math.ceil((next_maint - current_time) / (1000 * 60 * 60 * 24));
                
                if (days_to_maintenance <= 7 && days_to_maintenance > 0) {
                    const existing_maint = maintenance.find(m => 
                        m.vehicle_id === vehicle.id && 
                        m.status !== 'completed' &&
                        m.type === 'scheduled'
                    );
                    if (!existing_maint) {
                        await base44.asServiceRole.entities.Maintenance.create({
                            organization_id: vehicle.organization_id,
                            vehicle_id: vehicle.id,
                            type: 'scheduled',
                            priority: days_to_maintenance <= 2 ? 'high' : 'medium',
                            component: 'Scheduled Service',
                            description: `Scheduled maintenance for ${vehicle.name}`,
                            scheduled_date: vehicle.next_maintenance,
                            status: 'pending'
                        });
                        updates.maintenance_triggered++;
                    }
                }
            }
            
            // Update vehicle if changes
            if (Object.keys(updates_vehicle).length > 0) {
                await base44.asServiceRole.entities.Vehicle.update(vehicle.id, updates_vehicle);
                updates.vehicles_updated++;
            }
        }
        
        // Process shipments - update status based on vehicle position
        for (const shipment of shipments) {
            if (shipment.status === 'in_transit' && shipment.vehicle_id) {
                const vehicle = vehicles.find(v => v.id === shipment.vehicle_id);
                if (!vehicle) continue;
                
                const updates_shipment = {};
                
                // Calculate ETA dynamically based on distance and speed
                if (vehicle.latitude && vehicle.longitude && shipment.eta) {
                    // Simple distance calculation (mock)
                    const distance = 50; // km (in real scenario, use actual distance calculation)
                    const avg_speed = vehicle.speed || 60;
                    const hours_remaining = distance / (avg_speed || 1);
                    const new_eta = new Date(current_time.getTime() + hours_remaining * 60 * 60 * 1000);
                    
                    updates_shipment.eta = new Date(new_eta).toISOString();
                    updates_shipment.eta_confidence = Math.max(50, 100 - (Math.abs(hours_remaining - 2) * 10));
                }
                
                // Check for temperature violations in cold chain
                if (shipment.cargo_type === 'cold_chain' && shipment.current_temperature) {
                    if (shipment.current_temperature < shipment.temperature_min || 
                        shipment.current_temperature > shipment.temperature_max) {
                        const existing_alert = alerts.find(a => 
                            a.vehicle_id === shipment.vehicle_id && 
                            a.category === 'system' && 
                            !a.is_resolved
                        );
                        if (!existing_alert) {
                            await base44.asServiceRole.entities.Alert.create({
                                organization_id: shipment.organization_id,
                                title: `Temperature Alert: ${shipment.tracking_number}`,
                                message: `Cold chain violated: ${shipment.current_temperature}°C`,
                                type: 'critical',
                                category: 'system',
                                vehicle_id: shipment.vehicle_id,
                                ai_recommendation: 'Check refrigeration unit immediately'
                            });
                            updates.alerts_created++;
                        }
                    }
                }
                
                if (Object.keys(updates_shipment).length > 0) {
                    await base44.asServiceRole.entities.Shipment.update(shipment.id, updates_shipment);
                    updates.shipments_updated++;
                }
            }
        }
        
        return Response.json({ 
            success: true,
            timestamp: new Date().toISOString(),
            updates
        });
        
    } catch (error) {
        console.error('Platform Orchestrator Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});