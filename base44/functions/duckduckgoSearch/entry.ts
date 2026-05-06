import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return nvError(requestId, String('Unauthorized'), 401);


    const { query } = await req.json();
    if (!query?.trim()) return nvError(requestId, String('No query provided'), 400);


    // DuckDuckGo Instant Answer API (free, no key)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=nexusvectis`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'NexusVectis/1.0' }
    });
    const ddgData = await ddgRes.json();

    const relatedTopics = (ddgData.RelatedTopics || [])
      .filter(t => t.Text && t.FirstURL)
      .slice(0, 6)
      .map(t => ({ text: t.Text, url: t.FirstURL }));

    // If DDG has no results, supplement with LLM internet search for links
    let supplementLinks = [];
    if (!ddgData.AbstractText && relatedTopics.length === 0) {
      const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Find 5 relevant web links for: "${query}". Return only URLs and titles, no commentary.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            links: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" }, snippet: { type: "string" } } }
            }
          }
        }
      });
      supplementLinks = llmResult?.links || [];
    }

    return nvJson(requestId, {
      abstract: ddgData.AbstractText || null,
      abstract_source: ddgData.AbstractSource || null,
      abstract_url: ddgData.AbstractURL || null,
      answer: ddgData.Answer || null,
      definition: ddgData.Definition || null,
      definition_source: ddgData.DefinitionSource || null,
      image: ddgData.Image ? `https://duckduckgo.com${ddgData.Image}` : null,
      related_topics: relatedTopics,
      supplement_links: supplementLinks
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});