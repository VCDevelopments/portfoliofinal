# VCDevelopments portfolio

Portfolio site of Lothar Van Cauwenbergh (VCDevelopments): a scroll-driven WebGL experience built with Three.js.

1. The neon VCDevelopments logo in a snowy valley, with a periodic blueprint scan. Click it to shatter it; click anywhere else for a gust of snow (which also drifts away from the cursor). The Night switch darkens the valley.
2. Each project's case-study video plays on a floating panel as you arrive at it, with an overview card. Click it (or Learn more) for the pop-up: a full-size iPhone (and, for Relay, a MacBook) running the working demo, plus the project's story and pictures.

The demos live in `demos/` and are the real things: CreatorSlots is the real creatorslots.net homepage (`demos/creatorslots/app.html`, copied from the site's `public/index.html` with its form and logging switched off) on a MacBook and in iPhone Safari; VCDevelopments is this site itself in iPhone Safari. `demos/tour.js` plays each demo's guided tour.

3. Segmented blueprint rings that assemble, then a fly-through, with what I build (and typical timelines) and how a project runs.

Every demo has a guided tour ("Show me how it works" in the pop-up): a fingertip taps through the app with captions, and any real tap takes over. The pop-up also lists each project's changelog, and the devices show recent GitHub activity (live for public repos; `data/activity.json` holds a snapshot for private ones, written by `npm run pages`).

"Start a project" opens a short inquiry form (type, budget, timeline, message) that hands a ready email to the visitor's email app, or copies it. The site switches between English and Dutch (bottom right); Dutch project text lives in each project's `nl` block in `js/projects.js`.

Visits and events (project opened, tour played, inquiry, language) can be counted without cookies through Umami: set `UMAMI_ID` in `js/track.js`.

Case-study videos (4:5) are recorded from the demos' tours with `node tools/record-reels.mjs` (site served locally, Chrome installed) into `videos/`: `<slug>.mp4` at 1080 × 1350 for LinkedIn (kept out of the repository), `<slug>-web.mp4` and `<slug>-poster.jpg` for the site and the project pages.
4. Snow that bursts into the spinning neon logo, with a contact section and GitHub / LinkedIn links.

With reduced motion turned on in the device settings, the intro is skipped and scene changes are plain crossfades. Phones get a lighter render (lower pixel density, less anti-aliasing, fewer particles).

Each project's device sits on its own background gradient, taken from its picture
(`colors` in `js/projects.js`).

## Run locally

No build step. Serve the folder with any static server, for example:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Editing content

- Projects and social links: `js/projects.js`
  - after editing projects, run `node tools/build-pages.mjs` to regenerate each project's shareable page (`projects/<slug>/`), `sitemap.xml` and `robots.txt`
  - `#project-<slug>` on the home page opens that project's pop-up (e.g. `/#project-creatorslots`)
- Project pictures: `img/projects/` (rendered from the designs in `shots-src/`)
- Logo and LinkedIn banner files: `brand/`
