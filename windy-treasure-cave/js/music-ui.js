/* Music toggle wired to the topbar button.
 *
 *   - Reads previous preference from localStorage('windy-cave.music').
 *   - If "on", the loop starts on the FIRST user gesture anywhere in the page
 *     (browsers refuse to run an AudioContext before a user click).
 *   - If "off" (default), nothing happens until the user clicks the button;
 *     the first click counts as the unlock gesture.
 *   - The MUSIC button also gates the page's SFX cues (one switch for all
 *     audio), so the chrome stays a single ♪ MUSIC toggle like the siblings.
 *
 *   The label / "active" state reflect the current state, re-rendered on a
 *   language change (label is i18n: music.on / music.off). */
(function () {
  const KEY = 'windy-cave.music';
  const T = (k) => (window.I18N ? window.I18N.t(k) : k);

  function setLabel(btn, on) {
    btn.textContent = on ? T('music.on') : T('music.off');
    btn.classList.toggle('active', on);
  }

  function init() {
    if (!window.Music) return;
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    let stored;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }
    const wantOn = stored === 'on';
    setLabel(btn, false);

    btn.addEventListener('click', () => {
      const on = window.Music.toggle();
      setLabel(btn, on);
      if (window.SFX) window.SFX.setEnabled(on);
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    });

    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => setLabel(btn, btn.classList.contains('active')));
    }

    if (wantOn) {
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
