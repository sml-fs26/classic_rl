/* The ACCOUNT CARD: the recurring state-icon for Churn Rescue.
 *
 *   The state s = (tier, m) rendered as a single card: a company-logo
 *   glyph avatar, a 5-segment ENGAGEMENT BAR above it (green thriving to
 *   amber to red cliff, the same segmented idiom as the Pokemon HP bar),
 *   and a RENEWAL COUNTDOWN badge ("3 mo. to renewal"). Pure CSS /
 *   inline-SVG, no asset files. This card IS the state and appears
 *   identically in every scene so the learner builds one mental picture.
 *
 *   Colour is ALWAYS from CSS tokens (.eng-seg.tierK, .account-tier.tierK),
 *   never inline categorical colours, so light + CRT retint cleanly.
 *
 *   Two visual sizes:
 *     'full'  (default) : title / playtest / Q* hero card.
 *     'mini'  : the compact form embedded in each 5x5 retention-map cell
 *               (qtable.js mounts one per cell). No countdown text, just
 *               the bar + glyph; the cell's own header carries the month.
 *
 *   API:
 *     AccountCard.mount(host, { tier, m, size? }) -> {
 *       set({ tier, m })   re-render to a new state
 *       update(state)      alias for set (back-compat)
 *       tickTier(toTier)   animate the engagement bar one step toward toTier
 *                          (used by D6 after the engagement die lands)
 *       flashRenew()       gold renewal flash + a +20 confetti pop
 *       grey()             grey the card out (used by Coin on CHURN)
 *       ungrey()           restore from grey
 *       slideOff(onDone)   slide the greyed card off ("lost"); fires onDone
 *       state()            -> { tier, m }
 *       el()               -> the host element
 *     }
 *
 *   Animation contract with coin.js / d6.js: those modules own the COIN
 *   and DIE widgets; they call back into this card (grey / slideOff after a
 *   CHURN coin; tickTier after a STAY die; flashRenew on renewal) so the
 *   card stays the single source of truth for the engagement bar.
 */
