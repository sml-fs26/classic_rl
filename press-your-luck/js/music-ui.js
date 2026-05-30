/* Music toggle wired to the topbar button.
 *
 *   • Reads previous preference from localStorage('pokeviz-music').
 *   • If "on", the loop starts on the *first* user gesture anywhere in
 *     the page (Chrome / Safari refuse to let an AudioContext run
 *     before a user click — we honour that).
 *   • If "off" (default), nothing happens until the user clicks the
 *     button. The first click on the button counts as the unlock
 *     gesture for AudioContext.
 *
 *   The button label always reflects the current state.
 */
(function () {
  const KEY = 'pokeviz-music';

  function setLabel(btn, on) {
    btn.textContent = on ? '♪ MUSIC ON' : '♪ MUSIC OFF';
    btn.classList.toggle('active', on);
  }

  function init() {
    if (!window.Music) return;
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    let stored;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }
    const wantOn = stored === 'on';
    setLabel(btn, false);   // browsers block autoplay; label flips after first gesture

    btn.addEventListener('click', () => {
      const on = window.Music.toggle();
      setLabel(btn, on);
      if (window.SFX) window.SFX.setEnabled(on);
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    });

    if (wantOn) {
      /* First user gesture anywhere unlocks the AudioContext. We attach
         a one-shot listener; once it fires, music starts and the label
         updates. We DON'T auto-start without a gesture — browsers won't
         let us anyway, and a sudden tune would surprise users. */
      const onFirstGesture = () => {
        if (window.Music.start()) {
          setLabel(btn, true);
          if (window.SFX) window.SFX.setEnabled(true);
        }
        window.removeEventListener('click', onFirstGesture, true);
        window.removeEventListener('keydown', onFirstGesture, true);
      };
      window.addEventListener('click', onFirstGesture, true);
      window.addEventListener('keydown', onFirstGesture, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
