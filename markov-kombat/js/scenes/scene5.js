/* Scene 5 — Kombat League: FLAWLESS POLICY.
 *
 * Six recap cards in MK-dialog-box style, one per prior viz (anymal,
 * casino, spooky, darts, sarsa-cliffwalk, snakes-ladders), each citing the
 * piece that became the corresponding part of this kombat. Closes with a
 * one-line where-this-goes-next caption.
 */
(function () {
  window.scenes = window.scenes || {};

  window.scenes.scene5 = function (root) {
    root.classList.add('scene-pad', 'sc5-scene');
    root.innerHTML = '';

    /* Kombat League victory banner — frames the scene as the post-
       tournament Hall of Fame screen. */
    const banner = document.createElement('div');
    banner.className = 'sc5-hof-banner';
    banner.innerHTML = '<span class="sc5-star">★</span> KOMBAT LEAGUE KHAMPION <span class="sc5-star">★</span>';
    root.appendChild(banner);

    const heading = document.createElement('h2');
    heading.className = 'poke-section-title sc5-heading';
    heading.textContent = "FLAWLESS POLICY.  SUB-OPTIMAL DEFEATED.";
    root.appendChild(heading);

    const sub = document.createElement('div');
    sub.className = 'poke-caption sc5-sub';
    sub.textContent =
      'The same RL ingredients drove anymal locomotion, the casino bandits, Spooky House cycles, Robbins-Monro darts, ' +
      'the cliff-walk capstone, and Snakes & Ladders.  Different skins.  One skeleton.';
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
      'Bigger fighting games scale the same skeleton.  Real competitive Mortal Kombat AI — ' +
      'frame-data lookup, matchup tables, neutral-game decisions — runs on the same MDP / Bellman / SARSA bones.  ' +
      'So do robots, recommender systems, and frontier RL agents.  You now know the bones.' +
      '</div>';
    root.appendChild(closer);

    const footnote = document.createElement('div');
    footnote.className = 'footnote';
    footnote.innerHTML = 'Press <kbd>PREV</kbd> or left-arrow to revisit the SARSA derivation.';
    root.appendChild(footnote);

    /* Victory fanfare — 4-note ascending arpeggio. Defer so the
       sound lands while the cards are still animating in, not
       before the scene has rendered.  Plays on first build AND on
       revisits (onEnter). */
    function playFanfare() {
      setTimeout(() => {
        if (window.SFX && window.SFX.play) window.SFX.play('win');
      }, 180);
    }
    playFanfare();

    return {
      onEnter() { playFanfare(); },
    };
  };
})();
