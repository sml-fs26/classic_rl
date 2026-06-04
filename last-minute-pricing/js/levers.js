/* Pricing levers: the action space of the Last-Minute Pricing MDP.
 *
 * Two price tags. Each carries a per-unit price and an explicit demand
 * distribution: P(units sold today = k) BEFORE capping at inventory on hand.
 * The demand draw is the only stochastic element (no accuracy roll, no
 * opponent), and the odds are hidden from the player.
 *
 *   id         price   units sold today (the demand draw)         E[units/day]
 *   premium      5      0 w.p. .60 / 1 w.p. .40                    0.40
 *   standard     2      1 w.p. .20 / 2 w.p. .40 / 3 w.p. .40       2.20
 *
 * Two genuinely different bets: PREMIUM holds out for the high price and sells
 * slowly; STANDARD is the everyday price that clears stock fast. Both are
 * optimal somewhere on the 5x4 board (the precompute asserts it). STANDARD is
 * the former FIRE-SALE tag, relabelled; the old middle ($3) tag was retired.
 *
 * Mirrors the shape of the old window.Moves (MOVE_IDS / MOVE_BY_ID) so the
 * reused engine (bellman.js, sarsa.js) consumes it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Levers. */
(function () {
  const LEVERS = [
    { id: 'premium',  name: 'PREMIUM',  price: 5, demand: [[0, 0.60], [1, 0.40]] },
    { id: 'standard', name: 'STANDARD', price: 2, demand: [[1, 0.20], [2, 0.40], [3, 0.40]] },
  ];

  const LEVER_IDS = LEVERS.map(l => l.id);
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  /* Expected units sold per day under a lever, ignoring inventory cap
     (used for the last-day hand-computable backup and the lever blurbs). */
  function expectedUnits(id) {
    const l = LEVER_BY_ID[id];
    return l ? l.demand.reduce((s, kp) => s + kp[0] * kp[1], 0) : 0;
  }
  function priceOf(id)  { const l = LEVER_BY_ID[id]; return l ? l.price : 0; }
  function demandOf(id) { const l = LEVER_BY_ID[id]; return l ? l.demand : []; }
  function maxDraw(id)  { const d = demandOf(id); return d.length ? d[d.length - 1][0] : 0; }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID,
    expectedUnits, priceOf, demandOf, maxDraw,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
  };
})();
