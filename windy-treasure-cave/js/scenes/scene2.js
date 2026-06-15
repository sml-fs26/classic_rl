/* Scene 2, Playtest: you run it.
 *   The learner plays a FULL episode: pick headings, the wind die rolls each
 *   step, leaves blow, the torch burns down (-1 a step), until gold (+10) or
 *   pit (-10). They will almost certainly get gusted toward a wall or the pit
 *   at least once and feel it. A HUD tracks tile, steps and running return.
 *   Cold-entry safe; honours &run (auto-walks a short episode). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const C = window.Cave;
  const Actions = window.Actions;

  function rollWind(rng) {
    const u = rng();
    if (u < C.P_MAIN) return { dir: 'main', face: 1 + Math.floor(u / C.P_MAIN * 7) };
    if (u < C.P_MAIN + C.P_LEFT) return { dir: 'left', face: u < C.P_MAIN + C.P_LEFT * 0.5 ? 8 : 9 };
    return { dir: 'right', face: 10 };
  }

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="hud-strip sc2-hud">' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.tile') + '</span><span class="hud-val" id="sc2-tile">(4,0)</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.steps') + '</span><span class="hud-val tnum" id="sc2-steps">0</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.return') + '</span><span class="hud-val tnum" id="sc2-return">0</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.hud.status') + '</span><span class="hud-val" id="sc2-status">' + T('scene2.status.go') + '</span></div>' +
      '</div>' +
      '<div class="scene-row sc2-row">' +
        '<div class="sc2-left"><div class="sc2-board-host"></div></div>' +
        '<div class="sc2-right scene-col grow">' +
          '<div class="sc2-die-host"></div>' +
          '<div class="poke-box sc2-dlg"></div>' +
          '<div class="sc2-pad-wrap"><div class="dpad sc2-dpad">' +
            '<button class="dir-chip" data-dir="UP" type="button"><span class="dir-glyph">↑</span></button>' +
            '<button class="dir-chip" data-dir="LEFT" type="button"><span class="dir-glyph">←</span></button>' +
            '<button class="dir-chip" data-dir="DOWN" type="button"><span class="dir-glyph">↓</span></button>' +
            '<button class="dir-chip" data-dir="RIGHT" type="button"><span class="dir-glyph">→</span></button>' +
          '</div></div>' +
          '<div class="wtc-btn-row sc2-ctrls"><button class="wtc-btn sc2-reset" type="button">' + T('scene2.reset') + '</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc2-framing" hidden>' + T('scene2.framing') + '</div>';

    const board = window.CaveBoard.mount(root.querySelector('.sc2-board-host'), { size: 'md' });
    const die = window.WindDie.mount(root.querySelector('.sc2-die-host'), { badge: T('die.badge') });
    const dlg = window.Dialog.mount(root.querySelector('.sc2-dlg'));

    let rng = C.makeRng((Date.now() & 0xffff) ^ 0x533A);
    let pos, steps, ret, done, busy;

    function setHud() {
      root.querySelector('#sc2-tile').textContent = '(' + pos.row + ',' + pos.col + ')';
      root.querySelector('#sc2-steps').textContent = String(steps);
      const rEl = root.querySelector('#sc2-return');
      rEl.textContent = (ret > 0 ? '+' : '') + ret;
      rEl.classList.toggle('pos', ret > 0); rEl.classList.toggle('neg', ret < 0);
    }
    function reset() {
      rng = C.makeRng((Date.now() & 0xffff) ^ (0x533A + steps));
      pos = { row: C.START.row, col: C.START.col }; steps = 0; ret = 0; done = false; busy = false;
      board.setExplorer(pos.row, pos.col);
      root.querySelector('#sc2-status').textContent = T('scene2.status.go');
      root.querySelector('#sc2-status').className = 'hud-val';
      root.querySelector('.sc2-framing').hidden = true;
      setDpad(true);
      dlg.say(T('scene2.say.go'), { instant: true });
      setHud();
    }
    function setDpad(on) { root.querySelectorAll('.sc2-dpad .dir-chip').forEach(b => b.disabled = !on); }

    function move(headingId) {
      if (busy || done) return;
      busy = true;
      const r = pos.row, c = pos.col;
      const wind = rollWind(rng);
      die.roll(wind.face, wind.dir).then(() => {
        let dr = 0, dc = 0;
        if (wind.dir === 'main') { const v = Actions.vecOf(headingId); dr = v[0]; dc = v[1]; }
        else { const p = Actions.perpOf(headingId); const d = wind.dir === 'left' ? p.left : p.right; dr = d[0]; dc = d[1]; }
        board.gust(r, c, wind.dir, headingId);
        const t = C.moveTo(r, c, dr, dc);
        const dest = C.makeState(t.r, t.c);
        steps++;
        setTimeout(() => {
          if (dest.terminal) {
            ret += dest.goal ? C.GOLD_R : C.PIT_R;
            board.setExplorer(dest.row, dest.col);
            pos = { row: dest.row, col: dest.col };
            done = true; setDpad(false);
            const stEl = root.querySelector('#sc2-status');
            if (dest.goal) { board.sparkle(); stEl.textContent = T('scene2.status.gold'); stEl.className = 'hud-val pos'; dlg.say(T('scene2.say.gold', { n: steps }), { instant: true }); }
            else { board.shake(); stEl.textContent = T('scene2.status.pit'); stEl.className = 'hud-val neg'; dlg.say(T('scene2.say.pit', { n: steps }), { instant: true }); }
            root.querySelector('.sc2-framing').hidden = false;
            setHud(); busy = false; return;
          }
          ret += C.STEP_R;
          pos = { row: dest.row, col: dest.col };
          board.setExplorer(pos.row, pos.col); board.pulse(pos.row, pos.col);
          dlg.say(wind.dir === 'main' ? T('scene2.say.step', { dir: T('act.' + headingId) }) : T('scene2.say.gust', { dir: T('act.' + headingId) }), { instant: true });
          setHud(); busy = false;
        }, 240);
      });
    }

    root.querySelectorAll('.sc2-dpad .dir-chip').forEach(btn => btn.addEventListener('click', () => move(btn.dataset.dir)));
    root.querySelector('.sc2-reset').addEventListener('click', reset);
    reset();

    if (window.WTC && window.WTC.run) {
      const seq = ['RIGHT', 'RIGHT', 'UP', 'UP', 'UP'];
      let i = 0;
      const tick = () => { if (done || i >= seq.length) return; move(seq[i++]); setTimeout(tick, 950); };
      setTimeout(tick, 250);
    }

    return { onEnter() { board.setExplorer(pos.row, pos.col); } };
  };
})();
