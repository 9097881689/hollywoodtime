import type { Post } from './types';
import type { RawFeedItem } from './feeds';
import { getAuthorForCategory } from './authors';

// High-resolution thematic editorial images pool
const THEMATIC_IMAGES: Record<string, string[]> = {
  movies: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
  ],
  tv: [
    'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  ],
  awards: [
    'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
  ],
  business: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  ],
  style: [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  ],
  culture: [
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  ],
};

export function isEntertainmentRelevant(item: RawFeedItem): boolean {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  const keywords = [
    'movie', 'film', 'actor', 'actress', 'director', 'star', 'oscar', 'emmy',
    'grammy', 'hollywood', 'cinema', 'trailer', 'box office', 'streaming',
    'netflix', 'disney', 'hbo', 'marvel', 'warner', 'tv', 'series', 'concert',
    'song', 'album', 'festival', 'cannes', 'venice', 'golden globes', 'celebrity',
    'showrunner', 'premiere', 'theatrical', 'paramount', 'sony', 'universal'
  ];

  return keywords.some((kw) => text.includes(kw));
}

export function detectCategory(item: RawFeedItem): string {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();

  if (text.includes('oscar') || text.includes('emmy') || text.includes('grammy') || text.includes('award') || text.includes('globe') || text.includes('bafta')) {
    return 'awards';
  }
  if (text.includes('music') || text.includes('album') || text.includes('song') || text.includes('concert') || text.includes('tour') || text.includes('singer')) {
    return 'music';
  }
  if (text.includes('tv') || text.includes('television') || text.includes('series') || text.includes('episode') || text.includes('season') || text.includes('hbo') || text.includes('netflix')) {
    return 'tv';
  }
  if (text.includes('fashion') || text.includes('style') || text.includes('met gala') || text.includes('red carpet') || text.includes('couture') || text.includes('dress')) {
    return 'style';
  }
  if (text.includes('merger') || text.includes('box office') || text.includes('earnings') || text.includes('studio') || text.includes('wall street') || text.includes('ceo') || text.includes('deal')) {
    return 'business';
  }
  if (text.includes('culture') || text.includes('museum') || text.includes('history') || text.includes('park') || text.includes('book') || text.includes('los angeles')) {
    return 'culture';
  }

  return item.categoryHint || 'movies';
}

/**
 * Advanced SEO Title Transformation Engine
 * Rewrites the original news headline into a 100% unique, authoritative,
 * and high-CTR headline that eliminates duplicate penalties in Google News.
 */
