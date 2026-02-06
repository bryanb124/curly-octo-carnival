// ============================================================
// SPACE INVADERS - 8-BIT EDITION
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;   // 480
const H = canvas.height;  // 560

// ---- Sprite Data (8-bit pixel art as 2D arrays) ----
// 1 = filled pixel, 0 = empty

const SPRITES = {
  // 11x8 squid (top-row invader)
  invader1A: [
    [0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,0,0,0,1,0,1,0,0,0,0],
  ],
  invader1B: [
    [0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,0,1,0,1,0,1,0,0],
    [0,1,0,1,0,0,0,1,0,1,0],
  ],

  // 12x8 crab (middle-row invader)
  invader2A: [
    [0,0,1,0,0,0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,0],
    [0,1,1,0,1,1,1,0,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0],
    [1,0,1,1,1,1,1,1,1,0,1,0],
    [1,0,1,0,0,0,0,0,1,0,1,0],
    [0,0,0,1,1,0,1,1,0,0,0,0],
  ],
  invader2B: [
    [0,0,1,0,0,0,0,0,1,0,0,0],
    [1,0,0,1,0,0,0,1,0,0,1,0],
    [1,0,1,1,1,1,1,1,1,0,1,0],
    [1,1,1,0,1,1,1,0,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0,0],
    [0,1,0,0,0,0,0,0,0,1,0,0],
  ],

  // 8x8 octopus (bottom-row invader)
  invader3A: [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1],
  ],
  invader3B: [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,0,0,0,1,0],
    [1,0,0,1,1,0,0,1],
    [0,1,0,0,0,0,1,0],
  ],

  // Player ship 13x8
  player: [
    [0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],

  // UFO 16x7
  ufo: [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
  ],

  // Explosion 13x8
  explosion: [
    [0,0,0,0,1,0,0,0,1,0,0,0,0],
    [0,1,0,0,0,1,0,1,0,0,0,1,0],
    [0,0,1,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,1,0,1,0,0,0,1,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0],
  ],

  // Shield block 22x16
  shield: [
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  ],
};

// ---- Pixel scale for rendering ----
const PX = 3;  // each sprite pixel = 3x3 screen pixels

// ---- Sound effects (generated with Web Audio API) ----
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'shoot':
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'invaderKill':
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'playerDeath':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'ufo':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.1);
      osc.frequency.linearRampToValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'invaderStep':
      osc.type = 'square';
      osc.frequency.setValueAtTime(80 + Math.random() * 40, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
  }
}

// ---- Drawing helpers ----
function drawSprite(sprite, x, y, color, scale) {
  const s = scale || PX;
  ctx.fillStyle = color;
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col]) {
        ctx.fillRect(x + col * s, y + row * s, s, s);
      }
    }
  }
}

function drawSpriteFromData(data, x, y, color, scale) {
  const s = scale || PX;
  ctx.fillStyle = color;
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      if (data[row][col]) {
        ctx.fillRect(x + col * s, y + row * s, s, s);
      }
    }
  }
}

// ---- Game State ----
const GameState = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  PLAYER_DEATH: 'player_death',
  GAME_OVER: 'game_over',
  LEVEL_CLEAR: 'level_clear',
};

let state = GameState.TITLE;
let score = 0;
let hiScore = parseInt(localStorage.getItem('siHiScore')) || 0;
let lives = 3;
let level = 1;

// ---- Player ----
const player = {
  x: W / 2 - (13 * PX) / 2,
  y: H - 50,
  w: 13 * PX,
  h: 8 * PX,
  speed: 4,
  alive: true,
  deathTimer: 0,
};

// ---- Bullets ----
let playerBullets = [];
let enemyBullets = [];

const PLAYER_BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 3;

// ---- Invaders ----
const INVADER_ROWS = 5;
const INVADER_COLS = 11;
const INVADER_H_GAP = 40;
const INVADER_V_GAP = 36;

let invaders = [];
let invaderDir = 1;
let invaderSpeed = 0.5;
let invaderMoveTimer = 0;
let invaderMoveInterval = 45; // frames between moves
let invaderAnimFrame = 0;
let invaderShootTimer = 0;
let invaderShootInterval = 60;

// ---- Shields ----
let shields = [];

// ---- UFO ----
let ufo = null;
let ufoTimer = 0;
let ufoSoundTimer = 0;
const UFO_INTERVAL = 900; // frames between UFO spawns
const UFO_SCORES = [50, 100, 150, 200, 300];

