/* i18n fragment for Scene 7 (Pipeline Climb): Q*, the lever scorecard.
 * Average the return distribution away and you get one honest number per
 * lever per rung; the per-row argmax star is the greedy playbook, and it
 * WALKS UP the ladder. English is authoritative; jp mirrors every key and
 * reuses the established rung / lever / SIGNED-LOST terms from js/i18n.js. */
(function () {
  if (!window.I18N || typeof window.I18N.register !== 'function') return;
  window.I18N.register({
    en: {
      'scene7.blurb': 'Q*: the per-rung lever scorecard. The star walks up the ladder.',

      'qstar.heading': 'Q*: the lever scorecard',

      'qstar.lede':
        'Average those returns away and you get <b>one honest number</b> per ' +
        'lever in each situation: Q*(s, a), the long-run value of pulling lever ' +
        'a at rung s, then playing the best lever forever after. The winner of ' +
        'each row is the lever with the highest Q*, and it is <b>not</b> the ' +
        'same lever on every rung.',

      'qstar.formula.label': 'The value of a lever, played out',
      'qstar.formula.foot':
        'The best return you can expect from pulling lever a at rung s. Rank the ' +
        'levers by Q*; the top one is the move on that rung.',

      /* reveal panel */
      'qstar.icon.label':   'The rung in play',
      'qstar.icon.start':   'Fill the scorecard from the bottom up. The star marks the best lever on each rung.',
      'qstar.icon.caption': '{rung}: the star sits on {lever}.',
      'qstar.table.label':  'Q*(rung, lever)',

      /* per-rung read-outs, named as the star lands on each row */
      'qstar.read.start':
        'Five rungs, three levers, fifteen scores. Reveal them from COLD upward and ' +
        'watch where the star lands.',
      'qstar.read.cold':
        '<b>COLD.</b> A cold lead can only drop out, so HARD CLOSE is the lone ' +
        'negative score (-3.28): blasting a contract at a stranger burns the deal. ' +
        'NURTURE wins (+16.70). <i>Warm it first.</i>',
      'qstar.read.curious':
        '<b>CURIOUS.</b> The lead is paying attention. DEMO now tops the row: book ' +
        'the call and the odds of climbing jump. NURTURE is close behind; HARD ' +
        'CLOSE still bleeds value this early.',
      'qstar.read.engaged':
        '<b>ENGAGED.</b> Mid-ladder, DEMO keeps the star: show value and keep the ' +
        'lead climbing. The contract is not worth sending yet.',
      'qstar.read.evaluating':
        '<b>EVALUATING.</b> Nearly there. DEMO still edges it: one more good call ' +
        'beats a premature ask. The scores are bunching as the deal warms.',
      'qstar.read.ready':
        '<b>READY.</b> Now HARD CLOSE wins (+29.00): the same lever that was the ' +
        'lone negative at COLD is the best move here. <i>Ask for the signature.</i>',

      'qstar.hint.more':  'Revealed {n} / {total} rungs. Press ▶ or NEXT to fill the next rung.',
      'qstar.hint.done':  'The scorecard is full. The star walked COLD-to-READY: NURTURE, DEMO, DEMO, DEMO, HARD CLOSE.',
      'qstar.btn.fill':   'FILL ALL',

      'qstar.note':
        'The star <b>walks up the ladder</b>: same three levers, a different winner ' +
        'on every rung. That staircase of stars is the greedy playbook, and reading ' +
        'it off Q* is the whole job. Next: where does Q* come from?',
    },
    jp: {
      'scene7.blurb': 'Q*：ステージ ごとの レバー とくてんひょう。スターが ラダーを のぼる。',

      'qstar.heading': 'Q*： レバーの とくてん',

      'qstar.lede':
        'リターンを ならして へいきんすると、じょうきょう ごとに レバー 1つに ' +
        'つき <b>1つの しょうじきな すうち</b>： Q*(s, a)。ステージ s で レバー a を ' +
        'ひき、あとは ずっと さいぜんの レバーを ひいた ときの ながい めの かち。 ' +
        'かくぎょうの かちは Q* さいだいの レバー、そして それは ' +
        '<b>ステージ ごとに ちがう</b>。',

      'qstar.formula.label': 'レバーの かち、さいごまで やった とき',
      'qstar.formula.foot':
        'ステージ s で レバー a を ひいて きたいできる さいこうの リターン。 ' +
        'Q* で レバーを じゅんいづけ、1いが その ステージの て。',

      'qstar.icon.label':   'いまの ステージ',
      'qstar.icon.start':   'とくてんひょうを したから うめる。スターは かくステージの さいぜんの レバーに つく。',
      'qstar.icon.caption': '{rung}： スターは {lever} に ある。',
      'qstar.table.label':  'Q*(ステージ, レバー)',

      'qstar.read.start':
        '5ステージ、3レバー、15の とくてん。コールドから うえへ あらわし、 ' +
        'スターが どこに おちるか みよう。',
      'qstar.read.cold':
        '<b>コールド。</b> つめたい リードは だつらく するだけ。だから ハードクローズが ' +
        'ゆいいつの マイナス（−3.28）：しらない あいてに けいやくを たたきつけると とりひきが ' +
        'もえる。ナーチャーが かち（+16.70）。<i>まず あたためる。</i>',
      'qstar.read.curious':
        '<b>きょうみ。</b> リードは ちゅうもく している。デモが この ぎょうで 1い： ' +
        'コールを よやくすれば のぼる かくりつが あがる。ナーチャーが すぐ うしろ。 ' +
        'ハードクローズは まだ かちを そこなう。',
      'qstar.read.engaged':
        '<b>エンゲージ。</b> ラダーの まんなか、デモが スターを たもつ：かちを みせて ' +
        'リードを のぼらせる。けいやくは まだ おくる かちなし。',
      'qstar.read.evaluating':
        '<b>けんとう。</b> もう すぐ。デモが まだ わずかに かつ：もう 1かいの よい コールが ' +
        'はやすぎる いらいに まさる。とりひきが あたたまり とくてんが かたまる。',
      'qstar.read.ready':
        '<b>じゅんび。</b> いま ハードクローズが かつ（+29.00）：コールドで ゆいいつの ' +
        'マイナス だった おなじ レバーが ここでは さいぜんの て。<i>サインを たのむ。</i>',

      'qstar.hint.more':  '{total} ちゅう {n} ステージ あらわした。▶ か NEXT で つぎを うめる。',
      'qstar.hint.done':  'とくてんひょうが うまった。スターは コールドから じゅんびへ：ナーチャー、デモ、デモ、デモ、ハードクローズ。',
      'qstar.btn.fill':   'ぜんぶ うめる',

      'qstar.note':
        'スターが <b>ラダーを のぼる</b>：おなじ 3レバー でも ステージ ごとに かちぐみが ' +
        'ちがう。その スターの かいだんが グリーディな プレイブックで、Q* から よみとるのが ' +
        'しごと。つぎ：Q* は どこから くる？',
    },
  });
})();
