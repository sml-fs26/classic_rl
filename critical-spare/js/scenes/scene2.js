/* Scene 2, Playtest. The learner IS the plant manager: a 12-turn quarter from
   (HEALTHY, 0 spares). Pick a lever, the world rolls the failure die, cash
   accrues, the machine ages / fails / gets swapped. A HUD tracks turn + cash; a
   tape records the run. They feel the core tension: RUN earns +3 but the red
   slice grows, and the first empty-bin failure books -8. Cold-entry safe;
   honours &run (auto-plays a fixed seeded run). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const M = window.Machine;
  const LEVER_IDS = window.Levers.LEVER_IDS;
  const TURNS = 12;

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="scene-row sc2-row">' +
        '<div class="sc2-left">' +
          '<div class="sc2-machine-host"></div>' +
          '<div class="sc2-die-host"></div>' +
        '</div>' +
        '<div class="sc2-right grow">' +
          '<div class="hud-strip sc2-hud">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.turn') + '</span><span class="hud-val tnum"><span id="sc2-turn">1</span>/' + TURNS + '</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.cash') + '</span><span class="hud-val tnum" id="sc2-cash">0</span></div>' +
          '</div>' +
          '<div class="sc2-prompt muted">' + T('scene2.pick') + '</div>' +
          '<div class="sc2-chips"></div>' +
          '<div class="poke-box sc2-dialog" hidden></div>' +
          '<div class="cs-btn-row"><button class="cs-btn sc2-restart" type="button" hidden>' + T('scene2.restart') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc2-tape-wrap">' +
        '<div class="sc2-tape-title muted">' + T('scene2.tapeTitle') + '</div>' +
        '<div class="sc2-tape" id="sc2-tape"></div>' +
      '</div>' +
      '<div class="cost-legend sc2-legend">' +
        '<span class="cl-item">' + T('cost.run') + ' <b class="cl-amt pos">+3</b></span>' +
        '<span class="cl-item">' + T('cost.order') + ' <b class="cl-amt neg">-2</b></span>' +
        '<span class="cl-item">' + T('cost.hold') + ' <b class="cl-amt neg">-1</b></span>' +
        '<span class="cl-item">' + T('cost.emergency') + ' <b class="cl-amt neg">-3</b></span>' +
        '<span class="cl-item">' + T('cost.downtime') + ' <b class="cl-amt neg">-8</b></span>' +
      '</div>' +
      '<div class="poke-box sc2-framing" id="sc2-framing" hidden>' + T('scene2.framing') + '</div>';

    const icon = window.MachineIcon.mount(root.querySelector('.sc2-machine-host'), { size: 'lg', showLabel: true });
    const die = window.Die.mount(root.querySelector('.sc2-die-host'), {});
    const chipsHost = root.querySelector('.sc2-chips');
    const dialog = window.Dialog.mount(root.querySelector('.sc2-dialog'));
    const tapeEl = root.querySelector('#sc2-tape');
    const restartBtn = root.querySelector('.sc2-restart');

    let h = 0, s = 0, turn = 1, cash = 0, busy = false, done = false;
    let rng = M.makeRng((Math.random() * 1e9) >>> 0);

    function refreshHud() {
      root.querySelector('#sc2-turn').textContent = String(Math.min(turn, TURNS));
      const c = root.querySelector('#sc2-cash');
      c.textContent = (cash >= 0 ? '+' : '') + cash;
      c.classList.toggle('pos', cash >= 0);
      c.classList.toggle('neg', cash < 0);
      die.setRisk(M.pFail(h));
    }
    function setState(nh, ns) { h = nh; s = ns; icon.set(h, s); refreshHud(); }

    function renderChips() {
      chipsHost.innerHTML = '';
      const legal = M.availableLeverIds(M.mk(h, s));
      for (const id of LEVER_IDS) {
        const isLegal = legal.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lever-chip' + (isLegal ? '' : ' clamped');
        b.dataset.lever = id;
        b.disabled = !isLegal || busy || done;
        b.innerHTML = T('lever.' + id) + ' <span class="chip-role">' + T('lever.' + id + '.role') + '</span>';
        if (isLegal) b.addEventListener('click', () => pull(id));
        chipsHost.appendChild(b);
      }
    }

    function appendTape(t, leverId, log) {
      const cell = document.createElement('div');
      let cls = 'lever-' + leverId;
      let outIcon = '';
      if (log.kind === 'downtime') { cls += ' bad'; outIcon = '⚠'; }
      else if (log.kind === 'emergency') { cls += ' warn'; outIcon = '↺'; }
      else if (log.kind === 'replace') { cls += ' gold'; outIcon = '↺'; }
      else if (log.kind === 'order') { outIcon = '+◷'; }
      else if (log.kind === 'survive') { outIcon = log.aged ? '↓' : '='; }
      const rTxt = (log.reward >= 0 ? '+' : '') + log.reward;
      cell.className = 'sc2-tape-step ' + cls;
      cell.innerHTML =
        '<span class="ts-t">t' + t + '</span>' +
        '<span class="ts-lever">' + T('lever.' + leverId + '.short') + '</span>' +
        '<span class="ts-out">' + outIcon + '</span>' +
        '<span class="ts-r ' + (log.reward >= 0 ? 'pos' : 'neg') + '">' + rTxt + '</span>';
      tapeEl.appendChild(cell);
      tapeEl.scrollLeft = tapeEl.scrollWidth;
    }

    function pull(leverId) {
      if (busy || done) return;
      busy = true; renderChips();
      const out = M.sample(M.mk(h, s), leverId, rng);
      const log = out.log;

      function settle() {
        appendTape(turn, leverId, log);
        cash += out.reward;
        setState(out.sNext.h, out.sNext.s);
        if (log.kind === 'downtime') { icon.flashDowntime(); if (window.SFX) window.SFX.play('downtime'); }
        else if (log.kind === 'emergency') { icon.flashReplace(); }
        else if (log.kind === 'replace') { icon.flashReplace(); if (window.SFX) window.SFX.play('replace'); }
        else if (log.kind === 'order') { icon.flashOrder(); if (window.SFX) window.SFX.play('order'); }
        else { icon.pulse(); }
        turn++;
        if (turn > TURNS) { finish(); }
        else { busy = false; renderChips(); }
      }

      if (leverId === 'run') {
        die.roll(!!log.failed).then(settle);
      } else {
        settle();
      }
    }

    function finish() {
      done = true; busy = false;
      const dlg = root.querySelector('.sc2-dialog');
      dlg.hidden = false;
      dialog.say(T('scene2.end', { cash: (cash >= 0 ? '+' : '') + cash }), { instant: true });
      restartBtn.hidden = false;
      const fr = root.querySelector('#sc2-framing'); if (fr) fr.hidden = false;
      renderChips();
    }

    function restart() {
      h = 0; s = 0; turn = 1; cash = 0; busy = false; done = false;
      rng = M.makeRng((Math.random() * 1e9) >>> 0);
      tapeEl.innerHTML = '';
      root.querySelector('.sc2-dialog').hidden = true;
      restartBtn.hidden = true;
      const fr = root.querySelector('#sc2-framing'); if (fr) fr.hidden = true;
      die.set(false);
      setState(0, 0); renderChips();
    }
    restartBtn.addEventListener('click', restart);

    setState(0, 0); renderChips();
    die.set(false);

    /* &run: auto-play a fixed seeded "gut" run so the screenshot shows a real
       quarter (a naive run-it-then-scramble strategy, to make the -8 visible). */
    if (window.CS && window.CS.run) {
      rng = M.makeRng(424242);
      let guard = 0;
      const autostep = () => {
        if (done || busy || guard++ > 40) return;
        const legal = M.availableLeverIds(M.mk(h, s));
        /* naive policy: RUN while not failing-with-empty; once FAILING+empty, ORDER */
        let pick = 'run';
        if (h === 2 && s === 0) pick = 'order';
        else if (h >= 1 && s >= 1) pick = legal.includes('replace') ? 'replace' : 'run';
        pull(pick);
        setTimeout(autostep, 760);
      };
      setTimeout(autostep, 300);
    }

    return {
      onEnter() {},
      onLeave() { busy = false; },
    };
  };
})();
