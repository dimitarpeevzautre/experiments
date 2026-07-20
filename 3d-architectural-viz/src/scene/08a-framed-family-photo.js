  // ---------- framed family photo above the sofa ----------
  // The image is embedded at build time from src/photo.jpg (window.FAMILY_PHOTO).
  if (window.FAMILY_PHOTO) {
    const frame = new THREE.Group();
    frame.position.set(W / 2 - 0.15, 0.43 + 1.42, 1.3); // east wall, over the sofa
    frame.rotation.y = -Math.PI / 2;
    // dark timber frame + warm white matte
    const back = mesh(new THREE.BoxGeometry(1.08, 0.85, 0.035), std(C.frame, { roughness: 0.6 }), 0, 0, -0.02);
    const matte = mesh(new THREE.BoxGeometry(1.0, 0.77, 0.012), std(0xf1ebdd, { roughness: 0.9 }), 0, 0, 0.004);
    back.castShadow = false;
    matte.castShadow = false;
    frame.add(back, matte);
    new THREE.TextureLoader().load(window.FAMILY_PHOTO, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const w = 0.92;
      const h = w * tex.image.height / tex.image.width;
      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(w, Math.min(h, 0.71)),
        new THREE.MeshStandardMaterial({
          map: tex, roughness: 0.85,
          emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32 // stays readable in interior shade
        })
      );
      photo.position.z = 0.012;
      frame.add(photo);
    });
    cabin.add(frame);
  }
