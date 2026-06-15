/* Scene 3 (formalization) i18n fragment. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene3.title': 'WHAT MAKES THIS AN MDP?',
      'scene3.lede':  'Strip the cave to four parts. Click to reveal each, pinned to the board.',
      'scene3.next':  'REVEAL NEXT >',
      'scene3.tupleBtn': 'ASSEMBLE THE TUPLE >',
      'scene3.done':  'THAT IS AN MDP',
      'scene3.tupleLabel': 'THE MDP, IN FOUR PARTS',
      'scene3.markov': 'Markov: the wind die cares only about your CURRENT tile and heading, not how you got here. The present tile is a sufficient summary of the past.',
      'scene3.state.tag': 'S', 'scene3.state.title': 'STATE: your tile',
      'scene3.state.note': 'The situation now: a (row, col) pair on the 5x5 floor plan. 25 tiles, 23 you actually decide from (gold and pit are terminal).',
      'scene3.action.tag': 'A', 'scene3.action.title': 'ACTION: your heading',
      'scene3.action.note': 'The lever you pull: the compass direction you attempt to walk. Four of them, the same set on every tile.',
      'scene3.transition.tag': 'P', 'scene3.transition.title': 'TRANSITION: the wind die',
      'scene3.transition.note': 'The part you do not control. One (tile, heading) can yield different next tiles: 0.7 you go where you aimed, 0.15 a gust shoves you left, 0.15 right.',
      'scene3.reward.tag': 'R', 'scene3.reward.title': 'REWARD: the payoff',
      'scene3.reward.note': '-1 per step (the torch burns), +10 the instant you reach the gold, -10 the instant you fall in the pit. Undiscounted; every run ends.',
      'scene3.framing': 'Strip any decision to four parts: the situation now (S), your levers (A), the part you do not control (P), and the payoff (R). Everything else is detail.',
    },
    jp: {
      'scene3.title': 'なにが MDP に するのか？',
      'scene3.lede':  'どうくつを よっつの ぶぶんに。 クリックで ボードに ピンどめ しながら みせる。',
      'scene3.next':  'つぎを みせる >',
      'scene3.tupleBtn': 'タプルを くみたてる >',
      'scene3.done':  'これが MDP',
      'scene3.tupleLabel': 'MDP、 よっつの ぶぶん',
      'scene3.markov': 'マルコフ： かぜダイスは いまの マスと むき だけを みる。 どう きたかは みない。 いまの マスが かこの じゅうぶんな ようやく。',
      'scene3.state.tag': 'S', 'scene3.state.title': 'じょうたい： あなたの マス',
      'scene3.state.note': 'いまの じょうきょう： 5x5 フロアの (ぎょう, れつ)。 25マス、 じっさいに きめるのは 23（おたから と あなは しゅうたん）。',
      'scene3.action.tag': 'A', 'scene3.action.title': 'こうどう： あなたの むき',
      'scene3.action.note': 'ひく レバー： あるこうとする ほうこう。 よっつ、 どの マスでも おなじ。',
      'scene3.transition.tag': 'P', 'scene3.transition.title': 'せんい： かぜダイス',
      'scene3.transition.note': 'せいぎょできない ぶぶん。 おなじ（マス, むき）でも つぎの マスは ちがいうる： 0.7 ねらいどおり、 0.15 ひだりへ、 0.15 みぎへ。',
      'scene3.reward.tag': 'R', 'scene3.reward.title': 'ほうしゅう： みかえり',
      'scene3.reward.note': '1ぽ -1（たいまつ）、 おたからで +10、 あなで -10。 わりびきなし。 どの プレイも おわる。',
      'scene3.framing': 'どんな いしけっても よっつに： いまの じょうきょう（S）、 レバー（A）、 せいぎょできない ぶぶん（P）、 みかえり（R）。 のこりは ぜんぶ さいぶ。',
    },
  });
})();
