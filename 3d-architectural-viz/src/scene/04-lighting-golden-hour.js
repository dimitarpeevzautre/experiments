  // ---------- lighting: golden hour ----------
  const sun = new THREE.DirectionalLight(0xffd9a4, 2.6);
  sun.position.set(-52, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -46; sun.shadow.camera.right = 46;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xffe4c2, 0x6b7c4a, 0.55);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xb9c8d8, 0.32);
  scene.add(amb);
  const rim = new THREE.DirectionalLight(0xcfe0ee, 0.35); // cool fill from the hazy east
  rim.position.set(48, 22, -30);
  scene.add(rim);
  const interiorLights = []; // filled by the cabin interior, brightened at night

  // reflection map for glass, panels and water only — full-scene IBL washes
  // out the painterly golden-hour shading, so it is applied per material
  let envMapTex = null;
  {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#b9cbd8');
    grad.addColorStop(0.42, '#d8cbb2');
    grad.addColorStop(0.55, '#eec896');
    grad.addColorStop(0.62, '#a08a68');
    grad.addColorStop(1, '#57503f');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 128);
    const glow = g.createRadialGradient(48, 66, 2, 48, 66, 46); // low western sun
    glow.addColorStop(0, 'rgba(255,224,170,0.95)');
    glow.addColorStop(1, 'rgba(255,224,170,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 256, 128);
    const envTex = new THREE.CanvasTexture(cv);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    envMapTex = pmrem.fromEquirectangular(envTex).texture;
    pmrem.dispose();
  }
