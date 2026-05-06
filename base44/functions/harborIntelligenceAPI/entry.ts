/**
 * Harbor Core Intelligence API — Premium AI endpoint
 * 
 * Authenticated via nvx_ API keys with SHA-256 verification.
 * Billing: €0.25 per call (premium rate — includes real-time fleet enrichment + mistral-large)
 * 
 * POST body:
 *   command   string   — The intelligence query/command
 *   context   object   — Optional additional context
 *   mode      string   — 'analyze' | 'command' | 'predict' | 'optimize' (default: analyze)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HARBOR_COST_PER_CALL = 0.25;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

// Secure SHA-256 API key verification
async function verifyApiKey(base44, authHeader) {
  const key = authHeader?.replace(/^Bearer\s+/i, '').replace(/^nvx_/, '');
  if (!key || (!authHeader?.includes('nvx_') && !authHeader?.startsWith('nvx_'))) {
    // Also accept X-API-Key header pattern used by some clients
    if (!authHeader || authHeader.length < 10) {
      return { error: 'Missing API key. Pass: Authorization: Bearer nvx_<key> or X-API-Key: nvx_<key>', status: 401 };
    }
  }

  const rawKey = authHeader?.startsWith('nvx_')
    ? authHeader
    : authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!rawKey || !rawKey.startsWith('nvx_')) {
    return { error: 'Invalid API key format. Key must start with nvx_', status: 401 };
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey));
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyPrefix = rawKey.substring(0, 12);

  const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_prefix: keyPrefix, status: 'active' });
  const matched = apiKeys.find(k => k.key_hash === hash);

  if (!matched) return { error: 'Invalid or revoked API key', status: 401 };

  await base44.asServiceRole.entities.APIKey.update(matched.id, { last_used: new Date().toISOString() }).catch(() => {});
  return { organization_id: matched.organization_id, api_key_id: matched.id, key_name: matched.name };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // GET: discovery
  if (req.method === 'GET') {
    return Response.json({
      endpoint: 'Harbor Core Intelligence API',
      version: '2.1.0',
      status: 'operational',
      description: 'Premium AI intelligence endpoint — real-time fleet enrichment + mistral-large-2411',
      billing: { cost_per_call_eur: HARBOR_COST_PER_CALL, model_tier: 'harbor_premium' },
      authentication: 'Authorization: Bearer nvx_<api_key>',
      body_schema: {
        command: 'string (required) — your intelligence query',
        context: 'object (optional) — additional context',
        mode: '"analyze" | "command" | "predict" | "optimize" (default: analyze)',
      },
      capabilities: [
        'Multi-dimensional fleet analysis and anomaly detection',
        'Predictive maintenance with failure probability modeling',
        'Route optimization with cost/emissions trade-offs',
        'Strategic logistics recommendations with EUR quantification',
        'Risk assessment and scenario planning',
        'Natural language fleet commands and automation',
        'Real-time data enrichment from live org fleet',
      ],
    }, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const base44 = createClientFromRequest(req);

  // Support both Authorization and X-API-Key headers
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    || req.headers.get('X-API-Key') || req.headers.get('x-api-key');

  const auth = await verifyApiKey(base44, authHeader);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });

  const { organization_id, api_key_id, key_name } = auth;
  const startTime = Date.now();

  const body = await req.json().catch(() => ({}));
  const { command, context = {}, mode = 'analyze' } = body;

  if (!command) {
    return Response.json({ error: 'Missing required field: command', hint: 'POST { "command": "Analyze my fleet performance" }' }, { status: 400, headers: CORS_HEADERS });
  }

  // Log usage
  base44.asServiceRole.entities.APIUsage.create({
    organization_id,
    api_key_id,
    endpoint: '/api/v1/harbor/intelligence',
    method: 'POST',
    status_code: 200,
    response_time_ms: 0,
  }).catch(() => {});

  // Enrich with live fleet data
  const [vehicles, routes, shipments, alerts, resources, maintenance] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id }).catch(() => []),
    base44.asServiceRole.entities.Route.filter({ organization_id }).catch(() => []),
    base44.asServiceRole.entities.Shipment.filter({ organization_id }).catch(() => []),
    base44.asServiceRole.entities.Alert.filter({ organization_id }).catch(() => []),
    base44.asServiceRole.entities.Resource.filter({ organization_id }).catch(() => []),
    base44.asServiceRole.entities.Maintenance.filter({ organization_id, status: 'pending' }).catch(() => []),
  ]);

  const fleetSummary = {
    vehicles: {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      offline: vehicles.filter(v => v.status === 'offline').length,
      types: [...new Set(vehicles.map(v => v.type))],
      avg_efficiency: vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + (v.efficiency_score || 0), 0) / vehicles.length) : 0,
      low_fuel: vehicles.filter(v => (v.fuel_level || 100) < 20).length,
      total_co2_kg: Math.round(vehicles.reduce((s, v) => s + (v.co2_emissions || 0), 0)),
    },
    routes: {
      total: routes.length,
      active: routes.filter(r => r.status === 'active').length,
      delayed: routes.filter(r => r.status === 'delayed').length,
      ai_optimized: routes.filter(r => r.ai_optimized).length,
    },
    shipments: {
      total: shipments.length,
      in_transit: shipments.filter(s => s.status === 'in_transit').length,
      delayed: shipments.filter(s => s.status === 'delayed').length,
      delivered_total: shipments.filter(s => s.status === 'delivered').length,
      pending: shipments.filter(s => s.status === 'pending').length,
    },
    alerts: {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical' && !a.is_resolved).length,
      unresolved: alerts.filter(a => !a.is_resolved).length,
    },
    resources: {
      total: resources.length,
      operational: resources.filter(r => r.status === 'operational').length,
      offline: resources.filter(r => r.status === 'offline').length,
    },
    pending_maintenance_orders: maintenance.length,
  };

  const mistralKey = Deno.env.get('MISTRAL_API_KEY');
  if (!mistralKey) {
    return Response.json({ error: 'Harbor Intelligence service not configured' }, { status: 503, headers: CORS_HEADERS });
  }

  const systemPrompt = `You are H.A.R.B.O.R. Core Intelligence — NexusVectis's premium AI engine for logistics, fleet, and supply chain operations.

You have real-time access to the organization's fleet data and must provide:
- Multi-dimensional analysis with quantified business impact
- Specific, actionable recommendations (not generic advice)
- All financial values in EUR
- Confidence levels on predictions
- Risk assessment with probability × impact framework

REAL-TIME FLEET CONTEXT:
${JSON.stringify(fleetSummary, null, 2)}

ADDITIONAL CONTEXT PROVIDED:
${JSON.stringify(context, null, 2)}

MODE: ${mode}

Always structure your response with:
1. Executive Summary (2-3 sentences with key finding)
2. Detailed Analysis
3. Quantified Recommendations (EUR impact, timeline, confidence %)
4. Risk Assessment
5. Next Actions (prioritized by impact)`;

  const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mistralKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-2411',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command },
      ],
      temperature: mode === 'predict' ? 0.2 : 0.35,
      max_tokens: 2500,
    }),
  });

  if (!mistralResponse.ok) {
    const err = await mistralResponse.text();
    console.error('Mistral error:', err);
    return Response.json({ error: 'Harbor Intelligence AI service error', details: err }, { status: 502, headers: CORS_HEADERS });
  }

  const mistralData = await mistralResponse.json();
  const reply = mistralData.choices?.[0]?.message?.content || '';
  const usage = mistralData.usage || {};
  const responseTime = Date.now() - startTime;

  // Track FleetAI usage for billing
  base44.asServiceRole.entities.FleetAIUsage.create({
    organization_id,
    user_email: `api:${key_name}`,
    command: command.substring(0, 300),
    action: 'HARBOR_INTELLIGENCE',
    success: true,
  }).catch(() => {});

  // Update usage record with response time
  base44.asServiceRole.entities.APIUsage.create({
    organization_id,
    api_key_id,
    endpoint: '/api/v1/harbor/intelligence',
    method: 'POST',
    status_code: 200,
    response_time_ms: responseTime,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  }).catch(() => {});

  return Response.json({
    success: true,
    reply,
    model: 'harbor-core-intelligence-v2.1',
    engine: 'mistral-large-2411',
    mode,
    fleet_context: fleetSummary,
    billing: {
      cost_per_call_eur: HARBOR_COST_PER_CALL,
      model_tier: 'harbor_premium',
      note: `Harbor Core Intelligence is billed at €${HARBOR_COST_PER_CALL}/call — includes real-time fleet data enrichment and mistral-large-2411.`,
    },
    usage: {
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
    },
    response_time_ms: responseTime,
    timestamp: new Date().toISOString(),
  }, { headers: CORS_HEADERS });
});