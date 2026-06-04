/* Scene 12 - Recap ("You have climbed the ladder").
 *
 *   The bookend. window.DATA.recap is a ready array of six concept cards,
 *   one per badge: MDP, POLICY, RETURN, Q*, DP, SARSA. Each card carries
 *   {key, hue, title, symbol (LaTeX), caption, anchor}. We render them as a
 *   grid that echoes scene 0's title aesthetic (the wordmark drops in letter
 *   by letter), each card showing:
 *     - the lit concept badge (the same hue as the topbar pip, via the
 *       shared .concept-badge.badge-<hue>.earned class),
 *     - the title + caption from DATA.recap (English authoritative; the JP
 *       mirror comes from this scene's i18n, falling back to DATA),
 *     - the symbol rendered with KaTeX from DATA.recap[].symbol,
 *     - the anchor ("Scene N: ...") as a quiet footer chip.
 *
 *   Closes with the line: the CRM was an MDP all along. A restrained,
 *   celebratory-but-calm replay link returns to the title (scene 0).
 *
 *   Cold-entry safe: reads window.DATA.recap directly; never depends on a
 *   prior scene. All copy/symbols come from DATA (never hand-typed). */
(function () {
  window.scenes = window.scenes || {};

  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  /* Resolve a per-card string: prefer the scene-12 i18n key (so JP works)
     and fall back to the English DATA.recap field. window.I18N.t returns the
     key itself when missing, so detect that and use the DATA fallback. */
  function cardStr(key, fallback) {
    const v = T(key);
    return (v && v !== key) ? v : (fallback || '');
  }

  /* Build the letter-by-letter wordmark used on the title screen so the
     recap heading lands with the same ceremony (a space gets its own class
     so the gap survives without an animatable glyph). */
  function wordmark(text) {
    let html = '';
    let li = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') {
        html += '<span class="sc12-title-space">&nbsp;</span>';
      } else {
        html += '<span class="sc12-title-letter" style="--i:' + li + '">' + ch + '</span>';
        li++;
      }
    }
    return html;
  }

  window.scenes.scene12 = function (root) {
    root.classList.add('scene-pad', 'sc12-scene');
    root.innerHTML = '';

    const recap = (window.DATA && window.DATA.recap) || [];

    /* Banner. */
    const banner = document.createElement('div');
    banner.className = 'sc12-banner';
    banner.textContent = T('recap.banner');
    root.appendChild(banner);

    /* Heading (wordmark drop) + subtitle. */
    const head = document.createElement('h1');
    head.className = 'sc12-title';
    head.innerHTML = wordmark(T('recap.title'));
    root.appendChild(head);

    const sub = document.createElement('div');
    sub.className = 'sc12-sub';
    sub.textContent = T('recap.sub');
    root.appendChild(sub);

    /* The six recap cards. */
    const grid = document.createElement('div');
    grid.className = 'sc12-grid';
    root.appendChild(grid);

    recap.forEach((c, i) => {
      const box = document.createElement('div');
      box.className = 'poke-box sc12-card sc12-card-' + c.key;
      box.style.setProperty('--i', String(i));

      /* head: lit badge (hue from the shared concept-badge class) + title */
      const cardHead = document.createElement('div');
      cardHead.className = 'sc12-card-head';
      const badge = document.createElement('div');
      badge.className = 'concept-badge badge-' + (c.hue || c.key) + ' earned sc12-card-badge';
      badge.textContent = T('badge.' + c.key + '.full', (c.key || '').toUpperCase());
      cardHead.appendChild(badge);
      const title = document.createElement('div');
      title.className = 'sc12-card-title';
      title.textContent = cardStr('recap.card.' + c.key + '.title', c.title);
      cardHead.appendChild(title);
      box.appendChild(cardHead);

      /* symbol (KaTeX) from DATA */
      const fbox = document.createElement('div');
      fbox.className = 'sc12-card-symbol';
      box.appendChild(fbox);
      if (window.Katex && c.symbol) {
        window.Katex.render(c.symbol, fbox, true);
      } else if (c.symbol) {
        fbox.textContent = c.symbol;
      }

      /* caption */
      const cap = document.createElement('div');
      cap.className = 'sc12-card-caption';
      cap.textContent = cardStr('recap.card.' + c.key + '.caption', c.caption);
      box.appendChild(cap);

      /* anchor: which scene this idea landed in */
      if (c.anchor) {
        const anchor = document.createElement('div');
        anchor.className = 'sc12-card-anchor';
        anchor.textContent = cardStr('recap.card.' + c.key + '.anchor', c.anchor);
        box.appendChild(anchor);
      }

      grid.appendChild(box);
    });

    /* Closing line. */
    const close = document.createElement('div');
    close.className = 'sc12-close poke-box';
    close.textContent = T('recap.close');
    root.appendChild(close);

    /* Footnote. */
    const foot = document.createElement('div');
    foot.className = 'footnote sc12-foot';
    foot.textContent = T('recap.footnote');
    root.appendChild(foot);

    /* Replay link back to the title (scene 0). Marked data-run-primary so
       &run can capture this terminal control headlessly. */
    const replayWrap = document.createElement('div');
    replayWrap.className = 'sc12-replay-wrap';
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'poke-btn sc12-replay';
    replay.setAttribute('data-run-primary', '');
    replay.innerHTML = '<span class="sc12-replay-mark">' + String.fromCharCode(0x21BA) + '</span> ' + T('recap.replay');
    replay.addEventListener('click', () => {
      if (window.SFX) window.SFX.play('cursor');
      if (window.PipeViz) window.PipeViz.goTo(0);
      else { try { window.location.hash = '#scene=0'; } catch (_e) {} }
    });
    replayWrap.appendChild(replay);
    root.appendChild(replayWrap);

    /* Calm victory cue: defer so it lands while the cards animate in. Plays
       on first build and on revisit. */
    function fanfare() {
      setTimeout(() => { if (window.SFX && window.SFX.play) window.SFX.play('win'); }, 180);
    }
    fanfare();

    return {
      onEnter() { fanfare(); },
    };
  };
})();
