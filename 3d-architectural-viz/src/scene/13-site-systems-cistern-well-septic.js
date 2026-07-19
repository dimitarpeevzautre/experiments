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

  // septic tank north of the cabin
  {
    const sx1 = 26.5, sz1 = 5.0, gy1 = groundHeight(sx1, sz1);
    const lid = std(C.lidGreen, { roughness: 0.9 });
    systems.add(mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 18), lid, sx1, gy1 + 0.05, sz1));
    const gy2 = groundHeight(sx1 + 1.4, sz1 + 1.2);
    systems.add(mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.12, 18), lid, sx1 + 1.4, gy2 + 0.05, sz1 + 1.2));
    systems.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), std(0xdad5c8), sx1 - 0.8, gy1 + 0.25, sz1 - 0.6)); // vent
    anchors.septic = new THREE.Vector3(sx1 + 0.7, gy1 + 0.35, sz1 + 0.6);
  }

  // backup generator on a pad behind the cabin, near the cistern
  {
    const gx = 19.5, gz = 17.5, gy = groundHeight(gx, gz);
    const gen = new THREE.Group();
    gen.position.set(gx, gy, gz);
    gen.add(mesh(new THREE.BoxGeometry(1.2, 0.1, 0.9), std(C.concrete, { roughness: 0.95 }), 0, 0.05, 0));
    gen.add(mesh(new THREE.BoxGeometry(0.95, 0.6, 0.65), std(0x6d6f62, { roughness: 0.7 }), 0, 0.42, 0));
    gen.add(mesh(new THREE.BoxGeometry(0.97, 0.08, 0.67), std(0x4c4e45, { roughness: 0.7 }), 0, 0.74, 0));
    gen.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 6), std(C.metal, { metalness: 0.5 }), 0.35, 0.9, -0.18));
    systems.add(gen);
    anchors.generator = new THREE.Vector3(gx, gy + 1.0, gz);
  }

  // solar + battery anchors
  {
    const roofPt = new THREE.Vector3(W / 4, 0.35 + RIDGE_H - 0.4, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), cabinYaw).add(new THREE.Vector3(CABIN_POS.x, CABIN_H, CABIN_POS.y));
    anchors.solar = roofPt;
    anchors.battery = batteryAnchor;
  }
