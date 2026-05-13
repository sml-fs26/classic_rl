/* Scene — A, the action set.
 *
 *   Second piece of the MDP. Pikachu has three moves; the action set is
 *   the same in every state. What CHANGES with the state is the *effect*
 *   of each action — the damage distribution depends on the opponent's
 *   current form. This scene makes that explicit with a per-form damage
 *   table that lays the type-effectiveness chart bare.
 *
 *   Pedagogy: students see "3 actions" and think the problem is trivial.
 *   The damage table is the punchline — the same action has wildly
 *   different consequences depending on the state. That's what makes π*
 *   state-dependent in the first place.
 */
(function () {
  window.scenes = window.scenes || {};

  const A_IDS = window.Moves.MOVE_IDS;          // ['quick_attack','thunderbolt','thunder']
  const FORMS = ['charmander', 'charmeleon', 'charizard'];

  function fmtPct(p) { return Math.round(p * 100) + '%'; }

  /* Compact dmg-distribution renderer: stacked horizontal segments whose
     widths are proportional to the probability of each damage value. The
     numeric labels sit above. */
  function renderDmgDist(dist) {
    /* dist is [[damage, prob], ...] e.g. [[0, 0.55], [1, 0.45]] */
    if (!dist || !dist.length) return '<div class="mdp-act-dist-empty">—</div>';
    let labels = '<div class="mdp-act-dist-labels">';
    let bars   = '<div class="mdp-act-dist-bars">';
    for (const [d, p] of dist) {
      labels += '<span style="flex:' + p + '">' + d + '</span>';
      bars   += '<span class="mdp-act-dist-seg d' + Math.min(d, 3) + '" style="flex:' + p + '">' + fmtPct(p) + '</span>';
    }
    labels += '</div>'; bars += '</div>';
    return labels + bars;
  }

  window.scenes.sceneMdpActions = function (root) {
    root.classList.add('scene-pad', 'concept-scene');
    root.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'A — THE ACTION SET';
    root.appendChild(heading);

    /* ---- Formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'concept-formula-card';
    fcard.innerHTML = '<div class="concept-formula-label">PIKACHU\'S MOVES</div>';
    const f = document.createElement('div');
    fcard.appendChild(f);
    window.Katex.render(
      String.raw`A \;=\; \{\, \text{QUICK ATTACK},\;\; \text{THUNDERBOLT},\;\; \text{THUNDER} \,\}, \quad |A| = 3`,
      f, true
    );
    const foot = document.createElement('div');
    foot.className = 'concept-formula-foot';
    foot.textContent = 'The agent picks one a ∈ A per turn. The same set is available in every state — but each a hits differently depending on the opponent\'s form.';
    fcard.appendChild(foot);
    root.appendChild(fcard);

    /* ---- The damage table: rows = moves, cols = opp forms ---- */
    const tableWrap = document.createElement('div');
    tableWrap.className = 'mdp-act-table-wrap';
    root.appendChild(tableWrap);

    /* Header row */
    const hdr = document.createElement('div');
    hdr.className = 'mdp-act-row mdp-act-row-hdr';
    hdr.innerHTML = '<div class="mdp-act-cell move-cell">MOVE</div>';
    for (const form of FORMS) {
      const name = window.Battle.FORM_DISPLAY_NAME[form];
      const src  = window.Battle.FORM_SPRITE_GEN1[form];
      hdr.innerHTML +=
        '<div class="mdp-act-cell form-cell">' +
          '<img class="mdp-act-form-sprite" src="' + src + '" alt="' + name + '">' +
          '<div class="mdp-act-form-name">' + name + '</div>' +
        '</div>';
    }
    tableWrap.appendChild(hdr);

    /* One row per move */
    for (const moveId of A_IDS) {
      const move = window.Moves.MOVE_BY_ID[moveId];
      const row = document.createElement('div');
      row.className = 'mdp-act-row';

      /* Left: move identity */
      let html =
        '<div class="mdp-act-cell move-cell">' +
          '<div class="mdp-act-move-name">' + move.name + '</div>' +
          '<div class="mdp-act-move-meta">acc ' + fmtPct(move.accuracy) + '</div>' +
        '</div>';

      /* One damage-distribution cell per form. Annotate "super-effective"
         and "resisted" relative to the CHARMANDER baseline so the student
         sees the type-chart story without reading the table cold. */
      for (const form of FORMS) {
        const dist = window.Battle.hitDamageDist(form, moveId);
        const tag = (function () {
          if (form === 'charizard' && moveId === 'quick_attack') return 'SUPER-EFFECTIVE';
          if (form === 'charmeleon' && moveId === 'thunderbolt')  return 'RESISTED';
          return '';
        })();
        const tagClass = tag === 'SUPER-EFFECTIVE' ? 'super' : (tag === 'RESISTED' ? 'resisted' : '');
        html +=
          '<div class="mdp-act-cell dmg-cell">' +
            (tag ? '<div class="mdp-act-tag ' + tagClass + '">' + tag + '</div>' : '') +
            '<div class="mdp-act-dist">' + renderDmgDist(dist) + '</div>' +
          '</div>';
      }
      row.innerHTML = html;
      tableWrap.appendChild(row);
    }

    /* ---- Counter-attack row (informational, not chooseable) ---- */
    const counterSection = document.createElement('div');
    counterSection.className = 'mdp-act-counter';
    counterSection.innerHTML =
      '<div class="mdp-act-counter-title">THE OPPONENT\'S COUNTER (not chosen by you)</div>';
    const counterRow = document.createElement('div');
    counterRow.className = 'mdp-act-row';
    counterRow.innerHTML = '<div class="mdp-act-cell move-cell"><div class="mdp-act-move-name">OPP MOVE</div><div class="mdp-act-move-meta">always hits</div></div>';
    for (const form of FORMS) {
      const moveName = window.Battle.FORM_MOVE_NAME[form];
      const dist = window.Battle.oppDamageDist(form);
      counterRow.innerHTML +=
        '<div class="mdp-act-cell dmg-cell">' +
          '<div class="mdp-act-counter-name">' + moveName + '</div>' +
          '<div class="mdp-act-dist">' + renderDmgDist(dist) + '</div>' +
        '</div>';
    }
    counterSection.appendChild(counterRow);
    root.appendChild(counterSection);

    /* ---- Closing caption ---- */
    const cap = document.createElement('div');
    cap.className = 'concept-key-question';
    cap.textContent = 'ONE ACTION SET. THREE DIFFERENT DAMAGE TABLES. STATE MATTERS.';
    root.appendChild(cap);

    return {};
  };
})();
