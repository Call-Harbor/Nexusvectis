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

    const { vehicles } = await req.json();

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return nvError(requestId, String('vehicles array required with at least one vehicle'), 400);

    }

    const orgId = user.organization_id || user.data?.organization_id;
    const results = { success: [], failed: [] };

    // Update each vehicle
    for (const vehicleUpdate of vehicles) {
      try {
        if (!vehicleUpdate.id && !vehicleUpdate.name) {
          results.failed.push({ 
            vehicle: vehicleUpdate, 
            error: 'id or name required' 
          });
          continue;
        }

        // Find vehicle
        const filter = { organization_id: orgId };
        if (vehicleUpdate.id) filter.id = vehicleUpdate.id;
        if (vehicleUpdate.name) filter.name = vehicleUpdate.name;

        const foundVehicles = await base44.asServiceRole.entities.Vehicle.filter(filter);

        if (foundVehicles.length === 0) {
          results.failed.push({ 
            vehicle: vehicleUpdate, 
            error: 'Vehicle not found' 
          });
          continue;
        }

        // Remove id/name from update data
        const { id, name, ...updateData } = vehicleUpdate;

        // Update
        const updated = await base44.asServiceRole.entities.Vehicle.update(
          foundVehicles[0].id, 
          updateData
        );

        results.success.push({
          id: updated.id,
          name: updated.name,
          updated_fields: Object.keys(updateData)
        });
      } catch (error) {
        results.failed.push({ 
          vehicle: vehicleUpdate, 
          error: error.message 
        });
      }
    }

    return nvJson(requestId, {
      success: results.failed.length === 0,
      total: vehicles.length,
      succeeded: results.success.length,
      failed: results.failed.length,
      results
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});