/* Scene 12: Recap ("You ran the fleet").
 *
 *   The bookend. window.DATA.recap is a ready array of six concept cards
 *   (MDP / POLICY / RETURN / Q* / DP / SARSA), each carrying {key, hue,
 *   title, symbol (LaTeX), caption, anchor}. They sit face-down in a 3x2
 *   grid and flip over ONE PER NEXT PRESS (or via the FLIP button, which
 *   is [data-run-primary] for &run capture). PREV turns the last card
 *   back over; once all six are up, NEXT falls through to the pager
 *   (there is no scene 13, so the deck simply ends here).
 *
 *   Each revealed card: the hue badge (scene-12 CSS reuses the shared
 *   concept-badge palette hexes), the title, the KaTeX symbol, the
 *   caption, and the "Scene N" anchor chip. After the sixth flip: a
 *   sign-off poke-box beside OLD BESSIE at SHAKY wear (the surprise
 *   state), a replay button back to the title, and a quiet footnote.
 *
 *   Cold-entry safe: reads window.DATA.recap directly and supports a
 *   `&step=N` deep link (N cards pre-flipped) for headless capture.
 *   All card copy and symbols come from DATA; never hand-typed. */
(function () {
  window.scenes = window.scenes || {};

  const BADGE_LABEL = { mdp: 'MDP', policy: 'POL', return: 'RTN', qstar: 'Q*', dp: 'DP', sarsa: 'SRS' };

  function reduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function instantMode() {
    return /[#&?](run|instant)\b/.test(window.location.hash || '') || reduced();
  }

  /* Letter-by-letter wordmark, echoing the title screen's drop. */
  function wordmark(text) {
    let html = '';
    let li = 0;
    for (const ch of text) {
      if (ch === ' ') { html += '<span class="sc12-title-space">&nbsp;</span>'; continue; }
      html += '<span class="sc12-title-letter" style="--i:' + li + '">' + ch + '</span>';
      li++;
    }
    return html;
  }

  window.scenes.scene12 = function (root) {
    root.classList.add('scene-pad', 'scene12-scene');
    root.innerHTML = '';

    const recap = (window.DATA && window.DATA.recap) || [];
    const total = recap.length;

    /* ---- banner + heading + sub ---- */
    const banner = document.createElement('div');
    banner.className = 'sc12-banner';
    banner.textContent = 'THE MAINTENANCE PLAYBOOK';
    root.appendChild(banner);

    const head = document.createElement('h1');
    head.className = 'sc12-title' + (instantMode() ? ' sc12-noanim' : '');
    head.innerHTML = wordmark('YOU RAN THE FLEET');
    root.appendChild(head);

    const sub = document.createElement('div');
    sub.className = 'sc12-sub';
    sub.textContent = 'Six ideas, one van, four wear levels. ' +
      'The bones of a fleet ledger, and of reinforcement learning.';
    root.appendChild(sub);

    /* ---- flip counter + hint ---- */
    const hint = document.createElement('div');
    hint.className = 'sc12-hint';
    hint.innerHTML = '<span class="sc12-count"></span><span class="sc12-hint-txt"></span>';
    root.appendChild(hint);
    const countEl = hint.querySelector('.sc12-count');
    const hintTxt = hint.querySelector('.sc12-hint-txt');

    /* ---- the six cards, face-down ---- */
    const grid = document.createElement('div');
    grid.className = 'sc12-grid' + (instantMode() ? ' sc12-noanim' : '');
    root.appendChild(grid);

    const cardEls = [];
    recap.forEach((c, i) => {
      const box = document.createElement('div');
      box.className = 'poke-box sc12-card recap-hue-' + (c.hue || c.key);

      const back = document.createElement('div');
      back.className = 'sc12-back';
      back.innerHTML =
        '<span class="sc12-back-q">?</span>' +
        '<span class="sc12-back-lab">CARD ' + (i + 1) + '</span>';
      box.appendChild(back);

      const face = document.createElement('div');
      face.className = 'sc12-face';

      const ch = document.createElement('div');
      ch.className = 'sc12-card-head';
      const badge = document.createElement('span');
      badge.className = 'sc12-badge';
      badge.textContent = BADGE_LABEL[c.key] || (c.key || '').toUpperCase();
      ch.appendChild(badge);
      const t = document.createElement('span');
      t.className = 'sc12-card-title';
      t.textContent = c.title || '';
      ch.appendChild(t);
      face.appendChild(ch);

      const sym = document.createElement('div');
      sym.className = 'sc12-card-symbol';
      face.appendChild(sym);
      if (window.Katex && c.symbol) window.Katex.render(c.symbol, sym, true);
      else if (c.symbol) sym.textContent = c.symbol;

      const cap = document.createElement('div');
      cap.className = 'sc12-card-caption';
      cap.textContent = c.caption || '';
      face.appendChild(cap);

      if (c.anchor) {
        const an = document.createElement('div');
        an.className = 'sc12-card-anchor';
        an.textContent = c.anchor;
        face.appendChild(an);
      }

      box.appendChild(face);
      grid.appendChild(box);
      cardEls.push(box);
    });

    /* ---- FLIP control (the scene's primary button) ---- */
    const ctrl = document.createElement('div');
    ctrl.className = 'sc12-ctrl';
    ctrl.innerHTML =
      '<button type="button" class="poke-btn sc12-flip" data-run-primary>FLIP A CARD &#9654;</button>';
    root.appendChild(ctrl);
    const flipBtn = ctrl.querySelector('.sc12-flip');

    /* ---- sign-off (appears after the sixth flip) ---- */
    const signoff = document.createElement('div');
    signoff.className = 'sc12-signoff';
    signoff.innerHTML =
      '<div class="sc12-signoff-van"></div>' +
      '<div class="poke-box sc12-signoff-box">She still starts every morning. ' +
        'The ledger says scrap her anyway. It is not a vibe, it is arithmetic.</div>';
    root.appendChild(signoff);
    if (window.VanCard) {
      window.VanCard.mount(signoff.querySelector('.sc12-signoff-van'),
        { wear: 2, size: 'sm', miles: 81742 });
    }

    const replayWrap = document.createElement('div');
    replayWrap.className = 'sc12-replay-wrap';
    replayWrap.innerHTML =
      '<button type="button" class="poke-btn sc12-replay">' +
      '<span class="sc12-replay-mark">&#8634;</span> BACK TO THE TITLE</button>';
    root.appendChild(replayWrap);
    replayWrap.querySelector('.sc12-replay').addEventListener('click', () => {
      if (window.VanViz) window.VanViz.goTo(0);
    });

    const foot = document.createElement('div');
    foot.className = 'footnote sc12-foot';
    foot.textContent = 'A van, a sales lead, a hospital bed, a price on a seat: one frame. ' +
      'State, call, odds, payoff, repeat.';
    root.appendChild(foot);

    /* ---- flip engine ---- */
    let k = 0;

    function apply(animate) {
      cardEls.forEach((el, i) => {
        el.classList.toggle('revealed', i < k);
        el.classList.toggle('sc12-just', !!animate && i === k - 1);
      });
      countEl.textContent = k + ' / ' + total;
      hintTxt.textContent =
        k === 0 ? 'six cards, face down. NEXT or FLIP turns one.' :
        k < total ? 'NEXT or FLIP turns another.' :
        'all six on the table.';
      flipBtn.classList.toggle('sc12-hidden', k >= total);
      signoff.classList.toggle('sc12-shown', k >= total);
      replayWrap.classList.toggle('sc12-shown', k >= total);
      foot.classList.toggle('sc12-shown', k >= total);
    }

    function flip() {
      if (k >= total) return false;
      k++;
      apply(!instantMode());
      if (k === total && window.SFX) window.SFX.play('win');
      return true;
    }
    function unflip() {
      if (k <= 0) return false;
      k--;
      apply(false);
      return true;
    }
    flipBtn.addEventListener('click', flip);

    /* Optional `&step=N` deep link: N cards pre-flipped (headless capture). */
    const m = (window.location.hash || '').match(/[#&?]step=(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) k = Math.max(0, Math.min(total, n));
    }
    apply(false);

    return {
      onNextKey() { return flip(); },     /* false once all six are up */
      onPrevKey() { return unflip(); },   /* false at zero: back a scene */
    };
  };
})();
