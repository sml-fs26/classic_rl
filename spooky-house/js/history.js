/* Per-scene action history.

   For Spooky House, the student picks a path step-by-step in scene 1 with
   right/down keys. To support the SKILL §"Step engine" pattern (state-is-
   source-of-truth, prev = reset+replay), each scene that drives the agent
   keeps a History instance. Pressing ArrowLeft in the scene rewinds to the
   previous step; ArrowRight steps forward through the recorded actions until
   the head is reached, then yields to the scene driver to advance the scene.

   The action vocabulary here is just {'right', 'down'}, Spooky House
   restricts the action set on purpose. The seed field is kept for symmetry
   with the ANYmal viz; all transitions in Spooky House are deterministic, so
   the seed isn't actually consulted on replay. */
(function () {
  function create() {
    const actions = [];   // [{ action, seed }]
    let cursor = 0;       // 0..actions.length; cursor === actions.length means "at the head"

    return {
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
