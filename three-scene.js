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

const CYAN = 0x00F0FF;
const BLUE = 0x7D5CFF;
const PINK = 0xFF00E6;
const PURPLE = 0x9D00FF;

const DARK = 0x0A0A0A;

const DARK_METAL = 0x15151c;
const MATTE_BLACK = 0x0a0a0a;

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
      const isAccent = i < 3;// exactly one fragment carries the accent
     const accentColors = [CYAN, PURPLE, PINK];

const mat = new THREE.MeshStandardMaterial({
  color: isAccent
    ? accentColors[i]
    : (i % 2 === 0 ? DARK_METAL : MATTE_BLACK),

  metalness: isAccent ? 0.55 : 0.45,
  roughness: isAccent ? 0.24 : 0.5,

  emissive: isAccent
    ? accentColors[i]
    : 0x000000,

  emissiveIntensity: isAccent ? 0.18 : 0,

  flatShading:true,
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
  const ambient = new THREE.AmbientLight(0xffffff, 0.28);

  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(3, 4, 5);

  const cyanLight = new THREE.PointLight(CYAN, 1.2, 12);
  cyanLight.position.set(-2.5, -1, 2.5);

  const purpleLight = new THREE.PointLight(PURPLE, 0.75, 10);
  purpleLight.position.set(3, 1.5, -1);

  const pinkLight = new THREE.PointLight(PINK, 0.35, 8);
  pinkLight.position.set(0, -3, 2);

  const rim = new THREE.DirectionalLight(0x8891a3, 0.35);
  rim.position.set(-4, 2, -3);

  scene.add(
    ambient,
    key,
    cyanLight,
    purpleLight,
    pinkLight,
    rim
  );
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

function loadJellyfish(scene, onReady) {

  const loader = new THREE.OBJLoader();

  loader.load(

    'models/Jellyfish1.obj',

    function (object) {

      /* =========================
         MAIN MODEL GROUP
      ========================= */

      const jellyfish = new THREE.Group();

      jellyfish.add(object);


      /* =========================
         MATERIAL
      ========================= */

      object.traverse((child) => {

        if (!child.isMesh) return;
/* Sačuvaj originalnu geometriju za animaciju */

const position =
  child.geometry.attributes.position;

child.userData.originalPositions =
  new Float32Array(position.array);

child.userData.geometryMinY = Infinity;
child.userData.geometryMaxY = -Infinity;

for (let i = 0; i < position.count; i++) {

  const y = position.getY(i);

  if (y < child.userData.geometryMinY) {
    child.userData.geometryMinY = y;
  }

  if (y > child.userData.geometryMaxY) {
    child.userData.geometryMaxY = y;
  }

}
        child.material = new THREE.MeshPhysicalMaterial({

          color: 0x0b5f6b,

          transparent: true,

          opacity: 0.28,

          transmission: 0.42,

          roughness: 0.22,

          metalness: 0.02,

          clearcoat: 0.35,

          clearcoatRoughness: 0.25,

          ior: 1.22,

      

          emissive: 0x00262d,

          emissiveIntensity: 0.08,

          side: THREE.DoubleSide,

          depthWrite: false

        });

      });


    jellyfish.scale.setScalar(
  IS_SMALL ? 1.3 : 2.0
);

jellyfish.position.set(
  IS_SMALL ? -0.9 : 1.65,
  IS_SMALL ? 0.15 : 0.05,
  0
);

jellyfish.rotation.set(
  -0.08,
  -0.55,
  0.16
);


      /* =========================
         INTERNAL LIGHTS
      ========================= */

      const cyanGlow =
        new THREE.PointLight(
          CYAN,
          0.55,
          4
        );

      cyanGlow.position.set(
        0,
        0.45,
        0.6
      );


      const purpleGlow =
        new THREE.PointLight(
          PURPLE,
          0.35,
          3.5
        );

      purpleGlow.position.set(
        0,
        -0.15,
        0.4
      );


      const pinkGlow =
        new THREE.PointLight(
          PINK,
          0.18,
          2.5
        );

      pinkGlow.position.set(
        0,
        -0.45,
        0.2
      );


      jellyfish.add(
        cyanGlow,
        purpleGlow,
        pinkGlow
      );


      /* =========================
         ADD TO SCENE
      ========================= */

      scene.add(jellyfish);


      /* =========================
         RETURN MODEL
      ========================= */

      onReady({
        group: jellyfish,
        model: object,
        cyanGlow,
        purpleGlow,
        pinkGlow
      });

    },


    /* loading progress */

    function (xhr) {

      if (xhr.total) {

        const percent =
          (
            xhr.loaded /
            xhr.total
          ) * 100;

        console.log(
          'Jellyfish loaded:',
          Math.round(percent) + '%'
        );

      }

    },


    /* error */

    function (error) {

      console.error(
        'Jellyfish model failed to load:',
        error
      );

    }

  );
}

function animateJellyfishBody(jelly, time, swimProgress) {

  if (!jelly || !jelly.model) return;

  const speed =
    1.6 + swimProgress * 2.4;

  const phase =
    time * speed;

  jelly.model.traverse((child) => {

    if (
      !child.isMesh ||
      !child.userData.originalPositions
    ) return;

    const position =
      child.geometry.attributes.position;

    const original =
      child.userData.originalPositions;

    const minY =
      child.userData.geometryMinY;

    const maxY =
      child.userData.geometryMaxY;

    const height =
      Math.max(
        maxY - minY,
        0.001
      );

    for (
      let i = 0;
      i < position.count;
      i++
    ) {

      const index =
        i * 3;

      const ox =
        original[index];

      const oy =
        original[index + 1];

      const oz =
        original[index + 2];

      const ny =
        (oy - minY) / height;

      /*
        ny = 1  -> gornji deo
        ny = 0  -> donji deo
      */


      /* =========================
         BELL / UPPER BODY
      ========================= */

      const bell =
        THREE.MathUtils.smoothstep(
          ny,
          0.58,
          1.0
        );

      const bellPulse =
        Math.sin(
          phase * 1.05
        );

      let x =
        ox *
        (
          1 +
          bellPulse *
          0.035 *
          bell
        );

      let z =
        oz *
        (
          1 +
          bellPulse *
          0.035 *
          bell
        );

      let y =
        oy -
        Math.abs(bellPulse) *
        0.018 *
        bell;


      /* =========================
         LOWER BODY / TENTACLES
      ========================= */

      const tentacle =
        1 -
        THREE.MathUtils.smoothstep(
          ny,
          0.28,
          0.72
        );

      /*
        što je niže na modelu,
        to više kasni i talasa
      */

      const lag =
        (1 - ny);

      const waveX =
        Math.sin(
          phase * 0.72 +
          ny * 7.5 +
          ox * 2.8
        );

      const waveZ =
        Math.cos(
          phase * 0.62 +
          ny * 6.2 +
          oz * 3.0
        );

      x +=
        waveX *
        0.11 *
        tentacle *
        lag;

      z +=
        waveZ *
        0.08 *
        tentacle *
        lag;


      /* =========================
         TRAILING / DRAG
      ========================= */

      const dragWave =
        Math.sin(
          phase * 0.48 +
          ny * 5.0
        );

      x +=
        dragWave *
        0.055 *
        tentacle *
        lag;


      /*
        vertikalno istezanje pipaka
      */

      y +=
        Math.sin(
          phase * 0.85 +
          ny * 4.5
        )
        *
        0.035
        *
        tentacle;


      /* =========================
         EXTRA TIP MOTION
      ========================= */

      const tip =
        THREE.MathUtils.clamp(
          (0.35 - ny) / 0.35,
          0,
          1
        );

      x +=
        Math.sin(
          phase * 1.15 +
          oy * 3.0
        )
        *
        0.10
        *
        tip;

      z +=
        Math.cos(
          phase * 0.95 +
          oy * 2.5
        )
        *
        0.075
        *
        tip;


      position.setXYZ(
        i,
        x,
        y,
        z
      );

    }

    position.needsUpdate = true;

    child.geometry.computeVertexNormals();

  });

}

  function initHero() {
    const canvas = document.getElementById('heroCanvas');
    const wrap = document.getElementById('heroCanvasWrap');
    if (!canvas || !wrap) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_SMALL ? 1.5 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    makeLights(scene);

    let jelly = null;
let group = null;

loadJellyfish(
  scene,
  (loadedJelly) => {

    jelly = loadedJelly;

    group = jelly.group;

  }
);


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
     targetRotY =
  mouse.x * 0.18;

targetRotX =
  mouse.y * -0.12;
    });

    // scroll influence (subtle orientation change)
    let heroProgress = 0;
let introProgress = 0;

window.addEventListener('scroll', () => {

  const scrollY = window.scrollY;
  const vh = window.innerHeight;

  heroProgress =
    THREE.MathUtils.clamp(
      scrollY / vh,
      0,
      1
    );

  introProgress =
    THREE.MathUtils.clamp(
      (scrollY - vh) / vh,
      0,
      1
    );

}, { passive: true });

    // easter egg: scatter on repeated logo clicks
    

    const clock = new THREE.Clock();

 function tick() {

  requestAnimationFrame(
    tick
  );

  const t =
    clock.getElapsedTime();


 /* =========================
   JELLYFISH
========================= */

if (group) {

  /* =========================
     SWIMMING PATH
  ========================= */

  const p =
  heroProgress;

const swim =
  Math.pow(p, 1.15);

    animateJellyfishBody(
  jelly,
  t,
  swim
);

  /* =========================
     BASE POSITION
  ========================= */

 const baseX =
  IS_SMALL ? -0.9 : 1.65;

const baseY =
  IS_SMALL ? 0.15 : 0.05;


/* =========================
   VERTICAL SWIM PATH
========================= */
/* =========================
   TEST: PURE VERTICAL MOVE
========================= */

group.position.x = baseX;

const heroSwim =
  heroProgress * heroProgress;

const introSwim =
  introProgress * introProgress;

group.position.y =
  baseY
  - heroSwim * 1.15
  - introSwim * 2.4;

group.position.z = 0;


  /* =========================
     SWIM BOBBING
  ========================= */

  if (!REDUCED_MOTION) {

    const bob =
      Math.sin(
        t * 2.0 +
        swim * Math.PI * 4
      )
      * 0.045;

    group.position.y +=
      bob * (1 + swim * 1.3);

  }


  /* =========================
     PULSING SCALE
  ========================= */

  const baseScale =
    IS_SMALL ? 1.3 : 2.0;

  let pulseScale = 1;

  if (!REDUCED_MOTION) {

    pulseScale =
      1 +
      Math.sin(
        t * 2.4
      )
      * 0.018;

  }

  const distanceScale =
    1 -
    swim * 0.30;

  group.scale.setScalar(
    baseScale *
    pulseScale *
    distanceScale
  );


  /* =========================
     SWIM ROTATION
  ========================= */

 const targetY =
  -0.55 +
  targetRotY;

  const targetX =
    targetRotX -
    swim * 0.18;

  const targetZ =
    0.16 +
    swim * 0.28;


  group.rotation.y +=
    (
      targetY -
      group.rotation.y
    ) * 0.045;

  group.rotation.x +=
    (
      targetX -
      group.rotation.x
    ) * 0.04;

  group.rotation.z +=
    (
      targetZ -
      group.rotation.z
    ) * 0.04;


  /* =========================
     BODY SWAY
  ========================= */

  if (!REDUCED_MOTION) {

    group.rotation.x +=
      Math.sin(
        t * 1.15
      ) * 0.0008;

    group.rotation.z +=
      Math.cos(
        t * 0.9
      ) * 0.0012;

  }


 /* =========================
   FADE DURING INTRO
========================= */

let opacity = 1;

if (introProgress > 0.75) {

  opacity =
    1 -
    (
      introProgress - 0.75
    ) / 0.25;

}

opacity =
  THREE.MathUtils.clamp(
    opacity,
    0,
    1
  );

if (
  jelly &&
  jelly.model
) {

  jelly.model.traverse(
    (child) => {

      if (
        child.isMesh &&
        child.material
      ) {

        child.material.opacity =
          0.28 * opacity;

      }

    }
  );

}

  /* =========================
     GLOW BREATHING
  ========================= */

  if (
    jelly &&
    !REDUCED_MOTION
  ) {

    jelly.cyanGlow.intensity =
      0.45 +
      Math.sin(t * 1.15) * 0.1;

    jelly.purpleGlow.intensity =
      0.28 +
      Math.sin(t * 0.9 + 1) * 0.08;

    jelly.pinkGlow.intensity =
      0.12 +
      Math.sin(t * 1.35 + 2) * 0.04;

  }

}


/* =========================
   RENDER HERO
========================= */

renderer.render(
  scene,
  camera
);


} // zatvara function tick()


tick();

} // zatvara initHero()
  
