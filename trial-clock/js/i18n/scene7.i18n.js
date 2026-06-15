/* scene7 i18n, optimal action-value Q*. */
(function () {
  if (!window.I18N) return;
  window.I18N.register({
    en: {
      'scene7.title':  'Optimal action-value Q*',
      'scene7.lede':   '<b>Q*(s, a)</b> is the honest long-run value of pulling lever a in situation s, assuming you play smart afterward. The best lever is the argmax, the star.',
      'scene7.formulaLabel': 'the best you can do from s after committing to a',
      'scene7.pick':   'Inspect a situation:',
      'scene7.colLever':'lever a',
      'scene7.colQ':   'Q*(s, a)',
      'scene7.best':   'best',
      'scene7.at':     'Situation: <b>tier {tier}</b>, <b>{days} days left</b>',
      'scene7.note':   'Same lever, opposite verdict: a PUSH that is the worst move on a cold day-5 user is the best move in the game on an activated one. The situation decides.',
      'scene7.framing':'Q* is the honest, fully-loaded value of each lever for this exact customer, the number you wish you had on every account. Its argmax is the optimal playbook.',

      'scene7.btn.cold5':     'COLD · day 5',
      'scene7.btn.activated5':'ACTIVATED · day 5',
      'scene7.btn.mid5':      'MID · day 5',
      'scene7.btn.mid3':      'MID · day 3',
      'scene7.btn.dead':      'COLD · day 1',

      'scene7.read.cold5':     'A cold user with a full clock. <b>NUDGE wins</b> (+5.2): build value first. <b>PUSH is the worst lever</b> (−0.8), it courts the big ABANDON wedge. Do not ask yet.',
      'scene7.read.activated5':'The very <b>same PUSH</b> is now the star (+20). An activated user mostly BUYs, this is the best move in the game. Hooked users are who you ask.',
      'scene7.read.mid5':      'A mid user, full clock. NUDGE just edges PUSH (+16.2 vs +15.0): with time to spare, "build a bit more value first" still wins, barely. A genuine close call.',
      'scene7.read.mid3':      'Same mid user, but the clock is shorter. Now <b>PUSH overtakes</b> (+13.1 vs +13.0): you’re running out of runway, so you have to ask. The time axis flipped the verdict.',
      'scene7.read.dead':      'A cold user on the last day. Nudging only burns −1 with no time to pay off; pushing only risks the −5. So the value-maximizing move is to <b>spend nothing</b>, value 0. Sometimes the best lever is DO NOTHING.',
    },
    jp: {
      'scene7.title':  'さいてき こうどうかち Q*',
      'scene7.lede':   '<b>Q*(s, a)</b> は、 じょうきょう s で レバー a を ひく しょうじきな ちょうきかち（あとは じょうずに プレイ）。 さいぜんの レバーは argmax, ★。',
      'scene7.formulaLabel': 'a に きめた あと s から できる さいぜん',
      'scene7.pick':   'じょうきょうを しらべる：',
      'scene7.colLever':'レバー a',
      'scene7.colQ':   'Q*(s, a)',
      'scene7.best':   'さいぜん',
      'scene7.at':     'じょうきょう： <b>レベル {tier}</b>、 <b>のこり {days} にち</b>',
      'scene7.note':   'おなじ レバー、 はんたいの けつろん： つめたい 5にちめの ユーザーには さいあくの プッシュが、 アクティブな ユーザーには さいぜんの いって。 じょうきょうが きめる。',
      'scene7.framing':'Q* は この おきゃくに たいする かく レバーの しょうじきで かんぜんな かち, すべての アカウントで ほしい すうじ。 その argmax が さいぜんの プレイブック。',

      'scene7.btn.cold5':     'つめたい · 5にち',
      'scene7.btn.activated5':'アクティブ · 5にち',
      'scene7.btn.mid5':      'ちゅうかん · 5にち',
      'scene7.btn.mid3':      'ちゅうかん · 3にち',
      'scene7.btn.dead':      'つめたい · 1にち',

      'scene7.read.cold5':     'とけいが まんたんの つめたい ユーザー。 <b>ナッジが かち</b>（+5.2）： まず かちを そだてる。 <b>プッシュは さいあくの レバー</b>（−0.8）-- おおきな りだつ ウェッジを さそう。 まだ おねがいしない。',
      'scene7.read.activated5':'まったく <b>おなじ プッシュ</b> が いまや ★（+20）。 アクティブな ユーザーは ほぼ こうにゅう, これは ゲーム さいぜんの いって。 むちゅうな ひとに おねがいする。',
      'scene7.read.mid5':      'ちゅうかんの ユーザー、 まんたんの とけい。 ナッジが プッシュを わずかに うわまわる（+16.2 たい +15.0）： じかんに よゆうが あれば 「もうすこし かちを そだてる」 が まだ かち, ぎりぎり。 ほんとうの せっせん。',
      'scene7.read.mid3':      'おなじ ちゅうかん ユーザー、 でも とけいは みじかい。 いまや <b>プッシュが ぎゃくてん</b>（+13.1 たい +13.0）： のこり じかんが なくなり、 おねがい するしかない。 じかんじくが けつろんを はんてん させた。',
      'scene7.read.dead':      'さいごの ひの つめたい ユーザー。 ナッジは みのらない −1 を つかうだけ； プッシュは −5 を リスクするだけ。 だから かちを さいだいに する いっては <b>なにも つかわない</b>, かち 0。 ときには さいぜんの レバーは なにもしない。',
    },
  });
})();
