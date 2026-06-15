/* scene3 i18n, formalization. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene3.title':  'What makes this an MDP?',
      'scene3.lede':   'Your gut playthrough was a <b>Markov decision process</b> all along. Four parts, revealed over the gauge you just ran. Press NEXT to add each one.',
      'scene3.state.h':  'STATE : the situation now',
      'scene3.state.b':  'The battery level: empty / low / mid / high / full. One number you can read at a glance.',
      'scene3.action.h': 'ACTION : the lever',
      'scene3.action.b': 'SEARCH (work), WAIT (idle), or RECHARGE (protect), one per step.',
      'scene3.trans.h':  'TRANSITION : the part you do not control',
      'scene3.trans.b':  'On a SEARCH the drain die sends you down a rung (70%) or two (30%). WAIT and RECHARGE are deterministic.',
      'scene3.reward.h': 'REWARD : the payoff',
      'scene3.reward.b': 'Trash collected: +3 at high/full, +2 at mid/low. WAIT pays +1. RECHARGE pays 0. Stranding costs minus 10.',
      'scene3.tuple':    'an MDP is a four-tuple',
      'scene3.hint':     'State, action, the part you do not control, the payoff. Press NEXT to reveal each part.',
    },
    jp: {
      'scene3.title':  'なにが これを MDP にする？',
      'scene3.lede':   'あなたの かんでの プレイは ずっと <b>マルコフけっていかてい</b> でした。 よっつの ぶぶんを、 いま うごかした ゲージの うえに。 NEXT で じゅんに ついか。',
      'scene3.state.h':  'じょうたい : いまの じょうきょう',
      'scene3.state.b':  'バッテリーレベル： カラ / ひくい / ちゅう / たかい / フル。 ひとめで わかる 1つの すうじ。',
      'scene3.action.h': 'こうどう : レバー',
      'scene3.action.b': 'サーチ（はたらく）、 まつ（たいき）、 じゅうでん（まもる）、 1ステップに 1つ。',
      'scene3.trans.h':  'せんい : きめられない ぶぶん',
      'scene3.trans.b':  'サーチで ドレインダイスが 1だん（70%）か 2だん（30%）さげる。 まつと じゅうでんは けっていてき。',
      'scene3.reward.h': 'ほうしゅう : ペイオフ',
      'scene3.reward.b': 'あつめた ゴミ： たかい/フルで +3、 ちゅう/ひくいで +2。 まつは +1。 じゅうでんは 0。 こしょうは マイナス 10。',
      'scene3.tuple':    'MDP は 4つくみ',
      'scene3.hint':     'じょうたい、 こうどう、 きめられない ぶぶん、 ペイオフ。 NEXT で じゅんに。',
    },
  });
})();
