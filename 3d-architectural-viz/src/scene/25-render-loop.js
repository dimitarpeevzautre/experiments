  // ---------- render loop ----------
  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    // ease camera toward goal
    if (state.cycle) {
      if (cycle.playing) {
        cycle.T = (cycle.T + dt * 24 / DAY_SECONDS) % 24;
        simStep(dt * 24 / DAY_SECONDS);
      }
      applyCycleVisuals(cycle.T);
      updateDash();
    }
    if (tour.on) {
      if (tour.t0 < 0) tour.t0 = t;
      const s = TOUR[tour.i];
      viewGoal.azimuth = s.az + s.drift * Math.min(1, (t - tour.t0) / s.dur);
      if (t - tour.t0 >= s.dur) {
        if (tour.i + 1 < TOUR.length) tourStep(tour.i + 1);
        else stopTour(false);
      }
    }
    if (smoke.group.visible) {
      for (const p of smoke.puffs) {
        p.age += dt * 0.18;
        if (p.age > 1) p.age -= 1;
        p.m.position.set(-p.age * 1.8 + Math.sin(t + p.age * 6) * 0.15, p.age * 3.2, p.age * 0.6);
        p.m.scale.setScalar(0.5 + p.age * 1.8);
        p.m.material.opacity = 0.42 * (1 - p.age) * (p.age < 0.08 ? p.age / 0.08 : 1);
      }
    }
    const k = 1 - Math.pow(0.0015, dt);
    view.azimuth += (viewGoal.azimuth - view.azimuth) * k;
    view.elevation += (viewGoal.elevation - view.elevation) * k;
    view.size += (viewGoal.size - view.size) * k;
    view.target.lerp(viewGoal.target, k);
    applyCamera();
    // site north lies 135° clockwise of −z (along the +x/+z diagonal);
    // projected to screen, the needle's clockwise angle from screen-up is azimuth + 135°
    if (compass) {
      compass.style.transform = walk.on
        ? `rotate(${walk.yaw * 180 / Math.PI - 45}deg)`
        : `rotate(${view.azimuth * 180 / Math.PI + 135}deg)`;
    }

    if (petals && petals.points.visible) {
      const pos = petals.points.geometry.attributes.position;
      for (let i = 0; i < petals.meta.length; i++) {
        const m = petals.meta[i];
        m.y -= m.vy * dt;
        if (m.y < 0.15) respawnParticle(m);
        pos.setXYZ(i,
          m.x + Math.sin(t * 0.9 + m.phase) * m.amp,
          m.y + groundHeight(m.x, m.z),
          m.z + Math.cos(t * 0.7 + m.phase) * m.amp * 0.7);
      }
      pos.needsUpdate = true;
    }
    if (!reduceMotion) {
      for (const b of butterflies) {
        const x = b.ax + Math.cos(t * b.wx + b.px) * b.rx;
        const z = b.az + Math.sin(t * b.wz + b.pz) * b.rz;
        const y = groundHeight(x, z) + 1.0 + 0.45 * Math.sin(t * b.wy + b.py);
        b.g.position.set(x, y, z);
        const vx = -Math.sin(t * b.wx + b.px) * b.wx * b.rx;
        const vz = Math.cos(t * b.wz + b.pz) * b.wz * b.rz;
        b.g.rotation.y = Math.atan2(vx, vz);
        const flap = 0.15 + 0.85 * Math.abs(Math.sin(t * b.flap + b.fp));
        b.wr.rotation.z = flap;
        b.wl.rotation.z = -flap;
      }
      // the pack picks a new spot on the lawn every few seconds
      if (t > pack.next) {
        for (let k = 0; k < 24; k++) {
          const x = rr(-15, 10), z = rr(-10, 12);
          if (validPlaySpot(x, z)) { pack.x = x; pack.z = z; break; }
        }
        pack.next = t + rr(5, 9);
      }
      for (const d of dogs) {
        d.tailG.rotation.y = Math.sin(t * 9 + d.i * 2) * 0.35; // always wagging
        if (t > d.barkAt && (d.state === 'play' || d.state === 'toPool')) {
          d.barkAt = t + rr(7, 20);
          d.barkAnim = t;
          bark(d);
        }
        d.headG.rotation.x = (t - d.barkAnim < 0.4) ? -0.45 : Math.sin(t * 2 + d.i) * 0.06;

        switch (d.state) {
          case 'play': {
            if (t > d.poolAt && season !== 'winter') { // pond is frozen in winter
              const a = rr(0, 6.28);
              const rb = poolBoundaryR(a);
              d.entryA = a;
              d.tx = POOL_POS.x + Math.cos(a) * rb * 1.35 * 1.18;
              d.tz = POOL_POS.y + Math.sin(a) * rb * 1.18;
              d.state = 'toPool';
              break;
            }
            d.tx = pack.x + Math.cos(t * 0.35 + d.i * 2.1) * 2.0;
            d.tz = pack.z + Math.sin(t * 0.3 + d.i * 2.1) * 2.0;
            moveToward(d, dt, d.speed);
            d.g.position.y = groundHeight(d.x, d.z) + Math.abs(Math.sin(t * 8 + d.gait)) * 0.05 * d.moving;
            break;
          }
          case 'toPool': {
            moveToward(d, dt, d.speed * 1.25);
            d.g.position.y = groundHeight(d.x, d.z) + Math.abs(Math.sin(t * 9 + d.gait)) * 0.06;
            if (!d.moving) {
              const a = d.entryA;
              const rb = poolBoundaryR(a) * 0.45;
              d.jump = {
                x0: d.x, z0: d.z, y0: groundHeight(d.x, d.z), t0: t,
                x1: POOL_POS.x + Math.cos(a) * rb * 1.35, z1: POOL_POS.y + Math.sin(a) * rb
              };
              d.state = 'jump';
            }
            break;
          }
          case 'jump': {
            const s = Math.min(1, (t - d.jump.t0) / 0.7);
            d.x = lerp(d.jump.x0, d.jump.x1, s);
            d.z = lerp(d.jump.z0, d.jump.z1, s);
            d.g.position.set(d.x, lerp(d.jump.y0, WATER_Y - 0.28, s) + Math.sin(s * Math.PI) * 1.0, d.z);
            d.g.rotation.y = Math.atan2(d.jump.x1 - d.jump.x0, d.jump.z1 - d.jump.z0);
            if (s >= 1) {
              splash(d.x, d.z, true, t);
              const a2 = rr(0, 6.28), rb2 = poolBoundaryR(a2) * rr(0.2, 0.5);
              d.tx = POOL_POS.x + Math.cos(a2) * rb2 * 1.35;
              d.tz = POOL_POS.y + Math.sin(a2) * rb2;
              d.swimUntil = t + rr(4, 7);
              d.state = 'swim';
              d.body.rotation.x = -0.12; // head up while paddling
            }
            break;
          }
          case 'swim': {
            moveToward(d, dt, 0.55);
            d.g.position.y = WATER_Y - 0.3 + Math.sin(t * 3.2 + d.i) * 0.03;
            if (t > d.swimUntil) {
              const aOut = Math.atan2(d.z - POOL_POS.y, (d.x - POOL_POS.x) / 1.35);
              const rbo = poolBoundaryR(aOut);
              d.tx = POOL_POS.x + Math.cos(aOut) * rbo * 1.35 * 1.15;
              d.tz = POOL_POS.y + Math.sin(aOut) * rbo * 1.15;
              d.state = 'exit';
            } else if (rand() < dt * 0.7) {
              splash(d.x, d.z, false, t);
            }
            break;
          }
          case 'exit': {
            moveToward(d, dt, 0.9);
            const mix = smoothstep(0.72, 1.05, poolField(d.x, d.z));
            d.g.position.y = lerp(WATER_Y - 0.3, groundHeight(d.x, d.z), mix);
            if (!d.moving) {
              d.body.rotation.x = 0;
              d.state = 'shake';
              d.shakeT0 = t;
              splash(d.x, d.z, false, t);
            }
            break;
          }
          case 'shake': {
            const age = t - d.shakeT0;
            d.g.position.y = groundHeight(d.x, d.z);
            d.body.rotation.z = Math.sin(age * 38) * 0.28 * Math.max(0, 1 - age);
            if (age > 1.1) {
              d.body.rotation.z = 0;
              d.state = 'play';
              d.poolAt = t + rr(25, 55);
            }
            break;
          }
        }
        const gaitAmp = d.state === 'swim' ? 0.25 : (d.state === 'jump' ? 0 : d.moving ? 0.55 : 0);
        d.legs.forEach((leg, li) => {
          leg.rotation.x = gaitAmp * Math.sin(t * 10 + d.gait + (li % 2) * Math.PI + (li < 2 ? 0 : Math.PI * 0.5));
        });
        if (d.state === 'jump') d.legs.forEach(leg => { leg.rotation.x = 0.7; }); // tucked
      }

      // splash rings and droplets
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        const age = (t - s.t0) / s.life;
        if (age < 0) continue;
        const drown = s.vx !== undefined && s.m.position.y < WATER_Y - 0.02;
        if (age >= 1 || drown) {
          scene.remove(s.m);
          s.m.geometry.dispose();
          s.m.material.dispose();
          splashes.splice(i, 1);
          continue;
        }
        if (s.vx !== undefined) { // droplet with simple ballistics
          s.m.position.x += s.vx * dt;
          s.m.position.z += s.vz * dt;
          s.vy -= 6.5 * dt;
          s.m.position.y += s.vy * dt;
          s.m.material.opacity = 0.9 * (1 - age);
        } else { // expanding foam ring
          const k = 1 + age * 2.8;
          s.m.scale.set(k, k, 1);
          s.m.material.opacity = 0.85 * (1 - age);
        }
      }
    }
    // gentle water drift
    if (pool.userData.waterMat) {
      pool.userData.waterMat.normalMap.offset.set(t * 0.012, t * 0.017);
      if (pool.userData.foam) pool.userData.foam.material.opacity = 0.28 + 0.08 * Math.sin(t * 1.7);
    }
    updateWalk(dt, t);
    renderer.render(scene, walk.on ? walkCam : camera);
    requestAnimationFrame(tick);
  }
  resize();
  if (!reduceMotion) { // opening glide: wide aerial easing into the home view
    view.size = 54;
    view.elevation = 1.02;
    view.azimuth = HOME.azimuth - 0.5;
    view.target.y = 8;
  }
  tick();
