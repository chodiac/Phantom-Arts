/* =====================================================================
   FLOWSTATE — main.js
   GSAP · ScrollTrigger · Lenis
   ===================================================================== */

/* ---- CONFIG ----------------------------------------------------------
   Za pravi hero video: ubaci fajl na assets/flowstate-hero.mp4 i
   postavi putanju ispod. Ostavi null da se zadrži dizajniran
   placeholder (bez mrežnog zahteva, čista konzola).  */
const CONFIG = {
  HERO_VIDEO_SRC: 'assets/brand/flowstate-cinematic.mp4',
  HERO_VIDEO_POSTER: null,
};
/* ------------------------------------------------------------------- */

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeIn3 = t => t * t * t;

  // ?motion forces the full experience even when the OS asks to reduce it
  // (opt-in, for previews/demos only — default still respects the setting)
  const forceMotion = new URLSearchParams(location.search).has('motion');
  const reduceMotion = !forceMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---- always: reveal the page even if libraries / rAF stall ---- */
  function killLoader() {
    document.body.classList.remove('is-loading');
    const l = document.getElementById('loader');
    if (l) l.style.display = 'none';
  }
  window.addEventListener('load', () => setTimeout(killLoader, 2600));
  setTimeout(killLoader, 4000);

  if (!hasGSAP) {
    document.body.classList.add('no-motion');
    const slot = $('#heroSlot'), hm = $('#heroMedia');
    if (slot && hm) slot.appendChild(hm);
    killLoader();
    initStatics();
    return;
  }

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  // this is a scroll-choreographed page — always begin at the top
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  /* =================================================================
     SMOOTH SCROLL (Lenis) + ScrollTrigger sync
     ================================================================= */
  gsap.ticker.lagSmoothing(0); // keep timelines real-time after tab throttling

  let lenis = null;
  // ?motion&raw disables Lenis (native scroll) for previews/debugging
  const rawScroll = new URLSearchParams(location.search).has('raw');
  if (!reduceMotion && !rawScroll && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.14, wheelMultiplier: 1.1, touchMultiplier: 1.8 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
  }
  function scrollToTarget(el) {
    const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY - 54;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* =================================================================
     LOADER + INTRO
     ================================================================= */
  function runIntro() {
    const loader = $('#loader');
    const fill = $('[data-loader-fill]');
    const count = $('[data-count]');
    const tl = gsap.timeline({ onComplete: () => { killLoader(); ST.refresh(); } });
    gsap.delayedCall(2.4, killLoader); // safety net

    tl.to(fill, { width: '100%', duration: 0.6, ease: 'power2.inOut' }, 0);
    tl.to({ v: 0 }, { v: 100, duration: 0.6, ease: 'power2.inOut',
      onUpdate() { if (count) count.textContent = String(Math.round(this.targets()[0].v)).padStart(2, '0'); } }, 0);
    tl.to(loader, { yPercent: -100, duration: 0.55, ease: 'power3.inOut' }, '+=0.05');
    tl.set(loader, { display: 'none' });

    if (!reduceMotion) {
      tl.from('.hero__title .w', { yPercent: 115, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '-=0.35');
      tl.from('.hero__eyebrow > span, .hero__lede > span, .hero__tags, .hero__cta', {
        yPercent: 110, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.6');
      tl.from('.hero__status, .hero__scroll', { opacity: 0, duration: 0.6 }, '-=0.4');
    }
  }

  /* =================================================================
     NAV
     ================================================================= */
  function initNav() {
    const nav = $('#nav');
    ST.create({ start: 'top -60', end: 99999, toggleClass: { targets: nav, className: 'is-scrolled' } });

    const menu = $('#menu'), toggle = $('#navToggle');
    let open = false;
    const setMenu = v => {
      open = v;
      menu.classList.toggle('is-open', v);
      nav.classList.toggle('is-open', v);
      menu.setAttribute('aria-hidden', String(!v));
      toggle.setAttribute('aria-expanded', String(v));
      if (lenis) v ? lenis.stop() : lenis.start();
      document.body.style.overflow = v && !lenis ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setMenu(!open));

    $$('a[href^="#"]', document).forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        if (open) setMenu(false);
        setTimeout(() => scrollToTarget(t), open ? 340 : 0);
      });
    });

    $$('[data-placeholder]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  }

  /* =================================================================
     THEME (light / dark sections)
     ================================================================= */
  function initTheme() {
    const setTheme = t => document.body.classList.toggle('theme-light', t === 'light');
    $$('[data-theme]').forEach(sec => {
      const t = sec.dataset.theme;
      ST.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onEnter: () => setTheme(t), onEnterBack: () => setTheme(t),
      });
    });
  }

  /* =================================================================
     CURSOR + MAGNETIC
     ================================================================= */
  function initCursor() {
    if (isTouch || reduceMotion) return;
    document.body.classList.add('has-cursor');
    const cur = $('#cursor');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.16, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.16, ease: 'power3' });
    window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

    const hoverables = 'a,button,input,select,textarea,[data-view]';
    document.addEventListener('pointerover', e => {
      const h = e.target.closest(hoverables);
      if (!h) return;
      cur.classList.add('is-active');
      if (h.matches('[data-view]')) cur.classList.add('is-view');
    });
    document.addEventListener('pointerout', e => {
      if (!e.target.closest(hoverables)) return;
      cur.classList.remove('is-active', 'is-view');
    });
  }

  function initMagnetic() {
    if (isTouch || reduceMotion) return;
    $$('[data-magnetic]').forEach(el => {
      const strength = 0.32;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1,0.5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1,0.5)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* =================================================================
     SCROLL PROGRESS
     ================================================================= */
  function initProgress() {
    const bar = $('[data-progress]');
    ST.create({
      start: 0, end: 'max',
      onUpdate: self => gsap.set(bar, { scaleX: self.progress }),
    });
  }

  /* =================================================================
     GENERIC REVEALS
     ================================================================= */
  function initReveals() {
    if (reduceMotion) { $$('.reveal').forEach(el => el.classList.add('is-in')); return; }

    $$('.reveal').forEach(el => {
      ST.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => el.classList.add('is-in'),
      });
    });
    // section headline line-rise
    $$('.studio__headline, .cap__title, .social__title, .build__title, .work__title, .process__title, .contact__title').forEach(h => {
      const lines = $$('span', h);
      gsap.from(lines, {
        yPercent: 115, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: h, start: 'top 82%' },
      });
    });
  }

  /* =================================================================
     HERO  —  fullscreen video -> square  (the signature move)
     ================================================================= */
  function initHeroScene() {
    const media = $('#heroMedia');
    const slot  = $('#heroSlot');
    const studio = $('#studio');
    const ph = $('#heroPh');
    const phLabels = [$('.hero-media__tag'), $('.hero-media__frameline'), $('.hero-media__coord')].filter(Boolean);
    const copy = $('.hero__copy');
    const hero = $('#hero');

    if (reduceMotion) {
      hero.style.height = '100vh';
      gsap.set(media, { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 });
      return;
    }

    // lift media + copy to <body> as fixed overlays — escapes every
    // stacking-context / transform trap and needs no pin at all.
    document.body.appendChild(media);
    document.body.appendChild(copy);
    gsap.set(media, { position: 'fixed', top: 0, left: 0, zIndex: 4 });
    gsap.set(copy,  { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 6 });

    let start = { top: 0, left: 0, width: innerWidth, height: innerHeight };
    let end   = { top: 0, left: 0, width: 0, height: 0 };
    let landed = false;
    let progress = 0;

    function measure() {
      start = { top: 0, left: 0, width: innerWidth, height: innerHeight };
      const r = slot.getBoundingClientRect();
      const sTop = studio.getBoundingClientRect().top + window.scrollY;
      end = { top: (r.top + window.scrollY) - sTop, left: r.left, width: r.width, height: r.height };
    }

    function apply(p) {
      progress = p;

      // 1. hero copy — words split apart, whole layer fades out
      const tp = clamp(p / 0.4, 0, 1);
      $$('.hero__title .w').forEach(w => {
        const d = w.dataset.split;
        gsap.set(w, { xPercent: d === 'L' ? -tp * 72 : d === 'R' ? tp * 72 : 0,
                      yPercent: d === 'C' ? tp * 55 : 0 });
      });
      gsap.set(copy, { autoAlpha: 1 - clamp((p - 0.02) / 0.34, 0, 1) });
      const shadeProgress =
  clamp((p - 0.05) / 0.32, 0, 1);

const shadeOpacity =
  lerp(0.82, 0.26, shadeProgress);

gsap.set(media, {
  '--hero-shade': shadeOpacity
});

      // 2. media — brief zoom-in, then fullscreen -> square
      const zoom = 1 + 0.07 * clamp(p / 0.24, 0, 1);
      gsap.set(ph, { scale: zoom });
      const vid = media.querySelector('video');
      if (vid) gsap.set(vid, { scale: zoom });
      gsap.set(phLabels, { autoAlpha: 1 - clamp((p - 0.12) / 0.16, 0, 1) });

      const sp = easeIO(clamp((p - 0.2) / 0.62, 0, 1));
      const cur = {
        width:  lerp(start.width,  end.width,  sp),
        height: lerp(start.height, end.height, sp),
        left:   lerp(start.left,   end.left,   sp),
        top:    lerp(start.top,    end.top,    sp),
      };

      if (p >= 0.999 && !landed) {
        landed = true;
        slot.appendChild(media);
        gsap.set(media, { position: 'absolute', top: 0, left: 0, x: 0, y: 0, width: '100%', height: '100%', zIndex: 1 });
      } else if (p < 0.999 && landed) {
        landed = false;
        document.body.appendChild(media);
      }
      if (!landed) {
        gsap.set(media, { position: 'fixed', top: 0, left: 0, zIndex: 4,
          width: cur.width, height: cur.height, x: cur.left, y: cur.top });
      }
    }

    ST.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
      onRefresh: () => { measure(); if (!landed) apply(progress); },
      onUpdate: self => apply(self.progress),
    });
    measure();
    apply(0);
  }

  /* =================================================================
     02  CAPABILITIES — interactive list + scenes
     ================================================================= */
  function initCapabilities() {
    const rows = $$('.cap__row');
    const scenes = $$('.cap__stage .scene');
    const activate = row => {
      rows.forEach(r => { r.classList.toggle('is-active', r === row); r.setAttribute('aria-expanded', String(r === row)); });
      scenes.forEach(s => s.classList.toggle('is-active', s.dataset.scene === row.dataset.cap));
      ST.refresh();
    };
    rows.forEach(row => {
      if (!isTouch) row.addEventListener('mouseenter', () => activate(row));
      row.addEventListener('click', () => activate(row));
      row.addEventListener('focus', () => activate(row));
      if (isTouch) {
        ST.create({ trigger: row, start: 'top 62%', end: 'bottom 45%',
          onToggle: s => { if (s.isActive) activate(row); } });
      }
    });
  }

  /* =================================================================
     03  SOCIAL SYSTEMS — one identity -> every format
     ================================================================= */
  function initSocial() {
    const pin = $('[data-social-pin]');
    const stack = $('[data-brand-stack]');
    const layers = $$('.bs', stack);
    const fmtEl = $('[data-social-format]');
    const capEl = $('[data-social-caption]');

    const FORMATS = [
      'FORMAT 01 / 06 — IDENTITET',
      'FORMAT 02 / 06 — OBJAVA',
      'FORMAT 03 / 06 — CAROUSEL',
      'FORMAT 04 / 06 — STORY',
      'FORMAT 05 / 06 — REEL',
      'FORMAT 06 / 06 — GRID SADRŽAJA',
    ];
    const CAPTIONS = [
      'Paleta, znak i tipografija — konstante iz kojih teče svaka objava.',
      'Identitet se skuplja u jedan kvadrat. Isti sistem, jedan kadar.',
      'Kadar se širi u stranu: tri slajda koja i dalje čitaš kao jednu priču.',
      'Vertikalno, preko celog ekrana, devet sekundi. Za vrh feeda.',
      'Pokret preuzima. Statična slika postaje petlja sa svojim timeline-om.',
      'Svi formati se slivaju nazad u jedan grid — dosledan, prepoznatljiv, živ.',
    ];
    // width / height factors relative to base square
    const SHAPE = [
      [1, 1], [1, 1], [1.18, 0.82], [0.62, 1.16], [0.62, 1.16], [1, 1],
    ];

    let base = stack.offsetWidth || 340;
    let idx = -1;
    const setIndex = i => {
      if (i === idx) return;
      idx = i;
      layers.forEach(l => l.classList.toggle('is-active', +l.dataset.bs === i));
      gsap.to(stack, { width: base * SHAPE[i][0], height: base * SHAPE[i][1],
        duration: 0.35, ease: 'power3.inOut', overwrite: true });
      gsap.fromTo([fmtEl, capEl], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      fmtEl.textContent = FORMATS[i];
      capEl.textContent = CAPTIONS[i];
    };

    if (reduceMotion) { base = stack.offsetWidth; setIndex(5); return; }

    ST.create({
      trigger: pin, start: 'top top', end: '+=260%',
      pin: true, scrub: true, invalidateOnRefresh: true,
      onRefreshInit: () => { base = stack.offsetWidth || base; },
      onUpdate: self => setIndex(clamp(Math.floor(self.progress * 6), 0, 5)),
    });
    setIndex(0);
  }

  /* =================================================================
     04  INSIDE THE BUILD — spatial zoom-in
     ================================================================= */
  function initBuild() {
    const pin = $('[data-build-pin]');
    const browser = $('[data-browser]');
    const scene = $('[data-build-scene]');
    const copyEl = $('[data-build-copy]');
    const layers = $$('.blayer');
    const jslines = $$('.blayer--js .jsline');

    // windows for each layer along progress 0..1
    const WIN = [[0, 0.20], [0.16, 0.38], [0.34, 0.56], [0.52, 0.76], [0.72, 1.01]];
    const band = (p, [a, b]) => {
      const m = (a + b) / 2, half = (b - a) / 2;
      return clamp(1 - Math.abs(p - m) / half, 0, 1);
    };

    if (reduceMotion) {
      layers.forEach((l, i) => gsap.set(l, { opacity: i === 4 ? 1 : 0 }));
      gsap.set(browser, { scale: 1 });
      return;
    }

    ST.create({
      trigger: pin, start: 'top top', end: '+=230%',
      pin: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: self => {
        const p = self.progress;
        gsap.set(browser, {
  scale: lerp(0.34, 8, easeIn3(p)),
  force3D: true
});
        gsap.set(copyEl, { opacity: 1 - clamp(p / 0.16, 0, 1), y: -p * 40 });
        layers.forEach((l, i) => {
          const o = band(p, WIN[i]);
          gsap.set(l, { opacity: o });
        });
        const jp = band(p, WIN[3]);
        jslines.forEach((j, i) => gsap.set(j, { scaleX: clamp(jp * 1.3 - i * 0.12, 0, 1) }));
        gsap.set(scene, { opacity: p > 0.94 ? 1 - (p - 0.94) / 0.06 : 1 });
      },
    });
  }

  /* =================================================================
     05  SELECTED WORK — masked reveal + parallax
     ================================================================= */
  function initWork() {
    $$('.project').forEach(pr => {
      const media = $('.project__media', pr);
      const fill = $('.project__fill', pr);
      if (reduceMotion) { gsap.set(media, { clipPath: 'inset(0 0 0% 0)' }); gsap.set(fill, { scale: 1 }); return; }
      gsap.to(media, {
        clipPath: 'inset(0 0 0% 0)', ease: 'none',
        scrollTrigger: { trigger: media, start: 'top 88%', end: 'top 45%', scrub: true },
      });
      gsap.fromTo(fill, { scale: 1.14, yPercent: -6 }, {
        scale: 1, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* =================================================================
     06  PROCESS — signal draw + step activation
     ================================================================= */
  function initProcess() {
    const path = $('[data-wave]');
    if (path) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      if (reduceMotion) path.style.strokeDashoffset = 0;
      else gsap.to(path, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.process__wrap', start: 'top 78%', end: 'bottom 65%', scrub: true },
      });
    }
    $$('[data-pstep]').forEach((s, i) => {
      ST.create({ trigger: s, start: 'top 82%', once: true,
        onEnter: () => setTimeout(() => s.classList.add('is-on'), i * 60) });
    });
  }

  /* =================================================================
     CONTACT — no fake success
     ================================================================= */
  function initContact() {
    const form = $('#contactForm');
    const notice = $('[data-form-notice]');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      notice.className = 'form__notice';
      if (!form.checkValidity()) {
        notice.textContent = 'Dodaj ime, ispravan email, uslugu i poruku, pa probaj ponovo.';
        notice.classList.add('is-err');
        form.reportValidity();
        return;
      }
      notice.textContent = 'Forma još nije povezana sa serverom — ništa nije poslato. Za sada nas potraži preko društvenih mreža.';
      notice.classList.add('is-ok');
    });
  }

  /* =================================================================
     FOOTER + misc
     ================================================================= */
  function initStatics() {
    const y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
    const bt = $('[data-back-top]');
    if (bt) bt.addEventListener('click', () => scrollToTargetSafe());
    function scrollToTargetSafe() {
      if (window.lenisRef) window.lenisRef.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    $$('[data-placeholder]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  }

  /* =================================================================
     HERO PLACEHOLDER TELEMETRY (cheap, paused off-screen)
     ================================================================= */
  function initTelemetry() {
    const runtime = $('[data-runtime]');
    const coord = $('[data-coord]');
    if (!runtime || reduceMotion) return;
    let inView = true, f = 0, frames = 0;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.01 }).observe($('#hero'));
    function tick() {
      requestAnimationFrame(tick);
      if (!inView || document.hidden) return;
      if ((frames++ % 4) !== 0) return;
      f += 4;
      const total = Math.floor(f / 60);
      const ff = String(f % 60).padStart(2, '0');
      runtime.textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:${ff}`;
      if (coord) {
        const a = (44 + 6 * Math.sin(f / 90)).toFixed(2);
        const b = (44 + 6 * Math.cos(f / 70)).toFixed(2);
        coord.textContent = `[ ${a} / ${b} ]`;
      }
    }
    tick();
  }

  /* =================================================================
     HERO VIDEO WIRING (only when CONFIG.HERO_VIDEO_SRC is set)
     ================================================================= */
  function initHeroVideo() {
    if (!CONFIG.HERO_VIDEO_SRC) return;
    const media = $('#heroMedia'), ph = $('#heroPh');
    const v = document.createElement('video');
    v.muted = true;
v.loop = false;
v.autoplay = true;
v.playsInline = true;

v.setAttribute('muted', '');
v.setAttribute('playsinline', '');
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); 
    v.preload = 'metadata';
    if (CONFIG.HERO_VIDEO_POSTER) v.poster = CONFIG.HERO_VIDEO_POSTER;
    v.style.cssText = `
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform-origin: center;
  z-index: 0;
`;
    const s = document.createElement('source');
    s.src = CONFIG.HERO_VIDEO_SRC; s.type = 'video/mp4';
    v.appendChild(s);
    media.appendChild(v);
    let hasFinished = false;

v.addEventListener('ended', () => {
  hasFinished = true;
  v.pause();

  if (Number.isFinite(v.duration)) {
    v.currentTime = Math.max(0, v.duration - 0.04);
  }
});
    v.addEventListener('loadeddata', () => { gsap.to(ph, { opacity: 0, duration: 0.6 }); v.play().catch(() => {}); });
    new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !hasFinished) {
    v.play().catch(() => {});
  } else {
    v.pause();
  }
}, { threshold: 0.05 }).observe(media);
  }

  /* =================================================================
     BOOT
     ================================================================= */
  function boot() {
    window.lenisRef = lenis;
    initNav();
    initTheme();
    initProgress();
    initCursor();
    initMagnetic();
    initHeroVideo();
    initHeroScene();
    initReveals();
    initCapabilities();
    initSocial();
    initBuild();
    initWork();
    initProcess();
    initContact();
    initStatics();
    initTelemetry();

    ST.refresh();

    // hard reset to top (defeats browser scroll-restoration races)
    const toTop = () => {
      if (location.hash) return;
      if (lenis) lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      ST.update();
    };
    toTop();
    window.addEventListener('load', () => { toTop(); requestAnimationFrame(toTop); });

    runIntro();

    // resize: debounced refresh
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ST.refresh(), 200); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
