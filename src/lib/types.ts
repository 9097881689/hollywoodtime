export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string; // HTML formatted article content
  category: string; // 'movies' | 'tv' | 'music' | 'awards' | 'business' | 'style' | 'culture'
  categoryLabel: string;
  badge?: string; // 'BREAKING' | 'EXCLUSIVE' | 'REVIEW' | 'BOX OFFICE' | 'ANALYSIS'
  featuredImage: string;
  imageCaption?: string;
  imageCredit?: string;
  author: {
    name: string;
    role: string;
    slug?: string;
    verified?: boolean;
    avatar?: string;
  };
  publishedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  readingTimeMinutes: number;
  sourceUrl?: string;
  sourceName?: string;
  indexedInGoogle?: boolean;
  googleIndexedAt?: string;
  tags: string[];
}

export interface IndexLog {
  id: string;
  url: string;
  action: 'URL_UPDATED' | 'URL_DELETED';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  statusCode?: number;
  responseMessage?: string;
  timestamp: string;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'sitemap';
  categoryDefault: string;
  enabled: boolean;
  lastChecked?: string;
  postsFound?: number;
}
