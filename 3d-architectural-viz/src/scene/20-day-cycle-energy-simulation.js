  // ---------- day cycle + energy simulation ----------
  // one simulated day lasts 150 s; the model follows the project brief:
  // 11 kWp PV, 10 kWh battery, solar-clipped borehole pump (11:00–15:00),
  // constant pond pump, heat pump on summer afternoons, AGS generator backup
  const DAY_SECONDS = 150;
  const cycle = { T: 8, playing: true, soc: 6.0, gen: false, pv: 0, load: 0, borehole: false };
  const dayDefaults = {
    sunPos: sun.position.clone(), sunColor: sun.color.clone(), sunInt: sun.intensity,
    hemiInt: hemi.intensity, ambInt: amb.intensity, rimInt: rim.intensity, rimColor: rim.color.clone()
  };
  const veil = document.getElementById('night-veil');
  const dash = document.getElementById('dash');
  const dashEls = dash ? {
    time: document.getElementById('dash-time'),
    scrub: document.getElementById('dash-scrub'),
    play: document.getElementById('dash-play'),
    pv: document.getElementById('dash-pv'), barPv: document.getElementById('bar-pv'),
    batt: document.getElementById('dash-batt'), barBatt: document.getElementById('bar-batt'),
    load: document.getElementById('dash-load'), barLoad: document.getElementById('bar-load'),
    gen: document.getElementById('dash-gen'), pump: document.getElementById('dash-pump')
  } : null;
  // seasonal daylight windows, PV yield, cooling need and pond regime
  const SEASON_SIM = {
    spring: { rise: 6.0, set: 20.0, pv: 0.85, cool: 0.4, pond: 0.08 },
    summer: { rise: 5.5, set: 21.0, pv: 1.0, cool: 1.0, pond: 0.08 },
    autumn: { rise: 6.5, set: 19.0, pv: 0.6, cool: 0, pond: 0.05 },
    winter: { rise: 7.5, set: 16.5, pv: 0.35, cool: 0, pond: 0.02 } // pond winterised, heat is biomass
  };
  function dayFactor(T) {
    const s = SEASON_SIM[season];
    return Math.max(0, Math.sin(Math.PI * (T - s.rise) / (s.set - s.rise)));
  }
  function simStep(dtH) {
    const s = SEASON_SIM[season];
    const m = dayFactor(cycle.T);
    cycle.pv = 11 * s.pv * Math.pow(m, 1.35);
    let load = 0.25 + s.pond; // house baseload + pond eco-pump
    cycle.borehole = cycle.T >= 11 && cycle.T < 15 && cycle.pv > 2; // solar clipping window
    if (cycle.borehole) load += 1.5;
    if (cycle.T >= 12 && cycle.T < 17) load += 1.0 * s.cool; // heat pump cooling
    if (cycle.T >= 18 && cycle.T < 23) load += 0.7; // evening cooking + lights
    cycle.load = load;
    let net = cycle.pv - load;
    if (cycle.gen) { net += 4; if (cycle.soc >= 6) cycle.gen = false; }
    else if (cycle.soc <= 1.2 && net < 0) cycle.gen = true;
    cycle.soc = clamp(cycle.soc + clamp(net, -6, 4) * dtH, 0.4, 10);
  }
  const sunLow = new THREE.Color(0xff9a55), sunMid = new THREE.Color(0xffd9a4), sunHigh = new THREE.Color(0xfff1da);
  function applyCycleVisuals(T) {
    const m = dayFactor(T);
    const d = smoothstep(0, 0.12, m); // day↔night blend
    const ss = SEASON_SIM[season];
    // sun sweeps east → west; site north lies along the +x/+z diagonal
    const A = (95 + clamp((T - ss.rise) / (ss.set - ss.rise), 0, 1) * 170) * Math.PI / 180;
    const hx = 0.7071 * (Math.cos(A) - Math.sin(A));
    const hz = 0.7071 * (Math.cos(A) + Math.sin(A));
    const elev = Math.max(0.06, m) * 1.05;
    sun.position.set(hx * Math.cos(elev), Math.sin(elev), hz * Math.cos(elev)).multiplyScalar(78);
    sun.visible = d > 0.02;
    sun.intensity = dayDefaults.sunInt * (0.3 + 0.7 * d);
    sun.color.copy(m < 0.45 ? sunLow.clone().lerp(sunMid, m / 0.45) : sunMid.clone().lerp(sunHigh, (m - 0.45) / 0.55));
    hemi.intensity = dayDefaults.hemiInt * (0.15 + 0.85 * d);
    amb.intensity = dayDefaults.ambInt * (0.3 + 0.7 * d) + 0.07 * (1 - d);
    rim.intensity = 0.35 * d + 0.5 * (1 - d); // doubles as moonlight
    rim.color.setHex(d > 0.5 ? 0xcfe0ee : 0x8fa8c8);
    for (const b of interiorLights) b.light.intensity = b.base * (1 + 1.3 * (1 - d));
    glassMat.emissive.setHex(0xffb85c);
    glassMat.emissiveIntensity = 0.28 * (1 - d);
    const flying = season === 'spring' || season === 'summer';
    for (const bf of butterflies) bf.g.visible = flying && m > 0.25;
    if (veil) veil.style.opacity = ((1 - d) * 0.9).toFixed(3);
  }
  function staticSeasonLight() {
    if (season === 'winter') { // low, cool winter sun
      sun.color.setHex(0xf6e8d2);
      sun.intensity = 2.1;
      sun.position.set(-52, 20, 20);
      hemi.intensity = 0.42;
    } else {
      sun.color.copy(dayDefaults.sunColor);
      sun.intensity = dayDefaults.sunInt;
      sun.position.copy(dayDefaults.sunPos);
      hemi.intensity = dayDefaults.hemiInt;
    }
  }
  function restoreDayDefaults() {
    sun.visible = true;
    staticSeasonLight();
    amb.intensity = dayDefaults.ambInt;
    rim.intensity = dayDefaults.rimInt;
    rim.color.copy(dayDefaults.rimColor);
    for (const b of interiorLights) b.light.intensity = b.base;
    glassMat.emissiveIntensity = 0;
    const flying = season === 'spring' || season === 'summer';
    for (const bf of butterflies) bf.g.visible = flying;
    if (veil) veil.style.opacity = '0';
  }
  function updateDash() {
    if (!dashEls) return;
    const hh = String(Math.floor(cycle.T)).padStart(2, '0');
    const mm = String(Math.floor((cycle.T % 1) * 60)).padStart(2, '0');
    dashEls.time.textContent = `${hh}:${mm}`;
    if (document.activeElement !== dashEls.scrub) dashEls.scrub.value = Math.round(cycle.T * 60);
    dashEls.pv.textContent = cycle.pv.toFixed(1) + ' kW';
    dashEls.barPv.style.width = (cycle.pv / 11 * 100).toFixed(1) + '%';
    dashEls.batt.textContent = Math.round(cycle.soc / 10 * 100) + '%';
    dashEls.barBatt.style.width = (cycle.soc / 10 * 100).toFixed(1) + '%';
    dashEls.load.textContent = cycle.load.toFixed(2) + ' kW';
    dashEls.barLoad.style.width = Math.min(100, cycle.load / 4 * 100).toFixed(1) + '%';
    dashEls.gen.textContent = cycle.gen ? 'running' : 'off';
    dashEls.gen.classList.toggle('on', cycle.gen);
    dashEls.pump.textContent = cycle.borehole ? 'pumping' : 'idle';
    dashEls.pump.classList.toggle('on', cycle.borehole);
  }
  chips.cycle.addEventListener('click', () => {
    state.cycle = !state.cycle;
    if (dash) dash.hidden = !state.cycle;
    if (!state.cycle) restoreDayDefaults();
    else { simStep(0); applyCycleVisuals(cycle.T); updateDash(); }
    refreshChips();
  });
  if (dashEls) {
    dashEls.scrub.addEventListener('input', () => {
      cycle.T = dashEls.scrub.value / 60;
      simStep(0);
    });
    dashEls.play.addEventListener('click', () => {
      cycle.playing = !cycle.playing;
      dashEls.play.textContent = cycle.playing ? '❚❚' : '▶';
    });
  }
