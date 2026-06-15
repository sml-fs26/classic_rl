/* Scene 0, Title / hook.
 *   A dark cave with the gold deep inside, the wind die idling, the explorer on
 *   the start tile, and the title dropping in. START reveals the manager framing
 *   and a BEGIN prompt that yields to the engine (-> scene 1). Cold-entry safe;
 *   honours &run. Carries the "BY CARLOS COTRINI" credit. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};

  window.scenes.scene0 = function (root) {
    root.className = 'scene scene-pad sc0';
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'sc0-wrap';
    wrap.innerHTML =
      '<h1 class="sc0-title">' + T('scene0.title') + '</h1>' +
      '<p class="sc0-tagline">' + T('scene0.tagline') + '</p>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-board-host"></div>' +
        '<div class="sc0-die-host"></div>' +
      '</div>' +
      '<button class="wtc-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="wtc-btn primary sc0-begin" type="button">BEGIN &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero board with the explorer on the start tile. */
    const board = window.CaveBoard.mount(wrap.querySelector('.sc0-board-host'), { size: 'md' });
    board.setExplorer(D.start ? D.start.row : 4, D.start ? D.start.col : 0);

    /* The wind die idling with its 70/15/15 badge; a soft demo roll on START. */
    const die = window.WindDie.mount(wrap.querySelector('.sc0-die-host'), { badge: T('die.badge') });

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* one illustrative gust so the die reads as "the part you don't control". */
      die.roll(8, 'left').then(() => {
        const r = D.start ? D.start.row : 4, c = D.start ? D.start.col : 0;
        board.gust(r, c, 'left', 'UP');
        board.pulse(r, c);
      });
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.WTC && window.WTC.goTo(1));

    if (window.WTC && window.WTC.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();
