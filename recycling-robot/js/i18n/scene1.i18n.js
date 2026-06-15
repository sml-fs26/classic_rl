/* scene1 i18n -- tutorial. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene1.title':  'How to play',
      'scene1.lede':   'Here is your <b>robot and its battery gauge</b> (the situation), the <b>three levers</b>, and the <b>drain die</b> that decides how much charge a SEARCH costs. Try the buttons.',
      'scene1.hud.battery': 'battery',
      'scene1.hud.lastdie': 'last drain',
      'scene1.say.intro':    'Tap a lever. SEARCH collects trash but rolls the drain die. WAIT idles for a crumb. RECHARGE crawls back to the dock.',
      'scene1.say.search':   'SEARCH: +{haul} trash collected, and the drain die took a pip off the battery.',
      'scene1.say.wait':     'WAIT: +1, a crumb. No drain, no risk. The gauge holds.',
      'scene1.say.recharge': 'RECHARGE: pays nothing now, but the gauge snaps back to full. Pure investment.',
      'scene1.say.strand':   'STRANDED! A drain hit empty. A technician drives out: a brutal −10. (Reset to full.)',
      'scene1.v.battery':  'situation = the gauge',
      'scene1.v.lever':    'lever = the button',
      'scene1.v.die':      'die = the drain you do not control',
      'scene1.v.shift':    'shift = how many steps remain',
    },
    jp: {
      'scene1.title':  'あそびかた',
      'scene1.lede':   'これが あなたの <b>ロボットと バッテリーゲージ</b>（じょうきょう）、 <b>3つの レバー</b>、 そして サーチの コストを きめる <b>ドレインダイス</b> です。 ボタンを ためしてください。',
      'scene1.hud.battery': 'バッテリー',
      'scene1.hud.lastdie': 'まえの ドレイン',
      'scene1.say.intro':    'レバーを タップ。 サーチは ゴミを あつめるが ダイスを ふる。 まつは わずかな ほうしゅう。 じゅうでんは ドックへ もどる。',
      'scene1.say.search':   'サーチ： +{haul} ゴミを かいしゅう、 ドレインダイスが バッテリーを 1だん へらした。',
      'scene1.say.wait':     'まつ： +1、 わずか。 ドレインなし、 リスクなし。 ゲージは そのまま。',
      'scene1.say.recharge': 'じゅうでん： いまは 0、 でも ゲージは フルに もどる。 じゅんすいな とうし。',
      'scene1.say.strand':   'こしょう！ ドレインが カラに とどいた。 ぎしが でばる： マイナス 10 の だいだげき。（フルに リセット）',
      'scene1.v.battery':  'じょうきょう = ゲージ',
      'scene1.v.lever':    'レバー = ボタン',
      'scene1.v.die':      'ダイス = きめられない ドレイン',
      'scene1.v.shift':    'シフト = のこり ステップすう',
    },
  });
})();
