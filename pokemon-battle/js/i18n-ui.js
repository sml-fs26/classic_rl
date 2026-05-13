/* Language toggle wired to the topbar button.
 *
 *   Mirror of music-ui.js: button label shows the language to switch TO,
 *   click flips I18N.lang, body class toggles, scenes re-render. We
 *   trust I18N to persist + emit onChange events.
 *
 *   Scene rebuild on language change uses PokeViz.rebuildAll() (exposed
 *   from main.js). That clears the cached scene DOM and re-runs the
 *   current scene's builder; other scenes lazily rebuild on next visit.
 *   A mid-battle toggle resets the battle — accepted side-effect for a
 *   flavour feature.
 */
(function () {

  function init() {
    if (!window.I18N) return;
    const btn = document.getElementById('lang-toggle');
    if (!btn) return;

    function applyLabel() {
      btn.textContent = window.I18N.t('lang.toggle');
    }
    function applyBrand() {
      const el = document.querySelector('.topbar .brand');
      if (el) el.textContent = window.I18N.t('brand');
    }
    function applyMusicLabel() {
      const m = document.getElementById('music-toggle');
      if (!m) return;
      const on = m.classList.contains('active');
      m.textContent = window.I18N.t(on ? 'music.on' : 'music.off');
    }

    /* Wire the click → flip lang. */
    btn.addEventListener('click', () => {
      const next = window.I18N.lang === 'en' ? 'jp' : 'en';
      window.I18N.setLang(next);
      /* setLang fires onChange synchronously — listeners (below) handle
         label refresh + scene rebuild. */
    });

    window.I18N.onChange(() => {
      applyLabel();
      applyBrand();
      applyMusicLabel();
      if (window.PokeViz && typeof window.PokeViz.rebuildAll === 'function') {
        window.PokeViz.rebuildAll();
      }
    });

    /* Paint initial state. */
    applyLabel();
    applyBrand();
    applyMusicLabel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
