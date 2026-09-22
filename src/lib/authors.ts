export interface Author {
  id: string;
  slug: string;
  name: string;
  role: string;
  verified: boolean;
  beats: string[];
  primaryCategories: string[];
  avatar: string;
  bio: string;
  credentials: string[];
  location: string;
  socials?: Record<string, string>;
}

export const VERIFIED_AUTHORS: Record<string, Author> = {
  'ak-singh': {
    id: 'auth-ak-singh',
    slug: 'ak-singh',
    name: 'A.K. Singh',
    role: 'Editor-in-Chief & Chief Film Analyst',
    verified: true,
    beats: ['Movies', 'Studio Mergers', 'Box Office Tracking', 'IMAX Spectacles'],
    primaryCategories: ['movies', 'business'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'A.K. Singh is the Editor-in-Chief of Hollywood Time. A seasoned entertainment journalist with over fifteen years covering studio boardrooms, tentpole franchise strategy, and festival world premieres from Venice to Telluride, he steers the investigative and editorial compass of the publication.',
    credentials: ['Member, Hollywood Critics Association', 'Former Los Angeles Film Bureau Lead', 'B.A. Journalism & Film Studies'],
    location: 'Los Angeles, CA',
  },
  'bidyanand': {
    id: 'auth-bidyanand',
    slug: 'bidyanand',
    name: 'Bidyanand',
    role: 'Executive Awards & Cinema Editor',
    verified: true,
    beats: ['The Oscar Race', 'Festival Juried Honors', 'Auteur Cinema', 'BAFTA & Guilds'],
    primaryCategories: ['awards', 'movies'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'Bidyanand spearheads awards season handicapping and cinematic criticism at Hollywood Time. Regarded as one of the industry’s most astute Oscar season analysts, his reporting charts voter demographics across the Academy, BAFTA, and international guild voting chapters.',
    credentials: ['International Cinephile Coalition Voting Member', 'Author of "The Anatomy of Award Campaigns"', 'Festival Delegate (Cannes, TIFF)'],
    location: 'Hollywood, CA',
  },
  'sk-singh': {
    id: 'auth-sk-singh',
    slug: 'sk-singh',
    name: 'S.K. Singh',
    role: 'Television & Streaming Bureau Chief',
    verified: true,
    beats: ['Streaming Wars', 'Prestige TV Drama', 'Showrunner Deals', 'Primetime Emmys'],
    primaryCategories: ['tv', 'culture'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'S.K. Singh directs television and streaming coverage for Hollywood Time. He tracks showrunner overall deals, algorithmic commissioning models, and the cultural footprint of prestige serialized episodic drama across major global platforms.',
    credentials: ['Television Critics Association (TCA) Active Member', 'Episodic Narrative Analyst', 'West Coast Television Correspondent'],
    location: 'Burbank, CA',
  },
  'nk-mishra': {
    id: 'auth-nk-mishra',
    slug: 'nk-mishra',
    name: 'N.K. Mishra',
    role: 'Global Business & Culture Correspondent',
    verified: true,
    beats: ['Media Equity & Wall St.', 'Stadium Music Economics', 'Red Carpet Couture', 'Cinema Heritage'],
    primaryCategories: ['business', 'music', 'style', 'culture'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'N.K. Mishra is a senior correspondent reporting on the convergence of entertainment finance, music touring economics, and high-fashion red carpet strategy. His investigative dispatches examine Wall Street’s influence on creative production pipelines and cultural preservation.',
    credentials: ['Society of American Business Editors & Writers', 'Chartered Media Financial Analyst', 'Culture & Fashion Columnist'],
    location: 'Los Angeles & New York',
  },
};

export function getAllAuthors(): Author[] {
  return Object.values(VERIFIED_AUTHORS);
}

export const AUTHORS = getAllAuthors();

export function getAuthorBySlug(slug: string): Author | undefined {
  return VERIFIED_AUTHORS[slug];
}

/**
 * Returns the best assigned verified reporter for any given entertainment category
 */
export function getAuthorForCategory(category: string): Author {
  const cat = category.toLowerCase();
  if (cat === 'awards') return VERIFIED_AUTHORS['bidyanand'];
  if (cat === 'tv') return VERIFIED_AUTHORS['sk-singh'];
  if (cat === 'business' || cat === 'style' || cat === 'music') return VERIFIED_AUTHORS['nk-mishra'];
  if (cat === 'culture') return VERIFIED_AUTHORS['sk-singh'];
  return VERIFIED_AUTHORS['ak-singh']; // movies & default
}
