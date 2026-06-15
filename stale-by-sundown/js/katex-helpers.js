/* Tiny KaTeX shim. All scenes render formulas via
   Katex.render(tex, host, displayMode). Errors do not throw; they fall back to
   literal text. KaTeX is vendored under vendor/katex (no CDN), so this works
   from file:// with no network. */
(function () {
  function render(tex, host, displayMode) {
    if (!host) return;
    try {
      window.katex.render(tex, host, { throwOnError: false, displayMode: !!displayMode });
    } catch (e) {
      host.textContent = tex;
    }
  }
  function inline(tex) { const span = document.createElement('span'); render(tex, span, false); return span; }
  function display(tex) { const div = document.createElement('div'); div.className = 'formula-block'; render(tex, div, true); return div; }
  window.Katex = { render, inline, display };
})();
