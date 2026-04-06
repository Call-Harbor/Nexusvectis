import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { command, organization_id, conversation_history = [], file_urls } = body;

    if (!command) return Response.json({ error: 'Missing command' }, { status: 400 });

    const orgId = organization_id;

    // Fetch ALL entity data for full context
    const [vehicles, routes, shipments, alerts, resources, maintenance, exceptions, customers, drivers] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Route.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Alert.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Resource.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Exception.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Customer.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Driver.filter({ organization_id: orgId }).catch(() => []),
    ]);

    const fullContext = {
      vehicles: vehicles.slice(0, 15).map(v => ({
        id: v.id, name: v.name, type: v.type, status: v.status,
        fuel_level: v.fuel_level, destination: v.destination, driver: v.driver,
        latitude: v.latitude, longitude: v.longitude, speed: v.speed,
        cargo_used: v.cargo_used, cargo_capacity: v.cargo_capacity,
        efficiency_score: v.efficiency_score, co2_emissions: v.co2_emissions,
        next_maintenance: v.next_maintenance
      })),
      routes: routes.slice(0, 10).map(r => ({
        id: r.id, name: r.name, origin: r.origin, destination: r.destination,
        status: r.status, transport_type: r.transport_type, priority: r.priority,
        distance_km: r.distance_km, estimated_duration_hours: r.estimated_duration_hours,
        ai_optimized: r.ai_optimized, co2_estimate: r.co2_estimate
      })),
      shipments: shipments.slice(0, 10).map(s => ({
        id: s.id, tracking_number: s.tracking_number, origin: s.origin,
        destination: s.destination, status: s.status, cargo_type: s.cargo_type,
        weight_kg: s.weight_kg, priority: s.priority, eta: s.eta,
        customer_name: s.customer_name, current_temperature: s.current_temperature
      })),
      alerts: alerts.filter(a => !a.is_resolved).slice(0, 10).map(a => ({
        id: a.id, title: a.title, message: a.message, type: a.type,
        category: a.category, vehicle_id: a.vehicle_id, ai_recommendation: a.ai_recommendation
      })),
      resources: resources.slice(0, 8).map(r => ({
        id: r.id, name: r.name, type: r.type, location: r.location,
        status: r.status, capacity: r.capacity, current_level: r.current_level
      })),
      maintenance: maintenance.filter(m => m.status !== 'completed').slice(0, 8).map(m => ({
        id: m.id, vehicle_id: m.vehicle_id, type: m.type, priority: m.priority,
        component: m.component, description: m.description, status: m.status,
        scheduled_date: m.scheduled_date, cost_estimate: m.cost_estimate,
        ai_confidence: m.ai_confidence
      })),
      exceptions: exceptions.filter(e => e.status !== 'resolved').slice(0, 8).map(e => ({
        id: e.id, title: e.title, type: e.type, severity: e.severity,
        status: e.status, ai_recommendation: e.ai_recommendation,
        impact_score: e.impact_score, estimated_delay_minutes: e.estimated_delay_minutes
      })),
      customers: customers.slice(0, 8).map(c => ({
        id: c.id, name: c.name, email: c.email, company: c.company, status: c.status
      })),
      drivers: drivers.slice(0, 8).map(d => ({
        id: d.id, first_name: d.first_name, last_name: d.last_name,
        status: d.status, performance_rating: d.performance_rating,
        current_vehicle_id: d.current_vehicle_id
      })),
      summary: {
        total_vehicles: vehicles.length, active_vehicles: vehicles.filter(v => v.status === 'active').length,
        total_routes: routes.length, active_routes: routes.filter(r => r.status === 'active').length,
        total_shipments: shipments.length, delayed_shipments: shipments.filter(s => s.status === 'delayed').length,
        critical_alerts: alerts.filter(a => a.type === 'critical' && !a.is_resolved).length,
        pending_maintenance: maintenance.filter(m => m.status === 'pending').length,
        open_exceptions: exceptions.filter(e => e.status !== 'resolved').length,
      }
    };

    const history = conversation_history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map(m => `${m.role === 'user' ? 'User' : 'H.A.R.B.O.R'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are H.A.R.B.O.R Intellect — the neural core of NexusVectis, a world-class AI logistics platform. You have FULL real-time access to ALL of the organization's data including vehicles, routes, shipments, alerts, maintenance, exceptions, customers and drivers. Be concise, expert and direct. Use bullet points for lists. Answer in the same language as the user.

COMPLETE LIVE FLEET DATA:
${JSON.stringify(fullContext, null, 2)}
${history ? `\nConversation history:\n${history}` : ''}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser: ${command}`,
      model: 'claude_sonnet_4_6',
      ...(file_urls?.length > 0 && { file_urls })
    });

    const responseText = typeof result === 'string' ? result : result?.response || result?.text || JSON.stringify(result);

    // Track usage
    base44.asServiceRole.entities.FleetAIUsage.create({
      organization_id: orgId,
      user_email: user.email,
      command,
      action: 'HARBOR_INTELLECT_FULL',
      success: true,
    }).catch(() => {});

    return Response.json({ response: responseText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});