/* ==========================================================
   FLOWSTATE — WEB ORB
========================================================== */

function buildWebOrb() {

  const orbGroup = new THREE.Group();


  /* =========================
     OUTER GLASS SPHERE
  ========================= */

  const sphereGeometry =
    new THREE.SphereGeometry(
      1.35,
      48,
      48
    );

  const sphereMaterial =
    new THREE.MeshPhysicalMaterial({

      color: 0x062c36,

      transparent: true,
      opacity: 0.16,

      roughness: 0.12,
      metalness: 0,

      transmission: 0.35,

      clearcoat: 0.5,
      clearcoatRoughness: 0.15,

      emissive: 0x00272d,
      emissiveIntensity: 0.08,

      side: THREE.DoubleSide,

      depthWrite: false
    });

  const sphere =
    new THREE.Mesh(
      sphereGeometry,
      sphereMaterial
    );

  orbGroup.add(sphere);

/* =========================
   GLASS SHELLS
========================= */

const shell1 = new THREE.Mesh(
  new THREE.SphereGeometry(1.42, 32, 32),
  new THREE.MeshBasicMaterial({
    color: CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.055,
    depthWrite: false
  })
);

shell1.scale.set(
  1,
  0.94,
  1.05
);

orbGroup.add(shell1);


const shell2 = new THREE.Mesh(
  new THREE.SphereGeometry(1.48, 24, 24),
  new THREE.MeshBasicMaterial({
    color: BLUE,
    wireframe: true,
    transparent: true,
    opacity: 0.035,
    depthWrite: false
  })
);

shell2.rotation.set(
  0.25,
  0.4,
  0
);

orbGroup.add(shell2);

  /* =========================
     INNER WIREFRAME
  ========================= */

  const wireGeometry =
    new THREE.IcosahedronGeometry(
      1.13,
      2
    );

  const wireMaterial =
    new THREE.MeshBasicMaterial({

      color: CYAN,

      wireframe: true,

      transparent: true,

      opacity: 0.11,

      depthWrite: false
    });

  const wire =
    new THREE.Mesh(
      wireGeometry,
      wireMaterial
    );

  orbGroup.add(wire);


  /* =========================
     NETWORK NODES
  ========================= */

  const nodeCount = 34;

  const nodeGeometry =
    new THREE.BufferGeometry();

  const nodePositions =
    new Float32Array(
      nodeCount * 3
    );

  for (
    let i = 0;
    i < nodeCount;
    i++
  ) {

    /*
      Random tačka na/oko površine sfere
    */

    const theta =
      Math.random() *
      Math.PI *
      2;

    const phi =
      Math.acos(
        2 * Math.random() - 1
      );

    const radius =
      0.8 +
      Math.random() * 0.28;


    nodePositions[i * 3] =
      radius *
      Math.sin(phi) *
      Math.cos(theta);

    nodePositions[i * 3 + 1] =
      radius *
      Math.cos(phi);

    nodePositions[i * 3 + 2] =
      radius *
      Math.sin(phi) *
      Math.sin(theta);

  }

  nodeGeometry.setAttribute(

    'position',

    new THREE.BufferAttribute(
      nodePositions,
      3
    )

  );


  const nodeMaterial =
    new THREE.PointsMaterial({

      color: CYAN,

      size: 0.045,

      transparent: true,

      opacity: 0.8,

      depthWrite: false

    });


  const nodes =
    new THREE.Points(
      nodeGeometry,
      nodeMaterial
    );

  orbGroup.add(nodes);


  /* =========================
     INTERNAL GLOW
  ========================= */

  const glow =
    new THREE.PointLight(
      CYAN,
      0.65,
      4
    );

  glow.position.set(
    0,
    0,
    0.6
  );

  orbGroup.add(glow);


  /* =========================
     POSITION
  ========================= */

  orbGroup.position.set(
    -0.55,
    0.15,
    0
  );

  orbGroup.scale.setScalar(
    0.75
  );

/* =========================
   BRIGHT NETWORK NODES
========================= */

const brightNodeGeo =
  new THREE.SphereGeometry(
    0.035,
    8,
    8
  );

const brightNodeMat =
  new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.9
  });

