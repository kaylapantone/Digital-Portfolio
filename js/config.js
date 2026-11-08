/* =====================================================================
   CITY SCAPE — Kayla Pantone Portfolio
   ---------------------------------------------------------------------
   EVERYTHING you might want to tweak lives in this file:
   building order / scale / spacing, door rectangles, trigger zones,
   walk speed, sky keyframes, clock times, all text and image lists.

   Units
   -----
   The street is laid out in "design units". The scene is 900 units tall
   and is scaled to fit the browser window, so a value of 100 is always
   1/9 of the scene height, whatever the screen size.

   Percentages (door rectangles, window glows) are percentages of the
   building IMAGE, so they stay correct when you change a building's scale.

   Tip: press Shift + D in the browser to show the debug overlay.
   ===================================================================== */

window.SITE_CONFIG = {

  /* ------------------------------------------------------------------
     Text shown on the street itself
     ------------------------------------------------------------------ */
  meta: {
    name: 'Kayla Pantone',
    role: 'Interior Design Portfolio',
    tagline: 'Designing spaces that\nbuild a better\ntomorrow...', // shown in capitals until walking starts; \n = line break ('' for none)
    startHint: 'Hold → to start your day',
    loading: 'Getting ready for the day…'
  },

  /* ------------------------------------------------------------------
     Scene size
     ------------------------------------------------------------------ */
  design: {
    height: 900,       // scene height in design units (do not usually change)
    minWidth: 480,     // at least this many units always fit across (stops very narrow windows from over-zooming)
    roofOverscan: 8,   // ZOOM: the shortest building's roof sits this many units above the top of the screen (bigger = closer)
    viewHeight: 360,   // ZOOM: how many units fit in the window height. Smaller = closer (360 = storefronts + one storey; 740 = whole buildings)
    showBelowGround: 100, // how much sidewalk/road shows below the buildings (room for her to walk above the map)
    portraitMinWidth: 520,    // phones held upright: zoom so this many units fit across
    portraitBelowGround: 300  // phones held upright: lift the street above the map
  },

  /* ------------------------------------------------------------------
     World layout
     ------------------------------------------------------------------ */
  world: {
    walkBefore: 230,    // the walk starts this far before the first stop's door (centre of screen)
    walkAfter: 140,     // and ends this far after the last stop's door
    overlap: 2,         // neighbouring buildings overlap by this much to hide hairline gaps
    distantSkyline: false // true = draw a faint city skyline behind the street
  },

  /* ------------------------------------------------------------------
     Street strip (sidewalk over road)
     ------------------------------------------------------------------ */
  street: {
    file: 'assets/street/street.png',
    height: 200,            // on-screen height of the strip, in design units
    sidewalkTopPercent: 0,  // where the top edge of the sidewalk is inside street.png (0 = very top)
    extendBeyond: 3000      // how far the street continues past each end of the world
  },

  /* ------------------------------------------------------------------
     The person walking down the street (stays in the centre of the screen)
     ------------------------------------------------------------------ */
  mapCharacter: 'assets/character/girl_map.webp', // the girl walking along the progress map (null to remove)

  character: {
    file: null, // removed. To bring her back: 'assets/character/woman.webp'
    heightFeet: 5.33,    // 5'4". Her size is worked out from the painted doors…
    doorHeightFeet: 7,   // …assuming a standard 7 ft commercial door
    groundOffset: 46,    // where she walks: the middle of the sidewalk (sidewalk is ~93 units deep)
    doorOffset: 4,       // how close she walks up to the door before stepping in
    stepsPerSecond: 1.9  // natural walking cadence at full speed
  },

  /* ------------------------------------------------------------------
     Walking
     ------------------------------------------------------------------ */
  walk: {
    secondsBetweenStops: 5.5, // how long holding → takes to go from one stop to the next (lower = faster)
    easeMs: 420,             // acceleration / deceleration time (smooth S-curve)
    bobPx: 1,                // walking bob, in screen pixels (0 to turn off)
    stepLength: 150,         // design units per bob cycle
    autoWalkSpeed: 4         // progress-map clicks walk this many times faster than normal
  },

  /* ------------------------------------------------------------------
     Parallax factors (1 = moves with the buildings)
     ------------------------------------------------------------------ */
  parallax: {
    sky: 0.02,
    clouds: 0.1,
    skyline: 0.3,
    tagline: 0.6,
    foreground: 1     // trees: 1 keeps them planted on the sidewalk (above 1 makes them slide)
  },

  /* ------------------------------------------------------------------
     Sky
     Keyframes are placed on a "timeline" measured in stops:
       -1 = start of the street, 0 = 1st stop (coffee shop), 1 = 2nd stop,
        … 4 = 5th stop (social building), 5 = end of the street.
     Fractions are allowed (2.5 = halfway between stop 3 and stop 4).
     Each keyframe gives the weight of each sky plate (they don't need to
     add up to 1; they are normalised). `warm` adds a late-afternoon tint.
     A plate set to null (like sunrise) is simply not used.
     ------------------------------------------------------------------ */
  sky: {
    plates: {
      sunrise: null, // no sunrise plate: the day starts under the day sky
      day:     'assets/sky/sky_day.webp',
      sunset:  'assets/sky/sky_sunset.webp',
      night:   'assets/sky/sky_night.webp'
    },
    keyframes: [
      { t: -1,   day: 1,   sunset: 0,   night: 0,   warm: 0 },
      { t: 1,    day: 1,   sunset: 0,   night: 0,   warm: 0 },
      { t: 1.5,  day: 1,   sunset: 0,   night: 0,   warm: 0.2 },
      { t: 2,    day: 1,   sunset: 0,   night: 0,   warm: 0.6 },
      { t: 2.6,  day: 0.5, sunset: 0.5, night: 0,   warm: 0.5 },
      { t: 3,    day: 0,   sunset: 1,   night: 0,   warm: 0.2 },
      { t: 3.5,  day: 0,   sunset: 0.5, night: 0.5, warm: 0 },
      { t: 4,    day: 0,   sunset: 0,   night: 1,   warm: 0 },
      { t: 5,    day: 0,   sunset: 0,   night: 1,   warm: 0 }
    ],

    // Cloud and distant-skyline colour under each sky
    cloudColors:   { sunrise: '#ffe3d6', day: '#ffffff', sunset: '#f7b99a', night: '#3b4566' },
    skylineColors: { sunrise: '#a9a7c0', day: '#a3b4c7', sunset: '#8a6b80', night: '#151a35' },
    // How strongly buildings are tinted
    tint: {
      warm: 0.32,   // orange warmth at sunrise / sunset (multiplied)
      night: 0.72,  // blue-dark night tint (multiplied)
      lightsOnFromSunset: 0.45 // how much the sunset alone switches lights on (night = 1)
    }
  },

  /* ------------------------------------------------------------------
     Clock (top-right). Interpolated smoothly between these points.
     ------------------------------------------------------------------ */
  clock: {
    start: '7:30 AM',
    stops: ['8:00 AM', '12:30 PM', '3:00 PM', '6:30 PM', '9:00 PM'],
    end: '9:45 PM'
  },

  /* ------------------------------------------------------------------
     Doors (shared by every stop)
     If door_left.png + door_right.png exist they are used as the two leaves.
     Otherwise door_double.png is split in half. Otherwise a drawn placeholder.
     ------------------------------------------------------------------ */
  doors: {
    double: 'assets/doors/door_double.png',
    left:   'assets/doors/door_left.png',
    right:  'assets/doors/door_right.png',
    openMs: 600,
    zoomMs: 900,   // how long the camera takes to zoom into a door
    interior: 'assets/doors/interior.webp' // what you see through every open door (shown sharp, not blurred)
  },

  /* ------------------------------------------------------------------
     Buildings, in street order (left → right)
       file        image path (transparent PNG, trimmed — see tools/prepare-buildings.js)
       scale       size multiplier. Set so every storey is ~80 design units tall
                   (floor-to-floor in the image, in px, × scale ≈ 80)
       crop        { left, right } % of the image to hide at each side
                   (for perspective side walls or slivers of neighbouring buildings)
       z           stacking order when buildings overlap (higher = in front)
       stop        id of the stop (see `stops` below), or null for a filler building
       copyOf      id of another building to reuse (for street fillers)
       door        { x, y, w, h } in % of the image: the painted double doors
       trigger     { halfWidth, offset } trigger zone around the door centre (design units)
       sign        text written on the dark fascia band; rect in % of the image
       storefront  % rect of the ground-floor glass (glows brightest at night)
       glows       % rects of upper windows that light up at night
       placeholder how to draw a stand-in if the image file is missing
     ------------------------------------------------------------------ */
  buildings: [
    // ---- Street-filler buildings before the first stop ----
    // `copyOf` reuses another building's image, scale, crop and window glows.
    // They have no sign and no door trigger. `flip: true` mirrors the copy.
    { id: 'start_1', copyOf: 'restaurant', flip: true },
    { id: 'start_2', copyOf: 'wellness' },
    { id: 'start_3', copyOf: 'social', flip: true },
    { id: 'filler_gym', file: 'assets/buildings/filler_gym.webp', scale: 0.32, stop: null, crop: { left: 2.2, right: 1.8 },
      storefront: {x:8.61,y:56.1,w:83.2,h:39.37},
      glows: [{x:6.15,y:0.0,w:8.44,h:16.72},{x:18.85,y:0.0,w:62.7,h:16.72},{x:85.9,y:0.0,w:8.36,h:16.72},{x:6.15,y:23.19,w:8.44,h:17.26},{x:18.85,y:23.19,w:62.7,h:17.8},{x:85.9,y:23.19,w:8.36,h:17.26}],
      placeholder: { w: 1220, h: 974, wall: '#3b3d40' } },

    {
      id: 'coffee_shop', file: 'assets/buildings/coffee_shop.webp', scale: 0.407, z: 1, stop: 'about',
      crop: { left: 6.2, right: 5.3 },
      door: { x: 41.81, y: 66.8, w: 16.7, h: 32.16 },
      doorFile: 'assets/doors/stops/door_coffee_shop.png', // this building's own doors
      interiorFile: 'assets/interiors/interior_coffee_shop.webp', // image seen when its doors open
      trigger: { halfWidth: 85, offset: 0 },
      sign: { text: 'LAKESIDE CAFÉ', icon: 'cup', x: 10.64, y: 48.89, w: 76.6, h: 8.63 },
      storefront: { x: 10.64, y: 58.82, w: 76.6, h: 38.95 },
      glows: [{x:12.23,y:4.7,w:18.94,h:16.73},{x:60.11,y:4.7,w:22.34,h:16.73},{x:41.49,y:5.88,w:12.23,h:14.38},{x:12.23,y:27.45,w:18.94,h:17.65},{x:60.11,y:27.45,w:22.34,h:17.65},{x:41.49,y:28.1,w:12.23,h:16.99}],
      placeholder: { w: 362, h: 391, wall: '#9a5b44' }
    },
    {
      id: 'wellness', file: 'assets/buildings/wellness.webp', scale: 0.397, z: 1, stop: 'healthcare',
      crop: { left: 3.8, right: 1.3 },
      door: { x: 43.22, y: 66.62, w: 16.17, h: 33.38 },
      doorFile: 'assets/doors/stops/door_wellness.png', // this building's own doors
      interiorFile: 'assets/interiors/interior_wellness.webp', // image seen when its doors open
      decals: [{ file: 'assets/logos/decal_rvh.png', x: 44.56, y: 60.61, w: 13.4, h: 3.77, opacity: 0.9 }], // logos on the glass (% of image)
      trigger: { halfWidth: 85, offset: 0 },
      sign: { text: 'WELLNESS STUDIO', icon: 'lotus', x: 10.4, y: 49.46, w: 81.8, h: 9.32 },
      storefront: { x: 10.4, y: 59.46, w: 81.8, h: 40.28 },
      glows: [{x:8.12,y:0.95,w:9.83,h:17.43},{x:26.73,y:3.92,w:52.8,h:14.46},{x:83.75,y:0.95,w:9.99,h:17.43},{x:8.12,y:26.08,w:9.83,h:18.91},{x:26.73,y:27.97,w:52.8,h:17.29},{x:83.75,y:26.08,w:9.99,h:18.91}],
      placeholder: { w: 385, h: 391, wall: '#3b3f45' }
    },
    {
      id: 'restaurant', file: 'assets/buildings/restaurant.webp', scale: 0.389, z: 2, stop: 'hospitality',
      crop: { left: 1.6, right: 1.5 },
      door: { x: 37.8, y: 67.98, w: 18.04, h: 31.76 },
      doorFile: 'assets/doors/stops/door_restaurant.png', // this building's own doors
      interiorFile: 'assets/interiors/interior_restaurant.webp', // image seen when its doors open
      decals: [{ file: 'assets/logos/decal_il_rametto.png', x: 23.84, y: 74.87, w: 10.16, h: 17.86, opacity: 1, glow: true }],
      trigger: { halfWidth: 85, offset: 0 },
      sign: { text: 'KITCHEN AND BAR', icon: null, x: 9.5, y: 51.02, w: 69.33, h: 8.93 },
      storefront: { x: 9.5, y: 60.59, w: 69.33, h: 37.62 },
      glows: [{x:9.5,y:0.89,w:15.95,h:18.75},{x:35.52,y:0.89,w:14.62,h:18.75},{x:61.06,y:0.89,w:16.24,h:18.75},{x:88.89,y:2.68,w:9.5,h:18.24},{x:9.5,y:26.78,w:15.95,h:19.39},{x:35.52,y:26.78,w:14.62,h:19.39},{x:61.06,y:26.78,w:16.24,h:19.39},{x:88.89,y:27.3,w:9.5,h:18.88}],
      placeholder: { w: 316, h: 378, wall: '#e6d8bf' }
    },
    {
      id: 'office', file: 'assets/buildings/office.webp', scale: 0.388, z: 2, stop: 'office',
      crop: { left: 3, right: 1.3 },
      door: { x: 40.7, y: 70.14, w: 18.68, h: 28.54 },
      doorFile: 'assets/doors/stops/door_office.png', // this building's own doors
      interiorFile: 'assets/interiors/interior_office.webp', // image seen when its doors open
      decals: [{ file: 'assets/logos/logo_modunest.png', x: 47.74, y: 61.75, w: 3.85, h: 7.19, opacity: 0.95 }],
      trigger: { halfWidth: 85, offset: 0 },
      sign: { text: 'THE WORKPLACE', icon: 'tools', x: 10.72, y: 50.84, w: 80.74, h: 9.11 },
      storefront: { x: 10.72, y: 60.55, w: 80.74, h: 38.73 },
      glows: [{x:10.8,y:0.84,w:19.35,h:19.19},{x:45.73,y:0.84,w:19.51,h:19.19},{x:71.52,y:1.68,w:20.27,h:18.83},{x:10.8,y:26.02,w:19.35,h:19.31},{x:45.73,y:26.02,w:19.51,h:19.31},{x:71.52,y:26.49,w:20.27,h:19.07}],
      placeholder: { w: 358, h: 373, wall: '#e3d6c2' }
    },
    {
      id: 'social', file: 'assets/buildings/social.webp', scale: 0.36, z: 1, stop: 'contact',
      crop: { left: 10, right: 4.2 },
      door: { x: 44.39, y: 66.38, w: 16.24, h: 33.25 },
      doorFile: 'assets/doors/stops/door_social.png', // this building's own doors
      interiorFile: 'assets/interiors/interior_social.webp', // image seen when its doors open
      trigger: { halfWidth: 85, offset: 0 },
      sign: { text: 'SOCIAL HUB', icon: 'people', x: 17.43, y: 48.41, w: 71.0, h: 8.43 },
      storefront: { x: 17.43, y: 57.45, w: 71.0, h: 41.81 },
      glows: [{x:19.64,y:0.86,w:24.32,h:19.56},{x:53.66,y:1.71,w:34.78,h:20.17},{x:19.64,y:26.16,w:24.32,h:17.85},{x:53.66,y:27.63,w:34.78,h:17.0}],
      placeholder: { w: 382, h: 378, wall: '#8d8a86' }
    },

    // ---- Street-filler buildings after the last stop ----
    { id: 'filler_cafe', file: 'assets/buildings/filler_cafe.webp', scale: 0.395, stop: null, crop: { left: 1, right: 1 },
      storefront: {x:11.1,y:61.05,w:80.27,h:37.85},
      glows: [{x:10.42,y:0.0,w:19.3,h:19.53},{x:45.26,y:0.0,w:19.64,h:19.53},{x:71.14,y:0.0,w:20.5,h:19.53},{x:10.42,y:26.25,w:19.3,h:19.53},{x:45.26,y:26.25,w:19.64,h:19.53},{x:71.14,y:26.86,w:20.5,h:19.53}],
      placeholder: { w: 1171, h: 834, wall: '#e6cdb0' } },
    { id: 'end_2', copyOf: 'coffee_shop', flip: true },
    { id: 'end_3', copyOf: 'wellness', flip: true },
    { id: 'end_4', copyOf: 'office' }
    // A filler building can go between stops for pacing, e.g.:
    // { id: 'filler_a', file: 'assets/buildings/filler_1.png', scale: 1.55, stop: null, placeholder: { w: 300, h: 380, wall: '#b9a58c' } },
  ],

  /* ------------------------------------------------------------------
     Props
     Images are optional: any missing prop is drawn as a placeholder.
     `height` is in design units; width follows the image's proportions.
     ------------------------------------------------------------------ */
  propTypes: {
    // anchorX: % across the image where the prop touches the ground (default 50 = centred)
    // groundOffset: how far below the building line (design units) the prop stands; 78 = sidewalk by the curb
    tree:           { file: 'assets/props/tree.png',           height: 380, groundOffset: 78 },
    tree_flowering: { file: 'assets/props/tree_flowering.png', height: 340, groundOffset: 78 },
    bench:          { file: 'assets/props/bench.png',          height: 42, groundOffset: 14 },
    cafe_table:     { file: 'assets/props/cafe_table.png',     height: 104, groundOffset: 16 },
    trash_can:      { file: 'assets/props/trash_can.png',      height: 42, groundOffset: 13 },
    potted_plant:   { file: 'assets/props/potted_plant.png',   height: 40, groundOffset: 12, shadowWidth: 0.55, shadowHeight: 5 },
    planter:        { file: 'assets/props/planter.png',        height: 84 },
    lamp:           { file: 'assets/props/lamp.png',           height: 340, anchorX: 16, lightAt: { x: 56, y: 22 } } // lightAt: % of the lamp image where the bulb is
  },
  props: {
    lampsAtJoins: true,        // a lamp post at every join between buildings (also hides seams)
    lampsAtEnds: false,        // extra lamps beyond the first and last building
    plantersBesideDoors: false, // planters either side of every stop's doors
    // Foreground props (move slightly faster than the buildings).
    // anchor: a building id, 'start' (open sidewalk before) or 'end' (after).
    // at: 0–1 position along that anchor.
    foreground: [
      // street furniture near the shopfronts (listed first so the trees by the curb sit in front)
      { type: 'cafe_table',     anchor: 'coffee_shop', at: 0.2 },
      { type: 'trash_can',      anchor: 'coffee_shop', at: 0.82 },
      { type: 'potted_plant',   anchor: 'wellness',    at: 0.365 }, // either side of the doors
      { type: 'potted_plant',   anchor: 'wellness',    at: 0.636 },
      { type: 'bench',          anchor: 'office',      at: 0.79 },
      // trees sit at every other join between buildings, just right of the lamp post,
      // so they frame the storefronts instead of covering them
      { type: 'tree',           anchor: 'start_2',    at: 0.05 },
      { type: 'tree_flowering', anchor: 'filler_gym',    at: 0.05 },
      { type: 'tree',           anchor: 'social',     at: 0.05 },
      { type: 'tree_flowering', anchor: 'office',     at: 0.05 },
      { type: 'tree',           anchor: 'filler_cafe',      at: 0.05 },
      { type: 'tree_flowering', anchor: 'end_3',      at: 0.05 }
    ]
  },

  /* ------------------------------------------------------------------
     Project images
     If `useOptimized` is true, the site first looks for the WebP copy made
     by tools/optimize-images.js (assets/projects/optimized/<name>.webp)
     and falls back to the original file.
     ------------------------------------------------------------------ */
  images: {
    projectsDir: 'assets/projects/',
    useOptimized: true,
    optimizedDir: 'assets/projects/optimized/'
  },

  /* ------------------------------------------------------------------
     Stops and pop-up content
     `mapLabel` is the label on the progress map at the bottom.
     `interior` is what you see behind the doors: 'warm' (gradient) or
     'image' (a blurred crop of the first project image).
     ------------------------------------------------------------------ */
  stops: [
    {
      id: 'about', mapLabel: 'About Me', timeOfDay: 'Morning', interior: 'warm',
      type: 'about',
      title: 'About Me',
      tabs: {
        introduction: {
          label: 'Introduction',
          paragraphs: [
            'My name is Kayla Pantone. I am a fourth-year student in the Bachelor of Interior Design program. My interest in interior design began at a young age, when I spent much of my free time drawing floor plans and imagining homes purely for enjoyment. That early curiosity naturally evolved into an interest in real estate, where I gained hands-on experience working alongside developers. Through this work, I was exposed to a wide range of architectural styles, interior layouts, and ways people live in and personalize their homes. Seeing such variety firsthand has been a constant source of design inspiration and has helped shape my understanding of how thoughtful design can enhance both function and feeling within a space.',
            'Working in real estate has strengthened my appreciation for the collaborative nature of design. Engaging with developers, contractors, and other professionals taught me the value of communication, adaptability, and shared problem-solving in bringing a vision to life. These experiences have deepened both my passion for and practical understanding of interior design.'
          ]
        },
        values: {
          label: 'Values and Interests',
          // icon: health | growth | independence | creativity | travel | joys
          cards: [
            { icon: 'health',       title: 'Health & Well-being',  text: 'Finding balance through fitness and self-care.' },
            { icon: 'growth',       title: 'Personal Growth',      text: 'Always learning, exploring new ideas, and finding ways to grow.' },
            { icon: 'independence', title: 'Independence',         text: 'Valuing freedom, individuality, and a growing confidence.' },
            { icon: 'creativity',   title: 'Creativity',           text: 'Expressing myself through music and creative outlets.' },
            { icon: 'travel',       title: 'Travel & Experiences', text: 'Exploring new places and making memories with friends.' },
            { icon: 'joys',         title: 'Everyday Joys',        text: 'Pilates, a good book, and new places.' }
          ]
        }
      }
    },
    {
      id: 'healthcare', mapLabel: 'Healthcare', timeOfDay: 'Midday', interior: 'image',
      type: 'project',
      title: 'Healthcare - RVH',
      subtitle: 'Royal Victoria Regional Health Centre',
      badge: 'Group Project',
      writeup: 'Collaboratively designed around the concept "The Pause Between," which reframes waiting as part of the healing journey rather than lost time. This design transforms traditional waiting into a restorative experience and shifts the focus towards what happens emotionally in the in-between. It recognizes that healing does not only begin in the exam room; it begins the moment someone arrives.',
      skills: ['SketchUp', 'Revit', 'Twinmotion', 'Google Gemini for rendering', 'Research', 'Spatial Planning', 'Accessibility Requirements'],
      documents: [
        { label: 'View Working Drawings', file: 'assets/projects/drawings/Healthcare_Working_Drawings.pdf', note: '17 sheets · PDF' }
      ],
      images: [
        { file: 'healthcare_1_waterfall.jpg', alt: 'Render of an indoor pool with a waterfall and bridge' },
        { file: 'healthcare_2_overhead.jpg',  alt: 'Overhead render of the pool and lounge levels' },
        { file: 'healthcare_4_saunas.jpg',    alt: 'Render of the barrel sauna room with the "Hot, Cold, Rest, Repeat" wall' },
        { file: 'healthcare_3_materials.jpg', alt: 'Atrium render shown with the material selection board' }
      ]
    },
    {
      id: 'hospitality', mapLabel: 'Hospitality', timeOfDay: 'Afternoon', interior: 'image',
      type: 'project',
      title: "Hospitality - Il Rametto D'Olivo",
      subtitle: 'Italian Restaurant and Bar',
      badge: 'Individual Project',
      writeup: "The client envisioned an innovative, fully accessible restaurant that is barrier-free, includes a well-appointed bar for guests, and features an updated dining room. The concept is inspired by the island of Sicily, Italy. The goal is to create an environment that encourages connection and conversation while celebrating Sicily's rich heritage, architectural beauty, and culinary culture.",
      skills: ['SketchUp', 'AutoCAD', 'Twinmotion', 'Google Gemini for rendering', 'Research', 'Spatial Planning', 'Accessibility Requirements'],
      images: [
        { file: 'hospitality_1_bar.jpg',         alt: "Render of the bar area at Il Rametto D'Olivo" },
        { file: 'hospitality_2_dining.jpg',      alt: "Render of the dining room at Il Rametto D'Olivo" },
        { file: 'hospitality_3_bubble_plan.jpg', alt: 'Preliminary bubble and flow plan for the restaurant' }
      ]
    },
    {
      id: 'office', mapLabel: 'Office', timeOfDay: 'Sunset', interior: 'image',
      type: 'project',
      title: 'Office - ModuNest',
      subtitle: '',
      badge: 'Individual Project',
      writeup: 'ModuNest is a company dedicated to sustainable living and innovative housing solutions. In response to the growing challenge of employees removing themselves from traditional office environments, the ModuNest workplace is reimagined as a self-sustaining city: a dynamic living ecosystem that seamlessly integrates technology, nature, and community.',
      skills: ['SketchUp', 'Revit', 'Twinmotion', 'Google Gemini for rendering', 'Research', 'Spatial Planning', 'Accessibility Requirements'],
      documents: [
        { label: 'View Working Drawings', file: 'assets/projects/drawings/Office_Working_Drawings.pdf', note: '11 sheets · PDF' }
      ],
      images: [
        { file: 'office_1_cafe_atrium.jpg',     alt: 'Render of the ModuNest café atrium with a moss wall and open stair' },
        { file: 'office_2_private_offices.jpg', alt: 'Render of the private office corridor with glass block walls and planters' },
        { file: 'office_3_lobby.jpg',           alt: 'Render of the ModuNest lobby with the "Shaping the future of sustainable housing" feature wall' },
        { file: 'office_4_floor_plan.jpg',      alt: 'Office level one furniture plan with program list and city sections legend' }
      ]
    },
    {
      id: 'contact', mapLabel: 'Contact', timeOfDay: 'Night', interior: 'warm',
      type: 'contact',
      title: 'Contact Information',
      name: 'Kayla Pantone',
      phone: '(705) 717-3055',
      phoneHref: 'tel:+17057173055',
      email: 'kpantone290@icloud.com',
      resume: { label: 'View My Résumé', file: 'assets/resume/Kayla_Pantone_Resume.pdf' },
      closing: 'Thanks for spending the day with me.'
    }
  ],

  /* ------------------------------------------------------------------
     Optional ambient sound (muted by default).
     No audio ships with the site. To add some, put free-to-use files in
     assets/sound/ and fill in the paths below; a sound toggle then appears.
     ------------------------------------------------------------------ */
  sound: {
    files: {
      footsteps: null, // e.g. 'assets/sound/footsteps.mp3' (looped while walking)
      ambience:  null, // e.g. 'assets/sound/cafe.mp3'      (looped background)
      chime:     null  // e.g. 'assets/sound/chime.mp3'     (plays when doors open)
    },
    volume: 0.5
  }
};
