  // ---------- generative ambient loop (WebAudio, started by the Sound chip) ----------
  const music = { ctx: null, master: null, timer: null, on: false };
  function startMusic() {
    try {
      if (!music.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1600;
        lp.connect(master);
        master.connect(ctx.destination);
        const bus = ctx.createGain();
        bus.gain.value = 1;
        bus.connect(lp);
        // gentle echo for space
        const delay = ctx.createDelay(2);
        delay.delayTime.value = 0.58;
        const fb = ctx.createGain();
        fb.gain.value = 0.32;
        const wet = ctx.createGain();
        wet.gain.value = 0.38;
        bus.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(lp);
        // low drone: root + fifth
        for (const [f, g0] of [[73.42, 0.045], [110.0, 0.028]]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          const og = ctx.createGain();
          og.gain.value = g0;
          o.connect(og);
          og.connect(lp);
          o.start();
        }
        music.ctx = ctx; music.master = master; music.bus = bus;
      }
      music.ctx.resume();
      music.master.gain.cancelScheduledValues(music.ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0.9, music.ctx.currentTime + 1.5);
      // D-major pentatonic across two octaves — never dissonant
      const POOL_NOTES = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.26, 739.99];
      const note = () => {
        if (!music.on) return;
        const ctx = music.ctx;
        const n = 1 + (Math.random() < 0.3 ? 1 : 0); // occasionally a dyad
        for (let i = 0; i < n; i++) {
          const o = ctx.createOscillator();
          o.type = Math.random() < 0.7 ? 'sine' : 'triangle';
          o.frequency.value = POOL_NOTES[Math.floor(Math.random() * POOL_NOTES.length)];
          const g = ctx.createGain();
          const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          const peak = 0.04 + Math.random() * 0.05;
          const t0 = ctx.currentTime + i * 0.25;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(peak, t0 + 1.2 + Math.random() * 1.3);
          g.gain.exponentialRampToValueAtTime(0.0004, t0 + 5 + Math.random() * 3);
          o.connect(g);
          if (pan) { pan.pan.value = Math.random() * 1.4 - 0.7; g.connect(pan); pan.connect(music.bus); }
          else g.connect(music.bus);
          o.start(t0);
          o.stop(t0 + 9);
        }
        music.timer = setTimeout(note, 1400 + Math.random() * 2600);
      };
      music.on = true;
      note();
    } catch (err) { /* audio unavailable — leave the scene silent */ }
  }
  function stopMusic() {
    music.on = false;
    if (music.timer) clearTimeout(music.timer);
    if (music.ctx && music.master) {
      music.master.gain.cancelScheduledValues(music.ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0, music.ctx.currentTime + 0.8);
      setTimeout(() => { if (!music.on && music.ctx) music.ctx.suspend(); }, 1000);
    }
  }
