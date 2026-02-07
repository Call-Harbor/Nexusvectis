import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tracking_number } = await req.json();

    if (!tracking_number) {
      return Response.json({ error: 'tracking_number required' }, { status: 400 });
    }

    const orgId = user.organization_id || user.data?.organization_id;
    const shipments = await base44.asServiceRole.entities.Shipment.filter({ 
      tracking_number,
      organization_id: orgId
    });

    if (shipments.length === 0) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const shipment = shipments[0];

    // Get vehicle info if assigned
    let vehicleInfo = null;
    if (shipment.vehicle_id) {
      const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ id: shipment.vehicle_id });
      if (vehicles.length > 0) {
        const v = vehicles[0];
        vehicleInfo = {
          name: v.name,
          type: v.type,
          position: { latitude: v.latitude, longitude: v.longitude },
          driver: v.driver
        };
      }
    }

    return Response.json({
      success: true,
      tracking: {
        tracking_number: shipment.tracking_number,
        status: shipment.status,
        origin: shipment.origin,
        destination: shipment.destination,
        priority: shipment.priority,
        cargo_type: shipment.cargo_type,
        weight_kg: shipment.weight_kg,
        eta: shipment.eta,
        eta_confidence: shipment.eta_confidence,
        actual_delivery: shipment.actual_delivery,
        vehicle: vehicleInfo,
        temperature: shipment.cargo_type === 'cold_chain' ? {
          current: shipment.current_temperature,
          min: shipment.temperature_min,
          max: shipment.temperature_max,
          in_range: shipment.current_temperature >= shipment.temperature_min && 
                    shipment.current_temperature <= shipment.temperature_max
        } : null,
        last_updated: shipment.updated_date
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});