for (let i = 0; i < 12; i++) {

  const node =
    new THREE.Mesh(
      brightNodeGeo,
      brightNodeMat
    );

  const angle =
    Math.random() *
    Math.PI * 2;

  const y =
    (Math.random() - 0.5) * 1.5;

  const radius =
    Math.sqrt(
      Math.max(
        0,
        0.9 - y * y * 0.25
      )
    );

  node.position.set(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );

  orbGroup.add(node);
}

  return {

    group: orbGroup,

    sphere,

    wire,

    nodes,

    glow

  };

}

function createGlowTexture() {

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    64, 64, 0,
    64, 64, 64
  );

  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);

  return texture;
}

/* ==========================================================
   FLOWSTATE — SOCIAL PARTICLE CLOUD
========================================================== */

function buildSocialCloud() {

  const socialGroup =
    new THREE.Group();
    const glowTexture =
  createGlowTexture();


  /* =========================
     PARTICLES
  ========================= */
const particleCount =
  IS_SMALL ? 160 : 450;

  const geometry =
    new THREE.BufferGeometry();

  const positions =
    new Float32Array(
      particleCount * 3
    );

for (
  let i = 0;
  i < particleCount;
  i++
) {

  const theta =
    Math.random() *
    Math.PI *
    2;

  const phi =
    Math.acos(
      2 * Math.random() - 1
    );

  const radius =
    Math.pow(
      Math.random(),
      0.42
    ) * 1.35;

  positions[i * 3] =
    radius *
    Math.sin(phi) *
    Math.cos(theta);

  positions[i * 3 + 1] =
    radius *
    Math.cos(phi);

  positions[i * 3 + 2] =
    radius *
    Math.sin(phi) *
    Math.sin(theta);

}


  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  /* =========================
     CYAN PARTICLES
  ========================= */

  const material =
  new THREE.PointsMaterial({

    color: CYAN,

    size: 0.075,

    map: glowTexture,

    transparent: true,

    opacity: 0.8,

    alphaTest: 0.01,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false

  });


  const particles =
    new THREE.Points(
      geometry,
      material
    );

  socialGroup.add(
    particles
  );


  /* =========================
     PURPLE INNER CLOUD
  ========================= */

  const innerGeometry =
    new THREE.BufferGeometry();

  const innerCount =
    IS_SMALL ? 35 : 70;

  const innerPositions =
    new Float32Array(
      innerCount * 3
    );


 for (
  let i = 0;
  i < innerCount;
  i++
) {

  const theta =
    Math.random() *
    Math.PI *
    2;

  const phi =
    Math.acos(
      2 * Math.random() - 1
    );

  const radius =
    Math.pow(
      Math.random(),
      0.55
    ) * 0.85;

  innerPositions[i * 3] =
    radius *
    Math.sin(phi) *
    Math.cos(theta);

  innerPositions[i * 3 + 1] =
    radius *
    Math.cos(phi);

  innerPositions[i * 3 + 2] =
    radius *
    Math.sin(phi) *
    Math.sin(theta);

}


  innerGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      innerPositions,
      3
    )
  );


 const innerMaterial =
  new THREE.PointsMaterial({

    color: PURPLE,

    size: 0.11,

    map: glowTexture,

    transparent: true,

    opacity: 0.7,

    alphaTest: 0.01,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false

  });


  const innerParticles =
    new THREE.Points(
      innerGeometry,
      innerMaterial
    );


  socialGroup.add(
    innerParticles
  );


  /* =========================
     GLOW
  ========================= */

  const glow =
    new THREE.PointLight(
      CYAN,
      0.45,
      3.5
    );

  socialGroup.add(
    glow
  );


  /* =========================
     POSITION
  ========================= */

  socialGroup.position.set(
    1.55,
    0,
    0
  );

  socialGroup.scale.setScalar(
    0.85
  );

  /* =========================
   ENERGY NODES
========================= */

