/* Scene 1 -- Tutorial. A guided 5-step walkthrough of the controls with zero
   theory: capital, the three stakes (with clamping), the rigged coin, the two
   terminals, and one slow demo flip. Internal stepping via onNextKey/onPrevKey.
   Cold-entry safe; honours &run (jumps to the last step + plays the demo). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const STAKE_IDS = window.Stakes.STAKE_IDS;
  const STEPS = ['s0', 's1', 's2', 's3', 's4'];

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML = '';

    const h = document.createElement('h2');
    h.className = 'scene-heading';
    h.textContent = T('scene1.title');
    root.appendChild(h);

    const lede = document.createElement('p');
    lede.className = 'scene-lede';
    lede.textContent = T('scene1.lede');
    root.appendChild(lede);

    const row = document.createElement('div');
    row.className = 'scene-row sc1-row';
    row.innerHTML =
      '<div class="sc1-ladder-host"></div>' +
      '<div class="sc1-right grow">' +
        '<div class="sc1-chips"></div>' +
        '<div class="sc1-coin-host"></div>' +
        '<div class="poke-box sc1-dialog"></div>' +
        '<div class="gr-btn-row sc1-nav">' +
          '<span class="sc1-stepcount muted"></span>' +
          '<button class="gr-btn sc1-back" type="button">' + T('scene1.back') + '</button>' +
          '<button class="gr-btn primary sc1-next" type="button">' + T('scene1.next') + '</button>' +
        '</div>' +
      '</div>';
    root.appendChild(row);

    const ladder = window.QLadder.mount(row.querySelector('.sc1-ladder-host'), { variant: 'icon' });
    ladder.setToken(5);

    /* Stake chips (display only here, with clamping shown). */
    const chipsHost = row.querySelector('.sc1-chips');
    function renderChips(cap, highlight) {
      const legal = window.Gambler.availableStakeIds(cap);
      chipsHost.innerHTML = '';
      for (const id of STAKE_IDS) {
        const isLegal = legal.includes(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'stake-chip' + (isLegal ? '' : ' clamped') + (highlight && isLegal ? ' chip-hl' : '');
        b.dataset.stake = id;
        b.disabled = !isLegal;
        b.innerHTML = T('stake.' + id) + ' <span class="chip-role">' + T('stake.' + id + '.role') + '</span>';
        chipsHost.appendChild(b);
      }
    }
    renderChips(5, false);

    const coin = window.Coin.mount(row.querySelector('.sc1-coin-host'), { badge: T('coin.badge') });
    coin.set(true); /* idle face: show a neutral-ish heads to start */
    row.querySelector('.sc1-coin-host').classList.remove('is-win', 'is-loss');

    const dialog = window.Dialog.mount(row.querySelector('.sc1-dialog'));

    let cursor = 0;
    function applyStep(i, opts) {
      cursor = Math.max(0, Math.min(STEPS.length - 1, i));
      const key = STEPS[cursor];
      const title = T('scene1.' + key + '.title');
      const body = T('scene1.' + key + '.body');
      dialog.say('<b>' + title + '</b> ' + body, { instant: true });

      /* per-step emphasis */
      chipsHost.classList.toggle('sc1-dim', cursor !== 1);
      row.querySelector('.sc1-coin-host').classList.toggle('sc1-dim', cursor !== 2 && cursor !== 4);
      ladder.host.classList.toggle('sc1-emph', cursor === 0 || cursor === 3);

      if (cursor === 0) { ladder.setToken(5); renderChips(5, false); }
      if (cursor === 1) { renderChips(5, true); }
      if (cursor === 3) { ladder.flashTerminal('goal'); setTimeout(() => ladder.flashTerminal('ruin'), 350); }
      if (cursor === 4) { renderChips(5, false); demoBtnShow(); }
      else demoBtnHide();

      const sc = root.querySelector('.sc1-stepcount');
      if (sc) sc.textContent = T('scene1.step', { n: cursor + 1, total: STEPS.length });
      const nextBtn = root.querySelector('.sc1-next');
      if (nextBtn) nextBtn.textContent = cursor === STEPS.length - 1 ? T('scene1.done') : T('scene1.next');
      const backBtn = root.querySelector('.sc1-back');
      if (backBtn) backBtn.disabled = cursor === 0;
    }

    /* Demo flip button (step 5). */
    let demoBtn = null;
    function demoBtnShow() {
      if (demoBtn) return;
      demoBtn = document.createElement('button');
      demoBtn.type = 'button';
      demoBtn.className = 'gr-btn sc1-demo';
      demoBtn.textContent = T('scene1.demoBtn');
      demoBtn.addEventListener('click', playDemo);
      row.querySelector('.sc1-coin-host').insertAdjacentElement('afterend', demoBtn);
    }
    function demoBtnHide() { if (demoBtn) { demoBtn.remove(); demoBtn = null; } }
    function playDemo() {
      ladder.setToken(5);
      coin.flip(false).then(() => { ladder.setToken(3); ladder.pulseToken(); });
    }

    root.querySelector('.sc1-next').addEventListener('click', () => {
      if (cursor < STEPS.length - 1) applyStep(cursor + 1);
      else window.GR && window.GR.goTo(2);
    });
    root.querySelector('.sc1-back').addEventListener('click', () => { if (cursor > 0) applyStep(cursor - 1); });

    applyStep(0);
    if (window.GR && window.GR.run) { applyStep(STEPS.length - 1); setTimeout(playDemo, 200); }

    return {
      onEnter() { applyStep(cursor); },
      onNextKey() { if (cursor < STEPS.length - 1) { applyStep(cursor + 1); return true; } return false; },
      onPrevKey() { if (cursor > 0) { applyStep(cursor - 1); return true; } return false; },
    };
  };
})();
