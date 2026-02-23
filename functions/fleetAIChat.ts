import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SYSTEM_PROMPT = `You are FLEET AI - the world's most advanced logistics intelligence assistant, built into the NexusVectis platform.

You help users with all aspects of fleet management, logistics, and transportation intelligence:
- Fleet operations: vehicles, drivers, assets, maintenance
- Logistics & planning: routes, shipments, resources
- Business management: customers, contracts, invoices
- AI & analytics: predictive maintenance, demand forecasting, CO2 analysis, route optimization
- Performance insights, risk assessments, cost analysis

PERSONALITY:
- Confident, decisive, and professional
- Provide concrete, quantified recommendations
- Always actionable — include next steps
- Proactive — surface insights even when not asked
- Adapt language and tone to user's language (respond in the SAME language as the user)

RESPONSE STYLE:
- Be concise but comprehensive
- Use bullet points for lists
- Include specific numbers and metrics when relevant
- Frame everything in terms of business impact
- No unnecessary disclaimers or hedging`;

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
    const { message, conversation_history, context } = body;

    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    // Build conversation messages
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === "user" || m.role === "assistant") && m.content)
      .slice(-20) // Keep last 20 messages
      .map(m => ({ role: m.role, content: m.content }));

    // Optionally enrich system prompt with fleet context
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCURRENT FLEET CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    }
    if (user) {
      systemPrompt += `\n\nUSER: ${user.full_name} (${user.email}), role: ${user.role}`;
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: message }
        ],
        temperature: 0.4,
        max_tokens: 1024
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