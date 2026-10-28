// Earnings estimator: fills every [data-estimator] with a viewer slider and a "how often" choice, and shows a monthly range.
// Same assumptions as the business plan: ~$500 bet a month per average viewer, 4% house edge (96% RTP), Engine pays us
// 10% of that, the streamer gets 40% of it (50% above 20k average viewers). Text follows <html lang>.
const T = {
  en: { viewers: "Average live viewers", often: "How often you'd play it on stream", opts: ["Now and then", "Every week", "Most streams"],
        per: "a month for you", note: "A rough estimate from our planning numbers, not a promise. It depends on how much your viewers play.", share: s => `Your share: ${s}% of our royalty` },
  es: { viewers: "Viewers promedio en directo", often: "Cada cuánto lo jugarías en stream", opts: ["De vez en cuando", "Cada semana", "Casi siempre"],
        per: "al mes para ti", note: "Una estimación aproximada con nuestras cifras de planificación, no una promesa. Depende de cuánto jueguen tus viewers.", share: s => `Tu parte: ${s}% de nuestro royalty` },
  pt: { viewers: "Média de viewers ao vivo", often: "Com que frequência você jogaria na live", opts: ["De vez em quando", "Toda semana", "Quase sempre"],
        per: "por mês para você", note: "Uma estimativa aproximada com os nossos números de planejamento, não uma promessa. Depende de quanto os seus viewers jogam.", share: s => `Sua parte: ${s}% do nosso royalty` },
};
const t = T[(document.documentElement.lang || "en").slice(0, 2)] || T.en;
const STEPS = [100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
const money = n => "$" + (n >= 10000 ? Math.round(n / 1000) + "k" : n >= 1000 ? (Math.round(n / 100) / 10) + "k" : Math.round(n / 10) * 10);
export const estimate = (viewers, often) => { const share = viewers > 20000 ? 0.5 : 0.4; return { share, mid: viewers * 500 * often * 0.04 * 0.10 * share }; };

for (const el of document.querySelectorAll("[data-estimator]")) {
  const start = Math.max(0, STEPS.indexOf(Number(el.dataset.viewers)) >= 0 ? STEPS.indexOf(Number(el.dataset.viewers)) : STEPS.findIndex(v => v >= Number(el.dataset.viewers || 1000)));
  const group = "est-often-" + Math.random().toString(36).slice(2, 7);   // one name per estimator, so its options are one choice
  el.innerHTML = `
    <label class="est-row"><span>${t.viewers} <output class="est-v"></output></span>
      <input type="range" min="0" max="${STEPS.length - 1}" step="1" value="${start}" aria-label="${t.viewers}"></label>
    <fieldset class="est-row"><legend>${t.often}</legend><div class="est-opts">
      ${t.opts.map((o, i) => `<label><input type="radio" name="${group}" value="${[0.5, 1, 1.5][i]}" ${i === 1 ? "checked" : ""}><span>${o}</span></label>`).join("")}
    </div></fieldset>
    <div class="est-out" aria-live="polite"><strong class="est-n"></strong><span>${t.per}</span><small class="est-share"></small></div>
    <p class="est-note">${t.note}</p>`;
  const range = el.querySelector("input[type=range]"), out = el.querySelector(".est-n"), v = el.querySelector(".est-v"), sh = el.querySelector(".est-share");
  const draw = () => {
    const viewers = STEPS[range.value], often = Number(el.querySelector("input[type=radio]:checked").value), { share, mid } = estimate(viewers, often);
    v.textContent = viewers.toLocaleString("en-US"); out.textContent = `${money(mid * 0.5)} – ${money(mid * 1.5)}`; sh.textContent = t.share(share * 100);
  };
  el.addEventListener("input", draw); draw();
}
