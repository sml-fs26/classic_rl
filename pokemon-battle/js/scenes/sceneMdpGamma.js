/* Scene — γ, the discount factor.
 *
 *   Fifth and final piece of the MDP. γ ∈ [0, 1] is a knob on how much
 *   the agent cares about future rewards relative to immediate ones.
 *   This scene drops a fixed 5-turn trajectory in front of the student
 *   and a slider that lets them sweep γ; below, each turn's contribution
 *   γᵗ·rₜ is drawn as a stacked bar, and the running return G = Σ γᵗ·rₜ
 *   recomputes live.
 *
 *   Three landmark γ values are worth scrubbing through:
 *     γ = 0      → only r₀ counts; agent is myopic.
 *     γ = 0.5    → r₄ is worth ~6% of r₀; near-future heavy.
 *     γ = 0.9    → r₄ is worth 66%; the default we use throughout.
 *     γ → 1      → equal weighting; long-horizon planning.
 *
 *   The reveal: γ doesn't change the world (P, R are fixed). It changes
 *   what the agent is *willing to wait for*.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;

  function bucketName(b) { return BUCKETS[b].toUpperCase(); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function fmtSigned(v, dp) {
    const d = dp === undefined ? 2 : dp;
    return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
  }

  /* Fixed 5-turn winning trajectory. The mid-turn evolution is in the
     story so students see Charmeleon → Charizard ticks in the thumbnails. */
  const TRAJ = [
    { your: 0, opp: 0, r: -1, term: false },   /* t=0: FULL / FULL, Charmander */
    { your: 0, opp: 1, r: -1, term: false },   /* t=1: FULL / HIGH, Charmander */
    { your: 1, opp: 2, r: -1, term: false },   /* t=2: HIGH / MID, Charmeleon  */
    { your: 1, opp: 3, r: -1, term: false },   /* t=3: HIGH / LOW, Charizard   */
    { your: 2, opp: 5, r: +10, term: true, won: true },  /* t=4: WIN */
  ];

  window.scenes.sceneMdpGamma = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'γ — THE DISCOUNT FACTOR';
    root.appendChild(heading);

    /* ---- Formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">RETURN UNDER DISCOUNT γ</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`G \;=\; \sum_{t \,\ge\, 0} \gamma^{t}\, r_{t}, \qquad \gamma \in [0, 1]`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'γ = 0 → myopic. γ = 1 → equal weight on every future reward. We use γ = 0.90.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- Slider + readout ---- */
    const sliderBox = document.createElement('div');
    sliderBox.className = 'mdp-gm-slider-box';
    sliderBox.innerHTML =
      '<div class="mdp-gm-slider-label">γ = <span class="mdp-gm-gv">0.90</span></div>' +
      '<input type="range" min="0" max="100" value="90" class="mdp-gm-slider">' +
      '<div class="mdp-gm-slider-ticks">' +
        '<span>0</span><span>0.25</span><span>0.5</span><span>0.75</span><span>1</span>' +
      '</div>';
    root.appendChild(sliderBox);
    const slider = sliderBox.querySelector('.mdp-gm-slider');
    const gvLabel = sliderBox.querySelector('.mdp-gm-gv');

    /* ---- Trajectory rollout (mini-thumbnails) ---- */
    const rollWrap = document.createElement('div');
    rollWrap.className = 'mdp-gm-rollout';
    root.appendChild(rollWrap);

    function renderRollout() {
      let html = '';
      for (let i = 0; i < TRAJ.length; i++) {
        const t = TRAJ[i];
        const isW = t.term && t.won;
        const isL = t.term && !t.won;
        const state = (function () {
          if (t.term) {
            return '<div class="mdp-gm-step-state ' + (isW ? 'win' : 'loss') + '">' + (isW ? '✓ WIN' : '✗ LOSS') + '</div>';
          }
          const oppSrc = window.Battle.spriteForOpp(t.opp, 'gen1');
          return '<div class="mdp-gm-step-state">' +
                   '<div class="mdp-gm-mini">' +
                     '<img class="mdp-gm-sprite" src="assets/pikachu-back-gen1.png" alt="">' +
                     '<div class="mdp-gm-hp"><div class="mdp-gm-hp-fill ' + bucketClass(t.your) + '" style="width:' + bucketPct(t.your) + '%"></div></div>' +
                   '</div>' +
                   '<div class="mdp-gm-mini">' +
                     '<img class="mdp-gm-sprite" src="' + oppSrc + '" alt="">' +
                     '<div class="mdp-gm-hp"><div class="mdp-gm-hp-fill ' + bucketClass(t.opp) + '" style="width:' + bucketPct(t.opp) + '%"></div></div>' +
                   '</div>' +
                 '</div>';
        })();
        const rClass = t.r > 0 ? 'pos' : 'neg';
        html +=
          '<div class="mdp-gm-step">' +
            '<div class="mdp-gm-step-t">t = ' + i + '</div>' +
            state +
            '<div class="mdp-gm-step-r ' + rClass + '">r<sub>' + i + '</sub> = ' + fmtSigned(t.r, 0) + '</div>' +
          '</div>';
      }
      rollWrap.innerHTML = html;
    }
    renderRollout();

    /* ---- Contribution bars: γᵗ·rₜ per step, signed ---- */
    const contribTitle = document.createElement('div');
    contribTitle.className = 'mdp-gm-contrib-title';
    contribTitle.textContent = 'CONTRIBUTION OF EACH STEP: γᵗ · rₜ';
    root.appendChild(contribTitle);

    const contribHost = document.createElement('div');
    contribHost.className = 'mdp-gm-contrib-host';
    root.appendChild(contribHost);

    const sumHost = document.createElement('div');
    sumHost.className = 'mdp-gm-sum';
    root.appendChild(sumHost);

    function update() {
      const g = Number(slider.value) / 100;
      gvLabel.textContent = g.toFixed(2);

      /* The max magnitude across steps is what we use to scale bar widths
         so the +10 win doesn't dwarf the −1 turn-tax bars. Use the
         largest absolute contribution at this γ. */
      const contribs = TRAJ.map((t, i) => Math.pow(g, i) * t.r);
      const maxAbs = Math.max(0.001, ...contribs.map(c => Math.abs(c)));

      let html = '';
      let sum = 0;
      for (let i = 0; i < TRAJ.length; i++) {
        const c = contribs[i];
        sum += c;
        const w = Math.abs(c) / maxAbs * 50;          /* 50% of bar width per side */
        const isPos = c >= 0;
        const gPow = Math.pow(g, i);
        const r = TRAJ[i].r;
        html +=
          '<div class="mdp-gm-contrib-row">' +
            '<div class="mdp-gm-contrib-label">t = ' + i + ' · γ<sup>' + i + '</sup>·r<sub>' + i + '</sub> = ' +
              '<span class="g-gamma">' + (i === 0 ? '1' : gPow.toFixed(3)) + '</span> · ' +
              '<span class="g-r">(' + fmtSigned(r, 0) + ')</span></div>' +
            '<div class="mdp-gm-contrib-bar">' +
              '<div class="mdp-gm-contrib-neg" style="width:' + (isPos ? 0 : w) + '%"></div>' +
              '<div class="mdp-gm-contrib-axis"></div>' +
              '<div class="mdp-gm-contrib-pos" style="width:' + (isPos ? w : 0) + '%"></div>' +
            '</div>' +
            '<div class="mdp-gm-contrib-val ' + (isPos ? 'pos' : 'neg') + '">' + fmtSigned(c, 2) + '</div>' +
          '</div>';
      }
      contribHost.innerHTML = html;
      sumHost.innerHTML =
        '<span>G = Σ γ<sup>t</sup>·r<sub>t</sub> = <strong class="' + (sum >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(sum, 2) + '</strong></span>';
    }

    slider.addEventListener('input', update);
    update();

    /* ---- Closing caption ---- */
    const cap = document.createElement('div');
    cap.className = 'concept-key-question';
    cap.textContent = 'γ DOESN\'T CHANGE THE WORLD. IT CHANGES WHAT THE AGENT WAITS FOR.';
    root.appendChild(cap);

    return {};
  };
})();
