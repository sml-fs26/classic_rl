/* Speaker notes for each scene — instructor-facing crib sheet that
 * pops up in a corner overlay on the `n` hotkey.  Notes are written
 * for a lecturer at a podium: bullet-point what to say, what to
 * pause on, common student traps, and a hook to the next scene.
 *
 * Localised: the actual note bodies live in js/i18n.js under the
 * 'notes.<sceneKey>' keys (English + Japanese).  This module is the
 * thin lookup that main.js calls into when the overlay opens.  Keys
 * MUST match window.scenes / SCENES[i].key in main.js.
 */
(function () {
  function getNotes(sceneKey) {
    if (!sceneKey) return '';
    if (window.I18N) {
      const html = window.I18N.t('notes.' + sceneKey);
      /* I18N.t returns the key itself when no entry exists — treat that
         as "no notes" so we fall through to the empty placeholder. */
      if (html && html !== 'notes.' + sceneKey) return html;
    }
    return '';
  }

  window.SpeakerNotes = { getNotes };
})();
