import type { APIRoute } from 'astro';
import { rewriteArticleWithAI, formatJournalisticHeadline } from '../../lib/rewriter';
import { addPost } from '../../lib/db';
import { submitToGoogleIndexing } from '../../lib/google-indexing';
import { AUTH_COOKIE_NAME, isAuthenticated } from '../../lib/auth';
import type { RawFeedItem } from '../../lib/feeds';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Check authentication (Bearer token or admin cookie)
    const authHeader = request.headers.get('Authorization');
    const cookieAuth = cookies.get(AUTH_COOKIE_NAME)?.value;
    const isTokenValid = authHeader === 'Bearer hollywoodtime_secret_key_2026';
    const isCookieValid = isAuthenticated(cookieAuth);

    if (!isTokenValid && !isCookieValid) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please sign in to admin.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = (locals as any)?.runtime?.env?.DB;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const input = (body.url || body.topic || body.source || '').trim();
    if (!input) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a valid news URL or news topic.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const autoPublish = Boolean(body.autoPublish);
    const customApiKey = body.geminiApiKey || process.env.GEMINI_API_KEY;
    const serviceAccountJson = body.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    let feedItem: RawFeedItem;

    const isUrl = input.startsWith('http://') || input.startsWith('https://');

    if (isUrl) {
      // 1. Fetch live article HTML from URL
      try {
        const fetchRes = await fetch(input, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!fetchRes.ok) {
          throw new Error(`Target website responded with status ${fetchRes.status}`);
        }

        const html = await fetchRes.text();

        // Extract metadata using regex (lightweight, zero-dependency for Cloudflare Worker edge)
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
        const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1] || input;

        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                            html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const rawDesc = ogDescMatch?.[1] || '';

        const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
        const rawImage = ogImageMatch?.[1] || '';

        feedItem = {
          title: formatJournalisticHeadline(rawTitle),
          description: rawDesc || `Breaking entertainment development reported by industry sources.`,
          link: input,
          imageUrl: rawImage || undefined,
          pubDate: new Date().toISOString(),
        };
      } catch (fetchErr: any) {
        // If scraping fails (e.g. anti-bot/403), gracefully fall back to title-based topic ingestion
        const fallbackTitle = input.replace(/^https?:\/\/[^\/]+\//, '').replace(/[-_/]/g, ' ').slice(0, 80);
        feedItem = {
          title: formatJournalisticHeadline(fallbackTitle || input),
          description: `Direct news link provided from ${input}. Industry coverage and editorial report.`,
          link: input,
          pubDate: new Date().toISOString(),
        };
      }
    } else {
      // 2. Direct topic / breaking headline entered by admin
      feedItem = {
        title: formatJournalisticHeadline(input),
        description: `Breaking Hollywood development: ${input}. In-depth analysis of theatrical, studio, and cultural implications.`,
        link: `https://www.hollywoodtime.com/news/${encodeURIComponent(input.slice(0, 40))}`,
        pubDate: new Date().toISOString(),
      };
    }

    // 3. Transform and rewrite with AI / Journalistic Narrative Engine
    const rewrittenPost = await rewriteArticleWithAI(feedItem, customApiKey);

    // If user provided a specific category override
    if (body.category) {
      rewrittenPost.category = body.category.toLowerCase();
      rewrittenPost.categoryLabel = body.category.charAt(0).toUpperCase() + body.category.slice(1);
    }

    let isPublished = false;
    let indexResult: any = null;

    // 4. If autoPublish requested, persist immediately to Cloudflare D1 & Index
    if (autoPublish) {
      const saveRes = await addPost(rewrittenPost, db);
      isPublished = saveRes.success;

      const postUrl = `https://www.hollywoodtime.com/news/${rewrittenPost.slug}`;
      indexResult = await submitToGoogleIndexing(postUrl, serviceAccountJson);
      rewrittenPost.indexedInGoogle = indexResult.success;
      rewrittenPost.googleIndexedAt = new Date().toISOString();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: autoPublish
          ? 'AI Fetch succeeded! Article rewritten, published to Cloudflare D1, and submitted to Google Indexing.'
          : 'AI Fetch succeeded! Article rewritten and ready for review.',
        post: rewrittenPost,
        published: isPublished,
        indexing: indexResult,
        url: `/news/${rewrittenPost.slug}`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during AI Fetch.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
