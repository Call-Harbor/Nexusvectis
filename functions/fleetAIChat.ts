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
• Project Management: task breakdown structures (WBS), risk registers, progress summaries, milestone tracking, dependency mapping, sprint planning, stakeholder communication

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

For project management requests:
- "generate tasks for [project]" → Return a structured task list with phases, owners, deadlines, and priorities (use markdown table)
- "project summary [daily/weekly]" → Return an executive summary: progress %, completed tasks, blockers, next steps, risks
- "identify risks for [project]" → Return a risk register with: risk name, probability (H/M/L), impact (H/M/L), mitigation strategy, owner
- Always structure project output as: **Phase → Task → Subtask** hierarchy
- Always include a traffic-light status (🟢 On Track / 🟡 At Risk / 🔴 Critical) for each major element

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

    // Process non-image files by reading them directly
    let filesContent = '';
    if (otherFileUrls.length > 0) {
      const fileSegments = await Promise.all(otherFileUrls.map(async (fileUrl) => {
        try {
          const resp = await fetch(fileUrl);
          if (!resp.ok) return `[FILE: ${fileUrl.split('/').pop().split('?')[0]} - could not fetch]`;

          const contentType = resp.headers.get('content-type') || '';
          const fileName = fileUrl.split('/').pop().split('?')[0];
          const lowerUrl = fileUrl.toLowerCase().split('?')[0];

          const isText = contentType.includes('text') ||
            ['.txt','.csv','.json','.js','.ts','.jsx','.tsx','.html','.css','.xml',
             '.md','.yaml','.yml','.log','.env','.sh','.py','.rb','.php','.sql'].some(e => lowerUrl.endsWith(e));

          if (isText) {
            let text = await resp.text();
            if (text.length > 40000) text = text.substring(0, 40000) + '\n[...truncated]';
            return `[FILE: ${fileName}]\n${text}`;
          }

          if (contentType.includes('pdf') || lowerUrl.endsWith('.pdf')) {
            const buf = await resp.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let extracted = '';
            for (let i = 0; i < Math.min(bytes.length, 300000); i++) {
              const b = bytes[i];
              if (b >= 32 && b <= 126) extracted += String.fromCharCode(b);
              else if (b === 10 || b === 13) extracted += '\n';
            }
            extracted = extracted.replace(/[^\x20-\x7E\n]{3,}/g, ' ').replace(/ {4,}/g, '   ').trim();
            if (extracted.length > 30000) extracted = extracted.substring(0, 30000) + '\n[...truncated]';
            return `[FILE: ${fileName} (PDF)]\n${extracted || '[PDF - no readable text extracted]'}`;
          }

          // Fallback: try reading as text
          let text = await resp.text();
          if (text.length > 20000) text = text.substring(0, 20000) + '\n[...truncated]';
          return `[FILE: ${fileName}]\n${text}`;
        } catch (err) {
          return `[FILE: ${fileUrl.split('/').pop().split('?')[0]} - error: ${err.message}]`;
        }
      }));
      filesContent = fileSegments.join('\n\n---\n\n');
    }

    // Build conversation messages
    const historyMessages = (conversation_history || [])
      .filter(m => (m.role === "user" || m.role === "assistant") && m.content)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    // Route through HARBOR Core Engine
    const harborResponse = await base44.functions.invoke('harborCore', {
      prompt: filesContent ? `${message}\n\n[ATTACHED FILES CONTENT]\n${filesContent}` : message,
      mode: 'chat',
      context: {
        ...context,
        current_datetime: context?.current_datetime || new Date().toISOString(),
        has_images: hasImages,
        image_count: imageUrls.length,
      },
      conversation_history: historyMessages,
      file_urls: hasImages ? imageUrls : undefined,
    });

    const harborData = harborResponse.data;
    const reply = typeof harborData.reply === 'string' ? harborData.reply : harborData.reply?.message || JSON.stringify(harborData.reply);

    if (!reply) {
      return Response.json({ error: "No response from HARBOR" }, { status: 500 });
    }

    return Response.json({
      reply,
      role: "assistant",
      model: harborData.model_used || 'HARBOR Core',
      usage: harborData.usage || null
    });

  } catch (error) {
    console.error("fleetAIChat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});