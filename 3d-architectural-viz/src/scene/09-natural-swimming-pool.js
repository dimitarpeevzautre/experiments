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
    pool.userData.deep = deep;
    // water surface with drifting ripple normals
    function rippleNormalMap() {
      const N = 128;
      const h = new Float32Array(N * N);
      for (let oct = 0; oct < 3; oct++) { // tileable value noise via wrapped soft blobs
        const count = 24 << oct, r = N / (4 << oct);
        for (let i = 0; i < count; i++) {
          const cxp = rand() * N, cyp = rand() * N, s = rand() < 0.5 ? 1 : -1;
          const amp = s * (1 / (oct + 1));
          const ir = Math.ceil(r);
          for (let dy = -ir; dy <= ir; dy++) {
            for (let dx = -ir; dx <= ir; dx++) {
              const d = Math.hypot(dx, dy) / r;
              if (d > 1) continue;
              const px = ((Math.round(cxp) + dx) % N + N) % N;
              const py = ((Math.round(cyp) + dy) % N + N) % N;
              h[py * N + px] += amp * (1 + Math.cos(d * Math.PI)) * 0.5;
            }
          }
        }
      }
      const cv = document.createElement('canvas');
      cv.width = cv.height = N;
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(N, N);
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const gx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
          const gy = h[((y + 1) % N) * N + x] - h[(((y - 1 + N) % N)) * N + x];
          const k = (y * N + x) * 4;
          img.data[k] = clamp(128 + gx * 90, 0, 255);
          img.data[k + 1] = clamp(128 + gy * 90, 0, 255);
          img.data[k + 2] = 255;
          img.data[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(1.6, 1.6);
      return tx;
    }
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: C.water, transparent: true, opacity: 0.78,
      roughness: 0.12, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2,
      normalMap: rippleNormalMap(), normalScale: new THREE.Vector2(0.4, 0.4)
    });
    const water = new THREE.Mesh(new THREE.ShapeGeometry(poolShape), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = PAD_H - 0.14;
    pool.add(water);
    pool.userData.waterMat = waterMat;
    // foam waterline hugging the rim
    {
      const pts = poolShape.getPoints(72);
      const verts = [], idx = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], wz = -p.y;
        const dir = new THREE.Vector2(p.x - POOL_POS.x, wz - POOL_POS.y).normalize();
        verts.push(p.x - dir.x * 0.24, PAD_H - 0.132, wz - dir.y * 0.24);
        verts.push(p.x + dir.x * 0.05, PAD_H - 0.128, wz + dir.y * 0.05);
      }
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = i * 2, b = ((i + 1) % n) * 2;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      const foam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0xe8fbfc, transparent: true, opacity: 0.32, depthWrite: false
      }));
      foam.renderOrder = 2;
      pool.add(foam);
      pool.userData.foam = foam;
    }
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
    pool.userData.reedMats = [reedMat, reedDark];
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
    // lily pads + blossoms (hidden when the pond is winterised)
    const lilyGroup = new THREE.Group();
    pool.add(lilyGroup);
    pool.userData.lilies = lilyGroup;
    const padMat = std(0x5d7f3f, { roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
      const a = rr(0, Math.PI * 2), r = rr(1.2, 3.2);
      const lx = POOL_POS.x + 0.4 + Math.cos(a) * r * 1.2, lz = POOL_POS.y + Math.sin(a) * r * 0.8;
      const lp = mesh(new THREE.CylinderGeometry(rr(0.18, 0.34), rr(0.18, 0.3), 0.03, 12), padMat, lx, PAD_H - 0.125, lz);
      lp.castShadow = false;
      lilyGroup.add(lp);
      if (i % 3 === 0) {
        lilyGroup.add(mesh(new THREE.ConeGeometry(0.09, 0.12, 8), std(C.blossomB), lx + 0.1, PAD_H - 0.07, lz));
      }
    }
  }
