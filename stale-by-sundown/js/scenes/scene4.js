/* Scene 4 -- Policy: a rule from states to actions. A policy pi : S -> A is a
   playbook: for every shelf state, which lever. The display case re-renders as a
   board of lever chips. Two hand-policies side by side: Always-HOLD (every cell
   green, "premium pride") and Discount-when-old (green cap, amber/red below).
   "When you played in scene 2, you WERE a policy, maybe an inconsistent one."
   Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const B = window.Bakery, D = window.DATA || {};
  const TIERS = B.TIERS, UNITS = B.UNITS;

  /* Build a 15-array policy from a per-tier lever assignment. */
  function policyFromTierMap(map) {
    const out = new Array(B.N);
    for (const t of TIERS) for (const u of UNITS) out[B.stateIndex(B.makeState(u, t))] = map[t];
    return out;
  }
  const ALWAYS_HOLD = policyFromTierMap({ FRESH: 'HOLD', OK: 'HOLD', AGING: 'HOLD', OLD: 'HOLD', STALE: 'HOLD' });
  const DISCOUNT_OLD = policyFromTierMap({ FRESH: 'HOLD', OK: 'HOLD', AGING: 'DISCOUNT', OLD: 'DISCOUNT', STALE: 'DUMP' });

  window.scenes.scene4 = function (root) {
    root.className = 'scene scene-pad sc4';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene4.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene4.lede') + '</p>' +
      '<div class="formula-card compact sc4-formula"><div class="formula-label">' + T('scene4.formulaLabel') + '</div><div id="sc4-f"></div></div>' +
      '<div class="sc4-boards">' +
        '<div class="sc4-board">' +
          '<div class="sc4-board-title lev-hold-text">' + T('scene4.holdTitle') + '</div>' +
          '<div class="sc4-board-sub">' + T('scene4.holdSub') + '</div>' +
          '<div class="sc4-board-host" id="sc4-hold"></div>' +
        '</div>' +
        '<div class="sc4-board">' +
          '<div class="sc4-board-title">' + T('scene4.oldTitle') + '</div>' +
          '<div class="sc4-board-sub">' + T('scene4.oldSub') + '</div>' +
          '<div class="sc4-board-host" id="sc4-old"></div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc4-note">' + T('scene4.note') + '</div>' +
      '<div class="poke-box sc4-framing">' + T('scene4.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.policy) || '\\pi : S \\rightarrow A', root.querySelector('#sc4-f'), true);

    const holdBoard = window.Board.mount(root.querySelector('#sc4-hold'), { variant: 'policy', legend: false });
    const oldBoard = window.Board.mount(root.querySelector('#sc4-old'), { variant: 'policy', legend: true });
    holdBoard.paintPolicy(ALWAYS_HOLD, {});
    oldBoard.paintPolicy(DISCOUNT_OLD, {});

    return {
      onEnter() { holdBoard.paintPolicy(ALWAYS_HOLD, {}); oldBoard.paintPolicy(DISCOUNT_OLD, {}); },
    };
  };
})();
