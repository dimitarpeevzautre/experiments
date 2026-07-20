  // ---------- festoon lights over the patio ----------
  // strung from the cabin's front corner across two timber posts; the bulbs
  // brighten at dusk in the day cycle
  const festoonMat = new THREE.MeshStandardMaterial({
    color: 0xf3e2be, emissive: 0xffd9a0, emissiveIntensity: 0.5, roughness: 0.6
  });
  {
    const anchorA = new THREE.Vector3(17.1, CABIN_H + 0.35 + 2.75, 9.1); // cabin front corner
    const posts = [
      new THREE.Vector3(13.6, 0, 4.6),
      new THREE.Vector3(8.4, 0, 9.4)
    ];
    const postMat = std(C.timberDark, { roughness: 0.9 });
    for (const p of posts) {
      const gy = groundHeight(p.x, p.z);
      p.y = gy + 2.65;
      land.add(mesh(new THREE.BoxGeometry(0.09, 2.75, 0.09), postMat, p.x, gy + 1.375, p.z));
    }
    const bulbGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const bulbs = [];
    function stringBetween(a, b) {
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= a.distanceTo(b) * 0.09; // catenary sag
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.012, 5), std(0x35302a, { roughness: 0.8 }));
      wire.castShadow = false;
      land.add(wire);
      const n = Math.round(a.distanceTo(b) / 0.6);
      for (let i = 1; i < n; i++) {
        const pt = curve.getPoint(i / n);
        const bulb = new THREE.Mesh(bulbGeo, festoonMat);
        bulb.position.set(pt.x, pt.y - 0.07, pt.z);
        bulb.castShadow = false;
        land.add(bulb);
        bulbs.push(bulb);
      }
    }
    stringBetween(anchorA, posts[0]);
    stringBetween(posts[0], posts[1]);
  }
