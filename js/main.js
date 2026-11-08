/* =====================================================================
   City Scape — main.js
   Vanilla JS, no dependencies. All content and tuning lives in config.js.
   ===================================================================== */
(function () {
  'use strict';

  const C = window.SITE_CONFIG;
  const DH = C.design.height;
  const root = document.documentElement;
  const body = document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------------- reduced motion ---------------- */
  const mqRM = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqRM.matches;
  const applyRM = () => root.classList.toggle('reduced', reduced);
  applyRM();
  if (mqRM.addEventListener) mqRM.addEventListener('change', e => { reduced = e.matches; applyRM(); });

  /* ---------------- tiny DOM helper ---------------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  }
  const svgURI = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  // deterministic pseudo-random so the street looks the same every visit
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /* =====================================================================
     Image loading with placeholder fallback
     ===================================================================== */
  const missing = [];
  const imgCache = new Map();
  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    if (imgCache.has(url)) return imgCache.get(url);
    const p = new Promise(resolve => {
      const im = new Image();
      let done = false;
      const fin = v => { if (!done) { done = true; resolve(v); } };
      im.onload = () => fin({ src: url, w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => fin(null);
      setTimeout(() => fin(null), 20000);
      im.decoding = 'async';
      im.src = url;
    });
    imgCache.set(url, p);
    return p;
  }
  async function loadOr(url, fallback) {
    const r = await loadImage(url);
    if (r) return Object.assign({ placeholder: false }, r);
    if (url && !missing.includes(url)) missing.push(url);
    return Object.assign({ placeholder: true }, fallback ? fallback() : {});
  }

  /* =====================================================================
     Placeholders (clearly labelled, used only when a file is missing)
     ===================================================================== */
  const PH = {
    building(b) {
      const p = b.placeholder || {};
      const W = p.w || 360, H = p.h || 380;
      const wall = p.wall || '#cbb8a0';
      const R = (r, extra = '') => r ? `<rect x="${r.x / 100 * W}" y="${r.y / 100 * H}" width="${r.w / 100 * W}" height="${r.h / 100 * H}" ${extra}/>` : '';
      let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
      s += `<rect width="${W}" height="${H}" fill="${wall}"/>`;
      s += `<rect width="${W}" height="${H * 0.04}" fill="#2a2826" opacity=".6"/>`;
      (b.glows || []).forEach(g => { s += R(g, 'fill="#3a4a52" stroke="#1d1f22" stroke-width="3"'); });
      if (b.sign) s += R(b.sign, 'fill="#2a2a2c"');
      if (b.storefront) s += R(b.storefront, 'fill="#4d4a40" stroke="#1d1f22" stroke-width="4"');
      if (b.door) s += R(b.door, 'fill="#1d1f22"');
      s += `<rect y="${H - 8}" width="${W}" height="8" fill="#000" opacity=".2"/>`;
      s += `<rect x="6" y="${H * 0.06}" width="${Math.min(W - 12, 250)}" height="20" rx="3" fill="#fff" opacity=".88"/>`;
      s += `<text x="12" y="${H * 0.06 + 14}" font-family="monospace" font-size="12" font-weight="700" fill="#8a1c3a">PLACEHOLDER · ${b.file.split('/').pop()}</text>`;
      s += '</svg>';
      return { src: svgURI(s), w: W, h: H };
    },
    doorLeaf(side) {
      // Black-framed glass leaf with a long pull handle at the meeting edge
      const hx = side === 'left' ? 48 : 9;
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 160" preserveAspectRatio="none">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#c9d6cf" stop-opacity=".42"/><stop offset=".45" stop-color="#8fa398" stop-opacity=".22"/>
          <stop offset=".7" stop-color="#6f8478" stop-opacity=".28"/><stop offset="1" stop-color="#3c4842" stop-opacity=".45"/></linearGradient></defs>
        <rect x="0" y="0" width="60" height="160" fill="#1c1d1f"/>
        <rect x="6" y="6" width="48" height="148" fill="url(#g)"/>
        <rect x="6" y="96" width="48" height="4" fill="#1c1d1f" opacity=".85"/>
        <polygon points="6,6 30,6 6,56" fill="#fff" opacity=".16"/><polygon points="40,154 54,120 54,154" fill="#fff" opacity=".08"/>
        <rect x="${hx}" y="58" width="3.2" height="46" rx="1.6" fill="#c9cdd0"/>
        <rect x="${hx + 0.6}" y="58" width="1" height="46" fill="#fff" opacity=".6"/>
      </svg>`;
      return { src: svgURI(s), w: 60, h: 160 };
    },
    street() {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" preserveAspectRatio="none">
        <defs><linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc5b6"/><stop offset="1" stop-color="#ddd4c6"/></linearGradient>
        <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3e42"/><stop offset="1" stop-color="#4b4c50"/></linearGradient></defs>
        <rect width="480" height="76" fill="url(#sw)"/>
        <rect width="480" height="3" fill="#a69a88"/>
        <g stroke="#b6ab9b" stroke-width="1.5"><line x1="0.75" y1="3" x2="0.75" y2="76"/><line x1="120" y1="3" x2="120" y2="76"/><line x1="240" y1="3" x2="240" y2="76"/><line x1="360" y1="3" x2="360" y2="76"/></g>
        <line x1="0" y1="40" x2="480" y2="40" stroke="#c4b9a9" stroke-width="1"/>
        <rect y="76" width="480" height="5" fill="#ece5da"/>
        <rect y="81" width="480" height="10" fill="#a9a093"/>
        <rect y="91" width="480" height="6" fill="#56575a"/>
        <rect y="97" width="480" height="103" fill="url(#rd)"/>
        <g fill="#e8e2d6" opacity=".85"><rect x="30" y="150" width="60" height="4"/><rect x="150" y="150" width="60" height="4"/><rect x="270" y="150" width="60" height="4"/><rect x="390" y="150" width="60" height="4"/></g>
      </svg>`;
      return { src: svgURI(s), w: 480, h: 200 };
    },
    tree() {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" width="240" height="360">
        <path d="M112 360 L114 200 Q100 170 84 160 L90 154 Q108 166 118 184 L122 140 L128 140 L127 182 Q140 160 158 150 L162 156 Q140 172 132 200 L134 360 Z" fill="#4a3a2c"/>
        <rect x="88" y="344" width="64" height="16" rx="3" fill="#3a3632"/>
        <g fill="#5d6a3e"><circle cx="120" cy="96" r="72"/><circle cx="64" cy="132" r="52"/><circle cx="178" cy="128" r="54"/><circle cx="96" cy="58" r="46"/><circle cx="150" cy="56" r="46"/></g>
        <g fill="#7a8650" opacity=".9"><circle cx="104" cy="70" r="34"/><circle cx="160" cy="96" r="34"/><circle cx="70" cy="118" r="28"/></g>
        <g fill="#45512d" opacity=".6"><circle cx="128" cy="150" r="40"/><circle cx="186" cy="150" r="24"/></g>
      </svg>`;
      return { src: svgURI(s), w: 240, h: 360 };
    },
    bench() {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 84" width="200" height="84">
        <g fill="#8a6446"><rect x="10" y="6" width="180" height="10" rx="2"/><rect x="10" y="20" width="180" height="10" rx="2"/><rect x="4" y="44" width="192" height="10" rx="2"/></g>
        <g fill="#2a2826"><rect x="22" y="14" width="6" height="70"/><rect x="172" y="14" width="6" height="70"/><rect x="18" y="52" width="16" height="6"/><rect x="166" y="52" width="16" height="6"/></g>
      </svg>`;
      return { src: svgURI(s), w: 200, h: 84 };
    },
    planter() {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 96" width="70" height="96">
        <g fill="#56653a"><circle cx="35" cy="34" r="22"/><circle cx="20" cy="44" r="15"/><circle cx="50" cy="44" r="15"/><circle cx="35" cy="18" r="13"/></g>
        <g fill="#74844c"><circle cx="29" cy="26" r="9"/><circle cx="47" cy="36" r="8"/></g>
        <path d="M8 54 H62 L58 96 H12 Z" fill="#2c2b2a"/><rect x="6" y="52" width="58" height="6" rx="1" fill="#3b3a38"/>
      </svg>`;
      return { src: svgURI(s), w: 70, h: 96 };
    },
    lamp() {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 340" width="60" height="340">
        <rect x="27" y="40" width="6" height="290" fill="#232325"/>
        <rect x="20" y="318" width="20" height="22" rx="2" fill="#232325"/>
        <rect x="23" y="120" width="14" height="6" rx="2" fill="#232325"/>
        <path d="M14 10 H46 L42 40 H18 Z" fill="#2a2a2c"/>
        <path d="M18 14 H42 L39 36 H21 Z" fill="#f3e3bf"/>
        <path d="M10 10 H50 L44 2 H16 Z" fill="#232325"/>
      </svg>`;
      return { src: svgURI(s), w: 60, h: 340 };
    },
    project(img, stop) {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200">
        <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe5d4"/><stop offset="1" stop-color="#cdb89c"/></linearGradient></defs>
        <rect width="1600" height="1200" fill="url(#b)"/>
        <g fill="none" stroke="#9c876c" stroke-width="3" opacity=".55">
          <path d="M200 1100 L560 760 H1040 L1400 1100"/><path d="M200 100 L560 400 H1040 L1400 100"/>
          <rect x="560" y="400" width="480" height="360"/><path d="M640 760 V520 H780 V760"/><rect x="860" y="500" width="120" height="110"/>
        </g>
        <text x="800" y="980" text-anchor="middle" font-family="Georgia,serif" font-size="54" fill="#2a2826">${escapeXML(img.alt)}</text>
        <text x="800" y="1050" text-anchor="middle" font-family="monospace" font-size="34" font-weight="700" fill="#8a1c3a">PLACEHOLDER · assets/projects/${escapeXML(img.file)}</text>
        <text x="800" y="170" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="44" fill="#6f665c">${escapeXML(stop.title)}</text>
      </svg>`;
      return { src: svgURI(s), w: 1600, h: 1200 };
    }
  };
  function escapeXML(s) { return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])); }

  /* project images: optimised WebP → original → placeholder */
  const projCache = new Map();
  function resolveProject(img, stop) {
    if (projCache.has(img.file)) return projCache.get(img.file);
    const p = (async () => {
      if (C.images.useOptimized) {
        const base = img.file.replace(/\.[^.]+$/, '');
        const r = await loadImage(C.images.optimizedDir + base + '.webp');
        if (r) return { src: r.src, placeholder: false };
      }
      const r = await loadOr(C.images.projectsDir + img.file, () => PH.project(img, stop));
      return { src: r.src, placeholder: r.placeholder };
    })();
    projCache.set(img.file, p);
    return p;
  }

  /* =====================================================================
     Icons (simple line icons)
     ===================================================================== */
  const ICONS = {
    health: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M5.5 12h3l1.5-3 2.5 6 1.5-3h4.5"/>',
    growth: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z"/>',
    independence: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    creativity: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    travel: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    joys: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/>',
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c-.8 1 .8 2-.1 3M12 3.5c-.8 1 .8 2-.1 3"/>',
    lotus: '<path d="M12 18c-3-2-4-5-4-8 2 1 3.5 3 4 5 .5-2 2-4 4-5 0 3-1 6-4 8z"/><path d="M12 18c-4 0-7-2-9-5 3-.5 5.5.5 7 2M12 18c4 0 7-2 9-5-3-.5-5.5.5-7 2"/><path d="M12 13c-1-2.5-1-5 0-8 1 3 1 5.5 0 8z"/>',
    tools: '<path d="M4.5 19.5l9.5-9.5"/><path d="M12.5 4.5l7 7-2 2-7-7z"/><path d="M19.5 19.5L10 10"/><path d="M7 3.5A3.2 3.2 0 0 0 4 8l1.8.4.4 1.8A3.2 3.2 0 0 0 10.6 7"/>',
    people: '<circle cx="12" cy="8" r="2.6"/><circle cx="6" cy="10" r="2"/><circle cx="18" cy="10" r="2"/><path d="M7.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5"/><path d="M2.5 18c0-2.3 1.5-4 3.5-4 .7 0 1.3.2 1.8.5M21.5 18c0-2.3-1.5-4-3.5-4-.7 0-1.3.2-1.8.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>'
  };
  const icon = (name, cls) => name && ICONS[name] ? `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${ICONS[name]}</svg>` : '';

  /* =====================================================================
     State
     ===================================================================== */
  const S = {
    k: 1, vw: 0, vh: 0, viewW: 0, worldTop: 0,
    groundY: DH - C.street.height,
    camX: 0, v: 0, speed: 100, input: 0,
    camMin: 0, camMax: 0, worldW: 0,
    state: 'loading', // walk | arrive | auto | opening | open | closing
    keys: { left: false, right: false }, btn: 0,
    bobPhase: 0, bob: 0, time: 0,
    arriveStop: null, auto: null,
    started: false, lastT: 0, tlast: null,
    vars: {}
  };
  // street fillers (`copyOf`) reuse another building's image, scale, crop and glows
  const baseById = Object.fromEntries(C.buildings.filter(b => !b.copyOf).map(b => [b.id, b]));
  const buildings = C.buildings.map(b => b.copyOf && baseById[b.copyOf]
    ? Object.assign({}, baseById[b.copyOf], { stop: null, door: null, sign: null, decals: null, trigger: null, flip: false }, b)
    : Object.assign({}, b));
  const stops = C.stops.map((s, i) => Object.assign({ index: i, inside: false, prefetched: false }, s));
  const stopById = Object.fromEntries(stops.map(s => [s.id, s]));
  const lamps = [];
  const fgProps = [];
  const clouds = [];
  let tAnchors = [];

  const el = {
    bob: $('#bob'), sky: $('#sky'), plates: {}, clouds: $('#clouds'), tagline: $('#tagline'),
    skyline: $('#skyline'), world: $('#world'), fg: $('#fg'),
    clockTime: $('.clock-time'), clockLabel: $('.clock-label'), hourHand: $('.cf-hour'), minHand: $('.cf-min'),
    clockLive: $('#clock-live'),
    hint: $('#hint'), girl: null, map: $('#map'), mapStops: $('.map-stops'), marker: $('.map-marker'),
    debugHud: $('#debug-hud')
  };
  document.querySelectorAll('.sky-plate').forEach(p => { el.plates[p.dataset.plate] = p; });

  /* =====================================================================
     Boot: load key images, then build the street
     ===================================================================== */
  async function boot() {
    $('.loader-text').textContent = C.meta.loading;
    const fill = $('.loader-fill'), loader = $('#loader');
    const tasks = [];
    let done = 0;
    const track = p => { tasks.push(p); p.then(() => { done++; const f = done / tasks.length; fill.style.width = (f * 100).toFixed(1) + '%'; loader.style.setProperty('--sun-y', (26 - f * 34) + 'px'); loader.style.setProperty('--sun-o', f); }); return p; };

    const skyRes = {};
    for (const k of ['sunrise', 'day', 'sunset', 'night']) if (C.sky.plates[k]) track(loadOr(C.sky.plates[k]).then(r => { skyRes[k] = r; }));
    for (const b of buildings) track(loadOr(b.file, () => PH.building(b)).then(r => { b.img = r; }));
    // per-building doors (one image holding both leaves)
    for (const b of buildings) if (b.doorFile && !b.copyOf) track(loadImage(b.doorFile).then(r => { b.doorImg = r; if (!r) missing.push(b.doorFile); }));
    let street, doorL, doorR, doorD;
    track(loadOr(C.street.file, PH.street).then(r => { street = r; }));
    track(loadImage(C.doors.left).then(r => { doorL = r; }));
    track(loadImage(C.doors.right).then(r => { doorR = r; }));
    track(loadImage(C.doors.double).then(r => { doorD = r; }));
    let interiorImg = null;
    if (C.doors.interior) track(loadImage(C.doors.interior).then(r => { interiorImg = r; if (!r) missing.push(C.doors.interior); }));
    const propRes = {};
    let walkerImg = null, mapGirlImg = null;
    if (C.mapCharacter) track(loadImage(C.mapCharacter).then(r => { mapGirlImg = r; if (!r) missing.push(C.mapCharacter); }));
    if (C.character && C.character.file) track(loadImage(C.character.file).then(r => { walkerImg = r; if (!r) missing.push(C.character.file); }));
    // only load the prop types that are actually placed on the street
    const used = new Set(C.props.foreground.map(p => p.type));
    if (C.props.lampsAtJoins || C.props.lampsAtEnds) used.add('lamp');
    if (C.props.plantersBesideDoors) used.add('planter');
    for (const t of used) {
      if (!C.propTypes[t]) continue;
      const ph = PH[t] || PH[t.split('_')[0]] || PH.tree;
      track(loadOr(C.propTypes[t].file, ph).then(r => { propRes[t] = r; }));
    }

    await Promise.all(tasks);

    // doors: two leaves > split double > placeholder
    let doorMode, doorSrc;
    if (doorL && doorR) { doorMode = 'pair'; doorSrc = { left: doorL.src, right: doorR.src }; }
    else if (doorD) { doorMode = 'split'; doorSrc = { left: doorD.src, right: doorD.src }; }
    else {
      doorMode = 'placeholder';
      doorSrc = { left: PH.doorLeaf('left').src, right: PH.doorLeaf('right').src };
      missing.push(C.doors.double + ' (or door_left.png + door_right.png)');
    }

    // sky plates
    for (const k of PLATES) if (!C.sky.plates[k]) el.plates[k].hidden = true;
    for (const k in skyRes) {
      const r = skyRes[k], p = el.plates[k];
      if (r && !r.placeholder) p.style.backgroundImage = `url("${r.src}")`;
      else p.classList.add('fallback');
    }

    buildWorld(street, { mode: doorMode, src: doorSrc, interior: interiorImg && interiorImg.src }, propRes);
    if (walkerImg) buildWalker(walkerImg);
    if (mapGirlImg) {
      const g = document.createElement('img');
      g.className = 'map-girl'; g.src = mapGirlImg.src; g.alt = ''; g.draggable = false;
      g.style.setProperty('--girl-ratio', (mapGirlImg.w / mapGirlImg.h).toFixed(4)); // keep her proportions whatever the page's img rules
      el.marker.append(g); el.girl = g;
    }
    buildClouds();
    buildMap();
    buildClockTicks();
    setupHint();
    setupSound();
    onResize();

    if (missing.length) {
      console.info('%cCity Scape: placeholders in use for missing files:', 'font-weight:bold', '\n  ' + missing.join('\n  '));
    }
    if (/[?&]debug/.test(location.search)) toggleDebug(true);

    S.state = 'walk';
    // stops whose zone contains the start position don't fire until re-entered
    const cx0 = S.camX + S.viewW / 2;
    stops.forEach(s => { s.inside = Math.abs(cx0 - s.zoneX) <= s.half; });

    loader.classList.add('done');
    loader.setAttribute('aria-busy', 'false');
    requestAnimationFrame(frame);
    requestAnimationFrame(() => { lastSize = ''; remeasure(); });
    setTimeout(() => { lastSize = ''; remeasure(); }, 600);
  }

  /* =====================================================================
     World construction
     ===================================================================== */
  function mirror(r) { return r ? Object.assign({}, r, { x: 100 - r.x - r.w }) : r; }
  function pct(r) { return { left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%' }; }

  function sprite(src, w, h, cls, opts = {}) {
    const mask = `url("${src}")`;
    const sp = h_('div', 'sprite ' + (cls || ''));
    sp.style.width = w + 'px'; sp.style.height = h + 'px';
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.draggable = false; img.decoding = 'async';
    sp.append(img);
    for (const t of ['warm', 'night']) {
      const d = h_('div', 'tint tint-' + t);
      d.style.webkitMaskImage = mask; d.style.maskImage = mask;
      if (opts.flip) d.style.transform = 'scaleX(-1)';
      sp.append(d);
    }
    if (opts.flip) sp.classList.add('flip');
    return sp;
  }
  function h_(tag, cls) { const d = document.createElement(tag); if (cls) d.className = cls; return d; }

  function buildWorld(street, doors, propRes) {
    const W = el.world;
    const tint = C.sky.tint;
    root.style.setProperty('--warm-k', tint.warm);
    root.style.setProperty('--night-k', tint.night);
    root.style.setProperty('--door-ms', C.doors.openMs + 'ms');
    const G = S.groundY;
    const ov = C.world.overlap;

    // ---- lay buildings edge to edge ----
    let x = 0;
    buildings.forEach((b, i) => {
      const sc = b.scale || 1;
      b.W = b.img.w * sc; b.H = b.img.h * sc;
      let crop = Object.assign({ left: 0, right: 0 }, b.crop);
      if (b.flip) crop = { left: crop.right, right: crop.left };
      const cl = crop.left / 100 * b.W, cr = crop.right / 100 * b.W;
      b.visW = b.W - cl - cr;
      b.left = x - cl;
      b.x0 = x; b.x1 = x + b.visW;
      b.crop = crop;
      x += b.visW - ov;
    });
    const streetEnd = x + ov;
    S.worldW = streetEnd;
    S.streetStart = 0;
    S.streetEnd = streetEnd;

    // ---- street ----
    const st = h_('div', 'street');
    const ext = C.street.extendBeyond;
    const sh = C.street.height;
    Object.assign(st.style, {
      left: -ext + 'px', width: (S.worldW + 2 * ext) + 'px',
      top: (G - 6 - C.street.sidewalkTopPercent / 100 * sh) + 'px', height: sh + 'px',
      backgroundImage: `url("${street.src}")`
    });
    W.append(st);
    // plain road continues below the strip (only seen on tall phone screens)
    const fill = h_('div', 'street road-fill');
    Object.assign(fill.style, { left: st.style.left, width: st.style.width, top: (parseFloat(st.style.top) + sh - 1) + 'px', height: '700px' });
    W.append(fill);
    if (street.placeholder) {
      const lab = h_('div', 'ph-label'); lab.textContent = 'PLACEHOLDER · assets/street/street.png';
      Object.assign(lab.style, { left: (ext + 40) + 'px', top: '120px' }); st.append(lab);
    }

    // ---- contact shadows ----
    buildings.forEach(b => {
      const d = h_('div', 'contact-shadow');
      Object.assign(d.style, { left: (b.x0 - 2) + 'px', width: (b.visW + 4) + 'px', top: (G - 1) + 'px', height: '16px' });
      W.append(d);
    });

    // ---- buildings ----
    const rand = rng(7);
    buildings.forEach((b, i) => {
      const f = !!b.flip;
      const m = r => (f ? mirror(r) : r);
      const bd = h_('div', 'bldg');
      bd.dataset.id = b.id;
      Object.assign(bd.style, { left: b.left + 'px', top: (G + 1 - b.H) + 'px', width: b.W + 'px', height: b.H + 'px', zIndex: 10 + (b.z || 0) });
      const clip = h_('div', 'bldg-clip');
      clip.style.clipPath = `inset(-2px ${b.crop.right}% -2px ${b.crop.left}%)`;
      clip.append(sprite(b.img.src, b.W, b.H, '', { flip: f }));
      clip.firstChild.style.inset = '0';
      clip.firstChild.style.width = clip.firstChild.style.height = '100%';

      // night glows (windows and storefront)
      // The building image itself is shown un-darkened (and slightly warm) inside the
      // window shapes, so windows keep their glass, frames and interiors and read as lit.
      const litRects = [];
      (b.glows || []).forEach(g => { if (rand() >= 0.2) litRects.push(m(g)); }); // ~1 in 5 windows stays dark
      if (b.storefront) litRects.push(m(b.storefront));
      if (litRects.length) {
        const ins = 0.03;
        const path = litRects.map(r => {
          const x = (r.x + r.w * ins) / 100 * b.W, y = (r.y + r.h * ins) / 100 * b.H;
          const w = r.w * (1 - 2 * ins) / 100 * b.W, hh = r.h * (1 - 2 * ins) / 100 * b.H;
          return `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${hh.toFixed(1)}h${(-w).toFixed(1)}z`;
        }).join('');
        const lit = h_('div', 'lit');
        lit.style.clipPath = `path('${path}')`;
        const li = document.createElement('img');
        li.src = b.img.src; li.alt = ''; li.draggable = false;
        if (f) li.style.transform = 'scaleX(-1)';
        lit.append(li, h_('div', 'lit-warm'));
        clip.append(lit);
      }
      if (b.storefront) {
        const r = m(b.storefront);
        const sh2 = h_('div', 'shine'); Object.assign(sh2.style, pct(r)); sh2.style.setProperty('--d', (rand() * 5).toFixed(2) + 's'); clip.append(sh2);
      }
      // logos on the shop glass
      (b.decals || []).forEach(dc => {
        const r = m(dc);
        const im = document.createElement('img');
        im.className = 'decal' + (dc.glow ? ' glow-decal' : ''); im.src = dc.file; im.alt = ''; im.draggable = false;
        Object.assign(im.style, pct(r), { opacity: dc.opacity ?? 1 });
        clip.append(im);
      });
      // sign
      if (b.sign && b.sign.text) {
        const r = m(b.sign);
        const sg = h_('div', 'sign');
        Object.assign(sg.style, pct(r));
        sg.style.fontSize = (r.h / 100 * b.H * 0.5) + 'px';
        sg.innerHTML = icon(b.sign.icon) + `<span>${escapeXML(b.sign.text)}</span>`;
        clip.append(sg);
      }
      if (b.img.placeholder) {
        const lab = h_('div', 'ph-label'); lab.textContent = 'PLACEHOLDER · ' + b.file.split('/').pop(); clip.append(lab);
      }

      // door
      if (b.stop && b.door) {
        const stop = stopById[b.stop];
        const r = m(b.door);
        const door = h_('div', 'door');
        Object.assign(door.style, pct(r));
        const interior = h_('div', 'door-interior');
        door.append(interior);
        const interiorSrc = b.interiorFile || doors.interior;
        if (interiorSrc) {
          interior.classList.add('photo');
          interior.style.backgroundImage = `url("${interiorSrc}")`;
        } else if (stop && stop.interior === 'image' && stop.images && stop.images.length) {
          const blur = h_('div', 'blur');
          interior.append(blur);
          stop.interiorEl = blur;
        }
        const L = h_('div', 'door-leaf left'), R = h_('div', 'door-leaf right');
        if (b.doorImg) {
          // this building's own door image, split down the middle into two sliding leaves
          L.style.backgroundImage = R.style.backgroundImage = `url("${b.doorImg.src}")`;
          L.classList.add('split'); R.classList.add('split');
        } else {
          L.style.backgroundImage = `url("${doors.src.left}")`;
          R.style.backgroundImage = `url("${doors.src.right}")`;
          if (doors.mode === 'split') { L.classList.add('split'); R.classList.add('split'); }
        }
        L.style.setProperty('--d', (rand() * 4).toFixed(2) + 's');
        R.style.setProperty('--d', (rand() * 4 + 0.3).toFixed(2) + 's');
        door.append(L, R);
        clip.append(door);
        const spill = h_('div', 'door-spill');
        Object.assign(spill.style, { left: (r.x - r.w * 0.8) + '%', top: (r.y - r.h * 0.2) + '%', width: (r.w * 2.6) + '%', height: (r.h * 1.5) + '%' });
        bd.append(spill);

        const tr = Object.assign({ halfWidth: 110, offset: 0 }, b.trigger);
        if (stop) {
          stop.building = b;
          stop.doorEl = door;
          stop.spillEl = spill;
          stop.doorX = b.left + (r.x + r.w / 2) / 100 * b.W;
          stop.zoneX = stop.doorX + tr.offset;
          stop.half = tr.halfWidth;
          stop.doorRect = { x: b.left + r.x / 100 * b.W, y: G - b.H + r.y / 100 * b.H, w: r.w / 100 * b.W, h: r.h / 100 * b.H };
        }
      }
      bd.prepend(clip);

      // debug label
      const dl = h_('div', 'dbg dbg-label');
      dl.textContent = `${b.id}  scale ${b.scale}\n${Math.round(b.visW)}×${Math.round(b.H)}u` + (b.door ? `\ndoor ${b.door.x},${b.door.y},${b.door.w},${b.door.h}` : '');
      Object.assign(dl.style, { left: '6px', top: '30px' });
      bd.append(dl);
      W.append(bd);
    });

    // ---- lamps (main layer: also hide the joins between buildings) ----
    const lampT = C.propTypes.lamp, lampImg = propRes.lamp;
    const lampH = lampT.height, lampW = lampImg.w / lampImg.h * lampH;
    const lampAX = (lampImg.placeholder ? 50 : (lampT.anchorX ?? 50)) / 100 * lampW;
    const la = lampImg.placeholder ? { x: 50, y: 7 } : (lampT.lightAt || { x: 50, y: 7 });
    const lampXs = [];
    if (C.props.lampsAtEnds) lampXs.push(-160, streetEnd + 160);
    if (C.props.lampsAtJoins) buildings.slice(0, -1).forEach(b => lampXs.push(b.x1 - ov / 2));
    lampXs.sort((a, b) => a - b).forEach((lx, i) => {
      const bottom = S.groundY + 74;
      const sp = sprite(lampImg.src, lampW, lampH, 'lamp');
      Object.assign(sp.style, { left: (lx - lampAX) + 'px', top: (bottom - lampH) + 'px', zIndex: 60 });
      W.append(sp);
      const light = h_('div', 'lamp-light');
      Object.assign(light.style, { left: (lx - lampAX + la.x / 100 * lampW) + 'px', top: (bottom - lampH + la.y / 100 * lampH) + 'px', zIndex: 61, width: '0', height: '0' });
      const halo = h_('div', 'halo'); halo.style.setProperty('--d', (i * 0.37 % 3).toFixed(2) + 's');
      const pool = h_('div', 'pool'); pool.style.top = (lampH * (1 - la.y / 100) - 30) + 'px';
      light.append(halo, pool);
      W.append(light);
      lamps.push({ el: light, threshold: 0.18 + ((i * 0.618) % 1) * 0.42, on: false });
    });

    // ---- planters beside doors ----
    if (C.props.plantersBesideDoors) {
      const pt = C.propTypes.planter, pi = propRes.planter;
      const ph = pt.height, pw = pi.w / pi.h * ph;
      stops.forEach(s => {
        if (!s.doorRect) return;
        const d = s.doorRect;
        [d.x - pw - 8, d.x + d.w + 8].forEach(px => {
          const sp = sprite(pi.src, pw, ph, 'planter');
          Object.assign(sp.style, { left: px + 'px', top: (S.groundY + 6 - ph) + 'px', zIndex: 55 });
          W.append(sp);
        });
      });
    }

    // ---- foreground props (parallax layer) ----
    const byId = Object.fromEntries(buildings.map(b => [b.id, b]));
    C.props.foreground.forEach((p, i) => {
      const t = C.propTypes[p.type], im = propRes[p.type];
      if (!t || !im) return;
      let px;
      if (p.anchor === 'start') px = -600 * (1 - p.at);
      else if (p.anchor === 'end') px = streetEnd + p.at * 600;
      else if (byId[p.anchor]) { const b = byId[p.anchor]; px = b.x0 + p.at * b.visW; }
      else return;
      const ph = t.height, pw = im.w / im.h * ph;
      const bottom = S.groundY + (t.groundOffset ?? 78);
      const shadow = h_('div', 'prop-shadow');
      const tall = !p.type.startsWith('tree'); const shH = t.shadowHeight ?? (tall ? 10 : 18); Object.assign(shadow.style, { width: (pw * (t.shadowWidth ?? (tall ? 0.95 : 0.62))) + 'px', height: shH + 'px', top: (bottom - shH * (t.shadowHeight ? 0.5 : 0.6)) + 'px' });
      el.fg.append(shadow);
      const sp = sprite(im.src, pw, ph, 'prop prop-' + p.type);
      Object.assign(sp.style, { top: (bottom - ph) + 'px' });
      el.fg.append(sp);
      fgProps.push({ el: sp, shadow, x: px, w: pw, ax: (im.placeholder ? 50 : (t.anchorX ?? 50)) / 100 * pw });
    });

    // ---- debug: zones and ground line ----
    const gl = h_('div', 'dbg dbg-ground');
    Object.assign(gl.style, { left: -ext + 'px', width: (S.worldW + 2 * ext) + 'px', top: G + 'px', zIndex: 200 });
    W.append(gl);
    const glab = h_('div', 'dbg dbg-label'); glab.textContent = `ground line  y=${G}`;
    Object.assign(glab.style, { left: '20px', top: (G + 6) + 'px', zIndex: 200 }); W.append(glab);
    stops.forEach(s => {
      if (s.zoneX == null) return;
      const z = h_('div', 'dbg dbg-zone');
      Object.assign(z.style, { left: (s.zoneX - s.half) + 'px', width: (2 * s.half) + 'px', height: DH + 'px', zIndex: 199 });
      const zl = h_('div', 'dbg-label'); zl.textContent = `trigger: ${s.id}`; Object.assign(zl.style, { left: '4px', top: (G + 40) + 'px' });
      z.append(zl);
      W.append(z);
    });

    // ---- distant skyline ----
    buildSkyline();

    // ---- speed from stop spacing ----
    const dx = stops.filter(s => s.doorX != null).map(s => s.doorX);
    const spacing = dx.length > 1 ? (dx[dx.length - 1] - dx[0]) / (dx.length - 1) : 600;
    S.speed = spacing / C.walk.secondsBetweenStops;
  }

  function buildSkyline() {
    S.skylineOffset = 0;
    if (!C.world.distantSkyline) { el.skyline.hidden = true; return; }
    const r = rng(42);
    const width = Math.ceil(S.worldW * C.parallax.skyline + 5000);
    const H = 560, base = 540;
    let towers = '', lights = '';
    let x = 0;
    while (x < width) {
      const w = 60 + r() * 120, hgt = 160 + r() * 380;
      towers += `<rect x="${x.toFixed(0)}" y="${(base - hgt).toFixed(0)}" width="${w.toFixed(0)}" height="${(hgt + 20).toFixed(0)}"/>`;
      if (r() < 0.35) towers += `<rect x="${(x + w * 0.4).toFixed(0)}" y="${(base - hgt - 30).toFixed(0)}" width="4" height="30"/>`;
      for (let wy = base - hgt + 14; wy < base - 10; wy += 22) {
        for (let wx = x + 10; wx < x + w - 12; wx += 18) if (r() < 0.16) lights += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="8"/>`;
      }
      x += w + r() * 18;
    }
    el.skyline.innerHTML = `<svg width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" style="opacity:1"><g fill="currentColor">${towers}</g><g class="sl-lights" fill="#ffd89a">${lights}</g></svg>`;
    S.skylineOffset = -1500;
  }

  /* ---------------- the walking character ---------------- */
  const walker = { el: null, face: 1, phase: 0, ty: 0, tyTarget: 0 };
  function buildWalker(img) {
    const ch = C.character;
    // real-world height: scale her against the average painted door height
    const doorHs = stops.filter(st => st.doorRect).map(st => st.doorRect.h);
    const doorH = doorHs.reduce((a, b) => a + b, 0) / Math.max(1, doorHs.length);
    const H = ch.heightFeet && doorH ? doorH * ch.heightFeet / (ch.doorHeightFeet || 7) : (ch.height || 72);
    const W = img.w / img.h * H;
    const wrap = h_('div', 'walker');
    const body = h_('div', 'walker-body');
    const sp = sprite(img.src, W, H, 'walker-sprite');
    sp.style.left = '0'; sp.style.top = '0';
    const sh = h_('div', 'walker-shadow');
    Object.assign(sh.style, { width: (W * 0.95) + 'px', left: (W * 0.025) + 'px', top: (H - 12) + 'px' });
    body.append(sh, sp);
    wrap.append(body);
    Object.assign(wrap.style, { width: W + 'px', height: H + 'px', top: (S.groundY + ch.groundOffset - H) + 'px', zIndex: 58 });
    el.world.append(wrap);
    Object.assign(walker, { el: wrap, body, sprite: sp, W, H });
  }
  function updateWalker(dt) {
    if (!walker.el) return;
    const cx = S.camX + S.viewW / 2;
    if (Math.abs(S.v) > 2) walker.face = S.v > 0 ? 1 : -1;
    // walking up to / back from the door, at walking pace
    const pace = S.speed * 0.85;
    const d = walker.tyTarget - walker.ty;
    const dy = Math.sign(d) * Math.min(Math.abs(d), pace * dt);
    walker.ty = reduced ? walker.tyTarget : walker.ty + dy;
    walker.body.style.transform = `translate3d(0, ${walker.ty.toFixed(2)}px, 0)`;
    const along = Math.abs(S.v), approach = Math.abs(dy) / Math.max(dt, 1e-4);
    const moving = clamp(Math.max(along, approach) / S.speed, 0, 1);
    // natural cadence: steps per second at full walking speed
    const stride = S.speed / (C.character.stepsPerSecond || 1.9);
    walker.phase += (along + approach) * dt / stride * Math.PI;
    const step = reduced ? 0 : moving;
    const lift = -Math.abs(Math.sin(walker.phase)) * 3.2 * step;         // up on each step
    const sway = Math.sin(walker.phase) * 1.4 * step;                     // slight lean side to side
    walker.el.style.left = (cx - walker.W / 2) + 'px';
    walker.sprite.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) rotate(${sway.toFixed(2)}deg) scaleX(${walker.face})`;
  }
  // from the middle of the sidewalk up to the building line (and back)
  function walkerApproachDist() { return C.character.groundOffset - (C.character.doorOffset ?? 4); }
  function walkerApproach(on) { if (walker.el) walker.tyTarget = on ? -walkerApproachDist() : 0; }
  function walkerApproachMs() { return walker.el && !reduced ? walkerApproachDist() / (S.speed * 0.85) * 1000 : 0; }
  function walkerEnter(on) {
    if (!walker.el) return;
    walker.el.classList.toggle('entering', on);
  }

  function buildClouds() {
    const r = rng(11);
    for (let i = 0; i < 9; i++) {
      let shapes = '';
      const n = 4 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) {
        const cx = 40 + j * (200 / n) + r() * 20, cy = 60 - Math.sin((j + .5) / n * Math.PI) * (20 + r() * 25);
        shapes += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(34 + r() * 26).toFixed(0)}" ry="${(22 + r() * 16).toFixed(0)}"/>`;
      }
      shapes += '<rect x="20" y="58" width="240" height="22" rx="11"/>';
      const d = h_('div', 'cloud');
      d.innerHTML = `<svg width="280" height="90" viewBox="0 0 280 90">${shapes}</svg>`;
      el.clouds.append(d);
      clouds.push({ el: d, x: r() * 2400, y: 20 + r() * 210, s: 0.55 + r() * 0.75, speed: 6 + r() * 10, o: 0.55 + r() * 0.4 });
      d.style.opacity = clouds[i].o;
    }
  }

  /* =====================================================================
     Map, hint, clock ticks
     ===================================================================== */
  function buildMap() {
    stops.forEach((s, i) => {
      const b = h('button', { type: 'button', 'aria-label': `Walk to ${s.mapLabel}`, onclick: () => goToStop(s) }, h('span', { text: s.mapLabel }));
      const li = h('li', null, b);
      el.mapStops.append(li);
      s.mapLi = li; s.mapBtn = b;
    });
  }
  function setupHint() {
    const t = C.meta.startHint;
    const span = $('.hint-text', el.hint);
    span.innerHTML = escapeXML(t).replace('→', '<kbd aria-hidden="true">→</kbd>');
    el.tagline.hidden = true; // tagline is shown on the intro overlay instead
    const intro = document.getElementById('intro');
    if (C.meta.tagline) intro.querySelector('p').textContent = C.meta.tagline;
    else intro.hidden = true;
  }
  function buildClockTicks() {
    const g = $('.cf-ticks');
    let s = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, major = i % 3 === 0;
      const r1 = major ? 32 : 35, r2 = 38;
      s += `<line class="${major ? 'major' : ''}" x1="${50 + Math.sin(a) * r1}" y1="${50 - Math.cos(a) * r1}" x2="${50 + Math.sin(a) * r2}" y2="${50 - Math.cos(a) * r2}"/>`;
    }
    g.innerHTML = s;
  }

  /* =====================================================================
     Resize
     ===================================================================== */
  function onResize() {
    const oldCx = S.camX + S.viewW / 2;
    S.vw = window.innerWidth; S.vh = window.innerHeight;
    // zoom: fit `viewHeight` units (rooftops → just past the curb) into the window height
    // phone layout only on real phones/tablets held upright (touch screen), never on a desktop window or panel
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const portrait = touch && Math.min(screen.width, screen.height) < 600 && S.vh > S.vw * 1.15;
    const viewH = C.design.viewHeight || DH;
    const below = portrait ? (C.design.portraitBelowGround ?? 300) : (C.design.showBelowGround ?? (DH - S.groundY));
    const minW = portrait ? (C.design.portraitMinWidth ?? C.design.minWidth) : C.design.minWidth;
    if (portrait) S.k = Math.min(S.vh / viewH, S.vw / minW);
    else {
      // fill the window: the shortest building's roof sits just above the top edge
      const roofMin = Math.min(...buildings.map(b => b.H));
      S.k = S.vh / (roofMin - (C.design.roofOverscan ?? 8) + below);
    }
    S.viewW = S.vw / S.k;
    S.worldTop = S.vh - (S.groundY + below) * S.k;
    const firstDoor = stops[0].doorX, lastDoor = stops[stops.length - 1].doorX;
    S.camMin = firstDoor - (C.world.walkBefore ?? 500) - S.viewW / 2;
    S.camMax = Math.max(lastDoor + (C.world.walkAfter ?? 600) - S.viewW / 2, S.camMin);
    // timeline anchors: viewer centre x → t (-1 start, 0..n-1 stops, n end)
    const a = [{ x: S.camMin + S.viewW / 2, t: -1 }];
    stops.forEach((s, i) => a.push({ x: s.doorX, t: i }));
    a.push({ x: S.camMax + S.viewW / 2, t: stops.length });
    tAnchors = a.filter((p, i) => i === 0 || p.x > a[i - 1].x + 1);
    if (S.state === 'loading') S.camX = S.camMin;
    else if (['opening', 'open', 'closing'].includes(S.state) && S.activeStop) S.camX = S.activeStop.doorX - S.viewW / 2;
    else S.camX = clamp(oldCx - S.viewW / 2, S.camMin, S.camMax);
    // map
    stops.forEach((s, i) => { s.mapLi.style.left = (mapPos(i) * 100) + '%'; });
    fitMapLabels();
    el.tagline.style.top = (S.worldTop > 160 ? S.worldTop * 0.42 : S.worldTop + 34 * S.k) + 'px';
    // sky photos: horizon sits on the ground line
    el.sky.style.bottom = 'auto';
    el.sky.style.height = Math.max(S.vh * 0.5, S.worldTop + S.groundY * S.k + 6) + 'px';
    S.cloudWrap = S.viewW + 900;
  }
  // stops spread from 8% to 92% of the bar; the walk start/end map to the ends
  function mapPos(t) {
    const n = stops.length, a = 0.08, b = 0.92;
    const at = i => a + (b - a) * i / Math.max(1, n - 1);
    if (t <= 0) return clamp(at(0) * (t + 1), 0, 1);
    if (t >= n - 1) return clamp(at(n - 1) + (1 - at(n - 1)) * (t - (n - 1)), 0, 1);
    const i = Math.floor(t); return at(i) + (at(i + 1) - at(i)) * (t - i);
  }
  // if neighbouring map labels would touch, stagger them onto two lines
  function fitMapLabels() {
    const map = document.getElementById('map');
    map.classList.remove('compact');
    const spans = stops.map(s => s.mapBtn.querySelector('span').getBoundingClientRect());
    const clash = spans.some((r, i) => i && spans[i - 1].right + 8 > r.left);
    map.classList.toggle('compact', clash);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (stops[0].mapBtn) fitMapLabels(); });
  // re-measure whenever the window or embedding panel changes size (some hosts don't fire 'resize')
  let lastSize = '';
  function remeasure() {
    const key = window.innerWidth + 'x' + window.innerHeight;
    if (key === lastSize || !window.innerWidth || !window.innerHeight || S.state === 'loading') return;
    lastSize = key;
    if (sceneZoom) { sceneZoom.cancel(); sceneZoom = null; }
    onResize(); fitMapLabels();
  }
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.documentElement);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', remeasure);
  window.addEventListener('resize', () => { if (sceneZoom) { sceneZoom.cancel(); sceneZoom = null; } onResize(); });

  const progressOf = camX => clamp((camX - S.camMin) / Math.max(1, S.camMax - S.camMin), 0, 1);
  function tOf(cx) {
    const a = tAnchors;
    if (cx <= a[0].x) return a[0].t;
    for (let i = 1; i < a.length; i++) if (cx <= a[i].x) return lerp(a[i - 1].t, a[i].t, (cx - a[i - 1].x) / (a[i].x - a[i - 1].x));
    return a[a.length - 1].t;
  }

  /* =====================================================================
     Sky, light and clock from the timeline
     ===================================================================== */
  const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const cloudCols = Object.fromEntries(Object.entries(C.sky.cloudColors).map(([k, v]) => [k, hex(v)]));
  const skyCols = Object.fromEntries(Object.entries(C.sky.skylineColors).map(([k, v]) => [k, hex(v)]));
  const PLATES = ['sunrise', 'day', 'sunset', 'night'];
  function skyAt(t) {
    const K = C.sky.keyframes;
    let a = K[0], b = K[K.length - 1], f = 0;
    if (t <= K[0].t) { a = b = K[0]; }
    else if (t >= b.t) { a = b; }
    else for (let i = 1; i < K.length; i++) if (t <= K[i].t) { a = K[i - 1]; b = K[i]; f = (t - a.t) / (b.t - a.t); break; }
    const w = {};
    let sum = 0;
    for (const p of PLATES) { w[p] = lerp(a[p] || 0, b[p] || 0, f); sum += w[p]; }
    for (const p of PLATES) w[p] = sum ? w[p] / sum : (p === 'day' ? 1 : 0);
    w.warm = lerp(a.warm || 0, b.warm || 0, f);
    return w;
  }
  const parseTime = s => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(s); let hh = +m[1] % 12; if (/pm/i.test(m[3])) hh += 12; return hh * 60 + +m[2]; };
  const clockPts = [C.clock.start, ...C.clock.stops, C.clock.end].map(parseTime);
  function minutesAt(t) {
    const i = clamp(Math.floor(t + 1), 0, clockPts.length - 2);
    return lerp(clockPts[i], clockPts[i + 1], clamp(t + 1 - i, 0, 1));
  }
  const fmtTime = m => { m = Math.round(m) % 1440; let hh = Math.floor(m / 60), mm = m % 60; const ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12; return `${hh}:${String(mm).padStart(2, '0')} ${ap}`; };

  function setVar(name, val) {
    const prev = S.vars[name];
    if (typeof val === 'number') { if (prev !== undefined && Math.abs(prev - val) < 0.002) return; root.style.setProperty(name, val.toFixed(3)); }
    else { if (prev === val) return; root.style.setProperty(name, val); }
    S.vars[name] = val;
  }

  /* =====================================================================
     Main loop
     ===================================================================== */
  function frame(now) {
    // re-check the window size every frame, so a panel that settles late (without a resize event) is caught
    if (window.innerWidth !== S.vw || window.innerHeight !== S.vh) { lastSize = ''; remeasure(); }
    const dt = S.tlast == null ? 0.016 : Math.min(0.05, (now - S.tlast) / 1000);
    S.tlast = now;
    S.time += dt;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function inputDir() { return (S.keys.right || S.btn > 0 ? 1 : 0) - (S.keys.left || S.btn < 0 ? 1 : 0); }

  function update(dt) {
    // two chained smoothing stages give an S-curve: no jolt when starting or stopping
    const easeK = 1 - Math.exp(-dt / (C.walk.easeMs / 1000 / 5));
    const cxBefore = S.camX + S.viewW / 2;

    if (S.state === 'walk') {
      S.input += (inputDir() - S.input) * easeK;
      if (Math.abs(S.input) < 0.002 && inputDir() === 0) S.input = 0;
      const target = S.input * S.speed;
      S.v += (target - S.v) * easeK;
      if (Math.abs(S.v) < 0.5 && target === 0) S.v = 0;
      S.camX += S.v * dt;
      if (S.camX < S.camMin) { S.camX = S.camMin; S.v = Math.max(0, S.v); }
      if (S.camX > S.camMax) { S.camX = S.camMax; S.v = Math.min(0, S.v); }
      const cx = S.camX + S.viewW / 2;
      for (const s of stops) {
        const inside = Math.abs(cx - s.zoneX) <= s.half;
        if (inside && !s.inside && S.v !== 0) { s.inside = true; arrive(s); break; }
        s.inside = inside;
      }
    } else if (S.state === 'arrive') {
      const s = S.arriveStop;
      const target = s.doorX - S.viewW / 2;
      // glide: a smooth curve from the current position and walking speed to a
      // standstill exactly at the door (speed only ever decreases, no overshoot)
      if (!S.glide) {
        const d = target - S.camX, v0 = S.v;
        const dir = Math.sign(d) || 1;
        const vs = Math.max(Math.abs(v0) * Math.sign(v0) * dir, S.speed * 0.35); // speed toward the door
        const T = reduced ? 0.2 : clamp(1.6 * Math.abs(d) / vs, 0.3, 3); // ≥1.5·d/v keeps speed falling the whole way
        S.glide = { x0: S.camX, x1: target, v0: Math.min(vs, 2.5 * Math.abs(d) / T) * dir, T, t: 0 };
      }
      const g = S.glide;
      g.t = Math.min(g.T, g.t + dt);
      const u = g.t / g.T, u2 = u * u, u3 = u2 * u;
      const prev = S.camX;
      S.camX = (2 * u3 - 3 * u2 + 1) * g.x0 + (u3 - 2 * u2 + u) * g.T * g.v0 + (-2 * u3 + 3 * u2) * g.x1;
      S.v = (S.camX - prev) / Math.max(dt, 1e-4);
      S.input = 0;
      if (u >= 1) { S.glide = null; S.camX = target; S.v = 0; openStop(s); }
    } else if (S.state === 'auto') {
      const a = S.auto;
      a.t += dt;
      const f = clamp(a.t / a.dur, 0, 1);
      const prev = S.camX;
      S.camX = lerp(a.from, a.to, easeInOut(f));
      S.v = (S.camX - prev) / Math.max(dt, 1e-4);
      const cx = S.camX + S.viewW / 2;
      stops.forEach(s => { s.inside = Math.abs(cx - s.zoneX) <= s.half; });
      if (f >= 1) { S.v = 0; a.stop.inside = true; openStop(a.stop); }
    } else {
      S.v = 0;
    }

    // walking bob
    const moving = clamp(Math.abs(S.v) / S.speed, 0, 1);
    S.bobPhase += Math.abs(S.camX + S.viewW / 2 - cxBefore) / C.walk.stepLength * Math.PI * 2;
    S.bob = reduced ? 0 : Math.sin(S.bobPhase) * C.walk.bobPx * Math.min(1, moving);

    updateWalker(dt);
    // first press of an arrow / walk button hides the intro
    if (!S.started && (inputDir() !== 0 || Math.abs(S.camX - S.camMin) > 4)) startDay();

    // lazy-load project images of nearby stops
    const cx = S.camX + S.viewW / 2;
    for (const s of stops) {
      if (!s.prefetched && Math.abs(cx - s.doorX) < S.speed * C.walk.secondsBetweenStops * 1.3) prefetchStop(s);
    }
  }

  function render() {
    const k = S.k, cam = S.camX, vw = S.viewW;
    const P = C.parallax;
    const par = f => (reduced ? (f > 0.5 ? 1 : 0) : f);

    el.bob.style.transform = `translate3d(0, ${S.bob.toFixed(2)}px, 0)`;
    el.world.style.transform = `translate3d(${(-cam * k).toFixed(2)}px, ${S.worldTop.toFixed(2)}px, 0) scale(${k})`;
    const ff = par(P.foreground);
    el.fg.style.transform = `translate3d(${((-ff * cam - (ff - 1) * vw / 2) * k).toFixed(2)}px, ${S.worldTop.toFixed(2)}px, 0) scale(${k})`;
    if (!S.fgPlaced || S.fgPlaced !== ff) { fgProps.forEach(p => { p.el.style.left = (ff * p.x - p.ax) + 'px'; p.shadow.style.left = (ff * p.x - parseFloat(p.shadow.style.width) / 2) + 'px'; }); S.fgPlaced = ff; }
    const sk = par(P.skyline);
    el.skyline.style.transform = `translate3d(${((S.skylineOffset - sk * cam) * k).toFixed(2)}px, ${(S.worldTop + (S.groundY - 540 + 10) * k).toFixed(2)}px, 0) scale(${k})`;
    el.sky.style.transform = `translate3d(${(-par(P.sky) * cam * k).toFixed(2)}px, 0, 0)`;

    // tagline
    const tg = par(P.tagline);
    el.tagline.style.transform = `translate3d(${(-tg * (cam - S.camMin) * k).toFixed(2)}px, 0, 0)`;
    el.tagline.style.opacity = clamp(1 - (cam - S.camMin) / 900, 0, 1).toFixed(3);

    // clouds drift on their own
    const cw = S.cloudWrap;
    for (const c of clouds) {
      const drift = reduced ? 0 : S.time * c.speed;
      let x = (c.x + drift - cam * par(P.clouds)) % cw;
      if (x < 0) x += cw;
      x -= 450;
      c.el.style.transform = `translate3d(${(x * k).toFixed(1)}px, ${(c.y * k + Math.max(0, S.worldTop)).toFixed(1)}px, 0) scale(${(c.s * k).toFixed(3)})`;
    }

    // sky + light
    const cx = cam + vw / 2;
    const t = tOf(cx);
    S.t = t;
    const w = skyAt(t);
    let acc = 0;
    for (const p of PLATES) {
      acc += w[p];
      const o = p === 'sunrise' ? 1 : (acc > 0 ? w[p] / acc : 0);
      if (el.plates[p]._o === undefined || Math.abs(el.plates[p]._o - o) > 0.002) { el.plates[p].style.opacity = o.toFixed(3); el.plates[p]._o = o; }
    }
    const warm = clamp(w.sunset + w.warm * 0.6 + w.sunrise * 0.45, 0, 1);
    const night = w.night;
    const lights = clamp(w.night + w.sunset * C.sky.tint.lightsOnFromSunset, 0, 1);
    setVar('--warm', warm);
    setVar('--night', night);
    setVar('--lights', lights);
    setVar('--warm-sky', clamp(w.warm, 0, 1));
    const mix = cols => { const c = [0, 0, 0]; for (const p of PLATES) for (let i = 0; i < 3; i++) c[i] += cols[p][i] * w[p]; return `rgb(${c.map(v => Math.round(v)).join(',')})`; };
    setVar('--cloud', mix(cloudCols));
    setVar('--skyline', mix(skyCols));

    // lamps switch on one by one
    for (const l of lamps) {
      const on = lights > l.threshold;
      if (on !== l.on) { l.on = on; l.el.classList.toggle('on', on); }
    }

    // clock
    const mins = minutesAt(t);
    const disp = fmtTime(mins);
    if (disp !== S.clockText) {
      S.clockText = disp;
      el.clockTime.textContent = disp;
    }
    el.hourHand.style.transform = `rotate(${((mins / 60) % 12) * 30}deg)`;
    el.minHand.style.transform = `rotate(${(mins % 60) * 6}deg)`;
    const nearest = stops[clamp(Math.round(t), 0, stops.length - 1)];
    if (nearest.timeOfDay !== S.clockLabel) {
      S.clockLabel = nearest.timeOfDay;
      el.clockLabel.textContent = nearest.timeOfDay;
      el.clockLive.textContent = `${nearest.timeOfDay}, ${disp}`;
    }

    // progress map
    const prog = progressOf(cam);
    el.marker.style.left = (mapPos(t) * 100).toFixed(2) + '%';
    if (el.girl) {
      if (Math.abs(S.v) > 2) S.girlFace = S.v > 0 ? 1 : -1;
      const step = reduced ? 0 : clamp(Math.abs(S.v) / S.speed, 0, 1);
      const lift = -Math.abs(Math.sin(S.bobPhase * 1.3)) * 2.2 * step;
      el.girl.style.transform = `translateX(-50%) translateY(${lift.toFixed(2)}px) scaleX(${S.girlFace || 1})`;
    }
    const cur = stops.find(s => Math.abs(cx - s.zoneX) <= s.half);
    if (cur !== S.mapCurrent) {
      if (S.mapCurrent) { S.mapCurrent.mapBtn.classList.remove('current'); S.mapCurrent.mapBtn.removeAttribute('aria-current'); }
      if (cur) { cur.mapBtn.classList.add('current'); cur.mapBtn.setAttribute('aria-current', 'location'); }
      S.mapCurrent = cur;
    }

    // footsteps
    if (snd.footsteps) {
      const walking = Math.abs(S.v) > S.speed * 0.2;
      if (walking !== snd.walking) { snd.walking = walking; if (snd.on) walking ? snd.footsteps.play().catch(() => {}) : snd.footsteps.pause(); }
    }

    if (S.debug) {
      el.debugHud.textContent =
        `DEBUG (Shift+D to hide)\n` +
        `progress   ${(prog * 100).toFixed(1)}%\n` +
        `timeline t ${t.toFixed(2)}   clock ${disp}\n` +
        `camera x   ${cam.toFixed(0)}  (viewer centre ${cx.toFixed(0)})\n` +
        `state      ${S.state}   speed ${S.v.toFixed(0)}/${S.speed.toFixed(0)} u/s\n` +
        `viewport   ${S.vw}×${S.vh}  scale ${S.k.toFixed(3)}  view ${vw.toFixed(0)}u\n` +
        `ground y   ${S.groundY}u\n` +
        `sky        ${PLATES.map(p => p + ' ' + w[p].toFixed(2)).join('  ')}\n` +
        `stops      ${stops.map(s => `${s.id}@${Math.round(s.doorX)}`).join('  ')}\n` +
        (missing.length ? `\nMISSING (placeholders shown):\n  ${missing.join('\n  ')}` : '\nAll assets found.');
    }
  }

  /* =====================================================================
     Stops: arrive, open, close
     ===================================================================== */
  function arrive(s) {
    S.state = 'arrive';
    S.arriveStop = s;
  }
  function goToStop(s) {
    if (!['walk', 'arrive'].includes(S.state)) return;
    const to = s.doorX - S.viewW / 2;
    const dist = Math.abs(to - S.camX);
    if (dist < 2) { S.camX = to; s.inside = true; openStop(s); return; }
    const dur = reduced ? 0.35 : clamp(dist / (S.speed * C.walk.autoWalkSpeed), 0.7, 3.5);
    S.state = 'auto';
    S.auto = { from: S.camX, to, t: 0, dur, stop: s };
    if (!S.started) startDay();
  }
  function prefetchStop(s) {
    s.prefetched = true;
    if (!s.images) return;
    s.images.forEach((im, i) => resolveProject(im, s).then(r => {
      if (i === 0 && s.interiorEl && !r.placeholder) s.interiorEl.style.backgroundImage = `url("${r.src}")`;
    }));
  }

  function startDay() {
    S.started = true;
    el.hint.classList.add('gone');
    const intro = document.getElementById('intro');
    if (intro) { intro.classList.add('gone'); setTimeout(() => { intro.hidden = true; }, 2600); }
  }

  function openStop(s) {
    S.state = 'opening';
    S.activeStop = s;
    S.v = 0;
    if (!s.prefetched) prefetchStop(s);
    // she walks up to the door; it opens as she gets close; she steps in; the pop-up grows
    const tA = walkerApproachMs();
    walkerApproach(true);
    setTimeout(() => { s.doorEl.classList.add('open'); s.spillEl.classList.add('on'); playSound('chime'); }, Math.max(0, tA - 300));
    setTimeout(() => walkerEnter(true), tA + 200);
    // hold keys pressed now so a held arrow doesn't flip gallery images
    S.heldAtOpen = new Set();
    if (S.keys.left) S.heldAtOpen.add('ArrowLeft');
    if (S.keys.right) S.heldAtOpen.add('ArrowRight');
    S.keys.left = S.keys.right = false; S.btn = 0;
    document.querySelectorAll('.walk-btn.pressed').forEach(b => b.classList.remove('pressed'));
    setTimeout(() => showPopup(s), reduced ? 120 : Math.round(tA + C.doors.openMs * 0.55));
  }

  /* =====================================================================
     Pop-up
     ===================================================================== */
  const modal = $('#modal'), dialog = $('#dialog'), dlgInner = $('.dlg-inner'), dlgContent = $('.dlg-content'), dlgScroll = $('.dlg-scroll');
  const modalStack = [];
  let popup = null, lastFocus = null;
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

  $('.dlg-close').addEventListener('click', () => closePopup());
  $('#dialog-wrap').addEventListener('click', e => { if (e.target === e.currentTarget) closePopup(); });
  $('#backdrop').addEventListener('click', () => closePopup());

  function showPopup(s) {
    lastFocus = document.activeElement;
    dlgContent.innerHTML = '';
    let ctrl = {};
    if (s.type === 'about') ctrl = renderAbout(s);
    else if (s.type === 'project') ctrl = renderProject(s);
    else if (s.type === 'contact') ctrl = renderContact(s);
    popup = Object.assign({ stop: s }, ctrl);
    modal.hidden = false;
    body.classList.add('modal-open');
    dlgScroll.scrollTop = 0;
    modalStack.push(dialog);

    dialog.getAnimations().forEach(a => a.cancel());
    dlgInner.getAnimations().forEach(a => a.cancel());
    if (reduced) {
      dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      requestAnimationFrame(() => modal.classList.add('visible'));
    } else {
      // the camera zooms into the open doorway, then the information fades in
      const zoomMs = C.doors.zoomMs || 900;
      zoomScene(s, true, zoomMs);
      const delay = Math.round(zoomMs * 0.6);
      dialog.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
        { duration: 450, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      setTimeout(() => modal.classList.add('visible'), delay - 150);
    }
    S.state = 'open';
    const focusTarget = dialog.querySelector('[role="tab"][aria-selected="true"]') || dialog.querySelector('.dlg-close');
    focusTarget.focus({ preventScroll: true });
  }
  // zoom the whole street toward the centre of a stop's door (and back out)
  const sceneEl = document.getElementById('scene');
  let sceneZoom = null;
  function zoomScene(s, zoomIn, ms) {
    if (zoomIn) {
      const r = s.doorEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const z = clamp(window.innerHeight * 0.95 / r.height, 2, 7);
      // move the door centre to the screen centre while scaling up
      const tx = window.innerWidth / 2 - cx, ty = window.innerHeight / 2 - cy;
      sceneEl.style.transformOrigin = `${cx}px ${cy}px`;
      sceneZoom = sceneEl.animate([
        { transform: 'none', filter: 'blur(0px)' },
        { transform: `translate(${tx}px, ${ty}px) scale(${z})`, filter: 'blur(2px)' }
      ], { duration: ms, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' });
      return sceneZoom.finished;
    }
    if (!sceneZoom) return Promise.resolve();
    const a = sceneZoom;
    a.playbackRate = 1;
    a.updatePlaybackRate ? a.updatePlaybackRate(-1.15) : (a.playbackRate = -1.15);
    return a.finished.then(() => { a.cancel(); if (sceneZoom === a) sceneZoom = null; });
  }
  function flipTransform(first, last) {
    return `translate(${(first.left - last.left).toFixed(1)}px, ${(first.top - last.top).toFixed(1)}px) scale(${(first.width / last.width).toFixed(4)}, ${(first.height / last.height).toFixed(4)})`;
  }

  function closePopup() {
    if (S.state !== 'open' || !popup) return;
    if (!lightbox.hidden) closeLightbox();
    S.state = 'closing';
    const s = popup.stop;
    modalStack.pop();
    modal.classList.remove('visible');
    const finish = () => {
      dialog.getAnimations().forEach(a => a.cancel());
      dlgInner.getAnimations().forEach(a => a.cancel());
      modal.hidden = true;
      body.classList.remove('modal-open');
      dlgContent.innerHTML = '';
      popup = null;
      s.doorEl.classList.remove('open');
      walkerEnter(false);   // she reappears in the doorway…
      s.spillEl.classList.remove('on');
      if (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
      const tA = walkerApproachMs();
      setTimeout(() => walkerApproach(false), reduced ? 0 : 350);           // …and walks back to the middle of the sidewalk
      setTimeout(() => { S.state = 'walk'; S.activeStop = null; }, reduced ? 50 : 350 + tA);
    };
    if (reduced) {
      dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.then(finish);
      return;
    }
    // information fades out, then the camera zooms back out of the doorway
    dialog.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' })
      .finished.then(() => zoomScene(s, false)).then(finish);
  }

  /* ---------------- About ---------------- */
  function renderAbout(s) {
    const tabs = s.tabs;
    const keys = Object.keys(tabs);
    const tabBtns = [], panels = [];
    const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'About Me sections' });
    keys.forEach((key, i) => {
      const id = 'tab-' + key, pid = 'panel-' + key;
      const b = h('button', { class: 'tab', type: 'button', role: 'tab', id, 'aria-controls': pid, 'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1', text: tabs[key].label, onclick: () => select(i) });
      tabBtns.push(b); tablist.append(b);
    });
    // Introduction
    const intro = tabs.introduction;
    panels.push(h('div', { class: 'about-intro', role: 'tabpanel', id: 'panel-introduction', 'aria-labelledby': 'tab-introduction', tabindex: '0' },
      intro.paragraphs.map(p => h('p', { text: p }))));
    // Values
    const vals = tabs.values;
    panels.push(h('div', { role: 'tabpanel', id: 'panel-values', 'aria-labelledby': 'tab-values', tabindex: '0', hidden: true },
      h('ul', { class: 'values', style: { listStyle: 'none', padding: 0, margin: 0 } },
        vals.cards.map(c => h('li', { class: 'value', html: `${icon(c.icon)}<h3>${escapeXML(c.title)}</h3><p>${escapeXML(c.text)}</p>` })))));
    let cur = 0;
    function select(i, focus) {
      cur = (i + keys.length) % keys.length;
      tabBtns.forEach((b, j) => { b.setAttribute('aria-selected', j === cur ? 'true' : 'false'); b.tabIndex = j === cur ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = j !== cur; });
      if (focus) tabBtns[cur].focus();
    }
    dlgContent.append(
      h('p', { class: 'dlg-eyebrow', text: C.meta.name }),
      h('h2', { class: 'dlg-title', id: 'dlg-title', text: s.title }),
      tablist, ...panels
    );
    return { onArrow: d => select(cur + d, tablist.contains(document.activeElement)) };
  }

  /* ---------------- Project ---------------- */
  function renderProject(s) {
    const gal = buildGallery(s);
    const isGroup = /group/i.test(s.badge);
    const text = h('div', { class: 'proj-text' },
      h('h2', { class: 'dlg-title', id: 'dlg-title', text: s.title }),
      s.subtitle ? h('p', { class: 'dlg-subtitle', text: s.subtitle }) : null,
      h('span', { class: 'badge' + (isGroup ? ' group' : ''), text: s.badge }),
      h('p', { text: s.writeup }),
      h('h3', { text: 'Skills and Programs Used' }),
      h('ul', { class: 'chips', 'aria-label': 'Skills and programs used' }, s.skills.map(k => h('li', { text: k }))),
      s.documents && s.documents.length ? h('div', { class: 'proj-docs' }, s.documents.map(d =>
        h('a', { class: 'btn-primary', href: d.file, target: '_blank', rel: 'noopener',
          html: `${icon('doc')}<span>${escapeXML(d.label)}</span>` + (d.note ? `<span class="doc-note">${escapeXML(d.note)}</span>` : '') + '<span class="visually-hidden"> (opens in a new tab)</span>' }))) : null
    );
    dlgContent.append(h('div', { class: 'project' }, text, gal.el));
    return { onArrow: d => gal.go(d) };
  }

  function buildGallery(s) {
    const imgs = s.images;
    const n = imgs.length;
    let idx = 0, token = 0;
    const img = h('img', { alt: '' });
    const frame = h('button', { class: 'gal-frame', type: 'button', 'aria-label': 'Open image full-screen', onclick: () => openLightbox(s, idx, i => show(i)) },
      img, h('span', { class: 'zoom-hint', 'aria-hidden': 'true', text: '⤢ View full-screen' }));
    const prev = h('button', { class: 'gal-arrow', type: 'button', 'aria-label': 'Previous image', text: '‹', onclick: () => go(-1) });
    const next = h('button', { class: 'gal-arrow', type: 'button', 'aria-label': 'Next image', text: '›', onclick: () => go(1) });
    const count = h('span', { class: 'gal-count', 'aria-live': 'polite' });
    const caption = h('p', { class: 'gal-caption' });
    const dots = h('div', { class: 'gal-dots', role: 'group', 'aria-label': 'Choose image' },
      imgs.map((im, i) => h('button', { type: 'button', 'aria-label': `Show image ${i + 1} of ${n}`, onclick: () => show(i) })));
    function show(i) {
      idx = (i + n) % n;
      const my = ++token;
      const im = imgs[idx];
      count.textContent = `${idx + 1} / ${n}`;
      caption.textContent = im.alt;
      [...dots.children].forEach((d, j) => d.setAttribute('aria-current', j === idx ? 'true' : 'false'));
      frame.setAttribute('aria-label', `Open full-screen: ${im.alt}`);
      img.classList.add('fading');
      resolveProject(im, s).then(r => {
        if (my !== token) return;
        img.onload = () => { if (my === token) img.classList.remove('fading'); };
        img.src = r.src; img.alt = im.alt;
        if (img.complete) img.classList.remove('fading');
      });
    }
    function go(d) { show(idx + d); }
    show(0);
    const el2 = h('div', { class: 'gallery' },
      h('div', { class: 'gal-row' }, prev, frame, next),
      h('div', { class: 'gal-meta' }, caption, count),
      dots);
    return { el: el2, go };
  }

  /* ---------------- Contact ---------------- */
  function renderContact(s) {
    const item = (href, ic, lbl, val, extra = {}) => h('li', null, h('a', Object.assign({ href, html: `${icon(ic)}<span><span class="lbl">${lbl}</span>${escapeXML(val)}</span>` }, extra)));
    dlgContent.append(h('div', { class: 'contact' },
      h('p', { class: 'dlg-eyebrow', text: 'Good evening' }),
      h('h2', { class: 'dlg-title', id: 'dlg-title', text: s.title }),
      h('p', { class: 'contact-name', text: s.name }),
      h('ul', { class: 'contact-list' },
        item(s.phoneHref, 'phone', 'Phone', s.phone),
        item('mailto:' + s.email, 'mail', 'Email', s.email)),
      h('a', { class: 'btn-primary', href: s.resume.file, target: '_blank', rel: 'noopener', html: `${icon('doc')}<span>${escapeXML(s.resume.label)}</span><span class="visually-hidden"> (opens in a new tab)</span>` }),
      s.closing ? h('p', { class: 'closing', text: s.closing }) : null
    ));
    $('.btn-primary svg', dlgContent).setAttribute('style', 'width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.6');
    return {};
  }

  /* =====================================================================
     Lightbox with zoom / pan
     ===================================================================== */
  const lightbox = $('#lightbox');
  const LB = { img: $('.lb-img'), stage: $('.lb-stage'), cap: $('.lb-caption'), count: $('.lb-count'), s: 1, tx: 0, ty: 0, idx: 0, stop: null, onChange: null, ptrs: new Map() };
  function openLightbox(stop, idx, onChange) {
    LB.stop = stop; LB.onChange = onChange; LB.prevFocus = document.activeElement;
    lightbox.hidden = false;
    modalStack.push(lightbox);
    lbShow(idx);
    $('.lb-close').focus({ preventScroll: true });
  }
  function closeLightbox() {
    lightbox.hidden = true;
    const i = modalStack.indexOf(lightbox); if (i >= 0) modalStack.splice(i, 1);
    if (LB.onChange) LB.onChange(LB.idx);
    if (LB.prevFocus && document.contains(LB.prevFocus)) LB.prevFocus.focus({ preventScroll: true });
  }
  function lbShow(i) {
    const imgs = LB.stop.images, n = imgs.length;
    LB.idx = (i + n) % n;
    const im = imgs[LB.idx];
    lbReset();
    LB.cap.textContent = im.alt;
    LB.count.textContent = `${LB.idx + 1} / ${n}`;
    LB.img.alt = im.alt;
    resolveProject(im, LB.stop).then(r => { LB.img.src = r.src; });
  }
  function lbApply() { LB.img.style.transform = `translate(${LB.tx}px, ${LB.ty}px) scale(${LB.s})`; }
  function lbReset() { LB.s = 1; LB.tx = LB.ty = 0; lbApply(); }
  function lbZoomAt(factor, px, py) {
    const ns = clamp(LB.s * factor, 1, 8);
    const r = ns / LB.s;
    LB.tx = px - (px - LB.tx) * r; LB.ty = py - (py - LB.ty) * r; LB.s = ns;
    if (ns === 1) { LB.tx = LB.ty = 0; }
    lbApply();
  }
  const stageCentre = (cx, cy) => { const r = LB.stage.getBoundingClientRect(); return [cx - (r.left + r.width / 2), cy - (r.top + r.height / 2)]; };
  LB.stage.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = stageCentre(e.clientX, e.clientY); lbZoomAt(Math.exp(-e.deltaY * 0.0018), px, py); }, { passive: false });
  LB.stage.addEventListener('dblclick', e => { const [px, py] = stageCentre(e.clientX, e.clientY); LB.s > 1.05 ? lbReset() : lbZoomAt(2.5, px, py); });
  LB.stage.addEventListener('pointerdown', e => {
    LB.stage.setPointerCapture(e.pointerId);
    LB.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    LB.stage.classList.add('dragging');
    if (LB.ptrs.size === 2) { const [a, b] = [...LB.ptrs.values()]; LB.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: LB.s }; }
  });
  LB.stage.addEventListener('pointermove', e => {
    const p = LB.ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (LB.ptrs.size === 2 && LB.pinch) {
      const [a, b] = [...LB.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const [px, py] = stageCentre((a.x + b.x) / 2, (a.y + b.y) / 2);
      lbZoomAt((LB.pinch.s * d / LB.pinch.d) / LB.s, px, py);
    } else if (LB.s > 1) { LB.tx += dx; LB.ty += dy; lbApply(); }
  });
  const ptrEnd = e => { LB.ptrs.delete(e.pointerId); if (LB.ptrs.size < 2) LB.pinch = null; if (!LB.ptrs.size) LB.stage.classList.remove('dragging'); };
  LB.stage.addEventListener('pointerup', ptrEnd);
  LB.stage.addEventListener('pointercancel', ptrEnd);
  $('.lb-close').addEventListener('click', closeLightbox);
  $('.lb-prev').addEventListener('click', () => lbShow(LB.idx - 1));
  $('.lb-next').addEventListener('click', () => lbShow(LB.idx + 1));
  $('.lb-zoom-in').addEventListener('click', () => lbZoomAt(1.4, 0, 0));
  $('.lb-zoom-out').addEventListener('click', () => lbZoomAt(1 / 1.4, 0, 0));
  $('.lb-reset').addEventListener('click', lbReset);

  /* =====================================================================
     Input
     ===================================================================== */
  function trapTab(e, rootEl) {
    const f = [...rootEl.querySelectorAll(FOCUSABLE)].filter(x => x.getClientRects().length && !x.closest('[hidden]'));
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !rootEl.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !rootEl.contains(a))) { e.preventDefault(); first.focus(); }
  }

  window.addEventListener('keydown', e => {
    const key = e.key;
    if (e.code === 'KeyD' && e.shiftKey && !e.ctrlKey && !e.metaKey) { toggleDebug(); e.preventDefault(); return; }
    if (key === 'Tab' && modalStack.length) { trapTab(e, modalStack[modalStack.length - 1]); return; }

    // lightbox on top
    if (!lightbox.hidden) {
      if (key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (key === 'ArrowLeft' && !e.repeat) { e.preventDefault(); lbShow(LB.idx - 1); }
      else if (key === 'ArrowRight' && !e.repeat) { e.preventDefault(); lbShow(LB.idx + 1); }
      else if (key === '+' || key === '=') lbZoomAt(1.4, 0, 0);
      else if (key === '-') lbZoomAt(1 / 1.4, 0, 0);
      else if (key === '0') lbReset();
      return;
    }
    if (S.state === 'open') {
      if (key === 'Escape') { e.preventDefault(); closePopup(); return; }
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
        if (e.repeat || (S.heldAtOpen && S.heldAtOpen.has(key))) return;
        if (popup && popup.onArrow) popup.onArrow(key === 'ArrowLeft' ? -1 : 1);
      }
      return;
    }
    if (['opening', 'closing'].includes(S.state)) {
      if (key.startsWith('Arrow')) e.preventDefault();
      return;
    }
    if (key === 'ArrowRight' || (e.code === 'KeyD' && !e.ctrlKey && !e.metaKey && !e.altKey)) { S.keys.right = true; e.preventDefault(); }
    else if (key === 'ArrowLeft' || (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey && !e.altKey)) { S.keys.left = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    if (S.heldAtOpen) S.heldAtOpen.delete(e.key);
    if (e.key === 'ArrowRight' || e.code === 'KeyD') S.keys.right = false;
    if (e.key === 'ArrowLeft' || e.code === 'KeyA') S.keys.left = false;
  });
  window.addEventListener('blur', () => { S.keys.left = S.keys.right = false; S.btn = 0; });

  // on-screen press-and-hold buttons
  [['.walk-left', -1], ['.walk-right', 1]].forEach(([sel, dir]) => {
    const b = $(sel);
    const start = e => { if (S.state !== 'walk' && S.state !== 'arrive') return; e.preventDefault(); S.btn = dir; b.classList.add('pressed'); if (e.pointerId != null) try { b.setPointerCapture(e.pointerId); } catch (_) {} };
    const stop = () => { if (S.btn === dir) S.btn = 0; b.classList.remove('pressed'); };
    b.addEventListener('pointerdown', start);
    b.addEventListener('pointerup', stop);
    b.addEventListener('pointercancel', stop);
    b.addEventListener('lostpointercapture', stop);
    b.addEventListener('contextmenu', e => e.preventDefault());
    b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
    b.addEventListener('blur', stop);
  });

  /* =====================================================================
     Debug
     ===================================================================== */
  function toggleDebug(force) {
    S.debug = force !== undefined ? force : !S.debug;
    body.classList.toggle('debug', S.debug);
    el.debugHud.hidden = !S.debug;
  }

  /* =====================================================================
     Optional sound (muted by default; only if files are configured)
     ===================================================================== */
  const snd = { on: false };
  function setupSound() {
    const f = C.sound.files;
    if (!Object.values(f).some(Boolean)) return;
    const mk = (src, loop) => { if (!src) return null; const a = new Audio(src); a.loop = loop; a.volume = C.sound.volume; a.preload = 'none'; return a; };
    snd.footsteps = mk(f.footsteps, true);
    snd.ambience = mk(f.ambience, true);
    snd.chime = mk(f.chime, false);
    const btn = $('#sound-toggle');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      snd.on = !snd.on;
      btn.setAttribute('aria-pressed', String(snd.on));
      btn.textContent = snd.on ? 'Sound on' : 'Sound off';
      if (snd.ambience) snd.on ? snd.ambience.play().catch(() => {}) : snd.ambience.pause();
      if (!snd.on && snd.footsteps) snd.footsteps.pause();
    });
  }
  function playSound(name) { const a = snd[name]; if (snd.on && a) { a.currentTime = 0; a.play().catch(() => {}); } }

  // expose a little for console tinkering
  window.CityScape = { state: S, stops, buildings, goToStop: i => goToStop(stops[i]), toggleDebug, missing };

  boot();
})();
