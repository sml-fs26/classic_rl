/* croissant.js, the recurring state-icon sprite, drawn as crisp pixel-art SVG
   (no image files, so it works offline from file://). One generator that ripens
   a croissant through five freshness frames:
     FRESH  golden, a steam wisp
     OK     golden, no steam
     AGING  matte tan
     OLD    pale, slightly flat
     STALE  grey-green tint, a tiny fly
   Colours resolve from the --tier-* CSS tokens via currentColor-style fills we
   set inline, so the CRT theme retints automatically (we read computed tokens).

   API:
     Croissant.svg(tier, opts) -> SVG string (a 16x16 pixel grid scaled up)
       opts.px   pixel size of one cell (default 4) -> sprite is 16*px wide
       opts.fly  force/suppress the STALE fly (default: on for STALE)
       opts.steam force/suppress the FRESH steam (default: on for FRESH)
     Croissant.tierColors(tier) -> { body, dark, light, bg }  (for chips/bars)

   The sprite is a stylised crescent: an outer crust, an inner shade, and a
   couple of highlight pixels. Each tier shifts the palette toward grey-green
   and (OLD/STALE) flattens the top row to read as "going flat". */
(function () {
  /* Per-tier palette. Kept legible at 4px/cell. */
  const PAL = {
    FRESH: { body: '#F2B544', dark: '#C8862A', light: '#FBE0A0', tint: null },
    OK:    { body: '#E6A23A', dark: '#B87822', light: '#F6D38C', tint: null },
    AGING: { body: '#C8923E', dark: '#9C6E28', light: '#E2C384', tint: null },
    OLD:   { body: '#BBA86E', dark: '#8E7C46', light: '#D8CDA0', tint: null },
    STALE: { body: '#9AA882', dark: '#6E7C58', light: '#C2CBAE', tint: '#7E8C66' },
  };

  /* 16x16 crescent mask. 0 = empty, 1 = body, 2 = dark crust edge, 3 = light
     highlight. A croissant crescent: fat curved horns, a thinner middle, baked
     diagonal score-lines (the 2s inside) reading as the rolled layers. Row 0 at
     the top. */
  const SHAPE = [
    '0000000000000000',
    '0000220000220000',
    '0002332002332000',
    '0023311223113200',
    '0233111111113320',
    '0231112112112320',
    '2331121121121332',
    '2311211211211132',
    '2311121121121132',
    '2331112112112332',
    '0233111111113320',
    '0023311111133200',
    '0002331111332000',
    '0000233223320000',
    '0000023223200000',
    '0000002002000000',
  ];
  /* OLD/STALE: flatten the top two crust rows a touch (read as "going flat"). */
  const FLAT_TOP = {
    OLD: 2, STALE: 3,   // number of top rows to clip
  };

  function colorFor(code, pal) {
    if (code === '1') return pal.body;
    if (code === '2') return pal.dark;
    if (code === '3') return pal.light;
    return null;
  }

  function svg(tier, opts) {
    const o = opts || {};
    const px = o.px || 4;
    const pal = PAL[tier] || PAL.FRESH;
    const clip = (tier === 'OLD' || tier === 'STALE') ? (FLAT_TOP[tier] || 0) : 0;
    const W = 16, H = 16;
    const vw = W * px, vh = H * px;
    let rects = '';
    for (let y = 0; y < H; y++) {
      if (y < clip + 1) continue;  // clip a couple of top crust rows for OLD/STALE
      const rowStr = SHAPE[y];
      for (let x = 0; x < W; x++) {
        const c = colorFor(rowStr[x], pal);
        if (!c) continue;
        rects += '<rect x="' + (x * px) + '" y="' + (y * px) + '" width="' + px + '" height="' + px + '" fill="' + c + '"/>';
      }
    }
    /* STALE: a tiny grey-green tint wash + a fly dot. */
    let extra = '';
    if (tier === 'STALE' && o.fly !== false) {
      const fx = 13 * px, fy = 3 * px;
      extra += '<rect x="' + fx + '" y="' + fy + '" width="' + Math.max(2, px) + '" height="' + Math.max(2, px) + '" fill="#2A2A2A"/>';
      extra += '<rect x="' + (fx - px) + '" y="' + (fy + px) + '" width="' + px + '" height="' + Math.max(1, Math.round(px / 2)) + '" fill="#2A2A2A"/>';
      extra += '<rect x="' + (fx + px) + '" y="' + (fy + px) + '" width="' + px + '" height="' + Math.max(1, Math.round(px / 2)) + '" fill="#2A2A2A"/>';
    }
    /* FRESH: a soft steam wisp above. */
    let steam = '';
    if (tier === 'FRESH' && o.steam !== false) {
      steam =
        '<g class="croissant-steam" opacity="0.65">' +
        '<rect x="' + (6 * px) + '" y="0" width="' + Math.max(1, Math.round(px / 2)) + '" height="' + px + '" fill="#E8E8E8"/>' +
        '<rect x="' + (9 * px) + '" y="0" width="' + Math.max(1, Math.round(px / 2)) + '" height="' + px + '" fill="#E8E8E8"/>' +
        '</g>';
    }
    return '<svg class="croissant-svg croissant-' + tier.toLowerCase() + '" width="' + vw + '" height="' + vh +
      '" viewBox="0 0 ' + vw + ' ' + vh + '" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">' +
      steam + rects + extra + '</svg>';
  }

  function tierColors(tier) {
    const pal = PAL[tier] || PAL.FRESH;
    return { body: pal.body, dark: pal.dark, light: pal.light };
  }

  window.Croissant = { svg, tierColors, PAL };
})();
