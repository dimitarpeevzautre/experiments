  // ---------- helpers ----------
  function std(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.95, metalness: 0 }, opts || {}));
  }
  function mesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function blobGeometry(radius, detail, jitter) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const n = v.clone().normalize();
      const j = 1 + (Math.sin(v.x * 7.1) * Math.sin(v.y * 6.3) * Math.sin(v.z * 5.7)) * jitter;
      v.copy(n.multiplyScalar(radius * j));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