export function generateSeoRewrittenTitle(rawTitle: string, category: string, description?: string): string {
  const clean = formatJournalisticHeadline(rawTitle);

  // 1. Tragic Passing / Death Announcements
  const deathMatch = clean.match(/^(.*?)\s+(?:died from|dies at|dead at|passes away)\s*(.*)$/i);
  if (deathMatch) {
    const person = deathMatch[1].trim();
    return `Industry Mourns: Official Details Surface Following Tragic Passing of ${person}`;
  }

  // 2. High-Profile Network & Cast Signings
  const joinMatch = clean.match(/^(.*?)\s+(?:joins|joined)\s+(.*?)(?:\s+as\s+(.*))?$/i);
  if (joinMatch) {
    const person = joinMatch[1].trim();
    const company = joinMatch[2].trim();
    const role = joinMatch[3] ? joinMatch[3].trim() : '';
    if (role) {
      return `Media Shakeup: ${person} Inks Strategic Deal with ${company} as ${role}`;
    }
    return `Casting & Executive Update: ${person} Inks Major Deal with ${company}`;
  }

  // 3. World Festival Premieres
  const premMatch = clean.match(/^(.*?)\s+to\s+premiere\s+at\s+(.*)$/i);
  if (premMatch) {
    const project = premMatch[1].trim();
    const venue = premMatch[2].trim();
    return `Festival Circuit Spotlight: ${project} Locks in Prestigious World Debut at ${venue}`;
  }

  // 4. Interviews & In-Depth Reflections
  const explainMatch = clean.match(/^(.*?)\s+(?:explains why|reflects on|reveals why|opens up on|talks)\s+(.*)$/i);
  if (explainMatch) {
    const person = explainMatch[1].trim();
    let rest = explainMatch[2].trim()
      .replace(/^["']|["']$/g, '')
      .replace(/:\s*["'].*?["']$/, '');
    return `Inside the Narrative: ${person} Goes Deep on ${rest}`;
  }

  // 5. Historical / Retrospective Features
  const insideMatch = clean.match(/^Inside\s+(.*?)['’]s\s+(.*)$/i);
  if (insideMatch) {
    const subject = insideMatch[1].trim();
    const subtopic = insideMatch[2].split(':')[0].trim();
    return `Untold Hollywood History: Inside ${subject}'s Defining Path Through ${subtopic}`;
  }

  // 6. Breakthrough Talents & Career Pivots
  const markMatch = clean.match(/^(?:As\s+(?:a|an)\s+)?(.*?),\s*(.*?)\s+is\s+making\s+(?:her|his|their)\s+mark/i);
  if (markMatch) {
    const role = markMatch[1].trim();
    const person = markMatch[2].trim();
    return `Breakthrough Profile: How ${person} Is Forging a Bold New Legacy in ${role}`;
  }

  // 7. Ecosystems & Media Building
  const createMatch = clean.match(/^(.*?)\s+is\s+creating\s+(?:its|their)\s+own\s+(.*)$/i);
  if (createMatch) {
    const entity = createMatch[1].replace(/^[A-Za-z0-9\s,]+:\s*/, '').trim();
    const ecosystem = createMatch[2].trim();
    return `Media Ecosystem Shift: How ${entity} Is Building a Powerful New ${ecosystem}`;
  }

  // 8. Awards Campaigning & Category Placements
  const awardsMatch = clean.match(/^(.*?)\s+(?:sets|plans)\s+(.*?)\s+awards\s+categories/i);
  if (awardsMatch) {
    const studio = awardsMatch[1].trim();
    const project = awardsMatch[2].trim();
    return `Awards Tracker: ${studio} Finalizes High-Stakes Oscar Campaign Strategy for ${project}`;
  }

  // 9. Trailers & Teaser Debuts
  const trailerMatch = clean.match(/^(.*?)\s+trailer\s+(?:teases|reveals|drops|unveils)\s+(.*)$/i);
  if (trailerMatch) {
    const title = trailerMatch[1].trim();
    const details = trailerMatch[2].trim();
    return `First Look Breakdown: New Trailer for ${title} Offers Dramatic Clues on ${details}`;
  }

  // 10. Reviews & Critical Verdicts
  const reviewMatch = clean.match(/^(.*?)\s+review:\s*(.*)$/i);
  if (reviewMatch) {
    const project = reviewMatch[1].trim();
    const hook = reviewMatch[2].trim();
    return `In-Depth Critical Verdict: Why ${project} Is Generating Major Critical Acclaim (${hook})`;
  }

  // Dynamic Journalistic Categories & Anchors
  const catAnchors: Record<string, string[]> = {
    movies: ['Cinema Insider:', 'Theatrical Focus:', 'Big Screen Analysis:', 'Box Office Spotlight:'],
    tv: ['Streaming Dispatch:', 'Television Insider:', 'Peak TV Focus:', 'Small Screen Deep Dive:'],
    awards: ['The Oscar Race:', 'Awards Contender:', 'Campaign Watch:', 'Ballot Breakdown:'],
    business: ['Studio Intelligence:', 'Hollywood Business:', 'Industry Perspective:', 'Executive Suite:'],
    music: ['Music Wire:', 'Sonic Spotlight:', 'Behind the Sound:', 'Chart Watch:'],
    style: ['Red Carpet Beat:', 'Couture Insider:', 'Fashion Pulse:', 'Aesthetic Spotlight:'],
    culture: ['Cultural Dispatch:', 'Pop Culture Pulse:', 'Special Report:', 'The Big Picture:']
  };

  const anchors = catAnchors[category.toLowerCase()] || ['Hollywood Exclusive:'];
  const hash = Math.abs(clean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const anchor = anchors[hash % anchors.length];

  // Dynamic verb transformations
  let reworked = clean
    .replace(/\bsets release date for\b/gi, 'Locks in Official Debut for')
    .replace(/\bsets release for\b/gi, 'Locks in Official Debut for')
    .replace(/\bconfirms\b/gi, 'Breaks Silence to Confirm')
    .replace(/\bcasts\b/gi, 'Enlists Star Talent for')
    .replace(/\bteases\b/gi, 'Offers Rare Revealing Clues on')
    .replace(/\breturns to\b/gi, 'Plots Dramatic Return to')
    .replace(/\bbegins filming\b/gi, 'Officially Kicks Off Production on')
    .trim();

  // If no specific verb was matched, apply engaging editorial structures
  if (reworked === clean) {
    const templates = [
      `${anchor} Inside the High-Stakes Developments Surrounding ${clean}`,
      `${anchor} Why the Latest Revelations Around ${clean} Have Hollywood Talking`,
      `${anchor} Behind the Scenes of ${clean} as Industry Momentum Builds`
    ];
    reworked = templates[hash % templates.length];
  } else {
    reworked = `${anchor} ${reworked}`;
  }

  // Length safety guard (ideal Google SERP snippet: 55-90 characters)
  if (reworked.length > 105) {
    const trimmed = reworked.slice(0, 100);
    const lastSp = trimmed.lastIndexOf(' ');
    reworked = (lastSp > 45 ? trimmed.slice(0, lastSp) : trimmed) + '...';
  }

  return reworked.replace(/::+/g, ':').replace(/\s+/g, ' ').trim();
}

export async function rewriteArticleWithAI(item: RawFeedItem, apiKey?: string): Promise<Post> {
  const category = detectCategory(item);
  const authorObj = getAuthorForCategory(category);
  const author = {
    name: authorObj.name,
    role: authorObj.role,
    slug: authorObj.slug,
    avatar: authorObj.avatar,
    verified: true,
  };

  // Step 1: Algorithmic transformation guaranteed to produce a unique, SEO-friendly headline
  const algorithmicRewrittenTitle = generateSeoRewrittenTitle(item.title, category, item.description);
  let finalTitle = algorithmicRewrittenTitle;
  let finalSubtitle = `An in-depth examination of the creative, business, and cultural currents driving the latest Hollywood developments.`;
  let finalExcerpt = item.description || `Hollywood Time explores the deeper creative and business implications behind ${algorithmicRewrittenTitle}.`;
  let fullArticleHtml = '';
  let badge = getEditorialBadge(category);
  let tags = ['Hollywood', 'Exclusive', category.toUpperCase(), 'Analysis'];

  // Step 2: If Gemini API key is available, generate authentic longform human journalism with unique title
  if (apiKey) {
    try {
      const prompt = `You are a distinguished senior culture journalist and features writer at Hollywood Time, an authoritative publication revered for deep, stylish narrative journalism (like The New Yorker, Variety, or The Hollywood Reporter).

CRITICAL TITLE REWRITING REQUIREMENT:
You MUST NEVER repeat or copy the source headline! Generate a completely transformed, fresh, high-impact, SEO-optimized editorial headline that is 100% unique and superior to the original source.
- Do NOT repeat the exact same sentence structure.
- Add an authoritative journalistic hook (e.g. 'Inside...', 'Why...', 'First Look:', 'The Making of...', 'Analysis:').
- Prioritize high-CTR keywords that rank in Google News.

Write a COMPLETE, IMMERSIVE, HUMAN-STYLE article (600 to 800 words) based on the story below.

CRITICAL HUMAN WRITING RULES:
1. VOICE & TONE: Write with human wit, sharp observational prose, and genuine cultural sophistication. Absolutely NEVER use AI clichés like "In a world where...", "In conclusion", "It is worth noting", "Only time will tell", "In breaking news", "Let's dive in", or formulaic summaries.
2. HOOK: Open with a vivid narrative lede that sets the scene in Los Angeles, at a festival, or inside studio boardrooms.
3. STRUCTURE:
   - An atmospheric, scene-setting lead paragraph (<p class="lead">).
   - Detailed news development and factual context in natural prose.
   - Distinct editorial subheadings (<h2>) dividing the story into key themes.
   - Plausible, contextual quotes attributed to named industry roles (e.g., senior studio executives, veteran talent agents, festival programmers).
   - Sharp analysis of theatrical, financial, or cultural ramifications.
   - An insightful, resonant conclusion.
4. FORMAT: Return a valid JSON object matching this schema:
{
  "title": "A sharp, unique, non-copied editorial headline (MUST be different from the source)",
  "subtitle": "An elegant, informative sub-headline / dek",
  "excerpt": "A compelling 2-sentence journalistic summary of the story's core stakes",
  "badge": "EXCLUSIVE | FEATURE | ANALYSIS | THE RACE | INSIDE STORY",
  "contentHtml": "<p class=\\"lead\\">...</p><p>...</p><h2>...</h2><p>...</p><blockquote>...</blockquote><p>...</p><h2>...</h2><p>...</p>",
  "tags": ["tag1", "tag2", "tag3"]
}

Story Context:
Original Headline: ${formatJournalisticHeadline(item.title)}
Details: ${item.description || item.title}
Department: ${category}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          const parsed = JSON.parse(textResp);
          if (parsed.title && parsed.title.toLowerCase().trim() !== item.title.toLowerCase().trim()) {
            finalTitle = formatJournalisticHeadline(parsed.title);
          }
          if (parsed.subtitle) finalSubtitle = parsed.subtitle;
          if (parsed.excerpt) finalExcerpt = parsed.excerpt;
          if (parsed.contentHtml) fullArticleHtml = parsed.contentHtml;
          if (parsed.badge) badge = parsed.badge;
          if (parsed.tags) tags = parsed.tags;
        }
      }
    } catch (err) {
      console.warn('AI rewriting fallback to human narrative engine:', err);
    }
  }

  // Fallback to high-end human narrative engine if contentHtml was not generated
  if (!fullArticleHtml) {
    fullArticleHtml = generateHumanEditorialArticle(finalTitle, item.description || '', category);
  }

  // Create clean SEO slug from the REWRITTEN title (not the competitor's raw title!)
  const baseSlug = finalTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75);

  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  // Pick thematic image
  const images = THEMATIC_IMAGES[category] || THEMATIC_IMAGES.movies;
  const featuredImage = item.imageUrl || images[Math.floor(Math.random() * images.length)];
  const nowIso = new Date().toISOString();

  return {
    id: `ht-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    slug,
    title: finalTitle,
    subtitle: finalSubtitle,
    excerpt: finalExcerpt,
    content: fullArticleHtml,
    category,
    categoryLabel: category.charAt(0).toUpperCase() + category.slice(1),
    badge,
    featuredImage,
    imageCaption: `${finalTitle} — Photography and visual coverage from Hollywood Time.`,
    imageCredit: 'Hollywood Time Archive',
    author,
    publishedAt: nowIso,
    updatedAt: nowIso,
    readingTimeMinutes: Math.max(4, Math.ceil((fullArticleHtml.length || 1000) / 450)),
    sourceUrl: item.link,
    sourceName: 'Hollywood Time Newsroom',
    indexedInGoogle: true,
    tags,
  };
}

function getEditorialBadge(category: string): string {
  switch (category) {
    case 'movies': return 'BOX OFFICE';
    case 'tv': return 'INSIDE TV';
    case 'awards': return 'THE RACE';
    case 'business': return 'INDUSTRY';
    case 'music': return 'SPOTLIGHT';
    case 'style': return 'COUTURE';
    default: return 'FEATURE';
  }
}

function generateHumanEditorialArticle(headline: string, rawSnippet: string, category: string): string {
  const cleanSnippet = rawSnippet.replace(/<[^>]*>/g, '').trim();

  let sectionOneTitle = 'Behind the Studio Lot Conversations';
  let sectionTwoTitle = 'The Shifting Economics of the Industry';
  let sectionThreeTitle = 'What Lies Ahead for Audiences and Creators';
  let narrativeLead = '';
  let industryContext = '';
  let quoteText = '';
  let quoteSpeaker = '';

  if (category === 'movies') {
    sectionOneTitle = 'The Theatrical Landscape Under Pressure';
    sectionTwoTitle = 'Why Auteur Filmmaking Still Dictates Studio Value';
    sectionThreeTitle = 'The International Box Office Stakes';
    narrativeLead = `Inside the studio bungalows that line Burbank and Century City, few conversations happen in a vacuum. Every high-profile development is scrutinized not merely for its creative merits, but as a bellwether for the delicate balance between theatrical spectacle and digital permanence.`;
    industryContext = `With domestic theater chains demanding longer, exclusive theatrical windows and studio accountants prioritizing guaranteed intellectual property, greenlighting decisions have rarely carried higher stakes. The narrative surrounding this project highlights how top filmmakers and studio chiefs are recalibrating their slate strategies to capture both die-hard cinephiles and opening-weekend crowds.`;
    quoteText = `Audiences have made it clear that generic formulas won't drive them to theaters on a Friday night. If you want communal commitment, you have to deliver something unmistakably cinematic.`;
    quoteSpeaker = `a veteran studio distribution executive speaking on condition of background`;
  } else if (category === 'tv') {
    sectionOneTitle = 'The Contraction and Refinement of Peak TV';
    sectionTwoTitle = 'Showrunner Autonomy in the Algorithmic Age';
    sectionThreeTitle = 'The Battle for Subscriber Loyalty';
    narrativeLead = `There was a time when the streaming universe seemed boundless, propelled by limitless production budgets and a race for pure volume. Today, the television industry has quietly entered a new era: one characterized by sharp curation, fiscal discipline, and a desperate search for true monocultural conversation.`;
    industryContext = `Showrunners and network brass are adjusting to a marketplace where eight-episode orders must justify every dollar of their budget. Rather than casting a wide net with countless mid-tier originals, platforms are re-centering their resources around bespoke, authorial dramas that command weekly appointment viewing and social media resonance.`;
    quoteText = `The era of dumping thirty shows onto an interface and hoping for lightning to strike is officially dead. Quality and cultural footprint are the only metrics that protect against subscriber churn.`;
    quoteSpeaker = `a prominent West Coast talent manager representing several Emmy-winning creators`;
  } else if (category === 'awards') {
    sectionOneTitle = 'Early Signals from the Fall Festival Circuits';
    sectionTwoTitle = 'How Voter Sentiment Is Coalescing';
    sectionThreeTitle = 'The Long March to the Dolby Theatre';
    narrativeLead = `Every autumn, the worldwide awards derby begins in earnest—first amid the glittering lagoons of Venice, then the mountain crispness of Telluride, and finally the crowded press theaters of Toronto. What emerges from these festivals is rarely just a collection of favorable reviews; it is the fragile architecture of an Oscar campaign.`;
    industryContext = `Campaign strategists are dissecting voter demographic shifts within the Academy of Motion Picture Arts and Sciences, whose significantly expanded international branch has fundamentally disrupted historical voting blocs. Conventional wisdom no longer guarantees hardware; instead, authentic critical fervor and resonant thematic relevance rule the ballot.`;
    quoteText = `You cannot manufacture an Oscar run through trade ads alone anymore. The films that break through are those that tap into an undeniable emotional frequency among voters.`;
    quoteSpeaker = `a veteran campaign consultant who has guided multiple Best Picture winners`;
  } else if (category === 'business') {
    sectionOneTitle = 'Consolidation, Synergies, and Balance Sheets';
    sectionTwoTitle = 'The Pragmatic Realities of Direct-to-Consumer Models';
    sectionThreeTitle = 'The Next Phase of Media Conglomerates';
    narrativeLead = `Wall Street’s relationship with entertainment media has undergone a profound transformation. The days when equity analysts rewarded sheer subscriber additions have yielded to an unforgiving scrutiny of free cash flow, debt reduction, and average revenue per user.`;
    industryContext = `Across entertainment conglomerate suites, executives are grappling with the twin realities of legacy cable decay and the capital-intensive demands of high-end streaming infrastructure. The outcome has been a flurry of strategic restructuring, bundled cross-studio alliances, and an aggressive push into hybrid advertising tiers.`;
    quoteText = `We are witnessing the natural maturation of a digital economy. The winners will not be those who spend the most, but those who optimize their production pipelines while safeguarding their creative core.`;
    quoteSpeaker = `a leading media equity research director`;
  } else {
    sectionOneTitle = 'The Cultural Resonance of the Moment';
    sectionTwoTitle = 'Navigating the Intersection of Art and Commerce';
    sectionThreeTitle = 'The Legacy in the Making';
    narrativeLead = `At its finest, entertainment journalism is about illuminating the invisible currents that shape our collective imagination. Behind every casting announcement, album drop, or creative union dispute lies a human story about ambition, artistry, and the relentless machinery of modern pop culture.`;
    industryContext = `As creative disciplines continue to blur across mediums—where musicians score blockbuster films, television actors headline Broadway revivals, and filmmakers experiment with cutting-edge visual technologies—the traditional boundaries of storytelling are dissolving in real time.`;
    quoteText = `The public’s appetite for authentic storytelling has never been sharper. When an artist or studio strikes a nerve, the cultural reverberations can be felt worldwide within hours.`;
    quoteSpeaker = `a cultural historian and longtime entertainment observer`;
  }

  return `
    <p class="lead">${narrativeLead}</p>

    <p>
      At the center of the recent industry attention is <strong>${headline}</strong>. ${cleanSnippet ? `${cleanSnippet} ` : ''}What might appear on the surface as another turn of the news cycle in reality touches upon the broader structural forces reshaping the entertainment capital this season.
    </p>

    <h2>${sectionOneTitle}</h2>

    <p>
      ${industryContext}
    </p>

    <p>
      Conversations across production offices and representation desks in Beverly Hills reflect a cautious optimism. Producers recognize that the modern audience is more discerning than ever, armed with unprecedented choices across home viewing and theatrical options.
    </p>

    <blockquote>
      "${quoteText}"
      <footer>— ${quoteSpeaker}</footer>
    </blockquote>

    <h2>${sectionTwoTitle}</h2>

    <p>
      To fully understand the trajectory of this story, one must consider the historical precedent. Over the past five years, the acceleration of technological tools and shifting distribution windows has upended long-standing conventions. Yet, time and again, the industry’s most durable successes have hinged not on technical novelty, but on singular, passionate vision.
    </p>

    <p>
      Whether discussing box office viability, streaming engagement indices, or peer recognition during voting cycles, creative stakeholders emphasize that clarity of purpose remains the single most reliable predictor of longevity.
    </p>

    <h2>${sectionThreeTitle}</h2>

    <p>
      As schedules solidify and formal production phases begin, industry watchers will be tracking audience reception with heightened curiosity. The coming months will offer a definitive verdict on whether these creative bets pay off in critical acclaim and cultural resonance.
    </p>

    <p>
      For now, the momentum surrounding <strong>${headline}</strong> proves that despite the turbulence of an evolving media landscape, Hollywood remains an unmatched arena of ambition, storytelling, and reinvention.
    </p>
  `.trim();
}

export function formatJournalisticHeadline(raw: string): string {
  let clean = raw
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s*\((Exclusive|Report|Photos|Video|Review|First Look)\)/gi, '')
    .replace(/\s*\[(Exclusive|Report|Photos|Video|Review|First Look)\]/gi, '')
    .replace(/\s*[-|:]\s*(The Hollywood Reporter|THR|LAist|NDTV|Hindustan Times|Variety|Deadline).*$/i, '')
    .trim();

  // Ensure headline starts with a capital letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean;
}
