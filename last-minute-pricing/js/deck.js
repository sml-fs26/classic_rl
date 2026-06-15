/* deck.js, the shared DEMAND-DRAW primitive for Last-Minute Pricing.
 *
 *   THE DEMAND JAR. You pull a price lever and a glass jar shows THAT lever's
 *   own population of outcome marbles, PREMIUM pours a pile that is mostly
 *   grey "0" duds with a couple of gold sales; STANDARD pours a jar full of
 *   gold 2s and 3s and no 0 at all, then the jar shakes and ONE marble rolls
 *   out into a catch-cup: the units sold today, k. Because the jar VISIBLY
 *   re-pours to a different mix when you switch levers, it is obvious the draw
 *   is sampled from an ACTION-SPECIFIC population. That is the fix for the old
 *   card deck, whose identical face-down back made the draw look independent of
 *   the lever, the jar literally IS P(k | lever).
 *
 *   The exact odds stay HIDDEN: the pile is a small, jumbled, fixed visual
 *   budget that leans low vs high without being countable. No percentages.
 *
 *   Same API + timing as the old deck, so every scene (playtest, tutorial,
 *   MDP, trajectory, SARSA) is untouched:
 *     mount(host, opts?) -> { flip({lever,k})->Promise, reset(), el() }
 *     draw(host, {lever,k,reduced?}) -> Promise
 *     window.Deck.TIMING        // scenes line up their ticket-slide to flipMs
 *   opts.reduced forces the instant path (also taken under prefers-reduced-motion). */