(function () {
  const NUM_TIERS = (window.Churn && window.Churn.NUM_TIERS) || 5;
  const TIER_IDS = (window.Churn && window.Churn.TIERS) ||
    ['cliff', 'at-risk', 'lukewarm', 'healthy', 'thriving'];

  function T(key, vars) { return window.I18N ? window.I18N.t(key, vars) : key; }

  function tierLabel(tier, short) {
    const id = TIER_IDS[tier] || 'cliff';
    return T((short ? 'tier.short.' : 'tier.') + id);
  }
  function monthsLabel(m) {
    if (m <= 1) return T('months.imminent');
    return T('months.many', { n: m });
  }

  /* Inline-SVG "company logo" glyph: a stylised office block. currentColor
     so it inherits the card ink (and greys with the card on churn). */
  function logoGlyph(px) {
    const w = px || 32;
    return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" ' +
      'aria-hidden="true" class="account-glyph">' +
      '<rect x="4" y="6" width="16" height="14" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<rect x="7" y="9"  width="3" height="3" fill="currentColor"/>' +
      '<rect x="14" y="9" width="3" height="3" fill="currentColor"/>' +
      '<rect x="7" y="14" width="3" height="3" fill="currentColor"/>' +
      '<rect x="14" y="14" width="3" height="3" fill="currentColor"/>' +
      '<rect x="10" y="16" width="4" height="4" fill="currentColor"/></svg>';
  }

  function clampTier(t) { return t < 0 ? 0 : (t > NUM_TIERS - 1 ? NUM_TIERS - 1 : t); }

  function mount(host, state) {
    const size = (state && state.size) || 'full';
    host.classList.add('account-card');
    if (size === 'mini') host.classList.add('account-card-mini');

    let cur = { tier: (state && state.tier != null) ? state.tier : 2,
                m: (state && state.m != null) ? state.m : 4 };

    /* Static skeleton built once; paint() only repaints the bar + labels
       so tier-change transitions on .eng-seg land cleanly. */
    const bar = document.createElement('div');
    bar.className = 'account-engbar';
    bar.setAttribute('aria-label', 'engagement');
    const segs = [];
    for (let i = 0; i < NUM_TIERS; i++) {
      const seg = document.createElement('span');
      seg.className = 'eng-seg';
      bar.appendChild(seg);
      segs.push(seg);
    }

    const body = document.createElement('div');
    body.className = 'account-body';
    const avatar = document.createElement('span');
    avatar.className = 'account-avatar';
    avatar.innerHTML = logoGlyph(size === 'mini' ? 20 : 32);
    const tierEl = document.createElement('span');
    tierEl.className = 'account-tier';
    body.appendChild(avatar);
    body.appendChild(tierEl);

    host.innerHTML = '';
    host.appendChild(bar);
    host.appendChild(body);

    let countdownEl = null;
    if (size !== 'mini') {
      countdownEl = document.createElement('div');
      countdownEl.className = 'account-countdown';
      host.appendChild(countdownEl);
    }

    /* Paint the bar + labels for the current tier. Segment i is FILLED when
       i <= tier (tier 0 = 1 seg .. tier 4 = 5 segs); each filled segment is
       tinted by the CURRENT tier token (tier0 red .. tier4 green). */
    function paint() {
      const tier = clampTier(cur.tier);
      for (let i = 0; i < NUM_TIERS; i++) {
        const seg = segs[i];
        seg.className = 'eng-seg' + (i <= tier ? ' filled tier' + tier : '');
      }
      tierEl.className = 'account-tier tier' + tier;
      tierEl.textContent = tierLabel(tier, size === 'mini');
      if (countdownEl) countdownEl.textContent = monthsLabel(cur.m);
      host.dataset.tier = String(tier);
      host.dataset.m = String(cur.m);
    }
    paint();

    function set(s) {
      if (!s) return;
      if (s.tier != null) cur.tier = clampTier(s.tier);
      if (s.m != null) cur.m = s.m;
      paint();
    }

    /* Animate the engagement bar one step toward toTier (called by D6 once
       the engagement die resolves). Snaps cur.tier to toTier and lets the
       CSS .eng-seg transition do the visible tick; flashes the leading
       segment up/down for legibility in a still frame. */
    function tickTier(toTier) {
      const from = clampTier(cur.tier);
      const to = clampTier(toTier);
      cur.tier = to;
      paint();
      if (to === from) return;
      const dir = to > from ? 'tick-up' : 'tick-down';
      const lead = segs[Math.max(from, to)];
      if (lead) {
        lead.classList.remove('tick-up', 'tick-down');
        void lead.offsetWidth;
        lead.classList.add(dir);
        setTimeout(() => lead.classList.remove(dir), 600);
      }
    }

    function grey() { host.classList.add('account-churned'); }
    function ungrey() { host.classList.remove('account-churned', 'account-slideoff'); }

    function slideOff(onDone) {
      host.classList.add('account-churned');
      const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { if (onDone) onDone(); return; }
      host.classList.remove('account-slideoff');
      void host.offsetWidth;
      host.classList.add('account-slideoff');
      const done = () => {
        host.removeEventListener('animationend', done);
        if (onDone) onDone();
      };
      host.addEventListener('animationend', done);
    }

    function flashRenew() {
      const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      host.classList.remove('account-renew');
      void host.offsetWidth;
      host.classList.add('account-renew');
      setTimeout(() => host.classList.remove('account-renew'), 1100);
      if (!reduce) spawnConfetti(host);
      if (window.SFX) window.SFX.play('win');
    }

    /* +20 confetti pop: a handful of CSS pixel chips + a "+20" credit that
       float up. Colour from the lever-offer (gold) token so it reads as a
       win without an inline categorical colour. */
    function spawnConfetti(el) {
      const pop = document.createElement('div');
      pop.className = 'account-renew-pop';
      pop.textContent = '+' + ((window.Churn && window.Churn.RENEW_REWARD) || 20);
      el.appendChild(pop);
      const chips = document.createElement('div');
      chips.className = 'account-confetti';
      for (let i = 0; i < 8; i++) {
        const c = document.createElement('span');
        c.className = 'confetti-chip c' + (i % 4);
        c.style.setProperty('--cx', (10 + i * 10) + '%');
        c.style.setProperty('--cd', (i * 40) + 'ms');
        chips.appendChild(c);
      }
      el.appendChild(chips);
      setTimeout(() => { try { el.removeChild(pop); } catch (e) {} }, 1200);
      setTimeout(() => { try { el.removeChild(chips); } catch (e) {} }, 1200);
    }

    return {
      set,
      update: set,
      tickTier,
      grey, ungrey, slideOff, flashRenew,
      state: () => ({ tier: cur.tier, m: cur.m }),
      el: () => host,
    };
  }

  window.AccountCard = { mount, logoGlyph };
})();
