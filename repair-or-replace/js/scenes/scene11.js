/* Scene 11, "SARSA: the one-cell nudge": a guided walkthrough of ONE update.
 *
 *   The didactic half of the SARSA pair (scene 14 owns the free-running
 *   cockpit). Five internal steps, one idea per click:
 *
 *     0  one logbook line: the chips s, a, r, s', a' slide in one at a time
 *     1  the target r + 0.9 x q[s',a'] assembles from those chips
 *     2  the gap: target vs her current guess q[s,a], a bar with a TD chip
 *     3  the nudge: q[s,a] slides alpha = 0.15 of the way to the target
 *     4  the full update line, every term colour-matched to the chips above
 *
 *   The worked example (source, deterministic):
 *     transition   s=WORN, a=RUN, r=+72, s'=SHAKY is a legal draw from
 *                  DATA.model: revRun[WORN] = 72, and a non-breakdown RUN
 *                  at WORN degrades one level with chance (1-0.08) x 0.55.
 *     a'=SVC       the call picked for SHAKY next week (on-policy).
 *     q[WORN,RUN] = 42.2 and q[SHAKY,SVC] = 38.0: her notebook part-way
 *                  through learning, well inside (0, Q*) for those cells
 *                  (DATA.Qstar: 203.4 and 126.4). The pair is fixed so the
 *                  whole displayed chain is EXACT at one decimal:
 *                  target = 72 + 0.9 x 38.0 = 106.2, TD = +64.0,
 *                  nudge = 0.15 x 64.0 = +9.6, new cell = 51.8.
 *     alpha = 0.15, gamma = 0.9 match the scene 14 cockpit defaults and
 *     DATA.model.gamma; r is read from DATA at build time, never typed.
 *
 *   Rendering is a pure function of the step cursor (applyStep), so rewind
 *   restores any step exactly; one-shot animations fire only on forward
 *   clicks. `&step=K` (0..4) deep-links to a step on cold entry. No
 *   data-run-primary: there is nothing to run here.
 *
 *   Contract: window.scenes.scene11 = function(root){ return {...}; }
 */
