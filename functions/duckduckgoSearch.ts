import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json();
    if (!query?.trim()) return Response.json({ error: 'No query provided' }, { status: 400 });

    // DuckDuckGo Instant Answer API (free, no key needed)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'NexusVectis/1.0' }
    });
    const ddgData = await ddgRes.json();

    // Also fetch HTML results via DuckDuckGo Lite (scrape-friendly)
    const liteUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const liteRes = await fetch(liteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NexusVectis)',
        'Accept': 'text/html'
      }
    });
    const html = await liteRes.text();

    // Parse results from DuckDuckGo HTML
    const results = [];
    const resultRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    const hrefs = [...html.matchAll(/<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    const snippets = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];

    for (let i = 0; i < Math.min(hrefs.length, 8); i++) {
      let url = hrefs[i][1];
      // DDG wraps URLs — decode if needed
      if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
        url = decodeURIComponent(url.replace('//duckduckgo.com/l/?uddg=', ''));
      }
      const title = hrefs[i][2].replace(/<[^>]+>/g, '').trim();
      const snippet = snippets[i] ? snippets[i][1].replace(/<[^>]+>/g, '').trim() : '';
      if (title && url && url.startsWith('http')) {
        results.push({ title, url, snippet });
      }
    }

    // Build response combining DDG instant answer + web results
    return Response.json({
      abstract: ddgData.AbstractText || null,
      abstract_source: ddgData.AbstractSource || null,
      abstract_url: ddgData.AbstractURL || null,
      answer: ddgData.Answer || null,
      definition: ddgData.Definition || null,
      definition_source: ddgData.DefinitionSource || null,
      image: ddgData.Image || null,
      infobox: ddgData.Infobox?.content || null,
      related_topics: (ddgData.RelatedTopics || []).slice(0, 5).map(t => ({
        text: t.Text || '',
        url: t.FirstURL || ''
      })).filter(t => t.text),
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});