/* Scene — P, the transition function.
 *
 *   Third piece of the MDP. Given (s, a), the world hands you back a
 *   random s'. The full distribution P(s'|s,a) folds together the move
 *   accuracy (THUNDER misses 45% of the time), the hit-damage roll, any
 *   mid-turn evolution (Pikachu's hit can cross a form threshold), and
 *   the opponent's counter — all into one categorical distribution over
 *   destination states.
 *
 *   This scene draws that distribution explicitly: pick a state, pick an
 *   action, see every successor s' with its probability. The reveal: the
 *   agent never SEES this table during learning — it only samples from
 *   it. The whole point of RL is to recover a policy without it.
 */
(function () {
  window.scenes = window.scenes || {};

  const NB      = window.Battle.NUM_BUCKETS;
  const BUCKETS = window.Battle.BUCKETS;
  const A_IDS   = window.Moves.MOVE_IDS;

  function bucketName(b) { return BUCKETS[b].toUpperCase(); }
  function bucketClass(b) {
    if (b === 0) return '';
    if (b === 1) return 'b1';
    if (b === 2) return 'b2';
    if (b === 3) return 'b3';
    return 'b4';
  }
  function bucketPct(b) { return Math.max(0, (NB - b) * 100 / NB); }
  function fmtPct(p) {
    if (p < 0.01) return '<1%';
    return (p * 100).toFixed(p < 0.1 ? 1 : 0) + '%';
  }

  window.scenes.sceneMdpTransitions = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'P — THE TRANSITION FUNCTION';
    root.appendChild(heading);

    /* ---- Formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">PROBABILITY OF THE NEXT STATE</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`P(s' \mid s,\, a) \;=\; \Pr\!\bigl[\, S_{t+1} = s' \mid S_t = s,\, A_t = a \,\bigr]`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'Accuracy rolls, damage rolls, mid-turn evolutions, and the counter-attack all fold into one categorical distribution over next states.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- Picker row: state (pikachu HP × opp HP) + action ---- */
    const pickerRow = document.createElement('div');
    pickerRow.className = 'mdp-tr-picker';
    root.appendChild(pickerRow);

    /* Initial focus: PIKACHU FULL, opp HIGH (Charmander), THUNDER —
       stochastic enough to make miss/hit branching visible without
       being overwhelming. */
    let yourB = 0;
    let oppB  = 1;
    let actI  = 2;                       /* THUNDER */

    function makeBucketPicker(label, getVal, setVal) {
      const box = document.createElement('div');
      box.className = 'mdp-tr-picker-box';
      box.innerHTML = '<div class="mdp-tr-picker-label">' + label + '</div>';
      const row = document.createElement('div');
      row.className = 'mdp-tr-picker-row';
      for (let b = 0; b < NB; b++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mdp-tr-pip ' + bucketClass(b);
        btn.dataset.b = String(b);
        btn.textContent = bucketName(b);
        btn.addEventListener('click', () => { setVal(b); refresh(); });
        row.appendChild(btn);
      }
      box.appendChild(row);
      return box;
    }

    const pikaPicker = makeBucketPicker('PIKACHU HP (s)', () => yourB, (b) => { yourB = b; });
    const oppPicker  = makeBucketPicker('OPPONENT HP (s)', () => oppB, (b) => { oppB = b; });
    pickerRow.appendChild(pikaPicker);
    pickerRow.appendChild(oppPicker);

    const actBox = document.createElement('div');
    actBox.className = 'mdp-tr-picker-box';
    actBox.innerHTML = '<div class="mdp-tr-picker-label">ACTION (a)</div>';
    const actRow = document.createElement('div');
    actRow.className = 'mdp-tr-picker-row';
    for (let i = 0; i < A_IDS.length; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mdp-tr-act-btn';
      btn.dataset.i = String(i);
      btn.textContent = window.Moves.MOVE_BY_ID[A_IDS[i]].name;
      btn.addEventListener('click', () => { actI = i; refresh(); });
      actRow.appendChild(btn);
    }
    actBox.appendChild(actRow);
    pickerRow.appendChild(actBox);

    /* ---- Distribution table: one row per successor s' ---- */
    const distTitle = document.createElement('div');
    distTitle.className = 'mdp-tr-dist-title';
    root.appendChild(distTitle);

    const distHost = document.createElement('div');
    distHost.className = 'mdp-tr-dist-host';
    root.appendChild(distHost);

    /* Small thumbnail of a state — used as a successor preview. */
    function thumb(succ) {
      if (succ.terminal) {
        const won = !!succ.win;
        return '<div class="mdp-tr-thumb terminal ' + (won ? 'win' : 'loss') + '">' +
                 '<div class="mdp-tr-thumb-banner">' + (won ? '✓ WIN' : '✗ LOSS') + '</div>' +
                 '<div class="mdp-tr-thumb-r">' + (won ? '+10' : '−10') + '</div>' +
               '</div>';
      }
      const oppSrc = window.Battle.spriteForOpp(succ.opp, 'gen1');
      return '<div class="mdp-tr-thumb">' +
               '<div class="mdp-tr-thumb-row">' +
                 '<img class="mdp-tr-thumb-sprite pika" src="assets/pikachu-back-gen1.png" alt="">' +
                 '<div class="mdp-tr-thumb-hp"><div class="mdp-tr-thumb-hp-fill ' + bucketClass(succ.your) + '" style="width:' + bucketPct(succ.your) + '%"></div></div>' +
               '</div>' +
               '<div class="mdp-tr-thumb-row">' +
                 '<img class="mdp-tr-thumb-sprite opp" src="' + oppSrc + '" alt="">' +
                 '<div class="mdp-tr-thumb-hp"><div class="mdp-tr-thumb-hp-fill ' + bucketClass(succ.opp) + '" style="width:' + bucketPct(succ.opp) + '%"></div></div>' +
               '</div>' +
               '<div class="mdp-tr-thumb-r">−1</div>' +
             '</div>';
    }

    function refresh() {
      /* Reflect the picker selection in button state. */
      pikaPicker.querySelectorAll('.mdp-tr-pip').forEach(btn => {
        btn.classList.toggle('on', Number(btn.dataset.b) === yourB);
      });
      oppPicker.querySelectorAll('.mdp-tr-pip').forEach(btn => {
        btn.classList.toggle('on', Number(btn.dataset.b) === oppB);
      });
      actBox.querySelectorAll('.mdp-tr-act-btn').forEach(btn => {
        btn.classList.toggle('on', Number(btn.dataset.i) === actI);
      });

      const state = { your: yourB, opp: oppB, terminal: false };
      const moveId = A_IDS[actI];
      const succ = window.Battle.successors(state, moveId);
      /* Sort by probability descending so the dominant outcomes are
         on top — that's where the eye lands first. */
      succ.sort((a, b) => b.p - a.p);

      const moveName = window.Moves.MOVE_BY_ID[moveId].name;
      const oppName  = window.Battle.displayNameForOpp(oppB);
      distTitle.innerHTML =
        'P(s\' | s = <strong>' + bucketName(yourB) + ' / ' + oppName + ' ' + bucketName(oppB) + '</strong>, a = <strong>' + moveName + '</strong>) · ' +
        succ.length + ' possible outcomes';

      distHost.innerHTML = '';
      let totalP = 0;
      for (const t of succ) {
        totalP += t.p;
        const r = document.createElement('div');
        r.className = 'mdp-tr-dist-row';
        r.innerHTML =
          '<div class="mdp-tr-prob">' + fmtPct(t.p) + '</div>' +
          '<div class="mdp-tr-bar-wrap"><div class="mdp-tr-bar" style="width:' + (t.p * 100).toFixed(2) + '%"></div></div>' +
          '<div class="mdp-tr-succ">' + thumb(t.sNext) + '</div>';
        distHost.appendChild(r);
      }

      /* Sanity: probs should sum to ~1. */
      const sumRow = document.createElement('div');
      sumRow.className = 'mdp-tr-sum-row';
      sumRow.textContent = '∑ P = ' + totalP.toFixed(2);
      distHost.appendChild(sumRow);
    }

    refresh();

    /* ---- Closing caption ---- */
    const cap = document.createElement('div');
    cap.className = 'concept-key-question';
    cap.textContent = 'THE AGENT NEVER SEES THIS TABLE — IT ONLY SAMPLES FROM IT.';
    root.appendChild(cap);

    return {};
  };
})();
