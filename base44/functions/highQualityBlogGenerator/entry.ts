import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * HIGH QUALITY BLOG GENERATOR — Anti-Bloat Edition
 *
 * Runs every 2 hours. Before writing anything, it asks the AI to evaluate
 * whether the candidate topic is genuinely distinct from existing content.
 * Only proceeds if the topic passes the uniqueness gate.
 */

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);

  // Scheduled automation runs with service role — no user auth needed

  const today = new Date().toISOString().split('T')[0];

  // ─── 1. Load existing posts + latest SEO metrics ──────────────────────────
  const [metricsArr, existingPosts] = await Promise.all([
    base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1),
    base44.asServiceRole.entities.BlogPost.list('-created_date', 300),
  ]);

  const latestMetrics = metricsArr[0];
  if (!latestMetrics) {
    return nvJson(requestId, { success: false, message: 'No SEO metrics found. Run SEO engine first.' });

  }

  // Build a compact summary of existing content for the uniqueness check
  const existingKeywords = new Set(existingPosts.map(p => (p.primary_keyword || '').toLowerCase().trim()));
  const existingSummary = existingPosts
    .slice(0, 60) // cap to keep prompt size sane
    .map(p => `- "${p.title}" [${p.primary_keyword}]`)
    .join('\n');

  // ─── 2. Build candidate topic list (deduped by keyword) ───────────────────
  const allTopics = [
    ...(latestMetrics.recommended_blog_topics || []),
    ...(latestMetrics.proactive_content_drafts || []).map(d => ({
      title: d.topic_title,
      primary_keyword: d.primary_keyword,
      secondary_keywords: [],
      search_intent: 'informational',
      priority_score: 90,
      _draft: d
    })),
    ...(latestMetrics.content_gaps || []).map(gap => ({
      title: gap,
      primary_keyword: gap,
      secondary_keywords: [],
      search_intent: 'informational',
      priority_score: 70
    }))
  ].filter(t => t.primary_keyword && !existingKeywords.has((t.primary_keyword || '').toLowerCase().trim()));

  if (allTopics.length === 0) {
    return nvJson(requestId, { success: false, message: 'No unused topics available. Run SEO engine to refresh topic queue.' });

  }

  // Sort by priority — take top 5 candidates to evaluate
  const candidates = allTopics
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5);

  // ─── 3. Uniqueness gate — AI picks the most distinct candidate ────────────
  const uniquenessCheck = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a content strategist preventing "content bloat" on a B2B logistics platform blog (NexusVectis).

EXISTING BLOG POSTS (title + primary keyword):
${existingSummary}

CANDIDATE TOPICS (pick the BEST one):
${candidates.map((t, i) => `${i}. "${t.title}" [keyword: ${t.primary_keyword}]`).join('\n')}

Your task:
1. Identify which candidate is MOST semantically distinct from ALL existing posts — covering a clearly different angle, audience segment, use case, or problem.
2. Reject candidates that are minor variations, keyword synonyms, or already covered at a different URL.
3. If no candidate is genuinely distinct (e.g. we already have 3 posts on that theme), return selected_index: -1.

Be strict. One high-quality unique post beats ten thin duplicates.`,
    response_json_schema: {
      type: "object",
      properties: {
        selected_index: { type: "number", description: "-1 if none is distinct enough, otherwise 0-4" },
        reason: { type: "string" },
        unique_angle: { type: "string", description: "The specific angle that makes this post genuinely different" },
        topics_to_avoid_overlap: { type: "array", items: { type: "string" }, description: "Specific sub-topics to NOT cover because they're already in existing posts" }
      }
    }
  });

  if (uniquenessCheck.selected_index === -1) {
    return nvJson(requestId, {
      success: false,
      skipped: true,
      reason: uniquenessCheck.reason,
      message: 'All candidate topics are too similar to existing content. Skipping to prevent content bloat.'
    });

  }

  const topic = candidates[uniquenessCheck.selected_index] || candidates[0];
  const draft = topic._draft || null;
  const avoidOverlap = uniquenessCheck.topics_to_avoid_overlap || [];
  const uniqueAngle = uniquenessCheck.unique_angle || '';

  // ─── 4. Build generation prompt with anti-overlap instructions ────────────
  const algoContext = latestMetrics.algorithm_monitor?.adaptation_plan?.content_strategy_adjustments?.length
    ? `\nAlgorithm context: ${latestMetrics.algorithm_monitor.adaptation_plan.content_strategy_adjustments.join('; ')}`
    : '';

  const outlineContext = draft
    ? `\nPre-planned outline:\n${(draft.outline || []).map(s => `- ${s.heading}`).join('\n')}`
    : '';

  const avoidContext = avoidOverlap.length > 0
    ? `\nDO NOT cover these sub-topics (already covered in other posts): ${avoidOverlap.join(', ')}`
    : '';

  // ─── 5. Generate the post ─────────────────────────────────────────────────
  const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class B2B content writer for NexusVectis — an AI-powered fleet management and logistics platform (nexusvectis.com).

Write ONE comprehensive, genuinely useful blog post that earns its place on the internet.

Topic: "${topic.title}"
Primary Keyword: "${topic.primary_keyword}"
Secondary Keywords: ${(topic.secondary_keywords || []).join(', ')}
Search Intent: ${topic.search_intent || 'informational'}
Unique angle to focus on: ${uniqueAngle}
${avoidContext}
${algoContext}
${outlineContext}

CONTENT RULES (non-negotiable):
- 1800–2500 words of genuinely useful, specific, actionable content
- NO filler, NO repetition, NO generic advice that could appear on any website
- Every paragraph must add new information — no restating the same point
- Use real-world logistics scenarios, concrete numbers, operator perspectives
- Include 2025/2026 industry data with source attribution
- At least one original comparison table (<table>) with specific data
- FAQ section (4 questions targeting featured snippets with direct, concise answers)
- Section: "How NexusVectis Addresses This" — specific features, not generic claims
- Internal links naturally woven in: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo
- Closing CTA: "See it in action — book a free NexusVectis demo"
- Semantic HTML only (H1, H2, H3, p, ul, ol, table). No markdown.
- Tone: authoritative expert, not marketing copy`,
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
        unique_value_proposition: { type: "string", description: "One sentence: what does this post offer that no other post does?" },
        featured_snippet_eligible: { type: "boolean" }
      }
    }
  });

  // ─── 6. Save post ─────────────────────────────────────────────────────────
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
    last_optimized_at: new Date().toISOString(),
    optimization_history: [{
      date: today,
      action: 'high_quality_generation_v2_anti_bloat',
      unique_angle: uniqueAngle,
      seo_score: generated.seo_score || 85,
      word_count: generated.word_count || 2000
    }]
  });

  return nvJson(requestId, {
    success: true,
    post_id: newPost.id,
    title: newPost.title,
    primary_keyword: topic.primary_keyword,
    unique_angle: uniqueAngle,
    unique_value: generated.unique_value_proposition,
    word_count: generated.word_count,
    seo_score: generated.seo_score,
    avoided_overlap_topics: avoidOverlap,
    remaining_candidates: allTopics.length - 1
  });

});