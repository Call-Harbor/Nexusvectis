import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * SEO BLOG LIFECYCLE & A/B TEST MANAGER
 * Part 2 of SEO Intelligence: A/B test winners, blog post lifecycle tracking
 * Runs Mon/Wed/Fri to analyze conversion data and flag outdated content
 */

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return nvError(requestId, String('Forbidden'), 403);

    }
  } catch (_) {
    // Automation / service role — proceed
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // ─── A/B Test Winner Analysis ─────────────────────────────────────────────
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

    // ─── Blog Post Lifecycle Management ───────────────────────────────────────
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

    // ─── Update latest SEOMetrics with A/B data ───────────────────────────────
    const latestMetrics = await base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1);
    if (latestMetrics.length > 0) {
      await base44.asServiceRole.entities.SEOMetrics.update(latestMetrics[0].id, {
        ab_test_winner: abWinners
      });
    }

    return nvJson(requestId, {
      success: true,
      date: today,
      ab_winners_detected: Object.keys(abWinners).length,
      ab_winners: abWinners,
      posts_flagged_for_update: postsNeedingUpdate.length,
      posts_flagged: postsNeedingUpdate,
      total_published_posts: existingPosts.length,
      total_ab_records_analyzed: abRecords.length
    });

  } catch (error) {
    console.error('SEO Blog Lifecycle Error:', error);
    return nvJson(requestId, { 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, 500);

  }
});