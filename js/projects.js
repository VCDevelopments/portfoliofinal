// Portfolio content — one ice block per project. Edit here to add, remove or reorder projects.
// A project with a `url` links to it; one with `details` instead opens a pop-up explaining it.
export const PROJECTS = [
  {
    name: 'Pulse',
    blurb: 'Ads automation dashboard:\nrules that run your campaigns',
    stack: 'In progress · Dashboard',
    image: 'img/projects/pulse.jpg',
    colors: ['#12102B', '#3C2A7A', '#8B6CF6'], // background gradient: top, bottom, glow (from the project's picture)
    // no url: clicking opens a pop-up with this text instead
    details: {
      status: 'In progress',
      body: [
        'Pulse is a dashboard I am building to take the repetitive work out of running ad campaigns.',
        'Spend, results and cost per result from every campaign sit in one overview, so it is clear at a glance what is working.',
        'On top of that you set simple rules, like lowering a budget when results get too expensive, and Pulse acts on them automatically and tells you what it did.',
      ],
    },
  },
  {
    name: 'Relay',
    blurb: 'Share files between laptop\nand phone with a QR code',
    stack: 'Python · HTML · QR',
    image: 'img/projects/relay.jpg',
    colors: ['#0B2A2E', '#11605F', '#3DE0C0'], // background gradient: top, bottom, glow (from the project's picture)
    details: {
      status: 'Personal tool',
      body: [
        'Relay moves files between my laptop and my phone over home Wi-Fi: no cables, no cloud, no accounts.',
        'The laptop runs a small Python server and shows a QR code. Scanning it opens the same page on the phone, with a private access key built in.',
        'Drop files on either side and they show up on the other. The phone connects over HTTPS, so an iPhone can save photos straight to the camera roll.',
      ],
    },
  },
  {
    name: 'ChiActive',
    blurb: 'Activewear store + design\ngallery and studio',
    stack: 'HTML · JavaScript',
    url: 'https://github.com/VCDevelopments/ChiActive',
    image: 'img/projects/chiactive.jpg',
    colors: ['#111111', '#3B1C14', '#E4572E'], // background gradient: top, bottom, glow (from the project's picture)
  },
  {
    name: 'VCDevelopments',
    blurb: 'This portfolio: a scroll-driven\n3D site built with Three.js',
    stack: 'JavaScript · Three.js · WebGL',
    url: 'https://github.com/VCDevelopments/portfoliofinal',
    image: 'img/projects/portfolio.jpg',
    colors: ['#2E3440', '#6C7A8C', '#7DC8FF'], // background gradient: top, bottom, glow (from the project's picture)
  },
];

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/VCDevelopments' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lotharvancauwenbergh/' },
  { label: 'Repositories', href: 'https://github.com/VCDevelopments?tab=repositories' },
];
