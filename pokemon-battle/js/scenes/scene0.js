/* Scene 0, POKEMON title screen.
 *
 *   First-visit ceremony: each letter of POKEMON drops in one at a
 *   time, a sparkle layer fires around the Pikachu sprite, PRESS START
 *   blinks with a bouncing chevron, and a thin grass strip scrolls
 *   along the bottom.  localStorage flag 'pokemon-battle.sc0-seen'
 *   marks subsequent visits as plain (no letter staggering) so the
 *   ceremony stays a moment, not a tax.
 *
 *   Pressing START or hitting NEXT yields to the scene engine and
 *   advances to scene 1 (the tutorial).
 */
(function () {
  window.scenes = window.scenes || {};

  function isFirstVisit() {
    try { return !localStorage.getItem('pokemon-battle.sc0-seen'); } catch (_e) { return true; }
  }
  function markSeen() {
    try { localStorage.setItem('pokemon-battle.sc0-seen', '1'); } catch (_e) {}
  }

  window.scenes.scene0 = function (root) {
    root.classList.add('scene-pad', 'sc0-scene');
    root.innerHTML = '';

    const T = (k) => (window.I18N ? window.I18N.t(k) : '');
    const firstVisit = isFirstVisit();
    const titleText = T('title.pokemon') || 'POKEMON';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'sc0-title-wrap' + (firstVisit ? ' sc0-first-visit' : '');

    /* Per-letter spans so the first-visit drop animation can stagger. */
    let titleHtml = '';
    for (let i = 0; i < titleText.length; i++) {
      const ch = titleText[i];
      const safe = ch === ' ' ? '&nbsp;' : ch;
      titleHtml += '<span class="poke-title-letter" style="--i:' + i + '">' + safe + '</span>';
    }

    titleWrap.innerHTML =
      '<h1 class="poke-title">' + titleHtml + '</h1>' +
      '<div class="sc0-subtitle">' + (T('title.subtitle') || 'A REINFORCEMENT LEARNING ADVENTURE') + '</div>' +
      '<div class="sc0-pika-wrap">' +
        '<div class="sc0-sparkles">' +
          '<span class="sc0-sparkle" style="--x: 8%;  --y: 12%; --d: 0.0s">★</span>' +
          '<span class="sc0-sparkle" style="--x: 88%; --y: 18%; --d: 0.6s">✦</span>' +
          '<span class="sc0-sparkle" style="--x: 18%; --y: 78%; --d: 1.2s">✧</span>' +
          '<span class="sc0-sparkle" style="--x: 82%; --y: 72%; --d: 1.8s">★</span>' +
          '<span class="sc0-sparkle" style="--x: 50%; --y: 4%;  --d: 2.4s">✦</span>' +
        '</div>' +
        '<img class="poke-sprite sc0-pika" src="assets/pikachu-front.png" alt="PIKACHU"/>' +
      '</div>' +
      '<button class="sc0-start" type="button">' +
        '<span class="sc0-start-chevron">▶</span>' +
        '<span class="sc0-start-label">' + (T('title.start') || 'PRESS START').replace(/^▶\s*/, '') + '</span>' +
      '</button>' +
      '<div class="sc0-grass-strip"></div>' +
      '<div class="sc0-credits">' + (T('title.credits') || 'SML · ETH ZURICH · CLASSIC RL #7') + '</div>' +
      '<div class="sc0-credits sc0-credits-by">' + (T('title.by') || 'BY CARLOS COTRINI') + '</div>';
    root.appendChild(titleWrap);

    const startBtn = titleWrap.querySelector('.sc0-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.PokeViz) window.PokeViz.goTo(window.PokeViz.getCurrentScene() + 1);
      });
    }

    /* Make the Pikachu sprite clickable for the easter-egg: every N
       clicks fires a cheek-sparks animation + cursor blip. */
    const pika = titleWrap.querySelector('.sc0-pika');
    let pikaClicks = 0;
    if (pika) {
      pika.addEventListener('click', () => {
        pikaClicks++;
        pika.classList.remove('sc0-pika-zap');
        void pika.offsetWidth;
        pika.classList.add('sc0-pika-zap');
        if (window.SFX) window.SFX.play('quick');
        setTimeout(() => pika.classList.remove('sc0-pika-zap'), 700);
        if (pikaClicks === 10 && window.SFX) {
          window.SFX.play('thunder');
        }
      });
    }

    if (firstVisit) markSeen();

    return { onEnter() {} };
  };
})();
