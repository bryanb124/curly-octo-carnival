'use strict';

// ─── CANVAS SETUP ────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H, GROUND_Y, CEIL_Y, GAME_H;

function isPortrait() { return window.innerHeight > window.innerWidth; }

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  // In portrait, reserve bottom 30% for touch controls so they don't cover the game
  GAME_H   = isPortrait() ? Math.floor(H * 0.70) : H;
  GROUND_Y = Math.floor(GAME_H * 0.73);
  CEIL_Y   = Math.floor(GAME_H * 0.12);
}
window.addEventListener('resize', resize);
resize();

// ─── AUDIO ───────────────────────────────────────────────────
let ac = null;
function getAC() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function beep(freq, dur, type = 'square', vol = 0.15, delay = 0) {
  try {
    const a = getAC(), o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = type; o.frequency.value = freq;
    const t = a.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  } catch(e) {}
}
const SFX = {
  jump:    () => { beep(220,0.05); beep(440,0.07,'square',0.12,0.06); },
  land:    () => { beep(100,0.06,'square',0.18); },
  collect: () => { [523,659,784,1047].forEach((f,i)=>beep(f,0.08,'square',0.15,i*0.08)); },
  die:     () => { [400,300,200,100].forEach((f,i)=>beep(f,0.1,'square',0.22,i*0.1)); },
  swing:   () => { beep(130,0.25,'sine',0.12); },
  hazard:  () => { beep(180,0.08,'square',0.18); beep(120,0.12,'square',0.2,0.09); },
  ladder:  () => { beep(300,0.05,'square',0.1); beep(400,0.05,'square',0.1,0.06); },
  gameOver:() => { [300,250,200,150,100].forEach((f,i)=>beep(f,0.18,'square',0.22,i*0.18)); },
  win:     () => { [262,330,392,523,659,784].forEach((f,i)=>beep(f,0.1,'square',0.2,i*0.1)); },
};

// ─── PALETTE ─────────────────────────────────────────────────
const COL = {
  sky:       '#5080d0',
  sun:       '#ffee00',
  jungle1:   '#1a6a10',
  jungle2:   '#0f4a08',
  ground:    '#5a3010',
  grass:     '#38a018',
  grassDk:   '#246a0e',
  water:     '#1848c8',
  waterLt:   '#4878e8',
  quicksand: '#c8a048',
  logBrown:  '#8B4513',
  logDark:   '#5C2E00',
  logRing:   '#a0601a',
  vine:      '#38b020',
  vineDk:    '#206010',
  skin:      '#f4c47a',
  hat:       '#8B2200',
  hatBrim:   '#6B1a00',
  shirt:     '#e84000',
  pants:     '#1840d0',
  shoe:      '#3a2000',
  scorpion:  '#c8a020',
  scorpDk:   '#886010',
  crocBody:  '#2a8a18',
  crocDk:    '#185a0c',
  crocEye:   '#ff4400',
  crocTooth: '#fffff0',
  batBody:   '#603080',
  batWing:   '#401850',
  gold:      '#FFD700',
  silver:    '#C8C8C8',
  money:     '#40c040',
  diamond:   '#80ffff',
  hud:       '#000010',
  hudText:   '#ffff00',
  white:     '#ffffff',
  black:     '#000000',
  underground:'#100808',
  ugGround:  '#301808',
  ugGrass:   '#402010',
  ladder:    '#c8a040',
};

// ─── SPRITE DRAWERS ──────────────────────────────────────────
function px(x, y, w, h, col) {
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
}

function drawPlayer(x, y, dir, frame, state) {
  const s = Math.max(1, Math.floor(GAME_H / 22)); // scale unit
  const mx = x - s*2; // mirror offset
  ctx.save();
  if (dir < 0) { ctx.scale(-1,1); ctx.translate(-x*2, 0); }

  if (state === 'dead') {
    // Skull / X eyes
    px(x-s,  y-s*8, s*6, s*6, COL.skin);
    px(x,    y-s*7, s,   s,   COL.black); // eye X
    px(x+s*2,y-s*7, s,   s,   COL.black);
    px(x-s,  y-s*3, s*6, s*2, COL.shirt);
    px(x,    y-s,   s*4, s*4, COL.pants);
    ctx.restore(); return;
  }

  // Hat
  px(x+s,  y-s*13, s*4, s*2,  COL.hatBrim);
  px(x+s*2,y-s*16, s*3, s*4,  COL.hat);
  // Face
  px(x+s,  y-s*11, s*4, s*4,  COL.skin);
  // Eyes
  px(x+s*2,y-s*10, s, s, COL.black);
  px(x+s*4,y-s*10, s, s, COL.black);

  if (state === 'swing') {
    // Arms up
    px(x-s,  y-s*9,  s*2, s*2, COL.skin);
    px(x+s*5,y-s*9,  s*2, s*2, COL.skin);
    px(x,    y-s*8,  s*6, s*5, COL.shirt);
    px(x+s,  y-s*4,  s*4, s*4, COL.pants);
    px(x+s,  y,      s*2, s*2, COL.shoe);
    px(x+s*3,y,      s*2, s*2, COL.shoe);
  } else if (state === 'jump') {
    // Arms out
    px(x-s*2,y-s*8,  s*2, s*2, COL.skin);
    px(x+s*6,y-s*8,  s*2, s*2, COL.skin);
    px(x,    y-s*8,  s*6, s*5, COL.shirt);
    px(x+s,  y-s*4,  s*4, s*4, COL.pants);
    // Legs tucked
    px(x,    y-s,    s*2, s*2, COL.shoe);
    px(x+s*4,y-s,    s*2, s*2, COL.shoe);
  } else {
    // Running: alternate legs
    const legL = (frame & 1) ? 0 : s*2;
    const legR = (frame & 1) ? s*2 : 0;
    px(x,    y-s*8,  s*6, s*5, COL.shirt);
    px(x-s,  y-s*7,  s*2, s*2, COL.skin); // arm
    px(x+s*5,y-s*7,  s*2, s*2, COL.skin);
    px(x+s,  y-s*4,  s*4, s*4, COL.pants);
    px(x+s,  y-s*2-legL, s*2, s*3, COL.shoe);
    px(x+s*3,y-s*2+legR, s*2, s*3, COL.shoe);
  }
  ctx.restore();
}