const energyNodes =
  new THREE.Group();

const nodeGeo =
  new THREE.SphereGeometry(
    0.045,
    12,
    12
  );

const nodeColors = [
  CYAN,
  CYAN,
  BLUE,
  PURPLE,
  PINK,
  CYAN
];

for (let i = 0; i < 12; i++) {

  const mat =
    new THREE.MeshBasicMaterial({

      color:
        nodeColors[
          i % nodeColors.length
        ],

      transparent: true,

      opacity: 0.9,

      blending:
        THREE.AdditiveBlending

    });


  const node =
    new THREE.Mesh(
      nodeGeo,
      mat
    );


  const angle =
    (i / 12) *
    Math.PI *
    2;

  const radius =
    0.45 +
    Math.random() * 0.75;


  node.position.set(

    Math.cos(angle) *
    radius,

    (Math.random() - 0.5) *
    1.15,

    Math.sin(angle) *
    radius *
    0.55

  );


  /* glow sprite */

  const spriteMaterial =
    new THREE.SpriteMaterial({

      map: glowTexture,

      color:
        nodeColors[
          i % nodeColors.length
        ],

      transparent: true,

      opacity: 0.45,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false

    });


  const sprite =
    new THREE.Sprite(
      spriteMaterial
    );

  sprite.scale.set(
    0.28,
    0.28,
    1
  );


  node.add(sprite);

  energyNodes.add(node);

}

