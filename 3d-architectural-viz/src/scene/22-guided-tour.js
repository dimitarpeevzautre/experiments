  // ---------- guided tour ----------
  const TOUR = [
    { t: [28, 2.5, -12], size: 11, az: -0.6, el: 0.42, drift: 0.14, dur: 6.5, cap: 'The drive meets the road on the north-west edge — stone gate posts, then a gravel climb.' },
    { t: [21, 4.6, 12], size: 9, az: -1.05, el: 0.5, drift: 0.2, dur: 7.5, cap: 'A 48 m² glazed-gable cabin under 11 kWp of solar — wood heat in winter, sun-powered cooling in summer.' },
    { t: [6.5, 2.9, 4], size: 9.5, az: -0.5, el: 0.55, drift: 0.16, dur: 7.5, cap: 'The natural swimming pond: chemical-free, biologically filtered, with a planted regeneration edge.' },
    { t: [14, 3.4, 7], size: 17, az: -0.85, el: 0.62, drift: 0.1, dur: 7.5, cap: 'Off-grid systems: 40 m borehole, 10 m³ cistern, battery bank, septic and a backup generator.', systems: true },
    { t: [-10, 1.6, 8], size: 14, az: -0.75, el: 0.5, drift: 0.12, dur: 6.5, cap: 'Eighteen cherry trees hold the lower lawn — and three Portuguese water dogs hold the estate.' },
    { t: [0, 1.6, 1.5], size: 24.5, az: -Math.PI / 4, el: 0.56, drift: 0, dur: 5, cap: 'Caroline — a 2,400 m² off-grid micro-estate.' }
  ];
  const tour = { on: false, i: 0, t0: -1 };
  const captionEl = document.getElementById('tour-caption');
  const tourSaved = { az: 0, el: 0, size: 0, target: new THREE.Vector3(), systems: false };
  function tourStep(i) {
    tour.i = i;
    tour.t0 = -1; // stamped on the next frame
    const s = TOUR[i];
    viewGoal.target.set(s.t[0], s.t[1], s.t[2]);
    viewGoal.size = s.size;
    viewGoal.azimuth = s.az;
    viewGoal.elevation = s.el;
    if (captionEl) { captionEl.textContent = s.cap; captionEl.classList.add('show'); }
    window.caroline.setSystems(!!s.systems);
  }
  function startTour() {
    tourSaved.az = viewGoal.azimuth; tourSaved.el = viewGoal.elevation;
    tourSaved.size = viewGoal.size; tourSaved.target.copy(viewGoal.target);
    tourSaved.systems = state.systems;
    if (state.top) state.top = false;
    tour.on = true;
    state.tour = true;
    tourStep(0);
    refreshChips();
  }
  function stopTour(restore) {
    tour.on = false;
    state.tour = false;
    if (captionEl) captionEl.classList.remove('show');
    window.caroline.setSystems(tourSaved.systems);
    if (restore) {
      viewGoal.azimuth = tourSaved.az; viewGoal.elevation = tourSaved.el;
      viewGoal.size = tourSaved.size; viewGoal.target.copy(tourSaved.target);
    }
    refreshChips();
  }
  chips.tour.addEventListener('click', () => { if (tour.on) stopTour(true); else startTour(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tour.on) stopTour(true); });
  refreshChips();