// ---- Explosions ----
let explosions = [];

// ---- Stars background ----
let stars = [];

// ---- Input ----
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (state === GameState.TITLE && e.key === ' ') {
    initAudio();
    startGame();
    e.preventDefault();
  } else if (state === GameState.GAME_OVER && e.key === ' ') {
    resetToTitle();
    e.preventDefault();
  } else if (state === GameState.PLAYING && e.key === 'p') {
    state = GameState.PAUSED;
  } else if (state === GameState.PAUSED && e.key === 'p') {
    state = GameState.PLAYING;
  }

  if (e.key === ' ') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// ---- Touch Input ----
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function setupTouchButton(btnId, keyName) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys[keyName] = true;
    btn.classList.add('active');
  }, { passive: false });

  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys[keyName] = false;
    btn.classList.remove('active');
  }, { passive: false });

  btn.addEventListener('touchcancel', (e) => {
    keys[keyName] = false;
    btn.classList.remove('active');
  });

  // Prevent mousedown fallback from interfering
  btn.addEventListener('mousedown', (e) => e.preventDefault());
}

setupTouchButton('btn-left', 'ArrowLeft');
setupTouchButton('btn-right', 'ArrowRight');
setupTouchButton('btn-fire', ' ');

// Tap on overlays to start / restart
document.getElementById('overlay').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state === GameState.TITLE) {
    initAudio();
    startGame();
  }
}, { passive: false });

document.getElementById('overlay').addEventListener('click', () => {
  if (state === GameState.TITLE) {
    initAudio();
    startGame();
  }
});

document.getElementById('game-over-overlay').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state === GameState.GAME_OVER) {
    resetToTitle();
  }
}, { passive: false });

document.getElementById('game-over-overlay').addEventListener('click', () => {
  if (state === GameState.GAME_OVER) {
    resetToTitle();
  }
});

// Prevent iOS scroll / zoom / bounce on the game area
document.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

// Tap canvas to pause/resume (touch devices)
canvas.addEventListener('touchstart', (e) => {
  if (state === GameState.PLAYING) {
    state = GameState.PAUSED;
    e.preventDefault();
  } else if (state === GameState.PAUSED) {
    state = GameState.PLAYING;
    e.preventDefault();
  }
}, { passive: false });

// ---- Init functions ----
function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() < 0.5 ? 1 : 2,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}

function initInvaders() {
  invaders = [];
  const startX = 30;
  const startY = 60;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      let type, points;
      if (row === 0) { type = 1; points = 30; }
      else if (row <= 2) { type = 2; points = 20; }
      else { type = 3; points = 10; }

      invaders.push({
        x: startX + col * INVADER_H_GAP,
        y: startY + row * INVADER_V_GAP,
        type,
        points,
        alive: true,
        row,
        col,
      });
    }
  }

  invaderDir = 1;
  invaderSpeed = 0.5 + (level - 1) * 0.15;
  invaderMoveTimer = 0;
  invaderMoveInterval = Math.max(10, 45 - (level - 1) * 5);
  invaderAnimFrame = 0;
  invaderShootTimer = 0;
  invaderShootInterval = Math.max(20, 60 - (level - 1) * 5);
}

function initShields() {
  shields = [];
  const shieldY = H - 130;
  const positions = [55, 160, 265, 370];

  for (const sx of positions) {
    // Store shield as pixel data (mutable copy)
    const data = SPRITES.shield.map(row => [...row]);
    shields.push({ x: sx, y: shieldY, data });
  }
}

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  playerBullets = [];
  enemyBullets = [];
  explosions = [];
  ufo = null;
  ufoTimer = 0;
  player.x = W / 2 - player.w / 2;
  player.alive = true;
  player.deathTimer = 0;

  initInvaders();
  initShields();

  document.getElementById('overlay').classList.remove('visible');
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('game-over-overlay').classList.remove('visible');
  document.getElementById('game-over-overlay').classList.add('hidden');

  state = GameState.PLAYING;
  updateScoreDisplay();
}

function nextLevel() {
  level++;
  playerBullets = [];
  enemyBullets = [];
  explosions = [];
  ufo = null;
  ufoTimer = 0;
  player.x = W / 2 - player.w / 2;
  player.alive = true;

  initInvaders();
  // Keep shields from previous level

  state = GameState.PLAYING;
}

