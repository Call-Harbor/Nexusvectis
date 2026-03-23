import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * GOOGLE ALGORITHM MONITOR
 * Tracks Google algorithm updates and SEO ranking factor changes
 * Runs monthly to detect core updates, spam updates, helpful content changes
 * Saves results to SEOMetrics for the main SEO engine to reference
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

    // ─── Deep algorithm intelligence with web search ───────────────────────
    const algorithmMonitor = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a Google algorithm expert and SEO news tracker. Today is ${today}.

Search the web RIGHT NOW for:
1. Any Google core algorithm updates, broad core updates, spam updates, helpful content updates, or SERP changes in the LAST 60 DAYS.
2. Any confirmed Google ranking factor changes in the last 60 days.
3. Major SEO signals from Google Search Central blog, Search Engine Land, Search Engine Journal, Semrush/Ahrefs blogs.

For each update: what changed, winners vs losers, specific adaptation for NexusVectis (B2B SaaS logistics platform at nexusvectis.com).

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

    // ─── Save to latest SEOMetrics record ──────────────────────────────────
    const latestMetrics = await base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1);
    
    if (latestMetrics.length > 0) {
      await base44.asServiceRole.entities.SEOMetrics.update(latestMetrics[0].id, {
        algorithm_monitor: algorithmMonitor
      });
    } else {
      // Create new record if none exists
      await base44.asServiceRole.entities.SEOMetrics.create({
        date: today,
        algorithm_monitor: algorithmMonitor,
        trending_keywords: [],
        content_gaps: []
      });
    }

    return Response.json({
      success: true,
      date: today,
      updates_detected: (algorithmMonitor.latest_updates || []).length,
      algorithm_readiness_score: algorithmMonitor.adaptation_plan?.algorithm_readiness_score || 0,
      eeat_score: algorithmMonitor.eeat_assessment?.current_score || 0,
      immediate_actions: algorithmMonitor.adaptation_plan?.immediate_actions || [],
      summary: algorithmMonitor.adaptation_plan?.summary || ''
    });
  } catch (error) {
    console.error('Algorithm Monitor Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});