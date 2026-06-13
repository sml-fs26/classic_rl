# Teaching the SARSA update to managers: a derivation workflow

A design document for reworking the SARSA section of the slides
(`slides/rl-slides.tex`, §6) and lecture notes
(`lecture_notes/reinforcement_learning.tex`, §6) so that a manager
audience *derives* the update formula instead of being handed it.

Target end-state formula the whole arc builds toward:

```
q(s_i, a_i)  <-  q(s_i, a_i)  +  alpha [ r_i  +  gamma * q(s_{i+1}, a_{i+1})  -  q(s_i, a_i) ]
                  old guess        cash      trade-in (value of where you land)   old guess
```

---

## 1. Where the abruptness actually is

The current SARSA arc has good bones. The chain is:

> three bookkeepers -> cash-only nudge -> alpha knob -> "cash-only ledger
> lies" -> grade-the-week trade-in -> full formula -> one worked nudge.

Managers fall off at three specific jumps:

1. **From "average of cash" to "average of cash + discounted future."**
   The `Grade the week like a trade-in` slide introduces the future term
   `gamma * q(s_{i+1}, a_{i+1})` in a single overlay step. That is the
   conceptual heart of SARSA, and it arrives almost as fast as the
   cash-only version did.
2. **Bootstrapping (the circularity).** "Use your own current guess `q` in
   place of the unknown `Q*`" is stated in one muted footnote line.
   Managers' instinct is "wait, you're using a number you haven't learned
   yet to learn that number" -- and they never get to *feel* why that is
   allowed.
3. **The closing equivalence to Bellman.** "SARSA is the Bellman equation
   with the expectation replaced by an arriving average" is the punchline,
   but it is asserted in prose, not shown as a transformation.

The fix is not more slides per se. It is inserting **discovery moments**
where managers produce each term themselves, so that by the time the boxed
formula appears they recognize it as something they wrote.

---

## 2. The spine: one forecasting question, answered Monday by Monday

Reframe the whole derivation as a single recurring task managers already do:

> *"Every Monday I revise a forecast. Let's revise the forecast for what a
> decision is worth."*

Everything hangs off that. Each activity below adds exactly one term to the
formula, and a running "formula so far" strip stays visible at the bottom of
every SARSA slide so the build is literally cumulative.

---

## 3. Activities (manager-appropriate, low-tech)

### Activity 1 -- "Run the cell." (motivates the nudge + alpha)
*Extends the existing `Three bookkeepers, one bad week` slide.*

Hand each table of managers a face-down stack of "week cards" for
`(WORN, RUN)`: mostly `+72`, the occasional `-208`. They maintain **one**
number on a sticky note -- no columns, no filing cabinet. Reveal cards one
at a time; after each, they update the sticky toward the card. Run it three
ways across three tables:

- (a) overwrite with the latest card,
- (b) keep a true running average (calculator allowed),
- (c) nudge 15% of the way.

Then show all three trajectories on screen. The overwriter whiplashes; the
averager is right but needs the whole history; the nudger tracks (b) without
storing anything. **They have now invented exponential smoothing and felt
why alpha is small.**

### Activity 2 -- "Same cash, different Monday." (motivates the future term)
*Turns the existing `The cash-only ledger lies` slide into a forced
realization.*

Give every manager two logbook lines that booked **identical** cash this
week but left the van in different states -- e.g. both paid `+16`, but one
leaves you `HEALTHY` and one leaves you `FAILING`. Ask one question:

> *"Were these two weeks equally good for the business?"*

Every manager says no. Push: *"Put a dollar figure on the difference."* They
reach for "what's the leftover van worth going forward" -- which is exactly
`gamma * q(s_{i+1}, a_{i+1})`.

### Activity 3 -- "Appraise the trade-in." (names the future term)
*Strengthens the existing `Grade the week like a trade-in` slide.*

Managers are fluent at valuing an asset they are left holding. Frame
end-of-week as: *"You booked `r_i` in cash, and you are now holding a
(state, plan) pair. What is that worth?"* Answer: look it up in your own
value table -- `q(s_{i+1}, a_{i+1})` -- and discount it by `gamma` because
it is a future, not cash in hand (tie straight back to the NPV / `gamma`
language already in the notes). "Week's worth = cash + trade-in" should land
as obvious once they have done Activity 2.

