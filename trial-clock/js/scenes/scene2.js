/* Scene 2 -- Playtest. The learner IS the growth PM for one trial. Starting at
   a cold day-5 user they pick a lever each day; the matching die fires (the
   Adoption Coin on NUDGE, the Conversion Wheel on PUSH, deterministic on DO
   NOTHING) and they feel the swing -- many will PUSH early and hit the big red
   ABANDON wedge. A HUD tracks day/tier/payoff; a tape records the run; it ends
   in CONVERT / ABANDON / EXPIRY. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Trial;
  const LEVER_IDS = window.Levers.LEVER_IDS;

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="scene-row sc2-row">' +
        '<div class="sc2-card-host"></div>' +
        '<div class="sc2-right grow">' +
          '<div class="hud-strip sc2-hud">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.tier') + '</span><span class="hud-val" id="sc2-tier">none</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.day') + '</span><span class="hud-val tnum" id="sc2-day">5</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.payoff') + '</span><span class="hud-val tnum" id="sc2-pay">0</span></div>' +
          '</div>' +
          '<div class="sc2-prompt muted">' + T('scene2.pick') + '</div>' +
          '<div class="sc2-chips"></div>' +
          '<div class="sc2-dice-host"></div>' +
          '<div class="poke-box sc2-dialog" hidden></div>' +
          '<div class="tc-btn-row"><button class="tc-btn sc2-restart" type="button" hidden>' + T('scene2.restart') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc2-tape-wrap">' +
        '<div class="sc2-tape-title muted">' + T('scene2.tapeTitle') + '</div>' +
        '<div class="sc2-tape" id="sc2-tape"></div>' +
      '</div>' +
      '<div class="poke-box sc2-framing" id="sc2-framing" hidden>' + T('scene2.framing') + '</div>';

    const card = window.TrialCard.mount(root.querySelector('.sc2-card-host'), {});
    const chipsHost = root.querySelector('.sc2-chips');
    const diceHost = root.querySelector('.sc2-dice-host');
    const dialog = window.Dialog.mount(root.querySelector('.sc2-dialog'));
    const tapeEl = root.querySelector('#sc2-tape');
    const restartBtn = root.querySelector('.sc2-restart');

    /* persistent die widgets, shown contextually */
    diceHost.innerHTML = '<div class="sc2-coin-host"></div><div class="sc2-wheel-host"></div>';
    const coin = window.Coin.mount(diceHost.querySelector('.sc2-coin-host'), { badge: T('coin.badge') });
    const wheel = window.Wheel.mount(diceHost.querySelector('.sc2-wheel-host'), { tier: 0 });
    function showDie(which) {
      diceHost.querySelector('.sc2-coin-host').classList.toggle('sc2-hidden', which !== 'coin');
      diceHost.querySelector('.sc2-wheel-host').classList.toggle('sc2-hidden', which !== 'wheel');
    }
    showDie(null);

    let tier = 0, days = 5, pay = 0, busy = false, done = false;
    let rng = G.makeRng((Math.random() * 1e9) >>> 0);

    function setState(t, d) {
      tier = t; days = d;
      card.setState(t, d);
      root.querySelector('#sc2-tier').textContent = G.tierLabel(t);
      root.querySelector('#sc2-day').textContent = String(d);
      wheel.setTier(t);
    }
    function setPay(p) {
      pay = p;
      const el = root.querySelector('#sc2-pay');
      el.textContent = (p > 0 ? '+' : '') + p;
      el.classList.toggle('pos', p > 0); el.classList.toggle('neg', p < 0);
    }
    function renderChips() {
      chipsHost.innerHTML = '';
      for (const id of LEVER_IDS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lever-chip';
        b.dataset.lever = id;
        b.disabled = busy || done;
        b.innerHTML = window.Board.leverShort(id) + ' <span class="chip-role">' + T('lever.' + id + '.role') + '</span>';
        b.addEventListener('click', () => pull(id));
        chipsHost.appendChild(b);
      }
    }
    function appendTape(t, d, leverId, log) {
      const cell = document.createElement('div');
      let resClass = '', resText = '';
      if (log.outcome === 'convert') { resClass = 'convert'; resText = T('term.convert'); }
      else if (log.outcome === 'abandon') { resClass = 'abandon'; resText = T('term.abandon'); }
      else if (log.outcome === 'expiry') { resClass = 'expiry'; resText = T('term.expiry'); }
      else if (log.outcome === 'adopt') { resClass = 'up'; resText = '↑ T' + log.tierAfter; }
      else if (log.outcome === 'stay') { resClass = 'flat'; resText = '= T' + log.tierAfter; }
      else if (log.outcome === 'ignore') { resClass = 'flat'; resText = T('wheel.ignore'); }
      else { resClass = 'flat'; resText = '→ T' + log.tierAfter; }
      cell.className = 'sc2-tape-step ' + resClass;
      cell.innerHTML =
        '<span class="tape-day">d' + d + '</span>' +
        '<span class="tape-lever lever-tag" data-lever="' + leverId + '">' + window.Board.leverShort(leverId) + '</span>' +
        '<span class="tape-res">' + resText + '</span>' +
        '<span class="tape-r ' + (log.r > 0 ? 'pos' : log.r < 0 ? 'neg' : '') + '">' + (log.r > 0 ? '+' : '') + log.r + '</span>';
      tapeEl.appendChild(cell);
      tapeEl.scrollLeft = tapeEl.scrollWidth;
    }

    function pull(leverId) {
      if (busy || done) return;
      busy = true; renderChips();
      const beforeT = tier, beforeD = days;
      const out = G.sample({ tier: tier, days: days, terminal: false }, leverId, rng);
      const log = out.log;

      const afterDie = () => {
        const r = out.reward;
        setPay(pay + r);
        const tapeLog = { outcome: log.outcome, tierAfter: log.tierAfter, r: r };
        appendTape(beforeT, beforeD, leverId, tapeLog);
        if (out.terminal) {
          if (log.outcome === 'convert') { card.flashTerminal('convert'); if (window.SFX) window.SFX.play('win'); }
          else if (log.outcome === 'abandon') { card.flashTerminal('abandon'); if (window.SFX) window.SFX.play('loss'); }
          else { card.flashTerminal('expiry'); }
          finish(log.outcome);
        } else {
          setState(log.tierAfter, log.daysAfter); card.pulse();
          busy = false; renderChips();
        }
      };

      if (leverId === 'nudge') {
        showDie('coin');
        coin.flip(!!log.heads).then(afterDie);
      } else if (leverId === 'push') {
        showDie('wheel');
        wheel.setTier(beforeT);
        wheel.spin(log.wedge).then(afterDie);
      } else {
        showDie(null);
        setTimeout(afterDie, 180);
      }
    }

    function finish(outcome) {
      done = true; busy = false;
      const dlg = root.querySelector('.sc2-dialog');
      dlg.hidden = false;
      const key = outcome === 'convert' ? 'scene2.win' : (outcome === 'abandon' ? 'scene2.abandon' : 'scene2.expiry');
      dialog.say(T(key, { pay: (pay > 0 ? '+' : '') + pay }), { instant: true });
      restartBtn.hidden = false;
      const fr = root.querySelector('#sc2-framing'); if (fr) fr.hidden = false;
      renderChips();
    }

    function restart() {
      pay = 0; busy = false; done = false;
      rng = G.makeRng((Math.random() * 1e9) >>> 0);
      tapeEl.innerHTML = '';
      root.querySelector('.sc2-dialog').hidden = true;
      restartBtn.hidden = true;
      showDie(null);
      coin.set(true); diceHost.querySelector('.sc2-coin-host').classList.remove('is-heads', 'is-tails');
      setState(0, 5); setPay(0); renderChips();
    }
    restartBtn.addEventListener('click', restart);

    setState(0, 5); setPay(0); renderChips();

    /* &run: auto-play a fixed seeded run so the screenshot shows a real run. */
    if (window.TC && window.TC.run) {
      rng = G.makeRng(424242);
      let guard = 0;
      const autostep = () => {
        if (done || busy || guard++ > 12) return;
        /* a roughly-bold gut policy: push once mid, else nudge */
        const pick = (tier >= 2 || days <= 2) ? 'push' : 'nudge';
        pull(pick);
        setTimeout(autostep, 1100);
      };
      setTimeout(autostep, 300);
    }

    return {
      onEnter() {},
      onLeave() { busy = false; },
    };
  };
})();
