import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Weekly Blog Post Analyzer
 * Analyzes all published blog posts and generates top 3 concrete improvement suggestions per post.
 * Designed to run weekly via automation.
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

  // Fetch all published posts
  const posts = await base44.asServiceRole.entities.BlogPost.filter(
    { status: 'published' }, '-published_at', 100
  );

  if (!posts || posts.length === 0) {
    return Response.json({ success: true, message: 'No published posts found.', analyzed: 0 });
  }

  let analyzed = 0;
  const results = [];

  for (const post of posts) {
    // Build a compact summary of the post to send to AI (avoid sending full HTML)
    const postSummary = `
Title: ${post.title}
Primary Keyword: ${post.primary_keyword}
Secondary Keywords: ${(post.secondary_keywords || []).join(', ')}
Excerpt: ${post.excerpt}
Word Count: ${post.word_count || 'unknown'}
SEO Score: ${post.seo_score || 'unknown'}/100
Internal Links: ${(post.internal_links || []).length} links (${(post.internal_links || []).join(', ') || 'none'})
Tags: ${(post.tags || []).join(', ')}
Search Intent: ${post.search_intent || 'unknown'}
Published: ${post.published_at ? post.published_at.split('T')[0] : 'unknown'}
Last Optimized: ${post.last_optimized_at ? post.last_optimized_at.split('T')[0] : 'never'}
Content Preview (first 500 chars): ${(post.content || '').replace(/<[^>]+>/g, '').slice(0, 500)}
    `.trim();

    const suggestions = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert SEO content strategist for NexusVectis, a B2B SaaS logistics and fleet management platform (nexusvectis.com).

Analyze this blog post and generate exactly 3 CONCRETE, ACTIONABLE improvement suggestions to increase its organic search performance. Be very specific — name actual headings, keywords, links, or statistics to add/change.

Available internal pages to link to: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo, /Blog, /Integrations, /Features, /Pricing.

POST DATA:
${postSummary}

Focus on the highest-impact improvements from these categories:
- internal_links: Missing internal links that would boost topical authority
- outdated_data: Statistics, dates, or facts that likely need updating in 2026
- headings: H2/H3 subheadings that could be rewritten to target better keywords
- keyword: Primary or secondary keyword usage gaps in the content
- readability: Structural improvements (bullet points, tables, shorter paragraphs)
- cta: Call-to-action improvements

Return exactly 3 suggestions ordered by priority (high first).`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                priority: { type: "string" },
                suggestion: { type: "string" },
                impact: { type: "string" }
              }
            }
          }
        }
      }
    });

    const topSuggestions = (suggestions.suggestions || []).slice(0, 3);

    await base44.asServiceRole.entities.BlogPost.update(post.id, {
      ai_improvement_suggestions: topSuggestions,
      suggestions_generated_at: new Date().toISOString()
    });

    results.push({ id: post.id, title: post.title, suggestions: topSuggestions.length });
    analyzed++;
  }

  return Response.json({
    success: true,
    date: today,
    analyzed,
    results
  });
});