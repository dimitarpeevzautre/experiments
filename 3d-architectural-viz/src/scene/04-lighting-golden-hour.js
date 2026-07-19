  // ---------- lighting: golden hour ----------
  const sun = new THREE.DirectionalLight(0xffd9a4, 2.6);
  sun.position.set(-52, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -46; sun.shadow.camera.right = 46;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xffe4c2, 0x6b7c4a, 0.55);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xb9c8d8, 0.32);
  scene.add(amb);
  const rim = new THREE.DirectionalLight(0xcfe0ee, 0.35); // cool fill from the hazy east
  rim.position.set(48, 22, -30);
  scene.add(rim);
  const interiorLights = []; // filled by the cabin interior, brightened at night
