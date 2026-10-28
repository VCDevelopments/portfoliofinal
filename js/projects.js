// Portfolio content — one 3D device per project. Edit here to add, remove or reorder projects.
// Every project opens a pop-up with its full story (`details`) and pictures (`gallery`);
// one with a `url` also links to its code there.
export const PROJECTS = [
  {
    name: 'CreatorSlots',
    device: { laptop: { demo: 'demos/creatorslots/desktop.html', poster: 'img/screens/creatorslots-laptop.jpg' }, phone: { demo: 'demos/creatorslots/', poster: 'img/screens/creatorslots-phone.jpg' } },
    site: 'https://creatorslots.net', // the live product (`url` is a project's code)
    started: '2026-10-22', // first day of work; the live timer counts from here
    blurb: 'A slot studio that turns a Kick\nstream into its own slot game',
    stack: 'JavaScript · Supabase · Vercel · Resend · Stake Engine',
    image: 'img/projects/creatorslots.jpg',
    colors: ['#0F1412', '#168153', '#3DDC97'], // background gradient: top, bottom, glow (from the site)
    changelog: [
      { date: '2026-10-27', text: 'Personal preview pages for every streamer, with their name on the cover and an earnings estimate.', nl: 'Persoonlijke previewpagina’s voor elke streamer, met hun naam op de cover en een schatting van wat het kan opbrengen.' },
      { date: '2026-10-27', text: 'The site in Spanish and Portuguese, and pitches in the streamer’s own language.', nl: 'De site in het Spaans en Portugees, en pitches in de taal van de streamer.' },
      { date: '2026-10-27', text: 'A strict script policy on every page, rate limits and a full security audit.', nl: 'Een strikt scriptbeleid op elke pagina, rate limits en een volledige security-audit.' },
    ],
    nl: {
      blurb: 'Een slotstudio die een Kick-stream\nomtovert tot een eigen slotgame',
      status: 'Live · mijn hoofdproject',
      intro: 'CreatorSlots bouwt slotgames op maat voor Kick-streamers: hun naam op de rollen, hun emotes als symbolen en een bonusronde rond de grappen van hun community. De game gaat live op Stake, kost de streamer niets en betaalt hen elke maand een deel van de royalty. 18+.',
      sections: [
        { title: 'Van stream naar slot', text: 'Een streamer vult één formulier in. We schetsen hun slot uit hun emotes, kleuren en running jokes, ze krijgen twee rondes aanpassingen, en binnen één à twee weken staat de game live op Stake via Engine.' },
        { title: 'Een deal die je leest als een paytable', text: 'De homepage legt het hele akkoord uit zoals een slot zijn uitbetalingen toont: $0 vooraf, 40 tot 50% van de royalty, elke maand uitbetaald, dezelfde RTP voor iedereen. Een schuifbalk schat wat een slot kan opbrengen op basis van het aantal kijkers.' },
        { title: 'Achter de schermen', text: 'Een dashboard volgt elke streamer van pitch tot handtekening: geopend, geklikt, gespeelde demo’s, groei van hun kanaal. Pitches en opvolgmails gaan automatisch, in het Engels, Spaans of Portugees, en stoppen vanzelf bij een nee.' },
        { title: 'Veilig gebouwd', text: 'Elke pagina laat alleen haar eigen scripts lopen, elke tabel heeft row-level security, en gevoelige acties vragen 2FA. Wat bezoekers invullen gaat enkel naar de mensen die erop moeten reageren.' },
      ],
      captions: ['De homepage: de pitch, een slot die je kan laten draaien en de knop om je aan te melden.', 'De deal, gelezen als een paytable: $0 vooraf, een maandelijks aandeel, dezelfde RTP voor iedereen.', 'Van eerste bericht tot eerste uitbetaling, in vijf stappen.', 'Het aanmeldformulier voor streamers.'],
      demoNote: 'De echte homepage van creatorslots.net, op laptop en telefoon: laat de rollen draaien, schuif de schatter en open het aanmeldformulier. Niets wat je hier invult wordt verstuurd.',
    },
    demoNote: 'The real creatorslots.net homepage, on the laptop and the phone: spin the reels, move the earnings slider and open the application form. Nothing you fill in here is sent.',
    details: {
      status: 'Live · my main project',
      intro: 'CreatorSlots builds custom slot games for Kick streamers: their name on the reels, their emotes as symbols and a bonus round built on their community’s running jokes. The game goes live on Stake, costs the streamer nothing and pays them a share of the royalty every month. 18+.',
      sections: [
        { title: 'From stream to slot', text: 'A streamer fills in one form. We sketch their slot from their emotes, colours and running jokes, they get two rounds of changes, and within one to two weeks the game is live on Stake through Engine.' },
        { title: 'A deal you read like a paytable', text: 'The homepage lays out the whole arrangement the way a slot shows its payouts: $0 upfront, 40 to 50% of the royalty, paid monthly, the same RTP for everyone. A slider estimates what a slot could earn from the streamer’s viewer count.' },
        { title: 'Behind the scenes', text: 'A dashboard follows every streamer from pitch to signature: opened, clicked, demos played, channel growth. Pitches and follow-ups go out automatically, in English, Spanish or Portuguese, and stop on their own at a no.' },
        { title: 'Built to be safe', text: 'Every page runs only its own scripts, every table has row-level security, and sensitive actions need 2FA. What visitors fill in only reaches the people who need to answer it.' },
      ],
    },
    gallery: [
      { src: 'img/projects/creatorslots.jpg', caption: 'The homepage: the pitch, a slot you can spin and the button to apply.' },
      { src: 'img/projects/creatorslots-1.jpg', caption: 'The deal, read like a paytable: $0 upfront, a monthly share, the same RTP for everyone.' },
      { src: 'img/projects/creatorslots-2.jpg', caption: 'From first message to first payout, in five steps.' },
      { src: 'img/projects/creatorslots-3.jpg', caption: 'The application form for streamers.' },
    ],
  },
  {
    name: 'VCDevelopments',
    repo: { github: 'VCDevelopments/portfoliofinal' }, // public: commit activity is read live (private repos: see tools/build-pages.mjs)
    changelog: [
      { date: '2026-10-19', text: 'Guided tours of every app, services and an inquiry form, and a Dutch version.', nl: 'Rondleidingen door elke app, diensten en een aanvraagformulier, en een Nederlandse versie.' },
      { date: '2026-10-18', text: 'Every project runs as a working app on a 3D iPhone or MacBook.', nl: 'Elk project draait als werkende app op een 3D-iPhone of -MacBook.' },
      { date: '2026-10-18', text: 'Scrolling follows instantly; flowing silk backdrops behind the projects.', nl: 'Scrollen volgt meteen; vloeiende zijden achtergronden achter de projecten.' },
      { date: '2026-10-17', text: 'Contact section, night mode, interactive snow and link previews.', nl: 'Contactsectie, nachtmodus, interactieve sneeuw en linkvoorbeelden.' },
      { date: '2026-10-16', text: 'Logos burst into particles on click and rebuild from the bottom up.', nl: 'Logo’s spatten bij een klik uiteen in deeltjes en bouwen zich van onder naar boven weer op.' },
      { date: '2026-10-15', text: 'First version: the snowy valley, the projects and the blueprint rings.', nl: 'Eerste versie: de besneeuwde vallei, de projecten en de blauwdrukringen.' },
    ],
    nl: {
      blurb: 'Dit portfolio: een 3D-site\ngestuurd door scrollen, gebouwd met Three.js',
      status: 'Live',
      intro: 'De site waar je nu op bent: een 3D-ervaring gestuurd door scrollen, van nul geschreven met Three.js, zonder framework of build-stap.',
      sections: [
        { title: 'Vier scènes, één scroll', text: 'Een besneeuwde vallei met het neonlogo, deze projecten die live draaien op 3D-toestellen die je kan gebruiken, een blauwdrukgyroscoop in draadmodel en een sneeuwwolk die het logo wordt. Elke scène wordt buiten beeld getekend en een laatste shader mengt ze met een glitch-overgang terwijl je scrolt.' },
        { title: 'Gegenereerd, niet gemodelleerd', text: 'Het terrein, de toestellen en het logo zijn allemaal in code gebouwd, zonder ingeladen 3D-modellen. Elke telefoon draait een werkende demo van zijn project die je kan uitproberen, met een live timer eronder die de tijd telt die erin gestoken is.' },
        { title: 'Gemaakt om mee te spelen', text: 'Klik op een logo en het spat uiteen in deeltjes die het van onder naar boven weer opbouwen. Beweeg over een telefoon en hij draait naar je toe zodat je de app erop kan uitproberen. Het geluid volgt hoe snel je scrolt.' },
        { title: 'Vlot gehouden', text: 'Scrollen volgt een veer voor vloeiende beweging, afbeeldingen worden geladen voor ze nodig zijn, scènes buiten beeld slaan hun werk over en elk bestand heeft een versie zodat bezoekers altijd de nieuwste krijgen.' },
      ],
      captions: ['De startpagina: het neonlogo in een besneeuwde vallei.', 'Hoe het gebouwd is: vier scènes, gemengd door één shader.', 'De details: logo’s die uiteenspatten, toestellen die oplichten bij hover.'],
      demoNote: 'Deze site zelf, zoals een iPhone ze in Safari toont: tik op het logo, zet Nacht aan en scroll erdoor.',
    },
    device: { phone: { demo: 'demos/vcdevelopments/', poster: 'img/screens/vcdevelopments-phone.jpg' } },
    demoNote: 'This very site, as an iPhone shows it in Safari: tap the logo, turn on Night and scroll through it.',
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
        { title: 'Four scenes, one scroll', text: 'A snowy valley with the neon logo, these projects running live on 3D phones you can use, a wireframe blueprint gyroscope, and a cloud of snow that becomes the logo. Each scene is drawn off-screen, and a final shader blends them with a glitch transition as you scroll.' },
        { title: 'Generated, not modelled', text: 'The terrain, the devices and the logo are all built in code, no 3D models loaded. Every phone runs a working demo of its project that you can tap through, with a live timer underneath counting the time put into it.' },
        { title: 'Made to be played with', text: 'Click a logo and it bursts into particles that rebuild it from the bottom up. Hover a phone and it turns to face you so you can try the app on it. The sound follows how fast you scroll.' },
        { title: 'Kept smooth', text: 'Scrolling follows a spring for smooth motion, pictures are loaded before they are needed, scenes out of view skip their work, and every file is versioned so visitors always get the latest one.' },
      ],
    },
    gallery: [
      { src: 'img/projects/portfolio.jpg', caption: 'The landing page: the neon logo in a snowy valley.' },
      { src: 'img/projects/portfolio-2.jpg', caption: 'How it is built: four scenes blended by one shader.' },
      { src: 'img/projects/portfolio-3.jpg', caption: 'The details: shattering logos, devices that light up on hover.' },
    ],
  },
];

// URL-safe name, used for each project's page (projects/<slug>/) and deep link (#project-<slug>)
export const slugOf = (p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// the project's text in a language: Dutch fields override the English ones where they exist
export function localize(p, lang) {
  const nl = lang === 'nl' && p.nl;
  if (!nl) return p;
  return {
    ...p,
    blurb: nl.blurb,
    demoNote: nl.demoNote,
    details: { ...p.details, status: nl.status, intro: nl.intro, sections: nl.sections },
    gallery: p.gallery.map((g, i) => ({ ...g, caption: nl.captions[i] ?? g.caption })),
    changelog: p.changelog?.map((c) => ({ ...c, text: c.nl ?? c.text })),
  };
}

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/VCDevelopments' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lotharvancauwenbergh/' },
  { label: 'Repositories', href: 'https://github.com/VCDevelopments?tab=repositories' },
];
