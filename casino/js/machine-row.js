/* Shared machine-row widget. Used by scenes 0–4 and 6.

   Renders five slot-machine cards. Each card has:
     - the slot-machine line-art sprite (arm-coloured)
     - the machine name
     - the "screen" — empirical probability or '?'
     - a pulls counter

   The row is fully data-driven from a Bandit instance:
       update(bandit)       — re-render screen text and pulls counts
   plus optional decoration calls:
       flashWin(arm)        — flash card + chip rises
       flashLoss(arm)       — flash card grey
       setLastChosen(arm)   — ring around most-recent pull (autoplay scenes)
       clearLastChosen()    — drop the ring
       setClickable(fn)     — attach click + key-1..K handlers (scenes 1-2)
       setRevealed(boolean) — show/hide the 'true: 0.NN' line (scene 6)

   The widget is theme-agnostic: all colours come from CSS classes on the
   cards (.arm-1 … .arm-K). No inline colour. */

(function () {

  const SLOT_SVG =
    '<svg viewBox="0 0 64 80" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="10" y="14" width="44" height="56" rx="4"/>' +
        '<rect x="14" y="6" width="36" height="10" rx="2"/>' +
        '<rect x="16" y="22" width="32" height="20" rx="2"/>' +
        '<line x1="26" y1="22" x2="26" y2="42"/>' +
        '<line x1="38" y1="22" x2="38" y2="42"/>' +
        '<circle cx="22" cy="52" r="3"/>' +
        '<circle cx="32" cy="52" r="3"/>' +
        '<circle cx="42" cy="52" r="3"/>' +
        '<line x1="22" y1="62" x2="42" y2="62"/>' +
        '<line x1="54" y1="34" x2="60" y2="22"/>' +
        '<circle cx="60" cy="22" r="3" fill="currentColor"/>' +
      '</g>' +
    '</svg>';

  const CHIP_SVG =
    '<svg viewBox="0 0 32 32" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="16" cy="16" r="12"/>' +
        '<circle cx="16" cy="16" r="6"/>' +
        '<line x1="16" y1="2" x2="16" y2="6"/>' +
        '<line x1="16" y1="26" x2="16" y2="30"/>' +
        '<line x1="2" y1="16" x2="6" y2="16"/>' +
        '<line x1="26" y1="16" x2="30" y2="16"/>' +
      '</g>' +
    '</svg>';

  /* mount(host, opts) builds the row and returns a controller.
     opts:
       K              — number of arms
       armNames       — string[] of length K
       trueProbs      — optional number[] of length K (only used when revealed) */
  function mount(host, opts) {
    const K = opts.K;
    const armNames = opts.armNames;
    const trueProbs = opts.trueProbs || [];
    let clickHandler = null;
    let keyHandler = null;

    host.classList.add('machine-row');
    host.innerHTML = '';

    const cards = [];
    for (let i = 0; i < K; i++) {
      const card = document.createElement('div');
      card.className = 'machine-card no-pulls arm-' + (i + 1);
      card.dataset.arm = String(i);

      const sprite = document.createElement('div');
      sprite.className = 'slot-sprite';
      sprite.innerHTML = SLOT_SVG;
      card.appendChild(sprite);

      const name = document.createElement('div');
      name.className = 'slot-name';
      name.textContent = armNames[i];
      card.appendChild(name);

      const screen = document.createElement('div');
      screen.className = 'slot-screen';
      screen.textContent = '?';
      card.appendChild(screen);

      const pulls = document.createElement('div');
      pulls.className = 'slot-pulls';
      pulls.textContent = '0 pulls';
      card.appendChild(pulls);

      const truth = document.createElement('div');
      truth.className = 'slot-truth';
      const tp = trueProbs[i];
      truth.textContent = (typeof tp === 'number')
        ? 'true: ' + tp.toFixed(2)
        : '';
      card.appendChild(truth);

      card.addEventListener('click', () => {
        if (clickHandler && !card.classList.contains('disabled')) clickHandler(i);
      });
      card.tabIndex = -1;

      cards.push({ card, screen, pulls, truth });
      host.appendChild(card);
    }

    function update(bandit) {
      for (let i = 0; i < K; i++) {
        const n = bandit.pulls(i);
        const v = bandit.empirical(i);
        if (n === 0) {
          cards[i].card.classList.add('no-pulls');
          cards[i].screen.textContent = '?';
        } else {
          cards[i].card.classList.remove('no-pulls');
          cards[i].screen.textContent = v.toFixed(2);
        }
        cards[i].pulls.textContent = n === 1 ? '1 pull' : (n + ' pulls');
      }
    }

    function flash(arm, kind) {
      const card = cards[arm].card;
      card.classList.remove('flash-win', 'flash-loss');
      void card.offsetWidth;   /* restart animation */
      card.classList.add(kind === 'win' ? 'flash-win' : 'flash-loss');
      if (kind === 'win') {
        const chip = document.createElement('span');
        chip.className = 'rising-chip';
        chip.innerHTML = CHIP_SVG;
        card.appendChild(chip);
        setTimeout(() => chip.remove(), 700);
      }
      setTimeout(() => {
        card.classList.remove('flash-win', 'flash-loss');
      }, 650);
    }

    function setLastChosen(arm) {
      for (let i = 0; i < K; i++) cards[i].card.classList.toggle('last-chosen', i === arm);
    }
    function clearLastChosen() {
      for (let i = 0; i < K; i++) cards[i].card.classList.remove('last-chosen');
    }

    function setClickable(handler) {
      clickHandler = handler;
      for (const { card } of cards) card.classList.toggle('clickable', !!handler);
      if (handler) {
        for (const { card } of cards) {
          card.tabIndex = 0;
          card.setAttribute('role', 'button');
        }
      } else {
        for (const { card } of cards) card.tabIndex = -1;
      }
    }

    function setKeyboardShortcut(handler) {
      keyHandler = handler;
    }

    function getKeyHandler() {
      return keyHandler;
    }

    function setDisabled(arm, disabled) {
      cards[arm].card.classList.toggle('disabled', !!disabled);
    }
    function setAllDisabled(disabled) {
      for (let i = 0; i < K; i++) setDisabled(i, disabled);
    }

    function setRevealed(revealed) {
      host.classList.toggle('revealed', !!revealed);
    }

    function focusArm(arm) {
      cards[arm].card.focus();
    }

    return {
      K,
      update,
      flash,
      setLastChosen,
      clearLastChosen,
      setClickable,
      setKeyboardShortcut,
      getKeyHandler,
      setDisabled,
      setAllDisabled,
      setRevealed,
      focusArm,
      hostEl: host,
    };
  }

  window.MachineRow = { mount };
})();
