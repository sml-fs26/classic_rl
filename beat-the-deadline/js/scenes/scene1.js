/* Scene 1, Tutorial / how to play.
 *   Three guided panels (the state, the two levers, the two dice) plus a live
 *   "ROLL A WAIT" demo that tumbles both dice from (2,4) and narrates the
 *   outcome. No theory. Cold-entry safe; honours &run (auto-rolls once). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.Dock;

  window.scenes.scene1 = function (root) {
    root.className = 'scene scene-pad sc1';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene1.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene1.lede') + '</p>' +
      '<div class="sc1-panels">' +
        '<div class="sc1-panel">' +
          '<div class="sc1-panel-head">' + T('scene1.s1') + '</div>' +
          '<div class="sc1-panel-row">' +
            '<div class="sc1-tile-host"></div>' +
            '<p class="sc1-panel-body">' + T('scene1.s1body') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="sc1-panel">' +
          '<div class="sc1-panel-head">' + T('scene1.s2') + '</div>' +
          '<div class="sc1-panel-row">' +
            '<div class="sc1-levers">' +
              '<span class="lever-chip" data-action="send">' + T('action.send') + ' <span class="chip-role">' + T('action.send.role') + '</span></span>' +
              '<span class="lever-chip" data-action="wait">' + T('action.wait') + ' <span class="chip-role">' + T('action.wait.role') + '</span></span>' +
            '</div>' +
            '<p class="sc1-panel-body">' + T('scene1.s2body') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="sc1-panel">' +
          '<div class="sc1-panel-head">' + T('scene1.s3') + '</div>' +
          '<div class="sc1-panel-row">' +
            '<div class="dice-pair sc1-dice">' +
              '<div class="sc1-arrival-host"></div>' +
              '<div class="sc1-deadline-host"></div>' +
            '</div>' +
            '<p class="sc1-panel-body">' + T('scene1.s3body') + '</p>' +
          '</div>' +
          '<div class="sc1-demo-row">' +
            '<button class="btd-btn sc1-demo" type="button">' + T('scene1.demo') + '</button>' +
            '<div class="poke-box sc1-demo-out" hidden></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc1-takeaway">' + T('scene1.takeaway') + '</div>';

    const tile = window.DockBoard.mount(root.querySelector('.sc1-tile-host'), { variant: 'icon', p: 2, h: 4 });
    const arrival = window.ArrivalDie.mount(root.querySelector('.sc1-arrival-host'), {});
    const deadline = window.DeadlineDie.mount(root.querySelector('.sc1-deadline-host'), { h: 4 });
    const demoBtn = root.querySelector('.sc1-demo');
    const demoOut = root.querySelector('.sc1-demo-out');

    /* A demo WAIT from a state with some risk (h=2 -> 40% blow) so the red die
       reads as "real". We reset the tile to (2,2) for the demo. */
    let busy = false;
    function demo() {
      if (busy) return;
      busy = true; demoBtn.disabled = true;
      const p = 2, h = 2;
      tile.setState(p, h);
      deadline.setHours(h);
      const rng = D.makeRng((Math.random() * 1e9) >>> 0);
      const out = D.sample({ p: p, h: h, terminal: false }, 'wait', rng);
      const blown = !!out.log.blown;
      deadline.roll(blown).then(() => {
        if (blown) {
          demoOut.hidden = false; demoOut.textContent = T('scene1.demoBlown');
          tile.flashOutcome('blown');
          finish();
        } else {
          const arrived = !!out.log.arrived;
          arrival.roll(arrived).then(() => {
            tile.setState(out.sNext.p, out.sNext.h); tile.pulse();
            demoOut.hidden = false;
            demoOut.textContent = arrived ? T('scene1.demoArrived') : T('scene1.demoNoArrive');
            finish();
          });
        }
      });
    }
    function finish() { busy = false; demoBtn.disabled = false; demoBtn.textContent = T('scene1.demoAgain'); }
    demoBtn.addEventListener('click', demo);

    if (window.BTD && window.BTD.run) setTimeout(demo, 200);

    return { onLeave() { busy = false; } };
  };
})();
