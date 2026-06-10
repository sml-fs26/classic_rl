/* Theme toggle. Two modes: light (paper, reads as a printed fleet
   report; default) and crt (black + orange neon, reads as a terminal
   sales dashboard).  Persists to localStorage; 't' shortcut toggles
   mid-lecture.  Hash override via #theme=light|crt for headless
   verification.  Legacy 'dark' / 'gb' values fall back to 'light' so
   old localStorage entries still resolve safely. */
(function () {
  const STORAGE_KEY = 'repair-or-replace.theme';
  const root = document.documentElement;
  const THEMES = ['light', 'crt'];

  function apply(theme) {
    if (THEMES.indexOf(theme) < 0) theme = 'light';
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_e) {}
  }

  function current() {
    const v = root.getAttribute('data-theme');
    return THEMES.indexOf(v) >= 0 ? v : 'light';
  }

  function cycle() {
    const i = THEMES.indexOf(current());
    apply(THEMES[(i + 1) % THEMES.length]);
  }

  function readHashTheme() {
    const m = (window.location.hash || '').match(/[#&?]theme=(light|crt)/);
    return m ? m[1] : null;
  }

  function init() {
    let theme = 'light';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (THEMES.indexOf(saved) >= 0) theme = saved;
    } catch (_e) {}
    const hashed = readHashTheme();
    if (hashed) theme = hashed;
    apply(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', cycle);

    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 't' || e.key === 'T') cycle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Theme = { apply, current };
})();
