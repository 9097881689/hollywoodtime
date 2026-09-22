import type { Post } from './types';
import { AUTHORS } from './authors';

export function generateNewsArticleSchema(post: Post, siteUrl = 'https://www.hollywoodtime.com') {
  const articleUrl = `${siteUrl}/news/${post.slug}`;
  const authorSlug = post.author?.slug || post.author?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const authorUrl = `${siteUrl}/author/${authorSlug}`;

  // Find author bio or details from registry
  const authorRecord = AUTHORS.find((a) => a.name.toLowerCase() === post.author.name.toLowerCase());

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${articleUrl}#article`,
        isPartOf: {
          '@type': 'WebPage',
          '@id': articleUrl,
          url: articleUrl,
          name: post.title,
          isPartOf: {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            name: 'Hollywood Time',
            url: siteUrl,
          },
        },
        headline: post.title,
        description: post.excerpt,
        image: [
          {
            '@type': 'ImageObject',
            url: post.featuredImage,
            width: 1200,
            height: 675,
            caption: post.title,
          },
        ],
        datePublished: new Date(post.publishedAt).toISOString(),
        dateModified: new Date(post.updatedAt || post.publishedAt).toISOString(),
        mainEntityOfPage: articleUrl,
        author: {
          '@type': 'Person',
          '@id': `${authorUrl}#author`,
          name: post.author.name,
          jobTitle: authorRecord?.role || post.author.role || 'Senior Entertainment Journalist',
          url: authorUrl,
          description: authorRecord?.bio || `Entertainment reporter at Hollywood Time specializing in ${post.categoryLabel}.`,
          sameAs: authorRecord?.socials ? Object.values(authorRecord.socials) : [],
        },
        publisher: {
          '@type': 'NewsMediaOrganization',
          '@id': `${siteUrl}/#organization`,
          name: 'Hollywood Time',
          url: siteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/favicon.svg`,
            width: 512,
            height: 512,
          },
          publishingPrinciples: `${siteUrl}/editorial-policy`,
          correctionsPolicy: `${siteUrl}/editorial-policy#corrections`,
          ethicsPolicy: `${siteUrl}/editorial-policy#ethics`,
          diversityPolicy: `${siteUrl}/about#diversity`,
          verificationFactCheckingPolicy: `${siteUrl}/editorial-policy#fact-checking`,
        },
        articleSection: post.categoryLabel,
        keywords: Array.isArray(post.tags) ? post.tags.join(', ') : post.categoryLabel,
        inLanguage: 'en-US',
        isAccessibleForFree: 'True',
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', '.article-lead', '.article-body > p:first-of-type'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${articleUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: post.categoryLabel,
            item: `${siteUrl}/${post.category}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: articleUrl,
          },
        ],
      },
    ],
  };
}

export function generateOrganizationSchema(siteUrl = 'https://www.hollywoodtime.com') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsMediaOrganization',
        '@id': `${siteUrl}/#organization`,
        name: 'Hollywood Time',
        alternateName: ['The Hollywood Time', 'HollywoodTime.com'],
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/favicon.svg`,
          width: 512,
          height: 512,
        },
        description: 'The definitive voice of Hollywood entertainment news, box office analytics, awards, film festival dispatches, and exclusive celebrity interviews.',
        publishingPrinciples: `${siteUrl}/editorial-policy`,
        correctionsPolicy: `${siteUrl}/editorial-policy#corrections`,
        ethicsPolicy: `${siteUrl}/editorial-policy#ethics`,
        diversityPolicy: `${siteUrl}/about#diversity`,
        verificationFactCheckingPolicy: `${siteUrl}/editorial-policy#fact-checking`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'editorial newsroom',
          email: 'press@hollywoodtime.com',
          url: `${siteUrl}/contact`,
        },
        sameAs: [
          'https://twitter.com/hollywoodtime',
          'https://facebook.com/hollywoodtime',
          'https://instagram.com/hollywoodtime',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Hollywood Time',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[], siteUrl = 'https://www.hollywoodtime.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
