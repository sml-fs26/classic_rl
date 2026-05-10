/* Autoplay engine for scenes 3 and 4.

   Drives a function `step()` at a configurable rate via setInterval. Plays /
   pauses / steps / resets. The scene supplies the step function and is
   responsible for actually mutating state and re-rendering on each tick —
   the engine is just a clock with the right knobs.

   Concretely:

     const engine = Autoplay.create({
       maxSteps: 200,
       stepFn:   (t) => { ... pull, update, render, return state.t; },
       onTick:   (t) => { update HUD, etc. },
       onPause:  () => { ... },
       onComplete: () => { ... },
       speed: 8,   // steps per second; UI default
     });

   Then attach the controls:

     engine.attachControls({
       playBtn, pauseBtn, stepBtn, resetBtn, speedSlider,
     });

   Scene's onLeave must call `engine.dispose()` to clear the interval — SKILL
   §"persistent widget caveat" — otherwise the timer keeps firing after the
   user has navigated away. */

(function () {

  function create(opts) {
    const maxSteps = opts.maxSteps;
    const stepFn   = opts.stepFn;
    const onTick   = opts.onTick   || (() => {});
    const onPause  = opts.onPause  || (() => {});
    const onComplete = opts.onComplete || (() => {});
    const onReset  = opts.onReset  || (() => {});
    let speed = opts.speed || 8;

    let timer = null;
    let t = 0;
    let playing = false;

    function tick() {
      if (t >= maxSteps) {
        pause();
        onComplete();
        return;
      }
      t = stepFn(t) ?? (t + 1);
      onTick(t);
      if (t >= maxSteps) {
        pause();
        onComplete();
      }
    }

    function play() {
      if (playing) return;
      if (t >= maxSteps) return;
      playing = true;
      const periodMs = Math.max(20, Math.round(1000 / Math.max(1, speed)));
      timer = setInterval(tick, periodMs);
      tick();   /* fire one immediately so the first frame doesn't lag */
    }

    function pause() {
      if (!playing && !timer) return;
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      onPause();
    }

    function stepOnce() {
      if (playing) pause();
      if (t >= maxSteps) return;
      tick();
    }

    function reset() {
      pause();
      t = 0;
      onReset();
    }

    function setSpeed(s) {
      speed = Math.max(1, Math.min(60, +s || 1));
      if (playing) {
        clearInterval(timer);
        const periodMs = Math.max(20, Math.round(1000 / speed));
        timer = setInterval(tick, periodMs);
      }
    }

    function dispose() {
      pause();
    }

    /* Wire DOM controls. Returns a teardown fn. */
    function attachControls(els) {
      const handlers = [];
      function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        handlers.push(() => el.removeEventListener(ev, fn));
      }
      on(els.playBtn,  'click', play);
      on(els.pauseBtn, 'click', pause);
      on(els.stepBtn,  'click', stepOnce);
      on(els.resetBtn, 'click', () => reset());
      on(els.speedSlider, 'input', (e) => setSpeed(e.target.value));
      return () => { for (const fn of handlers) fn(); };
    }

    return {
      play,
      pause,
      stepOnce,
      reset,
      setSpeed,
      attachControls,
      dispose,
      isPlaying() { return playing; },
      currentT()  { return t; },
      maxT()      { return maxSteps; },
    };
  }

  window.Autoplay = { create };
})();
