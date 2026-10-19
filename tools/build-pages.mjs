// Writes a plain, shareable page per project (projects/<slug>/index.html), plus sitemap.xml and
// robots.txt, from the same data the 3D site uses (js/projects.js). Run after editing projects:
//   node tools/build-pages.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PROJECTS, slugOf } from '../js/projects.js';

const SITE = 'https://vcdevelopments.info';
const root = new URL('..', import.meta.url);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(p) {
  const slug = slugOf(p);
  const url = `${SITE}/projects/${slug}/`;
  const desc = p.details.intro;
  const pics = p.gallery.map((g) => `<figure><img src="../../${esc(g.src)}" alt="${esc(g.caption)}" width="1200" height="800" loading="lazy" /><figcaption>${esc(g.caption)}</figcaption></figure>`).join('\n      ');
  const sections = p.details.sections.map((s) => `<section><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></section>`).join('\n      ');
  // the case-study video (tools/record-reels.mjs), when it has been recorded
  const video = existsSync(new URL(`videos/${slug}.mp4`, root)) && `videos/${slug}.mp4`;
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, description: desc, url, image: `${SITE}/${p.image}`, author: { '@type': 'Person', name: 'Lothar Van Cauwenbergh', url: SITE }, ...(p.url ? { codeRepository: p.url } : {}) };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.name)} · VCDevelopments</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="VCDevelopments" />
  <meta property="og:title" content="${esc(p.name)} · VCDevelopments" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/${esc(p.image)}" />
  <meta property="og:image:width" content="2400" />
  <meta property="og:image:height" content="1600" />
  <meta property="og:image:alt" content="${esc(p.gallery[0].caption)}" />
  <meta name="twitter:card" content="summary_large_image" />${video ? `
  <meta property="og:video" content="${SITE}/${video}" />
  <meta property="og:video:secure_url" content="${SITE}/${video}" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1080" />
  <meta property="og:video:height" content="1350" />` : ''}
  <meta name="theme-color" content="#1e242e" />
  <link rel="icon" type="image/svg+xml" href="../../brand/vcd-logo-28.svg" />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Outfit:wght@300;700;800&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    body { margin: 0; background: #1e242e; color: #f2f5f8; font: 300 18px/1.6 "Outfit", sans-serif; }
    main { max-width: 920px; margin: 0 auto; padding: 32px 20px 72px; }
    a { color: #fff; }
    .top { display: flex; justify-content: space-between; align-items: center; gap: 16px; font: 500 12px/1 "IBM Plex Mono", monospace; }
    .top a { text-decoration: none; }
    .status { margin-top: 56px; font: 500 12px/1 "IBM Plex Mono", monospace; letter-spacing: 0.14em; text-transform: uppercase; color: ${p.colors[2]}; }
    h1 { font: 800 clamp(44px, 8vw, 72px)/1 "Outfit", sans-serif; letter-spacing: -0.04em; margin: 12px 0 18px; }
    .intro { font-size: 21px; max-width: 62ch; color: #e8edf3; }
    figure { margin: 32px 0 0; }
    figure img { width: 100%; height: auto; display: block; }
    .reel video { display: block; width: min(100%, 432px); height: auto; margin: 0 auto; }
    .reel figcaption { text-align: center; }
    figcaption { margin-top: 8px; font: 500 13px/1.4 "IBM Plex Mono", monospace; color: rgba(255, 255, 255, 0.75); }
    .sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px 36px; margin-top: 40px; }
    h2 { font: 700 22px/1.2 "Outfit", sans-serif; margin: 0 0 8px; }
    section p { margin: 0; color: #dbe2ea; }
    .foot { margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.15); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: center; font: 500 13px/1.5 "IBM Plex Mono", monospace; }
    .btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border: 1px solid #fff; text-decoration: none; }
    .btn:hover, .btn:focus-visible { background: #fff; color: #1e242e; }
  </style>
</head>
<body>
  <main>
    <nav class="top" aria-label="Site"><a href="../../">← VCDevelopments</a><a href="../../#project-${slug}">View in the 3D portfolio</a></nav>
    <p class="status">${esc(p.details.status)}</p>
    <h1>${esc(p.name)}</h1>
    <p class="intro">${esc(desc)}</p>
    <div class="gallery">
      ${video ? `<figure class="reel"><video src="../../${video}" poster="../../${esc(p.device.phone.poster)}" autoplay muted loop playsinline width="1080" height="1350"></video><figcaption>${esc(p.name)}, playing its guided tour. <a href="../../#project-${slug}">Try it yourself ↗</a></figcaption></figure>
      ` : ''}${pics}
    </div>
    <div class="sections">
      ${sections}
    </div>
    <div class="foot">
      <span>${esc(p.stack)}</span>
      <span>${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">View the code on GitHub ↗</a> ` : ''}<a class="btn" href="mailto:info.vcdevelopments@gmail.com">Email me ↗</a> <a class="btn" href="https://www.linkedin.com/in/lotharvancauwenbergh/" target="_blank" rel="noopener">Message me on LinkedIn ↗</a></span>
    </div>
  </main>
</body>
</html>
`;
}

for (const p of PROJECTS) {
  const dir = new URL(`projects/${slugOf(p)}/`, root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page(p));
}
const urls = ['', ...PROJECTS.map((p) => `projects/${slugOf(p)}/`)];
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
// commit activity for projects whose code is private: only the date of the last commit and the
// number of commits in the last 30 days are published (data/activity.json), read with the GitHub CLI
const PRIVATE_REPOS = { pulse: 'VCDevelopments/ads' };
const activity = {};
for (const [slug, repo] of Object.entries(PRIVATE_REPOS)) {
  try {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const list = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/commits?per_page=100&since=${since}`], { encoding: 'utf8' }));
    if (list.length) activity[slug] = { last: Date.parse(list[0].commit.committer.date), commits30: list.length };
  } catch (e) { console.warn(`activity for ${slug} skipped: ${e.message.split('\n')[0]}`); }
}
mkdirSync(new URL('data/', root), { recursive: true });
writeFileSync(new URL('data/activity.json', root), JSON.stringify(activity) + '\n');
console.log(`wrote ${PROJECTS.length} project pages, sitemap.xml, robots.txt, data/activity.json`);
