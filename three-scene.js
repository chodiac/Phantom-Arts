/* ============================================================
   PHANTOM ARTS — THREE.JS SCENES
   Two lightweight scenes:
   1. Hero sculpture   -> #heroCanvas   (idle rotation + mouse/scroll reactive)
   2. Story transition -> #storyCanvas  (scroll-driven break-apart)
   Both share a "fragment cluster" builder so the sculpture reads as
   one deconstructed symbol rather than a generic floating shape.
   Performance: capped pixel ratio, paused via IntersectionObserver
   when off-screen, simplified fragment count on touch/small screens.
============================================================ */

(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_SMALL = window.innerWidth < 760;
  const IS_TOUCH = window.matchMedia('(hover:none), (pointer:coarse)').matches;

  if (typeof THREE === 'undefined') return;

  const GOLD = 0xc7a15b;
  const DARK_METAL = 0x1c1a17;
  const MATTE_BLACK = 0x0e0d0c;

  /* ---------- shared fragment-cluster builder ---------- */
  function buildFragments(group, count) {
    const geoms = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
    ];
    const fragments = [];

    for (let i = 0; i < count; i++) {
      const geo = geoms[i % geoms.length];
      const isGold = i === 0; // exactly one fragment carries the accent
      const mat = new THREE.MeshStandardMaterial({
        color: isGold ? GOLD : (i % 2 === 0 ? DARK_METAL : MATTE_BLACK),
        metalness: isGold ? 0.7 : 0.55,
        roughness: isGold ? 0.28 : 0.55,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const scale = 0.55 + Math.random() * 0.75;
      mesh.scale.setScalar(scale);

      const radius = 1.1 + Math.random() * 1.2;
      const theta = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const phi = (Math.random() - 0.5) * 1.6;
      mesh.position.set(
        Math.cos(theta) * radius,
        Math.sin(phi) * radius * 0.9,
        Math.sin(theta) * radius * 0.6
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      mesh.userData.basePos = mesh.position.clone();
      mesh.userData.spinSpeed = 0.06 + Math.random() * 0.12;
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;

      group.add(mesh);
      fragments.push(mesh);
    }
    return fragments;
  }

  function makeLights(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 5);
    const gold = new THREE.PointLight(GOLD, 1.1, 12);
    gold.position.set(-2.5, -1, 2.5);
    const rim = new THREE.DirectionalLight(0x8891a3, 0.4);
    rim.position.set(-4, 2, -3);
    scene.add(ambient, key, gold, rim);
  }

  function pauseOnHidden(canvas, tick) {
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0].isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    return () => visible;
  }

  /* ================= HERO SCULPTURE ================= */
  function initHero() {
    const canvas = document.getElementById('heroCanvas');
    const wrap = document.getElementById('heroCanvasWrap');
    if (!canvas || !wrap) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_SMALL ? 1.5 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    makeLights(scene);

    const group = new THREE.Group();
    scene.add(group);
    const count = IS_SMALL ? 6 : 9;
    const fragments = buildFragments(group, count);

    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const isVisible = pauseOnHidden(canvas, null);

    // mouse influence
    const mouse = { x: 0, y: 0 };
    let targetRotX = 0, targetRotY = 0;
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotY = mouse.x * 0.35;
      targetRotX = mouse.y * -0.25;
    });

    // scroll influence (subtle orientation change)
    let scrollRot = 0;
    window.addEventListener('scroll', () => {
      scrollRot = Math.min(window.scrollY / window.innerHeight, 1) * 0.6;
    }, { passive: true });

    // easter egg: scatter on repeated logo clicks
    let scatter = 0;
    window.__phantomScatter = function () {
      scatter = 1;
      setTimeout(() => { scatter = 0; }, 1400);
    };

    const clock = new THREE.Clock();

    function tick() {
      requestAnimationFrame(tick);
      if (!isVisible()) return;
      const t = clock.getElapsedTime();

      group.rotation.y += ((targetRotY + scrollRot) - group.rotation.y) * 0.04;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
      if (!REDUCED_MOTION) group.rotation.y += 0.0016;

      fragments.forEach((f, i) => {
        const base = f.userData.basePos;
        const off = f.userData.floatOffset;
        const scatterMult = scatter ? 2.6 : 1;
        f.position.x = base.x * scatterMult + Math.sin(t * 0.4 + off) * 0.06;
        f.position.y = base.y * scatterMult + Math.cos(t * 0.5 + off) * 0.08;
        f.position.z = base.z * scatterMult;
        if (!REDUCED_MOTION) {
          f.rotation.x += f.userData.spinSpeed * 0.01;
          f.rotation.y += f.userData.spinSpeed * 0.008;
        }
      });

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ================= STORY TRANSITION ================= */
  function initStory() {
    const canvas = document.getElementById('storyCanvas');
    const pin = canvas ? canvas.closest('.storysplit__pin') : null;
    if (!canvas || !pin) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_SMALL ? 1.5 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    makeLights(scene);

    const group = new THREE.Group();
    scene.add(group);
    const count = IS_SMALL ? 5 : 8;
    const fragments = buildFragments(group, count);

    function resize() {
      const w = pin.clientWidth, h = pin.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const isVisible = pauseOnHidden(canvas, null);

    // progress driven externally by ScrollTrigger (0 -> 1)
    let progress = 0;
    window.__phantomStoryProgress = (p) => { progress = p; };

    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      if (!isVisible()) return;
      const t = clock.getElapsedTime();

      group.rotation.y = progress * Math.PI * 0.9;
      group.rotation.x = progress * -0.3;
      group.scale.setScalar(1 + progress * 0.35);

      fragments.forEach((f) => {
        const base = f.userData.basePos;
        const spread = 1 + progress * 2.2;
        f.position.x = base.x * spread;
        f.position.y = base.y * spread + Math.sin(t * 0.3 + f.userData.floatOffset) * 0.05;
        f.position.z = base.z * spread;
      });

      renderer.render(scene, camera);
    }
    tick();
  }

  function boot() {
    try { initHero(); } catch (e) { console.warn('Hero scene failed, falling back to CSS-only hero.', e); }
    try { initStory(); } catch (e) { console.warn('Story scene failed.', e); }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();