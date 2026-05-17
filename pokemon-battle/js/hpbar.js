/* Discrete 5-segment HP bar.
 *
 *   The simulator is fully bucketed now (see js/battle.js header) — HP is one
 *   of 5 levels {full, high, mid, low, critical}. The bar drains in 5 visible
 *   segments instead of smoothly, with 4 tick marks at the bucket boundaries.
 *   Each level has its own color tier (light-green → green → yellow → orange
 *   → red), so even a still screenshot tells you which bucket the Pokemon is
 *   in.
 *
 *   This is the visible piece of the "make state abstraction explicit" fix:
 *   scene 1's bar and scene 4's mini-thumbnails both render this way, so the
 *   transition from scene 1 to scene 4 no longer hides a coarse-grained
 *   Q-table behind a smooth-looking battle. */
(function () {

  function mount(host, opts) {
    const T = (k) => (window.I18N ? window.I18N.t(k) : k);
    const o = Object.assign({
      name: T('pokemon.pikachu'),
      side: 'player',
      level: 5,
      numBuckets: 5,
    }, opts || {});

    host.className = 'hp-box ' + o.side;
    host.innerHTML = '';

    /* Name + level row. */
    const row1 = document.createElement('div');
    row1.className = 'row1';
    row1.innerHTML =
      '<span class="name">' + o.name + '</span>' +
      '<span class="lvl">:L' + o.level + '</span>';
    host.appendChild(row1);

    /* HP bar — segmented track with tick marks. */
    const barRow = document.createElement('div');
    barRow.className = 'hp-bar-row';
    barRow.innerHTML = '<span class="hp-label">' + T('hp.label') + '</span>';
    const track = document.createElement('div');
    track.className = 'hp-bar-track';

    /* The fill — width snaps to bucket levels via .hp-bar-fill[data-bucket]. */
    const fill = document.createElement('div');
    fill.className = 'hp-bar-fill';
    fill.dataset.bucket = '0';   /* 0 = full */
    track.appendChild(fill);

    /* Tick marks at the boundaries between buckets (4 ticks for 5 buckets). */
    for (let i = 1; i < o.numBuckets; i++) {
      const tick = document.createElement('span');
      tick.className = 'hp-bar-tick';
      tick.style.left = (i * 100 / o.numBuckets).toFixed(2) + '%';
      track.appendChild(tick);
    }

    barRow.appendChild(track);
    host.appendChild(barRow);

    /* Bucket label row (replaces the old "100/100" HP number — that wasn't
       meaningful in a bucketed world). Only shown on the player box, to
       match Gen-1 layout. */
    if (o.side === 'player') {
      const row3 = document.createElement('div');
      row3.className = 'row3';
      row3.innerHTML = '<span class="hp-num" id="hp-bucket-label">' + T('hp.bucket.full') + '</span>';
      host.appendChild(row3);
    }

    let cur = 0;     // bucket index 0..numBuckets (numBuckets = fainted)
    const maxB = o.numBuckets;
    const BUCKET_KEYS = ['full', 'high', 'mid', 'low', 'critical', 'fainted'];

    function bucketLabel(b) { return T('hp.bucket.' + (BUCKET_KEYS[b] || 'fainted')); }

    function set(bucket) {
      const prev = cur;
      cur = Math.max(0, Math.min(maxB, bucket));
      fill.dataset.bucket = String(cur);
      const label = host.querySelector('.hp-num');
      if (label) label.textContent = bucketLabel(cur);
      /* Drain ticks — one short tick per bucket crossed downward, in
         sync with the CSS width transition (1100 ms total).  Skip if
         we're going UP (rare, but possible on reset). */
      if (window.SFX && cur > prev) {
        const steps = cur - prev;
        for (let i = 0; i < steps; i++) {
          setTimeout(() => window.SFX.play('tick'), Math.round((i + 1) * (1100 / Math.max(1, steps + 1))));
        }
      }
    }
    /* Update the displayed name — used in scene 1 when CHARMANDER
       evolves into CHARMELEON / CHARIZARD mid-battle. */
    function setName(newName) {
      const nameEl = host.querySelector('.name');
      if (nameEl) nameEl.textContent = newName;
    }
    /* Backwards-compat name used by scene 1's old call site. */
    function drainTo(bucket) { set(bucket); }
    function refreshClass() { /* no-op — CSS reads data-bucket. */ }

    return { set, drainTo, refreshClass, setName, hp: () => cur };
  }

  window.HPBar = { mount };
})();
