  // ---------- clickable systems: pick spheres → camera fly-to + drawer card ----------
  const pickGroup = new THREE.Group();
  scene.add(pickGroup);
  const FOCUS = { // per-component camera framing
    energy: { target: new THREE.Vector3(21, CABIN_H + 4.2, 12), size: 8 },
    living: { target: new THREE.Vector3(21, CABIN_H + 1.6, 12), size: 8.5 },
    hydro: { target: new THREE.Vector3(11, baseHeight(11, 1) + 1, 1), size: 15 },
    pond: { target: new THREE.Vector3(POOL_POS.x + 1.5, PAD_H + 0.5, POOL_POS.y + 0.5), size: 9 }
  };
  {
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    function pickSphere(id, x, y, z, r) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), pickMat);
      m.position.set(x, y, z);
      m.userData.component = id;
      pickGroup.add(m);
    }
    pickSphere('energy', anchors.solar.x, anchors.solar.y, anchors.solar.z, 3.2);
    pickSphere('energy', anchors.battery.x, anchors.battery.y - 0.6, anchors.battery.z, 1.1);
    pickSphere('energy', anchors.generator.x, anchors.generator.y - 0.4, anchors.generator.z, 1.3);
    pickSphere('living', CABIN_POS.x, CABIN_H + 1.6, CABIN_POS.y, 3.4);
    pickSphere('hydro', anchors.cistern.x, anchors.cistern.y, anchors.cistern.z, 1.8);
    pickSphere('hydro', anchors.well.x, anchors.well.y - 0.3, anchors.well.z, 1.2);
    pickSphere('pond', POOL_POS.x + 0.5, PAD_H - 0.2, POOL_POS.y, 5.0);
  }
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickGroup.children, false);
    return hits.length ? hits[0].object.userData.component : null;
  }
  function focusComponent(id) {
    const f = FOCUS[id];
    if (!f) return;
    viewGoal.target.copy(f.target);
    viewGoal.size = f.size;
    if (state.top) { state.top = false; refreshChips(); }
  }
  let downX = 0, downY = 0;
  canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  canvas.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // it was a drag
    const id = pickAt(e.clientX, e.clientY);
    if (id) {
      focusComponent(id);
      window.dispatchEvent(new CustomEvent('caroline:pick', { detail: { id } }));
    }
  });
  let hoverAt = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - hoverAt < 120 || pointers.size > 0) return;
    hoverAt = now;
    canvas.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : 'grab';
  });

  // small API for the project drawer (and future budgeting/progress panels)
  window.caroline = {
    getSystems: () => state.systems,
    setSystems(v) {
      v = !!v;
      if (state.systems === v) return;
      state.systems = v;
      labels.visible = v;
      refreshChips();
    },
    focusComponent
  };

  // controls: drag to orbit · right/shift-drag (or two-finger drag) to pan ·
  // wheel / pinch to zoom · double-click to reset
  const pointers = new Map();
  let pinchDist = 0, pinchMid = null;

  function panBy(dxPx, dyPx) {
    // move the target along the camera's screen axes; ortho makes this exact
    const s = view.size * fitFactor();
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const dxWorld = (dxPx / canvas.clientWidth) * 2 * s * aspect;
    const dyWorld = (dyPx / canvas.clientHeight) * 2 * s;
    const m = camera.matrixWorld.elements;
    viewGoal.target.addScaledVector(new THREE.Vector3(m[0], m[1], m[2]), -dxWorld);
    viewGoal.target.addScaledVector(new THREE.Vector3(m[4], m[5], m[6]), dyWorld);
    viewGoal.target.x = clamp(viewGoal.target.x, -36, 36);
    viewGoal.target.y = clamp(viewGoal.target.y, -6, 14);
    viewGoal.target.z = clamp(viewGoal.target.z, -26, 26);
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    if (tour.on) stopTour(false); // grabbing the scene hands control back
    const pan = e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (pinchDist > 0 && d > 0) {
        viewGoal.size = clamp(viewGoal.size * pinchDist / d, 9, 42);
      }
      if (pinchMid) panBy(mid.x - pinchMid.x, mid.y - pinchMid.y);
      pinchDist = d;
      pinchMid = mid;
      return;
    }
    const dxPx = e.clientX - p.x, dyPx = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (p.pan) {
      panBy(dxPx, dyPx);
      return;
    }
    viewGoal.azimuth -= dxPx / canvas.clientWidth * 3.2;
    viewGoal.elevation = clamp(viewGoal.elevation + dyPx / canvas.clientHeight * 2.2, 0.22, 1.45);
    if (state.top) { state.top = false; refreshChips(); }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    pinchDist = 0;
    pinchMid = null;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (tour.on) stopTour(false);
    viewGoal.size = clamp(viewGoal.size * (e.deltaY > 0 ? 1.08 : 0.925), 9, 42);
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    viewGoal.size = HOME.size;
    viewGoal.azimuth = HOME.azimuth;
    viewGoal.elevation = HOME.elevation;
    viewGoal.target.copy(HOME.target);
    if (state.top) { state.top = false; refreshChips(); }
  });

  const compass = document.getElementById('compass');