(function () {
  window.scenes = window.scenes || {};

  const N_STEPS = 5;

  function hashStep() {
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(N_STEPS - 1, n)) : 0;
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  window.scenes.scene11 = function (root) {
    root.classList.add('scene-pad', 'scene11-scene', 'concept-scene');
    root.innerHTML = '';

    const Van = window.Van;
    const ACT = window.Actions;
    const D = window.DATA || {};
    const M = D.model || {};
    const SD = (Van && Van.STATE_DISPLAY) || D.stateDisplay ||
      ['HEALTHY', 'WORN', 'SHAKY', 'FAILING'];
    const GAMMA = (M.gamma != null) ? M.gamma : ((Van && Van.GAMMA) || 0.9);
    const REV = M.revRun || (Van && Van.REV_RUN) || [95, 72, 40, 16];

    /* ---- the worked example (provenance in the header comment) ---- */
    const EX = {
      sFrom: 1, a: 'run', sTo: 2, aNext: 'service',
      r: REV[1],          /* +72: RUN at WORN, no breakdown */
      qB: 42.2,           /* her current q[WORN, RUN]  */
      qN: 38.0,           /* her current q[SHAKY, SVC] */
      alpha: 0.15,
    };
    EX.boot = GAMMA * EX.qN;       /* 34.2  */
    EX.target = EX.r + EX.boot;    /* 106.2 */
    EX.td = EX.target - EX.qB;     /* +64.0 */
    EX.delta = EX.alpha * EX.td;   /* +9.6  */
    EX.qAfter = EX.qB + EX.delta;  /* 51.8  */
    const BAR_MAX = 120;           /* gap-bar scale, comfortably > target */

    const f1 = (v) => v.toFixed(1);
    const pos = (v) => (v >= 0 ? '+' : '') + v.toFixed(1);
    const pct = (v) => (v / BAR_MAX * 100).toFixed(3) + '%';

    const CELL_B = 'q[' + SD[EX.sFrom] + ',' + ACT.shortLabel(EX.a) + ']';
    const CELL_N = 'q[' + SD[EX.sTo] + ',' + ACT.shortLabel(EX.aNext) + ']';

    function wearChip(w) {
      return '<span class="s11-wear w' + w + '">' + SD[w] + '</span>';
    }
    function leverChip(id) {
      return '<span class="s11-lever ' + ACT.toneClass(id) + '">' +
             ACT.shortLabel(id) + '</span>';
    }

    /* ---------------- DOM ---------------- */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'SARSA: the one-cell nudge';
    root.appendChild(heading);

    const stage = document.createElement('div');
    stage.className = 's11-stage';
    root.appendChild(stage);

    function mkPanel(cls, capText) {
      const p = document.createElement('div');
      p.className = 's11-panel ' + cls;
      p.hidden = true;
      const row = document.createElement('div');
      row.className = 's11-caprow';
      row.innerHTML = '<span class="s11-cap">' + capText + '</span>';
      p.appendChild(row);
      stage.appendChild(p);
      return p;
    }

    /* ---- panel 0: the logbook line ---- */
    const logPanel = mkPanel('s11-logpanel', 'ONE WEEK, ONE LOGBOOK LINE');
    const logRow = document.createElement('div');
    logRow.className = 's11-lrow';
    logPanel.appendChild(logRow);
    const LGRPS = [
      { lab: 's',        chip: wearChip(EX.sFrom) },
      { lab: 'a',        chip: leverChip(EX.a) },
      { lab: 'r',        chip: '<span class="s11-money is-r">' + (EX.r >= 0 ? '+' : '') + EX.r + '</span>' },
      { lab: 's&prime;', chip: wearChip(EX.sTo) },
      { lab: 'a&prime;', chip: leverChip(EX.aNext) },
    ];
    const logGrps = LGRPS.map((g) => {
      const el = document.createElement('span');
      el.className = 's11-lgrp';
      el.innerHTML = '<span class="s11-llab">' + g.lab + '</span>' + g.chip;
      logRow.appendChild(el);
      return el;
    });

    /* ---- panel 1: the target assembles ---- */
    const targetPanel = mkPanel('s11-targetpanel', 'THE TARGET');
    const tRow = document.createElement('div');
    tRow.className = 's11-trow';
    targetPanel.appendChild(tRow);
    function vchip(cls, lab, val, sub) {
      const c = document.createElement('span');
      c.className = 's11-vchip ' + cls;
      c.innerHTML = '<span class="s11-vlab">' + lab + '</span>' +
        '<span class="s11-vval">' + val + '</span>' +
        (sub ? '<span class="s11-vsub">' + sub + '</span>' : '');
      return c;
    }
    function opTok(html) {
      const o = document.createElement('span');
      o.className = 's11-op';
      o.innerHTML = html;
      return o;
    }
    const targetToks = [
      vchip('is-r', 'r', (EX.r >= 0 ? '+' : '') + EX.r, 'the week\'s money'),
      opTok('+'),
      opTok(f1(GAMMA) + ' &times;'),
      vchip('is-qn', CELL_N, f1(EX.qN), 'her guess, next cell'),
      opTok('='),
      vchip('is-target', 'TARGET', f1(EX.target)),
    ];
    targetToks.forEach((t) => tRow.appendChild(t));

    /* ---- panel 2 + 3: the gap bar and the nudge ---- */
    const gapPanel = mkPanel('s11-gappanel', 'THE GAP: TARGET VS HER GUESS');
    const alphaChip = vchip('is-alpha', '', '0.15', 'step size');
    alphaChip.hidden = true;
    window.Katex.render('\\alpha =', alphaChip.querySelector('.s11-vlab'), false);
    gapPanel.querySelector('.s11-caprow').appendChild(alphaChip);

    const trackBox = document.createElement('div');
    trackBox.className = 's11-trackbox';
    trackBox.innerHTML =
      '<div class="s11-track">' +
        '<span class="s11-fill s11-hatch"></span>' +
        '<span class="s11-fill s11-bite"></span>' +
        '<span class="s11-mark is-ghost" hidden></span>' +
        '<span class="s11-mark is-now"><i class="s11-mlab s11-mlab-below"></i></span>' +
        '<span class="s11-mark is-target"><i class="s11-mlab s11-mlab-above">TARGET ' + f1(EX.target) + '</i></span>' +
        '<span class="s11-tdchip">TD ' + pos(EX.td) + '</span>' +
        '<span class="s11-dlab">' + pos(EX.delta) + '</span>' +
        '<span class="s11-tick s11-tick-0">0</span>' +
        '<span class="s11-tick s11-tick-1">' + BAR_MAX + '</span>' +
      '</div>';
    gapPanel.appendChild(trackBox);
    const track = trackBox.querySelector('.s11-track');
    const hatch = track.querySelector('.s11-hatch');
    const bite = track.querySelector('.s11-bite');
    const ghost = track.querySelector('.is-ghost');
    const markNow = track.querySelector('.is-now');
    const nowLab = markNow.querySelector('.s11-mlab');
    const markTarget = track.querySelector('.is-target');
    const tdChip = track.querySelector('.s11-tdchip');
    const dLab = track.querySelector('.s11-dlab');
    /* static geometry */
    markTarget.style.left = pct(EX.target);
    ghost.style.left = pct(EX.qB);
    bite.style.left = pct(EX.qB);
    tdChip.style.left = pct((EX.qB + EX.target) / 2);
    dLab.style.left = pct(EX.qB + EX.delta / 2);

    /* ---- panel 4: the update rule, colour-matched ---- */
    const rulePanel = mkPanel('s11-rulepanel', 'THE UPDATE RULE');
    const symRow = document.createElement('div');
    symRow.className = 's11-eq s11-eq-sym';
    rulePanel.appendChild(symRow);
    const numRow = document.createElement('div');
    numRow.className = 's11-eq s11-eq-num';
    rulePanel.appendChild(numRow);
    function tok(row, cls, html) {
      const t = document.createElement('span');
      t.className = 's11-tok ' + cls;
      if (html != null) t.innerHTML = html;
      row.appendChild(t);
      return t;
    }
    /* Press Start 2P has no left-arrow or minus-sign glyphs: the arrow is
       KaTeX (like the alpha), the minus is the ASCII hyphen. */
    function arrowTok(row) {
      const t = tok(row, 'tk-op tk-arrow', '');
      t.appendChild(window.Katex.inline('\\leftarrow'));
      return t;
    }
    const symToks = [
      tok(symRow, 'tk-qb', 'q[s,a]'),
      arrowTok(symRow),
      tok(symRow, 'tk-qb', 'q[s,a]'),
      tok(symRow, 'tk-op', '+'),
      tok(symRow, 'tk-alpha', ''),
      tok(symRow, 'tk-op', '('),
      tok(symRow, 'tk-r', 'r'),
      tok(symRow, 'tk-op', '+'),
      tok(symRow, 'tk-op', f1(GAMMA) + ' &times;'),
      tok(symRow, 'tk-qn', 'q[s&prime;,a&prime;]'),
      tok(symRow, 'tk-op', '-'),
      tok(symRow, 'tk-qb', 'q[s,a]'),
      tok(symRow, 'tk-op', ')'),
    ];
    symToks[4].appendChild(window.Katex.inline('\\alpha'));
    tok(numRow, 'tk-qb tk-new', f1(EX.qAfter));
    arrowTok(numRow);
    tok(numRow, 'tk-qb', f1(EX.qB));
    tok(numRow, 'tk-op', '+');
    tok(numRow, 'tk-alpha', EX.alpha.toFixed(2));
    tok(numRow, 'tk-op', '(');
    tok(numRow, 'tk-r', (EX.r >= 0 ? '+' : '') + EX.r);
    tok(numRow, 'tk-op', '+');
    tok(numRow, 'tk-op', f1(GAMMA) + ' &times;');
    tok(numRow, 'tk-qn', f1(EX.qN));
    tok(numRow, 'tk-op', '-');
    tok(numRow, 'tk-qb', f1(EX.qB));
    tok(numRow, 'tk-op', ')');

    /* ---- caption + hint ---- */
    const caption = document.createElement('p');
    caption.className = 's11-caption';
    root.appendChild(caption);

    const hintRow = document.createElement('div');
    hintRow.className = 's11-hintrow';
    hintRow.innerHTML =
      '<span class="s11-counter"></span><span class="s11-hint"></span>';
    root.appendChild(hintRow);
    const counterEl = hintRow.querySelector('.s11-counter');
    const hintEl = hintRow.querySelector('.s11-hint');

    const CAPTIONS = [
      'After every week, the logbook gains one line. That line is all SARSA sees.',
      'What the week said the cell is worth.',
      'The surprise.',
      'Move a little, not all the way.',
      'One line, one cell, no printed odds.',
    ];
    const HINTS = [
      '&#9654; NEXT: price this line',
      '&#9654; NEXT: her current guess',
      '&#9654; NEXT: the nudge',
      '&#9654; NEXT: the whole rule',
      '&#9654; NEXT: let her drive',
    ];

    /* ---------------- step engine ---------------- */
    const panels = [logPanel, targetPanel, gapPanel, rulePanel];
    const SHOW_FROM = [0, 1, 2, 4];    /* panel i visible when cursor >= this */
    const PANEL_STEP = [0, 1, 2, 2, 3]; /* the active panel per step */

    let cursor = hashStep();

    function stag(els, ms, base) {
      els.forEach((el, j) => {
        el.style.animationDelay = ((base || 0) + j * ms) + 'ms';
        el.classList.add('s11-in');
      });
    }

    function applyStep(opts) {
      const o = opts || {};
      const flash = !!o.flash && !instantMode();

      panels.forEach((p, i) => {
        const vis = cursor >= SHOW_FROM[i];
        p.hidden = !vis;
        p.classList.toggle('s11-past', vis && PANEL_STEP[cursor] !== i);
      });

      /* settle every one-shot animation; forward clicks re-arm below */
      root.querySelectorAll('.s11-in').forEach((el) => {
        el.classList.remove('s11-in');
        el.style.animationDelay = '';
      });

      /* gap-bar geometry is a pure function of the step */
      const nudged = cursor >= 3;
      const now = nudged ? EX.qAfter : EX.qB;
      track.classList.toggle('s11-noanim', !flash);
      markNow.style.left = pct(now);
      nowLab.textContent = CELL_B + ' ' + f1(now);
      ghost.hidden = !nudged;
      hatch.style.left = pct(now);
      hatch.style.width = pct(EX.target - now);
      bite.style.width = pct(nudged ? EX.delta : 0);
      dLab.hidden = !nudged;
      alphaChip.hidden = !nudged;

      caption.textContent = CAPTIONS[cursor];
      counterEl.textContent = 'STEP ' + (cursor + 1) + '/' + N_STEPS;
      hintEl.innerHTML = HINTS[cursor];

      if (flash) {
        if (cursor === 0) stag(logGrps, 300);
        else if (cursor === 1) stag(targetToks, 200);
        else if (cursor === 2) { stag([trackBox], 0); stag([tdChip], 0, 550); }
        else if (cursor === 3) { stag([alphaChip], 0); stag([dLab], 0, 650); }
        else if (cursor === 4) {
          stag(symToks, 80);
          stag([numRow], 0, symToks.length * 80 + 250);
        }
      }
    }

    applyStep({ flash: cursor === 0 });

    return {
      onEnter() { applyStep({}); },
      onNextKey() {
        if (cursor < N_STEPS - 1) {
          cursor++;
          applyStep({ flash: true });
          if (window.SFX) window.SFX.play('tick');
          return true;
        }
        return false;   /* on to scene 14: let her drive */
      },
      onPrevKey() {
        if (cursor > 0) {
          cursor--;
          applyStep({});
          return true;
        }
        return false;
      },
    };
  };
})();
