#!/usr/bin/env python3
"""Repair or Replace — verified MDP, reference value iteration.

This is the source-of-truth model for the viz. It solves the 4-state x 3-action
"repair or replace" MDP by value iteration and ASSERTS the intended optimal
policy so the design can't silently drift while tuning. The eventual
`precompute/build-datasets.js` should reproduce these exact numbers (the
pipeline-climb pattern: assert Q* before writing datasets.js).

Run:  python3 value_iteration.py
"""

STATES = ["HEALTHY", "WORN", "SHAKY", "FAILING"]   # 0..3, increasing wear
ACTS   = ["RUN", "SERVICE", "REPLACE"]
N = 4

# --- Dynamics & rewards (tuned; every state load-bearing) ---------------------
# RUN: weekly delivery profit by condition. Steep cliff WORN(72) -> SHAKY(40)
# is what makes the SERVICE|REPLACE frontier well-crossed at SHAKY.
REV_RUN = [95, 72, 40, 16]
# Breakdown chance per week if RUN; spikes at SHAKY. A breakdown costs B and
# dumps the van into FAILING.
P_BD    = [0.02, 0.08, 0.28, 0.55]
B       = 280
# Non-breakdown degradation while running: [stay, down1, down2] (capped at FAILING).
DEGR = {0: [0.35, 0.55, 0.10],
        1: [0.30, 0.55, 0.15],
        2: [0.45, 0.55, 0.00],
        3: [0.65, 0.35, 0.00]}
# SERVICE: a week in the shop, no profit. Strong on a merely-worn van, weak on a
# clapped-out one (this is what makes REPLACE decisively beat SERVICE at SHAKY).
C_SERVICE = 50
SERV_UP = {0: [1.00, 0.00, 0.00],   # [stay, up1, up2] toward HEALTHY
           1: [0.05, 0.70, 0.25],
           2: [0.45, 0.50, 0.05],
           3: [0.55, 0.42, 0.03]}
# REPLACE: a week offline, capital cost, resets to HEALTHY.
C_REPLACE = 130

GAMMA = 0.9


def trans(s, a):
    """Return list of (prob, reward, next_state)."""
    out = []
    if a == "RUN":
        p = P_BD[s]
        if p > 0:
            out.append((p, REV_RUN[s] - B, N - 1))
        rest = 1 - p
        st, d1, d2 = DEGR[s]
        for prob, delta in [(st, 0), (d1, 1), (d2, 2)]:
            if prob > 0:
                out.append((rest * prob, REV_RUN[s], min(N - 1, s + delta)))
    elif a == "SERVICE":
        st, u1, u2 = SERV_UP[s]
        for prob, up in [(st, 0), (u1, 1), (u2, 2)]:
            if prob > 0:
                out.append((prob, -C_SERVICE, max(0, s - up)))
    else:  # REPLACE
        out.append((1.0, -C_REPLACE, 0))
    return out


def solve(gamma=GAMMA):
    V = [0.0] * N
    Q = [[0.0] * 3 for _ in range(N)]
    for _ in range(100000):
        Q = [[sum(p * (r + gamma * V[s2]) for p, r, s2 in trans(s, a))
              for a in ACTS] for s in range(N)]
        nV = [max(row) for row in Q]
        if max(abs(nV[i] - V[i]) for i in range(N)) < 1e-9:
            V = nV
            break
        V = nV
    pol = [ACTS[Q[s].index(max(Q[s]))] for s in range(N)]
    return V, Q, pol


def main():
    V, Q, pol = solve()
    print(f"Repair or Replace  (gamma={GAMMA})")
    print(f"{'state':9}{'RUN':>8}{'SERVICE':>9}{'REPLACE':>9}   pi*")
    for s in range(N):
        print(f"{STATES[s]:9}{Q[s][0]:8.1f}{Q[s][1]:9.1f}{Q[s][2]:9.1f}   {pol[s]}")
    print("V:", [round(v, 1) for v in V])

    # The design contract: assert the intended policy and the surprise.
    assert pol == ["RUN", "SERVICE", "REPLACE", "REPLACE"], pol
    # Surprise: REPLACE strictly beats SERVICE at SHAKY though the van still runs.
    assert Q[2][2] > Q[2][1] + 15, "SHAKY replace margin too thin"
    # Two confident frontiers (both ~+23 by construction).
    assert Q[1][1] > Q[1][0] + 15 and Q[1][1] > Q[1][2] + 15, "WORN service margin"
    print("\nOK: pi* = RUN / SERVICE / REPLACE / REPLACE, both frontiers confident.")

    print("\ngamma sweep (both frontiers slide left as patience rises):")
    for g in [0.4, 0.6, 0.8, 0.9, 0.95, 0.99]:
        _, _, p = solve(g)
        print(f"  g={g:<4}: " + "  ".join(f"{STATES[s][:4]}:{p[s][:3]}" for s in range(N)))


if __name__ == "__main__":
    main()
