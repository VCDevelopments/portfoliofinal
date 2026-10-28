// English / Dutch. The page's fixed text carries data-i18n="key" (text) or data-i18n-html (markup);
// everything drawn from code asks t(key). The choice is remembered per visitor, else follows the browser.
const STRINGS = {
  en: {
    title: 'VCDevelopments — Lothar Van Cauwenbergh',
    description: 'Portfolio of Lothar Van Cauwenbergh (VCDevelopments): websites, iOS apps and AI tools, designed and built end to end.',
    role: 'Lothar Van Cauwenbergh\nDeveloper & Designer',
    aboutTitle: '////// About',
    about: 'I design and build\nwebsites, iOS apps and\nAI tools — from 3D web\nexperiences to Claude-\npowered apps and MCP\nservers.',
    scrollHint: 'Scroll down to\ndiscover.',
    sound: 'Sound', night: 'Night', on: 'On', off: 'Off', language: 'Language',
    contactEyebrow: '////// Contact',
    contactTitle: 'Let’s build<br />something.',
    pitch: 'Have an idea for a website, an iOS app or an AI tool? Tell me about it and I’ll get back to you.',
    emailLabel: 'Email',
    startProject: 'Start a project',
    linkedin: 'Message me on LinkedIn ↗',
    github: 'See my code on GitHub ↗',
    project: 'PROJECT',
    learnMore: 'Learn more +',
    close: 'Close',
    tryIt: 'Try it',
    showMe: 'Show me how it works',
    stop: 'Stop the tour',
    whatsNew: 'What’s new',
    projectPage: 'Project page ↗',
    viewCode: 'View the code on GitHub ↗',
    visitSite: 'Visit the site ↗',
    started: 'STARTED',
    timeInvested: 'TIME INVESTED · HH:MM:SS',
    lastCommit: 'LAST COMMIT',
    commits30: 'COMMITS · 30 DAYS',
    ago: (n, unit) => `${n} ${unit}${n === 1 ? '' : 'S'} AGO`,
    units: { minute: 'MIN', hour: 'HOUR', day: 'DAY' },
    justNow: 'JUST NOW',
    // services & process
    servicesTitle: 'What I build',
    services: [
      { name: 'Websites', text: 'Fast, distinctive sites, from a one-page launch to a full 3D experience like this one.', time: '2–6 weeks' },
      { name: 'iOS apps', text: 'Native SwiftUI apps that use the camera, on-device AI and everything else the iPhone can do.', time: '6–12 weeks' },
      { name: 'AI tools', text: 'Claude-powered tools, automations and MCP servers that take repetitive work off your plate.', time: '1–4 weeks' },
    ],
    typical: 'Typical timeline',
    processTitle: 'How a project runs',
    process: [
      { name: 'Intro call', text: 'We talk through the idea, who it is for and the budget.' },
      { name: 'Prototype', text: 'A clickable first version early, so you react to something real.' },
      { name: 'Build', text: 'Regular updates you can try on your own phone or browser.' },
      { name: 'Launch', text: 'Live, tested and handed over, with support afterwards.' },
    ],
    // inquiry form
    formTitle: 'Start a project',
    formIntro: 'A few quick answers and your email app opens with everything filled in.',
    fName: 'Your name',
    fType: 'What do you need?',
    types: ['Website', 'iOS app', 'AI tool', 'Something else'],
    fBudget: 'Budget',
    budgets: ['Under €2k', '€2k–5k', '€5k–15k', '€15k+', 'Not sure yet'],
    fTimeline: 'When',
    timelines: ['As soon as possible', 'In 1–3 months', 'Flexible'],
    fMessage: 'Tell me about it',
    fMessageHint: 'What should it do, and for whom?',
    send: 'Open in my email app',
    copy: 'Copy instead',
    copied: 'Copied. Paste it in an email to info.vcdevelopments@gmail.com',
    errType: 'Pick what you need.',
    errMessage: 'Write a sentence or two about the project.',
    sentNote: 'Your email app should open now. Nothing happened? Use “Copy instead”.',
    subject: (type, name) => `Project inquiry: ${type}${name ? ` (${name})` : ''}`,
    body: (f) => `Hi Lothar,\n\n${f.message}\n\nWhat: ${f.type}\nBudget: ${f.budget || '–'}\nWhen: ${f.timeline || '–'}\n\n${f.name || ''}`,
  },
  nl: {
    title: 'VCDevelopments — Lothar Van Cauwenbergh',
    description: 'Portfolio van Lothar Van Cauwenbergh (VCDevelopments): websites, iOS-apps en AI-tools, van ontwerp tot afgewerkt product.',
    role: 'Lothar Van Cauwenbergh\nDeveloper & designer',
    aboutTitle: '////// Over mij',
    about: 'Ik ontwerp en bouw\nwebsites, iOS-apps en\nAI-tools — van 3D-web-\nervaringen tot apps en\nMCP-servers op basis\nvan Claude.',
    scrollHint: 'Scroll naar beneden\nom te ontdekken.',
    sound: 'Geluid', night: 'Nacht', on: 'Aan', off: 'Uit', language: 'Taal',
    contactEyebrow: '////// Contact',
    contactTitle: 'Laten we iets<br />bouwen.',
    pitch: 'Een idee voor een website, een iOS-app of een AI-tool? Vertel me erover en ik laat snel iets weten.',
    emailLabel: 'E-mail',
    startProject: 'Start een project',
    linkedin: 'Stuur me een bericht op LinkedIn ↗',
    github: 'Bekijk mijn code op GitHub ↗',
    project: 'PROJECT',
    learnMore: 'Meer info +',
    close: 'Sluiten',
    tryIt: 'Probeer het',
    showMe: 'Toon me hoe het werkt',
    stop: 'Stop de rondleiding',
    whatsNew: 'Nieuw',
    projectPage: 'Projectpagina ↗',
    viewCode: 'Bekijk de code op GitHub ↗',
    visitSite: 'Bezoek de site ↗',
    started: 'GESTART',
    timeInvested: 'TIJD GEÏNVESTEERD · UU:MM:SS',
    lastCommit: 'LAATSTE COMMIT',
    commits30: 'COMMITS · 30 DAGEN',
    ago: (n, unit) => `${n} ${unit} GELEDEN`,
    units: { minute: 'MIN', hour: 'UUR', day: 'DAG' },
    justNow: 'NET NOG',
    servicesTitle: 'Wat ik bouw',
    services: [
      { name: 'Websites', text: 'Snelle sites met karakter, van een launchpagina tot een volledige 3D-ervaring zoals deze.', time: '2–6 weken' },
      { name: 'iOS-apps', text: 'Native SwiftUI-apps die de camera, AI op het toestel en alles wat een iPhone kan, gebruiken.', time: '6–12 weken' },
      { name: 'AI-tools', text: 'Tools, automatisaties en MCP-servers op basis van Claude die repetitief werk van je overnemen.', time: '1–4 weken' },
    ],
    typical: 'Gebruikelijke doorlooptijd',
    processTitle: 'Hoe een project loopt',
    process: [
      { name: 'Kennismaking', text: 'We overlopen het idee, voor wie het is en het budget.' },
      { name: 'Prototype', text: 'Vroeg een klikbare eerste versie, zodat je op iets echts kan reageren.' },
      { name: 'Bouwen', text: 'Regelmatig updates die je op je eigen telefoon of browser kan uitproberen.' },
      { name: 'Lancering', text: 'Live, getest en overgedragen, met ondersteuning achteraf.' },
    ],
    formTitle: 'Start een project',
    formIntro: 'Een paar snelle antwoorden en je e-mailapp opent met alles al ingevuld.',
    fName: 'Je naam',
    fType: 'Wat heb je nodig?',
    types: ['Website', 'iOS-app', 'AI-tool', 'Iets anders'],
    fBudget: 'Budget',
    budgets: ['Minder dan €2k', '€2k–5k', '€5k–15k', '€15k+', 'Nog niet zeker'],
    fTimeline: 'Wanneer',
    timelines: ['Zo snel mogelijk', 'Binnen 1–3 maanden', 'Flexibel'],
    fMessage: 'Vertel me erover',
    fMessageHint: 'Wat moet het doen, en voor wie?',
    send: 'Open in mijn e-mailapp',
    copy: 'Liever kopiëren',
    copied: 'Gekopieerd. Plak het in een e-mail naar info.vcdevelopments@gmail.com',
    errType: 'Kies wat je nodig hebt.',
    errMessage: 'Schrijf een zin of twee over het project.',
    sentNote: 'Je e-mailapp zou nu moeten openen. Gebeurt er niets? Gebruik “Liever kopiëren”.',
    subject: (type, name) => `Projectaanvraag: ${type}${name ? ` (${name})` : ''}`,
    body: (f) => `Hallo Lothar,\n\n${f.message}\n\nWat: ${f.type}\nBudget: ${f.budget || '–'}\nWanneer: ${f.timeline || '–'}\n\n${f.name || ''}`,
  },
};

