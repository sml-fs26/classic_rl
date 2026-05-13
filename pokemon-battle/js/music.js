/* Chiptune background music — two-voice Game-Boy-style synth.
 *
 *   The melody is original (A-minor, 8-bar phrase: i — VI — VII — i — i —
 *   VI — VII — V — back to i) but the timbre, tempo, and pulsing-bass
 *   feel deliberately reach for the Gen-1 wild-battle vibe.  Two
 *   simultaneous OscillatorNodes:
 *     • Pulse 1 (square wave) — the lead.
 *     • Pulse 2 (square wave) — the bass pulse on each beat.
 *
 *   Why no copyrighted audio: we cannot ship a recording of the real
 *   Pokemon battle theme. So we synthesise something in the same
 *   ballpark using the Web Audio API. Sounds period-appropriate, ships
 *   in <2 KB, and has no licensing issues.
 *
 *   Browser autoplay policies: AudioContext starts suspended on most
 *   browsers until a user gesture. We expose Music.start() and call
 *   ctx.resume() inside it — so any click that toggles SOUND ON counts
 *   as the unlock gesture and the loop begins on the next 16th-note tick.
 *
 *   Public API:
 *     window.Music.start()       — begin / resume the loop.
 *     window.Music.stop()        — pause the loop, ramp out cleanly.
 *     window.Music.toggle()      — flip state; returns the new isPlaying.
 *     window.Music.isPlaying()   — boolean.
 *     window.Music.setVolume(v)  — 0..1 master volume.
 */
