/* Levers: the action space of the Stale-by-Sundown MDP.
 *
 * Three levers, the same three a real shop owner has each hour:
 *
 *   id        label      role     colour
 *   HOLD      HOLD       premium  green   (keep full price; best margin, slow)
 *   DISCOUNT  DISCOUNT   act-now  amber   (cut the price; thin margin, fast)
 *   DUMP      DUMP       cut-loss red     (write off the batch, restock fresh)
 *
 * All three levers are ALWAYS legal at every shelf state (unlike the
 * gambler's clamped stakes), so the Q-table is a clean 15 x 3 with no
 * greyed cells. The single stochastic element is the "did a customer buy?"
 * meter, which lives in bakery.js (transitions), not here.
 *
 * Mirrors the shape of the reused engine's window.Moves (MOVE_IDS /
 * MOVE_BY_ID) so bellman.js / sarsa.js consume it unchanged; aliased to
 * window.Moves at the bottom. New scene code should read window.Levers. */
(function () {
  const LEVERS = [
    { id: 'HOLD',     name: 'HOLD',     role: 'premium', sale: 5  },
    { id: 'DISCOUNT', name: 'DISCOUNT', role: 'act-now', sale: 2  },
    { id: 'DUMP',     name: 'DUMP',     role: 'cut-loss', sale: 0  },
  ];

  const LEVER_IDS = LEVERS.map(l => l.id);
  const LEVER_BY_ID = {};
  for (const l of LEVERS) LEVER_BY_ID[l.id] = l;

  function saleOf(id) { const l = LEVER_BY_ID[id]; return l ? l.sale : 0; }

  window.Levers = {
    LEVERS, LEVER_IDS, LEVER_BY_ID,
    saleOf,
  };

  /* Legacy alias for the reused engine files (bellman.js / sarsa.js read
     window.Moves.MOVE_IDS and window.Moves.MOVE_BY_ID). */
  window.Moves = {
    MOVE_IDS: LEVER_IDS,
    MOVE_BY_ID: LEVER_BY_ID,
  };
})();
