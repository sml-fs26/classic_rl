/* Scene 4 - "Policy" (a rule from states to actions).
 *
 *   pi: S -> A is a complete playbook: one lever pre-assigned to every cell of
 *   the 6x3 board. The scene paints TWO hand-policies as coloured maps and lets
 *   the learner toggle between them:
 *     (a) "Always hold at 20" - ROLL for pot bucket <= 20, HOLD above; identical
 *         across all three standing columns -> a FLAT seam that ignores the
 *         scoreboard.
 *     (b) "Scaredy-cat" - HOLD once pot >= 6; the whole upper board blue.
 *
 *   No win-odds are shown (we never reveal the optimal answer before the learner
 *   can attempt it): the board is mounted with showQ:false, and setPolicy() is
 *   called with no Q payload. Callback to scene 2 ("you were a policy"). Frame:
 *   the rest is about finding the BEST playbook - and whether ignoring the
 *   scoreboard is a mistake.
 *
 *   Cold entry rebuilds from window.Pig (bucket layout). &run leaves the first
 *   playbook painted for headless capture.
 */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  const NB = (window.Pig && window.Pig.POT_BUCKETS) || 6;      // 6 pot buckets
  const NS = (window.Pig && window.Pig.STANDINGS) || 3;        // 3 standings
  const N = NB * NS;                                           // 18 cells
  /* Pot-bucket index of the "21+" band (past 20) and the "6-10" band (pot>=6). */
  const BUCKET_OVER20 = NB - 1;     // 5 = "21+"
  const BUCKET_FROM6 = 2;           // 2 = "6-10" (first bucket with pot >= 6)

  /* Build an 18-cell policy (lever ids) from a per-bucket rule. The rule is a
     function (potBucket) -> 'roll' | 'hold'; standing is ignored on purpose so
     the seam is flat (the whole pedagogical point of these two playbooks). */
  function policyByBucket(rule) {
    const ids = new Array(N);
    for (let i = 0; i < N; i++) {
      const pb = (window.Pig ? window.Pig.decodeDisplayIndex(i).potBucket : Math.floor(i / NS));
      ids[i] = rule(pb);
    }
    return ids;
  }

  /* (a) Always hold at 20: ROLL until the pot passes 20, then HOLD. */
  function policyHold20() {
    return policyByBucket((pb) => (pb >= BUCKET_OVER20 ? 'hold' : 'roll'));
  }
  /* (b) Scaredy-cat: HOLD once the pot reaches 6. */
  function policyScaredy() {
    return policyByBucket((pb) => (pb >= BUCKET_FROM6 ? 'hold' : 'roll'));
  }

  const POLICIES = [
    { key: 'hold20',  build: policyHold20 },
    { key: 'scaredy', build: policyScaredy },
  ];

  window.scenes.scene4 = function (root) {
    root.classList.add('scene-pad', 'sc4-scene');
    root.innerHTML = '';

    let active = 0;   // index into POLICIES

    /* ---- heading + manager lead ---- */
    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc4-heading';
    heading.textContent = T('scene4.heading');
    root.appendChild(heading);

    const lead = document.createElement('div');
    lead.className = 'poke-caption sc4-lead';
    lead.textContent = T('scene4.lead');
    root.appendChild(lead);

    /* ---- pi: S -> A formula card ---- */
    const fcard = document.createElement('div');
    fcard.className = 'sc4-formula';
    fcard.innerHTML = '<div class="sc4-formula-label">' + T('scene4.formula.label') + '</div>';
    const fhost = document.createElement('div');
    fhost.className = 'sc4-formula-host';
    fcard.appendChild(fhost);
    window.Katex.render(String.raw`\pi : S \rightarrow A`, fhost, true);
    const ffoot = document.createElement('div');
    ffoot.className = 'sc4-formula-foot';
    ffoot.textContent = T('scene4.formula.foot');
    fcard.appendChild(ffoot);
    root.appendChild(fcard);

    /* ---- two-column body: the board (left) + the policy panel (right) ---- */
    const row = document.createElement('div');
    row.className = 'sc4-row';
    root.appendChild(row);

    /* LEFT: the board + legend. */
    const left = document.createElement('div');
    left.className = 'sc4-left';
    row.appendChild(left);

    const boardHost = document.createElement('div');
    boardHost.className = 'sc4-board';
    left.appendChild(boardHost);
    const board = window.QTable.mount(boardHost, { miniCards: true, showQ: false });

    const legend = document.createElement('div');
    legend.className = 'sc4-legend';
    legend.innerHTML =
      '<span class="sc4-legend-chip sc4-chip-roll">' + T('scene4.legend.roll') + '</span>' +
      '<span class="sc4-legend-chip sc4-chip-hold">' + T('scene4.legend.hold') + '</span>';
    left.appendChild(legend);

    /* RIGHT: the playbook picker + the active policy's description + the frame. */
    const right = document.createElement('div');
    right.className = 'sc4-right';
    row.appendChild(right);

    const pickLabel = document.createElement('div');
    pickLabel.className = 'sc4-pick-label';
    pickLabel.textContent = T('scene4.pick.label');
    right.appendChild(pickLabel);

    const picker = document.createElement('div');
    picker.className = 'sc4-picker';
    POLICIES.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.className = 'poke-btn pyl-btn sc4-pick-btn';
      btn.type = 'button';
      btn.dataset.idx = String(idx);
      btn.textContent = T('scene4.policy.' + p.key + '.btn');
      btn.addEventListener('click', () => select(idx));
      picker.appendChild(btn);
    });
    right.appendChild(picker);

    const desc = document.createElement('div');
    desc.className = 'sc4-desc poke-box tight';
    right.appendChild(desc);
    const descTitle = document.createElement('div');
    descTitle.className = 'sc4-desc-title';
    desc.appendChild(descTitle);
    const descBody = document.createElement('div');
    descBody.className = 'sc4-desc-body';
    desc.appendChild(descBody);

    /* The flat-seam callout (only meaningful for the hold-at-20 map). */
    const flatNote = document.createElement('div');
    flatNote.className = 'sc4-flat-note';
    flatNote.textContent = T('scene4.legend.flat');
    right.appendChild(flatNote);

    const frame = document.createElement('div');
    frame.className = 'sc4-frame';
    frame.innerHTML =
      '<div class="sc4-frame-title">' + T('scene4.frame.title') + '</div>' +
      '<div class="sc4-frame-body">' + T('scene4.frame.body') + '</div>';
    right.appendChild(frame);

    const foot = document.createElement('div');
    foot.className = 'footnote sc4-foot';
    foot.innerHTML = T('scene4.foot');
    root.appendChild(foot);

    /* Paint the active policy and refresh the panel text. */
    function select(idx) {
      active = Math.max(0, Math.min(POLICIES.length - 1, idx));
      const p = POLICIES[active];
      board.setPolicy(p.build());   // no Q -> cells tint ROLL/HOLD, no numbers
      descTitle.textContent = T('scene4.policy.' + p.key + '.title');
      descBody.textContent = T('scene4.policy.' + p.key + '.desc');
      /* The flat-seam note belongs to the hold-at-20 map (a true flat cut);
         scaredy-cat is also flat across columns so keep it visible, but only
         emphasise it on the canonical "always hold at 20" playbook. */
      flatNote.classList.toggle('show', p.key === 'hold20');
      Array.prototype.forEach.call(picker.children, (b, i) =>
        b.classList.toggle('sc4-pick-active', i === active));
      if (window.SFX) window.SFX.play('cursor');
    }

    select(0);

    return {
      onEnter() { select(active); },
      /* This scene has no internal step ladder; let the driver advance. */
      onNextKey() { return false; },
      onPrevKey() { return false; },
    };
  };
})();
