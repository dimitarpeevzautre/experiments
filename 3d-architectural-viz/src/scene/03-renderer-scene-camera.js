  // ---------- renderer / scene / camera ----------
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
  const view = {
    size: 24.5,          // half-height of the ortho frustum, metres
    azimuth: -Math.PI / 4,
    elevation: 0.56,     // radians
    target: new THREE.Vector3(0, 1.6, 1.5)
  };
  const viewGoal = {
    size: view.size, azimuth: view.azimuth, elevation: view.elevation,
    target: view.target.clone()
  };
  const HOME = { size: view.size, azimuth: view.azimuth, elevation: view.elevation, target: view.target.clone() };

  function fitFactor() {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    // portrait screens fit by height, which would crop the 60 m axis badly —
    // widen the frame as the viewport narrows
    return aspect < 1.3 ? clamp(1.3 / aspect, 1, 2.6) : 1;
  }

  function applyCamera() {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const s = view.size * fitFactor();
    camera.left = -s * aspect;
    camera.right = s * aspect;
    camera.top = s;
    camera.bottom = -s;
    const r = 120;
    const ce = Math.cos(view.elevation), se = Math.sin(view.elevation);
    camera.position.set(
      view.target.x + r * Math.sin(view.azimuth) * ce,
      view.target.y + r * se,
      view.target.z + r * Math.cos(view.azimuth) * ce
    );
    camera.lookAt(view.target);
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    applyCamera();
  }
  window.addEventListener('resize', resize);
