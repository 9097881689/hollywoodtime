import { XMLParser } from 'fast-xml-parser';
import type { FeedSource } from './types';

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  {
    id: 'thr-main',
    name: 'The Hollywood Reporter (Main Feed)',
    url: 'https://www.hollywoodreporter.com/feed/',
    type: 'rss',
    categoryDefault: 'movies',
    enabled: true,
  },
  {
    id: 'thr-movies',
    name: 'The Hollywood Reporter (Movies)',
    url: 'https://www.hollywoodreporter.com/c/movies/feed/',
    type: 'rss',
    categoryDefault: 'movies',
    enabled: true,
  },
  {
    id: 'thr-tv',
    name: 'The Hollywood Reporter (TV)',
    url: 'https://www.hollywoodreporter.com/c/tv/feed/',
    type: 'rss',
    categoryDefault: 'tv',
    enabled: true,
  },
  {
    id: 'thr-awards',
    name: 'The Hollywood Reporter (Awards)',
    url: 'https://www.hollywoodreporter.com/c/awards/feed/',
    type: 'rss',
    categoryDefault: 'awards',
    enabled: true,
  },
  {
    id: 'laist-news',
    name: 'LAist (Arts & Entertainment / Culture)',
    url: 'https://laist.com/news-sitemap-content.xml',
    type: 'sitemap',
    categoryDefault: 'culture',
    enabled: true,
  },
  {
    id: 'ndtv-movies',
    name: 'NDTV Entertainment',
    url: 'https://feeds.feedburner.com/ndtvnews-entertainment',
    type: 'rss',
    categoryDefault: 'movies',
    enabled: true,
  },
  {
    id: 'ht-entertainment',
    name: 'Hindustan Times Entertainment',
    url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml',
    type: 'rss',
    categoryDefault: 'movies',
    enabled: true,
  },
];

export interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  contentSnippet?: string;
  author?: string;
  sourceName: string;
  categoryHint: string;
  imageUrl?: string;
}

export async function fetchFeedItems(source: FeedSource): Promise<RawFeedItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HollywoodTimeBot/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Feed ${source.name} returned HTTP ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    const parsed = parser.parse(xmlText);
    const items: RawFeedItem[] = [];

    if (source.type === 'rss') {
      const channel = parsed.rss?.channel;
      if (!channel) return [];

      const rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

      for (const item of rawItems.slice(0, 10)) {
        const title = item.title?.['#text'] || item.title || '';
        const link = item.link?.['#text'] || item.link || item.guid?.['#text'] || item.guid || '';
        const pubDate = item.pubDate || new Date().toISOString();
        const description = item.description?.['#text'] || item.description || '';
        const author = item['dc:creator'] || item.author || 'Hollywood Time Staff';

        // Extract image if present
        let imageUrl = '';
        if (item['media:content']?.['@_url']) {
          imageUrl = item['media:content']['@_url'];
        } else if (item.enclosure?.['@_url']) {
          imageUrl = item.enclosure['@_url'];
        } else if (typeof description === 'string') {
          const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        if (title && link) {
          items.push({
            title: cleanHtml(title),
            link,
            pubDate,
            description: cleanHtml(description).slice(0, 280),
            author: cleanHtml(author),
            sourceName: source.name,
            categoryHint: source.categoryDefault,
            imageUrl: imageUrl || undefined,
          });
        }
      }
    } else if (source.type === 'sitemap') {
      const urlset = parsed.urlset;
      if (!urlset || !urlset.url) return [];

      const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];

      for (const entry of urls.slice(0, 10)) {
        const link = entry.loc;
        const news = entry['news:news'];
        if (!link || !news) continue;

        const title = news['news:title'] || '';
        const pubDate = news['news:publication_date'] || entry.lastmod || new Date().toISOString();

        if (title && link) {
          items.push({
            title: cleanHtml(title),
            link,
            pubDate,
            description: title,
            author: news['news:publication']?.['news:name'] || 'LAist Wire',
            sourceName: source.name,
            categoryHint: source.categoryDefault,
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error(`Error fetching feed from ${source.name}:`, error);
    return [];
  }
}

function cleanHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
