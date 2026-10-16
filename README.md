# VCDevelopments portfolio

Portfolio site of Lothar Van Cauwenbergh (VCDevelopments): a scroll-driven WebGL experience built with Three.js.

1. A monument of the VCDevelopments logo built from snow bricks, with a periodic blueprint scan.
2. Projects frozen in ice blocks, each with an overview card. Hover a block to reveal its picture; click to open the repository.
3. Segmented blueprint rings that assemble, then a fly-through.
4. Snow that bursts into the logo as a spinning blueprint, with GitHub and LinkedIn links.

Each project's ice block sits on its own background gradient, taken from its picture
(`colors` in `js/projects.js`).

## Run locally

No build step. Serve the folder with any static server, for example:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Editing content

- Projects and social links: `js/projects.js`
- Project pictures: `img/projects/` (rendered from the designs in `shots-src/`)
- Logo and LinkedIn banner files: `brand/`
