/* Simple i18n — English (default) + Japanese ("flavor mode").
 *
 *   Coverage: every user-visible string in the visualization flows
 *   through I18N.t() so the language toggle paints the whole page,
 *   not just the battle chrome. The concept-scene essays, tutorial
 *   dialog, DP/SARSA narration, recap, speaker notes, help overlay,
 *   trainer modal, HP-bucket labels, and HUD strip are all covered.
 *   The KaTeX-rendered formulas themselves stay in their pure
 *   mathematical form — symbols cross languages without ambiguity.
 *
 *   Japanese strings use Gen-1-era hiragana/katakana phrasing (no
 *   kanji) to match the on-screen font of the original GameBoy games.
 *   Where the canonical localisation has a fixed move/Pokemon name,
 *   that's what we use (10まんボルト, ピカチュウ, ヒトカゲ, etc.).
 *
 *   Public API:
 *     I18N.lang                    current 'en' | 'jp'
 *     I18N.t(key, vars)            lookup; {var} placeholders filled
 *     I18N.setLang(lang)           change + persist + notify subscribers
 *     I18N.onChange(callback)      subscribe (returns unsubscribe fn)
 *
 *   Subscribers do the work of re-rendering. main.js owns the
 *   scene-rebuild path; everyone else just re-paints their own labels.
 */
