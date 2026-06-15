/* ===================================================================== *
 *  CLASSIC RL : authentic 80s arcade attract-mode engine.
 *
 *  WHAT THIS IS
 *  ------------
 *  The whole SCENE (starfield, pixel frame, color-cycling logo, high-score
 *  list, marquee, sprites, prompts) is drawn on a 320x240 backbuffer canvas
 *  with ctx.imageSmoothingEnabled=false, then integer-scaled up to the
 *  viewport with image-rendering:pixelated and the leftover space letter-
 *  boxed in black.  A requestAnimationFrame loop drives it and ALL motion
 *  is quantized to an integer frame counter (chunky, stepped) rather than
 *  CSS easing.  Flat palette fills only; shading/glow is DITHERED (Bayer
 *  4x4 / checkerboard of two palette colours).
 *
 *  CRISP NAMES (the "BALANCED" requirement)
 *  ----------------------------------------
 *  The low-res scene would make long game names mushy, so the SELECTABLE
 *  game names are NOT drawn on the canvas.  The canvas paints everything
 *  else for each list row (number, sprite chip, the bright selection bar,
 *  the blinking cursor).  A DOM overlay (#names) is positioned pixel-exactly
 *  over the canvas rows and renders the names in Press Start 2P at full
 *  device resolution: sharp, high-contrast names floating over the chunky
 *  scene.  The overlay also carries the click/tap targets for the rows.
 *
 *  CONTENT comes entirely from cartridges.js (window.GAMES / SPRITES / PX /
 *  SPR / EXTRA / VIEWS); this file is chrome + engine only.
 * ===================================================================== */
