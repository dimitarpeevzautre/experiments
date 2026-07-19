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
