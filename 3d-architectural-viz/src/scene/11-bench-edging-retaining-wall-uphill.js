  // ---------- bench edging: retaining wall uphill, boulders at the downhill lip ----------
  {
    // dry-stone retaining wall where the patio bench cuts into the rising ground
    const wallMatA = std(C.stoneGrey, { roughness: 1 });
    const wallMatB = std(C.stoneCool, { roughness: 1 });
    for (let row = 0; row < 2; row++) {
      const n = 13 - row * 2;
      for (let i = 0; i < n; i++) {
        const th = (55 + (i + (row ? 0.5 : 0)) * (80 / (n - 1))) * Math.PI / 180;
        const wx = PATIO_POS.x + Math.cos(th) * (5.2 + row * 0.12);
        const wz = PATIO_POS.y + Math.sin(th) * (5.2 + row * 0.12);
        const st = mesh(new THREE.BoxGeometry(rr(0.5, 0.62), 0.26, rr(0.28, 0.34)),
          rand() < 0.5 ? wallMatA : wallMatB,
          wx, groundHeight(wx, wz) + 0.13 + row * 0.24, wz);
        st.rotation.y = th + Math.PI / 2 + rr(-0.08, 0.08);
        land.add(st);
      }
    }
    // weathered boulders where the bench falls away downhill of the pool
    for (const deg of [195, 220, 247]) {
      const th = deg * Math.PI / 180;
      const bx = POOL_POS.x + Math.cos(th) * 6.6, bz = POOL_POS.y + Math.sin(th) * 5.4;
      const b = mesh(blobGeometry(0.6, 1, 0.42),
        new THREE.MeshStandardMaterial({ color: C.stoneGrey, roughness: 1, flatShading: true }),
        bx, groundHeight(bx, bz) + 0.22, bz);
      b.scale.set(rr(1.0, 1.5), rr(0.6, 0.9), rr(1.0, 1.4));
      b.rotation.y = rr(0, Math.PI);
      land.add(b);
    }
  }
