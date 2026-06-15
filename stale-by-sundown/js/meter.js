/* meter.js -- the "DID A CUSTOMER BUY?" buy-meter, the visible dice.
 *
 *   A horizontal bar whose green fill IS the buy probability for the current
 *   (tier, lever): it visibly RISES when you DISCOUNT and SHRINKS as the tier
 *   ages. A little customer walks up and either BUYS (cha-ching, a coin pops)
 *   or SHRUGS and leaves (the batch ages a frame). The randomness is felt.
 *
 *   mount(host, opts) -> handle {
 *     setProb(p, label?)        // move the fill + needle to probability p (0..1)
 *     resolve(bought)           // animate buy / no-buy; returns a Promise
 *     setIdle()                 // neutral resting state
 *     host
 *   }
 *   Styles in css/meter.css. Theme-agnostic (uses --meter-* tokens). */
(function () {
  const T = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(host, opts) {
    const o = opts || {};
    host.classList.add('buymeter');
    host.innerHTML =
      '<div class="bm-head">' +
        '<span class="bm-title">' + (o.title || T('meter.title')) + '</span>' +
        '<span class="bm-pct tnum">--</span>' +
      '</div>' +
      '<div class="bm-track">' +
        '<span class="bm-fill"></span>' +
        '<span class="bm-needle"></span>' +
        '<span class="bm-customer" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="bm-foot"><span class="bm-result"></span></div>';

    const fill = host.querySelector('.bm-fill');
    const needle = host.querySelector('.bm-needle');
    const pct = host.querySelector('.bm-pct');
    const customer = host.querySelector('.bm-customer');
    const result = host.querySelector('.bm-result');
    let curP = 0;

    function setProb(p, label) {
      curP = Math.max(0, Math.min(1, p == null ? 0 : p));
      const w = (curP * 100).toFixed(0);
      fill.style.width = w + '%';
      needle.style.left = w + '%';
      pct.textContent = label != null ? label : (w + '%');
      result.textContent = '';
      host.classList.remove('bm-bought', 'bm-nobuy');
    }
    function setIdle() {
      fill.style.width = '0%'; needle.style.left = '0%'; pct.textContent = '--';
      result.textContent = ''; host.classList.remove('bm-bought', 'bm-nobuy');
    }

    function resolve(bought) {
      return new Promise((res) => {
        host.classList.remove('bm-bought', 'bm-nobuy');
        if (reduced()) {
          host.classList.add(bought ? 'bm-bought' : 'bm-nobuy');
          result.textContent = bought ? T('meter.bought') : T('meter.nobuy');
          if (window.SFX) window.SFX.play(bought ? 'chaching' : 'shrug');
          res(bought); return;
        }
        /* customer walks in */
        customer.classList.remove('bm-walk-in', 'bm-walk-out');
        void customer.offsetWidth;
        customer.classList.add('bm-walk-in');
        setTimeout(() => {
          host.classList.add(bought ? 'bm-bought' : 'bm-nobuy');
          result.textContent = bought ? T('meter.bought') : T('meter.nobuy');
          if (window.SFX) window.SFX.play(bought ? 'chaching' : 'shrug');
          if (bought) {
            const coin = document.createElement('span');
            coin.className = 'bm-coin';
            host.querySelector('.bm-track').appendChild(coin);
            setTimeout(() => { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 650);
          }
          customer.classList.remove('bm-walk-in');
          customer.classList.add('bm-walk-out');
          setTimeout(() => res(bought), 360);
        }, 420);
      });
    }

    setIdle();
    return { setProb, resolve, setIdle, host };
  }

  window.BuyMeter = { mount };
})();
