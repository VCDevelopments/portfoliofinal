// Cookieless visit and event counts with Umami (umami.is): no cookies, no personal data, nothing to
// consent to. Off until UMAMI_ID holds the site's website ID; until then track() does nothing.
// Only visits on vcdevelopments.info are counted, so local testing never shows up.
const UMAMI_ID = '';

export function initAnalytics() {
  if (!UMAMI_ID) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.dataset.websiteId = UMAMI_ID;
  s.dataset.domains = 'vcdevelopments.info';
  document.head.append(s);
}

// e.g. track('project-open', { project: 'pulse' })
export function track(name, data) {
  try { window.umami?.track(name, data); } catch {}
}
