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

    const { action, resource_type, resource_id, status, details, severity } = await req.json();

    // Validate input
    if (!action || !status) {
      return nvError(requestId, String('Missing required fields'), 400);

    }

    // Get IP address (simplified - in production use proper header parsing)
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Create audit log entry
    await base44.asServiceRole.entities.SecurityAudit.create({
      action,
      user_email: user.email,
      user_id: user.id,
      resource_type: resource_type || null,
      resource_id: resource_id || null,
      ip_address: ip,
      status,
      details: details || null,
      severity: severity || 'low'
    });

    return nvJson(requestId, { success: true });

  } catch (error) {
    console.error('Audit log error:', error);
    // Don't fail the operation if logging fails
    return nvJson(requestId, { success: false, error: error.message }, 500);

  }
});