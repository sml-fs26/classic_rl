/* scene11 i18n -- SARSA, learn Q* by playing. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene11.title':  'SARSA',
      'scene11.back':   '‹ BACK',
      'scene11.next':   'NEXT ›',
      'scene11.done':   'On to the recap ›',
      'scene11.step':   'Step {n} / 2',

      'scene11.s1.tag':  'THE IDEA',
      'scene11.s1.title':'Drop the model. Learn from one attempt at a time.',
      'scene11.s1.lead': 'We no longer know the dice. So replace the expectation in Bellman with <b>one observed attempt</b>: pull lever a in situation s, see reward r, see the next situation s′ and the next lever a′, and nudge your estimate q toward what actually happened.',
      'scene11.s1.f0lab':'Bellman (needs the model we no longer have)',
      'scene11.s1.fSarsaLab':'SARSA -- use the situation, lever, reward, next situation, next lever you observed',
      'scene11.s1.sarsaGloss':'The name SARSA spells out exactly what one update uses: <b>S</b>tate, <b>A</b>ction, <b>R</b>eward, next <b>S</b>tate, next <b>A</b>ction. No model of the customer -- just experience. Each attempt nudges one cell of the playbook.',
      'scene11.epsTitle':'Explore with epsilon',
      'scene11.epsBody': 'If you always play today’s best guess you never learn the others. So with a small probability <b>epsilon</b>, deliberately try an unproven lever -- budget a slice of trials to keep the playbook improving instead of ossifying around last quarter’s habits.',
      'scene11.note':    'This is the model-free fix derived straight from Bellman: replace the unknown expectation with one sample, repeat, and the estimate converges -- never having been told the odds.',

      'scene11.s2.tag':  'WATCH IT LEARN',
      'scene11.s2.title':'Learn the playbook from experience -- and it matches DP.',
      'scene11.play':    'PLAY',
      'scene11.pause':   'PAUSE',
      'scene11.reset':   'RESET',
      'scene11.episodes':'trials played:',
      'scene11.conv':    'matches DP',
      'scene11.value':   'value from cold day-5',

      'scene11.learnTitle': 'SARSA LEARNER',
      'scene11.learnSub':   'fills from experience, odds unknown',
      'scene11.oracle':     'DP ORACLE',
      'scene11.oracleSub':  'exact, if you knew the dice',

      'scene11.framing': 'SARSA plays trial after trial with no idea of the odds, and its colours converge to the exact same staircase the perfect-odds calculation gave -- every cell. You don’t need the true response curves: run many small experiments, watch what converts, and let the playbook learn itself.',
    },
    jp: {
      'scene11.title':  'SARSA',
      'scene11.back':   '‹ もどる',
      'scene11.next':   'つぎ ›',
      'scene11.done':   'まとめへ ›',
      'scene11.step':   'ステップ {n} / 2',

      'scene11.s1.tag':  'かんがえかた',
      'scene11.s1.title':'モデルを すてる。 1かいの しこうから まなぶ。',
      'scene11.s1.lead': 'もう さいころは わからない。 だから ベルマンの きたいちを <b>1かいの かんそく</b>で おきかえる： じょうきょう s で レバー a を ひき、 ほうしゅう r を み、 つぎの じょうきょう s′ と つぎの レバー a′ を み、 すいていち q を じっさいに おきた ことへ よせる。',
      'scene11.s1.f0lab':'ベルマン（もう ない モデルが ひつよう）',
      'scene11.s1.fSarsaLab':'SARSA -- かんそくした じょうきょう・レバー・ほうしゅう・つぎの じょうきょう・つぎの レバーを つかう',
      'scene11.s1.sarsaGloss':'SARSA という なまえは 1かいの こうしんが つかう ものを そのまま あらわす： <b>S</b>tate、 <b>A</b>ction、 <b>R</b>eward、 つぎの <b>S</b>tate、 つぎの <b>A</b>ction。 おきゃくの モデルは なし -- けいけんだけ。 1かいの しこうが プレイブックの 1セルを よせる。',
      'scene11.epsTitle':'eps で たんさく',
      'scene11.epsBody': 'いつも きょうの さいぜんを えらぶと、 ほかを まなべない。 だから ちいさな かくりつ <b>eps</b> で、 わざと ためしていない レバーを ためす -- しこうの いちぶを わりあて、 ぜんしはんきの くせに かたまらず プレイブックを かいぜん しつづける。',
      'scene11.note':    'これは ベルマンから ちょくせつ みちびいた モデルフリーの しゅうせい： しらない きたいちを 1サンプルで おきかえ、 くりかえすと すいていちは しゅうそく する -- オッズを しらされずに。',

      'scene11.s2.tag':  'まなぶ ようすを みる',
      'scene11.s2.title':'けいけんから プレイブックを まなぶ -- そして DP と いっち。',
      'scene11.play':    'さいせい',
      'scene11.pause':   'ていし',
      'scene11.reset':   'リセット',
      'scene11.episodes':'しこう かいすう：',
      'scene11.conv':    'DP と いっち',
      'scene11.value':   'つめたい 5にちめ からの かち',

      'scene11.learnTitle': 'SARSA がくしゅうき',
      'scene11.learnSub':   'けいけんから うめる、 オッズ ふめい',
      'scene11.oracle':     'DP オラクル',
      'scene11.oracleSub':  'さいころを しれば せいかく',

      'scene11.framing': 'SARSA は オッズを しらずに トライアルを くりかえし、 その いろは かんぜんオッズの けいさんが だした まったく おなじ かいだんに しゅうそく する -- どの セルも。 ほんとうの はんのうカーブは いらない： おおくの ちいさな じっけんを し、 なにが こうにゅう するかを み、 プレイブックを ひとりでに まなばせる。',
    },
  });
})();
