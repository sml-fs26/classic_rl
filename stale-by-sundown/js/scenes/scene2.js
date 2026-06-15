/* Scene 2 -- Playtest: you run it. The learner IS the shop owner. Start with
   3 units FRESH and a full day's clock; click a lever each hour, the buy-meter
   resolves live, units sell or the batch ages, the running till ticks, until the
   shelf is CLEARED (win) or a unit goes SPOILED (loss). Most players over-HOLD a
   premium tray to STALE and eat a spoilage, or panic-DUMP too early. Cold-entry
   safe; honours &run (auto-plays a greedy-ish day). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const B = window.Bakery;

  window.scenes.scene2 = function (root) {
    root.className = 'scene scene-pad sc2p';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene2.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene2.lede') + '</p>' +
      '<div class="hud-strip sc2p-hud">' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.hour') + '</span><span class="hud-val tnum" id="sc2p-hour">1</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.units') + '</span><span class="hud-val tnum" id="sc2p-units">3</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.fresh') + '</span><span class="hud-val" id="sc2p-tier">FRESH</span></div>' +
        '<div class="hud-item"><span class="hud-label">' + T('scene2.till') + '</span><span class="hud-val tnum" id="sc2p-till">0</span></div>' +
      '</div>' +
      '<div class="sc2p-stage">' +
        '<div class="sc2p-shelf-col">' +
          '<div class="shelf-icon" id="sc2p-shelf"></div>' +
          '<div id="sc2p-meter" class="sc2p-meter"></div>' +
        '</div>' +
        '<div class="sc2p-side">' +
          '<div class="poke-box dlg-box sc2p-dlg" id="sc2p-dlg"></div>' +
          '<div class="sc2p-levers" id="sc2p-levers">' +
            '<button class="poke-btn btn-hold sc2p-lev" data-lev="HOLD" type="button">' + T('lever.HOLD') + '<span class="sc2p-lev-m">+5</span></button>' +
            '<button class="poke-btn btn-disc sc2p-lev" data-lev="DISCOUNT" type="button">' + T('lever.DISCOUNT') + '<span class="sc2p-lev-m">+2</span></button>' +
            '<button class="poke-btn btn-dump sc2p-lev" data-lev="DUMP" type="button">' + T('lever.DUMP') + '<span class="sc2p-lev-m">−3</span></button>' +
          '</div>' +
          '<button class="poke-btn sc2p-reset" type="button">' + T('scene2.reset') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc2p-framing">' + T('scene2.framing') + '</div>';

    const meter = window.BuyMeter.mount(root.querySelector('#sc2p-meter'));
    const dlg = window.Dialog.mount(root.querySelector('#sc2p-dlg'));

    const rng = B.makeRng((Date.now() & 0xffff) ^ 0x9e3f);
    let state, hour, till, busy, done;

    function renderShelf() {
      const host = root.querySelector('#sc2p-shelf');
      if (state.terminal) {
        const cleared = state.cleared;
        host.className = 'shelf-icon ' + (cleared ? 'term-cleared' : 'term-spoiled');
        host.innerHTML =
          '<div class="shelf-tray">' + (cleared ? '<div class="sc2p-soldout">' + T('board.cleared') + '</div>' : window.Croissant.svg('STALE', { px: 6 })) + '</div>' +
          '<div class="shelf-label">' + (cleared ? T('board.cleared') : T('board.spoiled')) + '</div>' +
          '<div class="shelf-sub">' + (cleared ? T('scene2.clearedSub') : T('scene2.spoiledSub')) + '</div>';
        return;
      }
      host.className = 'shelf-icon';
      let tray = '';
      for (let k = 0; k < state.units; k++) tray += window.Croissant.svg(state.tier, { px: 5 });
      host.innerHTML =
        '<div class="shelf-tray">' + tray + '</div>' +
        '<div class="shelf-label">' + state.units + '&times; ' + T('tier.' + state.tier) + '</div>' +
        '<div class="shelf-sub">' + T('scene2.shelfSub') + '</div>';
    }
    function syncHud() {
      root.querySelector('#sc2p-hour').textContent = String(hour);
      root.querySelector('#sc2p-units').textContent = state.terminal ? '0' : String(state.units);
      root.querySelector('#sc2p-tier').textContent = state.terminal ? (state.cleared ? T('board.cleared') : T('board.spoiled')) : T('tier.' + state.tier);
      const tillEl = root.querySelector('#sc2p-till');
      tillEl.textContent = (till >= 0 ? '+' : '') + till;
      tillEl.className = 'hud-val tnum ' + (till > 0 ? 'pos' : till < 0 ? 'neg' : '');
    }
    function setMeterFor(lever) {
      if (lever === 'DUMP') { meter.setProb(0, '--'); return; }
      const p = B.buyProb(lever, state.tier);
      meter.setProb(p, Math.round(p * 100) + '%');
    }
    function setLeversEnabled(on) {
      root.querySelectorAll('.sc2p-lev').forEach(b => b.disabled = !on);
    }

    function start() {
      state = B.makeState(3, 'FRESH'); hour = 1; till = 0; busy = false; done = false;
      renderShelf(); syncHud(); setMeterFor('HOLD');
      dlg.say(T('scene2.dlg.start'), { instant: true });
      setLeversEnabled(true);
      const rb = root.querySelector('.sc2p-reset'); if (rb) rb.textContent = T('scene2.reset');
    }

    function endRun() {
      done = true; setLeversEnabled(false);
      const rb = root.querySelector('.sc2p-reset'); if (rb) rb.textContent = T('scene2.again');
      if (state.cleared) { dlg.say(T('scene2.dlg.cleared'), { instant: true }); if (window.SFX) window.SFX.play('cleared'); }
      else { dlg.say(T('scene2.dlg.spoiled'), { instant: true }); if (window.SFX) window.SFX.play('spoil'); }
    }

    function pull(lever) {
      if (busy || done || state.terminal) return;
      busy = true; setLeversEnabled(false);
      if (lever === 'DUMP') {
        const out = B.sample(state, 'DUMP', rng);
        till += out.reward; if (window.SFX) window.SFX.play('dump');
        state = out.sNext; hour++;
        renderShelf(); syncHud(); setMeterFor('HOLD');
        dlg.say(T('scene2.dlg.dumped', { n: state.units }), { instant: true });
        busy = false; setLeversEnabled(true);
        return;
      }
      setMeterFor(lever);
      const out = B.sample(state, lever, rng);
      const bought = out.log.sold;
      meter.resolve(bought).then(() => {
        till += out.reward;
        if (bought && window.SFX) window.SFX.play('chaching');
        if (!bought) { if (window.SFX) window.SFX.play('agetick'); }
        const wasTier = state.tier;
        state = out.sNext; hour++;
        renderShelf(); syncHud();
        if (state.terminal) { endRun(); busy = false; return; }
        setMeterFor('HOLD');
        dlg.say(bought ? T('scene2.dlg.sold') : T('scene2.dlg.aged', { from: T('tier.' + wasTier), to: T('tier.' + state.tier) }), { instant: true });
        busy = false; setLeversEnabled(true);
      });
    }

    root.querySelectorAll('.sc2p-lev').forEach(b => b.addEventListener('click', () => pull(b.dataset.lev)));
    root.querySelector('.sc2p-reset').addEventListener('click', start);

    start();

    /* &run: auto-play a HOLD-heavy day (the common over-hold mistake) for capture. */
    if (window.SBS && window.SBS.run) {
      let guard = 0;
      const auto = () => {
        if (done || state.terminal || guard++ > 12) return;
        pull('HOLD');
        setTimeout(auto, 700);
      };
      setTimeout(auto, 300);
    }

    return {
      onNextKey() { return false; },
      onPrevKey() { return false; },
      onLeave() { busy = true; },
    };
  };
})();
