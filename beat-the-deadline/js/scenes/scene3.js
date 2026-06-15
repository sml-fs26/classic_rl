/* Scene 3 -- Formalization. Freeze the dock and label the four MDP parts over a
   live dock tile, each with its KaTeX symbol. Cold-entry safe. */
(function () {
  window.scenes = window.scenes || {};
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const DATA = window.DATA;

  window.scenes.scene3 = function (root) {
    root.className = 'scene scene-pad sc3 concept-scene';
    root.innerHTML =
      '<h2 class="concept-heading">' + T('scene3.title') + '</h2>' +
      '<p class="concept-lede">' + T('scene3.lede') + '</p>' +
      '<div class="sc3-row">' +
        '<div class="sc3-tile-host"></div>' +
        '<div class="sc3-cards">' +
          card('mdp-state', T('scene3.state'), 'tex-state', T('scene3.stateBody')) +
          card('mdp-action', T('scene3.action'), 'tex-action', T('scene3.actionBody')) +
          card('mdp-trans', T('scene3.trans'), 'tex-trans', T('scene3.transBody')) +
          card('mdp-reward', T('scene3.reward'), 'tex-reward', T('scene3.rewardBody')) +
        '</div>' +
      '</div>' +
      '<div class="poke-box sc3-side">' + T('scene3.side') + '</div>' +
      '<div class="poke-box sc3-framing">' + T('scene3.framing') + '</div>';

    window.DockBoard.mount(root.querySelector('.sc3-tile-host'), { variant: 'icon', p: 2, h: 4 });

    renderTex(root.querySelector('.tex-state'), DATA.tex.state);
    renderTex(root.querySelector('.tex-action'), DATA.tex.actions);
    renderTex(root.querySelector('.tex-trans'), DATA.tex.transition);
    renderTex(root.querySelector('.tex-reward'), '+5\\,/\\,{-}10\\,/\\,{-}5');

    return {};
  };

  function card(cls, head, texId, body) {
    return '<div class="sc3-card ' + cls + '">' +
      '<div class="sc3-card-head">' + head + '</div>' +
      '<div class="sc3-card-tex ' + texId + '"></div>' +
      '<div class="sc3-card-body">' + body + '</div>' +
    '</div>';
  }
  function renderTex(host, tex) { if (host && window.Katex) window.Katex.render(tex, host, false); }
})();
