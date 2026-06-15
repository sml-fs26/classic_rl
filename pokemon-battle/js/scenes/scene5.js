/* Scene 5, "You've trained PIKACHU."
 *
 * Hall of Fame recap.  One card per badge (MDP, RETURN, Q*, DP, SARSA);
 * each card carries a distinctive Gen-1 styled glyph that recalls the
 * concept from earlier scenes, plus a short recap paragraph.  The page
 * speaks to *this* student via the trainer card above the recap row.
 */
(function () {
  window.scenes = window.scenes || {};

  /* Five concept badges + a synthetic CHAMPION pseudo-badge.  The
     CHAMPION row lights up only when all five core badges are
     earned.  Labels mirror the topbar.  Colours come from the
     concept-badge CSS classes. */
  const TRAINER_BADGE_META = [
    { key: 'mdp',    label: 'MDP'    },
    { key: 'return', label: 'RTN'    },
    { key: 'qstar',  label: 'Q*'     },
    { key: 'dp',     label: 'DP'     },
    { key: 'sarsa',  label: 'SAR'    },
  ];

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /*, Per-badge visual glyphs ----------
     Each builder returns an HTML string for the .sc5-card-visual slot.
     Glyphs are deliberately small (≤ ~150 px tall) and use Press Start
     2P + retro chips so they read as "miniature reminders" of the
     full visuals from earlier scenes, not as new content. */

  function visualMdp() {
    /* 4-tile strip: S / A / P / R. Each tile pairs the letter with a
       one-line concrete instance from this battle so the abstraction
       lands. */
    const tiles = [
      { letter: 'S', mini: 'HP × HP' },
      { letter: 'A', mini: 'QA / TB / TH' },
      { letter: 'P', mini: 'DAMAGE ROLL' },
      { letter: 'R', mini: '−1 / +10 / −10' },
    ];
    return (
      '<div class="sc5-mdp-strip">' +
        tiles.map(t =>
          '<div class="sc5-mdp-tile">' +
            '<div class="sc5-mdp-letter">' + t.letter + '</div>' +
            '<div class="sc5-mdp-mini">' + t.mini + '</div>' +
          '</div>'
        ).join('') +
      '</div>'
    );
  }

  function visualReturn() {
    /* Reward tape: −1 → −1 → −1 → +10  ⇒  G = +7.  Closes with the
       formal sum so students see the link between concrete and
       symbolic. */
    return (
      '<div class="sc5-rtn-tape">' +
        '<span class="sc5-rtn-r">−1</span>' +
        '<span class="sc5-rtn-arrow">→</span>' +
        '<span class="sc5-rtn-r">−1</span>' +
        '<span class="sc5-rtn-arrow">→</span>' +
        '<span class="sc5-rtn-r">−1</span>' +
        '<span class="sc5-rtn-arrow">→</span>' +
        '<span class="sc5-rtn-r sc5-rtn-final">+10</span>' +
        '<span class="sc5-rtn-sum">⇒ G = +7</span>' +
      '</div>' +
      '<div class="sc5-rtn-formula">G<sub>i</sub>(τ) = r<sub>i</sub> + r<sub>i+1</sub> + …</div>'
    );
  }

  function visualQstar() {
    /* Three action cells with one starred (the argmax).  Mirrors the
       per-state Q-row students saw in scene 6. */
    return (
      '<div class="sc5-qstar-row">' +
        '<div class="sc5-qstar-cell"><span class="sc5-qstar-name">QA</span><span class="sc5-qstar-val">+1.2</span></div>' +
        '<div class="sc5-qstar-cell sc5-qstar-best"><span class="sc5-qstar-name">TB</span><span class="sc5-qstar-val">+3.8 ★</span></div>' +
        '<div class="sc5-qstar-cell"><span class="sc5-qstar-name">TH</span><span class="sc5-qstar-val">+2.5</span></div>' +
      '</div>' +
      '<div class="sc5-qstar-formula">π*(s) = argmax<sub>a</sub> Q*(s, a)</div>'
    );
  }

  function visualDp() {
    /* Bellman expansion: a Q-cell branches into hit / miss children
       (echoes the per-cell breakdown table in scene 7). */
    return (
      '<div class="sc5-dp-root">Q*(s, a)</div>' +
      '<div class="sc5-dp-tree">' +
        '<div class="sc5-dp-branch">hit  →  r + Q*(s′, a′)</div>' +
        '<div class="sc5-dp-branch">miss →  r + Q*(s, a′)</div>' +
      '</div>'
    );
  }

  function visualSarsa() {
    /* The S-A-R-S-A tuple as five colored chips, followed by the
       SARSA update.  Echoes the trajectory tape + update line from
       scene 9 step F. */
    return (
      '<div class="sc5-sarsa-tape">' +
        '<span class="sc5-sarsa-chip k-s">s</span>' +
        '<span class="sc5-sarsa-chip k-a">a</span>' +
        '<span class="sc5-sarsa-chip k-r">r</span>' +
        '<span class="sc5-sarsa-chip k-s">s′</span>' +
        '<span class="sc5-sarsa-chip k-a">a′</span>' +
      '</div>' +
      '<div class="sc5-sarsa-update">q[s, a] += α (r + q[s′, a′] − q[s, a])</div>'
    );
  }

  function fmtDate(ts) {
    if (!ts) return T('recap.trainer.dash');
    try {
      const locale = (window.I18N && window.I18N.lang === 'jp') ? 'ja-JP' : undefined;
      return new Date(ts).toLocaleDateString(locale, {
        year: 'numeric', month: 'short', day: 'numeric'
      }).toUpperCase();
    } catch (_e) { return T('recap.trainer.dash'); }
  }

  function isHofFirstVisitEver() {
    try { return !localStorage.getItem('pokemon-battle.hof-first-visit-done'); } catch (_e) { return true; }
  }
  function markHofVisited() {
    try { localStorage.setItem('pokemon-battle.hof-first-visit-done', '1'); } catch (_e) {}
  }

  function spawnConfetti(scope) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'sc5-confetti-layer';
    const palette = ['var(--pikachu-yellow)', 'var(--pikachu-cheek)', 'var(--cb-blue)', 'var(--cb-bluish-green)', 'var(--cb-purple)', 'var(--cb-orange)'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('span');
      piece.className = 'sc5-confetti';
      piece.style.setProperty('--color', palette[i % palette.length]);
      piece.style.setProperty('--x',     (Math.random() * 100).toFixed(2) + '%');
      piece.style.setProperty('--delay', (Math.random() * 0.6).toFixed(2) + 's');
      piece.style.setProperty('--dur',   (1.4 + Math.random() * 1.4).toFixed(2) + 's');
      piece.style.setProperty('--rot',   (Math.random() * 1080 - 540).toFixed(0) + 'deg');
      piece.style.setProperty('--w',     (4 + Math.floor(Math.random() * 6)) + 'px');
      layer.appendChild(piece);
    }
    scope.appendChild(layer);
    setTimeout(() => { try { layer.remove(); } catch (_e) {} }, 3500);
  }

  function renderTrainerCard() {
    const name = (window.Trainer && window.Trainer.getName()) || T('recap.trainer.fallback');
    let earned = 0, firstTs = null, latestTs = null;
    const badgeHtml = TRAINER_BADGE_META.map((b) => {
      const ts = window.Trainer && window.Trainer.getBadgeTimestamp(b.key);
      if (ts) {
        earned++;
        if (!firstTs  || ts < firstTs)  firstTs  = ts;
        if (!latestTs || ts > latestTs) latestTs = ts;
      }
      return (
        '<div class="sc5-tc-badge ' + b.key + (ts ? ' earned' : ' missing') + '">' +
          '<div class="sc5-tc-badge-mark">' + (ts ? '★' : '·') + '</div>' +
          '<div class="sc5-tc-badge-label">' + b.label + '</div>' +
          '<div class="sc5-tc-badge-date">' + (ts ? fmtDate(ts) : T('recap.trainer.locked')) + '</div>' +
        '</div>'
      );
    }).join('');

    const isChampion = earned === TRAINER_BADGE_META.length;
    const titleSuffix = isChampion ? T('recap.trainer.champion') : T('recap.trainer.in_progress');
    const title = name + ', ' + titleSuffix;
    const stats =
      T('recap.trainer.stats_base', { earned: earned, total: TRAINER_BADGE_META.length }) +
      (firstTs  ? T('recap.trainer.stats_since', { date: fmtDate(firstTs) })  : '') +
      (isChampion && latestTs && latestTs !== firstTs
        ? T('recap.trainer.stats_crowned', { date: fmtDate(latestTs) })
        : '');

    return (
      '<div class="sc5-trainer-card' + (isChampion ? ' champion' : '') + '">' +
        '<img class="sc5-tc-pika" src="assets/pikachu-front.png" alt="PIKACHU"/>' +
        '<div class="sc5-tc-body">' +
          '<div class="sc5-tc-name">' + title + '</div>' +
          '<div class="sc5-tc-badges">' + badgeHtml + '</div>' +
          '<div class="sc5-tc-stats">' + stats + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  window.scenes.scene5 = function (root) {
    root.classList.add('scene-pad', 'sc5-scene');
    root.innerHTML = '';

    /* Pokemon-League HALL OF FAME banner, sits above the trainer
       card.  Frames the scene as a victory screen. */
    const banner = document.createElement('div');
    banner.className = 'sc5-hof-banner';
    banner.innerHTML = '<span class="sc5-star">★</span> ' + T('recap.hof') + ' <span class="sc5-star">★</span>';
    root.appendChild(banner);

    /* Trainer card, name + badge row + lifetime stats.  Replaces
       the static "YOU'VE TRAINED PIKACHU." heading so the page
       speaks to *this* student. */
    const tc = document.createElement('div');
    tc.className = 'sc5-trainer-card-host';
    tc.innerHTML = renderTrainerCard();
    root.appendChild(tc);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc5-sub';
    sub.textContent = T('recap.sub');
    root.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'sc5-grid';
    root.appendChild(wrap);

    /* Five badge recaps.  Each entry maps to a trainer-badge key
       (mdp, return, qstar, dp, sarsa) so the card header re-uses the
       same colour as the topbar pip, visual continuity between
       "you earned this" and "here is what it meant".  The visual()
       builder returns the distinctive glyph for that concept. */
    const BADGE_RECAPS = [
      { key: 'mdp',    label: TRAINER_BADGE_META[0].label, visual: visualMdp    },
      { key: 'return', label: TRAINER_BADGE_META[1].label, visual: visualReturn },
      { key: 'qstar',  label: TRAINER_BADGE_META[2].label, visual: visualQstar  },
      { key: 'dp',     label: TRAINER_BADGE_META[3].label, visual: visualDp     },
      { key: 'sarsa',  label: TRAINER_BADGE_META[4].label, visual: visualSarsa  },
    ];

    BADGE_RECAPS.forEach((b, i) => {
      const box = document.createElement('div');
      box.className = 'poke-box sc5-card sc5-card-' + b.key;
      box.style.setProperty('--i', String(i));

      const head = document.createElement('div');
      head.className = 'sc5-card-head';
      head.innerHTML =
        '<div class="sc5-card-badge ' + b.key + ' earned">' +
          '<span class="sc5-card-badge-mark">★</span>' +
          '<span class="sc5-card-badge-label">' + b.label + '</span>' +
        '</div>' +
        '<div class="sc5-card-title">' + T('recap.card.' + b.key + '.title') + '</div>';
      box.appendChild(head);

      const vis = document.createElement('div');
      vis.className = 'sc5-card-visual sc5-vis-' + b.key;
      vis.innerHTML = b.visual();
      box.appendChild(vis);

      const cap = document.createElement('div');
      cap.className = 'sc5-caption';
      cap.innerHTML = T('recap.card.' + b.key + '.text');
      box.appendChild(cap);

      wrap.appendChild(box);
    });

    const footnote = document.createElement('div');
    footnote.className = 'footnote';
    footnote.innerHTML = T('recap.footnote');
    root.appendChild(footnote);

    /* Victory fanfare, 4-note ascending arpeggio. Defer so the
       sound lands while the cards are still animating in, not
       before the scene has rendered.  Plays on first build AND on
       revisits (onEnter).  First-visit-ever (across all sessions)
       also fires confetti + a victory flash. */
    function playFanfare(firstEver) {
      setTimeout(() => {
        if (window.SFX && window.SFX.play) window.SFX.play('win');
      }, 180);
      if (firstEver) {
        setTimeout(() => spawnConfetti(root), 220);
        /* Second SFX hit a bit later, feels more ceremonial. */
        setTimeout(() => {
          if (window.SFX && window.SFX.play) window.SFX.play('win');
        }, 900);
        tc.classList.add('sc5-trainer-card-celebrate');
      }
    }

    const firstVisitEver = isHofFirstVisitEver();
    if (firstVisitEver) markHofVisited();
    playFanfare(firstVisitEver);

    return {
      onEnter() {
        /* Re-render in case more badges were awarded since last visit. */
        tc.innerHTML = renderTrainerCard();
        playFanfare(false);
      },
    };
  };
})();
