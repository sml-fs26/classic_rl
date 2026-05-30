/* Press Your Luck (Pig) - exact-state win-probability DP results.
 *
 * Regenerate with `node precompute/build-datasets.js`. The build script
 * asserts the twist (pot=18: ROLL behind/even, HOLD ahead) and the
 * climbing hold-threshold staircase (AHEAD < EVEN < BEHIND); if those
 * assertions fail, this file is not written.
 *
 * A state value here IS a win probability (gamma = 1, +1 win / 0 loss).
 */
(function () {
  window.DATA = {
    "target": 50,
    "rivalHold": 20,
    "gamma": 1,
    "potBuckets": 6,
    "potBucketLabels": [
      "0",
      "1-5",
      "6-10",
      "11-15",
      "16-20",
      "21+"
    ],
    "potBucketRep": [
      0,
      3,
      8,
      13,
      18,
      24
    ],
    "standings": 3,
    "standingLabels": [
      "BEHIND",
      "EVEN",
      "AHEAD"
    ],
    "standingRep": [
      {
        "my": 10,
        "riv": 25
      },
      {
        "my": 20,
        "riv": 20
      },
      {
        "my": 25,
        "riv": 10
      }
    ],
    "levers": [
      {
        "id": "roll",
        "name": "ROLL"
      },
      {
        "id": "hold",
        "name": "HOLD"
      }
    ],
    "leverIds": [
      "roll",
      "hold"
    ],
    "oraclePolicy": [
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "roll",
      "hold",
      "hold",
      "hold",
      "hold"
    ],
    "oracleQ": [
      0.4829,
      0.3682,
      0.6627,
      0.5382,
      0.7913,
      0.6871,
      0.4995,
      0.4016,
      0.6807,
      0.5803,
      0.8064,
      0.7286,
      0.5327,
      0.4621,
      0.7167,
      0.6546,
      0.8366,
      0.7967,
      0.5743,
      0.5287,
      0.7617,
      0.7331,
      0.8744,
      0.8636,
      0.6263,
      0.6055,
      0.8181,
      0.8135,
      0.9144,
      0.9198,
      0.7054,
      0.7059,
      0.8866,
      0.9047,
      0.9478,
      0.9685
    ],
    "sweepSnapshots": [
      {
        "sweep": 1,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll"
        ],
        "Q": [
          0.2793,
          0.1498,
          0.4211,
          0.2392,
          0.5095,
          0.2996,
          0.2981,
          0.1715,
          0.4475,
          0.2738,
          0.5399,
          0.343,
          0.3356,
          0.2148,
          0.5001,
          0.343,
          0.6006,
          0.4297,
          0.3826,
          0.2691,
          0.5661,
          0.4297,
          0.6763,
          0.5378,
          0.4414,
          0.3371,
          0.6484,
          0.5378,
          0.766,
          0.6659,
          0.5321,
          0.4419,
          0.7781,
          0.7083,
          0.8833,
          0.8333
        ]
      },
      {
        "sweep": 2,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "hold"
        ],
        "Q": [
          0.3697,
          0.2389,
          0.5417,
          0.3776,
          0.6492,
          0.4775,
          0.3887,
          0.2708,
          0.5655,
          0.4251,
          0.674,
          0.534,
          0.4266,
          0.3326,
          0.613,
          0.5145,
          0.7237,
          0.6374,
          0.474,
          0.4062,
          0.6724,
          0.6161,
          0.7855,
          0.7485,
          0.5335,
          0.4925,
          0.7468,
          0.7269,
          0.8581,
          0.8545,
          0.6252,
          0.6126,
          0.8483,
          0.8655,
          0.9129,
          0.9511
        ]
      },
      {
        "sweep": 3,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "roll",
          "hold",
          "hold"
        ],
        "Q": [
          0.4257,
          0.2971,
          0.6084,
          0.4599,
          0.7272,
          0.5843,
          0.4443,
          0.3323,
          0.6299,
          0.5089,
          0.7479,
          0.6391,
          0.4815,
          0.3984,
          0.6729,
          0.5966,
          0.7893,
          0.7323,
          0.528,
          0.4739,
          0.7267,
          0.69,
          0.8412,
          0.8246,
          0.5864,
          0.5587,
          0.794,
          0.7873,
          0.8939,
          0.9037,
          0.676,
          0.6735,
          0.8721,
          0.8972,
          0.9307,
          0.9664
        ]
      },
      {
        "sweep": 5,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "hold",
          "hold",
          "hold"
        ],
        "Q": [
          0.4702,
          0.3511,
          0.6533,
          0.5236,
          0.7802,
          0.6676,
          0.4875,
          0.3861,
          0.6721,
          0.5684,
          0.7964,
          0.7135,
          0.522,
          0.4498,
          0.7096,
          0.6466,
          0.829,
          0.7882,
          0.5652,
          0.5197,
          0.7564,
          0.7276,
          0.8698,
          0.8595,
          0.6192,
          0.5976,
          0.8151,
          0.8112,
          0.9111,
          0.9189,
          0.7011,
          0.702,
          0.8841,
          0.9044,
          0.9446,
          0.9685
        ]
      },
      {
        "sweep": 8,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "hold",
          "hold",
          "hold"
        ],
        "Q": [
          0.4818,
          0.3666,
          0.6621,
          0.5372,
          0.7906,
          0.6858,
          0.4985,
          0.4003,
          0.6802,
          0.5796,
          0.8058,
          0.7277,
          0.5318,
          0.4612,
          0.7163,
          0.6542,
          0.8361,
          0.7963,
          0.5735,
          0.5282,
          0.7614,
          0.7328,
          0.8741,
          0.8635,
          0.6257,
          0.605,
          0.818,
          0.8134,
          0.9142,
          0.9198,
          0.7051,
          0.7057,
          0.8864,
          0.9047,
          0.9476,
          0.9685
        ]
      },
      {
        "sweep": 14,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "hold",
          "hold",
          "hold"
        ],
        "Q": [
          0.4829,
          0.3682,
          0.6627,
          0.5382,
          0.7913,
          0.6871,
          0.4995,
          0.4016,
          0.6807,
          0.5803,
          0.8064,
          0.7286,
          0.5327,
          0.4621,
          0.7167,
          0.6546,
          0.8366,
          0.7967,
          0.5743,
          0.5287,
          0.7617,
          0.7331,
          0.8744,
          0.8636,
          0.6263,
          0.6055,
          0.8181,
          0.8135,
          0.9144,
          0.9198,
          0.7054,
          0.7059,
          0.8866,
          0.9047,
          0.9478,
          0.9685
        ]
      },
      {
        "sweep": 42,
        "policy": [
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "roll",
          "hold",
          "hold",
          "hold",
          "hold"
        ],
        "Q": [
          0.4829,
          0.3682,
          0.6627,
          0.5382,
          0.7913,
          0.6871,
          0.4995,
          0.4016,
          0.6807,
          0.5803,
          0.8064,
          0.7286,
          0.5327,
          0.4621,
          0.7167,
          0.6546,
          0.8366,
          0.7967,
          0.5743,
          0.5287,
          0.7617,
          0.7331,
          0.8744,
          0.8636,
          0.6263,
          0.6055,
          0.8181,
          0.8135,
          0.9144,
          0.9198,
          0.7054,
          0.7059,
          0.8866,
          0.9047,
          0.9478,
          0.9685
        ]
      }
    ],
    "twist": {
      "pot18": {
        "behind": {
          "my": 10,
          "riv": 25,
          "roll": 0.6263,
          "hold": 0.6055,
          "best": "roll"
        },
        "even": {
          "my": 20,
          "riv": 20,
          "roll": 0.8181,
          "hold": 0.8135,
          "best": "roll"
        },
        "ahead": {
          "my": 25,
          "riv": 10,
          "roll": 0.9144,
          "hold": 0.9198,
          "best": "hold"
        }
      }
    },
    "staircase": {
      "behind": 24,
      "even": 20,
      "ahead": 16,
      "ladder": [
        {
          "own": 10,
          "ahead": 18,
          "even": 21,
          "behind": 24
        },
        {
          "own": 15,
          "ahead": 17,
          "even": 21,
          "behind": 35
        },
        {
          "own": 20,
          "ahead": 16,
          "even": 20,
          "behind": 30
        },
        {
          "own": 25,
          "ahead": 16,
          "even": 19,
          "behind": 25
        }
      ],
      "breakEven": 20
    },
    "startWinProb": 0.6433,
    "recap": [
      {
        "key": "mdp",
        "label": "MDP",
        "scene": 3,
        "title": "THE FOUR-PART FRAME",
        "text": "The situation is (pot, standing). The lever is ROLL or HOLD. The part you do not control is the die. The payoff is binary: +1 if you reach 50 first, 0 if the rival does."
      },
      {
        "key": "policy",
        "label": "POLICY",
        "scene": 4,
        "title": "YOUR PLAYBOOK",
        "text": "A policy assigns one lever to every cell of the board. The naive playbook banks at 20 and ignores the scoreboard. The good one reads your standing."
      },
      {
        "key": "return",
        "label": "RETURN",
        "scene": 6,
        "title": "THE WIN, NOT THE GAME",
        "text": "The return from here is the eventual win or loss: 1 or 0. Judge a lever by its win RATE over many games, never by one lucky roll."
      },
      {
        "key": "qstar",
        "label": "Q*",
        "scene": 7,
        "title": "THE HONEST WIN-ODDS",
        "text": "Q*(s, lever) is the true long-run win probability of pulling that lever now, then playing smart. At pot 18 the best lever flips on standing alone: ROLL when behind, HOLD when ahead."
      },
      {
        "key": "dp",
        "label": "DP",
        "scene": 9,
        "title": "THE EXACT PLAYBOOK",
        "text": "Knowing the die (a flat 1/6) and pinning the rival makes this a single-agent MDP. Sweep the Bellman backup to a fixed point and the climbing staircase draws itself."
      },
      {
        "key": "sarsa",
        "label": "SARSA",
        "scene": 11,
        "title": "LEARN IT BY PLAYING",
        "text": "Drop the model. Play game after game, nudge the table toward what actually happened, and the same press-when-behind, bank-when-ahead rule emerges on its own."
      }
    ],
    "demoTrajectory": {
      "seed": 20,
      "target": 50,
      "finalMy": 50,
      "finalRiv": 23,
      "iWon": true,
      "turns": 23,
      "steps": [
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 0
          },
          "face": 5,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 5
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 5
          },
          "face": 3,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 8
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 8
          },
          "face": 4,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 12
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 12
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 14
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 14
          },
          "face": 3,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 17
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 17
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 19
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 19
          },
          "face": 5,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 0,
            "riv": 0,
            "pot": 24
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "hold",
          "before": {
            "my": 0,
            "riv": 0,
            "pot": 24
          },
          "face": 0,
          "busted": false,
          "banked": 24,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 0
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "rival",
          "before": {
            "my": 24,
            "riv": 0
          },
          "rolls": [
            {
              "kind": "roll",
              "face": 6,
              "rpot": 6
            },
            {
              "kind": "roll",
              "face": 3,
              "rpot": 9
            },
            {
              "kind": "roll",
              "face": 6,
              "rpot": 15
            },
            {
              "kind": "roll",
              "face": 2,
              "rpot": 17
            },
            {
              "kind": "bust",
              "face": 1,
              "rpotBefore": 17
            }
          ],
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 0
          },
          "rivalWon": false,
          "terminal": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 0
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 2
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 2
          },
          "face": 4,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 6
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 6
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 8
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 8
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 10
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 10
          },
          "face": 6,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 24,
            "riv": 0,
            "pot": 16
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "hold",
          "before": {
            "my": 24,
            "riv": 0,
            "pot": 16
          },
          "face": 0,
          "busted": false,
          "banked": 16,
          "after": {
            "my": 40,
            "riv": 0,
            "pot": 0
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "rival",
          "before": {
            "my": 40,
            "riv": 0
          },
          "rolls": [
            {
              "kind": "roll",
              "face": 2,
              "rpot": 2
            },
            {
              "kind": "bust",
              "face": 1,
              "rpotBefore": 2
            }
          ],
          "after": {
            "my": 40,
            "riv": 0,
            "pot": 0
          },
          "rivalWon": false,
          "terminal": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 40,
            "riv": 0,
            "pot": 0
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 40,
            "riv": 0,
            "pot": 2
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 40,
            "riv": 0,
            "pot": 2
          },
          "face": 1,
          "busted": true,
          "banked": 0,
          "after": {
            "my": 40,
            "riv": 0,
            "pot": 0
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "rival",
          "before": {
            "my": 40,
            "riv": 0
          },
          "rolls": [
            {
              "kind": "roll",
              "face": 2,
              "rpot": 2
            },
            {
              "kind": "roll",
              "face": 3,
              "rpot": 5
            },
            {
              "kind": "roll",
              "face": 6,
              "rpot": 11
            },
            {
              "kind": "roll",
              "face": 6,
              "rpot": 17
            },
            {
              "kind": "roll",
              "face": 6,
              "rpot": 23
            },
            {
              "kind": "hold",
              "rpot": 23,
              "rivNew": 23
            }
          ],
          "after": {
            "my": 40,
            "riv": 23,
            "pot": 0
          },
          "rivalWon": false,
          "terminal": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 40,
            "riv": 23,
            "pot": 0
          },
          "face": 6,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 40,
            "riv": 23,
            "pot": 6
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 40,
            "riv": 23,
            "pot": 6
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 40,
            "riv": 23,
            "pot": 8
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "roll",
          "before": {
            "my": 40,
            "riv": 23,
            "pot": 8
          },
          "face": 2,
          "busted": false,
          "banked": 0,
          "after": {
            "my": 40,
            "riv": 23,
            "pot": 10
          },
          "reward": 0,
          "terminal": false,
          "win": false
        },
        {
          "who": "me",
          "lever": "hold",
          "before": {
            "my": 40,
            "riv": 23,
            "pot": 10
          },
          "face": 0,
          "busted": false,
          "banked": 10,
          "after": {
            "my": 50,
            "riv": 23,
            "pot": 0
          },
          "reward": 1,
          "terminal": true,
          "win": true
        }
      ]
    },
    "tex": {
      "state": "s = (\\text{pot bucket } p,\\ \\text{standing } c)",
      "actions": "A = \\{\\, \\textsf{ROLL},\\ \\textsf{HOLD} \\,\\}",
      "return": "G_i(\\tau) = \\sum_{j \\ge i} r_j \\in \\{0, 1\\}",
      "qstar": "Q^*(s, a) = \\max\\ \\mathbb{E}\\,[\\,G_i(\\tau)\\,]",
      "bellman": "Q^*(s, a) = \\mathbb{E}\\,[\\, R + \\max_{a'} Q^*(S', a') \\,]",
      "sarsa": "q[s,a] \\leftarrow q[s,a] + \\alpha\\,[\\, r + q[s',a'] - q[s,a] \\,]",
      "breakEven": "\\tfrac{2+3+4+5+6}{6} = 3.33 = 20 \\cdot \\tfrac{1}{6}"
    }
  };
})();
