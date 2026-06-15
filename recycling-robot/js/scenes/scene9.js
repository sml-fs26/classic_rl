/* Scene 9 -- Dynamic programming / fill Q*.
 *   Because the drain probabilities are known, we compute Q* exactly by sweeping
 *   the Bellman backup. The single-column Q-table fills bottom-up IN TIME: start
 *   at the LAST step of the shift (k=1: pure one-step payoffs, where the safe +1
 *   WAIT wins at low/mid), then back up one step at a time, reusing the answers
 *   just locked in. After 2 sweeps the policy stabilises: green SEARCH at the
 *   top, blue RECHARGE at the bottom. STEP advances a layer; a scrubber jumps. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const R = window.Robot;
  const frames = window.DATA.dp.frames;        // [{stepsRemaining, isLastStep, V, Q, policy}]
  const NF = frames.length;                      // 8

  window.scenes.scene9 = function (root) {
    root.className = 'scene scene-pad sc9';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene9.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene9.lede') + '</p>' +
      '<div class="sc9-grid">' +
        '<div class="sc9-board-host"></div>' +
        '<div class="sc9-side">' +
          '<div class="poke-box sc9-narr"></div>' +
          '<div class="sc9-scrub">' +
            '<div class="sc9-scrub-label"><span class="sc9-k">--</span></div>' +
            '<input type="range" class="sc9-range" min="1" max="' + NF + '" value="1" step="1" aria-label="steps remaining">' +
            '<div class="rr-btn-row">' +
              '<button class="rr-btn sc9-back" type="button">&lsaquo; BACK</button>' +
              '<button class="rr-btn primary sc9-step" type="button">' + T('scene9.step') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="footnote">' + T('scene9.hint') + '</p>';

    const board = window.Gauge.mount(root.querySelector('.sc9-board-host'), { variant: 'qtable', showValues: true });
    const narr = root.querySelector('.sc9-narr');
    const range = root.querySelector('.sc9-range');
    const kLabel = root.querySelector('.sc9-k');

    let cur = 1;   // steps-remaining layer 1..NF
    function paint(k) {
      cur = Math.max(1, Math.min(NF, k));
      const f = frames[cur - 1];
      const Q = Float64Array.from(f.Q, x => (x == null ? NaN : x));
      board.update(Q, { suppressFlash: cur === 1 });
      range.value = String(cur);
      kLabel.textContent = T('scene9.klabel', { k: cur });
      if (cur === 1) narr.innerHTML = T('scene9.narr.last');
      else if (cur === 2) narr.innerHTML = T('scene9.narr.second');
      else if (cur >= NF) narr.innerHTML = T('scene9.narr.full');
      else narr.innerHTML = T('scene9.narr.mid', { k: cur });
    }

    root.querySelector('.sc9-step').addEventListener('click', () => { paint(cur >= NF ? 1 : cur + 1); });
    root.querySelector('.sc9-back').addEventListener('click', () => { paint(cur - 1); });
    range.addEventListener('input', () => paint(parseInt(range.value, 10)));

    paint(1);
    if (window.RR && window.RR.run) {
      let k = 1; const tick = () => { paint(k); if (k < NF) { k++; setTimeout(tick, 650); } };
      setTimeout(tick, 300);
    }

    return {
      onNextKey() { if (cur < NF) { paint(cur + 1); return true; } return false; },
      onPrevKey() { if (cur > 1) { paint(cur - 1); return true; } return false; },
    };
  };
})();
