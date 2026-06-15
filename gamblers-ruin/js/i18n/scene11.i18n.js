/* scene11 i18n, SARSA vs Q-learning, side by side (model-free TD control). */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene11.title':  'SARSA vs Q-learning',
      'scene11.back':   '‹ BACK',
      'scene11.next':   'NEXT ›',
      'scene11.done':   'On to the recap ›',
      'scene11.step':   'Step {n} / 2',

      /* step 1: the idea + the split */
      'scene11.s1.tag':  'THE IDEA',
      'scene11.s1.title':'Drop the model. Learn from one flip at a time.',
      'scene11.s1.lead': 'We no longer know the coin. So replace the expectation in Bellman with <b>one observed flip</b>: after staking a at s, seeing reward r, landing at s-prime, nudge your estimate q toward what actually happened. Two classic update rules do this, differing only in <b>which next stake they assume</b>.',
      'scene11.s1.f0lab':'Bellman (needs the model we no longer have)',
      'scene11.s1.fSarsaLab':'SARSA, use the stake you ACTUALLY play next',
      'scene11.s1.fQLab':'Q-learning, use the BEST next stake',
      'scene11.s1.sarsaGloss':'On-policy: <b>play it safe</b>. SARSA learns the value of the cautious rule it actually follows, exploration and all. A stray exploratory bet that derails a bold run is part of what it learns from, so it leans timid.',
      'scene11.s1.qGloss':'Off-policy: <b>assume you’ll play optimally afterward</b>. Q-learning bootstraps on the best next stake, so it learns the value of the optimal playbook no matter how it explored.',
      'scene11.epsTitle':'Both keep exploring with epsilon',
      'scene11.epsBody': 'If you always play today’s best guess you never learn the others. So with a small probability <b>epsilon</b>, both learners place an unproven stake: the explore / exploit dial.',
      'scene11.note':    'Same flips, two update rules. The only difference is the next-stake term: the actual a-prime (SARSA) vs the best a-prime (Q-learning). That one change is the whole on-policy / off-policy split.',

      /* step 2: the live run, three boards */
      'scene11.s2.tag':  'WATCH THEM LEARN',
      'scene11.s2.title':'Same experience, two update rules, two different playbooks.',
      'scene11.play':    'PLAY',
      'scene11.pause':   'PAUSE',
      'scene11.reset':   'RESET',
      'scene11.episodes':'attempts played:',
      'scene11.conv':    'matches DP',
      'scene11.winrate': 'win-rate from $5',

      'scene11.sarsaTitle': 'ON-POLICY SARSA',
      'scene11.sarsaSub':   'learns the rule it follows → CAUTIOUS',
      'scene11.qlearnTitle':'OFF-POLICY Q-LEARNING',
      'scene11.qlearnSub':  'assumes optimal play after → BOLD',
      'scene11.oracle':     'DP ORACLE',
      'scene11.oracleSub':  'exact, if you knew the coin',

      'scene11.framing': 'Both play the same kind of attempts with no idea of the odds. <b>Q-learning</b> lands on the optimal bold zig-zag, the very answer the perfect-odds calculation gave. <b>SARSA</b> learns the value of the timid policy it actually follows and stays cautious through the dangerous middle. Same coin, same flips, two honest answers, because they ask two different questions.',
    },

    jp: {
      'scene11.title':  'SARSA たい Q-ラーニング',
      'scene11.back':   '‹ もどる',
      'scene11.next':   'つぎ ›',
      'scene11.done':   'まとめへ ›',
      'scene11.step':   'ステップ {n} / 2',

      'scene11.s1.tag':  'かんがえかた',
      'scene11.s1.title':'モデルを すてる。 1かいの コインなげから まなぶ。',
      'scene11.s1.lead': 'もう コインは わからない。 だから ベルマンの きたいちを <b>じっさいの 1かいの なげ</b>で おきかえる： s で a を かけ、 ほうしゅう r を み、 s\' に ついたら、 すいていち q を じっさいに おきた ことへ よせる。 これを する こてんてきな こうしんルールが ふたつ あり、 ちがうのは <b>つぎの どの かけを そうていするか</b>だけ。',
      'scene11.s1.f0lab':'ベルマン（もう ない モデルが ひつよう）',
      'scene11.s1.fSarsaLab':'SARSA, じっさいに つぎ プレイする かけを つかう',
      'scene11.s1.fQLab':'Q-ラーニング, つぎの さいぜんの かけを つかう',
      'scene11.s1.sarsaGloss':'オンポリシー： <b>あんぜんに いく</b>。 SARSA は じっさいに したがう しんちょうな ルールの かちを、 たんさくも ふくめて まなぶ。 だいたんな れんぞくを くずす まよいの かけも まなびの ぶぶん なので、 こしぬけに なる。',
      'scene11.s1.qGloss':'オフポリシー： <b>あとは さいぜんに プレイすると そうてい</b>。 Q-ラーニングは つぎの さいぜんの かけで ブートストラップ するので、 どう たんさく しても さいぜんの プレイブックの かちを まなぶ。',
      'scene11.epsTitle':'どちらも eps で たんさくを つづける',
      'scene11.epsBody': 'いつも きょうの さいぜんを えらぶと、 ほかを まなべない。 だから ちいさな かくりつ <b>eps</b> で、 りょうほうの がくしゅうきが ためしていない かけを おく： たんさく / かつようの つまみ。',
      'scene11.note':    'おなじ コインなげ、 ふたつの こうしんルール。 ちがいは つぎの かけの こうだけ： じっさいの a\'（SARSA）か さいぜんの a\'（Q-ラーニング）か。 その いってんが オンポリシー / オフポリシーの すべて。',

      'scene11.s2.tag':  'まなぶ ようすを みる',
      'scene11.s2.title':'おなじ けいけん、 ふたつの ルール、 ふたつの ちがう プレイブック。',
      'scene11.play':    'さいせい',
      'scene11.pause':   'ていし',
      'scene11.reset':   'リセット',
      'scene11.episodes':'プレイ かいすう：',
      'scene11.conv':    'DP と いっち',
      'scene11.winrate': '$5 からの かちりつ',

      'scene11.sarsaTitle': 'オンポリシー SARSA',
      'scene11.sarsaSub':   'したがう ルールを まなぶ → しんちょう',
      'scene11.qlearnTitle':'オフポリシー Q-ラーニング',
      'scene11.qlearnSub':  'あとは さいぜんと そうてい → だいたん',
      'scene11.oracle':     'DP オラクル',
      'scene11.oracleSub':  'コインを しれば せいかく',

      'scene11.framing': 'どちらも オッズを しらずに おなじ たぐいの プレイを する。 <b>Q-ラーニング</b>は さいぜんの だいたんな ジグザグ、 まさに かんぜんオッズの けいさんが だした こたえに たどりつく。 <b>SARSA</b>は じっさいに したがう しんちょうな ポリシーの かちを まなび、 あぶない まんなかでも しんちょうな ままだ。 おなじ コイン、 おなじ なげ、 ふたつの しょうじきな こたえ。 ちがう といを たてているからだ。',
    },
  });
})();
