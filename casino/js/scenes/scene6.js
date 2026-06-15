/* Scene 6, Recap.

   Five idea-cards (mirrors anymal-mdp's recap pattern):
     explore  · exploit  · cumulative regret  · ε-greedy  · decaying ε (muted)

   Below: the five slot-machine cards from scene 0 with a "reveal true means"
   toggle. Default OFF, the lesson's mystery survives the recap. Lecturer
   can flip it mid-lecture.

   At the bottom: a single foreshadow line bridging to the next viz:
     "In Casino, one state. In Spooky House, many states.
      The empirical mean grows up into a value function." */

(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene6 = function (root) {
    const cfg   = window.DATA && window.DATA.bandit;
    const recap = window.DATA && window.DATA.recap;

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's6-wrap';
    root.appendChild(wrap);

    /* Header */
    const hero = document.createElement('div');
    hero.className = 'hero';
    hero.innerHTML =
      '<h1>What you carry forward.</h1>' +
      '<p class="subtitle">Five ideas, and a hint of what comes next.</p>';
    wrap.appendChild(hero);

    /* Five recap cards */
    const cardsRow = document.createElement('div');
    cardsRow.className = 's6-recap-row';
    wrap.appendChild(cardsRow);

    for (const item of recap) {
      const card = document.createElement('div');
      card.className = 's6-recap-card' + (item.muted ? ' muted' : '');

      const sym = document.createElement('div');
      sym.className = 's6-recap-sym';
      sym.appendChild(Katex.inline(item.sym));
      card.appendChild(sym);

      const name = document.createElement('div');
      name.className = 's6-recap-name';
      name.textContent = item.name;
      card.appendChild(name);

      const cap = document.createElement('div');
      cap.className = 's6-recap-caption';
      cap.textContent = item.caption;
      card.appendChild(cap);

      cardsRow.appendChild(card);
    }

    /* Reveal-true-means section */
    const revealSec = document.createElement('div');
    revealSec.className = 's6-reveal';
    wrap.appendChild(revealSec);

    const revealLabel = document.createElement('div');
    revealLabel.className = 's6-reveal-label';
    revealLabel.textContent = 'You played without ever knowing the truth.';
    revealSec.appendChild(revealLabel);

    const rowHost = document.createElement('div');
    revealSec.appendChild(rowHost);
    const row = MachineRow.mount(rowHost, {
      K: cfg.K,
      armNames: cfg.armNames,
      trueProbs: cfg.probs,
    });

    const revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.className = 's6-reveal-btn';
    revealBtn.textContent = 'Reveal true probabilities';
    revealBtn.addEventListener('click', () => {
      const next = !rowHost.classList.contains('revealed');
      row.setRevealed(next);
      revealBtn.textContent = next ? 'Hide true probabilities' : 'Reveal true probabilities';
      if (next) {
        const opt = cfg.optimalArm + 1;
        revealLabel.textContent = 'Machine ' + opt + ' was best (μ* = ' + cfg.probs[cfg.optimalArm].toFixed(2) + ').';
      } else {
        revealLabel.textContent = 'You played without ever knowing the truth.';
      }
    });
    revealSec.appendChild(revealBtn);

    /* `&reveal` URL flag triggers the reveal toggle for headless verification.
       Dev affordance only; the canonical interaction stays the click. */
    if (/[#&?]reveal\b/.test(window.location.hash)) {
      setTimeout(() => revealBtn.click(), 100);
    }

    /* Foreshadow line */
    const foreshadow = document.createElement('p');
    foreshadow.className = 's6-foreshadow';
    foreshadow.textContent =
      'In Casino, one state. In Spooky House, many states. The empirical mean grows up into a value function.';
    wrap.appendChild(foreshadow);

    return {};
  };
})();
