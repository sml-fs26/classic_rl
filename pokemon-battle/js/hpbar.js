/* Animated HP bar with the green→yellow→red color phases.
 *
 * Mounts into a Pokemon-styled HP box (.hp-box). Exposes:
 *   set(hp)         — instantly set HP (used at reset).
 *   drainTo(hp)     — smooth 600 ms transition to the new HP.
 *   refreshClass()  — re-apply mid/low color class for the current %.
 *
 * The CSS does the actual color cross-fade via the .mid / .low class swap
 * + a 200 ms background transition. The width-bar transition is 600 ms. */
(function () {
  /* Mount an HP box at `host` for the given Pokemon. `opts.name` is the
     display name; `opts.maxHp` is the bar's full value; `opts.side` is
     'player' or 'opponent' (the box's screen position). */
  function mount(host, opts) {
    const o = Object.assign({ name: 'PIKACHU', maxHp: 100, side: 'player', level: 5 }, opts || {});
    host.className = 'hp-box ' + o.side;
    host.innerHTML = '';

    const row1 = document.createElement('div');
    row1.className = 'row1';
    row1.innerHTML =
      '<span class="name">' + o.name + '</span>' +
      '<span class="lvl">:L' + o.level + '</span>';
    host.appendChild(row1);

    const barRow = document.createElement('div');
    barRow.className = 'hp-bar-row';
    barRow.innerHTML = '<span class="hp-label">HP</span>';
    const track = document.createElement('div');
    track.className = 'hp-bar-track';
    const fill = document.createElement('div');
    fill.className = 'hp-bar-fill';
    track.appendChild(fill);
    barRow.appendChild(track);
    host.appendChild(barRow);

    const row3 = document.createElement('div');
    row3.className = 'row3';
    row3.innerHTML = '<span class="hp-num">' + o.maxHp + '/' + o.maxHp + '</span>';
    /* Only the player box shows the HP number, per Gen-1 convention. */
    if (o.side === 'player') host.appendChild(row3);

    let cur = o.maxHp;
    const maxHp = o.maxHp;

    function pct() { return 100 * cur / maxHp; }

    function refreshClass() {
      const p = pct();
      fill.classList.toggle('mid', p < 50 && p >= 20);
      fill.classList.toggle('low', p < 20);
    }

    function set(hp) {
      cur = Math.max(0, Math.min(maxHp, hp));
      fill.style.transition = 'none';
      fill.style.width = pct() + '%';
      refreshClass();
      const num = host.querySelector('.hp-num');
      if (num) num.textContent = cur + '/' + maxHp;
      /* Force reflow then restore transition for next drain. */
      void fill.offsetWidth;
      fill.style.transition = '';
    }

    function drainTo(hp) {
      cur = Math.max(0, Math.min(maxHp, hp));
      fill.style.width = pct() + '%';
      refreshClass();
      const num = host.querySelector('.hp-num');
      if (num) num.textContent = cur + '/' + maxHp;
    }

    return { set, drainTo, refreshClass, hp: () => cur };
  }

  window.HPBar = { mount };
})();