### Activity 4 -- "Price it from your own book." (defuses bootstrapping)
*A short discussion, not a slide assertion.*

Analogy managers live: a used-vehicle dealer prices today's trade-in from
**this month's price book** -- a book that is itself imperfect and gets
revised as more sales come in. Nobody refuses to price a car because the book
is not final. SARSA does the same: it appraises the leftover van with its own
current, imperfect `q`, and the book improves week over week. Make the
circularity explicit, then dissolve it:

> *"the book is wrong today and that's fine, because every nudge makes it
> less wrong."*

Optional 1-line live demo: start the table at all-zeros, run 5 weeks, show
the appraisal sharpening as the book fills.

### Activity 5 -- "Write the line." (the derivation payoff)
A fill-in-the-blanks worksheet where every blank is something they have
already produced:

```
new guess = old guess + alpha * [ ____  +  gamma * ____  -  ____ ]
                                 (cash)    (value of where    (what you
                                            you landed)        believed)
```

They complete it **before** the boxed formula is revealed. The reveal is then
a *confirmation*, not a new object -- which is precisely the abruptness cure.

---

## 4. Visualizations / animations to add

- **The substitution morph (Bellman -> SARSA).** Highest-value new asset. One
  slide, three clicks: start with the boxed Bellman line
  `Q*(s_i,a_i) = E[ r_i + gamma * Q*(s_{i+1},a_{i+1}) ]`; click 1 strikes
  through `E[...]` and stamps "one arriving week, not the average"; click 2
  strikes both `Q*` and writes `q` above them ("your current book, not the
  truth"); click 3 wraps the whole thing in the smoothing nudge
  `q <- q + alpha[ target - q ]`. Managers literally watch Bellman *become*
  SARSA.

- **The "formula-so-far" footer strip** carried across all SARSA slides,
  growing one term per activity, with each term color-keyed to its diagram
  (cash bar = green, trade-in tag = blue, old-guess = grey, surprise bracket
  = accent). Continuity kills abruptness.

- **A driveable running-number widget.** Reuse the existing `sarsa.js` and
  the `SARSA: the one-cell nudge` scene. Add a toggle: **cash-only target**
  vs **cash + trade-in target**, running on the same week stream, two
  thermometers side by side. The cash-only cell converges to the *wrong*
  number (it ignores the future) while the full cell climbs to `Q*`. That
  single A/B is the most convincing argument for the future term.

- **Two-round averaging picture** for the "why replacing `G_{i+1}` by `Q*` is
  legitimate" step: a company-wide average computed branch-by-branch then
  rolled up (the notes already use the "branch by branch" phrasing). Make it
  a small org-chart diagram.

- **The surprise gauge.** Animate the bracket as a needle: target on the
  right, current guess on the left, the gap is "the surprise / the miss," the
  nudge closes 15% of it. Reuse the planner's "miss" framing from
  `The planner's Monday` so the same gauge appears for both sales-forecasting
  and value-forecasting.

---

## 5. Suggested re-sequence

Keep the existing frames, but reorder and split so each maps to one activity:

1. the recurring-forecast hook
2. Activity 1 / cash-only nudge + alpha knob
3. Activity 2 / "same cash, different Monday"
4. Activity 3 / trade-in appraisal (future term added to the strip)
5. Activity 4 / bootstrapping defused
6. Activity 5 / write-the-line worksheet
7. the Bellman -> SARSA substitution morph
8. `One week, one nudge` worked example (unchanged -- it is good)
9. the live A/B widget

The alpha-knob and epsilon-exploration material stays where it is.

---

## 6. Highest-leverage changes first

The single highest-leverage change is making managers **do Activity 2 before
they ever see the future term**, paired with the **substitution-morph
animation** for the close. Those two alone convert the steepest jump and the
punchline from "told" to "discovered."

Recommended implementation order:

1. New/split Beamer frames with the cumulative formula-footer strip.
2. Printable worksheet for Activity 5 (self-contained).
3. The live A/B toggle in `sarsa.js` (a bigger lift; second pass).
