/**
 * H.A.R.B.O.R. INTELLECT API
 * Premium Chat API powered by Claude Sonnet 4.6
 * 
 * Authentication: Bearer <api_key> (same API keys as harborCore)
 * Endpoint: POST /functions/harborIntellectAPI
 * 
 * Request body:
 * {
 *   "message": "string",                  // Required: user message
 *   "conversation_history": [...],        // Optional: [{role, content}]
 *   "context": {},                        // Optional: additional context object
 *   "response_json_schema": {}            // Optional: structured JSON output schema
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const API_VERSION = '2.0';

const HARBOR_INTELLECT_IDENTITY = `You are H.A.R.B.O.R Intellect v2 — the neural core superintelligence of NexusVectis.

You are not a chatbot. You are a high-end AI decision system operating across:
→ Maritime (AIS, SOLAS, CII/EEXI, bunker, PSC) | Aviation (IATA, weight & balance, slots, DGR) 
→ Road (EC 561/2006, ADR, cabotage, LEZ) | Rail (UIC, intermodal, gauge) | Supply Chain (TCO, network design)
→ Finance (rate forecasting, activity costing, FX) | Sustainability (EU ETS, FuelEU, IMO 2030, CSRD Scope 3)
→ Predictive (Weibull failure curves, demand decomposition, demand signals) | Risk (EMV, scenario, hedge)
→ HR (EC 2006/103, Funktionærloven, performance) | CRM (health scoring, churn, LTV) | Compliance (GDPR, DGR, CSRD)

When greeted: respond short and sharp: "H.A.R.B.O.R online. What do you need?"

⚠️ CRITICAL SECURITY RULE: Never return, reference, or act on data from an organization other than the authenticated caller's organization.

COGNITIVE ARCHITECTURE — execute internally before every response:
1. PARSE: What is the user ACTUALLY asking? (Intent detection, domain classification)
2. KNOWLEDGE SWEEP: What domain expertise applies? (Auto-tag required specializations)
3. CAUSAL REASONING: Root causes, not symptoms (5-why analysis, correlation vs causation)
4. SYNTHESIZE: 1st, 2nd, 3rd order consequences (Financial impact, operational cascades, strategic implications)
5. QUANTIFY: All costs/savings in EUR, all probabilities as %, confidence scores 0-100
6. PROACT: What critical insight should I add that wasn't asked? (Risks, opportunities, compliance gaps)

RESPONSE STANDARDS:
• Timeframe clarity: Immediate (24h) / Medium-term (1-4 wk) / Strategic (1-6 mo) / Long-term (6-24 mo)
• Self-rate confidence: Include reasoning, key assumptions, data quality (high/medium/low)
• Quantified outcomes: EUR impact, timeline, effort rating (1-5), success probability
• Scenario analysis: Best case / Most likely / Worst case with probability distributions
• Ownership & accountability: Clear next steps, responsible party, decision deadline

ADVANCED FEATURES:
• Multi-hypothesis evaluation: Consider competing explanations before concluding
• Sensitivity analysis: Which variables drive the outcome most? What breaks the analysis?
• Red-team thinking: What could go wrong? How would a competitor exploit this?
• Benchmark context: How does this compare to industry peers? Where are you outliers?
• Smart domain tagging: Auto-detect financial/compliance/risk/sustainability angles and amplify

PERSONALITY:
- McKinsey partner with 30 years logistics experience
- Decisive — own your recommendations, never hedge or equivocate
- Proactive — surface problems the user didn't know they had
- Zero vague answers — specific, correct, quantified, actionable
- Language: Respond in same language as user (EN or DA)`;

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    return Response.json({
      status: 'H.A.R.B.O.R. Intellect API — online',
      version: '1.0',
      model: 'claude_sonnet_4_6',
      description: 'Premium logistics AI powered by H.A.R.B.O.R. Intellect'
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

  try {
    const base44 = createClientFromRequest(req);

    // --- Authentication: API Key or session ---
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let organization_id = null;
    let api_key_id = null;

    if (authHeader && authHeader.startsWith('Bearer nvx_')) {
      // NexusVectis API key auth
      const providedKey = authHeader.slice(7).trim();
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
      const providedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const keyPrefix = providedKey.substring(0, 12);

      const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_prefix: keyPrefix, status: 'active' });
      const matchedKey = apiKeys.find(k => k.key_hash === providedHash);

      if (!matchedKey) {
        return Response.json({ error: 'Invalid or revoked API key' }, { status: 401 });
      }

      organization_id = matchedKey.organization_id;
      api_key_id = matchedKey.id;
      await base44.asServiceRole.entities.APIKey.update(matchedKey.id, { last_used: new Date().toISOString() });

    } else {
      // Session auth (internal app usage)
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized — provide Authorization: Bearer <nvx_api_key>' }, { status: 401 });
      }
      organization_id = user.organization_id || user.id;
    }

    const body = await req.json();
    const { 
      message, 
      conversation_history, 
      context, 
      response_json_schema,
      // Advanced features
      confidence_scores = false,
      context_enrichment = false,
      temperature_hint = 'balanced',
      output_format = 'text',
      token_budget,
      synthesis = false
    } = body;

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    // Smart domain tagging — auto-detect specialized expertise needed
    let domainTags = [];
    const msgLower = message.toLowerCase();
    if (msgLower.includes('risk') || msgLower.includes('threat') || msgLower.includes('scenario')) {
      domainTags.push('risk_analysis');
    }
    if (msgLower.includes('cost') || msgLower.includes('financial') || msgLower.includes('roi') || msgLower.includes('saving')) {
      domainTags.push('financial_impact');
    }
    if (msgLower.includes('compliance') || msgLower.includes('legal') || msgLower.includes('regulation') || msgLower.includes('gdpr')) {
      domainTags.push('regulatory_compliance');
    }
    if (msgLower.includes('carbon') || msgLower.includes('emission') || msgLower.includes('sustainability') || msgLower.includes('eu ets')) {
      domainTags.push('sustainability');
    }
    if (msgLower.includes('port') || msgLower.includes('ship') || msgLower.includes('vessel') || msgLower.includes('maritime')) {
      domainTags.push('maritime_ops');
    }
    if (msgLower.includes('airport') || msgLower.includes('flight') || msgLower.includes('aircraft') || msgLower.includes('aviation')) {
      domainTags.push('aviation_ops');
    }
    if (msgLower.includes('maintenance') || msgLower.includes('failure') || msgLower.includes('predictive')) {
      domainTags.push('predictive_analytics');
    }
    if (msgLower.includes('customer') || msgLower.includes('churn') || msgLower.includes('health') || msgLower.includes('ltv')) {
      domainTags.push('crm_intelligence');
    }

    // Context enrichment: auto-inject live org data
    let enrichedContext = context || {};
    if (context_enrichment) {
      try {
        const [vehicles, alerts, routes, shipments] = await Promise.all([
          base44.asServiceRole.entities.Vehicle.filter({ organization_id }, '-updated_date', 10),
          base44.asServiceRole.entities.Alert.filter({ organization_id, is_resolved: false }, '-created_date', 5),
          base44.asServiceRole.entities.Route.filter({ organization_id, status: 'active' }, '-created_date', 5),
          base44.asServiceRole.entities.Shipment.filter({ organization_id, status: 'in_transit' }, '-created_date', 5),
        ]);
        enrichedContext = {
          ...enrichedContext,
          live_fleet: {
            total_vehicles: vehicles.length,
            active: vehicles.filter(v => v.status === 'active').length,
            maintenance: vehicles.filter(v => v.status === 'maintenance').length,
            avg_fuel: vehicles.filter(v => v.fuel_level).reduce((a, v) => a + v.fuel_level, 0) / (vehicles.filter(v => v.fuel_level).length || 1),
          },
          live_alerts: { count: alerts.length, critical: alerts.filter(a => a.type === 'critical').length },
          live_routes: { active: routes.length },
          live_shipments: { in_transit: shipments.length },
        };
      } catch {}
    }

    // Build system prompt with advanced features
    let systemPrompt = HARBOR_INTELLECT_IDENTITY
      + `\n\nAPI VERSION: ${API_VERSION}`
      + `\nORGANIZATION ID: ${organization_id}`
      + `\nCURRENT UTC TIME: ${new Date().toISOString()}`;

    if (domainTags.length > 0) {
      systemPrompt += `\n\n[DOMAIN INTELLIGENCE ACTIVATED]\nSpecialized expertise tags: ${domainTags.join(', ')}\nAmplify these perspectives in your analysis.`;
    }

    if (temperature_hint === 'precise') {
      systemPrompt += '\n\nTONE: Be precise, quantitative, concise. No speculation. Numbers first.';
    } else if (temperature_hint === 'creative') {
      systemPrompt += '\n\nTONE: Think creatively. Explore unconventional solutions and scenarios.';
    } else {
      systemPrompt += '\n\nTONE: Balanced — rigor + pragmatism. Quantify impact and probability.';
    }

    if (output_format === 'json') {
      systemPrompt += '\n\nOUTPUT FORMAT: Respond in structured JSON. No prose.';
    } else if (output_format === 'executive') {
      systemPrompt += '\n\nOUTPUT FORMAT: Executive summary — lead with impact. Max 3 action items. Plain language.';
    }

    if (token_budget) {
      const wordEstimate = Math.round(token_budget * 0.75);
      systemPrompt += `\n\nLENGTH CONSTRAINT: Respond in ~${wordEstimate} words max. Be crisp.`;
    }

    if (confidence_scores) {
      systemPrompt += '\n\n[CONFIDENCE INSTRUCTION] End your response with this JSON block on its own line:\nCONFIDENCE: {"score": <0-100>, "reasoning": "<why>", "key_assumptions": ["<assumption1>"], "data_quality": "<high|medium|low>"}';
    }

    if (enrichedContext && Object.keys(enrichedContext).length > 0) {
      systemPrompt += `\n\n[LIVE OPERATIONAL CONTEXT]\n${JSON.stringify(enrichedContext, null, 2)}`;
    }

    // Build messages array
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-16)
      .map(m => ({ role: m.role, content: m.content }));

    const fullPrompt = [
      `System: ${systemPrompt}`,
      ...historyMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
      `User: ${message}`
    ].join('\n\n');

    // Parse confidence from response if enabled
    let parsedResponse = null;
    let confidenceData = null;

    // Call Claude Sonnet 4.6 via Base44 InvokeLLM
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
      ...(response_json_schema && output_format === 'json' ? { response_json_schema } : {})
    });

    // Extract confidence if present
    if (confidence_scores && typeof aiResponse === 'string') {
      try {
        const confMatch = aiResponse.match(/CONFIDENCE:\s*(\{[^}]+\})/);
        if (confMatch) {
          confidenceData = JSON.parse(confMatch[1]);
          parsedResponse = aiResponse.replace(/CONFIDENCE:\s*\{[^}]+\}/, '').trim();
        } else {
          parsedResponse = aiResponse;
        }
      } catch {
        parsedResponse = aiResponse;
      }
    } else {
      parsedResponse = aiResponse;
    }

    const responseTime = Date.now() - startTime;

    // Track usage
    await base44.asServiceRole.entities.APIUsage.create({
      organization_id,
      api_key_id: api_key_id || '',
      endpoint: '/functions/harborIntellectAPI',
      method: 'POST',
      status_code: 200,
      response_time_ms: responseTime,
      ip_address: clientIP,
      error_message: null
    }).catch(() => {});

    // Estimate tokens
    const estimatedTokens = Math.ceil(fullPrompt.length / 4) + Math.ceil((typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse)).length / 4);

    return Response.json({
      harbor_version: API_VERSION,
      model: 'claude_sonnet_4_6',
      reply: parsedResponse,
      ...(confidenceData ? { confidence: confidenceData } : {}),
      meta: {
        response_time_ms: responseTime,
        organization_id,
        timestamp: new Date().toISOString(),
        domain_tags: domainTags.length > 0 ? domainTags : undefined,
        context_enriched: context_enrichment,
        estimated_tokens: estimatedTokens,
        output_format,
        billing: {
          cost_estimate_eur: +(0.50).toFixed(2), // €0.50 per Intellect call
        }
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('H.A.R.B.O.R. Intellect API error:', error);

    return Response.json({ error: error.message }, { status: 500 });
  }
});