/* Speaker notes for each scene — instructor-facing crib sheet that
 * pops up in a corner overlay on the `n` hotkey.  Notes are written
 * for a lecturer at a podium: bullet-point what to say, what to
 * pause on, common student traps, and a hook to the next scene.
 *
 * Keys MUST match window.scenes / SCENES[i].key in main.js.  Edit
 * the strings here without touching main.js.
 */
(function () {
  const NOTES = {

    'scene0':
      '<h3>Scene 0 — Title</h3>' +
      '<ul>' +
        '<li>Welcome the class.  This viz covers MDPs, Q*, DP, and SARSA in 11 scenes.</li>' +
        '<li>Prerequisites: comfort with probability and basic optimisation.  No deep-RL exposure needed.</li>' +
        '<li>Press →  or NEXT to start.  <kbd>n</kbd> opens / closes these notes anywhere.</li>' +
      '</ul>',

    'sceneHowToPlay':
      '<h3>Scene 1 — Tutorial</h3>' +
      '<ul>' +
        '<li>Six-step Gen-1 Pokemon refresher.  Skip if students are already familiar — the SKIP TUTORIAL button jumps to the battle.</li>' +
        '<li>The dialog box uses a typewriter reveal; press <kbd>↓</kbd> to fast-fill if you\'re reading aloud.</li>' +
        '<li>This scene exists to make the bucketed HP feel natural before we name it.</li>' +
      '</ul>',

    'scene1':
      '<h3>Scene 2 — A wild CHARMANDER appeared!</h3>' +
      '<ul>' +
        '<li>Let students play a few turns themselves.  Point: <b>they are the policy</b>.  Each click is one action.</li>' +
        '<li>Bucketed HP (5 levels) is the state abstraction.  25 non-terminal states + WIN/LOSS sinks.</li>' +
        '<li>Watch THUNDER miss — that\'s the probabilistic transition surfacing on cue.</li>' +
        '<li>The dialog cascade is deliberately slow.  If you\'re short on time, pre-click through it during a question.</li>' +
      '</ul>',

    'sceneMdpOverlay':
      '<h3>Scene 3 — What makes this an MDP?</h3>' +
      '<ul>' +
        '<li>Four-step ladder: <b>state, action, transition function</b>.  Reward is folded into P\'s output.</li>' +
        '<li>State = pair of HP integers.  No hidden state.  Markov property holds.</li>' +
        '<li>If a student asks "is real Pokemon Markov?" — say <i>mostly</i>; sleep counters, paralysis, items break it, but our abstraction is clean.</li>' +
        '<li>P is a probability distribution over (s′, r), not a function.  The notation P(s, a) → (s′, r) is loose.</li>' +
      '</ul>',

    'sceneTrajectory':
      '<h3>Scene 4 — The trajectory</h3>' +
      '<ul>' +
        '<li>Define τ = (s₁, a₁, r₁, s₂, a₂, r₂, …) as the sequence the agent observes.</li>' +
        '<li>NEXT TURN samples one (s, a, r) tuple; PLAY auto-plays until terminal.</li>' +
        '<li>Stress: τ is a <b>random variable</b>.  Two rollouts from the same start can differ.</li>' +
      '</ul>',

    'sceneObjective':
      '<h3>Scene 5 — Return & Q*</h3>' +
      '<ul>' +
        '<li>G<sub>i</sub>(τ) is the sum of rewards from step i to the terminal.  Click any r<sub>t</sub> to recompute the partial return.</li>' +
        '<li>Q*(s, a) is the <b>expected G</b> when you take a in s and play optimally thereafter.  Note the max<sub>π</sub> in the formula.</li>' +
        '<li>If a student is advanced: G is a random variable; Q* is its conditional expectation under the optimal policy.</li>' +
        '<li>The whole curriculum is about finding Q*.  DP is one way; SARSA is the other.</li>' +
      '</ul>',

    'sceneQstar':
      '<h3>Scene 6 — π* from Q*</h3>' +
      '<ul>' +
        '<li>Once you have Q*, optimal play is trivial: argmax over actions.</li>' +
        '<li>The demo battle below plays out automatically with π*.  Pikachu always picks the argmax move.</li>' +
        '<li>Closing question: "BUT HOW DO WE COMPUTE Q*?" — bridges to scene 7 (DP) and scene 9 (SARSA).</li>' +
      '</ul>',

    'sceneDp':
      '<h3>Scene 7 — Filling Q with DP</h3>' +
      '<ul>' +
        '<li>Bellman optimality equation, in expectation form: Q*(s, a) = E[R + max<sub>a′</sub> Q*(S′, a′) | s, a].</li>' +
        '<li>Click STEP to fill one cell per phase.  RUN ALL converges.  Side panel shows the arithmetic for the current cell.</li>' +
        '<li>The cheat: <b>we know P here</b>.  We hand-wrote the transition table.  That\'s why DP works — and why it doesn\'t scale (see next scene).</li>' +
        '<li>The DP sweep is a contraction mapping.  Sweep to a fixed point.</li>' +
      '</ul>',

    'sceneWhyNotDp':
      '<h3>Scene 8 — Why DP doesn\'t scale</h3>' +
      '<ul>' +
        '<li>Two reasons:</li>' +
        '<li>(1) <b>We don\'t know P.</b>  In the wild — real game, real robot — you only get samples, never the transition table.</li>' +
        '<li>(2) <b>Scale.</b>  Pokemon Gen-1 has ~10¹⁵ visible states; Go has ~10¹⁷⁰ positions.  DP\'s sweep is hopeless.</li>' +
        '<li>Bridge: we need a sample-based method.  That\'s SARSA.</li>' +
      '</ul>',

    'sceneSarsaDerive':
      '<h3>Scene 9 — Deriving SARSA</h3>' +
      '<ul>' +
        '<li>Eight-step pager: <b>A → B → D → E1 → E2 → E3 → E4 → F</b>.</li>' +
        '<li>A-D: setup.  We don\'t have P; we play; we get tuples.</li>' +
        '<li>E1: replace expectation with one sample.  <i>Subtle</i>: with A′ from the ε-greedy policy this is technically Qᵖⁱ, not Q*.  As ε → 0 it converges to Q*.  This is what makes SARSA <b>on-policy</b>.</li>' +
        '<li>E2: name the target.  E3: two cases, nudge up or down.  E4: collapse.  The α(target − q) operator already carries the sign.</li>' +
        '<li>F: live demo.  PLAY auto-advances at the speed-slider cadence; REROLL keeps q; CLEAR q resets.  α is fixed at 0.20.</li>' +
        '<li>If a student asks "what about off-policy?" — that\'s Q-learning: replace q[s′, a′] with max<sub>a′</sub> q[s′, a′].  One line.</li>' +
      '</ul>',

    'scene5':
      '<h3>Scene 10 — Hall of Fame (recap)</h3>' +
      '<ul>' +
        '<li>Six cards: one per core concept (MDP, ε-greedy, Bellman, Robbins–Monro, SARSA, snakes-and-ladders cousin).</li>' +
        '<li>Each card cites the related scene and the cross-viz reference if your course uses prior modules.</li>' +
        '<li>Closer: scale up the same five pieces and you get real-world deep RL.</li>' +
        '<li>Open Q&amp;A.  Common questions: function approximation? off-policy? continuous actions?  All point to deep-RL follow-ups.</li>' +
      '</ul>',
  };

  function getNotes(sceneKey) { return NOTES[sceneKey] || ''; }

  window.SpeakerNotes = { getNotes };
})();
