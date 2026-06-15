/* cartridges.js : the CLASSIC RL arcade registry (the single source of truth for content).
 *
 * INTEGRATOR: to add a game, edit ONLY this file (4 steps):
 *   1. add a GAMES entry   {name, href, acc, tag:"RL"|"BIZ", blurb}
 *   2. add its pixel sprite to SPRITES   (a grid of rows; PX maps each char to a colour, '.' = transparent)
 *   3. add the sprite's key to SPR        (SAME order/index as GAMES)
 *   4. add the game into VIEWS.extra      (or VIEWS.main for a headliner)
 * Counts (the "N - IN - 1" badge, the EXTRA "+N" tag, the bundle blurb) auto-derive from these.
 *
 * index.html (the chrome + engine) consumes window.GAMES / SPRITES / PX / SPR / EXTRA / VIEWS.
 * Each game's own folder is self-contained; THIS is the only shared file an integrator edits,
 * which keeps it off the design lane's path (index.html / css/) and the game lanes' folders.
 */
window.GAMES = [
  {name:"ANYMAL MDP",         href:"anymal-mdp/",        acc:"#e0404a", tag:"RL",  blurb:"Drive the robot dog by hand. Meet state, action, transition, reward: the four pieces of an MDP."},
  {name:"CASINO",             href:"casino/",            acc:"#3aa0ff", tag:"RL",  blurb:"Five slot machines, hidden odds. Pull by hand, then watch ε-greedy balance explore vs. exploit."},
  {name:"SPOOKY HOUSE",       href:"spooky-house/",      acc:"#a060ff", tag:"RL",  blurb:"A 5×5 grid of rewards. One backward sweep yields the optimal value; read the policy off V, then bend it with γ."},
  {name:"DARTS IN THE DARK",  href:"darts/",             acc:"#ffb020", tag:"RL",  blurb:"Throw at a target you can't see. An online estimate converges: feel learning-rate vs. stability."},
  {name:"SARSA",              href:"sarsa-anymal/",      acc:"#45d27a", tag:"RL",  blurb:"The capstone: four pieces fuse into one update rule. Watch a 21-state Q-table fill across episodes."},
  {name:"SNAKES & LADDERS",   href:"snakes-ladders/",    acc:"#ff7ad9", tag:"RL",  blurb:"A children's game is an MDP. Roll by hand, watch value iteration converge, slide γ, then let SARSA learn it."},
  {name:"POKEMON BATTLE",     href:"pokemon-battle/",    acc:"#ffe000", tag:"RL",  blurb:"A wild CHARMANDER appeared! The same RL lesson under a Gen-1 Red/Blue battle screen."},
  {name:"LAST-MINUTE PRICING",href:"last-minute-pricing/",acc:"#ff8a3c",tag:"BIZ", blurb:"Perishable stock, a midnight deadline. Set a price each day; the revenue-management surface, learned by DP then SARSA."},
  {name:"PRESS YOUR LUCK",    href:"press-your-luck/",   acc:"#00d0c0", tag:"BIZ", blurb:"Grow the pot or bank it before a 1 wipes it out. Push when behind, protect when ahead; the Pig dice game as an MDP."},
  {name:"PIPELINE CLIMB",     href:"pipeline-climb/",    acc:"#7ce040", tag:"BIZ", blurb:"A lead climbs cold to hot. Nurture, demo, or close: the same lever is +29 when READY and destructive when COLD."},
  {name:"CHURN RESCUE",       href:"churn-rescue/",      acc:"#ff5470", tag:"BIZ", blurb:"A cooling account, a ticking renewal clock. Wait, send a cheap touch, or spend a deep discount. Retention ROI as an MDP."},
  {name:"REPAIR OR REPLACE",  href:"repair-or-replace/", acc:"#9aa7ff", tag:"BIZ", blurb:"One van, four states of wear. Run it, shop it, or buy new: scrap it while it still starts, timing set by γ."},
  {name:"GAMBLER'S RUIN",     href:"gamblers-ruin/",     acc:"#d9a521", tag:"BIZ", blurb:"Double your stake to $10 against a rigged coin. The best bet zig-zags: bold in the dangerous middle, timid at the edges (DP, then SARSA vs Q-learning)."},
  {name:"TRIAL CLOCK",        href:"trial-clock/",       acc:"#8a7cff", tag:"BIZ", blurb:"A free trial is ticking down: nudge adoption or push the paywall? Push too early and they bail; the right lever flips with how activated they are and how little time is left."},
  {name:"STALE BY SUNDOWN",   href:"stale-by-sundown/",  acc:"#ff7a59", tag:"BIZ", blurb:"Fresh stock spoils by sundown: hold, discount, or dump? The right call marches down the freshness tier (age, not stock, drives it)."},
  {name:"CRITICAL SPARE",     href:"critical-spare/",    acc:"#8aa0b8", tag:"BIZ", blurb:"One machine, one spare bin: run, order a spare, or replace? Pre-position the spare as the machine ages, before a failure strands you."},
  {name:"RECYCLING ROBOT",    href:"recycling-robot/",   acc:"#4ecb8f", tag:"RL",  blurb:"A canister-collecting robot on a battery: search, wait, or recharge? The lever flips up the battery gauge, so a low battery means recharge before you strand."},
  {name:"WINDY TREASURE CAVE",href:"windy-treasure-cave/",acc:"#5ab0e0",tag:"RL",  blurb:"Reach the gold across a windy cave where a gust can shove you into the pit. The optimal heading bends around the pit, even when that is the long way."},
  {name:"BEAT THE DEADLINE",  href:"beat-the-deadline/",  acc:"#5b8def", tag:"BIZ", blurb:"Pallets pile up and the cut-off nears: wait to fill the truck, or ship it half-empty? Send when the truck is full OR the deadline is close; hold only with both room and runway."},
];