function resetToTitle() {
  document.getElementById('game-over-overlay').classList.remove('visible');
  document.getElementById('game-over-overlay').classList.add('hidden');
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('overlay').classList.add('visible');
  state = GameState.TITLE;
}

function gameOver() {
  state = GameState.GAME_OVER;
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('siHiScore', hiScore);
  }
  document.getElementById('game-over-text').textContent = 'GAME OVER';
  document.getElementById('final-score').textContent = `SCORE: ${String(score).padStart(4, '0')}`;
  document.getElementById('game-over-overlay').classList.remove('hidden');
  document.getElementById('game-over-overlay').classList.add('visible');
}

// ---- UI ----
function updateScoreDisplay() {
  document.getElementById('score').textContent = String(score).padStart(4, '0');
  document.getElementById('hiscore').textContent = String(hiScore).padStart(4, '0');

  // Lives as ship icons (text representation)
  let livesStr = '';
  for (let i = 0; i < lives; i++) livesStr += '\u25B2 ';
  document.getElementById('lives').textContent = livesStr.trim();
}

// ---- Update ----
function update() {
  if (state !== GameState.PLAYING && state !== GameState.PLAYER_DEATH && state !== GameState.LEVEL_CLEAR) return;

  // Player death animation
  if (state === GameState.PLAYER_DEATH) {
    player.deathTimer--;
    if (player.deathTimer <= 0) {
      lives--;
      updateScoreDisplay();
      if (lives <= 0) {
        gameOver();
        return;
      }
      player.x = W / 2 - player.w / 2;
      player.alive = true;
      enemyBullets = [];
      state = GameState.PLAYING;
    }
    updateExplosions();
    return;
  }

  // Level clear
  if (state === GameState.LEVEL_CLEAR) {
    player.deathTimer--;
    if (player.deathTimer <= 0) {
      nextLevel();
    }
    return;
  }

  // --- Player movement ---
  if (player.alive) {
    if (keys['ArrowLeft'] || keys['a']) {
      player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
      player.x += player.speed;
    }
    player.x = Math.max(5, Math.min(W - player.w - 5, player.x));

    // Shoot
    if (keys[' '] && playerBullets.length < 2) {
      // Check fire rate
      const canShoot = playerBullets.every(b => b.y < player.y - 30);
      if (canShoot) {
        playerBullets.push({
          x: player.x + player.w / 2 - 1.5,
          y: player.y - 4,
          w: 3,
          h: 10,
        });
        playSound('shoot');
      }
    }
  }

  // --- Player bullets ---
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    b.y -= PLAYER_BULLET_SPEED;
    if (b.y + b.h < 0) {
      playerBullets.splice(i, 1);
      continue;
    }

    // Hit invader?
    let hitInvader = false;
    for (const inv of invaders) {
      if (!inv.alive) continue;
      const iw = getInvaderWidth(inv.type) * PX;
      const ih = 8 * PX;
      if (rectCollide(b.x, b.y, b.w, b.h, inv.x, inv.y, iw, ih)) {
        inv.alive = false;
        score += inv.points;
        updateScoreDisplay();
        explosions.push({ x: inv.x, y: inv.y, timer: 15 });
        playSound('invaderKill');
        playerBullets.splice(i, 1);
        hitInvader = true;

        // Speed up remaining invaders
        const aliveCount = invaders.filter(v => v.alive).length;
        if (aliveCount > 0) {
          invaderMoveInterval = Math.max(1, Math.floor(3 + aliveCount * 0.7));
        }
        break;
      }
    }
    if (hitInvader) continue;

    // Hit UFO?
    if (ufo && !hitInvader) {
      const uw = 16 * PX;
      const uh = 7 * PX;
      if (rectCollide(b.x, b.y, b.w, b.h, ufo.x, ufo.y, uw, uh)) {
        const ufoScore = UFO_SCORES[Math.floor(Math.random() * UFO_SCORES.length)];
        score += ufoScore;
        updateScoreDisplay();
        explosions.push({ x: ufo.x, y: ufo.y, timer: 20, text: String(ufoScore) });
        playSound('invaderKill');
        playerBullets.splice(i, 1);
        ufo = null;
        continue;
      }
    }

    // Hit shield?
    if (!hitInvader) {
      checkBulletShieldCollision(b, i, playerBullets);
    }
  }

  // --- Check level clear ---
  if (invaders.filter(v => v.alive).length === 0) {
    state = GameState.LEVEL_CLEAR;
    player.deathTimer = 60;
    return;
  }

  // --- Invader movement ---
  invaderMoveTimer++;
  if (invaderMoveTimer >= invaderMoveInterval) {
    invaderMoveTimer = 0;
    invaderAnimFrame = 1 - invaderAnimFrame;
    playSound('invaderStep');

    let hitEdge = false;
    const aliveInvaders = invaders.filter(v => v.alive);

    // Move horizontally
    for (const inv of aliveInvaders) {
      inv.x += invaderDir * (8 + invaderSpeed);
    }

    // Check edges
    for (const inv of aliveInvaders) {
      const iw = getInvaderWidth(inv.type) * PX;
      if (inv.x + iw > W - 10 || inv.x < 10) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      invaderDir *= -1;
      for (const inv of aliveInvaders) {
        inv.y += 12;
      }
    }

    // Check if invaders reached player
    for (const inv of aliveInvaders) {
      if (inv.y + 8 * PX >= player.y) {
        gameOver();
        return;
      }
    }
  }

  // --- Invader shooting ---
  invaderShootTimer++;
  if (invaderShootTimer >= invaderShootInterval) {
    invaderShootTimer = 0;

    // Get bottom-most invader in each column
    const bottomInvaders = [];
    for (let col = 0; col < INVADER_COLS; col++) {
      let bottom = null;
      for (const inv of invaders) {
        if (inv.alive && inv.col === col) {
          if (!bottom || inv.row > bottom.row) {
            bottom = inv;
          }
        }
      }
      if (bottom) bottomInvaders.push(bottom);
    }

    if (bottomInvaders.length > 0) {
      const shooter = bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)];
      const iw = getInvaderWidth(shooter.type) * PX;
      enemyBullets.push({
        x: shooter.x + iw / 2 - 1.5,
        y: shooter.y + 8 * PX,
        w: 3,
        h: 10,
      });
    }
  }

  // --- Enemy bullets ---
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += ENEMY_BULLET_SPEED;
    if (b.y > H) {
      enemyBullets.splice(i, 1);
      continue;
    }

    // Hit player?
    if (player.alive && rectCollide(b.x, b.y, b.w, b.h, player.x, player.y, player.w, player.h)) {
      enemyBullets.splice(i, 1);
      playerHit();
      continue;
    }

    // Hit shield?
    checkBulletShieldCollision(b, i, enemyBullets);
  }

  // --- UFO ---
  ufoTimer++;
  if (!ufo && ufoTimer >= UFO_INTERVAL) {
    ufoTimer = 0;
    ufo = {
      x: Math.random() < 0.5 ? -50 : W + 50,
      y: 25,
      dir: 0,
    };
    ufo.dir = ufo.x < 0 ? 1 : -1;
  }
  if (ufo) {
    ufo.x += ufo.dir * 2;
    ufoSoundTimer++;
    if (ufoSoundTimer >= 15) {
      ufoSoundTimer = 0;
      playSound('ufo');
    }
    if (ufo.x > W + 60 || ufo.x < -60) {
      ufo = null;
    }
  }

  // --- Invader-shield collision ---
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const iw = getInvaderWidth(inv.type) * PX;
    const ih = 8 * PX;
    for (const shield of shields) {
      const sw = shield.data[0].length * PX;
      const sh = shield.data.length * PX;
      if (rectCollide(inv.x, inv.y, iw, ih, shield.x, shield.y, sw, sh)) {
        // Destroy overlapping shield pixels
        erodeShield(shield, inv.x, inv.y, iw, ih);
      }
    }
  }

  // --- Explosions ---
  updateExplosions();
}

