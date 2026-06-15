/* Multi-series SVG line chart for cumulative regret.

   Used by scene 3 (single greedy trace), scene 4 (greedy vs ε-greedy), and
   scene 5 (four pre-rendered median curves).

   X axis: round t (1 .. T).  Y axis: cumulative regret R(t) ≥ 0.
   Auto-scales y to the max value across all visible traces.

   Per-trace styling lives in CSS via classes, never inline. The accepted
   class set is enumerated in css/style.css under "Regret traces".

   Pure DOM + SVG. Theme-aware via the surrounding text color and per-class
   stroke variables. */

(function () {

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k of Object.keys(attrs)) node.setAttribute(k, attrs[k]);
    return node;
  }

  /* opts:
       host, DOM node to fill
       T, x-axis extent (round count)
       yMax, initial y-axis upper bound; auto-grown as traces are added
       label, caption above the chart                           */
  function mount(opts) {
    const host = opts.host;
    const T = opts.T;
    let yMax = (typeof opts.yMax === 'number' && opts.yMax > 0) ? opts.yMax : 1;
    const yMin = 0;

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
    const PAD_L = 44;
    const PAD_R = 16;
    const PAD_T = 12;
    const PAD_B = 28;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'chart-svg',
    });
    host.appendChild(svg);

    /* Frame */
    const frame = el('rect', {
      class: 'chart-frame',
      x: PAD_L, y: PAD_T, width: innerW, height: innerH,
    });
    svg.appendChild(frame);

    /* Static grid + axis-labels: rebuilt whenever yMax changes. */
    const gridLayer = el('g', { class: 'chart-grid-layer' });
    svg.appendChild(gridLayer);

    /* Trace layer (above grid). */
    const traceLayer = el('g', { class: 'chart-trace-layer' });
    svg.appendChild(traceLayer);

    function xPx(t) { return PAD_L + (Math.max(0, t) / Math.max(1, T)) * innerW; }
    function yPx(v) { return PAD_T + (1 - (v - yMin) / (yMax - yMin)) * innerH; }

    function rebuildAxes() {
      gridLayer.innerHTML = '';

      /* Y gridlines at 0, 25%, 50%, 75%, 100% of yMax, rounded to a "nice"
         number so labels read cleanly. */
      const tickStep = niceStep(yMax / 4);
      for (let v = 0; v <= yMax + 1e-9; v += tickStep) {
        const y = yPx(v);
        const line = el('line', { class: 'chart-grid', x1: PAD_L, x2: PAD_L + innerW, y1: y, y2: y });
        gridLayer.appendChild(line);
        const lbl = el('text', { class: 'chart-axis-label', x: PAD_L - 8, y: y + 3, 'text-anchor': 'end' });
        lbl.textContent = formatTick(v);
        gridLayer.appendChild(lbl);
      }

      /* X axis end-tick labels */
      const xStart = el('text', { class: 'chart-axis-label', x: PAD_L,           y: H - 8, 'text-anchor': 'start' });
      xStart.textContent = '0';
      gridLayer.appendChild(xStart);

      const xMid = el('text', { class: 'chart-axis-label', x: PAD_L + innerW/2, y: H - 8, 'text-anchor': 'middle' });
      xMid.textContent = `t = ${Math.round(T/2)}`;
      gridLayer.appendChild(xMid);

      const xEnd = el('text', { class: 'chart-axis-label', x: PAD_L + innerW,   y: H - 8, 'text-anchor': 'end' });
      xEnd.textContent = String(T);
      gridLayer.appendChild(xEnd);

      /* Y axis title (rotated) */
      const yTitle = el('text', {
        class: 'chart-axis-title',
        x: 12, y: PAD_T + innerH / 2,
        'text-anchor': 'middle',
        transform: `rotate(-90, 12, ${PAD_T + innerH / 2})`,
      });
      yTitle.textContent = 'cumulative regret';
      gridLayer.appendChild(yTitle);
    }

    function niceStep(raw) {
      if (raw <= 0) return 1;
      const exp = Math.floor(Math.log10(raw));
      const base = Math.pow(10, exp);
      const m = raw / base;
      let nice;
      if (m < 1.5) nice = 1;
      else if (m < 3.5) nice = 2;
      else if (m < 7.5) nice = 5;
      else nice = 10;
      return nice * base;
    }

    function formatTick(v) {
      if (v === 0) return '0';
      if (v >= 100) return v.toFixed(0);
      if (v >= 10)  return v.toFixed(0);
      if (v >= 1)   return v.toFixed(1);
      return v.toFixed(2);
    }

    rebuildAxes();

    /* id -> { polyline, klass, points, hover } */
    const traces = new Map();

    function autoYMax() {
      let max = 1;
      for (const [, v] of traces) {
        for (const p of v.points) if (p.y > max) max = p.y;
      }
      return Math.max(1, niceStep(max * 1.1));
    }

    function redrawAll() {
      for (const [, v] of traces) {
        const pts = v.points.map(p => `${xPx(p.x).toFixed(2)},${yPx(p.y).toFixed(2)}`).join(' ');
        v.polyline.setAttribute('points', pts);
      }
    }

    /* setTrace(id, points, klass), points = [{x,y}, ...].
       klass is one of the regret-series CSS classes (.regret-series-greedy,
       .regret-series-eps, etc). Caller must pre-validate the class against
       css/style.css. */
    function setTrace(id, points, klass) {
      let entry = traces.get(id);
      if (!entry) {
        const poly = el('polyline', { class: 'chart-trace ' + (klass || ''), points: '' });
        traceLayer.appendChild(poly);
        entry = { polyline: poly, klass, points: [] };
        traces.set(id, entry);
      }
      entry.points = points.slice();
      if (entry.klass !== klass) {
        entry.polyline.setAttribute('class', 'chart-trace ' + (klass || ''));
        entry.klass = klass;
      }

      const newMax = autoYMax();
      if (Math.abs(newMax - yMax) > 1e-9) {
        yMax = newMax;
        rebuildAxes();
      }
      redrawAll();
    }

    function removeTrace(id) {
      const entry = traces.get(id);
      if (!entry) return;
      entry.polyline.remove();
      traces.delete(id);
      const newMax = autoYMax();
      if (Math.abs(newMax - yMax) > 1e-9) {
        yMax = newMax;
        rebuildAxes();
      }
      redrawAll();
    }

    function clear() {
      for (const [, v] of traces) v.polyline.remove();
      traces.clear();
      yMax = (typeof opts.yMax === 'number' && opts.yMax > 0) ? opts.yMax : 1;
      rebuildAxes();
    }

    /* Highlight a trace by adding the .highlighted class and dimming others
       via a parent class. Used for hover/focus in scene 5. */
    function setHighlight(id) {
      for (const [k, v] of traces) {
        v.polyline.classList.toggle('highlighted', k === id);
      }
      svg.classList.toggle('has-highlight', id != null);
    }

    function clearHighlight() {
      for (const [, v] of traces) v.polyline.classList.remove('highlighted');
      svg.classList.remove('has-highlight');
    }

    return {
      setTrace,
      removeTrace,
      clear,
      setHighlight,
      clearHighlight,
      svg,
      host,
    };
  }

  window.Chart = { mount };
})();
