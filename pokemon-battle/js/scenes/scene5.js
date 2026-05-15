/* Scene 5 — "You've trained PIKACHU."
 *
 * Six recap cards in Pokemon-dialog-box style, one per prior viz (anymal,
 * casino, spooky, darts, sarsa-cliffwalk, snakes-ladders), each citing the
 * piece that became the corresponding part of this battle. Closes with a
 * one-line where-this-goes-next caption.
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

  function fmtDate(ts) {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      }).toUpperCase();
    } catch (_e) { return '—'; }
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
    const name = (window.Trainer && window.Trainer.getName()) || 'TRAINER';
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
          '<div class="sc5-tc-badge-date">' + (ts ? fmtDate(ts) : 'LOCKED') + '</div>' +
        '</div>'
      );
    }).join('');

    const isChampion = earned === TRAINER_BADGE_META.length;
    const title = name + ' — ' + (isChampion ? 'POKEMON CHAMPION' : 'TRAINER IN PROGRESS');
    const stats =
      '<b>' + earned + ' / ' + TRAINER_BADGE_META.length + '</b> badges' +
      (firstTs  ? ' · since <b>' + fmtDate(firstTs) + '</b>'  : '') +
      (isChampion && latestTs && latestTs !== firstTs
        ? ' · crowned <b>' + fmtDate(latestTs) + '</b>'
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

    /* Pokemon-League HALL OF FAME banner — sits above the trainer
       card.  Frames the scene as a victory screen. */
    const banner = document.createElement('div');
    banner.className = 'sc5-hof-banner';
    banner.innerHTML = '<span class="sc5-star">★</span> HALL OF FAME <span class="sc5-star">★</span>';
    root.appendChild(banner);

    /* Trainer card — name + badge row + lifetime stats.  Replaces
       the static "YOU'VE TRAINED PIKACHU." heading so the page
       speaks to *this* student. */
    const tc = document.createElement('div');
    tc.className = 'sc5-trainer-card-host';
    tc.innerHTML = renderTrainerCard();
    root.appendChild(tc);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc5-sub';
    sub.textContent =
      'The five RL pieces are the same five pieces that fit Snakes & Ladders. Two cultural artefacts, one curriculum.';
    root.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'sc5-grid';
    root.appendChild(wrap);

    let cardIdx = 0;
    for (const card of window.DATA.recap) {
      const box = document.createElement('div');
      box.className = 'poke-box sc5-card';
      box.style.setProperty('--i', String(cardIdx));
      cardIdx++;
      const hueChip = document.createElement('span');
      hueChip.className = 'hue-chip hue-' + card.hue;
      hueChip.textContent = card.from;
      box.appendChild(hueChip);
      const title = document.createElement('div');
      title.className = 'sc5-title';
      title.textContent = card.title;
      box.appendChild(title);
      const sym = document.createElement('div');
      sym.className = 'poke-formula sc5-formula';
      window.Katex.render(card.symbol, sym, true);
      box.appendChild(sym);
      const cap = document.createElement('div');
      cap.className = 'sc5-caption';
      cap.textContent = card.caption;
      box.appendChild(cap);
      const anchor = document.createElement('div');
      anchor.className = 'sc5-anchor';
      anchor.textContent = card.anchor;
      box.appendChild(anchor);
      wrap.appendChild(box);
    }

    const closer = document.createElement('div');
    closer.className = 'poke-box sc5-closer';
    closer.style.setProperty('--i', String(cardIdx));
    closer.innerHTML =
      '<span class="hue-chip hue-poke">WHERE THIS GOES NEXT</span>' +
      '<div class="sc5-closer-text">' +
      'Bigger problems scale the same five pieces. Real Pokemon AIs — type matching, team building, Z-Move selection — ' +
      'use the same MDP / Bellman / SARSA bones. So do robots, recommender systems, and game-playing agents at the ' +
      'frontier. You now know the bones.' +
      '</div>';
    root.appendChild(closer);

    const footnote = document.createElement('div');
    footnote.className = 'footnote';
    footnote.innerHTML = 'Press <kbd>PREV</kbd> or left-arrow to revisit the SARSA derivation.';
    root.appendChild(footnote);

    /* Victory fanfare — 4-note ascending arpeggio. Defer so the
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
        /* Second SFX hit a bit later — feels more ceremonial. */
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
