// External links (socials, repositories) always open in a new tab so the portfolio stays open.
// Some browsers, notably in-app browsers, ignore target="_blank", so the site opens the tab itself
// and only falls back to the plain link when that is blocked.

export function openExternal(url) {
  const w = window.open(url, '_blank');
  if (!w) return false; // blocked: let the normal link behaviour take over
  try { w.opener = null; } catch {} // the new page cannot reach back into the portfolio
  return true;
}

export function installExternalLinks() {
  for (const a of document.querySelectorAll('a[href^="http"]')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="http"]');
    // leave modified clicks (cmd/ctrl/shift/middle) to the browser
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openExternal(a.href)) e.preventDefault();
  });
}
