// Génère ../index.html (page autonome) à partir de style.css, runtime.js et des données ci-dessous.
// Usage : node site-style/src/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const A = 'https://reel-ref-try-the-look.vercel.app/assets/';
const SHOP = 'https://nike-makknzjs.myshopify.com/products/';
const SID = 'Runway-template--28035983671601__the_runway_wdM8BG';
const KEYS = ['bndthK', 'XckgG6', 'rLfAhC', 'FKg67q', '8KREEE', 'N3bfm9'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = v => Math.round(v).toLocaleString('fr-FR') + '\u00a0FCFA';

const SHOES = ['40', '41', '42', '43', '44', '45', '46'];
const SIZES = ['S', 'L', 'M', 'XL'];
const ids = (base, n) => Array.from({ length: n }, (_, k) => base + 32768 * k);

// ordre = ordre du catalogue
const P = {
  aj12: { id: 'tatum-5-orbit-copy', name: 'Air Jordan 12 Retro', vendor: 'Temple de la Mode', price: 90000, legend: 'Pointure', values: SHOES, vids: ids(57015167025457, 7), img: 'source-tatum-5-orbit-copy.webp', h: 400, mh: 160 },
  tshirt: { id: 'tshirt', name: 'T-shirt', vendor: 'Temple de la Mode', price: 120000, legend: 'Taille', values: SIZES, vids: ids(56835911582001, 4), img: 'source-tshirt.webp', h: 563, mh: 225 },
  sweatshirt: { id: 'sweatshirt', name: 'Sweat-shirt', vendor: 'Temple de la Mode', price: 120000, legend: 'Taille', values: SIZES, vids: ids(56835806396721, 4), img: 'source-sweatshirt.webp', h: 581, mh: 232 },
  tatum: { id: 'tatum-5-orbit', name: 'Tatum 5 Orbit', vendor: 'Temple de la Mode', price: 90000, legend: 'Pointure', values: SHOES, vids: ids(57015166730545, 7), img: 'source-tatum-5-orbit.webp', h: 400, mh: 160 },
  hoodieBlack: { id: 'hoodie-black', name: 'Sweat à capuche noir', vendor: 'Temple de la Mode', price: 120000, legend: 'Taille', values: SIZES, vids: ids(56836251681073, 4), img: 'source-hoodie-black.webp', h: 536, mh: 214 },
  sweatPlus: { id: 'sweatshirt-plus', name: 'Sweat-shirt Plus', vendor: 'Temple de la Mode', price: 120000, legend: 'Taille', values: SIZES, vids: ids(56836143743281, 4), img: 'source-sweatshirt-plus.webp', h: 610, mh: 244 },
  hoodie: { id: 'hoodie', name: 'Sweat à capuche', vendor: 'Temple de la Mode', price: 120000, legend: 'Taille', values: SIZES, vids: ids(56836002185521, 4), img: 'source-hoodie.webp', h: 555, mh: 222 },
  luka: { id: 'air-jordan-12-retro-copy', name: 'Luka 5', vendor: 'Temple de la Mode', price: 90000, legend: 'Pointure', values: SHOES, vids: ids(57015176364337, 7), img: 'source-air-jordan-12-retro-copy.webp', h: 400, mh: 160 },
};

const PINS_A = [[47, 27], [48, 58], [45, 96]];
const PINS_B = [[50, 28], [48, 58], [45, 88]];
const LOOKS = [
  { name: 'Esprit urbain', m: 1, items: ['aj12', 'tshirt', 'sweatshirt'], pins: PINS_A, desc: 'Une maille anthracite et un denim décontracté.' },
  { name: 'Vernissage', m: 5, items: ['tatum', 'hoodieBlack', 'tshirt'], tag: 2, pins: PINS_B, desc: 'Un t-shirt blanc net et un denim ample.' },
  { name: 'Vernissage', m: 4, items: ['sweatPlus', 'tatum', 'tshirt'], tag: 2, pins: PINS_B, desc: 'Maille olive. Une palette terre.' },
  { name: 'Journée studio', m: 6, items: ['hoodieBlack', 'aj12', 'tshirt'], pins: PINS_B, desc: 'Noir, blanc et denim décontracté.' },
  { name: 'Journée studio', m: 3, items: ['sweatshirt', 'tatum', 'tshirt'], pins: PINS_B, desc: 'Superpositions bordeaux. Une allure soignée.' },
  { name: 'Journée studio', m: 2, items: ['hoodie', 'luka', 'tshirt'], pins: PINS_B, desc: 'Un col rond gris et votre denim préféré.' },
];
const m640 = l => `${A}model-${l.m}-640.webp`;
const m1080 = l => `${A}original-look-${l.m}.webp`;
const label = (l, i) => `Look ${i + 1} : ${l.name}`;

const CATALOG = {
  source: 'https://nike-makknzjs.myshopify.com/pages/runway',
  looks: LOOKS.map(l => ({ name: l.name, description: l.desc, image: m1080(l), products: l.items.map(k => P[k].id) })),
  items: Object.values(P).map(p => ({
    id: p.id, name: p.name, type: 'Du lookbook original', price: p.price, image: A + p.img,
    sizes: p.values, variants: p.values.map((v, i) => ({ id: p.vids[i], a: true, o: [v] })), url: SHOP + p.id,
  })),
};

/* ---------- SVG ---------- */
const svgStroke = (w, h, vb, d, sw, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} width="${w}" height="${h}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const ICON_PLUS = svgStroke(20, 20, '0 0 24 24', 'M12 4v16M4 12h16', 1.3, 'rw__i-plus');
const ICON_CHECK = svgStroke(20, 20, '0 0 24 24', 'M4.5 12.5l5 5L19.5 7', 1.5, 'rw__i-check');
const ICON_SPIN = svgStroke(18, 18, '0 0 24 24', 'M12 3a9 9 0 1 1-9 9', 1.5, 'rw__i-spin');
const ICON_X = svgStroke(16, 16, '0 0 24 24', 'M5 5l14 14M19 5L5 19', 1.5);

/* ---------- markup ---------- */
const modelImg = (l, extra = '') => `<img src="${m640(l)}" srcset="${m640(l)} 640w, ${m1080(l)} 1080w" sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px" loading="eager" decoding="async" width="1100" height="1956" draggable="false" data-model-image alt="${esc(l.name)}"${extra}>`;

const body = (l, i) => `
          <div class="rw__model" data-rw-model data-index="${i}" aria-hidden="true">
            <span class="rw__shadow"></span>
            <div class="rw__figure" style="--rw-ar: 0.5625">
              <div class="rw__art">
                ${modelImg(l)}
                <button type="button" class="rw__hit" data-rw-go="${i}" aria-label="${esc(label(l, i))}" tabindex="-1"></button>
              </div>
            </div>
          </div>`;

const hero = (l, i) => `
          <div class="rw__hero${i === 0 ? ' is-on' : ''}" data-rw-hero data-index="${i}" data-name="${esc(l.name)}" data-label="${esc(label(l, i))}" data-probe="${m640(l)}" aria-hidden="${i === 0 ? 'false' : 'true'}">
            <div class="rw__morph">
              <span class="rw__shadow"></span>
              <div class="rw__figure" style="--rw-ar: 0.5625">
                <div class="rw__art">
                  ${modelImg(l)}
                  <button type="button" class="rw__zoom" data-rw-zoom aria-label="Voir le look : ${esc(l.name)}" tabindex="-1"></button>
                  <div class="rw__pins">${l.items.map((k, j) => {
                    const n = j + 1, [x, y] = l.pins[j], nm = esc(P[k].name);
                    return `
                    <button type="button" class="rw__pin" data-rw-pin="${n}" data-tip="${nm}" style="left:${x}%; top:${y}%; --pi:${n}" aria-label="${n} : ${nm}" tabindex="-1"><span class="rw__pin-dot">${n}</span></button>`;
                  }).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>`;

const tick = (l, i) => `
            <button type="button" class="rw__tick" data-rw-tick="${i}" aria-current="${i === 0}" aria-label="${esc(label(l, i))}"><span class="rw__tick-bar"></span><span class="rw__tick-label">${String(i + 1).padStart(2, '0')}<span class="rw__tick-name">&nbsp;&nbsp;${esc(l.name)}</span></span></button>`;

const item = (l, li, k, j) => {
  const p = P[k], n = j + 1, nm = esc(p.name), url = SHOP + p.id;
  const pid = `Picker-${SID}-look_${KEYS[li]}-${n}`;
  const opt = `Opt-${SID}-look_${KEYS[li]}-${n}-1`;
  const variants = JSON.stringify(p.values.map((v, i) => ({ id: p.vids[i], a: true, o: [v] })));
  return `
              <li class="rw__item" data-rw-card="${n}" style="--i:${n}" data-title="${nm}">${l.tag === n ? `
                <span class="rw__tag"><span class="rw__tag-text">Nouveau</span></span>` : ''}
                <a class="rw__media" href="${url}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${A + p.img}" width="400" height="${p.h}" loading="lazy" decoding="async" alt=""><span class="rw__num">${n}</span></a>
                <div class="rw__info">
                  <span class="rw__type">${esc(p.vendor)}</span>
                  <a class="rw__name" href="${url}" target="_blank" rel="noopener noreferrer">${nm}</a>
                  <span class="rw__price"><span>${usd(p.price)}</span></span>
                </div>
                <button type="button" class="rw__add" data-rw-add aria-expanded="false" aria-controls="${pid}" aria-label="Ajouter au sac : ${nm}" data-added-label="Ajouté au sac : ${nm}">${ICON_PLUS}${ICON_CHECK}${ICON_SPIN}</button>
                <div class="rw__picker" id="${pid}" data-rw-picker hidden>
                  <div class="rw__picker-head">
                    <img src="${A + p.img}" width="160" height="${p.mh}" loading="lazy" decoding="async" alt="">
                    <div class="rw__picker-meta"><span class="rw__picker-title">${nm}</span><span class="rw__picker-price">${usd(p.price)}</span></div>
                    <button type="button" class="rw__picker-close" data-rw-pick-close aria-label="Fermer">${ICON_X}</button>
                  </div>
                  <fieldset class="rw__opt">
                    <legend class="rw__opt-name">${p.legend}</legend>
                    <div class="rw__opt-values">${p.values.map((v, i) => `<label class="rw__pill"><input type="radio" name="${opt}" value="${v}" data-rw-option="0"${i === 0 ? ' checked' : ''}><span class="rw__pill-label">${v}</span></label>`).join('')}</div>
                  </fieldset>
                  <button type="button" class="rw__confirm" data-rw-confirm><span data-rw-confirm-label data-add="Ajouter au sac">Ajouter au sac</span><span class="rw__sr"> — ${nm}</span></button>
                  <script type="application/json" data-rw-variants>${variants}</script>
                </div>
              </li>`;
};

const panel = (l, i) => {
  const full = l.items.reduce((s, k) => s + P[k].price, 0);
  const bundle = Math.round(full * 90) / 100;
  return `
          <div class="rw__look-panel${i === 0 ? ' is-in' : ''}" data-rw-panel="${i}"${i === 0 ? '' : ' hidden'}>
            <div class="rw__mhead"><span class="rw__mhead-title">${esc(l.name)}</span><span class="rw__label">${l.items.length} pièces</span></div>
            <ul class="rw__items" role="list">${l.items.map((k, j) => item(l, i, k, j)).join('')}
            </ul>
            <div class="rw__bundle has-rule">
              <p class="rw__msg" data-rw-msg role="status" aria-live="polite"></p>
              <div class="rw__bundle-row">
                <div class="rw__bundle-copy"><span class="rw__bundle-title">Complétez le look</span><span class="rw__bundle-note">Prenez les ${l.items.length} pièces et économisez 10 %</span></div>
                <div class="rw__bundle-price"><s>${usd(full)}</s><strong>${usd(bundle)}</strong></div>
              </div>
              <button type="button" class="rw__cta" data-rw-all>
                <span class="rw__cta-add">Ajouter tout le look au sac</span>
                <span class="rw__cta-m">Tout le look — ${usd(bundle)}</span>
                <span class="rw__cta-done">Tout le look est dans votre sac</span>
                ${svgStroke(22, 12, '0 0 26 14', 'M1 7h24M19 1l6 6-6 6', 1.4, 'rw__cta-arrow')}
                ${svgStroke(16, 16, '0 0 24 24', 'M12 3a9 9 0 1 1-9 9', 1.8, 'rw__cta-spin')}
              </button>
            </div>
            <template data-rw-pieces-text>${l.items.length} pièces</template>
          </div>`;
};

const TOKENS = `--rw-c-stage:#ffffff;--rw-c-panel:#ffffff;--rw-c-text:#151413;--rw-c-muted:#66625c;--rw-c-accent:#0e0e0e;--rw-c-on-accent:#ffffff;--rw-c-line:#c8c8c8;--rw-card:#DFDFDF;--rw-hf:var(--font-heading--family, inherit);--rw-hw:400;--rw-h-d:46px;--rw-h-m:24px;--rw-sub-d:12px;--rw-sub-m:12px;--rw-eyebrow-d:11px;--rw-eyebrow-m:10px;--rw-label-d:10px;--rw-label-m:9px;--rw-chip-d:17px;--rw-chip-m:18px;--rw-ph-d:18px;--rw-ph-m:16px;--rw-pt-size-d:13px;--rw-pt-size-m:12px;--rw-price-d:12px;--rw-price-m:12px;--rw-opt-d:11px;--rw-opt-m:11px;--rw-total-d:16px;--rw-total-m:16px;--rw-thumb-d:92px;--rw-thumb-m:62px;--rw-tag-top:18px;--rw-tag-left:0px;--rw-thumb-radius:0px;--rw-morph:900ms;--rw-bar-r:20px;--rw-panel-w:380px;--rw-panel-pad-d:32px;--rw-radius:0px;--rw-max:none;--rw-speed:5s;--rw-ax:40%;--rw-btn-radius:0px;--rw-pill-radius:30px;--rw-add-radius:20px`;

const arrow = d => svgStroke(26, 14, '0 0 26 14', d, 1.3);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#ffffff">
<title>Temple de la Mode — Essayez le look</title>
<meta name="description" content="Temple de la Mode, Bobo-Dioulasso, près de l’hôtel de ville. Six looks de la tête aux pieds : parcourez le défilé, ouvrez un look et touchez un point pour voir la pièce.">
<link rel="preload" as="image" href="${A}model-1-640.webp" fetchpriority="high">
<style>
${readFileSync(join(here, 'style.css'), 'utf8').replace('__INTER__', 'data:font/woff2;base64,' + readFileSync(join(here, 'inter-600.woff2')).toString('base64'))}
</style>
</head>
<body>
<header class="site-header shopify-section-group-header-group">
  <a href="./" class="brand" aria-label="Temple de la Mode — accueil"><span class="brand-name">Temple de la Mode</span><span class="brand-city">Bobo-Dioulasso</span></a>
  <nav aria-label="Navigation principale">
    <a href="./">Accueil</a>
    <a href="./" aria-current="page">Défilé</a>
    <a href="#nous-trouver">Nous trouver</a>
  </nav>
  <button type="button" id="open-bag" aria-label="Ouvrir le sac de style">
    <svg width="22" height="24" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true" focusable="false"><path d="M4 8h16l1 16H3L4 8zM8 8V6a4 4 0 0 1 8 0v2"/></svg>
    <span data-cart-count>0</span>
  </button>
</header>
<main>
  <runway-section id="${SID}" class="rw rw--add-icon rw--popup rw--list has-dividers has-border"
    data-feel="balanced" data-blur="true" data-mblur="true" data-style="ring" data-mstyle="classic" data-fit="true"
    data-height-mode="original" data-height-vh="100" data-mheight-mode="custom" data-mheight-vh="109" data-reflect="false"
    data-autoplay="true" data-speed="5000" data-after-add="stay" data-bundle-code=""
    data-msg-choose="Choisissez une taille pour : [items]" data-msg-error="Impossible d’ajouter au sac. Veuillez réessayer." data-msg-soldout="Épuisé"
    style="${TOKENS}">
    <div class="rw__sticky">
      <div class="rw__grid">
        <div class="rw__left">
          <div class="rw__head">
            <div class="rw__intro">
              <h2 class="rw__title">Essayez le look.</h2>
              <p class="rw__sub">Six looks, de la tête aux pieds. Touchez un point pour voir la pièce.</p>
            </div>
            <span class="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live></span>
          </div>
          <div class="rw__stage" data-rw-stage tabindex="0" role="region" aria-roledescription="carousel" aria-label="Essayez le look. — utilisez les flèches ou glissez pour changer de look">
            <div class="rw__actors" data-rw-actors>${LOOKS.map(body).join('')}
            </div>
            <div class="rw__heroes" data-rw-heroes>${LOOKS.map(hero).join('')}
            </div>
            <span class="rw__sweep"></span>
            <span class="rw__cursor" data-rw-cursor><span class="rw__cursor-in"><span class="rw__cursor-label rw__cursor-drag">Glisser</span><span class="rw__cursor-label rw__cursor-view">Voir</span></span></span>
            <span class="rw__walk"><span class="rw__walk-line"></span></span>
          </div>
          <div class="rw__controls">
            <button type="button" class="rw__icon" data-rw-prev aria-label="Look précédent">${arrow('M25 7H1M7 1L1 7l6 6')}</button>
            <div class="rw__ticks">${LOOKS.map(tick).join('')}
            </div>
            <button type="button" class="rw__icon rw__auto" data-rw-auto aria-pressed="false" aria-label="Lecture automatique">
              <svg class="rw__i-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12.5-7.5z"/></svg>
              <svg class="rw__i-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>
            </button>
            <button type="button" class="rw__icon" data-rw-next aria-label="Look suivant">${arrow('M1 7h24M19 1l6 6-6 6')}</button>
          </div>
          <div class="rw__lb" data-rw-lb data-word="Look" role="region" aria-label="Voir le look" aria-hidden="true">
            <div class="rw__lb-stage" data-rw-lb-stage></div>
            <div class="rw__lb-top">
              <p class="rw__lb-cap"><span class="rw__lb-kicker" data-rw-lb-kicker></span><span class="rw__lb-name" data-rw-lb-name></span></p>
              <button type="button" class="rw__lb-close" data-rw-zoom-close aria-label="Fermer">${ICON_X}</button>
            </div>
            <p class="rw__lb-hint">Touchez un point pour voir la pièce</p>
          </div>
        </div>
        <aside class="rw__panel has-rule">
          <div class="rw__panel-inner">
            <div class="rw__panel-head"><h3 class="rw__panel-title">Dans ce look</h3><span class="rw__label" data-rw-pieces></span></div>${LOOKS.map(panel).join('')}
          </div>
        </aside>
      </div>
    </div>
  </runway-section>
</main>
<footer class="site-footer" id="nous-trouver">
  <p class="footer-name">Temple de la Mode</p>
  <p>Bobo-Dioulasso, Burkina Faso — près de l’hôtel de ville</p>
  <p><a href="https://www.google.com/maps/search/?api=1&amp;query=H%C3%B4tel+de+ville+Bobo-Dioulasso" target="_blank" rel="noopener noreferrer">Voir l’itinéraire ↗</a></p>
</footer>
<dialog id="bag-dialog" aria-labelledby="bag-title">
  <div class="bag-heading"><h2 id="bag-title">Votre sac de style</h2><button type="button" id="close-bag" aria-label="Fermer le sac de style">×</button></div>
  <p class="bag-note">Votre sélection de tenues, gardée sur cet appareil. Aucun paiement ni commande ici : passez au Temple de la Mode, à Bobo-Dioulasso près de l’hôtel de ville, pour essayer et acheter.</p>
  <div id="bag-items"></div>
  <p id="bag-total"></p>
  <button type="button" id="export-bag" disabled>Télécharger ma sélection</button>
</dialog>
<div id="bag-status" role="status" aria-live="polite"></div>
<script>
${readFileSync(join(here, 'runtime.js'), 'utf8').replace('__CATALOG__', JSON.stringify(CATALOG, null, 1))}
</script>
</body>
</html>
`;

writeFileSync(join(here, '..', 'index.html'), html);
console.log('index.html écrit (' + Math.round(html.length / 1024) + ' Ko)');
