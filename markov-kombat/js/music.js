/* Chiptune background music — two-voice Game-Boy-style synth.
 *
 *   Multiple tracks, one per scene mood. Music.setTrack(key) cross-fades
 *   between them: master gain ramps to ~0 over 180 ms, the pattern +
 *   tempo + per-voice balance swap, master gain ramps back up.
 *
 *   All melodies are original; the timbre and pulsing-bass feel borrow
 *   from the Gen-1 sound rather than any specific theme. Two
 *   simultaneous square-wave OscillatorNodes (lead + bass) with per-note
 *   envelope shaping.
 *
 *   Tracks:
 *     title       — heroic D major arpeggios (scene 0)
 *     tutorial    — gentle F-major loop (scene 1)
 *     battle      — energetic A-minor battle loop (scenes 2 + 9)
 *     concept     — contemplative E-minor (scenes 3-5)
 *     dp          — methodical A-minor puzzle loop (scene 6)
 *     bridge      — tense C-minor build (scenes 7-8)
 *     eps         — bouncy syncopated G major (scene 10)
 *     recap       — triumphant C major (scene 11)
 *
 *   Browser autoplay policies: AudioContext starts suspended. Music
 *   starts only after a user gesture (handled by music-ui.js); we just
 *   honour that here.
 *
 *   Public API:
 *     Music.start() / stop() / toggle() / isPlaying() / setVolume(v)
 *     Music.setTrack(key)
 */
