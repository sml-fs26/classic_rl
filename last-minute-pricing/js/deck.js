/* deck.js -- the shared DEMAND-DRAW animation primitive for Last-Minute Pricing.
 *
 *   The signature animation of this viz: you pull a price lever, then a small
 *   DEMAND DECK flips a card to reveal how many units sell today (the only
 *   randomness in the MDP). The playtest, trajectory and SARSA scenes all
 *   share this one primitive so the "draw" looks identical everywhere.
 *
 *   What it draws: a chunky pixel card that sits face-down on a little deck,
 *   flips with a snap, and reveals "<k> SOLD" tinted in the lever's colour
 *   (or "NONE SOLD" when k = 0). The caller owns the tickets sliding off the
 *   shelf-card and the +$ flash (it owns the ShelfCard); the deck owns the
 *   card-flip, the reveal text, and the SFX. Returns a Promise that resolves
 *   when the reveal settles, so a scene can `await` it before updating the
 *   shelf / money / tape.
 *
 *   prefers-reduced-motion: the flip collapses to an instant reveal (the
 *   Promise still resolves, just on the next frame), so the page stays usable
 *   for motion-sensitive viewers and for headless screenshots.
 *
 *   API (window.Deck):
 *     mount(host, opts?) -> handle {
 *        flip({ lever, k }) -> Promise   // animate one draw, resolve at the end
 *        reset()                          // back to face-down, clear the reveal
 *        el()                             // the deck root element
 *     }
 *       opts.reduced (bool): force the reduced-motion path (tests).
 *
 *     draw(host, { lever, k, reduced? }) -> Promise
 *       Convenience: mount (or reuse) a deck inside `host` and flip once.
 *
 *   Timing constants are exported on window.Deck.TIMING so scenes can line up
 *   their own ticket-slide animation with the card flip. */
(function () {
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const TIMING = {
    flipMs: 420,        // face-down to face-up rotation
    holdMs: 360,        // dwell on the revealed face before resolving
    settleMs: 80,       // tiny settle after the flip lands
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

  /* Build the deck DOM: a short stack of face-down cards + one flipper card on
     top that carries the reveal. The flipper has a back face and a front
     face; rotateY swaps them. */
  function build() {
    const root = document.createElement('div');
    root.className = 'demand-deck';
    root.innerHTML =
      '<div class="deck-stack" aria-hidden="true">' +
        '<div class="deck-card deck-under deck-under-2"></div>' +
        '<div class="deck-card deck-under deck-under-1"></div>' +
      '</div>' +
      '<div class="deck-flipper">' +
        '<div class="deck-face deck-back">' +
          '<span class="deck-back-mark">?</span>' +
        '</div>' +
        '<div class="deck-face deck-front">' +
          '<span class="deck-front-k"></span>' +
          '<span class="deck-front-label"></span>' +
        '</div>' +
      '</div>';
    return root;
  }

  function mount(host, opts) {
    const o = opts || {};
    const forceReduced = !!o.reduced;
    const root = build();
    if (host) host.appendChild(root);

    const flipper = root.querySelector('.deck-flipper');
    const front = root.querySelector('.deck-front');
    const kEl = root.querySelector('.deck-front-k');
    const labelEl = root.querySelector('.deck-front-label');

    function applyReveal(lever, k) {
      /* Tint the revealed face in the lever's colour. */
      front.classList.remove('lever-fill-premium', 'lever-fill-standard');
      if (lever) front.classList.add('lever-fill-' + lever);
      kEl.textContent = (k && k > 0) ? ('+' + k) : '0';
      labelEl.textContent = revealText(k);
      root.dataset.k = String(k || 0);
    }

    function reset() {
      flipper.classList.remove('is-flipped', 'is-snap');
      root.removeAttribute('data-k');
      kEl.textContent = '';
      labelEl.textContent = '';
      front.classList.remove('lever-fill-premium', 'lever-fill-standard');
    }

    function flip(drawSpec) {
      drawSpec = drawSpec || {};
      const lever = drawSpec.lever || null;
      const k = drawSpec.k || 0;
      applyReveal(lever, k);

      const reduced = forceReduced || prefersReduced();

      /* The reveal "ping": a money-ish blip for a sale, a soft cursor for a
         no-sale. SFX is globally gated (off unless music is on). */
      function ping() {
        if (!window.SFX) return;
        window.SFX.play(k > 0 ? 'hit' : 'cursor');
      }

      if (reduced) {
        return new Promise((resolve) => {
          flipper.classList.add('is-flipped');
          ping();
          /* Resolve on the next frame so callers can chain reliably. */
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
      }

      return new Promise((resolve) => {
        /* Start the flip on the next frame so the reveal text is painted on
           the (initially hidden) front face before it rotates into view. */
        requestAnimationFrame(() => {
          flipper.classList.add('is-flipped');
          /* Snap accent + ping land when the card is roughly edge-on. */
          setTimeout(() => {
            flipper.classList.add('is-snap');
            ping();
          }, Math.round(TIMING.flipMs * 0.5));
          setTimeout(() => {
            flipper.classList.remove('is-snap');
            resolve();
          }, TIMING.flipMs + TIMING.settleMs + TIMING.holdMs);
        });
      });
    }

    return { flip, reset, el: function () { return root; } };
  }

  /* Convenience one-shot: reuse a deck already mounted in `host` (cached on
     the host) or mount a fresh one, then flip once. */
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
