/* Dialog box: a Pokemon-style text box with an optional typewriter reveal.
   API:
     const dlg = Dialog.mount(host);
     dlg.say("text", { instant?: true });   // reveal, char by char
     dlg.skipToEnd();                         // jump to full text
     dlg.onDone(cb);                          // fires when a reveal completes
     dlg.clear();
     dlg.el                                    // the host element
   DOWN arrow or a click on the box skips to the end. Respects
   prefers-reduced-motion (instant). */
(function () {
  const CHAR_MS = 18;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(host) {
    host.classList.add('poke-box', 'dlg-box');
    host.innerHTML = '<div class="dlg-text"></div><span class="triangle" hidden></span>';
    const textEl = host.querySelector('.dlg-text');
    const tri = host.querySelector('.triangle');

    let timer = null;
    let full = '';
    let i = 0;
    const doneCbs = [];

    function fireDone() {
      tri.hidden = false;
      const cbs = doneCbs.slice();
      doneCbs.length = 0;
      for (const cb of cbs) { try { cb(); } catch (e) { console.error(e); } }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function say(line, opts) {
      const o = opts || {};
      stop();
      full = String(line == null ? '' : line);
      tri.hidden = true;
      if (o.instant || reduced()) {
        textEl.innerHTML = full;
        fireDone();
        return;
      }
      /* Reveal as plain text to keep the typewriter simple; callers that
         need markup pass {instant:true}. */
      textEl.textContent = '';
      i = 0;
      timer = setInterval(() => {
        i++;
        textEl.textContent = full.slice(0, i);
        if (i % 3 === 0 && window.SFX) window.SFX.play('tick');
        if (i >= full.length) { stop(); fireDone(); }
      }, CHAR_MS);
    }
    function skipToEnd() {
      if (!timer) return;
      stop();
      textEl.textContent = full;
      fireDone();
    }
    function onDone(cb) { if (typeof cb === 'function') doneCbs.push(cb); }
    function clear() { stop(); textEl.textContent = ''; tri.hidden = true; }

    host.addEventListener('click', skipToEnd);

    return { say, skipToEnd, onDone, clear, el: host };
  }

  window.Dialog = { mount };
})();
