/* i18n fragment for Scene 6 (Pipeline Climb): the return G_t, the objective
 * E[G_t] as a weighted-leaf ledger, and Q*. jp mirrors every key. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene6.blurb': 'Return: the payoff summed over the whole deal, then averaged over runs.',

      'obj.heading': 'Return over the deal',
      'obj.g.label': 'The return of one run',
      'obj.g.foot': 'Add up every reward on the path: the touch costs (-1 each) and the final SIGNED (+30) or LOST (-10).',

      'obj.eg.label': 'Average the leaves of the {state} / {lever} tree, weighted by how likely each path is:',
      'obj.eg.tie': 'E[Gₜ] = {eg}. That weighted leaf-sum IS Q*({state}, {lever}): the score of pulling {lever} here.',

      'obj.qstar.label': 'The best a lever can be worth',
      'obj.qstar.foot': 'Q*(s, a) is the expected return of pulling lever a in state s, then playing optimally after.',
    },
    jp: {
      'scene6.blurb': 'リターン：とりひき ぜんたいの ほうしゅうの ごうけい、それを はしりで へいきん。',

      'obj.heading': 'とりひきの リターン',
      'obj.g.label': '1 かいの はしりの リターン',
      'obj.g.foot': 'みちの ほうしゅうを ぜんぶ たす：タッチ（−1）と さいごの サイン（+30）か ロスト（−10）。',

      'obj.eg.label': '{state} / {lever} の きの はを、みちの おきやすさで おもみづけ して へいきん：',
      'obj.eg.tie': 'E[Gₜ] = {eg}。この おもみつき はの ごうけいが Q*({state}, {lever})：ここで {lever} を ひく とくてん。',

      'obj.qstar.label': 'レバーが もちうる さいこうの かち',
      'obj.qstar.foot': 'Q*(s, a) は じょうたい s で レバー a を ひき、あとは さいてきに あそんだ ときの きたい リターン。',
    },
  });
})();
