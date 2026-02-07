import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicles } = await req.json();

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return Response.json({ 
        error: 'vehicles array required with at least one vehicle' 
      }, { status: 400 });
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

    return Response.json({
      success: results.failed.length === 0,
      total: vehicles.length,
      succeeded: results.success.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});