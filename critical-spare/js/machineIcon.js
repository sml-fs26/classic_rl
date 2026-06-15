/* machineIcon.js, the recurring STATE-ICON for Critical Spare.
 *
 *   A small factory-machine sprite whose colour + posture encode HEALTH:
 *     HEALTHY  green, humming (steady)
 *     AGING    amber, a steam/rattle wisp
 *     FAILING  red, sparks
 *   sitting above a SPARES BIN drawn as up to two boxed gears (empty slots are
 *   dashed outlines). This single icon (machine + bin) appears in every scene so
 *   the learner builds one mental picture, exactly as the Pokemon sprite-under-
 *   HP-bar did.
 *
 *   mount(host, opts) -> handle {
 *     set(h, s)            // set health (0..2) + spares (0..2)
 *     pulse()              // brief emphasis
 *     flashDowntime()      // red WAITING-FOR-PART burst (machine goes dark)
 *     flashReplace()       // gold gear-slides-in burst
 *     flashOrder()         // blue delivery burst
 *     el
 *   }
 *   opts.size: 'sm' | 'md' | 'lg' (default 'md')
 *   opts.showLabel: print the health name + "N SP" beneath (default true)
 *
 *   Theme-agnostic: every colour comes from CSS tokens. Styles live in
 *   css/grid.css (the icon shares the board's stylesheet). */
(function () {
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const HEALTH_KEYS = ['healthy', 'aging', 'failing'];

  /* The machine sprite as inline SVG. currentColor drives the body tint so the
     health class (.mi-healthy / .mi-aging / .mi-failing) recolours it. A simple
     chunky "press" / pump machine: a base, a body box with a gauge dot, a piston
     head, and a little smokestack. The wear cues (steam wisp, sparks) are
     separate elements toggled by the health class in CSS. */
  function machineSvg() {
    return '' +
      '<svg class="mi-svg" viewBox="0 0 64 56" width="100%" height="100%" aria-hidden="true">' +
        /* ground shadow */
        '<rect x="6" y="50" width="52" height="4" fill="var(--mi-shadow)"/>' +
        /* base plinth */
        '<rect x="10" y="42" width="44" height="8" fill="currentColor" stroke="var(--rule)" stroke-width="2"/>' +
        /* main body */
        '<rect x="14" y="20" width="36" height="22" fill="currentColor" stroke="var(--rule)" stroke-width="2"/>' +
        /* gauge window */
        '<rect x="19" y="25" width="12" height="12" fill="var(--mi-window)" stroke="var(--rule)" stroke-width="1.6"/>' +
        '<circle class="mi-gauge-dot" cx="25" cy="31" r="3"/>' +
        /* vent slats */
        '<rect x="35" y="25" width="11" height="2.4" fill="var(--rule)"/>' +
        '<rect x="35" y="29" width="11" height="2.4" fill="var(--rule)"/>' +
        '<rect x="35" y="33" width="11" height="2.4" fill="var(--rule)"/>' +
        /* piston tower + head */
        '<rect x="28" y="10" width="8" height="12" fill="currentColor" stroke="var(--rule)" stroke-width="2"/>' +
        '<rect class="mi-piston" x="26" y="6" width="12" height="6" fill="var(--mi-piston)" stroke="var(--rule)" stroke-width="2"/>' +
        /* smokestack */
        '<rect x="44" y="12" width="6" height="10" fill="currentColor" stroke="var(--rule)" stroke-width="2"/>' +
        /* steam wisp (AGING) */
        '<g class="mi-steam">' +
          '<circle cx="47" cy="9" r="2.2"/><circle cx="49" cy="5" r="1.6"/><circle cx="46" cy="3" r="1.2"/>' +
        '</g>' +
        /* sparks (FAILING) */
        '<g class="mi-sparks">' +
          '<path d="M20 16 l2 -4 l1 4 l4 -1 l-3 3 z"/>' +
          '<path d="M40 18 l1.5 -3 l1 3 l3 -1 l-2.5 2.5 z"/>' +
        '</g>' +
      '</svg>';
  }

  function binSvg() {
    /* Up to two slots; each is a boxed gear when filled, a dashed outline when
       empty. Rendered separately from the machine so REPLACE/ORDER can animate
       a single slot. */
    function slot(i) {
      return '<span class="mi-slot" data-slot="' + i + '">' +
        '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' +
          '<g class="mi-gear">' +
            '<circle cx="12" cy="12" r="6.5" fill="var(--mi-gear)" stroke="var(--rule)" stroke-width="1.8"/>' +
            '<circle cx="12" cy="12" r="2.4" fill="var(--bg-strong)" stroke="var(--rule)" stroke-width="1.2"/>' +
            '<g fill="var(--mi-gear)" stroke="var(--rule)" stroke-width="1.2">' +
              '<rect x="10.6" y="2.4" width="2.8" height="3.2"/><rect x="10.6" y="18.4" width="2.8" height="3.2"/>' +
              '<rect x="2.4" y="10.6" width="3.2" height="2.8"/><rect x="18.4" y="10.6" width="3.2" height="2.8"/>' +
            '</g>' +
          '</g>' +
        '</svg>' +
      '</span>';
    }
    return '<div class="mi-bin">' +
      '<div class="mi-bin-slots">' + slot(0) + slot(1) + '</div>' +
      '<div class="mi-bin-label">' + T('icon.bin') + ' <span class="mi-bin-count">0</span></div>' +
    '</div>';
  }

  function mount(host, opts) {
    const o = opts || {};
    const size = o.size || 'md';
    const showLabel = o.showLabel !== false;
    host.classList.add('machine-icon', 'mi-' + size);
    host.innerHTML =
      '<div class="mi-machine">' + machineSvg() + '</div>' +
      (showLabel ? '<div class="mi-health-label"></div>' : '') +
      binSvg();

    const machineEl = host.querySelector('.mi-machine');
    const labelEl = host.querySelector('.mi-health-label');
    const slots = Array.from(host.querySelectorAll('.mi-slot'));
    const countEl = host.querySelector('.mi-bin-count');

    let curH = 0, curS = 0;

    function set(h, s) {
      curH = h; curS = s;
      host.classList.remove('mi-healthy', 'mi-aging', 'mi-failing');
      host.classList.add('mi-' + HEALTH_KEYS[h]);
      if (labelEl) labelEl.textContent = T('health.' + HEALTH_KEYS[h]);
      for (let i = 0; i < slots.length; i++) slots[i].classList.toggle('filled', i < s);
      if (countEl) countEl.textContent = String(s);
    }
    function pulse() {
      machineEl.classList.remove('mi-pulse'); void machineEl.offsetWidth; machineEl.classList.add('mi-pulse');
      setTimeout(() => machineEl.classList.remove('mi-pulse'), 700);
    }
    function flashDowntime() {
      host.classList.remove('mi-downtime'); void host.offsetWidth; host.classList.add('mi-downtime');
      setTimeout(() => host.classList.remove('mi-downtime'), 1300);
    }
    function flashReplace() {
      host.classList.remove('mi-replace'); void host.offsetWidth; host.classList.add('mi-replace');
      setTimeout(() => host.classList.remove('mi-replace'), 900);
    }
    function flashOrder() {
      host.classList.remove('mi-order'); void host.offsetWidth; host.classList.add('mi-order');
      setTimeout(() => host.classList.remove('mi-order'), 900);
    }

    set(0, 0);
    return { set, pulse, flashDowntime, flashReplace, flashOrder, host, el: host };
  }

  window.MachineIcon = { mount };
})();
