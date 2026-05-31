/* i18n fragment for scene 5 (the trajectory). English authoritative.
   Scene-local keys only; shared vocabulary (tiers, levers, coin/die,
   terminals, months) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title5': 'The trajectory',
      'scene5.hook':  'A run is a sequence of random variables: card, lever, reward, repeat.',

      'scene5.manager':
        'Two <b>identical</b> accounts, handled the <b>identical</b> way, can still end ' +
        'differently. That gap is the coin you do not control, and it is why a single ' +
        'anecdote lies.',

      'scene5.formula.label': 'A RUN IS A SEQUENCE OF RANDOM VARIABLES',
      'scene5.formula.foot':
        'Capital letters on purpose: each S, A, R is <b>random</b>. The run ends the ' +
        'month the coin says CHURN, or the month the countdown hits zero (RENEWED).',

      'scene5.setup.start':      'SAME START:',
      'scene5.setup.playbook':   'SAME PLAYBOOK:',
      'scene5.setup.everymonth': 'every month',

      'scene5.empty': 'Press RUN to play out one account, month by month.',

      'scene5.btn.run':   '▶ RUN ONE ACCOUNT',
      'scene5.btn.again': '↻ RUN AGAIN (same playbook)',

      'scene5.tally.label':
        'across {n} runs of the SAME start + playbook:',

      'scene5.punch':
        'Same start. Same playbook. <b>Different tape.</b> The lever was identical every ' +
        'time, so the spread you see is purely the dice. One run tells you almost nothing.',
    },
    jp: {
      'scene.title5': 'きせき τ',
      'scene5.hook':  'ランは かくりつへんすうの れつ: カード、 レバー、 ほうしゅう、 くりかえし。',

      'scene5.manager':
        '<b>おなじ</b> アカウントを <b>おなじ</b> やりかたで あつかっても、 けっかは ' +
        'ちがう ことがある。 その さは せいぎょできない コインで あり、 ひとつの ' +
        'いつわは あてに ならない りゆうだ。',

      'scene5.formula.label': 'ランは かくりつへんすうの れつ',
      'scene5.formula.foot':
        'わざと おおもじ: それぞれの S, A, R は <b>かくりつてき</b>。 コインが りだつと ' +
        'いう つき、 または カウントダウンが ゼロに なる つきに ランは おわる（こうしん）。',

      'scene5.setup.start':      'おなじ スタート:',
      'scene5.setup.playbook':   'おなじ ほうさく:',
      'scene5.setup.everymonth': 'まいつき',

      'scene5.empty': 'RUN を おして、 アカウントを つきごとに さいげんしよう。',

      'scene5.btn.run':   '▶ ひとつ ランする',
      'scene5.btn.again': '↻ もういちど（おなじ ほうさく）',

      'scene5.tally.label':
        'おなじ スタート＋ほうさくの {n}かい の ラン:',

      'scene5.punch':
        'おなじ スタート。 おなじ ほうさく。 <b>ちがう テープ。</b> レバーは まいかい ' +
        'おなじ だから、 みえる ばらつきは すべて サイコロ。 １かいの ランでは ' +
        'ほとんど わからない。',
    },
  });
})();
