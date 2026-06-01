/* i18n fragment for scene 5 (the trajectory, drawn as a tree). English
   authoritative. Scene-local keys only; shared vocabulary (tiers, levers,
   coin/die, terminals, months) lives in the i18n core (js/i18n.js). */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene.title5': 'The trajectory',
      'scene5.hook':  'A run is a sequence of random variables: card, lever, reward, repeat.',

      'scene5.manager':
        'Two <b>identical</b> accounts, handled the <b>identical</b> way, can still end ' +
        'differently. That gap is the coin you do not control, and it is why a single ' +
        'anecdote lies. So picture not one run, but the <b>whole tree</b> of runs at once.',

      'scene5.formula.label': 'A RUN IS A SEQUENCE OF RANDOM VARIABLES',
      'scene5.formula.foot':
        'Capital letters on purpose: each S, A, R is <b>random</b>. The run ends the ' +
        'month the coin says CHURN, or the month the countdown hits zero (RENEWED).',
      'scene5.tree.foot':
        'One trajectory = one root-to-leaf PATH through this tree.',

      'scene5.tree.caption':
        'Hold the situation at <b>{state}</b> and the lever at {lever}, then branch only on ' +
        'the coin and die. Every leaf is a RENEWED or CHURNED ending; G<sub>t</sub> on a ' +
        'leaf is the rewards along its path.',

      'scene5.derived.label': 'THE LIT PATH, READ BACK AS THE (S, A, R) TAPE:',
      'scene5.derived.empty': 'Press RUN to sample one path; it lights in the tree and unrolls here as a tape.',
      'scene5.derived.g':     'G<sub>t</sub> of this path = sum of its rewards = <b>{g}</b>',

      'scene5.btn.run':   '▶ RUN ONE PATH',
      'scene5.btn.step':  'STEP ▸',
      'scene5.btn.reset': '↺ RESET',
      'scene5.btn.again': '↻ RUN AGAIN',

      'scene5.tally.label':
        'across {n} sampled paths:',

      'scene5.punch':
        'Same situation. Same lever. <b>Different leaf.</b> One run is one path through the ' +
        'tree, so it tells you almost nothing on its own. The next scene weighs <b>every</b> ' +
        'leaf by its probability to get the honest average.',
    },
    jp: {
      'scene.title5': 'きせき τ',
      'scene5.hook':  'ランは かくりつへんすうの れつ: カード、 レバー、 ほうしゅう、 くりかえし。',

      'scene5.manager':
        '<b>おなじ</b> アカウントを <b>おなじ</b> やりかたで あつかっても、 けっかは ' +
        'ちがう ことがある。 その さは せいぎょできない コインで あり、 ひとつの ' +
        'いつわは あてに ならない りゆうだ。 だから ひとつの ランでは なく、 ランの ' +
        '<b>き ぜんたい</b>を いちどに みよう。',

      'scene5.formula.label': 'ランは かくりつへんすうの れつ',
      'scene5.formula.foot':
        'わざと おおもじ: それぞれの S, A, R は <b>かくりつてき</b>。 コインが りだつと ' +
        'いう つき、 または カウントダウンが ゼロに なる つきに ランは おわる（こうしん）。',
      'scene5.tree.foot':
        'ひとつの きせき = この きの こんから はっぱ までの ひとつの けいろ。',

      'scene5.tree.caption':
        'じょうきょうを <b>{state}</b>、 レバーを {lever} に こていし、 コインと サイコロ ' +
        'だけで えだわかれ。 かくはっぱは こうしん か りだつ の おわり。 はっぱの ' +
        'G<sub>t</sub> は その けいろ じょうの ほうしゅうの ごうけい。',

      'scene5.derived.label': 'てんとうした けいろを (S, A, R) テープ として よみかえす:',
      'scene5.derived.empty': 'RUN を おして けいろを １つ サンプル。 きで てんとうし、 ここで テープに ほどける。',
      'scene5.derived.g':     'この けいろの G<sub>t</sub> = ほうしゅうの ごうけい = <b>{g}</b>',

      'scene5.btn.run':   '▶ けいろを １つ',
      'scene5.btn.step':  'ステップ ▸',
      'scene5.btn.reset': '↺ リセット',
      'scene5.btn.again': '↻ もういちど',

      'scene5.tally.label':
        'サンプルした {n} けいろ:',

      'scene5.punch':
        'おなじ じょうきょう。 おなじ レバー。 <b>ちがう はっぱ。</b> １かいの ランは きの ' +
        'なかの ひとつの けいろ だから、 それだけ では ほとんど わからない。 つぎの ' +
        'シーンで <b>すべて</b>の はっぱを かくりつで おもみづけし、 ただしい へいきんを だす。',
    },
  });
})();
