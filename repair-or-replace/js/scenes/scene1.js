/* Scene 1: Tutorial, "How it works".
 *
 * A step-driven fleet sheet, walked with the LEFT / RIGHT keys (or the
 * in-scene BACK / NEXT buttons; the topbar PREV / NEXT delegates here
 * too). Nine internal steps, one idea each; rewind re-renders the sheet
 * at step k with no animations. A SKIP TUTORIAL button jumps straight
 * to the playtest (scene 2). Vocabulary only: wear, call, profit,
 * breakdown.
 *
 *   step 0  OLD BESSIE (md VanCard) + the four wear states as a labeled
 *           strip of compact gauge chips; wear drifts down as she runs.
 *   step 1  the RUN card: weekly profit per wear chip (DATA.model.revRun).
 *   step 2  the BREAKDOWN odds row appears alone (2/8/28/55).
 *   step 3  what a breakdown costs: the tow row (-280 chip, arrow,
 *           FAILING swatch) staged in; the strip's FAILING chip slams.
 *   step 4  the two cliffs: WORN and SHAKY columns pulse, cliff chip.
 *   step 5  the SERVICE card: the cost line only (-50, a week offline).
 *   step 6  what the shop does: four per-state effect lines, staggered.
 *   step 7  the REPLACE card: -130, a week offline, HEALTHY on Monday.
 *   step 8  the closing question: what is the right call in each state?
 *
 * Every probability / profit / cost is read from window.DATA.model (with
 * window.Van as fallback) at build time; nothing numeric is hand-typed.
 * Cold-entry safe; supports a `&step=N` deep link (N in 0..8) for
 * headless capture. The in-scene NEXT button is [data-run-primary] so
 * &run advances once.
 */
(function () {
  window.scenes = window.scenes || {};

  const N_STEPS = 9;

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

    /* ---------- Step copy: ONE short line, numbers live in the cards ---------- */
    const STEPS = [
      {
        title: 'OLD BESSIE AND HER WEAR',
        say: 'This is OLD BESSIE, the delivery van. Run her and the wear drifts down the strip.',
      },
      {
        title: 'CALL 1: RUN THE ROUTE',
        say: 'RUN banks the week. An older van earns less.',
      },
      {
        title: 'RUN RISK: THE BREAKDOWN',
        say: 'Every RUN risks a breakdown. The odds grow with wear.',
      },
      {
        title: 'WHAT A BREAKDOWN COSTS',
        say: 'One breakdown pays the tow and dumps her to ' + SD[3] + '.',
      },
      {
        title: 'THE TWO CLIFFS',
        say: 'Two cliffs, same place.',
      },
      {
        title: 'CALL 2: SERVICE',
        say: 'SERVICE skips the route and pays the shop.',
      },
      {
        title: 'WHAT THE SHOP DOES',
        say: 'Strong on a worn van, weak past that.',
      },
      {
        title: 'CALL 3: REPLACE',
        say: 'REPLACE buys a fresh start, whatever the wear.',
      },
      {
        title: 'YOUR CALL, EVERY WEEK',
        say: 'Four wear levels, three calls. What is the right call in each state?',
      },
    ];

    /* Which element pops in when a step is reached going forward. */
    const FRESH_BY_STEP = {
      1: 'card1', 2: 'bd', 3: 'tow', 4: 'cliff',
      5: 'card3', 6: 'svcrows', 7: 'card4', 8: 'ask',
    };

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

    /* The WORN / SHAKY columns light up at the two-cliffs step. */
    function cliffCls(k, w, fresh) {
      if (k >= 4 && (w === 1 || w === 2)) {
        return ' tut-cliff' + (fresh === 'cliff' ? ' tut-pulse' : '');
      }
      return '';
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
        h += '<span class="tut-rstate' + cliffCls(k, w, fresh) + '">' +
          '<span class="tut-sw tut-sw-' + w + '"></span>' +
          '<span class="tut-rsname">' + SD[w] + '</span></span>';
      }
      h += '<span class="tut-rlab">PROFIT/WK</span>';
      for (let w = 0; w < 4; w++) {
        h += '<span class="tut-rcell tut-profit' + cliffCls(k, w, fresh) + '">+' + rev[w] + '</span>';
      }
      if (k >= 2) {
        h += '<span class="tut-rlab' + popBd + '">BREAKDOWN</span>';
        for (let w = 0; w < 4; w++) {
          h += '<span class="tut-rcell tut-risk' + cliffCls(k, w, fresh) + popBd + '">' + pct(pbd[w]) + '</span>';
        }
      }
      if (k >= 4) {
        h += '<span class="tut-cliffchip' +
          (fresh === 'cliff' ? ' tut-pop tut-pop-late' : '') + '">TWO CLIFFS, SAME PLACE' +
          '<small>profit ' + rev[1] + ' to ' + rev[2] +
          ', risk ' + pct(pbd[1]) + ' to ' + pct(pbd[2]) + '</small></span>';
      }
      h += '</div>';
      if (k >= 3) {
        h += '<div class="tut-towrow' + (fresh === 'tow' ? ' tut-tow-fresh' : '') + '">' +
          '<span class="tut-foot-warn">&#9888;</span>' +
          '<span class="tut-tow-cost">-' + bdCost + '</span>' +
          '<span class="tut-tow-sub">the tow</span>' +
          '<span class="tut-tow-arrow">&#9654;</span>' +
          '<span class="tut-tow-dest"><span class="tut-sw tut-sw-3"></span>' +
            '<span class="tut-wn-3">' + SD[3] + '</span></span>' +
          '</div>';
      }
      h += '<div class="tut-card-foot">the week pays, but wear creeps on</div>';
      el.innerHTML = h;
      return el;
    }

    function buildServiceCard(k, fresh) {
      const el = document.createElement('div');
      el.className = 'tut-card lever-service' + (fresh === 'card3' ? ' tut-pop' : '');
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
        '<span class="tut-cost-sub">no profit this week</span></div>';
      if (k >= 6) {
        h += '<div class="tut-sgrid">';
        for (let w = 0; w < 4; w++) {
          h += '<div class="tut-srow' + (fresh === 'svcrows' ? ' tut-pop' : '') + '"' +
            (fresh === 'svcrows' ? ' style="animation-delay:' + (w * 350) + 'ms"' : '') + '>' +
            '<span class="tut-sw tut-sw-' + w + '"></span>' +
            '<span class="tut-srow-name tut-wn-' + w + '">' + SD[w] + '</span>' +
            '<span class="tut-srow-txt">' + rows[w] + '</span></div>';
        }
        h += '</div>';
      }
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
        sh += '<span class="tut-chip' +
          (w === 3 && fresh === 'tow' ? ' tut-slam-chip' : '') + '">' +
          '<span class="tut-chip-g" data-w="' + w + '"></span>' +
          '<span class="tut-wn tut-wn-' + w + '">' + SD[w] + '</span>' +
          (k >= 8 ? '<span class="tut-chip-q">?</span>' : '') +
          '</span>';
        if (w < 3) sh += '<span class="tut-arrow">&#9656;</span>';
      }
      sh += '</div><div class="tut-drift">wear drifts this way as she runs &#9656;</div>';
      if (k >= 8) {
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
      cards.appendChild(k >= 5 ? buildServiceCard(k, fresh) : buildLocked('CALL 2'));
      cards.appendChild(k >= 7 ? buildReplaceCard(fresh === 'card4') : buildLocked('CALL 3'));
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
      if (fresh === 'tow' && window.SFX) window.SFX.play('hit');
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
