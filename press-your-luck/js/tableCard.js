/* The recurring STATE-ICON: a "table card".
 *
 *   This is the Press Your Luck analogue of the Pokemon "two sprites under
 *   HP bars" state-icon - the single visual the learner sees in every
 *   scene so one mental picture forms: how much is in the pot, and am I
 *   winning?
 *
 *   Layout (left -> right):
 *     - POT METER: a vertical stack of glowing chips. Height = pot bucket
 *       (0..5). A hot-red danger band marks the rows past 20 (bucket 5).
 *     - STANDING BADGE: a two-bar mini-scoreboard (you vs rival), tinted by
 *       standing - BEHIND cool blue / EVEN grey / AHEAD green.
 *
 *   All chips and bars are CSS-classed pixel blocks (no external image, no
 *   inline categorical colours). Colours resolve from CSS tokens in
 *   css/style.css (--chip-*, --c-roll, --c-hold, --stand-*), which retint
 *   under the CRT theme.
 *
 *   API:
 *     const card = TableCard.mount(host, opts?)
 *         opts.compact  -> smaller variant for grid cells
 *         opts.showVals -> print numeric pot / scores under the art
 *     card.set({ pot, potBucket, my, riv, standing, target })
 *         Any of potBucket / standing may be omitted and is derived from
 *         pot / (my,riv) via window.Pig when present. Clears any collapse.
 *     card.pop(potBucket?)  -> light up to `potBucket` (default: current+1)
 *         and play the chip-pop on the newly lit top row (THE ROLL, 2-6).
 *     card.collapse()       -> grey + slide the lit chips away (THE BUST, 1);
 *         leaves the meter showing an empty pot. Returns after the CSS anim.
 *     card.rows             -> the chip-row elements by bucket (1..NB-1)
 *     card.meter, card.badge
 *     card.el  -> the root element
 */
