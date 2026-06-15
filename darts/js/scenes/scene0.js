/* Scene 0, title manifesto: "Aim in the dark."

   First contact. The student sees the game's setup in one screen, before
   any keystroke. A single horizontal track at the top with the player
   marker; the bullseye is NOT shown (we are, after all, in the dark).
   Below: a short prose lede that names the curriculum bridge ("Spooky
   House had exact rewards. Darts has noisy ones.") and the rules of the
   game in three bullets.

   No interactive elements. No internal step engine. Cold-entry safe, the
   only DATA fields touched are tex.score (rendered as the score formula). */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene0 = function (root) {
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's0-wrap';

    /* Hero */
    const hero = document.createElement('div');
    hero.className = 'hero';

    const h1 = document.createElement('h1');
    h1.className = 's0-title';
    h1.textContent = 'Aim in the dark.';
    hero.appendChild(h1);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = "You don't see the target. The score is noisy. The target oscillates around a fixed centre.";
    hero.appendChild(subtitle);

    wrap.appendChild(hero);

    /* The track itself, sized down a bit. Bullseye hidden. */
    const trackHost = document.createElement('div');
    trackHost.className = 's0-track-host';
    wrap.appendChild(trackHost);

    const track = window.Track.mount({
      host: trackHost,
      label: 'position (0 to 100)',
      showBullseye: false,
      showEstimate: false,
      showChips: false,
    });
    track.setPlayer(50);

    /* The lede. The Spooky-House continuity sentence is here, deliberately
       close to the title to do its bridge work early. */
    const lede = document.createElement('p');
    lede.className = 'lede s0-lede';
    lede.textContent =
      "Spooky House had exact rewards: every step paid a known, fixed cost. " +
      "Darts loosens that. Each throw lands a noisy score, and the bullseye " +
      "oscillates a little around a fixed centre. After T throws, where do you guess " +
      "the bullseye is?";
    wrap.appendChild(lede);

    /* Three rules of the game. */
    const rules = document.createElement('div');
    rules.className = 's0-rules';
    const rulesList = [
      ['1', 'A bullseye sits somewhere on the track. You can\'t see it.'],
      ['2', 'You throw a dart at a position you choose. A loudspeaker announces a noisy score.'],
      ['3', 'Between throws, the bullseye oscillates around a fixed centre.'],
    ];
    for (const [n, text] of rulesList) {
      const row = document.createElement('div');
      row.className = 's0-rule';
      const num = document.createElement('div');
      num.className = 's0-rule-num';
      num.textContent = n;
      const body = document.createElement('div');
      body.className = 's0-rule-body';
      body.textContent = text;
      row.appendChild(num);
      row.appendChild(body);
      rules.appendChild(row);
    }
    wrap.appendChild(rules);

    /* Score formula, so the student sees how scores are computed before
       they start throwing. */
    const scoreFormula = window.Katex.display(window.DATA.tex.score);
    scoreFormula.classList.add('s0-formula');
    wrap.appendChild(scoreFormula);

    const note = document.createElement('p');
    note.className = 's0-note';
    note.textContent = "Click forward to start throwing.";
    wrap.appendChild(note);

    root.appendChild(wrap);

    return {};
  };
})();
