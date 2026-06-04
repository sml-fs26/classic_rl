/* i18n fragment for Scene 12 (Pipeline Climb): Recap.
 * Six concept cards in the ladder voice. The per-card title / caption /
 * anchor English copy is authoritative in window.DATA.recap, so the EN
 * block here only carries the scene chrome; the scene falls back to
 * DATA.recap for any per-card key it does not find. The JP block mirrors
 * the chrome AND supplies per-card translations (DATA.recap is English-
 * only), reusing the established pipeline terms (rung/stage = ステージ,
 * lever names, STAGE DIE = ステージ ダイ). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene12.blurb': 'Recap: six concept cards, one per idea, all tied back to the ladder.',

      'recap.banner': 'THE PLAYBOOK',
      'recap.title': 'You climbed the ladder',
      'recap.sub':
        'Six ideas, one lead, five rungs. The bones of a sales pipeline, and of reinforcement learning.',
      'recap.close':
        'Your CRM was a Markov decision process all along. One lead up a ladder today; any sequential decision under uncertainty tomorrow.',
      'recap.footnote':
        'A lead, a patient, a repair, a robot finding its footing: same situation, lever, roll, and payoff. The ladder was just the place to learn to read them.',
      'recap.replay': 'BACK TO THE TITLE',
    },
    jp: {
      'scene12.blurb': 'おさらい：6つの コンセプトカード、 かんがえ ひとつに 1まい、 すべて ラダーに つながる。',

      'recap.banner': 'プレイブック',
      'recap.title': 'ラダーを のぼった',
      'recap.sub':
        '6つの かんがえ、 ひとつの リード、 5つの ステージ。 セールス パイプラインの きほん、 そして 強化学習の きほん。',
      'recap.close':
        'あなたの CRM は さいしょから マルコフ けってい かてい だった。 きょうは リード ひとつを ラダーで、 あすは ふたしかさの なかの あらゆる じゅんじ けってい。',
      'recap.footnote':
        'リード、 かんじゃ、 しゅうり、 あしばを さがす ロボット：おなじ じょうきょう・レバー・ロール・はらい。 ラダーは それを よむ ための れんしゅうの ば だった。',
      'recap.replay': 'タイトルへ もどる',

      /* Per-card JP (DATA.recap is English-only; mirror it here). */
      'recap.card.mdp.title': 'MDP の わくぐみ',
      'recap.card.mdp.caption':
        'あなたの CRM は さいしょから MDP だった：じょうきょう（リードが いる ステージ）、 ひく レバー、 リードが あたたまる／さめる かくりつ、 そして はらい。 5つの ステージ、 3つの レバー。',
      'recap.card.mdp.anchor': 'シーン 3：けいしきか',

      'recap.card.policy.title': 'ポリシー = あなたの プレイブック',
      'recap.card.policy.caption':
        'ポリシーは ステージ ごとに レバーを ひとつ えらぶ、 あなたの SOP。 よい ものは リードが あたたまるに つれて かんがえを かえる：コールドは ナーチャー、 まんなかは デモ、 じゅんびに なって はじめて クローズ。',
      'recap.card.policy.anchor': 'シーン 4：2つの ハンド ポリシー',

      'recap.card.return.title': 'とりひき ぜんたいの リターン',
      'recap.card.return.caption':
        'この タッチ だけでなく、 とりひき ぜんたいで たした はらい。 そして ラン ごとに かわる。 ひとつの ステージから ひとつの レバーは、 ひとつの すうじ ではなく はらいの ぶんぷ を かえす。',
      'recap.card.return.anchor': 'シーン 6：リターン ヒストグラム',

      'recap.card.qstar.title': 'Q* = レバーの スコアカード',
      'recap.card.qstar.caption':
        'じょうきょう s で レバー a を ひく しんの ちょうき かち、 あとも かしこく プレイする ばあい。 ★は ラダーを のぼる：おなじ ハードクローズが じゅんびで +29、 コールドで -3.28。',
      'recap.card.qstar.anchor': 'シーン 7：★の かいだん',

      'recap.card.dp.title': 'DP：かくりつを しれば けいさんできる',
      'recap.card.dp.caption':
        'かいてある ステージ ダイの かくりつが あれば、 ベルマン バックアップの くりかえしで スコアカード ぜんたいを うめられる。 グリーディな プレイブックは およそ 3かいの スイープで さだまる。 ふつう その かくりつは ない。',
      'recap.card.dp.anchor': 'シーン 9：DP で Q* を うめる',

      'recap.card.sarsa.title': 'SARSA：プレイして まなぶ',
      'recap.card.sarsa.caption':
        'かいてある かくりつは いらない：いま おきた ことへ レバーの てんすうを よせ、 すこし たんさく する。 ★の かいだんは けいけんから うかびあがる：ためす、 けっか、 ちょうせい。',
      'recap.card.sarsa.anchor': 'シーン 11：ライブ SARSA デモ',
    },
  });
})();
