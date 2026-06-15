/* Scene 2 -- Playtest / you run it.
 *   The learner IS the robot's operator. Start full, 8-step shift; pick a lever
 *   each step, roll the drain die on SEARCH, feel the outcome. A greedy SEARCH
 *   on a low battery strands the robot for -10. Play to the end of the shift and
 *   see total trash. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const SHIFT = R.SHIFT;

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="sc2-grid">' +
        '<div class="sc2-left">' +
          '<div class="sc2-gauge-host"></div>' +
        '</div>' +
        '<div class="sc2-mid">' +
          '<div class="sc2-hud hud-strip">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.step') + '</span><span class="hud-val sc2-step">1 / ' + SHIFT + '</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('vocab.trash') + '</span><span class="hud-val sc2-total">0</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.battery') + '</span><span class="hud-val sc2-battery">full</span></div>' +
          '</div>' +
          '<div class="sc2-die-host"></div>' +
          '<div class="sc2-levers"></div>' +
          '<div class="poke-box sc2-say"></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc2-tape-wrap"><span class="sc2-tape-label">' + T('scene2.tape') + '</span><div class="sc2-tape"></div></div>' +
      '<div class="rr-btn-row sc2-ctrls">' +
        '<button class="rr-btn sc2-reset" type="button">' + T('scene2.reset') + '</button>' +
      '</div>';

    const gauge = window.Gauge.mount(root.querySelector('.sc2-gauge-host'), { variant: 'icon', level: R.FULL });
    const die = window.Die.mount(root.querySelector('.sc2-die-host'), { badge: true });
    const dlg = window.Dialog.mount(root.querySelector('.sc2-say'));
    const stepEl = root.querySelector('.sc2-step');
    const totalEl = root.querySelector('.sc2-total');
    const batEl = root.querySelector('.sc2-battery');
    const tape = root.querySelector('.sc2-tape');

    let level, stepsUsed, total, busy, over;
    const rng = R.makeRng((Date.now() >>> 0) ^ 0xBEEF);

    function reset() {
      level = R.FULL; stepsUsed = 0; total = 0; busy = false; over = false;
      gauge.setLevel(R.FULL);
      tape.innerHTML = '';
      refresh();
      dlg.say(T('scene2.say.start'), { instant: true });
      setLevers(true);
    }
    function refresh() {
      stepEl.textContent = Math.min(stepsUsed + 1, SHIFT) + ' / ' + SHIFT;
      totalEl.textContent = total;
      batEl.textContent = T('level.' + R.LEVEL_NAMES[level]);
      totalEl.classList.toggle('neg', total < 0);
      totalEl.classList.toggle('pos', total > 0);
    }
    function setLevers(on) {
      root.querySelectorAll('.sc2-levers .lever-chip').forEach(b => { b.disabled = !on; });
    }
    function addTape(leverId, delta, reward, cls) {
      const cell = document.createElement('div');
      cell.className = 'sc2-tape-cell tape-' + leverId + (cls ? ' ' + cls : '');
      cell.innerHTML =
        '<span class="tc-lever">' + T('lever.' + leverId).slice(0, 4) + '</span>' +
        '<span class="tc-r">' + (reward >= 0 ? '+' + reward : reward) + '</span>';
      tape.appendChild(cell);
    }

    function endShift(stranded) {
      over = true; setLevers(false);
      gauge.setLabel ? gauge.setLabel(null) : 0;
      if (stranded) dlg.say(T('scene2.say.stranded', { total: total }), { instant: true });
      else dlg.say(T('scene2.say.end', { total: total }), { instant: true });
    }

    function pull(id) {
      if (busy || over) return;
      const stepsLeft = SHIFT - stepsUsed;       // before this step
      if (id === 'recharge') {
        busy = true; setLevers(false);
        if (window.SFX) window.SFX.play('dock');
        gauge.dockRefill();
        addTape('recharge', 0, 0);
        setTimeout(() => {
          level = R.FULL; stepsUsed++; refresh();
          finishStep(); busy = false;
        }, 700);
        return;
      }
      if (id === 'wait') {
        total += 1; addTape('wait', 0, 1);
        if (window.SFX) window.SFX.play('trash');
        stepsUsed++; refresh(); finishStep();
        return;
      }
      /* SEARCH */
      busy = true; setLevers(false);
      const haul = R.searchReward(level);
      die.roll(rng).then(({ delta }) => {
        const next = R.drainTo(level, delta);
        if (next.terminal) {
          total += (haul + R.STRAND);
          gauge.drainTo(0, { spark: true });
          if (window.SFX) window.SFX.play('strand');
          root.querySelector('.sc2-grid').classList.add('rr-screen-shake');
          setTimeout(() => root.querySelector('.sc2-grid').classList.remove('rr-screen-shake'), 450);
          addTape('search', delta, haul + R.STRAND, 'tape-strand');
          stepsUsed++; refresh();
          setTimeout(() => { endShift(true); busy = false; }, 700);
        } else {
          total += haul;
          gauge.drainTo(next.lv, { spark: true });
          if (window.SFX) window.SFX.play('spark');
          addTape('search', delta, haul);
          level = next.lv; stepsUsed++; refresh();
          finishStep(); busy = false;
        }
      });
    }
    function finishStep() {
      if (over) return;
      if (stepsUsed >= SHIFT) { endShift(false); return; }
      setLevers(true);
      dlg.say(T('scene2.say.step', { left: SHIFT - stepsUsed }), { instant: true });
    }

    const leversHost = root.querySelector('.sc2-levers');
    for (const id of window.Levers.LEVER_IDS) {
      const btn = document.createElement('button');
      btn.className = 'lever-chip';
      btn.dataset.lever = id; btn.type = 'button';
      btn.innerHTML = '<span class="chip-main">' + T('lever.' + id) + '</span>';
      btn.addEventListener('click', () => pull(id));
      leversHost.appendChild(btn);
    }
    root.querySelector('.sc2-reset').addEventListener('click', reset);

    reset();
    if (window.RR && window.RR.run) {
      /* auto-play a short greedy-ish shift for capture */
      const script = ['search', 'search', 'recharge', 'search', 'search'];
      let i = 0;
      const tick = () => { if (i < script.length && !over) { pull(script[i++]); setTimeout(tick, 900); } };
      setTimeout(tick, 300);
    }

    return { onNextKey() { return false; }, onPrevKey() { return false; } };
  };
})();
