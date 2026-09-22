import type { APIRoute } from 'astro';
import { DEFAULT_FEED_SOURCES, fetchFeedItems } from '../../lib/feeds';
import { isEntertainmentRelevant, rewriteArticleWithAI } from '../../lib/rewriter';
import { addPost, getAllPosts } from '../../lib/db';
import { submitToGoogleIndexing } from '../../lib/google-indexing';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any)?.runtime?.env?.DB;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty json fallback
    }

    const apiKey = body.geminiApiKey || process.env.GEMINI_API_KEY;
    const serviceAccountJson = body.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    const existingPosts = await getAllPosts(db);
    const existingUrls = new Set(existingPosts.map((p) => p.sourceUrl).filter(Boolean));
    const existingTitles = new Set(existingPosts.map((p) => p.title.toLowerCase().trim()));

    const newlyCreatedPosts: any[] = [];
    const indexResults: any[] = [];

    // Process all enabled feeds
    for (const source of DEFAULT_FEED_SOURCES.filter((s) => s.enabled)) {
      try {
        const rawItems = await fetchFeedItems(source);

        for (const item of rawItems) {
          // Check deduplication
          if (existingUrls.has(item.link) || existingTitles.has(item.title.toLowerCase().trim())) {
            continue;
          }

          // Check entertainment relevance
          if (!isEntertainmentRelevant(item)) {
            continue;
          }

          // Rewrite article using AI / Journalistic engine
          const rewrittenPost = await rewriteArticleWithAI(item, apiKey);
          const saveResult = await addPost(rewrittenPost, db);

          if (saveResult.created) {
            existingUrls.add(item.link);
            existingTitles.add(item.title.toLowerCase().trim());
            newlyCreatedPosts.push(rewrittenPost);

            // Instant Google Indexing submission as requested by user!
            const postUrl = `https://www.hollywoodtime.com/news/${rewrittenPost.slug}`;
            const idxRes = await submitToGoogleIndexing(postUrl, serviceAccountJson);
            indexResults.push({
              slug: rewrittenPost.slug,
              url: postUrl,
              indexed: idxRes.success,
              message: idxRes.message,
            });

            // Mark post as indexed
            rewrittenPost.indexedInGoogle = idxRes.success;
            rewrittenPost.googleIndexedAt = new Date().toISOString();
          }

          // Limit batch per 5-min sync run to 2 posts to protect D1 free quota and Google quota
          if (newlyCreatedPosts.length >= 2) break;
        }
      } catch (srcErr) {
        console.error(`Error processing feed source ${source.name}:`, srcErr);
      }

      if (newlyCreatedPosts.length >= 2) break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed. ${newlyCreatedPosts.length} new stories created and submitted for Google Indexing.`,
        createdCount: newlyCreatedPosts.length,
        createdPosts: newlyCreatedPosts.map((p) => ({
          title: p.title,
          category: p.categoryLabel,
          slug: p.slug,
          source: p.sourceName,
        })),
        indexingSubmissions: indexResults,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
