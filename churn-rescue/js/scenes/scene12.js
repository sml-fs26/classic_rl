/* Scene 12: Recap.
 *
 *   Six concept cards, one per idea (MDP, POLICY, RETURN, Q*, DP, SARSA),
 *   each anchored to its Churn Rescue artifact. The copy, the KaTeX
 *   symbol, the lever-colour token and the "where you saw it" anchor all
 *   come from window.DATA.recap so nothing is hand-typed. Each card carries
 *   a small glyph that recalls the full visual from earlier in the deck:
 *     MDP    : a mini account card + an S / A / P / R micro-strip
 *     POLICY : a tiny coloured 5x5 retention map, read from window.DATA.policy
 *              (grey thriving corner, blue middle band, gold cliff wedge,
 *              and the blue notch where at-risk has a long runway)
 *     RETURN : a cost tape that lands on +20, beside a twin-spike histogram
 *     Q*     : three lever cells with the argmax starred, from a real
 *              window.DATA.Qstar row
 *     DP     : the grid filling from the terminals (corner + edges lit)
 *     SARSA  : the s, a, r, s', a' tape + the one-line update
 *
 *   Closing line: "you make these calls every quarter." Cards stagger in;
 *   a short win fanfare fires once. No gated animation, so &run is a no-op.
 *   Cold entry works: everything is reconstructed from window.DATA on build.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);
  const DATA = window.DATA || {};

  /* Concept-badge label per key, mirroring the topbar pips. */
  const BADGE_LABEL = {
    mdp: 'MDP', policy: 'POL', return: 'RTN', qstar: 'Q*', dp: 'DP', sarsa: 'SAR',
  };

  /* Render a KaTeX symbol into a host (display mode). Falls back to the raw
     TeX text if KaTeX is unavailable so the card never goes blank. */
  function renderSymbol(host, tex) {
    if (!tex) return;
    try {
      if (window.katex) {
        window.katex.render(tex, host, { throwOnError: false, displayMode: true });
        return;
      }
    } catch (_e) { /* fall through */ }
    host.textContent = tex;
  }

  function prefersReduced() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- Per-concept glyph builders ----------
     Each returns an HTML string for the .sc12-card-visual slot. They are
     deliberately small reminders of the full scenes, not new content.
     Lever colours come from the .lever-{nothing|checkin|offer} token
     classes (and the .region-* tints used by the retention map), never
     inline categorical colours. */

  /* MDP: a mini account card glyph (engagement bar + logo) + S/A/P/R strip. */
  function visualMdp() {
    const glyph = (window.AccountCard && window.AccountCard.logoGlyph)
      ? window.AccountCard.logoGlyph(18) : '';
    const bar =
      '<span class="sc12-mini-bar">' +
        '<i class="sc12-seg tier4"></i><i class="sc12-seg tier4"></i>' +
        '<i class="sc12-seg tier4"></i><i class="sc12-seg"></i><i class="sc12-seg"></i>' +
      '</span>';
    const tiles = [
      { letter: 'S', mini: T('recap.mdp.s') },
      { letter: 'A', mini: T('recap.mdp.a') },
      { letter: 'P', mini: T('recap.mdp.p') },
      { letter: 'R', mini: T('recap.mdp.r') },
    ];
    return (
      '<div class="sc12-mdp-wrap">' +
        '<div class="sc12-mini-card">' + bar +
          '<span class="sc12-mini-glyph">' + glyph + '</span>' +
        '</div>' +
        '<div class="sc12-mdp-strip">' +
          tiles.map((t) =>
            '<div class="sc12-mdp-tile">' +
              '<div class="sc12-mdp-letter">' + t.letter + '</div>' +
              '<div class="sc12-mdp-mini">' + t.mini + '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</div>'
    );
  }

  /* POLICY: a tiny 5x5 retention map painted from window.DATA.policy. Rows
     run thriving (top) to cliff (bottom); columns m=1 (left) to m=5
     (right). Each cell is tinted by its winning lever's region token, so
     the grey corner / blue band / gold wedge / blue notch all read at a
     glance, exactly as on the full board. */
  function visualPolicy() {
    const policy = DATA.policy || [];
    const numTiers = DATA.numTiers || 5;
    const numMonths = DATA.numMonths || 5;
    /* A one-letter mark per cell (N / C / O) rides on top of the region
       tint so the regions read even under CRT, where the three lever
       tokens converge to near-identical oranges. This mirrors the full
       board, whose cells also carry the lever name. */
    const MARK = { nothing: 'N', checkin: 'C', offer: 'O' };
    let cells = '';
    for (let t = numTiers - 1; t >= 0; t--) {        /* thriving .. cliff */
      for (let m = 1; m <= numMonths; m++) {
        const lever = policy[t * numMonths + (m - 1)] || 'nothing';
        cells += '<i class="sc12-pol-cell region-' + lever + '">' +
          (MARK[lever] || '') + '</i>';
      }
    }
    return (
      '<div class="sc12-pol-wrap">' +
        '<div class="sc12-pol-grid" style="--nm:' + numMonths + '">' + cells + '</div>' +
      '</div>'
    );
  }

  /* RETURN: a small cost tape that lands on +20, plus a twin-spike
     histogram (renew spike up, churn spike down) that says "a
     distribution, not a number." Tape values are the lever costs as
     value points; the +20 lump is the renewal reward from the model. */
  function visualReturn() {
    const renew = (DATA.model && DATA.model.renewReward != null)
      ? DATA.model.renewReward : 20;
    return (
      '<div class="sc12-rtn-wrap">' +
        '<div class="sc12-rtn-tape">' +
          '<span class="sc12-rtn-r">' + T('lever.cost.checkin') + '</span>' +
          '<span class="sc12-rtn-arrow">+</span>' +
          '<span class="sc12-rtn-r">' + T('lever.cost.checkin') + '</span>' +
          '<span class="sc12-rtn-arrow">+</span>' +
          '<span class="sc12-rtn-r sc12-rtn-final">+' + renew + '</span>' +
        '</div>' +
        '<div class="sc12-hist" aria-hidden="true">' +
          '<span class="sc12-hist-bar churn" style="--h:38%"></span>' +
          '<span class="sc12-hist-bar churn" style="--h:24%"></span>' +
          '<span class="sc12-hist-gap"></span>' +
          '<span class="sc12-hist-bar renew" style="--h:62%"></span>' +
          '<span class="sc12-hist-bar renew" style="--h:92%"></span>' +
          '<span class="sc12-hist-bar renew" style="--h:70%"></span>' +
        '</div>' +
      '</div>'
    );
  }

  /* Q*: three lever cells with the argmax starred, from a REAL Qstar row.
     We use thriving x m=1 (stateIndex = 4*numMonths) where the brand /
     margin guardrail bites: DO NOTHING wins, the discount is value
     destroyed. Values are read from window.DATA.Qstar, never typed. */
  function visualQstar() {
    const Q = DATA.Qstar || [];
    const leverIds = DATA.leverIds || ['nothing', 'checkin', 'offer'];
    const numMonths = DATA.numMonths || 5;
    const numTiers = DATA.numTiers || 5;
    const s = (numTiers - 1) * numMonths + (1 - 1);   /* thriving, m=1 */
    const vals = [Q[s * 3 + 0], Q[s * 3 + 1], Q[s * 3 + 2]];
    let best = 0;
    for (let i = 1; i < vals.length; i++) {
      if ((vals[i] != null ? vals[i] : -Infinity) > (vals[best] != null ? vals[best] : -Infinity)) best = i;
    }
    const cells = leverIds.map((id, i) => {
      const v = vals[i];
      const txt = (v == null) ? '·' : (v >= 0 ? '+' : '') + v.toFixed(1);
      const star = (i === best) ? ' <span class="sc12-q-star">★</span>' : '';
      return (
        '<div class="sc12-q-cell lever-' + id + (i === best ? ' sc12-q-best' : '') + '">' +
          '<span class="sc12-q-name">' + T('lever.short.' + id) + '</span>' +
          '<span class="sc12-q-val">' + txt + star + '</span>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="sc12-q-wrap">' +
        '<div class="sc12-q-state">' + T('recap.qstar.state') + '</div>' +
        '<div class="sc12-q-row">' + cells + '</div>' +
      '</div>'
    );
  }

  /* DP: a tiny grid filling from the terminals. The renewal-imminent
     column and the extreme tiers lock in first, then the interior fills:
     we light the left column + the top/bottom rows, leaving the interior
     dim, to evoke values flowing inward. Pure layout, no numbers. */
  function visualDp() {
    const numTiers = DATA.numTiers || 5;
    const numMonths = DATA.numMonths || 5;
    let cells = '';
    for (let t = numTiers - 1; t >= 0; t--) {
      for (let m = 1; m <= numMonths; m++) {
        const edge = (m === 1) || (t === 0) || (t === numTiers - 1);
        cells += '<i class="sc12-dp-cell' + (edge ? ' filled' : '') + '"></i>';
      }
    }
    return (
      '<div class="sc12-dp-wrap">' +
        '<div class="sc12-dp-grid" style="--nm:' + numMonths + '">' + cells + '</div>' +
      '</div>'
    );
  }

  /* SARSA: the s, a, r, s', a' tape as five chips + the update line. */
  function visualSarsa() {
    return (
      '<div class="sc12-sarsa-wrap">' +
        '<div class="sc12-sarsa-tape">' +
          '<span class="sc12-sarsa-chip k-s">s</span>' +
          '<span class="sc12-sarsa-chip k-a">a</span>' +
          '<span class="sc12-sarsa-chip k-r">r</span>' +
          '<span class="sc12-sarsa-chip k-s">s&prime;</span>' +
          '<span class="sc12-sarsa-chip k-a">a&prime;</span>' +
        '</div>' +
        '<div class="sc12-sarsa-update">' +
          'q[s,a] += &alpha;&thinsp;(r + q[s&prime;,a&prime;] &minus; q[s,a])' +
        '</div>' +
      '</div>'
    );
  }

  const VISUALS = {
    mdp: visualMdp,
    policy: visualPolicy,
    return: visualReturn,
    qstar: visualQstar,
    dp: visualDp,
    sarsa: visualSarsa,
  };

  /* One-time win fanfare on first visit ever; plain on revisits. */
  const FANFARE_KEY = 'churn-rescue.recap-first-visit-done';
  function isFirstVisitEver() {
    try { return !localStorage.getItem(FANFARE_KEY); } catch (_e) { return true; }
  }
  function markVisited() {
    try { localStorage.setItem(FANFARE_KEY, '1'); } catch (_e) {}
  }

  function spawnConfetti(scope) {
    if (prefersReduced()) return;
    const layer = document.createElement('div');
    layer.className = 'sc12-confetti-layer';
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('span');
      c.className = 'sc12-confetti c' + (i % 4);
      c.style.setProperty('--x', (Math.random() * 100).toFixed(1) + '%');
      c.style.setProperty('--delay', (Math.random() * 0.5).toFixed(2) + 's');
      c.style.setProperty('--dur', (1.5 + Math.random() * 1.3).toFixed(2) + 's');
      c.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      layer.appendChild(c);
    }
    scope.appendChild(layer);
    setTimeout(() => { try { layer.remove(); } catch (_e) {} }, 3400);
  }

  window.scenes.scene12 = function (root) {
    root.classList.add('scene-pad', 'sc12-scene');
    root.innerHTML = '';

    /* Banner: frames the page as a victory / graduation screen. */
    const banner = document.createElement('div');
    banner.className = 'sc12-banner';
    banner.innerHTML =
      '<span class="sc12-star">★</span> ' + T('recap.banner') +
      ' <span class="sc12-star">★</span>';
    root.appendChild(banner);

    const sub = document.createElement('div');
    sub.className = 'sc12-sub';
    sub.textContent = T('recap.sub');
    root.appendChild(sub);

    /* The six recap cards, driven by window.DATA.recap. */
    const grid = document.createElement('div');
    grid.className = 'sc12-grid';
    root.appendChild(grid);

    const recap = Array.isArray(DATA.recap) ? DATA.recap : [];
    recap.forEach((item, i) => {
      const key = item.key;
      const token = item.token || 'nothing';            /* lever colour */
      const box = document.createElement('div');
      box.className = 'poke-box sc12-card sc12-card-' + key + ' lever-bd-' + token;
      box.style.setProperty('--i', String(i));

      /* Header: a token-tinted badge tile + the concept title. */
      const head = document.createElement('div');
      head.className = 'sc12-card-head';
      head.innerHTML =
        '<div class="sc12-card-badge lever-' + token + '">' +
          '<span class="sc12-card-badge-mark">★</span>' +
          '<span class="sc12-card-badge-label">' +
            (BADGE_LABEL[key] || key.toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="sc12-card-title">' + (item.title || '') + '</div>';
      box.appendChild(head);

      /* The distinctive glyph that recalls this concept's full scene. */
      const vis = document.createElement('div');
      vis.className = 'sc12-card-visual sc12-vis-' + key;
      const builder = VISUALS[key];
      vis.innerHTML = builder ? builder() : '';
      box.appendChild(vis);

      /* The KaTeX symbol for the concept (from DATA). */
      const sym = document.createElement('div');
      sym.className = 'sc12-card-symbol';
      renderSymbol(sym, item.symbol);
      box.appendChild(sym);

      /* The manager-voice caption + the "where you saw it" anchor. */
      const cap = document.createElement('div');
      cap.className = 'sc12-caption';
      cap.textContent = item.caption || '';
      box.appendChild(cap);

      if (item.anchor) {
        const anchor = document.createElement('div');
        anchor.className = 'sc12-anchor';
        anchor.textContent = item.anchor;
        box.appendChild(anchor);
      }

      grid.appendChild(box);
    });

    /* Closing line: the manager send-off. */
    const close = document.createElement('div');
    close.className = 'sc12-close';
    close.textContent = T('scene12.hook');
    root.appendChild(close);

    /* Fanfare: once on first ever visit (with confetti), and a soft note
       on every (re)entry so the page lands. Deferred so it plays while the
       cards are still animating in. */
    function playFanfare(firstEver) {
      setTimeout(() => { if (window.SFX) window.SFX.play('win'); }, 180);
      if (firstEver) {
        setTimeout(() => spawnConfetti(root), 220);
        setTimeout(() => { if (window.SFX) window.SFX.play('win'); }, 900);
      }
    }
    const firstEver = isFirstVisitEver();
    if (firstEver) markVisited();
    playFanfare(firstEver);

    return {
      onEnter() { playFanfare(false); },
    };
  };
})();
