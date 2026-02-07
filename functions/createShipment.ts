import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentData = await req.json();

    // Validate required fields
    if (!shipmentData.origin || !shipmentData.destination) {
      return Response.json({ 
        error: 'origin and destination are required' 
      }, { status: 400 });
    }

    // Generate tracking number if not provided
    if (!shipmentData.tracking_number) {
      shipmentData.tracking_number = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }

    // Set organization_id
    shipmentData.organization_id = user.organization_id || user.data?.organization_id;

    // Set defaults
    shipmentData.status = shipmentData.status || 'pending';
    shipmentData.priority = shipmentData.priority || 'normal';
    shipmentData.cargo_type = shipmentData.cargo_type || 'general';

    // Create shipment
    const shipment = await base44.asServiceRole.entities.Shipment.create(shipmentData);

    return Response.json({
      success: true,
      shipment: {
        id: shipment.id,
        tracking_number: shipment.tracking_number,
        origin: shipment.origin,
        destination: shipment.destination,
        status: shipment.status,
        created_date: shipment.created_date
      }
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});