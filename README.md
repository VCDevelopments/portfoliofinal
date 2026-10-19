# VCDevelopments portfolio

Portfolio site of Lothar Van Cauwenbergh (VCDevelopments): a scroll-driven WebGL experience built with Three.js.

1. The neon VCDevelopments logo in a snowy valley, with a periodic blueprint scan. Click it to shatter it; click anywhere else for a gust of snow (which also drifts away from the cursor). The Night switch darkens the valley.
2. Each project runs on a 3D iPhone (Relay also on a laptop) with an overview card. The screens are working demos you can use right there; the pop-up (click a device or Learn more) has a full-size iPhone with the same demo, plus the project's story and pictures.

The demos live in `demos/`: small iOS-style apps with sample data (`demos/ios.css` and `demos/ios.js` hold the shared iPhone screen and controls). ShotGuide can use the visitor's own camera if they allow it; Relay's phone and laptop sync inside the browser, and dropped files never leave it. Phones and tablets show a picture on the 3D phones and run the demo in the pop-up.
3. Segmented blueprint rings that assemble, then a fly-through.
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
  - `#project-<slug>` on the home page opens that project's pop-up (e.g. `/#project-shotguide`)
- Project pictures: `img/projects/` (rendered from the designs in `shots-src/`)
- Logo and LinkedIn banner files: `brand/`
