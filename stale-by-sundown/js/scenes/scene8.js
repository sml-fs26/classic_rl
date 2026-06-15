/* Scene 8 -- Bellman optimality equation. The recursive definition on one card:
   Q*(s,a) = E[ R + gamma * max_a' Q*(S',a') ], "a lever's value = what it pays
   now plus the value of the best lever in whatever situation you land in next."
   Anchored on the (1,STALE) -> DUMP backup, hand-checkable:
     DUMP = -3 + 0.75 * V(1,FRESH) = -3 + 0.75*3.76 = -0.18,
   the least-bad move on the spoilage cliff (vs HOLD / DISCOUNT, both worse).
   Reads DATA.handBackup. Cold-entry safe; honours &run (auto-reveals). */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const D = window.DATA || {};
  const HB = D.handBackup || {};

  window.scenes.scene8 = function (root) {
    root.className = 'scene scene-pad sc8';
    root.innerHTML =
      '<h2 class="scene-heading">' + T('scene8.title') + '</h2>' +
      '<p class="scene-lede">' + T('scene8.lede') + '</p>' +
      '<div class="formula-card sc8-formula"><div class="formula-label">' + T('scene8.formulaLabel') + '</div><div id="sc8-f"></div>' +
        '<p class="formula-note">' + T('scene8.formulaNote') + '</p></div>' +
      '<div class="poke-box sc8-anchor">' +
        '<div class="sc8-anchor-head">' + T('scene8.anchorHead') + '</div>' +
        '<div class="sc8-anchor-row">' +
          '<div class="shelf-icon sc8-shelf" id="sc8-shelf"></div>' +
          '<div class="sc8-backups" id="sc8-backups"></div>' +
        '</div>' +
      '</div>' +
      '<div class="gr-btn-row sc8-ctrls"><button class="poke-btn primary sc8-reveal" type="button">' + T('scene8.reveal') + '</button></div>' +
      '<div class="poke-box sc8-framing">' + T('scene8.framing') + '</div>';

    window.Katex.render((D.tex && D.tex.bellman) || 'Q^{*}(s,a) = \\mathbb{E}[R + \\gamma \\max_{a\'} Q^{*}(S\',a\')]', root.querySelector('#sc8-f'), true);

    const shelf = root.querySelector('#sc8-shelf');
    shelf.innerHTML = '<div class="shelf-tray">' + window.Croissant.svg('STALE', { px: 5 }) + '</div>' +
      '<div class="shelf-label">s = (1, ' + T('tier.STALE') + ')</div><div class="shelf-sub">' + T('scene8.cliff') + '</div>';

    const v = HB.vFresh1 != null ? HB.vFresh1.toFixed(2) : '3.76';
    const dumpVal = HB.value != null ? HB.value.toFixed(2) : '−0.18';
    const holdVal = HB.holdQ != null ? HB.holdQ.toFixed(2) : '−5.45';
    const discVal = HB.discountQ != null ? HB.discountQ.toFixed(2) : '−4.00';
    /* Format negatives with the minus sign */
    function neg(x) { return x.replace('-', '−'); }

    const ROWS = [
      { lever: 'DUMP', cls: 'lev-dump', best: true,
        expr: '−3 + 0.75 &middot; V(1,' + T('tier.FRESH') + ')',
        calc: '= −3 + 0.75 &middot; ' + v, val: neg(dumpVal) },
      { lever: 'HOLD', cls: 'lev-hold', best: false,
        expr: '0.05 &middot; (+5) + 0.95 &middot; (−6)', calc: T('scene8.holdGloss'), val: neg(holdVal) },
      { lever: 'DISCOUNT', cls: 'lev-discount', best: false,
        expr: '0.25 &middot; (+2) + 0.75 &middot; (−6)', calc: T('scene8.discGloss'), val: neg(discVal) },
    ];
    const backups = root.querySelector('#sc8-backups');
    let revealed = 0;
    function render() {
      backups.innerHTML = ROWS.map((r, i) =>
        '<div class="sc8-backup ' + r.cls + (r.best ? ' best' : '') + (i < revealed ? ' shown' : '') + '">' +
          '<div class="sc8-backup-lever">' + T('lever.' + r.lever) + (r.best ? ' <span class="sc8-star">&#9733;</span>' : '') + '</div>' +
          '<div class="sc8-backup-expr">' + r.expr + '</div>' +
          '<div class="sc8-backup-calc">' + r.calc + '</div>' +
          '<div class="sc8-backup-val">' + r.val + '</div>' +
        '</div>').join('');
      const btn = root.querySelector('.sc8-reveal');
      if (btn) { btn.disabled = revealed >= ROWS.length; btn.textContent = revealed >= ROWS.length ? T('scene8.allShown') : T('scene8.reveal'); }
    }
    root.querySelector('.sc8-reveal').addEventListener('click', () => { if (revealed < ROWS.length) { revealed++; render(); if (window.SFX) window.SFX.play('cursor'); } });

    revealed = 1; render();
    if (window.SBS && window.SBS.run) { revealed = ROWS.length; render(); }

    return {
      onEnter() { render(); },
      onNextKey() { if (revealed < ROWS.length) { revealed++; render(); return true; } return false; },
      onPrevKey() { if (revealed > 1) { revealed--; render(); return true; } return false; },
    };
  };
})();
