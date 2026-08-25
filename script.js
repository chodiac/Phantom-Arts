/* ============================================================
   PHANTOM ARTS — MAIN SCRIPT
   Handles: loader, custom cursor, nav state, hero/intro text
   reveals, services preview, work animations, marquee velocity,
   philosophy + process scroll sync, magnetic button, contact form.
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_TOUCH = window.matchMedia('(hover:none), (pointer:coarse)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ============ SPLIT TEXT HELPER (no external plugin) ============ */
  function splitToSpans(el) {
    const text = el.textContent;
    el.textContent = '';
    text.split('').forEach((ch) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    });
    return el.querySelectorAll('span');
  }

  document.querySelectorAll('.reveal-line').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    const span = document.createElement('span');
    span.textContent = text;
    line.appendChild(span);
  });

  /* ================================================================
     LOADER
  ================================================================ */
  const loader = document.getElementById('loader');
  const loaderCount = document.getElementById('loaderCount');
  const loaderFill = document.getElementById('loaderFill');

  function runLoader() {
    return new Promise((resolve) => {
      if (REDUCED_MOTION) {
        loader.style.display = 'none';
        resolve();
        return;
      }
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 100,
        duration: 1.3,
        ease: 'power2.inOut',
        onUpdate: () => {
          loaderCount.textContent = String(Math.floor(counter.val)).padStart(2, '0');
          loaderFill.style.width = counter.val + '%';
        },
        onComplete: () => {
          const tl = gsap.timeline({ onComplete: resolve });
          tl.to('.loader__word[data-word="phantom"]', { x: -14, duration: 0.5, ease: 'power3.inOut' }, 0)
            .to('.loader__word[data-word="arts"]', { x: 14, duration: 0.5, ease: 'power3.inOut' }, 0)
            .to(loader, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
            .set(loader, { display: 'none' });
        },
      });
    });
  }

  /* ================================================================
     CUSTOM CURSOR
  ================================================================ */
  const cursor = document.getElementById('cursor');
  const cursorText = document.getElementById('cursorText');

  if (!IS_TOUCH) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });

    gsap.ticker.add(() => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    });

    const expandTargets = document.querySelectorAll('a, button, .service-row, .work-item, input, textarea');
    expandTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor--expand');
        let label = '';
        if (el.closest('.work-item')) label = 'VIEW';
        else if (el.closest('.service-row')) label = 'EXPLORE';
        else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') label = '';
        cursorText.textContent = label;
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor--expand');
        cursorText.textContent = '';
      });
    });
  } else {
    cursor.style.display = 'none';
  }

  /* ================================================================
     NAVIGATION
  ================================================================ */
  const nav = document.getElementById('siteNav');
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => {
      nav.classList.toggle('scrolled', self.scroll() > 60);
    },
  });

  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ================================================================
     EASTER EGG — logo click scatter
  ================================================================ */
  const navLogo = document.getElementById('navLogo');
  let clickCount = 0, clickTimer = null;
  navLogo.addEventListener('click', (e) => {
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 1200);
    if (clickCount >= 5) {
      e.preventDefault();
      clickCount = 0;
      if (window.__phantomScatter) window.__phantomScatter();
    }
  });

  /* ================================================================
     MAIN ANIMATION SETUP (runs after loader resolves)
  ================================================================ */
  function initAnimations() {

    /* ---------- Hero title line reveal ---------- */
    gsap.timeline({ delay: 0.1 })
      .fromTo('.hero__title .line > *', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.08, ease: 'power4.out' })
      .fromTo('.hero__eyebrow', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.7')
      .fromTo(['.hero__sub', '.hero__ctas'], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, '-=0.5');

    /* ---------- Generic reveal-line sections (intro, contact) ---------- */
    document.querySelectorAll('.reveal-line > span').forEach((span) => {
      gsap.fromTo(span, { yPercent: 100 }, {
        yPercent: 0, duration: 0.9, ease: 'power4.out',
        scrollTrigger: { trigger: span, start: 'top 88%' },
      });
    });

    /* ---------- Intro number + body fade ---------- */
    gsap.utils.toArray('#intro .intro__num, #intro .intro__body').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.8,
        scrollTrigger: { trigger: el, start: 'top 90%' },
      });
    });

    /* ---------- Section head fade-ins ---------- */
    gsap.utils.toArray('.section-head').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    /* ---------- Services preview swap ---------- */
    const serviceRows = document.querySelectorAll('.service-row');
    const previewPanels = document.querySelectorAll('.preview');
    const serviceDetails = document.querySelectorAll('.service-detail');

    function activatePreview(key) {
      previewPanels.forEach((p) => p.classList.toggle('active', p.dataset.previewPanel === key));
      serviceDetails.forEach((d) => d.classList.toggle('active', d.dataset.detail === key));
    }
    serviceRows.forEach((row, i) => {
      row.addEventListener('mouseenter', () => activatePreview(row.dataset.preview));
      row.addEventListener('click', () => activatePreview(row.dataset.preview));
      gsap.fromTo(row, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 92%' },
      });
    });
    if (serviceRows[0]) activatePreview(serviceRows[0].dataset.preview);

    /* ---------- Work items reveal ---------- */
    gsap.utils.toArray('.work-item').forEach((item) => {
      gsap.fromTo(item, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 85%' },
      });
    });

    /* ---------- Story split: pin progress -> three-scene + words ---------- */
    const storyWords = gsap.utils.toArray('.storysplit__word');
    ScrollTrigger.create({
      trigger: '#storysplit',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (window.__phantomStoryProgress) window.__phantomStoryProgress(self.progress);
        storyWords.forEach((w, i) => {
          const start = i * 0.28;
          const local = gsap.utils.clamp(0, 1, (self.progress - start) / 0.35);
          w.style.opacity = local;
          w.style.transform = `translateY(${(1 - local) * 30}px)`;
        });
      },
    });

    /* ---------- Marquee scroll velocity ---------- */
    const marqueeTrack = document.getElementById('marqueeTrack');
    let marqueeX = 0;
    let baseSpeed = 0.6;
    let velocityBoost = 0;
    let lastScroll = window.scrollY;

    window.addEventListener('scroll', () => {
      const delta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      velocityBoost = gsap.utils.clamp(-3, 3, delta * 0.15);
    }, { passive: true });

    gsap.ticker.add(() => {
      if (REDUCED_MOTION) return;
      marqueeX -= (baseSpeed + velocityBoost);
      velocityBoost *= 0.9;
      const trackWidth = marqueeTrack.scrollWidth / 2;
      if (Math.abs(marqueeX) >= trackWidth) marqueeX = 0;
      marqueeTrack.style.transform = `translateX(${marqueeX}px)`;
    });

    /* ---------- Philosophy active word ---------- */
    const philWords = gsap.utils.toArray('.phil-word');
    philWords.forEach((word) => {
      ScrollTrigger.create({
        trigger: word,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => word.classList.add('active'),
        onEnterBack: () => word.classList.add('active'),
        onLeave: () => word.classList.remove('active'),
        onLeaveBack: () => word.classList.remove('active'),
      });
    });

    /* ---------- Process timeline fill + active steps ---------- */
    const processSteps = gsap.utils.toArray('.process-step');
    const processFill = document.getElementById('processFill');
    ScrollTrigger.create({
      trigger: '#processTimeline',
      start: 'top 60%',
      end: 'bottom 70%',
      scrub: 0.5,
      onUpdate: (self) => { processFill.style.height = (self.progress * 100) + '%'; },
    });
    processSteps.forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 65%',
        end: 'bottom 65%',
        onEnter: () => step.classList.add('active'),
        onEnterBack: () => step.classList.add('active'),
      });
    });

    /* ---------- About reveal ---------- */
    gsap.fromTo('.about__statement, .about__body, .about__disciplines', { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about__grid', start: 'top 82%' },
    });

    /* ---------- Magnetic button ---------- */
    const magneticBtn = document.getElementById('magneticBtn');
    if (magneticBtn && !IS_TOUCH) {
      magneticBtn.addEventListener('mousemove', (e) => {
        const rect = magneticBtn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(magneticBtn, { x: relX * 0.35, y: relY * 0.35, duration: 0.5, ease: 'power3.out' });
      });
      magneticBtn.addEventListener('mouseleave', () => {
        gsap.to(magneticBtn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      });
      magneticBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('contactForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    /* ---------- Footer wordmark reveal ---------- */
    gsap.fromTo('.footer__logo span', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.03, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    });

    ScrollTrigger.refresh();
  }

  /* ================================================================
     CONTACT FORM
  ================================================================ */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  document.querySelectorAll('.chip-group').forEach((group) => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chip.classList.toggle('selected');
    });
  });

  // PLACEHOLDER: replace this handler with a real backend call
  // (e.g. Supabase insert, serverless function, or email API).
  // This intentionally does NOT fake a successful submission.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#f-ime').value.trim();
    const email = form.querySelector('#f-email').value.trim();

    if (!name || !email) {
      status.textContent = 'Molimo unesite ime i email.';
      status.className = 'contact-form__status error';
      return;
    }

    status.textContent = 'Slanje forme još nije povezano na backend — dodajte Supabase ili drugi servis u script.js.';
    status.className = 'contact-form__status error';

    /* Example of what a real submission call would look like:
       const payload = {
         ime: name, email,
         kompanija: form.querySelector('#f-kompanija').value,
         telefon: form.querySelector('#f-telefon').value,
         usluga: [...form.querySelectorAll('[data-group="usluga"] .selected')].map(c => c.dataset.value),
         budzet: [...form.querySelectorAll('[data-group="budzet"] .selected')].map(c => c.dataset.value),
         poruka: form.querySelector('#f-poruka').value,
       };
       fetch('YOUR_ENDPOINT', { method:'POST', body: JSON.stringify(payload) })
         .then(() => { status.textContent = 'Hvala! Javićemo se uskoro.'; status.className = 'contact-form__status ok'; })
         .catch(() => { status.textContent = 'Došlo je do greške. Pokušajte ponovo.'; status.className='contact-form__status error'; });
    */
  });

  /* ================================================================
     FOOTER YEAR
  ================================================================ */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ================================================================
     BOOT SEQUENCE
  ================================================================ */
  runLoader().then(() => {
    initAnimations();
  });

  // Safety: if something goes wrong with the loader, never trap the user
  setTimeout(() => {
    if (loader && loader.style.display !== 'none') {
      loader.style.display = 'none';
    }
  }, 4000);
});