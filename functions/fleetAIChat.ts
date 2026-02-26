import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SYSTEM_PROMPT = `You are FLEET AI — the world's most advanced logistics superintelligence, built into the NexusVectis platform. You do not just answer questions. You reason at a level that combines the analytical depth of a top-tier management consultant with the operational expertise of a 30-year veteran fleet director.

═══════════════════════════════════════════════════
COGNITIVE APPROACH
═══════════════════════════════════════════════════
Before every response, internally execute:
1. PARSE: What is the user ACTUALLY asking (not just literally saying)?
2. SWEEP: What relevant patterns, anomalies, or risks exist in the available context?
3. REASON CAUSALLY: Why is this happening? (not just what is happening)
4. SYNTHESIZE: What are the 1st, 2nd, and 3rd order consequences?
5. PROACT: What critical insight should I add that the user didn't ask for?

═══════════════════════════════════════════════════
DOMAINS OF MASTERY
═══════════════════════════════════════════════════
• Maritime: AIS, SOLAS, CII/EEXI compliance, bunker optimization, port state control
• Aviation: IATA, weight & balance, slot coordination, DGR, fuel tankering
• Road: EU drivers' hours (EC 561/2006), ADR hazmat, cabotage, LEZ zones
• Rail: UIC standards, intermodal optimization, gauge compatibility
• Supply Chain: network design, TCO modeling, ABC costing, cold chain, reverse logistics
• Finance: freight rate forecasting, activity-based costing, contract exposure, FX implications
• Sustainability: EU ETS, FuelEU Maritime, IMO 2030/2050, CSRD scope 3, green corridors
• Predictive Analytics: maintenance failure curves, demand decomposition, ensemble forecasting
• Risk: probability × impact quantification, EMV calculation, mitigation ROI analysis

═══════════════════════════════════════════════════
RESPONSE STANDARDS
═══════════════════════════════════════════════════
Every response must include at minimum:
• The IMMEDIATE action (within 24h)
• The MEDIUM-TERM adjustment (1–4 weeks)
• The STRATEGIC implication (1–6 months) — when relevant

For predictions: always attach a confidence level (e.g., "82% confidence") and a key risk variable.

For cost/saving claims: always quantify (e.g., "saves €8,400/month" not "saves money").

For analysis: use Best Case / Most Likely / Worst Case framing when uncertainty exists.

PERSONALITY:
- Think like a McKinsey partner with 30 years of hands-on fleet experience
- Decisive — own your recommendations, never hedge
- Proactive — surface problems the user didn't know they had
- Anticipate the follow-up question and answer it preemptively
- Zero vague answers — specific, correct, actionable

LANGUAGE: Always respond in ENGLISH regardless of what language the user writes in. If the user writes Danish, German, French, or any other language, translate their intent and respond in English.

FORMATTING: Use markdown with headers, bullets, and bold for key numbers. Be comprehensive but not verbose.`;


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated and unauthenticated usage (public API)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // Unauthenticated — still allow access for public demo
    }

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      return Response.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { message, conversation_history, context, file_urls } = body;

    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    // Detect image URLs vs other file URLs
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageUrls = (file_urls || []).filter(url => {
      const lower = url.toLowerCase().split('?')[0];
      return imageExtensions.some(ext => lower.endsWith(ext));
    });
    const otherFileUrls = (file_urls || []).filter(url => !imageUrls.includes(url));

    const hasImages = imageUrls.length > 0;

    // Process non-image files
    let filesContent = '';
    if (otherFileUrls.length > 0) {
      try {
        const fileProcessingResponse = await fetch(Deno.env.get("BASE44_API_URL") || "http://localhost:3000", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_TOKEN") || ''}`
          },
          body: JSON.stringify({
            function_name: 'processFileContent',
            payload: { file_urls: otherFileUrls }
          })
        }).catch(() => null);

        if (fileProcessingResponse?.ok) {
          const fileData = await fileProcessingResponse.json();
          if (fileData.processed_files) {
            filesContent = fileData.processed_files.map(f => 
              `[FILE: ${f.url.split('/').pop()} (${f.type})]\n${f.content}`
            ).join('\n\n---\n\n');
          }
        }
      } catch (e) {
        console.log('File processing not available, proceeding with message only');
      }
    }

    // Build conversation messages
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === "user" || m.role === "assistant") && m.content)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    // Optionally enrich system prompt with fleet context
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCURRENT FLEET CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    }
    if (context?.current_datetime) {
      systemPrompt += `\n\nCURRENT LOCAL DATE/TIME: ${context.current_datetime} (Timezone: ${context.user_timezone || 'UTC'})`;
      systemPrompt += `\nUse this as "now" for all temporal reasoning, scheduling, and ETA calculations.`;
    }
    if (user) {
      systemPrompt += `\n\nUSER: ${user.full_name} (${user.email}), role: ${user.role}`;
    }
    if (hasImages) {
      systemPrompt += `\n\nIMAGE ANALYSIS MODE: The user has attached ${imageUrls.length} image(s). Analyze them in detail — identify vehicles, cargo, infrastructure, damage, safety hazards, license plates, container numbers, or any logistics-relevant information. Be specific and actionable.`;
    }

    // Build user message content — multimodal if images present
    let userContent;
    const textContent = filesContent
      ? `${message}\n\n[ATTACHED FILES CONTENT]\n${filesContent}`
      : message;

    if (hasImages) {
      // Build multimodal content array for Pixtral vision model
      userContent = [
        { type: "text", text: textContent }
      ];
      for (const imgUrl of imageUrls) {
        userContent.push({
          type: "image_url",
          image_url: { url: imgUrl }
        });
      }
    } else {
      userContent = textContent;
    }

    // Use Pixtral (vision) model when images are present, otherwise Mistral Large
    const model = hasImages ? "pixtral-large-latest" : "mistral-large-latest";

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: userContent }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Mistral API error:", err);
      return Response.json({ error: "AI service unavailable. Please try again." }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    return Response.json({
      reply,
      role: "assistant",
      model: "mistral-large-latest",
      usage: data.usage || null
    });

  } catch (error) {
    console.error("fleetAIChat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});