/* Scene 1 -- Tutorial / how to play.
 *   Walk the controls with zero math: the robot + battery gauge (the
 *   situation), the three levers, the drain die. A guided demo: SEARCH ->
 *   die lands -1 -> one pip drains -> +3 trash; then RECHARGE snaps the gauge
 *   back to full. Vocabulary only. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="sc1-grid">' +
        '<div class="sc1-left">' +
          '<div class="sc1-gauge-host"></div>' +
          '<div class="sc1-hud hud-strip">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene1.hud.battery') + '</span><span class="hud-val sc1-battery">full</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('vocab.trash') + '</span><span class="hud-val sc1-trash">0</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene1.hud.lastdie') + '</span><span class="hud-val sc1-lastdie">--</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="sc1-right">' +
          '<div class="sc1-die-host"></div>' +
          '<div class="sc1-levers"></div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc1-say"></div>' +
      '<div class="sc1-vocab">' +
        '<span class="hue-chip">' + T('scene1.v.battery') + '</span>' +
        '<span class="hue-chip">' + T('scene1.v.lever') + '</span>' +
        '<span class="hue-chip">' + T('scene1.v.die') + '</span>' +
        '<span class="hue-chip">' + T('scene1.v.shift') + '</span>' +
      '</div>';

    const gauge = window.Gauge.mount(root.querySelector('.sc1-gauge-host'), { variant: 'icon', level: R.FULL });
    const die = window.Die.mount(root.querySelector('.sc1-die-host'), { badge: true });
    const dlg = window.Dialog.mount(root.querySelector('.sc1-say'));

    let level = R.FULL, trash = 0, busy = false;
    const batEl = root.querySelector('.sc1-battery');
    const trashEl = root.querySelector('.sc1-trash');
    const dieEl = root.querySelector('.sc1-lastdie');
    function refresh() {
      batEl.textContent = T('level.' + R.LEVEL_NAMES[level]);
      trashEl.textContent = trash;
    }

    /* Build the three lever buttons. */
    const leversHost = root.querySelector('.sc1-levers');
    const ids = window.Levers.LEVER_IDS;
    for (const id of ids) {
      const btn = document.createElement('button');
      btn.className = 'lever-chip rr-btn-lever';
      btn.dataset.lever = id;
      btn.type = 'button';
      btn.innerHTML = '<span class="chip-main">' + T('lever.' + id) + '</span>' +
        '<span class="chip-sub">' + T('lever.' + id + '.sub') + '</span>';
      btn.addEventListener('click', () => pull(id));
      leversHost.appendChild(btn);
    }

    function pull(id) {
      if (busy) return;
      if (id === 'recharge') {
        busy = true;
        dlg.say(T('scene1.say.recharge'), { instant: true });
        if (window.SFX) window.SFX.play('dock');
        gauge.dockRefill();
        dieEl.textContent = '--';
        setTimeout(() => { level = R.FULL; refresh(); busy = false; }, 700);
        return;
      }
      if (id === 'wait') {
        dlg.say(T('scene1.say.wait'), { instant: true });
        trash += 1; dieEl.textContent = '--'; refresh();
        if (window.SFX) window.SFX.play('trash');
        return;
      }
      /* SEARCH: roll the die, drain, collect trash. */
      busy = true;
      const haul = R.searchReward(level);
      die.roll(R.makeRng((Date.now() >>> 0) ^ 0x51), level <= R.LOW ? null : -1).then(({ delta }) => {
        dieEl.textContent = delta === -2 ? '−2' : '−1';
        const next = R.drainTo(level, delta);
        if (next.terminal) {
          gauge.drainTo(0, { spark: true });
          if (window.SFX) window.SFX.play('strand');
          dlg.say(T('scene1.say.strand'), { instant: true });
          setTimeout(() => { level = R.FULL; gauge.setLevel(R.FULL); trash = 0; refresh(); busy = false; }, 1100);
        } else {
          gauge.drainTo(next.lv, { spark: true });
          trash += haul;
          if (window.SFX) window.SFX.play('spark');
          dlg.say(T('scene1.say.search', { haul: haul }), { instant: true });
          setTimeout(() => { level = next.lv; refresh(); busy = false; }, 500);
        }
      });
    }

    /* Scripted opening demo for &run / first entry. */
    function demo() {
      if (busy) return;
      pull('search');
      setTimeout(() => pull('recharge'), 1400);
    }

    dlg.say(T('scene1.say.intro'), { instant: true });
    refresh();
    if (window.RR && window.RR.run) setTimeout(demo, 200);

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };
})();
