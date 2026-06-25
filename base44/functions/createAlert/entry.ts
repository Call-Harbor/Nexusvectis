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

    const alertData = await req.json();

    if (!alertData.title || !alertData.message) {
      return nvError(requestId, String('title and message required'), 400);

    }

    // Set organization_id
    alertData.organization_id = user.organization_id || user.data?.organization_id;

    // Set defaults
    alertData.type = alertData.type || 'info';
    alertData.category = alertData.category || 'system';
    alertData.is_read = false;
    alertData.is_resolved = false;

    const alert = await base44.asServiceRole.entities.Alert.create(alertData);

    return nvJson(requestId, {
      success: true,
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        category: alert.category,
        created_date: alert.created_date
      }
    }, 201);

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});