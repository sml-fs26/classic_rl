/* Scene 0 -- Title / hook.
 *   A lone factory machine hums on the shop floor, its health gauge slowly
 *   amber-ing, a spares bin glinting beside it, and the failure die showing its
 *   growing red slice. Title + START. START reveals the manager framing and a
 *   BEGIN prompt that yields to the engine (-> scene 1). Cold-entry safe;
 *   honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;

  window.scenes.scene0 = function (root) {
    root.className = 'scene scene-pad sc0';
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'sc0-wrap';
    wrap.innerHTML =
      '<h1 class="sc0-title">' + T('scene0.title') + '</h1>' +
      '<p class="sc0-tagline">' + T('scene0.tagline') + '</p>' +
      '<div class="sc0-stage">' +
        '<div class="sc0-machine-host"></div>' +
        '<div class="sc0-die-host"></div>' +
      '</div>' +
      '<button class="cs-btn primary sc0-start" type="button">' + T('scene0.start') + '</button>' +
      '<div class="sc0-reveal" hidden>' +
        '<div class="poke-box sc0-framing">' + T('scene0.framing') + '</div>' +
        '<button class="cs-btn primary sc0-begin" type="button">BEGIN &rsaquo;</button>' +
      '</div>' +
      '<p class="sc0-hook footnote">' + T('scene0.hook') + '</p>' +
      '<p class="sc0-credits muted">' + T('scene0.credits') + '</p>' +
      '<p class="sc0-credits sc0-credits-by">' + T('scene0.by') + '</p>';
    root.appendChild(wrap);

    /* Hero machine, starting AGING with one spare in the bin. */
    const icon = window.MachineIcon.mount(wrap.querySelector('.sc0-machine-host'), { size: 'lg', showLabel: true });
    icon.set(1, 1);

    /* The failure die, showing the AGING risk (30%). */
    const die = window.Die.mount(wrap.querySelector('.sc0-die-host'), {});
    die.setRisk(M.pFail(1));

    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const rev = wrap.querySelector('.sc0-reveal');
      if (rev) rev.hidden = false;
      const startBtn = wrap.querySelector('.sc0-start');
      if (startBtn) startBtn.style.display = 'none';
      /* one illustrative roll: the machine ages into FAILING, the die reddens. */
      die.roll(false).then(() => { icon.set(2, 1); die.setRisk(M.pFail(2)); icon.pulse(); });
    }

    const startBtn = wrap.querySelector('.sc0-start');
    if (startBtn) startBtn.addEventListener('click', reveal);
    const beginBtn = wrap.querySelector('.sc0-begin');
    if (beginBtn) beginBtn.addEventListener('click', () => window.CS && window.CS.goTo(1));

    if (window.CS && window.CS.run) setTimeout(reveal, 120);

    return {
      onNextKey() { if (!revealed) { reveal(); return true; } return false; },
      onPrevKey() { return false; },
    };
  };
})();
