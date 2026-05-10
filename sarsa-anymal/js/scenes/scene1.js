/* Scene 1 — The SARSA update.
 *
 *   Centred large KaTeX of the SARSA update, each chunk colour-keyed by
 *   wrapping the inline KaTeX fragment in a `.comp-*` span. The four hues
 *   are CSS variables (theme-aware) — no hardcoded colors here.
 *
 *   Below the equation: a small components table mapping each chunk →
 *   its viz of origin. Below that: an inline callout on ε-greedy in
 *   Casino-blue.
 *
 *   Static — no step engine.
 */
(function () {
  if (!window.scenes) window.scenes = {};

  /* Helper: build the SARSA update line from coloured inline KaTeX fragments.
     Each fragment is rendered into a span; spans are concatenated with text
     glue. The displayMode wrapper is built from a flex container so KaTeX
     renders inline-baseline for each piece. */
  function buildColoredUpdate(host) {
    const eq = document.createElement('div');
    eq.className = 's1-equation';

    function piece(tex, cls) {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      window.Katex.render(tex, span, false);
      return span;
    }
    function glue(text) {
      const span = document.createElement('span');
      span.className = 's1-glue';
      window.Katex.render(text, span, false);
      return span;
    }

    eq.appendChild(piece('Q(s, a)', 'comp-mdp s1-piece'));
    eq.appendChild(glue('\\;\\leftarrow\\;'));
    eq.appendChild(piece('Q(s, a)', 'comp-mdp s1-piece'));
    eq.appendChild(glue('\\;+\\;'));
    eq.appendChild(piece('\\alpha', 'comp-rm s1-piece'));
    eq.appendChild(glue('\\,\\bigl[\\,'));
    eq.appendChild(piece("r + \\gamma\\, Q(s', a')", 'comp-bellman s1-piece'));
    eq.appendChild(glue('\\,-\\,'));
    eq.appendChild(piece('Q(s, a)', 'comp-mdp s1-piece'));
    eq.appendChild(glue('\\,\\bigr]'));

    host.appendChild(eq);
  }

  window.scenes.scene1 = function (root) {
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'scene1-wrap';
    root.appendChild(wrap);

    /* Hero */
    const hero = document.createElement('div');
    hero.className = 'hero s1-hero';
    hero.innerHTML =
      '<h1>The SARSA update.</h1>' +
      '<p class="subtitle">Five symbols, one rule.</p>';
    wrap.appendChild(hero);

    /* The colour-coded equation. */
    buildColoredUpdate(wrap);

    /* Inline ε-greedy callout. */
    const epsCallout = document.createElement('p');
    epsCallout.className = 's1-eps-callout';
    epsCallout.appendChild(document.createTextNode('where '));
    const epsSpan = document.createElement('span');
    epsSpan.className = 'comp-eps';
    window.Katex.render("a'", epsSpan, false);
    epsCallout.appendChild(epsSpan);
    epsCallout.appendChild(document.createTextNode(' is chosen by '));
    const epsLabel = document.createElement('span');
    epsLabel.className = 'comp-eps s1-eps-label';
    epsLabel.textContent = 'ε-greedy';
    epsCallout.appendChild(epsLabel);
    epsCallout.appendChild(document.createTextNode(' on '));
    const qSpan = document.createElement('span');
    window.Katex.render("Q(s', \\cdot)", qSpan, false);
    epsCallout.appendChild(qSpan);
    epsCallout.appendChild(document.createTextNode('.'));
    wrap.appendChild(epsCallout);

    /* Components table. */
    const tableWrap = document.createElement('div');
    tableWrap.className = 's1-components-table';
    wrap.appendChild(tableWrap);

    const tblHeader = document.createElement('div');
    tblHeader.className = 's1-tbl-row s1-tbl-hdr';
    tblHeader.innerHTML =
      '<div class="s1-tbl-cell">piece</div>' +
      '<div class="s1-tbl-cell">role</div>' +
      '<div class="s1-tbl-cell">from</div>';
    tableWrap.appendChild(tblHeader);

    const PIECES = [
      { key: 'mdp',     tex: 'Q(s, a)',                role: 'the (s, a) value we update',     from: 'ANYmal' },
      { key: 'rm',      tex: '\\alpha',                role: 'step size — Robbins–Monro',       from: 'Darts' },
      { key: 'bellman', tex: "r + \\gamma\\, Q(s', a')", role: 'TD target — bootstrapped Bellman', from: 'Spooky House' },
      { key: 'eps',     tex: "a' \\sim \\varepsilon\\text{-greedy}(Q)", role: 'on-policy action selection',     from: 'Casino' },
    ];
    for (const p of PIECES) {
      const row = document.createElement('div');
      row.className = 's1-tbl-row';
      const c1 = document.createElement('div');
      c1.className = 's1-tbl-cell s1-tbl-piece comp-' + p.key;
      window.Katex.render(p.tex, c1, false);
      row.appendChild(c1);
      const c2 = document.createElement('div');
      c2.className = 's1-tbl-cell s1-tbl-role';
      c2.textContent = p.role;
      row.appendChild(c2);
      const c3 = document.createElement('div');
      c3.className = 's1-tbl-cell s1-tbl-from';
      c3.textContent = p.from;
      row.appendChild(c3);
      tableWrap.appendChild(row);
    }

    /* Footer caption. */
    const cap = document.createElement('p');
    cap.className = 'caption s1-cap';
    cap.textContent = 'TD error in brackets — the gap between what we expected and what we just saw.';
    wrap.appendChild(cap);

    return {};
  };
})();
