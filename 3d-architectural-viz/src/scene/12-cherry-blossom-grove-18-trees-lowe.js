  // ---------- cherry blossom grove (18 trees, lower half) ----------
  const grove = new THREE.Group();
  scene.add(grove);
  const treeSpots = [];
  let canopyInst = null, carpetMat = null;
  const canopyMeta = []; // per-blob randoms, kept so seasons can repaint deterministically
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
        // higher blobs catch more light; sun side slightly warmer
        canopyMeta.push({
          lo: rand() < 0.45, m: rand(),
          hl: clamp((by - gy - height) * 0.09, -0.03, 0.05) + (bx < tx ? 0.025 : -0.015)
        });
        bi++;
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    canopyInst = inst;
    grove.add(inst);
    // fallen petal carpets under a few trees
    carpetMat = new THREE.MeshStandardMaterial({ color: C.blossomA, roughness: 1, transparent: true, opacity: 0.42 });
    for (let i = 0; i < treeSpots.length; i += 2) {
      const [tx, tz] = treeSpots[i];
      const cp = new THREE.Mesh(new THREE.CircleGeometry(rr(1.4, 2.2), 20), carpetMat);
      cp.rotation.x = -Math.PI / 2;
      cp.position.set(tx + rr(-0.4, 0.4), groundHeight(tx, tz) + 0.04, tz + rr(-0.4, 0.4));
      cp.receiveShadow = true;
      grove.add(cp);
    }
  }

  const CANOPY_PAL = {
    spring: [C.blossomA, C.blossomB, C.blossomC],
    summer: [0x8ab55e, 0x639a49, 0x4b7f3a],
    autumn: [0xe8a84c, 0xd97f35, 0xb75c2a],
    winter: null // bare branches
  };
  function paintCanopy(season) {
    const pal = CANOPY_PAL[season];
    canopyInst.visible = !!pal;
    if (pal) {
      const A = new THREE.Color(pal[0]), B = new THREE.Color(pal[1]), D = new THREE.Color(pal[2]);
      const col = new THREE.Color();
      for (let i = 0; i < canopyMeta.length; i++) {
        const m = canopyMeta[i];
        col.copy(m.lo ? A : B).lerp(m.lo ? B : D, m.lo ? m.m : m.m * 0.8);
        col.offsetHSL(0, 0.03, m.hl);
        canopyInst.setColorAt(i, col);
      }
      canopyInst.instanceColor.needsUpdate = true;
    }
    // fallen carpets: blossom in spring, leaf litter in autumn
    carpetMat.visible = season === 'spring' || season === 'autumn';
    carpetMat.color.setHex(season === 'autumn' ? 0xd97f35 : C.blossomA);
    carpetMat.opacity = season === 'autumn' ? 0.5 : 0.42;
  }
  paintCanopy('spring');

  // grass tufts for texture
  let tuftMesh;
  {
    const tuftGeo = new THREE.ConeGeometry(0.1, 0.3, 5);
    const tuft = new THREE.InstancedMesh(tuftGeo, std(0x8a9a52, { roughness: 1 }), 140);
    tuftMesh = tuft;
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
