/* scene9 i18n -- dynamic programming. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':  'Dynamic programming',
      'scene9.lede':   'The drain probabilities are known, so we can compute Q* <b>exactly</b>. The gauge fills bottom-up in time: start at the last step of the shift, then back up one step at a time, reusing the answers just locked in.',
      'scene9.step':   'BACK UP A STEP',
      'scene9.klabel': '{k} step(s) left in the shift',
      'scene9.narr.last':   'LAST step of the shift: no future to protect, just one-step payoffs. The safe +1 WAIT wins at low and mid.',
      'scene9.narr.second': 'One backup later: now the future matters. RECHARGE takes over at low and mid, banking a high-value future. The policy just snapped into place.',
      'scene9.narr.mid':    'Backing up ({k} steps left): the values grow but the policy is already stable, green at the top, blue at the bottom.',
      'scene9.narr.full':   'Start of the shift. The optimal rule is drawn: SEARCH at high/full (push), RECHARGE at mid/low (protect). The seam between high and mid is the punchline.',
      'scene9.hint':   'Known drain implies exact Q* by backups. After just 2 sweeps the policy stabilises; only the final-step column (WAIT) ever differs.',
    },
    jp: {
      'scene9.title':  'どうてき けいかくほう',
      'scene9.lede':   'ドレインの かくりつは きち、 だから Q* を <b>せいかくに</b> けいさん できる。 ゲージは じかんで したから うまる： シフトの さいごの ステップから、 いっぽずつ さかのぼり、 ロックした こたえを さいりよう。',
      'scene9.step':   'いっぽ さかのぼる',
      'scene9.klabel': 'シフト のこり {k} ステップ',
      'scene9.narr.last':   'シフトの さいごの ステップ： まもる みらいは ない、 いっぽの ペイオフ だけ。 あんぜんな +1 の まつが ひくい・ちゅうで かつ。',
      'scene9.narr.second': 'いっぽ さかのぼると： みらいが きいてくる。 ひくい・ちゅうで じゅうでんが ゆうい、 かちの たかい みらいを たくわえる。 ポリシーが きまった。',
      'scene9.narr.mid':    'さかのぼりちゅう（のこり {k} ステップ）： かちは ふえるが ポリシーは すでに あんてい、 うえ みどり、 した あお。',
      'scene9.narr.full':   'シフトの はじめ。 さいてきの ルールが えがかれた： たかい/フルで サーチ（おす）、 ちゅう/ひくいで じゅうでん（まもる）。 たかいと ちゅうの さかいめが おち。',
      'scene9.hint':   'きちの ドレインなら バックアップで せいかくな Q*。 2かいの スイープで ポリシー あんてい、 ちがうのは さいごの ステップ（まつ）の れつ だけ。',
    },
  });
})();
