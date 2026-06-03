/* Scene 12 -- Recap ("You have learned the bones").
 *
 *   Six concept cards in the shelf-card visual language, one per badge:
 *   MDP, POLICY, RETURN G_t, Q*, DP, SARSA. Each card carries:
 *     - the concept badge (lit, matching the topbar pip colour),
 *     - a small "miniature reminder" glyph in the pricing idiom (a mini
 *       shelf-card, the three lever tags, a return tape, a Q-row with a
 *       moving star, a mini board with the diagonal seam, a SARSA tuple),
 *     - the title + blurb from window.DATA.recap (English authoritative;
 *       the JP mirror comes from this scene's i18n, falling back to DATA),
 *     - the formula rendered with KaTeX from DATA.recap[].formula.
 *
 *   Closes with the line: revenue management = the bones of RL.
 *
 *   Cold-entry safe: reads window.DATA.recap directly; never depends on a
 *   prior scene. All numbers come from DATA (never hand-typed). */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Resolve a per-card string: prefer the scene-12 i18n key (so JP works)
     and fall back to the English DATA.recap field. window.I18N.t returns
     the key itself when missing, so detect that and use the DATA fallback. */
  function cardStr(key, fallback) {
    const v = T(key);
    return (v && v !== key) ? v : (fallback || '');
  }

  function leverPrice(id) {
    const L = window.Levers && window.Levers.LEVER_BY_ID && window.Levers.LEVER_BY_ID[id];
    return L ? L.price : '';
  }
  function leverShort(id) {
    if (window.QTable && window.QTable.shortLeverLabel) return window.QTable.shortLeverLabel(id);
    const L = window.Levers && window.Levers.LEVER_BY_ID && window.Levers.LEVER_BY_ID[id];
    return L ? L.name : id;
  }

  /* ---------- Per-card miniature glyphs (HTML strings) ----------
     Deliberately small reminders of the full visuals, NOT new content. */

  function glyphMdp() {
    /* Four-tile strip: S / A / P / R, each with a one-line pricing instance. */
    const tiles = [
      { letter: 'S', mini: T('scene12.mini.s') },
      { letter: 'A', mini: T('scene12.mini.a') },
      { letter: 'P', mini: T('scene12.mini.p') },
      { letter: 'R', mini: T('scene12.mini.r') },
    ];
    return (
      '<div class="sc12-mdp-strip">' +
        tiles.map(t =>
          '<div class="sc12-mdp-tile">' +
            '<div class="sc12-mdp-letter">' + t.letter + '</div>' +
            '<div class="sc12-mdp-mini">' + t.mini + '</div>' +
          '</div>'
        ).join('') +
      '</div>'
    );
  }

  /* The three lever price tags -- the action set, the playbook's choices. */
  function leverTag(id) {
    return (
      '<span class="lever-tag" data-lever="' + id + '">' +
        '<span>' + leverShort(id) + '</span>' +
        '<span class="lever-price">$' + leverPrice(id) + '</span>' +
      '</span>'
    );
  }
  function glyphPolicy(host) {
    /* A mini shelf-card + an arrow + the chosen lever tag: pi(s)=a. */
    const ids = (window.Levers && window.Levers.LEVER_IDS) || ['premium', 'standard', 'firesale'];
    host.innerHTML = '<div class="sc12-policy-row"></div>';
    const row = host.querySelector('.sc12-policy-row');
    if (window.ShelfCard) {
      const card = window.ShelfCard.render({ u: 3, d: 2 }, { size: 'sm', label: false });
      card.classList.add('sc12-policy-shelf');
      row.appendChild(card);
    }
    const arrow = document.createElement('span');
    arrow.className = 'sc12-policy-arrow';
    arrow.textContent = '→';
    row.appendChild(arrow);
    const tag = document.createElement('span');
    tag.innerHTML = leverTag(ids[1]); /* STANDARD as the illustrative pick */
    row.appendChild(tag.firstChild);
  }

  function glyphReturn() {
    /* A return tape: a few daily takes summed to the deadline. The numbers
       come from DATA.demoTrajectory so nothing is hand-typed; fall back to
       a representative tape if the trajectory is unavailable. */
    const traj = (window.DATA && window.DATA.demoTrajectory) || [];
    const steps = [];
    let total = 0;
    for (let i = 0; i < traj.length; i++) {
      const r = +traj[i].reward || 0;
      steps.push({ r: r, lever: traj[i].lever });
      total += r;
    }
    if (!steps.length) { steps.push({ r: 3 }, { r: 0 }, { r: 5 }); total = 8; }

    let html = '<div class="sc12-tape">';
    steps.forEach((s, i) => {
      const cls = s.r > 0 ? 'sc12-tape-step sc12-tape-sale' : 'sc12-tape-step sc12-tape-nosale';
      html += '<span class="' + cls + (s.lever ? '" data-lever="' + s.lever : '') + '">+' + s.r + '</span>';
      if (i < steps.length - 1) html += '<span class="sc12-tape-arrow">→</span>';
    });
    html += '<span class="sc12-tape-eq">=</span>';
    html += '<span class="sc12-tape-total">$' + total + '</span>';
    html += '</div>';
    return html;
  }

  function glyphQstar() {
    /* A per-state Q-row with the argmax starred. Pull the real Q* row for
       (u1,d4) from DATA.spotQ if present so the star sits on PREMIUM and
       the values are genuine; otherwise derive from DATA.Qstar. */
    const ids = (window.Levers && window.Levers.LEVER_IDS) || ['premium', 'standard', 'firesale'];
    let vals = null;
    const spot = window.DATA && window.DATA.spotQ && window.DATA.spotQ.u1d4;
    if (spot && spot.q) {
      /* spotQ.u1d4 = { units, days, q:{ premium, standard, firesale }, best }. */
      vals = ids.map(id => (spot.q[id] != null ? +spot.q[id] : null));
    }
    if (!vals || vals.some(v => v == null)) {
      /* Derive (u=1,d=4) row from the flat Qstar table. */
      const P = window.Pricing, D = window.DATA;
      if (P && D && D.Qstar) {
        const si = P.stateIndex({ u: 1, d: 4 });
        vals = ids.map((_id, k) => +D.Qstar[si * ids.length + k]);
      }
    }
    if (!vals) vals = [4.44, 3.21, 2.00];

    let best = 0;
    for (let i = 1; i < vals.length; i++) if (vals[i] > vals[best]) best = i;

    let html = '<div class="sc12-q-row">';
    ids.forEach((id, i) => {
      const isBest = i === best;
      html += '<div class="sc12-q-cell' + (isBest ? ' sc12-q-best' : '') + '" data-lever="' + id + '">' +
        '<span class="sc12-q-name">' + leverShort(id) + '</span>' +
        '<span class="sc12-q-val">' + vals[i].toFixed(2) + (isBest ? ' ★' : '') + '</span>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function glyphDp(host) {
    /* A mini 5x4 board painted with the converged optimal-policy regions
       so the three-colour surface + diagonal seam reads at a glance.
       Colours come from DATA.policy (lever id per stateIndex). */
    const P = window.Pricing, D = window.DATA;
    const ROWS = (P && P.ROWS) || 5;
    const COLS = (P && P.COLS) || 4;
    const board = document.createElement('div');
    board.className = 'sc12-mini-board';
    board.style.setProperty('--cols', String(COLS));
    for (let r = 0; r < ROWS; r++) {
      const u = ROWS - r;
      for (let c = 0; c < COLS; c++) {
        const d = COLS - c;
        const cell = document.createElement('div');
        cell.className = 'sc12-mini-cell';
        let lever = null;
        if (P && D && D.policy) {
          const si = P.stateIndex({ u: u, d: d });
          lever = D.policy[si];
        }
        if (lever) cell.classList.add('lever-fill-' + lever);
        board.appendChild(cell);
      }
      /* midnight gutter cell */
      const gut = document.createElement('div');
      gut.className = 'sc12-mini-gutter';
      board.appendChild(gut);
    }
    host.appendChild(board);
  }

  function glyphSarsa() {
    /* The S-A-R-S-A tuple as five chips, then the update rule (text;
       the formal KaTeX form is the card's formula box). */
    return (
      '<div class="sc12-sarsa-tape">' +
        '<span class="sc12-sarsa-chip k-s">s</span>' +
        '<span class="sc12-sarsa-chip k-a">a</span>' +
        '<span class="sc12-sarsa-chip k-r">r</span>' +
        '<span class="sc12-sarsa-chip k-s">s′</span>' +
        '<span class="sc12-sarsa-chip k-a">a′</span>' +
      '</div>'
    );
  }

  /* Map: which glyphs are string-returning vs host-mounting. */
  const GLYPH = {
    mdp:    { html: glyphMdp },
    policy: { mount: glyphPolicy },
    return: { html: glyphReturn },
    qstar:  { html: glyphQstar },
    dp:     { mount: glyphDp },
    sarsa:  { html: glyphSarsa },
  };

  window.scenes.scene12 = function (root) {
    root.classList.add('scene-pad', 'sc12-scene');
    root.innerHTML = '';

    const recap = (window.DATA && window.DATA.recap) || [];

    /* Banner. */
    const banner = document.createElement('div');
    banner.className = 'sc12-banner';
    banner.innerHTML = '<span class="sc12-star">★</span> ' + T('scene12.banner') + ' <span class="sc12-star">★</span>';
    root.appendChild(banner);

    /* Heading + subtitle. */
    const head = document.createElement('h2');
    head.className = 'sc12-title';
    head.textContent = T('scene12.title');
    root.appendChild(head);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc12-sub';
    sub.textContent = T('scene12.sub');
    root.appendChild(sub);

    /* The six recap cards. */
    const grid = document.createElement('div');
    grid.className = 'sc12-grid';
    root.appendChild(grid);

    recap.forEach((c, i) => {
      const box = document.createElement('div');
      box.className = 'poke-box sc12-card sc12-card-' + c.key;
      box.style.setProperty('--i', String(i));

      /* head: lit badge + title */
      const cardHead = document.createElement('div');
      cardHead.className = 'sc12-card-head';
      cardHead.innerHTML =
        '<div class="concept-badge ' + c.key + ' earned sc12-card-badge">' + (c.badge || c.key.toUpperCase()) + '</div>' +
        '<div class="sc12-card-title">' + cardStr('scene12.card.' + c.key + '.title', c.title) + '</div>';
      box.appendChild(cardHead);

      /* glyph slot */
      const vis = document.createElement('div');
      vis.className = 'sc12-card-visual sc12-vis-' + c.key;
      const g = GLYPH[c.key];
      if (g && g.html) vis.innerHTML = g.html();
      else if (g && g.mount) g.mount(vis);
      box.appendChild(vis);

      /* one-line "what it meant here" tag */
      const tag = document.createElement('div');
      tag.className = 'sc12-card-tag';
      tag.textContent = T('scene12.tag.' + c.key);
      box.appendChild(tag);

      /* blurb */
      const blurb = document.createElement('div');
      blurb.className = 'sc12-card-blurb';
      blurb.textContent = cardStr('scene12.card.' + c.key + '.blurb', c.blurb);
      box.appendChild(blurb);

      /* formula (KaTeX) from DATA */
      const fbox = document.createElement('div');
      fbox.className = 'sc12-card-formula';
      box.appendChild(fbox);
      if (window.Katex && c.formula) {
        window.Katex.render(c.formula, fbox, true);
      } else if (c.formula) {
        fbox.textContent = c.formula;
      }

      grid.appendChild(box);
    });

    /* Closing line. */
    const close = document.createElement('div');
    close.className = 'sc12-close poke-box';
    close.innerHTML = '<span class="sc12-close-mark">★</span> ' + T('scene12.close');
    root.appendChild(close);

    /* Footnote. */
    const foot = document.createElement('div');
    foot.className = 'footnote sc12-foot';
    foot.textContent = T('scene12.footnote');
    root.appendChild(foot);

    /* Replay link back to the start (the tutorial, now scene index 0). */
    const replayWrap = document.createElement('div');
    replayWrap.className = 'sc12-replay-wrap';
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'sc12-replay';
    replay.innerHTML = '↺ ' + T('scene12.replay');
    replay.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cursor');
      if (window.PriceViz) window.PriceViz.goTo(0);
    });
    replayWrap.appendChild(replay);
    root.appendChild(replayWrap);

    /* Victory fanfare -- defer so it lands while cards animate in. Plays on
       first build and on revisit. */
    function fanfare() {
      setTimeout(() => { if (window.SFX && window.SFX.play) window.SFX.play('win'); }, 180);
    }
    fanfare();

    return {
      onEnter() { fanfare(); },
    };
  };
})();
