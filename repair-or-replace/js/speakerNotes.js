/* Speaker notes for each scene: an instructor-facing crib sheet that
 * pops up in a corner overlay on the `n` hotkey. Notes are written for
 * a lecturer at a podium: what to say, what to pause on, common student
 * traps, and a hook to the next scene. English-only (this viz ships
 * without the siblings' i18n layer); keys MUST match SCENES[i].key in
 * main.js. */
(function () {
  const NOTES = {
    scene0:
      '<ul>' +
      '<li>Set the frame in one line: one delivery van, one decision every week.</li>' +
      '<li>Everyone in the room has lived "repair or replace" with a car, a laptop, a printer.</li>' +
      '<li>Promise the punchline: by the end, the math will tell us to scrap a van that still starts every morning.</li>' +
      '</ul>',
    scene1:
      '<ul>' +
      '<li>Three calls, cheap to expensive: RUN earns, SERVICE costs 50, REPLACE costs 130.</li>' +
      '<li>Pause on the breakdown row: the odds spike from 8% to 28% between WORN and SHAKY. That cliff drives everything.</li>' +
      '<li>Also flag the profit cliff 72 to 40. Two cliffs, same place.</li>' +
      '<li>Do NOT discuss what is optimal yet; that is the whole point of the next scenes.</li>' +
      '</ul>',
    scene2:
      '<ul>' +
      '<li>Let a student call the shots for 8 to 10 weeks. Cheer the breakdowns.</li>' +
      '<li>Trap to surface: people patch FAILING vans forever. Note it out loud, settle it later with Q*.</li>' +
      '<li>Ask after a breakdown: was that bad luck, or a bad decision? Park the question.</li>' +
      '</ul>',
    scene3:
      '<ul>' +
      '<li>Name the four pieces on screen: state, action, transition odds, reward.</li>' +
      '<li>Stress that the state is tiny on purpose: four wear levels are enough for a real dilemma.</li>' +
      '<li>gamma appears here as "how much next week counts". The slider scene makes it visceral later.</li>' +
      '</ul>',
    scene4:
      '<ul>' +
      '<li>A policy is a standing order: one action per wear level, written before the week starts.</li>' +
      '<li>Have the room vote on a playbook cell by cell before showing anything.</li>' +
      '<li>Key sentence: the policy is a MAP from state to action, not a single favourite action.</li>' +
      '</ul>',
    scene5:
      '<ul>' +
      '<li>Walk the six-week tape slowly: see the state, pick the action, get paid, land somewhere.</li>' +
      '<li>Point at the REPLACE step: the tape pays -130 now to buy better weeks later.</li>' +
      '<li>This run shows all three actions. That is deliberate: the playbook changes its mind with the state.</li>' +
      '</ul>',
    scene6:
      '<ul>' +
      '<li>Return = the discounted sum over every week ahead. gamma is the patience dial.</li>' +
      '<li>Drive the slider live: at 0.4 the owner never scraps; from 0.8 the van goes while it still runs.</li>' +
      '<li>Headline: BOTH frontiers slide left as patience rises. Short-termists run it into the ground.</li>' +
      '</ul>',
    scene7:
      '<ul>' +
      '<li>Twelve cells, the whole problem. Read row by row: the argmax changes three times.</li>' +
      '<li>The surprise: REPLACE wins at SHAKY by +23 although the van still runs. FAILING sits visibly below it.</li>' +
      '<li>Also point at RUN-at-FAILING = -3.1: driving a dead van LOSES money on average.</li>' +
      '</ul>',
    scene8:
      '<ul>' +
      '<li>One recursion, twelve numbers: this week’s money plus gamma times the best next cell.</li>' +
      '<li>Walk ONE cell by hand (WORN, SERVICE) so the expectation is concrete.</li>' +
      '<li>The equation is a consistency check, not an algorithm yet. DP turns it into one next.</li>' +
      '</ul>',
    scene9:
      '<ul>' +
      '<li>Value iteration: start at zero, sweep the backup, watch the bands lock in by sweep 2 to 3.</li>' +
      '<li>Decimals keep polishing long after the POLICY is already final. Decisions converge before values.</li>' +
      '<li>Stress the price of admission: DP needed the printed odds.</li>' +
      '</ul>',
    scene10:
      '<ul>' +
      '<li>Real fleets: odometer, age, weeks-since-service, load, times 40 vans. The table explodes.</li>' +
      '<li>And nobody hands you breakdown odds; the maintenance manual is not a probability table.</li>' +
      '<li>Bridge: what if we could fill the scorecard from the logbook alone?</li>' +
      '</ul>',
    scene11:
      '<ul>' +
      '<li>SARSA: drive, get billed, nudge the cell. No model of the odds anywhere.</li>' +
      '<li>Slow the speed down early; let the room watch one update land on one cell.</li>' +
      '<li>Endpoint: the SAME three bands emerge from experience. Compare with the DP table side by side.</li>' +
      '</ul>',
    scene12:
      '<ul>' +
      '<li>Six cards, one breath each. The van story is the curriculum in miniature.</li>' +
      '<li>Last word: the surprising move (scrap a running van) was not a vibe, it was arithmetic.</li>' +
      '</ul>',
  };

  function getNotes(sceneKey) {
    return NOTES[sceneKey] || '';
  }

  window.SpeakerNotes = { getNotes };
})();
