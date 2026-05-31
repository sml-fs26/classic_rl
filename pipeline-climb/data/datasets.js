/* Pipeline Climb: precomputed MDP solution (value iteration, gamma=1).
 *
 * Regenerate with `node precompute/build-datasets.js`. The build script
 * loads the real engine (js/levers.js, js/ladder.js, js/bellman.js) and
 * ASSERTS the verified Q* grid before writing; if those assertions fail,
 * this file is not written. DO NOT hand-edit.
 *
 * window.DATA shape:
 *   policy      5 lever ids (COLD..READY)
 *   V           5 state values
 *   Qstar       5*3 values, indexed stateIndex*3 + leverIdx
 *   levers      lever metadata (id/name/commitment/tone/gloss)
 *   recap       6 concept cards (ladder voice)
 *   demoTrajectory  one canonical signed run under the optimal policy
 *   stageDie / rewards / convergence  the MDP odds + facts
 */
(function () {
  window.DATA = {
    "rungs": [
      "cold",
      "curious",
      "engaged",
      "evaluating",
      "ready"
    ],
    "rungDisplay": [
      "COLD",
      "CURIOUS",
      "ENGAGED",
      "EVALUATING",
      "READY"
    ],
    "numRungs": 5,
    "levers": [
      {
        "id": "nurture",
        "name": "NURTURE",
        "commitment": "low",
        "tone": "calm-blue",
        "gloss": "a soft touch"
      },
      {
        "id": "demo",
        "name": "DEMO",
        "commitment": "mid",
        "tone": "amber",
        "gloss": "book the call"
      },
      {
        "id": "hardclose",
        "name": "HARD CLOSE",
        "commitment": "high",
        "tone": "hot-red",
        "gloss": "send the contract"
      }
    ],
    "leverIds": [
      "nurture",
      "demo",
      "hardclose"
    ],
    "nonTerminalStates": [
      {
        "rung": 0,
        "terminal": false
      },
      {
        "rung": 1,
        "terminal": false
      },
      {
        "rung": 2,
        "terminal": false
      },
      {
        "rung": 3,
        "terminal": false
      },
      {
        "rung": 4,
        "terminal": false
      }
    ],
    "stageDie": {
      "nurture": [
        [
          0.6,
          0.3,
          0.1
        ],
        [
          0.45,
          0.4,
          0.15
        ],
        [
          0.35,
          0.45,
          0.2
        ],
        [
          0.25,
          0.5,
          0.25
        ],
        [
          0.1,
          0.6,
          0.3
        ]
      ],
      "demo": [
        [
          0.25,
          0.3,
          0.45
        ],
        [
          0.65,
          0.25,
          0.1
        ],
        [
          0.65,
          0.25,
          0.1
        ],
        [
          0.6,
          0.3,
          0.1
        ],
        [
          0.25,
          0.55,
          0.2
        ]
      ],
      "hardclose": [
        [
          0.05,
          0.2,
          0.75
        ],
        [
          0.05,
          0.2,
          0.75
        ],
        [
          0.05,
          0.2,
          0.75
        ],
        [
          0.05,
          0.2,
          0.75
        ],
        [
          0.7,
          0.1,
          0.2
        ]
      ]
    },
    "rewards": {
      "signed": 30,
      "lost": -10,
      "touch": -1,
      "gamma": 1
    },
    "policy": [
      "nurture",
      "demo",
      "demo",
      "demo",
      "hardclose"
    ],
    "V": [
      16.7,
      22.65,
      25.1,
      27.02,
      29
    ],
    "Qstar": [
      16.7,
      5.62,
      -3.28,
      21.86,
      22.65,
      17.31,
      24.28,
      25.1,
      22.36,
      26.04,
      27.02,
      24.68,
      27.41,
      27.61,
      29
    ],
    "convergence": {
      "itersFixedPoint": 99,
      "itersTo1e9": 77,
      "policyStableAt": 2
    },
    "demoTrajectory": {
      "start": 0,
      "policy": "optimal",
      "steps": [
        {
          "i": 1,
          "fromRung": 0,
          "lever": "nurture",
          "face": "up",
          "toRung": 1,
          "reward": -1,
          "signed": false,
          "lost": false,
          "terminal": false
        },
        {
          "i": 2,
          "fromRung": 1,
          "lever": "demo",
          "face": "up",
          "toRung": 2,
          "reward": -1,
          "signed": false,
          "lost": false,
          "terminal": false
        },
        {
          "i": 3,
          "fromRung": 2,
          "lever": "demo",
          "face": "up",
          "toRung": 3,
          "reward": -1,
          "signed": false,
          "lost": false,
          "terminal": false
        },
        {
          "i": 4,
          "fromRung": 3,
          "lever": "demo",
          "face": "up",
          "toRung": 4,
          "reward": -1,
          "signed": false,
          "lost": false,
          "terminal": false
        },
        {
          "i": 5,
          "fromRung": 4,
          "lever": "hardclose",
          "face": "up",
          "toRung": -1,
          "reward": 30,
          "signed": true,
          "lost": false,
          "terminal": true
        }
      ],
      "totalReturn": 26
    },
    "recap": [
      {
        "key": "mdp",
        "hue": "mdp",
        "title": "The MDP frame",
        "symbol": "\\langle S,\\, A,\\, P,\\, R,\\, \\gamma \\rangle",
        "caption": "Your CRM has been an MDP all along: the situation (which rung the lead is on), the lever you pull, the odds the lead warms or cools, and the payoff. Five rungs, three levers.",
        "anchor": "Scene 3: the formalization"
      },
      {
        "key": "policy",
        "hue": "policy",
        "title": "Policy = your playbook",
        "symbol": "\\pi : S \\rightarrow A",
        "caption": "A policy is one chosen lever per rung, your SOP. A good one changes its mind as the lead warms: nurture cold, demo the middle, close only when ready.",
        "anchor": "Scene 4: two hand-policies"
      },
      {
        "key": "return",
        "hue": "return",
        "title": "Return over the deal",
        "symbol": "G_i(\\tau) = \\sum_{j \\ge i} r_j",
        "caption": "The payoff summed over the whole deal, not just this touch, and it varies run to run. One lever from one rung gives a distribution of payoffs, not a single number.",
        "anchor": "Scene 6: the return histogram"
      },
      {
        "key": "qstar",
        "hue": "qstar",
        "title": "Q* = the lever scorecard",
        "symbol": "Q^*(s, a) = \\max_\\pi \\mathbb{E}\\,[\\,G_i(\\tau)\\,]",
        "caption": "The true long-run value of pulling lever a in situation s, if you play smart after. The star walks up the ladder: the SAME HARD CLOSE is +29 at READY and -3.28 at COLD.",
        "anchor": "Scene 7: the star-staircase"
      },
      {
        "key": "dp",
        "hue": "dp",
        "title": "DP: compute it if you know the odds",
        "symbol": "Q^*(s, a) = \\mathbb{E}\\,[\\,R + \\max_{a'} Q^*(S', a')\\,]",
        "caption": "With the printed STAGE-DIE odds you can fill the whole scorecard by repeated Bellman backups. The greedy playbook locks in within about three sweeps. You usually do not have the odds.",
        "anchor": "Scene 9: filling Q* with DP"
      },
      {
        "key": "sarsa",
        "hue": "sarsa",
        "title": "SARSA: learn it by playing",
        "symbol": "q[s,a] \\leftarrow q[s,a] + \\alpha\\,(\\,r + q[s',a'] - q[s,a]\\,)",
        "caption": "No printed odds needed: nudge each lever score toward what just happened, exploring a little. The star-staircase emerges from experience: trial, outcome, adjust.",
        "anchor": "Scene 11: the live SARSA demo"
      }
    ]
  };
})();
