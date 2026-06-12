"""
reference-impl.py : the CANONICAL reference implementation skeleton.

This is the SINGLE SOURCE OF TRUTH for every number in a lecture-notes set.
Run it; the trace it prints is what the spec doc quotes verbatim and what the
notes, the website, and the notebook all cite. Bake assertions in so DRIFT
FAILS LOUDLY: if someone edits the algorithm or the example and the canonical
numbers change, the run should crash, not quietly produce different output.

Generalized from agentic-research/LATS/mcts-notebook/reference_mcts.py. Replace
the toy "monotone-accumulator" placeholder below with your topic's algorithm
and worked example. Keep the four disciplines that file embodies:

  1. FULLY DETERMINISTIC. Pin every seed. Re-running reproduces the trace
     byte-for-byte. (If you draw randomness, pass a seeded RNG everywhere.)

  2. AN IMPORT-TIME SEMANTIC-VALIDITY ASSERTION. The headline lesson: SEMANTIC
     VALIDITY is NOT NUMERIC CONSISTENCY. The first LATS grid passed every
     compile / number / dash check yet had UNREACHABLE cells (a dead region),
     caught only when a human eyeballed the diagram. The fix was a BFS
     reachability assertion that runs AT IMPORT, so a sealed or dead example
     can never ship again. Write the analogous structural check for YOUR
     example (graph connected? every special node reachable? distribution sums
     to 1? matrix full-rank? no orphan state?) and call it at import.

  3. A TRACE PRINTER. Print the first few steps with every intermediate number
     a reader could recompute by hand, then the converged / final result.
     This printed text is what the spec doc pastes.

  4. PLAIN ASCII ONLY. No Unicode em/en dashes (the repo write hook rejects
     them). Hyphens, parentheses, commas, colons.

Run:  python3 reference-impl.py
"""

from __future__ import annotations

import math
import random


# ===========================================================================
# 1. THE WORKED EXAMPLE (replace this whole block with your topic's instance)
# ===========================================================================
#
# Placeholder: a 5-node line graph with a "special" start and goal node. The
# only point of the placeholder is to demonstrate the FOUR disciplines above.
# Your real example might be a gridworld MDP, a small Markov chain, a tiny
# attention head, a 7-node search tree, a 4-document RAG index, etc.

NODES = (0, 1, 2, 3, 4)        # the example's state space
EDGES = {0: [1], 1: [2], 2: [3], 3: [4], 4: []}   # directed adjacency
START = 0
GOAL = 4
SPECIAL = {"start": START, "goal": GOAL}

# Pinned hyperparameters: every downstream artifact must use THESE values.
SEED = 0
N_ITERS = 200


# ===========================================================================
# 1b. SEMANTIC-VALIDITY GUARD: fail LOUDLY at import if the example is broken
# ===========================================================================
#
# THE LESSON, restated: a structurally invalid example can pass every numeric
# and dash check and still be pedagogically wrong (an unreachable cell, a dead
# region, a degenerate distribution). Encode the structural invariant of YOUR
# example as code and assert it at import, BEFORE any run. Below: a BFS that
# every special node is reachable from START and there is no dead (unreachable)
# node. Adapt the invariant; keep the "assert at import" discipline.

def reachable_from(start):
    """Set of nodes reachable from `start` by directed edges (BFS flood-fill)."""
    from collections import deque
    seen, q = {start}, deque([start])
    while q:
        u = q.popleft()
        for v in EDGES.get(u, []):
            if v not in seen:
                seen.add(v)
                q.append(v)
    return seen


def assert_example_valid():
    """
    Fail loudly (AssertionError) unless, from START:
      (1) every special node is reachable, AND
      (2) there is no dead node (every node is reachable; zero dead space).
    Called at IMPORT so a mis-specified example never runs silently.
    Replace the body with the structural invariant of your own example.
    """
    reached = reachable_from(START)
    for name, node in SPECIAL.items():
        assert node in reached, (
            f"validity check FAILED: special node {name}={node} is not "
            f"reachable from START={START}."
        )
    dead = set(NODES) - reached
    assert not dead, (
        f"validity check FAILED: {len(dead)} node(s) are dead (unreachable "
        f"from START={START}): {sorted(dead)}."
    )


# Run the guard at import time: importing a broken example raises immediately.
assert_example_valid()


# ===========================================================================
# 2. THE ALGORITHM (replace with your topic's method; keep it deterministic)
# ===========================================================================
#
# Placeholder "algorithm": a seeded running-mean accumulator over a fixed walk,
# standing in for whatever iterative quantity your notes teach (a value
# estimate, a posterior, an attention weight, a loss curve). The single
# requirement is determinism: same seed gives the same trace.

def run(n_iters, seed, trace_first=0):
    """
    Run `n_iters` updates of the (placeholder) running-mean accumulator over a
    fixed deterministic signal. Returns the final running mean. If
    trace_first > 0, print the first `trace_first` updates with full arithmetic
    so a reader can recompute them by hand (this printed text is what the spec
    doc quotes verbatim).
    """
    rng = random.Random(seed)
    mean, count = 0.0, 1            # init count to 1 (well-defined averages)
    for i in range(1, n_iters + 1):
        sample = rng.random()       # the only randomness; fully seeded
        count += 1
        new_mean = (mean * (count - 1) + sample) / count
        if i <= trace_first:
            print(f"  step {i:>3}: sample={sample:.4f}  "
                  f"mean {mean:.4f} -> {new_mean:.4f}  (count -> {count})")
        mean = new_mean
    return mean


# ===========================================================================
# 3. MAIN: pin the canonical numbers (this output IS the spec)
# ===========================================================================

def main():
    print("CANONICAL REFERENCE RUN")
    print("=" * 60)
    print(f"nodes={NODES}  start={START}  goal={GOAL}")
    print(f"seed={SEED}  iterations={N_ITERS}")
    print("\nFirst 3 updates (recompute these by hand to check the notes):")
    final = run(N_ITERS, SEED, trace_first=3)
    print(f"\nCONVERGED running mean after {N_ITERS} iterations: {final:.4f}")

    # OPTIONAL but recommended: a numeric self-check that pins the headline
    # number, so editing the algorithm without updating the notes fails loudly.
    EXPECTED = 0.5  # replace with the real converged value once you run it
    assert abs(final - EXPECTED) < 0.05, (
        f"DRIFT: converged value {final:.4f} != expected {EXPECTED} (+- 0.05). "
        f"Either the algorithm changed or the spec is stale; reconcile both."
    )


if __name__ == "__main__":
    main()
