import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, category, is_resolved, limit = 50 } = await req.json();

    const orgId = user.organization_id || user.data?.organization_id;
    const filter = { organization_id: orgId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (is_resolved !== undefined) filter.is_resolved = is_resolved;

    const alerts = await base44.asServiceRole.entities.Alert.filter(filter, '-created_date', limit);

    return Response.json({
      success: true,
      count: alerts.length,
      alerts: alerts.map(a => ({
        id: a.id,
        title: a.title,
        message: a.message,
        type: a.type,
        category: a.category,
        vehicle_id: a.vehicle_id,
        is_read: a.is_read,
        is_resolved: a.is_resolved,
        ai_recommendation: a.ai_recommendation,
        created_date: a.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});