(function () {
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Kept identical so scenes that time their ticket-slide / day-tear to the
     "draw beat" (window.Deck.TIMING.flipMs) stay in sync. */
  const TIMING = {
    flipMs: 420,        // the draw beat: the marble lands in the cup around here
    holdMs: 360,        // dwell on the result before resolving
    settleMs: 80,
  };

  function prefersReduced() {
    try {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function revealText(k) {
    if (!k || k <= 0) return T('deck.none');
    return T('deck.sold', { k: k });
  }

  /* The marble population for a lever: a small, fixed visual budget whose mix
     LEANS like the lever's hidden demand (>= 1 marble of every outcome it can
     produce) but is deliberately not a countable copy of the odds. Reads off
     window.Levers.demandOf so it tracks the data, never hand-typed. */
  function mixFor(leverId) {
    const demand = (window.Levers && window.Levers.demandOf) ? window.Levers.demandOf(leverId) : null;
    if (!demand || !demand.length) return [0, 1];
    const BUDGET = 10;
    const faces = [];
    for (const kp of demand) {
      const n = Math.max(1, Math.round(kp[1] * BUDGET));
      for (let i = 0; i < n; i++) faces.push(kp[0]);
    }
    return faces;
  }

  /* A STABLE jumble (no RNG, so headless captures are identical): interleave
     by a cheap hash so the pile mixes grey duds and gold sales instead of
     showing all the 0s then all the 3s. */
  function jumbled(faces) {
    const arr = faces.map((f, i) => ({ f: f, i: i }));
    arr.sort((a, b) =>
      (((a.f * 7 + a.i * 13) % 5) - ((b.f * 7 + b.i * 13) % 5)) || (a.i - b.i));
    return arr.map((o) => o.f);
  }

  function marbleHTML(face, idx) {
    const cls = 'jar-marble ' + (face > 0 ? 'jar-sale' : 'jar-dud');
    const tilt = ((face * 5 + idx * 11) % 7) - 3;     // -3..3deg, deterministic tumble
    return '<span class="' + cls + '" style="--tilt:' + tilt + 'deg">' + face + '</span>';
  }

  /* The jar: a glass body holding the marble pile, a spout, and a catch-cup
     below where the drawn marble lands. Root class stays `demand-deck` so the
     per-scene size overrides (.scene5 .demand-deck { width/height }) still apply. */
  function build() {
    const root = document.createElement('div');
    root.className = 'demand-deck demand-jar';
    root.innerHTML =
      '<div class="jar-glass">' +
        '<div class="jar-lid" aria-hidden="true"></div>' +
        '<div class="jar-marbles" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="jar-spout" aria-hidden="true"></div>' +
      '<div class="jar-cup"><span class="jar-drawn"></span></div>' +
      '<div class="jar-label"></div>';
    return root;
  }

  function mount(host, opts) {
    const o = opts || {};
    const forceReduced = !!o.reduced;
    const root = build();
    if (host) host.appendChild(root);

    const pile = root.querySelector('.jar-marbles');
    const drawn = root.querySelector('.jar-drawn');
    const label = root.querySelector('.jar-label');
    let currentLever = null;
    let timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* Pour the given lever's marble population into the jar. */
    function renderMix(leverId) {
      pile.innerHTML = jumbled(mixFor(leverId)).map(marbleHTML).join('');
      if (leverId) root.dataset.lever = leverId;
      else root.removeAttribute('data-lever');
      currentLever = leverId;
    }

    function showDrawn(k) {
      drawn.className = 'jar-drawn ' + (k > 0 ? 'jar-sale' : 'jar-dud') + ' is-shown';
      drawn.textContent = String(k || 0);
      label.textContent = revealText(k);
      root.dataset.k = String(k || 0);
    }

    function reset() {
      clearTimers();
      root.classList.remove('is-pouring', 'is-shaking', 'is-drawing');
      drawn.className = 'jar-drawn';
      drawn.textContent = '';
      label.textContent = '';
      root.removeAttribute('data-k');
    }

    function ping(k) { if (window.SFX) window.SFX.play(k > 0 ? 'hit' : 'cursor'); }

    function flip(drawSpec) {
      drawSpec = drawSpec || {};
      const lever = drawSpec.lever || null;
      const k = drawSpec.k || 0;
      const reduced = forceReduced || prefersReduced();
      const changed = lever !== currentLever;

      clearTimers();
      drawn.className = 'jar-drawn';
      label.textContent = '';
      root.classList.remove('is-drawing');

      if (reduced) {
        return new Promise((resolve) => {
          renderMix(lever);
          showDrawn(k);
          ping(k);
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
      }

      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          /* 1) (re)pour this lever's population. A switch animates the pour so
             the player SEES the jar's contents change with the action. */
          renderMix(lever);
          if (changed) {
            root.classList.add('is-pouring');
            timers.push(setTimeout(() => root.classList.remove('is-pouring'), 240));
          }
          /* 2) shake the jar just before the draw. */
          timers.push(setTimeout(() => root.classList.add('is-shaking'), 110));
          timers.push(setTimeout(() => root.classList.remove('is-shaking'), 110 + 190));
          /* 3) one marble rolls out into the cup at the draw beat (~flipMs/2),
             tinted/numbered as k, this is when scenes slide the sold seats. */
          timers.push(setTimeout(() => {
            root.classList.add('is-drawing');
            showDrawn(k);
            ping(k);
          }, Math.round(TIMING.flipMs * 0.55)));
          /* 4) resolve once the result has settled. */
          timers.push(setTimeout(() => {
            root.classList.remove('is-drawing');
            resolve();
          }, TIMING.flipMs + TIMING.settleMs + TIMING.holdMs));
        });
      });
    }

    return { flip, reset, el: function () { return root; } };
  }

  /* Convenience one-shot: reuse a jar already mounted in `host` (cached on the
     host) or mount a fresh one, then draw once. */
  function draw(host, opts) {
    opts = opts || {};
    let handle = host && host.__deckHandle;
    if (!handle) {
      handle = mount(host, { reduced: opts.reduced });
      if (host) host.__deckHandle = handle;
    }
    return handle.flip({ lever: opts.lever, k: opts.k });
  }

  window.Deck = { mount, draw, TIMING };
})();
