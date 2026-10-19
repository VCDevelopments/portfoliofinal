// Recent commit activity per project, shown beside its device. Public repos are read live from the
// GitHub API (cached for 10 minutes per visit); private ones come from data/activity.json, a snapshot
// that tools/build-pages.mjs writes with the owner's own GitHub access.
const activity = {};
export const activityOf = (slug) => activity[slug];

export async function loadActivity(projects, slugOf) {
  try {
    const r = await fetch('data/activity.json', { cache: 'no-cache' });
    if (r.ok) Object.assign(activity, await r.json());
  } catch {}
  await Promise.all(projects.filter((p) => p.repo?.github).map(async (p) => {
    const slug = slugOf(p), key = `vcd-gh-${slug}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key));
      if (cached && Date.now() - cached.at < 600000) { activity[slug] = cached.data; return; }
    } catch {}
    try {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const r = await fetch(`https://api.github.com/repos/${p.repo.github}/commits?per_page=100&since=${since}`);
      if (!r.ok) return; // rate-limited or offline: keep the snapshot
      const list = await r.json();
      if (!list.length) return;
      const data = { last: Date.parse(list[0].commit.committer.date), commits30: list.length };
      activity[slug] = data;
      try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch {}
    } catch {}
  }));
}