(function () {
  /* ----- Note frequencies (equal temperament, A4 = 440 Hz) ----- */
  const NOTES = {
    A2: 110.00,  B2: 123.47,  C3: 130.81,  D3: 146.83,
    E3: 164.81,  F3: 174.61,  G3: 196.00,
    A3: 220.00,  B3: 246.94,
    C4: 261.63,  D4: 293.66,  E4: 329.63,  F4: 349.23,
    G4: 392.00,  A4: 440.00,  B4: 493.88,
    C5: 523.25,  D5: 587.33,  E5: 659.25,  F5: 698.46,
    G5: 783.99,  A5: 880.00,
  };

  /* ----- 8-bar pattern, eighth-note resolution (64 steps total). -----
   *
   * Each row is one eighth-note. Cells are note keys from NOTES or null
   * for rest. Bass pulses on the downbeats of the prevailing chord:
   *   Bar 1: Am   Bar 2: F   Bar 3: G   Bar 4: Am ascending
   *   Bar 5: Am   Bar 6: F   Bar 7: G   Bar 8: E (V → resolves to i).
   *
   * The lead alternates root + fifth on bars 1-3 then breaks into
   * arpeggios on bars 4-8 to add motion before the loop point.
   */
  const PATTERN = [
    /* Bar 1 — Am */
    ['A4', 'A2'], ['E5', 'A2'], ['A4', null], ['E5', 'A2'],
    ['A4', 'A2'], ['E5', null], ['A4', 'A2'], ['E5', 'A2'],
    /* Bar 2 — F */
    ['F4', 'F2'], ['C5', 'F2'], ['F4', null], ['C5', 'F2'],
    ['F4', 'F2'], ['C5', null], ['F4', 'F2'], ['C5', 'F2'],
    /* Bar 3 — G */
    ['G4', 'G2'], ['D5', 'G2'], ['G4', null], ['D5', 'G2'],
    ['G4', 'G2'], ['D5', null], ['G4', 'G2'], ['D5', 'G2'],
    /* Bar 4 — Am arpeggio up + down (kicks the phrase off) */
    ['A4', 'A2'], ['C5', 'A2'], ['E5', null], ['A5', 'A2'],
    ['G5', 'A2'], ['E5', null], ['C5', 'A2'], ['A4', 'A2'],
    /* Bar 5 — Am arpeggio variation */
    ['A4', 'A2'], ['E5', 'A2'], ['C5', null], ['E5', 'A2'],
    ['A5', 'A2'], ['G5', null], ['E5', 'A2'], ['C5', 'A2'],
    /* Bar 6 — F arpeggio */
    ['F4', 'F2'], ['A4', 'F2'], ['C5', null], ['F5', 'F2'],
    ['E5', 'F2'], ['C5', null], ['A4', 'F2'], ['F4', 'F2'],
    /* Bar 7 — G arpeggio */
    ['G4', 'G2'], ['B4', 'G2'], ['D5', null], ['G5', 'G2'],
    ['F5', 'G2'], ['D5', null], ['B4', 'G2'], ['G4', 'G2'],
    /* Bar 8 — E major (V) leading back to Am */
    ['E4', 'E3'], ['G4', 'E3'], ['B4', null], ['E5', 'E3'],
    ['D5', 'E3'], ['B4', null], ['G4', 'E3'], ['E4', 'E3'],
  ];

  /* ----- Engine state ----- */
  const TEMPO_BPM       = 156;
  const EIGHTH_SECONDS  = 60 / TEMPO_BPM / 2;   // 0.192 s at 156 BPM
  const LOOKAHEAD_MS    = 90;
  const SCHEDULE_AHEAD  = 0.4;                  // s

  let ctx = null;
  let masterGain = null;
  let leadGain = null;
  let bassGain = null;
  let playing = false;
  let timerId = null;
  let nextNoteTime = 0;
  let stepIndex = 0;
  let volume = 0.18;     // safe default — chiptune is bright

  function ensureCtx() {
    if (ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    /* Per-voice gains so we can tweak balance. */
    leadGain = ctx.createGain();
    leadGain.gain.value = 0.42;
    leadGain.connect(masterGain);

    bassGain = ctx.createGain();
    bassGain.gain.value = 0.28;
    bassGain.connect(masterGain);
  }

  /* Schedule one note: square-wave osc + envelope-shaped gain. */
  function playNote(noteName, when, durationSeconds, voiceGain) {
    if (!noteName) return;
    const freq = NOTES[noteName];
    if (!freq) return;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, when);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(1.0, when + 0.005);
    env.gain.setValueAtTime(1.0, when + Math.max(0.01, durationSeconds * 0.6));
    env.gain.exponentialRampToValueAtTime(0.0001, when + durationSeconds);

    osc.connect(env).connect(voiceGain);
    osc.start(when);
    osc.stop(when + durationSeconds + 0.02);
  }

  function scheduler() {
    if (!playing) return;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = PATTERN[stepIndex % PATTERN.length];
      const [leadNote, bassNote] = step;
      /* Lead notes get most of the 8th's duration with a tiny gap so
         repeated pitches sound articulated, not slurred. */
      const noteDur = EIGHTH_SECONDS * 0.92;
      playNote(leadNote, nextNoteTime, noteDur, leadGain);
      /* Bass uses a shorter, punchier envelope so the pulse feels like
         a Game Boy. */
      playNote(bassNote, nextNoteTime, EIGHTH_SECONDS * 0.55, bassGain);
      nextNoteTime += EIGHTH_SECONDS;
      stepIndex++;
    }
    timerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function start() {
    ensureCtx();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return true;
    playing = true;
    /* Ramp the master gain back up if we faded it down on stop(). */
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    nextNoteTime = ctx.currentTime + 0.08;
    /* Don't reset stepIndex — resume from where we paused. */
    scheduler();
    return true;
  }

  function stop() {
    if (!playing) return false;
    playing = false;
    if (timerId) { clearTimeout(timerId); timerId = null; }
    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    }
    return false;
  }

  function toggle() { return playing ? stop() : start(); }
  function isPlaying() { return playing; }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain && playing) {
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    }
  }

  window.Music = { start, stop, toggle, isPlaying, setVolume };
})();
