/* i18n fragment for scene 2 - the playtest (you run it). English is
   authoritative; the Japanese mirror uses Gen-1-era kana phrasing. Deep-merged
   via window.I18N.register. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene2.title': 'You run it',

      'pt.section': 'YOU RUN IT',
      'pt.subtitle': 'Race to {target} - first to bank {target} wins. {gap} to go.',
      'pt.rival_rule': 'RIVAL: holds at {hold}',
      'pt.turn_pot': 'TURN POT',
      'pt.bank_you': 'YOU',
      'pt.bank_riv': 'RIVAL',

      /* buttons */
      'pt.btn.roll': 'ROLL',
      'pt.btn.hold': 'HOLD',
      'pt.btn.restart': 'RESTART',
      'pt.btn.roll_sub': 'risk it',
      'pt.btn.hold_sub': 'bank {pot}',
      'pt.btn.hold_sub0': 'nothing to bank',

      /* dialog - your turn */
      'pt.msg.your_turn': 'Your turn. ROLL to build the pot, or HOLD to bank it.',
      'pt.msg.rolled': 'You rolled a {face}. Pot is now {pot}.',
      'pt.msg.bust': 'A 1! BUST - the whole pot is gone. Turn passes to the rival.',
      'pt.msg.hold': 'You BANK {pot}. Your score is {score}. Over to the rival.',
      'pt.msg.hold_nothing': 'Nothing in the pot yet - ROLL first.',

      /* dialog - rival turn */
      'pt.msg.rival_start': 'The rival rolls...',
      'pt.msg.rival_roll': 'Rival rolls a {face} - their pot is {pot}.',
      'pt.msg.rival_bust': 'The rival rolled a 1 - busted! Back to you.',
      'pt.msg.rival_hold': 'The rival banks {pot}, reaching {score}. Your turn.',

      /* terminal */
      'pt.msg.you_win': 'You hit {target} - YOU WIN! Nerve and luck both held.',
      'pt.msg.you_lose': 'The rival reached {target} first. You lose this one.',
      'pt.win.banner': 'YOU WIN',
      'pt.lose.banner': 'YOU LOSE',

      /* caption / takeaway */
      'pt.caption': 'You just played by instinct. Notice you were already following some rule - bank around 20, but push harder when behind? Hold that thought.'
    },
    jp: {
      'scene2.title': 'じぶんで プレイ',

      'pt.section': 'じぶんで プレイ',
      'pt.subtitle': '{target}まで レース - さきに {target} バンクで かち。 あと {gap}。',
      'pt.rival_rule': 'あいて: {hold}で キープ',
      'pt.turn_pot': 'ターン ポット',
      'pt.bank_you': 'あなた',
      'pt.bank_riv': 'あいて',

      /* buttons */
      'pt.btn.roll': 'ふる',
      'pt.btn.hold': 'キープ',
      'pt.btn.restart': 'リスタート',
      'pt.btn.roll_sub': 'リスク',
      'pt.btn.hold_sub': '{pot} バンク',
      'pt.btn.hold_sub0': 'バンクなし',

      /* dialog - your turn */
      'pt.msg.your_turn': 'あなたの ターン。 ROLLで ポットを ふやす、 または HOLDで バンク。',
      'pt.msg.rolled': '{face}が でた。 ポットは {pot}。',
      'pt.msg.bust': '1! バスト - ポットは ぜんぶ きえた。 ターンは あいてへ。',
      'pt.msg.hold': '{pot}を バンク。 とくてんは {score}。 あいての ばん。',
      'pt.msg.hold_nothing': 'ポットは まだ から - まず ROLL。',

      /* dialog - rival turn */
      'pt.msg.rival_start': 'あいてが ふる...',
      'pt.msg.rival_roll': 'あいては {face} - ポットは {pot}。',
      'pt.msg.rival_bust': 'あいては 1 - バスト! あなたの ばん。',
      'pt.msg.rival_hold': 'あいては {pot}を バンク、 {score}に。 あなたの ターン。',

      /* terminal */
      'pt.msg.you_win': '{target}に とうたつ - あなたの かち! きんちょうと うんが もった。',
      'pt.msg.you_lose': 'あいてが さきに {target}に。 こんかいは まけ。',
      'pt.win.banner': 'あなたの かち',
      'pt.lose.banner': 'あなたの まけ',

      /* caption / takeaway */
      'pt.caption': 'いまのは かんで プレイした。 きづけば もう なにかの ルールに したがって いた - 20あたりで バンク、 でも まけて いると もっと おす? それを おぼえて おいて。'
    }
  });
})();
