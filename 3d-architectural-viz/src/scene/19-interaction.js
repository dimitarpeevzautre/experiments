  // ---------- interaction ----------
  const chips = {
    roof: document.getElementById('chip-roof'),
    xray: document.getElementById('chip-xray'),
    top: document.getElementById('chip-top'),
    systems: document.getElementById('chip-systems'),
    sound: document.getElementById('chip-sound'),
    cycle: document.getElementById('chip-cycle'),
    season: document.getElementById('chip-season'),
    tour: document.getElementById('chip-tour')
  };
  const state = { roof: true, xray: false, top: false, systems: false, sound: false, cycle: false, tour: false };
  const savedView = { azimuth: view.azimuth, elevation: view.elevation, size: view.size, target: view.target.clone() };

  function refreshChips() {
    chips.roof.textContent = state.roof ? 'Roof on' : 'Roof off';
    chips.roof.classList.toggle('active', !state.roof);
    chips.xray.classList.toggle('active', state.xray);
    chips.top.classList.toggle('active', state.top);
    chips.systems.classList.toggle('active', state.systems);
    chips.sound.textContent = state.sound ? 'Sound on' : 'Sound';
    chips.sound.classList.toggle('active', state.sound);
    chips.cycle.classList.toggle('active', state.cycle);
    chips.season.textContent = season[0].toUpperCase() + season.slice(1);
    chips.season.classList.toggle('active', season !== 'spring');
    chips.tour.classList.toggle('active', state.tour);
  }
  chips.roof.addEventListener('click', () => {
    state.roof = !state.roof;
    roofGroup.visible = state.roof;
    refreshChips();
  });
  chips.xray.addEventListener('click', () => {
    state.xray = !state.xray;
    for (const m of wallMats) {
      m.transparent = state.xray;
      m.opacity = state.xray ? 0.22 : 1;
      m.depthWrite = !state.xray;
      m.needsUpdate = true;
    }
    refreshChips();
  });
  chips.top.addEventListener('click', () => {
    state.top = !state.top;
    if (state.top) {
      savedView.azimuth = viewGoal.azimuth; savedView.elevation = viewGoal.elevation;
      savedView.size = viewGoal.size; savedView.target.copy(viewGoal.target);
      viewGoal.elevation = 1.54;
      viewGoal.azimuth = -Math.PI / 2; // plan rotated 90° CCW: long axis vertical
      viewGoal.size = 32;
      viewGoal.target.set(0, 0, 1.5);
    } else {
      viewGoal.azimuth = savedView.azimuth;
      viewGoal.elevation = savedView.elevation;
      viewGoal.size = savedView.size;
      viewGoal.target.copy(savedView.target);
    }
    refreshChips();
  });
  chips.systems.addEventListener('click', () => {
    state.systems = !state.systems;
    labels.visible = state.systems;
    refreshChips();
  });
  chips.sound.addEventListener('click', () => {
    state.sound = !state.sound;
    if (state.sound) startMusic(); else stopMusic();
    refreshChips();
  });
