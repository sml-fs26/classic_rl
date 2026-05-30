/* Tiny SVG line chart: episode index vs. cumulative reward.

   Used in scenes 3 + 4 (learning curve). No d3 dependency — straight SVG with
   path string + tick rendering. Theme-aware via CSS. The renderer accepts a
   raw episode_rewards array and computes both the raw line and an N-window
   moving average (the "smooth" line). */
(function () {
  function mount(host, opts) {
    const cfg = Object.assign({
      W: 360, H: 160,
      pad: { top: 10, right: 16, bottom: 24, left: 36 },
      window: 50,
    }, opts || {});

    host.innerHTML = '';
    host.classList.add('learning-curve');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${cfg.W} ${cfg.H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('lc-svg');
    host.appendChild(svg);

    const innerW = cfg.W - cfg.pad.left - cfg.pad.right;
    const innerH = cfg.H - cfg.pad.top - cfg.pad.bottom;

    /* Layers */
    const axisG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axisG.setAttribute('class', 'lc-axis');
    svg.appendChild(axisG);

    const rawPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rawPath.setAttribute('class', 'lc-raw');
    svg.appendChild(rawPath);

    const smoothPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smoothPath.setAttribute('class', 'lc-smooth');
    svg.appendChild(smoothPath);

    const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cursor.setAttribute('class', 'lc-cursor');
    cursor.setAttribute('y1', cfg.pad.top);
    cursor.setAttribute('y2', cfg.pad.top + innerH);
    svg.appendChild(cursor);

    const cursorMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    cursorMarker.setAttribute('class', 'lc-cursor-marker');
    cursorMarker.setAttribute('r', '3');
    svg.appendChild(cursorMarker);

    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('class', 'lc-axis-label');
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('x', cfg.pad.left + innerW / 2);
    xLabel.setAttribute('y', cfg.H - 4);
    xLabel.textContent = 'episode';
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('class', 'lc-axis-label');
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('x', 0);
    yLabel.setAttribute('y', 0);
    yLabel.setAttribute('transform', `translate(10, ${cfg.pad.top + innerH / 2}) rotate(-90)`);
    yLabel.textContent = 'reward';
    svg.appendChild(yLabel);

    let cached = null;

    function smoothMA(arr, w) {
      if (!arr || arr.length === 0) return [];
      const out = new Array(arr.length);
      let acc = 0;
      const half = Math.floor(w / 2);
      for (let i = 0; i < arr.length; i++) {
        const lo = Math.max(0, i - half);
        const hi = Math.min(arr.length - 1, i + half);
        let s = 0;
        for (let k = lo; k <= hi; k++) s += arr[k];
        out[i] = s / (hi - lo + 1);
      }
      return out;
    }

    function setData(rewards, opts2) {
      cached = { rewards: rewards.slice(), opts: opts2 || {} };
      render();
    }

    function render() {
      if (!cached) return;
      const rewards = cached.rewards;
      const o = cached.opts;
      if (!rewards.length) return;

      const xMin = 0;
      const xMax = rewards.length - 1;
      let yMin = Infinity, yMax = -Infinity;
      for (const v of rewards) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      if (!Number.isFinite(yMin)) yMin = -10;
      if (!Number.isFinite(yMax)) yMax = 10;
      if (yMax === yMin) { yMax = yMin + 1; }

      function xOf(i) {
        return cfg.pad.left + (xMax === xMin ? 0 : (i - xMin) / (xMax - xMin)) * innerW;
      }
      function yOf(v) {
        return cfg.pad.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;
      }

      /* Raw line */
      let d = '';
      for (let i = 0; i < rewards.length; i++) {
        d += (i === 0 ? 'M' : 'L') + xOf(i) + ',' + yOf(rewards[i]);
      }
      rawPath.setAttribute('d', d);

      /* Smooth */
      const sm = smoothMA(rewards, cfg.window);
      let ds = '';
      for (let i = 0; i < sm.length; i++) {
        ds += (i === 0 ? 'M' : 'L') + xOf(i) + ',' + yOf(sm[i]);
      }
      smoothPath.setAttribute('d', ds);

      /* Axes */
      axisG.innerHTML = '';
      const yTicks = [yMin, (yMin + yMax) / 2, yMax];
      for (const t of yTicks) {
        const y = yOf(t);
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', cfg.pad.left - 3);
        tick.setAttribute('x2', cfg.pad.left + innerW);
        tick.setAttribute('y1', y);
        tick.setAttribute('y2', y);
        tick.setAttribute('class', 'lc-grid');
        axisG.appendChild(tick);
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', cfg.pad.left - 5);
        lbl.setAttribute('y', y);
        lbl.setAttribute('class', 'lc-tick-label');
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('dy', '0.32em');
        lbl.textContent = t.toFixed(0);
        axisG.appendChild(lbl);
      }
      const xTicks = [0, Math.round(xMax / 2), xMax];
      for (const t of xTicks) {
        const x = xOf(t);
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', x);
        lbl.setAttribute('y', cfg.pad.top + innerH + 14);
        lbl.setAttribute('class', 'lc-tick-label');
        lbl.setAttribute('text-anchor', 'middle');
        lbl.textContent = t.toString();
        axisG.appendChild(lbl);
      }

      /* Cursor + marker positioned by callers via setCursor */
      cached.scales = { xOf, yOf, yMin, yMax, xMin, xMax };
      cursor.style.display = 'none';
      cursorMarker.style.display = 'none';
    }

    function setCursor(epIdx) {
      if (!cached || !cached.scales || !cached.rewards.length) return;
      const s = cached.scales;
      const i = Math.max(0, Math.min(cached.rewards.length - 1, epIdx | 0));
      const x = s.xOf(i);
      const y = s.yOf(cached.rewards[i]);
      cursor.setAttribute('x1', x);
      cursor.setAttribute('x2', x);
      cursor.style.display = '';
      cursorMarker.setAttribute('cx', x);
      cursorMarker.setAttribute('cy', y);
      cursorMarker.style.display = '';
    }

    return { setData, setCursor };
  }

  window.LearningCurve = { mount };
})();