socialGroup.add(
  energyNodes
);

return {
  group: socialGroup,
  particles,
  innerParticles,
  energyNodes,
  glow
};

}

/* ==========================================================
   FLOWSTATE — FLUID CONNECTION
========================================================== */

/* ==========================================================
   FLOWSTATE — ANIMATED FLOW TENDRILS
========================================================== */

function buildFlowConnection() {

  const group =
    new THREE.Group();

  const strands = [];

  const colors = [
    CYAN,
    BLUE,
    PURPLE,
    CYAN,
    PINK
  ];

  const strandCount = 5;
  const pointCount = 70;


  for (
    let s = 0;
    s < strandCount;
    s++
  ) {

    const geometry =
      new THREE.BufferGeometry();

    const positions =
      new Float32Array(
        pointCount * 3
      );

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3
      )
    );


    /* MAIN LINE */

    const material =
      new THREE.LineBasicMaterial({

        color:
          colors[s],

        transparent: true,

        opacity:
          s === 0
            ? 0.65
            : 0.28,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      });


    const line =
      new THREE.Line(
        geometry,
        material
      );


    /* GLOW COPY */

    const glowMaterial =
      new THREE.LineBasicMaterial({

        color:
          colors[s],

        transparent: true,

        opacity:
          s === 0
            ? 0.16
            : 0.07,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      });


    const glow =
      new THREE.Line(
        geometry,
        glowMaterial
      );


    glow.scale.setScalar(
      1.012
    );


    group.add(
      glow
    );

    group.add(
      line
    );


    strands.push({

      geometry,

      line,

      glow,

      phase:
        Math.random() *
        Math.PI *
        2,

      amplitude:
        0.10 +
        Math.random() *
        0.12,

      verticalOffset:
        (s - 2) * 0.08

    });

  }


  return {

    group,

    strands,

    pointCount

  };

}
/* ==========================================================
   UPDATE FLOW TENDRILS
========================================================== */

