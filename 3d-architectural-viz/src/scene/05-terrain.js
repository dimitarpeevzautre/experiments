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

  // grass surface with vertex-colour mottling, repaintable per season
  let grassGeo;
  {
    const seg = 168;
    grassGeo = new THREE.PlaneGeometry(PLOT_X, PLOT_Z, seg, Math.round(seg * PLOT_Z / PLOT_X));
    grassGeo.rotateX(-Math.PI / 2);
    const pos = grassGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
    grassGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    grassGeo.computeVertexNormals();
    const gm = new THREE.Mesh(grassGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
    gm.receiveShadow = true;
    land.add(gm);
  }
  const GRASS_PAL = {
    spring: { a: C.grass, b: C.grassDry, c: C.grassLush, sand: C.sand },
    summer: { a: 0x8fae5e, b: 0xa8b36a, c: 0x6f9a4d, sand: C.sand },
    autumn: { a: 0xafa15e, b: 0xc2ab63, c: 0x94914f, sand: C.sand },
    winter: { a: 0xe8ecef, b: 0xdde4e9, c: 0xd8e0e6, sand: 0xd8d2c0 }
  };
  function paintGrass(season) {
    const p = GRASS_PAL[season];
    const cA = new THREE.Color(p.a), cB = new THREE.Color(p.b),
      cC = new THREE.Color(p.c), cS = new THREE.Color(p.sand), out = new THREE.Color();
    const pos = grassGeo.attributes.position;
    const colors = grassGeo.attributes.color;
    const snow = season === 'winter';
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const n = 0.5 + 0.5 * Math.sin(x * 0.55 + 2.0) * Math.cos(z * 0.48 - 1.0)
        + 0.22 * Math.sin(x * 1.7) * Math.sin(z * 1.3);
      out.copy(cA).lerp(cB, clamp(n * (snow ? 0.3 : 0.55), 0, 1));
      const dPool = Math.hypot(x - POOL_POS.x, z - POOL_POS.y);
      out.lerp(cC, (snow ? 0.2 : 0.45) * (1 - smoothstep(4, 10, dPool)));
      // sandy basin inside and around the pool rim
      const f = poolField(x, z);
      out.lerp(cS, 1 - smoothstep(0.94, 1.12, f));
      const edge = Math.min(HALF_X - Math.abs(x), HALF_Z - Math.abs(z));
      out.lerp(cB, (snow ? 0.15 : 0.35) * (1 - smoothstep(0, 3.5, edge)));
      colors.setXYZ(i, out.r, out.g, out.b);
    }
    colors.needsUpdate = true;
  }
  paintGrass('spring');

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
