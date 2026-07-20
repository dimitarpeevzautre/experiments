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
    color: C.glass, transparent: true, opacity: 0.32, roughness: 0.06,
    metalness: 0, side: THREE.DoubleSide,
    envMap: envMapTex, envMapIntensity: 0.9
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

  // cream corner boards frame the siding
  {
    const trim = std(0xe8dfd0, { roughness: 0.85 });
    for (const [tx, tz] of [[-W / 2 + 0.05, -L / 2 + 0.05], [W / 2 - 0.05, -L / 2 + 0.05], [-W / 2 + 0.05, L / 2 - 0.05], [W / 2 - 0.05, L / 2 - 0.05]]) {
      wallsGroup.add(mesh(new THREE.BoxGeometry(0.12, WALL_H, 0.12), trim, tx, 0.35 + WALL_H / 2, tz));
    }
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
  // half-round gutters along both eaves
  for (const sgn of [-1, 1]) {
    const gutter = mesh(new THREE.CylinderGeometry(0.055, 0.055, L + OVER * 2, 8, 1, false), std(C.metal, { metalness: 0.5, roughness: 0.4 }));
    gutter.rotation.x = Math.PI / 2;
    gutter.position.set(sgn * (W / 2 + OVER - 0.02), 0.35 + EAVE_Y + 0.02, 0);
    roofGroup.add(gutter);
  }
  // flue, above the wood stove in the front room
  roofGroup.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10), std(C.metal, { metalness: 0.5, roughness: 0.45 }), 2.3, 0.35 + RIDGE_H - m2y(2.3) + 0.6, -0.45));
  function m2y(x) { return roofSlope * x; }

  // solar arrays on both roof planes — south runs along the plot diagonal,
  // so each plane gets meaningful sun through the day
  const solarGroup = new THREE.Group();
  const panelFaceMat = std(C.panel, {
    roughness: 0.18, metalness: 0.4, emissive: 0x16273d, emissiveIntensity: 0.35,
    envMap: envMapTex, envMapIntensity: 1.1
  });
  function solarArray(sign) {
    const g = new THREE.Group();
    const cols = 7, rows = 2, pw = 1.05, ph = 1.75, gap = 0.09;
    for (let cix = 0; cix < cols; cix++) {
      for (let riy = 0; riy < rows; riy++) {
        const panel = new THREE.Group();
        panel.add(mesh(new THREE.BoxGeometry(ph, 0.05, pw), panelFaceMat, 0, 0.03, 0));
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
    // wood stove under the flue, external-air winter heat
    const stove = mesh(new THREE.BoxGeometry(0.42, 0.58, 0.38), std(0x24211e, { roughness: 0.6, metalness: 0.25 }), 2.35, y0 + 0.33, -0.45);
    inter.add(stove);
    const fireGlow = mesh(new THREE.PlaneGeometry(0.18, 0.13), new THREE.MeshBasicMaterial({ color: 0xff9a3d }), 2.13, y0 + 0.32, -0.45);
    fireGlow.rotation.y = -Math.PI / 2;
    fireGlow.castShadow = false;
    inter.add(fireGlow);
    inter.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.4, 8), std(C.metal, { metalness: 0.4, roughness: 0.5 }), 2.35, y0 + 1.82, -0.45));
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
    interiorLights.push({ light: bulb, base: 6 }, { light: bulb2, base: 2.5 });
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

  // heat pump outdoor unit on the south wall, beside the battery
  {
    const hp = new THREE.Group();
    hp.position.set(W / 2 + 0.16, 0.35, 0.8);
    hp.add(mesh(new THREE.BoxGeometry(0.3, 0.62, 0.88), std(0xdcd7ca, { roughness: 0.55 }), 0.15, 0.45, 0));
    const fan = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 18), std(0x565a56, { roughness: 0.6 }), 0.32, 0.48, -0.16);
    fan.rotation.z = Math.PI / 2;
    hp.add(fan);
    hp.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), std(C.metal), 0.12, 0.15, 0.5));
    cabin.add(hp);
  }

  // stone step at door
  cabin.add(mesh(new THREE.BoxGeometry(1.8, 0.18, 0.7), std(C.stone), 0, 0.09, L / 2 + 0.5));

  // chimney smoke, shown in winter when the wood stove carries the heating
  const smoke = { group: new THREE.Group(), puffs: [] };
  {
    const tip = new THREE.Vector3(2.3, 0.35 + RIDGE_H - roofSlope * 2.3 + 1.35, -0.45)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), cabinYaw)
      .add(new THREE.Vector3(CABIN_POS.x, CABIN_H, CABIN_POS.y));
    smoke.group.position.copy(tip);
    smoke.group.visible = false;
    scene.add(smoke.group);
    const sg = blobGeometry(0.22, 1, 0.3);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({
        color: 0xd3d7da, transparent: true, opacity: 0.4, roughness: 1
      }));
      p.castShadow = false;
      smoke.puffs.push({ m: p, age: i / 5 });
      smoke.group.add(p);
    }
  }
