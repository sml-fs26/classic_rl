/* i18n fragment for Scene 8 (Pipeline Climb): the Bellman equation as the
 * depth-1 trajectory tree (leaf = r + V(s')). jp mirrors every key. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene8.blurb': 'Bellman: a lever is worth today\'s payoff plus the value of the rung it opens.',

      'bell.heading': 'The Bellman equation',
      'bell.formula.label': 'A lever\'s value, one move deep',
      'bell.formula.foot': 'Today\'s reward R, plus the best you can do from wherever the die lands.',
      'bell.backup.foot': 'The backup IS this one-ply tree: every leaf reads Gₜ = r + V(s\').',

      'bell.backup.caption': 'One move of {lever} from {state}. The die opens three rungs; each leaf is worth its reward now plus V(s\') from there.',
      'bell.backup.tie': 'Weighted sum of the leaves = {eg} = Q*({state}, {lever}). The depth-1 tree IS the Bellman backup.',
    },
    jp: {
      'scene8.blurb': 'ベルマン：レバーの かちは きょうの ほうしゅう ＋ ひらく ステージの かち。',

      'bell.heading': 'ベルマン の しき',
      'bell.formula.label': 'レバーの かちを 1 て ぶん',
      'bell.formula.foot': 'きょうの ほうしゅう R ＋ さいころが おちた さきで できる さいぜん。',
      'bell.backup.foot': 'バックアップ = この 1 そうの き：どの はも Gₜ = r + V(s\')。',

      'bell.backup.caption': '{state} から {lever} を 1 て。さいころが 3 つの ステージを ひらき、はは いまの ほうしゅう ＋ そこからの V(s\')。',
      'bell.backup.tie': 'はの おもみつき ごうけい = {eg} = Q*({state}, {lever})。ふかさ 1 の きが ベルマン バックアップ。',
    },
  });
})();
