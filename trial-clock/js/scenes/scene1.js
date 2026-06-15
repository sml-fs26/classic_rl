/* Scene 1 -- Tutorial. A guided 5-step walkthrough of the controls with zero
   theory: the Trial Card (situation), the three levers, the two dice you do not
   control (Adoption Coin + Conversion Wheel), the three terminals, and one
   harmless demo nudge. Internal stepping. Cold-entry safe; honours &run. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const LEVER_IDS = window.Levers.LEVER_IDS;
  const STEPS = ['s0', 's1', 's2', 's3', 's4'];

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="scene-row sc1-row">' +
        '<div class="sc1-card-host"></div>' +
        '<div class="sc1-right grow">' +
          '<div class="sc1-chips"></div>' +
          '<div class="sc1-dice">' +
            '<div class="sc1-die"><div class="sc1-die-lab muted">' + T('scene1.coinLab') + '</div><div class="sc1-coin-host"></div></div>' +
            '<div class="sc1-die"><div class="sc1-die-lab muted">' + T('scene1.wheelLab') + '</div><div class="sc1-wheel-host"></div></div>' +
          '</div>' +
          '<div class="poke-box sc1-dialog"></div>' +
          '<div class="tc-btn-row sc1-nav">' +
            '<span class="sc1-stepcount muted"></span>' +
            '<button class="tc-btn sc1-back" type="button">' + T('scene1.back') + '</button>' +
            '<button class="tc-btn primary sc1-next" type="button">' + T('scene1.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const card = window.TrialCard.mount(root.querySelector('.sc1-card-host'), {});
    card.setState(1, 4);

    const chipsHost = root.querySelector('.sc1-chips');
    function renderChips(highlight) {
      chipsHost.innerHTML = '';
      for (const id of LEVER_IDS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lever-chip' + (highlight ? ' chip-hl' : '');
        b.dataset.lever = id;
        b.disabled = true;
        b.innerHTML = window.Board.leverShort(id) + ' <span class="chip-role">' + T('lever.' + id + '.role') + '</span>';
        chipsHost.appendChild(b);
      }
    }
    renderChips(false);

    const coin = window.Coin.mount(root.querySelector('.sc1-coin-host'), { badge: T('coin.badge') });
    coin.set(true); root.querySelector('.sc1-coin-host').classList.remove('is-heads', 'is-tails');
    const wheel = window.Wheel.mount(root.querySelector('.sc1-wheel-host'), { tier: 0, compact: true });

    const dialog = window.Dialog.mount(root.querySelector('.sc1-dialog'));

    let cursor = 0;
    function applyStep(i) {
      cursor = Math.max(0, Math.min(STEPS.length - 1, i));
      const key = STEPS[cursor];
      dialog.say('<b>' + T('scene1.' + key + '.title') + '</b> ' + T('scene1.' + key + '.body'), { instant: true });

      chipsHost.classList.toggle('sc1-dim', cursor !== 1);
      root.querySelector('.sc1-dice').classList.toggle('sc1-dim', cursor !== 2 && cursor !== 4);
      card.host.classList.toggle('sc1-emph', cursor === 0 || cursor === 3);

      if (cursor === 0) { card.setState(1, 4); renderChips(false); }
      if (cursor === 1) { renderChips(true); }
      if (cursor === 2) { wheel.setTier(0); wheel.set(null); }   // cold user's wheel: big red ABANDON
      if (cursor === 3) {
        card.flashTerminal('convert');
        setTimeout(() => card.flashTerminal('abandon'), 500);
        setTimeout(() => { card.setState(1, 4); }, 1000);
      }
      if (cursor === 4) { renderChips(false); demoBtnShow(); }
      else demoBtnHide();

      const sc = root.querySelector('.sc1-stepcount');
      if (sc) sc.textContent = T('scene1.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc1-next');
      if (nextBtn) nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene1.done') : T('scene1.next');
      const backBtn = root.querySelector('.sc1-back');
      if (backBtn) backBtn.disabled = cursor === 0;
    }

    /* Demo nudge button (step 5). */
    let demoBtn = null;
    function demoBtnShow() {
      if (demoBtn) return;
      demoBtn = document.createElement('button');
      demoBtn.type = 'button';
      demoBtn.className = 'tc-btn sc1-demo';
      demoBtn.textContent = T('scene1.demoBtn');
      demoBtn.addEventListener('click', playDemo);
      root.querySelector('.sc1-dice').insertAdjacentElement('afterend', demoBtn);
    }
    function demoBtnHide() { if (demoBtn) { demoBtn.remove(); demoBtn = null; } }
    function playDemo() {
      card.setState(1, 4);
      coin.flip(true).then(() => { card.setState(2, 3); card.pulse(); });
    }

    root.querySelector('.sc1-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.TC && window.TC.goTo(2);
    });
    root.querySelector('.sc1-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.TC && window.TC.run) { applyStep(STEPS.length - 1); setTimeout(playDemo, 200); }

    return {
      onEnter() { applyStep(cursor); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();
