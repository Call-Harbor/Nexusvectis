import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Harbor Core Intelligence API
// Premium endpoint: €0.25 per call (vs €0.05 for standard API calls)
const HARBOR_COST_PER_CALL = 0.25;
const STANDARD_COST_PER_CALL = 0.05;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }

  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return Response.json({ error: 'Missing API key. Pass X-API-Key header.' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    // Verify API key
    const apiKeyRecords = await base44.asServiceRole.entities.APIKey.filter({ key_hash: hashKey(apiKey) });

    if (!apiKeyRecords || apiKeyRecords.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKeyData = apiKeyRecords[0];
    if (apiKeyData.status === 'revoked') {
      return Response.json({ error: 'API key has been revoked' }, { status: 403 });
    }

    const orgId = apiKeyData.organization_id;

    const body = await req.json().catch(() => ({}));
    const { command, context = {}, mode = 'analyze' } = body;

    if (!command) {
      return Response.json({ error: 'Missing required field: command' }, { status: 400 });
    }

    // Log usage with premium cost marker
    await base44.asServiceRole.entities.APIUsage.create({
      organization_id: orgId,
      api_key_id: apiKeyData.id,
      endpoint: '/api/v1/harbor/intelligence',
      method: 'POST',
      status_code: 200,
      response_time_ms: 0,
    });

    // Build fleet context from org data
    const [vehicles, routes, shipments, alerts, resources] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Route.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Alert.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Resource.filter({ organization_id: orgId }).catch(() => []),
    ]);

    const fleetSummary = {
      vehicles: { total: vehicles.length, active: vehicles.filter(v => v.status === 'active').length, types: [...new Set(vehicles.map(v => v.type))] },
      routes: { total: routes.length, active: routes.filter(r => r.status === 'active').length, ai_optimized: routes.filter(r => r.ai_optimized).length },
      shipments: { total: shipments.length, in_transit: shipments.filter(s => s.status === 'in_transit').length, delayed: shipments.filter(s => s.status === 'delayed').length },
      alerts: { total: alerts.length, critical: alerts.filter(a => a.type === 'critical' && !a.is_resolved).length, unresolved: alerts.filter(a => !a.is_resolved).length },
      resources: { total: resources.length, operational: resources.filter(r => r.status === 'operational').length },
    };

    const mistralKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralKey) {
      return Response.json({ error: 'Harbor Intelligence service not configured' }, { status: 503 });
    }

    const systemPrompt = `You are Harbor Core Intelligence — NexusVectis's most advanced AI engine for logistics and fleet operations. 
You have deep access to the organization's real-time fleet data and can perform:
- Multi-dimensional fleet analysis and anomaly detection
- Predictive maintenance with failure probability modeling
- Route optimization with cost/emissions trade-offs
- Strategic logistics recommendations
- Risk assessment and scenario planning
- Natural language fleet commands and automation

Current fleet context: ${JSON.stringify(fleetSummary)}
Additional context provided: ${JSON.stringify(context)}

Mode: ${mode}

Always respond with structured, actionable intelligence. Be specific, quantified, and strategic.`;

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!mistralResponse.ok) {
      const err = await mistralResponse.text();
      return Response.json({ error: `Harbor Intelligence error: ${err}` }, { status: 502 });
    }

    const mistralData = await mistralResponse.json();
    const reply = mistralData.choices?.[0]?.message?.content || '';
    const usage = mistralData.usage || {};

    // Track FleetAI usage for billing
    await base44.asServiceRole.entities.FleetAIUsage.create({
      organization_id: orgId,
      user_email: `api:${apiKeyData.name}`,
      command,
      action: 'HARBOR_INTELLIGENCE',
      success: true,
    }).catch(() => {});

    return Response.json({
      success: true,
      reply,
      model: 'harbor-core-intelligence-v1',
      engine: 'mistral-large-latest',
      fleet_context: fleetSummary,
      billing: {
        cost_per_call_eur: HARBOR_COST_PER_CALL,
        model_tier: 'harbor_premium',
        note: `Harbor Core Intelligence is billed at €${HARBOR_COST_PER_CALL}/call (5x standard rate) due to real-time fleet data enrichment and advanced model usage.`,
      },
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Harbor Intelligence API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function hashKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}