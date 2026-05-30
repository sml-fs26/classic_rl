/* Scene 3 - "What makes this an MDP?" (Formalization).
 *
 *   The four MDP parts slide in over a single table-card - the state-icon the
 *   learner has been staring at since the playtest - one click at a time. The
 *   manager meaning leads each beat; the formal notation follows in a chunky
 *   KaTeX card.
 *
 *   5-step ladder (0..4):
 *     0  table-card + heading only          "the four-part frame"
 *     1  STATE  s = (pot bucket p, standing c)         tag on the card
 *     2  ACTION a in {ROLL, HOLD}                       two lever chips
 *     3  TRANSITION P(s', r | s, a) = the die           the die rolls, faces printed
 *     4  REWARD r: 0 each turn, +1 win / 0 lose         => value = win prob; the (S,A,P,R) tuple
 *
 *   Cold entry works (rebuilds from window.DATA / window.Pig). &run jumps to
 *   the last step for headless capture. No optimal answer is shown - this is
 *   pure framing.
 */
(function () {
  window.scenes = window.scenes || {};

  const STEP_COUNT = 5;   // 0..4 inclusive
  const T = (k, vars) => (window.I18N ? window.I18N.t(k, vars) : k);

  /* The representative "you just played" situation: a healthy pot in an even
     game (pot 18 => bucket "16-20", EVEN). Chosen so the table-card reads as a
     loaded-but-not-yet-banked mid-game moment, the exact feeling of scene 2. */
  const REP = { my: 20, riv: 20, pot: 18 };

  window.scenes.scene3 = function (root) {
    root.classList.add('scene-pad', 'sc3-scene');
    root.innerHTML = '';

    let step = 0;

    const TARGET = (window.Pig && window.Pig.TARGET) || (window.DATA && window.DATA.target) || 50;

    /* ---- heading + manager lead ---- */
    const heading = document.createElement('h2');
    heading.className = 'poke-subtitle sc3-heading';
    heading.textContent = T('scene3.heading');
    root.appendChild(heading);

    const lead = document.createElement('div');
    lead.className = 'poke-caption sc3-lead';
    lead.textContent = T('scene3.lead');
    root.appendChild(lead);

    /* ---- two-column row: the state-icon stage (left) + the beat panel (right) ---- */
    const row = document.createElement('div');
    row.className = 'sc3-row';
    root.appendChild(row);

    /* LEFT: the table-card stage with floating S / A / P / R tags. */
    const stage = document.createElement('div');
    stage.className = 'sc3-stage';
    row.appendChild(stage);

    const cardHost = document.createElement('div');
    cardHost.className = 'sc3-card-host';
    stage.appendChild(cardHost);
    const card = window.TableCard.mount(cardHost, { showVals: true });
    card.set({ pot: REP.pot, my: REP.my, riv: REP.riv, target: TARGET });

    /* The two lever chips (revealed at the ACTION beat). */
    const levers = document.createElement('div');
    levers.className = 'sc3-levers';
    levers.innerHTML =
      '<div class="sc3-lever sc3-lever-roll">' + T('vocab.roll') + '</div>' +
      '<div class="sc3-lever sc3-lever-hold">' + T('vocab.hold') + '</div>';
    stage.appendChild(levers);

    /* The die + face legend (revealed at the TRANSITION beat). */
    const dieWrap = document.createElement('div');
    dieWrap.className = 'sc3-die-wrap';
    const dieHost = document.createElement('div');
    dieHost.className = 'sc3-die';
    dieWrap.appendChild(dieHost);
    const dieLegend = document.createElement('div');
    dieLegend.className = 'sc3-die-legend';
    dieLegend.innerHTML =
      '<div class="sc3-die-line sc3-die-grow">' + T('scene3.die.grow') + '</div>' +
      '<div class="sc3-die-line sc3-die-bust">' + T('scene3.die.bust') + '</div>' +
      '<div class="sc3-die-line sc3-die-each">' + T('scene3.die.each') + '</div>';
    dieWrap.appendChild(dieLegend);
    stage.appendChild(dieWrap);

    const die = window.Die.mount(dieHost, {
      onPotPop: () => { try { card.pop(); } catch (_e) {} },
      onBust: () => { try { card.collapse(); } catch (_e) {} },
      shakeTarget: stage,
    });
    die.show(5);

    /* The reward strip (revealed at the REWARD beat). */
    const rewardStrip = document.createElement('div');
    rewardStrip.className = 'sc3-reward';
    rewardStrip.innerHTML =
      '<div class="sc3-reward-cell sc3-reward-zero"><span class="sc3-reward-r">r = 0</span>' +
        '<span class="sc3-reward-sub">' + T('scene3.reward.turn') + '</span></div>' +
      '<div class="sc3-reward-cell sc3-reward-win"><span class="sc3-reward-r">r = +1</span>' +
        '<span class="sc3-reward-sub">' + T('scene3.reward.win', { target: TARGET }) + '</span></div>' +
      '<div class="sc3-reward-cell sc3-reward-lose"><span class="sc3-reward-r">r = 0</span>' +
        '<span class="sc3-reward-sub">' + T('scene3.reward.lose', { target: TARGET }) + '</span></div>';
    stage.appendChild(rewardStrip);

    /* Floating tags over the icon (each step-gated). */
    const tags = document.createElement('div');
    tags.className = 'sc3-tags';
    tags.innerHTML =
      '<div class="sc3-tag sc3-tag-s">' + T('scene3.tag.s') + '</div>' +
      '<div class="sc3-tag sc3-tag-a">' + T('scene3.tag.a') + '</div>' +
      '<div class="sc3-tag sc3-tag-p">' + T('scene3.tag.p') + '</div>' +
      '<div class="sc3-tag sc3-tag-r">' + T('scene3.tag.r') + '</div>';
    stage.appendChild(tags);

    /* RIGHT: the beat panel = a step tag, the manager body, and a KaTeX card. */
    const panel = document.createElement('div');
    panel.className = 'sc3-panel';
    row.appendChild(panel);

    const beatTag = document.createElement('div');
    beatTag.className = 'sc3-beat-tag';
    panel.appendChild(beatTag);

    const beatBody = document.createElement('div');
    beatBody.className = 'sc3-beat-body poke-box tight';
    panel.appendChild(beatBody);

    const formulaCard = document.createElement('div');
    formulaCard.className = 'sc3-formula';
    panel.appendChild(formulaCard);
    const formulaHost = document.createElement('div');
    formulaHost.className = 'sc3-formula-host';
    formulaCard.appendChild(formulaHost);

    /* The tuple banner (shown only on the last step). */
    const tuple = document.createElement('div');
    tuple.className = 'sc3-tuple';
    tuple.innerHTML =
      '<div class="sc3-tuple-label">' + T('scene3.tuple.label') + '</div>' +
      '<div class="sc3-tuple-host"></div>' +
      '<div class="sc3-tuple-foot">' + T('scene3.tuple.foot') + '</div>';
    panel.appendChild(tuple);
    window.Katex.render(
      String.raw`\mathcal{M} = (\,\underbrace{S}_{\text{situation}},\ \underbrace{A}_{\text{lever}},\ \underbrace{P}_{\text{the die}},\ \underbrace{R}_{\text{payoff}}\,)`,
      tuple.querySelector('.sc3-tuple-host'), true);

    /* ---- controls ---- */
    const ctrls = document.createElement('div');
    ctrls.className = 'sc3-ctrls';
    ctrls.innerHTML =
      '<button class="poke-btn pyl-btn" id="sc3-prev">' + T('scene3.prev') + '</button>' +
      '<div class="sc3-step-of">' + T('scene3.step_of') + '</div>' +
      '<button class="poke-btn pyl-btn" id="sc3-next">' + T('scene3.next') + '</button>';
    panel.appendChild(ctrls);

    const foot = document.createElement('div');
    foot.className = 'footnote sc3-foot';
    foot.innerHTML = T('scene3.foot');
    root.appendChild(foot);

    /* Per-step KaTeX (rendered on demand so a language toggle re-paints). */
    function renderFormula(s) {
      formulaHost.innerHTML = '';
      let tex = '';
      if (s === 1) tex = (window.DATA && window.DATA.tex && window.DATA.tex.state) ||
        String.raw`s = (\text{pot bucket } p,\ \text{standing } c)`;
      else if (s === 2) tex = (window.DATA && window.DATA.tex && window.DATA.tex.actions) ||
        String.raw`A = \{\, \textsf{ROLL},\ \textsf{HOLD} \,\}`;
      else if (s === 3) tex = String.raw`P(s', r \mid s, a)\quad\text{(each die face } \tfrac{1}{6}\text{)}`;
      else if (s === 4) tex = String.raw`r = 0 \ \text{each turn};\quad r = +1 \text{ win},\ 0 \text{ loss}`;
      if (tex) {
        formulaCard.style.display = '';
        window.Katex.render(tex, formulaHost, true);
      } else {
        formulaCard.style.display = 'none';
      }
    }

    let rollTimer = null;
    function stopRoll() { if (rollTimer) { clearTimeout(rollTimer); rollTimer = null; } }

    /* On reaching the transition beat, roll the die once to make P concrete
       (a non-bust face grows the pot meter). Reset the card to REP first so a
       repeat visit is clean. */
    function demoRoll() {
      stopRoll();
      card.set({ pot: REP.pot, my: REP.my, riv: REP.riv, target: TARGET });
      rollTimer = setTimeout(() => {
        /* Settle on a 5 (a clean non-bust grow) so the meter pops into the
           danger band; deterministic for headless capture. */
        die.roll(5, { silent: false });
      }, 320);
    }

    function applyStep(c) {
      step = Math.max(0, Math.min(STEP_COUNT - 1, c));
      stopRoll();

      stage.classList.toggle('sc3-show-levers', step >= 2);
      stage.classList.toggle('sc3-show-die', step >= 3);
      stage.classList.toggle('sc3-show-reward', step >= 4);

      tags.querySelector('.sc3-tag-s').classList.toggle('show', step >= 1);
      tags.querySelector('.sc3-tag-a').classList.toggle('show', step >= 2);
      tags.querySelector('.sc3-tag-p').classList.toggle('show', step >= 3);
      tags.querySelector('.sc3-tag-r').classList.toggle('show', step >= 4);

      beatTag.textContent = T('scene3.step.' + step + '.tag');
      beatBody.textContent = T('scene3.step.' + step + '.body', { target: TARGET });
      renderFormula(step);

      tuple.classList.toggle('show', step >= STEP_COUNT - 1);

      const i = document.getElementById('sc3-step-i');
      if (i) i.textContent = String(step + 1);

      /* Keep the card in its loaded REP state unless the die just grew it. */
      if (step < 3) card.set({ pot: REP.pot, my: REP.my, riv: REP.riv, target: TARGET });
      if (step === 3) demoRoll();
    }

    document.getElementById('sc3-next').addEventListener('click', () => {
      if (step < STEP_COUNT - 1) applyStep(step + 1);
      else if (window.PYL) window.PYL.goTo(window.PYL.getCurrentScene() + 1);
    });
    document.getElementById('sc3-prev').addEventListener('click', () => {
      if (step > 0) applyStep(step - 1);
      else if (window.PYL) window.PYL.goTo(window.PYL.getCurrentScene() - 1);
    });

    applyStep(0);

    /* &run: jump to the final step (the full tuple) for headless capture. */
    if (window.PYL && window.PYL.run) {
      setTimeout(() => applyStep(STEP_COUNT - 1), 200);
    }

    return {
      onEnter() { applyStep(step); },
      onLeave() { stopRoll(); },
      onNextKey() {
        if (step < STEP_COUNT - 1) { applyStep(step + 1); return true; }
        return false;
      },
      onPrevKey() {
        if (step > 0) { applyStep(step - 1); return true; }
        return false;
      },
    };
  };
})();
