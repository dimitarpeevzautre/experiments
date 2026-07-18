/* CAROLINE — 40 × 60 m site · isometric architectural visualization
   Terrain, timber cabin, natural pool, cherry grove, site systems.
   Deterministic layout (seeded PRNG) so every visit renders the same estate. */
(function () {
  'use strict';

  // ---------- seeded randomness ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(1937);
  const rr = (lo, hi) => lo + rand() * (hi - lo);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- palette ----------
  const C = {
    grass: 0xa9b168, grassDry: 0xbcae66, grassLush: 0x8ba15c,
    earth: 0xa8865a, earthDark: 0x8a6b45, slabRim: 0x97794f,
    path: 0xcbb894, pathEdge: 0xb7a37e,
    stone: 0xcdbfa6, stoneWarm: 0xd8c9ae, stoneCool: 0xbfb49f, stoneGrey: 0xaaa28e,
    timber: 0x7b4b2a, timberDark: 0x5f381f, frame: 0x40342a,
    roof: 0x5c534a, roofEdge: 0x46403a,
    glass: 0xbfe0e2, water: 0x5fc3ca, waterDeep: 0x358d95, sand: 0xcabe97,
    trunk: 0x5b4032,
    blossomA: 0xf8ccd8, blossomB: 0xf1a6bc, blossomC: 0xe484a1,
    leaf: 0x6f8f4e, leafDark: 0x55703c, reed: 0x7a8f4b,
    panel: 0x2e4a6b, panelFrame: 0x9aa0a8,
    concrete: 0xb9b3a4, lidGreen: 0x77855a,
    cushion: 0xe8ddc8, metal: 0x6d675e,
    label: '#4a3526', labelBg: 'rgba(247, 240, 228, 0.92)'
  };

  // ---------- renderer / scene / camera ----------
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
  const view = {
    size: 24.5,          // half-height of the ortho frustum, metres
    azimuth: -Math.PI / 4,
    elevation: 0.56,     // radians
    target: new THREE.Vector3(0, 1.6, 1.5)
  };
  const viewGoal = {
    size: view.size, azimuth: view.azimuth, elevation: view.elevation,
    target: view.target.clone()
  };
  const HOME = { size: view.size, azimuth: view.azimuth, elevation: view.elevation, target: view.target.clone() };

  function fitFactor() {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    // portrait screens fit by height, which would crop the 60 m axis badly —
    // widen the frame as the viewport narrows
    return aspect < 1.3 ? clamp(1.3 / aspect, 1, 2.6) : 1;
  }

  function applyCamera() {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const s = view.size * fitFactor();
    camera.left = -s * aspect;
    camera.right = s * aspect;
    camera.top = s;
    camera.bottom = -s;
    const r = 120;
    const ce = Math.cos(view.elevation), se = Math.sin(view.elevation);
    camera.position.set(
      view.target.x + r * Math.sin(view.azimuth) * ce,
      view.target.y + r * se,
      view.target.z + r * Math.cos(view.azimuth) * ce
    );
    camera.lookAt(view.target);
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    applyCamera();
  }
  window.addEventListener('resize', resize);

  // ---------- lighting: golden hour ----------
  const sun = new THREE.DirectionalLight(0xffd9a4, 2.6);
  sun.position.set(-52, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -46; sun.shadow.camera.right = 46;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  scene.add(new THREE.HemisphereLight(0xffe4c2, 0x6b7c4a, 0.55));
  scene.add(new THREE.AmbientLight(0xb9c8d8, 0.32));
  const rim = new THREE.DirectionalLight(0xcfe0ee, 0.35); // cool fill from the hazy east
  rim.position.set(48, 22, -30);
  scene.add(rim);

  // ---------- terrain ----------
  // Plot is 60 m (x) by 40 m (z), centred on the origin.
  // Gentle rise toward the cabin corner (+x, −z); pads flatten around built areas.
  const PLOT_X = 60, PLOT_Z = 40, HALF_X = 30, HALF_Z = 20;
  // cabin (8 m long × 6 m wide) sits 5 m off the right (x=+30) and near (z=+20)
  // edges, ridge aligned with the plot's long (60 m) edge
  const CABIN_POS = new THREE.Vector2(21.0, 12.0);
  const POOL_POS = new THREE.Vector2(3.5, 1.5);
  const PATIO_POS = new THREE.Vector2(10.5, 7.0);

  // corner heights: cabin corner (+30,+20) is highest at +4 m, the two adjacent
  // corners sit 2 m lower, and the far corner (−30,−20) is lowest at 0 —
  // a constant bilinear fall of 4 m along the diagonal
  function baseHeight(x, z) {
    const sx = (x + HALF_X) / PLOT_X;
    const sz = (z + HALF_Z) / PLOT_Z;
    let h = 2.0 * sx + 2.0 * sz;
    h += 0.14 * Math.sin(x * 0.23 + 1.7) * Math.cos(z * 0.31 + 0.4);
    h += 0.07 * Math.sin(x * 0.61 - z * 0.43);
    return h;
  }
  const PAD_H = baseHeight(PATIO_POS.x, PATIO_POS.y);
  const CABIN_H = baseHeight(CABIN_POS.x, CABIN_POS.y);
  const pads = [
    { x: CABIN_POS.x, z: CABIN_POS.y, r: 9.5, h: CABIN_H },
    { x: PATIO_POS.x, z: PATIO_POS.y, r: 8.5, h: PAD_H },
    { x: POOL_POS.x, z: POOL_POS.y, r: 8.0, h: PAD_H }
  ];
  // organic pool boundary, shared by the shape, the terrain depression and colouring.
  // In world space (after the flat meshes' rotation.x = -PI/2): x = cx + cos(a)*r*1.35, z = cz - sin(a)*r
  const POOL_BASE = 3.6, POOL_WOBBLE = 0.22;
  function poolBoundaryR(a) {
    return POOL_BASE * (1 + POOL_WOBBLE * Math.sin(a * 3 + 1.3) + POOL_WOBBLE * 0.6 * Math.sin(a * 5 - 0.6));
  }
  function poolField(x, z) { // <1 inside the pool, ~1 at the rim
    const u = (x - POOL_POS.x) / 1.35, v = z - POOL_POS.y;
    const d = Math.hypot(u, v);
    const rb = poolBoundaryR(Math.atan2(v, u));
    return d / rb;
  }
  function groundHeight(x, z) {
    let h = baseHeight(x, z);
    for (const p of pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      const m = 1 - smoothstep(p.r * 0.45, p.r, d);
      h = lerp(h, p.h, m);
    }
    const f = poolField(x, z);
    h -= 0.95 * (1 - smoothstep(0.55, 1.02, f));
    return h;
  }

  const land = new THREE.Group();
  scene.add(land);

  // grass surface with vertex-colour mottling
  {
    const seg = 168;
    const geo = new THREE.PlaneGeometry(PLOT_X, PLOT_Z, seg, Math.round(seg * PLOT_Z / PLOT_X));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(C.grass), cB = new THREE.Color(C.grassDry),
      cC = new THREE.Color(C.grassLush), out = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, groundHeight(x, z));
      const n = 0.5 + 0.5 * Math.sin(x * 0.55 + 2.0) * Math.cos(z * 0.48 - 1.0)
        + 0.22 * Math.sin(x * 1.7) * Math.sin(z * 1.3);
      out.copy(cA).lerp(cB, clamp(n * 0.55, 0, 1));
      const dPool = Math.hypot(x - POOL_POS.x, z - POOL_POS.y);
      out.lerp(cC, 0.45 * (1 - smoothstep(4, 10, dPool)));
      // sandy basin inside and around the pool rim
      const f = poolField(x, z);
      out.lerp(new THREE.Color(C.sand), 1 - smoothstep(0.94, 1.12, f));
      const edge = Math.min(HALF_X - Math.abs(x), HALF_Z - Math.abs(z));
      out.lerp(cB, 0.35 * (1 - smoothstep(0, 3.5, edge)));
      colors[i * 3] = out.r; colors[i * 3 + 1] = out.g; colors[i * 3 + 2] = out.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    land.add(mesh);
  }

  // earthen skirt + strata lines, following the sloped rim
  {
    const DEPTH = 3.0, N = 160;
    const ring = [];
    for (let i = 0; i < N; i++) { // rectangle perimeter, CCW seen from above
      const t = i / N * 4;
      let x, z;
      if (t < 1) { x = -HALF_X + t * PLOT_X; z = HALF_Z; }
      else if (t < 2) { x = HALF_X; z = HALF_Z - (t - 1) * PLOT_Z; }
      else if (t < 3) { x = HALF_X - (t - 2) * PLOT_X; z = -HALF_Z; }
      else { x = -HALF_X; z = -HALF_Z + (t - 3) * PLOT_Z; }
      ring.push([x, z]);
    }
    const verts = [], norms = [], cols = [];
    const cTop = new THREE.Color(C.slabRim), cMid = new THREE.Color(C.earth),
      cBot = new THREE.Color(C.earthDark);
    function skirtColor(f) { // f: 0 top → 1 bottom
      const c = f < 0.35 ? cTop.clone().lerp(cMid, f / 0.35) : cMid.clone().lerp(cBot, (f - 0.35) / 0.65);
      return c;
    }
    for (let i = 0; i < N; i++) {
      const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % N];
      const y0 = groundHeight(x0, z0), y1 = groundHeight(x1, z1);
      // outward normal: from the plot centre toward the segment midpoint
      const nx = (x0 + x1) / 2, nz = (z0 + z1) / 2;
      const nl = Math.hypot(nx, nz) || 1;
      const rows = [[0, y0, y1], [1, -DEPTH, -DEPTH]];
      // two triangles per segment
      const quads = [
        [x0, y0, z0, 0], [x1, y1, z1, 0], [x1, -DEPTH, z1, 1],
        [x0, y0, z0, 0], [x1, -DEPTH, z1, 1], [x0, -DEPTH, z0, 1]
      ];
      for (const [vx, vy, vz, f] of quads) {
        verts.push(vx, vy, vz);
        norms.push(nx / nl, 0, nz / nl);
        const c = skirtColor(f === 0 ? 0 : 1);
        // horizontal strata banding
        const band = 0.5 + 0.5 * Math.sin(vy * 5.2 + Math.sin(vx * 0.4) * 0.8);
        const cc = c.clone().offsetHSL(0, 0, (band - 0.5) * 0.045);
        cols.push(cc.r, cc.g, cc.b);
      }
      void rows;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
    land.add(new THREE.Mesh(geo, mat));
    // bottom cap
    const cap = new THREE.Mesh(
      new THREE.PlaneGeometry(PLOT_X, PLOT_Z),
      new THREE.MeshStandardMaterial({ color: C.earthDark, roughness: 1, side: THREE.DoubleSide })
    );
    cap.rotateX(Math.PI / 2);
    cap.position.y = -DEPTH;
    land.add(cap);
  }

  // ---------- curving pathway ----------
  function pathRibbon(points2, width, color, yLift) {
    const pts = points2.map(p => new THREE.Vector3(p[0], 0, p[1]));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const N = 140, verts = [], norms = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = curve.getPoint(t), tan = curve.getTangent(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const w = width * (0.85 + 0.15 * Math.sin(t * 21 + 2));
      for (const s of [-1, 1]) {
        const x = p.x + side.x * w * 0.5 * s;
        const z = p.z + side.z * w * 0.5 * s;
        verts.push(x, groundHeight(x, z) + yLift, z);
        norms.push(0, 1, 0);
      }
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    mesh.receiveShadow = true;
    return mesh;
  }
  // the road runs along the north-west side (the x=+30 edge), so the drive
  // enters there, swings south of the leach field and climbs to the gable door
  const mainPath = [[30.8, -12], [26, -10.5], [21.5, -7.5], [18, -3.5], [15.5, 0.5], [14, 4], [14.5, 8], [15.8, 11.8]];
  land.add(pathRibbon(mainPath, 2.0, C.path, 0.055));
  land.add(pathRibbon(mainPath, 2.5, C.pathEdge, 0.03));
  // stone gate posts where the drive meets the road
  for (const s of [-1, 1]) {
    const px = 29.6, pz = -12 + s * 1.9;
    const gy = groundHeight(px, pz);
    land.add(mesh(new THREE.BoxGeometry(0.35, 1.05, 0.35), std(C.stoneGrey, { roughness: 1 }), px, gy + 0.5, pz));
    land.add(mesh(new THREE.BoxGeometry(0.46, 0.12, 0.46), std(C.stone, { roughness: 1 }), px, gy + 1.08, pz));
  }

  // ---------- helpers ----------
  function std(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.95, metalness: 0 }, opts || {}));
  }
  function mesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function blobGeometry(radius, detail, jitter) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const n = v.clone().normalize();
      const j = 1 + (Math.sin(v.x * 7.1) * Math.sin(v.y * 6.3) * Math.sin(v.z * 5.7)) * jitter;
      v.copy(n.multiplyScalar(radius * j));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }

  // ---------- cabin (6 m × 8 m, to scale) ----------
  const W = 6, L = 8, WALL_H = 2.7, RIDGE_H = 4.7, OVER = 0.55;
  const cabin = new THREE.Group();
  const cabinYaw = -Math.PI / 2; // glazed gable faces down-plot toward the pool
  cabin.position.set(CABIN_POS.x, CABIN_H, CABIN_POS.y);
  cabin.rotation.y = cabinYaw;
  scene.add(cabin);

  // wood siding texture (vertical planks)
  function sidingTexture() {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#7b4b2a'; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 18) {
      const shade = 0.85 + rand() * 0.3;
      g.fillStyle = `rgba(${Math.round(123 * shade)},${Math.round(75 * shade)},${Math.round(42 * shade)},1)`;
      g.fillRect(x, 0, 16, 256);
      g.fillStyle = 'rgba(50,28,14,0.55)';
      g.fillRect(x + 16, 0, 2, 256);
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    return tx;
  }
  const sidingTx = sidingTexture();
  function sidingMat(repX, repY) {
    const t = sidingTx.clone();
    t.needsUpdate = true;
    t.repeat.set(repX, repY);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  }

  const wallMats = [];
  function wallMat(repX, repY) { const m = sidingMat(repX, repY); wallMats.push(m); return m; }

  // floor slab + deck
  cabin.add(mesh(new THREE.BoxGeometry(W + 0.4, 0.35, L + 0.4), std(C.stoneGrey), 0, 0.175, 0));
  cabin.add(mesh(new THREE.BoxGeometry(W - 0.2, 0.08, L - 0.2), std(0x9a6b40, { roughness: 0.8 }), 0, 0.39, 0));

  const wallsGroup = new THREE.Group();
  cabin.add(wallsGroup);

  // side walls (local x = width, z = length; front gable at +z)
  const sideWallGeo = new THREE.BoxGeometry(0.14, WALL_H, L);
  wallsGroup.add(mesh(sideWallGeo, wallMat(1.9, 1), -W / 2 + 0.07, 0.35 + WALL_H / 2, 0));
  wallsGroup.add(mesh(sideWallGeo.clone(), wallMat(1.9, 1), W / 2 - 0.07, 0.35 + WALL_H / 2, 0));

  // back gable wall: rectangle + triangle
  function gableShape() {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, WALL_H);
    s.lineTo(0, RIDGE_H); s.lineTo(-W / 2, WALL_H); s.closePath();
    return s;
  }
  {
    const geo = new THREE.ExtrudeGeometry(gableShape(), { depth: 0.14, bevelEnabled: false });
    const m = mesh(geo, wallMat(0.24, 0.5), 0, 0.35, -L / 2); // extrude UVs are in metres
    wallsGroup.add(m);
  }

  // front gable: fully glazed with dark mullions
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: C.glass, transparent: true, opacity: 0.32, roughness: 0.08,
    metalness: 0, side: THREE.DoubleSide
  });
  {
    const front = new THREE.Group();
    front.position.set(0, 0.35, L / 2);
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(gableShape()), glassMat);
    glass.position.z = 0.02;
    front.add(glass);
    const fm = std(C.frame, { roughness: 0.6 });
    // perimeter + rake frame
    function bar(x0, y0, x1, y1, th) {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const b = mesh(new THREE.BoxGeometry(th, len, 0.12), fm, (x0 + x1) / 2, (y0 + y1) / 2, 0.03);
      b.rotation.z = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2;
      return b;
    }
    front.add(bar(-W / 2, 0, -W / 2, WALL_H, 0.12));
    front.add(bar(W / 2, 0, W / 2, WALL_H, 0.12));
    front.add(bar(-W / 2, WALL_H, 0, RIDGE_H, 0.12));
    front.add(bar(W / 2, WALL_H, 0, RIDGE_H, 0.12));
    front.add(bar(-W / 2, 0.05, W / 2, 0.05, 0.12));
    // vertical mullions + transom
    for (const mx of [-2, -0.7, 0.7, 2]) front.add(bar(mx, 0, mx, WALL_H, 0.09));
    front.add(bar(-W / 2, WALL_H, W / 2, WALL_H, 0.1));
    front.add(bar(-1.4, WALL_H, -1.4, RIDGE_H - (1.4 / (W / 2)) * (RIDGE_H - WALL_H) * 0 + 0, 0));
    // door leaf (between mullions -0.7..0.7): slightly open feel via handle
    const door = mesh(new THREE.BoxGeometry(1.3, 2.15, 0.06), std(C.timberDark, { roughness: 0.7 }), 0, 1.12, 0.06);
    front.add(door);
    front.add(mesh(new THREE.BoxGeometry(0.03, 0.3, 0.05), std(C.metal, { metalness: 0.6, roughness: 0.4 }), 0.5, 1.1, 0.12));
    wallsGroup.add(front);
  }

  // roof
  const roofGroup = new THREE.Group();
  cabin.add(roofGroup);
  const roofSlope = (RIDGE_H - WALL_H) / (W / 2);
  const EAVE_Y = RIDGE_H - roofSlope * (W / 2 + OVER);
  const slopeLen = Math.hypot(W / 2 + OVER, RIDGE_H - EAVE_Y);
  const roofPitch = Math.atan(roofSlope);
  function roofPlane(sign) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(slopeLen + 0.15, 0.12, L + OVER * 2), std(C.roof, { roughness: 0.7 })));
    // standing seams
    for (let i = -4; i <= 4; i++) {
      g.add(mesh(new THREE.BoxGeometry(slopeLen + 0.1, 0.03, 0.05), std(C.roofEdge), 0, 0.075, i * (L + OVER * 2) / 9.2));
    }
    // fascia along the eave
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.22, L + OVER * 2), std(0xe8dfd0, { roughness: 0.85 }), sign * (slopeLen / 2), -0.06, 0));
    g.rotation.z = -sign * roofPitch;
    g.position.set(sign * (W / 2 + OVER) / 2, 0.35 + (RIDGE_H + EAVE_Y) / 2 + 0.06, 0);
    return g;
  }
  roofGroup.add(roofPlane(1), roofPlane(-1));
  // ridge cap
  roofGroup.add(mesh(new THREE.BoxGeometry(0.3, 0.12, L + OVER * 2), std(C.roofEdge), 0, 0.35 + RIDGE_H + 0.1, 0));
  // flue
  roofGroup.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10), std(C.metal, { metalness: 0.5, roughness: 0.45 }), 1.4, 0.35 + RIDGE_H - m2y(1.4) + 0.6, -2.4));
  function m2y(x) { return roofSlope * x; }

  // solar arrays on both roof planes — south runs along the plot diagonal,
  // so each plane gets meaningful sun through the day
  const solarGroup = new THREE.Group();
  function solarArray(sign) {
    const g = new THREE.Group();
    const cols = 7, rows = 2, pw = 1.05, ph = 1.75, gap = 0.09;
    for (let cix = 0; cix < cols; cix++) {
      for (let riy = 0; riy < rows; riy++) {
        const panel = new THREE.Group();
        panel.add(mesh(new THREE.BoxGeometry(ph, 0.05, pw), std(C.panel, { roughness: 0.3, metalness: 0.15, emissive: 0x16273d, emissiveIntensity: 0.5 }), 0, 0.03, 0));
        panel.add(mesh(new THREE.BoxGeometry(ph + 0.05, 0.028, pw + 0.05), std(C.panelFrame, { metalness: 0.6, roughness: 0.4 }), 0, 0.005, 0));
        // cell grid lines
        for (let k = 1; k < 6; k++) {
          panel.add(mesh(new THREE.BoxGeometry(0.012, 0.056, pw - 0.06), std(0x3d5470), -ph / 2 + k * ph / 6, 0.031, 0));
        }
        panel.position.set((riy - (rows - 1) / 2) * (ph + gap), 0.15, (cix - (cols - 1) / 2) * (pw + gap));
        g.add(panel);
      }
    }
    g.rotation.z = -sign * roofPitch;
    g.position.set(sign * (W / 2 + OVER) / 2, 0.35 + (RIDGE_H + EAVE_Y) / 2 + 0.1, 0);
    return g;
  }
  solarGroup.add(solarArray(1), solarArray(-1));
  roofGroup.add(solarGroup);

  // interior, visible through the glazing / x-ray:
  // front room by the glazed gable; bathroom + bedroom along the back wall;
  // kids' mezzanine above them, open to the front room
  {
    const inter = new THREE.Group();
    cabin.add(inter);
    const y0 = 0.43;
    const MEZZ_Y = 2.28;              // underside of the mezzanine floor
    const plaster = () => { const m = std(0xe4dbc8, { roughness: 0.95 }); wallMats.push(m); return m; };

    // partition across the cabin at z = -1, with bathroom + bedroom doors
    for (const [x0, x1] of [[-3, -2.25], [-1.55, 0.2], [1.0, 3]]) {
      inter.add(mesh(new THREE.BoxGeometry(x1 - x0, MEZZ_Y, 0.1), plaster(), (x0 + x1) / 2, y0 + MEZZ_Y / 2, -1));
    }
    for (const [dx, dw] of [[-1.9, 0.7], [0.6, 0.8]]) { // door leaves, ajar
      const door = mesh(new THREE.BoxGeometry(dw, 2.05, 0.05), std(C.timberDark, { roughness: 0.7 }), dx, y0 + 1.03, -0.98);
      door.rotation.y = 0.5;
      inter.add(door);
    }
    // divider between bathroom (left, 2.1 m) and bedroom (right, 3.9 m)
    inter.add(mesh(new THREE.BoxGeometry(0.1, MEZZ_Y, 3), plaster(), -0.9, y0 + MEZZ_Y / 2, -2.5));

    // bathroom: shower tray, toilet, basin
    const white = std(0xf2efe6, { roughness: 0.4 });
    const tile = mesh(new THREE.BoxGeometry(2.0, 0.03, 2.9), std(0xcfd2cc, { roughness: 0.6 }), -1.97, y0 + 0.015, -2.5);
    tile.castShadow = false;
    inter.add(tile);
    inter.add(mesh(new THREE.BoxGeometry(0.9, 0.14, 0.9), white, -2.5, y0 + 0.07, -3.5));
    inter.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), std(C.metal, { metalness: 0.5 }), -2.9, y0 + 1.0, -3.85));
    inter.add(mesh(new THREE.BoxGeometry(0.4, 0.42, 0.55), white, -1.35, y0 + 0.21, -3.6)); // wc
    inter.add(mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.12, 12), white, -1.35, y0 + 0.48, -3.55));
    inter.add(mesh(new THREE.BoxGeometry(0.5, 0.8, 0.4), std(0x9a6b40, { roughness: 0.8 }), -2.55, y0 + 0.4, -1.45)); // vanity
    inter.add(mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.1, 12), white, -2.55, y0 + 0.85, -1.45));

    // bedroom: double bed against the back wall, nightstands
    inter.add(mesh(new THREE.BoxGeometry(1.6, 0.35, 2.0), std(0xefe7d8, { roughness: 0.95 }), 1.05, y0 + 0.18, -2.85));
    inter.add(mesh(new THREE.BoxGeometry(1.4, 0.1, 0.9), std(0xd9c9a8), 1.05, y0 + 0.4, -3.35)); // duvet fold
    inter.add(mesh(new THREE.BoxGeometry(1.6, 0.65, 0.1), std(C.timberDark), 1.05, y0 + 0.33, -3.87));
    for (const nx of [0.1, 2.0]) {
      inter.add(mesh(new THREE.BoxGeometry(0.36, 0.4, 0.36), std(0x8a5a33), nx, y0 + 0.2, -3.6));
    }

    // front room: clear entry axis from the door (x = 0) to the bedroom door.
    // Kitchenette + dining on the west side, lounge along the east wall.
    inter.add(mesh(new THREE.BoxGeometry(0.6, 0.9, 2.4), std(0x8a5a33, { roughness: 0.8 }), -2.6, y0 + 0.45, 1.4));
    inter.add(mesh(new THREE.BoxGeometry(0.66, 0.05, 2.5), std(0xd8d2c4, { roughness: 0.5 }), -2.6, y0 + 0.93, 1.4));
    inter.add(mesh(new THREE.BoxGeometry(0.4, 0.02, 0.5), std(0x9aa0a8, { metalness: 0.5, roughness: 0.3 }), -2.6, y0 + 0.955, 0.9)); // sink
    inter.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 18), std(0x9a6b40), -1.4, y0 + 0.72, 2.5));
    inter.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 8), std(C.frame), -1.4, y0 + 0.36, 2.5));
    for (const [cxp, czp] of [[-0.85, 1.9], [-1.95, 3.1]]) {
      inter.add(mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), std(C.timberDark), cxp, y0 + 0.22, czp));
    }
    // sofa against the east wall, facing the room
    inter.add(mesh(new THREE.BoxGeometry(0.75, 0.4, 1.8), std(0xc9b8a0, { roughness: 1 }), 2.28, y0 + 0.2, 1.3)); // seat
    inter.add(mesh(new THREE.BoxGeometry(0.18, 0.5, 1.8), std(0xc9b8a0, { roughness: 1 }), 2.6, y0 + 0.6, 1.3)); // back
    inter.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16), std(0x9a6b40), 1.3, y0 + 0.42, 1.3)); // coffee table
    inter.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), std(C.frame), 1.3, y0 + 0.2, 1.3));
    // floor lamp by the sofa, plant by the glazing
    inter.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), std(C.metal), 2.3, y0 + 0.7, 2.7));
    inter.add(mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 10), std(0xe8ddc8, { roughness: 1 }), 2.3, y0 + 1.45, 2.7));
    inter.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.3, 10), std(0x9c7a5c), -2.4, y0 + 0.15, 3.3));
    inter.add(mesh(blobGeometry(0.28, 1, 0.4), std(C.leaf, { roughness: 1 }), -2.4, y0 + 0.55, 3.3));
    const rug = mesh(new THREE.CircleGeometry(0.95, 24), std(0xc4a98a, { roughness: 1 }), 1.5, y0 + 0.005, 1.3);
    rug.rotation.x = -Math.PI / 2; rug.castShadow = false;
    inter.add(rug);

    // mezzanine over the back zone: floor, front railing, ladder, kids' beds
    const mezzFloorMat = std(0x9a6b40, { roughness: 0.85 });
    wallMats.push(mezzFloorMat);
    inter.add(mesh(new THREE.BoxGeometry(6, 0.12, 3.05), mezzFloorMat, 0, y0 + MEZZ_Y + 0.06, -2.48));
    const railMat = std(C.frame, { roughness: 0.7 });
    inter.add(mesh(new THREE.BoxGeometry(6, 0.06, 0.06), railMat, 0, y0 + MEZZ_Y + 0.95, -0.98));
    for (let i = 0; i <= 8; i++) {
      inter.add(mesh(new THREE.BoxGeometry(0.04, 0.85, 0.04), railMat, -2.9 + i * 0.725, y0 + MEZZ_Y + 0.52, -0.98));
    }
    // ladder up from the front room
    const ladder = new THREE.Group();
    ladder.position.set(2.55, y0, -0.9);
    ladder.rotation.x = -0.22;
    for (const s of [-1, 1]) {
      ladder.add(mesh(new THREE.BoxGeometry(0.05, 2.55, 0.05), railMat, s * 0.22, 1.27, 0));
    }
    for (let i = 1; i <= 6; i++) {
      ladder.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 6), railMat, 0, i * 0.37, 0).rotateZ(Math.PI / 2));
    }
    inter.add(ladder);
    // kids' beds on the mezzanine
    for (const [bx, pc] of [[-1.7, C.blossomB], [0.5, 0x8fb7c9]]) {
      inter.add(mesh(new THREE.BoxGeometry(0.8, 0.16, 1.6), std(0xefe7d8, { roughness: 0.95 }), bx, y0 + MEZZ_Y + 0.2, -2.9));
      inter.add(mesh(new THREE.BoxGeometry(0.55, 0.08, 0.35), std(pc, { roughness: 1 }), bx, y0 + MEZZ_Y + 0.31, -3.45));
    }

    // warm interior glow, one per level
    const bulb = new THREE.PointLight(0xffc98a, 6, 9, 2);
    bulb.position.set(0, y0 + 2.4, 1.2);
    inter.add(bulb);
    inter.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe6b8 }), 0, y0 + 2.4, 1.2));
    const bulb2 = new THREE.PointLight(0xffc98a, 2.5, 5, 2);
    bulb2.position.set(0, y0 + MEZZ_Y + 1.1, -2.4);
    inter.add(bulb2);
  }

  // battery on the east side wall
  const batteryAnchor = new THREE.Vector3();
  {
    const bat = new THREE.Group();
    bat.position.set(W / 2 + 0.12, 0.35, -1.6);
    const box = mesh(new THREE.BoxGeometry(0.22, 1.15, 0.8), std(0xe6e2d8, { roughness: 0.5, metalness: 0.1 }), 0.11, 1.05, 0);
    bat.add(box);
    bat.add(mesh(new THREE.BoxGeometry(0.24, 0.06, 0.5), std(0x3d4a3a), 0.11, 1.45, 0));
    bat.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), std(C.metal), 0.18, 0.3, 0.2));
    cabin.add(bat);
    bat.updateWorldMatrix(true, false);
    batteryAnchor.set(0.2, 1.7, 0).applyMatrix4(bat.matrixWorld);
  }

  // stone step at door
  cabin.add(mesh(new THREE.BoxGeometry(1.8, 0.18, 0.7), std(C.stone), 0, 0.09, L / 2 + 0.5));

  // ---------- natural swimming pool ----------
  function organicShape(cx, cz, lobes, base, wobble) {
    const s = new THREE.Shape();
    const pts = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const r = base * (1 + wobble * Math.sin(a * lobes + 1.3) + wobble * 0.6 * Math.sin(a * (lobes + 2) - 0.6));
      // shape y is pre-mirrored so a flat mesh with rotation.x = -PI/2 lands at world z = cz + sin(a)*r
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r * 1.35, -(cz + Math.sin(a) * r)));
    }
    s.setFromPoints(pts);
    s.closePath();
    return s;
  }
  const poolShape = organicShape(POOL_POS.x, POOL_POS.y, 3, 3.6, 0.22);
  const pool = new THREE.Group();
  scene.add(pool);
  {
    // the basin itself is carved from the terrain (see groundHeight); add a deep zone tint
    const deepShape = organicShape(POOL_POS.x + 0.4, POOL_POS.y - 0.1, 3, 2.0, 0.18);
    const deep = new THREE.Mesh(new THREE.ShapeGeometry(deepShape), std(C.waterDeep, { roughness: 0.9 }));
    deep.rotation.x = -Math.PI / 2;
    deep.position.y = PAD_H - 0.72;
    deep.receiveShadow = true;
    pool.add(deep);
    // water surface
    const water = new THREE.Mesh(
      new THREE.ShapeGeometry(poolShape),
      new THREE.MeshPhysicalMaterial({
        color: C.water, transparent: true, opacity: 0.78,
        roughness: 0.12, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = PAD_H - 0.14;
    pool.add(water);
    // gentle shimmer: two faint highlight rings animated in the loop
    // coping stones around the rim
    const rimPts = poolShape.getPoints(64);
    const stoneGeo = blobGeometry(0.5, 1, 0.35);
    const stoneCols = [C.stone, C.stoneWarm, C.stoneCool, C.stoneGrey];
    for (let i = 0; i < rimPts.length; i += 1) {
      if (rand() < 0.22) continue;
      const p = rimPts[i];
      const wz = -p.y; // undo the shape-space mirror
      const dir = new THREE.Vector2(p.x - POOL_POS.x, wz - POOL_POS.y).normalize();
      const x = p.x + dir.x * rr(0.15, 0.45), z = wz + dir.y * rr(0.15, 0.45);
      const st = mesh(stoneGeo, std(stoneCols[Math.floor(rand() * stoneCols.length)], { roughness: 1 }), x, groundHeight(x, z) + rr(0.02, 0.08), z);
      st.scale.set(rr(0.7, 1.25), rr(0.28, 0.42), rr(0.7, 1.2));
      st.rotation.y = rand() * Math.PI;
      pool.add(st);
    }
    // boulders
    for (const [bx, bz, s] of [[-1.6, 5.6, 1.5], [8.6, 3.4, 1.1], [1.5, -3.4, 0.9]]) {
      const b = mesh(blobGeometry(0.7, 1, 0.4), new THREE.MeshStandardMaterial({ color: C.stoneGrey, roughness: 1, flatShading: true }), POOL_POS.x + bx, groundHeight(POOL_POS.x + bx, POOL_POS.y + bz) + 0.18 * s, POOL_POS.y + bz);
      b.scale.setScalar(s);
      b.rotation.y = rand() * Math.PI;
      pool.add(b);
    }
    // reeds + grasses at the planted regeneration edge
    const reedMat = std(C.reed, { roughness: 1 });
    const reedDark = std(C.leafDark, { roughness: 1 });
    const catTail = std(0x6b4a2e, { roughness: 1 });
    // reed clusters hug the pool rim, placed by boundary angle
    const reedAngles = [0.5, 1.15, 2.1, 2.8, 3.7, 4.6, 5.4];
    for (const a of reedAngles) {
      const rb = poolBoundaryR(a) * rr(0.98, 1.12);
      const cxp = POOL_POS.x + Math.cos(a) * rb * 1.35, czp = POOL_POS.y + Math.sin(a) * rb;
      const n = 7 + Math.floor(rand() * 7);
      for (let i = 0; i < n; i++) {
        const h = rr(0.5, 1.35);
        const rx = cxp + rr(-0.5, 0.5), rz = czp + rr(-0.5, 0.5);
        const gy = groundHeight(rx, rz);
        const reed = mesh(new THREE.CylinderGeometry(0.015, 0.03, h, 5), rand() < 0.5 ? reedMat : reedDark, rx, gy + h / 2 - 0.05, rz);
        reed.rotation.set(rr(-0.16, 0.16), 0, rr(-0.16, 0.16));
        reed.castShadow = false;
        pool.add(reed);
        if (rand() < 0.3) {
          const tip = mesh(new THREE.CapsuleGeometry(0.035, 0.14, 3, 6), catTail, rx + reed.rotation.z * -h * 0.5, gy + h - 0.02, rz + reed.rotation.x * h * 0.5);
          tip.castShadow = false;
          pool.add(tip);
        }
      }
    }
    // lily pads + blossoms
    const padMat = std(0x5d7f3f, { roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
      const a = rr(0, Math.PI * 2), r = rr(1.2, 3.2);
      const lx = POOL_POS.x + 0.4 + Math.cos(a) * r * 1.2, lz = POOL_POS.y + Math.sin(a) * r * 0.8;
      const lp = mesh(new THREE.CylinderGeometry(rr(0.18, 0.34), rr(0.18, 0.3), 0.03, 12), padMat, lx, PAD_H - 0.125, lz);
      lp.castShadow = false;
      pool.add(lp);
      if (i % 3 === 0) {
        pool.add(mesh(new THREE.ConeGeometry(0.09, 0.12, 8), std(C.blossomB), lx + 0.1, PAD_H - 0.07, lz));
      }
    }
  }

  // ---------- flagstone patio ----------
  const patio = new THREE.Group();
  scene.add(patio);
  {
    const patioShape = organicShape(PATIO_POS.x, PATIO_POS.y, 4, 3.4, 0.12);
    const bed = new THREE.Mesh(new THREE.ShapeGeometry(patioShape), std(0xb3a68d, { roughness: 1 }));
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = PAD_H + 0.035;
    bed.receiveShadow = true;
    patio.add(bed);
    // flagstones
    const cols = [C.stone, C.stoneWarm, C.stoneCool, C.stoneGrey, 0xd2c2a2];
    const placed = [];
    let tries = 0;
    while (placed.length < 46 && tries < 900) {
      tries++;
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      const x = PATIO_POS.x + Math.cos(a) * r * 4.6, z = PATIO_POS.y + Math.sin(a) * r * 3.6;
      const dPool = Math.hypot(x - POOL_POS.x, z - POOL_POS.y);
      if (dPool < 5.2) continue;
      const size = rr(0.45, 0.85);
      if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < (p[2] + size) * 0.92)) continue;
      placed.push([x, z, size]);
      const sides = 5 + Math.floor(rand() * 3);
      const st = mesh(new THREE.CylinderGeometry(size, size * 1.04, 0.07, sides),
        std(cols[Math.floor(rand() * cols.length)], { roughness: 1 }), x, PAD_H + 0.075, z);
      st.rotation.y = rand() * Math.PI;
      st.scale.z = rr(0.75, 1);
      st.castShadow = false;
      patio.add(st);
    }
    // stepping stones from patio toward pool beach
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const x = lerp(PATIO_POS.x - 1.5, POOL_POS.x + 2.8, t), z = lerp(PATIO_POS.y + 2.0, POOL_POS.y + 1.2, t);
      const st = mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.07, 6), std(C.stoneWarm), x, groundHeight(x, z) + 0.06, z);
      st.rotation.y = rand() * Math.PI;
      patio.add(st);
    }

    // dining table + chairs
    const wood = std(0x8a5a33, { roughness: 0.75 });
    const tset = new THREE.Group();
    tset.position.set(PATIO_POS.x - 0.6, PAD_H + 0.1, PATIO_POS.y - 0.8);
    tset.rotation.y = cabinYaw + Math.PI / 2;
    tset.add(mesh(new THREE.BoxGeometry(2.0, 0.06, 0.95), wood, 0, 0.73, 0));
    for (const [lx, lz] of [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]]) {
      tset.add(mesh(new THREE.BoxGeometry(0.07, 0.72, 0.07), std(C.frame), lx, 0.36, lz));
    }
    for (let i = 0; i < 6; i++) {
      const sideC = i < 3 ? -1 : 1, k = i % 3;
      const ch = new THREE.Group();
      ch.position.set(-0.7 + k * 0.7, 0, sideC * 0.85);
      ch.add(mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), wood, 0, 0.45, 0));
      ch.add(mesh(new THREE.BoxGeometry(0.44, 0.5, 0.05), wood, 0, 0.72, sideC * 0.21));
      for (const [px, pz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
        ch.add(mesh(new THREE.BoxGeometry(0.05, 0.45, 0.05), std(C.frame), px, 0.22, pz));
      }
      tset.add(ch);
    }
    // small centrepiece
    tset.add(mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.14, 10), std(0xc9b8a0), 0.3, 0.83, 0));
    patio.add(tset);

    // two sun loungers facing the pool
    for (const k of [0, 1]) {
      const lg = new THREE.Group();
      lg.position.set(PATIO_POS.x - 3.0 - k * 1.2, PAD_H + 0.1, PATIO_POS.y + 2.0 + k * 0.7);
      lg.rotation.y = Math.atan2(POOL_POS.x - lg.position.x, POOL_POS.y - lg.position.z) + Math.PI;
      const teak = std(0x9a6b40, { roughness: 0.8 });
      lg.add(mesh(new THREE.BoxGeometry(0.62, 0.07, 1.35), teak, 0, 0.28, 0.25));
      const back = mesh(new THREE.BoxGeometry(0.62, 0.07, 0.75), teak, 0, 0.45, -0.62);
      back.rotation.x = -0.7;
      lg.add(back);
      lg.add(mesh(new THREE.BoxGeometry(0.56, 0.05, 1.3), std(C.cushion, { roughness: 1 }), 0, 0.335, 0.25));
      const bc = mesh(new THREE.BoxGeometry(0.56, 0.05, 0.7), std(C.cushion, { roughness: 1 }), 0, 0.47, -0.6);
      bc.rotation.x = -0.7;
      lg.add(bc);
      for (const [px, pz] of [[-0.26, -0.5], [0.26, -0.5], [-0.26, 0.75], [0.26, 0.75]]) {
        lg.add(mesh(new THREE.BoxGeometry(0.05, 0.26, 0.05), std(C.frame), px, 0.13, pz));
      }
      patio.add(lg);
    }

    // planters
    const potMat = std(0x9c7a5c, { roughness: 0.9 });
    const shrubG = blobGeometry(0.42, 1, 0.4);
    const spots = [[PATIO_POS.x - 3.6, PATIO_POS.y - 2.8], [PATIO_POS.x + 3.4, PATIO_POS.y - 3.4], [PATIO_POS.x - 2.4, PATIO_POS.y + 3.2]];
    for (const [px, pz] of spots) {
      patio.add(mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.5, 14), potMat, px, PAD_H + 0.3, pz));
      const sh = mesh(shrubG, std(rand() < 0.5 ? C.leaf : C.leafDark, { roughness: 1 }), px, PAD_H + 0.8, pz);
      sh.scale.setScalar(rr(0.8, 1.15));
      patio.add(sh);
    }
    // planters flanking the cabin door
    const doorW = new THREE.Vector3(0, 0, L / 2 + 1.1).applyMatrix4(cabin.matrixWorld ? new THREE.Matrix4().makeRotationY(cabinYaw) : new THREE.Matrix4());
    for (const s of [-1, 1]) {
      const off = new THREE.Vector3(s * 1.3, 0, L / 2 + 0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), cabinYaw);
      const px = CABIN_POS.x + off.x, pz = CABIN_POS.y + off.z;
      patio.add(mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.45, 14), potMat, px, CABIN_H + 0.27, pz));
      const sh = mesh(shrubG, std(C.leaf, { roughness: 1 }), px, CABIN_H + 0.75, pz);
      sh.scale.setScalar(0.85);
      patio.add(sh);
    }
    void doorW;
  }

  // ---------- cherry blossom grove (18 trees, lower half) ----------
  const grove = new THREE.Group();
  scene.add(grove);
  const treeSpots = [];
  {
    // band along the left edge climbing to the top-left corner, plus the lower-left grove
    const seeds = [
      [-27, -16], [-26.5, -9], [-27, -2], [-25.5, 5], [-26, 12], [-22, 17],
      [-15, 16.5], [-8, 17], [-1, 16.5], [7, 16], [12, 17.5], [28, 4.5],
      [-19, 12], [-13, 13.5], [-20, 4], [-16, -3], [-10, 12], [-4, 12.5]
    ];
    for (const [sx, sz] of seeds) treeSpots.push([sx + rr(-1.2, 1.2), sz + rr(-1.2, 1.2)]);
  }
  {
    const trunkMat = std(C.trunk, { roughness: 1 });
    const blossomGeo = blobGeometry(1, 2, 0.16);
    const blobsPerTree = 11;
    const totalBlobs = treeSpots.length * blobsPerTree;
    const inst = new THREE.InstancedMesh(blossomGeo,
      new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, emissive: 0xd96d8a, emissiveIntensity: 0.06 }), totalBlobs);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const cA = new THREE.Color(C.blossomA), cB = new THREE.Color(C.blossomB), cC = new THREE.Color(C.blossomC);
    let bi = 0;
    for (const [tx, tz] of treeSpots) {
      const gy = groundHeight(tx, tz);
      const height = rr(2.9, 4.2), lean = rr(-0.09, 0.09), lean2 = rr(-0.09, 0.09);
      // trunk: two segments with a gentle bend
      const t1 = mesh(new THREE.CylinderGeometry(0.13, 0.2, height * 0.62, 7), trunkMat, tx, gy + height * 0.3, tz);
      t1.rotation.set(lean, 0, lean2);
      grove.add(t1);
      const topX = tx + lean2 * height * 0.8, topZ = tz - lean * height * 0.8;
      const t2 = mesh(new THREE.CylinderGeometry(0.07, 0.13, height * 0.5, 6), trunkMat, topX, gy + height * 0.75, topZ);
      t2.rotation.set(lean * 2.2, 0, lean2 * 2.2);
      grove.add(t2);
      // a couple of visible branches
      for (let b = 0; b < 3; b++) {
        const ba = rr(0, Math.PI * 2);
        const br = mesh(new THREE.CylinderGeometry(0.035, 0.06, rr(0.9, 1.5), 5), trunkMat,
          topX + Math.cos(ba) * 0.5, gy + height * rr(0.8, 0.95), topZ + Math.sin(ba) * 0.5);
        br.rotation.set(Math.sin(ba) * rr(0.6, 1.1), 0, Math.cos(ba) * rr(0.6, 1.1));
        grove.add(br);
      }
      // canopy blobs
      const canopyR = rr(2.0, 2.7);
      for (let b = 0; b < blobsPerTree; b++) {
        const a = (b / blobsPerTree) * Math.PI * 2 + rr(-0.4, 0.4);
        const rad = b === 0 ? 0 : rr(0.25, 1) * canopyR * 0.58;
        const bx = topX + Math.cos(a) * rad;
        const bz = topZ + Math.sin(a) * rad * 0.9;
        const by = gy + height + rr(-0.1, 0.5) - rad * 0.14;
        dummy.position.set(bx, by, bz);
        dummy.scale.set(rr(0.85, 1.2) * canopyR * 0.58, rr(0.65, 0.92) * canopyR * 0.58, rr(0.85, 1.2) * canopyR * 0.58);
        dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(bi, dummy.matrix);
        const mixc = rand();
        const col = mixc < 0.45 ? cA.clone().lerp(cB, rand()) : cB.clone().lerp(cC, rand() * 0.8);
        // higher blobs catch more light; sun side slightly warmer
        col.offsetHSL(0, 0.03, clamp((by - gy - height) * 0.09, -0.03, 0.05) + (bx < tx ? 0.025 : -0.015));
        inst.setColorAt(bi, col);
        bi++;
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    grove.add(inst);
    // fallen petal carpets under a few trees
    const carpetMat = new THREE.MeshStandardMaterial({ color: C.blossomA, roughness: 1, transparent: true, opacity: 0.42 });
    for (let i = 0; i < treeSpots.length; i += 2) {
      const [tx, tz] = treeSpots[i];
      const cp = new THREE.Mesh(new THREE.CircleGeometry(rr(1.4, 2.2), 20), carpetMat);
      cp.rotation.x = -Math.PI / 2;
      cp.position.set(tx + rr(-0.4, 0.4), groundHeight(tx, tz) + 0.04, tz + rr(-0.4, 0.4));
      cp.receiveShadow = true;
      grove.add(cp);
    }
  }

  // grass tufts for texture
  {
    const tuftGeo = new THREE.ConeGeometry(0.1, 0.3, 5);
    const tuft = new THREE.InstancedMesh(tuftGeo, std(0x8a9a52, { roughness: 1 }), 140);
    const dummy = new THREE.Object3D();
    let placedT = 0, guard = 0;
    while (placedT < 140 && guard++ < 2000) {
      const x = rr(-HALF_X + 1.5, HALF_X - 1.5), z = rr(-HALF_Z + 1.5, HALF_Z - 1.5);
      if (Math.hypot(x - POOL_POS.x, z - POOL_POS.y) < 6.5) continue;
      if (Math.hypot(x - PATIO_POS.x, z - PATIO_POS.y) < 6) continue;
      if (Math.hypot(x - CABIN_POS.x, z - CABIN_POS.y) < 6.5) continue;
      dummy.position.set(x, groundHeight(x, z) + 0.1, z);
      dummy.scale.setScalar(rr(0.6, 1.5));
      dummy.rotation.y = rand() * Math.PI;
      dummy.updateMatrix();
      tuft.setMatrixAt(placedT++, dummy.matrix);
    }
    tuft.castShadow = false; tuft.receiveShadow = true;
    tuft.instanceMatrix.needsUpdate = true;
    land.add(tuft);
  }

  // ---------- site systems: cistern, well, septic ----------
  const systems = new THREE.Group();
  scene.add(systems);
  const anchors = {};

  // cistern: buried tank, concrete access lid behind the cabin
  {
    const cx = 23.5, cz = 17.0, gy = groundHeight(cx, cz);
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.28, 26), std(C.concrete, { roughness: 0.95 }), cx, gy + 0.1, cz));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 18), std(0x8f8a7c), cx + 0.4, gy + 0.28, cz - 0.2));
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.05, 0.5), std(C.metal, { metalness: 0.5 }), cx - 0.5, gy + 0.27, cz + 0.3));
    // downpipe from the cabin roof feeding the tank
    const gutterA = new THREE.Vector3(W / 2 + OVER - 0.2, 0.35 + WALL_H + 0.05, -L / 2 + 0.4)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), cabinYaw).add(new THREE.Vector3(CABIN_POS.x, CABIN_H, CABIN_POS.y));
    const pipePts = [gutterA, new THREE.Vector3(gutterA.x, gy + 0.35, gutterA.z), new THREE.Vector3(cx - 1.2, gy + 0.18, cz + 0.6)];
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pipePts), 20, 0.06, 8), std(C.metal, { metalness: 0.4, roughness: 0.5 }));
    pipe.castShadow = true;
    g.add(pipe);
    systems.add(g);
    anchors.cistern = new THREE.Vector3(cx, gy + 0.4, cz);
  }

  // borehole well: steel casing stub with a cap on a small concrete pad
  {
    const wx = -1.5, wz = -15.6, gy = groundHeight(wx, wz);
    const g = new THREE.Group();
    g.position.set(wx, gy, wz);
    g.add(mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 18), std(C.concrete, { roughness: 0.95 }), 0, 0.05, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 12), std(0x9aa0a8, { metalness: 0.55, roughness: 0.4 }), 0, 0.35, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 12), std(0x4a5058, { metalness: 0.4, roughness: 0.5 }), 0, 0.62, 0));
    // small spigot
    const sp = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 6), std(C.metal, { metalness: 0.5 }), 0.16, 0.45, 0);
    sp.rotation.z = Math.PI / 2;
    g.add(sp);
    systems.add(g);
    anchors.well = new THREE.Vector3(wx, gy + 0.7, wz);
  }

  // septic tank + leach field north of the cabin
  {
    const sx1 = 26.5, sz1 = 5.0, gy1 = groundHeight(sx1, sz1);
    const lid = std(C.lidGreen, { roughness: 0.9 });
    systems.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 18), lid, sx1, gy1 + 0.05, sz1));
    const gy2 = groundHeight(sx1 + 1.4, sz1 + 1.2);
    systems.add(mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.12, 18), lid, sx1 + 1.4, gy2 + 0.05, sz1 + 1.2));
    systems.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), std(0xdad5c8), sx1 - 0.8, gy1 + 0.25, sz1 - 0.6)); // vent
    // leach field: parallel gravel runs in slightly drier grass
    for (let i = 0; i < 4; i++) {
      const lx = 24.4 + i * 1.5;
      const run = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 7), std(0xb5ad7e, { roughness: 1, transparent: true, opacity: 0.65 }));
      run.rotation.x = -Math.PI / 2;
      const lz = -1.5;
      run.position.set(lx, groundHeight(lx, lz) + 0.045, lz);
      run.receiveShadow = true;
      systems.add(run);
    }
    anchors.septic = new THREE.Vector3(sx1 + 0.7, gy1 + 0.35, sz1 + 0.6);
    anchors.leach = new THREE.Vector3(26.6, groundHeight(26.6, -1.5) + 0.15, -1.5);
  }

  // solar + battery anchors
  {
    const roofPt = new THREE.Vector3(W / 4, 0.35 + RIDGE_H - 0.4, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), cabinYaw).add(new THREE.Vector3(CABIN_POS.x, CABIN_H, CABIN_POS.y));
    anchors.solar = roofPt;
    anchors.battery = batteryAnchor;
  }

  // ---------- system labels (toggle) ----------
  const labels = new THREE.Group();
  labels.visible = false;
  scene.add(labels);
  function makeLabel(text, anchor, liftY) {
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    const font = '500 44px Georgia, "Times New Roman", serif';
    g.font = font;
    const tw = g.measureText(text.toUpperCase()).width;
    cv.width = Math.ceil(tw + 76); cv.height = 84;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = C.labelBg;
    const r = 20, wpx = cv.width, hpx = 64, y0 = 10;
    ctx.beginPath();
    ctx.moveTo(r, y0); ctx.lineTo(wpx - r, y0); ctx.arcTo(wpx, y0, wpx, y0 + r, r);
    ctx.lineTo(wpx, y0 + hpx - r); ctx.arcTo(wpx, y0 + hpx, wpx - r, y0 + hpx, r);
    ctx.lineTo(r, y0 + hpx); ctx.arcTo(0, y0 + hpx, 0, y0 + hpx - r, r);
    ctx.lineTo(0, y0 + r); ctx.arcTo(0, y0, r, y0, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,35,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = font;
    ctx.fillStyle = C.label;
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 38, y0 + hpx / 2 + 2);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
    const scale = 2.1;
    sp.scale.set(scale * cv.width / cv.height, scale, 1);
    sp.position.copy(anchor).add(liftY instanceof THREE.Vector3 ? liftY : new THREE.Vector3(0, liftY, 0));
    sp.renderOrder = 10;
    labels.add(sp);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([anchor, sp.position.clone().add(new THREE.Vector3(0, -scale * 0.5, 0))]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x6b4a2e, transparent: true, opacity: 0.75, depthTest: false }));
    line.renderOrder = 9;
    labels.add(line);
  }
  makeLabel('Solar array 11 kWp', anchors.solar, new THREE.Vector3(-6, 2.2, 2));
  makeLabel('Battery 10 kWh', anchors.battery, new THREE.Vector3(5, 0.3, 6));
  makeLabel('Rain cistern 10 m³', anchors.cistern, new THREE.Vector3(-2, 1.6, -1));
  makeLabel('Borehole well', anchors.well, new THREE.Vector3(-3, 1.6, 1));
  makeLabel('Septic tank', anchors.septic, new THREE.Vector3(4, 0.6, 4));
  makeLabel('Leach field', anchors.leach, new THREE.Vector3(3, 1.6, 2));

  // ---------- drifting petals ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let petals = null;
  if (!reduceMotion) {
    const NP = 90;
    const pos = new Float32Array(NP * 3);
    const meta = [];
    for (let i = 0; i < NP; i++) {
      const [tx, tz] = treeSpots[Math.floor(rand() * treeSpots.length)];
      meta.push({
        x: tx + rr(-3, 3), z: tz + rr(-3, 3), y: rr(0.5, 5.5),
        vy: rr(0.12, 0.3), phase: rr(0, Math.PI * 2), amp: rr(0.2, 0.7)
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    gr.addColorStop(0, 'rgba(245,199,211,1)');
    gr.addColorStop(0.7, 'rgba(238,159,182,0.9)');
    gr.addColorStop(1, 'rgba(238,159,182,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    const ptx = new THREE.CanvasTexture(cv);
    petals = {
      meta,
      points: new THREE.Points(geo, new THREE.PointsMaterial({
        map: ptx, size: 0.28, transparent: true, depthWrite: false, sizeAttenuation: true
      }))
    };
    scene.add(petals.points);
  }

  // ---------- butterflies & birds ----------
  const butterflies = [], birds = [];
  {
    const wingR = new THREE.PlaneGeometry(0.17, 0.12);
    wingR.translate(0.095, 0, 0);
    wingR.rotateX(-Math.PI / 2);
    const wingL = new THREE.PlaneGeometry(0.17, 0.12);
    wingL.translate(-0.095, 0, 0);
    wingL.rotateX(-Math.PI / 2);
    const bodyGeo = new THREE.CapsuleGeometry(0.016, 0.1, 3, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bCols = [0xf6f1e2, 0xecd982, C.blossomB, 0xb8d4de, 0xf6f1e2, C.blossomA, 0xecd982];
    const spots = [[1, 6.5], [7.5, 4], [-3, 3.5], [-12, 10], [-20, 8.5], [5, -2], [12, 9]];
    for (let i = 0; i < spots.length; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: bCols[i], side: THREE.DoubleSide, roughness: 1 });
      const g = new THREE.Group();
      const wl = new THREE.Mesh(wingL, mat), wr = new THREE.Mesh(wingR, mat);
      const body = new THREE.Mesh(bodyGeo, std(0x3a3028));
      body.castShadow = false;
      g.add(wl, wr, body);
      scene.add(g);
      butterflies.push({
        g, wl, wr, ax: spots[i][0], az: spots[i][1],
        rx: rr(1.2, 2.6), rz: rr(1.2, 2.6),
        wx: rr(0.25, 0.5), wz: rr(0.3, 0.55), wy: rr(0.8, 1.4),
        px: rr(0, 6.28), pz: rr(0, 6.28), py: rr(0, 6.28),
        flap: rr(9, 13), fp: rr(0, 6.28)
      });
      if (reduceMotion) { // perch, wings open
        const gy = groundHeight(spots[i][0], spots[i][1]);
        g.position.set(spots[i][0], gy + 0.35, spots[i][1]);
        wl.rotation.z = -0.25; wr.rotation.z = 0.25;
      }
    }
    if (!reduceMotion) {
      const wingGeo = new THREE.BoxGeometry(0.95, 0.02, 0.2);
      wingGeo.translate(0.45, 0, 0);
      const birdMat = std(0x3d3630, { roughness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const g = new THREE.Group();
        const wr = new THREE.Mesh(wingGeo, birdMat);
        const wl = new THREE.Mesh(wingGeo, birdMat);
        wl.scale.x = -1;
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 3, 6), birdMat);
        body.rotation.x = Math.PI / 2; // capsule long axis along the flight direction
        for (const m of [wl, wr, body]) m.castShadow = false;
        g.add(wl, wr, body);
        scene.add(g);
        birds.push({
          g, wl, wr,
          cx: rr(-8, 2), cz: rr(-4, 4), r: rr(13, 19),
          w: rr(0.055, 0.085) * (i % 2 ? 1 : -1),
          h: rr(11, 15), ph: rr(0, 6.28), fp: rr(0, 6.28)
        });
      }
    }
  }

  // ---------- three Portuguese water dogs ----------
  const dogs = [], splashes = [];
  const WATER_Y = PAD_H - 0.14;
  {
    const fluffGeo = blobGeometry(0.3, 1, 0.3);
    function makeDog(size, color, style) { // style: 'lion' | 'full'
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
      const g = new THREE.Group();
      const body = new THREE.Group();
      g.add(body);
      const chest = new THREE.Mesh(fluffGeo, mat); // fluffy front half / mane
      chest.scale.set(0.95, 0.9, style === 'full' ? 1.15 : 0.95);
      chest.position.set(0, 0.5, 0.12);
      let rear;
      if (style === 'lion') { // clipped hindquarters
        rear = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.22, 4, 8), mat);
        rear.rotation.x = Math.PI / 2;
        rear.position.set(0, 0.47, -0.28);
      } else {
        rear = new THREE.Mesh(fluffGeo, mat);
        rear.scale.set(0.85, 0.8, 1.0);
        rear.position.set(0, 0.48, -0.3);
      }
      const headG = new THREE.Group();
      headG.position.set(0, 0.8, 0.42);
      const head = new THREE.Mesh(fluffGeo, mat);
      head.scale.setScalar(style === 'lion' ? 0.62 : 0.55);
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.18), mat);
      muzzle.position.set(0, -0.05, 0.2);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), std(0x141210));
      nose.position.set(0, -0.03, 0.3);
      headG.add(head, muzzle, nose);
      for (const s of [-1, 1]) { // floppy ears
        const ear = new THREE.Mesh(fluffGeo, mat);
        ear.scale.set(0.16, 0.3, 0.12);
        ear.position.set(s * 0.18, -0.04, 0.03);
        headG.add(ear);
      }
      const legs = [];
      const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.34, 6);
      for (const [lx, lz, front] of [[-0.11, 0.24, 1], [0.11, 0.24, 1], [-0.11, -0.3, 0], [0.11, -0.3, 0]]) {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(lx, 0.17, lz);
        legs.push(leg);
        body.add(leg);
        if (style === 'full' || (style === 'lion' && front)) { // fluffy cuffs
          const cuff = new THREE.Mesh(fluffGeo, mat);
          cuff.scale.setScalar(0.18);
          cuff.position.set(lx, 0.3, lz);
          body.add(cuff);
        }
      }
      const tailG = new THREE.Group();
      tailG.position.set(0, 0.6, -0.42);
      if (style === 'lion') { // bare tail with the classic tip puff
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.32, 5), mat);
        stem.rotation.x = 0.9;
        stem.position.set(0, 0.1, -0.1);
        const puff = new THREE.Mesh(fluffGeo, mat);
        puff.scale.setScalar(0.22);
        puff.position.set(0, 0.25, -0.2);
        tailG.add(stem, puff);
      } else {
        const tail = new THREE.Mesh(fluffGeo, mat);
        tail.scale.set(0.18, 0.2, 0.42);
        tail.rotation.x = -0.7;
        tail.position.set(0, 0.14, -0.12);
        tailG.add(tail);
      }
      body.add(chest, rear, headG, tailG);
      body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.scale.setScalar(size);
      scene.add(g);
      return { g, body, headG, tailG, legs };
    }
    const specs = [
      { size: 1.0, color: 0x211d1a, style: 'lion', bark: 300, x: 7, z: 9 },    // big black, lion cut
      { size: 0.8, color: 0x5a4530, style: 'lion', bark: 480, x: 5.5, z: 10.5 }, // smaller brown, lion cut
      { size: 1.05, color: 0x46331f, style: 'full', bark: 390, x: 8.5, z: 11 }  // young brown, full coat
    ];
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const d = Object.assign(makeDog(s.size, s.color, s.style), {
        i, size: s.size, barkF: s.bark,
        x: s.x, z: s.z, heading: rr(0, 6.28), state: 'play',
        tx: s.x, tz: s.z, speed: rr(1.8, 2.4),
        poolAt: 12 + i * rr(14, 22), barkAt: rr(4, 12), barkAnim: -9,
        gait: rr(0, 6.28), jump: null, swimUntil: 0, shakeT0: 0
      });
      d.g.position.set(d.x, groundHeight(d.x, d.z), d.z);
      dogs.push(d);
      if (reduceMotion) d.g.rotation.y = rr(0, 6.28);
    }
  }
  const pack = { x: 4, z: 7, next: 0 };
  function validPlaySpot(x, z) {
    if (x < -15 || x > 10 || z < -10 || z > 12) return false;
    if (poolField(x, z) < 1.2) return false;
    if (Math.hypot(x - PATIO_POS.x, z - PATIO_POS.y) < 5) return false;
    return true;
  }
  function splash(x, z, big, t) {
    const n = big ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.26, 0.36, 20),
        new THREE.MeshBasicMaterial({ color: 0xeafcfd, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, WATER_Y + 0.03 + i * 0.002, z);
      scene.add(ring);
      splashes.push({ m: ring, t0: t + i * 0.16, life: 0.9 });
    }
    if (big) {
      for (let i = 0; i < 8; i++) {
        const a = rr(0, 6.28);
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0xdcf5f6, transparent: true, opacity: 0.9 }));
        drop.position.set(x, WATER_Y + 0.1, z);
        scene.add(drop);
        splashes.push({ m: drop, t0: t, life: 1.2, vx: Math.cos(a) * rr(0.8, 2), vy: rr(2, 3.6), vz: Math.sin(a) * rr(0.8, 2) });
      }
    }
  }
  function moveToward(d, dt, speed) {
    const dx = d.tx - d.x, dz = d.tz - d.z;
    d.moving = Math.hypot(dx, dz) > 0.35 ? 1 : 0;
    if (!d.moving) return;
    let diff = Math.atan2(dx, dz) - d.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    d.heading += clamp(diff, -3 * dt, 3 * dt);
    d.x += Math.sin(d.heading) * speed * dt;
    d.z += Math.cos(d.heading) * speed * dt;
    d.g.position.x = d.x;
    d.g.position.z = d.z;
    d.g.rotation.y = d.heading;
  }
  function bark(d) {
    if (!music.ctx || !state.sound || music.ctx.state !== 'running') return;
    const ctx = music.ctx;
    const t0 = ctx.currentTime;
    const n = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const f0 = d.barkF * (0.9 + Math.random() * 0.2);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 1.7, t0 + i * 0.21);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t0 + i * 0.21 + 0.09);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f0 * 1.5;
      bp.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.21);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + i * 0.21 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.21 + 0.17);
      o.connect(bp);
      bp.connect(g);
      g.connect(music.master); // past the lowpass, so barks stay crisp
      o.start(t0 + i * 0.21);
      o.stop(t0 + i * 0.21 + 0.22);
    }
  }

  // ---------- generative ambient loop (WebAudio, started by the Sound chip) ----------
  const music = { ctx: null, master: null, timer: null, on: false };
  function startMusic() {
    try {
      if (!music.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1600;
        lp.connect(master);
        master.connect(ctx.destination);
        const bus = ctx.createGain();
        bus.gain.value = 1;
        bus.connect(lp);
        // gentle echo for space
        const delay = ctx.createDelay(2);
        delay.delayTime.value = 0.58;
        const fb = ctx.createGain();
        fb.gain.value = 0.32;
        const wet = ctx.createGain();
        wet.gain.value = 0.38;
        bus.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(lp);
        // low drone: root + fifth
        for (const [f, g0] of [[73.42, 0.045], [110.0, 0.028]]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          const og = ctx.createGain();
          og.gain.value = g0;
          o.connect(og);
          og.connect(lp);
          o.start();
        }
        music.ctx = ctx; music.master = master; music.bus = bus;
      }
      music.ctx.resume();
      music.master.gain.cancelScheduledValues(music.ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0.9, music.ctx.currentTime + 1.5);
      // D-major pentatonic across two octaves — never dissonant
      const POOL_NOTES = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.26, 739.99];
      const note = () => {
        if (!music.on) return;
        const ctx = music.ctx;
        const n = 1 + (Math.random() < 0.3 ? 1 : 0); // occasionally a dyad
        for (let i = 0; i < n; i++) {
          const o = ctx.createOscillator();
          o.type = Math.random() < 0.7 ? 'sine' : 'triangle';
          o.frequency.value = POOL_NOTES[Math.floor(Math.random() * POOL_NOTES.length)];
          const g = ctx.createGain();
          const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          const peak = 0.04 + Math.random() * 0.05;
          const t0 = ctx.currentTime + i * 0.25;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(peak, t0 + 1.2 + Math.random() * 1.3);
          g.gain.exponentialRampToValueAtTime(0.0004, t0 + 5 + Math.random() * 3);
          o.connect(g);
          if (pan) { pan.pan.value = Math.random() * 1.4 - 0.7; g.connect(pan); pan.connect(music.bus); }
          else g.connect(music.bus);
          o.start(t0);
          o.stop(t0 + 9);
        }
        music.timer = setTimeout(note, 1400 + Math.random() * 2600);
      };
      music.on = true;
      note();
    } catch (err) { /* audio unavailable — leave the scene silent */ }
  }
  function stopMusic() {
    music.on = false;
    if (music.timer) clearTimeout(music.timer);
    if (music.ctx && music.master) {
      music.master.gain.cancelScheduledValues(music.ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0, music.ctx.currentTime + 0.8);
      setTimeout(() => { if (!music.on && music.ctx) music.ctx.suspend(); }, 1000);
    }
  }

  // ---------- interaction ----------
  const chips = {
    roof: document.getElementById('chip-roof'),
    xray: document.getElementById('chip-xray'),
    top: document.getElementById('chip-top'),
    systems: document.getElementById('chip-systems'),
    sound: document.getElementById('chip-sound')
  };
  const state = { roof: true, xray: false, top: false, systems: false, sound: false };
  const savedView = { azimuth: view.azimuth, elevation: view.elevation, size: view.size, target: view.target.clone() };

  function refreshChips() {
    chips.roof.textContent = state.roof ? 'Roof on' : 'Roof off';
    chips.roof.classList.toggle('active', !state.roof);
    chips.xray.classList.toggle('active', state.xray);
    chips.top.classList.toggle('active', state.top);
    chips.systems.classList.toggle('active', state.systems);
    chips.sound.textContent = state.sound ? 'Sound on' : 'Sound';
    chips.sound.classList.toggle('active', state.sound);
  }
  chips.roof.addEventListener('click', () => {
    state.roof = !state.roof;
    roofGroup.visible = state.roof;
    refreshChips();
  });
  chips.xray.addEventListener('click', () => {
    state.xray = !state.xray;
    for (const m of wallMats) {
      m.transparent = state.xray;
      m.opacity = state.xray ? 0.22 : 1;
      m.depthWrite = !state.xray;
      m.needsUpdate = true;
    }
    refreshChips();
  });
  chips.top.addEventListener('click', () => {
    state.top = !state.top;
    if (state.top) {
      savedView.azimuth = viewGoal.azimuth; savedView.elevation = viewGoal.elevation;
      savedView.size = viewGoal.size; savedView.target.copy(viewGoal.target);
      viewGoal.elevation = 1.54;
      viewGoal.azimuth = -Math.PI / 2; // plan rotated 90° CCW: long axis vertical
      viewGoal.size = 32;
      viewGoal.target.set(0, 0, 1.5);
    } else {
      viewGoal.azimuth = savedView.azimuth;
      viewGoal.elevation = savedView.elevation;
      viewGoal.size = savedView.size;
      viewGoal.target.copy(savedView.target);
    }
    refreshChips();
  });
  chips.systems.addEventListener('click', () => {
    state.systems = !state.systems;
    labels.visible = state.systems;
    refreshChips();
  });
  chips.sound.addEventListener('click', () => {
    state.sound = !state.sound;
    if (state.sound) startMusic(); else stopMusic();
    refreshChips();
  });
  refreshChips();

  // controls: drag to orbit · right/shift-drag (or two-finger drag) to pan ·
  // wheel / pinch to zoom · double-click to reset
  const pointers = new Map();
  let pinchDist = 0, pinchMid = null;

  function panBy(dxPx, dyPx) {
    // move the target along the camera's screen axes; ortho makes this exact
    const s = view.size * fitFactor();
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const dxWorld = (dxPx / canvas.clientWidth) * 2 * s * aspect;
    const dyWorld = (dyPx / canvas.clientHeight) * 2 * s;
    const m = camera.matrixWorld.elements;
    viewGoal.target.addScaledVector(new THREE.Vector3(m[0], m[1], m[2]), -dxWorld);
    viewGoal.target.addScaledVector(new THREE.Vector3(m[4], m[5], m[6]), dyWorld);
    viewGoal.target.x = clamp(viewGoal.target.x, -36, 36);
    viewGoal.target.y = clamp(viewGoal.target.y, -6, 14);
    viewGoal.target.z = clamp(viewGoal.target.z, -26, 26);
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    const pan = e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (pinchDist > 0 && d > 0) {
        viewGoal.size = clamp(viewGoal.size * pinchDist / d, 9, 42);
      }
      if (pinchMid) panBy(mid.x - pinchMid.x, mid.y - pinchMid.y);
      pinchDist = d;
      pinchMid = mid;
      return;
    }
    const dxPx = e.clientX - p.x, dyPx = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (p.pan) {
      panBy(dxPx, dyPx);
      return;
    }
    viewGoal.azimuth -= dxPx / canvas.clientWidth * 3.2;
    viewGoal.elevation = clamp(viewGoal.elevation + dyPx / canvas.clientHeight * 2.2, 0.22, 1.45);
    if (state.top) { state.top = false; refreshChips(); }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    pinchDist = 0;
    pinchMid = null;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    viewGoal.size = clamp(viewGoal.size * (e.deltaY > 0 ? 1.08 : 0.925), 9, 42);
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    viewGoal.size = HOME.size;
    viewGoal.azimuth = HOME.azimuth;
    viewGoal.elevation = HOME.elevation;
    viewGoal.target.copy(HOME.target);
    if (state.top) { state.top = false; refreshChips(); }
  });

  const compass = document.getElementById('compass');

  // ---------- render loop ----------
  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    // ease camera toward goal
    const k = 1 - Math.pow(0.0015, dt);
    view.azimuth += (viewGoal.azimuth - view.azimuth) * k;
    view.elevation += (viewGoal.elevation - view.elevation) * k;
    view.size += (viewGoal.size - view.size) * k;
    view.target.lerp(viewGoal.target, k);
    applyCamera();
    // site north lies 135° clockwise of −z (along the +x/+z diagonal);
    // projected to screen, the needle's clockwise angle from screen-up is azimuth + 135°
    if (compass) compass.style.transform = `rotate(${view.azimuth * 180 / Math.PI + 135}deg)`;

    if (petals) {
      const pos = petals.points.geometry.attributes.position;
      for (let i = 0; i < petals.meta.length; i++) {
        const m = petals.meta[i];
        m.y -= m.vy * dt;
        if (m.y < 0.15) {
          m.y = rr(3.5, 6);
          const [tx, tz] = treeSpots[Math.floor(rand() * treeSpots.length)];
          m.x = tx + rr(-3, 3); m.z = tz + rr(-3, 3);
        }
        pos.setXYZ(i,
          m.x + Math.sin(t * 0.9 + m.phase) * m.amp,
          m.y + groundHeight(m.x, m.z),
          m.z + Math.cos(t * 0.7 + m.phase) * m.amp * 0.7);
      }
      pos.needsUpdate = true;
    }
    if (!reduceMotion) {
      for (const b of butterflies) {
        const x = b.ax + Math.cos(t * b.wx + b.px) * b.rx;
        const z = b.az + Math.sin(t * b.wz + b.pz) * b.rz;
        const y = groundHeight(x, z) + 1.0 + 0.45 * Math.sin(t * b.wy + b.py);
        b.g.position.set(x, y, z);
        const vx = -Math.sin(t * b.wx + b.px) * b.wx * b.rx;
        const vz = Math.cos(t * b.wz + b.pz) * b.wz * b.rz;
        b.g.rotation.y = Math.atan2(vx, vz);
        const flap = 0.15 + 0.85 * Math.abs(Math.sin(t * b.flap + b.fp));
        b.wr.rotation.z = flap;
        b.wl.rotation.z = -flap;
      }
      for (const b of birds) {
        const ang = t * b.w + b.ph;
        const x = b.cx + Math.cos(ang) * b.r;
        const z = b.cz + Math.sin(ang) * b.r;
        b.g.position.set(x, b.h + Math.sin(t * 0.4 + b.ph) * 0.9, z);
        const dir = Math.sign(b.w);
        b.g.rotation.y = Math.atan2(-Math.sin(ang) * dir, Math.cos(ang) * dir);
        b.g.rotation.z = 0.16 * dir; // gentle bank into the circle
        const flap = 0.24 + 0.16 * Math.sin(t * 2.1 + b.fp);
        b.wr.rotation.z = flap;
        b.wl.rotation.z = -flap;
      }

      // the pack picks a new spot on the lawn every few seconds
      if (t > pack.next) {
        for (let k = 0; k < 24; k++) {
          const x = rr(-15, 10), z = rr(-10, 12);
          if (validPlaySpot(x, z)) { pack.x = x; pack.z = z; break; }
        }
        pack.next = t + rr(5, 9);
      }
      for (const d of dogs) {
        d.tailG.rotation.y = Math.sin(t * 9 + d.i * 2) * 0.35; // always wagging
        if (t > d.barkAt && (d.state === 'play' || d.state === 'toPool')) {
          d.barkAt = t + rr(7, 20);
          d.barkAnim = t;
          bark(d);
        }
        d.headG.rotation.x = (t - d.barkAnim < 0.4) ? -0.45 : Math.sin(t * 2 + d.i) * 0.06;

        switch (d.state) {
          case 'play': {
            if (t > d.poolAt) {
              const a = rr(0, 6.28);
              const rb = poolBoundaryR(a);
              d.entryA = a;
              d.tx = POOL_POS.x + Math.cos(a) * rb * 1.35 * 1.18;
              d.tz = POOL_POS.y + Math.sin(a) * rb * 1.18;
              d.state = 'toPool';
              break;
            }
            d.tx = pack.x + Math.cos(t * 0.35 + d.i * 2.1) * 2.0;
            d.tz = pack.z + Math.sin(t * 0.3 + d.i * 2.1) * 2.0;
            moveToward(d, dt, d.speed);
            d.g.position.y = groundHeight(d.x, d.z) + Math.abs(Math.sin(t * 8 + d.gait)) * 0.05 * d.moving;
            break;
          }
          case 'toPool': {
            moveToward(d, dt, d.speed * 1.25);
            d.g.position.y = groundHeight(d.x, d.z) + Math.abs(Math.sin(t * 9 + d.gait)) * 0.06;
            if (!d.moving) {
              const a = d.entryA;
              const rb = poolBoundaryR(a) * 0.45;
              d.jump = {
                x0: d.x, z0: d.z, y0: groundHeight(d.x, d.z), t0: t,
                x1: POOL_POS.x + Math.cos(a) * rb * 1.35, z1: POOL_POS.y + Math.sin(a) * rb
              };
              d.state = 'jump';
            }
            break;
          }
          case 'jump': {
            const s = Math.min(1, (t - d.jump.t0) / 0.7);
            d.x = lerp(d.jump.x0, d.jump.x1, s);
            d.z = lerp(d.jump.z0, d.jump.z1, s);
            d.g.position.set(d.x, lerp(d.jump.y0, WATER_Y - 0.28, s) + Math.sin(s * Math.PI) * 1.0, d.z);
            d.g.rotation.y = Math.atan2(d.jump.x1 - d.jump.x0, d.jump.z1 - d.jump.z0);
            if (s >= 1) {
              splash(d.x, d.z, true, t);
              const a2 = rr(0, 6.28), rb2 = poolBoundaryR(a2) * rr(0.2, 0.5);
              d.tx = POOL_POS.x + Math.cos(a2) * rb2 * 1.35;
              d.tz = POOL_POS.y + Math.sin(a2) * rb2;
              d.swimUntil = t + rr(4, 7);
              d.state = 'swim';
              d.body.rotation.x = -0.12; // head up while paddling
            }
            break;
          }
          case 'swim': {
            moveToward(d, dt, 0.55);
            d.g.position.y = WATER_Y - 0.3 + Math.sin(t * 3.2 + d.i) * 0.03;
            if (t > d.swimUntil) {
              const aOut = Math.atan2(d.z - POOL_POS.y, (d.x - POOL_POS.x) / 1.35);
              const rbo = poolBoundaryR(aOut);
              d.tx = POOL_POS.x + Math.cos(aOut) * rbo * 1.35 * 1.15;
              d.tz = POOL_POS.y + Math.sin(aOut) * rbo * 1.15;
              d.state = 'exit';
            } else if (rand() < dt * 0.7) {
              splash(d.x, d.z, false, t);
            }
            break;
          }
          case 'exit': {
            moveToward(d, dt, 0.9);
            const mix = smoothstep(0.72, 1.05, poolField(d.x, d.z));
            d.g.position.y = lerp(WATER_Y - 0.3, groundHeight(d.x, d.z), mix);
            if (!d.moving) {
              d.body.rotation.x = 0;
              d.state = 'shake';
              d.shakeT0 = t;
              splash(d.x, d.z, false, t);
            }
            break;
          }
          case 'shake': {
            const age = t - d.shakeT0;
            d.g.position.y = groundHeight(d.x, d.z);
            d.body.rotation.z = Math.sin(age * 38) * 0.28 * Math.max(0, 1 - age);
            if (age > 1.1) {
              d.body.rotation.z = 0;
              d.state = 'play';
              d.poolAt = t + rr(25, 55);
            }
            break;
          }
        }
        const gaitAmp = d.state === 'swim' ? 0.25 : (d.state === 'jump' ? 0 : d.moving ? 0.55 : 0);
        d.legs.forEach((leg, li) => {
          leg.rotation.x = gaitAmp * Math.sin(t * 10 + d.gait + (li % 2) * Math.PI + (li < 2 ? 0 : Math.PI * 0.5));
        });
        if (d.state === 'jump') d.legs.forEach(leg => { leg.rotation.x = 0.7; }); // tucked
      }

      // splash rings and droplets
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        const age = (t - s.t0) / s.life;
        if (age < 0) continue;
        const drown = s.vx !== undefined && s.m.position.y < WATER_Y - 0.02;
        if (age >= 1 || drown) {
          scene.remove(s.m);
          s.m.geometry.dispose();
          s.m.material.dispose();
          splashes.splice(i, 1);
          continue;
        }
        if (s.vx !== undefined) { // droplet with simple ballistics
          s.m.position.x += s.vx * dt;
          s.m.position.z += s.vz * dt;
          s.vy -= 6.5 * dt;
          s.m.position.y += s.vy * dt;
          s.m.material.opacity = 0.9 * (1 - age);
        } else { // expanding foam ring
          const k = 1 + age * 2.8;
          s.m.scale.set(k, k, 1);
          s.m.material.opacity = 0.85 * (1 - age);
        }
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  resize();
  tick();
})();
