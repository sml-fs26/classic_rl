/* Scene 12 - RECAP for Press Your Luck.
 *
 *   Six cards, one concept each (MDP, POLICY, RETURN G_t, Q*, DP, SARSA),
 *   in the table-card visual language - each glyph is a miniature reminder
 *   of the full visual from its scene, NOT new content. Text comes from
 *   window.DATA.recap (overridable via i18n). A closing boardroom line
 *   drives the durable insight home: your risk appetite should depend on
 *   whether you are ahead or behind.
 *
 *   Light work, sets the tone. A short win-fanfare + staggered card entry
 *   on (re)enter. Cold entry reconstructs entirely from window.DATA /
 *   window.Pig, so the scene is robust to a direct #scene=12 load.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The six recap concepts, in arc order. `scene` points back at the deck;
     glyph() returns the table-voice miniature. Title/text default to
     window.DATA.recap but prefer an i18n override when present. */
  const CONCEPTS = [
    { key: 'mdp',    label: 'MDP', scene: 3,  glyph: glyphMdp },
    { key: 'policy', label: 'POL', scene: 4,  glyph: glyphPolicy },
    { key: 'return', label: 'RTN', scene: 6,  glyph: glyphReturn },
    { key: 'qstar',  label: 'Q*',  scene: 7,  glyph: glyphQstar },
    { key: 'dp',     label: 'DP',  scene: 9,  glyph: glyphDp },
    { key: 'sarsa',  label: 'SAR', scene: 11, glyph: glyphSarsa },
  ];

  /* ---- per-concept text lookup: i18n override, else DATA.recap ---- */
  function recapEntry(key) {
    const list = (window.DATA && window.DATA.recap) || [];
    for (const e of list) if (e.key === key) return e;
    return null;
  }
  function cardTitle(c) {
    const k = 'scene12.card.' + c.key + '.title';
    const t = T(k);
    if (t && t !== k) return t;
    const e = recapEntry(c.key);
    return (e && e.title) || c.label;
  }
  function cardText(c) {
    const k = 'scene12.card.' + c.key + '.text';
    const t = T(k);
    if (t && t !== k) return t;
    const e = recapEntry(c.key);
    return (e && e.text) || '';
  }
  function glyphCap(c) {
    const k = 'scene12.glyph.' + c.key;
    const t = T(k);
    return (t && t !== k) ? t : '';
  }

  /* ============ TABLE-VOICE GLYPHS (miniature reminders) ============ */

  /* MDP - the four parts: a pot-meter sliver, a standing badge sliver, a
     die face, and the win/lose payoff pill. */
  function glyphMdp() {
    const die = window.Die ? '' : '';   // built live below
    return (
      '<div class="sc12-mdp-strip">' +
        '<div class="sc12-mdp-tile"><div class="sc12-mini-meter">' +
          chipStack(3) + '</div><div class="sc12-tile-cap">' + T('vocab.pot') + '</div></div>' +
        '<div class="sc12-mdp-tile"><div class="sc12-mini-stand sc12-stand-ahead">' +
          '<span class="sc12-mini-bar sc12-mini-bar-you"></span>' +
          '<span class="sc12-mini-bar sc12-mini-bar-riv"></span>' +
        '</div><div class="sc12-tile-cap">' + T('vocab.standing') + '</div></div>' +
        '<div class="sc12-mdp-tile"><div class="sc12-mdp-die"></div>' +
          '<div class="sc12-tile-cap">' + T('vocab.die') + '</div></div>' +
        '<div class="sc12-mdp-tile"><div class="sc12-mdp-payoff">+1 / 0</div>' +
          '<div class="sc12-tile-cap">' + T('vocab.win') + '/' + T('vocab.lose') + '</div></div>' +
      '</div>'
    );
  }

  /* POLICY - a 2x2 of cells, one lever each: a flat naive seam vs the cells
     that read the scoreboard. Two ROLL (orange), two HOLD (blue). */
  function glyphPolicy() {
    function cell(kind) {
      const lab = kind === 'roll' ? T('vocab.roll') : T('vocab.hold');
      return '<div class="sc12-pol-cell sc12-cell-' + kind + '">' + lab + '</div>';
    }
    return (
      '<div class="sc12-pol-grid">' +
        cell('hold') + cell('hold') +
        cell('roll') + cell('roll') +
      '</div>'
    );
  }

  /* RETURN - the win/lose-from-here tape: a few 0-reward steps then a
     terminal +1. Uses the same return-tape language as the trajectory. */
  function glyphReturn() {
    function step(lever, kind, r) {
      const lab = lever ? '<span class="pyl-tape-lever">' + lever + '</span>' : '';
      return '<span class="pyl-tape-step ' + kind + '">' + lab +
             '<span class="pyl-tape-r">' + r + '</span></span>';
    }
    return (
      '<div class="pyl-return-tape sc12-rtn-tape">' +
        step(T('vocab.roll'), 'pyl-tape-roll', '0') +
        step(T('vocab.hold'), 'pyl-tape-hold', '0') +
        step(T('vocab.roll'), 'pyl-tape-roll', '0') +
        step(T('vocab.win'), 'pyl-tape-terminal', '+1') +
      '</div>' +
      '<div class="sc12-rtn-eq">G = 0 + 0 + 0 + 1 = 1</div>'
    );
  }

  /* Q* - the headline twist in two rows at the SAME pot (18): BEHIND rolls,
     AHEAD holds. Numbers come from window.DATA.twist (never hand-typed). */
  function glyphQstar() {
    const tw = (window.DATA && window.DATA.twist && window.DATA.twist.pot18) || null;
    function row(standKey, standClass, best) {
      const e = tw ? tw[standKey] : null;
      const roll = e ? e.roll.toFixed(2) : '.';
      const hold = e ? e.hold.toFixed(2) : '.';
      const bestRoll = best === 'roll';
      return (
        '<div class="sc12-q-row">' +
          '<span class="sc12-q-stand ' + standClass + '">' + T('vocab.' + standKey) + '</span>' +
          '<span class="sc12-q-lever sc12-q-roll' + (bestRoll ? ' sc12-q-best' : '') + '">' +
            (bestRoll ? '▶ ' : '') + T('vocab.roll') + ' ' + roll + '</span>' +
          '<span class="sc12-q-lever sc12-q-hold' + (!bestRoll ? ' sc12-q-best' : '') + '">' +
            (!bestRoll ? '▶ ' : '') + T('vocab.hold') + ' ' + hold + '</span>' +
        '</div>'
      );
    }
    return (
      '<div class="sc12-q-wrap">' +
        '<div class="sc12-q-pot">' + T('vocab.pot') + ' 18</div>' +
        row('behind', 'sc12-stand-behind', 'roll') +
        row('ahead', 'sc12-stand-ahead', 'hold') +
      '</div>'
    );
  }

  /* DP - the climbing staircase in miniature: 3 columns x 3 rows showing the
     ROLL (orange) / HOLD (blue) seam that steps up from AHEAD to BEHIND. */
  function glyphDp() {
    /* Rows top->bottom = high pot -> low pot; the HOLD region reaches lower
       in the AHEAD column (right) than in BEHIND (left): a climbing seam. */
    const seam = [
      ['hold', 'hold', 'hold'],   // high pot: all hold
      ['roll', 'hold', 'hold'],   // mid pot: behind still rolls
      ['roll', 'roll', 'hold'],   // lower pot: only ahead holds
    ];
    let cells = '';
    for (let r = 0; r < 3; r++)
      for (let s = 0; s < 3; s++)
        cells += '<div class="sc12-dp-cell sc12-cell-' + seam[r][s] + '"></div>';
    return (
      '<div class="sc12-dp-wrap">' +
        '<div class="sc12-dp-cols">' +
          '<span class="sc12-stand-behind">' + T('vocab.behind') + '</span>' +
          '<span class="sc12-stand-even">' + T('vocab.even') + '</span>' +
          '<span class="sc12-stand-ahead">' + T('vocab.ahead') + '</span>' +
        '</div>' +
        '<div class="sc12-dp-grid">' + cells + '</div>' +
      '</div>'
    );
  }

  /* SARSA - the tuple + the one-sample update, in the table voice. */
  function glyphSarsa() {
    const tex = (window.DATA && window.DATA.tex && window.DATA.tex.sarsa) || null;
    return (
      '<div class="sc12-sarsa-tape">' +
        '<span class="sc12-sarsa-chip k-s">s</span>' +
        '<span class="sc12-sarsa-chip k-a">a</span>' +
        '<span class="sc12-sarsa-chip k-r">r</span>' +
        '<span class="sc12-sarsa-chip k-s">s′</span>' +
        '<span class="sc12-sarsa-chip k-a">a′</span>' +
      '</div>' +
      '<div class="sc12-sarsa-update"></div>'
    );
  }

  /* A glowing chip stack of `n` lit rows (mini pot meter), top row danger. */
  function chipStack(n) {
    let s = '';
    for (let b = 5; b >= 1; b--) {
      const lit = b <= n ? ' on' : '';
      const danger = b >= 5 ? ' danger' : '';
      s += '<span class="sc12-chip' + lit + danger + '"></span>';
    }
    return s;
  }

  /* ============================== build ============================== */

  function isFirstVisitEver() {
    try { return !localStorage.getItem('pyl.sc12-recap-seen'); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem('pyl.sc12-recap-seen', '1'); } catch (_e) {}
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  window.scenes.scene12 = function (root) {
    root.classList.add('scene-pad', 'sc12-scene');
    root.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'sc12-banner';
    banner.innerHTML = '<span class="sc12-star">★</span> ' + T('scene12.banner') +
                       ' <span class="sc12-star">★</span>';
    root.appendChild(banner);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc12-sub';
    sub.textContent = T('scene12.sub');
    root.appendChild(sub);

    const grid = document.createElement('div');
    grid.className = 'sc12-grid';
    root.appendChild(grid);

    CONCEPTS.forEach((c, i) => {
      const box = document.createElement('div');
      box.className = 'poke-box sc12-card sc12-card-' + c.key;
      box.style.setProperty('--i', String(i));

      const head = document.createElement('div');
      head.className = 'sc12-card-head';
      head.innerHTML =
        '<div class="sc12-badge sc12-badge-' + c.key + '">' +
          '<span class="sc12-badge-mark">★</span>' +
          '<span class="sc12-badge-label">' + c.label + '</span>' +
        '</div>' +
        '<div class="sc12-card-title">' + cardTitle(c) + '</div>';
      box.appendChild(head);

      const vis = document.createElement('div');
      vis.className = 'sc12-card-visual sc12-vis-' + c.key;
      vis.innerHTML = c.glyph();
      box.appendChild(vis);

      const gcap = glyphCap(c);
      if (gcap) {
        const gc = document.createElement('div');
        gc.className = 'sc12-glyph-cap';
        gc.textContent = gcap;
        box.appendChild(gc);
      }

      const txt = document.createElement('div');
      txt.className = 'sc12-card-text';
      txt.textContent = cardText(c);
      box.appendChild(txt);

      const ref = document.createElement('div');
      ref.className = 'sc12-card-ref';
      ref.textContent = T('scene12.seescene', { n: c.scene });
      box.appendChild(ref);

      grid.appendChild(box);
    });

    /* Render the live bits that need widgets / KaTeX after the cards exist. */
    renderLiveGlyphs(root);

    const closing = document.createElement('div');
    closing.className = 'sc12-closing';
    closing.textContent = T('scene12.closing');
    root.appendChild(closing);

    function playFanfare() {
      setTimeout(() => { if (window.SFX && window.SFX.play) window.SFX.play('win'); }, 200);
    }
    const firstEver = isFirstVisitEver();
    if (firstEver) markSeen();
    playFanfare();

    return {
      onEnter() { playFanfare(); },
    };
  };

  /* Mount the die face in the MDP glyph + render the SARSA KaTeX. Done after
     the card DOM is in place so the hosts exist. */
  function renderLiveGlyphs(root) {
    const dieHost = root.querySelector('.sc12-mdp-die');
    if (dieHost && window.Die) {
      const d = window.Die.mount(dieHost, { rng: Math.random });
      d.show(5);
    }
    const upd = root.querySelector('.sc12-sarsa-update');
    if (upd) {
      const tex = (window.DATA && window.DATA.tex && window.DATA.tex.sarsa) || null;
      if (tex && window.katex) {
        try { window.katex.render(tex, upd, { throwOnError: false, displayMode: true }); }
        catch (_e) { upd.textContent = 'q[s,a] += a (r + q[s′,a′] - q[s,a])'; }
      } else {
        upd.textContent = 'q[s,a] += a (r + q[s′,a′] - q[s,a])';
      }
    }
  }
})();
