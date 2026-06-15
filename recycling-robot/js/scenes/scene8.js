/* Scene 8 -- Bellman optimality equation.
 *   Q*(s,a) = E[ R + max_a' Q*(S', a') ]: the value of a lever now = what it
 *   pays this step, plus the value of whatever rung it leaves you in next,
 *   assuming you again pull the best lever there. A worked one-step backup on
 *   `low` makes the stranding shadow concrete: SEARCH from low collects +2,
 *   then both drain outcomes land on empty for -10, so Q = -8. NEXT reveals the
 *   backup line by line. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  window.scenes.scene8 = function (root) {
    root.className = 'scene scene-pad sc8 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene8.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene8.lede') + '</p>' +
      '<div class="formula-card sc8-main"><div class="formula-label">' + T('scene8.flabel') + '</div><div class="sc8-tex"></div>' +
        '<div class="formula-note">' + T('scene8.plain') + '</div></div>' +
      '<div class="sc8-work card">' +
        '<div class="sc8-work-title">' + T('scene8.work.title') + '</div>' +
        '<div class="sc8-work-icon-host"></div>' +
        '<div class="sc8-steps">' +
          '<div class="sc8-step" data-i="0" hidden><span class="sc8-step-n">1</span><span class="sc8-step-t">' + T('scene8.work.s1') + '</span></div>' +
          '<div class="sc8-step" data-i="1" hidden><span class="sc8-step-n">2</span><span class="sc8-step-t">' + T('scene8.work.s2') + '</span></div>' +
          '<div class="sc8-step" data-i="2" hidden><span class="sc8-step-n">3</span><span class="sc8-step-t">' + T('scene8.work.s3') + '</span></div>' +
          '<div class="sc8-step sc8-result" data-i="3" hidden><div class="sc8-result-tex"></div></div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene8.hint') + '</p>';

    window.Katex.render(window.DATA.tex.bellman, root.querySelector('.sc8-tex'), true);
    window.Katex.render(window.DATA.tex.bellmanLow, root.querySelector('.sc8-result-tex'), true);
    const gauge = window.Gauge.mount(root.querySelector('.sc8-work-icon-host'), { variant: 'icon', level: window.Robot.LOW });

    const steps = Array.from(root.querySelectorAll('.sc8-step'));
    let shown = 0;
    function revealNext() {
      if (shown >= steps.length) return false;
      steps[shown].hidden = false;
      steps[shown].classList.add('sc8-pop');
      if (shown === steps.length - 1) { gauge.drainTo(0, { spark: true }); if (window.SFX) window.SFX.play('strand'); }
      shown++;
      if (window.SFX && shown < steps.length) window.SFX.play('cursor');
      return true;
    }
    function hideLast() { if (shown <= 0) return false; shown--; steps[shown].hidden = true; if (shown === 0) gauge.setLevel(window.Robot.LOW); return true; }

    revealNext();
    if (window.RR && window.RR.run) { revealNext(); revealNext(); revealNext(); }

    return { onNextKey() { return revealNext(); }, onPrevKey() { return hideLast(); } };
  };
})();
