import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * SEO POST RE-OPTIMIZER
 * 
 * Finds blog posts with status "needs_update" and uses Harbor Core
 * to rewrite + improve them based on latest SEO trends.
 * Also handles generating secondary posts from the topics queue.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const today = new Date().toISOString().split('T')[0];

  // ─── Find posts that need re-optimization ─────────────────────────────────
  const stalePosts = await base44.asServiceRole.entities.BlogPost.filter(
    { status: 'needs_update' },
    '-created_date',
    5 // Process max 5 at a time to avoid timeouts
  );

  const results = [];

  for (const post of stalePosts) {
    const reoptResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert SEO content optimizer for a B2B logistics platform called NexusVectis.

Re-optimize the following blog post to improve its SEO ranking in 2026.

Current Title: "${post.title}"
Primary Keyword: "${post.primary_keyword}"
Secondary Keywords: ${(post.secondary_keywords || []).join(', ')}
Current SEO Score: ${post.seo_score || 'unknown'}
Current Content (first 500 chars): ${(post.content || '').slice(0, 500)}...

Your task:
1. Rewrite the title to be more compelling and SEO-optimized for 2026
2. Rewrite the excerpt/meta description (max 155 chars, include primary keyword)
3. Suggest 3 specific improvements to the content structure
4. Add 2 new secondary keywords that are trending now
5. Recalculate expected SEO score (0-100)
6. Identify if this post should target a featured snippet and how

Search the web for current trends related to: "${post.primary_keyword}"`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          new_title: { type: "string" },
          new_excerpt: { type: "string" },
          content_improvements: { type: "array", items: { type: "string" } },
          new_secondary_keywords: { type: "array", items: { type: "string" } },
          new_seo_score: { type: "number" },
          featured_snippet_opportunity: { type: "boolean" },
          featured_snippet_strategy: { type: "string" },
          updated_content_html: { type: "string" }
        }
      }
    });

    const updatedHistory = [
      ...(post.optimization_history || []),
      {
        date: today,
        action: 're_optimization',
        previous_seo_score: post.seo_score,
        new_seo_score: reoptResult.new_seo_score,
        improvements: reoptResult.content_improvements
      }
    ];

    await base44.asServiceRole.entities.BlogPost.update(post.id, {
      title: reoptResult.new_title || post.title,
      excerpt: reoptResult.new_excerpt || post.excerpt,
      content: reoptResult.updated_content_html || post.content,
      secondary_keywords: [
        ...(post.secondary_keywords || []),
        ...(reoptResult.new_secondary_keywords || [])
      ].slice(0, 10),
      seo_score: reoptResult.new_seo_score || post.seo_score,
      status: 'published',
      last_optimized_at: new Date().toISOString(),
      optimization_history: updatedHistory
    });

    results.push({
      post_id: post.id,
      old_title: post.title,
      new_title: reoptResult.new_title,
      old_seo_score: post.seo_score,
      new_seo_score: reoptResult.new_seo_score,
      featured_snippet_opportunity: reoptResult.featured_snippet_opportunity
    });
  }

  // ─── Also generate a secondary blog post from the latest topic queue ──────
  const latestMetrics = await base44.asServiceRole.entities.SEOMetrics.filter(
    {},
    '-created_date',
    1
  );

  let bonusPost = null;
  if (latestMetrics[0]?.recommended_blog_topics?.length > 1) {
    const topics = latestMetrics[0].recommended_blog_topics;
    const topic = topics.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[1];

    if (topic) {
      const exists = await base44.asServiceRole.entities.BlogPost.filter({
        primary_keyword: topic.primary_keyword
      });

      if (exists.length === 0) {
        const postContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Write a comprehensive, SEO-optimized blog post for NexusVectis (AI fleet management platform).

Title: "${topic.title}"
Primary Keyword: "${topic.primary_keyword}"
Secondary Keywords: ${(topic.secondary_keywords || []).join(', ')}
Search Intent: ${topic.search_intent}

Requirements:
- 1000-1400 words
- Professional but accessible English  
- Include 2026 statistics
- Mention NexusVectis features naturally
- HTML format with H1, H2, H3 tags
- End with CTA to try FLEET AI`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              excerpt: { type: "string" },
              content_html: { type: "string" },
              word_count: { type: "number" },
              read_time_minutes: { type: "number" },
              seo_score: { type: "number" }
            }
          }
        });

        const slug = topic.primary_keyword
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 60);

        bonusPost = await base44.asServiceRole.entities.BlogPost.create({
          title: postContent.title || topic.title,
          slug,
          excerpt: postContent.excerpt || '',
          content: postContent.content_html || '',
          category: 'Logistics Intelligence',
          tags: [topic.primary_keyword, ...(topic.secondary_keywords || [])],
          primary_keyword: topic.primary_keyword,
          secondary_keywords: topic.secondary_keywords || [],
          seo_score: postContent.seo_score || 78,
          read_time_minutes: postContent.read_time_minutes || 5,
          word_count: postContent.word_count || 1200,
          search_intent: topic.search_intent || 'informational',
          status: 'published',
          ai_generated: true,
          ai_model: 'harbor-core',
          published_at: new Date().toISOString(),
          last_optimized_at: new Date().toISOString(),
          optimization_history: [{ date: today, action: 'initial_generation' }]
        });
      }
    }
  }

  return Response.json({
    success: true,
    posts_reoptimized: results.length,
    reoptimization_results: results,
    bonus_post_generated: bonusPost?.title || null
  });
});