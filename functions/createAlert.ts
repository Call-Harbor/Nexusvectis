import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertData = await req.json();

    if (!alertData.title || !alertData.message) {
      return Response.json({ 
        error: 'title and message required' 
      }, { status: 400 });
    }

    // Set organization_id
    alertData.organization_id = user.organization_id || user.data?.organization_id;

    // Set defaults
    alertData.type = alertData.type || 'info';
    alertData.category = alertData.category || 'system';
    alertData.is_read = false;
    alertData.is_resolved = false;

    const alert = await base44.asServiceRole.entities.Alert.create(alertData);

    return Response.json({
      success: true,
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        category: alert.category,
        created_date: alert.created_date
      }
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});