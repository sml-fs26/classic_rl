/* Language toggle wired to the topbar button.
 *
 *   Mirror of music-ui.js: button label shows the language to switch TO,
 *   click flips I18N.lang, body class toggles, scenes re-render. We
 *   trust I18N to persist + emit onChange events.
 *
 *   Scene rebuild on language change is owned by main.js (it subscribes
 *   to I18N.onChange and calls ChurnViz.rebuildAll(), which clears the
 *   cached scene DOM and re-runs the current scene's builder; other
 *   scenes lazily rebuild on next visit). This module only repaints its
 *   own chrome labels so it does not rebuild the current scene twice. A
 *   mid-episode toggle resets the live scene: accepted side-effect for a
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
    /* Generic pass over any element with a data-i18n attribute, used
       by the topbar buttons (PREV / NEXT / theme) so per-element wiring
       isn't needed. Skip the lang/music/brand nodes; those are handled
       explicitly above so they can read state (lang.toggle, music on/off). */
    function applyDataI18n() {
      const nodes = document.querySelectorAll('[data-i18n]');
      nodes.forEach((n) => {
        const key = n.getAttribute('data-i18n');
        if (!key) return;
        n.textContent = window.I18N.t(key);
      });
    }

    /* Wire the click → flip lang. */
    btn.addEventListener('click', () => {
      const next = window.I18N.lang === 'en' ? 'jp' : 'en';
      window.I18N.setLang(next);
      /* setLang fires onChange synchronously, listeners (below) handle
         label refresh + scene rebuild. */
    });

    /* Repaint our own chrome labels on a language flip. main.js owns the
       scene-rebuild path (it subscribes to onChange too), so we do NOT
       call rebuildAll here, to avoid rebuilding the current scene twice. */
    window.I18N.onChange(() => {
      applyLabel();
      applyBrand();
      applyMusicLabel();
      applyDataI18n();
    });

    /* Paint initial state. */
    applyLabel();
    applyBrand();
    applyMusicLabel();
    applyDataI18n();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