/* sprite key per game, SAME order as GAMES */
window.SPR=['robot','reel7','ghost','target','trophy','ladder','pokeball','tag','die5','bars','heart','van','coin','hourglass','sun','crate','robot2','chest','truck'];

/* palette: char -> colour ('.' = transparent) */
window.PX={'.':null,K:'#0b0b16',W:'#f4f6ff',R:'#ff4d5e',r:'#c0202e',G:'#6be24a',g:'#1f9a52',
  B:'#41a6ff',b:'#9aa7ff',Y:'#ffd23f',O:'#ff9a3c',P:'#b06bff',C:'#5ad0ff',S:'#c9cee6',s:'#6c7194',N:'#9a6a3c'};

/* one inline-SVG pixel sprite per game (plus qblock=EXTRA bundle icon, dog=attract mascot) */
window.SPRITES={
  robot:[".....R.....",".....K.....","..KKKKKKK..","..KSSSSSK..","..KSSSSSK..",
         "..KCCSCCK..","..KSSSSSK..","..KSKKKSK..","..KKKKKKK..","...K...K..."],
  reel7:["..KKKKKKK..","..KYYYYYK..","..KRRRRRK..","..KYYYRYK..","..KYYYRYK..",
         "..KYYRYYK..","..KYYRYYK..","..KYRYYYK..","..KYYYYYK..","..KKKKKKK.."],
  ghost:["...KKKKK...","..KPPPPPK..",".KPPPPPPPK.",".KPWWPWWPK.",".KPWWPWWPK.",
         ".KPPPPPPPK.",".KPPPPPPPK.",".KPPPPPPPK.",".KPPPPPPPK.",".KP..P..PK."],
  target:["...........","...RRRRR...","..RWWWWWR..",".RWRRRRRWR.",".RWRWWWRWR.",
          ".RWRWRWRWR.",".RWRWWWRWR.",".RWRRRRRWR.","..RWWWWWR..","...RRRRR...","..........."],
  trophy:["...........","..KYYYYYK..",".KYYYYYYYK.","KKYYYYYYYKK","K.KYYYYYK.K",
          "..KYYYYYK..","...KYYYK...","....KYK....","...KKKKK...","..KKKKKKK..","..........."],
  ladder:["...N...N...","...N...N...","...NNNNN...","...N...N...","...N...N...",
          "...NNNNN...","...N...N...","...N...N...","...NNNNN...","...N...N...","...N...N..."],
  pokeball:["...KKKKK...",".KKRRRRRKK.",".KRRRRRRRK.","KRRRRRRRRRK","KRRRWWWRRRK",
            "KKKKWKWKKKK","KWWWWWWWWWK","KWWWWWWWWWK",".KWWWWWWWK.",".KKWWWWWKK.","...KKKKK..."],
  tag:["..KKKKKKK..",".KOOOKOOOK.",".KOOOOOOOK.",".KOYYYOOOK.",".KOYOOOOOK.",
       ".KOYYYOOOK.",".KOOOYOOOK.",".KOYYYOOOK.",".KOOOOOOOK.","..KKKKKKK.."],
  die5:["..KKKKKKK..",".KWWWWWWWK.",".KWKWWWKWK.",".KWWWWWWWK.",".KWWWKWWWK.",
        ".KWWWWWWWK.",".KWKWWWKWK.",".KWWWWWWWK.","..KKKKKKK.."],
  bars:["...........","...........","...........",".......GG..",".......GG..",
        "....GG.GG..","....GG.GG..",".GG.GG.GG..",".GG.GG.GG..",".GG.GG.GG..","..........."],
  heart:["...........",".KK...KK...","KRRK.KRRK..","KRRRKRRRK..","KRRRRRRRRK.",
         "KRRRRRRRRK.",".KRRRRRRK..","..KRRRRK...","...KRRK....","....KK.....","..........."],
  van:["...........","...KKKKKKK.","..KKWWKbbbK",".KbbbbbbbbK",".KbbbbbbbbK",
       ".KbbbbbbbbK",".KKKKKKKKK.","..KK...KK..","..KK...KK..","..........."],
  qblock:["KKKKKKKKKKK","KYYYYYYYYYK","KYsYYYYYsYK","KYYYKKKYYYK","KYYKYYYKYYK",
          "KYYYYYKYYYK","KYYYYKYYYYK","KYYYYYYYYYK","KYYYYKYYYYK","KYsYYYYYsYK","KKKKKKKKKKK"],
  coin:["...KKKKK...",".KKYYYYYKK.",".KYYYYYYYK.",".KYKKKKKYK.",".KYKYYYYYK.",
        ".KYYKKKYYK.",".KYYYYYKYK.",".KYKKKKKYK.",".KYYYYYYYK.",".KKYYYYYKK.","...KKKKK..."],
  hourglass:[".KKKKKKKKK.",".KYYYYYYYK.","..K.YYY.K..","...K.Y.K...","....KKK....",
             "...K.Y.K...","..K..Y..K..",".K..YYY..K.",".KYYYYYYYK.",".KKKKKKKKK.","..........."],
  sun:["...........","....K.K....",".K..OOO..K.","...OOOOO...",".KKOOOOOKK.",
       "..OOOOOOO..","KKKKKKKKKKK","...........","...........","...........","..........."],
  crate:["KKKKKKKKKKK","KNNKNNNKNNK","KNNKNNNKNNK","KKKKKKKKKKK","KNKNNNNNKNK",
         "KNKNNNNNKNK","KKKKKKKKKKK","KNNKNNNKNNK","KNNKNNNKNNK","KKKKKKKKKKK","..........."],
  robot2:[".....K.....","...KKKKK...","..KGGGGGK..","..KCGGGCK..","..KGGGGGK..",
          "...KKKKK...","..KGGGGGK..","..KGGGGGK..","..KGGGGGK..","...K...K...","..........."],
  chest:["...........","..KKKKKKK..",".KYYYYYYYK.",".KKKKKKKKK.",".KNNNNNNNK.",
         ".KNNNKNNNK.",".KNNNYNNNK.",".KNNNNNNNK.",".KKKKKKKKK.","...........","..........."],
  truck:["...........",".....KKKKK.","...KKBBBBK.","..KCCKBBBBK",".KKKKKBBBBK",
         ".KBBBBBBBBK",".KKKKKKKKK.","..KK...KK..","..KK...KK..","...........","..........."],
  dog:["............KK",".KK........KSK",".KKKKKKKKKKSCK","KSSSSSSSSSSSSK",
       "KSSSSSSSSSSSK.","KSSSSSSSSSSSK.",".K.KK..KK.K...",".K.KK..KK.K..."]
};

/* attach each sprite key to its game */
window.GAMES.forEach((g,i)=>{ g.spr = window.SPR[i]; });

/* the EXTRA bundle pseudo-cartridge (opens the sub-screen of everything not a headliner) */
window.EXTRA = {name:"EXTRA ...", isBundle:true, acc:"#ffd23f", spr:"qblock",
  blurb:"the RL component drills plus extra business and real-world MDPs. Press START to open."};

/* which cartridges are headliners (main menu) vs in the EXTRA bundle */
window.VIEWS = {
  main:[GAMES[0],GAMES[5],GAMES[6],GAMES[7],GAMES[11],GAMES[14],GAMES[15],EXTRA],
  extra:[GAMES[1],GAMES[2],GAMES[3],GAMES[4],GAMES[8],GAMES[9],GAMES[10],GAMES[12],GAMES[13],GAMES[16],GAMES[17],GAMES[18]]
};

/* counts auto-derive from the registry above */
window.EXTRA.tag = '+' + window.VIEWS.extra.length;
window.EXTRA.blurb = window.VIEWS.extra.length + ' bonus cartridges: ' + window.EXTRA.blurb;
