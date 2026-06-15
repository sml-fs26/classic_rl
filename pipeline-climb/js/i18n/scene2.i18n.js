/* i18n fragment for Scene 2 (Playtest), Pipeline Climb.
 *
 *   "You run the deal": the learner IS the rep. From a fresh COLD lead they
 *   pick a lever each touch, watch the STAGE DIE, feel the climb, and play to
 *   a signature (SIGNED) or a drop-out (LOST). English is authoritative; the
 *   Japanese mirror reuses the established pipeline terms (rung names, levers,
 *   die faces, SIGNED / LOST) that live in js/i18n.js.
 *
 *   scene.title2 lives in the shared js/i18n.js and is NOT redefined here.
 */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene2.blurb': 'Playtest: you are the rep. Pick a lever, watch the die, feel the climb.',

      'scene2.section':  'YOU RUN THE DEAL',
      'scene2.caption':  'Pick a lever each touch. The STAGE DIE decides how the lead reacts. Every touch costs you one (-1); the deal ends at a signature (+30) or a drop-out (-10). The odds are hidden, so feel them out.',

      /* board / HUD labels */
      'scene2.return':      'RETURN SO FAR',
      'scene2.touchN':      'TOUCH {n}',
      'scene2.pickPrompt':  'PICK A LEVER FOR THIS TOUCH',
      'scene2.restart':     'RESTART',
      'scene2.tapeLabel':   'YOUR RUN',
      'scene2.tapeTotal':   '= {total}',
      'scene2.tapeStart':   'pick a lever to begin',

      /* per-touch messages (the dialog narrates the touch) */
      'scene2.msg.start':    'A fresh lead, cold at the bottom of the ladder. Pick a lever for the first touch.',
      'scene2.msg.touching': 'You play {lever}. The STAGE DIE rolls...',
      'scene2.msg.up':       'It warmed a rung, now at {rung}. Pick again.',
      'scene2.msg.stay':     'No movement, still at {rung}. Pick again.',
      'scene2.msg.down':     'It cooled a rung, back to {rung}. Pick again.',
      'scene2.msg.signed':   'SIGNED. The lead put pen to paper, the deal is won.',
      'scene2.msg.lost':     'LOST. The lead went cold and dropped out of the pipeline.',

      /* end-of-run summary */
      'scene2.end.title':    'DEAL OVER',
      'scene2.end.return':   'TOTAL RETURN',
      'scene2.end.signed':   'You closed the deal in {touches} touch(es). The signature paid +30, minus the time you spent getting there.',
      'scene2.end.lost':     'The lead dropped out after {touches} touch(es). The churn cost -10, on top of the time already spent.',
      'scene2.end.again':    'PLAY AGAIN',
      'scene2.end.hint':     'Same cold lead, different luck: two runs rarely end the same. Notice you were already following SOME rule. Hold that thought.',
    },
    jp: {
      'scene2.blurb': 'プレイテスト: あなたが レップ。 レバーを えらび、 ダイを みて、 のぼりを かんじる。',

      'scene2.section':  'あなたが やる',
      'scene2.caption':  'タッチごとに レバーを えらぶ。 リードの はんのうは ステージダイが きめる。 タッチごとに -1。 とりひきは サイン (+30) か ドロップアウト (-10) で おわる。 オッズは ひみつ。 かんじとろう。',

      'scene2.return':      'これまでの リターン',
      'scene2.touchN':      'タッチ {n}',
      'scene2.pickPrompt':  'この タッチの レバーを えらぶ',
      'scene2.restart':     'リスタート',
      'scene2.tapeLabel':   'あなたの きろく',
      'scene2.tapeTotal':   '= {total}',
      'scene2.tapeStart':   'レバーを えらんで かいし',

      'scene2.msg.start':    'あたらしい リード、 ラダーの そこで コールド。 さいしょの タッチの レバーを えらぶ。',
      'scene2.msg.touching': '{lever} を プレイ。 ステージダイが まわる…',
      'scene2.msg.up':       'ひとつ あたたまり、 いまは {rung}。 また えらぶ。',
      'scene2.msg.stay':     'うごきなし、 まだ {rung}。 また えらぶ。',
      'scene2.msg.down':     'ひとつ ひえて、 {rung} に もどる。 また えらぶ。',
      'scene2.msg.signed':   'サイン。 リードが サインし、 とりひき せいりつ。',
      'scene2.msg.lost':     'ロスト。 リードは ひえて パイプラインから だつらく。',

      'scene2.end.title':    'とりひき しゅうりょう',
      'scene2.end.return':   'リターン ごうけい',
      'scene2.end.signed':   '{touches} タッチで とりひきを クローズ。 サインで +30、 そこまでの じかんを さしひく。',
      'scene2.end.lost':     '{touches} タッチで リードが だつらく。 チャーンで -10、 すでに つかった じかんに くわえて。',
      'scene2.end.again':    'もういちど',
      'scene2.end.hint':     'おなじ コールドな リード、 ちがう うん: 2かいの きろくは めったに おなじに ならない。 あなたは すでに なにかの ルールに したがっていた。 おぼえておいて。',
    },
  });
})();
