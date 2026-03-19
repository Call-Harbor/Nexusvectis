import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * HIGH QUALITY BLOG GENERATOR
 * Runs every 2 hours. Picks the highest-priority unused topic from SEOMetrics
 * and generates one in-depth, publication-ready blog post.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (_) {
    // Automation / service role — proceed
  }

  const today = new Date().toISOString().split('T')[0];

  // ─── 1. Get latest SEO metrics for topic queue ────────────────────────────
  const [metricsArr, existingPosts] = await Promise.all([
    base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1),
    base44.asServiceRole.entities.BlogPost.list('-created_date', 200),
  ]);

  const latestMetrics = metricsArr[0];
  if (!latestMetrics) {
    return Response.json({ success: false, message: 'No SEO metrics found. Run SEO engine first.' });
  }

  // Collect all existing keywords to avoid duplicates
  const existingKeywords = new Set(existingPosts.map(p => (p.primary_keyword || '').toLowerCase().trim()));

  // Pick best unused topic from recommended_blog_topics or proactive_content_drafts
  const allTopics = [
    ...(latestMetrics.recommended_blog_topics || []),
    ...(latestMetrics.proactive_content_drafts || []).map(d => ({
      title: d.topic_title,
      primary_keyword: d.primary_keyword,
      secondary_keywords: [],
      search_intent: 'informational',
      priority_score: 90,
      _draft: d
    }))
  ];

  const unusedTopics = allTopics.filter(t =>
    t.primary_keyword && !existingKeywords.has((t.primary_keyword || '').toLowerCase().trim())
  );

  if (unusedTopics.length === 0) {
    return Response.json({ success: false, message: 'All known topics already have blog posts. Run SEO engine to get fresh topics.' });
  }

  // Sort by priority and pick top
  const topic = unusedTopics.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];
  const draft = topic._draft || null;

  // ─── 2. Fetch algorithm context for quality alignment ─────────────────────
  const algoContext = latestMetrics.algorithm_monitor?.adaptation_plan?.content_strategy_adjustments?.length
    ? `\nAlgorithm-aligned writing requirements: ${latestMetrics.algorithm_monitor.adaptation_plan.content_strategy_adjustments.join('; ')}`
    : '';

  const outlineContext = draft
    ? `\nUse this pre-planned outline:\n${(draft.outline || []).map(s => `- ${s.heading}: ${s.description}`).join('\n')}\nOpening hook: "${draft.hook_paragraph || ''}"`
    : '';

  // ─── 3. Generate high-quality blog post ───────────────────────────────────
  const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class B2B content writer for NexusVectis — an AI-powered fleet management and logistics intelligence platform (nexusvectis.com).

Write ONE comprehensive, high-quality, publication-ready blog post.

Topic: "${topic.title}"
Primary Keyword: "${topic.primary_keyword}"
Secondary Keywords: ${(topic.secondary_keywords || []).join(', ')}
Search Intent: ${topic.search_intent || 'informational'}
${algoContext}
${outlineContext}

QUALITY REQUIREMENTS:
- 1800–2500 words — in-depth, authoritative coverage
- Semantic HTML: H1 (title), H2 (major sections), H3 (subsections)
- Primary keyword in first 100 words, in H1, and in 3+ H2s
- Include 2025/2026 statistics with source hints (e.g. "According to Gartner, 2025...")
- At least one comparison table (HTML <table>)
- At least one numbered or bulleted list in each major section
- Section: "How NexusVectis Solves This" — describe FLEET AI, HARBOR Core, real-time tracking
- FAQ section (4 questions) structured for Google featured snippets
- Strong E-E-A-T signals: cite specific expertise, real-world logistics scenarios
- Internal links woven naturally into content: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo, /Blog
- Closing CTA: "Book a free demo of NexusVectis FLEET AI today"
- Tone: authoritative, professional, data-driven — not salesy

Return full semantic HTML only in the content field. No markdown.`,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        excerpt: { type: "string" },
        content_html: { type: "string" },
        word_count: { type: "number" },
        read_time_minutes: { type: "number" },
        seo_score: { type: "number" },
        readability_score: { type: "number" },
        internal_links_used: { type: "array", items: { type: "string" } },
        featured_snippet_eligible: { type: "boolean" },
        schema_type_recommended: { type: "string" }
      }
    }
  });

  // ─── 4. Save post ─────────────────────────────────────────────────────────
  const slug = topic.primary_keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const newPost = await base44.asServiceRole.entities.BlogPost.create({
    title: generated.title || topic.title,
    slug,
    excerpt: generated.excerpt || '',
    content: generated.content_html || '',
    category: 'Fleet Intelligence',
    tags: [topic.primary_keyword, ...(topic.secondary_keywords || [])].slice(0, 10),
    primary_keyword: topic.primary_keyword,
    secondary_keywords: topic.secondary_keywords || [],
    seo_score: generated.seo_score || 85,
    readability_score: generated.readability_score || 72,
    read_time_minutes: generated.read_time_minutes || 9,
    word_count: generated.word_count || 2000,
    search_intent: topic.search_intent || 'informational',
    competitor_gap: true,
    status: 'published',
    ai_generated: true,
    ai_model: 'gemini-3-flash-hq',
    published_at: new Date().toISOString(),
    internal_links: generated.internal_links_used || [],
    last_optimized_at: new Date().toISOString(),
    optimization_history: [{
      date: today,
      action: 'high_quality_generation_v1',
      seo_score: generated.seo_score || 85,
      word_count: generated.word_count || 2000,
      featured_snippet_eligible: generated.featured_snippet_eligible || false
    }]
  });

  return Response.json({
    success: true,
    post_id: newPost.id,
    title: newPost.title,
    primary_keyword: topic.primary_keyword,
    word_count: generated.word_count,
    seo_score: generated.seo_score,
    read_time_minutes: generated.read_time_minutes,
    featured_snippet_eligible: generated.featured_snippet_eligible,
    remaining_unused_topics: unusedTopics.length - 1
  });
});