function updateFlowConnection(
  flow,
  webOrb,
  socialCloud,
  time
) {

  if (
    !flow ||
    !webOrb ||
    !socialCloud
  ) return;


  const start =
    webOrb.group.position.clone();

  const end =
    socialCloud.group.position.clone();


  /*
    Niti ne kreću iz centra objekata,
    nego iz njihovih unutrašnjih ivica.
  */

  start.x += 0.65;
  start.y -= 0.15;

  end.x -= 0.70;
  end.y += 0.05;


  flow.strands.forEach(
    (strand, strandIndex) => {

      const position =
        strand.geometry.attributes.position;


      for (
        let i = 0;
        i < flow.pointCount;
        i++
      ) {

        const p =
          i /
          (flow.pointCount - 1);


        /* osnovna putanja */

        let x =
          THREE.MathUtils.lerp(
            start.x,
            end.x,
            p
          );

        let y =
          THREE.MathUtils.lerp(
            start.y,
            end.y,
            p
          );

        let z =
          THREE.MathUtils.lerp(
            start.z,
            end.z,
            p
          );


        /*
          Najveći talas je na sredini,
          krajevi ostaju vezani za objekte.
        */

        const envelope =
          Math.sin(
            p * Math.PI
          );


        /* glavni underwater wave */

        y +=
          Math.sin(
            p * 7 +
            time * 0.8 +
            strand.phase
          )
          *
          strand.amplitude
          *
          envelope;


        /* drugi sporiji talas */

        y +=
          Math.sin(
            p * 3 -
            time * 0.45 +
            strandIndex
          )
          *
          0.07
          *
          envelope;


        /* malo depth kretanja */

        z +=
          Math.cos(
            p * 5 +
            time * 0.55 +
            strand.phase
          )
          *
          0.10
          *
          envelope;


        /* svaki strand malo drugačije */

        y +=
          strand.verticalOffset *
          envelope;


        position.setXYZ(
          i,
          x,
          y,
          z
        );

      }


      position.needsUpdate = true;


      /*
        suptilno pulsiranje opacity-a
      */

      strand.line.material.opacity =
        0.24 +
        Math.sin(
          time * 0.8 +
          strand.phase
        ) * 0.10;

    }
  );

}
function updateObjectConnection(
  flow,
  fromObject,
  toObject,
  time,
  startOffsetX,
  startOffsetY,
  endOffsetX,
  endOffsetY
) {

  if (
    !flow ||
    !fromObject ||
    !toObject
  ) return;


  const start =
    fromObject.group.position.clone();

  const end =
    toObject.group.position.clone();


  start.x += startOffsetX;
  start.y += startOffsetY;

  end.x += endOffsetX;
  end.y += endOffsetY;


  flow.strands.forEach(
    (strand, strandIndex) => {

      const position =
        strand.geometry.attributes.position;


      for (
        let i = 0;
        i < flow.pointCount;
        i++
      ) {

        const p =
          i /
          (flow.pointCount - 1);


        let x =
          THREE.MathUtils.lerp(
            start.x,
            end.x,
            p
          );

        let y =
          THREE.MathUtils.lerp(
            start.y,
            end.y,
            p
          );

        let z =
          THREE.MathUtils.lerp(
            start.z,
            end.z,
            p
          );


        const envelope =
          Math.sin(
            p * Math.PI
          );


        y +=
          Math.sin(
            p * 6 +
            time * 0.7 +
            strand.phase
          )
          *
          strand.amplitude
          *
          envelope;


        z +=
          Math.cos(
            p * 4 +
            time * 0.5 +
            strand.phase
          )
          *
          0.08
          *
          envelope;


        y +=
          strand.verticalOffset *
          envelope;


        position.setXYZ(
          i,
          x,
          y,
          z
        );

      }

      position.needsUpdate =
        true;

    }
  );

}
/* ==========================================================
   FLOWSTATE — DESIGN RIBBON
========================================================== */