(function () {
  /* ----- Note frequencies (equal temperament, A4 = 440 Hz) ----- */
  const NOTES = {
    /* Low bass / sub */
    D2: 73.42,  E2: 82.41,  F2: 87.31,  G2: 98.00,
    Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
    /* Bb is sometimes written As2 (A♯) — same pitch. We use the As/Gs
       names consistently in the patterns so the key strings are valid
       JS identifiers (no '#' or 'b'). */
    /* Middle */
    C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00,
    Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
    C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99,
    G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99,
    G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
    C6: 1046.50,
  };

  /* Each entry is one eighth-note step: [lead, bass]. null = rest.
     Track loops by wrapping the step index modulo the pattern length. */

  /* ----- TRACKS ----- */

  const TRACK_TITLE = {
    tempoBpm: 122, leadGain: 0.36, bassGain: 0.30,
    pattern: [
      /* Bar 1 — D major heroic arpeggio */
      ['D4', 'D3'], ['Fs4', null], ['A4', 'A3'], ['D5', null],
      ['Fs5', 'D3'], ['A5', null], ['D5', 'A3'], ['A4', null],
      /* Bar 2 — A major */
      ['A4', 'A2'], ['Cs5', null], ['E5', 'E3'], ['A5', null],
      ['G5', 'A2'], ['E5', null], ['Cs5', 'E3'], ['A4', null],
      /* Bar 3 — B minor */
      ['B3', 'B2'], ['D4', null], ['Fs4', 'Fs3'], ['B4', null],
      ['D5', 'B2'], ['Fs5', null], ['B4', 'Fs3'], ['D4', null],
      /* Bar 4 — G major leading back to D */
      ['G3', 'G2'], ['B3', null], ['D4', 'D3'], ['G4', null],
      ['B4', 'G2'], ['D5', null], ['G4', 'D3'], ['D4', null],
    ],
  };

  const TRACK_TUTORIAL = {
    tempoBpm: 102, leadGain: 0.30, bassGain: 0.22,
    pattern: [
      /* Bar 1 — F major */
      ['F4', 'F2'], ['A4', null], ['C5', 'C3'], ['A4', null],
      ['F4', 'F2'], ['A4', null], ['C5', 'C3'], ['A4', null],
      /* Bar 2 — D minor */
      ['D4', 'D3'], ['F4', null], ['A4', 'A2'], ['F4', null],
      ['D4', 'D3'], ['F4', null], ['A4', 'A2'], ['F4', null],
      /* Bar 3 — Bb major */
      ['As3', 'As2'], ['D4', null], ['F4', 'F2'], ['D4', null],
      ['As3', 'As2'], ['D4', null], ['F4', 'F2'], ['D4', null],
      /* Bar 4 — C major */
      ['C4', 'C3'], ['E4', null], ['G4', 'G2'], ['E4', null],
      ['C4', 'C3'], ['E4', null], ['G4', 'G2'], ['E4', null],
    ],
  };

  /* This is the original "battle" loop we shipped first — kept for
     scene 2 (the actual battle, MDP intro) and scene 9 (SARSA in
     action). The tempo and the i-VI-VII-i-i-VI-VII-V progression are
     unchanged. */
  const TRACK_BATTLE = {
    tempoBpm: 156, leadGain: 0.42, bassGain: 0.28,
    pattern: [
      /* Bar 1 — Am */
      ['A4', 'A2'], ['E5', 'A2'], ['A4', null], ['E5', 'A2'],
      ['A4', 'A2'], ['E5', null], ['A4', 'A2'], ['E5', 'A2'],
      /* Bar 2 — F */
      ['F4', 'F2'], ['C5', 'F2'], ['F4', null], ['C5', 'F2'],
      ['F4', 'F2'], ['C5', null], ['F4', 'F2'], ['C5', 'F2'],
      /* Bar 3 — G */
      ['G4', 'G2'], ['D5', 'G2'], ['G4', null], ['D5', 'G2'],
      ['G4', 'G2'], ['D5', null], ['G4', 'G2'], ['D5', 'G2'],
      /* Bar 4 — Am arpeggio */
      ['A4', 'A2'], ['C5', 'A2'], ['E5', null], ['A5', 'A2'],
      ['G5', 'A2'], ['E5', null], ['C5', 'A2'], ['A4', 'A2'],
      /* Bar 5 — Am variation */
      ['A4', 'A2'], ['E5', 'A2'], ['C5', null], ['E5', 'A2'],
      ['A5', 'A2'], ['G5', null], ['E5', 'A2'], ['C5', 'A2'],
      /* Bar 6 — F arpeggio */
      ['F4', 'F2'], ['A4', 'F2'], ['C5', null], ['F5', 'F2'],
      ['E5', 'F2'], ['C5', null], ['A4', 'F2'], ['F4', 'F2'],
      /* Bar 7 — G arpeggio */
      ['G4', 'G2'], ['B4', 'G2'], ['D5', null], ['G5', 'G2'],
      ['F5', 'G2'], ['D5', null], ['B4', 'G2'], ['G4', 'G2'],
      /* Bar 8 — E (V) */
      ['E4', 'E3'], ['G4', 'E3'], ['B4', null], ['E5', 'E3'],
      ['D5', 'E3'], ['B4', null], ['G4', 'E3'], ['E4', 'E3'],
    ],
  };

  /* Sparse, contemplative — used for trajectory / return-and-Q / Q*. */
  const TRACK_CONCEPT = {
    tempoBpm: 96, leadGain: 0.28, bassGain: 0.20,
    pattern: [
      /* Bar 1 — Em */
      ['E4', 'E2'], [null, null], ['G4', null], [null, null],
      ['B4', 'E2'], [null, null], ['G4', null], [null, null],
      /* Bar 2 — C */
      ['C4', 'C3'], [null, null], ['E4', null], [null, null],
      ['G4', 'C3'], [null, null], ['E4', null], [null, null],
      /* Bar 3 — G */
      ['G3', 'G2'], [null, null], ['B3', null], [null, null],
      ['D4', 'G2'], [null, null], ['B3', null], [null, null],
      /* Bar 4 — D (leads back to Em) */
      ['D4', 'D3'], [null, null], ['Fs4', null], [null, null],
      ['A4', 'D3'], [null, null], ['Fs4', null], [null, null],
    ],
  };

  /* Methodical, puzzle-y — for the DP scene. */
  const TRACK_DP = {
    tempoBpm: 110, leadGain: 0.32, bassGain: 0.26,
    pattern: [
      /* Bar 1 — Am, walking arpeggio */
      ['A3', 'A2'], ['C4', null], ['E4', 'A2'], ['C4', null],
      ['A3', 'A2'], ['C4', null], ['E4', 'A2'], ['C4', null],
      /* Bar 2 — F, parallel motion */
      ['F3', 'F2'], ['A3', null], ['C4', 'F2'], ['A3', null],
      ['F3', 'F2'], ['A3', null], ['C4', 'F2'], ['A3', null],
      /* Bar 3 — G */
      ['G3', 'G2'], ['B3', null], ['D4', 'G2'], ['B3', null],
      ['G3', 'G2'], ['B3', null], ['D4', 'G2'], ['B3', null],
      /* Bar 4 — Em (natural minor V) */
      ['E3', 'E2'], ['G3', null], ['B3', 'E2'], ['G3', null],
      ['E3', 'E2'], ['G3', null], ['B3', 'E2'], ['G3', null],
    ],
  };

  /* Tense, building — bridge from "DP fails" through SARSA derivation. */
  const TRACK_BRIDGE = {
    tempoBpm: 128, leadGain: 0.36, bassGain: 0.28,
    pattern: [
      /* Bar 1 — Cm */
      ['C4', 'C3'], ['Eb4', null], ['G4', 'C3'], ['Eb4', null],
      ['C4', 'C3'], ['Eb4', null], ['G4', 'C3'], ['Eb4', null],
      /* Bar 2 — Ab (VI) */
      ['Gs3', 'Gs2'], ['C4', null], ['Eb4', 'Gs2'], ['C4', null],
      ['Gs3', 'Gs2'], ['C4', null], ['Eb4', 'Gs2'], ['C4', null],
      /* Bar 3 — G (V) */
      ['G3', 'G2'], ['B3', null], ['D4', 'G2'], ['B3', null],
      ['G3', 'G2'], ['B3', null], ['D4', 'G2'], ['B3', null],
      /* Bar 4 — Cm with leading-tone climb */
      ['C4', 'C3'], ['Eb4', null], ['G4', 'C3'], ['C5', null],
      ['G4', 'C3'], ['Eb4', null], ['C4', 'C3'], ['G3', null],
    ],
  };

  /* Bouncy, dice-rolling — for ε-greedy zoom. */
  const TRACK_EPS = {
    tempoBpm: 138, leadGain: 0.36, bassGain: 0.28,
    pattern: [
      /* Bar 1 — G */
      ['G4', 'G2'], [null, null], ['B4', null], ['D5', 'G2'],
      [null, null], ['B4', null], ['G4', 'G2'], [null, null],
      /* Bar 2 — Em */
      ['E4', 'E2'], [null, null], ['G4', null], ['B4', 'E2'],
      [null, null], ['G4', null], ['E4', 'E2'], [null, null],
      /* Bar 3 — C */
      ['C4', 'C3'], [null, null], ['E4', null], ['G4', 'C3'],
      [null, null], ['E4', null], ['C4', 'C3'], [null, null],
      /* Bar 4 — D, denser run */
      ['D4', 'D3'], ['Fs4', null], ['A4', 'D3'], ['D5', null],
      ['Fs5', 'D3'], ['A4', null], ['D4', 'D3'], [null, null],
    ],
  };

  /* Triumphant — recap / hall of fame. */
  const TRACK_RECAP = {
    tempoBpm: 124, leadGain: 0.40, bassGain: 0.32,
    pattern: [
      /* Bar 1 — C */
      ['C4', 'C3'], ['E4', null], ['G4', 'G3'], ['C5', null],
      ['E5', 'C3'], ['G4', null], ['E4', 'G3'], ['C4', null],
      /* Bar 2 — F */
      ['F4', 'F2'], ['A4', null], ['C5', 'C3'], ['F5', null],
      ['A5', 'F2'], ['C5', null], ['A4', 'C3'], ['F4', null],
      /* Bar 3 — G */
      ['G4', 'G2'], ['B4', null], ['D5', 'D3'], ['G5', null],
      ['B5', 'G2'], ['D5', null], ['B4', 'D3'], ['G4', null],
      /* Bar 4 — C climax */
      ['C4', 'C3'], ['E4', null], ['G4', 'G3'], ['C5', null],
      ['E5', 'C3'], ['G5', null], ['C6', 'C3'], ['G5', null],
    ],
  };

  const TRACKS = {
    title:    TRACK_TITLE,
    tutorial: TRACK_TUTORIAL,
    battle:   TRACK_BATTLE,
    concept:  TRACK_CONCEPT,
    dp:       TRACK_DP,
    bridge:   TRACK_BRIDGE,
    eps:      TRACK_EPS,
    recap:    TRACK_RECAP,
  };
  let currentTrackKey = 'battle';

  /* ----- Engine state ----- */
  const LOOKAHEAD_MS   = 90;
  const SCHEDULE_AHEAD = 0.4;     // s
  let   volume         = 0.18;

  let ctx = null;
  let masterGain = null;
  let leadGain = null;
  let bassGain = null;
  let playing = false;
  let timerId = null;
  let transitionTimer = null;
  let nextNoteTime = 0;
  let stepIndex = 0;

  function ensureCtx() {
    if (ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    leadGain = ctx.createGain();
    leadGain.gain.value = 0.42;
    leadGain.connect(masterGain);

    bassGain = ctx.createGain();
    bassGain.gain.value = 0.28;
    bassGain.connect(masterGain);

    applyTrackParams();
  }

  function applyTrackParams() {
    const t = TRACKS[currentTrackKey] || TRACK_BATTLE;
    if (leadGain) leadGain.gain.value = t.leadGain;
    if (bassGain) bassGain.gain.value = t.bassGain;
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
    if (!playing || !ctx) return;
    const track = TRACKS[currentTrackKey] || TRACK_BATTLE;
    const eighth = 60 / track.tempoBpm / 2;
    const pattern = track.pattern;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = pattern[stepIndex % pattern.length];
      const [leadNote, bassNote] = step;
      playNote(leadNote, nextNoteTime, eighth * 0.92, leadGain);
      playNote(bassNote, nextNoteTime, eighth * 0.55, bassGain);
      nextNoteTime += eighth;
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
    applyTrackParams();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    nextNoteTime = ctx.currentTime + 0.08;
    scheduler();
    return true;
  }

  function stop() {
    if (!playing) return false;
    playing = false;
    if (timerId) { clearTimeout(timerId); timerId = null; }
    if (transitionTimer) { clearTimeout(transitionTimer); transitionTimer = null; }
    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    }
    return false;
  }

  /* Cross-fade to a new track. If the engine is idle (no AudioContext
     yet, or paused), we just update the variable so the right track
     plays whenever the user finally clicks SOUND. */
  function setTrack(key) {
    if (!TRACKS[key]) return;
    if (key === currentTrackKey) return;
    currentTrackKey = key;
    stepIndex = 0;
    if (!ctx || !playing) {
      applyTrackParams();
      return;
    }
    if (transitionTimer) { clearTimeout(transitionTimer); transitionTimer = null; }
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    transitionTimer = setTimeout(() => {
      transitionTimer = null;
      if (!playing) return;
      applyTrackParams();
      nextNoteTime = ctx.currentTime + 0.04;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.20);
    }, 200);
  }

  function toggle() { return playing ? stop() : start(); }
  function isPlaying() { return playing; }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain && playing) {
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    }
  }

  window.Music = { start, stop, toggle, isPlaying, setVolume, setTrack };
})();
