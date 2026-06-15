/* scene11 i18n -- SARSA vs Q-learning. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene11.title':  'SARSA vs Q-learning',
      'scene11.lede':   'No drain model? <b>Learn</b> the table from experience: replace the expectation with one observed drain, and add <em>epsilon</em> to keep trying unproven levers. Two update rules, same experience, two honest answers.',
      'scene11.f.sarsa':'SARSA (on-policy): bootstrap on the lever you ACTUALLY take next',
      'scene11.f.ql':   'Q-learning (off-policy): bootstrap on the BEST next lever',
      'scene11.sarsa.h':'SARSA (cautious)',
      'scene11.ql.h':   'Q-learning (optimal)',
      'scene11.dp.h':   'DP oracle',
      'scene11.play':   'TRAIN',
      'scene11.verdict.learning': 'Both learners fill the gauge from experience, no model of the drain. Watch where they land.',
      'scene11.verdict.done':     'Q-learning recovers the DP stripe exactly (return {qlRet} ≈ DP {opt}). SARSA, learning the value of the cautious rule it follows, PROTECTS at the marginal high rung ({sarsaHigh}) instead of the bold SEARCH. Cautious vs optimal, both honest.',
      'scene11.hint':   'Run many small operating experiments and the playbook emerges, no model needed. On-policy SARSA learns the value of what it does (and stays cautious); off-policy Q-learning learns the value of optimal play (and matches DP).',
    },
    jp: {
      'scene11.title':  'SARSA たい Q-ラーニング',
      'scene11.lede':   'ドレインモデルが ない？ けいけんから テーブルを <b>まなぶ</b>： きたいちを 1つの かんそく ドレインに おきかえ、 <em>イプシロン</em> で みけんしょうの レバーも ためす。 ふたつの こうしんルール、 おなじ けいけん、 ふたつの しょうじきな こたえ。',
      'scene11.f.sarsa':'SARSA（オンポリシー）： じっさいに つぎに とる レバーで ブートストラップ',
      'scene11.f.ql':   'Q-ラーニング（オフポリシー）： つぎの さいぜんの レバーで ブートストラップ',
      'scene11.sarsa.h':'SARSA（しんちょう）',
      'scene11.ql.h':   'Q-ラーニング（さいてき）',
      'scene11.dp.h':   'DP オラクル',
      'scene11.play':   'がくしゅう',
      'scene11.verdict.learning': 'どちらも けいけんから ゲージを うめる、 ドレインの モデルなし。 どこに おちつくか みて。',
      'scene11.verdict.done':     'Q-ラーニングは DP の ストライプを せいかくに とりもどす（リターン {qlRet} ほぼ DP {opt}）。 SARSA は したがう しんちょうな ルールの かちを まなび、 きわどい たかい だんで ボールドな サーチでは なく {sarsaHigh} で まもる。 しんちょう たい さいてき、 どちらも しょうじき。',
      'scene11.hint':   'ちいさな うんよう じっけんを たくさん やれば プレイブックが あらわれる、 モデルなしで。 オンポリシーの SARSA は じぶんの こうどうの かちを まなび（しんちょうに）、 オフポリシーの Q-ラーニングは さいてきプレイの かちを まなぶ（DP と いっち）。',
    },
  });
})();
