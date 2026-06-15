/* Scene 10, "Why DP doesn't scale": the typographic blow-up, step-revealed.
 *
 *   A breather between two heavy scenes. Five internal states, stepped by
 *   the one button (or NEXT / PREV):
 *
 *     step 0  the toy: our whiteboard van, 4 states, 12 Q-cells. cute.
 *     step 1  WALL 1, the rows: multiply in the state factors a real fleet
 *             sheet would track, one chip at a time (odometer buckets x age
 *             x weeks since service x route load) -> 4,160,000 states, ONE
 *             van. Chips land ~250ms apart and the running product counts
 *             up odometer-style as each factor multiplies in.
 *     step 2  x a modest fleet of 40 vans -> 166,400,000; x 3 calls ->
 *             499,200,000 Q-cells. The big number is the whole argument.
 *     step 3  WALL 2, the columns: DP also needs p(s'|s,a) per row, and
 *             nobody prints breakdown odds for YOUR van on YOUR routes.
 *     step 4  the bridge: the logbook exists. (state, call, money, next
 *             state), every week. Could the table be filled from THAT?
 *
 *   Honesty: the toy numbers (4 states, 3 calls, 12 cells) come from the
 *   live engine; the blow-up factors are an ILLUSTRATIVE modest-fleet
 *   estimate, declared in one list below, multiplied in code and labelled
 *   on screen as an illustration, never as data.
 *
 *   Contract: window.scenes.scene10 = function(root){ return {...}; }
 *   Cold-entry safe; all timers tracked and cleared on onLeave / re-step.
 *   The step button carries [data-run-primary].
 */
