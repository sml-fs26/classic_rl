/* Multi-trace SVG line chart for scene 4.

   X axis: throw index n (1..N).  Y axis: position (0..100).

   Each trace is a polyline class-styled via CSS only (no inline stroke).
   The truth (bullseye trajectory) is drawn first, behind the estimates,
   in a hairline rule color so the estimates read on top. Optional
   chevron at the head of each trace marks the latest sample.

   Pure DOM + SVG; theme-aware via the surrounding text color and per-class
   stroke variables. */
(function () {

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k of Object.keys(attrs)) node.setAttribute(k, attrs[k]);
    return node;
  }

  /* Build a chart. opts:
       host, DOM node to fill
       N, total throw count (x-axis extent)
       yMin, y-axis lower bound (default 0)
       yMax, y-axis upper bound (default 100)
       label, optional caption above the chart */
  function mount(opts) {
    const host = opts.host;
    const N = opts.N;
    const yMin = (typeof opts.yMin === 'number') ? opts.yMin : 0;
    const yMax = (typeof opts.yMax === 'number') ? opts.yMax : 100;

    host.innerHTML = '';
    host.classList.add('chart-host');

    if (opts.label) {
      const lbl = document.createElement('div');
      lbl.className = 'chart-label';
      lbl.textContent = opts.label;
      host.appendChild(lbl);
    }

    /* Lock the SVG layout box explicitly, SKILL §"Things to never do" */
    const W = 720;
    const H = 260;
    const PAD_L = 36;
    const PAD_R = 12;
    const PAD_T = 8;
    const PAD_B = 22;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'chart-svg',
    });
    host.appendChild(svg);

    function xPx(n) { return PAD_L + (n / Math.max(1, N - 1)) * innerW; }
    function yPx(v) { return PAD_T + (1 - (v - yMin) / (yMax - yMin)) * innerH; }

    /* Background frame */
    const frame = el('rect', {
      class: 'chart-frame',
      x: PAD_L, y: PAD_T, width: innerW, height: innerH,
    });
    svg.appendChild(frame);

    /* Y gridlines at 0, 25, 50, 75, 100 */
    for (const v of [0, 25, 50, 75, 100]) {
      if (v < yMin || v > yMax) continue;
      const y = yPx(v);
      const line = el('line', { class: 'chart-grid', x1: PAD_L, x2: W - PAD_R, y1: y, y2: y });
      svg.appendChild(line);
      const lbl = el('text', { class: 'chart-axis-label', x: PAD_L - 6, y: y + 3, 'text-anchor': 'end' });
      lbl.textContent = String(v);
      svg.appendChild(lbl);
    }

    /* X axis end-tick label */
    const xEnd = el('text', {
      class: 'chart-axis-label',
      x: W - PAD_R, y: H - 6, 'text-anchor': 'end',
    });
    xEnd.textContent = `n = ${N}`;
    svg.appendChild(xEnd);
    const xStart = el('text', {
      class: 'chart-axis-label',
      x: PAD_L, y: H - 6, 'text-anchor': 'start',
    });
    xStart.textContent = '1';
    svg.appendChild(xStart);

    const traces = new Map();   // id -> { polyline, marker, klass }

    /* Add or replace a trace. id is a string, points is an array of (x, y).
       klass is a CSS class controlling stroke color + dash pattern. */
    function setTrace(id, points, klass) {
      const exist = traces.get(id);
      if (exist) exist.polyline.remove();
      if (exist && exist.marker) exist.marker.remove();

      const pts = points.map(p => `${xPx(p.x).toFixed(2)},${yPx(p.y).toFixed(2)}`).join(' ');
      const poly = el('polyline', { class: 'chart-trace ' + (klass || ''), points: pts });
      svg.appendChild(poly);

      let marker = null;
      if (points.length > 0) {
        const last = points[points.length - 1];
        marker = el('circle', {
          class: 'chart-trace-head ' + (klass || ''),
          cx: xPx(last.x), cy: yPx(last.y), r: 3,
        });
        svg.appendChild(marker);
      }
      traces.set(id, { polyline: poly, marker, klass });
    }

    function clear() {
      for (const [, v] of traces) {
        v.polyline.remove();
        if (v.marker) v.marker.remove();
      }
      traces.clear();
    }

    return { setTrace, clear, el: host, svg };
  }

  window.Chart = { mount };
})();
