/**
 * URL Crawler for HARBOR Training Data
 * Crawls one or more URLs and extracts clean text content
 * for use as HARBOR fine-tuning training data.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  if (req.method !== 'POST') {
    return nvError(requestId, String('Method not allowed'), 405);

  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return nvError(requestId, String('Provide an array of URLs to crawl'), 400);

    }

    const results = [];

    for (const rawUrl of urls) {
      const url = rawUrl.trim();
      if (!url) continue;

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HARBORCrawler/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          results.push({ url, success: false, error: `HTTP ${res.status}` });
          continue;
        }

        const contentType = res.headers.get('content-type') || '';
        const rawText = await res.text();

        let cleanText = '';

        if (contentType.includes('text/html') || url.endsWith('.html') || url.endsWith('.htm')) {
          // Strip HTML tags and clean up
          cleanText = rawText
            // Remove script and style blocks entirely
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
            // Remove HTML tags
            .replace(/<[^>]+>/g, ' ')
            // Decode common HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&hellip;/g, '...')
            // Collapse whitespace
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          // Plain text / JSON / markdown
          cleanText = rawText.replace(/\s+/g, ' ').trim();
        }

        // Truncate to ~20k chars to avoid too-large payloads
        if (cleanText.length > 20000) {
          cleanText = cleanText.slice(0, 20000) + '...';
        }

        results.push({
          url,
          success: true,
          content: cleanText,
          char_count: cleanText.length,
          content_type: contentType,
        });

      } catch (err) {
        results.push({ url, success: false, error: err.message });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return nvJson(requestId, {
      results,
      summary: {
        total: urls.length,
        successful: successful.length,
        failed: failed.length,
        total_chars: successful.reduce((sum, r) => sum + (r.char_count || 0), 0),
      }
    });


  } catch (error) {
    console.error('Crawl error:', error);
    return nvError(requestId, String(error.message), 500);

  }
});