/* Chiptune sound effects, Web Audio synth, no asset files.
 *
 *   Ten sounds, each ~100 to 500 ms, synthesised from square / sawtooth /
 *   white-noise primitives so the timbre matches the Gen-1 chiptune feel
 *   of music.js without shipping (or licensing) any ripped game audio:
 *
 *     quick, Pikachu's QUICK ATTACK   (short ascending chirp)
 *     bolt, Pikachu's THUNDERBOLT    (descending electric zap)
 *     thunder, Pikachu's THUNDER        (rumble → crack → fade)
 *     ember, Charmander's EMBER       (crackly fire burst)
 *     flame, Charmeleon's FLAMETHROWER (sustained roar)
 *     outrage, Charizard's OUTRAGE      (low dragon growl)
 *     hit, damage landed            (thunk pop)
 *     miss, attack whiffed           (descending phew)
 *     win, victory cue              (4-note major arpeggio)
 *     loss, defeat cue               (3-note descending minor)
 *     tick, dialog typewriter blip   (~20 ms square pip)
 *     cursor, menu cursor blip         (~70 ms two-note pip)
 *
 *   The audio context is created lazily on first .play(), but because
 *   browsers block AudioContext until a user gesture, callers should
 *   typically wait for the music toggle (which already handles unlock)
 *   before firing SFX. We gate every .play() on Music.isPlaying() so
 *   the user has a single toggle controlling all audio.
 *
 *   Public API:
 *     SFX.play(name), fire one of the ten sounds. No-op when muted.
 *     SFX.setEnabled(b), explicit override (Music-toggle calls this).
 *     SFX.isEnabled(), current gate state.
 */