function getInvaderWidth(type) {
  if (type === 1) return 11;
  if (type === 2) return 12;
  return 8;
}

function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function playerHit() {
  player.alive = false;
  player.deathTimer = 60;
  explosions.push({ x: player.x, y: player.y, timer: 40 });
  playSound('playerDeath');
  state = GameState.PLAYER_DEATH;
}

function checkBulletShieldCollision(bullet, bulletIndex, bulletArray) {
  for (const shield of shields) {
    const sw = shield.data[0].length * PX;
    const sh = shield.data.length * PX;
    if (rectCollide(bullet.x, bullet.y, bullet.w, bullet.h, shield.x, shield.y, sw, sh)) {
      // Erode shield pixels near bullet impact
      const localX = Math.floor((bullet.x - shield.x) / PX);
      const localY = Math.floor((bullet.y - shield.y) / PX);
      let hit = false;

      for (let dy = -1; dy <= 2; dy++) {
        for (let dx = -1; dx <= 2; dx++) {
          const py = localY + dy;
          const px = localX + dx;
          if (py >= 0 && py < shield.data.length && px >= 0 && px < shield.data[0].length) {
            if (shield.data[py][px]) {
              shield.data[py][px] = 0;
              hit = true;
            }
          }
        }
      }

      if (hit) {
        bulletArray.splice(bulletIndex, 1);
        return true;
      }
    }
  }
  return false;
}

