// Portfolio content — one ice block per project. Edit here to add, remove or reorder projects.
// Every project opens a pop-up with its full story (`details`) and pictures (`gallery`);
// one with a `url` also links to its code there.
export const PROJECTS = [
  {
    name: 'Pulse',
    started: '2026-10-13', // first day of work; older projects melt and drip more
    blurb: 'Ads on autopilot: learns what\nsells and moves the budget there',
    stack: 'Python · SQLite · ML · Meta & TikTok APIs · Claude',
    image: 'img/projects/pulse.jpg',
    colors: ['#12102B', '#3C2A7A', '#8B6CF6'], // background gradient: top, bottom, glow (from the project's picture)
    details: {
      status: 'In progress',
      intro: 'Pulse runs the advertising for an online store on autopilot. It pulls in sales and ad results, learns which ads actually sell, moves the budget toward them and plans new campaigns, so a small daily budget keeps working without someone watching it all day.',
      sections: [
        { title: 'Everything in one place', text: 'Every 15 minutes Pulse syncs products and orders from Shopify, campaigns and results from Meta and TikTok, and contacts from the CRM into one database. Each order is matched to the ad that brought it in, so every ad shows what it really earned, not just how many clicks it got.' },
        { title: 'It learns what sells', text: 'Three models retrain as new results come in: one predicts clicks, one sales and one how likely a video is to take off. They learn from how each ad is made (user-generated or not, the hook, the length, captions), so a new idea can be scored before anyone films it.' },
        { title: 'Autopilot, with guardrails', text: 'Every four hours it splits the daily budget across ad sets by how likely each one is to be profitable, pauses ads that spend money without selling, and logs every change. Every ad set keeps enough to keep learning, budgets move at most 30% a day, and the total never goes over the limit.' },
        { title: 'New campaigns, start to finish', text: 'Pulse plans new campaigns around the best-selling products, writes a creative brief for every ad, has AI video models generate short vertical ads from it, and creates the campaigns paused, ready for a final check. Their results flow back in and teach the next round.' },
      ],
    },
    gallery: [
      { src: 'img/projects/pulse.jpg', caption: 'The live dashboard: spend, results and the rules that act on them.' },
      { src: 'img/projects/pulse-1.jpg', caption: 'How it works: sync, learn, act, and feed the results back in.' },
      { src: 'img/projects/pulse-2.jpg', caption: 'An autopilot run: the daily budget moves to what works, within guardrails.' },
      { src: 'img/projects/pulse-3.jpg', caption: 'New campaigns: from best product to a finished video ad.' },
    ],
  },
  {
    name: 'Relay',
    started: '2026-10-15',
    blurb: 'Share files between laptop\nand phone with a QR code',
    stack: 'Python · HTML · HTTPS · QR',
    image: 'img/projects/relay.jpg',
    colors: ['#0B2A2E', '#11605F', '#3DE0C0'],
    details: {
      status: 'Personal tool',
      intro: 'Relay moves files between a laptop and a phone over home Wi-Fi: no cables, no cloud, no accounts. Open it, scan a code, and drop files on either side.',
      sections: [
        { title: 'Scan once and you’re connected', text: 'The laptop runs a small Python server and shows a page with a QR code. The code holds the laptop’s address and a private access key, so scanning it opens the same page on the phone, already signed in. The key is kept, so the phone stays paired next time.' },
        { title: 'Drop files on either side', text: 'Drag files onto the page on the laptop, or pick them on the phone. They upload straight into a shared folder on the laptop, the list updates on both devices, and anything can be downloaded or deleted from either one.' },
        { title: 'Nothing leaves the house', text: 'Files travel directly between the two devices inside your own network. There is no cloud service in between, no account to make and no upload limit, and nothing works without the access key.' },
        { title: 'Straight into Photos', text: 'The phone connects over HTTPS, which lets the iPhone share sheet save photos and videos directly to the camera roll instead of only to Files.' },
      ],
    },
    gallery: [
      { src: 'img/projects/relay.jpg', caption: 'The laptop page with its QR code, and the same files on the phone.' },
      { src: 'img/projects/relay-1.jpg', caption: 'Step 1: scan once and the phone is paired.' },
      { src: 'img/projects/relay-2.jpg', caption: 'How files travel: directly across your own Wi-Fi.' },
      { src: 'img/projects/relay-3.jpg', caption: 'On the phone: save straight to Photos, with live upload progress.' },
    ],
  },
  {
    name: 'ShotGuide',
    started: '2026-10-16',
    blurb: 'iOS camera that coaches you to\nrecreate any aesthetic photo',
    stack: 'Swift · SwiftUI · AVFoundation · Vision · Apple Intelligence · Claude',
    image: 'img/projects/shotguide.jpg',
    colors: ['#1A1412', '#5A3A2E', '#FFB38A'],
    details: {
      status: 'In progress · iOS app',
      intro: 'ShotGuide helps you take the photo you saw online. Pick an inspiration, and the camera works out how it was taken and coaches you live, frame by frame, until your shot matches it.',
      sections: [
        { title: 'Find the shot', text: 'Search Pinterest inside the app (you sign in yourself; ShotGuide never sees your password), search openly licensed photos, paste any link or pick an image from Photos.' },
        { title: 'A breakdown of how it was taken', text: 'The photo is analysed for the lens (0.5× to 8×), camera height, tilt, distance and light, with step-by-step instructions. Its colour grade is measured from the pixels and turned into a matching filter. This runs on the phone with Apple Intelligence, or with Claude for the most detail, and every breakdown is saved to your Library.' },
        { title: 'Coached live, on every frame', text: 'A glowing aim dot is pinned to the real world and shows where to point; you just turn the phone until the circle sits on it. Tips about tilt, level, distance, light and a busy background adapt to the kind of shot: portrait, object, building or landscape. Exposure, focus and the matching look set themselves.' },
        { title: 'Shoot when everything is green', text: 'A checklist (angle, framing, light, focus, steady, background) only turns green once the camera has actually confirmed each item, and a ring on the shutter shows how close you are. Auto mode takes the shot by itself. The result is cropped to Instagram’s 4:5 with the look applied, ready to compare, save or share.' },
        { title: 'It learns your taste', text: 'ShotGuide can study the pins on a Pinterest board and the photos you keep, then discover new openly licensed photos that fit your style.' },
      ],
    },
    gallery: [
      { src: 'img/projects/shotguide.jpg', caption: 'From inspiration to live coaching in the camera.' },
      { src: 'img/projects/shotguide-1.jpg', caption: 'Step 1: find a shot on Pinterest, Openverse, a link or your Photos.' },
      { src: 'img/projects/shotguide-2.jpg', caption: 'Step 2: lens, height, tilt, distance, steps and the colour look.' },
      { src: 'img/projects/shotguide-3.jpg', caption: 'Step 3: everything confirmed. Shoot.' },
    ],
  },
  {
    name: 'VCDevelopments',
    started: '2026-10-15',
    blurb: 'This portfolio: a scroll-driven\n3D site built with Three.js',
    stack: 'JavaScript · Three.js · GLSL · WebGL',
    url: 'https://github.com/VCDevelopments/portfoliofinal',
    image: 'img/projects/portfolio.jpg',
    colors: ['#2E3440', '#6C7A8C', '#7DC8FF'],
    details: {
      status: 'Live',
      intro: 'The site you are on: a scroll-driven 3D experience written from scratch with Three.js, without a framework or a build step.',
      sections: [
        { title: 'Four scenes, one scroll', text: 'A snowy valley with the neon logo, these projects frozen in ice, a wireframe blueprint gyroscope, and a cloud of snow that becomes the logo. Each scene is drawn off-screen, and a final shader blends them with a glitch transition as you scroll.' },
        { title: 'Generated, not modelled', text: 'The terrain, the ice chunks, their textures and the logo are all built in code from noise, so every ice block has its own shape. The longer a project has been running, the more its block melts and drips, with a live timer underneath.' },
        { title: 'Made to be played with', text: 'Click a logo and it bursts into particles that rebuild it from the bottom up. Hover a block and its preview slides out of the ice. The sound follows how fast you scroll.' },
        { title: 'Kept smooth', text: 'Scrolling follows a spring for smooth motion, pictures are loaded before they are needed, scenes out of view skip their work, and every file is versioned so visitors always get the latest one.' },
      ],
    },
    gallery: [
      { src: 'img/projects/portfolio.jpg', caption: 'The landing page: the neon logo in a snowy valley.' },
      { src: 'img/projects/portfolio-2.jpg', caption: 'How it is built: four scenes blended by one shader.' },
      { src: 'img/projects/portfolio-3.jpg', caption: 'The details: shattering logos, melting ice, previews that slide out.' },
    ],
  },
];

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/VCDevelopments' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lotharvancauwenbergh/' },
  { label: 'Repositories', href: 'https://github.com/VCDevelopments?tab=repositories' },
];
