import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, transport_type, waypoints = [] } = await req.json();

    if (!origin || !destination || !transport_type) {
      return Response.json({ 
        error: 'origin, destination, and transport_type required' 
      }, { status: 400 });
    }

    // Call the planRoute function
    const result = await base44.functions.invoke('planRoute', {
      origin,
      destination,
      transport_type
    });

    if (!result.data.success) {
      return Response.json({ 
        error: 'Route optimization failed',
        details: result.data 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      route: result.data.route_data,
      optimization_date: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});