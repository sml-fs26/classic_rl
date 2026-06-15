/* Scene 10 - why dynamic programming does not scale.
 *
 *   Manager meaning: the exact sweep in scene 9 needed two gifts - a KNOWN
 *   die and a KNOWN (pinned) rival - and even with both, the real problem is
 *   far too big to compute cell by cell. DP is the ideal, not the method.
 *
 *   Two-panel card:
 *     A) You rarely know P, INCLUDING the rival. We only assumed "holds at
 *        20"; a real opponent / market / competitor never hands you their
 *        rule. P(s' | s, a) is hidden.
 *     B) The board explodes. We drew 18 cells (pot bucket x standing). The
 *        true game tracks exact scores (0..TARGET-1 each) x exact pot ->
 *        tens of thousands of states, and far more with extra players.
 *
 *   Every count is derived from the engine constants (TARGET / POT_BUCKETS /
 *   STANDINGS), never hand-typed. Closes on the bridge to SARSA. Static
 *   scene: cold entry just rebuilds.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  function commas(n) {
    /* Group thousands with the en-US separator regardless of locale so the
       figure reads the same under both languages (the digits are the point). */
    try { return Number(n).toLocaleString('en-US'); }
    catch (e) { return String(n); }
  }

  window.scenes.scene10 = function (root) {
    root.className = 'scene-pad s10-scene';
    root.innerHTML = '';

    const P = window.Pig || {};
    const DATA = window.DATA || {};
    const target = (DATA.target != null ? DATA.target : (P.TARGET || 50));
    const nb = (DATA.potBuckets != null ? DATA.potBuckets : (P.POT_BUCKETS || 6));
    const ns = (DATA.standings != null ? DATA.standings : (P.STANDINGS || 3));
    const rivalHold = (DATA.rivalHold != null ? DATA.rivalHold : (P.RIVAL_HOLD || 20));

    const display = nb * ns;                          // 18 cells we drew
    const maxScore = target - 1;                      // exact scores 0..target-1
    const scores = target;                            // count of score values
    const pots = target;                              // exact pot 0..target-1
    const exact2 = scores * scores * pots;            // true 2-player size
    const exact4 = Math.pow(scores, 4) * pots;        // 4-player race
    const factor = Math.round(exact2 / display);      // blow-up vs the board

    /*, Heading + manager framing, */
    const h = document.createElement('h2');
    h.className = 's10-heading';
    h.textContent = T('s10.heading');
    root.appendChild(h);

    const mgr = document.createElement('div');
    mgr.className = 's10-manager';
    mgr.textContent = T('s10.manager');
    root.appendChild(mgr);

    /*, Two reason panels, */
    const panels = document.createElement('div');
    panels.className = 's10-panels';
    root.appendChild(panels);

    /*, Reason A: P unknown, including the rival, */
    const a = document.createElement('div');
    a.className = 's10-panel s10-panel-a';
    a.innerHTML =
      '<div class="s10-tag">' + T('s10.a.tag') + '</div>' +
      '<div class="s10-panel-title">' + T('s10.a.title') + '</div>';
    const aFormCard = document.createElement('div');
    aFormCard.className = 's10-formula-card';
    aFormCard.innerHTML = '<div class="s10-formula-label">' + T('s10.a.formula.label') + '</div>';
    const aF = document.createElement('div');
    aF.className = 's10-formula';
    aFormCard.appendChild(aF);
    window.Katex.render(
      "P(s' \\mid s, a)\\ \\ \\text{is hidden}",
      aF, true
    );
    a.appendChild(aFormCard);

    /* The pinned-rival motif: the rule we ASSUMED, struck through to a "?". */
    const rivalMotif = document.createElement('div');
    rivalMotif.className = 's10-rival-motif';
    rivalMotif.innerHTML =
      '<span class="s10-rival-assumed">' +
        T('vocab.rival') + ': ' + T('vocab.hold') + ' @ ' + rivalHold +
      '</span>' +
      '<span class="s10-rival-arrow">&rarr;</span>' +
      '<span class="s10-rival-unknown">?</span>';
    a.appendChild(rivalMotif);

    const aBody = document.createElement('div');
    aBody.className = 's10-panel-body';
    aBody.textContent = T('s10.a.body', { hold: rivalHold });
    a.appendChild(aBody);
    const aFoot = document.createElement('div');
    aFoot.className = 's10-panel-foot';
    aFoot.textContent = T('s10.a.foot');
    a.appendChild(aFoot);
    panels.appendChild(a);

    /*, Reason B: the board explodes, */
    const b = document.createElement('div');
    b.className = 's10-panel s10-panel-b';
    b.innerHTML =
      '<div class="s10-tag">' + T('s10.b.tag') + '</div>' +
      '<div class="s10-panel-title">' + T('s10.b.title') + '</div>' +
      '<div class="s10-panel-body">' +
        T('s10.b.body', { nb: nb, ns: ns, display: display, maxscore: maxScore }) +
      '</div>';

    const grid = document.createElement('div');
    grid.className = 's10-stat-grid';
    grid.innerHTML =
      '<div class="s10-stat s10-stat-drew">' +
        '<div class="s10-stat-title">' + T('s10.b.stat.display.title') + '</div>' +
        '<div class="s10-stat-value">' + T('s10.b.stat.display.value', { display: display }) + '</div>' +
        '<div class="s10-stat-detail">' + T('s10.b.stat.display.detail') + '</div>' +
      '</div>' +
      '<div class="s10-stat-arrow">&raquo;</div>' +
      '<div class="s10-stat s10-stat-exact">' +
        '<div class="s10-stat-title">' + T('s10.b.stat.exact.title') + '</div>' +
        '<div class="s10-stat-value">' + T('s10.b.stat.exact.value', { exact: commas(exact2) }) + '</div>' +
        '<div class="s10-stat-detail">' +
          T('s10.b.stat.exact.detail', { maxscore: maxScore, factor: commas(factor) }) +
        '</div>' +
      '</div>' +
      '<div class="s10-stat-arrow">&raquo;</div>' +
      '<div class="s10-stat s10-stat-four">' +
        '<div class="s10-stat-title">' + T('s10.b.stat.four.title') + '</div>' +
        '<div class="s10-stat-value">' + T('s10.b.stat.four.value', { four: commas(exact4) }) + '</div>' +
        '<div class="s10-stat-detail">' + T('s10.b.stat.four.detail') + '</div>' +
      '</div>';
    b.appendChild(grid);
    panels.appendChild(b);

    /*, Bridge to SARSA, */
    const bridge = document.createElement('div');
    bridge.className = 's10-bridge';
    bridge.textContent = T('s10.bridge');
    root.appendChild(bridge);

    return {};
  };
})();
