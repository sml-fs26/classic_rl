/* Trainer profile — name + concept badges, all persisted to
 * localStorage so returning students see their progress.
 *
 *   - getName() / setName(s)         — trainer-name string, default "TRAINER".
 *   - hasBadge(key) / awardBadge(key) — boolean flags per concept.
 *
 * Badge keys (one per major-concept scene):
 *   mdp     — sceneMdpOverlay
 *   return  — sceneObjective
 *   qstar   — sceneQstar
 *   dp      — sceneDp
 *   sarsa   — sceneSarsaDerive
 *
 * Awarding an unseen badge fires a CustomEvent "trainer-badge-awarded"
 * on window so the topbar can flash an earned animation.
 */
(function () {
  const NAME_KEY    = 'pokemon-battle.trainer-name';
  const BADGES_KEY  = 'pokemon-battle.trainer-badges';

  const BADGES = ['mdp', 'return', 'qstar', 'dp', 'sarsa'];

  function getName() {
    try {
      const v = localStorage.getItem(NAME_KEY);
      return v && v.trim() ? v.trim() : 'TRAINER';
    } catch (_e) { return 'TRAINER'; }
  }

  function setName(s) {
    const clean = String(s || '').trim().toUpperCase().slice(0, 12) || 'TRAINER';
    try { localStorage.setItem(NAME_KEY, clean); } catch (_e) {}
    window.dispatchEvent(new CustomEvent('trainer-name-changed', { detail: { name: clean } }));
  }

  function hasBeenAsked() {
    try { return !!localStorage.getItem(NAME_KEY); } catch (_e) { return false; }
  }

  function readBadgeSet() {
    try {
      const raw = localStorage.getItem(BADGES_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (_e) { return {}; }
  }

  function writeBadgeSet(set) {
    try { localStorage.setItem(BADGES_KEY, JSON.stringify(set)); } catch (_e) {}
  }

  function hasBadge(key) {
    return !!readBadgeSet()[key];
  }

  function awardBadge(key) {
    if (BADGES.indexOf(key) < 0) return false;
    const set = readBadgeSet();
    if (set[key]) return false;          /* already earned */
    set[key] = Date.now();
    writeBadgeSet(set);
    window.dispatchEvent(new CustomEvent('trainer-badge-awarded', { detail: { key } }));
    return true;
  }

  function listBadges() { return BADGES.slice(); }

  function resetAll() {
    try { localStorage.removeItem(NAME_KEY); localStorage.removeItem(BADGES_KEY); } catch (_e) {}
    window.dispatchEvent(new CustomEvent('trainer-reset'));
  }

  window.Trainer = {
    getName, setName, hasBeenAsked,
    hasBadge, awardBadge, listBadges,
    resetAll,
  };
})();
