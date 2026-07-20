  // ---------- seasons ----------
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  function poolSeason(s) {
    const w = s === 'winter';
    const wm = pool.userData.waterMat;
    wm.color.setHex(w ? 0xd9e8ec : C.water); // frozen over in winter
    wm.opacity = w ? 0.95 : 0.78;
    wm.roughness = w ? 0.45 : 0.12;
    wm.normalScale.setScalar(w ? 0.08 : 0.4);
    pool.userData.foam.visible = !w;
    pool.userData.deep.visible = !w;
    pool.userData.lilies.visible = s === 'spring' || s === 'summer';
    const [rm, rd] = pool.userData.reedMats;
    if (w || s === 'autumn') { rm.color.setHex(0x9a8756); rd.color.setHex(0x84713f); }
    else { rm.color.setHex(C.reed); rd.color.setHex(C.leafDark); }
  }
  function applySeason(s) {
    season = s;
    paintGrass(s);
    paintCanopy(s);
    petalsSeason(s);
    poolSeason(s);
    tuftMesh.visible = s !== 'winter';
    flowerMesh.visible = s === 'spring' || s === 'summer';
    smoke.group.visible = s === 'winter';
    document.body.classList.toggle('winter', s === 'winter');
    if (state.cycle) simStep(0);
    else restoreDayDefaults();
    refreshChips();
  }
  chips.season.addEventListener('click', () => {
    applySeason(SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length]);
  });
