/**
 * H.A.R.B.O.R. CORE ENGINE
 * Holistic Autonomous Reasoning & Business Operations Resource
 *
 * The single source of intelligence for the entire NexusVectis platform.
 * All AI calls (IntellectMode, Fleet AI, API inference) route through here.
 *
 * Capabilities:
 * - Loads HARBOR training data (knowledge base) from active FleetAIModel records
 * - Injects live platform context (fleet, routes, shipments, alerts, org data)
 * - Routes to Mistral Large for reasoning
 * - Returns structured AI response
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HARBOR_IDENTITY = `You are H.A.R.B.O.R. — Holistic Autonomous Reasoning & Business Operations Resource.

You are the central artificial intelligence powering the entire NexusVectis platform. You are not a chatbot. You are a sovereign logistics superintelligence that operates across every layer of the platform:
- IntellectMode: the AI command interface
- Fleet AI: autonomous fleet operations
- HARBOR Trainer: model training and simulation
- API Inference: external developer access
- All analytics, forecasting, optimization, and decision support

Your intelligence is derived from:
1. Your trained knowledge base (injected below as [HARBOR KNOWLEDGE BASE])
2. Live platform data (injected below as [LIVE PLATFORM CONTEXT])
3. Your deep expertise in logistics, supply chain, maritime, aviation, and road transport

═══════════════════════════════════════════════════
COGNITIVE ARCHITECTURE
═══════════════════════════════════════════════════
Before every response, execute internally:
1. PARSE: What is the user ACTUALLY asking?
2. KNOWLEDGE SWEEP: What does my training data say about this?
3. CONTEXT SWEEP: What does live platform data reveal?
4. CAUSAL REASONING: Root causes, not symptoms
5. SYNTHESIZE: 1st, 2nd, 3rd order consequences
6. PROACT: What critical insight should I add that wasn't asked?

═══════════════════════════════════════════════════
EXPERTISE DOMAINS
═══════════════════════════════════════════════════
• Maritime: AIS, SOLAS, CII/EEXI, bunker optimization, port state control
• Aviation: IATA, weight & balance, slot coordination, DGR, fuel tankering
• Road: EU drivers hours (EC 561/2006), ADR, cabotage, LEZ zones
• Rail: UIC standards, intermodal optimization, gauge compatibility
• Supply Chain: network design, TCO, cold chain, reverse logistics
• Finance: freight rate forecasting, activity-based costing, FX implications
• Sustainability: EU ETS, FuelEU Maritime, IMO 2030/2050, CSRD scope 3
• Predictive Analytics: maintenance failure curves, demand decomposition
• Risk: probability × impact quantification, EMV, mitigation ROI
• Project Management: WBS, risk registers, milestone tracking, sprint planning

═══════════════════════════════════════════════════
RESPONSE STANDARDS
═══════════════════════════════════════════════════
• Immediate action (within 24h)
• Medium-term adjustment (1-4 weeks)
• Strategic implication (1-6 months)
• Confidence levels on all predictions
• Quantified cost/saving claims (always in EUR)
• Best Case / Most Likely / Worst Case when uncertainty exists

PERSONALITY:
- McKinsey partner with 30 years fleet operations experience
- Decisive — own your recommendations, never hedge
- Proactive — surface problems the user didn't know they had
- Zero vague answers — specific, correct, actionable`;

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    return Response.json({ status: 'HARBOR Core Engine — online', version: '1.0' });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Auth — allow session or API key
    let user = null;
    let organization_id = null;

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer nvx_')) {
      // API key auth
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
      await base44.asServiceRole.entities.APIKey.update(matchedKey.id, { last_used: new Date().toISOString() });
    } else {
      // Session auth
      user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      organization_id = user.organization_id || user.id;
    }

    const body = await req.json();
    const {
      prompt,             // The user's message / command / query
      mode,               // 'chat' | 'command' | 'inference' — determines response format
      context,            // Live platform context passed from frontend
      conversation_history, // Previous messages for continuity
      file_urls,          // Attached files
      model_id,           // For inference mode: specific model snapshot to use
      response_schema,    // Optional: JSON schema for structured output
    } = body;

    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      return Response.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });
    }

    // ─── 1. LOAD HARBOR KNOWLEDGE BASE ───────────────────────────────────────
    let knowledgeBase = '';
    try {
      let allModels = await base44.asServiceRole.entities.FleetAIModel.filter({ organization_id, status: 'active' });
      if (!allModels || allModels.length === 0) {
        allModels = await base44.asServiceRole.entities.FleetAIModel.filter({ status: 'active' });
      }

      let selectedModel = null;
      if (model_id && allModels.length > 0) {
        selectedModel = allModels.find(m => m.snapshot_id === model_id) || null;
      }
      if (!selectedModel && allModels.length > 0) {
        allModels.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
        selectedModel = allModels[0];
      }

      if (selectedModel && selectedModel.training_data?.length > 0) {
        knowledgeBase = `\n\n[HARBOR KNOWLEDGE BASE — Model: ${selectedModel.name} v${selectedModel.version || '1.0'}, Accuracy: ${selectedModel.accuracy || 0}%]\n` +
          selectedModel.training_data.map(d => `[${(d.type || 'data').toUpperCase()} — ${d.label}]:\n${d.content}`).join('\n\n---\n');
      }
    } catch (_) {
      // No models yet — proceed without knowledge base
    }

    // ─── 2. LOAD LIVE PLATFORM CONTEXT (lightweight — only when context not already provided) ──
    let platformContext = '';
    if (context) {
      // Caller already supplied context — use it directly, skip DB queries
      platformContext = `\n\n[PLATFORM CONTEXT]\n${JSON.stringify(context)}`;
    } else if (mode !== 'chat') {
      // For command/inference modes without context, do a minimal fetch
      try {
        const [vehicles, alerts] = await Promise.all([
          base44.asServiceRole.entities.Vehicle.filter({ organization_id }, '-updated_date', 8),
          base44.asServiceRole.entities.Alert.filter({ organization_id, is_resolved: false }, '-created_date', 5),
        ]);
        platformContext = `\n\n[LIVE PLATFORM CONTEXT — Org: ${organization_id}]
Vehicles: ${vehicles.length} total, ${vehicles.filter(v => v.status === 'active').length} active, ${vehicles.filter(v => v.status === 'maintenance').length} in maintenance
Open Alerts: ${alerts.length}${alerts.length > 0 ? ' — ' + alerts.slice(0,3).map(a => a.title).join(', ') : ''}`;
      } catch (_) {
        // Skip if DB unavailable
      }
    }

    // ─── 3. BUILD SYSTEM PROMPT ───────────────────────────────────────────────

    // Determine output format instructions based on mode / response_schema
    let formatDirective = '';
    if (response_schema) {
      formatDirective = `\n\n═══════════════════════════════════════════════════
OUTPUT FORMAT DIRECTIVE — SCHEMA MODE
═══════════════════════════════════════════════════
You MUST return valid JSON that strictly matches this schema:
${JSON.stringify(response_schema, null, 2)}
Do NOT include any text, markdown, or explanation outside the JSON object.`;
    } else if (mode === 'command') {
      formatDirective = `\n\n═══════════════════════════════════════════════════
OUTPUT FORMAT DIRECTIVE — COMMAND MODE (IntellectMode)
═══════════════════════════════════════════════════
You MUST return a single valid JSON object with this exact structure:
{
  "action": "ACTION_NAME",       // One of: ANSWER, OPEN_WINDOW, CREATE_DOCUMENT, CREATE_SPREADSHEET, SHOW_ANALYSIS, SHOW_3D, OPEN_NEXUS_CHAT
  "parameters": {},              // Action-specific parameters
  "message": "string",          // User-facing message in the SAME LANGUAGE as the user's command
  "open_window": "string|null"   // Window type if action=OPEN_WINDOW, otherwise null
}
Do NOT include any text, markdown, or explanation outside the JSON object.
If you are uncertain about the action, use action: "ANSWER" with your response in "message".`;
    } else if (mode === 'inference') {
      formatDirective = `\n\n═══════════════════════════════════════════════════
OUTPUT FORMAT DIRECTIVE — INFERENCE MODE
═══════════════════════════════════════════════════
Return a concise, structured JSON object with your analysis results.
Keys should be descriptive and values should be precise.
Do NOT include any text outside the JSON object.`;
    } else if (mode === 'chat') {
      formatDirective = `\n\n═══════════════════════════════════════════════════
OUTPUT FORMAT DIRECTIVE — CHAT MODE
═══════════════════════════════════════════════════
Respond in natural language using markdown formatting.
Be concise, actionable, and structured with headers/bullets where appropriate.`;
    }

    // Keep system prompt lean — identity + format directive only
    const systemPrompt = HARBOR_IDENTITY
      + formatDirective
      + (user ? `\n\nOPERATOR: ${user.full_name || user.email} (${user.role || 'user'})` : '')
      + `\n\nCURRENT TIME: ${new Date().toISOString()}`;

    // ─── 4. BUILD MESSAGES ────────────────────────────────────────────────────
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    // Inject knowledge base + platform context as early assistant "knowledge" messages
    // This splits the payload across multiple messages instead of one huge system prompt
    const contextMessages = [];
    if (knowledgeBase) {
      // Split knowledge base into chunks of ~6000 chars to avoid token limit issues
      const KB_CHUNK = 6000;
      for (let i = 0; i < knowledgeBase.length; i += KB_CHUNK) {
        contextMessages.push({
          role: 'user',
          content: `[HARBOR KNOWLEDGE BASE — part ${Math.floor(i/KB_CHUNK)+1}]\n${knowledgeBase.slice(i, i + KB_CHUNK)}`
        });
        contextMessages.push({ role: 'assistant', content: 'Knowledge base chunk received and loaded.' });
      }
    }
    if (platformContext) {
      contextMessages.push({ role: 'user', content: platformContext });
      contextMessages.push({ role: 'assistant', content: 'Platform context loaded.' });
    }

    // ─── 5. HANDLE FILE ATTACHMENTS ───────────────────────────────────────────
    let userContent = prompt;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageUrls = (file_urls || []).filter(url => {
      const lower = url.toLowerCase().split('?')[0];
      return imageExtensions.some(ext => lower.endsWith(ext));
    });
    const textFileUrls = (file_urls || []).filter(url => !imageUrls.includes(url));

    if (textFileUrls.length > 0) {
      const contents = await Promise.all(textFileUrls.map(async url => {
        try {
          const r = await fetch(url);
          const text = await r.text();
          return `[FILE: ${url.split('/').pop().split('?')[0]}]\n${text.substring(0, 30000)}`;
        } catch { return ''; }
      }));
      userContent = prompt + '\n\n[ATTACHED FILES]\n' + contents.join('\n\n---\n\n');
    }

    if (imageUrls.length > 0) {
      userContent = [
        { type: 'text', text: userContent },
        ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } }))
      ];
    }

    // ─── 6. CALL MISTRAL ──────────────────────────────────────────────────────
    const model = imageUrls.length > 0 ? 'pixtral-large-latest' : 'mistral-large-latest';

    // If mode=command or response_schema provided, use JSON mode
    const useJsonMode = mode === 'command' || !!response_schema;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userContent }
    ];

    const requestBody = {
      model,
      messages,
      temperature: mode === 'command' ? 0.3 : 0.4,
      max_tokens: mode === 'inference' ? 1000 : 2500,
      ...(useJsonMode && !imageUrls.length ? { response_format: { type: 'json_object' } } : {})
    };

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Mistral error:', err);
      return Response.json({ error: 'AI service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content;

    if (!rawReply) {
      return Response.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse and self-heal response based on mode
    let result;
    if (useJsonMode) {
      // Try direct parse first
      try {
        result = JSON.parse(rawReply);
      } catch {
        // Try extracting JSON from markdown code blocks
        const codeBlockMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try { result = JSON.parse(codeBlockMatch[1].trim()); } catch { result = null; }
        }
        // Try extracting bare JSON object
        if (!result) {
          const jsonMatch = rawReply.match(/(\{[\s\S]*\})/);
          if (jsonMatch) {
            try { result = JSON.parse(jsonMatch[1]); } catch { result = null; }
          }
        }
        // Final fallback — wrap plain text into correct format for the mode
        if (!result) {
          if (mode === 'command') {
            result = { action: 'ANSWER', parameters: {}, message: rawReply, open_window: null };
          } else if (mode === 'inference') {
            result = { answer: rawReply };
          } else {
            result = rawReply; // chat mode — plain text is fine
          }
        }
      }

      // Self-heal command mode: ensure required fields exist
      if (mode === 'command' && typeof result === 'object' && result !== null) {
        if (!result.action) result.action = 'ANSWER';
        if (!result.message) result.message = typeof result.reply === 'string' ? result.reply : 'Done.';
        if (result.parameters === undefined) result.parameters = {};
        if (result.open_window === undefined) result.open_window = null;
      }
    } else {
      result = rawReply;
    }

    return Response.json({
      harbor_version: '1.0',
      mode: mode || 'chat',
      reply: result,
      usage: data.usage || null
    });

  } catch (error) {
    console.error('HARBOR Core error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});