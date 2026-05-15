/* Scene — Return and the optimal action-value Q*.
 *
 *   Three pieces, stacked:
 *
 *     1. G formula card — undiscounted sum of rewards from time i to
 *        the end of the trajectory.
 *     2. A concrete 4-turn winning trajectory with the same (s, a, r)
 *        boxes as the trajectory scene, but with STATE and ACTION boxes
 *        muted (greyed) so the eye only catches the REWARD boxes — the
 *        ones that actually feed G. Below the rollout, the G_t
 *        expansion shows each r_j colour-coded back to its origin.
 *     3. Q formula card (defines Q in terms of G).
 *
 *   Click any reward box in the rollout to recompute the expansion for
 *   that t. Default t = 1.
 */
(function () {
  window.scenes = window.scenes || {};

  /* ---- Fixed illustrative trajectory ----
     Pikachu uses Thunderbolt every turn and wins on the 4th turn.
     With undiscounted return: G_1 = +7, G_2 = +8, G_3 = +9, G_4 = +10. */
  const TRAJ = [
    { your: 0, opp: 0, action: 'thunderbolt', reward: -1, terminal: false },
    { your: 0, opp: 1, action: 'thunderbolt', reward: -1, terminal: false },
    { your: 1, opp: 2, action: 'thunderbolt', reward: -1, terminal: false },
    { your: 1, opp: 3, action: 'thunderbolt', reward: 10, terminal: true, won: true },
  ];

  const NB = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;

  function bucketName(b) { return b >= NB ? 'FAINT' : BUCKETS[b].toUpperCase(); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function moveName(id) { return window.Moves.MOVE_BY_ID[id].name; }
  function fmtSigned(v, dp) {
    const d = dp === undefined ? 2 : dp;
    return (v >= 0 ? '+' : '') + v.toFixed(d);
  }

  /* Render one turn's three boxes into the rollout.  States and actions
     are .muted (greyed out) since G_t only sums over rewards. Reward
     boxes are clickable; clicking sets the t for the G_t expansion. */
  function renderTurn(host, step, turn, isTerminal, isSelected, onSelect) {
    const group = document.createElement('div');
    group.className = 'traj-group';

    const sBox = document.createElement('div');
    sBox.className = 'traj-box traj-box-state muted';
    sBox.innerHTML =
      '<div class="traj-box-label">s<sub>' + step + '</sub></div>' +
      '<div class="traj-box-state-body">' +
        '<div class="traj-box-side">' +
          '<img class="traj-box-sprite" src="assets/pikachu-back.png" alt="">' +
          '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(turn.your) + '" style="width:' + bucketPct(turn.your) + '%"></div></div>' +
          '<div class="traj-box-bucket">' + bucketName(turn.your) + '</div>' +
        '</div>' +
        '<div class="traj-box-side">' +
          '<img class="traj-box-sprite" src="' + window.Battle.spriteForOpp(turn.opp) + '" alt="' + window.Battle.displayNameForOpp(turn.opp) + '">' +
          '<div class="traj-box-hp"><div class="traj-box-hp-fill ' + bucketClass(turn.opp) + '" style="width:' + bucketPct(turn.opp) + '%"></div></div>' +
          '<div class="traj-box-bucket">' + bucketName(turn.opp) + '</div>' +
        '</div>' +
      '</div>';
    group.appendChild(sBox);

    const aBox = document.createElement('div');
    aBox.className = 'traj-box traj-box-action muted';
    aBox.innerHTML =
      '<div class="traj-box-label">a<sub>' + step + '</sub></div>' +
      '<div class="traj-box-action-body">' + moveName(turn.action) + '</div>';
    group.appendChild(aBox);

    const rBox = document.createElement('div');
    rBox.className = 'traj-box traj-box-reward clickable';
    if (isTerminal) rBox.classList.add(turn.won ? 'win' : 'loss');
    if (isSelected) rBox.classList.add('selected');
    const sign = turn.reward >= 0 ? '+' : '';
    let inner =
      '<div class="traj-box-label">r<sub>' + step + '</sub></div>' +
      '<div class="traj-box-reward-body">' + sign + turn.reward + '</div>';
    if (isTerminal) {
      inner += '<div class="traj-box-terminal-tag">' + (turn.won ? '✓ WIN' : '✗ LOSS') + '</div>';
    }
    rBox.innerHTML = inner;
    rBox.addEventListener('click', () => onSelect(step - 1));
    group.appendChild(rBox);

    host.appendChild(group);
  }

  /* Build the G_t expansion HTML for the given starting index (0-based).
     Undiscounted: G_t = sum of r_j from j=t to the end. */
  function renderExpansion(host, startIdx) {
    const t = startIdx + 1;
    const horizon = TRAJ.length;     // 4
    const symLine = []; const numLine = [];
    let sum = 0;
    for (let j = startIdx; j < horizon; j++) {
      const r = TRAJ[j].reward;
      sum += r;
      const rSpan = '<span class="g-r">r<sub>' + (j + 1) + '</sub></span>';
      symLine.push(rSpan);
      const rStr = (r >= 0 ? '+' : '−') + Math.abs(r);
      numLine.push('<span class="g-r">(' + rStr + ')</span>');
    }
    const resultClass = sum >= 0 ? 'pos' : 'neg';
    host.innerHTML =
      '<div class="g-line">' +
        '<span class="g-lhs">G<sub>' + t + '</sub>(τ)</span>' +
        ' = ' + symLine.join(' + ') +
      '</div>' +
      '<div class="g-line g-numbers">' +
        '<span class="g-eq">=</span> ' + numLine.join(' + ') +
      '</div>' +
      '<div class="g-line g-final">' +
        '<span class="g-eq">=</span> <span class="g-result ' + resultClass + '">' + fmtSigned(sum, 0) + '</span>' +
      '</div>';
  }

  window.scenes.sceneObjective = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'THE OPTIMAL DAMAGE';
    root.appendChild(heading);

    /* ---- G formula card ---- */
    const c1 = document.createElement('div');
    c1.className = 'concept-formula-card';
    c1.innerHTML = '<div class="concept-formula-label">RETURN FROM TIME i</div>';
    const f1 = document.createElement('div');
    c1.appendChild(f1);
    window.Katex.render(
      String.raw`G_i(\tau) \;=\; \sum_{j \ge i}\, r_j`,
      f1, true
    );
    const foot1 = document.createElement('div');
    foot1.className = 'concept-formula-foot';
    foot1.textContent = 'Sum of rewards from step i until the trajectory τ ends. ' +
      'The return depends on which trajectory you played — different rolls of the dice, different G.';
    c1.appendChild(foot1);
    root.appendChild(c1);

    /* ---- Concrete G illustration ---- */
    const illus = document.createElement('div');
    illus.className = 'g-illus';
    illus.innerHTML =
      '<div class="g-illus-label">ONE TRAJECTORY τ · click any <span class="g-r">r<sub>t</sub></span>' +
      ' to recompute G<sub>t</sub>(τ)</div>';
    const rollout = document.createElement('div');
    rollout.className = 'traj-rollout g-illus-rollout';
    illus.appendChild(rollout);
    const expansion = document.createElement('div');
    expansion.className = 'g-expansion';
    illus.appendChild(expansion);
    root.appendChild(illus);

    let selectedIdx = 0;

    function rerender() {
      rollout.innerHTML = '';
      for (let i = 0; i < TRAJ.length; i++) {
        renderTurn(rollout, i + 1, TRAJ[i], TRAJ[i].terminal, i === selectedIdx, (newIdx) => {
          selectedIdx = newIdx;
          rerender();
        });
      }
      renderExpansion(expansion, selectedIdx);
    }
    rerender();

    /* ---- Q* formula card ---- */
    const c2 = document.createElement('div');
    c2.className = 'concept-formula-card';
    c2.innerHTML = '<div class="concept-formula-label">OPTIMAL ACTION-VALUE FUNCTION Q*</div>';
    const f2 = document.createElement('div');
    c2.appendChild(f2);
    window.Katex.render(
      String.raw`Q^{\star}(s, a) \;=\; \max_{\pi}\; \mathbb{E}_{\tau \sim \pi}\!\left[\, G_i(\tau) \;\middle|\; s_i = s,\; a_i = a \,\right]`,
      f2, true
    );
    const foot2 = document.createElement('div');
    foot2.className = 'concept-formula-foot';
    foot2.textContent =
      'The expected return when you take action a in state s and then play optimally thereafter. ' +
      'This is what the agent ultimately wants to know — once you have Q*, optimal play is just argmax_a Q*(s, a).';
    c2.appendChild(foot2);
    root.appendChild(c2);

    return {};
  };
})();
