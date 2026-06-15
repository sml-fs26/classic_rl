/* Scene 10: why dynamic programming does not scale.
 *
 *   Two honest caveats on the DP we just ran, side by side:
 *
 *     (a) You rarely know P.  The previous scene only worked because we
 *         wrote the retention coin and engagement die ourselves.  Nobody
 *         hands you the TRUE weights for YOUR customers: how a discount
 *         actually shifts churn is unknown until you try it.
 *
 *     (b) The board explodes.  Ours is 25 cells = 5 tiers x 5 months.  A
 *         real account carries dozens of signals (usage, tickets,
 *         sentiment, seat count, NPS, tenure ...).  Multiply their levels
 *         together and the grid becomes astronomically large: you cannot
 *         enumerate it, let alone sweep it.  The blow-up is COMPUTED live
 *         from a signal list (product of cardinalities), not hand-typed.
 *
 *   Closes on the bridge to SARSA: DP is the ideal we cannot run, so how do
 *   we get a good playbook anyway?  No &run gating (static scene).
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const C  = window.Churn;
  const NT = C.NUM_TIERS;     // 5
  const NM = C.NUM_MONTHS;    // 5
  const BASE = NT * NM;       // 25, our toy board

  /* Realistic extra signals a real account carries, with a modest number of
     buckets each. Conservative on purpose: even coarse bucketing explodes.
     Product of all cardinalities (tiers x months x each signal) is the true
     state count; we reveal it growing one signal at a time. */
  const SIGNALS = [
    { key: 'usage',     levels: 10 },
    { key: 'tickets',   levels: 8  },
    { key: 'sentiment', levels: 5  },
    { key: 'seats',     levels: 20 },
    { key: 'nps',       levels: 11 },
    { key: 'tenure',    levels: 12 },
  ];

  /* Compact "≈ 10^k" formatter for the running product. */
  function bigFmt(n) {
    if (n < 1e5) return n.toLocaleString('en-US');
    const exp = Math.floor(Math.log10(n));
    const mant = n / Math.pow(10, exp);
    return '≈ ' + mant.toFixed(1) + ' × 10^' + exp;
  }
  /* Pure power-of-ten label for the axis ticks. */
  function pow10(n) { return '10^' + Math.round(Math.log10(n)); }

  window.scenes.scene10 = function (root) {
    root.classList.add('scene-pad', 's10-scene');
    root.innerHTML = '';

    /*, Heading + hook, */
    const h = document.createElement('h2');
    h.className = 's10-heading';
    h.textContent = T('s10.heading');
    root.appendChild(h);

    const hook = document.createElement('div');
    hook.className = 's10-hook';
    hook.textContent = T('s10.hook');
    root.appendChild(hook);

    /*, Two-panel grid, */
    const panels = document.createElement('div');
    panels.className = 's10-panels';
    root.appendChild(panels);

    /* ===== Panel (a): P is unknown ===== */
    const pa = document.createElement('div');
    pa.className = 's10-panel s10-panel-a';
    pa.innerHTML =
      '<div class="s10-panel-tag">' + T('s10.a.tag') + '</div>' +
      '<div class="s10-panel-title">' + T('s10.a.title') + '</div>';

    const paFormula = document.createElement('div');
    paFormula.className = 's10-formula poke-formula';
    const paF = document.createElement('div');
    paFormula.appendChild(paF);
    window.Katex.render(
      String.raw`P(s' \mid s, a)\ \ \text{is hidden}`,
      paF, true
    );
    pa.appendChild(paFormula);

    /* The two dice, drawn with question marks: the model we DON'T get. */
    const paDice = document.createElement('div');
    paDice.className = 's10-dice-row';
    paDice.innerHTML =
      '<div class="s10-myst">' +
        '<div class="s10-myst-face">?</div>' +
        '<div class="s10-myst-label">' + T('coin.name') + '</div>' +
      '</div>' +
      '<div class="s10-myst">' +
        '<div class="s10-myst-face">?</div>' +
        '<div class="s10-myst-label">' + T('die.name') + '</div>' +
      '</div>';
    pa.appendChild(paDice);

    const paBody = document.createElement('div');
    paBody.className = 's10-panel-body';
    paBody.innerHTML =
      '<div class="s10-line">' + T('s10.a.b1') + '</div>' +
      '<div class="s10-line">' + T('s10.a.b2') + '</div>';
    pa.appendChild(paBody);
    panels.appendChild(pa);

    /* ===== Panel (b): the board explodes ===== */
    const pb = document.createElement('div');
    pb.className = 's10-panel s10-panel-b';
    pb.innerHTML =
      '<div class="s10-panel-tag">' + T('s10.b.tag') + '</div>' +
      '<div class="s10-panel-title">' + T('s10.b.title') + '</div>';

    /* The running tally: our board, then each added signal, with the product
       to its right. */
    const tally = document.createElement('div');
    tally.className = 's10-tally';

    let running = BASE;
    /* Row 0: the toy board itself. */
    function tallyRow(labelHtml, levelsHtml, total, cls) {
      const r = document.createElement('div');
      r.className = 's10-tally-row' + (cls ? ' ' + cls : '');
      r.innerHTML =
        '<span class="s10-tally-label">' + labelHtml + '</span>' +
        '<span class="s10-tally-mult">' + levelsHtml + '</span>' +
        '<span class="s10-tally-total">' + total + '</span>';
      return r;
    }
    tally.appendChild(tallyRow(
      T('s10.b.board'),
      NT + ' × ' + NM,
      bigFmt(running),
      's10-tally-base'
    ));
    for (const sig of SIGNALS) {
      running *= sig.levels;
      tally.appendChild(tallyRow(
        '+ ' + T('s10.signal.' + sig.key),
        '× ' + sig.levels,
        bigFmt(running),
        ''
      ));
    }
    pb.appendChild(tally);

    /* A scale bar comparing 25 vs the blow-up on a log axis. */
    const scale = document.createElement('div');
    scale.className = 's10-scale';
    const finalExp = Math.round(Math.log10(running));
    scale.innerHTML =
      '<div class="s10-scale-row">' +
        '<span class="s10-scale-cap">' + T('s10.b.ours') + '</span>' +
        '<span class="s10-scale-track"><span class="s10-scale-fill s10-fill-small" style="width:4%"></span></span>' +
        '<span class="s10-scale-num">' + BASE + '</span>' +
      '</div>' +
      '<div class="s10-scale-row">' +
        '<span class="s10-scale-cap">' + T('s10.b.real') + '</span>' +
        '<span class="s10-scale-track"><span class="s10-scale-fill s10-fill-big" style="width:100%"></span></span>' +
        '<span class="s10-scale-num">' + pow10(running) + '</span>' +
      '</div>';
    pb.appendChild(scale);

    const pbBody = document.createElement('div');
    pbBody.className = 's10-panel-body';
    pbBody.innerHTML =
      '<div class="s10-line">' + T('s10.b.b1', { exp: finalExp }) + '</div>';
    pb.appendChild(pbBody);
    panels.appendChild(pb);

    /*, Bridge to SARSA, */
    const bridge = document.createElement('div');
    bridge.className = 's10-bridge poke-box tight';
    bridge.innerHTML = T('s10.bridge') + '<span class="triangle"></span>';
    root.appendChild(bridge);

    return {};
  };
})();
