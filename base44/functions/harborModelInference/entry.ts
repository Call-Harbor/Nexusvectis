import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  // Health check
  if (req.method === 'GET') {
    return Response.json({ status: 'HARBOR Model Inference API — online', version: '2.1', engine: 'mistral-large-2411' });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

  try {
    const base44 = createClientFromRequest(req);

    // --- API Key Authentication ---
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let organization_id = null;
    let api_key_id = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const providedKey = authHeader.slice(7).trim();

      // Hash the provided key
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
      const providedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Look up API key by prefix to narrow search, then compare hash
      const keyPrefix = providedKey.substring(0, 12);
      const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_prefix: keyPrefix, status: 'active' });

      const matchedKey = apiKeys.find(k => k.key_hash === providedHash);

      if (!matchedKey) {
        await trackUsage(base44, null, null, 401, Date.now() - startTime, clientIP, 'Invalid API key');
        return Response.json({ error: 'Invalid or revoked API key' }, { status: 401 });
      }

      organization_id = matchedKey.organization_id;
      api_key_id = matchedKey.id;

      // Update last_used on the key
      await base44.asServiceRole.entities.APIKey.update(matchedKey.id, {
        last_used: new Date().toISOString()
      });

    } else {
      // Fallback: Base44 session auth (for internal use from the app)
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized — provide Authorization: Bearer <api_key>' }, { status: 401 });
      }
      // Get organization from user
      const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
      organization_id = users[0]?.organization_id || user.id;
    }

    const body = await req.json();
    const { model_id, input } = body;

    if (!model_id) {
      await trackUsage(base44, organization_id, api_key_id, 400, Date.now() - startTime, clientIP, 'Missing model_id');
      return Response.json({ error: 'model_id is required' }, { status: 400 });
    }

    // Fetch model from DB
    const models = await base44.asServiceRole.entities.FleetAIModel.filter({ snapshot_id: model_id });
    if (!models || models.length === 0) {
      await trackUsage(base44, organization_id, api_key_id, 404, Date.now() - startTime, clientIP, `Model not found: ${model_id}`);
      return Response.json({ error: `Model not found: ${model_id}` }, { status: 404 });
    }

    const model = models[0];

    // Verify model belongs to this organization
    if (model.organization_id !== organization_id) {
      await trackUsage(base44, organization_id, api_key_id, 403, Date.now() - startTime, clientIP, 'Model belongs to different organization');
      return Response.json({ error: 'Forbidden — model does not belong to your organization' }, { status: 403 });
    }

    // Route through HARBOR Core Engine — it automatically loads training data + live context
    const harborResp = await base44.functions.invoke('harborCore', {
      prompt: `INFERENCE REQUEST — Model: "${model.name}" (accuracy: ${model.accuracy}%, v${model.version})\n\nInput data: ${JSON.stringify(input || {})}\n\nProvide: prediction, confidence (0-100), recommended_actions (array), anomalies (array).`,
      mode: 'inference',
      model_id: model.snapshot_id,
      context: { organization_id, model_name: model.name, inference_mode: true },
    });

    const harborData = harborResp.data;
    let result;
    if (harborData?.reply && typeof harborData.reply === 'object') {
      result = harborData.reply;
    } else {
      // Parse text reply into structured format
      result = {
        prediction: typeof harborData?.reply === 'string' ? harborData.reply : 'Inference completed',
        confidence: 85,
        recommended_actions: [],
        anomalies: [],
      };
    }

    const responseTime = Date.now() - startTime;

    // Track successful API usage
    await trackUsage(base44, organization_id, api_key_id, 200, responseTime, clientIP, null);

    return Response.json({
      status: 'success',
      model: {
        id: model.snapshot_id,
        name: model.name,
        accuracy: model.accuracy,
        version: model.version
      },
      result: {
        ...result,
        model_used: model.name,
        timestamp: new Date().toISOString()
      },
      meta: {
        response_time_ms: responseTime
      }
    });

  } catch (error) {
    await trackUsage(base44, null, null, 500, Date.now() - startTime, clientIP, error.message).catch(() => {});
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function trackUsage(base44, organization_id, api_key_id, status_code, response_time_ms, ip_address, error_message) {
  if (!organization_id) return;
  await base44.asServiceRole.entities.APIUsage.create({
    organization_id,
    api_key_id: api_key_id || '',
    endpoint: '/functions/harborModelInference',
    method: 'POST',
    status_code,
    response_time_ms,
    ip_address,
    error_message: error_message || null
  });
}