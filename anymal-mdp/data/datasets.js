/* Static configuration for the ANYmal MDP first-contact viz.

   With 100% manual driving there is no canonical pre-canned trajectory to
   precompute — this file only carries grid dimensions, initial entity
   positions, sample reward values for legends/captions, and KaTeX strings
   reused across scenes. */
(function () {
  window.DATA = {
    /* Initial state, used by every scene's onEnter (cold-entry safe). */
    initial: {
      M: 4,
      N: 7,
      anymal: { r: 2, c: 3 },
      ghosts: [
        { r: 0, c: 0 },
        { r: 3, c: 6 },
      ],
      star: { r: 1, c: 5 },
    },

    /* MDP parameters with sensible defaults; per-scene controls override. */
    params: {
      malfunctionProb: 0.15,
      maxRounds: 30,
      seed: 20260509,
    },

    /* Reward magnitudes — duplicated from MDP.REWARD for prose/legend use. */
    rewards: {
      step: -1,
      star: 10,
      collision: -100,
    },

    /* The MDP's five things, used by the title manifesto and the recap. */
    tuple: [
      { sym: 'S', name: 'states',         caption: 'where everything is' },
      { sym: 'A', name: 'actions',        caption: 'what the agent can do' },
      { sym: 'P', name: 'transitions',    caption: 'what actually happens' },
      { sym: 'R', name: 'rewards',        caption: 'what each step costs' },
      { sym: '\\gamma', name: 'discount', caption: 'how much the future counts',
        muted: true, deferred: 'next viz' },
    ],

    /* Reusable KaTeX strings. */
    tex: {
      stateTuple:    's = (\\text{anymal},\\, g_1,\\, g_2,\\, \\bigstar)',
      actionSet:     'A = \\{\\uparrow,\\, \\downarrow,\\, \\leftarrow,\\, \\rightarrow\\}',
      transitionFn:  'P(s\' \\mid s, a)',
      rewardFn:      'R : S \\times A \\times S \\to \\mathbb{R}',
      mdpTuple:      '\\langle S,\\, A,\\, P,\\, R,\\, \\gamma \\rangle',
    },
  };
})();