let lang = 'en';
let saved = null;
try { saved = localStorage.getItem('vcd-lang'); } catch {}
lang = saved === 'nl' || saved === 'en' ? saved : (navigator.language || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';
const listeners = new Set();

export const getLang = () => lang;
export const t = (key) => STRINGS[lang][key] ?? STRINGS.en[key];
export const onLang = (fn) => listeners.add(fn);

// fill the page's fixed text, then let every part of the site redraw its own
export function setLang(next) {
  lang = next === 'nl' ? 'nl' : 'en';
  try { localStorage.setItem('vcd-lang', lang); } catch {}
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('description'));
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const v = t(el.dataset.i18n);
    if ('scramble' in el.dataset) el.dataset.text = v;
    el.textContent = v;
  }
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  listeners.forEach((fn) => fn(lang));
}

// dates in the site's language, upper case for the HUD: "13 OCT 2026" / "13 OKT. 2026"
export const dateLabel = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-BE' : 'en-GB', opts);

// "3 HOURS AGO"
export function agoLabel(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 2) return t('justNow');
  const [n, unit] = m < 60 ? [m, 'minute'] : m < 48 * 60 ? [Math.floor(m / 60), 'hour'] : [Math.floor(m / 1440), 'day'];
  const u = t('units')[unit];
  return t('ago')(n, lang === 'nl' && unit === 'day' ? (n === 1 ? 'DAG' : 'DAGEN') : u);
}
