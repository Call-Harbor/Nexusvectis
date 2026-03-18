import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * ADVANCED SEO INTELLIGENCE ENGINE v2
 *
 * Full pipeline:
 * 1. Deep trend + competitor intelligence (with internet context)
 * 2. SERP features + backlink opportunities
 * 3. Semantic topic cluster strategy
 * 4. Full A/B variant generation (title, meta, hero H1, subline, CTA)
 * 5. CRO suggestions from intent analysis
 * 6. Blog post lifecycle management
 * 7. Auto-generate top-priority blog post
 * 8. Inject A/B winner data from ABTestConversion
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled + admin manual trigger
  try {
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (_) {
    // Automation / service role — proceed
  }

  const today = new Date().toISOString().split('T')[0];

  // ─── STEP 1: Deep SEO Intelligence (internet-connected) ───────────────────
  const trendAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class SEO strategist specializing in B2B SaaS logistics, fleet management, and supply chain AI.

Today: ${today}. Platform: NexusVectis — AI-powered fleet management & logistics intelligence (nexusvectis.com).

Perform a DEEP, ADVANCED SEO intelligence analysis. Return:

1. TOP 20 trending keywords (fleet management AI, logistics software, route optimization, predictive maintenance, TMS, shipment tracking, supply chain automation, ETA prediction, cold chain, swarm intelligence logistics) — with monthly_searches, difficulty (1-10), cpc_eur, trend (rising/stable/declining), intent, and a short "why_trending" note.

2. COMPETITOR ANALYSIS: Analyze top 5 competitors (Samsara, Geotab, Trimble, Oracle TMS, SAP TM). For each: name, their top 3 ranking keywords, content strengths, and 2 gaps we can exploit.

3. CONTENT GAPS: 10 high-value topics competitors rank for that NexusVectis likely doesn't.

4. SERP FEATURE OPPORTUNITIES: 5 keywords where we can win featured snippets, People Also Ask boxes, or rich results. For each: keyword, serp_feature (featured_snippet/paa/rich_result), content_format (how-to/list/table/faq), suggested_title.

5. BACKLINK OPPORTUNITIES: 5 high-authority domains in logistics/tech that accept guest posts or have resource pages we could get links from. For each: domain, da_estimate, link_type (guest_post/resource_page/mention), approach.

6. SEMANTIC TOPIC CLUSTERS: 3 pillar content clusters (e.g. "Fleet AI", "Predictive Maintenance", "Route Optimization"). Each cluster: pillar_title, pillar_keyword, 4 cluster_posts (title + keyword).

7. A/B VARIANTS (5 each):
   - title_tag_variants: 5 homepage title tags (50-60 chars)
   - meta_description_variants: 5 meta descriptions (max 155 chars)
   - hero_headline_variants: 5 powerful H1 headlines for the hero section
   - hero_subline_variants: 5 compelling sublines/descriptions (max 25 words)
   - cta_text_variants: 5 CTA button texts (max 4 words)

8. FAQ SUGGESTIONS: 5 questions people actively search for + detailed answers.

9. CRO SUGGESTIONS: 5 conversion rate optimization tips derived from keyword intent analysis.

10. PROJECTED TRAFFIC: Estimate monthly organic traffic gain if top 5 recommendations are implemented.

11. PAGE SPEED SUGGESTIONS: 3 Core Web Vitals improvements for a React SPA.

12. SEO HEALTH SCORE (0-100) + 8 prioritized action items.

13. AI SUMMARY: 3-paragraph narrative of current SEO status and 90-day strategy.

Be extremely specific, data-driven, and actionable for 2026.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        trending_keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              keyword: { type: "string" },
              monthly_searches: { type: "number" },
              difficulty: { type: "number" },
              cpc_eur: { type: "number" },
              trend: { type: "string" },
              intent: { type: "string" },
              why_trending: { type: "string" }
            }
          }
        },
        competitor_analysis: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  top_keywords: { type: "array", items: { type: "string" } },
                  content_strengths: { type: "array", items: { type: "string" } },
                  exploitable_gaps: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        content_gaps: { type: "array", items: { type: "string" } },
        serp_features_opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              keyword: { type: "string" },
              serp_feature: { type: "string" },
              content_format: { type: "string" },
              suggested_title: { type: "string" }
            }
          }
        },
        backlink_opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              da_estimate: { type: "number" },
              link_type: { type: "string" },
              approach: { type: "string" }
            }
          }
        },
        semantic_clusters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pillar_title: { type: "string" },
              pillar_keyword: { type: "string" },
              cluster_posts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    keyword: { type: "string" }
                  }
                }
              }
            }
          }
        },
        title_tag_variants: { type: "array", items: { type: "string" } },
        meta_description_variants: { type: "array", items: { type: "string" } },
        hero_headline_variants: { type: "array", items: { type: "string" } },
        hero_subline_variants: { type: "array", items: { type: "string" } },
        cta_text_variants: { type: "array", items: { type: "string" } },
        faq_suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" }
            }
          }
        },
        conversion_rate_suggestions: { type: "array", items: { type: "string" } },
        projected_organic_traffic: { type: "number" },
        page_speed_suggestions: { type: "array", items: { type: "string" } },
        recommended_topics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              primary_keyword: { type: "string" },
              secondary_keywords: { type: "array", items: { type: "string" } },
              search_intent: { type: "string" },
              difficulty: { type: "number" },
              monthly_searches: { type: "number" },
              why_now: { type: "string" },
              priority_score: { type: "number" }
            }
          }
        },
        seo_health_score: { type: "number" },
        action_items: { type: "array", items: { type: "string" } },
        ai_summary: { type: "string" }
      }
    }
  });

  // ─── STEP 2: Fetch current A/B winner data from conversion records ─────────
  const abRecords = await base44.asServiceRole.entities.ABTestConversion.list('-created_date', 500).catch(() => []);
  const abWinners = {};

  if (abRecords && abRecords.length > 0) {
    const byType = {};
    for (const r of abRecords) {
      const t = r.variant_type;
      if (!byType[t]) byType[t] = {};
      const key = r.variant_index;
      if (!byType[t][key]) byType[t][key] = { value: r.variant_value, impressions: 0, conversions: 0 };
      byType[t][key].impressions++;
      if (r.converted) byType[t][key].conversions++;
    }
    for (const [type, variants] of Object.entries(byType)) {
      const qualified = Object.entries(variants).filter(([, v]) => v.impressions >= 5);
      if (qualified.length === 0) continue;
      const winner = qualified.reduce((best, [, v]) =>
        (v.conversions / v.impressions) > (best.conversions / best.impressions) ? v : best,
        qualified[0][1]
      );
      abWinners[type] = { value: winner.value, conversion_rate: ((winner.conversions / winner.impressions) * 100).toFixed(1) + '%' };
    }
  }

  // ─── STEP 3: Blog post lifecycle management ────────────────────────────────
  const existingPosts = await base44.asServiceRole.entities.BlogPost.filter(
    { status: 'published' }, '-published_at', 50
  ).catch(() => []);

  const postsNeedingUpdate = [];
  const now = new Date();
  for (const post of existingPosts) {
    const lastOptimized = post.last_optimized_at ? new Date(post.last_optimized_at) : new Date(post.created_date);
    const daysSince = (now - lastOptimized) / (1000 * 60 * 60 * 24);
    if (daysSince > 30 || (post.seo_score && post.seo_score < 70)) {
      postsNeedingUpdate.push(post.id);
      await base44.asServiceRole.entities.BlogPost.update(post.id, { status: 'needs_update' });
    }
  }

  // ─── STEP 4: Save enriched SEO Metrics ────────────────────────────────────
  const metricsRecord = await base44.asServiceRole.entities.SEOMetrics.create({
    date: today,
    trending_keywords: trendAnalysis.trending_keywords || [],
    content_gaps: trendAnalysis.content_gaps || [],
    home_page_seo_score: trendAnalysis.seo_health_score || 0,
    home_page_suggestions: trendAnalysis.action_items || [],
    faq_suggestions: trendAnalysis.faq_suggestions || [],
    meta_description_variants: trendAnalysis.meta_description_variants || [],
    title_tag_variants: trendAnalysis.title_tag_variants || [],
    hero_headline_variants: trendAnalysis.hero_headline_variants || [],
    hero_subline_variants: trendAnalysis.hero_subline_variants || [],
    cta_text_variants: trendAnalysis.cta_text_variants || [],
    recommended_blog_topics: trendAnalysis.recommended_topics || [],
    competitor_analysis: trendAnalysis.competitor_analysis || {},
    internal_linking_suggestions: [],
    schema_markup_suggestions: [],
    serp_features_opportunities: trendAnalysis.serp_features_opportunities || [],
    backlink_opportunities: trendAnalysis.backlink_opportunities || [],
    page_speed_suggestions: trendAnalysis.page_speed_suggestions || [],
    semantic_clusters: trendAnalysis.semantic_clusters || [],
    conversion_rate_suggestions: trendAnalysis.conversion_rate_suggestions || [],
    projected_organic_traffic: trendAnalysis.projected_organic_traffic || 0,
    ab_test_winner: abWinners,
    ai_summary: trendAnalysis.ai_summary || '',
  });

  // ─── STEP 5: Auto-generate top-priority blog post ─────────────────────────
  const topTopic = (trendAnalysis.recommended_topics || [])
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];

  let generatedPost = null;
  if (topTopic) {
    const postContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert content writer for B2B logistics and fleet management.

Write a comprehensive, SEO-optimized blog post for NexusVectis (AI-powered fleet management platform).

Topic: "${topTopic.title}"
Primary Keyword: "${topTopic.primary_keyword}"
Secondary Keywords: ${(topTopic.secondary_keywords || []).join(', ')}
Search Intent: ${topTopic.search_intent}
Why now: ${topTopic.why_now}

Requirements:
- 1400-2000 words
- Proper H1, H2, H3 structure with keywords naturally placed
- Primary keyword in first 100 words and in at least 3 headings
- Include real 2026 statistics and data points
- Dedicated section: "How NexusVectis Solves This"
- End with CTA: "Start with FLEET AI"
- Professional but accessible English
- Natural internal links to: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo

Return full HTML with semantic tags.`,
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
          internal_links: { type: "array", items: { type: "string" } }
        }
      }
    });

    const slug = topTopic.primary_keyword
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 60);

    generatedPost = await base44.asServiceRole.entities.BlogPost.create({
      title: postContent.title || topTopic.title,
      slug,
      excerpt: postContent.excerpt || '',
      content: postContent.content_html || '',
      category: 'Fleet Intelligence',
      tags: [topTopic.primary_keyword, ...(topTopic.secondary_keywords || [])],
      primary_keyword: topTopic.primary_keyword,
      secondary_keywords: topTopic.secondary_keywords || [],
      seo_score: postContent.seo_score || 82,
      readability_score: postContent.readability_score || 72,
      read_time_minutes: postContent.read_time_minutes || 7,
      word_count: postContent.word_count || 1600,
      search_intent: topTopic.search_intent || 'informational',
      competitor_gap: true,
      status: 'published',
      ai_generated: true,
      ai_model: 'gemini-3-flash',
      published_at: new Date().toISOString(),
      internal_links: postContent.internal_links || [],
      last_optimized_at: new Date().toISOString(),
      optimization_history: [{ date: today, action: 'initial_generation', seo_score: postContent.seo_score || 82 }]
    });
  }

  return Response.json({
    success: true,
    date: today,
    metrics_id: metricsRecord.id,
    seo_health_score: trendAnalysis.seo_health_score,
    trending_keywords_found: (trendAnalysis.trending_keywords || []).length,
    content_gaps_found: (trendAnalysis.content_gaps || []).length,
    serp_opportunities: (trendAnalysis.serp_features_opportunities || []).length,
    backlink_opportunities: (trendAnalysis.backlink_opportunities || []).length,
    semantic_clusters: (trendAnalysis.semantic_clusters || []).length,
    ab_winners_detected: Object.keys(abWinners).length,
    posts_flagged_for_update: postsNeedingUpdate.length,
    new_post_generated: generatedPost?.title || null,
    new_post_id: generatedPost?.id || null,
    projected_organic_traffic: trendAnalysis.projected_organic_traffic || 0,
    action_items: trendAnalysis.action_items || [],
    ai_summary: trendAnalysis.ai_summary || ''
  });
});