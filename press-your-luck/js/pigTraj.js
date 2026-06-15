/* window.PigTraj, the engine adapter that lets window.TrajTree draw the
 * Press Your Luck (Pig) MDP as a chance tree.
 *
 *   TrajTree is engine-agnostic: it asks the host for
 *     successors(state, lever) -> [{ sNext, p, reward }]   (one ply)
 *     isTerminal(state), stateKey(state)
 *   and, for bootstrapped frontier leaves, valueFn(state).
 *
 *   window.Pig exposes the solved exact-state DP (Q / winProb / rivalTurnValue)
 *   and a stochastic sample(), but NOT a deterministic one-ply enumerator over
 *   the EXACT state (my, riv, pot). We build that here, faithfully mirroring
 *   Pig.sample's dynamics (never hard-coding probabilities):
 *
 *     ROLL: a fair d6. Face 1 BUSTS (pot -> 0, the turn passes to the rival);
 *           faces 2..6 add the face value to the pot and my turn continues.
 *           Each face is p = 1/6.
 *     HOLD: bank the pot. If my + pot >= TARGET I WIN outright (terminal,
 *           reward +1); otherwise pot -> 0 and the turn passes to the rival.
 *
 *   Reward is terminal win(+1) / lose(0) with gamma = 1, so a STATE VALUE IS A
 *   WIN PROBABILITY and a leaf G_t is a win probability too.
 *
 *   THE RIVAL-TURN COUPLING (important, and stated on-screen). A bust or a
 *   non-winning HOLD hands the dice to the fixed rival ("holds at 20"). That
 *   child is "rival to move", not my decision and not terminal. We treat such
 *   a child as a BOOTSTRAPPED LEAF: its G_t is the win probability of that
 *   rival-turn state, Pig.rivalTurnValue(my, riv) (the turn passes; the part you
 *   do not control). With a depth-1 tree under ROLL, the grown-pot children are
 *   also bootstrapped leaves carrying their start-of-my-turn win prob. The
 *   weighted leaf sum then equals Q*(s, ROLL) exactly (asserted in code).
 */
(function () {
  const Pig = window.Pig;
  if (!Pig) return;

  const TARGET = Pig.TARGET;          // 50
  const P_FACE = Pig.P_FACE;          // 1/6
  const GAIN   = Pig.ROLL_GAIN;       // [2,3,4,5,6]

  /* One ply of the EXACT-state chance tree for a fixed lever. Probabilities
     come straight from the engine's dynamics (1/6 per face), never typed. */
  function successors(state, lever) {
    const my = state.my, riv = state.riv, pot = state.pot || 0;
    if (lever === 'hold') {
      const myAfter = my + pot;
      if (myAfter >= TARGET) {
        return [{
          sNext: { my: myAfter, riv, pot: 0, terminal: true, win: true, lose: false, turn: 'done' },
          p: 1, reward: 1,
        }];
      }
      return [{
        sNext: { my: myAfter, riv, pot: 0, terminal: false, turn: 'rival' },
        p: 1, reward: 0,
      }];
    }
    /* ROLL: face 1 busts; faces 2..6 grow the pot, my turn continues. */
    const out = [{
      sNext: { my, riv, pot: 0, terminal: false, turn: 'rival' },   // bust (face 1)
      p: P_FACE, reward: 0,
    }];
    for (const f of GAIN) {
      out.push({
        sNext: { my, riv, pot: pot + f, terminal: false, turn: 'me' },
        p: P_FACE, reward: 0,
      });
    }
    return out;
  }

  function isTerminal(s) { return !!(s && s.terminal); }

  /* A stable key so TrajTree's DAG-merge collapses identical destinations.
     My-turn, rival-turn and terminal states live in disjoint key-spaces. */
  function stateKey(s) {
    if (!s) return '';
    if (s.terminal) return s.win ? 'WIN' : 'LOSS';
    if (s.turn === 'rival') return 'RIV:' + s.my + '|' + s.riv;
    return 'ME:' + s.my + '|' + s.riv + '|' + (s.pot || 0);
  }

  /* Win probability of ANY state (the bootstrap value for a frontier leaf).
       my-turn   -> Pig.winProb(my, riv, pot)   (value during my turn)
       rival-turn-> Pig.rivalTurnValue(my, riv) (the turn passes to the rival)
       terminal  -> 1 win / 0 lose                                          */
  function valueFn(s) {
    if (!s) return 0;
    if (s.terminal) return s.win ? 1 : 0;
    if (s.turn === 'rival') return Pig.rivalTurnValue(s.my, s.riv);
    return Pig.winProb(s.my, s.riv, s.pot || 0);
  }

  /* Optimal lever at a my-turn state (used as expandPolicy after the forced
     root action). */
  function optimalLever(s) {
    if (!s || s.terminal || s.turn === 'rival') return 'hold';
    const q = Pig.Q(s.my, s.riv, s.pot || 0);
    return q.roll >= q.hold ? 'roll' : 'hold';
  }

  /* The exact ground-truth Q*(state, lever) the tree's E[G_t] must equal. */
  function qStar(state, lever) {
    const q = Pig.Q(state.my, state.riv, state.pot || 0);
    return lever === 'roll' ? q.roll : q.hold;
  }

  window.PigTraj = {
    successors, isTerminal, stateKey, valueFn, optimalLever, qStar,
    TARGET, P_FACE, GAIN,
  };
})();
