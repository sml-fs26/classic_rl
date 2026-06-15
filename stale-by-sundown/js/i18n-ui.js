/* UI chrome wiring: apply i18n labels to [data-i18n] elements, paint the brand,
   and wire the language toggle. The lang button's label shows the language to
   switch TO; a click flips I18N.lang, the body class toggles (lang-jp), and
   scenes re-render (rebuild owned by main.js). Here we only repaint chrome. */
(function () {
  const T = (k) => (window.I18N ? window.I18N.t(k) : k);

  function applyBrand() { const el = document.querySelector('.topbar .brand'); if (el) el.textContent = T('brand'); }
  function applyLangLabel() { const btn = document.getElementById('lang-toggle'); if (btn) btn.textContent = T('lang.toggle'); }
  function applyDataI18n() {
    document.querySelectorAll('[data-i18n]').forEach((n) => {
      const key = n.getAttribute('data-i18n'); if (!key) return; n.textContent = T(key);
    });
  }

  function init() {
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn && window.I18N) {
      langBtn.addEventListener('click', () => {
        const next = window.I18N.lang === 'en' ? 'jp' : 'en';
        window.I18N.setLang(next);
      });
    }
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(() => { applyBrand(); applyLangLabel(); applyDataI18n(); });
    }
    applyBrand(); applyLangLabel(); applyDataI18n();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