/* ==========================================================
   FLOWSTATE — DESIGN FLUID RIBBON
========================================================== */

/* ==========================================================
   FLOWSTATE — DESIGN ORB
========================================================== */

function buildDesignOrb() {

  const designGroup =
    new THREE.Group();

  const glowTexture =
    createGlowTexture();


  /* =========================
     OUTER RINGS
  ========================= */

  const rings =
    new THREE.Group();

  const ringColors = [
    PURPLE,
    PINK,
    BLUE,
    PURPLE
  ];

  for (let i = 0; i < 7; i++) {

    const radius =
      0.55 +
      i * 0.10;

    const geometry =
      new THREE.TorusGeometry(
        radius,
        0.008,
        6,
        90
      );

    const material =
      new THREE.MeshBasicMaterial({

        color:
          ringColors[
            i % ringColors.length
          ],

        transparent: true,

        opacity:
          0.18 + i * 0.018,

        blending:
          THREE.AdditiveBlending,

        depthWrite: false

      });

    const ring =
      new THREE.Mesh(
        geometry,
        material
      );

    ring.rotation.x =
      Math.random() *
      Math.PI;

    ring.rotation.y =
      Math.random() *
      Math.PI;

    ring.rotation.z =
      Math.random() *
      Math.PI;

    rings.add(ring);

  }

  designGroup.add(rings);


 


  /* =========================
     CREATIVE PARTICLES
  ========================= */

  const particleCount =
    IS_SMALL ? 90 : 180;

  const geometry =
    new THREE.BufferGeometry();

  const positions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i++
  ) {

    const theta =
      Math.random() *
      Math.PI *
      2;

    const phi =
      Math.acos(
        2 * Math.random() - 1
      );

    const radius =
      0.25 +
      Math.pow(
        Math.random(),
        0.7
      ) * 0.75;

    positions[i * 3] =
      radius *
      Math.sin(phi) *
      Math.cos(theta);

    positions[i * 3 + 1] =
      radius *
      Math.cos(phi);

    positions[i * 3 + 2] =
      radius *
      Math.sin(phi) *
      Math.sin(theta);

  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  const particleMaterial =
    new THREE.PointsMaterial({

      color: PINK,

      size: 0.06,

      map: glowTexture,

      transparent: true,

      opacity: 0.7,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false

    });


  const particles =
    new THREE.Points(
      geometry,
      particleMaterial
    );

  designGroup.add(particles);


  /* =========================
     ENERGY NODES
  ========================= */

  const nodes =
    new THREE.Group();

  const colors = [
    PINK,
    PURPLE,
    BLUE,
    PINK,
    CYAN
  ];

  for (let i = 0; i < 10; i++) {

    const node =
      new THREE.Sprite(

        new THREE.SpriteMaterial({

          map: glowTexture,

          color:
            colors[
              i % colors.length
            ],

          transparent: true,

          opacity: 0.65,

          blending:
            THREE.AdditiveBlending,

          depthWrite: false

        })

      );

    const angle =
      (i / 10) *
      Math.PI *
      2;

    const radius =
      0.35 +
      Math.random() * 0.45;

    node.position.set(

      Math.cos(angle) *
      radius,

      (Math.random() - 0.5) *
      0.9,

      Math.sin(angle) *
      radius *
      0.6

    );

    node.scale.set(
      0.18,
      0.18,
      1
    );

    nodes.add(node);

  }

  designGroup.add(nodes);


  /* =========================
     POSITION
  ========================= */

  designGroup.position.set(
    -0.75,
    -1.55,
    0
  );

  designGroup.scale.setScalar(
    0.95
  );


  return {

    group:
      designGroup,

    rings,


    particles,

    nodes

  };

}
/* ==========================================================
   UPDATE DESIGN ORB
========================================================== */

