/* Scene — R, the reward signal.
 *
 *   Fourth piece of the MDP. The reward design has three rows: +10 for
 *   winning, −10 for fainting, −1 for every non-terminal turn. The −1
 *   per turn is a *patience tax* — it forces the agent to prefer fast
 *   wins over slow ones, but only as long as the win still happens.
 *
 *   The right pedagogical move here is the side-by-side: same outcome
 *   (a win), different lengths, different undiscounted returns. Reading
 *   the two columns is enough to grasp that the reward design has
 *   already encoded the planning trade-off — without needing to invoke γ
 *   yet (that's the next scene).
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
  function fmtSigned(v) { return (v >= 0 ? '+' : '−') + Math.abs(v); }

  /* Two illustrative trajectories. Both win. The "fast" one one-shots the
     opponent in 3 turns; the "slow" one grinds it out over 7. Same
     outcome, different sums. */
  const FAST = [
    { your: 0, opp: 0, r: -1, term: false },
    { your: 0, opp: 1, r: -1, term: false },
    { your: 1, opp: 3, r: +10, term: true, won: true },
  ];
  const SLOW = [
    { your: 0, opp: 0, r: -1, term: false },
    { your: 0, opp: 1, r: -1, term: false },
    { your: 0, opp: 1, r: -1, term: false },    /* THUNDER missed */
    { your: 1, opp: 2, r: -1, term: false },
    { your: 1, opp: 2, r: -1, term: false },    /* THUNDER missed */
    { your: 2, opp: 3, r: -1, term: false },
    { your: 3, opp: 4, r: -1, term: false },
    { your: 3, opp: 5, r: +10, term: true, won: true },
  ];

  function renderRolloutRow(host, traj) {
    let sum = 0;
    let html = '<div class="mdp-rw-rollout-row">';
    for (let i = 0; i < traj.length; i++) {
      const t = traj[i];
      sum += t.r;
      const isW = t.term && t.won;
      const isL = t.term && !t.won;
      const sBoxState = (function () {
        if (t.term) {
          return '<div class="mdp-rw-step-state ' + (isW ? 'win' : 'loss') + '">' + (isW ? '✓ WIN' : '✗ LOSS') + '</div>';
        }
        const oppSrc = window.Battle.spriteForOpp(t.opp, 'gen1');
        return '<div class="mdp-rw-step-state">' +
                 '<div class="mdp-rw-step-mini">' +
                   '<img class="mdp-rw-step-sprite" src="assets/pikachu-back-gen1.png" alt="">' +
                   '<div class="mdp-rw-step-hp"><div class="mdp-rw-step-hp-fill ' + bucketClass(t.your) + '" style="width:' + bucketPct(t.your) + '%"></div></div>' +
                 '</div>' +
                 '<div class="mdp-rw-step-mini">' +
                   '<img class="mdp-rw-step-sprite" src="' + oppSrc + '" alt="">' +
                   '<div class="mdp-rw-step-hp"><div class="mdp-rw-step-hp-fill ' + bucketClass(t.opp) + '" style="width:' + bucketPct(t.opp) + '%"></div></div>' +
                 '</div>' +
               '</div>';
      })();
      const rClass = t.r > 0 ? 'pos' : (t.r < 0 ? 'neg' : '');
      const rBox =
        '<div class="mdp-rw-step-r ' + rClass + (t.term ? ' terminal' : '') + '">' +
          '<div class="mdp-rw-step-r-label">r<sub>' + (i + 1) + '</sub></div>' +
          '<div class="mdp-rw-step-r-val">' + fmtSigned(t.r) + '</div>' +
        '</div>';
      html += '<div class="mdp-rw-step">' + sBoxState + rBox + '</div>';
      if (i < traj.length - 1) html += '<div class="mdp-rw-step-arrow">→</div>';
    }
    html += '</div>';
    host.innerHTML = html;
    return sum;
  }

  window.scenes.sceneMdpRewards = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'R — THE REWARD SIGNAL';
    root.appendChild(heading);

    /* ---- Formula card: the three-row reward table ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">REWARD PER TRANSITION</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`R(s, a, s') \;=\;
        \begin{cases}
          +10 & \text{opp faints (we win)} \\
          -10 & \text{Pikachu faints (we lose)} \\
          -1  & \text{otherwise (turn tax)}
        \end{cases}`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'The agent\'s goal is to maximise the SUM of rewards. The −1 per turn forces fast wins over slow ones.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- Side-by-side: same outcome, different lengths ---- */
    const compareWrap = document.createElement('div');
    compareWrap.className = 'mdp-rw-compare';
    root.appendChild(compareWrap);

    function buildPanel(title, traj, captionHtml) {
      const panel = document.createElement('div');
      panel.className = 'mdp-rw-panel';

      const titleEl = document.createElement('div');
      titleEl.className = 'mdp-rw-panel-title';
      titleEl.textContent = title;
      panel.appendChild(titleEl);

      const rollHost = document.createElement('div');
      panel.appendChild(rollHost);
      const sum = renderRolloutRow(rollHost, traj);

      const sumEl = document.createElement('div');
      sumEl.className = 'mdp-rw-sum ' + (sum >= 0 ? 'pos' : 'neg');
      sumEl.innerHTML = 'Σ r<sub>t</sub> = <strong>' + fmtSigned(sum) + '</strong>';
      panel.appendChild(sumEl);

      const capEl = document.createElement('div');
      capEl.className = 'mdp-rw-caption';
      capEl.innerHTML = captionHtml;
      panel.appendChild(capEl);

      return panel;
    }

    compareWrap.appendChild(buildPanel(
      'FAST WIN — 3 turns',
      FAST,
      '2 turns of patience tax (−2) + the winning turn (+10) = <strong>+8</strong>. Crisp.'
    ));
    compareWrap.appendChild(buildPanel(
      'SLOW WIN — 8 turns',
      SLOW,
      '7 turns of patience tax (−7) + the win bonus (+10) = <strong>+3</strong>. Still a win, but the agent prefers the shorter route.'
    ));

    /* ---- Closing caption ---- */
    const cap = document.createElement('div');
    cap.className = 'concept-key-question';
    cap.textContent = 'SAME OUTCOME, DIFFERENT RETURNS. SPEED IS BAKED INTO R.';
    root.appendChild(cap);

    return {};
  };
})();