(function () {
  const POT_BUCKETS = (window.Pig && window.Pig.POT_BUCKETS) || 6;
  const DANGER_BUCKET = POT_BUCKETS - 1;   // bucket 5 = "21+" = past 20
  const STANDING_CLASS = ['behind', 'even', 'ahead'];

  function bucketOf(pot) {
    if (window.Pig && window.Pig.bucketOfPot) return window.Pig.bucketOfPot(pot);
    if (pot <= 0) return 0;
    if (pot <= 5) return 1;
    if (pot <= 10) return 2;
    if (pot <= 15) return 3;
    if (pot <= 20) return 4;
    return 5;
  }
  function standingOf(my, riv) {
    if (window.Pig && window.Pig.standingOf) return window.Pig.standingOf(my, riv);
    return my < riv ? 0 : (my > riv ? 2 : 1);
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('table-card');
    if (o.compact) host.classList.add('table-card-compact');
    host.innerHTML = '';

    /* ---- Pot meter (left) ---- */
    const meter = document.createElement('div');
    meter.className = 'tc-pot-meter';
    /* Rows are stacked bottom-up: row 0 at the bottom .. DANGER at the top.
       We render POT_BUCKETS - 1 fillable rows (bucket 0 = empty pot = no
       chip). Each row carries a 'danger' flag for the past-20 band. */
    const rows = [];
    for (let b = POT_BUCKETS - 1; b >= 1; b--) {
      const row = document.createElement('div');
      row.className = 'tc-chip-row' + (b >= DANGER_BUCKET ? ' tc-chip-danger' : '');
      row.dataset.bucket = String(b);
      meter.appendChild(row);
      rows[b] = row;
    }
    const meterLabel = document.createElement('div');
    meterLabel.className = 'tc-pot-label';
    meter.appendChild(meterLabel);
    host.appendChild(meter);

    /* ---- Standing badge (right) ---- */
    const badge = document.createElement('div');
    badge.className = 'tc-standing-badge';
    badge.innerHTML =
      '<div class="tc-bar-row tc-bar-you">' +
        '<span class="tc-bar-tag">' + tagYou() + '</span>' +
        '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-you"></span></span>' +
        '<span class="tc-bar-num tc-num-you">0</span>' +
      '</div>' +
      '<div class="tc-bar-row tc-bar-riv">' +
        '<span class="tc-bar-tag">' + tagRiv() + '</span>' +
        '<span class="tc-bar-track"><span class="tc-bar-fill tc-fill-riv"></span></span>' +
        '<span class="tc-bar-num tc-num-riv">0</span>' +
      '</div>' +
      '<div class="tc-standing-tag"></div>';
    host.appendChild(badge);

    const fillYou = badge.querySelector('.tc-fill-you');
    const fillRiv = badge.querySelector('.tc-fill-riv');
    const numYou = badge.querySelector('.tc-num-you');
    const numRiv = badge.querySelector('.tc-num-riv');
    const standTag = badge.querySelector('.tc-standing-tag');

    function tagYou() { return window.I18N ? window.I18N.t('vocab.you') : 'YOU'; }
    function tagRiv() { return window.I18N ? window.I18N.t('vocab.rival') : 'RIVAL'; }

    let curBucket = 0;
    let lastMy = 0, lastRiv = 0;

    function set(s) {
      s = s || {};
      const target = s.target || (window.Pig ? window.Pig.TARGET : 50);
      const pot = s.pot != null ? s.pot : 0;
      const pb = s.potBucket != null ? s.potBucket : bucketOf(pot);
      const my = s.my != null ? s.my : 0;
      const riv = s.riv != null ? s.riv : 0;
      const st = s.standing != null ? s.standing : standingOf(my, riv);
      lastMy = my; lastRiv = riv;

      meter.classList.remove('tc-pot-collapse');
      curBucket = pb;
      /* Light the bottom `pb` chip rows. */
      for (let b = 1; b < POT_BUCKETS; b++) {
        if (rows[b]) rows[b].classList.toggle('tc-chip-on', b <= pb);
      }
      meter.classList.toggle('tc-pot-danger', pb >= DANGER_BUCKET);
      meterLabel.textContent = (window.Pig && window.Pig.POT_BUCKET_LABELS)
        ? window.Pig.POT_BUCKET_LABELS[pb]
        : String(pb);

      /* Standing bars: scale to the target. */
      const pct = (v) => Math.max(0, Math.min(100, (v / target) * 100));
      fillYou.style.width = pct(my) + '%';
      fillRiv.style.width = pct(riv) + '%';
      numYou.textContent = String(my);
      numRiv.textContent = String(riv);

      for (const c of STANDING_CLASS) badge.classList.remove('tc-stand-' + c);
      badge.classList.add('tc-stand-' + STANDING_CLASS[st]);
      standTag.textContent = window.I18N
        ? window.I18N.t('vocab.' + STANDING_CLASS[st])
        : STANDING_CLASS[st].toUpperCase();

      if (o.showVals) host.classList.add('tc-show-vals');
    }

    function reducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* THE ROLL (2-6): light up to `toBucket` (default one above current) and
       pop the newly lit top chip. */
    function pop(toBucket) {
      meter.classList.remove('tc-pot-collapse');
      const tgt = toBucket != null ? toBucket : Math.min(POT_BUCKETS - 1, curBucket + 1);
      for (let b = 1; b < POT_BUCKETS; b++) {
        if (rows[b]) rows[b].classList.toggle('tc-chip-on', b <= tgt);
      }
      meter.classList.toggle('tc-pot-danger', tgt >= DANGER_BUCKET);
      const top = rows[tgt];
      if (top && !reducedMotion()) {
        top.classList.remove('tc-chip-pop');
        void top.offsetWidth;
        top.classList.add('tc-chip-pop');
        setTimeout(() => top.classList.remove('tc-chip-pop'), 340);
      }
      curBucket = tgt;
    }

    /* THE BUST (1): grey + slide the lit chips away, then settle to empty. */
    function collapse() {
      return new Promise((resolve) => {
        if (reducedMotion() || curBucket <= 0) {
          set({ pot: 0, potBucket: 0, my: lastMy, riv: lastRiv });
          resolve();
          return;
        }
        meter.classList.add('tc-pot-collapse');
        setTimeout(() => {
          meter.classList.remove('tc-pot-collapse');
          for (let b = 1; b < POT_BUCKETS; b++) {
            if (rows[b]) rows[b].classList.remove('tc-chip-on');
          }
          meter.classList.remove('tc-pot-danger');
          meterLabel.textContent = (window.Pig && window.Pig.POT_BUCKET_LABELS)
            ? window.Pig.POT_BUCKET_LABELS[0] : '0';
          curBucket = 0;
          resolve();
        }, 420);
      });
    }

    set({ pot: 0, my: 0, riv: 0 });
    return { el: host, set, pop, collapse, rows, meter, badge };
  }

  window.TableCard = { mount, bucketOf, standingOf };
})();