function drawLog(x, y, radius) {
  // Rolling log (circle-ish using rects)
  const r = radius;
  px(x-r, y-r, r*2, r*2, COL.logBrown);
  px(x-r, y-Math.floor(r*0.3), r*2, Math.floor(r*0.6), COL.logRing);
  px(x-Math.floor(r*0.3), y-r, Math.floor(r*0.6), r*2, COL.logDark);
  px(x-Math.floor(r*0.7), y-Math.floor(r*0.7), Math.floor(r*1.4), Math.floor(r*1.4), COL.logBrown);
  // rings
  px(x-Math.floor(r*0.7), y-Math.floor(r*0.1), Math.floor(r*1.4), Math.floor(r*0.2), COL.logRing);
}

function drawScorpion(x, y, size, frame) {
  const s = size;
  // Body
  px(x-s*2, y-s*2, s*4, s*3, COL.scorpion);
  px(x-s,   y-s*3, s*2, s*2, COL.scorpion); // head
  // Pincers
  px(x-s*4, y-s*3, s*2, s, COL.scorpDk);
  px(x+s*2, y-s*3, s*2, s, COL.scorpDk);
  // Eyes
  px(x-s,   y-s*3, s, s, COL.black);
  px(x+s,   y-s*3+1, s, s, COL.black);
  // Legs (alternate)
  const lo = (frame&1) ? s : 0;
  for (let i=0; i<3; i++) {
    px(x-s*3,  y-s*2+i*s + (i%2===0?lo:0), s*3, Math.ceil(s*0.5), COL.scorpDk);
    px(x+s*2,  y-s*2+i*s + (i%2!==0?lo:0), s*3, Math.ceil(s*0.5), COL.scorpDk);
  }
  // Tail (stinger)
  px(x+s*2, y-s*4, s, s*2, COL.scorpion);
  px(x+s*3, y-s*5, s, s,   COL.scorpDk);
}

function drawCroc(x, y, size, mouthOpen) {
  const s = size;
  // Body
  px(x-s*4, y-s*2, s*8, s*3, COL.crocBody);
  // Scales
  for (let i=0;i<4;i++) px(x-s*3+i*s*2, y-s*2, s, s, COL.crocDk);
  // Head
  px(x-s*5, y-s*3, s*3, s*2, COL.crocBody);
  // Mouth
  const mh = mouthOpen ? s : Math.ceil(s*0.3);
  px(x-s*6, y-s*2-mh, s*2, mh, COL.crocBody); // top jaw
  px(x-s*6, y-s*2,    s*2, s,  COL.crocDk);   // bottom jaw
  if (mouthOpen) {
    px(x-s*6+2, y-s*2-mh+2, s-2, Math.ceil(s*0.4), COL.crocTooth);
  }
  // Eye
  px(x-s*4, y-s*3, s, s, COL.crocEye);
  // Tail
  px(x+s*4, y-s*2, s*3, s*2, COL.crocDk);
  px(x+s*7, y-s, s*2, s, COL.crocDk);
  // Legs
  px(x-s*2, y+s, s*2, s, COL.crocBody);
  px(x+s*2, y+s, s*2, s, COL.crocBody);
}

function drawBat(x, y, size, frame) {
  const s = size;
  const wingSpan = (frame&1) ? s*2 : s*3;
  // Wings
  px(x-wingSpan, y-s, wingSpan, s, COL.batWing);
  px(x+s,        y-s, wingSpan, s, COL.batWing);
  // Body
  px(x-s, y-s*2, s*2, s*2, COL.batBody);
  // Eyes
  px(x-Math.ceil(s*0.5), y-s*2, Math.ceil(s*0.5), Math.ceil(s*0.5), COL.white);
  px(x+Math.ceil(s*0.5)-Math.ceil(s*0.5), y-s*2, Math.ceil(s*0.5), Math.ceil(s*0.5), COL.white);
}

