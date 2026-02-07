import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shipment_id, tracking_number, ...updateData } = await req.json();

    if (!shipment_id && !tracking_number) {
      return Response.json({ 
        error: 'shipment_id or tracking_number required' 
      }, { status: 400 });
    }

    const orgId = user.organization_id || user.data?.organization_id;
    
    // Find shipment
    const filter = { organization_id: orgId };
    if (shipment_id) filter.id = shipment_id;
    if (tracking_number) filter.tracking_number = tracking_number;

    const shipments = await base44.asServiceRole.entities.Shipment.filter(filter);

    if (shipments.length === 0) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Update shipment
    const updated = await base44.asServiceRole.entities.Shipment.update(shipments[0].id, updateData);

    return Response.json({
      success: true,
      shipment: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});