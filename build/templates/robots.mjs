/* robots.txt, in two postures.

   The difference between them is not "allow" versus "deny" -- crawling is open
   in both. Staging refuses INDEXING through the meta tag and leaves crawling
   open deliberately: a robots.txt Disallow would stop Google fetching the page
   at all, so it would never see the noindex and could still list a bare URL,
   and Facebook, LinkedIn, Twitter, Slack and WhatsApp all honour robots.txt,
   so disallowing would kill the link preview card too.

   Live adds the two things staging withholds: the sitemap, and the
   photographs. `Disallow: /images/` is right while the design is unfinished
   and wrong the moment it ships -- this is a portfolio, and 522 captioned
   photographs are a large part of what there is to find.

   On the AI crawlers: they are named explicitly rather than left to the
   wildcard, because for a studio whose work is the reason to cite it, being
   readable by answer engines is the whole point. Two of these are not
   crawlers at all -- Google-Extended and Applebot-Extended grant permission
   for Gemini and Apple Intelligence to USE content Googlebot and Applebot
   already fetched. Denying them removes the studio from those answers without
   removing it from those search results, which is the worst of both.

   If the studio ever wants out of AI TRAINING while staying in AI SEARCH, the
   line to change is CCBot -- a bulk training corpus -- and not GPTBot,
   ClaudeBot or PerplexityBot, which are what put the work in front of a
   person who is asking a question right now.                               */

/* search and answer engines: these are what cite the site to a reader */
export const AI_AGENTS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended',
  'DuckAssistBot', 'YouBot', 'Amazonbot', 'Meta-ExternalAgent',
  'cohere-ai', 'Diffbot', 'Bytespider',
  /* bulk training corpus, listed last because it is the one to reconsider
     if the studio's view on training ever differs from its view on search */
  'CCBot',
];

const live = origin => [
  `# ${origin}`,
  '#',
  '# Open to ordinary crawlers and to answer engines alike. The work is the',
  '# reason anyone would cite this studio; hiding it from the places people',
  '# now ask their questions would be self-defeating.',
  '',
  'User-agent: *',
  'Allow: /',
  '',
  '# The editor. Nothing secret is behind this -- it asks for a password and',
  '# holds no key -- but there is no reason for it to turn up in a search',
  '# result, and every reason not to advertise it.',
  'Disallow: /admin/',
  '',
  '# Answer engines and AI search, named so the intent is on the record',
  '# rather than resting on the wildcard above. See build/templates/robots.mjs',
  '# for which of these to change if the position on training ever differs',
  '# from the position on search.',
  ...AI_AGENTS.map(a => `User-agent: ${a}`),
  'Allow: /',
  '',
  `Sitemap: ${origin}/sitemap.xml`,
  '',
].join('\n');

const staging = () => [
  '# Staging. Crawling is deliberately left open so that crawlers can read the',
  '# noindex in the page, and so link previews keep working; indexing is',
  '# refused by the meta tag instead.',
  '#',
  '# The photographs are the exception. A meta tag cannot reach an image, and',
  '# GitHub Pages ignores the _headers file that used to carry X-Robots-Tag',
  '# for them, so refusing the directory is the only lever left. og-image.jpg',
  '# sits at the root and stays fetchable, so link previews still work.',
  '#',
  '# Note: robots.txt is read per-origin, so on a GitHub project page served',
  '# from /<repo>/ this file is never fetched -- crawlers look at the domain',
  '# root instead. It only takes effect on the custom domain at launch. Until',
  '# then the noindex meta tag is what actually holds the pages back.',
  'User-agent: *',
  'Allow: /',
  'Disallow: /images/',
  '',
].join('\n');

export const robotsTxt = (mode, origin) => (mode === 'on' ? live(origin) : staging());
