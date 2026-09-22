import type { Post } from './types';

/**
 * Universal entity decoder and string sanitizer for editorial journalism.
 * Converts numeric/hex/named HTML entities into clean typographic punctuation.
 */
export function decodeEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => {
      const num = Number(code);
      if (num === 8220 || num === 8221) return '"';
      if (num === 8216 || num === 8217) return "'";
      return String.fromCharCode(num);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim();
}

/**
 * Strips all residual entity artifacts and wire tags from editorial headlines
 */
export function sanitizeHeadline(title: string): string {
  let clean = decodeEntities(title)
    .replace(/\s*\((Exclusive|Report|Photos|Video|Review|First Look)\)/gi, '')
    .replace(/\s*\[(Exclusive|Report|Photos|Video|Review|First Look)\]/gi, '')
    .replace(/\s*[-|:]\s*(The Hollywood Reporter|THR|LAist|NDTV|Hindustan Times|Variety|Deadline).*$/i, '')
    .trim();

  // If starts with lower case, capitalize
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean;
}

/**
 * Recursively cleans all text fields on a Post object
 */
export function sanitizePost(post: Post): Post {
  return {
    ...post,
    title: sanitizeHeadline(post.title),
    subtitle: decodeEntities(post.subtitle),
    excerpt: decodeEntities(post.excerpt),
    imageCaption: post.imageCaption ? decodeEntities(post.imageCaption) : undefined,
    imageCredit: post.imageCredit ? decodeEntities(post.imageCredit) : undefined,
    author: {
      ...post.author,
      name: decodeEntities(post.author.name),
      role: decodeEntities(post.author.role),
    },
  };
}