(function () {
  const STORAGE_KEY = 'pokeviz-lang';

  const STRINGS = {
    en: {
      /* ---- topbar ---- */
      'brand':            'SML · POKEMON',
      'music.on':         '♪ MUSIC ON',
      'music.off':        '♪ MUSIC OFF',
      'lang.toggle':      '日本語',          /* what to switch TO */
      'topbar.prev':      'PREV',
      'topbar.next':      'NEXT',
      'topbar.theme':     'theme',

      /* ---- scene titles (shown in the topbar) ---- */
      'scene.title':      'POKEMON',
      'scene.tutorial':   'Tutorial — how to play',
      'scene.battle':     'A wild CHARMANDER appeared!',
      'scene.mdp':        'What makes this an MDP?',
      'scene.trajectory': 'The trajectory',
      'scene.objective':  'Return & Q*',
      'scene.qstar':      'π* from Q',
      'scene.dp':         'Filling Q with DP',
      'scene.whyNotDp':   "Why DP doesn't scale",
      'scene.sarsaDerive':'Deriving SARSA',
      'scene.recap':      "You've trained PIKACHU.",

      /* ---- scene 0 — title screen ---- */
      'title.pokemon':    'POKEMON',
      'title.subtitle':   'A REINFORCEMENT LEARNING ADVENTURE',
      'title.start':      '▶ PRESS START',
      'title.credits':    'SML · ETH ZURICH · CLASSIC RL #7',
      'title.by':         'BY CARLOS COTRINI',

      /* ---- Pokemon display names ---- */
      'pokemon.pikachu':    'PIKACHU',
      'pokemon.charmander': 'CHARMANDER',
      'pokemon.charmeleon': 'CHARMELEON',
      'pokemon.charizard':  'CHARIZARD',
      'pokemon.wild':       'Wild',

      /* ---- move names ---- */
      'move.quick_attack':  'QUICK ATTACK',
      'move.thunderbolt':   'THUNDERBOLT',
      'move.thunder':       'THUNDER',
      'move.ember':         'EMBER',
      'move.flamethrower':  'FLAMETHROWER',
      'move.outrage':       'OUTRAGE',
      'move.short.quick_attack': 'QUICK',
      'move.short.thunderbolt':  'BOLT',
      'move.short.thunder':      'THUN',

      /* ---- HP bar + bucket names ---- */
      'hp.label':           'HP',
      'hp.bucket.full':     'FULL',
      'hp.bucket.high':     'HIGH',
      'hp.bucket.mid':      'MID',
      'hp.bucket.low':      'LOW',
      'hp.bucket.critical': 'CRITICAL',
      'hp.bucket.fainted':  'FAINTED',
      'hp.bucket.faint_short': 'FAINT',
      'hp.damage_flash':    '-{n} HP',
      'hp.damage_minus':    '−{n} HP',
      'hp.faint_flash':     'FAINT!',

      /* ---- terminal markers ---- */
      'terminal.win':       '✓ WIN',
      'terminal.loss':      '✗ LOSS',
      'terminal.mini':      '(terminal)',

      /* ---- battle dialog (scene 1) ---- */
      'battle.section_title': 'YOU ARE PIKACHU. PICK A MOVE EACH TURN.',
      'battle.used':          '{name} used {move}!',
      'battle.wild_used':     'Wild {name} used {move}!',
      'battle.missed':        "{name}'s attack missed!",
      'battle.evolving':      'What? Wild {name} is evolving!',
      'battle.evolved_into':  'Evolved into {name}!',
      'battle.fainted':       '{name} fainted!',
      'battle.wild_fainted':  'Wild {name} fainted!',
      'battle.pika_wins':     'PIKACHU wins!',
      'battle.you_lost':      'You lost!',
      'battle.what_now':      'What will PIKACHU do?',
      'battle.opening_wild':  'A wild CHARMANDER appeared!',
      'battle.go_pika':       'Go, PIKACHU!',
      'battle.what_will':     'What will PIKACHU do?',
      'battle.critical_hit':  'A critical hit!',
      'battle.caption':
        'You are the policy. Each click is one action; the dice are the damage roll and the accuracy check. ' +
        'The state is (your HP bucket, opp HP bucket) — five buckets each, twenty-five combinations. ' +
        'HP is discretised: each move bumps the bar by 0, 1, 2, or 3 segments. The state the agent sees IS the state the world is in.',
      'battle.hud.turn':      'TURN',
      'battle.hud.last':      'LAST',
      'battle.hud.reward':    'REWARD',
      'battle.hud.state':     'STATE',
      'battle.hud.hit':       'HIT',
      'battle.hud.miss':      'MISS',
      'battle.hud.dash':      '—',
      'battle.restart':       'RESTART BATTLE',

      /* ---- MDP overlay (scene 3) ---- */
      'mdp.heading':       'WHAT MAKES THIS AN MDP?',
      'mdp.tag.s':         'S — STATE',
      'mdp.tag.a':         'A — ACTION',
      'mdp.tag.p':         'P — TRANSITION FN',
      'mdp.step.0':        'A POKEMON battle is a <b>Markov Decision Process (MDP)</b>. Three ingredients: a state, an action, and a transition function. We\'ll add them one click at a time.',
      'mdp.step.1':        '<b>S — STATE.</b> A state is a pair of two non-negative integers: PIKACHU\'s HP and CHARMANDER\'s HP. Five HP levels each (0 = fainted, 4 = full) → 25 possible states.',
      'mdp.step.2':        '<b>A — ACTION.</b> An action is any move PIKACHU can pick. The action set is <b>A = { QUICK ATTACK, THUNDERBOLT, THUNDER }</b>.',
      'mdp.step.3':        '<b>P — TRANSITION PROBABILITY FUNCTION.</b> P takes a state s and an action a, and outputs a new state s′ and a reward r — written <b>P(s, a) → (s′, r)</b>. It is <em>probabilistic</em>: the same (s, a) can produce different outputs — accuracy rolls and damage rolls give us randomness.',
      'mdp.hint':          'When all three ingredients are on screen, click <kbd>NEXT</kbd> to continue.',
      'mdp.prev':          '◀ PREV',
      'mdp.next':          'NEXT ▶',
      'mdp.step_of':       'STEP <b id="mdp-overlay-i">1</b> / 4',
      'mdp.markov':
        '<b>MARKOV ASSUMPTION:</b> the next (state, reward) depends only on the <em>current</em> ' +
        '(state, action), not the full history.  We assume it holds here.  Sleep counters, paralysis, and held items ' +
        'would break it in a real Pokemon game — we abstract them away.',

      /* ---- Trajectory scene ---- */
      'traj.heading':         'THE TRAJECTORY',
      'traj.formula.label':   'TRAJECTORY (RANDOM VARIABLES)',
      'traj.formula.foot':    'sᵢ = state · aᵢ = PIKACHU\'s move · rᵢ = reward · sᵢ₊₁ = state AFTER aᵢ',
      'traj.btn.step':        '▶ NEXT TURN',
      'traj.btn.play':        '▶▶ PLAY',
      'traj.btn.reset':       'RESET',
      'traj.status.step':     'step',
      'traj.status.over':     'EPISODE OVER',

      /* ---- Objective scene ---- */
      'obj.heading':          'OBJECTIVE',
      'obj.g.label':          'RETURN FROM TIME i',
      'obj.g.foot':
        'Sum of rewards from step i until the trajectory τ ends. ' +
        'The return depends on which trajectory you played — different rolls of the dice, different G.',
      'obj.illus.label':
        'ONE TRAJECTORY τ · click any <span class="g-r">r<sub>t</sub></span> to recompute G<sub>t</sub>(τ)',
      'obj.qstar.label':      'OPTIMAL ACTION-VALUE FUNCTION Q*',
      'obj.qstar.foot':
        'The expected return when you take action a in state s and then play optimally thereafter. ' +
        'This is what the agent ultimately wants to know — once you have Q*, optimal play is just argmax_a Q*(s, a).',
      'obj.var.title':        'Q* IS THE EXPECTED G — VARIANCE LIVES IN ONE TRAJECTORY',
      'obj.var.hint':         '(click to expand)',
      'obj.var.explainer':
        'G<sub>1</sub>(τ) is a <em>random variable</em>. Two rollouts from the same start can land far apart. ' +
        '<b>Q*</b> is the maximum, over all policies, of the average G under that policy.  Pick a policy below, ' +
        'press SAMPLE to draw 20 trajectories; each bar is one G<sub>1</sub>(τ).  The dashed line is the mean — an ' +
        'estimate of Q under that policy.  <span class="g-r">Try different policies — different distribution, ' +
        'different mean.</span>',
      'obj.var.policy_label': 'POLICY:',
      'obj.var.policy.quick': 'QUICK',
      'obj.var.policy.bolt':  'BOLT',
      'obj.var.policy.thun':  'THUN',
      'obj.var.policy.random':'RANDOM',
      'obj.var.stats_empty':  'N = 0 · mean — · range —',
      'obj.var.stats':        'N = <b>{n}</b> · mean <b>{mean}</b> · range [<b>{lo}</b>, <b>{hi}</b>]',
      'obj.var.empty_chart':  '(no samples yet — press SAMPLE to draw 20)',
      'obj.var.sample_btn':   '▶ SAMPLE 20 TRAJECTORIES',

      /* ---- Q* scene ---- */
      'qstar.heading':        'IF WE KNEW Q*, WE WOULD KNOW HOW TO PLAY OPTIMALLY',
      'qstar.premise':
        'In each state, the optimal play is to pick the action that achieves ' +
        '<span class="qstar-q-star">max<sub>a</sub> Q*(s, a)</span>. ' +
        'So if we had the Q*-table in hand, we would just argmax it.',
      'qstar.formula.label':  'OPTIMAL POLICY',
      'qstar.formula.foot':   'In every state, pick the action with the highest Q*.',
      'qstar.bridge_q':       'BUT HOW DO WE COMPUTE Q* ?',
      'qstar.state_label':    'STATE (YOUR={your}, {oppName} {opp})',
      'qstar.argmax_tag':     'argmax · π*(s)',
      'qstar.banner.win':     '✓ WIN  +10',
      'qstar.banner.loss':    '✗ LOSS  −10',
      'qstar.status.turn':    'TURN',
      'qstar.status.state':   'STATE',
      'qstar.status.phase':   'PHASE',
      'qstar.phase.showing':  'SHOWING Q',
      'qstar.phase.pika_does':'PIKA → {move}',
      'qstar.phase.opp_fainted':'OPP FAINTED — WIN',
      'qstar.phase.charm_does': 'CHARM → {move}',
      'qstar.phase.pika_fainted': 'PIKA FAINTED — LOSS',

      /* ---- DP scene ---- */
      'dp.heading':           'FILLING Q WITH DYNAMIC PROGRAMMING',
      'dp.premise':
        '<strong>If we know P</strong> &mdash; the full transition table for ' +
        'every (s, a, s\') &mdash; <strong>we can compute Q here using dynamic programming!</strong> ' +
        'Bellman\'s equation is a recursive definition of Q*; sweep it to a fixed point ' +
        'and we have the optimal action-value for every state.',
      'dp.formula.label':     'BELLMAN OPTIMALITY EQUATION',
      'dp.btn.step':          '▶ STEP',
      'dp.btn.run':           'RUN ALL',
      'dp.btn.reset':         'RESET',
      'dp.status.phase':      'PHASE',
      'dp.status.cells':      'CELLS FILLED',
      'dp.ready.title':       'READY',
      'dp.ready.body':        'Click <b>STEP</b> to begin computing Q* one phase at a time.',
      'dp.phase.charizard.title': 'CHARIZARD COLUMNS — easy wins',
      'dp.phase.charizard.n1':    'When opponent HP drops to LOW or CRITICAL it has evolved into <b>CHARIZARD</b> — huge frame, exposed.',
      'dp.phase.charizard.n2':    'QUICK ATTACK is super-effective (2-3 dmg · 100% acc) — always one-shots a LOW or CRIT Charizard.',
      'dp.phase.charizard.n3':    '<b>Q*(s, QUICK) = +10</b> for every cell in these two columns.',
      'dp.phase.crit.title':      'YOUR=CRITICAL row — losing positions',
      'dp.phase.crit.n1':         'PIKACHU at CRITICAL means any counter-attack faints us. Most cells in this row are losing.',
      'dp.phase.crit.n2':         'Q tells you the expected loss — useful even when there is no winning move.',
      'dp.phase.detail.title':    'DETAIL — (FULL, MID, THUNDER)',
      'dp.phase.charmeleon.title':'CHARMELEON column — THUNDER reigns',
      'dp.phase.charmeleon.n1':   'CHARMELEON\'s hardened hide <b>resists THUNDERBOLT</b> (0-1 dmg, fizzles).',
      'dp.phase.charmeleon.n2':   'THUNDER stays at 2-3 dmg → only Pikachu move with reach. Even with 55% accuracy, it dominates.',
      'dp.phase.charmander.title':'CHARMANDER columns — subtle territory',
      'dp.phase.charmander.n1':   'The baby form: BOLT works at normal damage; QUICK is too weak alone.',
      'dp.phase.charmander.n2':   'But every BOLT that drops CHARMANDER into MID HP triggers evolution to CHARMELEON, who resists future BOLTs.',
      'dp.phase.charmander.n3':   'THUNDER keeps the same 2-3 dmg through every form — sometimes worth its 55% accuracy.',
      'dp.phase.done.title':      'Q* CONVERGED.',
      'dp.phase.done.n1':         'All three Pikachu moves earn their place: QUICK against Charizard, THUNDER against Charmeleon, a mix in Charmander territory.',
      'dp.phase.done.n2':         'But this required <i>P(s′ | s, a)</i> for every transition, plus one Bellman backup per cell.',
      'dp.phase.done.n3':         'In real games neither is available — sample-based methods come next.',
      'dp.detail.title':          'Q*(YOUR={your}, OPP={opp}, {move})',
      'dp.detail.narration':
        'Opponent is <b>{form}</b>. ' +
        '{move} deals form-specific damage — and any HP-bucket cross-over ' +
        'triggers an evolution before the counter lands.',
      'dp.detail.hit_win':        'hit · dmg {n} → OPP FAINTS, r=+10',
      'dp.detail.hit_continue':   'hit · dmg {n} → OPP at {state} (<b>{form}</b>) counters {move}:',
      'dp.detail.miss':           'MISS — opp stays at {state} (<b>{form}</b>) counters {move}:',
      'dp.detail.sub_faint':      '{move} {n} → PIKACHU FAINTS, r=−10',
      'dp.detail.sub_continue':   '{move} {n} → {state}, V′={v} → −1 + {v} = {bv}',
      'dp.detail.weighted':       'weighted ({p} · {sum}):',
      'dp.detail.q_total':        'Q*({state}, {move})',

      /* ---- Why DP doesn't scale ---- */
      'wndp.heading':         "TWO REASONS DP DOESN'T SCALE",
      'wndp.r1.label':        "REASON 1 — WE DON'T KNOW P",
      'wndp.r1.foot':
        'In the previous scene we wrote P down ourselves. In the wild — a real ' +
        'game, a real robot — you only get to play. The world hands you one s\' ' +
        'per step; the table is never on the page.',
      'wndp.r2.label':        'REASON 2 — AND IF WE DID, THE SCALE',
      'wndp.r2.foot':
        'Even with P in hand, DP\'s sweep visits every (s, a). Realistic MDPs ' +
        'have too many to enumerate.',
      'wndp.stat.pika.title':  'PIKACHU MDP',
      'wndp.stat.pika.value':  '25 × 3',
      'wndp.stat.pika.detail': '75 Q-entries · feasible by hand.',
      'wndp.stat.full.title':  'FULL POKEMON GAME',
      'wndp.stat.full.value':  '~ 10<sup>15</sup>',
      'wndp.stat.full.detail': '6 mons × HP × status × items × …',
      'wndp.stat.go.title':    'GO POSITIONS',
      'wndp.stat.go.value':    '~ 10<sup>170</sup>',
      'wndp.stat.go.detail':   'More than atoms in the observable universe.',
      'wndp.bridge':           'WE NEED A SAMPLE-BASED METHOD → SARSA',

      /* ---- SARSA-derive scene ---- */
      'sd.heading':           'DERIVING SARSA',
      'sd.btn.prev':          '◀ PREV',
      'sd.btn.next':          'NEXT ▶',
      'sd.btn.reset':         'RESET',
      'sd.status':            'STEP <b id="sd-step-idx">1</b> / {total} · <b id="sd-step-id">A</b>',

      'sd.step.A.title':      'A — WE WANT A TABLE OF Q*',
      'sd.step.A.body':
        'Aim: build a table <span class="sd-q-est">q[s, a]</span> that approximates the optimal action-value ' +
        '<span class="sd-q">Q*(s, a)</span> at every state and action.',
      'sd.step.B.title':      'B — INITIALISE THE TABLE',
      'sd.step.B.body':
        'We don\'t know <span class="sd-q">Q*</span> yet.  Seed every entry of <span class="sd-q-est">q</span> ' +
        'to zero (or tiny noise so ties break randomly).',
      'sd.step.D.title':      'D — PLAY THE GAME TO GENERATE A TRAJECTORY',
      'sd.step.D.body':
        'We don\'t have P.  We <em>do</em> get to play.  The world hands us a stream of ' +
        '(state, action, reward, next state) tuples — pick the next action by ε-greedy on the <em>current</em> ' +
        '<span class="sd-q-est">q</span>, and let the environment supply the rest.',
      'sd.step.D.foot':       'The second &laquo;A&raquo; in S-A-R-S-A is the action we pick at the next state — needed for the update on the previous step.',
      'sd.step.E1.title':     'E1 — REPLACE THE EXPECTATION WITH ONE SAMPLE',
      'sd.step.E1.body':
        'By Bellman, <span class="sd-q">Q*(s, a)</span> is an expectation over the random next state and reward. ' +
        'We don\'t get the expectation — we get one sample.  Drop the <span class="sd-q">E</span> and use it:',
      'sd.step.E1.foot':
        'One-sample Monte-Carlo estimate of the right-hand side. ' +
        '<em>Subtle:</em> with A′ from our ε-greedy policy, the LHS is technically Q under the current policy ' +
        '(not Q*); as ε → 0 the policy becomes greedy and q → Q*. This is what makes SARSA <em>on-policy</em>.',
      'sd.step.E2.title':     'E2 — NAME THE RIGHT-HAND SIDE «TARGET»',
      'sd.step.E2.body':
        'We don\'t have <span class="sd-q">Q*</span> on the right either — only our table <span class="sd-q-est">q</span>. ' +
        'Plug it in.  Call the resulting number the <b>target</b>: that\'s where we want <span class="sd-q-est">q[s, a]</span> to be.',
      'sd.step.E3.title':     'E3 — MOVE q TOWARD THE TARGET (TWO CASES)',
      'sd.step.E3.body':
        'If <span class="sd-q-est">q[s, a]</span> is <em>below</em> the target, nudge it <em>up</em>. ' +
        'If it\'s <em>above</em>, nudge it <em>down</em>.  Step size <span class="sd-alpha">α ∈ (0, 1)</span> ' +
        'is small enough not to overshoot.',
      'sd.step.E3.foot':      'Same step size α in both cases.  Same magnitude of correction.  Only the sign differs — and α(target − q) already carries that sign for free.',
      'sd.step.E4.title':     'E4 — THE TWO CASES COLLAPSE INTO ONE LINE',
      'sd.step.E4.body':
        'Flip the sign of the «above» case: <span class="sd-q-est">−α(q − target)</span> = <span class="sd-q-est">+α(target − q)</span>. ' +
        'Both branches become the same update.  <b>This is SARSA.</b>',
      'sd.step.E4.foot':      'TD error = target − current estimate.  Apply this once per (s, a, r, s′, a′) tuple as the agent plays.',
      'sd.step.F.title':      'F — SARSA ON ONE TRAJECTORY',
      'sd.step.G.title':      'G — ONE LINE → Q-LEARNING (OFF-POLICY)',
      'sd.step.G.body':
        '<b>SARSA</b> targets <span class="sd-q-est">r + q[s′, <em>a′</em>]</span> — the action <em>actually taken</em> at s′ ' +
        'under the current ε-greedy policy. <b>Q-learning</b> targets <span class="sd-q-est">r + max<sub>a′</sub> q[s′, a′]</span> — ' +
        'the <em>best</em> action available at s′, regardless of what the policy picked. One operator changes: sampled → argmax. ' +
        'Q-learning is <b>off-policy</b>: its target is independent of the behaviour policy.',
      'sd.step.G.foot':       'As ε → 0 the policy becomes greedy and the two targets agree.  Otherwise they differ.',

      'sd.illus.A':           '← THE TABLE WE WANT TO FILL.  EACH CELL = ONE (STATE, ACTION).',
      'sd.illus.B':           '← INITIALISING q[s, a] := 0 FOR EVERY CELL',
      'sd.illus.D':           '← ONE SAMPLED TRAJECTORY.  ε-greedy ON THE CURRENT q (ALL ZERO ⇒ UNIFORM RANDOM).',
      'sd.illus.E1':          '← THIS ONE SAMPLE IS WHAT WE USE INSTEAD OF THE EXPECTATION.',
      'sd.illus.E2':          '← target = r + q[s′, a′].  q[s, a] WANTS TO BE THERE.',
      'sd.illus.E3':          '↓ q SITS BELOW target HERE — NUDGE UP BY α(target − q).',
      'sd.illus.E4':          '↓ ONE UNIFIED UPDATE — α(target − q) — ALREADY CARRIES THE RIGHT SIGN.',
      'sd.illus.G':           '← SARSA targets the sampled a′; Q-LEARNING targets max over a′.  Same q, two different teachers.',

      'sd.target.label':      'TARGET',
      'sd.numline.two':       'TWO CASES — q vs target',
      'sd.numline.one':       'COLLAPSED — one update',
      'sd.numline.q_label':   'q = +0.00',
      'sd.numline.tgt_label': 'target = {v}',
      'sd.numline.arrow':     'α(target − q)',
      'sd.numline.other':     'other case (sign-flipped)',
      'sd.numline.unified':   'α(target − q)',

      'sd.conv.label':        'CLOSENESS TO Q* (DP ORACLE):',
      'sd.tape.title':        'TRAJECTORY',
      'sd.tape.illus_count':  '· {n} transitions (illustration)',
      'sd.tape.count_singular':'· {n} transition, cursor at {cur}',
      'sd.tape.count_plural': '· {n} transitions, cursor at {cur}',

      'sd.f.play':            '▶ PLAY',
      'sd.f.pause':           '⏸ PAUSE',
      'sd.f.step_btn':        '▶ NEXT TRANSITION',
      'sd.f.reroll':          '⟲ REROLL',
      'sd.f.clear':           'CLEAR q',
      'sd.f.speed':           'SPEED',
      'sd.f.speed.slow':      'SLOW',
      'sd.f.speed.fast':      'FAST',
      'sd.f.eps':             'ε',
      'sd.f.alpha':           'α = <b>{a}</b>',

      'sd.f.step_label':      'STEP {i} / {total}',
      'sd.f.no_transitions':  'NO TRANSITIONS YET',
      'sd.f.no_transitions.body': 'Reroll to sample a trajectory.',
      'sd.f.all_applied':     'ALL {n} TRANSITIONS APPLIED',
      'sd.f.all_applied.body':'PLAY auto-rerolls.  <span class="sd-q-est">q</span> is preserved, so the next trajectory builds on what we have.',
      'sd.f.transition_of':   'TRANSITION {i} / {n}',
      'sd.f.terminal':        '— (terminal)',
      'sd.f.target_label':    'target = r + q[s′, a′]',
      'sd.f.target_eq':       '= {calc}',
      'sd.f.target_terminal': '{r} &nbsp;&nbsp; (no bootstrap — next state terminal)',
      'sd.f.q_was':           'q[s, a]  was',
      'sd.f.td_label':        'TD error = target − q[s, a]',
      'sd.f.update_label':    'q[s, a] += α · (target − q[s, a])',

      /* ---- Scene 5 (Hall of Fame) ---- */
      'recap.hof':            'HALL OF FAME',
      'recap.sub':
        'The five RL pieces are the same five pieces that fit Snakes & Ladders. Two cultural artefacts, one curriculum.',
      'recap.trainer.champion':    'POKEMON CHAMPION',
      'recap.trainer.in_progress': 'TRAINER IN PROGRESS',
      'recap.trainer.locked':      'LOCKED',
      'recap.trainer.dash':        '—',
      'recap.trainer.stats_base':  '<b>{earned} / {total}</b> badges',
      'recap.trainer.stats_since': ' · since <b>{date}</b>',
      'recap.trainer.stats_crowned':' · crowned <b>{date}</b>',
      'recap.closer.label':        'WHERE THIS GOES NEXT',
      'recap.closer.text':
        'Bigger problems scale the same five pieces. Real Pokemon AIs — type matching, team building, Z-Move selection — ' +
        'use the same MDP / Bellman / SARSA bones. So do robots, recommender systems, and game-playing agents at the ' +
        'frontier. You now know the bones.',
      'recap.footnote':            'Press <kbd>PREV</kbd> or left-arrow to revisit the SARSA derivation.',
      'recap.trainer.fallback':    'TRAINER',

      /* ---- Tutorial scene ---- */
      'tut.skip':                'SKIP TUTORIAL →',
      'tut.go_to_battle':        'GO TO BATTLE →',
      'tut.skip_title':          'Jump straight to the battle',
      'tut.step_of':             'STEP {i} / {total}',
      'tut.nav.hint':
        'Press <kbd>→</kbd> to continue · <kbd>←</kbd> back · ' +
        'Press <kbd>↓</kbd> to fast-fill the dialog text',

      'tut.step.welcome.title':  'Welcome, trainer!',
      'tut.step.welcome.dialog':
        'Hello there, {name}!  Welcome to the world of POKEMON!  ' +
        'Before you battle, here is a quick refresher.',
      'tut.welcome.big':         'PIKACHU CHOOSES YOU!',
      'tut.welcome.small':       'Five quick lessons.  Then you fight.',

      'tut.step.battle.title':   'The battle screen',
      'tut.step.battle.dialog':
        "Look at the screen.  Your PIKACHU faces away from you.  " +
        "The wild CHARMANDER faces you.  Each has an HP box.",
      'tut.callout.you':         'YOU — back view',
      'tut.callout.wild':        'WILD POKEMON — front view',
      'tut.callout.your_hp':     'YOUR HP',
      'tut.callout.their_hp':    'THEIR HP',

      'tut.step.hp.title':       'HP has five buckets',
      'tut.step.hp.dialog':
        "Each POKEMON's HP is split into five buckets: FULL, HIGH, MID, " +
        "LOW, CRITICAL.  Past CRITICAL, the POKEMON faints!",
      'tut.hp.watch':            'WATCH CHARMANDER TAKE A HIT',
      'tut.hp.fainted_flash':    'FAINTED!',
      'tut.hp.footnote':
        'Each attack drops the bar by <b>0 to 3</b> buckets.  Past CRITICAL, the POKEMON faints.  ' +
        'Stronger moves drop more — THUNDER can land a 3-bucket hit in one go.',

      'tut.step.moves.title':    'Pick a move',
      'tut.step.moves.dialog':
        "Three moves to pick from.  Read them left to right: weak but reliable → " +
        "strong but risky.  THUNDER hits hardest but lands only ~half the time.  " +
        "And here is the twist: as your foe evolves mid-battle, the damage of each move shifts.  " +
        "What works on CHARMANDER may fail on CHARMELEON.",
      'tut.moves.axis.l':        '← WEAK · RELIABLE',
      'tut.moves.axis.m':        'DAMAGE ↑   ACCURACY ↓',
      'tut.moves.axis.r':        'STRONG · RISKY →',
      'tut.moves.eff.dmg':       '{lo}–{hi} DMG',
      'tut.moves.eff.super':     'SUPER',
      'tut.moves.eff.resist':    'RESIST',
      'tut.moves.footnote':
        'CHARMELEON <b>resists</b> THUNDERBOLT.  ' +
        'CHARIZARD takes <b>super</b> damage from QUICK ATTACK.  ' +
        'The best move depends on the form you face — PIKACHU must learn that.',

      'tut.step.turn.title':     'How a turn flows',
      'tut.step.turn.dialog':
        "Your PIKACHU is faster, so it moves first.  Then the wild " +
        "CHARMANDER strikes back with EMBER.  One turn — both actions.",
      'tut.turn.row1.who':       'PIKACHU',
      'tut.turn.row1.action':    'You pick a move.  PIKACHU attacks first.',
      'tut.turn.row2.who':       'CHARMANDER',
      'tut.turn.row2.action':    'Wild CHARMANDER strikes back with EMBER.',
      'tut.turn.row3.who':       '— — —',
      'tut.turn.row3.action':    'Both HP bars update.  State has changed.',
      'tut.turn.footnote':
        'PIKACHU is faster (base speed 90 vs 65), so it always moves first.',

      'tut.step.winlose.title':  'Win, lose, and reward',
      'tut.step.winlose.dialog':
        "Faint CHARMANDER to WIN (+10 reward).  Faint yourself to LOSE " +
        "(-10).  Each turn costs -1.  Now you are ready.  GO!",
      'tut.winlose.win.title':   'YOU WIN!',
      'tut.winlose.win.reward':  '+10 reward',
      'tut.winlose.win.detail':  'CHARMANDER fainted.  Episode ends.',
      'tut.winlose.lose.title':  'YOU LOSE.',
      'tut.winlose.lose.reward': '-10 reward',
      'tut.winlose.lose.detail': 'PIKACHU fainted.  Try again.',
      'tut.winlose.footnote':
        'Each turn that does not end the battle costs -1 reward.  ' +
        'Short, decisive battles are more rewarding than long grinds.',

      /* ---- Help overlay + quick-jump + slide-mode + trainer modal ---- */
      'help.title':           'KEYBOARD SHORTCUTS',
      'help.row.arrows':      'navigate scenes (or step within a scene)',
      'help.row.down':        'fast-fill the typewriter dialog',
      'help.row.n':           'speaker notes overlay (lecturer crib)',
      'help.row.f':           'slide mode (fullscreen-feel, hide topbar)',
      'help.row.g':           'quick-jump to any scene',
      'help.row.help':        'this help overlay',
      'help.row.t':           'cycle theme: light → dark → GB → CRT',
      'help.row.m':           'toggle music on / off',
      'help.row.esc':         'close any overlay / leave slide mode',
      'help.section.eggs':    'EASTER EGGS',
      'help.row.pika':        'click PIKACHU on the title screen — cheek-spark zap; ten clicks for the THUNDER cameo',
      'help.row.qcell':       'click any Q-cell in scene 9 step F to see its Pokedex number',

      'quickjump.title':      'QUICK JUMP — number to go, ESC to cancel',
      'slide.toast':          'SLIDE MODE · press ESC or F to exit',
      'speakerNotes.title':   'SPEAKER NOTES · press <kbd>n</kbd> to close',
      'speakerNotes.empty':   '(No notes for this scene yet.)',

      'trainer.modal.title':   'A NEW TRAINER!',
      'trainer.modal.prompt':  'What is your name?',
      'trainer.modal.placeholder':'TRAINER',
      'trainer.modal.ok':      'OK',
      'trainer.modal.skip':    'SKIP',
      'trainer.modal.hint':    '12 letters max. You can leave it blank.',

      'boot.tag':              'A REINFORCEMENT-LEARNING ADVENTURE',

      /* ---- Speaker notes (one per scene) ---- */
      'notes.scene0':
        '<h3>Scene 0 — Title</h3>' +
        '<ul>' +
          '<li>Welcome the class.  This viz covers MDPs, Q*, DP, and SARSA in 11 scenes.</li>' +
          '<li>Prerequisites: comfort with probability and basic optimisation.  No deep-RL exposure needed.</li>' +
          '<li>Press →  or NEXT to start.  <kbd>n</kbd> opens / closes these notes anywhere.</li>' +
        '</ul>',
      'notes.sceneHowToPlay':
        '<h3>Scene 1 — Tutorial</h3>' +
        '<ul>' +
          '<li>Six-step Gen-1 Pokemon refresher.  Skip if students are already familiar — the SKIP TUTORIAL button jumps to the battle.</li>' +
          '<li>The dialog box uses a typewriter reveal; press <kbd>↓</kbd> to fast-fill if you\'re reading aloud.</li>' +
          '<li>This scene exists to make the bucketed HP feel natural before we name it.</li>' +
        '</ul>',
      'notes.scene1':
        '<h3>Scene 2 — A wild CHARMANDER appeared!</h3>' +
        '<ul>' +
          '<li>Let students play a few turns themselves.  Point: <b>they are the policy</b>.  Each click is one action.</li>' +
          '<li>Bucketed HP (5 levels) is the state abstraction.  25 non-terminal states + WIN/LOSS sinks.</li>' +
          '<li>Watch THUNDER miss — that\'s the probabilistic transition surfacing on cue.</li>' +
          '<li>The dialog cascade is deliberately slow.  If you\'re short on time, pre-click through it during a question.</li>' +
        '</ul>',
      'notes.sceneMdpOverlay':
        '<h3>Scene 3 — What makes this an MDP?</h3>' +
        '<ul>' +
          '<li>Four-step ladder: <b>state, action, transition function</b>.  Reward is folded into P\'s output.</li>' +
          '<li>State = pair of HP integers.  No hidden state.  Markov property holds.</li>' +
          '<li>If a student asks "is real Pokemon Markov?" — say <i>mostly</i>; sleep counters, paralysis, items break it, but our abstraction is clean.</li>' +
          '<li>P is a probability distribution over (s′, r), not a function.  The notation P(s, a) → (s′, r) is loose.</li>' +
        '</ul>',
      'notes.sceneTrajectory':
        '<h3>Scene 4 — The trajectory</h3>' +
        '<ul>' +
          '<li>Define τ = (s₁, a₁, r₁, s₂, a₂, r₂, …) as the sequence the agent observes.</li>' +
          '<li>NEXT TURN samples one (s, a, r) tuple; PLAY auto-plays until terminal.</li>' +
          '<li>Stress: τ is a <b>random variable</b>.  Two rollouts from the same start can differ.</li>' +
        '</ul>',
      'notes.sceneObjective':
        '<h3>Scene 5 — Return & Q*</h3>' +
        '<ul>' +
          '<li>G<sub>i</sub>(τ) is the sum of rewards from step i to the terminal.  Click any r<sub>t</sub> to recompute the partial return.</li>' +
          '<li>Q*(s, a) is the <b>expected G</b> when you take a in s and play optimally thereafter.  Note the max<sub>π</sub> in the formula.</li>' +
          '<li>If a student is advanced: G is a random variable; Q* is its conditional expectation under the optimal policy.</li>' +
          '<li>The whole curriculum is about finding Q*.  DP is one way; SARSA is the other.</li>' +
        '</ul>',
      'notes.sceneQstar':
        '<h3>Scene 6 — π* from Q*</h3>' +
        '<ul>' +
          '<li>Once you have Q*, optimal play is trivial: argmax over actions.</li>' +
          '<li>The demo battle below plays out automatically with π*.  Pikachu always picks the argmax move.</li>' +
          '<li>Closing question: "BUT HOW DO WE COMPUTE Q*?" — bridges to scene 7 (DP) and scene 9 (SARSA).</li>' +
        '</ul>',
      'notes.sceneDp':
        '<h3>Scene 7 — Filling Q with DP</h3>' +
        '<ul>' +
          '<li>Bellman optimality equation, in expectation form: Q*(s, a) = E[R + max<sub>a′</sub> Q*(S′, a′) | s, a].</li>' +
          '<li>Click STEP to fill one cell per phase.  RUN ALL converges.  Side panel shows the arithmetic for the current cell.</li>' +
          '<li>The cheat: <b>we know P here</b>.  We hand-wrote the transition table.  That\'s why DP works — and why it doesn\'t scale (see next scene).</li>' +
          '<li>The DP sweep is a contraction mapping.  Sweep to a fixed point.</li>' +
        '</ul>',
      'notes.sceneWhyNotDp':
        '<h3>Scene 8 — Why DP doesn\'t scale</h3>' +
        '<ul>' +
          '<li>Two reasons:</li>' +
          '<li>(1) <b>We don\'t know P.</b>  In the wild — real game, real robot — you only get samples, never the transition table.</li>' +
          '<li>(2) <b>Scale.</b>  Pokemon Gen-1 has ~10¹⁵ visible states; Go has ~10¹⁷⁰ positions.  DP\'s sweep is hopeless.</li>' +
          '<li>Bridge: we need a sample-based method.  That\'s SARSA.</li>' +
        '</ul>',
      'notes.sceneSarsaDerive':
        '<h3>Scene 9 — Deriving SARSA</h3>' +
        '<ul>' +
          '<li>Eight-step pager: <b>A → B → D → E1 → E2 → E3 → E4 → F</b>.</li>' +
          '<li>A-D: setup.  We don\'t have P; we play; we get tuples.</li>' +
          '<li>E1: replace expectation with one sample.  <i>Subtle</i>: with A′ from the ε-greedy policy this is technically Qᵖⁱ, not Q*.  As ε → 0 it converges to Q*.  This is what makes SARSA <b>on-policy</b>.</li>' +
          '<li>E2: name the target.  E3: two cases, nudge up or down.  E4: collapse.  The α(target − q) operator already carries the sign.</li>' +
          '<li>F: live demo.  PLAY auto-advances at the speed-slider cadence; REROLL keeps q; CLEAR q resets.  α is fixed at 0.20.</li>' +
          '<li>If a student asks "what about off-policy?" — that\'s Q-learning: replace q[s′, a′] with max<sub>a′</sub> q[s′, a′].  One line.</li>' +
        '</ul>',
      'notes.scene5':
        '<h3>Scene 10 — Hall of Fame (recap)</h3>' +
        '<ul>' +
          '<li>Six cards: one per core concept (MDP, ε-greedy, Bellman, Robbins–Monro, SARSA, snakes-and-ladders cousin).</li>' +
          '<li>Each card cites the related scene and the cross-viz reference if your course uses prior modules.</li>' +
          '<li>Closer: scale up the same five pieces and you get real-world deep RL.</li>' +
          '<li>Open Q&amp;A.  Common questions: function approximation? off-policy? continuous actions?  All point to deep-RL follow-ups.</li>' +
        '</ul>',
    },

    jp: {
      /* ---- topbar ---- */
      'brand':            'SML · ポケモン',
      'music.on':         '♪ おんがく オン',
      'music.off':        '♪ おんがく オフ',
      'lang.toggle':      'ENGLISH',
      'topbar.prev':      'まえ',
      'topbar.next':      'つぎ',
      'topbar.theme':     'いろ',

      'scene.title':      'ポケモン',
      'scene.tutorial':   'チュートリアル — あそびかた',
      'scene.battle':     'やせいの ヒトカゲが あらわれた！',
      'scene.mdp':        'これが MDPなのは なぜ？',
      'scene.trajectory': 'きせき τ',
      'scene.objective':  'リターン と Q*',
      'scene.qstar':      'Qから π*へ',
      'scene.dp':         'DPで Qを うめる',
      'scene.whyNotDp':   'なぜ DPは スケールしない？',
      'scene.sarsaDerive':'SARSAの みちびき',
      'scene.recap':      'ピカチュウは そだった！',

      'title.pokemon':    'ポケモン',
      'title.subtitle':   '〜 きょうかがくしゅう ぼうけん 〜',
      'title.start':      '▶ スタート',
      'title.credits':    'SML · ETH チューリッヒ · CLASSIC RL #7',
      'title.by':         'カルロス コトリーニ',

      'pokemon.pikachu':    'ピカチュウ',
      'pokemon.charmander': 'ヒトカゲ',
      'pokemon.charmeleon': 'リザード',
      'pokemon.charizard':  'リザードン',
      'pokemon.wild':       'やせいの',

      'move.quick_attack':  'でんこうせっか',
      'move.thunderbolt':   '10まんボルト',
      'move.thunder':       'かみなり',
      'move.ember':         'ひのこ',
      'move.flamethrower':  'かえんほうしゃ',
      'move.outrage':       'げきりん',
      'move.short.quick_attack': 'でんこう',
      'move.short.thunderbolt':  'ボルト',
      'move.short.thunder':      'かみなり',

      'hp.label':           'HP',
      'hp.bucket.full':     'まんたん',
      'hp.bucket.high':     'たかい',
      'hp.bucket.mid':      'なかほど',
      'hp.bucket.low':      'ひくい',
      'hp.bucket.critical': 'ピンチ',
      'hp.bucket.fainted':  'ひんし',
      'hp.bucket.faint_short': 'ひんし',
      'hp.damage_flash':    '-{n} HP',
      'hp.damage_minus':    '−{n} HP',
      'hp.faint_flash':     'ひんし！',

      'terminal.win':       '✓ かち',
      'terminal.loss':      '✗ まけ',
      'terminal.mini':      '（しゅうりょう）',

      'battle.section_title': 'あなたは ピカチュウ。 まいターン わざを えらべ。',
      'battle.used':          '{name}の {move}！',
      'battle.wild_used':     'やせいの {name}の {move}！',
      'battle.missed':        '{name}の こうげきは はずれた！',
      'battle.evolving':      'おや？ やせいの {name}の ようすが......',
      'battle.evolved_into':  '{name}に しんかした！',
      'battle.fainted':       '{name}は たおれた！',
      'battle.wild_fainted':  'やせいの {name}は たおれた！',
      'battle.pika_wins':     'ピカチュウの かち！',
      'battle.you_lost':      'まけて しまった！',
      'battle.what_now':      'ピカチュウは どう する？',
      'battle.opening_wild':  'やせいの ヒトカゲが あらわれた！',
      'battle.go_pika':       'ゆけっ！ ピカチュウ！',
      'battle.what_will':     'ピカチュウは どう する？',
      'battle.critical_hit':  'きゅうしょに あたった！',
      'battle.caption':
        'あなたが ほうさく（policy）。 クリックは こうどう、 サイコロは ダメージと めいちゅう。 ' +
        'じょうたいは（じぶんの HPバケツ、 あいての HPバケツ）— それぞれ 5バケツ、 あわせて 25とおり。 ' +
        'HPは とびとび： わざは 0〜3 バケツ さげる。 エージェントが みる じょうたいが せかい その もの。',
      'battle.hud.turn':      'ターン',
      'battle.hud.last':      'さいご',
      'battle.hud.reward':    'ほうしゅう',
      'battle.hud.state':     'じょうたい',
      'battle.hud.hit':       'めいちゅう',
      'battle.hud.miss':      'はずれ',
      'battle.hud.dash':      '—',
      'battle.restart':       'もういちど たたかう',

      'mdp.heading':       'これが MDPなのは なぜ？',
      'mdp.tag.s':         'S — じょうたい',
      'mdp.tag.a':         'A — こうどう',
      'mdp.tag.p':         'P — せんいかんすう',
      'mdp.step.0':        'ポケモンの たたかいは <b>マルコフけっていかてい (MDP)</b>。3つの ぶひん：じょうたい、こうどう、せんいかんすう。ひとつずつ ならべて いく。',
      'mdp.step.1':        '<b>S — じょうたい。</b> じょうたいは ふたつの ひふごう せいすうの ペア — ピカチュウの HPと ヒトカゲの HP。 それぞれ 5レベル (0 = ひんし、4 = まんたん) → 25とおりの じょうたい。',
      'mdp.step.2':        '<b>A — こうどう。</b> こうどうは ピカチュウが えらべる わざ。 こうどうの しゅうごう <b>A = { でんこうせっか, 10まんボルト, かみなり }</b>。',
      'mdp.step.3':        '<b>P — せんいかくりつかんすう。</b> Pは じょうたい sと こうどう aを うけとり、 あたらしい じょうたい s′と ほうしゅう rを かえす — <b>P(s, a) → (s′, r)</b>。 <em>かくりつてき</em>： おなじ (s, a) でも ちがう けっか が おこりうる — めいちゅう・ダメージの ふれ。',
      'mdp.hint':          '3つの ぶひんが そろったら <kbd>つぎ</kbd>で つぎへ。',
      'mdp.prev':          '◀ もどる',
      'mdp.next':          'つぎへ ▶',
      'mdp.step_of':       'ステップ <b id="mdp-overlay-i">1</b> / 4',
      'mdp.markov':
        '<b>マルコフの かてい：</b> つぎの（じょうたい、 ほうしゅう）は <em>いまの</em> ' +
        '（じょうたい、 こうどう）だけで きまる。 れきしは みない。 ねむり・まひ・もちもの は ' +
        'ほんとうの ポケモンでは これを やぶる — ここでは ちゅうしょうかして すてる。',

      'traj.heading':         'きせき τ',
      'traj.formula.label':   'きせき（かくりつへんすう）',
      'traj.formula.foot':    'sᵢ = じょうたい · aᵢ = ピカチュウの わざ · rᵢ = ほうしゅう · sᵢ₊₁ = aᵢの あとの じょうたい',
      'traj.btn.step':        '▶ つぎの ターン',
      'traj.btn.play':        '▶▶ さいせい',
      'traj.btn.reset':       'リセット',
      'traj.status.step':     'ステップ',
      'traj.status.over':     'エピソード しゅうりょう',

      'obj.heading':          'もくてき',
      'obj.g.label':           'じかん iからの リターン',
      'obj.g.foot':
        'ステップ iから きせき τが おわるまでの ほうしゅうの ごうけい。 ' +
        'リターンは あそんだ きせき しだい — サイコロが ちがえば Gも ちがう。',
      'obj.illus.label':
        'ひとつの きせき τ · <span class="g-r">r<sub>t</sub></span>を クリックして G<sub>t</sub>(τ)を けいさん',
      'obj.qstar.label':      'さいてき こうどうかちかんすう Q*',
      'obj.qstar.foot':
        'じょうたい sで こうどう aを とり、 そのあと さいてきに あそんだ ときの きたい リターン。 ' +
        'エージェントが しりたい もの — Q*が あれば、 さいてきな あそびは argmax_a Q*(s, a) だけ。',
      'obj.var.title':        'Q*は Gの きたいち — ひとつの きせきには ぶれが ある',
      'obj.var.hint':         '（クリックで ひらく）',
      'obj.var.explainer':
        'G<sub>1</sub>(τ)は <em>かくりつへんすう</em>。 おなじ スタートからの ふたつの ロールアウトでも ' +
        'おおきく ばらける。 <b>Q*</b>は すべての ほうさくの なかで、 その ほうさくの もとでの Gの ' +
        'へいきんの さいだい。 したで ほうさくを えらび、 SAMPLEを おして 20の きせきを ひく。 ' +
        'ぼうは ひとつの G<sub>1</sub>(τ)。 てんせんは へいきん — その ほうさくの もとでの Qの ' +
        'みつもり。 <span class="g-r">ちがう ほうさく → ちがう ぶんぷ、 ちがう へいきん。</span>',
      'obj.var.policy_label': 'ほうさく：',
      'obj.var.policy.quick': 'でんこう',
      'obj.var.policy.bolt':  'ボルト',
      'obj.var.policy.thun':  'かみなり',
      'obj.var.policy.random':'ランダム',
      'obj.var.stats_empty':  'N = 0 · へいきん — · はんい —',
      'obj.var.stats':        'N = <b>{n}</b> · へいきん <b>{mean}</b> · はんい [<b>{lo}</b>, <b>{hi}</b>]',
      'obj.var.empty_chart':  '（まだ サンプル なし — SAMPLEで 20こ ひく）',
      'obj.var.sample_btn':   '▶ 20の きせきを ひく',

      'qstar.heading':        'Q*を しって いれば、 さいてきに あそべる',
      'qstar.premise':
        'どの じょうたいでも、 さいてきな こうどうは ' +
        '<span class="qstar-q-star">max<sub>a</sub> Q*(s, a)</span>を とる もの。 ' +
        'Q*の ひょうが あれば、 argmaxを とる だけで よい。',
      'qstar.formula.label':  'さいてき ほうさく',
      'qstar.formula.foot':   'どの じょうたいでも、 Q*が もっとも たかい こうどうを えらぶ。',
      'qstar.bridge_q':       'でも、 Q*は どうやって もとめる？',
      'qstar.state_label':    'じょうたい（じぶん={your}, {oppName} {opp}）',
      'qstar.argmax_tag':     'argmax · π*(s)',
      'qstar.banner.win':     '✓ かち  +10',
      'qstar.banner.loss':    '✗ まけ  −10',
      'qstar.status.turn':    'ターン',
      'qstar.status.state':   'じょうたい',
      'qstar.status.phase':   'フェーズ',
      'qstar.phase.showing':  'Qを ひょうじ',
      'qstar.phase.pika_does':'ピカ → {move}',
      'qstar.phase.opp_fainted':'あいて ひんし — かち',
      'qstar.phase.charm_does': 'ヒトカゲ → {move}',
      'qstar.phase.pika_fainted': 'ピカ ひんし — まけ',

      'dp.heading':           'DPで Qを うめる',
      'dp.premise':
        '<strong>Pが わかれば</strong>、 つまり すべての (s, a, s′) の せんいかくりつが あれば、 ' +
        '<strong>DP（どうてきけいかくほう） で Qを ここで けいさんできる！</strong> ' +
        'ベルマンの しきは Q*の さいきてきな ていぎ。 ふどうてんまで かいて うめれば、 ' +
        'すべての じょうたいの さいてき こうどうかちが えられる。',
      'dp.formula.label':     'ベルマン さいてきせいの しき',
      'dp.btn.step':          '▶ ステップ',
      'dp.btn.run':           'ぜんぶ じっこう',
      'dp.btn.reset':         'リセット',
      'dp.status.phase':      'フェーズ',
      'dp.status.cells':      'うまった セル',
      'dp.ready.title':       'じゅんび OK',
      'dp.ready.body':        '<b>ステップ</b>を おして、 フェーズごとに Q*を けいさん。',
      'dp.phase.charizard.title': 'リザードンの れつ — かんたんな かち',
      'dp.phase.charizard.n1':    'あいての HPが ひくい・ピンチに なると <b>リザードン</b>に しんか — おおきな からだ、 すきだらけ。',
      'dp.phase.charizard.n2':    'でんこうせっか は こうかばつぐん（2-3 ダメージ・めいちゅう 100%）— ひくい・ピンチの リザードンを いつでも 1パンチ。',
      'dp.phase.charizard.n3':    'この ふたつの れつの すべての セルで <b>Q*(s, でんこう) = +10</b>。',
      'dp.phase.crit.title':      'じぶん＝ピンチの れつ — まけの じょうたい',
      'dp.phase.crit.n1':         'ピカチュウが ピンチだと、 あいての はんげきで ひんし。 この れつは ほとんど まけ。',
      'dp.phase.crit.n2':         'Qは きたい される そんしつを おしえて くれる — かちの てが なくても やくに たつ。',
      'dp.phase.detail.title':    'くわしく — (まんたん, なかほど, かみなり)',
      'dp.phase.charmeleon.title':'リザードの れつ — かみなりが しはい',
      'dp.phase.charmeleon.n1':   'リザードの かたい はだは <b>10まんボルトを はじく</b>（0-1 ダメージ）。',
      'dp.phase.charmeleon.n2':   'かみなりは 2-3 ダメージの まま → ピカチュウで とどく ゆいいつの わざ。 めいちゅう 55% でも かつ。',
      'dp.phase.charmander.title':'ヒトカゲの れつ — びみょうな りょういき',
      'dp.phase.charmander.n1':   'こどもの すがた： ボルトは ふつうに きく; でんこうせっかは よわすぎる。',
      'dp.phase.charmander.n2':   'でも、 ヒトカゲを なかほどに おとす ボルトは リザードへの しんかを よぶ。 リザードは ボルトを はじく。',
      'dp.phase.charmander.n3':   'かみなりは どの すがたにも 2-3 ダメージ — めいちゅう 55%でも うつ かちが ある。',
      'dp.phase.done.title':      'Q* しゅうそく。',
      'dp.phase.done.n1':         'ピカチュウの 3つの わざ それぞれに ばしょが ある： リザードンに でんこう、 リザードに かみなり、 ヒトカゲでは まぜる。',
      'dp.phase.done.n2':         'しかし これには すべての せんいの <i>P(s′ | s, a)</i> と、 セルごとに ひとつの ベルマン こうしんが ひつよう。',
      'dp.phase.done.n3':         'ほんとうの ゲームでは どちらも ない — つぎは サンプルに もとづく ほうほう。',
      'dp.detail.title':          'Q*（じぶん={your}, あいて={opp}, {move}）',
      'dp.detail.narration':
        'あいては <b>{form}</b>。 ' +
        '{move}は すがたごとに ダメージが ちがう — HPバケツを またぐと はんげきの まえに しんかが おこる。',
      'dp.detail.hit_win':        'めいちゅう · ダメ {n} → あいて ひんし、 r=+10',
      'dp.detail.hit_continue':   'めいちゅう · ダメ {n} → あいて {state}（<b>{form}</b>） はんげき {move}：',
      'dp.detail.miss':           'はずれ — あいては {state}（<b>{form}</b>）の まま はんげき {move}：',
      'dp.detail.sub_faint':      '{move} {n} → ピカチュウ ひんし、 r=−10',
      'dp.detail.sub_continue':   '{move} {n} → {state}, V′={v} → −1 + {v} = {bv}',
      'dp.detail.weighted':       'かじゅう（{p} · {sum}）：',
      'dp.detail.q_total':        'Q*（{state}, {move}）',

      'wndp.heading':         'DPが スケール しない 2つの りゆう',
      'wndp.r1.label':        'りゆう 1 — Pが わからない',
      'wndp.r1.foot':
        'まえの シーンでは Pを じぶんで かいた。 ほんとうの ゲームや ロボットでは ' +
        'あそぶ ことしか できない。 せかいは 1ステップに 1つの s′を くれる だけ — ' +
        'ひょうは けっして ページに ない。',
      'wndp.r2.label':        'りゆう 2 — そして もし わかっても、 スケールが',
      'wndp.r2.foot':
        'Pが あっても、 DPは すべての (s, a)を まわる。 げんじつの MDPでは ' +
        'おおすぎて かぞえきれない。',
      'wndp.stat.pika.title':  'ピカチュウ MDP',
      'wndp.stat.pika.value':  '25 × 3',
      'wndp.stat.pika.detail': 'Q 75こ · てで かのう。',
      'wndp.stat.full.title':  'ふるばんの ポケモン',
      'wndp.stat.full.value':  '〜 10<sup>15</sup>',
      'wndp.stat.full.detail': '6ひき × HP × じょうたい × もちもの × …',
      'wndp.stat.go.title':    'いごの きょくめん',
      'wndp.stat.go.value':    '〜 10<sup>170</sup>',
      'wndp.stat.go.detail':   'うちゅうの げんしの かずより おおい。',
      'wndp.bridge':           'サンプルに もとづく ほうほうが ひつよう → SARSA',

      'sd.heading':           'SARSAの みちびき',
      'sd.btn.prev':          '◀ もどる',
      'sd.btn.next':          'つぎへ ▶',
      'sd.btn.reset':         'リセット',
      'sd.status':            'ステップ <b id="sd-step-idx">1</b> / {total} · <b id="sd-step-id">A</b>',

      'sd.step.A.title':      'A — Q*の ひょうが ほしい',
      'sd.step.A.body':
        'もくひょう： すべての じょうたいと こうどうで、 さいてき こうどうかち ' +
        '<span class="sd-q">Q*(s, a)</span>に ちかい ひょう ' +
        '<span class="sd-q-est">q[s, a]</span>を つくる。',
      'sd.step.B.title':      'B — ひょうの しょきか',
      'sd.step.B.body':
        '<span class="sd-q">Q*</span>は まだ しらない。 <span class="sd-q-est">q</span>の ' +
        'すべての ますを ゼロに する（または ちいさい ノイズで タイを ランダムに）。',
      'sd.step.D.title':      'D — ゲームで きせきを つくる',
      'sd.step.D.body':
        'Pは ない。 でも あそべる。 せかいは（じょうたい、 こうどう、 ほうしゅう、 つぎの じょうたい）の ' +
        'ながれを くれる — つぎの こうどうは いまの <span class="sd-q-est">q</span>に たいする ' +
        'ε-greedyで えらび、 のこりは かんきょうに まかせる。',
      'sd.step.D.foot':       'S-A-R-S-A の 2つめの &laquo;A&raquo;は つぎの じょうたいで えらぶ こうどう — まえの ステップの こうしんに ひつよう。',
      'sd.step.E1.title':     'E1 — きたいちを 1つの サンプルで おきかえる',
      'sd.step.E1.body':
        'ベルマンより、 <span class="sd-q">Q*(s, a)</span>は つぎの じょうたいと ほうしゅうの きたいち。 ' +
        'きたいちは えられない — 1つの サンプルが えられる。 <span class="sd-q">E</span>を おとして つかう：',
      'sd.step.E1.foot':
        'みぎがわの 1サンプル モンテカルロ みつもり。 ' +
        '<em>びみょう：</em> A′を ε-greedyから えらぶと、 ひだりがわは いまの ほうさくの もとでの Q ' +
        '（Q* ではない）。 ε → 0 で ほうさくは greedyに なり、 q → Q*。 これが SARSAを <em>on-policy</em>に する。',
      'sd.step.E2.title':     'E2 — みぎがわを「ターゲット」と なづける',
      'sd.step.E2.body':
        'みぎがわにも <span class="sd-q">Q*</span>は ない — ひょう <span class="sd-q-est">q</span>だけ。 ' +
        'いれて けいさん。 でた かずを <b>ターゲット</b>と よぶ： <span class="sd-q-est">q[s, a]</span>が ' +
        'むかいたい ばしょ。',
      'sd.step.E3.title':     'E3 — qを ターゲットへ うごかす（2つの ばあい）',
      'sd.step.E3.body':
        '<span class="sd-q-est">q[s, a]</span>が ターゲットの <em>した</em>なら <em>うえ</em>に おす。 ' +
        '<em>うえ</em>なら <em>した</em>に おす。 ステップサイズ <span class="sd-alpha">α ∈ (0, 1)</span>は ' +
        'こえ ない くらい ちいさい。',
      'sd.step.E3.foot':      'どちらの ばあいも おなじ ステップサイズ α。 おなじ ほせいの おおきさ。 ふごうだけ ちがう — α(target − q)が もう その ふごうを もっている。',
      'sd.step.E4.title':     'E4 — 2つの ばあいが 1ぎょうに たたまる',
      'sd.step.E4.body':
        '「うえ」の ばあいの ふごうを はんてん： <span class="sd-q-est">−α(q − target)</span> = ' +
        '<span class="sd-q-est">+α(target − q)</span>。 りょうほうとも おなじ こうしん。 <b>これが SARSA。</b>',
      'sd.step.E4.foot':      'TD ごさ = ターゲット − いまの みつもり。 エージェントが あそぶ たびに、 (s, a, r, s′, a′) ごとに 1かい てきよう。',
      'sd.step.F.title':      'F — ひとつの きせきの うえで SARSA',
      'sd.step.G.title':      'G — 1ぎょうで Q-learning（オフポリシー）',
      'sd.step.G.body':
        '<b>SARSA</b>の ターゲットは <span class="sd-q-est">r + q[s′, <em>a′</em>]</span> — いまの ε-greedyで ' +
        's′で <em>じっさいに とった</em> こうどう。 <b>Q-learning</b>の ターゲットは ' +
        '<span class="sd-q-est">r + max<sub>a′</sub> q[s′, a′]</span> — ' +
        'ほうさくが なにを えらんだ かに かかわらず、 s′で <em>もっとも よい</em> こうどう。 ' +
        'えんざんしが 1つ かわる だけ： サンプル → argmax。 Q-learningは <b>オフポリシー</b>。',
      'sd.step.G.foot':       'ε → 0 で ほうさくは greedyに なり、 ふたつの ターゲットは いっち する。 そうでなければ ちがう。',

      'sd.illus.A':           '← うめたい ひょう。 セル = 1つの（じょうたい, こうどう）。',
      'sd.illus.B':           '← q[s, a] := 0 で すべての セルを しょきか',
      'sd.illus.D':           '← サンプルした 1つの きせき。 いまの qに ε-greedy（ぜんぶ 0 ⇒ いちようランダム）。',
      'sd.illus.E1':          '← この 1サンプルを きたいちの かわりに つかう。',
      'sd.illus.E2':          '← ターゲット = r + q[s′, a′]。 q[s, a]は そこに いきたい。',
      'sd.illus.E3':          '↓ ここでは qが ターゲットより した — α(target − q)で うえに おす。',
      'sd.illus.E4':          '↓ 1つに まとまった こうしん — α(target − q) — ふごうは じどうで ただしい。',
      'sd.illus.G':           '← SARSAは サンプルした a′を めざす； Q-LEARNINGは a′の max を めざす。 おなじ q、 2つの せんせい。',

      'sd.target.label':      'ターゲット',
      'sd.numline.two':       '2つの ばあい — q vs target',
      'sd.numline.one':       'まとめた — 1つの こうしん',
      'sd.numline.q_label':   'q = +0.00',
      'sd.numline.tgt_label': 'target = {v}',
      'sd.numline.arrow':     'α(target − q)',
      'sd.numline.other':     'べつの ばあい（ふごう はんてん）',
      'sd.numline.unified':   'α(target − q)',

      'sd.conv.label':        'Q* （DPの こたえ）への ちかさ：',
      'sd.tape.title':        'きせき',
      'sd.tape.illus_count':  '· {n}の せんい（れいじ）',
      'sd.tape.count_singular':'· {n}の せんい、 カーソル {cur}',
      'sd.tape.count_plural': '· {n}の せんい、 カーソル {cur}',

      'sd.f.play':            '▶ さいせい',
      'sd.f.pause':           '⏸ ていし',
      'sd.f.step_btn':        '▶ つぎの せんい',
      'sd.f.reroll':          '⟲ ふりなおし',
      'sd.f.clear':           'q を けす',
      'sd.f.speed':           'はやさ',
      'sd.f.speed.slow':      'おそい',
      'sd.f.speed.fast':      'はやい',
      'sd.f.eps':             'ε',
      'sd.f.alpha':           'α = <b>{a}</b>',

      'sd.f.step_label':      'ステップ {i} / {total}',
      'sd.f.no_transitions':  'まだ せんいが ない',
      'sd.f.no_transitions.body': 'ふりなおして きせきを サンプル。',
      'sd.f.all_applied':     'すべての {n}せんいを てきよう ずみ',
      'sd.f.all_applied.body':'さいせいで じどう ふりなおし。 <span class="sd-q-est">q</span>は のこる ので、 つぎの きせきは これまでの うえに のる。',
      'sd.f.transition_of':   'せんい {i} / {n}',
      'sd.f.terminal':        '— （しゅうりょう）',
      'sd.f.target_label':    'target = r + q[s′, a′]',
      'sd.f.target_eq':       '= {calc}',
      'sd.f.target_terminal': '{r} &nbsp;&nbsp;（つぎは しゅうりょう — ブートストラップ なし）',
      'sd.f.q_was':           'q[s, a]  は',
      'sd.f.td_label':        'TD ごさ = target − q[s, a]',
      'sd.f.update_label':    'q[s, a] += α · (target − q[s, a])',

      'recap.hof':            'でんどう いり',
      'recap.sub':
        '5つの RLの ぶひんは ヘビと はしご に あう 5つと おなじ。 ぶんかが ちがう、 カリキュラムは おなじ。',
      'recap.trainer.champion':    'ポケモン チャンピオン',
      'recap.trainer.in_progress': 'しゅぎょうちゅう',
      'recap.trainer.locked':      'みかいほう',
      'recap.trainer.dash':        '—',
      'recap.trainer.stats_base':  '<b>{earned} / {total}</b> バッジ',
      'recap.trainer.stats_since': ' · <b>{date}</b>から',
      'recap.trainer.stats_crowned':' · <b>{date}</b>に たいかん',
      'recap.closer.label':        'つぎは どこへ',
      'recap.closer.text':
        'おおきな もんだいでは おなじ 5つの ぶひんが スケール する。 ほんものの ポケモン AI — タイプあいしょう、 ' +
        'パーティへんせい、 Z-ワザの せんたく — も おなじ MDP / ベルマン / SARSAの ほね。 ' +
        'ロボットも、 すすめ システムも、 さいぜんせんの ゲーム AIも おなじ。 きみは もう ほねを しっている。',
      'recap.footnote':            '<kbd>まえ</kbd>か ひだりやじるしで SARSAの みちびきを みなおせる。',
      'recap.trainer.fallback':    'トレーナー',

      'tut.skip':                'チュートリアル スキップ →',
      'tut.go_to_battle':        'たたかいへ →',
      'tut.skip_title':          'たたかいに ジャンプ',
      'tut.step_of':             'ステップ {i} / {total}',
      'tut.nav.hint':
        '<kbd>→</kbd>で すすむ · <kbd>←</kbd>で もどる · ' +
        '<kbd>↓</kbd>で ダイアログを ぜんぶ ひょうじ',

      'tut.step.welcome.title':  'ようこそ、 トレーナー！',
      'tut.step.welcome.dialog':
        'やあ、 {name}！ ポケモンの せかいへ ようこそ！  ' +
        'たたかいの まえに、 みじかい おさらいを どうぞ。',
      'tut.welcome.big':         'ピカチュウが きみを えらんだ！',
      'tut.welcome.small':       '5つの みじかい レッスン。 そのあと たたかう。',

      'tut.step.battle.title':   'たたかいの がめん',
      'tut.step.battle.dialog':
        'がめんを よく みて。 きみの ピカチュウは こちらに せなかを むけている。 ' +
        'やせいの ヒトカゲは こちらを むいている。 どちらにも HPボックスが ある。',
      'tut.callout.you':         'きみ — うしろ姿',
      'tut.callout.wild':        'やせいの ポケモン — まえ姿',
      'tut.callout.your_hp':     'きみの HP',
      'tut.callout.their_hp':    'あいての HP',

      'tut.step.hp.title':       'HPは 5つの バケツ',
      'tut.step.hp.dialog':
        'ポケモンの HPは 5つの バケツに わかれる： まんたん、 たかい、 なかほど、 ' +
        'ひくい、 ピンチ。 ピンチを こえると ひんし！',
      'tut.hp.watch':            'ヒトカゲが ダメージを うけるのを みて',
      'tut.hp.fainted_flash':    'ひんし！',
      'tut.hp.footnote':
        'こうげきは バーを <b>0〜3</b> バケツ さげる。 ピンチを こえると ポケモンは ひんし。 ' +
        'つよい わざは おおく さげる — かみなりは いっぱつで 3バケツも ある。',

      'tut.step.moves.title':    'わざを えらぶ',
      'tut.step.moves.dialog':
        'わざは 3つ。 ひだりから みぎへ よむ: よわいが あたる → つよいが あぶない。  ' +
        'かみなりが もっとも つよいが、 あたるのは およそ はんぶん。  ' +
        'そして どんでんがえし: あいてが しんかすると わざの ダメージが かわる。  ' +
        'ヒトカゲに きいた こうげきが、 リザードには きかない ことが ある。',
      'tut.moves.axis.l':        '← よわい · あたる',
      'tut.moves.axis.m':        'ダメージ ↑   めいちゅう ↓',
      'tut.moves.axis.r':        'つよい · あぶない →',
      'tut.moves.eff.dmg':       '{lo}〜{hi} ダメージ',
      'tut.moves.eff.super':     'こうかバツグン',
      'tut.moves.eff.resist':    'いまひとつ',
      'tut.moves.footnote':
        'リザードは 10まんボルトに <b>たいせい</b>。  ' +
        'リザードンは でんこうせっかで <b>こうかバツグン</b>。  ' +
        'さいぜんの わざは あいての すがたに よる — ピカチュウは それを まなぶ。',

      'tut.step.turn.title':     '1ターンの ながれ',
      'tut.step.turn.dialog':
        'きみの ピカチュウの ほうが はやい ので さきに うごく。 そのあと やせいの ' +
        'ヒトカゲが ひのこで はんげき。 1ターン — りょうほうの こうどう。',
      'tut.turn.row1.who':       'ピカチュウ',
      'tut.turn.row1.action':    'わざを えらぶ。 ピカチュウが さきに こうげき。',
      'tut.turn.row2.who':       'ヒトカゲ',
      'tut.turn.row2.action':    'やせいの ヒトカゲは ひのこで はんげき。',
      'tut.turn.row3.who':       '— — —',
      'tut.turn.row3.action':    'りょうほうの HPバーが こうしん。 じょうたいが かわった。',
      'tut.turn.footnote':
        'ピカチュウは はやい（すばやさ 90 vs 65）ので、 いつも さきに うごく。',

      'tut.step.winlose.title':  'かち、 まけ、 ほうしゅう',
      'tut.step.winlose.dialog':
        'ヒトカゲを ひんしに させたら かち（+10 ほうしゅう）。 じぶんが ひんしに なれば まけ ' +
        '（−10）。 1ターン ごとに −1。 さあ、 じゅんびは できた。 いけ！',
      'tut.winlose.win.title':   'かち！',
      'tut.winlose.win.reward':  '+10 ほうしゅう',
      'tut.winlose.win.detail':  'ヒトカゲ ひんし。 エピソード しゅうりょう。',
      'tut.winlose.lose.title':  'まけ。',
      'tut.winlose.lose.reward': '−10 ほうしゅう',
      'tut.winlose.lose.detail': 'ピカチュウ ひんし。 もういちど。',
      'tut.winlose.footnote':
        'たたかいを おわらせない ターンは −1 ほうしゅう。 みじかく きまる たたかいの ほうが ' +
        'ながびく たたかいより とくする。',

      'help.title':           'キーボード ショートカット',
      'help.row.arrows':      'シーンの いどう（または シーンない の ステップ）',
      'help.row.down':        'タイプライターの ダイアログを いっきに ひょうじ',
      'help.row.n':           'スピーカー ノート（こうしの メモ）',
      'help.row.f':           'スライド モード（トップバーを かくす）',
      'help.row.g':           'すきな シーンに クイック ジャンプ',
      'help.row.help':        'この ヘルプ',
      'help.row.t':           'テーマ じゅんかい： ライト → ダーク → GB → CRT',
      'help.row.m':           'おんがく オン / オフ',
      'help.row.esc':         'オーバーレイを とじる / スライド モードを ぬける',
      'help.section.eggs':    'おまけ',
      'help.row.pika':        'タイトルがめんの ピカチュウを クリック — ほっぺ スパーク； 10かいで かみなりの カメオ',
      'help.row.qcell':       'シーン 9 の ステップ F で Qセルを クリックすると ポケモン ずかん ナンバー',

      'quickjump.title':      'クイック ジャンプ — すうじで いどう、 ESC で キャンセル',
      'slide.toast':          'スライド モード · ESC か F で ぬける',
      'speakerNotes.title':   'スピーカー ノート · <kbd>n</kbd>で とじる',
      'speakerNotes.empty':   '（この シーンには まだ ノートが ない）',

      'trainer.modal.title':   'あたらしい トレーナー！',
      'trainer.modal.prompt':  'なまえは？',
      'trainer.modal.placeholder':'トレーナー',
      'trainer.modal.ok':      'OK',
      'trainer.modal.skip':    'スキップ',
      'trainer.modal.hint':    '12もじまで。 くうはくでも OK。',

      'boot.tag':              '〜 きょうかがくしゅう ぼうけん 〜',

      /* ---- Speaker notes ---- */
      'notes.scene0':
        '<h3>シーン 0 — タイトル</h3>' +
        '<ul>' +
          '<li>クラスを むかえる。 この ビジュアライズは MDP、 Q*、 DP、 SARSAを 11シーンで あつかう。</li>' +
          '<li>ぜんていしき： かくりつと きほんの さいてきか。 ふかい RLの けいけんは ふよう。</li>' +
          '<li>→ か NEXT で スタート。 <kbd>n</kbd>で ノートを いつでも かいへい。</li>' +
        '</ul>',
      'notes.sceneHowToPlay':
        '<h3>シーン 1 — チュートリアル</h3>' +
        '<ul>' +
          '<li>6ステップの ジェネ1 ポケモン おさらい。 なれた がくせいは スキップ — ボタンで たたかいへ。</li>' +
          '<li>ダイアログは タイプライター ふうに あらわれる。 おんどくの ときは <kbd>↓</kbd>で いっきに。</li>' +
          '<li>この シーンは、 バケツ HPを なづける まえに しぜんに かんじさせる ため。</li>' +
        '</ul>',
      'notes.scene1':
        '<h3>シーン 2 — やせいの ヒトカゲが あらわれた！</h3>' +
        '<ul>' +
          '<li>がくせいに じぶんで すうターン あそばせる。 ポイント： <b>かれらが ほうさく</b>。 クリック = 1こうどう。</li>' +
          '<li>バケツ HP（5レベル）は じょうたいの ちゅうしょう。 25の ひしゅうりょう じょうたい + かち/まけ シンク。</li>' +
          '<li>かみなりが はずれる のを みる — それが かくりつ せんいの あらわれ。</li>' +
          '<li>ダイアログ カスケードは わざと おそい。 じかんが ない なら、 しつもんの あいだに クリック ずみに。</li>' +
        '</ul>',
      'notes.sceneMdpOverlay':
        '<h3>シーン 3 — これが MDPなのは なぜ？</h3>' +
        '<ul>' +
          '<li>4ステップの はしご： <b>じょうたい、 こうどう、 せんいかんすう</b>。 ほうしゅうは Pの しゅつりょくに ふくむ。</li>' +
          '<li>じょうたい = HPせいすうの ペア。 かくれた じょうたい なし。 マルコフ せいしつ なりたつ。</li>' +
          '<li>「ほんとうの ポケモンは マルコフ？」 と きかれたら <i>だいたい</i>と こたえる。 ねむり、 まひ、 もちものは やぶる が、 ちゅうしょうは きれい。</li>' +
          '<li>Pは (s′, r)の かくりつぶんぷで あって、 かんすう ではない。 P(s, a) → (s′, r) の ひょうきは あまい。</li>' +
        '</ul>',
      'notes.sceneTrajectory':
        '<h3>シーン 4 — きせき</h3>' +
        '<ul>' +
          '<li>エージェントが かんさつ する れつ τ = (s₁, a₁, r₁, s₂, a₂, r₂, …) を ていぎ。</li>' +
          '<li>つぎの ターンで 1つの (s, a, r) を サンプル； さいせいで しゅうりょうまで じどう。</li>' +
          '<li>きょうちょう： τは <b>かくりつ へんすう</b>。 おなじ スタートからの ふたつの ロールアウトでも ちがう。</li>' +
        '</ul>',
      'notes.sceneObjective':
        '<h3>シーン 5 — リターン と Q*</h3>' +
        '<ul>' +
          '<li>G<sub>i</sub>(τ)は ステップ iから しゅうりょうまでの ほうしゅうの ごうけい。 r<sub>t</sub>を クリックして ぶぶん リターンを けいさん。</li>' +
          '<li>Q*(s, a)は sで aを とり、 そのあと さいてきに あそぶ ときの <b>きたい G</b>。 しき の max<sub>π</sub>に ちゅうい。</li>' +
          '<li>うえきゅう なら： Gは かくりつへんすう； Q*は さいてき ほうさくの もとでの じょうけんつき きたいち。</li>' +
          '<li>カリキュラム ぜんたいは Q*を みつける こと。 DPは ひとつの ほうほう； SARSAは もう ひとつ。</li>' +
        '</ul>',
      'notes.sceneQstar':
        '<h3>シーン 6 — Qから π*</h3>' +
        '<ul>' +
          '<li>Q*が あれば、 さいてきな あそびは じめい： こうどう の argmax。</li>' +
          '<li>したの デモ たたかいは π*で じどう さいせい。 ピカチュウは いつも argmaxの わざを えらぶ。</li>' +
          '<li>むすびの といかけ： 「でも Q*は どうやって もとめる？」 — シーン 7 (DP) と シーン 9 (SARSA) への はし。</li>' +
        '</ul>',
      'notes.sceneDp':
        '<h3>シーン 7 — DPで Qを うめる</h3>' +
        '<ul>' +
          '<li>きたいち かたちの ベルマン さいてき せい： Q*(s, a) = E[R + max<sub>a′</sub> Q*(S′, a′) | s, a]。</li>' +
          '<li>ステップで フェーズごとに 1セル ずつ うめる。 ぜんぶ じっこう で しゅうそく。 サイド パネルが いまの セルの けいさんを みせる。</li>' +
          '<li>ずる： <b>ここでは Pを しっている</b>。 せんい ひょうを てがき した。 だから DPは うごく — そして スケールしない（つぎの シーン）。</li>' +
          '<li>DPの スイープは しゅくしゃ しゃぞう。 ふどうてんまで かいて うめる。</li>' +
        '</ul>',
      'notes.sceneWhyNotDp':
        '<h3>シーン 8 — なぜ DPは スケール しない？</h3>' +
        '<ul>' +
          '<li>2つの りゆう：</li>' +
          '<li>(1) <b>Pを しらない。</b> ほんとうの ゲームや ロボットでは サンプル しか えられない。</li>' +
          '<li>(2) <b>スケール。</b> ポケモン ジェネ1は 〜10¹⁵ の じょうたい； いごは 〜10¹⁷⁰ の きょくめん。 DPの スイープは ぜつぼう。</li>' +
          '<li>はし： サンプルに もとづく ほうほうが ひつよう。 それが SARSA。</li>' +
        '</ul>',
      'notes.sceneSarsaDerive':
        '<h3>シーン 9 — SARSAの みちびき</h3>' +
        '<ul>' +
          '<li>8ステップ ページャー： <b>A → B → D → E1 → E2 → E3 → E4 → F</b>。</li>' +
          '<li>A〜D： じゅんび。 Pは ない； あそぶ； タプルが えられる。</li>' +
          '<li>E1： きたいちを 1サンプルで おきかえ。 <i>びみょう</i>： A′を ε-greedyから とると、 これは Qᵖⁱで あって Q* ではない。 ε → 0で Q*に しゅうそく。 これが SARSAを <b>on-policy</b>に する。</li>' +
          '<li>E2： ターゲットを なづける。 E3： 2つの ばあい、 うえ か した に おす。 E4： まとめる。 α(target − q)が ふごうを もっている。</li>' +
          '<li>F： ライブ デモ。 さいせいで スピード スライダーの はやさで じどう しんこう； ふりなおしで qは のこる； q を けすで リセット。 αは 0.20 こてい。</li>' +
          '<li>「オフポリシーは？」 と きかれたら、 それは Q-learning： q[s′, a′]を max<sub>a′</sub> q[s′, a′]に かえる。 1ぎょう。</li>' +
        '</ul>',
      'notes.scene5':
        '<h3>シーン 10 — でんどう いり（おさらい）</h3>' +
        '<ul>' +
          '<li>6まいの カード： コアの がいねん（MDP、 ε-greedy、 ベルマン、 ロビンス・モンロ、 SARSA、 ヘビとはしごの いとこ）。</li>' +
          '<li>かく カードは かんれん する シーンと、 コースの まえの モジュールが あれば そこへの さんしょうを じく。</li>' +
          '<li>むすび： おなじ 5つの ぶひんを スケール すれば、 げんじつの ふかい RLに なる。</li>' +
          '<li>Q&amp;Aを ひらく。 よく ある しつもん： かんすう きんじ？ オフポリシー？ れんぞくな こうどう？ どれも ふかい RLへの つづき。</li>' +
        '</ul>',
    },
  };

  /* Initial language: URL hash override (#lang=jp), else localStorage,
     else 'en'. The hash override is for screenshot-driven testing — it
     also writes back to localStorage so the choice sticks. */
  let lang = 'en';
  const hashMatch = (window.location.hash || '').match(/[#&?]lang=(\w+)/);
  if (hashMatch && (hashMatch[1] === 'en' || hashMatch[1] === 'jp')) {
    lang = hashMatch[1];
  } else {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'jp') lang = stored;
    } catch (e) {}
  }

  const listeners = [];

  function t(key, vars) {
    const table = STRINGS[lang] || STRINGS.en;
    let s = table[key];
    if (s === undefined) {
      /* Fall back to English — if even that's missing, return the key
         literally so the gap is visible in dev rather than silent. */
      s = (STRINGS.en[key] !== undefined) ? STRINGS.en[key] : key;
    }
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
    }
    return s;
  }

  function setLang(next) {
    if (next !== 'en' && next !== 'jp') return;
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    /* Toggle the <body> class so CSS can switch the font / weight /
       whatever else. Cheap and dependable. */
    if (document.body) {
      document.body.classList.toggle('lang-jp', lang === 'jp');
      document.body.classList.toggle('lang-en', lang === 'en');
    }
    for (const cb of listeners) {
      try { cb(lang); } catch (e) { console.error(e); }
    }
  }

  function onChange(cb) {
    listeners.push(cb);
    return function unsubscribe() {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /* Apply initial body class as soon as the DOM is ready. */
  function applyInitialClass() {
    if (!document.body) return;
    document.body.classList.toggle('lang-jp', lang === 'jp');
    document.body.classList.toggle('lang-en', lang === 'en');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInitialClass);
  } else {
    applyInitialClass();
  }

  window.I18N = {
    get lang() { return lang; },
    t, setLang, onChange,
  };
})();
