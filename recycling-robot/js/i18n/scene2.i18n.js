/* scene2 i18n, playtest. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene2.title':  'You run it',
      'scene2.lede':   'You are the operator. Full battery, an 8-step shift. Pick a lever each step. Two identical openings can end with a full bag or a stranded robot.',
      'scene2.hud.step':    'shift step',
      'scene2.hud.battery': 'battery',
      'scene2.tape':        'this shift',
      'scene2.reset':       'NEW SHIFT',
      'scene2.say.start':   'Step 1 of 8. Push while you have headroom? Or play it safe? Your call.',
      'scene2.say.step':    '{left} steps left. Watch the gauge.',
      'scene2.say.end':     'Shift over. Total trash collected: {total}. Notice you were already following SOME rule.',
      'scene2.say.stranded':'STRANDED. The shift ends with a rescue. Total: {total}. A greedy search on a low battery is the gamble that strands you.',
    },
    jp: {
      'scene2.title':  'じぶんで うごかす',
      'scene2.lede':   'あなたが オペレーター。 フルバッテリー、 8ステップの シフト。 まいかい レバーを えらぶ。 おなじ はじまりでも、 まんたんの ふくろか、 こしょうした ロボットか。',
      'scene2.hud.step':    'シフト ステップ',
      'scene2.hud.battery': 'バッテリー',
      'scene2.tape':        'この シフト',
      'scene2.reset':       'あたらしい シフト',
      'scene2.say.start':   'ステップ 1 / 8。 よゆうが あるうちは おす？ それとも あんぜんに？ あなた しだい。',
      'scene2.say.step':    'のこり {left} ステップ。 ゲージを みて。',
      'scene2.say.end':     'シフト しゅうりょう。 あつめた ゴミ： {total}。 あなたは すでに なんらかの ルールに したがっていた。',
      'scene2.say.stranded':'こしょう。 シフトは レスキューで おわり。 ごうけい： {total}。 ひくい バッテリーでの よくばりサーチが あなたを こしょうさせる。',
    },
  });
})();