(function () {

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let enabled = false;     /* off by default to match the music-toggle initial state */

  function ensureCtx() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.32;        /* below music so it sits on top without bleeding */
    master.connect(ctx.destination);

    /* 0.5 s of white noise, long enough that no SFX needs more than one
       buffer's worth of samples even when played at the slowest rate. */
    const sr = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, sr * 0.5, sr);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    return ctx;
  }

  /*, Atomic builders, */

  /* One oscillator + ADSR-shaped gain. The frequency can sweep from
     `freqStart` to `freqEnd` with `sweepType` ('linear' | 'exp') over
     the note. peak is the gain at the envelope peak. */
  function osc(opts) {
    const o = ctx.createOscillator();
    o.type = opts.type || 'square';
    const f0 = opts.freqStart;
    const f1 = (opts.freqEnd === undefined) ? f0 : opts.freqEnd;
    const t  = opts.when;
    const dur = opts.duration;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) {
      if (opts.sweepType === 'exp') {
        o.frequency.exponentialRampToValueAtTime(Math.max(0.01, f1), t + dur);
      } else {
        o.frequency.linearRampToValueAtTime(f1, t + dur);
      }
    }

    const g = ctx.createGain();
    const peak = opts.peak === undefined ? 0.4 : opts.peak;
    const attack = opts.attack === undefined ? 0.005 : opts.attack;
    const release = opts.release === undefined ? 0.04 : opts.release;
    const sustain = Math.max(0.001, dur - attack - release);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g).connect(opts.dest || master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /* Noise burst, optionally band-pass filtered. dur in seconds. */
  function noise(opts) {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    n.playbackRate.value = opts.rate || 1.0;

    const g = ctx.createGain();
    const peak = opts.peak === undefined ? 0.3 : opts.peak;
    const t = opts.when;
    const dur = opts.duration;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.01, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    let last = n.connect(g);
    if (opts.bandpass) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = opts.bandpass;
      bp.Q.value = opts.Q || 1.0;
      last.connect(bp).connect(opts.dest || master);
    } else if (opts.lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = opts.lowpass;
      last.connect(lp).connect(opts.dest || master);
    } else if (opts.highpass) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = opts.highpass;
      last.connect(hp).connect(opts.dest || master);
    } else {
      last.connect(opts.dest || master);
    }

    n.start(t);
    n.stop(t + dur + 0.02);
  }

  /*, Sound recipes ---------
     Every recipe is a function that takes the AudioContext's currentTime
     (`t0`) and schedules its oscillators/noise relative to t0. Keep them
     short, most SFX should clear in under 500 ms so they don't pile on
     top of each other in a rapid battle. */

  const SOUNDS = {
    /* QUICK ATTACK, short ascending chirp + tiny noise tail */
    quick(t0) {
      osc({ type: 'square', freqStart: 600, freqEnd: 1600, sweepType: 'exp',
            when: t0, duration: 0.08, peak: 0.32 });
      noise({ when: t0, duration: 0.05, peak: 0.10, bandpass: 2000, Q: 2 });
    },

    /* THUNDERBOLT, sharp descending zap with electric flutter */
    bolt(t0) {
      osc({ type: 'square', freqStart: 1400, freqEnd: 220, sweepType: 'exp',
            when: t0, duration: 0.22, peak: 0.35 });
      osc({ type: 'sawtooth', freqStart: 80, freqEnd: 60,
            when: t0 + 0.02, duration: 0.18, peak: 0.18 });
      noise({ when: t0, duration: 0.22, peak: 0.10, highpass: 2200 });
    },

    /* THUNDER, three-stage thunderbolt big-brother */
    thunder(t0) {
      /* Stage 1: low rumble */
      noise({ when: t0, duration: 0.18, peak: 0.20, lowpass: 250 });
      osc({ type: 'sawtooth', freqStart: 55, freqEnd: 90,
            when: t0, duration: 0.20, peak: 0.22 });
      /* Stage 2: bright crack at ~150 ms */
      osc({ type: 'square', freqStart: 1800, freqEnd: 200, sweepType: 'exp',
            when: t0 + 0.14, duration: 0.20, peak: 0.36 });
      noise({ when: t0 + 0.14, duration: 0.20, peak: 0.18, highpass: 1800 });
      /* Stage 3: tail noise */
      noise({ when: t0 + 0.30, duration: 0.18, peak: 0.08, lowpass: 800 });
    },

    /* EMBER, short crackly fire pop */
    ember(t0) {
      noise({ when: t0, duration: 0.14, peak: 0.20, bandpass: 700, Q: 1.4 });
      osc({ type: 'square', freqStart: 320, freqEnd: 180, sweepType: 'exp',
            when: t0, duration: 0.10, peak: 0.18 });
    },

    /* FLAMETHROWER, sustained roar with sweeping filter */
    flame(t0) {
      noise({ when: t0, duration: 0.30, peak: 0.26, bandpass: 600, Q: 0.9 });
      osc({ type: 'sawtooth', freqStart: 110, freqEnd: 90,
            when: t0, duration: 0.30, peak: 0.18 });
      osc({ type: 'square', freqStart: 240, freqEnd: 180, sweepType: 'exp',
            when: t0 + 0.05, duration: 0.22, peak: 0.14 });
    },

    /* OUTRAGE, dragon growl, low and vibrato-ed */
    outrage(t0) {
      /* Low fundamental + slight pitch wobble via a second osc at a beat
         frequency. The two sawtooths beat against each other and give
         that growly chorus feel. */
      osc({ type: 'sawtooth', freqStart: 75, freqEnd: 60,
            when: t0, duration: 0.42, peak: 0.30 });
      osc({ type: 'sawtooth', freqStart: 80, freqEnd: 64,
            when: t0, duration: 0.42, peak: 0.22 });
      noise({ when: t0, duration: 0.42, peak: 0.16, bandpass: 350, Q: 0.7 });
      /* High harmonic accent at ~120 ms, adds "teeth" to the growl */
      osc({ type: 'square', freqStart: 340, freqEnd: 220, sweepType: 'exp',
            when: t0 + 0.10, duration: 0.18, peak: 0.10 });
    },

    /* HIT, quick thunk on damage land */
    hit(t0) {
      noise({ when: t0, duration: 0.06, peak: 0.32, lowpass: 1200 });
      osc({ type: 'square', freqStart: 220, freqEnd: 110, sweepType: 'exp',
            when: t0, duration: 0.05, peak: 0.20 });
    },

    /* MISS, descending phew */
    miss(t0) {
      osc({ type: 'square', freqStart: 650, freqEnd: 200, sweepType: 'exp',
            when: t0, duration: 0.14, peak: 0.22, release: 0.05 });
    },

    /* WIN, 4-note ascending major arpeggio (C5 E5 G5 C6) */
    win(t0) {
      const dt = 0.11;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      for (let i = 0; i < notes.length; i++) {
        osc({ type: 'square', freqStart: notes[i],
              when: t0 + i * dt, duration: 0.16, peak: 0.34, release: 0.04 });
      }
      /* Bass anchor on the final note */
      osc({ type: 'square', freqStart: 261.63,
            when: t0 + 3 * dt, duration: 0.30, peak: 0.22, release: 0.08 });
    },

    /* TICK, quick square pip per dialog character. Quiet by design; this
       fires many times in a row so it has to sit under the page music. */
    tick(t0) {
      osc({ type: 'square', freqStart: 1800, freqEnd: 1500, sweepType: 'exp',
            when: t0, duration: 0.022, peak: 0.10,
            attack: 0.002, release: 0.012 });
    },

    /* CURSOR, two-note pip on menu navigation / scene step. */
    cursor(t0) {
      osc({ type: 'square', freqStart: 660,
            when: t0, duration: 0.045, peak: 0.22,
            attack: 0.003, release: 0.020 });
      osc({ type: 'square', freqStart: 990,
            when: t0 + 0.030, duration: 0.050, peak: 0.20,
            attack: 0.003, release: 0.022 });
    },

    /* LOSS, 3-note descending minor (G4 Eb4 C4) + low rumble */
    loss(t0) {
      const dt = 0.16;
      const notes = [392.00, 311.13, 261.63];
      for (let i = 0; i < notes.length; i++) {
        osc({ type: 'square', freqStart: notes[i],
              when: t0 + i * dt, duration: 0.22, peak: 0.30, release: 0.06 });
      }
      /* Sub-bass thud at the end */
      osc({ type: 'sawtooth', freqStart: 110, freqEnd: 65,
            when: t0 + 2 * dt + 0.10, duration: 0.40, peak: 0.20 });
      noise({ when: t0 + 2 * dt + 0.10, duration: 0.30, peak: 0.10, lowpass: 200 });
    },
  };

  /*, Public API, */

  function play(name) {
    if (!enabled) return;
    const recipe = SOUNDS[name];
    if (!recipe) return;
    const c = ensureCtx();
    if (!c) return;
    /* If the context was suspended (no gesture yet), bail silently. The
       music toggle's first-gesture handler will eventually resume it. */
    if (c.state === 'suspended') return;
    try { recipe(c.currentTime); } catch (e) { /* swallow, SFX is non-critical */ }
  }

  function setEnabled(b) { enabled = !!b; }
  function isEnabled() { return enabled; }

  window.SFX = { play, setEnabled, isEnabled };
})();
