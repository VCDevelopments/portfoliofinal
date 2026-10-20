// Portfolio content — one 3D device per project. Edit here to add, remove or reorder projects.
// Every project opens a pop-up with its full story (`details`) and pictures (`gallery`);
// one with a `url` also links to its code there.
export const PROJECTS = [
  {
    name: 'Pulse',
    changelog: [
      { date: '2026-10-14', text: 'Two-step email sign-in, password resets and an admin page.', nl: 'Inloggen in twee stappen via e-mail, wachtwoord herstellen en een beheerpagina.' },
      { date: '2026-10-14', text: 'Logins and a light, dark and system theme.', nl: 'Accounts en een licht, donker en systeemthema.' },
      { date: '2026-10-13', text: 'Starter models trained on published benchmarks, until a store has its own data.', nl: 'Startmodellen getraind op gepubliceerde benchmarks, tot een winkel eigen data heeft.' },
      { date: '2026-10-13', text: 'Setup wizard and a live dashboard that runs on your own computer.', nl: 'Installatiewizard en een live dashboard dat op je eigen computer draait.' },
      { date: '2026-10-13', text: 'First version: syncs Shopify, Meta and TikTok, with a daily-budget autopilot.', nl: 'Eerste versie: synchroniseert Shopify, Meta en TikTok, met een autopilot op het dagbudget.' },
    ],
    nl: {
      blurb: 'Advertenties op autopilot: leert wat\nverkoopt en zet daar het budget op',
      status: 'In ontwikkeling',
      intro: 'Pulse draait de advertenties van een webshop op autopilot. Het haalt verkoop- en advertentieresultaten binnen, leert welke advertenties echt verkopen, verschuift het budget daarheen en plant nieuwe campagnes, zodat een klein dagbudget blijft werken zonder dat iemand er de hele dag naar moet kijken.',
      sections: [
        { title: 'Alles op één plek', text: 'Elke 15 minuten synchroniseert Pulse producten en bestellingen uit Shopify, campagnes en resultaten uit Meta en TikTok, en contacten uit het CRM in één database. Elke bestelling wordt gekoppeld aan de advertentie die ze binnenbracht, zodat elke advertentie toont wat ze echt opbracht en niet alleen hoeveel klikken ze kreeg.' },
        { title: 'Het leert wat verkoopt', text: 'Drie modellen trainen opnieuw zodra er nieuwe resultaten zijn: één voorspelt klikken, één verkopen en één hoe groot de kans is dat een video aanslaat. Ze leren van hoe elke advertentie gemaakt is (user-generated of niet, de hook, de lengte, ondertitels), zodat een nieuw idee een score krijgt nog voor iemand het filmt.' },
        { title: 'Autopilot, met vangrails', text: 'Elke vier uur verdeelt het het dagbudget over de advertentiesets volgens hoe waarschijnlijk elke set winstgevend is, pauzeert het advertenties die geld uitgeven zonder te verkopen en logt het elke wijziging. Elke set houdt genoeg over om te blijven leren, budgetten veranderen hooguit 30% per dag en het totaal gaat nooit over de limiet.' },
        { title: 'Nieuwe campagnes, van begin tot eind', text: 'Pulse plant nieuwe campagnes rond de bestverkopende producten, schrijft voor elke advertentie een creatieve briefing, laat AI-videomodellen er korte verticale advertenties van maken en zet de campagnes gepauzeerd klaar voor een laatste controle. Hun resultaten stromen terug en leren de volgende ronde bij.' },
      ],
      captions: ['Het live dashboard: uitgaven, resultaten en de regels die erop reageren.', 'Hoe het werkt: synchroniseren, leren, handelen en de resultaten terugkoppelen.', 'Een autopilot-ronde: het dagbudget gaat naar wat werkt, binnen de vangrails.', 'Nieuwe campagnes: van bestverkopend product tot afgewerkte videoadvertentie.'],
      demoNote: 'Het echte dashboard (de app heet intern AdPilot), op zijn ingebouwde voorbeeldwinkel: wissel de periode of het platform, zoek een advertentie en open ze voor het verloop per dag.',
    },
    // the working demo on the 3D phone and in the pop-up; `poster` shows until it has loaded
    device: { laptop: { demo: 'demos/pulse/', poster: 'img/screens/pulse-laptop.jpg' } },
    demoNote: 'The real dashboard (the app is called AdPilot inside), on its built-in sample store: switch the period or platform, search for an ad and open it for its day-by-day detail.',
    started: '2026-10-13', // first day of work; the live timer counts from here
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
    nl: {
      blurb: 'Deel bestanden tussen laptop\nen telefoon met een QR-code',
      status: 'Eigen tool',
      intro: 'Relay verplaatst bestanden tussen een laptop en een telefoon via het wifi-netwerk thuis: geen kabels, geen cloud, geen accounts. Open het, scan een code en zet bestanden aan eender welke kant neer.',
      sections: [
        { title: 'Eén keer scannen en je bent verbonden', text: 'De laptop draait een kleine Python-server en toont een pagina met een QR-code. Die code bevat het adres van de laptop en een privé toegangssleutel, dus scannen opent dezelfde pagina op de telefoon, meteen aangemeld. De sleutel wordt bewaard, zodat de telefoon de volgende keer gekoppeld blijft.' },
        { title: 'Zet bestanden aan eender welke kant neer', text: 'Sleep bestanden op de pagina op de laptop, of kies ze op de telefoon. Ze komen meteen in een gedeelde map op de laptop terecht, de lijst werkt bij op beide toestellen en alles kan vanaf elk toestel gedownload of verwijderd worden.' },
        { title: 'Niets verlaat het huis', text: 'Bestanden gaan rechtstreeks tussen de twee toestellen binnen je eigen netwerk. Er zit geen clouddienst tussen, je hoeft geen account te maken, er is geen uploadlimiet en zonder de toegangssleutel werkt niets.' },
        { title: 'Rechtstreeks naar Foto’s', text: 'De telefoon verbindt via HTTPS, waardoor het deelmenu van de iPhone foto’s en video’s rechtstreeks in de filmrol kan bewaren in plaats van enkel in Bestanden.' },
      ],
      captions: ['De pagina op de laptop met de QR-code, en dezelfde bestanden op de telefoon.', 'Stap 1: één keer scannen en de telefoon is gekoppeld.', 'Hoe bestanden reizen: rechtstreeks over je eigen wifi.', 'Op de telefoon: rechtstreeks bewaren in Foto’s, met live uploadvoortgang.'],
      demoNote: 'De echte pagina (de app heet intern Dropzone), op laptop en telefoon: stuur foto’s vanaf de telefoon of zet echte bestanden op de laptop, ze verschijnen aan de andere kant. Je bestanden verlaten je browser nooit.',
    },
    device: { phone: { demo: 'demos/relay/', poster: 'img/screens/relay-phone.jpg' }, laptop: { demo: 'demos/relay/desktop.html', poster: 'img/screens/relay-laptop.jpg' } },
    demoNote: 'The real page (the app is called Dropzone inside), on the laptop and the phone: send photos from the phone or drop real files on the laptop, and they appear on the other side. Your files never leave your browser.',
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
    nl: {
      blurb: 'iOS-camera die je coacht om eender\nwelke esthetische foto na te maken',
      status: 'In ontwikkeling · iOS-app',
      intro: 'ShotGuide helpt je de foto te nemen die je online zag. Kies een inspiratie, en de camera zoekt uit hoe ze genomen is en coacht je live, beeld per beeld, tot jouw foto overeenkomt.',
      sections: [
        { title: 'Vind de foto', text: 'Zoek op Pinterest in de app (je logt zelf in; ShotGuide ziet je wachtwoord nooit), zoek vrij gelicentieerde foto’s, plak een link of kies een afbeelding uit Foto’s.' },
        { title: 'Hoe ze genomen is, stap voor stap', text: 'De foto wordt geanalyseerd op lens (0,5× tot 8×), camerahoogte, kanteling, afstand en licht, met instructies stap voor stap. De kleurlook wordt uit de pixels gemeten en omgezet in een passend filter. Dat gebeurt op de telefoon met Apple Intelligence, of met Claude voor het meeste detail, en elke analyse wordt bewaard in je Bibliotheek.' },
        { title: 'Live gecoacht, op elk beeld', text: 'Een oplichtende richtstip hangt vast aan de echte wereld en toont waar je moet richten; je draait de telefoon gewoon tot de cirkel erop staat. Tips over kanteling, horizon, afstand, licht en een drukke achtergrond passen zich aan het soort foto aan: portret, object, gebouw of landschap. Belichting, scherpstelling en de passende look stellen zichzelf in.' },
        { title: 'Druk af als alles groen is', text: 'Een checklist (hoek, kader, licht, scherpte, stabiel, achtergrond) wordt pas groen als de camera elk punt echt bevestigd heeft, en een ring rond de ontspanknop toont hoe dichtbij je bent. In de automatische stand neemt hij de foto zelf. Het resultaat wordt bijgesneden naar Instagrams 4:5 met de look toegepast, klaar om te vergelijken, te bewaren of te delen.' },
        { title: 'Het leert je smaak', text: 'ShotGuide kan de pins op een Pinterest-bord en de foto’s die je bewaart bestuderen, en dan nieuwe vrij gelicentieerde foto’s vinden die bij je stijl passen.' },
      ],
      captions: ['Van inspiratie tot live coaching in de camera.', 'Stap 1: vind een foto op Pinterest, Openverse, via een link of in je Foto’s.', 'Stap 2: lens, hoogte, kanteling, afstand, stappen en de kleurlook.', 'Stap 3: alles bevestigd. Afdrukken.'],
      demoNote: 'De app zoals ze gebouwd is, met voorbeeldfoto’s: tik op het rasterknopje voor inspiratie, kies een foto, druk op Shoot this en sleep het beeld tot het bolletje in de cirkel staat.',
    },
    device: { phone: { demo: 'demos/shotguide/', poster: 'img/screens/shotguide-phone.jpg' } },
    demoNote: 'The app as built, with sample photos: tap the grid button for inspiration, pick a photo, tap Shoot this, then drag the view until the dot sits in the circle.',
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
