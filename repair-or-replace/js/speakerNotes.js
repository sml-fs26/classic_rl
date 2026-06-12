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
      '<li>Nine clicks, one idea each: Bessie and her wear; RUN pays by wear; every RUN risks a breakdown; a breakdown costs the tow (-280) and dumps her to FAILING; the two cliffs; SERVICE costs 50 and the week; what the shop actually does; REPLACE; your call, every week.</li>' +
      '<li>Pause on the two-cliffs click: profit 72 to 40 AND odds 8% to 28%, between the same two states. That cliff drives everything.</li>' +
      '<li>The shop is strong on a WORN van (fixed 95%), weak past that. Let the staggered lines land before speaking.</li>' +
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
      '<li>The board starts EMPTY and builds one MDP part per click. Before each click, ask the room what the next letter should mean for the van.</li>' +
      '<li>S: the gauge chips (the reading is the whole state, no history). A: the three calls. P in two beats: gray drift arrows, then the orange breakdown arcs with printed odds 2/8/28/55. R: the money chips. gamma: the shrinking coin stacks x1.00, x0.90, x0.81.</li>' +
      '<li>Final click: the tuple flashes complete; only now name it a Markov decision process.</li>' +
      '<li>The RUN-at-WORN worked example moved out; the Bellman scene does that cell by cell.</li>' +
      '</ul>',
    scene4:
      '<ul>' +
      '<li>Build the playbook live, one row at a time. At the empty card, ask the room what HEALTHY should get before clicking.</li>' +
      '<li>Full card = a policy; completeness is the definition, not cleverness. Stress the Monday lookup beat: zero thought on Monday; click the gauge to redo it from another wear level.</li>' +
      '<li>Only after the lookup name the map pi : S -> A. Then flip seeds (Nervous Owner), count to 81, and leave "which of the 81 is best?" hanging.</li>' +
      '<li>Neither seed is optimal and the optimal map is never shown here.</li>' +
      '</ul>',
    scene5:
      '<ul>' +
      '<li>Walk the six-week tape slowly: see the state, pick the action, get paid, land somewhere.</li>' +
      '<li>Point at the REPLACE step: the tape pays -130 now to buy better weeks later.</li>' +
      '<li>This run shows all three actions. That is deliberate: the playbook changes its mind with the state.</li>' +
      '</ul>',
    scene6:
      '<ul>' +
      '<li>Six clicks, one idea each: the tape, the raw sum +177, the gamma weights (each week counts 0.9 of the one before; see the decay curve), money times weight, the gather into G = 166.68, and only then the formula.</li>' +
      '<li>Point out that G, not the raw sum, is the number a playbook gets scored by.</li>' +
      '<li>Tease: next we turn gamma itself.</li>' +
      '</ul>',
    scene13:
      '<ul>' +
      '<li>The patience dial gamma owns this scene. The sweep click rides gamma 0.00 to 0.90: the best-call strip re-tints and BOTH frontiers (RUN|SVC and SVC|NEW) slide left, toward healthier vans.</li>' +
      '<li>The SHAKY row in numbers at gamma 0.90: RUN +96.5, SVC +126.4, NEW +149.9. A patient owner scraps a van that still starts.</li>' +
      '<li>Then hand the dial to a student: impatient owners patch forever; patient owners shop sooner, scrap sooner.</li>' +
      '</ul>',
    scene7:
      '<ul>' +
      '<li>Build the table BEFORE naming it. The empty scorecard asks the only question: one number per call per state, long-run discounted money.</li>' +
      '<li>Row by row: HEALTHY, drive her; WORN, the shop already wins; SHAKY is the headline (she still starts, yet scrapping beats the shop by +23.5); FAILING confirms replace-before-dead, and RUN there is negative.</li>' +
      '<li>The bands column reads the policy straight off the stars. Only then show the formal Q* line; G is the return the students built.</li>' +
      '</ul>',
    scene8:
      '<ul>' +
      '<li>One cell, checked by hand: Q*(WORN, SVC) = 226.1. Play the call one week deep: pay 50; 0.05 stay WORN, 0.95 land HEALTHY (0.70 + 0.25 both cap there).</li>' +
      '<li>Substitute: each V is the best Q in its row, so V(WORN) = 226.1 and V(HEALTHY) = 311.0 come off the same table.</li>' +
      '<li>The cascade lands one line per click: 11.31, 295.45, 306.76, 276.08, 226.08, which rounds to the cell we picked.</li>' +
      '<li>Close on the catch: the V values are answers from the table we are defining. 12 equations, 12 unknowns: you iterate, not solve. RUN THE CHECK advances one step, same as NEXT.</li>' +
      '</ul>',
    scene9:
      '<ul>' +
      '<li>Press NEXT slowly; the chain is: blank sheet, ONE cell backed up by hand (SVC at WORN: -50 + 0.9 x next-week zeros), then the other 11 cells do the same all at once, then sweep 2, the lock, the fixed point.</li>' +
      '<li>That simultaneity IS dynamic programming. Note the V chips literally equal the starred cells.</li>' +
      '<li>Decimals keep polishing long after the POLICY is final. Decisions converge before values.</li>' +
      '<li>Stress the price of admission: every backup used the printed odds.</li>' +
      '</ul>',
    scene10:
      '<ul>' +
      '<li>Real fleets: odometer, age, weeks-since-service, load, times 40 vans. The table explodes.</li>' +
      '<li>And nobody hands you breakdown odds; the maintenance manual is not a probability table.</li>' +
      '<li>Bridge: what if we could fill the scorecard from the logbook alone?</li>' +
      '</ul>',
    scene11:
      '<ul>' +
      '<li>One played week becomes one logbook line; SARSA never sees the printed odds, only this line.</li>' +
      '<li>The line prices the cell: target = r + 0.9 x q[s\', a\'] = 106.2. The surprise is the TD error +64.0. Move only alpha = 0.15 of the way: +9.6, so 42.2 becomes 51.8.</li>' +
      '<li>The whole algorithm is that one line; every term keeps its chip color. Numbers are a documented mid-learning snapshot.</li>' +
      '</ul>',
    scene14:
      '<ul>' +
      '<li>Start bare: van, empty scorecard, DRIVE. The first week earns the logbook line, the live nudge and the money curve; the bands strip appears when the first row locks; the dials appear once driving.</li>' +
      '<li>SLOW narrates one update per week; TURBO folds 50. eps = exploration, alpha = step size.</li>' +
      '<li>Endpoint: after a few thousand weeks the three bands match the DP answer, with no odds given.</li>' +
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
