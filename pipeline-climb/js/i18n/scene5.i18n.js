/* i18n fragment for Scene 5 (Pipeline Climb): the trajectory drawn as a TREE.
 * English is authoritative; jp mirrors every key. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene5.blurb': 'Trajectory: a run is a tape of (state, lever, reward) over the deal.',

      'traj.heading': 'The trajectory, as a tree',
      'traj.formula.label': 'A run is a sequence of random variables',
      'traj.formula.foot': 'State, lever, reward, repeat, until the deal SIGNS or is LOST.',
      'traj.tree.foot': 'One run = one path through this tree.',
      'traj.tree.caption': 'Fix the lead at {state} and always pull {lever}. The world rolls the STAGE DIE; the branches are the outcomes.',

      'traj.derived.label': 'The lit path, read back as the old tape:',
      'traj.derived.empty': 'Press SAMPLE (or STEP) to draw one run and light its path.',
      'traj.derived.g': 'Gₜ = {g}  (sum of rewards on this path)',

      'traj.btn.sample': 'SAMPLE A RUN',
      'traj.btn.step': 'STEP',
      'traj.btn.reset': 'RESET',
      'traj.status.hint': 'SAMPLE lights a whole path; STEP (or →) walks it one move at a time.',
    },
    jp: {
      'scene5.blurb': 'トラジェクトリ：1 かいの はしりは（じょうたい・レバー・ほうしゅう）の テープ。',

      'traj.heading': 'トラジェクトリ を きで みる',
      'traj.formula.label': '1 かいの はしりは かくりつ へんすうの れつ',
      'traj.formula.foot': 'じょうたい、レバー、ほうしゅう、くりかえし。サイン か ロスト まで。',
      'traj.tree.foot': '1 かいの はしり = この きの 1 ほんの みち。',
      'traj.tree.caption': 'リードを {state} に こてい し、つねに {lever} を ひく。せかいが ステージダイ を ふり、えだが けっか。',

      'traj.derived.label': 'ひかった みちを、もとの テープ として よみなおす：',
      'traj.derived.empty': 'サンプル（または ステップ）で 1 かい ひいて みちを ひからせる。',
      'traj.derived.g': 'Gₜ = {g}（この みちの ほうしゅうの ごうけい）',

      'traj.btn.sample': 'サンプル',
      'traj.btn.step': 'ステップ',
      'traj.btn.reset': 'リセット',
      'traj.status.hint': 'サンプルは みち ぜんたいを、ステップ（→）は 1 て ずつ あるく。',
    },
  });
})();
