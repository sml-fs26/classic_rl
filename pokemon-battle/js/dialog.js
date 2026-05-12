/* Pokemon dialog box with typewriter reveal.
 *
 * The classic Gen-1 dialog reveals one character every ~45 ms — slightly
 * slower than the Game Boy NORMAL speed (~30 ms) so the rhythm matches the
 * full Pokemon turn cadence. Click anywhere on the box to skip-to-end. A
 * small blinking ▼ appears after the reveal
 * completes, indicating the user should press to continue. Multiple lines
 * are queued and flushed one at a time by `next()`.
 *
 * Usage:
 *   const dlg = Dialog.mount(host);
 *   dlg.say("A wild CHARMANDER appeared!");
 *   dlg.onDone(() => ...);
 */
(function () {
  function mount(host) {
    host.classList.add('poke-box');

    const text = document.createElement('div');
    text.className = 'poke-dialog-text';
    text.style.minHeight = '3.4em';
    text.style.whiteSpace = 'pre-wrap';
    host.appendChild(text);

    const triangle = document.createElement('div');
    triangle.className = 'triangle';
    triangle.style.display = 'none';
    host.appendChild(triangle);

    let currentText = '';
    let revealIdx = 0;
    let timer = null;
    let doneCb = null;

    function clear() {
      if (timer) { clearTimeout(timer); timer = null; }
      currentText = '';
      revealIdx = 0;
      text.textContent = '';
      triangle.style.display = 'none';
    }

    function tick() {
      if (revealIdx >= currentText.length) {
        timer = null;
        triangle.style.display = '';
        if (doneCb) {
          const cb = doneCb;
          doneCb = null;
          /* Defer so callers can chain say()→onDone without re-entry. */
          setTimeout(cb, 0);
        }
        return;
      }
      revealIdx++;
      text.textContent = currentText.slice(0, revealIdx);
      timer = setTimeout(tick, 45);
    }

    function say(line, opts) {
      clear();
      const o = opts || {};
      currentText = String(line || '');
      revealIdx = 0;
      text.textContent = '';
      triangle.style.display = 'none';
      if (o.instant) {
        revealIdx = currentText.length;
        text.textContent = currentText;
        triangle.style.display = '';
        if (doneCb) { const cb = doneCb; doneCb = null; setTimeout(cb, 0); }
        return;
      }
      timer = setTimeout(tick, 45);
    }

    function skipToEnd() {
      if (timer) { clearTimeout(timer); timer = null; }
      revealIdx = currentText.length;
      text.textContent = currentText;
      triangle.style.display = '';
      if (doneCb) { const cb = doneCb; doneCb = null; setTimeout(cb, 0); }
    }

    function onDone(cb) {
      doneCb = cb;
      if (revealIdx >= currentText.length && currentText.length > 0) {
        const c = doneCb; doneCb = null; setTimeout(c, 0);
      }
    }

    host.addEventListener('click', () => {
      if (timer) skipToEnd();
    });

    return { say, skipToEnd, clear, onDone, el: host };
  }

  window.Dialog = { mount };
})();
