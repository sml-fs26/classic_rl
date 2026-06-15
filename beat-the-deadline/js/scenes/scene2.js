/* Scene 2 -- Playtest. The learner IS the dispatcher: from (2,4) they pull
   WAIT or SEND, watch the dice, and feel the swing across order windows. A HUD
   tracks the running payoff + windows; a tape records the current window; an
   outcome line + framing follow. Cold-entry safe; honours &run (auto-plays a
   fixed seeded window). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.Dock;
  const START = D.initialState();   // (2,4)

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="scene-row sc2-row">' +
        '<div class="sc2-tile-host"></div>' +
        '<div class="sc2-right grow">' +
          '<div class="hud-strip sc2-hud">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.state') + '</span><span class="hud-val" id="sc2-state">(2,4)</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.payoff') + '</span><span class="hud-val tnum" id="sc2-pay">0</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.windows') + '</span><span class="hud-val tnum" id="sc2-win">0</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.total') + '</span><span class="hud-val tnum" id="sc2-total">0</span></div>' +
          '</div>' +
          '<div class="dice-pair sc2-dice">' +
            '<div class="sc2-arrival-host"></div>' +
            '<div class="sc2-deadline-host"></div>' +
          '</div>' +
          '<div class="sc2-prompt muted">' + T('scene2.pick') + '</div>' +
          '<div class="sc2-levers"></div>' +
          '<div class="poke-box sc2-dialog" hidden></div>' +
          '<div class="btd-btn-row"><button class="btd-btn sc2-restart" type="button" hidden>' + T('scene2.restart') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc2-tape-wrap">' +
        '<div class="sc2-tape-title muted">' + T('scene2.tapeTitle') + '</div>' +
        '<div class="sc2-tape" id="sc2-tape"></div>' +
      '</div>' +
      '<div class="poke-box sc2-framing" id="sc2-framing" hidden>' + T('scene2.framing') + '</div>';

    const tile = window.DockBoard.mount(root.querySelector('.sc2-tile-host'), { variant: 'icon', p: START.p, h: START.h });
    const arrival = window.ArrivalDie.mount(root.querySelector('.sc2-arrival-host'), {});
    const deadline = window.DeadlineDie.mount(root.querySelector('.sc2-deadline-host'), { h: START.h });
    const leversHost = root.querySelector('.sc2-levers');
    const dialog = window.Dialog.mount(root.querySelector('.sc2-dialog'));
    const tapeEl = root.querySelector('#sc2-tape');
    const restartBtn = root.querySelector('.sc2-restart');

    let p = START.p, h = START.h, busy = false, done = false;
    let windowPay = 0, windows = 0, total = 0;
    let rng = D.makeRng((Math.random() * 1e9) >>> 0);

    function setState(np, nh) {
      p = np; h = nh;
      const el = root.querySelector('#sc2-state'); if (el) el.textContent = '(' + p + ',' + h + ')';
      tile.setState(p, h); deadline.setHours(h);
    }
    function setPay(v) { windowPay = v; const el = root.querySelector('#sc2-pay'); if (el) { el.textContent = (v > 0 ? '+' : '') + v; el.className = 'hud-val tnum ' + (v > 0 ? 'pos' : (v < 0 ? 'neg' : '')); } }
    function renderLevers() {
      leversHost.innerHTML = '';
      const legal = D.availableActionIds(p, h);
      for (const id of D.ACTION_IDS) {
        const isLegal = legal.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lever-chip' + (isLegal ? '' : ' clamped');
        b.dataset.action = id;
        b.disabled = !isLegal || busy || done;
        b.innerHTML = T('action.' + id) + ' <span class="chip-role">' + T('action.' + id + '.role') + '</span>';
        if (isLegal) b.addEventListener('click', () => pull(id));
        leversHost.appendChild(b);
      }
    }
    function appendTape(kind, before, detail) {
      const cell = document.createElement('div');
      cell.className = 'sc2-tape-step ' + kind;
      cell.innerHTML =
        '<span class="tape-state">(' + before.p + ',' + before.h + ')</span>' +
        '<span class="tape-act">' + detail + '</span>';
      tapeEl.appendChild(cell);
      tapeEl.scrollLeft = tapeEl.scrollWidth;
    }

    function pull(actionId) {
      if (busy || done) return;
      busy = true; renderLevers();
      const before = { p: p, h: h };
      const out = D.sample({ p: p, h: h, terminal: false }, actionId, rng);

      if (actionId === 'send') {
        appendTape('send', before, 'SEND ' + (out.reward >= 0 ? '+' : '') + out.reward);
        tile.flashOutcome('sent'); if (window.SFX) window.SFX.play('send');
        bank(out.reward, out.log.late ? 'late' : 'sent', out);
        return;
      }
      /* WAIT: roll deadline die, then arrival die if survived. */
      const blown = !!out.log.blown;
      deadline.roll(blown).then(() => {
        if (blown) {
          appendTape('blown', before, 'WAIT blown ' + out.reward);
          tile.flashOutcome('blown'); if (window.SFX) window.SFX.play('blown');
          bank(out.reward, 'blown', out);
        } else {
          const arrived = !!out.log.arrived;
          arrival.roll(arrived).then(() => {
            appendTape(arrived ? 'wait-arr' : 'wait', before, arrived ? 'WAIT +pal' : 'WAIT');
            setState(out.sNext.p, out.sNext.h); tile.pulse();
            busy = false; renderLevers();
          });
        }
      });
    }

    function bank(r, kind, out) {
      setPay(windowPay + r);
      total += r; windows += 1;
      const tEl = root.querySelector('#sc2-total'); if (tEl) { tEl.textContent = (total > 0 ? '+' : '') + total; tEl.className = 'hud-val tnum ' + (total > 0 ? 'pos' : (total < 0 ? 'neg' : '')); }
      const wEl = root.querySelector('#sc2-win'); if (wEl) wEl.textContent = String(windows);
      done = true; busy = false;
      const dlg = root.querySelector('.sc2-dialog'); dlg.hidden = false;
      let msg;
      if (kind === 'sent') msg = T('scene2.sent', { n: out.log.delivered, r: (r >= 0 ? '+' : '') + r });
      else if (kind === 'late') msg = T('scene2.late', { r: r });
      else msg = T('scene2.blown', { r: r });
      dialog.say(msg, { instant: true });
      restartBtn.hidden = false;
      const fr = root.querySelector('#sc2-framing'); if (fr) fr.hidden = false;
      renderLevers();
    }

    function restart() {
      done = false; busy = false;
      windowPay = 0;
      rng = D.makeRng((Math.random() * 1e9) >>> 0);
      tapeEl.innerHTML = '';
      setPay(0);
      root.querySelector('.sc2-dialog').hidden = true;
      restartBtn.hidden = true;
      arrival.set(false); deadline.set(false);
      setState(START.p, START.h); renderLevers();
    }
    restartBtn.addEventListener('click', restart);

    setState(START.p, START.h); setPay(0); renderLevers();

    if (window.BTD && window.BTD.run) {
      rng = D.makeRng(777);
      let guard = 0;
      const autostep = () => {
        if (done || busy || guard++ > 20) return;
        const legal = D.availableActionIds(p, h);
        /* a roughly-gut policy: wait if there is time and the truck is not full, else send */
        const pick = (h >= 3 && p < 4 && legal.includes('wait')) ? 'wait' : (legal.includes('send') ? 'send' : legal[0]);
        pull(pick);
        setTimeout(autostep, 900);
      };
      setTimeout(autostep, 300);
    }

    return { onLeave() { busy = false; } };
  };
})();