(function(){
'use strict';

/* registry (single source of truth, loaded by cartridges.js) */
const GAMES   = window.GAMES,
      SPR     = window.SPR,
      PX      = window.PX,
      SPRITES = window.SPRITES,
      EXTRA   = window.EXTRA,
      VIEWS   = window.VIEWS;

/* ===================================================================== *
 *  FIXED LIMITED PALETTE  (~16 flat colours, NES/Pac-Man-ish).
 *  Index it everywhere; flat fills only.  PAL is mutated by the THEME
 *  switcher; LOGO_RAMP is rotated by the logo color-cycler.
 * ===================================================================== */
const PAL = {
  black:'#0a0a18', dark:'#10103a', navy:'#1b1b6b', blue:'#3a7bff',
  cyan:'#5ad0ff', white:'#f6f8ff', grey:'#9aa0c8', dgrey:'#4a4f80',
  red:'#ff4d5e', dred:'#b01030', orange:'#ff9a3c', yellow:'#ffd23f',
  green:'#6be24a', dgreen:'#1f9a52', pink:'#ff7ad9', purple:'#b06bff'
};
/* the 6-colour ramp the logo cycles through (the iconic shimmer) */
const LOGO_RAMP = [PAL.red, PAL.orange, PAL.yellow, PAL.green, PAL.cyan, PAL.pink];

/* ===================================================================== *
 *  BACKBUFFER  320x240, integer-scaled into #glass; #names overlay synced
 * ===================================================================== */
const VW = 320, VH = 240;
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d', { alpha:false });
canvas.width = VW; canvas.height = VH;
ctx.imageSmoothingEnabled = false;

const cabinet = document.getElementById('cabinet');
const glass   = document.getElementById('glass');
const namesEl = document.getElementById('names');
const padEl   = document.getElementById('pad');   // touch scroll controls (▲/▼)

let SCALE = 3;                 // scene scale factor (recomputed on resize)
function layout(){
  const cw = cabinet.clientWidth, ch = cabinet.clientHeight;
  const fit = Math.min(cw / VW, ch / VH);
  // Desktop: INTEGER scale so the backbuffer pixels stay perfectly square &
  // crisp.  Phones (where even 2x overflows the width): allow a FRACTIONAL
  // scale so the canvas SCALES DOWN to fit the phone (image-rendering:
  // pixelated still keeps the pixels hard-edged, just not perfectly square).
  SCALE = (fit >= 2) ? Math.floor(fit) : Math.max(0.5, fit);
  const w = Math.round(VW * SCALE), h = Math.round(VH * SCALE);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  glass.style.width = w + 'px';
  glass.style.height = h + 'px';
  syncNames();                 // overlay rows follow the new scale
}
addEventListener('resize', layout, { passive:true });

/* ===================================================================== *
 *  reduced motion : one flag gates color-cycling, starfield scroll,
 *  curvature, flicker (CSS) and attract auto-motion, leaving a static,
 *  readable screen.
 * ===================================================================== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce) document.body.classList.add('curve');   // mild barrel curvature

/* ===================================================================== *
 *  SPRITES : reuse window.SPRITES, drawn into the canvas via PX[] palette.
 *  Pre-bake each sprite to a tiny offscreen canvas (1px == 1 cell) so the
 *  rAF loop just drawImage()s it (and it scales cleanly with the backbuffer).
 * ===================================================================== */
const spriteCache = {};
function bakeSprite(id){
  if(spriteCache[id]) return spriteCache[id];
  const g = SPRITES[id]; if(!g){ return null; }
  const w = Math.max.apply(null, g.map(r=>r.length)), h = g.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  for(let yy=0; yy<h; yy++){
    const row = g[yy];
    for(let xx=0; xx<row.length; xx++){
      const col = PX[row[xx]];
      if(col){ x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }
    }
  }
  spriteCache[id] = { c, w, h };
  return spriteCache[id];
}
/* draw a baked sprite into box (bx,by,bw,bh), letterboxed to keep aspect,
   nearest-neighbour so it stays pixel-chunky. */
function drawSprite(id, bx, by, bw, bh){
  const s = bakeSprite(id); if(!s) return;
  const k = Math.max(1, Math.floor(Math.min(bw / s.w, bh / s.h)));
  const dw = s.w * k, dh = s.h * k;
  const dx = bx + ((bw - dw) >> 1), dy = by + ((bh - dh) >> 1);
  ctx.drawImage(s.c, 0, 0, s.w, s.h, dx, dy, dw, dh);
}

/* ===================================================================== *
 *  DITHERING  (Bayer 4x4) : flat-palette shading without gradients/alpha.
 * ===================================================================== */
const BAYER = [ 0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5 ];
/* fill a rect with a dithered mix of two palette colours; lvl 0..16 sets
   how much of colB shows (0 = all colA). */
function dither(x, y, w, h, colA, colB, lvl){
  for(let j=0; j<h; j++){
    for(let i=0; i<w; i++){
      const t = BAYER[((j & 3) << 2) | (i & 3)];
      ctx.fillStyle = (t < lvl) ? colB : colA;
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}
/* a vertical dithered ramp (top colA to bottom colB), used for the sky glow */
function ditherVRamp(x, y, w, h, colA, colB){
  for(let j=0; j<h; j++){
    const lvl = Math.round((j / Math.max(1, h - 1)) * 16);
    for(let i=0; i<w; i++){
      const t = BAYER[((j & 3) << 2) | (i & 3)];
      ctx.fillStyle = (t < lvl) ? colB : colA;
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}

/* ===================================================================== *
 *  STARFIELD : 3 parallax layers of single-pixel stars, stepped scroll.
 * ===================================================================== */
function mkStars(n, seed){
  let s = seed; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const a = [];
  for(let i=0;i<n;i++) a.push({ x: Math.floor(rnd()*VW), y: Math.floor(rnd()*VH), p: rnd() });
  return a;
}
const LAYERS = [
  { stars: mkStars(34, 7),   col: PAL.dgrey, spd: 1 },   // far / dim / slow
  { stars: mkStars(24, 99),  col: PAL.grey,  spd: 2 },   // mid
  { stars: mkStars(14, 555), col: PAL.white, spd: 3 }    // near / bright / fast
];
function drawStarfield(f){
  for(const L of LAYERS){
    const off = reduce ? 0 : Math.floor(f / 4) * L.spd;   // stepped, chunky
    ctx.fillStyle = L.col;
    for(const st of L.stars){
      // twinkle the bright layer with the frame counter (no alpha; on/off)
      if(L.spd === 3 && ((f >> 3) + (st.x + st.y)) % 7 === 0) continue;
      const x = st.x;
      const y = (st.y + off) % VH;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/* ===================================================================== *
 *  PIXEL FRAME : chunky 8px border, corner + edge tiles, hard corners.
 *  Drawn procedurally from the palette (a double bevel + stud accents).
 * ===================================================================== */
const FB = 8;                              // frame thickness
function drawFrame(f){
  // outer fill rim
  ctx.fillStyle = PAL.navy;
  ctx.fillRect(0,0,VW,FB); ctx.fillRect(0,VH-FB,VW,FB);
  ctx.fillRect(0,0,FB,VH); ctx.fillRect(VW-FB,0,FB,VH);
  // inner bevel highlight (1px) + shadow (1px) for a moulded look
  ctx.fillStyle = PAL.blue;
  ctx.fillRect(FB-2, FB-2, VW-2*(FB-2), 1);
  ctx.fillRect(FB-2, FB-2, 1, VH-2*(FB-2));
  ctx.fillStyle = PAL.dark;
  ctx.fillRect(FB-2, VH-FB+1, VW-2*(FB-2), 1);
  ctx.fillRect(VW-FB+1, FB-2, 1, VH-2*(FB-2));
  // outer edge line
  ctx.fillStyle = PAL.cyan;
  ctx.fillRect(0,0,VW,1); ctx.fillRect(0,VH-1,VW,1);
  ctx.fillRect(0,0,1,VH); ctx.fillRect(VW-1,0,1,VH);
  // corner studs (hard squares), colour rotates slowly for life
  const cc = LOGO_RAMP[(f>>4) % LOGO_RAMP.length];
  const stud = (x,y)=>{ ctx.fillStyle=cc; ctx.fillRect(x,y,3,3);
                        ctx.fillStyle=PAL.white; ctx.fillRect(x+1,y+1,1,1); };
  stud(2,2); stud(VW-5,2); stud(2,VH-5); stud(VW-5,VH-5);
  // mid-edge studs
  ctx.fillStyle = PAL.blue;
  ctx.fillRect((VW>>1)-1, 2, 3, 3); ctx.fillRect((VW>>1)-1, VH-5, 3, 3);
}

/* ===================================================================== *
 *  5x7 BITMAP FONT  (canvas text we want crisp but is not a game name:
 *  badge, info blurb, prompts, marquee).  Press Start 2P is reserved for
 *  the DOM name overlay; in-canvas text uses this hand-pixel font so it
 *  snaps to the backbuffer grid perfectly.
 * ===================================================================== */
const GLYPHS = {
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'B':["11110","10001","10001","11110","10001","10001","11110"],
  'C':["01110","10001","10000","10000","10000","10001","01110"],
  'D':["11100","10010","10001","10001","10001","10010","11100"],
  'E':["11111","10000","10000","11110","10000","10000","11111"],
  'F':["11111","10000","10000","11110","10000","10000","10000"],
  'G':["01110","10001","10000","10111","10001","10001","01111"],
  'H':["10001","10001","10001","11111","10001","10001","10001"],
  'I':["01110","00100","00100","00100","00100","00100","01110"],
  'J':["00111","00010","00010","00010","00010","10010","01100"],
  'K':["10001","10010","10100","11000","10100","10010","10001"],
  'L':["10000","10000","10000","10000","10000","10000","11111"],
  'M':["10001","11011","10101","10101","10001","10001","10001"],
  'N':["10001","11001","10101","10011","10001","10001","10001"],
  'O':["01110","10001","10001","10001","10001","10001","01110"],
  'P':["11110","10001","10001","11110","10000","10000","10000"],
  'Q':["01110","10001","10001","10001","10101","10010","01101"],
  'R':["11110","10001","10001","11110","10100","10010","10001"],
  'S':["01111","10000","10000","01110","00001","00001","11110"],
  'T':["11111","00100","00100","00100","00100","00100","00100"],
  'U':["10001","10001","10001","10001","10001","10001","01110"],
  'V':["10001","10001","10001","10001","10001","01010","00100"],
  'W':["10001","10001","10001","10101","10101","11011","10001"],
  'X':["10001","10001","01010","00100","01010","10001","10001"],
  'Y':["10001","10001","01010","00100","00100","00100","00100"],
  'Z':["11111","00001","00010","00100","01000","10000","11111"],
  '0':["01110","10011","10101","10101","10101","11001","01110"],
  '1':["00100","01100","00100","00100","00100","00100","01110"],
  '2':["01110","10001","00001","00110","01000","10000","11111"],
  '3':["11110","00001","00001","01110","00001","00001","11110"],
  '4':["00010","00110","01010","10010","11111","00010","00010"],
  '5':["11111","10000","11110","00001","00001","10001","01110"],
  '6':["00110","01000","10000","11110","10001","10001","01110"],
  '7':["11111","00001","00010","00100","01000","01000","01000"],
  '8':["01110","10001","10001","01110","10001","10001","01110"],
  '9':["01110","10001","10001","01111","00001","00010","01100"],
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
  '.':["00000","00000","00000","00000","00000","01100","01100"],
  ',':["00000","00000","00000","00000","01100","01100","01000"],
  ':':["00000","01100","01100","00000","01100","01100","00000"],
  '-':["00000","00000","00000","11111","00000","00000","00000"],
  '+':["00000","00100","00100","11111","00100","00100","00000"],
  '!':["00100","00100","00100","00100","00100","00000","00100"],
  '?':["01110","10001","00001","00110","00100","00000","00100"],
  '/':["00001","00010","00010","00100","01000","01000","10000"],
  '*':["00000","10101","01110","11111","01110","10101","00000"],
  '(':["00010","00100","01000","01000","01000","00100","00010"],
  ')':["01000","00100","00010","00010","00010","00100","01000"],
  '=':["00000","00000","11111","00000","11111","00000","00000"],
  '·':["00000","00000","00000","01100","01100","00000","00000"], // middot
  '↑':["00100","01110","10101","00100","00100","00100","00100"], // up
  '↓':["00100","00100","00100","00100","10101","01110","00100"], // down
  '©':["01110","10001","10110","10100","10110","10001","01110"], // (c)
  '★':["00100","00100","01110","11111","01110","01010","10001"], // star
  '▶':["10000","11000","11100","11110","11100","11000","10000"]  // play
};
const GW = 5, GH = 7;
function glyph(ch){ return GLYPHS[ch] || GLYPHS['?']; }
function textWidth(s, sp){ sp = sp==null?1:sp; return s.length*(GW+sp) - sp; }
/* draw text at scale sc, char spacing sp px (in backbuffer px) */
function text(s, x, y, col, sc, sp){
  sc = sc||1; sp = sp==null?1:sp;
  ctx.fillStyle = col;
  let cx = x;
  for(const ch of s){
    const g = glyph(ch.length===1 ? ch.toUpperCase() : ch);
    for(let r=0;r<GH;r++){
      const row = g[r];
      for(let c=0;c<GW;c++){
        if(row[c]==='1') ctx.fillRect(cx + c*sc, y + r*sc, sc, sc);
      }
    }
    cx += (GW + sp) * sc;
  }
  return cx;                          // x after the string
}
function textCenter(s, cx, y, col, sc, sp){
  sc = sc||1; sp = sp==null?1:sp;
  const w = textWidth(s, sp) * sc;
  return text(s, Math.round(cx - w/2), y, col, sc, sp);
}

/* ===================================================================== *
 *  BLOCKY "CLASSIC RL" LOGO  (color-cycling).  Built from the 5x7 font at
 *  a big scale, but each letter is tinted from LOGO_RAMP with an offset
 *  that rotates every few frames, giving the rainbow shimmer.  A 1px dark
 *  drop gives it body without a blur.
 * ===================================================================== */
function drawLogo(f){
  const word = 'CLASSIC RL';
  const sc = 4, sp = 1;
  const w = textWidth(word, sp) * sc;
  const x0 = Math.round(VW/2 - w/2);
  const y0 = 15;
  const rot = reduce ? 0 : (f >> 1);    // palette-rotation speed
  let cx = x0;
  for(let li=0; li<word.length; li++){
    const ch = word[li];
    const g = glyph(ch.toUpperCase());
    const col = (ch===' ') ? null : LOGO_RAMP[(li + rot) % LOGO_RAMP.length];
    if(col){
      // 1px hard drop-shadow (dark navy), then the letter
      for(let pass=0; pass<2; pass++){
        ctx.fillStyle = pass===0 ? PAL.black : col;
        const off = pass===0 ? sc : 0;
        for(let r=0;r<GH;r++){ const row=g[r];
          for(let c=0;c<GW;c++){ if(row[c]==='1')
            ctx.fillRect(cx + c*sc + off, y0 + r*sc + off, sc, sc); } }
      }
    }
    cx += (GW + sp) * sc;
  }
  // flanking blinking stars
  if(reduce || ((f>>4)&1)){
    const sy = y0 + 6;
    textCenter('★', x0 - 14, sy, PAL.yellow, 2, 1);
    textCenter('★', x0 + w + 14, sy, PAL.yellow, 2, 1);
  }
}

/* ===================================================================== *
 *  VIEW STATE  (main menu / EXTRA bundle) : ported from the original.
 * ===================================================================== */
let view = 'main';
function curList(){ return VIEWS[view]; }
let sel = 0;
let booted = false;

/* save file: which carts have been opened (drives a star on played games) */
let visited = {};
try{ visited = JSON.parse(localStorage.getItem('classicrl_visited') || '{}'); }catch(e){}

/* query params */
const qs = new URLSearchParams(location.search);
const skipIntro = (qs.get('boot') === '0');
const startSel  = parseInt(qs.get('i'), 10);
const demoParam = (qs.get('demo') === '1');
const phaseParam = parseInt(qs.get('phase'), 10);   // QA: force an attract phase
if(qs.get('view') === 'extra'){ view = 'extra'; sel = 0; }
if(!isNaN(startSel)) sel = Math.max(0, Math.min(curList().length - 1, startSel));

/* ===================================================================== *
 *  LIST GEOMETRY  : a fixed viewport of VISROWS rows; the selected row is
 *  kept in view (mirrors the original scrollIntoView).  The canvas paints
 *  the row backgrounds / number / chip / cursor; #names paints the names.
 * ===================================================================== */
const LIST_TOP = 70;          // backbuffer y where the list viewport starts
const ROW_H    = 11;          // backbuffer px per row
const VISROWS  = 10;          // visible rows in the viewport (fits 9 headliners + EXTRA)
const LIST_X   = 16;          // left of the list area
const LIST_W   = VW - 32;     // width of the list area
const NUM_X    = LIST_X + 4;  // row number
const CHIP_X   = LIST_X + 24; // sprite chip
const CHIP_W   = 10;          // chip box (backbuffer px)
const NAME_X   = LIST_X + 42; // where the (DOM) name starts
const NAME_W   = LIST_W - 46; // name column width (backbuffer px)
let scroll = 0;               // first visible row index

function clampScroll(){
  const n = curList().length;
  if(n <= VISROWS){ scroll = 0; return; }
  if(sel < scroll) scroll = sel;
  else if(sel >= scroll + VISROWS) scroll = sel - VISROWS + 1;
  scroll = Math.max(0, Math.min(scroll, n - VISROWS));
}

/* the DOM name overlay : rebuilt on view change, positioned on every
   layout()/scroll change so names sit exactly over the canvas rows */
function buildNames(){
  namesEl.innerHTML = '';
  curList().forEach((g, i) => {
    const r = document.createElement('div');
    r.className = 'nrow' + (g.isBundle ? ' bundle' : '');
    r.dataset.i = i;
    const t = document.createElement('span');
    t.className = 'ntxt';
    t.textContent = g.name;
    r.appendChild(t);
    // click/tap a row -> select; tap again -> boot (ported behaviour)
    r.addEventListener('click', () => {
      if(tMoved) return;                 // ignore the tap that ended a scroll-drag
      if(i === sel){ boot(); }
      else { sel = i; clampScroll(); blip(); resetIdle(); }
    });
    namesEl.appendChild(r);
  });
  updatePad();
  syncNames();
}
function syncNames(){
  const rows = namesEl.children;
  for(let i=0;i<rows.length;i++){
    const r = rows[i];
    const vis = (i >= scroll && i < scroll + VISROWS);
    r.style.display = vis ? 'flex' : 'none';
    if(!vis) continue;
    const rowY = LIST_TOP + (i - scroll) * ROW_H;
    r.style.left   = (NAME_X * SCALE) + 'px';
    r.style.top    = (rowY * SCALE) + 'px';
    r.style.width  = (NAME_W * SCALE) + 'px';
    r.style.height = (ROW_H * SCALE) + 'px';
    // font size keyed to the row so it fills the bar but never clips height
    const fs = Math.max(7, Math.round(ROW_H * SCALE * 0.46));
    const tx = r.firstChild;
    tx.style.fontSize = fs + 'px';
    tx.style.lineHeight = (ROW_H * SCALE) + 'px';
    r.classList.toggle('sel', i === sel);
  }
}

/* ===================================================================== *
 *  DRAW THE LIST  (canvas side: bg bars, number, chip, cursor)
 * ===================================================================== */
function drawList(f){
  const list = curList();
  clampScroll();
  // panel backing under the list (dithered dark slab for a CRT "screen")
  dither(LIST_X-2, LIST_TOP-2, LIST_W+4, VISROWS*ROW_H+4, PAL.black, PAL.dark, 3);
  // top/bottom rules
  ctx.fillStyle = PAL.dgrey;
  ctx.fillRect(LIST_X-2, LIST_TOP-3, LIST_W+4, 1);
  ctx.fillRect(LIST_X-2, LIST_TOP + VISROWS*ROW_H + 1, LIST_W+4, 1);

  for(let vi=0; vi<VISROWS; vi++){
    const i = scroll + vi;
    if(i >= list.length) break;
    const g = list[i];
    const y = LIST_TOP + vi * ROW_H;
    const isSel = (i === sel);

    if(isSel){
      // inverse-video bright bar in the cartridge accent (flat fill)
      const bar = g.acc || PAL.cyan;
      ctx.fillStyle = bar;
      ctx.fillRect(LIST_X-2, y, LIST_W+4, ROW_H-1);
      // a 1px top dither edge so the bar reads as a lit cell
      dither(LIST_X-2, y, LIST_W+4, 1, bar, PAL.white, 8);
    } else if((i & 1) === 0){
      // faint zebra on even rows (dithered, not alpha)
      dither(LIST_X-2, y, LIST_W+4, ROW_H-1, PAL.black, PAL.dark, 2);
    }

    const ink = isSel ? PAL.black : PAL.grey;

    // blinking cursor on the selected row (frame-counter blink, not fade)
    if(isSel){
      const on = reduce ? true : (((f >> 3) & 1) === 0);
      if(on){ textCenter('▶', LIST_X + 1, y + 5, PAL.black, 1, 0); }
    }

    // row number (EX for the bundle)
    const no = g.isBundle ? 'EX' : String(i + 1).padStart(2, '0');
    text(no, NUM_X, y + 5, ink, 1, 1);

    // sprite chip (small framed icon)
    const cx = CHIP_X, cy = y + ((ROW_H - CHIP_W) >> 1);
    ctx.fillStyle = isSel ? PAL.black : PAL.dark;
    ctx.fillRect(cx-1, cy-1, CHIP_W+2, CHIP_W+2);
    drawSprite(g.spr, cx, cy, CHIP_W, CHIP_W);

    // played-marker star at the right edge (canvas; the name is DOM)
    const done = g.href && visited[g.href];
    if(done){ textCenter('★', LIST_X + LIST_W - 6, y + 5, isSel?PAL.black:PAL.yellow, 1, 0); }
    // the "+N" / RL / BIZ tag, right-aligned just left of the star
    const tag = g.tag || '';
    if(tag){
      const tw = textWidth(tag, 1);
      text(tag, LIST_X + LIST_W - (done?14:6) - tw, y + 6, isSel?PAL.black:PAL.dgrey, 1, 1);
    }
  }

  // scroll arrows when the list overflows the viewport
  if(list.length > VISROWS){
    const cx = LIST_X + LIST_W - 4;
    if(scroll > 0 && (reduce || (f>>3)&1))
      textCenter('↑', cx, LIST_TOP - 1, PAL.cyan, 1, 0);
    if(scroll + VISROWS < list.length && (reduce || (f>>3)&1))
      textCenter('↓', cx, LIST_TOP + VISROWS*ROW_H - 5, PAL.cyan, 1, 0);
  }
}

/* ===================================================================== *
 *  INFO STRIP  (canvas) : describes the highlighted cartridge.  Word-wrap
 *  the blurb into the small 5x7 font (uppercased so it stays crisp).
 * ===================================================================== */
const INFO_TOP = LIST_TOP + VISROWS*ROW_H + 6;   // y of the info slab
function wrap(words, maxChars){
  const out = []; let line = '';
  for(const w of words){
    if((line + (line?' ':'') + w).length > maxChars){ if(line) out.push(line); line = w; }
    else line += (line?' ':'') + w;
  }
  if(line) out.push(line);
  return out;
}
function drawInfo(){
  const g = curList()[sel]; if(!g) return;
  const x = LIST_X, w = LIST_W, y = INFO_TOP;
  const acc = g.acc || PAL.cyan;
  // accent bar + dark slab
  ctx.fillStyle = acc; ctx.fillRect(x, y, 2, 22);
  dither(x+3, y, w-3, 22, PAL.black, PAL.dark, 2);
  // label line
  const label = g.isBundle ? ('EXTRA · ' + VIEWS.extra.length + ' BONUS')
                           : ('NO.' + String(sel+1).padStart(2,'0') + ' · ' + g.name);
  text(label.slice(0, 40), x+6, y+2, acc, 1, 1);
  // blurb (2 lines max, uppercase)
  const lines = wrap((g.blurb||'').toUpperCase().split(/\s+/), 44).slice(0, 2);
  lines.forEach((ln, i) => text(ln, x+6, y+11 + i*8, PAL.white, 1, 1));
}

/* ===================================================================== *
 *  MARQUEE  (bottom) : looping ticker, stepped 1px/frame.
 * ===================================================================== */
function marqueeText(){
  return '© 1986 SML · ETH ZURICH · ' + GAMES.length +
         ' GAMES · INSERT COIN · ↑↓ SELECT · ' +
         (view==='extra' ? 'ESC BACK · ' : '') + 'PUSH START · ';
}
let marqOff = 0;
function drawMarquee(f){
  // sit the ticker strip just ABOVE the bottom frame border so the frame
  // (drawn last, on top) never clips its text.
  const y = VH - FB - 8;            // text baseline
  ctx.fillStyle = PAL.dark; ctx.fillRect(FB, y-1, VW-2*FB, 9);
  ctx.fillStyle = PAL.navy; ctx.fillRect(FB, y-1, VW-2*FB, 1);
  const s = marqueeText();
  const oneW = textWidth(s, 1);
  if(!reduce) marqOff = (marqOff + 1) % oneW; else marqOff = 0;
  // clip to the inner area, tile the string so it wraps seamlessly
  ctx.save();
  ctx.beginPath(); ctx.rect(FB+1, y-1, VW-2*FB-2, 9); ctx.clip();
  let x = FB + 1 - marqOff;
  while(x < VW - FB){ x = text(s, x, y, PAL.cyan, 1, 1); }
  ctx.restore();
}

/* ===================================================================== *
 *  BADGE + CREDIT/INSERT-COIN + PUSH START prompt (canvas)
 * ===================================================================== */
function drawBadge(f){
  const txt = (view==='extra') ? ('EXTRA ' + VIEWS.extra.length)
                               : (GAMES.length + ' IN 1');
  const w = textWidth(txt, 1) + 8;
  const x = Math.round(VW/2 - w/2), y = 54;
  ctx.fillStyle = PAL.yellow; ctx.fillRect(x, y, w, 11);
  ctx.fillStyle = PAL.black;  ctx.fillRect(x+1, y+1, w-2, 9);
  textCenter(txt, VW/2, y+2, PAL.yellow, 1, 1);
  // sub-title line under the badge
  const sub = (view==='extra') ? '▶ EXTRA GAMES'
                               : 'SML · REINFORCEMENT LEARNING';
  textCenter(sub, VW/2, y+13, PAL.grey, 1, 1);
}
function drawPrompts(f){
  const py = VH - 27;          // sits above the raised marquee strip
  // CREDIT line (left), shows DEMO tag in attract
  const credit = 'CREDIT 00' + (attract ? '   DEMO' : '');
  text(credit, FB+3, py, PAL.grey, 1, 1);
  // INSERT COIN (centre) hard-blink
  if(reduce || ((f>>4)&1)){
    textCenter('INSERT COIN', VW/2, py, PAL.yellow, 1, 1);
  }
  // PUSH START (right) hard-blink
  const on = reduce || (((f>>4)&1)===0);
  const ps = '▶PUSH START';
  const pw = textWidth(ps, 1);
  const px = VW - FB - 3 - pw;
  if(on){ text(ps, px, py, PAL.red, 1, 1); }
}

/* ===================================================================== *
 *  ATTRACT LOOP  : after ~20s idle cycle title <-> hi-score <-> demo walk
 *  <-> insert-coin.  Any input returns to the menu.
 * ===================================================================== */
let attract = false;
let attractPhase = 0;      // 0 title, 1 hiscore, 2 demo, 3 insert-coin
let attractClock = 0;      // frames in the current phase
const ATTRACT_PHASES = 4;
const PHASE_FRAMES = 260;  // ~4.3s per phase at 60fps
const demoDog = { x:-30 };
let demoSelClock = 0;

function drawHiScore(){
  textCenter('HIGH SCORES', VW/2, 68, LOGO_RAMP[(frame>>3)%LOGO_RAMP.length], 2, 1);
  const rows = [
    ['1ST','DQN','999999'],
    ['2ND','PPO','875200'],
    ['3RD','SAC','640100'],
    ['4TH','TD0','512750'],
    ['5TH','MC','310400']
  ];
  rows.forEach((r,i)=>{
    const y = 98 + i*16;
    text(r[0], 72, y, PAL.yellow, 1, 1);
    text(r[1], 124, y, PAL.cyan, 1, 1);
    const sw = textWidth(r[2],1);
    text(r[2], 248 - sw, y, PAL.white, 1, 1);
  });
  textCenter('CREATED BY SML · ETH ZURICH', VW/2, 196, PAL.grey, 1, 1);
}
function drawDemo(f){
  textCenter('DEMO', VW/2, 66, PAL.red, 2, 1);
  textCenter('WATCH THE AGENT LEARN', VW/2, 90, PAL.grey, 1, 1);
  if(!reduce){ demoDog.x += 1; if(demoDog.x > VW + 30) demoDog.x = -40; }
  const bob = (!reduce && ((f>>3)&1)) ? -2 : 0;       // 2-frame stepped bob
  const dy = 148 + bob;
  drawSprite('dog', Math.round(demoDog.x), dy, 52, 30);
  // a couple of grid cells lighting up to suggest "learning"
  for(let c=0;c<5;c++){
    const lit = ((f>>4)+c)%5 === 0;
    ctx.fillStyle = PAL.dark;  ctx.fillRect(60 + c*40, 118, 30, 14);
    ctx.fillStyle = PAL.black; ctx.fillRect(61 + c*40, 119, 28, 12);
    if(lit){ ctx.fillStyle = PAL.green; ctx.fillRect(63 + c*40, 121, 24, 8); }
  }
  textCenter('PRESS START TO PLAY', VW/2, 196, (reduce||((f>>4)&1))?PAL.yellow:PAL.black, 1, 1);
}
function drawInsertCoin(f){
  textCenter('GAME OVER', VW/2, 86, PAL.red, 2, 1);
  if(reduce || ((f>>3)&1)){
    textCenter('INSERT COIN', VW/2, 128, PAL.yellow, 2, 1);
  }
  textCenter('1 COIN  1 PLAY', VW/2, 158, PAL.grey, 1, 1);
  textCenter('PUSH START', VW/2, 196, PAL.white, 1, 1);
}

function enterAttract(){
  if(reduce || !booted || view !== 'main') return;
  attract = true; attractPhase = 0; attractClock = 0;
  demoDog.x = -30;
  namesEl.style.visibility = 'hidden';   // attract hides the live menu names
}
function exitAttract(){
  if(!attract) return;
  attract = false;
  namesEl.style.visibility = 'visible';
  syncNames();
}
function tickAttract(){
  if(!isNaN(phaseParam)){ attractPhase = phaseParam % ATTRACT_PHASES; return; } // QA hold
  attractClock++;
  if(attractClock >= PHASE_FRAMES){
    attractClock = 0;
    attractPhase = (attractPhase + 1) % ATTRACT_PHASES;
  }
  // in the demo phase auto-advance the selection slowly (the classic "the
  // game plays itself" feel) so returning to menu lands somewhere live
  if(attractPhase === 2){
    if(++demoSelClock > 40){ demoSelClock = 0; sel = (sel+1)%curList().length; clampScroll(); }
  }
}

/* ===================================================================== *
 *  THE FRAME LOOP
 * ===================================================================== */
let frame = 0;
function clear(){ ctx.fillStyle = PAL.black; ctx.fillRect(0,0,VW,VH); }
function drawScene(f){
  clear();
  // a subtle dithered sky glow behind the stars (top), flat palette
  if(!reduce) ditherVRamp(0, 0, VW, 60, PAL.black, PAL.dark);
  drawStarfield(f);

  if(attract){
    tickAttract();
    drawLogo(f);                          // logo stays in every attract phase
    if(attractPhase === 0){
      drawBadge(f);
      textCenter('PUSH START', VW/2, 150, ((f>>3)&1)?PAL.yellow:PAL.black, 2, 1);
      textCenter('SML REINFORCEMENT LEARNING ARCADE', VW/2, 200, PAL.grey, 1, 1);
    }
    else if(attractPhase === 1){ drawHiScore(); }
    else if(attractPhase === 2){ drawDemo(f); }
    else { drawInsertCoin(f); }
    drawMarquee(f);
    drawFrame(f);
    return;
  }

  drawLogo(f);
  drawBadge(f);
  drawList(f);
  drawInfo();
  drawPrompts(f);
  drawMarquee(f);
  drawFrame(f);                           // frame last so it sits on top
}
function loop(){
  frame++;
  drawScene(frame);
  if(!attract) syncNames();               // keep names glued to (scrolled) rows
  requestAnimationFrame(loop);
}

/* ===================================================================== *
 *  NAVIGATION  (ported)
 * ===================================================================== */
function move(d){
  exitAttract();
  const n = curList().length;
  sel = (sel + d + n) % n;     // wraps
  clampScroll(); syncNames(); blip(); resetIdle();
}
function home(){ exitAttract(); sel = 0; clampScroll(); syncNames(); blip(); resetIdle(); }
function end(){ exitAttract(); sel = curList().length - 1; clampScroll(); syncNames(); blip(); resetIdle(); }

/* ===================================================================== *
 *  BOOT a cartridge  /  open the EXTRA bundle  (ported)
 * ===================================================================== */
let loading = false;
function boot(){
  if(loading) return;
  exitAttract();
  const g = curList()[sel];
  if(g.isBundle){ openExtra(); return; }
  visited[g.href] = 1;
  try{ localStorage.setItem('classicrl_visited', JSON.stringify(visited)); }catch(e){}
  coin();
  loading = true;
  showLoading(g.name);
  // file:// shows a dir listing for "casino/"; target index.html so it works
  // locally AND on Pages
  const dest = g.href + (g.href.endsWith('/') ? 'index.html' : '');
  setTimeout(() => { location.href = dest; }, reduce ? 250 : 950);
}
function openExtra(){
  exitAttract(); coin();
  showLoading('EXTRA GAMES');
  setTimeout(() => {
    view = 'extra'; sel = 0; scroll = 0;
    buildNames(); hideLoading(); resetIdle();
  }, reduce ? 150 : 650);
}
function backToMain(){
  blip(); view = 'main'; scroll = 0;
  sel = VIEWS.main.findIndex(x => x.isBundle); if(sel < 0) sel = 0;
  buildNames(); resetIdle();
}

/* loading overlay (DOM, covers everything) with rAF-stepped chunky bar */
const loadEl = document.getElementById('load');
const loadName = document.getElementById('load-n');
const loadBar = document.getElementById('load-bar');
function showLoading(name){
  loadName.textContent = name;
  loadEl.classList.add('on');
  const t0 = performance.now(), dur = reduce ? 200 : 900;
  function fill(now){
    const p = Math.min(1, (now - t0) / dur);
    loadBar.style.width = (Math.floor(p * 24) / 24 * 100) + '%';  // 24-step chunky
    if(p < 1 && loadEl.classList.contains('on')) requestAnimationFrame(fill);
  }
  requestAnimationFrame(fill);
}
function hideLoading(){ loadEl.classList.remove('on'); loading = false; loadBar.style.width = '0%'; }

/* ===================================================================== *
 *  BOOT INTRO  (power-on flourish)
 * ===================================================================== */
const bootEl = document.getElementById('boot');
function dismissBoot(){
  if(booted) return; booted = true;
  ac(); jingle();
  bootEl.style.transition = 'opacity .35s';
  bootEl.style.opacity = '0';
  setTimeout(() => { bootEl.style.display = 'none'; }, 360);
  resetIdle();
}
if(skipIntro){ booted = true; bootEl.style.display = 'none'; }

/* ===================================================================== *
 *  AUDIO  : chiptune via Web Audio, unlocked on first gesture (ported)
 * ===================================================================== */
let actx = null, muted = false;
function ac(){
  if(!actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ muted = true; } }
  if(actx && actx.state === 'suspended'){ actx.resume(); }
  return actx;
}
function tone(f, d, t, when, g){
  t = t||'square'; when = when||0; g = g==null?0.05:g;
  const c = ac(); if(!c || muted) return;
  const o = c.createOscillator(), v = c.createGain(), now = c.currentTime + when;
  o.type = t; o.frequency.setValueAtTime(f, now);
  v.gain.setValueAtTime(0.0001, now);
  v.gain.exponentialRampToValueAtTime(g, now + 0.01);
  v.gain.exponentialRampToValueAtTime(0.0001, now + d);
  o.connect(v).connect(c.destination); o.start(now); o.stop(now + d + 0.02);
}
function blip(){ if(!muted) tone(620, 0.05, 'square', 0, 0.04); }
function chime(){ tone(880, 0.06); tone(1320, 0.12, 'square', 0.05); }
function coin(){ tone(988, 0.07, 'square', 0, 0.05); tone(1319, 0.32, 'square', 0.07, 0.05); }
function jingle(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f, 0.14, 'square', i*0.11, 0.045)); }

/* music toggle (the MUSIC button) : a looping chiptune bass + arp */
let musicOn = false, musicTimer = null, musicStep = 0;
const MUSIC_NOTES = [261,329,392,523,392,329,261,196];
function toggleMusic(){
  ac();
  musicOn = !musicOn;
  const btn = document.getElementById('music-btn');
  btn.classList.toggle('on', musicOn);
  btn.textContent = musicOn ? '♪ ON' : '♪ MUSIC';
  if(musicOn){
    musicStep = 0;
    musicTimer = setInterval(()=>{
      if(muted) return;
      const n = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
      tone(n, 0.18, 'square', 0, 0.03);
      if(musicStep % 2 === 0) tone(n/2, 0.22, 'triangle', 0, 0.025);
      musicStep++;
    }, 200);
  } else if(musicTimer){ clearInterval(musicTimer); musicTimer = null; }
}

/* ===================================================================== *
 *  THEME (T) : recolour the scene palette without leaving the low-res look.
 *  Cycles NES / GAME BOY GREEN / AMBER by remapping a few PAL entries.
 * ===================================================================== */
const THEMES = ['NES','GREEN','AMBER'];
let themeIdx = 0;
const palDefaults = Object.assign({}, PAL);
function applyTheme(){
  const t = THEMES[themeIdx];
  Object.assign(PAL, palDefaults);   // restore base
  if(t === 'GREEN'){
    PAL.black='#04140a'; PAL.dark='#0a2010'; PAL.navy='#13361c'; PAL.dgrey='#1f6b35';
    PAL.grey='#69c75a'; PAL.white='#c6ffbf'; PAL.cyan='#9bff7a'; PAL.blue='#4fae49';
    PAL.yellow='#d4ff7a'; PAL.red='#9bff7a'; PAL.orange='#9bff7a';
    PAL.green='#9bff7a'; PAL.pink='#c6ffbf'; PAL.purple='#9bff7a';
    ['#3a8a32','#69c75a','#9bff7a','#c6ffbf','#9bff7a','#69c75a'].forEach((c,i)=>LOGO_RAMP[i]=c);
  } else if(t === 'AMBER'){
    PAL.black='#170d02'; PAL.dark='#221405'; PAL.navy='#3a260a'; PAL.dgrey='#7a4f1a';
    PAL.grey='#c7903a'; PAL.white='#ffd789'; PAL.cyan='#ffb84d'; PAL.blue='#a9803a';
    PAL.yellow='#ffd789'; PAL.red='#ffb84d'; PAL.orange='#ffb84d';
    PAL.green='#ffb84d'; PAL.pink='#ffd789'; PAL.purple='#ffb84d';
    ['#8a5a1a','#c7903a','#ffb84d','#ffd789','#ffb84d','#c7903a'].forEach((c,i)=>LOGO_RAMP[i]=c);
  } else {
    [palDefaults.red,palDefaults.orange,palDefaults.yellow,palDefaults.green,palDefaults.cyan,palDefaults.pink]
      .forEach((c,i)=>LOGO_RAMP[i]=c);
  }
  const btn = document.getElementById('theme-btn');
  if(btn) btn.textContent = 'THEME:' + t.slice(0,3);
}
function cycleTheme(){ themeIdx = (themeIdx + 1) % THEMES.length; applyTheme(); blip(); }

/* ===================================================================== *
 *  JP toggle : flips the prompt tint (we keep the latin 5x7 font, so this
 *  is a light nod that honours "keep whatever's there" without a kana font).
 * ===================================================================== */
let jpOn = false;
function toggleJP(){
  jpOn = !jpOn;
  const btn = document.getElementById('jp-btn');
  btn.classList.toggle('on', jpOn);
  blip();
}

/* ===================================================================== *
 *  IDLE -> ATTRACT  (ported timings)
 * ===================================================================== */
let idleT = null;
function resetIdle(){
  exitAttract();
  clearTimeout(idleT);
  if(!reduce && booted) idleT = setTimeout(enterAttract, 20000);
}

/* ===================================================================== *
 *  KEYBOARD  (ported, incl. konami)
 * ===================================================================== */
const KO = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kbuf = [];
function anyInputWake(){ if(attract){ exitAttract(); resetIdle(); return true; } return false; }
addEventListener('keydown', e => {
  ac();
  kbuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key); kbuf = kbuf.slice(-KO.length);
  if(KO.every((k,i)=>k===kbuf[i])){ secret(); kbuf=[]; }

  if(!booted){
    if(['Enter',' ','ArrowUp','ArrowDown'].includes(e.key)){ e.preventDefault(); dismissBoot(); }
    return;
  }
  if(anyInputWake() && e.key!=='Enter' && e.key!==' '){ return; }
  switch(e.key){
    case 'ArrowUp': case 'k': case 'w': e.preventDefault(); move(-1); break;
    case 'ArrowDown': case 'j': case 's': e.preventDefault(); move(1); break;
    case 'Enter': case ' ': case 'x': e.preventDefault(); chime(); boot(); break;
    case 'Escape': case 'Backspace': if(view==='extra'){ e.preventDefault(); backToMain(); } break;
    case 't': case 'T': cycleTheme(); break;
    case 'm': case 'M': toggleMusic(); break;
    case 'Home': home(); break;
    case 'End': end(); break;
  }
});

/* ===================================================================== *
 *  TOUCH / SWIPE on the scene  (ported)
 * ===================================================================== */
let ty = null, tStartScroll = 0, tMoved = false;
/* scroll the visible window by N rows (decoupled from selection), clamped */
function scrollWindow(rows){
  const n = curList().length; if(n <= VISROWS) return;
  scroll = Math.max(0, Math.min(scroll + rows, n - VISROWS));
  syncNames(); resetIdle();
}
/* show the ▲/▼ touch buttons only when the current list overflows the viewport */
function updatePad(){ if(padEl) padEl.classList.toggle('show', curList().length > VISROWS); }
glass.addEventListener('touchstart', e => { ty = e.touches[0].clientY; tStartScroll = scroll; tMoved = false; ac(); }, { passive:true });
glass.addEventListener('touchmove', e => {
  if(ty === null) return;
  const dy = e.touches[0].clientY - ty;
  if(Math.abs(dy) > 6){
    tMoved = true;                                   // suppresses the tap-to-select on touchend
    if(booted && !attract){
      const n = curList().length;
      if(n > VISROWS){
        const ns = Math.max(0, Math.min(tStartScroll - Math.round(dy / (ROW_H * SCALE)), n - VISROWS));
        if(ns !== scroll){ scroll = ns; syncNames(); }
      }
    }
    e.preventDefault();                              // stop page rubber-banding
  }
}, { passive:false });
glass.addEventListener('touchend', () => { ty = null; }, { passive:true });
// tapping the (non-name) scene also wakes from attract / dismisses boot
cabinet.addEventListener('pointerdown', () => { ac(); if(!booted){ dismissBoot(); return; } anyInputWake(); resetIdle(); });

/* ===================================================================== *
 *  GAMEPAD  (ported: dpad + A=boot, B=back)
 * ===================================================================== */
let gpPrev = {}, gpAxis = 0;
addEventListener('gamepadconnected', () => { requestAnimationFrame(pollGP); });
function pollGP(){
  const gp = (navigator.getGamepads && navigator.getGamepads()[0]);
  if(gp){
    const up = gp.buttons[12] && gp.buttons[12].pressed,
          dn = gp.buttons[13] && gp.buttons[13].pressed,
          a  = gp.buttons[0]  && gp.buttons[0].pressed,
          st = gp.buttons[9]  && gp.buttons[9].pressed,
          bb = gp.buttons[1]  && gp.buttons[1].pressed,
          ay = gp.axes[1] || 0;
    if(!booted){ if(a||st||up||dn) dismissBoot(); }
    else{
      if((up||ay<-0.6) && !gpAxis){ move(-1); gpAxis=1; }
      else if((dn||ay>0.6) && !gpAxis){ move(1); gpAxis=1; }
      else if(!up && !dn && Math.abs(ay)<0.4){ gpAxis=0; }
      if(a && !gpPrev.a){ chime(); boot(); }
      if(bb && !gpPrev.b && view==='extra'){ backToMain(); }
    }
    gpPrev = { a, b: bb };
  }
  requestAnimationFrame(pollGP);
}

/* ===================================================================== *
 *  KONAMI easter egg : sprite rain over the scene (ported, palette-aware)
 * ===================================================================== */
const fxEl = document.getElementById('fx');
let cheatActive = false, cheatFrames = 0;
function secret(){
  jingle();
  cheatActive = true; cheatFrames = 600;
  const chars = ['γ','ε','★','Q','π','▲','♥','$'];
  for(let i=0;i<48;i++){
    const s = document.createElement('div'); s.className = 'spr';
    s.textContent = chars[i % chars.length];
    s.style.left = (i/48*100) + '%';
    s.style.color = (GAMES[i % GAMES.length].acc);
    s.style.animationDuration = (2 + (i%5)*0.6) + 's';
    s.style.animationDelay = ((i%9)*0.12) + 's';
    fxEl.appendChild(s); setTimeout(() => s.remove(), 7000);
  }
}

/* ===================================================================== *
 *  WIRE UP LINKS / BUTTONS, BOOT, FIRST PAINT
 * ===================================================================== */
function wire(){
  document.getElementById('music-btn').addEventListener('click', e => { e.preventDefault(); toggleMusic(); });
  document.getElementById('theme-btn').addEventListener('click', e => { e.preventDefault(); cycleTheme(); });
  document.getElementById('jp-btn').addEventListener('click', e => { e.preventDefault(); toggleJP(); });
  const pu = document.getElementById('pad-up'), pd = document.getElementById('pad-dn');
  if(pu) pu.addEventListener('click', e => { e.preventDefault(); ac(); anyInputWake(); scrollWindow(-(VISROWS-2)); });
  if(pd) pd.addEventListener('click', e => { e.preventDefault(); ac(); anyInputWake(); scrollWindow(VISROWS-2); });
  bootEl.addEventListener('click', dismissBoot);
  bootEl.addEventListener('touchstart', e => { e.preventDefault(); dismissBoot(); }, { passive:false });
  ['keydown','pointerdown','touchstart','mousemove'].forEach(ev => addEventListener(ev, resetIdle, { passive:true }));
  applyTheme();
  layout();
  buildNames();
  if(booted) resetIdle();
  if(demoParam){ booted = true; bootEl.style.display = 'none'; enterAttract(); }
  loop();
}

/* hook the konami "cheat" blurb into drawInfo without rewriting it */
const _drawInfo = drawInfo;
drawInfo = function(){
  if(cheatActive){
    cheatFrames--; if(cheatFrames<=0) cheatActive=false;
    const x=LIST_X, w=LIST_W, y=INFO_TOP;
    ctx.fillStyle=PAL.red; ctx.fillRect(x,y,2,22);
    dither(x+3,y,w-3,22,PAL.black,PAL.dred,3);
    text('CHEAT ENABLED!', x+6, y+2, PAL.yellow, 1, 1);
    text('GAMMA=1.00 EPSILON=0.00 GREEDY', x+6, y+11, PAL.white, 1, 1);
    return;
  }
  _drawInfo();
};

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();

})();
