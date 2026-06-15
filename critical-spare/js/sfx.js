/* SFX: tiny synthesized sound effects via Web Audio. No asset files, so it
   works offline from file://. AudioContext is created lazily on the first
   play() (after a user gesture, per browser autoplay rules). Disabled by
   default; the page never makes noise unless a control opts in. The headless
   screenshot runs never trigger audio.

   API:
     SFX.play(name)        play one of the named cues (no-op if disabled)
     SFX.setEnabled(bool)  gate on/off
     SFX.isEnabled()       current state

   Cues: cursor, tick, diceroll, run, order, replace, fail, downtime. */
(function () {
  let enabled = false;
  let ctx = null;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (_e) { ctx = null; }
    return ctx;
  }

  function tone(freq, t0, dur, type, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sweep(f1, f2, t0, dur, type, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sawtooth';
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.16, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noiseHit(t0, dur, gain) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(g); g.connect(ctx.destination);
    src.start(t0);
  }

  const CUES = {
    cursor:   (t) => { tone(660, t, 0.05, 'square', 0.12); },
    tick:     (t) => { tone(1200, t, 0.02, 'square', 0.06); },
    diceroll: (t) => { sweep(300, 900, t, 0.22, 'triangle', 0.12); tone(1400, t + 0.18, 0.04, 'square', 0.08); },
    run:      (t) => { tone(523, t, 0.07, 'square', 0.13); tone(784, t + 0.06, 0.10, 'square', 0.13); },   // produce, up
    order:    (t) => { tone(440, t, 0.06, 'square', 0.12); tone(587, t + 0.07, 0.08, 'square', 0.12); },   // delivery
    replace:  (t) => { [659, 880, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.12, 'square', 0.13)); }, // gold swap
    fail:     (t) => { sweep(420, 120, t, 0.22, 'sawtooth', 0.16); noiseHit(t, 0.10, 0.10); },             // emergency swap
    downtime: (t) => { [392, 311, 233].forEach((f, i) => tone(f, t + i * 0.13, 0.20, 'sawtooth', 0.14)); noiseHit(t, 0.20, 0.09); },
  };

  function play(name) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (_e) {} }
    const fn = CUES[name];
    if (fn) { try { fn(c.currentTime + 0.001); } catch (_e) {} }
  }
  function setEnabled(b) { enabled = !!b; if (enabled) ensureCtx(); }
  function isEnabled() { return enabled; }

  window.SFX = { play, setEnabled, isEnabled };
})();
