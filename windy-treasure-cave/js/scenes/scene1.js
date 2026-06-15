/* Scene 1 -- Tutorial: how to play.
 *   A guided, no-theory walk-through: here is the floor plan, here is YOU, the
 *   GOLD (+10) and the PIT (-10), here are your four headings, and here is the
 *   catch -- press a direction, watch the WIND DIE roll. Most rolls you go where
 *   you aimed; some rolls a gust shoves you sideways. The learner makes a few
 *   throwaway moves just to SEE the die and the leaves. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const C = window.Cave;
  const Actions = window.Actions;

  /* Pick a wind outcome from one rng draw -> {face, dir}. */
  function rollWind(rng) {
    const u = rng();
    if (u < C.P_MAIN) return { dir: 'main', face: 1 + Math.floor(u / C.P_MAIN * 7) };
    if (u < C.P_MAIN + C.P_LEFT) return { dir: 'left', face: u < C.P_MAIN + C.P_LEFT * 0.5 ? 8 : 9 };
    return { dir: 'right', face: 10 };
  }

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="scene-row sc1-row">' +
        '<div class="sc1-left">' +
          '<div class="sc1-board-host"></div>' +
        '</div>' +
        '<div class="sc1-right scene-col grow">' +
          '<div class="sc1-die-host"></div>' +
          '<div class="poke-box sc1-dlg"></div>' +
          '<div class="sc1-pad-wrap">' +
            '<div class="dpad sc1-dpad">' +
              '<button class="dir-chip" data-dir="UP" type="button"><span class="dir-glyph">↑</span></button>' +
              '<button class="dir-chip" data-dir="LEFT" type="button"><span class="dir-glyph">←</span></button>' +
              '<button class="dir-chip" data-dir="DOWN" type="button"><span class="dir-glyph">↓</span></button>' +
              '<button class="dir-chip" data-dir="RIGHT" type="button"><span class="dir-glyph">→</span></button>' +
            '</div>' +
          '</div>' +
          '<div class="wtc-btn-row sc1-ctrls">' +
            '<button class="wtc-btn sc1-reset" type="button">' + T('scene1.reset') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sc1-legend poke-box">' + T('scene1.legend') + '</div>';

    const board = window.CaveBoard.mount(root.querySelector('.sc1-board-host'), { size: 'md' });
    const die = window.WindDie.mount(root.querySelector('.sc1-die-host'), { badge: T('die.badge') });
    const dlg = window.Dialog.mount(root.querySelector('.sc1-dlg'));

    const rng = C.makeRng(0xCA7E + 7);
    let pos = { row: C.START.row, col: C.START.col };
    let busy = false;

    board.setExplorer(pos.row, pos.col);
    dlg.say(T('scene1.say.intro'), { instant: true });

    function moveOnce(headingId) {
      if (busy) return;
      busy = true;
      const r = pos.row, c = pos.col;
      const wind = rollWind(rng);
      die.roll(wind.face, wind.dir).then(() => {
        let dr = 0, dc = 0;
        if (wind.dir === 'main') { const v = Actions.vecOf(headingId); dr = v[0]; dc = v[1]; }
        else { const p = Actions.perpOf(headingId); const d = wind.dir === 'left' ? p.left : p.right; dr = d[0]; dc = d[1]; }
        board.gust(r, c, wind.dir, headingId);
        const t = C.moveTo(r, c, dr, dc);
        const bumped = t.bumped;
        const dest = C.makeState(t.r, t.c);
        setTimeout(() => {
          if (dest.terminal) {
            board.setExplorer(dest.row, dest.col);
            if (dest.goal) { board.sparkle(); dlg.say(T('scene1.say.gold'), { instant: true }); }
            else { board.shake(); dlg.say(T('scene1.say.pit'), { instant: true }); }
            setTimeout(() => { pos = { row: C.START.row, col: C.START.col }; board.setExplorer(pos.row, pos.col); busy = false; }, 950);
            return;
          }
          pos = { row: dest.row, col: dest.col };
          board.setExplorer(pos.row, pos.col); board.pulse(pos.row, pos.col);
          if (wind.dir === 'main') dlg.say(T('scene1.say.went', { dir: T('act.' + headingId) }), { instant: true });
          else dlg.say(T(bumped ? 'scene1.say.bumpGust' : 'scene1.say.gust', { dir: T('act.' + headingId) }), { instant: true });
          busy = false;
        }, 240);
      });
    }

    root.querySelectorAll('.sc1-dpad .dir-chip').forEach(btn => {
      btn.addEventListener('click', () => moveOnce(btn.dataset.dir));
    });
    root.querySelector('.sc1-reset').addEventListener('click', () => {
      pos = { row: C.START.row, col: C.START.col };
      board.setExplorer(pos.row, pos.col); board.pulse(pos.row, pos.col);
      dlg.say(T('scene1.say.intro'), { instant: true });
    });

    if (window.WTC && window.WTC.run) setTimeout(() => moveOnce('UP'), 200);

    return { onEnter() { board.setExplorer(pos.row, pos.col); } };
  };
})();
