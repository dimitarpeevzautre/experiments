  // ---------- first-person walk mode ----------
  const walkCam = new THREE.PerspectiveCamera(72, 1, 0.05, 300);
  walkCam.rotation.order = 'YXZ';
  const walk = {
    on: false, yaw: 0.9, pitch: -0.05,
    pos: new THREE.Vector3(14.5, 0, 10.5),
    eyeY: 0, keys: { f: false, b: false, l: false, r: false }
  };
  const walkSaved = { az: 0, el: 0, size: 0, target: new THREE.Vector3() };

  function cabinFloorAt(x, z) {
    // cabin local frame (yaw −π/2): lx = z − CABIN_POS.y, lz = −(x − CABIN_POS.x)
    const lx = z - CABIN_POS.y, lz = -(x - CABIN_POS.x);
    if (Math.abs(lx) < 3.25 && Math.abs(lz) < 4.3) return CABIN_H + 0.43;
    return -Infinity;
  }
  function startWalk() {
    if (tour.on) stopTour(false);
    if (state.top) { state.top = false; }
    walkSaved.az = viewGoal.azimuth; walkSaved.el = viewGoal.elevation;
    walkSaved.size = viewGoal.size; walkSaved.target.copy(viewGoal.target);
    walk.pos.set(14.5, 0, 10.5); // on the drive, facing the front door
    walk.yaw = Math.atan2(16.5 - walk.pos.x, 12 - walk.pos.z);
    walk.pitch = -0.05;
    walk.eyeY = groundHeight(walk.pos.x, walk.pos.z) + 1.65;
    walk.on = true;
    state.walk = true;
    document.body.classList.add('walking');
    refreshChips();
  }
  function stopWalk() {
    walk.on = false;
    state.walk = false;
    document.body.classList.remove('walking');
    viewGoal.azimuth = walkSaved.az; viewGoal.elevation = walkSaved.el;
    viewGoal.size = walkSaved.size; viewGoal.target.copy(walkSaved.target);
    Object.keys(walk.keys).forEach(k => { walk.keys[k] = false; });
    refreshChips();
  }
  chips.walk.addEventListener('click', () => { if (walk.on) stopWalk(); else startWalk(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && walk.on) { stopWalk(); return; }
    if (!walk.on) return;
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') { walk.keys.f = true; e.preventDefault(); }
    if (k === 's' || k === 'arrowdown') { walk.keys.b = true; e.preventDefault(); }
    if (k === 'a' || k === 'arrowleft') { walk.keys.l = true; e.preventDefault(); }
    if (k === 'd' || k === 'arrowright') { walk.keys.r = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') walk.keys.f = false;
    if (k === 's' || k === 'arrowdown') walk.keys.b = false;
    if (k === 'a' || k === 'arrowleft') walk.keys.l = false;
    if (k === 'd' || k === 'arrowright') walk.keys.r = false;
  });
  {
    const padBtn = document.getElementById('walk-forward');
    if (padBtn) {
      padBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); walk.keys.f = true; });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
        padBtn.addEventListener(ev, () => { walk.keys.f = false; });
      }
    }
  }
  function updateWalk(dt, t) {
    if (!walk.on) return;
    const speed = 3.1;
    const fx = Math.sin(walk.yaw), fz = Math.cos(walk.yaw);
    let mx = 0, mz = 0;
    if (walk.keys.f) { mx += fx; mz += fz; }
    if (walk.keys.b) { mx -= fx; mz -= fz; }
    // camera right = (−fz, fx) for heading (fx, fz)
    if (walk.keys.l) { mx += fz; mz -= fx; }
    if (walk.keys.r) { mx -= fz; mz += fx; }
    const moving = mx || mz;
    if (moving) {
      const n = Math.hypot(mx, mz);
      walk.pos.x = clamp(walk.pos.x + mx / n * speed * dt, -HALF_X + 0.6, HALF_X - 0.6);
      walk.pos.z = clamp(walk.pos.z + mz / n * speed * dt, -HALF_Z + 0.6, HALF_Z - 0.6);
    }
    const floor = Math.max(groundHeight(walk.pos.x, walk.pos.z), cabinFloorAt(walk.pos.x, walk.pos.z));
    const targetEye = floor + 1.65;
    walk.eyeY += (targetEye - walk.eyeY) * Math.min(1, dt * 8);
    const bob = moving ? Math.sin(t * 9) * 0.03 : 0;
    walkCam.position.set(walk.pos.x, walk.eyeY + bob, walk.pos.z);
    walkCam.rotation.set(walk.pitch, walk.yaw + Math.PI, 0); // camera looks down its −z
    walkCam.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    walkCam.updateProjectionMatrix();
  }
