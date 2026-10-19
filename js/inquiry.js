// "Start a project": a short form that opens the visitor's email app with a ready-to-send inquiry
// (no server involved), or copies it when there is no email app. Also fills the services chapter.
import { t, onLang } from './i18n.js';
import { track } from './track.js';

const ADDRESS = 'info.vcdevelopments@gmail.com';
const dialog = document.getElementById('inquiry');
const form = dialog.querySelector('form');
const GROUPS = { type: 'types', budget: 'budgets', timeline: 'timelines' };
const nameField = form.querySelector('[name="name"]'), messageField = form.querySelector('textarea'); // (form.name is the form's own name)

// each choice is a row of radio "chips"; the selected index survives a language switch
const picked = { type: -1, budget: -1, timeline: -1 };
function renderChips() {
  for (const [group, key] of Object.entries(GROUPS)) {
    const box = form.querySelector(`[data-group="${group}"] .chips`);
    box.replaceChildren(...t(key).map((label, i) => {
      const l = document.createElement('label');
      l.className = 'chip';
      const input = Object.assign(document.createElement('input'), { type: 'radio', name: group, value: String(i), checked: picked[group] === i });
      input.addEventListener('change', () => { picked[group] = i; if (group === 'type') error('type', ''); });
      l.append(input, Object.assign(document.createElement('span'), { textContent: label }));
      return l;
    }));
  }
  messageField.placeholder = t('fMessageHint');
}

const error = (field, text) => {
  const el = form.querySelector(`#err-${field}`);
  el.textContent = text;
  if (field === 'message') messageField.setAttribute('aria-invalid', String(!!text));
};
const note = (text) => { form.querySelector('.note').textContent = text; };

function read() {
  const f = {
    type: t('types')[picked.type],
    budget: t('budgets')[picked.budget],
    timeline: t('timelines')[picked.timeline],
    name: nameField.value.trim(),
    message: messageField.value.trim(),
  };
  let ok = true;
  if (picked.type < 0) { error('type', t('errType')); ok = false; }
  if (f.message.length < 10) { error('message', t('errMessage')); ok = false; }
  if (!ok) (picked.type < 0 ? form.querySelector('[name="type"]') : messageField).focus();
  return ok && f;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = read();
  if (!f) return;
  const url = `mailto:${ADDRESS}?subject=${encodeURIComponent(t('subject')(f.type, f.name))}&body=${encodeURIComponent(t('body')(f))}`;
  track('inquiry', { type: ['website', 'ios', 'ai', 'other'][picked.type], budget: picked.budget });
  location.href = url;
  note(t('sentNote'));
});
form.querySelector('.copy').addEventListener('click', async () => {
  const f = read();
  if (!f) return;
  try {
    await navigator.clipboard.writeText(`${ADDRESS}\n${t('subject')(f.type, f.name)}\n\n${t('body')(f)}`);
    note(t('copied'));
    track('inquiry-copy');
  } catch {
    note(ADDRESS);
  }
});
messageField.addEventListener('input', () => { if (messageField.value.trim().length >= 10) error('message', ''); });
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

export function openInquiry() {
  note('');
  dialog.showModal();
  track('inquiry-open');
}
document.querySelectorAll('.start-project').forEach((b) => b.addEventListener('click', openInquiry));

// the services chapter: what I build (with typical timelines) and how a project runs
function renderServices() {
  const offer = document.querySelector('.services .offer');
  offer.replaceChildren(...t('services').flatMap((s) => {
    const row = document.createElement('div');
    row.className = 'service';
    row.innerHTML = '<dt></dt><dd class="text"></dd><dd class="time"></dd>';
    row.querySelector('dt').textContent = s.name;
    row.querySelector('.text').textContent = s.text;
    row.querySelector('.time').textContent = s.time;
    row.querySelector('.time').title = t('typical');
    return row;
  }));
  document.querySelector('.services .steps').replaceChildren(...t('process').map((p) => {
    const li = document.createElement('li');
    li.innerHTML = '<b></b><span></span>';
    li.querySelector('b').textContent = p.name;
    li.querySelector('span').textContent = p.text;
    return li;
  }));
}

renderChips();
renderServices();
onLang(() => { renderChips(); renderServices(); error('type', ''); error('message', ''); });
