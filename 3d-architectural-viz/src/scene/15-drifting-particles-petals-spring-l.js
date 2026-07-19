  // ---------- drifting particles: petals (spring), leaves (autumn), snow (winter) ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let season = 'spring';
  let petals = null;
  function makeParticleTex(inner, mid) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    gr.addColorStop(0, `rgba(${inner},1)`);
    gr.addColorStop(0.7, `rgba(${mid},0.9)`);
    gr.addColorStop(1, `rgba(${mid},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(cv);
  }
  const particleTex = {
    spring: makeParticleTex('245,199,211', '238,159,182'),
    autumn: makeParticleTex('240,170,90', '208,116,48'),
    winter: makeParticleTex('255,255,255', '232,240,247')
  };
  if (!reduceMotion) {
    const NP = 90;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
    petals = {
      meta: [],
      points: new THREE.Points(geo, new THREE.PointsMaterial({
        map: particleTex.spring, size: 0.28, transparent: true, depthWrite: false, sizeAttenuation: true
      }))
    };
    for (let i = 0; i < NP; i++) petals.meta.push({});
    scene.add(petals.points);
  }
  function respawnParticle(m) {
    if (season === 'winter') { // snow falls across the whole plot
      m.x = rr(-HALF_X + 1, HALF_X - 1);
      m.z = rr(-HALF_Z + 1, HALF_Z - 1);
      m.y = rr(4, 9);
      m.vy = rr(0.14, 0.28);
    } else { // petals and leaves shed from the grove
      const [tx, tz] = treeSpots[Math.floor(rand() * treeSpots.length)];
      m.x = tx + rr(-3, 3);
      m.z = tz + rr(-3, 3);
      m.y = rr(0.5, 5.5);
      m.vy = rr(0.12, 0.3);
    }
    m.phase = rr(0, Math.PI * 2);
    m.amp = rr(0.2, 0.7);
  }
  function petalsSeason(s) {
    if (!petals) return;
    petals.points.visible = s !== 'summer';
    if (s === 'summer') return;
    const mat = petals.points.material;
    mat.map = particleTex[s];
    mat.size = s === 'autumn' ? 0.34 : s === 'winter' ? 0.22 : 0.28;
    mat.needsUpdate = true;
    for (const m of petals.meta) respawnParticle(m);
  }
  if (petals) petalsSeason('spring');
