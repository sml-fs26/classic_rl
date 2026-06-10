/* Scene 1: Tutorial, "How it works".
 *
 * A step-driven fleet sheet, walked with the LEFT / RIGHT keys (or the
 * in-scene BACK / NEXT buttons; the topbar PREV / NEXT delegates here
 * too). Six internal steps; rewind re-renders the sheet at step k with
 * no animations. A SKIP TUTORIAL button jumps straight to the playtest
 * (scene 2). Vocabulary only: wear, call, profit, breakdown.
 *
 *   step 0  OLD BESSIE (md VanCard) + the four wear states as a labeled
 *           strip of compact gauge chips; wear drifts down as she runs.
 *   step 1  the RUN card: weekly profit per wear chip (DATA.model.revRun).
 *   step 2  the BREAKDOWN row on the RUN card: odds per state, the
 *           profit-minus-280 hit, the dump to FAILING, and the
 *           WORN-to-SHAKY double cliff ("two cliffs, same place").
 *   step 3  the SERVICE card: -50, a week offline, honest serviceUp odds.
 *   step 4  the REPLACE card: -130, a week offline, HEALTHY on Monday.
 *   step 5  the closing question: what is the right call in each state?
 *
 * Every probability / profit / cost is read from window.DATA.model (with
 * window.Van as fallback) at build time; nothing numeric is hand-typed.
 * Cold-entry safe; supports a `&step=N` deep link for headless capture.
 * The in-scene NEXT button is [data-run-primary] so &run advances once.
 */
