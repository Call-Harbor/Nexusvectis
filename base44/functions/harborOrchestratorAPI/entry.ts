/**
 * H.A.R.B.O.R. ORCHESTRATOR API
 * Multi-Agent Orchestration Engine — Ultra API v2
 *
 * Exposes full access to all 50+ H.A.R.B.O.R AI Workers via a single API endpoint.
 * Supports single-agent, multi-agent parallel, sequential, and autonomous routing modes.
 *
 * Authentication: Bearer <nvx_api_key>
 * Endpoint: POST /functions/harborOrchestratorAPI
 *
 * ── MODES ──────────────────────────────────────────────────────────
 *
 * 1. SINGLE AGENT
 *    { "mode": "single", "agent": "harbor_fleet_analyst", "message": "..." }
 *
 * 2. MULTI-AGENT PARALLEL  — all agents reply simultaneously
 *    { "mode": "parallel", "agents": ["harbor_fleet_analyst", "harbor_risk_engine"], "message": "..." }
 *
 * 3. MULTI-AGENT SEQUENTIAL — each agent passes output to the next
 *    { "mode": "sequential", "agents": ["harbor_market_scout", "harbor_strategy_ai"], "message": "..." }
 *
 * 4. AUTO ROUTE — Orchestrator AI decides which agent(s) to use
 *    { "mode": "auto", "message": "..." }
 *
 * 5. BROADCAST — send the same message to ALL available agents
 *    { "mode": "broadcast", "message": "...", "filter_tags": ["fleet", "risk"] }
 *
 * ── OPTIONAL FIELDS ────────────────────────────────────────────────
 *   conversation_history: [{role, content}]     // Shared conversation context
 *   context: {}                                 // Additional structured context
 *   response_json_schema: {}                    // Force JSON output per agent
 *   custom_workers: ["worker_id_1", ...]        // Include custom AI workers by ID
 *   max_agents: number                          // Cap concurrent agents (default: 10)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── BUILT-IN HARBOR AGENT REGISTRY ──────────────────────────────────────────
const HARBOR_AGENTS = {
  harbor_fleet_analyst: {
    name: "Fleet Analyst",
    description: "Real-time fleet performance, efficiency, utilization and vehicle health analysis",
    tags: ["fleet", "operations", "performance"],
    system_prompt: `You are the H.A.R.B.O.R Fleet Analyst — a specialized AI for fleet performance intelligence.
Your domain: vehicle efficiency, utilization, load factors, fuel economy, KPIs, fleet composition.
Be data-driven. Quantify everything in EUR and %. Give specific, actionable recommendations.
When greeted: "Fleet Analyst online. Fleet telemetry ready."`,
  },
  harbor_route_optimizer: {
    name: "Route Optimizer",
    description: "AI-powered route planning, optimization, CO2 reduction and multimodal transport analysis",
    tags: ["routes", "logistics", "optimization", "sustainability"],
    system_prompt: `You are the H.A.R.B.O.R Route Optimizer — elite route intelligence.
Your domain: route planning, waypoint optimization, multimodal transport, CO2/fuel minimization, ETA prediction.
Think in kilometers, hours, EUR, and carbon tonnes. Always present a primary route + alternatives.`,
  },
  harbor_risk_engine: {
    name: "Risk Engine",
    description: "Supply chain risk quantification, threat detection, probability × impact analysis, EMV calculations",
    tags: ["risk", "security", "compliance", "insurance"],
    system_prompt: `You are the H.A.R.B.O.R Risk Engine — sovereign risk intelligence.
Your domain: supply chain risk, geopolitical exposure, weather, regulatory, financial, operational risks.
Quantify every risk with: probability (%), impact (EUR), EMV, and recommended hedge/mitigation.
Never give vague risk assessments — be precise.`,
  },
  harbor_demand_forecaster: {
    name: "Demand Forecaster",
    description: "Predictive demand modeling, shipment volume forecasting, seasonality and trend decomposition",
    tags: ["forecasting", "analytics", "supply-chain"],
    system_prompt: `You are the H.A.R.B.O.R Demand Forecaster — predictive intelligence engine.
Your domain: shipment volumes, seasonal patterns, demand decomposition, capacity planning.
Always present: 30/60/90-day forecasts with confidence intervals. State assumptions explicitly.`,
  },
  harbor_financial_ai: {
    name: "Financial AI",
    description: "Freight cost analysis, TCO modeling, FX exposure, activity-based costing, savings identification",
    tags: ["finance", "cost", "pricing", "revenue"],
    system_prompt: `You are the H.A.R.B.O.R Financial AI — fleet finance and cost intelligence.
Your domain: freight rates, TCO, cost-per-km, FX risk, budget variance, savings opportunities.
All numbers in EUR. Present: Current state / Target state / Gap / ROI timeline.`,
  },
  harbor_maintenance_bot: {
    name: "Maintenance Bot",
    description: "Predictive maintenance scheduling, failure probability modeling, component lifecycle and cost-benefit",
    tags: ["maintenance", "predictive", "reliability"],
    system_prompt: `You are the H.A.R.B.O.R Maintenance Bot — predictive maintenance intelligence.
Your domain: component failure curves, maintenance scheduling, downtime minimization, cost of inaction.
Always state: failure probability (%), days until expected failure, maintenance cost vs breakdown cost.`,
  },
  harbor_compliance_guard: {
    name: "Compliance Guard",
    description: "EU regulatory compliance, ADR/IATA/IMO rules, audit preparation, violation risk detection",
    tags: ["compliance", "legal", "regulatory", "audit"],
    system_prompt: `You are the H.A.R.B.O.R Compliance Guard — regulatory intelligence.
Your domain: EU transport law (EC 561/2006, ADR, IATA DGR, SOLAS, IMO 2030), GDPR, CSRD, ETS.
Flag violations with: regulation reference, severity, fine exposure (EUR), and remediation steps.`,
  },
  harbor_sustainability_ai: {
    name: "Sustainability AI",
    description: "Carbon footprint calculation, EU ETS compliance, FuelEU Maritime, decarbonization roadmaps",
    tags: ["sustainability", "carbon", "esg", "environment"],
    system_prompt: `You are the H.A.R.B.O.R Sustainability AI — decarbonization intelligence.
Your domain: CO2 calculations, EU ETS, FuelEU Maritime, Scope 1/2/3, IMO 2030/2050, CSRD.
Present: Current carbon state / Regulatory gap / Reduction pathway / Cost of compliance vs cost of inaction.`,
  },
  harbor_customer_intel: {
    name: "Customer Intel",
    description: "CRM intelligence, customer health scoring, churn prediction, expansion opportunity detection",
    tags: ["crm", "customers", "retention", "sales"],
    system_prompt: `You are the H.A.R.B.O.R Customer Intel — CRM and customer success AI.
Your domain: customer health, churn prediction, LTV modeling, expansion opportunities, NPS drivers.
Provide: Health score (0-100), churn risk (%), recommended actions, revenue expansion potential.`,
  },
  harbor_data_miner: {
    name: "Data Miner",
    description: "Structured data extraction, pattern recognition, anomaly detection and insight synthesis from raw data",
    tags: ["analytics", "data", "patterns", "anomaly"],
    system_prompt: `You are the H.A.R.B.O.R Data Miner — pattern intelligence.
Your domain: data extraction, anomaly detection, correlation analysis, insight synthesis.
Output structured JSON where possible. Flag: anomalies, outliers, missing data, and data quality issues.`,
  },
  harbor_driver_coach: {
    name: "Driver Coach",
    description: "Driver performance scoring, coaching recommendations, safety analysis and behavioral insights",
    tags: ["drivers", "hr", "safety", "training"],
    system_prompt: `You are the H.A.R.B.O.R Driver Coach — driver performance intelligence.
Your domain: driving behavior, safety scoring, fatigue risk, coaching interventions, compliance.
Provide: Performance percentile, top 3 improvement areas, specific coaching script, safety risk level.`,
  },
  harbor_market_scout: {
    name: "Market Scout",
    description: "Competitive intelligence, freight market rates, market positioning and industry trend analysis",
    tags: ["market", "competitive", "intelligence", "rates"],
    system_prompt: `You are the H.A.R.B.O.R Market Scout — competitive and market intelligence.
Your domain: freight rates, spot vs contract markets, competitor moves, market trends, pricing pressure.
Always distinguish: current data vs AI estimate. Cite data sources where possible.`,
  },
  harbor_ops_commander: {
    name: "Ops Commander",
    description: "Real-time operations center — incident command, exception management, escalation protocols",
    tags: ["operations", "incidents", "command", "realtime"],
    system_prompt: `You are the H.A.R.B.O.R Ops Commander — real-time operations intelligence.
Your domain: incident command, exception handling, escalation decisions, SLA management.
Prioritize by impact. Give: Immediate action (now) / Escalation path / Recovery plan.`,
  },
  harbor_document_ai: {
    name: "Document AI",
    description: "CMR/BOL/freight document generation, contract analysis, regulatory document processing",
    tags: ["documents", "legal", "contracts", "compliance"],
    system_prompt: `You are the H.A.R.B.O.R Document AI — logistics document intelligence.
Your domain: CMR, BOL, airway bills, customs docs, contracts, SLAs, compliance certificates.
Generate complete, legally accurate documents. Flag missing mandatory fields.`,
  },
  harbor_strategy_ai: {
    name: "Strategy AI",
    description: "Executive strategy, M&A analysis, market entry, scenario planning and long-term roadmaps",
    tags: ["strategy", "executive", "planning", "growth"],
    system_prompt: `You are the H.A.R.B.O.R Strategy AI — executive strategy intelligence.
Your domain: corporate strategy, M&A, market entry, competitive positioning, 3-5 year roadmaps.
Think like a McKinsey partner. Present: Situation / Complication / Resolution. Quantify impact in EUR.`,
  },
  harbor_api_integrator: {
    name: "API Integrator",
    description: "Technical integration guidance, API design, webhook configuration and developer support",
    tags: ["technical", "api", "integration", "developer"],
    system_prompt: `You are the H.A.R.B.O.R API Integrator — technical integration intelligence.
Your domain: REST APIs, webhooks, data schemas, authentication, rate limiting, error handling.
Provide: Code examples (JSON/curl/Python), integration architecture, troubleshooting steps.`,
  },
  harbor_visualizer: {
    name: "Visualizer",
    description: "Data visualization design, dashboard recommendations, chart selection and KPI presentation",
    tags: ["visualization", "dashboards", "reporting", "kpi"],
    system_prompt: `You are the H.A.R.B.O.R Visualizer — data visualization intelligence.
Your domain: chart selection, dashboard design, KPI hierarchy, storytelling with data.
Recommend: Chart type / Data structure / Color encoding / Insight hierarchy. Output JSON data structures.`,
  },
  harbor_nlp_engine: {
    name: "NLP Engine",
    description: "Natural language processing, text classification, sentiment analysis and language intelligence",
    tags: ["nlp", "text", "classification", "language"],
    system_prompt: `You are the H.A.R.B.O.R NLP Engine — language and text intelligence.
Your domain: text classification, sentiment analysis, entity extraction, language detection, translation.
Output structured JSON with: classifications, confidence scores, extracted entities, sentiment scores.`,
  },
  harbor_simulation_ai: {
    name: "Simulation AI",
    description: "Monte Carlo simulation, what-if scenario modeling, stress testing and probability distributions",
    tags: ["simulation", "modeling", "scenarios", "monte-carlo"],
    system_prompt: `You are the H.A.R.B.O.R Simulation AI — scenario modeling intelligence.
Your domain: Monte Carlo simulation, what-if analysis, stress testing, probability distributions.
Always output: Base case / Optimistic / Pessimistic / Most likely. Include confidence intervals.`,
  },
  harbor_security_ai: {
    name: "Security AI",
    description: "Cybersecurity risk, cargo security, theft prevention, access control and threat intelligence",
    tags: ["security", "cyber", "cargo", "threat"],
    system_prompt: `You are the H.A.R.B.O.R Security AI — security intelligence.
Your domain: cybersecurity, cargo security, access control, threat modeling, incident response.
Provide: Threat vector / Likelihood / Impact / Immediate mitigation / Long-term hardening.`,
  },
  harbor_harbor_ai: {
    name: "Port Operations AI",
    description: "Port call optimization, berth scheduling, vessel queue management and port efficiency",
    tags: ["port", "maritime", "berth", "vessels"],
    system_prompt: `You are the H.A.R.B.O.R Port Operations AI — maritime port intelligence.
Your domain: berth scheduling, port calls, vessel queue, crane optimization, port KPIs.
Think in GRT, TEUs, port dues, and turnaround hours. Optimize for minimizing port stay time and cost.`,
  },
  harbor_airport_ai: {
    name: "Airport Ops AI",
    description: "Airport operations, turnaround management, gate optimization and ground handling intelligence",
    tags: ["airport", "aviation", "gates", "ground-handling"],
    system_prompt: `You are the H.A.R.B.O.R Airport Ops AI — aviation ground operations intelligence.
Your domain: turnaround times, gate allocation, ground handling, baggage, fuel, slot management.
Quantify in minutes and EUR. Flag SLA breaches immediately with recovery options.`,
  },
  harbor_transit_ai: {
    name: "Transit AI",
    description: "Public transit optimization, demand-responsive transit, schedule optimization and passenger flow",
    tags: ["transit", "public-transport", "buses", "passengers"],
    system_prompt: `You are the H.A.R.B.O.R Transit AI — public transit intelligence.
Your domain: bus/rail scheduling, demand-responsive transit, passenger flow, network optimization.
Think in passengers/hour, headways, OTP%, and cost-per-passenger. Balance coverage vs efficiency.`,
  },
  harbor_energy_ai: {
    name: "Energy AI",
    description: "Energy grid management, EV charging optimization, power consumption forecasting and grid resilience",
    tags: ["energy", "grid", "ev", "charging"],
    system_prompt: `You are the H.A.R.B.O.R Energy AI — energy and grid intelligence.
Your domain: energy grids, EV fleet charging, power consumption, renewable integration, grid stability.
Present in kWh, MW, EUR/MWh. Optimize for cost, resilience, and carbon impact simultaneously.`,
  },
};

// ── AUTH HELPER ──────────────────────────────────────────────────────────────
async function authenticate(req, base44) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer nvx_')) {
    const providedKey = authHeader.slice(7).trim();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
    const providedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keyPrefix = providedKey.substring(0, 12);

    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ key_prefix: keyPrefix, status: 'active' });
    const matchedKey = apiKeys.find(k => k.key_hash === providedHash);

    if (!matchedKey) return { error: 'Invalid or revoked API key', status: 401 };

    await base44.asServiceRole.entities.APIKey.update(matchedKey.id, { last_used: new Date().toISOString() });
    return { organization_id: matchedKey.organization_id, api_key_id: matchedKey.id };
  }
  
  // Session auth (internal usage)
  const user = await base44.auth.me();
  if (!user) return { error: 'Unauthorized — provide Authorization: Bearer <nvx_api_key>', status: 401 };
  return { organization_id: user.organization_id || user.id, user };
}

// ── AGENT INVOCATION ─────────────────────────────────────────────────────────
async function invokeAgent(base44, agentId, agentDef, message, conversationHistory, context, responseJsonSchema, prevOutput = null) {
  const systemPrompt = agentDef.system_prompt
    + `\n\nCURRENT TIME: ${new Date().toISOString()}`
    + (context ? `\n\n[CONTEXT]\n${JSON.stringify(context)}` : '')
    + (prevOutput ? `\n\n[INPUT FROM PREVIOUS AGENT]\n${typeof prevOutput === 'object' ? JSON.stringify(prevOutput) : prevOutput}` : '');

  const history = (conversationHistory || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-10);

  const promptParts = [
    `System: ${systemPrompt}`,
    ...history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
    `User: ${message}`
  ].join('\n\n');

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: promptParts,
    model: 'claude_sonnet_4_6',
    ...(responseJsonSchema ? { response_json_schema: responseJsonSchema } : {})
  });

  return { agent_id: agentId, agent_name: agentDef.name, reply };
}

// ── AUTO-ROUTER: decide which agents to use ──────────────────────────────────
async function autoRoute(base44, message) {
  const agentList = Object.entries(HARBOR_AGENTS)
    .map(([id, a]) => `${id}: ${a.description} [tags: ${a.tags.join(', ')}]`)
    .join('\n');

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the H.A.R.B.O.R Orchestrator Router.

Available agents:
${agentList}

User message: "${message}"

Select the most appropriate agent(s) to handle this request. Consider:
- If the query spans multiple domains, select multiple agents (max 4)
- If it's focused on one domain, select 1-2 agents
- Always include at minimum 1 agent

Return JSON: { "agents": ["agent_id_1", "agent_id_2"], "mode": "parallel" | "sequential", "reasoning": "why these agents" }`,
    response_json_schema: {
      type: 'object',
      properties: {
        agents: { type: 'array', items: { type: 'string' } },
        mode: { type: 'string' },
        reasoning: { type: 'string' }
      }
    }
  });

  return result;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

  // GET — API info + agent listing
  if (req.method === 'GET') {
    return Response.json({
      status: 'H.A.R.B.O.R. Orchestrator API — online',
      version: '1.0',
      description: 'Multi-agent orchestration engine. Chat with 1 or 50+ AI agents simultaneously.',
      modes: ['single', 'parallel', 'sequential', 'auto', 'broadcast'],
      built_in_agents: Object.entries(HARBOR_AGENTS).map(([id, a]) => ({
        id,
        name: a.name,
        description: a.description,
        tags: a.tags
      })),
      total_built_in_agents: Object.keys(HARBOR_AGENTS).length,
      documentation: {
        single: 'POST { mode: "single", agent: "harbor_fleet_analyst", message: "..." }',
        parallel: 'POST { mode: "parallel", agents: ["harbor_fleet_analyst", "harbor_risk_engine"], message: "..." }',
        sequential: 'POST { mode: "sequential", agents: ["harbor_market_scout", "harbor_strategy_ai"], message: "..." }',
        auto: 'POST { mode: "auto", message: "..." }',
        broadcast: 'POST { mode: "broadcast", message: "...", filter_tags: ["fleet", "risk"] }'
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Auth
    const auth = await authenticate(req, base44);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
    const { organization_id, api_key_id } = auth;

    const body = await req.json();
    const {
      mode = 'auto',
      message,
      agent,           // for mode=single
      agents,          // for mode=parallel/sequential
      filter_tags,     // for mode=broadcast
      conversation_history,
      context,
      response_json_schema,
      custom_workers,  // array of CustomAIWorker IDs
      max_agents = 10,
    } = body;

    if (!message) return Response.json({ error: 'message is required' }, { status: 400 });

    // Load custom workers if requested
    let customAgentMap = {};
    if (custom_workers?.length) {
      const workers = await base44.asServiceRole.entities.CustomAIWorker.filter(
        { organization_id }
      );
      for (const w of workers) {
        if (custom_workers.includes(w.id)) {
          customAgentMap[w.id] = {
            name: w.name,
            description: w.specialty || 'Custom AI Worker',
            tags: ['custom'],
            system_prompt: w.system_prompt || `You are ${w.name}. ${w.specialty || ''}`,
          };
        }
      }
    }

    const allAgents = { ...HARBOR_AGENTS, ...customAgentMap };
    let results = [];
    let routingInfo = null;

    // ── MODE: SINGLE ──────────────────────────────────────────────────────────
    if (mode === 'single') {
      const agentId = agent;
      if (!agentId) return Response.json({ error: 'agent is required for mode=single' }, { status: 400 });
      const agentDef = allAgents[agentId];
      if (!agentDef) return Response.json({ error: `Unknown agent: ${agentId}. GET /functions/harborOrchestratorAPI to list agents.` }, { status: 400 });

      const result = await invokeAgent(base44, agentId, agentDef, message, conversation_history, context, response_json_schema);
      results = [result];
    }

    // ── MODE: PARALLEL ────────────────────────────────────────────────────────
    else if (mode === 'parallel') {
      const agentIds = (agents || []).slice(0, max_agents);
      if (!agentIds.length) return Response.json({ error: 'agents array is required for mode=parallel' }, { status: 400 });

      const unknownAgents = agentIds.filter(id => !allAgents[id]);
      if (unknownAgents.length) return Response.json({ error: `Unknown agents: ${unknownAgents.join(', ')}` }, { status: 400 });

      results = await Promise.all(
        agentIds.map(id => invokeAgent(base44, id, allAgents[id], message, conversation_history, context, response_json_schema))
      );
    }

    // ── MODE: SEQUENTIAL ──────────────────────────────────────────────────────
    else if (mode === 'sequential') {
      const agentIds = (agents || []).slice(0, max_agents);
      if (!agentIds.length) return Response.json({ error: 'agents array is required for mode=sequential' }, { status: 400 });

      const unknownAgents = agentIds.filter(id => !allAgents[id]);
      if (unknownAgents.length) return Response.json({ error: `Unknown agents: ${unknownAgents.join(', ')}` }, { status: 400 });

      let prevOutput = null;
      for (const id of agentIds) {
        const result = await invokeAgent(base44, id, allAgents[id], message, conversation_history, context, response_json_schema, prevOutput);
        results.push(result);
        prevOutput = result.reply;
      }
    }

    // ── MODE: AUTO ────────────────────────────────────────────────────────────
    else if (mode === 'auto') {
      const routing = await autoRoute(base44, message);
      routingInfo = routing;

      const selectedIds = (routing.agents || [])
        .filter(id => allAgents[id])
        .slice(0, max_agents);

      if (!selectedIds.length) {
        // Fallback to harbor_ops_commander if routing fails
        selectedIds.push('harbor_ops_commander');
      }

      const execMode = routing.mode === 'sequential' ? 'sequential' : 'parallel';

      if (execMode === 'sequential') {
        let prevOutput = null;
        for (const id of selectedIds) {
          const result = await invokeAgent(base44, id, allAgents[id], message, conversation_history, context, response_json_schema, prevOutput);
          results.push(result);
          prevOutput = result.reply;
        }
      } else {
        results = await Promise.all(
          selectedIds.map(id => invokeAgent(base44, id, allAgents[id], message, conversation_history, context, response_json_schema))
        );
      }
    }

    // ── MODE: BROADCAST ───────────────────────────────────────────────────────
    else if (mode === 'broadcast') {
      let targetIds = Object.keys(HARBOR_AGENTS);

      // Filter by tags if provided
      if (filter_tags?.length) {
        targetIds = targetIds.filter(id =>
          HARBOR_AGENTS[id].tags.some(tag => filter_tags.includes(tag))
        );
      }

      targetIds = targetIds.slice(0, max_agents);

      results = await Promise.all(
        targetIds.map(id => invokeAgent(base44, id, HARBOR_AGENTS[id], message, conversation_history, context, response_json_schema))
      );
    }

    else {
      return Response.json({ error: `Unknown mode: ${mode}. Use: single | parallel | sequential | auto | broadcast` }, { status: 400 });
    }

    const responseTime = Date.now() - startTime;

    // Track usage
    await base44.asServiceRole.entities.APIUsage.create({
      organization_id,
      api_key_id: api_key_id || '',
      endpoint: '/functions/harborOrchestratorAPI',
      method: 'POST',
      status_code: 200,
      response_time_ms: responseTime,
      ip_address: clientIP,
    }).catch(() => {});

    // Build response
    const isSingle = results.length === 1;
    return Response.json({
      harbor_version: '1.0',
      orchestrator: 'H.A.R.B.O.R. Orchestrator API',
      mode,
      agents_invoked: results.length,
      ...(routingInfo ? { routing: routingInfo } : {}),
      // For single agent: top-level reply for convenience
      ...(isSingle ? { agent: results[0].agent_id, agent_name: results[0].agent_name, reply: results[0].reply } : {}),
      // For multi-agent: array of results
      ...(!isSingle ? { results } : {}),
      meta: {
        response_time_ms: responseTime,
        organization_id,
        timestamp: new Date().toISOString(),
        custom_workers_loaded: Object.keys(customAgentMap).length,
      }
    });

  } catch (error) {
    console.error('H.A.R.B.O.R. Orchestrator API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});