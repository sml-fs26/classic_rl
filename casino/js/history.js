/* Per-scene step history.

   Casino's records are { arm, reward, mode, eps, t } — one per pull. The
   shape is opaque to History; scenes pass whatever record they need. SKILL §
   step-engine pattern: state-is-source-of-truth, prev = reset+replay, so we
   only need to remember *what was pulled* and replay it through the bandit
   to reconstruct empirical means and regret. The arm is enough; reward is
   redundant (it's a function of arm + rng-state) but stored for fast
   ledger renders without a re-run.

   Pressing ArrowLeft rewinds, ArrowRight replays; at head, ArrowRight yields
   to the scene driver to advance to the next scene. */
(function () {
  function create() {
    const records = [];   // arbitrary shape — scenes choose
    let cursor = 0;       // 0..records.length; cursor === records.length means "at the head"

    return {
      /* Record a fresh entry. Truncates any "future" records left over from
         a previous rewind — the user has overwritten history. */
      push(record) {
        records.length = cursor;
        records.push(record);
        cursor = records.length;
      },
      length() { return records.length; },
      cursor() { return cursor; },
      atHead() { return cursor === records.length; },
      atStart() { return cursor === 0; },
      list() { return records.slice(0, cursor); },
      all() { return records.slice(); },
      get(i) { return records[i]; },
      stepBack() {
        if (cursor === 0) return false;
        cursor--;
        return true;
      },
      stepForward() {
        if (cursor === records.length) return false;
        cursor++;
        return true;
      },
      reset() {
        records.length = 0;
        cursor = 0;
      },
    };
  }

  window.History = { create };
})();