(function () {
  window.scenes = window.scenes || {};

  const N_STEPS = 6;

  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') || reduced();
  }
  function pct(p) { return Math.round((p || 0) * 100) + '%'; }

  window.scenes.scene1 = function (root) {
    root.classList.add('scene-pad', 'scene1-scene');
    root.innerHTML = '';

    /* ---------- The numbers, read once from DATA / Van ---------- */
    const M = (window.DATA && window.DATA.model) || {};
    const V = window.Van || {};
    const rev = M.revRun || V.REV_RUN || [];
    const pbd = M.pBreakdown || V.P_BD || [];
    const su = M.serviceUp || V.SERV_UP || [];
    const bdCost = (M.breakdownCost != null) ? M.breakdownCost : V.BREAKDOWN_COST;
    const svcCost = (M.serviceCost != null) ? M.serviceCost : V.C_SERVICE;
    const repCost = (M.replaceCost != null) ? M.replaceCost : V.C_REPLACE;
    const SD = V.STATE_DISPLAY || (window.DATA && window.DATA.stateDisplay) ||
      ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];

    /* Honest SERVICE odds, derived (not hand-typed): WORN improves with
       p(up1)+p(up2); SHAKY / FAILING stay put with p(stay). */
    const wornFix = su[1] ? Math.round((su[1][1] + su[1][2]) * 100) : 0;
    const shakyStuck = su[2] ? Math.round(su[2][0] * 100) : 0;
    const failStuck = su[3] ? Math.round(su[3][0] * 100) : 0;

    function gloss(id) {
      const list = (window.Actions && window.Actions.ACTIONS) || [];
      for (const a of list) if (a.id === id) return a.gloss;
      return '';
    }
    function icon(id) {
      return window.Actions ? window.Actions.leverIconSvg(id) : '';
    }

    /* ---------- Step copy (numbers injected from the model) ---------- */
    const STEPS = [
      {
        title: 'OLD BESSIE AND HER WEAR',
        say: 'This is OLD BESSIE, the delivery van. Her wear sits at one of four levels: ' +
          SD.join(', ') + '. Run her and the wear drifts down the strip.',
      },
      {
        title: 'CALL 1: RUN THE ROUTE',
        say: 'RUN drives the route and banks the week. Profit follows wear: ' +
          rev[0] + ' ' + SD[0] + ', ' + rev[1] + ' ' + SD[1] + ', ' +
          rev[2] + ' ' + SD[2] + ', ' + rev[3] + ' ' + SD[3] + '. An older van earns less.',
      },
      {
        title: 'RUN RISK: THE BREAKDOWN',
        say: 'Every RUN also risks a breakdown: ' + pbd.map(pct).join(' / ') +
          ' by state. A breakdown pays profit minus ' + bdCost +
          ' and dumps her to ' + SD[3] + '. Watch ' + SD[1] + ' to ' + SD[2] +
          ': profit ' + rev[1] + ' to ' + rev[2] + ', odds ' + pct(pbd[1]) +
          ' to ' + pct(pbd[2]) + '. Two cliffs, same place.',
      },
      {
        title: 'CALL 2: SERVICE',
        say: 'SERVICE costs ' + svcCost + ' and a week in the shop, no profit. On ' +
          SD[1] + ' it fixes her ' + wornFix + '% of the time. On ' + SD[2] +
          ' it does nothing ' + shakyStuck + '% of the time. On ' + SD[3] +
          ' she is mostly stuck.',
      },
      {
        title: 'CALL 3: REPLACE',
        say: 'REPLACE costs ' + repCost + ' and a week offline. Monday a brand-new ' +
          SD[0] + ' van takes the route, whatever the wear was.',
      },
      {
        title: 'YOUR CALL, EVERY WEEK',
        say: 'Four wear levels, three calls, one decision a week. ' +
          'What is the right call in each state? Next: you drive.',
      },
    ];

    /* Which element pops in when a step is reached going forward. */
    const FRESH_BY_STEP = { 1: 'card1', 2: 'bd', 3: 'card3', 4: 'card4', 5: 'ask' };

    /* ---------- Chrome ---------- */
    const bar = document.createElement('div');
    bar.className = 'tut-bar';
    bar.innerHTML =
      '<div class="tut-counter"></div>' +
      '<button type="button" class="poke-btn tut-skip">SKIP TUTORIAL</button>';
    root.appendChild(bar);
    const counter = bar.querySelector('.tut-counter');
    const skipBtn = bar.querySelector('.tut-skip');
    skipBtn.addEventListener('click', () => { if (window.VanViz) window.VanViz.goTo(2); });

    const title = document.createElement('h2');
    title.className = 'poke-section-title tut-title';
    root.appendChild(title);

    const demoHost = document.createElement('div');
    demoHost.className = 'tut-demo';
    root.appendChild(demoHost);

    const dialogHost = document.createElement('div');
    dialogHost.className = 'tut-dialog';
    root.appendChild(dialogHost);
    const dialog = window.Dialog.mount(dialogHost);

    const nav = document.createElement('div');
    nav.className = 'tut-nav';
    nav.innerHTML =
      '<button type="button" class="poke-btn tut-prev">&#9664; BACK</button>' +
      '<span class="tut-hint">step with &#9664; &#9654; or the buttons</span>' +
      '<button type="button" class="poke-btn tut-next" data-run-primary>NEXT &#9654;</button>';
    root.appendChild(nav);
    const prevBtn = nav.querySelector('.tut-prev');
    const nextBtn = nav.querySelector('.tut-next');
    prevBtn.addEventListener('click', () => {
      if (cursor > 0) step(cursor - 1, { back: true });
      else if (window.VanViz) window.VanViz.goTo(0);
    });
    nextBtn.addEventListener('click', () => {
      if (cursor < N_STEPS - 1) step(cursor + 1);
      else if (window.VanViz) window.VanViz.goTo(2);
    });

    /* ---------- The fleet sheet, re-rendered at every step ---------- */

    function cliffCls(k, w) {
      return (k >= 2 && (w === 1 || w === 2)) ? ' tut-cliff' : '';
    }

    function buildLocked(label) {
      const el = document.createElement('div');
      el.className = 'tut-card tut-locked';
      el.innerHTML =
        '<span class="tut-locked-q">?</span>' +
        '<span class="tut-locked-lab">' + label + '</span>';
      return el;
    }

    function buildRunCard(k, fresh) {
      const el = document.createElement('div');
      el.className = 'tut-card lever-run' + (fresh === 'card1' ? ' tut-pop' : '');
      const popBd = fresh === 'bd' ? ' tut-pop' : '';
      let h =
        '<div class="tut-card-head">' +
          '<span class="tut-card-icon">' + icon('run') + '</span>' +
          '<span class="tut-card-name">RUN</span>' +
          '<span class="tut-card-gloss">' + gloss('run') + '</span>' +
        '</div>' +
        '<div class="tut-rgrid">' +
        '<span class="tut-rlab"></span>';
      for (let w = 0; w < 4; w++) {
        h += '<span class="tut-rstate' + cliffCls(k, w) + '">' +
          '<span class="tut-sw tut-sw-' + w + '"></span>' +
          '<span class="tut-rsname">' + SD[w] + '</span></span>';
      }
      h += '<span class="tut-rlab">PROFIT/WK</span>';
      for (let w = 0; w < 4; w++) {
        h += '<span class="tut-rcell tut-profit' + cliffCls(k, w) + '">+' + rev[w] + '</span>';
      }
      if (k >= 2) {
        h += '<span class="tut-rlab' + popBd + '">BREAKDOWN</span>';
        for (let w = 0; w < 4; w++) {
          h += '<span class="tut-rcell tut-risk' + cliffCls(k, w) + popBd + '">' + pct(pbd[w]) + '</span>';
        }
        h += '<span class="tut-cliffchip' + popBd + '">TWO CLIFFS, SAME PLACE' +
          '<small>profit ' + rev[1] + ' to ' + rev[2] +
          ', risk ' + pct(pbd[1]) + ' to ' + pct(pbd[2]) + '</small></span>';
      }
      h += '</div>';
      if (k >= 2) {
        h += '<div class="tut-card-foot"><span class="tut-foot-warn">&#9888;</span> ' +
          'a breakdown pays profit minus ' + bdCost + ' and dumps her to ' + SD[3] + '</div>';
      } else {
        h += '<div class="tut-card-foot">the week pays, but wear creeps on</div>';
      }
      el.innerHTML = h;
      return el;
    }

    function buildServiceCard(pop) {
      const el = document.createElement('div');
      el.className = 'tut-card lever-service' + (pop ? ' tut-pop' : '');
      const rows = [
        'nothing to fix',
        'fixed ' + wornFix + '% of the time',
        'no help ' + shakyStuck + '% of the time',
        'stuck ' + failStuck + '% of the time',
      ];
      let h =
        '<div class="tut-card-head">' +
          '<span class="tut-card-icon">' + icon('service') + '</span>' +
          '<span class="tut-card-name">SERVICE</span>' +
          '<span class="tut-card-gloss">' + gloss('service') + '</span>' +
        '</div>' +
        '<div class="tut-cost-row"><span class="tut-cost">-' + svcCost + '</span>' +
        '<span class="tut-cost-sub">a week in the shop, no profit</span></div>' +
        '<div class="tut-sgrid">';
      for (let w = 0; w < 4; w++) {
        h += '<span class="tut-sw tut-sw-' + w + '"></span>' +
          '<span class="tut-srow-name tut-wn-' + w + '">' + SD[w] + '</span>' +
          '<span class="tut-srow-txt">' + rows[w] + '</span>';
      }
      h += '</div>' +
        '<div class="tut-card-foot">strong on a worn van, weak past that</div>';
      el.innerHTML = h;
      return el;
    }

    function buildReplaceCard(pop) {
      const el = document.createElement('div');
      el.className = 'tut-card lever-replace' + (pop ? ' tut-pop' : '');
      el.innerHTML =
        '<div class="tut-card-head">' +
          '<span class="tut-card-icon">' + icon('replace') + '</span>' +
          '<span class="tut-card-name">REPLACE</span>' +
          '<span class="tut-card-gloss">' + gloss('replace') + '</span>' +
        '</div>' +
        '<div class="tut-cost-row"><span class="tut-cost">-' + repCost + '</span>' +
        '<span class="tut-cost-sub">a week offline</span></div>' +
        '<div class="tut-rep-visual">' +
          '<span class="tut-rep-g" data-w="3"></span>' +
          '<span class="tut-rep-arrow">&#9654;</span>' +
          '<span class="tut-rep-g" data-w="0"></span>' +
        '</div>' +
        '<div class="tut-rep-line">any wear level, back to ' + SD[0] + '</div>' +
        '<div class="tut-card-foot">brand-new van on the route Monday</div>';
      return el;
    }

    function renderDemo(k, fresh) {
      demoHost.innerHTML = '';

      /* Top row: Bessie + the wear strip. */
      const top = document.createElement('div');
      top.className = 'tut-top';

      const vanWrap = document.createElement('div');
      vanWrap.className = 'tut-van';
      top.appendChild(vanWrap);
      if (window.VanCard) {
        window.VanCard.mount(vanWrap, { wear: 0, size: 'md', miles: 48213 });
      }

      const stripCol = document.createElement('div');
      stripCol.className = 'tut-strip-col';
      let sh = '<div class="tut-strip-label">THE FOUR WEAR STATES</div><div class="tut-strip">';
      for (let w = 0; w < 4; w++) {
        sh += '<span class="tut-chip">' +
          '<span class="tut-chip-g" data-w="' + w + '"></span>' +
          '<span class="tut-wn tut-wn-' + w + '">' + SD[w] + '</span>' +
          (k >= 5 ? '<span class="tut-chip-q">?</span>' : '') +
          '</span>';
        if (w < 3) sh += '<span class="tut-arrow">&#9656;</span>';
      }
      sh += '</div><div class="tut-drift">wear drifts this way as she runs &#9656;</div>';
      if (k >= 5) {
        sh += '<div class="tut-ask' + (fresh === 'ask' ? ' tut-pop' : '') +
          '">one call per state: that is a playbook</div>';
      }
      stripCol.innerHTML = sh;
      top.appendChild(stripCol);
      demoHost.appendChild(top);

      /* The three call cards (locked slots until their step). */
      const cards = document.createElement('div');
      cards.className = 'tut-cards';
      cards.appendChild(k >= 1 ? buildRunCard(k, fresh) : buildLocked('CALL 1'));
      cards.appendChild(k >= 3 ? buildServiceCard(fresh === 'card3') : buildLocked('CALL 2'));
      cards.appendChild(k >= 4 ? buildReplaceCard(fresh === 'card4') : buildLocked('CALL 3'));
      demoHost.appendChild(cards);

      /* Mount the compact gauge chips (wear strip + REPLACE visual). */
      demoHost.querySelectorAll('.tut-chip-g, .tut-rep-g').forEach((g) => {
        if (window.VanCard) {
          window.VanCard.mount(g, { wear: parseInt(g.getAttribute('data-w'), 10) || 0, compact: true });
        }
      });
    }

    /* ---------- Step engine ---------- */
    let cursor = -1;

    function step(k, opts) {
      const o = opts || {};
      k = Math.max(0, Math.min(N_STEPS - 1, k));
      const forward = !o.back && k === cursor + 1;
      const fresh = (forward && !instantMode()) ? (FRESH_BY_STEP[k] || null) : null;
      cursor = k;
      counter.textContent = 'STEP ' + (k + 1) + ' / ' + N_STEPS;
      title.textContent = STEPS[k].title;
      renderDemo(k, fresh);
      dialog.say(STEPS[k].say, { instant: instantMode() || o.back === true });
      nextBtn.innerHTML = (k === N_STEPS - 1) ? 'GO DRIVE &#9654;' : 'NEXT &#9654;';
      skipBtn.textContent = (k === N_STEPS - 1) ? 'GO TO THE FLEET' : 'SKIP TUTORIAL';
      if (fresh === 'bd' && window.SFX) window.SFX.play('hit');
    }

    /* Optional `&step=N` deep link to an internal step (headless capture). */
    function readInitialStep() {
      const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
      if (!m) return 0;
      const n = parseInt(m[1], 10);
      return (Number.isFinite(n) && n >= 0 && n < N_STEPS) ? n : 0;
    }
    step(readInitialStep());

    return {
      onEnter() { step(readInitialStep(), { back: true }); },
      onNextKey() {
        if (cursor < N_STEPS - 1) { step(cursor + 1); return true; }
        return false;            /* fall through: on to scene 2 (the fleet) */
      },
      onPrevKey() {
        if (cursor > 0) { step(cursor - 1, { back: true }); return true; }
        return false;            /* fall through: back to the title */
      },
    };
  };
})();
