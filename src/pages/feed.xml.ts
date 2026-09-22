import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/db';

export const ALL: APIRoute = async () => {
  const posts = await getAllPosts();
  const siteUrl = 'https://www.hollywoodtime.com';

  const items = posts.map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/news/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/news/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <category>${post.categoryLabel}</category>
      <dc:creator><![CDATA[${post.author.name}]]></dc:creator>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>The Hollywood Time</title>
    <link>${siteUrl}</link>
    <description>The Definitive Voice of Entertainment, Movies, TV, Music &amp; Awards</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
};
