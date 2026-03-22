import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { command, context } = body;

    if (!command || !command.type) {
      return Response.json({ error: 'Missing command type' }, { status: 400 });
    }

    const commandType = command.type;

    // Fetch live data for context
    const [vehicles, alerts, maintenance, routes, shipments] = await Promise.all([
      base44.entities.Vehicle.list(),
      base44.entities.Alert.list(),
      base44.entities.Maintenance.list(),
      base44.entities.Route.list(),
      base44.entities.Shipment.list(),
    ]);

    const prompt = `ORCHESTRATION COMMAND: ${commandType}

Live Fleet Data:
- Vehicles: ${vehicles.length} total, ${vehicles.filter(v => v.status === 'active').length} active
- Alerts: ${alerts.length} total, ${alerts.filter(a => a.type === 'critical').length} critical
- Maintenance tasks: ${maintenance.length} (${maintenance.filter(m => m.type === 'predictive').length} predictive)
- Routes: ${routes.length} total, ${routes.filter(r => r.status === 'active').length} active
- Shipments: ${shipments.length} total, ${shipments.filter(s => s.status === 'in_transit').length} in transit

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Analyze the above data and return insights for command type: ${commandType}`;

    const harborResp = await base44.functions.invoke('harborCore', {
      prompt,
      mode: 'chat',
      context: { commandType, vehicleCount: vehicles.length, alertCount: alerts.length },
    });

    const reply = harborResp.data?.reply || '';

    // Map HARBOR reply to expected structure
    const result = {
      analysis: { vehicle_health: reply, alerts: '', routes: '' },
      optimizations: { vehicle_health: reply, efficiency: '', strategic: '' },
      predictions: { vehicle_health: reply, alerts: '', routes: '' },
      insights: { vehicle_health: reply, efficiency: '', strategic: '' },
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});