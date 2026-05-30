/* Per-scene action history.

   Manual driving makes the user the policy. To support the SKILL §"Step
   engine" pattern (state-is-source-of-truth, prev = reset+replay), each scene
   that drives the grid keeps a History instance. Pressing ArrowLeft in the
   scene rewinds to the previous action; ArrowRight steps forward through the
   recorded actions until the head is reached, then yields to the scene
   driver to advance to the next scene. */
(function () {
  function create() {
    const actions = [];   // [{ action, seed }] — seed is captured per-step so replays are deterministic
    let cursor = 0;       // 0..actions.length; cursor === actions.length means "at the head"

    return {
      /* Record a freshly performed action. Truncates any "future" actions
         left over from a previous rewind — the user has overwritten history. */
      push(action, seed) {
        actions.length = cursor;
        actions.push({ action, seed });
        cursor = actions.length;
      },
      length() { return actions.length; },
      cursor() { return cursor; },
      atHead() { return cursor === actions.length; },
      atStart() { return cursor === 0; },
      list() { return actions.slice(0, cursor); },
      all() { return actions.slice(); },
      action(i) { return actions[i]; },
      stepBack() {
        if (cursor === 0) return false;
        cursor--;
        return true;
      },
      stepForward() {
        if (cursor === actions.length) return false;
        cursor++;
        return true;
      },
      reset() {
        actions.length = 0;
        cursor = 0;
      },
    };
  }

  window.History = { create };
})();
