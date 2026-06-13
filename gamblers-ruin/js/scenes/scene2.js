/* Scene 2 -- Playtest. The learner IS the gambler: starting at $5 they pick a
   stake, flip the (live, RNG-driven) coin, and feel the swing, playing to GOAL
   or RUIN. A HUD tracks flips + capital; a tape records the run; an outcome
   line + framing follow. Cold-entry safe; honours &run (auto-plays a fixed
   seeded sequence so the screenshot shows a mid/finished run). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const G = window.Gambler;
  const STAKE_IDS = window.Stakes.STAKE_IDS;

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML = '';

    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="scene-row sc2-row">' +
        '<div class="sc2-ladder-host"></div>' +
        '<div class="sc2-right grow">' +
          '<div class="hud-strip sc2-hud">' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.capital') + '</span><span class="hud-val" id="sc2-cap">$5</span></div>' +
            '<div class="hud-item"><span class="hud-label">' + T('scene2.flips') + '</span><span class="hud-val tnum" id="sc2-flips">0</span></div>' +
            '<div class="sc2-coin-host"></div>' +
          '</div>' +
          '<div class="sc2-prompt muted">' + T('scene2.pick') + '</div>' +
          '<div class="sc2-chips"></div>' +
          '<div class="poke-box sc2-dialog" hidden></div>' +
          '<div class="gr-btn-row"><button class="gr-btn sc2-restart" type="button" hidden>' + T('scene2.restart') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="sc2-tape-wrap">' +
        '<div class="sc2-tape-title muted">' + T('scene2.tapeTitle') + '</div>' +
        '<div class="sc2-tape" id="sc2-tape"></div>' +
      '</div>' +
      '<div class="poke-box sc2-framing" id="sc2-framing" hidden>' + T('scene2.framing') + '</div>';

    const ladder = window.QLadder.mount(root.querySelector('.sc2-ladder-host'), { variant: 'icon' });
    const coin = window.Coin.mount(root.querySelector('.sc2-coin-host'), { badge: T('coin.badge') });
    const chipsHost = root.querySelector('.sc2-chips');
    const dialog = window.Dialog.mount(root.querySelector('.sc2-dialog'));
    const tapeEl = root.querySelector('#sc2-tape');
    const restartBtn = root.querySelector('.sc2-restart');

    let cap = 5, flips = 0, busy = false, done = false;
    let rng = G.makeRng((Math.random() * 1e9) >>> 0);

    function setCap(c) {
      cap = c;
      const el = root.querySelector('#sc2-cap');
      if (el) el.textContent = '$' + c;
      ladder.setToken(c);
    }
    function renderChips() {
      chipsHost.innerHTML = '';
      const legal = G.availableStakeIds(cap);
      for (const id of STAKE_IDS) {
        const isLegal = legal.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'stake-chip' + (isLegal ? '' : ' clamped');
        b.dataset.stake = id;
        b.disabled = !isLegal || busy || done;
        b.innerHTML = T('stake.' + id) + ' <span class="chip-role">' + T('stake.' + id + '.role') + '</span>';
        if (isLegal) b.addEventListener('click', () => pull(id));
        chipsHost.appendChild(b);
      }
    }
    function appendTape(before, bet, win, after, terminal, goal) {
      const cell = document.createElement('div');
      cell.className = 'sc2-tape-step ' + (win ? 'up' : 'down') + (terminal ? (goal ? ' goal' : ' ruin') : '');
      cell.innerHTML =
        '<span class="tape-before">$' + before + '</span>' +
        '<span class="tape-arrow">' + (win ? '▲' : '▼') + '$' + bet + '</span>' +
        '<span class="tape-after">' + (terminal ? (goal ? 'GOAL' : 'RUIN') : '$' + after) + '</span>';
      tapeEl.appendChild(cell);
      tapeEl.scrollLeft = tapeEl.scrollWidth;
    }

    function pull(stakeId) {
      if (busy || done) return;
      busy = true; renderChips();
      const out = G.sample({ cap: cap, terminal: false }, stakeId, rng);
      const win = out.log.win, bet = out.log.bet, before = cap;
      coin.flip(win).then(() => {
        flips++;
        const fl = root.querySelector('#sc2-flips'); if (fl) fl.textContent = String(flips);
        const after = out.log.capAfter;
        if (out.terminal) {
          appendTape(before, bet, win, after, true, !!out.log.goal);
          if (out.log.goal) { setCap(10); ladder.flashTerminal('goal'); if (window.SFX) window.SFX.play('win'); }
          else { setCap(0); ladder.flashTerminal('ruin'); if (window.SFX) window.SFX.play('loss'); }
          finish(!!out.log.goal);
        } else {
          appendTape(before, bet, win, after, false, false);
          setCap(after); ladder.pulseToken();
          busy = false; renderChips();
        }
      });
    }

    function finish(won) {
      done = true; busy = false;
      const dlg = root.querySelector('.sc2-dialog');
      dlg.hidden = false;
      dialog.say(won ? T('scene2.win') : T('scene2.loss'), { instant: true });
      restartBtn.hidden = false;
      const fr = root.querySelector('#sc2-framing'); if (fr) fr.hidden = false;
      renderChips();
    }

    function restart() {
      cap = 5; flips = 0; busy = false; done = false;
      rng = G.makeRng((Math.random() * 1e9) >>> 0);
      tapeEl.innerHTML = '';
      root.querySelector('#sc2-flips').textContent = '0';
      root.querySelector('.sc2-dialog').hidden = true;
      restartBtn.hidden = true;
      coin.set(true); root.querySelector('.sc2-coin-host').classList.remove('is-win', 'is-loss');
      setCap(5); renderChips();
    }
    restartBtn.addEventListener('click', restart);

    setCap(5); renderChips();
    coin.set(true); root.querySelector('.sc2-coin-host').classList.remove('is-win', 'is-loss');

    /* &run: auto-play a fixed seeded run so the screenshot shows a real run. */
    if (window.GR && window.GR.run) {
      rng = G.makeRng(424242);
      let guard = 0;
      const autostep = () => {
        if (done || busy || guard++ > 30) return;
        const legal = G.availableStakeIds(cap);
        /* play a roughly-bold gut policy for visual variety */
        const pick = legal.includes('bet3') ? 'bet3' : legal[legal.length - 1];
        pull(pick);
        setTimeout(autostep, 720);
      };
      setTimeout(autostep, 300);
    }

    return {
      onEnter() {},
      onLeave() { busy = false; },
    };
  };
})();
