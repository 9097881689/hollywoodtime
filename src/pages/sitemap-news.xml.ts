import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/db';

export const ALL: APIRoute = async () => {
  const posts = await getAllPosts();
  const siteUrl = 'https://www.hollywoodtime.com';

  const xmlEntries = posts.map((post) => {
    const pubDate = new Date(post.publishedAt).toISOString();
    const cleanTitle = post.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `
    <url>
      <loc>${siteUrl}/news/${post.slug}</loc>
      <news:news>
        <news:publication>
          <news:name>Hollywood Time</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${pubDate}</news:publication_date>
        <news:title>${cleanTitle}</news:title>
      </news:news>
    </url>`.trim();
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
};
