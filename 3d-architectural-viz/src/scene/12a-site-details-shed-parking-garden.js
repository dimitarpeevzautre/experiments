  // ---------- site details: firewood shed, parking pad, gravity-drip garden ----------
  const GARDEN_POS = new THREE.Vector2(11.5, -2.8);
  {
    // firewood shed: open lean-to east of the cabin, feeding the wood stove
    const shed = new THREE.Group();
    const sx = 27.2, sz = 13, sgy = groundHeight(sx, sz);
    shed.position.set(sx, sgy, sz);
    const postMat = std(C.timberDark, { roughness: 0.9 });
    for (const [px, pz, ph] of [[-0.5, -1.1, 1.55], [-0.5, 1.1, 1.55], [0.5, -1.1, 1.25], [0.5, 1.1, 1.25]]) {
      shed.add(mesh(new THREE.BoxGeometry(0.09, ph, 0.09), postMat, px, ph / 2, pz));
    }
    const shedRoof = mesh(new THREE.BoxGeometry(1.45, 0.06, 2.5), std(C.roofEdge, { roughness: 0.8 }), 0, 1.48, 0);
    shedRoof.rotation.z = -0.21;
    shed.add(shedRoof);
    shed.add(mesh(new THREE.BoxGeometry(1.1, 0.1, 2.3), std(C.stoneGrey), 0, 0.05, 0)); // gravel base
    // stacked logs, ends facing the cabin
    const logMat = std(0x6e523a, { roughness: 1 });
    const endMat = std(0xc9ac82, { roughness: 1 });
    let ly = 0.18;
    for (let row = 0; row < 4; row++) {
      const n = 6 - (row > 2 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const r = rr(0.06, 0.09);
        const log = mesh(new THREE.CylinderGeometry(r, r, 0.85, 8), logMat, rr(-0.06, 0.06), ly, -0.95 + i * 0.38 + (row % 2) * 0.17);
        log.rotation.z = Math.PI / 2;
        shed.add(log);
        const end = mesh(new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.02, 8), endMat, log.position.x - 0.43, ly, log.position.z);
        end.rotation.z = Math.PI / 2;
        end.castShadow = false;
        shed.add(end);
      }
      ly += 0.16;
    }
    shed.rotation.y = Math.PI / 2; // opening toward the cabin
    land.add(shed);
  }
  {
    // gravel parking pad just inside the gate, off the drive
    const padShape = organicShape(27, -15, 4, 2.1, 0.08);
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(padShape), std(C.pathEdge, { roughness: 1 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = groundHeight(27, -15) + 0.05;
    pad.receiveShadow = true;
    land.add(pad);
    land.add(pathRibbon([[28.6, -11.6], [27.6, -13.2], [27, -14.6]], 2.2, C.pathEdge, 0.04));
    // timber wheel stops
    for (const wz of [-15.9, -14.2]) {
      const stop = mesh(new THREE.BoxGeometry(0.18, 0.14, 1.6), std(C.timberDark, { roughness: 0.9 }), 25.6, groundHeight(25.6, wz) + 0.1, wz);
      stop.rotation.y = 0.25;
      land.add(stop);
    }
  }
  {
    // kitchen garden: four raised beds, gravity drip-fed from the cistern
    const bedWood = std(0x8a6a44, { roughness: 0.9 });
    const soil = std(0x5a462f, { roughness: 1 });
    const veg = [std(0x6f9a4d, { roughness: 1 }), std(0x557f3a, { roughness: 1 })];
    const fruit = std(0xc94f35, { roughness: 0.7 });
    const vegGeo = blobGeometry(0.14, 1, 0.35);
    for (let b = 0; b < 4; b++) {
      const bz = GARDEN_POS.y - 1.9 + b * 1.25;
      const bx = GARDEN_POS.x;
      const by = groundHeight(bx, bz);
      land.add(mesh(new THREE.BoxGeometry(2.4, 0.28, 0.85), bedWood, bx, by + 0.16, bz));
      const st = mesh(new THREE.BoxGeometry(2.24, 0.05, 0.7), soil, bx, by + 0.29, bz);
      st.castShadow = false;
      land.add(st);
      for (let i = 0; i < 6; i++) {
        const vx = bx - 1.0 + i * 0.4;
        const v = mesh(vegGeo, veg[(b + i) % 2], vx, by + 0.38, bz + rr(-0.1, 0.1));
        v.scale.setScalar(rr(0.7, 1.3) * (b === 2 ? 1.5 : 1));
        land.add(v);
        if (b === 2 && i % 2 === 0) {
          land.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), fruit, vx + 0.08, by + 0.42, bz + 0.08));
        }
      }
    }
    // buried supply line from the cistern, surfacing at the bed manifold
    const pipePts = [
      new THREE.Vector3(23.2, 0, 16.6), new THREE.Vector3(19, 0, 10),
      new THREE.Vector3(15.5, 0, 3), new THREE.Vector3(13, 0, -1.2),
      new THREE.Vector3(GARDEN_POS.x + 1.4, 0, GARDEN_POS.y - 1.9)
    ];
    for (const p of pipePts) p.y = groundHeight(p.x, p.z) + 0.045;
    const drip = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pipePts), 40, 0.045, 6),
      std(0x4a4640, { roughness: 0.8 })
    );
    drip.castShadow = false;
    land.add(drip);
    // manifold riser + tap at the beds
    const mx = GARDEN_POS.x + 1.4, mz = GARDEN_POS.y - 1.9, mgy = groundHeight(mx, mz);
    land.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), std(0x4a4640), mx, mgy + 0.25, mz));
    land.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), std(0x2f6f8f, { roughness: 0.5 }), mx, mgy + 0.52, mz));
  }
