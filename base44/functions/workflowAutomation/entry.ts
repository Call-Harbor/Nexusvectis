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

    const { workflow_type, data } = await req.json();

    let result = {};

    switch (workflow_type) {
      case 'email_notifications':
        // Send shipment status email
        if (data.shipment_id) {
          const shipment = await base44.entities.Shipment.get(data.shipment_id);
          await base44.integrations.Core.SendEmail({
            to: shipment.customer_email || user.email,
            subject: `Shipment Update: ${shipment.tracking_number}`,
            body: `Your shipment ${shipment.tracking_number} status: ${shipment.status}. ETA: ${shipment.eta || 'TBD'}`
          });
          result = { success: true, message: 'Email sent' };
        }
        break;

      case 'customs_processing':
        // Generate customs document
        if (data.shipment_id) {
          const shipment = await base44.entities.Shipment.get(data.shipment_id);
          const document = `CUSTOMS DECLARATION
Tracking: ${shipment.tracking_number}
Origin: ${shipment.origin}
Destination: ${shipment.destination}
Weight: ${shipment.weight_kg}kg
Cargo Type: ${shipment.cargo_type}
Generated: ${new Date().toISOString()}`;
          
          result = { success: true, document, message: 'Document generated' };
        }
        break;

      case 'inventory_alerts':
        // Check inventory levels and send alerts
        const resources = await base44.entities.Resource.filter({ organization_id: user.organization_id });
        const lowStock = resources.filter(r => r.capacity && r.current_level && (r.current_level / r.capacity) < 0.3);
        
        if (lowStock.length > 0) {
          for (const resource of lowStock) {
            await base44.entities.Alert.create({
              organization_id: user.organization_id,
              title: 'Low Inventory Alert',
              message: `${resource.name} is at ${((resource.current_level / resource.capacity) * 100).toFixed(0)}% capacity`,
              type: 'warning',
              category: 'system'
            });
          }
        }
        
        result = { success: true, alerts_created: lowStock.length, message: `${lowStock.length} alerts created` };
        break;

      case 'shipment_tracking':
        // Update shipment tracking
        if (data.shipment_id) {
          const shipment = await base44.entities.Shipment.get(data.shipment_id);
          const vehicle = shipment.vehicle_id ? await base44.entities.Vehicle.get(shipment.vehicle_id) : null;
          
          result = {
            success: true,
            tracking_info: {
              status: shipment.status,
              last_update: new Date().toISOString(),
              location: vehicle ? `${vehicle.latitude}, ${vehicle.longitude}` : 'N/A',
              eta: shipment.eta
            }
          };
        }
        break;

      default:
        return nvError(requestId, String('Unknown workflow type'), 400);

    }

    return nvJson(requestId, result);

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});