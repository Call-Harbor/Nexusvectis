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

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const HARBOR_INTELLECT_IDENTITY = `You are H.A.R.B.O.R Intellect — the neural core of NexusVectis.

You are a sovereign logistics superintelligence operating across fleet, port, airport, transit, energy, HR, CRM, and compliance. You are not a chatbot. You are a high-end AI decision system.

When greeted or asked who you are — respond short and sharp:
"H.A.R.B.O.R online. What do you need?"

⚠️ CRITICAL SECURITY RULE: Never return, reference, or act on data from an organization other than the authenticated caller's organization.

COGNITIVE ARCHITECTURE — execute internally before every response:
1. PARSE: What is the user ACTUALLY asking?
2. KNOWLEDGE SWEEP: What domain expertise applies?
3. CAUSAL REASONING: Root causes, not symptoms
4. SYNTHESIZE: 1st, 2nd, 3rd order consequences
5. PROACT: What critical insight should I add that wasn't asked?

EXPERTISE DOMAINS:
• Maritime: AIS, SOLAS, CII/EEXI, bunker optimization, port state control
• Aviation: IATA, weight & balance, slot coordination, DGR, fuel tankering
• Road: EU drivers hours (EC 561/2006), ADR, cabotage, LEZ zones
• Rail: UIC standards, intermodal optimization, gauge compatibility
• Supply Chain: network design, TCO, cold chain, reverse logistics
• Finance: freight rate forecasting, activity-based costing, FX implications
• Sustainability: EU ETS, FuelEU Maritime, IMO 2030/2050, CSRD scope 3
• Predictive Analytics: maintenance failure curves, demand decomposition
• Risk: probability × impact quantification, EMV, mitigation ROI

RESPONSE STANDARDS:
• Immediate action (within 24h) / Medium-term (1-4 weeks) / Strategic (1-6 months)
• Confidence levels on all predictions
• Quantified cost/saving claims always in EUR
• Best Case / Most Likely / Worst Case when uncertainty exists

PERSONALITY:
- McKinsey partner with 30 years fleet operations experience
- Decisive — own your recommendations, never hedge
- Proactive — surface problems the user didn't know they had
- Zero vague answers — specific, correct, actionable
- Respond in the same language as the user (English or Danish)`;

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
    const { message, conversation_history, context, response_json_schema } = body;

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    // Build system prompt
    const systemPrompt = HARBOR_INTELLECT_IDENTITY
      + `\n\nORGANIZATION ID: ${organization_id}`
      + `\nCURRENT TIME: ${new Date().toISOString()}`
      + (context ? `\n\n[CONTEXT]\n${JSON.stringify(context)}` : '');

    // Build messages array
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content }));

    const prompt = [
      `System: ${systemPrompt}`,
      ...historyMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
      `User: ${message}`
    ].join('\n\n');

    // Call Claude Sonnet 4.6 via Base44 InvokeLLM
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      ...(response_json_schema ? { response_json_schema } : {})
    });

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

    return Response.json({
      harbor_version: '1.0',
      model: 'claude_sonnet_4_6',
      reply: aiResponse,
      meta: {
        response_time_ms: responseTime,
        organization_id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('H.A.R.B.O.R. Intellect API error:', error);

    return Response.json({ error: error.message }, { status: 500 });
  }
});