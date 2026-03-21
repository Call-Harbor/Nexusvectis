import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * ADVANCED SEO INTELLIGENCE ENGINE v4
 * 0. Google Algorithm Monitor — detect recent core updates & adapt strategy in real-time
 * 1. Deep SEO Intelligence with algorithm-aware context
 * 2. A/B winner analysis
 * 3. Blog post lifecycle management
 * 4. Save enriched SEO Metrics
 * 5. Auto-generate top-priority blog post
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

  try {
    const today = new Date().toISOString().split('T')[0];

  // ─── STEP 0: Google Algorithm Monitor ─────────────────────────────────────
  const algorithmMonitor = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a Google algorithm expert and SEO news tracker. Today is ${today}.

Search the web RIGHT NOW for:
1. Any Google core algorithm updates, broad core updates, spam updates, helpful content updates, or SERP changes in the LAST 60 DAYS.
2. Any confirmed Google ranking factor changes in the last 60 days.
3. Major SEO signals from Google Search Central blog, Search Engine Land, Search Engine Journal, Semrush/Ahrefs blogs.

For each update: what changed, winners vs losers, specific adaptation for NexusVectis (B2B SaaS logistics platform).

Also assess E-E-A-T status for nexusvectis.com and how to appear in Google AI Overviews.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        latest_updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              update_name: { type: "string" },
              date_announced: { type: "string" },
              update_type: { type: "string" },
              summary: { type: "string" },
              winners: { type: "array", items: { type: "string" } },
              losers: { type: "array", items: { type: "string" } },
              impact_level: { type: "string" },
              nexusvectis_impact: { type: "string" }
            }
          }
        },
        ranking_factor_changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              factor: { type: "string" },
              change: { type: "string" },
              importance_now: { type: "string" }
            }
          }
        },
        adaptation_plan: {
          type: "object",
          properties: {
            immediate_actions: { type: "array", items: { type: "string" } },
            content_strategy_adjustments: { type: "array", items: { type: "string" } },
            technical_adjustments: { type: "array", items: { type: "string" } },
            what_to_avoid: { type: "array", items: { type: "string" } },
            opportunity_windows: { type: "array", items: { type: "string" } },
            algorithm_readiness_score: { type: "number" },
            summary: { type: "string" }
          }
        },
        eeat_assessment: {
          type: "object",
          properties: {
            current_score: { type: "number" },
            experience_gaps: { type: "array", items: { type: "string" } },
            expertise_gaps: { type: "array", items: { type: "string" } },
            authoritativeness_gaps: { type: "array", items: { type: "string" } },
            trustworthiness_gaps: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        ai_overview_strategy: {
          type: "object",
          properties: {
            is_ai_overviews_active: { type: "boolean" },
            how_to_appear_in_ai_overviews: { type: "array", items: { type: "string" } },
            content_formats_favored: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });

  // Build algorithm context to inject into main analysis
  const algoContext = (algorithmMonitor.latest_updates || []).length > 0
    ? `\nIMPORTANT — ADAPT ALL RECOMMENDATIONS TO THESE RECENT GOOGLE ALGORITHM CHANGES:\n${algorithmMonitor.latest_updates.map(u => `- ${u.update_name} (${u.date_announced}): ${u.summary}. NexusVectis impact: ${u.nexusvectis_impact}`).join('\n')}\nImmediate priorities: ${(algorithmMonitor.adaptation_plan?.immediate_actions || []).join('; ')}\nAvoid: ${(algorithmMonitor.adaptation_plan?.what_to_avoid || []).join('; ')}`
    : '';

  // ─── STEP 1: Core SEO Intelligence ───
  const trendAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class SEO strategist for B2B SaaS logistics and fleet management.

Today: ${today}. Platform: NexusVectis (nexusvectis.com) — AI-powered fleet management.
${algoContext}

Provide SEO analysis:

1. TOP 15 trending keywords: keyword, monthly_searches, difficulty (1-10), cpc_eur, trend, intent, why_trending
2. COMPETITOR DEEP-DIVE (Samsara, Geotab, Trimble): name, top_keywords (5), estimated_monthly_traffic, content_strengths (3), exploitable_gaps (3), backlink_estimate
3. Top 8 content gaps
4. 6 BACKLINK opportunities: domain, da_estimate, approach, outreach_subject, estimated_link_value
5. TECHNICAL SEO: overall_score, core_web_vitals_status, mobile_score, critical_fixes (3), schema_priorities (3)
6. 10 blog topics: title, primary_keyword, secondary_keywords, search_intent, monthly_searches, priority_score, why_now
7. 6 variants each: title_tag_variants, meta_description_variants, hero_headline_variants, hero_subline_variants, cta_text_variants
8. Metrics: seo_health_score, projected_organic_traffic, ai_summary (2 paragraphs), action_items (5)

Data-driven for 2026.`,
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
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              top_keywords: { type: "array", items: { type: "string" } },
              estimated_monthly_traffic: { type: "number" },
              content_strengths: { type: "array", items: { type: "string" } },
              exploitable_gaps: { type: "array", items: { type: "string" } },
              backlink_estimate: { type: "number" }
            }
          }
        },
        content_gaps: { type: "array", items: { type: "string" } },
        backlink_opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              da_estimate: { type: "number" },
              approach: { type: "string" },
              outreach_subject: { type: "string" },
              estimated_link_value: { type: "string" }
            }
          }
        },
        technical_seo: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            core_web_vitals_status: { type: "string" },
            mobile_score: { type: "number" },
            critical_fixes: { type: "array", items: { type: "string" } },
            schema_priorities: { type: "array", items: { type: "string" } }
          }
        },
        recommended_topics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              primary_keyword: { type: "string" },
              secondary_keywords: { type: "array", items: { type: "string" } },
              search_intent: { type: "string" },
              monthly_searches: { type: "number" },
              priority_score: { type: "number" },
              why_now: { type: "string" }
            }
          }
        },
        title_tag_variants: { type: "array", items: { type: "string" } },
        meta_description_variants: { type: "array", items: { type: "string" } },
        hero_headline_variants: { type: "array", items: { type: "string" } },
        hero_subline_variants: { type: "array", items: { type: "string" } },
        cta_text_variants: { type: "array", items: { type: "string" } },
        seo_health_score: { type: "number" },
        projected_organic_traffic: { type: "number" },
        action_items: { type: "array", items: { type: "string" } },
        ai_summary: { type: "string" }
      }
    }
  });

  // ─── STEP 2: Fetch A/B winner data ────────────────────────────────────────
  const abRecords = await base44.asServiceRole.entities.ABTestConversion.list('-created_date', 1000).catch(() => []);
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
      abWinners[type] = {
        value: winner.value,
        conversion_rate: ((winner.conversions / winner.impressions) * 100).toFixed(1) + '%',
        impressions: winner.impressions,
        conversions: winner.conversions
      };
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
    competitor_analysis: { competitors: trendAnalysis.competitor_analysis || [] },
    backlink_opportunities: trendAnalysis.backlink_opportunities || [],
    technical_seo_audit: trendAnalysis.technical_seo || {},
    home_page_seo_score: trendAnalysis.seo_health_score || 0,
    home_page_suggestions: trendAnalysis.action_items || [],
    schema_markup_suggestions: trendAnalysis.technical_seo?.schema_priorities || [],
    meta_description_variants: trendAnalysis.meta_description_variants || [],
    title_tag_variants: trendAnalysis.title_tag_variants || [],
    hero_headline_variants: trendAnalysis.hero_headline_variants || [],
    hero_subline_variants: trendAnalysis.hero_subline_variants || [],
    cta_text_variants: trendAnalysis.cta_text_variants || [],
    recommended_blog_topics: trendAnalysis.recommended_topics || [],
    projected_organic_traffic: trendAnalysis.projected_organic_traffic || 0,
    ab_test_winner: abWinners,
    algorithm_monitor: algorithmMonitor,
    ai_summary: trendAnalysis.ai_summary || '',
  });

  // ─── STEP 5: Auto-generate blog post (simplified) ─────────────────────
  const topTopic = (trendAnalysis.recommended_topics || [])
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))[0];

  let generatedPost = null;
  if (topTopic) {
    const algoWritingContext = (algorithmMonitor.adaptation_plan?.content_strategy_adjustments || []).length > 0
      ? `\nAlign with these algorithm changes: ${algorithmMonitor.adaptation_plan.content_strategy_adjustments.join('; ')}`
      : '';

    const postContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Write an SEO-optimized blog post for NexusVectis fleet management platform.

Topic: "${topTopic.title}"
Keyword: "${topTopic.primary_keyword}"
Intent: ${topTopic.search_intent}
Why: ${topTopic.why_now}
${algoWritingContext}

Requirements:
- 1600-2000 words with H1, H2, H3 structure
- Keyword in first paragraph and 4+ headings
- 2026 data and statistics
- Section on "How NexusVectis Addresses This"
- 3 FAQ questions
- Internal links to: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage
- CTA: "Start with FLEET AI — book demo"

Return complete HTML.`,
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
      seo_score: postContent.seo_score || 85,
      readability_score: postContent.readability_score || 72,
      read_time_minutes: postContent.read_time_minutes || 8,
      word_count: postContent.word_count || 1800,
      search_intent: topTopic.search_intent || 'informational',
      competitor_gap: true,
      status: 'published',
      ai_generated: true,
      ai_model: 'gemini-3-flash',
      published_at: new Date().toISOString(),
      internal_links: postContent.internal_links || [],
      last_optimized_at: new Date().toISOString(),
      optimization_history: [{ date: today, action: 'initial_generation_v4_algo_aware', seo_score: postContent.seo_score || 85 }]
    });
  }

    return Response.json({
      success: true,
      date: today,
      metrics_id: metricsRecord.id,
      seo_health_score: trendAnalysis.seo_health_score,
      technical_seo_score: trendAnalysis.technical_seo?.overall_score,
      algorithm_readiness_score: algorithmMonitor.adaptation_plan?.algorithm_readiness_score,
      algorithm_updates_detected: (algorithmMonitor.latest_updates || []).length,
      eeat_score: algorithmMonitor.eeat_assessment?.current_score,
      trending_keywords_found: (trendAnalysis.trending_keywords || []).length,
      competitors_analyzed: (trendAnalysis.competitor_analysis || []).length,
      content_gaps_found: (trendAnalysis.content_gaps || []).length,
      backlink_opportunities: (trendAnalysis.backlink_opportunities || []).length,
      ab_winners_detected: Object.keys(abWinners).length,
      posts_flagged_for_update: postsNeedingUpdate.length,
      new_post_generated: generatedPost?.title || null,
      new_post_id: generatedPost?.id || null,
      projected_organic_traffic: trendAnalysis.projected_organic_traffic || 0,
      action_items: trendAnalysis.action_items || [],
      algorithm_immediate_actions: algorithmMonitor.adaptation_plan?.immediate_actions || [],
      ai_summary: trendAnalysis.ai_summary || ''
    });
  } catch (error) {
    console.error('SEO Intelligence Engine Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});