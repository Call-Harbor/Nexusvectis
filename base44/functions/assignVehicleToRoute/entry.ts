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

    const { vehicle_id, route_id, driver_name } = await req.json();

    if (!vehicle_id || !route_id) {
      return nvError(requestId, String('vehicle_id and route_id required'), 400);

    }

    const orgId = user.organization_id || user.data?.organization_id;

    // Get vehicle and route
    const [vehicles, routes] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ id: vehicle_id, organization_id: orgId }),
      base44.asServiceRole.entities.Route.filter({ id: route_id, organization_id: orgId })
    ]);

    if (vehicles.length === 0) {
      return nvError(requestId, String('Vehicle not found'), 404);

    }

    if (routes.length === 0) {
      return nvError(requestId, String('Route not found'), 404);

    }

    const vehicle = vehicles[0];
    const route = routes[0];

    // Check if vehicle type matches route
    if (vehicle.type !== route.transport_type) {
      return nvJson(requestId, { 
        error: `Vehicle type (${vehicle.type}) does not match route transport type (${route.transport_type})` 
      }, 400);

    }

    // Update vehicle
    const vehicleUpdate = {
      route_id: route.id,
      destination: route.destination,
      status: 'active'
    };

    if (driver_name) {
      vehicleUpdate.driver = driver_name;
    }

    // Calculate ETA based on route
    if (route.estimated_duration_hours) {
      const etaDate = new Date();
      etaDate.setHours(etaDate.getHours() + route.estimated_duration_hours);
      vehicleUpdate.eta = etaDate.toISOString();
    }

    const updatedVehicle = await base44.asServiceRole.entities.Vehicle.update(vehicle.id, vehicleUpdate);

    // Update route status
    await base44.asServiceRole.entities.Route.update(route.id, { status: 'active' });

    return nvJson(requestId, {
      success: true,
      assignment: {
        vehicle: {
          id: updatedVehicle.id,
          name: updatedVehicle.name,
          type: updatedVehicle.type,
          driver: updatedVehicle.driver
        },
        route: {
          id: route.id,
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          distance_km: route.distance_km
        },
        eta: updatedVehicle.eta
      }
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});