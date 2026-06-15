/* Scene 1, Tutorial. A guided 6-step walkthrough of the dashboard with zero
   theory: the health gauge, the spares bin, the turn counter, the three levers
   (with REPLACE clamped when the bin is empty), the failure die, and, the
   load-bearing rule, the emergency auto-swap (fail WITH a spare -> back to
   HEALTHY at -3) vs downtime (fail with an EMPTY bin -> -8), shown side by side.
   Internal stepping; cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const LEVER_IDS = window.Levers.LEVER_IDS;
  const STEPS = ['s0', 's1', 's2', 's3', 's4', 's5'];

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="scene-row sc1-row">' +
        '<div class="sc1-left">' +
          '<div class="sc1-machine-host"></div>' +
          '<div class="sc1-die-host"></div>' +
        '</div>' +
        '<div class="sc1-right grow">' +
          '<div class="hud-strip sc1-hud">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene1.turn') + '</span><span class="hud-val tnum">1/12</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene1.die') + '</span><span class="hud-val tnum" id="sc1-risk">0%</span></div>' +
          '</div>' +
          '<div class="sc1-chips"></div>' +
          '<div class="poke-box sc1-dialog"></div>' +
          '<div class="sc1-swaprule" id="sc1-swaprule" hidden></div>' +
          '<div class="cs-btn-row sc1-nav">' +
            '<span class="sc1-stepcount muted"></span>' +
            '<button class="cs-btn sc1-back" type="button">' + T('scene1.back') + '</button>' +
            '<button class="cs-btn primary sc1-next" type="button">' + T('scene1.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cost-legend sc1-legend">' +
        '<span class="cl-item">' + T('cost.run') + ' <b class="cl-amt pos">+3</b></span>' +
        '<span class="cl-item">' + T('cost.order') + ' <b class="cl-amt neg">-2</b></span>' +
        '<span class="cl-item">' + T('cost.hold') + ' <b class="cl-amt neg">-1</b></span>' +
        '<span class="cl-item">' + T('cost.emergency') + ' <b class="cl-amt neg">-3</b></span>' +
        '<span class="cl-item">' + T('cost.downtime') + ' <b class="cl-amt neg">-8</b></span>' +
      '</div>';

    const icon = window.MachineIcon.mount(root.querySelector('.sc1-machine-host'), { size: 'lg', showLabel: true });
    icon.set(0, 1);
    const die = window.Die.mount(root.querySelector('.sc1-die-host'), {});
    function setRisk(h) { die.setRisk(M.pFail(h)); const el = root.querySelector('#sc1-risk'); if (el) el.textContent = Math.round(M.pFail(h) * 100) + '%'; }
    setRisk(0);
    const dialog = window.Dialog.mount(root.querySelector('.sc1-dialog'));
    const chipsHost = root.querySelector('.sc1-chips');
    const swapRule = root.querySelector('#sc1-swaprule');

    function renderChips(h, s, highlight) {
      const legal = M.availableLeverIds(M.mk(h, s));
      chipsHost.innerHTML = '';
      for (const id of LEVER_IDS) {
        const isLegal = legal.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lever-chip' + (isLegal ? '' : ' clamped') + (highlight && isLegal ? ' chip-hl' : '');
        b.dataset.lever = id;
        b.disabled = !isLegal;
        b.innerHTML = T('lever.' + id) + ' <span class="chip-role">' + T('lever.' + id + '.role') + '</span>';
        chipsHost.appendChild(b);
      }
    }

    let cursor = 0;
    function applyStep(i) {
      cursor = Math.max(0, Math.min(STEPS.length - 1, i));
      clearTimers();
      const key = STEPS[cursor];
      dialog.say('<b>' + T('scene1.' + key + '.title') + '</b> ' + T('scene1.' + key + '.body'), { instant: true });

      const machineHost = root.querySelector('.sc1-machine-host');
      const dieHost = root.querySelector('.sc1-die-host');
      machineHost.classList.toggle('sc1-emph', cursor === 0 || cursor === 1);
      dieHost.classList.toggle('sc1-dim', cursor !== 4);
      chipsHost.classList.toggle('sc1-dim', cursor !== 3);
      swapRule.hidden = cursor !== 5;

      if (cursor === 0) { icon.set(0, 1); setRisk(0); renderChips(0, 1, false); }
      if (cursor === 1) { animateGauge(); }
      if (cursor === 2) { icon.set(0, 0); renderChips(0, 0, false); animateBin(); }
      if (cursor === 3) { icon.set(1, 0); setRisk(1); renderChips(1, 0, true); }
      if (cursor === 4) { icon.set(2, 1); setRisk(2); renderChips(2, 1, false); }
      if (cursor === 5) { buildSwapRule(); }

      const sc = root.querySelector('.sc1-stepcount');
      if (sc) sc.textContent = T('scene1.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc1-next');
      if (nextBtn) nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene1.done') : T('scene1.next');
      const backBtn = root.querySelector('.sc1-back');
      if (backBtn) backBtn.disabled = cursor === 0;
    }

    let gaugeTimer = null, binTimer = null;
    function clearTimers() { if (gaugeTimer) { clearTimeout(gaugeTimer); gaugeTimer = null; } if (binTimer) { clearTimeout(binTimer); binTimer = null; } }
    function animateGauge() {
      const seq = [0, 1, 2, 1, 0];
      let i = 0;
      const tick = () => {
        icon.set(seq[i % seq.length], 1); setRisk(seq[i % seq.length]); icon.pulse();
        i++;
        if (i <= 8 && cursor === 1) gaugeTimer = setTimeout(tick, 850);
      };
      tick();
    }
    function animateBin() {
      const seq = [0, 1, 2, 0];
      let i = 0;
      const tick = () => {
        icon.set(0, seq[i % seq.length]); icon.flashOrder();
        i++;
        if (i <= 6 && cursor === 2) binTimer = setTimeout(tick, 850);
      };
      tick();
    }

    function buildSwapRule() {
      swapRule.innerHTML =
        '<div class="sc1-sr-title">' + T('scene1.swap.title') + '</div>' +
        '<div class="sc1-sr-cards">' +
          '<div class="sc1-sr-card sc1-sr-good">' +
            '<div class="sc1-sr-head">' + T('scene1.swap.withTitle') + '</div>' +
            '<div class="sc1-sr-icon" id="sc1-sr-with"></div>' +
            '<div class="sc1-sr-out pos">' + T('scene1.swap.withOut') + '</div>' +
          '</div>' +
          '<div class="sc1-sr-card sc1-sr-bad">' +
            '<div class="sc1-sr-head">' + T('scene1.swap.withoutTitle') + '</div>' +
            '<div class="sc1-sr-icon" id="sc1-sr-without"></div>' +
            '<div class="sc1-sr-out neg">' + T('scene1.swap.withoutOut') + '</div>' +
          '</div>' +
        '</div>';
      const withIcon = window.MachineIcon.mount(swapRule.querySelector('#sc1-sr-with'), { size: 'sm', showLabel: true });
      withIcon.set(0, 0);
      const withoutIcon = window.MachineIcon.mount(swapRule.querySelector('#sc1-sr-without'), { size: 'sm', showLabel: true });
      withoutIcon.set(2, 0);
      withoutIcon.flashDowntime();
    }

    root.querySelector('.sc1-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.CS && window.CS.goTo(2);
    });
    root.querySelector('.sc1-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.CS && window.CS.run) applyStep(STEPS.length - 1);

    return {
      onEnter() { applyStep(cursor); },
      onLeave() { clearTimers(); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();