function drawVine(x, topY, length, swingAngle) {
  const segments = 8;
  ctx.strokeStyle = COL.vine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  for (let i=1; i<=segments; i++) {
    const t = i / segments;
    const cx = x + Math.sin(swingAngle) * length * t;
    const cy = topY + length * t;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  // leaves
  ctx.fillStyle = COL.vine;
  for (let i=2; i<=segments; i+=2) {
    const t = i / segments;
    const vx = x + Math.sin(swingAngle) * length * t;
    const vy = topY + length * t;
    ctx.fillRect(vx-4, vy-2, 8, 4);
  }
}

function drawTreasure(x, y, type, size) {
  const s = size;
  switch(type) {
    case 'gold': // Gold bar
      px(x-s*2, y-s, s*4, s*2, COL.gold);
      px(x-s,   y-s*2, s*2, s, COL.gold);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(x-s, y-s, s, s);
      break;
    case 'silver': // Silver bar
      px(x-s*2, y-s, s*4, s*2, COL.silver);
      px(x-s,   y-s*2, s*2, s, COL.silver);
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(x-s, y-s, s, s);
      break;
    case 'money': // Money bag
      px(x-s*2, y-s*3, s*4, s*4, COL.money);
      px(x-s,   y-s*4, s*2, s, COL.money);
      ctx.fillStyle = COL.white;
      ctx.font = `${s*2}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('$', x, y-s);
      break;
    case 'diamond': // Diamond ring
      px(x-s, y-s*3, s*2, s*3, COL.diamond);
      ctx.fillStyle = COL.white;
      ctx.fillRect(x-Math.ceil(s*0.5), y-s*2, s, s);
      // ring band
      px(x-s*2, y-s, s*4, s, COL.gold);
      break;
  }
}

function drawLadder(x, topY, botY, w) {
  ctx.fillStyle = COL.ladder;
  // Rails
  ctx.fillRect(x - w/2, topY, 3, botY - topY);
  ctx.fillRect(x + w/2 - 3, topY, 3, botY - topY);
  // Rungs
  const rungs = Math.floor((botY - topY) / 12);
  for (let i=0; i<=rungs; i++) {
    ctx.fillRect(x - w/2, topY + i * 12, w, 3);
  }
}

// ─── WORLD ROOMS ─────────────────────────────────────────────
// Each room: pits[], hazards[], vines[], treasure, ladder
// nx = normalized x (0–1 within room), nw = normalized width
function buildWorld() {
  const surface = [
    { pits:[], hazards:[{type:'scorpion',nx:.55}], vines:[], treasure:{type:'gold',nx:.25,pts:4000}, ladder:null },
    { pits:[{nx:.38,nw:.28,type:'water'}], hazards:[], vines:[{nx:.44}], treasure:{type:'silver',nx:.75,pts:3000}, ladder:null },
    { pits:[{nx:.18,nw:.22,type:'water'},{nx:.58,nw:.22,type:'water'}], hazards:[], vines:[{nx:.22},{nx:.62}], treasure:{type:'money',nx:.85,pts:2000}, ladder:null },
    { pits:[], hazards:[{type:'log',nx:.28},{type:'log',nx:.65}], vines:[], treasure:null, ladder:{nx:.88} },
    { pits:[{nx:.18,nw:.62,type:'water',crocs:3}], hazards:[], vines:[], treasure:{type:'diamond',nx:.08,pts:5000}, ladder:null },
    { pits:[], hazards:[{type:'scorpion',nx:.5}], vines:[], treasure:{type:'gold',nx:.8,pts:4000}, ladder:{nx:.15} },
    { pits:[{nx:.12,nw:.2,type:'quicksand'},{nx:.4,nw:.2,type:'quicksand'},{nx:.68,nw:.2,type:'water'}], hazards:[], vines:[{nx:.15},{nx:.43},{nx:.71}], treasure:null, ladder:null },
    { pits:[{nx:.3,nw:.28,type:'water'}], hazards:[{type:'scorpion',nx:.78}], vines:[{nx:.34}], treasure:{type:'silver',nx:.88,pts:3000}, ladder:null },
    { pits:[{nx:.15,nw:.68,type:'water',crocs:2}], hazards:[], vines:[], treasure:null, ladder:{nx:.9} },
    { pits:[], hazards:[{type:'log',nx:.22},{type:'log',nx:.52},{type:'log',nx:.8}], vines:[], treasure:{type:'diamond',nx:.65,pts:5000}, ladder:null },
    { pits:[{nx:.35,nw:.28,type:'water'}], hazards:[{type:'scorpion',nx:.15}], vines:[{nx:.39}], treasure:{type:'money',nx:.75,pts:2000}, ladder:{nx:.88} },
    { pits:[{nx:.1,nw:.2,type:'water'},{nx:.4,nw:.2,type:'quicksand'},{nx:.68,nw:.2,type:'water'}], hazards:[], vines:[{nx:.14},{nx:.72}], treasure:null, ladder:null },
    { pits:[], hazards:[{type:'log',nx:.4},{type:'scorpion',nx:.72}], vines:[], treasure:{type:'gold',nx:.2,pts:4000}, ladder:null },
    { pits:[{nx:.25,nw:.48,type:'water',crocs:2}], hazards:[], vines:[], treasure:{type:'silver',nx:.82,pts:3000}, ladder:{nx:.1} },
    { pits:[{nx:.3,nw:.2,type:'quicksand'}], hazards:[{type:'scorpion',nx:.65}], vines:[{nx:.33}], treasure:null, ladder:null },
    { pits:[], hazards:[{type:'log',nx:.25},{type:'log',nx:.6},{type:'scorpion',nx:.85}], vines:[], treasure:{type:'diamond',nx:.45,pts:5000}, ladder:{nx:.7} },
    { pits:[{nx:.2,nw:.58,type:'water',crocs:3}], hazards:[], vines:[], treasure:{type:'gold',nx:.85,pts:4000}, ladder:null },
    { pits:[{nx:.15,nw:.2,type:'water'},{nx:.5,nw:.2,type:'water'},{nx:.77,nw:.14,type:'quicksand'}], hazards:[], vines:[{nx:.19},{nx:.54}], treasure:null, ladder:{nx:.38} },
    { pits:[], hazards:[{type:'scorpion',nx:.3},{type:'log',nx:.65}], vines:[], treasure:{type:'money',nx:.8,pts:2000}, ladder:null },
    { pits:[{nx:.2,nw:.58,type:'water',crocs:2}], hazards:[{type:'scorpion',nx:.87}], vines:[], treasure:{type:'silver',nx:.92,pts:3000}, ladder:{nx:.1} },
  ];
  const underground = [
    { hazards:[{type:'bat',nx:.3},{type:'bat',nx:.7}], pits:[{nx:.48,nw:.1,type:'quicksand'}], treasure:{type:'gold',nx:.15,pts:4000}, exitLadder:{nx:.9} },
    { hazards:[{type:'scorpion',nx:.5}], pits:[], treasure:{type:'diamond',nx:.7,pts:5000}, exitLadder:{nx:.1} },
    { hazards:[{type:'bat',nx:.2},{type:'bat',nx:.62}], pits:[{nx:.38,nw:.12,type:'quicksand'}], treasure:{type:'silver',nx:.85,pts:3000}, exitLadder:{nx:.5} },
    { hazards:[{type:'scorpion',nx:.35},{type:'scorpion',nx:.65}], pits:[], treasure:{type:'money',nx:.5,pts:2000}, exitLadder:{nx:.2} },
    { hazards:[{type:'bat',nx:.42}], pits:[{nx:.6,nw:.13,type:'quicksand'}], treasure:{type:'gold',nx:.25,pts:4000}, exitLadder:{nx:.8} },
  ];
  return { surface, underground };
}

// ─── GAME STATE ──────────────────────────────────────────────
const STATE = { TITLE:0, PLAYING:1, DEAD:2, GAME_OVER:3, WIN:4 };
let gameState = STATE.TITLE;

const ROOM_COUNT    = 20;
const UG_COUNT      = 5;
const TIME_LIMIT    = 180; // 3 minutes
const TOTAL_TREASURES = 20; // treasures across surface + underground

let world = null;
let score, lives, timer, timerTick, roomIndex, ugRoomIndex, isUnderground;
let treasureCollected;
let roomOffset;        // pixels player has scrolled in current room
let roomStates;        // per-room collected/hazard state
let ugRoomStates;
let totalCollected;
let frameCount;
let crocTimer;

// Player object
const P = {
  x:0, y:0, vx:0, vy:0,
  w:0, h:0,                // set on resize
  onGround:false,
  state:'run',             // run|jump|swing|fall|dead
  dir:1,
  frame:0, frameTimer:0,
  invincible:0,
  vineIndex:-1,            // which vine player is swinging on (-1=none)
  vineAngle:0, vineVel:0,
  deadTimer:0,
};

// Live hazard objects (rebuilt each room)
let hazards = [];
let pits    = [];
let vines   = [];
let ladderObj = null;     // {x, topY, botY}
let exitLadderObj = null;
let treasureObj = null;   // {x,y,type,pts,collected}

// Croc animation
let crocMouth = false;

// ─── INPUT ───────────────────────────────────────────────────
const keys = { left:false, right:false, jump:false };
const justPressed = { jump:false };
let touchBtns = { left:false, right:false, jump:false };

// Keyboard
window.addEventListener('keydown', e => {
  if (e.key==='ArrowLeft'  || e.key==='a') keys.left=true;
  if (e.key==='ArrowRight' || e.key==='d') keys.right=true;
  if ((e.key===' '||e.key==='ArrowUp'||e.key==='w') && !keys.jump) { keys.jump=true; justPressed.jump=true; }
  if (e.key==='Enter' && (gameState===STATE.TITLE||gameState===STATE.GAME_OVER||gameState===STATE.WIN)) startGame();
});
window.addEventListener('keyup', e => {
  if (e.key==='ArrowLeft'  || e.key==='a') keys.left=false;
  if (e.key==='ArrowRight' || e.key==='d') keys.right=false;
  if (e.key===' '||e.key==='ArrowUp'||e.key==='w') keys.jump=false;
});

// Touch controls — build buttons after first render so we know W/H
let btnLeft, btnRight, btnJump;
function buildTouchButtons() {
  if (isPortrait()) {
    // Controls sit in the reserved bottom 30% of screen
    const ctrlTop = GAME_H + Math.floor((H - GAME_H) * 0.08);
    const ctrlH   = H - ctrlTop - Math.floor((H - GAME_H) * 0.08);
    const bh = Math.floor(ctrlH * 0.82);
    const bw = Math.floor(W * 0.27);
    const by = ctrlTop + Math.floor((ctrlH - bh) / 2);
    const pad = Math.floor(W * 0.03);
    btnLeft  = { x: pad,          y: by, w: bw, h: bh, label: '◀' };
    btnRight = { x: pad+bw+8,     y: by, w: bw, h: bh, label: '▶' };
    btnJump  = { x: W-bw-pad,     y: by, w: bw, h: bh, label: '▲' };
  } else {
    // Landscape: small overlay buttons in bottom corners
    const bh = Math.min(80, H * 0.22);
    const bw = Math.min(90, W * 0.14);
    const by = H - bh - Math.max(8, H * 0.03);
    const pad = Math.max(10, W * 0.02);
    btnLeft  = { x: pad,       y: by, w: bw, h: bh, label: '◀' };
    btnRight = { x: pad+bw+10, y: by, w: bw, h: bh, label: '▶' };
    btnJump  = { x: W-bw-pad,  y: by, w: bw, h: bh, label: '▲' };
  }
}

function ptInBtn(px, py, btn) {
  return px>=btn.x && px<=btn.x+btn.w && py>=btn.y && py<=btn.y+btn.h;
}

function updateTouchState(e) {
  e.preventDefault();
  touchBtns.left=false; touchBtns.right=false; touchBtns.jump=false;
  const wasJump = keys.jump;
  for (const t of e.touches) {
    const tx=t.clientX, ty=t.clientY;
    if (ptInBtn(tx,ty,btnLeft))  touchBtns.left=true;
    if (ptInBtn(tx,ty,btnRight)) touchBtns.right=true;
    if (ptInBtn(tx,ty,btnJump))  touchBtns.jump=true;
  }
  keys.left  = touchBtns.left;
  keys.right = touchBtns.right;
  if (touchBtns.jump && !wasJump) justPressed.jump=true;
  keys.jump  = touchBtns.jump;
}

canvas.addEventListener('touchstart',  e => {
  getAC(); // unlock audio on first touch
  if (gameState===STATE.TITLE||gameState===STATE.GAME_OVER||gameState===STATE.WIN) { startGame(); return; }
  updateTouchState(e);
}, {passive:false});
canvas.addEventListener('touchmove',   e => { updateTouchState(e); }, {passive:false});
canvas.addEventListener('touchend',    e => { updateTouchState(e); }, {passive:false});
canvas.addEventListener('touchcancel', e => { updateTouchState(e); }, {passive:false});

window.addEventListener('resize', () => { resize(); buildTouchButtons(); });

// ─── ROOM LOADER ─────────────────────────────────────────────
function loadRoom(ri, ug) {
  const template = ug ? world.underground[ri % UG_COUNT] : world.surface[ri % ROOM_COUNT];
  const rs = ug ? ugRoomStates[ri % UG_COUNT] : roomStates[ri % ROOM_COUNT];

  const groundY = ug ? GROUND_Y : GROUND_Y;
  const logR = Math.floor(GAME_H * 0.045);
  const pitH = GAME_H - groundY;

  // Build pits
  pits = (template.pits || []).map(p => ({
    x:  Math.floor(p.nx * W),
    w:  Math.floor(p.nw * W),
    y:  groundY,
    h:  pitH,
    type: p.type,
    crocs: p.crocs || 0,
  }));

  // Build hazards
  hazards = [];
  const tplHaz = template.hazards || [];
  tplHaz.forEach((h, hi) => {
    const hstate = rs.hazards[hi] || {};
    if (hstate.dead) return;
    const hx = Math.floor(h.nx * W);
    const hy = groundY;
    let speed = 1.2 + Math.random()*0.6;
    if (h.type === 'log') speed = 1.5 + Math.random()*0.5;
    if (h.type === 'bat') speed = 1.0 + Math.random()*0.4;
    hazards.push({
      type:  h.type,
      x:     hx,
      y:     hy,
      vx:    h.type==='bat' ? speed : -speed,
      frame: 0,
      frameTimer: 0,
      size:  h.type==='log' ? logR : Math.floor(GAME_H*0.025),
      radius: logR,
      mouthOpen: false,
      mouthTimer: 0,
      startX: hx,
    });
  });

  // Build vines
  vines = (template.vines || []).map(v => ({
    x:       Math.floor(v.nx * W),
    topY:    CEIL_Y,
    length:  groundY - CEIL_Y - 10,
    angle:   0,
    vel:     0,
  }));

  // Ladder
  if (template.ladder && !ug) {
    const lx = Math.floor(template.ladder.nx * W);
    ladderObj = { x:lx, topY:groundY-GAME_H*0.18, botY:groundY, w:20 };
  } else { ladderObj = null; }

  // Exit ladder (underground)
  if (template.exitLadder && ug) {
    const lx = Math.floor(template.exitLadder.nx * W);
    exitLadderObj = { x:lx, topY:groundY-GAME_H*0.18, botY:groundY, w:20 };
  } else { exitLadderObj = null; }

  // Treasure
  const tstate = ug ? ugRoomStates[ri % UG_COUNT].treasure : roomStates[ri % ROOM_COUNT].treasure;
  if (template.treasure && !tstate) {
    const tx = Math.floor(template.treasure.nx * W);
    treasureObj = { x:tx, y:groundY - Math.floor(GAME_H*0.05), type:template.treasure.type, pts:template.treasure.pts, collected:false };
  } else { treasureObj = null; }

  // Croc mouth timer
  crocTimer = 0;
  crocMouth = false;
}

// ─── INIT GAME ───────────────────────────────────────────────
function startGame() {
  world = buildWorld();
  score = 0;
  lives = 3;
  timer = TIME_LIMIT;
  timerTick = 0;
  roomIndex  = 0;
  ugRoomIndex = 0;
  isUnderground = false;
  totalCollected = 0;
  frameCount = 0;

  roomStates   = Array.from({length:ROOM_COUNT},   () => ({ treasure:false, hazards:[] }));
  ugRoomStates = Array.from({length:UG_COUNT}, () => ({ treasure:false, hazards:[] }));
  // Pre-fill hazard state arrays
  world.surface.forEach((r,i)   => { roomStates[i].hazards   = r.hazards.map(()=>({})); });
  world.underground.forEach((r,i)=>{ ugRoomStates[i].hazards = r.hazards.map(()=>({})); });

  spawnPlayer(true);
  loadRoom(roomIndex, false);
  buildTouchButtons();
  gameState = STATE.PLAYING;
}

function spawnPlayer(atStart) {
  P.w = Math.floor(GAME_H * 0.055);
  P.h = Math.floor(GAME_H * 0.12);
  P.x = atStart ? Math.floor(W * 0.12) : Math.floor(W * 0.12);
  P.y = GROUND_Y - P.h;
  P.vx = 0; P.vy = 0;
  P.onGround = true;
  P.state = 'run';
  P.dir = 1;
  P.frame = 0; P.frameTimer = 0;
  P.invincible = 120;
  P.vineIndex = -1;
  P.vineAngle = 0; P.vineVel = 0;
  P.deadTimer = 0;
}

// ─── UPDATE ──────────────────────────────────────────────────
const GRAVITY_VAL = 0.55;
const JUMP_VEL    = -13;
const MOVE_SPD    = 3.5;

function update() {
  if (gameState !== STATE.PLAYING) return;
  frameCount++;

  // Timer
  timerTick++;
  if (timerTick >= 60) { timerTick=0; timer--; }
  if (timer <= 0) { timer=0; triggerGameOver(); return; }

  // Croc mouths
  crocTimer++;
  if (crocTimer >= 90) { crocTimer=0; crocMouth=!crocMouth; }

  // Update hazards
  hazards.forEach(h => {
    h.frameTimer++;
    if (h.frameTimer>=15) { h.frame=(h.frame+1)%2; h.frameTimer=0; }

    if (h.type==='scorpion' || h.type==='bat') {
      h.x += h.vx;
      // bounce off walls / room edges
      if (h.x < 20 || h.x > W-20) h.vx *= -1;
      // bounce off pits for scorpions
      if (h.type==='scorpion') {
        for (const pit of pits) {
          if (h.vx<0 && h.x-h.size*2 < pit.x+pit.w && h.x > pit.x) h.vx=Math.abs(h.vx);
          if (h.vx>0 && h.x+h.size*2 > pit.x && h.x < pit.x+pit.w) h.vx=-Math.abs(h.vx);
        }
      }
    } else if (h.type==='log') {
      h.x += h.vx;
      if (h.x < h.radius) { h.x=h.radius; h.vx=Math.abs(h.vx); }
      if (h.x > W-h.radius) { h.x=W-h.radius; h.vx=-Math.abs(h.vx); }
    } else if (h.type==='croc') {
      h.mouthTimer++;
      if (h.mouthTimer>=60) { h.mouthTimer=0; h.mouthOpen=!h.mouthOpen; }
    }
  });

  // Vines
  vines.forEach(v => {
    if (P.vineIndex >= 0 && vines[P.vineIndex]===v) return; // handled with player
    v.angle += v.vel;
    v.vel   *= 0.98;
    v.vel   -= Math.sin(v.angle) * 0.015;
  });

  updatePlayer();
  checkCollisions();
}

function updatePlayer() {
  if (P.state === 'dead') {
    P.deadTimer++;
    if (P.deadTimer > 90) respawn();
    return;
  }

  const onVine = P.vineIndex >= 0;

  if (onVine) {
    // Vine swing physics
    const v = vines[P.vineIndex];
    if (keys.left)  P.vineVel -= 0.015;
    if (keys.right) P.vineVel += 0.015;
    P.vineVel -= Math.sin(P.vineAngle) * 0.02;
    P.vineVel *= 0.97;
    P.vineAngle += P.vineVel;
    v.angle = P.vineAngle;

    // Position player at bottom of vine
    P.x = v.x + Math.sin(P.vineAngle) * v.length - P.w/2;
    P.y = v.topY + v.length - P.h;

    // Release vine
    if (justPressed.jump) {
      P.vineIndex = -1;
      P.state = 'jump';
      P.vx = P.vineVel * 18;
      P.vy = -Math.abs(P.vx)*0.4 - 4;
      SFX.jump();
    }
    P.state = 'swing';
  } else {
    // Horizontal movement
    if (P.state !== 'fall') {
      if (keys.left)  { P.vx=-MOVE_SPD; P.dir=-1; }
      else if (keys.right) { P.vx=MOVE_SPD; P.dir=1; }
      else P.vx *= 0.7;
    }

    // Jump
    if (justPressed.jump && P.onGround) {
      P.vy = JUMP_VEL;
      P.onGround = false;
      P.state = 'jump';
      SFX.jump();
    }

    // Gravity
    P.vy += GRAVITY_VAL;
    P.x  += P.vx;
    P.y  += P.vy;

    // Screen wrapping (left edge goes to previous room, right edge to next room)
    if (P.x + P.w < 0) {
      // Go left to previous room
      roomIndex = (roomIndex - 1 + ROOM_COUNT) % ROOM_COUNT;
      P.x = W - P.w - 2;
      loadRoom(roomIndex, isUnderground);
    } else if (P.x > W) {
      // Go right to next room
      roomIndex = (roomIndex + 1) % ROOM_COUNT;
      P.x = 2;
      loadRoom(roomIndex, isUnderground);
    }

    // Ground collision (check pits)
    let onPit = false;
    let pitType = null;
    for (const pit of pits) {
      if (P.x+P.w > pit.x+8 && P.x < pit.x+pit.w-8) {
        if (P.y+P.h > pit.y) {
          onPit = true;
          pitType = pit.type;
          break;
        }
      }
    }

    const groundY = GROUND_Y;

    if (!onPit && P.y + P.h >= groundY) {
      const wasAir = !P.onGround;
      P.y = groundY - P.h;
      P.vy = 0;
      P.onGround = true;
      if (wasAir && P.state!=='run') { P.state='run'; SFX.land(); }
      else if (P.state==='jump') P.state='run';
    } else if (onPit && P.y + P.h > groundY + P.h) {
      // Fallen into pit
      if (pitType === 'quicksand') {
        // Slow sink
        P.vx = 0;
        P.vy = Math.min(P.vy, 1.5);
        P.state = 'fall';
        if (P.y > groundY + P.h*2) triggerDeath();
      } else {
        // Water — instant if no log
        P.state = 'fall';
        if (P.y > groundY + P.h) triggerDeath();
      }
      P.onGround = false;
    } else if (P.y + P.h < groundY) {
      P.onGround = false;
      if (P.vy > 0 && P.state!=='jump') P.state='jump';
    }

    // Ceiling
    if (P.y < CEIL_Y + (isUnderground ? H*0.08 : 0)) {
      P.y = CEIL_Y + (isUnderground ? H*0.08 : 0);
      P.vy = Math.max(0, P.vy);
    }

    // Clamp horizontal in underground
    P.x = Math.max(-P.w+2, Math.min(W-2, P.x));

    // Running animation
    if (P.onGround && (keys.left || keys.right)) {
      P.frameTimer++;
      if (P.frameTimer>=10) { P.frame=(P.frame+1)%4; P.frameTimer=0; }
    } else if (P.onGround) {
      P.frame=0; P.frameTimer=0;
    }
  }

  justPressed.jump = false;

  // Invincibility countdown
  if (P.invincible > 0) P.invincible--;

  // Ladder: go underground
  if (ladderObj && !isUnderground && P.onGround) {
    const lx = ladderObj.x;
    if (Math.abs((P.x+P.w/2)-lx) < 18 && keys.jump===false && justPressed.jump===false) {
      // Check if player is pressing down (no key for that — use auto-enter via overlap)
    }
    // Enter underground if player overlaps ladder and presses down (we use left+right simultaneously as "down")
    if (Math.abs((P.x+P.w/2)-lx) < 20 && keys.left && keys.right) {
      enterUnderground();
    }
  }
  // Exit underground
  if (exitLadderObj && isUnderground && P.onGround) {
    const lx = exitLadderObj.x;
    if (Math.abs((P.x+P.w/2)-lx) < 20 && keys.left && keys.right) {
      exitUnderground();
    }
  }
}

function enterUnderground() {
  isUnderground = true;
  ugRoomIndex = roomIndex % UG_COUNT;
  P.y = GROUND_Y - P.h;
  P.vy = 0;
  loadRoom(ugRoomIndex, true);
  SFX.ladder();
}

function exitUnderground() {
  isUnderground = false;
  P.y = GROUND_Y - P.h;
  P.vy = 0;
  loadRoom(roomIndex, false);
  SFX.ladder();
}

function checkCollisions() {
  if (P.invincible > 0 || P.state==='dead') return;
  const px = P.x, py = P.y, pw = P.w, ph = P.h;

  // Hazards
  hazards.forEach(h => {
    let hx=h.x, hy=h.y, hs=h.size;
    let hit = false;
    if (h.type==='log') {
      hit = circRectOverlap(hx, hy-hs, hs, px, py, pw, ph);
    } else if (h.type==='scorpion'||h.type==='bat') {
      hit = rectOverlap(hx-hs*3, hy-hs*4, hs*6, hs*5, px, py, pw, ph);
    }
    if (hit) {
      if (h.type==='log' && P.state==='jump' && py+ph < hy-hs+6) {
        // Jump over log — safe
      } else {
        triggerDeath();
      }
    }
  });

  // Crocs in pits
  if (crocMouth) {
    pits.forEach(pit => {
      if (pit.crocs && pit.crocs > 0) {
        const spacing = pit.w / pit.crocs;
        for (let i=0;i<pit.crocs;i++) {
          const cx = pit.x + spacing*(i+0.5);
          const cs = Math.floor(GAME_H*0.03);
          if (rectOverlap(cx-cs*5,pit.y-cs*3,cs*10,cs*4, px,py,pw,ph)) {
            triggerDeath(); return;
          }
        }
      }
    });
  }

  // Vines — grab if jumping near
  if (!P.onGround && P.state!=='swing' && P.vineIndex<0) {
    vines.forEach((v, vi) => {
      const vineX = v.x + Math.sin(v.angle)*v.length*0.5;
      const vineY = v.topY + v.length*0.5;
      if (Math.abs((px+pw/2)-v.x) < 18 && py < GROUND_Y-P.h*0.5) {
        P.vineIndex  = vi;
        P.vineAngle  = v.angle;
        P.vineVel    = P.vx / 18;
        P.state      = 'swing';
        SFX.swing();
      }
    });
  }

  // Treasure
  if (treasureObj && !treasureObj.collected) {
    if (rectOverlap(treasureObj.x-15,treasureObj.y-15,30,30, px,py,pw,ph)) {
      collectTreasure();
    }
  }
}

function circRectOverlap(cx, cy, r, rx, ry, rw, rh) {
  const nearX = Math.max(rx, Math.min(cx, rx+rw));
  const nearY = Math.max(ry, Math.min(cy, ry+rh));
  const dx=cx-nearX, dy=cy-nearY;
  return dx*dx+dy*dy < r*r;
}
function rectOverlap(ax,ay,aw,ah,bx,by,bw,bh) {
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}

function collectTreasure() {
  score += treasureObj.pts;
  treasureObj.collected = true;
  totalCollected++;
  SFX.collect();
  const ri = isUnderground ? ugRoomIndex%UG_COUNT : roomIndex%ROOM_COUNT;
  if (isUnderground) ugRoomStates[ri].treasure=true;
  else               roomStates[ri].treasure=true;
  if (totalCollected >= TOTAL_TREASURES) { triggerWin(); }
}

function triggerDeath() {
  if (P.invincible > 0 || P.state==='dead') return;
  lives--;
  P.state = 'dead';
  P.deadTimer = 0;
  P.vx = 0; P.vy = 0;
  score = Math.max(0, score - 100);
  SFX.die();
  if (lives <= 0) {
    setTimeout(triggerGameOver, 1500);
  }
}

function respawn() {
  if (lives <= 0) return;
  spawnPlayer(false);
  loadRoom(roomIndex, isUnderground);
}

function triggerGameOver() {
  gameState = STATE.GAME_OVER;
  SFX.gameOver();
}

function triggerWin() {
  score += timer * 100; // time bonus
  gameState = STATE.WIN;
  SFX.win();
}

// ─── RENDER ──────────────────────────────────────────────────
function render() {
  ctx.clearRect(0,0,W,H);
  if (gameState===STATE.TITLE)    { drawTitle(); return; }
  if (gameState===STATE.GAME_OVER){ drawGameOver(); return; }
  if (gameState===STATE.WIN)      { drawWin(); return; }

  // Background
  if (isUnderground) drawUndergroundBG();
  else               drawSurfaceBG();

  drawPits();
  drawVines();
  if (ladderObj)     drawLadder(ladderObj.x, ladderObj.topY, ladderObj.botY, ladderObj.w);
  if (exitLadderObj) drawLadder(exitLadderObj.x, exitLadderObj.topY, exitLadderObj.botY, exitLadderObj.w);
  drawHazards();
  if (treasureObj && !treasureObj.collected) {
    drawTreasure(treasureObj.x, treasureObj.y, treasureObj.type, Math.floor(H*0.028));
  }
  drawPlayerSprite();
  drawHUD();
  drawTouchButtons();
}

function drawSurfaceBG() {
  // Sky gradient effect (flat for 8-bit)
  px(0, 0, W, GROUND_Y, COL.sky);

  // Sun
  const sx = W*0.85, sy = H*0.09, sr = Math.floor(H*0.045);
  ctx.fillStyle = COL.sun;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();

  // Trees in background (simple 8-bit)
  for (let i=0; i<6; i++) {
    const tx = ((i * W/5 + frameCount*0.2) % (W+60)) - 30;
    const th = H * 0.25;
    const tw = H * 0.08;
    px(tx-Math.floor(tw*0.25), GROUND_Y-th, Math.floor(tw*0.5), th, COL.jungle2);
    px(tx-Math.floor(tw*0.5), GROUND_Y-th-H*0.1, tw, H*0.15, COL.jungle1);
    px(tx-Math.floor(tw*0.35), GROUND_Y-th-H*0.2, Math.floor(tw*0.7), H*0.12, COL.jungle2);
  }

  // Ground
  px(0, GROUND_Y, W, H-GROUND_Y, COL.ground);
  px(0, GROUND_Y, W, Math.floor(H*0.025), COL.grass);
  // Grass tufts
  for (let i=0; i<W; i+=12) {
    const gtx = (i + frameCount*MOVE_SPD*0) % W;
    ctx.fillStyle = (Math.floor(i/12)%2===0) ? COL.grass : COL.grassDk;
    ctx.fillRect(gtx, GROUND_Y-3, 6, 6);
  }
}

function drawUndergroundBG() {
  // Dark underground
  px(0, 0, W, H, COL.underground);
  px(0, GROUND_Y, W, H-GROUND_Y, COL.ugGround);
  px(0, GROUND_Y, W, Math.floor(H*0.02), COL.ugGrass);
  // Ceiling
  px(0, 0, W, CEIL_Y+GAME_H*0.05, COL.ugGround);
  px(0, CEIL_Y+GAME_H*0.05-4, W, 4, COL.ugGrass);
  // Stalactites
  ctx.fillStyle = COL.ugGround;
  for (let i=0; i<W; i+=40) {
    const sh = 10 + (i%80===0?8:0);
    ctx.beginPath();
    ctx.moveTo(i, CEIL_Y+GAME_H*0.05);
    ctx.lineTo(i+15, CEIL_Y+GAME_H*0.05+sh);
    ctx.lineTo(i+30, CEIL_Y+GAME_H*0.05);
    ctx.fill();
  }
}

function drawPits() {
  pits.forEach(pit => {
    // Pit fill
    if (pit.type==='water') {
      px(pit.x, pit.y, pit.w, pit.h, COL.water);
      // animated water shimmer
      const wshift = Math.floor((frameCount*2) % pit.w);
      for (let wx=pit.x; wx<pit.x+pit.w; wx+=16) {
        px(wx, pit.y+4, 8, 3, COL.waterLt);
      }
      // Crocs over water pits
      if (pit.crocs) {
        const spacing = pit.w / pit.crocs;
        const cs = Math.floor(H*0.03);
        for (let i=0; i<pit.crocs; i++) {
          const cx = pit.x + spacing*(i+0.5);
          drawCroc(cx, pit.y - cs, cs, crocMouth);
        }
      }
    } else if (pit.type==='quicksand') {
      px(pit.x, pit.y, pit.w, pit.h, COL.quicksand);
      // bubbles
      if (frameCount%30<15) {
        ctx.fillStyle = 'rgba(200,160,60,0.6)';
        ctx.beginPath();
        ctx.arc(pit.x+pit.w*0.3, pit.y+8, 5, 0, Math.PI*2);
        ctx.arc(pit.x+pit.w*0.7, pit.y+5, 4, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });
}

function drawVines() {
  vines.forEach((v, vi) => {
    const ang = (P.vineIndex===vi) ? P.vineAngle : v.angle;
    drawVine(v.x, v.topY, v.length, ang);
  });
}

function drawHazards() {
  hazards.forEach(h => {
    const s = h.size;
    if (h.type==='log') {
      ctx.save();
      ctx.translate(h.x, h.y - s);
      ctx.rotate(frameCount * 0.05 * Math.sign(h.vx));
      drawLog(0, 0, s);
      ctx.restore();
    } else if (h.type==='scorpion') {
      drawScorpion(h.x, h.y, s, h.frame);
    } else if (h.type==='bat') {
      drawBat(h.x, Math.floor(GROUND_Y*0.5 + Math.sin(frameCount*0.04)*GAME_H*0.05), s, h.frame);
    }
  });
}

function drawPlayerSprite() {
  if (P.invincible > 0 && Math.floor(P.invincible/6)%2===1) return; // blink
  const s = Math.max(1, Math.floor(H/22));
  drawPlayer(Math.floor(P.x), Math.floor(P.y+P.h), P.dir, P.frame, P.state);
}

function drawHUD() {
  const hudH = Math.floor(CEIL_Y * 0.95);
  px(0, 0, W, hudH, COL.hud);
  ctx.fillStyle = COL.hudText;
  ctx.font = `bold ${Math.floor(GAME_H*0.033)}px 'Courier New', monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score.toString().padStart(6,'0')}`, Math.floor(W*0.02), Math.floor(hudH*0.75));
  ctx.textAlign = 'center';
  const mm = Math.floor(timer/60).toString().padStart(2,'0');
  const ss = (timer%60).toString().padStart(2,'0');
  ctx.fillStyle = timer<=30 ? (frameCount%20<10 ? '#ff4040' : COL.hudText) : COL.hudText;
  ctx.fillText(`${mm}:${ss}`, W/2, Math.floor(hudH*0.75));
  ctx.fillStyle = COL.hudText;
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES ${'♥'.repeat(lives)}`, W-Math.floor(W*0.02), Math.floor(hudH*0.75));
  // Room / treasure count
  ctx.font = `${Math.floor(H*0.022)}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a0a0ff';
  ctx.fillText(`ROOM ${(roomIndex+1).toString().padStart(2,'0')}/20  TREASURE ${totalCollected}/${TOTAL_TREASURES}`, W/2, Math.floor(hudH*0.45));
}

function drawTouchButtons() {
  if (!btnLeft) return;
  // In portrait, draw a solid control panel below the game area
  if (isPortrait()) {
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, GAME_H, W, H - GAME_H);
    ctx.fillStyle = '#333355';
    ctx.fillRect(0, GAME_H, W, 3);
  }
  const alpha = isPortrait() ? 0.85 : 0.55;
  [btnLeft, btnRight, btnJump].forEach(btn => {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    roundRect(btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.floor(btn.h*0.45)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x+btn.w/2, btn.y+btn.h/2);
  });
  ctx.textBaseline = 'alphabetic';

  // Hint for ladder
  if ((ladderObj||exitLadderObj) && gameState===STATE.PLAYING) {
    const lobj = ladderObj || exitLadderObj;
    const lsx = lobj.x;
    if (Math.abs((P.x+P.w/2)-lsx) < 60 && P.onGround) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(lsx-70, GROUND_Y-60, 140, 28);
      ctx.fillStyle='#ffff00'; ctx.font=`${Math.floor(H*0.022)}px monospace`;
      ctx.textAlign='center';
      ctx.fillText(isUnderground ? '◀▶ EXIT' : '◀▶ DESCEND', lsx, GROUND_Y-42);
    }
  }
}

function roundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ─── TITLE / GAME OVER / WIN SCREENS ─────────────────────────
function drawTitle() {
  // BG
  px(0,0,W,H,COL.sky);
  drawSurfaceBG();
  // Dark overlay
  ctx.fillStyle='rgba(0,0,20,0.72)'; ctx.fillRect(0,0,W,H);

  const cx=W/2, fs=Math.min(W*0.06, H*0.1);
  ctx.textAlign='center';

  ctx.fillStyle='#ffdd00';
  ctx.font=`bold ${Math.floor(fs*1.6)}px 'Courier New',monospace`;
  ctx.fillText('PITFALL!', cx, H*0.28);

  ctx.fillStyle='#40ff40';
  ctx.font=`bold ${Math.floor(fs*0.65)}px 'Courier New',monospace`;
  ctx.fillText('8-BIT JUNGLE ADVENTURE', cx, H*0.42);

  ctx.fillStyle='#ffffff';
  ctx.font=`${Math.floor(fs*0.52)}px 'Courier New',monospace`;
  ctx.fillText('COLLECT ALL 20 TREASURES', cx, H*0.54);
  ctx.fillText('AVOID LOGS · SCORPIONS · CROCS', cx, H*0.62);
  ctx.fillText('GRAB VINES TO CROSS PITS', cx, H*0.7);

  if (Math.floor(frameCount/30)%2===0) {
    ctx.fillStyle='#ffff00';
    ctx.font=`bold ${Math.floor(fs*0.6)}px 'Courier New',monospace`;
    ctx.fillText('TAP OR PRESS ENTER TO START', cx, H*0.84);
  }

  drawTouchButtons();
}

function drawGameOver() {
  ctx.fillStyle='#000010'; ctx.fillRect(0,0,W,H);
  const cx=W/2, fs=Math.min(W*0.07,H*0.11);
  ctx.textAlign='center';

  ctx.fillStyle='#ff2020';
  ctx.font=`bold ${Math.floor(fs*1.4)}px 'Courier New',monospace`;
  ctx.fillText('GAME OVER', cx, H*0.3);

  ctx.fillStyle='#ffff40';
  ctx.font=`bold ${Math.floor(fs*0.7)}px 'Courier New',monospace`;
  ctx.fillText(`FINAL SCORE: ${score.toString().padStart(6,'0')}`, cx, H*0.5);
  ctx.fillText(`TREASURES: ${totalCollected}/${TOTAL_TREASURES}`, cx, H*0.62);

  if (Math.floor(frameCount/30)%2===0) {
    ctx.fillStyle='#ffffff';
    ctx.font=`${Math.floor(fs*0.52)}px 'Courier New',monospace`;
    ctx.fillText('TAP OR PRESS ENTER TO RETRY', cx, H*0.8);
  }
  drawTouchButtons();
}

function drawWin() {
  ctx.fillStyle='#001000'; ctx.fillRect(0,0,W,H);
  const cx=W/2, fs=Math.min(W*0.06,H*0.1);
  ctx.textAlign='center';

  ctx.fillStyle='#ffdd00';
  ctx.font=`bold ${Math.floor(fs*1.3)}px 'Courier New',monospace`;
  ctx.fillText('YOU WIN!', cx, H*0.22);

  ctx.fillStyle='#40ff80';
  ctx.font=`bold ${Math.floor(fs*0.65)}px 'Courier New',monospace`;
  ctx.fillText('ALL TREASURES FOUND!', cx, H*0.37);

  ctx.fillStyle='#ffff40';
  ctx.font=`bold ${Math.floor(fs*0.7)}px 'Courier New',monospace`;
  ctx.fillText(`FINAL SCORE: ${score.toString().padStart(6,'0')}`, cx, H*0.52);
  ctx.fillText(`TIME BONUS: ${(timer*100).toString().padStart(6,'0')}`, cx, H*0.63);

  if (Math.floor(frameCount/30)%2===0) {
    ctx.fillStyle='#ffffff';
    ctx.font=`${Math.floor(fs*0.52)}px 'Courier New',monospace`;
    ctx.fillText('TAP OR PRESS ENTER TO PLAY AGAIN', cx, H*0.82);
  }
  drawTouchButtons();
}

// ─── GAME LOOP ───────────────────────────────────────────────
let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;
let accumulator = 0;

function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;
  accumulator += dt;
  while (accumulator >= FRAME_MS) {
    update();
    accumulator -= FRAME_MS;
  }
  render();
}

buildTouchButtons();
requestAnimationFrame(ts => { lastTime=ts; requestAnimationFrame(loop); });
