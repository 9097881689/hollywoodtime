import type { APIRoute } from 'astro';
import { getAllPosts, CATEGORIES } from '../lib/db';

export const ALL: APIRoute = async () => {
  const posts = await getAllPosts();
  const siteUrl = 'https://www.hollywoodtime.com';

  const categoryEntries = CATEGORIES.map((cat) => `
    <url>
      <loc>${siteUrl}/${cat.slug}</loc>
      <changefreq>hourly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  const postEntries = posts.map((post) => `
    <url>
      <loc>${siteUrl}/news/${post.slug}</loc>
      <lastmod>${new Date(post.updatedAt || post.publishedAt).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `).join('');

  const legalPages = ['about', 'editorial-policy', 'privacy-policy', 'terms-of-service', 'contact'];
  const legalEntries = legalPages.map((page) => `
    <url>
      <loc>${siteUrl}/${page}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.5</priority>
    </url>
  `).join('');

  const authorPages = ['ak-singh', 'bidyanand', 'sk-singh', 'nk-mishra'];
  const authorEntries = authorPages.map((slug) => `
    <url>
      <loc>${siteUrl}/author/${slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  ${categoryEntries}
  ${legalEntries}
  ${authorEntries}
  ${postEntries}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
};
