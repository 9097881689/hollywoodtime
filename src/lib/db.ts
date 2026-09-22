import type { Post, IndexLog } from './types';
import seedPostsData from '../data/seed-posts.json';
import { sanitizePost } from './sanitize';

// In-memory runtime cache for ultra-fast response
let postsCache: Post[] = (seedPostsData as Post[]).map(sanitizePost);

export const CATEGORIES = [
  { slug: 'movies', label: 'Movies' },
  { slug: 'tv', label: 'TV' },
  { slug: 'music', label: 'Music' },
  { slug: 'awards', label: 'Awards' },
  { slug: 'business', label: 'Business' },
  { slug: 'style', label: 'Style' },
  { slug: 'culture', label: 'Culture' },
] as const;

function rowToPost(row: any): Post {
  return sanitizePost({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    excerpt: row.excerpt || '',
    content: row.content,
    category: row.category,
    categoryLabel: row.category_label || row.category.charAt(0).toUpperCase() + row.category.slice(1),
    badge: row.badge,
    featuredImage: row.featured_image,
    imageCaption: row.image_caption,
    imageCredit: row.image_credit,
    author: {
      name: row.author_name,
      role: row.author_role || 'Staff Reporter',
      slug: row.author_slug,
      avatar: row.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
      verified: true,
    },
    publishedAt: row.published_at,
    updatedAt: row.updated_at || row.published_at,
    readingTimeMinutes: row.reading_time_minutes || 5,
    sourceUrl: row.source_url || '',
    sourceName: row.source_name || 'Hollywood Time Newsroom',
    indexedInGoogle: Boolean(row.indexed_in_google),
    googleIndexedAt: row.google_indexed_at,
    tags: row.tags ? row.tags.split(',') : ['Hollywood', 'Entertainment'],
  });
}

export async function getAllPosts(d1?: any): Promise<Post[]> {
  if (d1) {
    try {
      const stmt = d1.prepare('SELECT * FROM posts ORDER BY published_at DESC');
      const { results } = await stmt.all();
      if (results && results.length > 0) {
        return results.map(rowToPost);
      }
    } catch (e) {
      console.warn('D1 read failed, falling back to cache:', e);
    }
  }

  return postsCache
    .map(sanitizePost)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getFeaturedPost(d1?: any): Promise<Post> {
  const all = await getAllPosts(d1);
  return all[0];
}

export async function getTrendingPosts(limit = 6, d1?: any): Promise<Post[]> {
  const all = await getAllPosts(d1);
  return all.slice(1, limit + 1);
}

/**
 * Returns latest 3 posts strictly for each category.
 * User requirement: "sabhi categories ke latest 3 post hi rakhana"
 */
export async function getPostsByCategory(categorySlug: string, limit = 3, d1?: any): Promise<Post[]> {
  const all = await getAllPosts(d1);
  return all
    .filter((p) => p.category.toLowerCase() === categorySlug.toLowerCase())
    .slice(0, limit);
}

export async function getAllCategoryGroups(postsPerCategory = 3, d1?: any): Promise<
  Array<{
    category: { slug: string; label: string };
    posts: Post[];
  }>
> {
  const all = await getAllPosts(d1);
  return CATEGORIES.map((cat) => {
    const posts = all
      .filter((p) => p.category.toLowerCase() === cat.slug.toLowerCase())
      .slice(0, postsPerCategory);
    return {
      category: cat,
      posts,
    };
  });
}

export async function getPostBySlug(slug: string, d1?: any): Promise<Post | undefined> {
  if (d1) {
    try {
      const stmt = d1.prepare('SELECT * FROM posts WHERE slug = ? LIMIT 1').bind(slug);
      const row = await stmt.first();
      if (row) {
        return rowToPost(row);
      }
    } catch (e) {
      console.warn('D1 get by slug failed, checking cache:', e);
    }
  }

  const all = await getAllPosts();
  return all.find((p) => p.slug === slug);
}

export async function getRelatedPosts(category: string, currentSlug: string, limit = 3, d1?: any): Promise<Post[]> {
  const all = await getAllPosts(d1);
  return all
    .filter((p) => p.category === category && p.slug !== currentSlug)
    .slice(0, limit);
}

let indexLogsCache: IndexLog[] = [];

export async function addPost(post: Post, d1?: any): Promise<{ success: boolean; created: boolean; post: Post }> {
  const sanitized = sanitizePost(post);

  // If Cloudflare D1 database binding is present, persist permanently to edge SQLite!
  if (d1) {
    try {
      const tagsStr = Array.isArray(sanitized.tags) ? sanitized.tags.join(',') : '';
      await d1.prepare(`
        INSERT OR REPLACE INTO posts (
          id, slug, title, subtitle, excerpt, content, category, category_label, badge,
          featured_image, image_caption, image_credit, author_name, author_role, author_slug,
          author_avatar, published_at, updated_at, reading_time_minutes, source_url, source_name,
          indexed_in_google, google_indexed_at, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sanitized.id,
        sanitized.slug,
        sanitized.title,
        sanitized.subtitle || '',
        sanitized.excerpt || '',
        sanitized.content,
        sanitized.category,
        sanitized.categoryLabel,
        sanitized.badge || '',
        sanitized.featuredImage || '',
        sanitized.imageCaption || '',
        sanitized.imageCredit || '',
        sanitized.author.name,
        sanitized.author.role || '',
        sanitized.author.slug || '',
        sanitized.author.avatar || '',
        sanitized.publishedAt,
        sanitized.updatedAt || sanitized.publishedAt,
        sanitized.readingTimeMinutes || 5,
        sanitized.sourceUrl || '',
        sanitized.sourceName || 'Hollywood Time Newsroom',
        sanitized.indexedInGoogle ? 1 : 0,
        sanitized.googleIndexedAt || sanitized.publishedAt,
        tagsStr
      ).run();
    } catch (d1Err) {
      console.error('Failed to write post to Cloudflare D1:', d1Err);
    }
  }

  // Update in-memory runtime cache
  const existingIdx = postsCache.findIndex((p) => p.slug === sanitized.slug || (sanitized.sourceUrl && p.sourceUrl === sanitized.sourceUrl));
  if (existingIdx !== -1) {
    postsCache[existingIdx] = sanitized;
    return { success: true, created: false, post: sanitized };
  }

  postsCache.unshift(sanitized);
  return { success: true, created: true, post: sanitized };
}

export async function getIndexLogs(): Promise<IndexLog[]> {
  return [...indexLogsCache].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function addIndexLog(log: IndexLog): Promise<void> {
  indexLogsCache.unshift(log);
}
