/**
 * Fleet AI API — NexusVectis Public REST API v2
 * 
 * Endpoints:
 *   GET  /                    — Health check & API info
 *   POST /calculate           — Fleet calculations (route, cost, CO2, ETA, etc.)
 *   POST /optimize            — Fleet/route/inventory optimization via AI
 *   POST /predict             — Predictive analytics (ETA, demand, failure, cost)
 *   POST /analyze             — Fleet analytics (performance, costs, emissions, efficiency)
 *   GET  /usage               — API usage statistics for this org
 * 
 * Authentication: Authorization: Bearer nvx_<api_key>
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

const API_VERSION = '2.0.0';

// Secure SHA-256 API key verification (matches harborCore / harborOrchestratorAPI)
async function verifyApiKey(base44, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer nvx_')) {
    return { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer nvx_<api_key>', status: 401 };
  }
  const providedKey = authHeader.slice(7).trim();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
  const providedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyPrefix = providedKey.substring(0, 12);

  const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_prefix: keyPrefix, status: 'active' });
  const matchedKey = apiKeys.find(k => k.key_hash === providedHash);

  if (!matchedKey) return { error: 'Invalid or revoked API key', status: 401 };

  await base44.asServiceRole.entities.APIKey.update(matchedKey.id, { last_used: new Date().toISOString() }).catch(() => {});
  return { organization_id: matchedKey.organization_id, api_key_id: matchedKey.id };
}

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  if (req.method === 'OPTIONS') {
    return nvOptions(requestId);
  }

  const base44 = createClientFromRequest(req);
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const auth = await verifyApiKey(base44, authHeader);
  if (auth.error) return nvError(requestId, String(auth.error), auth.status ?? 401, 'UNAUTHORIZED');


  const { organization_id, api_key_id } = auth;

  // Log usage async
  base44.asServiceRole.entities.APIUsage.create({
    organization_id,
    api_key_id,
    endpoint: '/functions/fleetAIAPI',
    method: req.method,
    status_code: 200,
    response_time_ms: 0,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  }).catch(() => {});

  // ── GET: Health & discovery ───────────────────────────────────────────────
  if (req.method === 'GET') {
    const [vehicles, routes, shipments, alerts] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }, '-updated_date', 5).catch(() => []),
      base44.asServiceRole.entities.Route.filter({ organization_id }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id }, '-created_date', 5).catch(() => []),
      base44.asServiceRole.entities.Alert.filter({ organization_id, is_resolved: false }, '-created_date', 5).catch(() => []),
    ]);

    return nvJson(requestId, {
      status: 'operational',
      api_version: API_VERSION,
      platform: 'NexusVectis Fleet Intelligence',
      organization_id,
      fleet_snapshot: {
        vehicles: vehicles.length,
        active_vehicles: vehicles.filter(v => v.status === 'active').length,
        routes: routes.length,
        shipments_in_transit: shipments.filter(s => s.status === 'in_transit').length,
        open_alerts: alerts.length,
      },
      endpoints: {
        'POST /calculate': 'Fleet calculations — calculation_type: ROUTE_OPTIMIZATION | COST_ANALYSIS | CO2_EMISSIONS | ETA_PREDICTION | FUEL_EFFICIENCY | FLEET_PERFORMANCE | MAINTENANCE_PREDICTION | SHIPMENT_OPTIMIZATION | INVENTORY_FORECAST | PREDICTIVE_MAINTENANCE',
        'POST /optimize': 'AI-powered optimization — optimization_type: routes | fleet | inventory',
        'POST /predict': 'Predictive analytics — prediction_type: eta | demand | failure | cost',
        'POST /analyze': 'Fleet analysis — analysis_type: performance | costs | emissions | efficiency',
        'GET /usage': 'API usage statistics',
      },
      timestamp: new Date().toISOString(),
    });

  }

  if (req.method !== 'POST') {
    return nvError(requestId, String('Method not allowed. Use GET or POST.'), 405);

  }

  const body = await req.json().catch(() => ({}));
  const { endpoint, ...params } = body;

  // Route based on 'endpoint' field in body (since functions only have one URL path)
  const routeKey = endpoint || Object.keys(params)[0];

  // ── POST /calculate ───────────────────────────────────────────────────────
  if (params.calculation_type) {
    const result = await base44.asServiceRole.functions.invoke('fleetAICalculations', {
      calculation_type: params.calculation_type,
      params: params.params || params,
    }).catch(e => ({ error: e.message }));

    return nvJson(requestId, {
      success: !result.error,
      calculation_type: params.calculation_type,
      data: result.data || result,
      timestamp: new Date().toISOString(),
    });

  }

  // ── POST /optimize ────────────────────────────────────────────────────────
  if (params.optimization_type) {
    const { optimization_type, data = {} } = params;

    // Fetch live org data for AI-powered optimization
    const [vehicles, routes, shipments] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }).catch(() => []),
      base44.asServiceRole.entities.Route.filter({ organization_id }).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id, status: 'pending' }).catch(() => []),
    ]);

    const liveData = { ...data, vehicles: data.vehicles || vehicles, routes: data.routes || routes, shipments: data.shipments || shipments };

    const optimizationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a fleet optimization AI. Perform ${optimization_type} optimization for this fleet data.
      
Fleet data: ${JSON.stringify({ vehicles: liveData.vehicles.length, routes: liveData.routes.length, shipments: liveData.shipments.length })}
Parameters: ${JSON.stringify(data)}

Return structured optimization results with specific, quantified recommendations in EUR.`,
      response_json_schema: {
        type: 'object',
        properties: {
          optimization_type: { type: 'string' },
          current_state: { type: 'object', additionalProperties: true },
          optimized_state: { type: 'object', additionalProperties: true },
          savings_eur: { type: 'number' },
          savings_percent: { type: 'number' },
          recommendations: { type: 'array', items: { type: 'string' } },
          implementation_steps: { type: 'array', items: { type: 'string' } },
          payback_period_months: { type: 'number' },
          confidence_percent: { type: 'number' },
        }
      }
    }).catch(e => ({ optimization_type, error: e.message, recommendations: [] }));

    return nvJson(requestId, {
      success: true,
      optimization_type,
      data: optimizationResult,
      timestamp: new Date().toISOString(),
    });

  }

  // ── POST /predict ─────────────────────────────────────────────────────────
  if (params.prediction_type) {
    const { prediction_type, data = {} } = params;

    const [vehicles, shipments] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }, '-updated_date', 20).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id }, '-created_date', 20).catch(() => []),
    ]);

    const predictionResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a fleet predictive analytics AI. Generate a ${prediction_type} prediction.
      
Fleet context: ${vehicles.length} vehicles, ${shipments.length} shipments
Input data: ${JSON.stringify(data)}

Provide a precise, quantified prediction with confidence intervals.`,
      response_json_schema: {
        type: 'object',
        properties: {
          prediction_type: { type: 'string' },
          prediction: { type: 'object', additionalProperties: true },
          confidence_percent: { type: 'number' },
          key_factors: { type: 'array', items: { type: 'string' } },
          scenarios: { type: 'object', additionalProperties: true },
          valid_until: { type: 'string' },
        }
      }
    }).catch(e => ({ prediction_type, error: e.message }));

    return nvJson(requestId, {
      success: true,
      prediction_type,
      data: predictionResult,
      timestamp: new Date().toISOString(),
    });

  }

  // ── POST /analyze ─────────────────────────────────────────────────────────
  if (params.analysis_type) {
    const { analysis_type, data = {} } = params;

    const [vehicles, routes, shipments, alerts] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }).catch(() => []),
      base44.asServiceRole.entities.Route.filter({ organization_id }).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id }).catch(() => []),
      base44.asServiceRole.entities.Alert.filter({ organization_id, is_resolved: false }).catch(() => []),
    ]);

    const fleetData = {
      vehicles: vehicles.length,
      active_vehicles: vehicles.filter(v => v.status === 'active').length,
      avg_efficiency: vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + (v.efficiency_score || 0), 0) / vehicles.length) : 0,
      total_co2: vehicles.reduce((s, v) => s + (v.co2_emissions || 0), 0),
      routes: routes.length,
      active_routes: routes.filter(r => r.status === 'active').length,
      shipments: shipments.length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      delayed: shipments.filter(s => s.status === 'delayed').length,
      critical_alerts: alerts.filter(a => a.type === 'critical').length,
    };

    const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a fleet performance analyst. Perform a ${analysis_type} analysis.
      
Live fleet data: ${JSON.stringify(fleetData)}
Additional parameters: ${JSON.stringify(data)}

Provide quantified insights, KPIs, and actionable recommendations. All costs in EUR.`,
      response_json_schema: {
        type: 'object',
        properties: {
          analysis_type: { type: 'string' },
          kpis: { type: 'object', additionalProperties: true },
          findings: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'object', additionalProperties: true } },
          benchmarks: { type: 'object', additionalProperties: true },
          total_opportunity_eur: { type: 'number' },
          priority_actions: { type: 'array', items: { type: 'string' } },
        }
      }
    }).catch(e => ({ analysis_type, error: e.message }));

    return nvJson(requestId, {
      success: true,
      analysis_type,
      fleet_snapshot: fleetData,
      data: analysisResult,
      timestamp: new Date().toISOString(),
    });

  }

  // ── POST /usage (in body) ─────────────────────────────────────────────────
  if (params.get_usage || body.endpoint === 'usage') {
    const usageRecords = await base44.asServiceRole.entities.APIUsage.filter(
      { organization_id },
      '-created_date',
      100
    ).catch(() => []);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRecords = usageRecords.filter(r => new Date(r.created_date) >= startOfMonth);

    return nvJson(requestId, {
      organization_id,
      usage_this_month: monthlyRecords.length,
      usage_total: usageRecords.length,
      endpoint_breakdown: monthlyRecords.reduce((acc, r) => {
        acc[r.endpoint] = (acc[r.endpoint] || 0) + 1;
        return acc;
      }, {}),
      timestamp: new Date().toISOString(),
    });

  }

  return nvJson(requestId, {
    error: 'Unknown request. Specify calculation_type, optimization_type, prediction_type, or analysis_type.',
    hint: 'GET /functions/fleetAIAPI for full endpoint documentation.',
  }, 400);

});