/* Stakes: the action space of the Gambler's Ruin MDP.
 *
 * Three bet sizes, the three levers a manager can pull each turn:
 *
 *   id      bet   label    role
 *   bet1     1    BET $1   timid   (calm blue)
 *   bet2     2    BET $2   medium  (amber)
 *   bet3     3    BET $3   bold    (burnt orange)
 *
 * Unlike the perishable-pricing example, the bet is NOT a probabilistic
 * draw: the stake just sets how far the coin can move you (+a on a win,
 * minus a on a loss). The single stochastic element, the biased coin,
 * lives in gambler.js, not here.
 *
 * A stake is clamped out (illegal, greyed on screen) at a capital s when
 *   a > s          you cannot bet more than you hold, or
 *   a > 10 minus s you cannot bet past the goal.
 * The action SET stays a constant {1,2,3} so the Q-table is a clean 9x3;
 * clamped actions are simply marked unavailable (Q = minus Infinity in the
 * backup, so they are never chosen) and rendered disabled.
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Stakes. */
(function () {
  const STAKES = [
    { id: 'bet1', bet: 1, name: 'BET $1', role: 'timid'  },
    { id: 'bet2', bet: 2, name: 'BET $2', role: 'medium' },
    { id: 'bet3', bet: 3, name: 'BET $3', role: 'bold'   },
  ];

  const STAKE_IDS  = STAKES.map(s => s.id);
  const STAKE_BY_ID = {};
  for (const s of STAKES) STAKE_BY_ID[s.id] = s;

  function betOf(id)  { const s = STAKE_BY_ID[id]; return s ? s.bet : 0; }
  function idForBet(b) { return STAKE_IDS[b - 1] || null; }     // 1->bet1, 2->bet2, 3->bet3

  window.Stakes = {
    STAKES, STAKE_IDS, STAKE_BY_ID,
    betOf, idForBet,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: STAKE_IDS,
    MOVE_BY_ID: STAKE_BY_ID,
  };
})();
