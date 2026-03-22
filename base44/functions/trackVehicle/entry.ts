import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicle_id, organization_id } = await req.json();

    if (!vehicle_id) {
      return Response.json({ error: 'vehicle_id required' }, { status: 400 });
    }

    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ 
      id: vehicle_id,
      organization_id: organization_id || user.organization_id || user.data?.organization_id
    });

    if (vehicles.length === 0) {
      return Response.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const vehicle = vehicles[0];

    return Response.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        status: vehicle.status,
        position: {
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          heading: vehicle.heading,
          speed: vehicle.speed,
          altitude: vehicle.altitude
        },
        fuel_level: vehicle.fuel_level,
        cargo: {
          capacity: vehicle.cargo_capacity,
          used: vehicle.cargo_used,
          utilization: ((vehicle.cargo_used || 0) / (vehicle.cargo_capacity || 1) * 100).toFixed(1)
        },
        destination: vehicle.destination,
        eta: vehicle.eta,
        driver: vehicle.driver,
        signal: {
          type: vehicle.signal_type,
          strength: vehicle.signal_strength
        },
        last_updated: vehicle.updated_date
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});