  // ---------- generative ambient loop (WebAudio, started by the Sound chip) ----------
  // A slow I–V–vi–IV progression in D carries a pentatonic melody that moves
  // by random walk with a pull toward the middle register — melodic, never
  // dissonant, and different on every listen.
  const music = { ctx: null, master: null, bus: null, timer: null, on: false };
  const MUS = {
    beat: 0.82, // ~73 bpm
    scale: [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.26, 739.99], // D pentatonic, 2 octaves
    chords: [
      [146.83, 220.0, 369.99], // D:  D3 A3 F#4
      [110.0, 164.81, 277.18], // A:  A2 E3 C#4
      [123.47, 185.0, 293.66], // Bm: B2 F#3 D4
      [98.0, 146.83, 246.94]   // G:  G2 D3 B3
    ],
    bar: 0, mel: 3, lastMel: 3
  };
  function tone(freq, ts, attack, dur, peak, type, pan) {
    const ctx = music.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ts);
    g.gain.linearRampToValueAtTime(peak, ts + attack);
    g.gain.exponentialRampToValueAtTime(0.0004, ts + dur);
    o.connect(g);
    const sp = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (sp) { sp.pan.value = pan; g.connect(sp); sp.connect(music.bus); }
    else g.connect(music.bus);
    o.start(ts);
    o.stop(ts + dur + 0.1);
  }
  function scheduleBar() {
    if (!music.on) return;
    const ctx = music.ctx;
    const BAR = MUS.beat * 4;
    const ts = ctx.currentTime + 0.08;
    // pad chord, one per bar
    const chord = MUS.chords[MUS.bar % MUS.chords.length];
    for (let i = 0; i < chord.length; i++) {
      tone(chord[i], ts, 1.1, BAR * 1.7, 0.026, 'sine', (i - 1) * 0.3);
    }
    // melody: eighth-note grid, random walk with a homeward pull
    for (let b = 0; b < 4; b++) {
      for (const half of [0, 0.5]) {
        const first = b === 0 && half === 0;
        if (!first && Math.random() > (half ? 0.32 : 0.58)) continue;
        let step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
        if (MUS.mel >= 6 && step > 0) step = -step; // drift back toward the middle
        if (MUS.mel <= 1 && step < 0) step = -step;
        if (first && Math.random() < 0.5) step = 0;  // often restate the anchor
        MUS.lastMel = MUS.mel;
        MUS.mel = Math.max(0, Math.min(MUS.scale.length - 1, MUS.mel + step));
        const f = MUS.scale[MUS.mel];
        const at = ts + (b + half) * MUS.beat;
        tone(f, at, 0.05, 2.6, 0.06, 'triangle', Math.random() * 0.8 - 0.4);
        if (Math.random() < 0.22) tone(f * 2, at, 0.04, 2.0, 0.016, 'sine', Math.random() * 0.8 - 0.4); // sparkle
      }
    }
    MUS.bar++;
    music.timer = setTimeout(scheduleBar, BAR * 1000 - 60);
  }
  function startMusic() {
    try {
      if (!music.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1700;
        lp.connect(master);
        master.connect(ctx.destination);
        const bus = ctx.createGain();
        bus.gain.value = 1;
        bus.connect(lp);
        // gentle echo for space
        const delay = ctx.createDelay(2);
        delay.delayTime.value = MUS.beat * 0.75; // dotted-eighth echo, in time with the pulse
        const fb = ctx.createGain();
        fb.gain.value = 0.3;
        const wet = ctx.createGain();
        wet.gain.value = 0.34;
        bus.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(lp);
        // low drone: root + fifth, quiet under the chords
        for (const [f, g0] of [[73.42, 0.03], [110.0, 0.018]]) {
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
      music.on = true;
      scheduleBar();
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
