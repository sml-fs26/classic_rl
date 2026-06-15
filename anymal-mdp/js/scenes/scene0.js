/* Scene 0, title manifesto: "An MDP is five things."

   First contact. The student opens the page; before any keystroke, they read
   what an MDP is. Single column, max-width ~60ch, generous vertical rhythm.
   No interactive elements. No internal step engine. Cold-entry safe, built
   entirely from DATA.tuple. */
(function () {
  if (!window.scenes) window.scenes = {};

  window.scenes.scene0 = function (root) {
    const tuple = (window.DATA && window.DATA.tuple) || [];

    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 's0-wrap';

    const h1 = document.createElement('h1');
    h1.className = 's0-title';
    h1.textContent = 'An MDP is five things.';
    wrap.appendChild(h1);

    const subtitle = document.createElement('p');
    subtitle.className = 's0-subtitle';
    subtitle.textContent = 'ANYmal lives inside one. Click forward.';
    wrap.appendChild(subtitle);

    const list = document.createElement('div');
    list.className = 's0-tuple';

    for (let i = 0; i < tuple.length; i++) {
      const item = tuple[i];
      const isMuted = !!item.muted;

      const row = document.createElement('div');
      row.className = 's0-tuple-row' + (isMuted ? ' s0-tuple-row-muted' : '');

      const symCell = document.createElement('div');
      symCell.className = 's0-tuple-sym';
      symCell.appendChild(window.Katex.inline(item.sym));

      const nameCell = document.createElement('div');
      nameCell.className = 's0-tuple-name';
      nameCell.textContent = item.name;

      const captionCell = document.createElement('div');
      captionCell.className = 's0-tuple-caption';
      captionCell.textContent = item.caption;

      if (isMuted && item.deferred) {
        const deferred = document.createElement('span');
        deferred.className = 's0-tuple-deferred';
        deferred.textContent = ', ' + item.deferred;
        captionCell.appendChild(deferred);
      }

      row.appendChild(symCell);
      row.appendChild(nameCell);
      row.appendChild(captionCell);
      list.appendChild(row);
    }

    wrap.appendChild(list);

    const note = document.createElement('p');
    note.className = 's0-note';
    note.textContent = "We'll meet the first four today; γ comes later.";
    wrap.appendChild(note);

    root.appendChild(wrap);

    return {};
  };
})();
