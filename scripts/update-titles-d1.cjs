const { execSync } = require('child_process');

function formatJournalisticHeadline(raw) {
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

  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean;
}

function generateSeoRewrittenTitle(rawTitle, category) {
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
  const catAnchors = {
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

  let reworked = clean
    .replace(/\bsets release date for\b/gi, 'Locks in Official Debut for')
    .replace(/\bsets release for\b/gi, 'Locks in Official Debut for')
    .replace(/\bconfirms\b/gi, 'Breaks Silence to Confirm')
    .replace(/\bcasts\b/gi, 'Enlists Star Talent for')
    .replace(/\bteases\b/gi, 'Offers Rare Revealing Clues on')
    .replace(/\breturns to\b/gi, 'Plots Dramatic Return to')
    .replace(/\bbegins filming\b/gi, 'Officially Kicks Off Production on')
    .trim();

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

  if (reworked.length > 105) {
    const trimmed = reworked.slice(0, 100);
    const lastSp = trimmed.lastIndexOf(' ');
    reworked = (lastSp > 45 ? trimmed.slice(0, lastSp) : trimmed) + '...';
  }

  return reworked.replace(/::+/g, ':').replace(/\s+/g, ' ').trim();
}

console.log('Fetching posts from Cloudflare D1...');
const output = execSync(
  'npx wrangler d1 execute hollywoodtime-db --command "SELECT id, category, title FROM posts WHERE id LIKE \'ht-%\'" --remote --json --yes',
  { encoding: 'utf-8' }
);

const data = JSON.parse(output);
const posts = data[0]?.results || [];

console.log(`Found ${posts.length} auto-posted stories in D1 to inspect.`);

let updateSql = '';
let updatedCount = 0;

for (const p of posts) {
  const newTitle = generateSeoRewrittenTitle(p.title, p.category);
  if (newTitle && newTitle !== p.title) {
    const escapedTitle = newTitle.replace(/'/g, "''");
    updateSql += `UPDATE posts SET title = '${escapedTitle}' WHERE id = '${p.id}';\n`;
    updatedCount++;
    if (updatedCount <= 8) {
      console.log(`\n[${updatedCount}] OLD: ${p.title}`);
      console.log(`    NEW: ${newTitle}`);
    }
  }
}

console.log(`\nTotal titles to update: ${updatedCount}`);

if (updateSql) {
  require('fs').writeFileSync('/tmp/update-titles.sql', updateSql);
  console.log('Executing batch SQL update in Cloudflare D1...');
  execSync(
    'npx wrangler d1 execute hollywoodtime-db --file /tmp/update-titles.sql --remote --yes',
    { stdio: 'inherit' }
  );
  console.log('✅ All D1 titles updated successfully with rewritten SEO titles!');
}