function updateDesignOrb(
  design,
  time
) {

  if (!design) return;


  design.group.position.y =
    -1.55 +
    Math.sin(
      time * 0.34
    ) * 0.14;


  design.group.position.x =
    -0.75 +
    Math.sin(
      time * 0.21
    ) * 0.05;


  design.rings.rotation.y =
    time * 0.08;

  design.rings.rotation.x =
    Math.sin(
      time * 0.25
    ) * 0.15;


 


  design.particles.rotation.y =
    time * 0.10;

  design.particles.rotation.x =
    Math.sin(
      time * 0.31
    ) * 0.10;


  design.nodes.rotation.z =
    -time * 0.11;

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

    /* =========================
   FLOWSTATE OBJECTS
========================= */

const webOrb =
  buildWebOrb();

scene.add(
  webOrb.group
);

const socialCloud =
  buildSocialCloud();

scene.add(
  socialCloud.group
);

const flowConnection =
  buildFlowConnection();

scene.add(
  flowConnection.group
);
const designConnection =
  buildFlowConnection();

scene.add(
  designConnection.group
);
const designOrb =
  buildDesignOrb();

scene.add(
  designOrb.group
);
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

/* =========================
   WEB ORB ANIMATION
========================= */



webOrb.group.position.y =
  0.65 +
  Math.sin(t * 0.45) * 0.30;

webOrb.group.position.x =
  -1.15 +
  Math.sin(t * 0.30) * 0.06;


  /* VIDLJIVA ROTACIJA CELOG ORBA */
  webOrb.group.rotation.y =
    t * 0.18;

  webOrb.group.rotation.x =
    Math.sin(t * 0.6) * 0.15;


  /* UNUTRAŠNJA MREŽA */
  webOrb.wire.rotation.y =
    -t * 0.25;

  webOrb.wire.rotation.z =
    t * 0.08;


  /* TAČKICE */
  webOrb.nodes.rotation.y =
    t * 0.15;


  /* PULSIRANJE SVETLA */
  webOrb.glow.intensity =
    0.55 +
    Math.sin(t * 2) * 0.25;

/* =========================
   SOCIAL CLOUD ANIMATION
========================= */

/* sporo pluta */
socialCloud.group.position.y =
  Math.sin(
    t * 0.38 + 1.5
  ) * 0.22;


/* vrlo blago horizontalno kretanje */
socialCloud.group.position.x =
  1.55 +
  Math.sin(
    t * 0.24
  ) * 0.08;


/* ceo oblak polako rotira */
socialCloud.group.rotation.y =
  t * 0.055;

socialCloud.group.rotation.z =
  Math.sin(
    t * 0.28
  ) * 0.06;


/* unutrašnje čestice idu kontra */
socialCloud.innerParticles.rotation.y =
  -t * 0.12;

socialCloud.innerParticles.rotation.x =
  Math.sin(
    t * 0.4
  ) * 0.12;


/* bioluminescent pulse */
socialCloud.glow.intensity =
  0.35 +
  Math.sin(
    t * 1.15 + 1
  ) * 0.10;

  /* =========================
   FLOW TENDRILS
========================= */

updateFlowConnection(
  flowConnection,
  webOrb,
  socialCloud,
  t
);
updateObjectConnection(
  designConnection,
  socialCloud,
  designOrb,
  t,

  -0.30,
  -0.35,

  0.45,
  0.15
);
/* =========================
   DESIGN RIBBON
========================= */

updateDesignOrb(
  designOrb,
  t
);
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