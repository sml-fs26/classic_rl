/* scene9 i18n, dynamic programming (progressive, one rung per click). */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene9.title':  'Dynamic programming',
      'scene9.lede':   'The drain probabilities are known, so we can compute Q* <b>exactly</b>. The gauge fills bottom-up in time: start at the last step of the shift, then back up one step at a time, locking in one rung per click.',
      'scene9.formula.label': 'WE KNOW THE DRAIN, SO WE SWEEP THIS BACKUP',

      'scene9.step':     'LOCK A RUNG',
      'scene9.back':     'BACK',
      'scene9.runlayer': 'FINISH LAYER',
      'scene9.runall':   'RUN ALL',
      'scene9.reset':    'RESET',

      'scene9.status.layer':  'LAYER',
      'scene9.status.locked': 'RUNGS LOCKED',
      'scene9.klabel': '{k} step(s) left',

      /* captions: ONE idea per micro-step. */
      'scene9.cap.ready':     'Ready. We fill the gauge from the bottom up, one rung at a time. Press LOCK A RUNG to begin at the last step of the shift.',
      'scene9.cap.k1.first':  'LAST step of the shift: no future to protect, just one-step payoffs. At <b>{rung}</b> the safe +1 WAIT wins, so it locks to <b>{lever}</b>.',
      'scene9.cap.k1.rung':   'Still the last step: at <b>{rung}</b> the best single-step move is <b>{lever}</b>.',
      'scene9.cap.k1.done':   'Last-step layer done: WAIT at low and mid, SEARCH at high and full. Now back up one step and the future starts to matter.',
      'scene9.cap.k2.first':  'Back up one step (2 left). Now each rung also banks the value of where it leaves us. Watch low and mid.',
      'scene9.cap.k2.flip':   'At <b>{rung}</b> the future tips the choice: RECHARGE now beats the safe WAIT, banking a high-value next step. The policy just snapped.',
      'scene9.cap.k2.rung':   'At <b>{rung}</b> the best move stays <b>{lever}</b>.',
      'scene9.cap.k2.done':   'After this one backup the policy is set: RECHARGE at the bottom, SEARCH at the top. Further layers only grow the numbers.',
      'scene9.cap.mid.first': 'Back up again ({k} left): same rule, bigger numbers. The future is just worth more with more shift ahead.',
      'scene9.cap.mid.rung':  'At <b>{rung}</b> ({k} left) the best move is still <b>{lever}</b>; its value keeps climbing.',
      'scene9.cap.final.rung':'Start of the shift ({k} left): at <b>{rung}</b> the best move is <b>{lever}</b>.',
      'scene9.cap.final.seam':'At <b>high</b> SEARCH (15.44) edges WAIT (14.89) by just 0.55: the closest call, the seam of the whole problem.',
      'scene9.cap.final.done':'Start of the shift. The optimal rule is drawn: SEARCH at high/full (push), RECHARGE at mid/low (protect). The seam between high and mid is the punchline.',

      'scene9.hint':   'Known drain implies exact Q* by backups. After just one backup the policy stabilises; only the final-step column (WAIT) ever differs.',
    },
    jp: {
      'scene9.title':  'どうてき けいかくほう',
      'scene9.lede':   'ドレインの かくりつは きち、 だから Q* を <b>せいかくに</b> けいさん できる。 ゲージは じかんで したから うまる： シフトの さいごの ステップから、 いっぽずつ さかのぼり、 クリックごとに 1だんずつ ロック。',
      'scene9.formula.label': 'ドレインは きち、 だから この バックアップを スイープ',

      'scene9.step':     'だんを ロック',
      'scene9.back':     'もどる',
      'scene9.runlayer': 'レイヤー かんりょう',
      'scene9.runall':   'ぜんぶ じっこう',
      'scene9.reset':    'リセット',

      'scene9.status.layer':  'レイヤー',
      'scene9.status.locked': 'ロックした だん',
      'scene9.klabel': 'のこり {k} ステップ',

      'scene9.cap.ready':     'じゅんび かんりょう。 ゲージを したから 1だんずつ うめる。 「だんを ロック」を おして シフトの さいごの ステップから はじめる。',
      'scene9.cap.k1.first':  'シフトの さいごの ステップ： まもる みらいは ない、 いっぽの ペイオフ だけ。 <b>{rung}</b> では あんぜんな +1 の まつが かち、 <b>{lever}</b> に ロック。',
      'scene9.cap.k1.rung':   'まだ さいごの ステップ： <b>{rung}</b> では 1ステップで さいぜんは <b>{lever}</b>。',
      'scene9.cap.k1.done':   'さいごの ステップの レイヤー かんりょう： ひくい・ちゅうで まつ、 たかい・フルで サーチ。 では いっぽ さかのぼると みらいが きいてくる。',
      'scene9.cap.k2.first':  'いっぽ さかのぼる（のこり 2）。 いまや どの だんも つぎの だんの かちも たくわえる。 ひくいと ちゅうを みて。',
      'scene9.cap.k2.flip':   '<b>{rung}</b> では みらいが えらびを かえる： じゅうでんが あんぜんな まつを こえ、 かちの たかい つぎを たくわえる。 ポリシーが きまった。',
      'scene9.cap.k2.rung':   '<b>{rung}</b> では さいぜんは <b>{lever}</b> の まま。',
      'scene9.cap.k2.done':   'この 1かいの バックアップで ポリシー かくてい： したで じゅうでん、 うえで サーチ。 さきの レイヤーは すうじが ふえる だけ。',
      'scene9.cap.mid.first': 'また さかのぼる（のこり {k}）： おなじ ルール、 おおきい すうじ。 さきが ながいほど みらいの かちは たかい。',
      'scene9.cap.mid.rung':  '<b>{rung}</b>（のこり {k}）でも さいぜんは <b>{lever}</b>、 かちは のびつづける。',
      'scene9.cap.final.rung':'シフトの はじめ（のこり {k}）： <b>{rung}</b> では さいぜんは <b>{lever}</b>。',
      'scene9.cap.final.seam':'<b>たかい</b> では サーチ（15.44）が まつ（14.89）を わずか 0.55 で こえる： もっとも きわどい、 もんだいの さかいめ。',
      'scene9.cap.final.done':'シフトの はじめ。 さいてきの ルールが えがかれた： たかい/フルで サーチ（おす）、 ちゅう/ひくいで じゅうでん（まもる）。 たかいと ちゅうの さかいめが おち。',

      'scene9.hint':   'きちの ドレインなら バックアップで せいかくな Q*。 1かいの バックアップで ポリシー あんてい、 ちがうのは さいごの ステップ（まつ）の れつ だけ。',
    },
  });
})();
