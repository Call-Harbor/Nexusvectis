import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * SEO POST RE-OPTIMIZER — HIGH QUALITY EDITION
 * Rewrites existing blog posts to full high-quality standard (1800-2500 words).
 * Processes up to 3 posts per run to avoid timeouts.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const today = new Date().toISOString().split('T')[0];

  // Find posts that need re-optimization (low word count or flagged)
  const stalePosts = await base44.asServiceRole.entities.BlogPost.filter(
    { status: 'needs_update' },
    '-created_date',
    3
  );

  const results = [];

  // Load published posts once — used inside loop to avoid overlap
  const allPublished = await base44.asServiceRole.entities.BlogPost.filter(
    { status: 'published' }, '-created_date', 50
  );

  for (const post of stalePosts) {
    const otherTitles = allPublished
      .filter(p => p.id !== post.id)
      .map(p => `"${p.title}" [${p.primary_keyword}]`)
      .join('\n');
    const rewritten = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a world-class B2B content writer for NexusVectis — an AI-powered fleet management and logistics intelligence platform (nexusvectis.com).

Completely rewrite this blog post so it is genuinely useful, unique, and earns its place as the single best resource on this topic.

Title: "${post.title}"
Primary Keyword: "${post.primary_keyword}"
Secondary Keywords: ${(post.secondary_keywords || []).join(', ')}
Current excerpt: "${post.excerpt}"
Current content preview: ${(post.content || '').replace(/<[^>]+>/g, '').slice(0, 400)}...

OTHER POSTS ALREADY ON THE BLOG (do NOT overlap with these):
${otherTitles}

RULES:
- Find a specific angle or depth that NONE of the other posts cover
- 1800–2500 words — every paragraph must add new, concrete information
- NO filler, NO generic advice, NO restating the same point
- Use real operator scenarios, specific numbers, 2025/2026 data with source hints
- Comparison table (<table>) with concrete data
- FAQ section (4 questions, direct answers for featured snippets)
- Section: "How NexusVectis Addresses This" — specific platform capabilities, not vague claims
- Internal links naturally to: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo
- Closing CTA: "See it in action — book a free NexusVectis demo"
- Semantic HTML only (H1, H2, H3, p, ul, ol, table). No markdown.`,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          new_title: { type: "string" },
          new_excerpt: { type: "string" },
          content_html: { type: "string" },
          word_count: { type: "number" },
          read_time_minutes: { type: "number" },
          new_seo_score: { type: "number" },
          readability_score: { type: "number" },
          new_secondary_keywords: { type: "array", items: { type: "string" } }
        }
      }
    });

    const updatedHistory = [
      ...(post.optimization_history || []),
      {
        date: today,
        action: 'high_quality_rewrite',
        previous_seo_score: post.seo_score,
        new_seo_score: rewritten.new_seo_score,
        word_count: rewritten.word_count
      }
    ];

    await base44.asServiceRole.entities.BlogPost.update(post.id, {
      title: rewritten.new_title || post.title,
      excerpt: rewritten.new_excerpt || post.excerpt,
      content: rewritten.content_html || post.content,
      secondary_keywords: [
        ...(post.secondary_keywords || []),
        ...(rewritten.new_secondary_keywords || [])
      ].slice(0, 10),
      seo_score: rewritten.new_seo_score || post.seo_score,
      readability_score: rewritten.readability_score || post.readability_score,
      word_count: rewritten.word_count || post.word_count,
      read_time_minutes: rewritten.read_time_minutes || post.read_time_minutes,
      status: 'published',
      last_optimized_at: new Date().toISOString(),
      optimization_history: updatedHistory
    });

    results.push({
      post_id: post.id,
      old_title: post.title,
      new_title: rewritten.new_title,
      word_count: rewritten.word_count,
      new_seo_score: rewritten.new_seo_score
    });
  }

  return Response.json({
    success: true,
    posts_rewritten: results.length,
    results
  });
});