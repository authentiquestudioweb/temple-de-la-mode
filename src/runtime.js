(() => {
'use strict';
const CATALOG = __CATALOG__;
const SHOP_HOST = 'nike-makknzjs.myshopify.com';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = v => Math.round(v).toLocaleString('fr-FR') + '\u00a0FCFA';
const later = ms => new Promise(r => setTimeout(r, ms));

/* =================== Styling bag (localStorage) =================== */
const Bag = (() => {
  const KEY = 'runway-styling-bag-v3';
  let entries = [];
  let catalog = null;
  let toastTimer = 0;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      entries = Array.isArray(raw) ? raw
        .filter(e => e && Number.isSafeInteger(e.id) && Number.isSafeInteger(e.quantity) && e.quantity >= 1 && e.quantity <= 20)
        .slice(0, 50).map(e => ({ id: e.id, quantity: e.quantity })) : [];
    } catch (_) { entries = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (_) {} }
  function valid(d) {
    return d && Array.isArray(d.items) && d.items.every(it =>
      typeof it.id === 'string' && typeof it.name === 'string' && Number.isFinite(it.price) && it.price >= 0 &&
      Array.isArray(it.variants) && it.variants.every(v => Number.isSafeInteger(v.id) && typeof v.a === 'boolean' &&
        Array.isArray(v.o) && v.o.every(x => typeof x === 'string')));
  }
  async function getCatalog() {
    if (catalog) return catalog;
    let data;
    try { data = JSON.parse(JSON.stringify(CATALOG)); } catch (_) { throw new Error('La liste des produits n’a pas pu se charger.'); }
    if (!valid(data)) throw new Error('La liste des produits est indisponible.');
    return (catalog = data);
  }
  function find(cat, id) {
    for (const item of cat.items) { const variant = item.variants.find(v => v.id === id); if (variant) return { item, variant }; }
    return null;
  }
  const count = () => entries.reduce((s, e) => s + e.quantity, 0);
  function paint() { const c = String(count()); document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = c; }); }
  function toast(msg) {
    const el = document.getElementById('bag-status'); if (!el) return;
    el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2500);
  }
  async function add(items) {
    const cat = await getCatalog();
    for (const it of items) { const f = find(cat, it.id); if (!f || !f.variant.a) throw new Error('Veuillez choisir une taille disponible.'); }
    await later(380);
    for (const it of items) {
      const ex = entries.find(e => e.id === it.id);
      if (ex) ex.quantity = Math.min(20, ex.quantity + 1); else entries.push({ id: it.id, quantity: 1 });
    }
    entries = entries.slice(0, 50);
    save(); await render();
    toast(items.length > 1 ? 'Look ajouté à votre sac de style' : 'Pièce ajoutée à votre sac de style');
  }
  async function render() {
    paint();
    const box = document.getElementById('bag-items'); if (!box) return;
    const total = document.getElementById('bag-total');
    const exp = document.getElementById('export-bag');
    box.textContent = '';
    if (!entries.length) {
      const p = document.createElement('p'); p.className = 'bag-note';
      p.textContent = 'Votre sac de style est vide. Choisissez une taille à côté d’une pièce pour l’ajouter.';
      box.append(p); total.textContent = ''; exp.disabled = true; return;
    }
    const cat = await getCatalog();
    let sum = 0;
    for (const e of entries) {
      const f = find(cat, e.id); if (!f) continue;
      const url = new URL(f.item.url);
      if (url.hostname !== SHOP_HOST) throw new Error('Lien produit inattendu.');
      sum += f.item.price * e.quantity;
      const row = document.createElement('div'); row.className = 'bag-row';
      const img = document.createElement('img'); img.src = f.item.image; img.alt = f.item.name; img.width = 60; img.height = 80;
      const info = document.createElement('div');
      const h = document.createElement('h3'); h.textContent = f.item.name;
      const p = document.createElement('p'); p.textContent = `Taille ${f.variant.o[0]} · Quantité ${e.quantity} · ${money(f.item.price)}`;
      const a = document.createElement('a'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Voir la pièce ↗';
      info.append(h, p, a);
      const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', 'Retirer ' + f.item.name);
      rm.addEventListener('click', () => { entries = entries.filter(x => x !== e); save(); render(); });
      row.append(img, info, rm); box.append(row);
    }
    total.textContent = 'Sous-total indicatif ' + money(sum);
    exp.disabled = false;
  }
  async function exportText() {
    if (!entries.length) return;
    const cat = await getCatalog();
    const parts = ['TEMPLE DE LA MODE — MA SÉLECTION', 'Bobo-Dioulasso, près de l’hôtel de ville', 'Prix indicatifs ; aucune commande ni aucun paiement n’a été effectué.', ''];
    for (const e of entries) {
      const f = find(cat, e.id); if (!f) continue;
      parts.push(`${f.item.name} · Taille ${f.variant.o[0]} · Quantité ${e.quantity}\n${f.item.url}`);
    }
    const blob = new Blob([parts.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = href; a.download = 'temple-de-la-mode-selection.txt';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  function wire() {
    load(); paint();
    const dlg = document.getElementById('bag-dialog');
    document.getElementById('open-bag')?.addEventListener('click', async () => {
      try { await render(); } catch (_) {}
      if (dlg && !dlg.open) dlg.showModal();
    });
    document.getElementById('close-bag')?.addEventListener('click', () => dlg.close());
    document.getElementById('export-bag')?.addEventListener('click', exportText);
    dlg?.addEventListener('click', e => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
  }
  return { add, render, wire };
})();

/* =================== <runway-section> =================== */
const SHEET_VARS = ['--rw-panel', '--rw-text', '--rw-muted', '--rw-line', '--rw-accent', '--rw-on-accent', '--rw-btn-bg', '--rw-btn-fg',
  '--rw-btn-radius', '--rw-pill-radius', '--rw-bar-r', '--rw-thumb-radius', '--rw-pt-size', '--rw-price', '--rw-opt', '--rw-ease',
  '--rw-ease-sheet', '--rw-ease-spring'];
const FEEL = { balanced: { K: 95, lag: .04 } };

class RunwaySection extends HTMLElement {
  connectedCallback() { if (this._live) return; this._live = true; this.init(); }
  disconnectedCallback() { this._live = false; this.destroy(); }

  $(s) { return this.querySelector(s); }
  $$(s) { return [...this.querySelectorAll(s)]; }
  wrapN(v) { const N = this.N; return ((v % N) + N) % N; }
  mod(v) { const n = this.n; return ((v % n) + n) % n; }

  init() {
    const d = this.dataset;
    this.rm = reduced();
    const feel = FEEL[d.feel] || FEEL.balanced;
    this.K = feel.K; this.Cd = 2 * Math.sqrt(feel.K); this.lag = feel.lag;
    this.blurOn = d.blur === 'true';
    this.speed = +d.speed || 5000;
    this.stage = this.$('[data-rw-stage]');
    this.actors = this.$('[data-rw-actors]');
    this.heroes = this.$$('[data-rw-hero]');
    this.ticks = this.$$('[data-rw-tick]');
    this.panels = this.$$('[data-rw-panel]');
    this.pieces = this.$('[data-rw-pieces]');
    this.live = this.$('[data-rw-live]');
    this.lb = this.$('[data-rw-lb]');
    this.lbStage = this.$('[data-rw-lb-stage]');
    this.autoBtn = this.$('[data-rw-auto]');
    this.cursor = this.$('[data-rw-cursor]');
    this.panelEl = this.$('.rw__panel');

    // bodies + clones
    const orig = this.$$('[data-rw-model]');
    this.n = orig.length;
    this.N = this.n * Math.ceil(8 / this.n);
    for (let a = this.n; a < this.N; a++) {
      const c = orig[a % this.n].cloneNode(true);
      c.dataset.index = a; c.setAttribute('data-rw-clone', '');
      c.querySelectorAll('img').forEach(i => { i.loading = 'lazy'; i.classList.remove('is-decoded'); });
      this.actors.append(c);
    }
    this.bodies = this.$$('[data-rw-model]').map((el, a) => ({ el, a, w: 0, b: -1, x: 0, v: 0, g: 0, goal: 0, prevGoal: 0, trip: false, from: 0, done: false }));
    this.$$('img[data-model-image]').forEach(img => this.decodeImg(img));

    // pickers
    this.$$('.rw__item').forEach(card => {
      const pk = card.querySelector('[data-rw-picker]');
      card.rwPicker = pk; pk.rwCard = card;
      try { pk.rwVariants = JSON.parse(pk.querySelector('[data-rw-variants]').textContent); } catch (_) { pk.rwVariants = []; }
      this.syncPicker(pk, true);
    });

    // state
    this.index = 0; this.target = 0;
    this.start = this.rm ? 0 : 1.15;
    this.cur = -this.start; this.vel = 0;
    this.still = null; this.raf = 0; this.last = 0;
    this.visible = false; this.playing = false; this.engaged = false; this.panelHover = false; this.zoomed = false; this.dragging = false;
    this.mobile = innerWidth <= 749;
    this.vhL = 0; this.wL = 0;
    this.bodies.forEach(s => { s.goal = s.prevGoal = this.wrapN(s.a); s.x = s.g = s.goal + this.start; });

    this.classList.add('rw--js');
    if (window.Shopify && window.Shopify.designMode) this.classList.add('rw--design');

    this.frame = this.frame.bind(this);
    this.bindEvents();
    this.measure();
    this.setIndex(0, true);
    this.setupCursor();
    this.detectFeet();

    // observers
    this.io = new IntersectionObserver(es => {
      for (const e of es) { this.visible = e.isIntersecting; if (this.visible) this.kick(); }
    }, { threshold: 0 });
    this.io.observe(this);
    if (this.rm) this.classList.add('is-revealed');
    else {
      this.revealIO = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) {
          this.revealIO.disconnect(); this.revealIO = null;
          requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-revealed')));
        }
      }, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
      this.revealIO.observe(this);
    }
    this.ro = new ResizeObserver(() => { cancelAnimationFrame(this.roRaf); this.roRaf = requestAnimationFrame(() => this.measure()); });
    this.ro.observe(this.stage);

    if (d.autoplay === 'true' && !this.rm && !this.classList.contains('rw--design')) this.play(true);
  }

  destroy() {
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.cRaf); cancelAnimationFrame(this.roRaf);
    clearTimeout(this.timer); clearTimeout(this.resizeT); clearTimeout(this.lbT);
    this.io?.disconnect(); this.revealIO?.disconnect(); this.ro?.disconnect();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.sheetPicker) this.dock(this.sheetPicker);
    this.host?.remove(); this.host = null;
  }

  decodeImg(img) {
    const done = () => img.classList.add('is-decoded');
    if (img.decode) img.decode().then(done, () => { if (img.naturalWidth) done(); else img.addEventListener('load', done, { once: true }); });
    else if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
  }

  /* ---------- measure ---------- */
  headerHeight() {
    const seen = new Set(); let h = 0;
    document.querySelectorAll('.shopify-section-group-header-group, #shopify-section-header, #shopify-section-announcement-bar').forEach(el => {
      if (seen.has(el) || el.contains(this)) return;
      for (const s of seen) if (s.contains(el)) return;
      seen.add(el);
      const r = el.getBoundingClientRect();
      if (getComputedStyle(el).display !== 'none') h += r.height;
    });
    return h;
  }

  measure() {
    const d = this.dataset;
    const wasMobile = this.mobile;
    this.mobile = innerWidth <= 749;
    const prevMode = this.mode;
    this.mode = this.mobile ? (d.mstyle || 'classic') : (d.style || 'ring');
    let frameH;
    if (this.mobile) {
      if (!this.vhL || innerWidth !== this.wL || Math.abs(innerHeight - this.vhL) >= 160) { this.vhL = innerHeight; this.wL = innerWidth; }
      const pct = d.mheightMode === 'custom' ? clamp(+d.mheightVh || 100, 50, 120) : 100;
      frameH = this.vhL * pct / 100;
    } else {
      this.wL = innerWidth;
      frameH = d.fit === 'true' ? Math.max(380, innerHeight - this.headerHeight()) : innerHeight * (+d.heightVh || 100) / 100;
    }
    this.style.setProperty('--rw-frame-h', Math.round(frameH) + 'px');

    const r = this.stage.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    const ring = this.mode === 'ring';
    this.fs = ring ? 1.08 : 1;
    let modelH, hx, hy;
    if (ring) { modelH = Math.max(200, Math.round((this.H - 34 - 18) / 1.08)); hx = .5 * this.W; hy = 34; }
    else {
      modelH = Math.max(200, Math.round(this.H - (this.mobile ? 24 : 36) - 18));
      this.cls = this.mobile ? { ax: .3, ay: 22, sx: .32, sy: 22, sr: .76, ex: .55, d: 4 } : { ax: .4, ay: 36, sx: .125, sy: 58, sr: .76, ex: .38, d: 5 };
      hx = this.cls.ax * this.W; hy = this.cls.ay;
    }
    this.hx = hx; this.hy = hy;
    this.stage.style.setProperty('--rw-model-h', modelH + 'px');
    this.stage.style.setProperty('--rw-hx', hx.toFixed(1) + 'px');
    this.stage.style.setProperty('--rw-hy', hy + 'px');
    this.stage.style.setProperty('--rw-fs', this.fs);
    this.style.setProperty('--rw-ax', (this.W ? hx / this.W * 100 : 40).toFixed(2) + '%');
    this.unit = ring ? Math.max(this.mobile ? 90 : 120, .3 * this.W) : Math.max(90, this.W * this.cls.sx * 1.6);
    this.bodies.forEach(s => { s.w = s.el.offsetWidth; });

    if (prevMode && prevMode !== this.mode) {
      this.cur = this.target; this.vel = 0;
      this.bodies.forEach(s => { s.goal = s.prevGoal = this.wrapN(s.a - this.target); s.x = s.g = s.goal; s.v = 0; s.trip = false; });
    }
    if (wasMobile && !this.mobile) this.$$('.rw__item.is-picking').forEach(c => { const pk = c.rwPicker; if (pk.parentNode !== c) c.append(pk); });
    if (wasMobile && !this.mobile && this.sheetPicker) { this.dock(this.sheetPicker, true); }
    this.renderAll();
    this.kick();
  }

  /* ---------- placement ---------- */
  put(s, x, bottom, scale, op, blur, z) {
    const hw = s.w * scale / 2;
    if (x + hw < -4 || x - hw > this.W + 4) op = 0;
    const st = s.el.style;
    st.transform = `translate3d(${x.toFixed(2)}px,${(-bottom).toFixed(2)}px,0) translateX(-50%) scale(${scale.toFixed(4)})`;
    st.opacity = op.toFixed(3);
    st.zIndex = z;
    st.visibility = op < .01 ? 'hidden' : '';
    st.pointerEvents = op < .5 ? 'none' : '';
    const b = !this.blurOn || blur <= .05 ? 0 : Math.round(blur * 10) / 10;
    if (b !== s.b) { s.b = b; st.filter = b ? `blur(${b}px)` : ''; }
  }

  renderAll() { if (!this.W) return; this.mode === 'ring' ? this.renderRing() : this.renderClassic(); }

  renderRing() {
    const W = this.W, H = this.H, m = this.mobile;
    const cx = .5 * W, R = (m ? .72 : .62) * W, P = (m ? 1.9 : 1.65) * W;
    const floor = H - 34, horizon = .36 * H, step = 2 * Math.PI / this.N, TAU = 2 * Math.PI;
    for (const s of this.bodies) {
      let phi = ((s.a - this.cur) * step) % TAU;
      if (phi < 0) phi += TAU;
      if (phi > Math.PI) phi -= TAU;
      const cos = Math.cos(phi), z = R * (1 - cos), persp = P / (P + z), sl = Math.abs(phi) / step;
      const scale = persp * (1 + (this.fs - 1) * clamp(1 - sl, 0, 1));
      const x = cx + R * Math.sin(phi) * persp;
      const feet = horizon + (floor - horizon) * persp;
      const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      let op = clamp((cos + .55) / .3, 0, 1);
      if (this.still && sl < .02) op = 0;
      this.put(s, x, H - feet, scale, op, blur, Math.round(scale * 1000));
    }
  }

  renderClassic() {
    const W = this.W, c = this.cls;
    for (const s of this.bodies) {
      let k = s.x, e = -1;
      if (s.trip) {
        const span = s.goal - s.from;
        const u = span ? clamp(Math.abs(s.x - s.from) / Math.abs(span), 0, 1) : 1;
        if (span > 0) { if (u < .5) e = 2 * u * 1.4; else k = s.goal + 2 * (1 - u); }
        else { if (u < .5) k = s.from + 2 * u; else e = 2 * (1 - u) * 1.4; }
      } else if (k < 0) e = Math.min(-k, 1.4);
      if (e >= 0) {
        this.put(s, W * (c.ax - c.ex * e), c.ay - 22 * e, 1 + .14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
      } else {
        let op = k <= c.d - 1 ? 1 - .13 * k : Math.max(0, .61 * (c.d - k));
        if (this.still && Math.abs(k) < .02) op = 0;
        this.put(s, W * (c.ax + c.sx * k), c.ay + c.sy * k, Math.pow(c.sr, k), op, Math.min(.9 * k, 3.2), 1000 - Math.round(10 * k));
      }
    }
  }

  /* ---------- physics ---------- */
  step(dt) {
    const K = this.K, C = this.Cd;
    if (this.mode === 'ring') {
      if (this.rm && !this.dragging) { this.cur = this.target; this.vel = 0; return false; }
      const h = dt / 3;
      for (let i = 0; i < 3; i++) { const acc = -K * (this.cur - this.target) - C * this.vel; this.vel += acc * h; this.cur += this.vel * h; }
      if (Math.abs(this.cur - this.target) <= .0005 && Math.abs(this.vel) <= .0005) { this.cur = this.target; this.vel = 0; return false; }
      return true;
    }
    this.cur = this.target; this.vel = 0;
    let moving = false;
    const N = this.N;
    for (const s of this.bodies) {
      const goal = this.wrapN(s.a - this.target);
      if (Math.abs(goal - s.prevGoal) > N / 2) { s.trip = true; s.from = s.x; if (this.rm) s.trip = false; }
      s.prevGoal = goal; s.goal = goal;
      if (this.rm && !this.dragging) { s.x = s.g = goal; s.v = 0; s.trip = false; continue; }
      const tau = this.dragging ? .016 : s.trip ? .1 : .03 + this.lag * Math.min(goal, 4);
      s.g += (goal - s.g) * (1 - Math.exp(-dt / tau));
      const h = dt / 3;
      for (let i = 0; i < 3; i++) { const acc = -K * (s.x - s.g) - C * s.v; s.v += acc * h; s.x += s.v * h; }
      if (s.trip && Math.abs(s.x - goal) < .02) s.trip = false;
      if (!s.trip && Math.abs(s.x - goal) < .0006 && Math.abs(s.v) < .0006 && Math.abs(s.g - goal) < .0006) { s.x = s.g = goal; s.v = 0; }
      else moving = true;
    }
    return moving;
  }

  frame(t) {
    this.raf = 0;
    const dt = this.last ? Math.min(.034, (t - this.last) / 1000) : 1 / 60;
    this.last = t;
    const moving = this.step(dt) || this.dragging;
    if (moving) {
      this.setStill(false); this.renderAll();
      if (this.visible && !document.hidden) this.raf = requestAnimationFrame(this.frame); else this.last = 0;
    } else { this.last = 0; this.setStill(true); this.renderAll(); }
  }
  kick() { if (this.raf || !this.visible || document.hidden) return; this.raf = requestAnimationFrame(this.frame); }
  setStill(v) { if (this.still === v) return; this.still = v; this.classList.toggle('rw--still', v); }

  /* ---------- index ---------- */
  rank(a) {
    if (this.mode === 'ring') { let k = this.wrapN(a - Math.round(this.target)); if (k > this.N / 2) k -= this.N; return k; }
    return this.wrapN(a - Math.round(this.target));
  }

  setIndex(i, silent) {
    const prev = this.index;
    const changed = silent || i !== prev;
    this.index = i;
    const lim = this.mode === 'ring' ? 2 : 3;
    for (const s of this.bodies) {
      const k = this.rank(s.a), on = k !== 0 && Math.abs(k) <= lim;
      const hit = s.el.querySelector('.rw__hit');
      if (hit) { hit.tabIndex = on ? 0 : -1; hit.setAttribute('aria-hidden', on ? 'false' : 'true'); }
      if (on) s.el.removeAttribute('aria-hidden'); else s.el.setAttribute('aria-hidden', 'true');
    }
    if (changed) {
      if (!silent) { this.closeLb(); if (this.mobile && this.sheetPicker) this.closePicker(this.sheetPicker); }
      this.style.setProperty('--rw-progress', ((i + 1) / this.n).toFixed(3));
      this.heroes.forEach((h, j) => {
        h.classList.toggle('is-on', j === i);
        h.classList.toggle('was', j === prev && j !== i);
        h.setAttribute('aria-hidden', j === i ? 'false' : 'true');
        const z = h.querySelector('[data-rw-zoom]'); if (z) z.tabIndex = j === i ? 0 : -1;
      });
      if (!silent && !this.rm) { this.stage.classList.remove('is-sweep'); void this.stage.offsetWidth; this.stage.classList.add('is-sweep'); }
      if (!silent && this.live) this.live.textContent = this.heroes[i].dataset.label;
      this.ticks.forEach((t, j) => { t.setAttribute('aria-current', j === i ? 'true' : 'false'); t.classList.toggle('is-past', j < i); });
      this.panels.forEach((p, j) => { p.hidden = j !== i; if (!silent) p.classList.remove('is-in'); });
      if (!silent) { void this.panels[i].offsetWidth; this.panels[i].classList.add('is-in'); }
      const tpl = this.panels[i].querySelector('template[data-rw-pieces-text]');
      if (tpl && this.pieces) {
        this.pieces.textContent = tpl.content.textContent.trim();
        if (!silent) { this.pieces.classList.remove('is-swap'); void this.pieces.offsetWidth; this.pieces.classList.add('is-swap'); }
      }
      this.clearHot();
      this.restartBar();
    }
    this.kick();
  }

  moveTo(T) { this.target = T; this.setStill(false); this.setIndex(this.mod(T)); this.kick(); }
  next() { this.moveTo(Math.round(this.target) + 1); }
  prev() { this.moveTo(Math.round(this.target) - 1); }
  go(i) { let d = this.mod(i - this.index); if (d > this.n / 2) d -= this.n; this.moveTo(Math.round(this.target) + d); }

  /* ---------- autoplay ---------- */
  play(on) {
    this.playing = on;
    this.classList.toggle('is-playing', on);
    this.autoBtn?.classList.toggle('is-playing', on);
    this.autoBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
    this.restartBar();
  }
  restartBar() {
    clearTimeout(this.timer);
    this.ticks.forEach(t => t.classList.remove('is-run'));
    if (!this.playing) return;
    void this.offsetWidth;
    this.ticks[this.index]?.classList.add('is-run');
    this.timer = setTimeout(() => {
      if (this.playing && this.visible && !this.dragging && !document.hidden && !this.panelHover && !this.zoomed && !this.engaged) this.next();
      else this.restartBar();
    }, this.speed);
  }
  engage() { this.engaged = true; if (this.playing) this.play(false); }

  /* ---------- events ---------- */
  bindEvents() {
    const st = this.stage;
    this.onResize = () => { clearTimeout(this.resizeT); this.resizeT = setTimeout(() => this.measure(), 120); };
    this.onVis = () => { if (!document.hidden) { this.kick(); this.restartBar(); } };
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVis);

    st.addEventListener('pointerdown', e => this.onDown(e));
    st.addEventListener('pointermove', e => this.onMove(e));
    st.addEventListener('pointerup', e => this.onUp(e));
    st.addEventListener('pointercancel', e => this.onUp(e));
    st.addEventListener('dragstart', e => e.preventDefault());
    this.addEventListener('click', e => { if (performance.now() < (this.suppress || 0)) { e.stopPropagation(); e.preventDefault(); } }, true);
    this.addEventListener('click', e => this.onClick(e));
    this.addEventListener('change', e => this.onChange(e));

    // trackpad
    let acc = 0, lock = 0;
    st.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (performance.now() < lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 45) { acc > 0 ? this.next() : this.prev(); acc = 0; lock = performance.now() + 520; }
    }, { passive: false });

    st.addEventListener('keydown', e => {
      if (e.target !== st) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    });
    this.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (this.sheetPicker) { this.closePicker(this.sheetPicker, true); return; }
      if (this.zoomed) this.closeLb();
    });

    // panel: hover hold, engage, hot rows
    const pn = this.panelEl;
    pn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') this.panelHover = true; });
    pn.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { this.panelHover = false; this.restartBar(); } });
    pn.addEventListener('click', e => { if (e.target.closest('button,a,input,select,label')) this.engage(); }, true);
    pn.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.rw__item'); if (!card || card.classList.contains('is-hot')) return;
      this.hot(+card.dataset.rwCard, false);
    });
    pn.addEventListener('pointerout', e => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.rw__item'); if (!card || card.contains(e.relatedTarget)) return;
      this.clearHot();
    });
  }

  onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (this.zoomed) return;
    this.ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: this.target, dx: 0, type: e.pointerType, drag: false, samples: [{ x: e.clientX, time: e.timeStamp }] };
  }
  onMove(e) {
    const p = this.ptr; if (!p || e.pointerId !== p.id) return;
    if (p.type === 'mouse' && e.buttons === 0) { this.onUp(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.drag) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        p.drag = true; this.dragging = true; this.classList.add('is-dragging');
        try { this.stage.setPointerCapture(e.pointerId); } catch (_) {}
        this.setStill(false);
        this.cursor?.classList.remove('is-view', 'is-link');
      } else if (Math.abs(dy) > 10) { this.ptr = null; return; }
      else return;
    }
    p.dx = dx;
    p.samples.push({ x: e.clientX, time: e.timeStamp }); if (p.samples.length > 6) p.samples.shift();
    this.target = p.t - dx / this.unit;
    this.kick();
  }
  onUp(e) {
    const p = this.ptr; if (!p || e.pointerId !== p.id) return;
    this.ptr = null;
    if (!p.drag) return;
    this.dragging = false; this.classList.remove('is-dragging');
    try { this.stage.releasePointerCapture(e.pointerId); } catch (_) {}
    this.suppress = performance.now() + 60;
    const s = p.samples, f = s[0], l = s[s.length - 1], span = l.time - f.time;
    const vx = span > 0 ? (l.x - f.x) / span : 0;
    const sign = -1, from = Math.round(p.t);
    let i;
    if (this.mobile) i = (Math.abs(p.dx) > 30 || Math.abs(vx) > .3) ? from + sign * (p.dx > 0 ? 1 : -1) : from;
    else {
      i = Math.round(this.target + sign * vx * 160 / this.unit);
      if (i === from && Math.abs(vx) > .3) i = from + sign * Math.sign(vx);
      i = clamp(i, from - 2, from + 2);
    }
    this.moveTo(i);
  }

  onClick(e) {
    const t = e.target; let el;
    if ((el = t.closest('[data-rw-pick-close]'))) { const pk = el.closest('[data-rw-picker]') || this.sheetPicker; if (pk) this.closePicker(pk, true); return; }
    if (t.closest('[data-rw-zoom-close]')) { this.closeLb(); return; }
    if (this.zoomed && t.closest('[data-rw-lb]') && !t.closest('.rw__lb-model') && !t.closest('.rw__lb-top')) { this.closeLb(); return; }
    if (t.closest('[data-rw-zoom]')) { this.openLb(); return; }
    if (t.closest('[data-rw-next]')) { this.next(); return; }
    if (t.closest('[data-rw-prev]')) { this.prev(); return; }
    if ((el = t.closest('[data-rw-tick]'))) { this.go(+el.dataset.rwTick); return; }
    if (t.closest('[data-rw-auto]')) { if (!this.playing) this.engaged = false; this.play(!this.playing); return; }
    if ((el = t.closest('[data-rw-pin]'))) { this.engage(); this.hot(+el.dataset.rwPin, true); return; }
    if ((el = t.closest('[data-rw-go]'))) {
      const body = el.closest('[data-rw-model]'); const k = this.rank(+body.dataset.index);
      if (k !== 0 && Math.abs(k) < 6) this.moveTo(Math.round(this.target) + k); else if (k === 0) this.openLb();
      return;
    }
    if ((el = t.closest('[data-rw-confirm]'))) {
      const pk = el.closest('[data-rw-picker]'); const card = pk.rwCard;
      card.dataset.touched = '1'; this.addOne(card); return;
    }
    if ((el = t.closest('[data-rw-add]'))) { const card = el.closest('.rw__item'); if (card) this.togglePicker(card); return; }
    if ((el = t.closest('[data-rw-all]'))) { this.addAll(el.closest('.rw__look-panel')); }
  }

  onChange(e) {
    const t = e.target;
    if (t.closest('.rw__panel') || t.closest('.rw-sheet-host')) this.engage();
    if (t.matches('[data-rw-option]')) this.syncPicker(t.closest('[data-rw-picker]'), false);
  }

  /* ---------- hot linking ---------- */
  hot(n, scroll) {
    this.clearHot();
    const scope = this.zoomed ? this.lb : this.heroes[this.index];
    scope?.querySelector(`[data-rw-pin="${n}"]`)?.classList.add('is-hot');
    const card = this.panels[this.index].querySelector(`[data-rw-card="${n}"]`);
    if (card) { card.classList.add('is-hot'); if (scroll) this.reveal(card); }
  }
  clearHot() { this.$$('.is-hot').forEach(x => x.classList.remove('is-hot')); }
  reveal(card) {
    const list = card.closest('.rw__items'); if (!list) return;
    const behavior = this.rm ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 1) {
      const left = card.getBoundingClientRect().left - list.getBoundingClientRect().left - 20 + list.scrollLeft;
      list.scrollTo({ left, behavior });
    } else if (list.scrollHeight > list.clientHeight + 1) {
      list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
    } else {
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight - 140) window.scrollBy({ top: r.top - .3 * innerHeight, behavior });
    }
  }

  /* ---------- pickers ---------- */
  syncPicker(pk, initial) {
    const vars = pk.rwVariants || [];
    const sets = [...pk.querySelectorAll('fieldset.rw__opt')];
    const sel = sets.map(f => { const c = f.querySelector('input:checked'); return c ? c.value : null; });
    const match = vars.find(v => v.o.every((x, i) => x === sel[i]));
    sets.forEach((f, i) => f.querySelectorAll('input').forEach(inp => {
      const ok = vars.some(v => v.a && v.o[i] === inp.value && v.o.every((x, j) => j === i || x === sel[j]));
      inp.closest('.rw__pill')?.classList.toggle('is-unavailable', !ok);
    }));
    const btn = pk.querySelector('[data-rw-confirm]');
    const lab = btn.querySelector('[data-rw-confirm-label]');
    const avail = !!(match && match.a);
    btn.disabled = !avail;
    lab.textContent = avail ? lab.dataset.add : this.dataset.msgSoldout;
    const card = pk.rwCard;
    if (avail) card.dataset.selected = match.id; else delete card.dataset.selected;
    if (!initial) card.dataset.touched = '1';
  }

  togglePicker(card) {
    if (card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
    if (card.classList.contains('is-picking')) this.closePicker(card.rwPicker); else this.openPicker(card, true, true);
  }

  openPicker(card, focus, reveal) {
    if (card.classList.contains('is-added')) return;
    const pk = card.rwPicker;
    if (this.mobile) {
      if (this.sheetPicker && this.sheetPicker !== pk) this.closePicker(this.sheetPicker);
      this.mountSheet(pk);
    }
    pk.hidden = false;
    card.classList.add('is-picking');
    card.querySelector('[data-rw-add]').setAttribute('aria-expanded', 'true');
    if (focus) pk.querySelector('input:checked')?.focus({ preventScroll: true });
    if (!this.mobile && reveal) this.reveal(card);
  }

  closePicker(pk, refocus) {
    const card = pk.rwCard;
    pk.hidden = true;
    card.classList.remove('is-picking');
    const add = card.querySelector('[data-rw-add]');
    if (!card.classList.contains('is-added')) add.setAttribute('aria-expanded', 'false');
    if (pk.parentNode !== card) this.dock(pk);
    if (refocus && !card.classList.contains('is-added')) add.focus({ preventScroll: true });
  }

  ensureHost() {
    if (this.host) return this.host;
    const host = document.createElement('div');
    host.className = 'rw-sheet-host';
    const scrim = document.createElement('button');
    scrim.type = 'button'; scrim.className = 'rw__pick-scrim';
    scrim.setAttribute('data-rw-pick-close', ''); scrim.tabIndex = -1; scrim.setAttribute('aria-hidden', 'true');
    host.append(scrim);
    host.addEventListener('click', e => { if (e.target.closest('button,a,input,select,label') && !e.target.closest('[data-rw-pick-close]')) this.engage(); this.onClick(e); });
    host.addEventListener('change', e => this.onChange(e));
    host.addEventListener('keydown', e => { if (e.key === 'Escape' && this.sheetPicker) this.closePicker(this.sheetPicker, true); });
    document.body.append(host);
    return (this.host = host);
  }

  mountSheet(pk) {
    const host = this.ensureHost();
    const cs = getComputedStyle(this);
    SHEET_VARS.forEach(v => host.style.setProperty(v, cs.getPropertyValue(v)));
    host.style.fontFamily = cs.fontFamily; host.style.color = cs.color;
    host.append(pk);
    host.classList.add('is-open');
    this.classList.add('rw--picking');
    this.sheetPicker = pk;
  }

  dock(pk) {
    pk.rwCard.append(pk);
    if (this.sheetPicker === pk) {
      this.sheetPicker = null;
      this.host?.classList.remove('is-open');
      this.classList.remove('rw--picking');
    }
  }

  /* ---------- adding ---------- */
  say(panel, text) {
    const msg = panel.querySelector('[data-rw-msg]'); if (!msg) return;
    msg.textContent = text;
    msg.classList.remove('is-new');
    if (text) { void msg.offsetWidth; msg.classList.add('is-new'); }
  }

  markAdded(card) {
    card.classList.remove('is-loading', 'is-picking');
    card.classList.add('is-added');
    const pk = card.rwPicker;
    pk.hidden = true; if (pk.parentNode !== card) this.dock(pk);
    const add = card.querySelector('[data-rw-add]');
    add.setAttribute('aria-label', add.dataset.addedLabel);
    add.removeAttribute('aria-expanded');
    if (this.mobile && !this.rm && navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
  }

  checkComplete(panel) {
    const cards = [...panel.querySelectorAll('.rw__item')];
    if (cards.length >= 2 && cards.every(c => c.classList.contains('is-added'))) {
      panel.classList.add('is-complete');
      this.say(panel, '');
      panel.querySelector('[data-rw-all]')?.setAttribute('aria-disabled', 'true');
    }
  }

  async addOne(card) {
    if (card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
    const id = +card.dataset.selected; if (!id) return;
    const panel = card.closest('.rw__look-panel');
    this.say(panel, '');
    card.classList.add('is-loading');
    try {
      await Bag.add([{ id, quantity: 1 }]);
      this.markAdded(card);
      this.checkComplete(panel);
    } catch (_) {
      card.classList.remove('is-loading');
      this.say(panel, this.dataset.msgError);
    }
  }

  async addAll(panel) {
    if (!panel) return;
    const cta = panel.querySelector('[data-rw-all]');
    if (panel.classList.contains('is-complete') || cta.classList.contains('is-loading')) return;
    this.say(panel, '');
    const cards = [...panel.querySelectorAll('.rw__item')].filter(c => !c.classList.contains('is-added') && !c.classList.contains('is-soldout'));
    const ready = cards.filter(c => c.dataset.variantId || (c.dataset.touched && c.dataset.selected));
    const pending = cards.filter(c => !ready.includes(c));
    if (ready.length) {
      cta.classList.add('is-loading');
      ready.forEach(c => c.classList.add('is-loading'));
      try {
        await Bag.add(ready.map(c => ({ id: +(c.dataset.variantId || c.dataset.selected), quantity: 1 })));
        ready.forEach(c => this.markAdded(c));
      } catch (_) {
        ready.forEach(c => c.classList.remove('is-loading'));
        this.say(panel, this.dataset.msgError);
      }
      cta.classList.remove('is-loading');
    }
    if (pending.length) {
      (this.mobile ? pending.slice(0, 1) : pending).forEach((c, i) => this.openPicker(c, i === 0, false));
      this.reveal(pending[0]);
      this.say(panel, this.dataset.msgChoose.replace('[items]', pending.map(c => c.dataset.title).join(', ')));
    }
    this.checkComplete(panel);
  }

  /* ---------- View look popup ---------- */
  flipTo(a, b) { return `translate3d(${(a.left - b.left).toFixed(2)}px,${(a.bottom - b.bottom).toFixed(2)}px,0) scale(${(a.height / b.height).toFixed(4)})`; }

  openLb() {
    if (this.zoomed) return;
    const hero = this.heroes[this.index]; if (!hero) return;
    this.engage(); this.clearHot();
    clearTimeout(this.lbT);
    const wrap = document.createElement('div');
    wrap.className = 'rw__lb-model';
    [...hero.querySelector('.rw__morph').children].forEach(ch => wrap.append(ch.cloneNode(true)));
    wrap.querySelector('[data-rw-zoom]')?.remove();
    wrap.querySelectorAll('[data-rw-pin]').forEach(p => { p.tabIndex = 0; });
    const foot = hero.style.getPropertyValue('--rw-foot'); if (foot) wrap.style.setProperty('--rw-foot', foot);
    this.lbStage.textContent = '';
    this.lbStage.append(wrap);
    const sr = this.lbStage.getBoundingClientRect();
    const h = Math.max(160, Math.min(sr.height, sr.width / .5625));
    wrap.style.setProperty('--rw-model-h', h + 'px');
    wrap.querySelectorAll('img').forEach(img => { img.loading = 'eager'; img.sizes = Math.round(h * .5625) + 'px'; img.classList.add('is-decoded'); });
    this.$('[data-rw-lb-kicker]').textContent = `${this.lb.dataset.word || 'Look'} ${String(this.index + 1).padStart(2, '0')}`;
    this.$('[data-rw-lb-name]').textContent = hero.dataset.name;
    this.lbHero = hero;
    this.zoomed = true;
    this.classList.add('rw--zoom');
    this.lb.setAttribute('aria-hidden', 'false');
    if (!this.rm) {
      const a = hero.querySelector('.rw__figure').getBoundingClientRect();
      const b = wrap.querySelector('.rw__figure').getBoundingClientRect();
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transition = 'none';
      wrap.style.transform = this.flipTo(a, b);
      void wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = '';
    }
    this.lb.querySelector('[data-rw-zoom-close]').focus({ preventScroll: true });
  }

  closeLb() {
    if (!this.zoomed) return;
    const wrap = this.lbStage.firstElementChild;
    this.zoomed = false;
    if (wrap && !this.rm && this.lbHero) {
      const a = this.lbHero.querySelector('.rw__figure').getBoundingClientRect();
      const b = wrap.querySelector('.rw__figure').getBoundingClientRect();
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transform = this.flipTo(a, b);
    }
    this.classList.remove('rw--zoom');
    const hadFocus = this.lb.contains(document.activeElement);
    this.lb.setAttribute('aria-hidden', 'true');
    clearTimeout(this.lbT);
    this.lbT = setTimeout(() => { if (!this.zoomed) this.lbStage.textContent = ''; }, 950);
    if (hadFocus) this.stage.focus({ preventScroll: true });
    this.clearHot();
    this.restartBar();
  }

  /* ---------- custom cursor ---------- */
  setupCursor() {
    if (!this.cursor) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) { this.cursor.remove(); this.cursor = null; return; }
    this.classList.add('rw--cursor');
    const c = this.cursor, st = this.stage;
    let x = 0, y = 0, tx = 0, ty = 0, on = false;
    const loop = () => {
      this.cRaf = 0;
      const f = this.rm ? 1 : .18;
      x += (tx - x) * f; y += (ty - y) * f;
      c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      if (Math.hypot(tx - x, ty - y) >= .2) this.cRaf = requestAnimationFrame(loop);
    };
    st.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = st.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { on = true; x = tx; y = ty; c.classList.add('is-on'); }
      const zoom = !this.dragging && !!e.target.closest('[data-rw-zoom]');
      const link = !this.dragging && !zoom && !!e.target.closest('[data-rw-pin],.rw__hit');
      c.classList.toggle('is-view', zoom);
      c.classList.toggle('is-link', link);
      if (!this.cRaf) this.cRaf = requestAnimationFrame(loop);
    });
    st.addEventListener('pointerleave', () => { on = false; c.classList.remove('is-on', 'is-link', 'is-view'); });
  }

  /* ---------- feet detection ---------- */
  detectFeet() {
    this.heroes.forEach((hero, i) => {
      const src = hero.dataset.probe; if (!src) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 48, h = Math.max(1, Math.round(48 * img.naturalHeight / img.naturalWidth));
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let last = -1;
          for (let yy = h - 1; yy >= 0 && last < 0; yy--) for (let xx = 0; xx < w; xx++) if (data[(yy * w + xx) * 4 + 3] > 40) { last = yy; break; }
          if (last < 0) return;
          const v = clamp((h - 1 - last) / h, 0, .4).toFixed(4);
          hero.style.setProperty('--rw-foot', v);
          this.bodies.forEach(s => { if (s.a % this.n === i) s.el.style.setProperty('--rw-foot', v); });
        } catch (_) { /* tainted canvas: keep offset 0 */ }
      };
      img.src = src;
    });
  }
}

Bag.wire();
customElements.define('runway-section', RunwaySection);
})();
