import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { shipment_id, tracking_number, ...updateData } = await req.json();

    if (!shipment_id && !tracking_number) {
      return nvError(requestId, String('shipment_id or tracking_number required'), 400);

    }

    const orgId = user.organization_id || user.data?.organization_id;
    
    // Find shipment
    const filter = { organization_id: orgId };
    if (shipment_id) filter.id = shipment_id;
    if (tracking_number) filter.tracking_number = tracking_number;

    const shipments = await base44.asServiceRole.entities.Shipment.filter(filter);

    if (shipments.length === 0) {
      return nvError(requestId, String('Shipment not found'), 404);

    }

    // Update shipment
    const updated = await base44.asServiceRole.entities.Shipment.update(shipments[0].id, updateData);

    return nvJson(requestId, {
      success: true,
      shipment: updated
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});