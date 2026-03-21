import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * SEO KEYWORD & COMPETITOR ANALYSIS ENGINE
 * Part 1 of SEO Intelligence: Trending keywords, competitor research, technical SEO
 * Runs Mon/Wed/Fri to analyze market trends and opportunities
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

    // ─── Fetch latest algorithm monitor data ─────────────────────────────────
    const latestMetrics = await base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1);
    const algorithmMonitor = latestMetrics[0]?.algorithm_monitor || {
      latest_updates: [],
      adaptation_plan: { immediate_actions: [], algorithm_readiness_score: 0 },
      eeat_assessment: { current_score: 0 }
    };

    const algoContext = (algorithmMonitor.latest_updates || []).length > 0
      ? `\nIMPORTANT — ADAPT ALL RECOMMENDATIONS TO THESE RECENT GOOGLE ALGORITHM CHANGES:\n${algorithmMonitor.latest_updates.map(u => `- ${u.update_name} (${u.date_announced}): ${u.summary}. NexusVectis impact: ${u.nexusvectis_impact}`).join('\n')}\nImmediate priorities: ${(algorithmMonitor.adaptation_plan?.immediate_actions || []).join('; ')}\nAvoid: ${(algorithmMonitor.adaptation_plan?.what_to_avoid || []).join('; ')}`
      : '';

    // ─── Deep SEO Intelligence ────────────────────────────────────────────────
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

    // ─── Save to SEOMetrics ───────────────────────────────────────────────────
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
      algorithm_monitor: algorithmMonitor,
      ai_summary: trendAnalysis.ai_summary || '',
    });

    return Response.json({
      success: true,
      date: today,
      metrics_id: metricsRecord.id,
      seo_health_score: trendAnalysis.seo_health_score,
      technical_seo_score: trendAnalysis.technical_seo?.overall_score,
      trending_keywords_found: (trendAnalysis.trending_keywords || []).length,
      competitors_analyzed: (trendAnalysis.competitor_analysis || []).length,
      content_gaps_found: (trendAnalysis.content_gaps || []).length,
      backlink_opportunities: (trendAnalysis.backlink_opportunities || []).length,
      projected_organic_traffic: trendAnalysis.projected_organic_traffic || 0,
      action_items: trendAnalysis.action_items || [],
      ai_summary: trendAnalysis.ai_summary || ''
    });
  } catch (error) {
    console.error('SEO Keyword Analysis Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});