function erodeShield(shield, ex, ey, ew, eh) {
  const sw = shield.data[0].length;
  const sh = shield.data.length;

  for (let row = 0; row < sh; row++) {
    for (let col = 0; col < sw; col++) {
      const px = shield.x + col * PX;
      const py = shield.y + row * PX;
      if (rectCollide(px, py, PX, PX, ex, ey, ew, eh)) {
        shield.data[row][col] = 0;
      }
    }
  }
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// ---- Draw ----
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Stars
  drawStars();

  // Ground line
  ctx.fillStyle = '#0f0';
  ctx.fillRect(0, H - 20, W, 2);

  if (state === GameState.TITLE || state === GameState.GAME_OVER) {
    return;
  }

  // Shields
  for (const shield of shields) {
    drawSpriteFromData(shield.data, shield.x, shield.y, '#0f0', PX);
  }

  // Player
  if (player.alive) {
    drawSprite(SPRITES.player, player.x, player.y, '#0f0', PX);
  }

  // Invaders
  for (const inv of invaders) {
    if (!inv.alive) continue;
    let sprite;
    const frame = invaderAnimFrame;
    if (inv.type === 1) {
      sprite = frame === 0 ? SPRITES.invader1A : SPRITES.invader1B;
    } else if (inv.type === 2) {
      sprite = frame === 0 ? SPRITES.invader2A : SPRITES.invader2B;
    } else {
      sprite = frame === 0 ? SPRITES.invader3A : SPRITES.invader3B;
    }

    let color;
    if (inv.type === 1) color = '#ff0';      // yellow - squid
    else if (inv.type === 2) color = '#0ff';  // cyan - crab
    else color = '#f0f';                       // magenta - octopus

    drawSprite(sprite, inv.x, inv.y, color, PX);
  }

  // UFO
  if (ufo) {
    drawSprite(SPRITES.ufo, ufo.x, ufo.y, '#f00', PX);
  }

  // Player bullets
  ctx.fillStyle = '#fff';
  for (const b of playerBullets) {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  // Enemy bullets
  for (const b of enemyBullets) {
    // Animated lightning bolt style
    const flicker = Math.sin(Date.now() * 0.02) > 0;
    ctx.fillStyle = flicker ? '#ff0' : '#f80';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillRect(b.x - 1, b.y + 3, 1, 4);
    ctx.fillRect(b.x + b.w, b.y + 6, 1, 4);
  }

  // Explosions
  for (const exp of explosions) {
    if (exp.text) {
      // UFO score text
      ctx.fillStyle = '#ff0';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(exp.text, exp.x, exp.y + 10);
    } else {
      const flicker = exp.timer % 4 < 2 ? '#fff' : '#f80';
      drawSprite(SPRITES.explosion, exp.x, exp.y, flicker, PX);
    }
  }

  // Pause overlay
  if (state === GameState.PAUSED) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff0';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(isTouchDevice ? 'TAP HERE TO RESUME' : 'PRESS P TO RESUME', W / 2, H / 2 + 30);
    ctx.textAlign = 'left';
  }
}

function drawStars() {
  for (const star of stars) {
    star.twinkle += 0.03;
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(star.twinkle));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

// ---- Main Loop ----
let lastTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;
let accumulator = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += delta;

  while (accumulator >= frameDelay) {
    update();
    accumulator -= frameDelay;
  }

  draw();
  updateScoreDisplay();
  requestAnimationFrame(gameLoop);
}

// ---- Boot ----
initStars();
updateScoreDisplay();
requestAnimationFrame(gameLoop);