(function () {
  window.scenes = window.scenes || {};

  /* The illustrative real-fleet state factors (a MODEST fleet, see header).
     Values only ever reach the screen through the products computed below. */
  const STATE_FACTORS = [
    { value: 200, label: 'ODOMETER',       sub: '5,000 KM BUCKETS' },
    { value: 40,  label: 'AGE',            sub: 'IN QUARTERS' },
    { value: 104, label: 'SINCE SERVICE',  sub: 'IN WEEKS' },
    { value: 5,   label: 'ROUTE LOAD',     sub: 'CLASS' },
  ];
  const FLEET_VANS = 40;

  const fmt = (n) => n.toLocaleString('en-US');

  window.scenes.scene10 = function (root) {
    root.classList.add('scene-pad', 'scene10-scene');
    root.innerHTML = '';

    const TOY_STATES = (window.Van && window.Van.NUM_STATES) || 4;
    const NUM_ACTIONS = (window.Actions && window.Actions.MOVE_IDS.length) || 3;
    const TOY_CELLS = TOY_STATES * NUM_ACTIONS;

    /* The blow-up, computed (never typed): 4,160,000 / 166,400,000 / 499,200,000. */
    const oneVanStates = STATE_FACTORS.reduce((p, f) => p * f.value, 1);
    const fleetStates  = oneVanStates * FLEET_VANS;
    const qCells       = fleetStates * NUM_ACTIONS;

    const RUN = /[#&?]run\b/.test(window.location.hash || '');
    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const A = (ms) => (RUN || reduceMotion) ? Math.min(ms, 50) : ms;

    /*, DOM, */
    const h = document.createElement('h2');
    h.className = 'concept-heading';
    h.textContent = "WHY DP DOESN'T SCALE";
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 's10-lede';
    lede.innerHTML =
      'That sheet was tiny and the odds were printed. ' +
      'Price what a <b>real fleet sheet</b> looks like.';
    root.appendChild(lede);

    /* the big number */
    const bigWrap = document.createElement('div');
    bigWrap.className = 's10-bigwrap';
    bigWrap.innerHTML =
      '<div class="s10-bigtag" id="s10-bigtag" hidden>WALL 1: TOO MANY ROWS</div>' +
      '<div class="s10-big" id="s10-big"></div>' +
      '<div class="s10-unit" id="s10-unit"></div>' +
      '<div class="s10-note" id="s10-note"></div>';
    root.appendChild(bigWrap);

    /* the factor chips */
    const rail = document.createElement('div');
    rail.className = 's10-rail';
    root.appendChild(rail);

    function chip(html, cls) {
      const el = document.createElement('span');
      el.className = 's10-chip' + (cls ? ' ' + cls : '');
      el.innerHTML = html;
      el.hidden = true;
      rail.appendChild(el);
      return el;
    }
    const toyChip = chip(
      '<b>' + TOY_STATES + '</b><span class="s10-chip-lab">WEAR LEVELS<br>THE WHITEBOARD</span>',
      's10-chip-toy');
    const factorChips = STATE_FACTORS.map((f, i) => chip(
      (i > 0 ? '<span class="s10-chip-x">&times;</span>' : '') +
      '<b>' + fmt(f.value) + '</b>' +
      '<span class="s10-chip-lab">' + f.label + '<br>' + f.sub + '</span>'));
    const fleetChip = chip(
      '<span class="s10-chip-x">&times;</span><b>' + fmt(FLEET_VANS) + '</b>' +
      '<span class="s10-chip-lab">VANS<br>A MODEST FLEET</span>', 's10-chip-fleet');
    const callsChip = chip(
      '<span class="s10-chip-x">&times;</span><b>' + NUM_ACTIONS + '</b>' +
      '<span class="s10-chip-lab">CALLS<br>RUN / SVC / NEW</span>', 's10-chip-fleet');

    const disclaim = document.createElement('div');
    disclaim.className = 'poke-caption s10-disclaim';
    disclaim.textContent =
      'a modest real fleet, sketched for scale: the factor list is an illustration, not model data.';
    disclaim.hidden = true;
    root.appendChild(disclaim);

    /* WALL 2: the columns */
    const wall = document.createElement('div');
    wall.className = 's10-wall';
    wall.hidden = true;
    wall.innerHTML =
      '<div class="s10-wall-head"><span class="s10-tag">WALL 2: THE COLUMNS</span>' +
        '<span class="s10-wall-title">AND THE ODDS DP FEEDS ON?</span></div>' +
      '<div class="s10-wall-row">' +
        '<div class="s10-wall-formula" id="s10-pform"></div>' +
        '<p class="s10-wall-body">every backup so far read <b>p(s&prime;|s,a)</b> straight off ' +
        'the sheet. nobody prints breakdown odds for <b>YOUR</b> van on <b>YOUR</b> routes.</p>' +
      '</div>';
    root.appendChild(wall);
    window.Katex.render(
      String.raw`\underbrace{p(s' \mid s,\,a)}_{\textbf{?}}`,
      wall.querySelector('#s10-pform'), true
    );

    /* the bridge */
    const bridge = document.createElement('div');
    bridge.className = 's10-bridge';
    bridge.hidden = true;
    bridge.innerHTML =
      '<div class="s10-tag s10-tag-bridge">THE WAY OUT</div>' +
      '<p class="s10-bridge-body">but the <b>logbook</b> exists: every week wrote down ' +
      '<span class="s10-logline">(state, call, money, next state)</span>. ' +
      'what if the table could be filled from THAT alone?</p>' +
      '<div class="s10-bridge-next">NEXT: SARSA &#9654;</div>';
    root.appendChild(bridge);

    /* controls */
    const ctrl = document.createElement('div');
    ctrl.className = 's10-ctrl';
    ctrl.innerHTML = '<button class="poke-btn" id="s10-go" data-run-primary>MAKE IT REAL</button>';
    root.appendChild(ctrl);
    const goBtn = ctrl.querySelector('#s10-go');
    const BTN_LABELS = ['MAKE IT REAL', 'ADD THE FLEET', 'AND THE ODDS?', 'THE WAY OUT', 'ON TO SARSA'];

    const bigEl  = bigWrap.querySelector('#s10-big');
    const unitEl = bigWrap.querySelector('#s10-unit');
    const noteEl = bigWrap.querySelector('#s10-note');
    const tagEl  = bigWrap.querySelector('#s10-bigtag');

    /*, step engine, */
    let step = 0;
    let shown = 0;               /* the number currently on the big readout */
    let rampId = null;           /* in-flight odometer rAF, if any */
    const timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() {
      while (timers.length) clearTimeout(timers.pop());
      cancelRamp();
    }
    function cancelRamp() {
      if (rampId != null) { cancelAnimationFrame(rampId); rampId = null; }
    }

    function setBig(n, unit, pop) {
      cancelRamp();
      shown = n;
      bigEl.textContent = fmt(n);
      unitEl.textContent = unit;
      if (pop) {
        bigEl.classList.remove('s10-pop');
        void bigEl.offsetWidth;
        bigEl.classList.add('s10-pop');
        if (window.SFX) window.SFX.play('tick');
      }
    }

    /* Odometer ramp: count the big readout up from its current value to n
       over ~ms, then snap-pop. Skipped under &run / reduced motion. */
    function rampBig(n, unit, ms) {
      cancelRamp();
      if (RUN || reduceMotion || !(ms > 0)) { setBig(n, unit, true); return; }
      const from = shown;
      unitEl.textContent = unit;
      const t0 = performance.now();
      (function frame(now) {
        const u = Math.min(1, (now - t0) / ms);
        const eased = 1 - Math.pow(1 - u, 3);
        shown = Math.round(from + (n - from) * eased);
        bigEl.textContent = fmt(shown);
        if (u < 1) rampId = requestAnimationFrame(frame);
        else { rampId = null; setBig(n, unit, true); }
      })(t0);
    }

    /* Draw the FINAL state of step i instantly (used for PREV, cold entry,
       and as the base the animated advance builds on). */
    function renderInstant(i) {
      clearTimers();
      step = i;
      tagEl.hidden = i < 1;
      toyChip.hidden = false;
      toyChip.classList.toggle('s10-retired', i >= 1);
      factorChips.forEach((c) => { c.hidden = i < 1; c.classList.remove('s10-land'); });
      fleetChip.hidden = i < 2;
      callsChip.hidden = i < 2;
      fleetChip.classList.remove('s10-land');
      callsChip.classList.remove('s10-land');
      disclaim.hidden = i < 1;
      wall.hidden = i < 3;
      bridge.hidden = i < 4;

      if (i === 0) {
        setBig(TOY_STATES, 'STATES. THE WHITEBOARD VAN.', false);
        noteEl.innerHTML = 'our whiteboard van: ' + TOY_STATES + ' states. cute. ' +
          '&times; ' + NUM_ACTIONS + ' calls = <b>' + TOY_CELLS + ' Q-cells</b>. you can read all twelve.';
      } else if (i === 1) {
        setBig(oneVanStates, 'STATES. ONE REAL VAN.', false);
        noteEl.innerHTML = 'track what the workshop tracks and ONE van is already <b>' +
          fmt(oneVanStates) + ' states</b>.';
      } else {
        setBig(qCells, 'Q-CELLS TO FILL.', false);
        noteEl.innerHTML = fmt(fleetStates) + ' fleet states &times; ' + NUM_ACTIONS +
          ' calls = <b>' + fmt(qCells) + ' cells</b>. no whiteboard holds that. no sweep visits it.';
      }

      goBtn.textContent = BTN_LABELS[Math.min(i, BTN_LABELS.length - 1)];
      goBtn.disabled = false;
    }

    function land(el, fn) {
      el.hidden = false;
      el.classList.remove('s10-land');
      void el.offsetWidth;
      el.classList.add('s10-land');
      if (fn) fn();
    }

    /* Animated advance INTO step i: chips land one at a time and the big
       number snaps to the running product with each landing. */
    function advanceTo(i) {
      renderInstant(i - 1);          /* base state */
      step = i;
      goBtn.textContent = BTN_LABELS[Math.min(i, BTN_LABELS.length - 1)];
      goBtn.disabled = false;

      if (i === 1) {
        tagEl.hidden = false;
        disclaim.hidden = false;
        toyChip.classList.add('s10-retired');
        let prod = 1;
        STATE_FACTORS.forEach((f, k) => {
          later(() => {
            prod *= f.value;
            const done = k === STATE_FACTORS.length - 1;
            land(factorChips[k], () => rampBig(prod, 'STATES. ONE REAL VAN.', A(210)));
            if (done) noteEl.innerHTML = 'track what the workshop tracks and ONE van is already <b>' +
              fmt(oneVanStates) + ' states</b>.';
            else noteEl.innerHTML = 'multiplying in what a real sheet tracks&hellip;';
          }, A(160 + k * 250));
        });
      } else if (i === 2) {
        later(() => {
          land(fleetChip, () => rampBig(fleetStates, 'STATES. THE WHOLE FLEET.', A(220)));
          noteEl.innerHTML = 'a modest fleet of ' + FLEET_VANS + ' vans&hellip;';
        }, A(160));
        later(() => {
          land(callsChip, () => rampBig(qCells, 'Q-CELLS TO FILL.', A(220)));
          noteEl.innerHTML = fmt(fleetStates) + ' fleet states &times; ' + NUM_ACTIONS +
            ' calls = <b>' + fmt(qCells) + ' cells</b>. no whiteboard holds that. no sweep visits it.';
          if (window.SFX) window.SFX.play('hit');
        }, A(160 + 560));
      } else if (i === 3) {
        wall.hidden = false;
        wall.classList.remove('s10-reveal');
        void wall.offsetWidth;
        wall.classList.add('s10-reveal');
        if (window.SFX) window.SFX.play('hit');
      } else if (i === 4) {
        bridge.hidden = false;
        bridge.classList.remove('s10-reveal');
        void bridge.offsetWidth;
        bridge.classList.add('s10-reveal');
        if (window.SFX) window.SFX.play('win');
      }
    }

    goBtn.addEventListener('click', () => {
      if (step < 4) advanceTo(step + 1);
      else if (window.VanViz) window.VanViz.goTo(window.VanViz.getCurrentScene() + 1);
    });

    renderInstant(0);

    /* &s10step=N: deep link / headless capture of a later step (0..4). */
    const m = (window.location.hash || '').match(/[#&?]s10step=(\d)/);
    if (m) renderInstant(Math.max(0, Math.min(4, parseInt(m[1], 10))));

    return {
      onEnter() { renderInstant(step); },
      onLeave() { clearTimers(); },
      onNextKey() {
        if (step < 4) { advanceTo(step + 1); return true; }
        return false;
      },
      onPrevKey() {
        if (step > 0) {
          renderInstant(step - 1);
          if (window.SFX) window.SFX.play('cursor');
          return true;
        }
        return false;
      },
    };
  };
})();
