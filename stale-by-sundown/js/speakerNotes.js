/* Speaker-notes lookup (lecturer crib, toggled by `n`). Notes live in the i18n
   dictionary under keys 'notes.<sceneKey>' so they travel with the copy. */
(function () {
  function getNotes(sceneKey) {
    if (!sceneKey) return '';
    if (window.I18N) {
      const html = window.I18N.t('notes.' + sceneKey);
      if (html && html !== 'notes.' + sceneKey) return html;
    }
    return '';
  }
  window.SpeakerNotes = { getNotes };
})();
