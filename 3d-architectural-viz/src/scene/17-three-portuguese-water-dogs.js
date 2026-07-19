  // ---------- three Portuguese water dogs ----------
  const dogs = [], splashes = [];
  const WATER_Y = PAD_H - 0.14;
  {
    const fluffGeo = blobGeometry(0.3, 1, 0.3);
    const shagGeo = blobGeometry(0.3, 1, 0.42); // rougher, wavier clumps
    // proportions and grooming referenced from the Stella Maris kennel dogs:
    // lion cut = deep flowing mane past the elbows, clipped slim hindquarters
    // and legs, thin tail carried high with a large flag; full coat = shaggy
    // wavy clumps all over with warm sun-lightened head and ear furnishings
    function makeDog(size, colors, style) { // style: 'lion' | 'full'
      const coat = new THREE.MeshStandardMaterial({ color: colors.coat, roughness: 1 });
      const clip = new THREE.MeshStandardMaterial({ color: colors.clip, roughness: 0.9 });
      const hi = new THREE.MeshStandardMaterial({ color: colors.hi, roughness: 1 });
      const g = new THREE.Group();
      const body = new THREE.Group();
      g.add(body);

      if (style === 'lion') {
        // mane: three overlapping clumps, dropping below the elbows
        const mane1 = new THREE.Mesh(shagGeo, coat);
        mane1.scale.set(1.0, 1.15, 1.1);
        mane1.position.set(0, 0.55, 0.16);
        const mane2 = new THREE.Mesh(shagGeo, coat);
        mane2.scale.set(0.88, 0.95, 0.85);
        mane2.position.set(0, 0.62, -0.08);
        const brisket = new THREE.Mesh(shagGeo, coat);
        brisket.scale.set(0.68, 0.85, 0.72);
        brisket.position.set(0, 0.36, 0.2);
        // clipped, athletic hindquarters
        const loin = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.2, 4, 10), clip);
        loin.rotation.x = Math.PI / 2;
        loin.position.set(0, 0.5, -0.28);
        const hip = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), clip);
        hip.scale.set(0.95, 1.0, 0.8);
        hip.position.set(0, 0.5, -0.38);
        body.add(mane1, mane2, brisket, loin, hip);
      } else {
        const chest = new THREE.Mesh(shagGeo, coat);
        chest.scale.set(0.98, 1.0, 1.15);
        chest.position.set(0, 0.5, 0.14);
        const back = new THREE.Mesh(shagGeo, coat);
        back.scale.set(0.9, 0.88, 1.0);
        back.position.set(0, 0.52, -0.18);
        const rump = new THREE.Mesh(shagGeo, coat);
        rump.scale.set(0.82, 0.8, 0.8);
        rump.position.set(0, 0.48, -0.36);
        body.add(chest, back, rump);
      }

      // neck ruff lifts the head clear of the shoulders
      const ruff = new THREE.Mesh(shagGeo, coat);
      ruff.scale.set(0.5, 0.55, 0.5);
      ruff.position.set(0, 0.74, 0.32);
      body.add(ruff);

      const headG = new THREE.Group();
      headG.position.set(0, 0.92, 0.44);
      const skull = new THREE.Mesh(shagGeo, style === 'full' ? hi : coat);
      skull.scale.setScalar(style === 'lion' ? 0.62 : 0.55);
      headG.add(skull);
      if (style === 'lion') { // long fringe falling over the brow
        const fringe = new THREE.Mesh(shagGeo, coat);
        fringe.scale.set(0.48, 0.4, 0.45);
        fringe.position.set(0, 0.07, 0.1);
        headG.add(fringe);
      }
      const muzzle = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.1, 3, 8), style === 'full' ? hi : coat);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, -0.06, 0.2);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), std(0x14100d, { roughness: 0.4 }));
      nose.position.set(0, -0.05, 0.29);
      headG.add(muzzle, nose);
      if (style === 'full') { // eyes visible through the wavy coat
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), std(0x1c130c, { roughness: 0.3 }));
          eye.position.set(s * 0.085, 0.03, 0.18);
          headG.add(eye);
        }
      }
      for (const s of [-1, 1]) { // long hanging ear furnishings
        const ear = new THREE.Mesh(shagGeo, style === 'full' ? hi : coat);
        ear.scale.set(0.15, 0.34, 0.16);
        ear.position.set(s * 0.2, -0.06, 0.02);
        ear.rotation.z = s * 0.15;
        headG.add(ear);
      }

      const legs = [];
      for (const [lx, lz, front] of [[-0.12, 0.24, 1], [0.12, 0.24, 1], [-0.12, -0.32, 0], [0.12, -0.32, 0]]) {
        const slim = style === 'lion';
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(slim ? 0.032 : 0.05, slim ? 0.028 : 0.042, 0.36, 6), slim ? clip : coat);
        leg.position.set(lx, 0.18, lz);
        legs.push(leg);
        body.add(leg);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(slim ? 0.045 : 0.06, 8, 6), slim ? clip : coat);
        paw.scale.set(1, 0.6, 1.25);
        paw.position.set(lx, 0.035, lz + 0.02);
        body.add(paw);
        if (!slim && front) { // shaggy forearm fluff on the full coat
          const fluff = new THREE.Mesh(fluffGeo, coat);
          fluff.scale.set(0.22, 0.3, 0.22);
          fluff.position.set(lx, 0.28, lz);
          body.add(fluff);
        }
      }

      const tailG = new THREE.Group();
      tailG.position.set(0, 0.6, -0.44);
      if (style === 'lion') { // thin shaved tail arcing high, big flag at the tip
        const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.3, 5), clip);
        stem1.rotation.x = 0.55;
        stem1.position.set(0, 0.13, -0.07);
        const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.24, 5), clip);
        stem2.rotation.x = -0.15;
        stem2.position.set(0, 0.37, -0.12);
        const flag = new THREE.Mesh(shagGeo, coat);
        flag.scale.set(0.3, 0.38, 0.26);
        flag.rotation.x = 0.5;
        flag.position.set(0, 0.58, -0.08);
        tailG.add(stem1, stem2, flag);
      } else { // fluffy tail curled over the back
        const base = new THREE.Mesh(shagGeo, coat);
        base.scale.set(0.16, 0.18, 0.34);
        base.rotation.x = -1.0;
        base.position.set(0, 0.16, -0.04);
        const plume = new THREE.Mesh(shagGeo, hi);
        plume.scale.set(0.2, 0.22, 0.3);
        plume.position.set(0, 0.34, 0.08);
        tailG.add(base, plume);
      }
      body.add(headG, tailG);
      body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.scale.setScalar(size);
      scene.add(g);
      return { g, body, headG, tailG, legs };
    }
    const specs = [
      // big black in lion cut — deep black mane, dark grey clipped rear
      { size: 1.0, colors: { coat: 0x1b1815, clip: 0x2b2724, hi: 0x1b1815 }, style: 'lion', bark: 300, x: 7, z: 9 },
      // smaller brown in lion cut
      { size: 0.8, colors: { coat: 0x6a5340, clip: 0x7d684f, hi: 0x6a5340 }, style: 'lion', bark: 480, x: 5.5, z: 10.5 },
      // young big brown in full coat — chocolate with sun-warmed furnishings
      { size: 1.05, colors: { coat: 0x553d26, clip: 0x553d26, hi: 0x7d5836 }, style: 'full', bark: 390, x: 8.5, z: 11 }
    ];
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const d = Object.assign(makeDog(s.size, s.colors, s.style), {
        i, size: s.size, barkF: s.bark,
        x: s.x, z: s.z, heading: rr(0, 6.28), state: 'play',
        tx: s.x, tz: s.z, speed: rr(1.8, 2.4),
        poolAt: 12 + i * rr(14, 22), barkAt: rr(4, 12), barkAnim: -9,
        gait: rr(0, 6.28), jump: null, swimUntil: 0, shakeT0: 0
      });
      d.g.position.set(d.x, groundHeight(d.x, d.z), d.z);
      dogs.push(d);
      if (reduceMotion) d.g.rotation.y = rr(0, 6.28);
    }
  }
  const pack = { x: 4, z: 7, next: 0 };
  function validPlaySpot(x, z) {
    if (x < -15 || x > 10 || z < -10 || z > 12) return false;
    if (poolField(x, z) < 1.2) return false;
    if (Math.hypot(x - PATIO_POS.x, z - PATIO_POS.y) < 5) return false;
    return true;
  }
  function splash(x, z, big, t) {
    const n = big ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.26, 0.36, 20),
        new THREE.MeshBasicMaterial({ color: 0xeafcfd, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, WATER_Y + 0.03 + i * 0.002, z);
      scene.add(ring);
      splashes.push({ m: ring, t0: t + i * 0.16, life: 0.9 });
    }
    if (big) {
      for (let i = 0; i < 8; i++) {
        const a = rr(0, 6.28);
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0xdcf5f6, transparent: true, opacity: 0.9 }));
        drop.position.set(x, WATER_Y + 0.1, z);
        scene.add(drop);
        splashes.push({ m: drop, t0: t, life: 1.2, vx: Math.cos(a) * rr(0.8, 2), vy: rr(2, 3.6), vz: Math.sin(a) * rr(0.8, 2) });
      }
    }
  }
  function moveToward(d, dt, speed) {
    const dx = d.tx - d.x, dz = d.tz - d.z;
    d.moving = Math.hypot(dx, dz) > 0.35 ? 1 : 0;
    if (!d.moving) return;
    let diff = Math.atan2(dx, dz) - d.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    d.heading += clamp(diff, -3 * dt, 3 * dt);
    d.x += Math.sin(d.heading) * speed * dt;
    d.z += Math.cos(d.heading) * speed * dt;
    d.g.position.x = d.x;
    d.g.position.z = d.z;
    d.g.rotation.y = d.heading;
  }
  function bark(d) {
    if (!music.ctx || !state.sound || music.ctx.state !== 'running') return;
    const ctx = music.ctx;
    const t0 = ctx.currentTime;
    const n = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const f0 = d.barkF * (0.9 + Math.random() * 0.2);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 1.7, t0 + i * 0.21);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t0 + i * 0.21 + 0.09);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f0 * 1.5;
      bp.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.21);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + i * 0.21 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.21 + 0.17);
      o.connect(bp);
      bp.connect(g);
      g.connect(music.master); // past the lowpass, so barks stay crisp
      o.start(t0 + i * 0.21);
      o.stop(t0 + i * 0.21 + 0.22);
    }
  }
