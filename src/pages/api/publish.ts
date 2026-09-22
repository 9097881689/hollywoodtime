import type { APIRoute } from 'astro';
import { addPost, getPostBySlug } from '../../lib/db';
import { getAuthorForCategory, AUTHORS } from '../../lib/authors';
import { sanitizeHeadline } from '../../lib/sanitize';
import { submitToGoogleIndexing } from '../../lib/google-indexing';
import type { Post } from '../../lib/types';

const DEFAULT_API_SECRET = 'hollywoodtime_secret_key_2026';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 100);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authorization check
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const expectedSecret = process.env.API_SECRET || DEFAULT_API_SECRET;

    if (token && token !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Invalid API Secret.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request JSON
    const data = await request.json();
    const rawTitle = (data.title || '').trim();

    if (!rawTitle) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanTitle = sanitizeHeadline(rawTitle);
    const slug = data.slug ? slugify(data.slug) : slugify(cleanTitle);

    // Determine category
    let category = (data.category || (Array.isArray(data.categories) ? data.categories[0] : 'movies'))
      .toLowerCase()
      .trim();
    const validCategories = ['movies', 'tv', 'music', 'awards', 'business', 'style', 'culture'];
    if (!validCategories.includes(category)) {
      category = 'movies';
    }
    const categoryLabels: Record<string, string> = {
      movies: 'Movies',
      tv: 'TV',
      music: 'Music',
      awards: 'Awards',
      business: 'Business',
      style: 'Style',
      culture: 'Culture',
    };
    const categoryLabel = categoryLabels[category] || 'Entertainment';

    // Assign verified author
    let author = getAuthorForCategory(category);
    if (data.author) {
      const matched = AUTHORS.find((a) => a.name.toLowerCase().includes(data.author.toLowerCase()));
      if (matched) {
        author = matched;
      }
    }

    // Prepare content and excerpt
    let content = data.content || data.html || `<p class="lead">${cleanTitle}</p><p>Latest coverage from the Hollywood Time newsroom.</p>`;
    // Format if raw markdown/text
    if (!content.includes('<p>') && !content.includes('<div>')) {
      content = content
        .split('\n\n')
        .map((paragraph: string, idx: number) =>
          idx === 0 ? `<p class="lead">${paragraph}</p>` : `<p>${paragraph}</p>`
        )
        .join('\n');
    }

    const excerpt = data.excerpt || data.subtitle || cleanTitle;
    const subtitle = data.subtitle || excerpt;
    const featuredImage =
      data.featuredImage ||
      data.image ||
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';

    const postPayload: Post = {
      id: data.id || `ht-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: cleanTitle,
      slug,
      subtitle: sanitizeHeadline(subtitle),
      excerpt: sanitizeHeadline(excerpt),
      category: category as any,
      categoryLabel,
      publishedAt: data.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        name: author.name,
        role: author.role,
        avatar: author.avatar,
        verified: true,
        slug: author.slug,
      },
      featuredImage,
      imageCaption: data.imageCaption || `${cleanTitle} (Photo: Hollywood Time / AP)`,
      imageCredit: data.imageCredit || 'Hollywood Time Archive',
      readTime: data.readTime || '4 min read',
      badge: data.badge || (category === 'movies' ? 'Box Office' : 'Exclusive'),
      tags: Array.isArray(data.tags) ? data.tags : [categoryLabel, 'Hollywood', 'Entertainment'],
      sourceName: data.sourceName || 'Hollywood Time Newsroom',
      sourceUrl: data.sourceUrl || '',
      content,
    };

    // 3. Save post to database (Cloudflare D1 edge database)
    const db = (locals as any)?.runtime?.env?.DB;
    const saveResult = await addPost(postPayload, db);

    // 4. Instant Google Indexing submission & Sitemap ping
    const siteUrl = 'https://www.hollywoodtime.com';
    const postUrl = `${siteUrl}/news/${slug}`;
    const serviceAccountJson = data.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    let indexingResult: any = { attempted: false };
    try {
      const idx = await submitToGoogleIndexing(postUrl, serviceAccountJson);
      indexingResult = { attempted: true, ...idx };
    } catch (e: any) {
      indexingResult = { attempted: true, success: false, message: e.message };
    }

    // Google sitemap ping
    try {
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(siteUrl + '/sitemap-news.xml')}`).catch(() => {});
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        action: saveResult.created ? 'created' : 'updated',
        post: {
          id: postPayload.id,
          title: postPayload.title,
          slug: postPayload.slug,
          category: postPayload.categoryLabel,
          author: postPayload.author.name,
          url: postUrl,
        },
        googleIndexing: indexingResult,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
