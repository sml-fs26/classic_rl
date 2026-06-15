/* Scene 2 - Playtest: "You run it".
 *
 * The learner IS the player. A 0-0 race to 25 (fast mode, labelled) against a
 * VISIBLE house rival that holds at 20. Each turn you press ROLL or HOLD and
 * FEEL the outcome - a fat-pot bust, a well-timed bank - playing a full game
 * to a win or a loss.
 *
 * Mechanics use the shared engine for the stochastic roll: ROLL goes through
 * window.Pig.sample (a fair d6; 2-6 grows the pot, a 1 busts). HOLD, the
 * win-check and the rival's fixed "holds at 20" turn are resolved locally so
 * the game genuinely races to the 25-point fast target (the engine's exact-DP
 * target is 50; only the per-roll dice mechanics are reused here). The die,
 * pot meter, standing badge and banked counters are the shared widgets.
 *
 * Cold entry rebuilds from scratch. &run paints a representative live frame
 * (so a headless capture lands on a populated, stable board) instead of
 * firing a random roll.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const RUN = /[#&?]run\b/.test(window.location.hash || '');

  /* Fast-mode target for the interactive game (the proposal calls for to-25
     in the live scenes; the exact-DP numbers elsewhere use to-50). */
  const TARGET = 25;
  const RIVAL_HOLD = (window.Pig && window.Pig.RIVAL_HOLD) || 20;

  window.scenes.scene2 = function (root) {
    root.classList.add('scene-pad', 's2-play');
    root.innerHTML = '';

    /*, header, */
    const header = document.createElement('h2');
    header.className = 'poke-section-title s2-section-title';
    header.textContent = T('pt.section');
    root.appendChild(header);

    const subBar = document.createElement('div');
    subBar.className = 's2-subbar';
    const subtitle = document.createElement('div');
    subtitle.className = 's2-subtitle';
    subBar.appendChild(subtitle);
    const rivalRule = document.createElement('div');
    rivalRule.className = 's2-rival-rule';
    rivalRule.textContent = T('pt.rival_rule', { hold: RIVAL_HOLD });
    subBar.appendChild(rivalRule);
    root.appendChild(subBar);

    /*, stage: banks | card + die | controls, */
    const stage = document.createElement('div');
    stage.className = 's2-stage';
    root.appendChild(stage);

    /* banked counters (you on the left, rival on the right of the card) */
    const bankYou = makeBank('pyl-bank-you', T('pt.bank_you'));
    const bankRiv = makeBank('pyl-bank-riv', T('pt.bank_riv'));

    const cardCol = document.createElement('div');
    cardCol.className = 's2-card-col';
    const potLabel = document.createElement('div');
    potLabel.className = 's2-pot-label';
    potLabel.textContent = T('pt.turn_pot');
    const cardHost = document.createElement('div');
    cardHost.className = 's2-card';
    cardCol.appendChild(potLabel);
    cardCol.appendChild(cardHost);
    const card = window.TableCard.mount(cardHost);

    const dieHost = document.createElement('div');
    dieHost.className = 's2-die';

    stage.appendChild(bankYou.el);
    stage.appendChild(cardCol);
    stage.appendChild(dieHost);
    stage.appendChild(bankRiv.el);

    function makeBank(cls, label) {
      const el = document.createElement('div');
      el.className = 'pyl-bank ' + cls + ' s2-bank';
      el.innerHTML =
        '<span class="pyl-bank-label">' + label + '</span>' +
        '<span class="pyl-bank-num">0</span>';
      return { el, num: el.querySelector('.pyl-bank-num'),
        chunk() {
          el.classList.remove('pyl-bank-chunk');
          void el.offsetWidth;
          el.classList.add('pyl-bank-chunk');
          setTimeout(() => el.classList.remove('pyl-bank-chunk'), 340);
        } };
    }

    /*, dialog, */
    const dialogHost = document.createElement('div');
    dialogHost.className = 's2-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    /*, controls, */
    const ctrls = document.createElement('div');
    ctrls.className = 's2-ctrls';
    const rollBtn = document.createElement('button');
    rollBtn.type = 'button';
    rollBtn.className = 's2-btn s2-btn-roll lever-roll pyl-btn';
    const holdBtn = document.createElement('button');
    holdBtn.type = 'button';
    holdBtn.className = 's2-btn s2-btn-hold lever-hold pyl-btn';
    const restartBtn = document.createElement('button');
    restartBtn.type = 'button';
    restartBtn.className = 's2-btn s2-btn-restart pyl-btn';
    restartBtn.textContent = T('pt.btn.restart');
    ctrls.appendChild(rollBtn);
    ctrls.appendChild(holdBtn);
    ctrls.appendChild(restartBtn);
    root.appendChild(ctrls);

    const caption = document.createElement('div');
    caption.className = 'poke-caption s2-caption';
    caption.textContent = T('pt.caption');
    root.appendChild(caption);

    /*, state, */
    let state, rng, busy, episode = 0;

    function reducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function dialogSay(line) {
      return new Promise((resolve) => { dialog.say(line); dialog.onDone(resolve); });
    }

    function flyChip(n) {
      if (reducedMotion()) return;
      const chip = document.createElement('div');
      chip.className = 'pyl-fly-chip';
      chip.textContent = '+' + n;
      const sRect = stage.getBoundingClientRect();
      const dRect = dieHost.getBoundingClientRect();
      chip.style.left = (dRect.left - sRect.left + dRect.width / 2 - 10) + 'px';
      chip.style.top = (dRect.top - sRect.top - 4) + 'px';
      stage.appendChild(chip);
      setTimeout(() => { try { chip.remove(); } catch (_e) {} }, 600);
    }

    /* The die fires the +N chip on a 2-6 and the screen-shake on a 1. The pot
       meter pop / collapse are driven explicitly per resolved roll. */
    const die = window.Die.mount(dieHost, {
      shakeTarget: stage,
      onPotPop: function (face) { flyChip(face); },
      onBust: function () {}
    });

    function gap() { return Math.max(0, TARGET - state.my); }
    function refreshHud() {
      card.set({ pot: state.pot, my: state.my, riv: state.riv, target: TARGET });
      bankYou.num.textContent = String(state.my);
      bankRiv.num.textContent = String(state.riv);
      subtitle.textContent = T('pt.subtitle', { target: TARGET, gap: gap() });
    }

    function setButtons(opts) {
      const o = opts || {};
      rollBtn.disabled = !!o.disable;
      holdBtn.disabled = !!o.disable || state.pot <= 0;
      rollBtn.innerHTML = '<span class="s2-btn-name">' + T('pt.btn.roll') + '</span>' +
        '<span class="s2-btn-sub">' + T('pt.btn.roll_sub') + '</span>';
      const holdSub = state.pot > 0
        ? T('pt.btn.hold_sub', { pot: state.pot })
        : T('pt.btn.hold_sub0');
      holdBtn.innerHTML = '<span class="s2-btn-name">' + T('pt.btn.hold') + '</span>' +
        '<span class="s2-btn-sub">' + holdSub + '</span>';
    }

    function setBusy(b) {
      busy = b;
      setButtons({ disable: b });
    }

    /*, terminal banner, */
    function showBanner(win) {
      clearBanner();
      const b = document.createElement('div');
      b.className = 's2-banner ' + (win ? 's2-banner-win' : 's2-banner-lose');
      b.textContent = win ? T('pt.win.banner') : T('pt.lose.banner');
      stage.appendChild(b);
    }
    function clearBanner() {
      const old = stage.querySelector('.s2-banner');
      if (old) old.remove();
    }

    /* ===================================================================
       MY TURN
       =================================================================== */
    async function onRoll() {
      if (busy || state.terminal) return;
      const myEp = episode;
      setBusy(true);
      clearBanner();
      /* The stochastic roll comes from the shared engine. */
      const out = window.Pig.sample(state, 'roll', rng);
      const face = out.log.face;
      await die.roll(face);
      if (episode !== myEp) return;
      await wait(180);
      if (episode !== myEp) return;

      if (out.log.busted) {
        await card.collapse();              // THE BUST - stack greys + slides
        state = { my: state.my, riv: state.riv, pot: 0, turn: 'rival', terminal: false };
        refreshHud();
        await dialogSay(T('pt.msg.bust'));
        if (episode !== myEp) return;
        await wait(400);
        await rivalTurn(myEp);
        return;
      }
      /* 2-6: pot grows, my turn continues. Update scores/standing first,
         then pop the meter so the freshly-lit top chip animates. */
      state = { my: state.my, riv: state.riv, pot: out.sNext.pot, turn: 'me', terminal: false };
      refreshHud();
      card.pop(window.Pig.bucketOfPot(state.pot));
      await dialogSay(T('pt.msg.rolled', { face: face, pot: state.pot }));
      if (episode !== myEp) return;
      setBusy(false);
    }

    async function onHold() {
      if (busy || state.terminal) return;
      if (state.pot <= 0) { dialog.say(T('pt.msg.hold_nothing')); return; }
      const myEp = episode;
      setBusy(true);
      clearBanner();
      const banked = state.pot;
      const myAfter = state.my + banked;
      /* THE HOLD - slide the pot into your bank with a chunk. */
      if (window.SFX) window.SFX.play('cursor');
      bankYou.chunk();
      state = { my: myAfter, riv: state.riv, pot: 0, turn: 'rival', terminal: false };
      refreshHud();

      if (myAfter >= TARGET) {
        await dialogSay(T('pt.msg.hold', { pot: banked, score: myAfter }));
        if (episode !== myEp) return;
        return finishGame(myEp, true);
      }
      await dialogSay(T('pt.msg.hold', { pot: banked, score: myAfter }));
      if (episode !== myEp) return;
      await wait(400);
      await rivalTurn(myEp);
    }

    /* ===================================================================
       RIVAL TURN (fixed rule: roll until rpot >= RIVAL_HOLD or it can win)
       =================================================================== */
    async function rivalTurn(myEp) {
      if (episode !== myEp) return;
      await dialogSay(T('pt.msg.rival_start'));
      if (episode !== myEp) return;
      await wait(350);

      let rpot = 0;
      while (true) {
        if (episode !== myEp) return;
        const holds = (rpot >= RIVAL_HOLD) || (state.riv + rpot >= TARGET);
        if (holds) {
          const rivAfter = state.riv + rpot;
          if (window.SFX) window.SFX.play('cursor');
          bankRiv.chunk();
          state = { my: state.my, riv: rivAfter, pot: 0, turn: 'me', terminal: false };
          refreshHud();
          if (rivAfter >= TARGET) {
            await dialogSay(T('pt.msg.rival_hold', { pot: rpot, score: rivAfter }));
            if (episode !== myEp) return;
            return finishGame(myEp, false);
          }
          await dialogSay(T('pt.msg.rival_hold', { pot: rpot, score: rivAfter }));
          if (episode !== myEp) return;
          await wait(300);
          setBusy(false);
          dialog.say(T('pt.msg.your_turn'));
          return;
        }
        /* Rival rolls (its own seeded draw - same fair d6). */
        const face = 1 + Math.floor(rng() * 6);
        await die.roll(face);
        if (episode !== myEp) return;
        await wait(140);
        if (face === 1) {
          state = { my: state.my, riv: state.riv, pot: 0, turn: 'me', terminal: false };
          refreshHud();
          await dialogSay(T('pt.msg.rival_bust'));
          if (episode !== myEp) return;
          await wait(300);
          setBusy(false);
          dialog.say(T('pt.msg.your_turn'));
          return;
        }
        rpot += face;
        /* Reflect the rival's growing pot on the shared meter so the danger
           is visible for them too. */
        card.set({ pot: rpot, my: state.my, riv: state.riv, target: TARGET });
        flyChip(face);
        await dialogSay(T('pt.msg.rival_roll', { face: face, pot: rpot }));
        if (episode !== myEp) return;
        await wait(120);
      }
    }

    function finishGame(myEp, win) {
      if (episode !== myEp) return;
      state = { my: state.my, riv: state.riv, pot: 0, turn: 'done', terminal: true, win: win, lose: !win };
      showBanner(win);
      if (window.SFX) window.SFX.play(win ? 'cursor' : 'loss');
      rollBtn.disabled = true;
      holdBtn.disabled = true;
      busy = false;
      setTimeout(() => dialog.say(win
        ? T('pt.msg.you_win', { target: TARGET })
        : T('pt.msg.you_lose', { target: TARGET })), 60);
    }

    /* ===================================================================
       RESET / BOOT
       =================================================================== */
    function newGame(seed) {
      episode++;
      clearBanner();
      state = { my: 0, riv: 0, pot: 0, turn: 'me', terminal: false };
      rng = window.Pig.makeRng(seed != null ? seed : ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0));
      busy = false;
      die.show(1);
      refreshHud();
      setButtons({ disable: false });
      dialog.say(T('pt.msg.your_turn'));
    }

    rollBtn.addEventListener('click', onRoll);
    holdBtn.addEventListener('click', onHold);
    restartBtn.addEventListener('click', () => newGame());

    newGame(20260530);

    /* &run: paint a representative live mid-game frame so a headless capture
       lands on a populated, stable board (rather than firing a random roll).
       The optional &pt=win|lose flag forces the terminal banner for QA. */
    const PT_END = ((window.location.hash || '').match(/[#&?]pt=(win|lose)/) || [])[1];
    if (RUN || PT_END) {
      if (PT_END === 'win') {
        state = { my: 25, riv: 18, pot: 0, turn: 'done', terminal: true, win: true, lose: false };
        die.show(5);
        refreshHud();
        showBanner(true);
        rollBtn.disabled = true; holdBtn.disabled = true;
        dialog.say(T('pt.msg.you_win', { target: TARGET }), { instant: true });
      } else if (PT_END === 'lose') {
        state = { my: 19, riv: 25, pot: 0, turn: 'done', terminal: true, win: false, lose: true };
        die.show(3);
        refreshHud();
        showBanner(false);
        rollBtn.disabled = true; holdBtn.disabled = true;
        dialog.say(T('pt.msg.you_lose', { target: TARGET }), { instant: true });
      } else {
        state = { my: 8, riv: 12, pot: 6, turn: 'me', terminal: false };
        die.show(4);
        refreshHud();
        setButtons({ disable: false });
        dialog.say(T('pt.msg.rolled', { face: 4, pot: 6 }), { instant: true });
      }
    }

    return {
      onEnter() { /* keep the in-progress game on re-entry; no autorun. */ },
      onLeave() { episode++; busy = false; }
    };
  };
})();
