/* scene6 i18n -- return. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene6.title': 'Return',
      'scene6.lede':  'The return is the cash summed over the rest of the horizon, discounted by γ = 0.9 -- not just this turn.',
      'scene6.formulaLabel': 'PAYOFF SUMMED OVER THE QUARTER',
      'scene6.setup': 'Start AGING with an EMPTY bin. Pick the FIRST lever, then play optimally and stack the quarter totals.',
      'scene6.firstOrder': 'FIRST: ORDER (pre-stock)',
      'scene6.firstRun':   'FIRST: RUN (gamble)',
      'scene6.run':   'RUN 300 QUARTERS',
      'scene6.run1':  'RUN 1',
      'scene6.reset': 'RESET',
      'scene6.quarters': 'QUARTERS',
      'scene6.mean':  'MEAN',
      'scene6.worst': 'WORST',
      'scene6.axis':  'quarter total',
      'scene6.note':  'Same situation, same first call, wildly different quarters. RUN\'s losing tail is fatter: an empty-bin failure books -8.',
      'scene6.framing': 'Two managers, same call, same situation -- different quarters. <b>You cannot judge a playbook by one outcome; you judge it by the distribution.</b> That is why we optimise the <em>expected</em> return.',
    },
    jp: {
      'scene6.title': 'リターン',
      'scene6.lede':  'リターンは のこりの ホライズンで たした げんきん、 γ = 0.9 で わりびき。 このターンだけ では ない。',
      'scene6.formulaLabel': 'クォーターで たした ほうしゅう',
      'scene6.setup': 'ろうきゅう・からの ビンから スタート。 さいしょの レバーを えらび、 そのあと さいぜんに プレイして クォーター ごうけいを つむ。',
      'scene6.firstOrder': 'さいしょ： はっちゅう (さきに ざいこ)',
      'scene6.firstRun':   'さいしょ： うんてん (かける)',
      'scene6.run':   '300 クォーター まわす',
      'scene6.run1':  '1 まわす',
      'scene6.reset': 'リセット',
      'scene6.quarters': 'クォーター',
      'scene6.mean':  'へいきん',
      'scene6.worst': 'さいあく',
      'scene6.axis':  'クォーター ごうけい',
      'scene6.note':  'おなじ じょうきょう、 おなじ さいしょの せんたく、 でも まるで ちがう クォーター。 うんてんの まけの しっぽが ふとい： からの ビンの こしょうは -8。',
      'scene6.framing': '2にんの マネージャー、 おなじ せんたく、 おなじ じょうきょう、 でも ちがう クォーター。 <b>プレイブックは 1かいの けっかでは はんだん できない。 ぶんぷで はんだんする。</b> だから <em>きたい</em> リターンを さいてきか する。',
    },
  });
})();
