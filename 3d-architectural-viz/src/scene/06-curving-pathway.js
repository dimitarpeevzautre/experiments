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
