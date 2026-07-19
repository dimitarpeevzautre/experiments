  // ---------- butterflies ----------
  const butterflies = [];
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
  }
