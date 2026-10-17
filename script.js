/* =========================================================
   BIRTHDAY SURPRISE ARCADE — Interactive Game Engine
   Customizable via CONFIG. Everything else runs automatically!
   ========================================================= */
const CONFIG = {
  you: 'Aditi',
  me: 'Rahul',
  age: 21,

  // Optional background music URL, e.g. 'assets/music.mp3'
  music: '',

  cakeGreeting: 'Happy Birthday, {you}!',

  // 5 reasons — one per balloon
  reasons: [
    'Your laugh is my favourite sound in the world',
    'You make ordinary days feel like a celebration',
    'You are genuinely kind when nobody is watching',
    'Home feels like wherever you are',
    'You believe in me even before I believe in myself'
  ],

  // Up to 5 photos: path string or { src, caption }. Placeholders used if omitted.
  photos: [
    // { src: 'photos/1.jpg', caption: 'sweet memory' },
  ],

  letter:
    'I keep thinking about how incredibly lucky I got with you. You have seen me at my worst and stayed anyway, ' +
    'and I do not say thank you nearly enough for that. This year, I hope life gives you as much magic and warmth ' +
    'as you bring to everyone around you. Happy Birthday, my favourite person…'
};

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S  = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const tpl = s => String(s).replaceAll('{me}', CONFIG.me).replaceAll('{you}', CONFIG.you).replaceAll('{age}', CONFIG.age);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

(function fillTokens() {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { if (/\{(me|you|age)\}/.test(n.nodeValue)) n.nodeValue = tpl(n.nodeValue); });
  document.title = `A little something, for ${CONFIG.you} ✨`;
})();

/* =========================================================
   AUDIO SYNTHESIZER (Web Audio API — zero external files)
   ========================================================= */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
  play(fn) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try { fn(this.ctx); } catch (e) {}
  }
  tone(freq, type = 'sine', duration = 0.12, gainVal = 0.15) {
    this.play(ctx => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gainVal, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  }
  pop(pitchMultiplier = 1) {
    this.play(ctx => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480 * pitchMultiplier, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    });
  }
  shoot() {
    this.play(ctx => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    });
  }
  hit() {
    this.play(ctx => {
      [880, 1320, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.03);
        g.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35 + idx * 0.03);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.03);
        osc.stop(ctx.currentTime + 0.35 + idx * 0.03);
      });
    });
  }
  sparkle() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => {
      setTimeout(() => this.tone(f, 'sine', 0.14, 0.12), i * 35);
    });
  }
  blow() {
    this.play(ctx => {
      // Wind noise using low buffer
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      noise.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.3);
    });
  }
  fanfare() {
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    chords.forEach((f, i) => {
      setTimeout(() => this.tone(f, 'triangle', 0.25, 0.18), i * 65);
    });
  }
  stamp() {
    this.play(ctx => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    });
  }
}
const sfx = new SoundEngine();

// Sound toggle button in HUD
const sfxBtn = S('sfxBtn'), sfxIcon = S('sfxIcon');
if (sfxBtn) {
  sfxBtn.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    if (sfxIcon) sfxIcon.textContent = sfx.muted ? '🔇' : '🔊';
    sfxBtn.classList.toggle('muted', sfx.muted);
    if (!sfx.muted) sfx.sparkle();
  });
}

/* =========================================================
   GAME HUD, SCORE & PARTICLES
   ========================================================= */
let score = 0;
const STAGE_NAMES = [
  "STAGE 1 · CUPID'S AIM",
  "STAGE 2 · MAKE A WISH",
  "STAGE 3 · BLOSSOM GARDEN",
  "STAGE 4 · CAKE BAKERY",
  "STAGE 5 · BALLOON CARNIVAL",
  "STAGE 6 · MEMORY VAULT",
  "STAGE 7 · PHOTO PUZZLE",
  "FINAL QUEST · SECRET LETTER"
];

function updateHud(stageIdx) {
  const lbl = S('hudStageName');
  if (lbl) {
    if (innerWidth < 450) {
      lbl.textContent = `STAGE ${stageIdx + 1}/8`;
    } else {
      lbl.textContent = STAGE_NAMES[stageIdx] || `STAGE ${stageIdx + 1}/8`;
    }
  }
  const HUD_ICONS = ['🏹', '✨', '🌸', '🎂', '🎈', '📸', '🧩', '💌'];
  const icon = $('.stage-badge .hud-icon');
  if (icon && HUD_ICONS[stageIdx]) icon.textContent = HUD_ICONS[stageIdx];

  const dots = $$('#hudDots .h-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i <= stageIdx));
}

function addScore(pts, x = innerWidth / 2, y = innerHeight / 2, text = '') {
  score += pts;
  const sEl = S('hudScore');
  if (sEl) {
    sEl.textContent = score.toLocaleString();
    const badge = S('scoreBadge');
    if (badge) {
      badge.style.transform = 'scale(1.2)';
      setTimeout(() => { badge.style.transform = ''; }, 200);
    }
  }

  // Spawn floating RPG damage/score number
  const layer = S('floatingTextLayer');
  if (layer) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = text ? `${text} +${pts}` : `+${pts}`;
    el.style.left = `${Math.min(Math.max(x, 50), innerWidth - 50)}px`;
    el.style.top = `${Math.min(Math.max(y, 80), innerHeight - 60)}px`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function screenShake() {
  document.body.classList.remove('screen-shake');
  void document.body.offsetWidth;
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 450);
}

// Sparkle particle cursor trail & touch interaction
(function initCursorParticles() {
  const colors = ['#ff3d7f', '#ff9ec0', '#ffd166', '#ffb02e', '#1fd1c1', '#ffffff'];
  let lastSpawn = 0;
  const onMove = e => {
    const now = Date.now();
    if (now - lastSpawn < 40) return;
    lastSpawn = now;
    const x = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const y = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    if (x == null || y == null) return;
    const p = document.createElement('span');
    p.className = 'spark';
    p.textContent = pick(['✨', '💖', '⭐', '🌸']);
    p.style.cssText = `left:${x}px;top:${y}px;font-size:${rand(11, 19)}px;color:${pick(colors)};--dx:${rand(-35, 35)}px;--dy:${rand(-40, -10)}px;--rot:${rand(-40, 40)}deg`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  // Floating ambient atmospheric dust motes
  const dustLayer = S('ambientDust');
  if (dustLayer) {
    const symbols = ['✦', '✧', '•', '🌸', '✨'];
    for (let i = 0; i < 24; i++) {
      const d = document.createElement('span');
      d.className = 'mote';
      d.textContent = pick(symbols);
      d.style.cssText = `
        position: absolute;
        left: ${rand(5, 95)}%;
        top: ${rand(5, 95)}%;
        font-size: ${rand(8, 14)}px;
        color: rgba(255, 255, 255, ${rand(0.2, 0.55)});
        pointer-events: none;
        animation: floatMote ${rand(5, 9)}s ease-in-out infinite alternate;
        animation-delay: -${rand(0, 6)}s;
      `;
      dustLayer.appendChild(d);
    }
  }
})();

/* =========================================================
   SCENE ENGINE
   ========================================================= */
const ORDER = ['bow', 'wish', 'tree', 'cake', 'balloons', 'memory', 'puzzle', 'letter'];
const NIGHT = ['cake', 'balloons', 'memory', 'puzzle', 'letter'];
const hooks = {};
let cur = null, curId = null, timer = null, sceneT = 0;
let loops = [], timeouts = [], locked = false;

const loop = (fn, ms) => { const id = setInterval(fn, ms); loops.push(id); return id; };
const later = (fn, ms) => {
  const id = curId;
  const tid = setTimeout(() => { if (curId === id) fn(); }, ms);
  timeouts.push(tid);
  return tid;
};
const nextOf = id => ORDER[ORDER.indexOf(id) + 1] || 'bow';

function go(id) {
  const next = $('#s-' + id);
  if (!next) return;
  clearTimeout(timer);
  cancelAnimationFrame(bowRaf);
  timeouts.forEach(clearTimeout); timeouts = [];
  loops.forEach(clearInterval); loops = [];
  if (cur) {
    const old = cur;
    old.classList.remove('on');
    setTimeout(() => { if (!old.classList.contains('on')) old.classList.remove('live'); }, 600);
  }
  next.classList.remove('live'); void next.offsetWidth;
  next.classList.add('on', 'live');
  next.scrollTop = 0;
  cur = next; curId = id; sceneT = Date.now();
  locked = next.hasAttribute('data-lock');
  
  const stageIdx = ORDER.indexOf(id);
  updateHud(stageIdx >= 0 ? stageIdx : 0);

  document.body.dataset.theme = NIGHT.includes(id) ? 'night' : 'day';
  const tc = document.querySelector('meta[name=theme-color]');
  if (tc) tc.content = NIGHT.includes(id) ? '#150726' : '#ffe9d6';
  
  if (hooks[id]) hooks[id]();
  const auto = +next.dataset.auto;
  if (auto) timer = setTimeout(() => go(nextOf(id)), auto);
}

document.addEventListener('click', e => {
  sfx.init();
  const b = e.target.closest('[data-go]');
  if (b && !b.disabled) {
    sfx.pop(1.2);
    go(b.dataset.go);
    return;
  }
  if (cur && cur.hasAttribute('data-tap') && !e.target.closest('button,a')) {
    const elapsed = Date.now() - sceneT;
    if (curId === 'bow') {
      if (!bow.shot) shoot();
      return;
    }
    if (curId === 'cake' && !candleBlown && elapsed > 600) {
      blowOutCandle();
      return;
    }
    if (!locked && elapsed > 350) {
      go(nextOf(curId));
    }
  }
});

/* ---------- starfield ---------- */
(function stars() {
  const host = $('#stars');
  if (!host) return;
  for (let i = 0; i < 75; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    const z = rand(1, 2.8);
    s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${z}px;height:${z}px;--t:${rand(2, 5).toFixed(1)}s;animation-delay:${-rand(0, 5).toFixed(1)}s`;
    host.appendChild(s);
  }
})();

/* ---------- confetti (full-screen burst or rain) ---------- */
const cf = $('#confetti'), cx = cf ? cf.getContext('2d') : null;
let parts = [], cfRaf = 0;
function sizeConfetti() {
  if (!cf || !cx) return;
  const d = Math.min(devicePixelRatio || 1, 2);
  cf.width = innerWidth * d; cf.height = innerHeight * d;
  cx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener('resize', sizeConfetti); sizeConfetti();
const CF_COLS = ['#ff3d7f', '#ff9ec0', '#ffb02e', '#ffd166', '#7b61ff', '#1fd1c1', '#ff5a4a', '#fff'];
function burst(n, x, y, cols = CF_COLS) {
  if (!cx) return;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), v = rand(2, 9);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, g: .22, s: rand(4, 9), r: rand(0, 6), vr: rand(-.3, .3), c: pick(cols), dot: Math.random() < .5 });
  }
  if (!cfRaf) cfTick();
}
function rain(n) {
  if (!cx) return;
  for (let i = 0; i < n; i++) {
    parts.push({ x: rand(0, innerWidth), y: rand(-innerHeight * .3, -10), vx: rand(-1, 1), vy: rand(2, 4.5), g: .01, s: rand(4, 9), r: rand(0, 6), vr: rand(-.2, .2), c: pick(CF_COLS), dot: Math.random() < .5 });
  }
  if (!cfRaf) cfTick();
}
function cfTick() {
  if (!cx) return;
  cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.y < innerHeight + 30);
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .995; p.r += p.vr;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
    if (p.dot) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); }
    else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    cx.restore();
  });
  cfRaf = parts.length ? requestAnimationFrame(cfTick) : 0;
  if (!cfRaf) cx.clearRect(0, 0, innerWidth, innerHeight);
}

/* ---------- typewriter ---------- */
function typeInto(el, text, speed, onDone, fresh = true) {
  let i = 0, done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(id);
    el.textContent = text;
    onDone && onDone();
  };
  const id = loop(() => {
    i++;
    const k = fresh ? 4 : 0;
    el.innerHTML = esc(text.slice(0, Math.max(0, i - k))) + (fresh && i > 0 ? `<span class="fresh">${esc(text.slice(Math.max(0, i - k), i))}</span>` : '');
    if (i % 3 === 0) sfx.tone(800 + (i % 5) * 40, 'sine', 0.04, 0.03);
    if (i >= text.length) finish();
  }, speed);
  return finish;
}

/* ---------- music ---------- */
const bgm = $('#bgm'), muteBtn = $('#muteBtn');
if (CONFIG.music && bgm && muteBtn) {
  bgm.src = CONFIG.music; bgm.volume = .6; muteBtn.hidden = false;
  const playOnce = () => {
    if (bgm.paused && !muteBtn.classList.contains('off')) bgm.play().catch(() => {});
  };
  addEventListener('pointerdown', playOnce, { once: true });
  addEventListener('click', playOnce, { once: true });
  muteBtn.addEventListener('click', () => {
    const off = muteBtn.classList.toggle('off');
    off ? bgm.pause() : bgm.play().catch(() => {});
  });
}

/* =========================================================
   STAGE 1 · CUPID'S ARCHERY MINIGAME
   ========================================================= */
const bow = { p: 0, shot: false, W: 0, H: 0, drag: null };
let cursorX = (innerWidth || 400) * 0.5;
let cursorY = (innerHeight || 600) * 0.78;
let bowX = (innerWidth || 400) * 0.5;
let bowY = (innerHeight || 600) * 0.78;
let bowRaf = null;

function heartCenter() {
  const target = S('target');
  if (!target) return { x: innerWidth / 2, y: innerHeight * .32 };
  const r = target.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function bowGeom() {
  bow.W = innerWidth || 400;
  bow.H = innerHeight || 600;
  const svg = S('bowSvg');
  if (svg) svg.setAttribute('viewBox', `0 0 ${bow.W} ${bow.H}`);
  const B = { x: bowX, y: bowY };
  const t = heartCenter();
  const a = Math.atan2(t.y - B.y, t.x - B.x);
  return { B, t, d: { x: Math.cos(a), y: Math.sin(a) }, n: { x: -Math.sin(a), y: Math.cos(a) } };
}

function drawBow(p, tailOverride) {
  const limbs = S('limbs'), str = S('str'), shaft = S('shaft'), head = S('head'), fletch = S('fletch'), traj = S('trajectory');
  if (!limbs || !str || !shaft || !head || !fletch) return { N: { x: 0, y: 0 }, tail: { x: 0, y: 0 }, g: bowGeom() };
  const g = bowGeom(), { B, d, n, t } = g, L = Math.min(56, bow.W * .14);
  const A = { x: B.x + n.x * L, y: B.y + n.y * L }, C = { x: B.x - n.x * L, y: B.y - n.y * L };
  const ctrl = { x: B.x + d.x * L * .5, y: B.y + d.y * L * .5 };
  limbs.setAttribute('d', `M${A.x} ${A.y} Q${ctrl.x} ${ctrl.y} ${C.x} ${C.y}`);
  const pull = p * L * .85;
  const N = { x: B.x - d.x * pull, y: B.y - d.y * pull };
  str.setAttribute('points', `${A.x},${A.y} ${N.x},${N.y} ${C.x},${C.y}`);
  const tail = tailOverride || N, len = L * 1.15;
  const tip = { x: tail.x + d.x * len, y: tail.y + d.y * len };
  shaft.setAttribute('x1', tail.x); shaft.setAttribute('y1', tail.y); shaft.setAttribute('x2', tip.x); shaft.setAttribute('y2', tip.y);
  head.setAttribute('d', `M${tip.x + d.x * 10} ${tip.y + d.y * 10}L${tip.x + n.x * 6} ${tip.y + n.y * 6}L${tip.x - n.x * 6} ${tip.y - n.y * 6}Z`);
  const f1 = { x: tail.x + d.x * 11, y: tail.y + d.y * 11 };
  fletch.setAttribute('d', `M${tail.x} ${tail.y}L${f1.x} ${f1.y}`);
  
  if (traj && !tailOverride) {
    traj.setAttribute('d', `M${tip.x} ${tip.y} L${t.x} ${t.y}`);
    traj.style.opacity = p > 0.05 ? Math.min(1, 0.45 + p * 0.55) : 0.35;
  } else if (traj) {
    traj.style.opacity = 0;
  }

  // Update Power fill
  const powerFill = S('powerFill');
  if (powerFill) powerFill.style.width = `${Math.min(100, Math.round(p * 100))}%`;

  return { N, tail, g };
}

function startBowLoop() {
  cancelAnimationFrame(bowRaf);
  function step() {
    if (curId !== 'bow' || bow.shot) return;
    if (!bow.drag) {
      const hc = heartCenter();
      const targetY = Math.max(hc.y + 110, Math.min(innerHeight - 80, cursorY));
      const targetX = Math.max(50, Math.min(innerWidth - 50, cursorX));
      bowX += (targetX - bowX) * 0.16;
      bowY += (targetY - bowY) * 0.16;
      drawBow(bow.p);
    }
    bowRaf = requestAnimationFrame(step);
  }
  bowRaf = requestAnimationFrame(step);
}

hooks.bow = () => {
  bow.p = 0; bow.shot = false; bow.drag = null;
  cursorX = innerWidth * 0.5;
  cursorY = innerHeight * 0.78;
  bowX = cursorX;
  bowY = cursorY;
  const t = S('target');
  if (t) { t.classList.remove('hit'); t.style.opacity = ''; }
  const lbl = S('bowLabel');
  if (lbl) { lbl.textContent = '🎯 MOVE CURSOR TO AIM • PULL & RELEASE'; lbl.style.opacity = 1; }
  const powerFill = S('powerFill');
  if (powerFill) powerFill.style.width = '0%';
  drawBow(0);
  startBowLoop();
};

(function bindBow() {
  const sc = S('s-bow');
  if (!sc) return;
  const max = () => Math.min(innerWidth, innerHeight) * .24;
  let hasMoved = false, startT = 0;

  window.addEventListener('pointermove', e => {
    if (curId !== 'bow' || bow.shot) return;
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (bow.drag) {
      const dist = Math.hypot(e.clientX - bow.drag.x, e.clientY - bow.drag.y);
      if (dist > 8) hasMoved = true;
      bow.p = Math.min(1, dist / max());
      drawBow(bow.p);
    }
  }, { passive: true });

  sc.addEventListener('pointerdown', e => {
    if (bow.shot || curId !== 'bow') return;
    sfx.init();
    cursorX = e.clientX;
    cursorY = e.clientY;
    bow.drag = { x: e.clientX, y: e.clientY };
    hasMoved = false;
    startT = Date.now();
    try { sc.setPointerCapture(e.pointerId); } catch {}
  });

  const end = e => {
    if (!bow.drag || bow.shot || curId !== 'bow') return;
    const dist = Math.hypot(e.clientX - bow.drag.x, e.clientY - bow.drag.y);
    const wasTap = !hasMoved || dist < 14 || (Date.now() - startT < 350 && dist < 28);
    bow.drag = null;
    try { sc.releasePointerCapture(e.pointerId); } catch {}
    if (wasTap || bow.p > 0.1) {
      shoot();
    } else {
      springBack();
    }
  };

  sc.addEventListener('pointerup', end);
  sc.addEventListener('pointercancel', end);

  // Quick Shot button & tap handlers
  const quickShot = S('quickShotBtn');
  if (quickShot) quickShot.addEventListener('click', e => {
    e.stopPropagation();
    shoot();
  });

  addEventListener('resize', () => { if (curId === 'bow' && !bow.shot) drawBow(bow.p); });
})();

function springBack() {
  const from = bow.p, t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / 200);
    bow.p = from * (1 - k); drawBow(bow.p);
    if (k < 1 && !bow.shot) requestAnimationFrame(step);
  })(t0);
}

function shoot() {
  if (bow.shot) return;
  bow.shot = true;
  cancelAnimationFrame(bowRaf);
  sfx.shoot();
  const lbl = S('bowLabel');
  if (lbl) lbl.style.opacity = 0;
  const powerFill = S('powerFill');
  if (powerFill) powerFill.style.width = '100%';

  const { N, g } = drawBow(Math.max(bow.p, 0.45));
  const start = { x: N.x, y: N.y }, end = { x: g.t.x - g.d.x * 24, y: g.t.y - g.d.y * 24 };
  const t0 = performance.now(), dur = 400;

  (function fly(now) {
    const k = Math.min(1, (now - t0) / dur), e = k * k;
    drawBow(0, { x: start.x + (end.x - start.x) * e, y: start.y + (end.y - start.y) * e });
    if (k < 1) return requestAnimationFrame(fly);

    // Impact on Heart Bullseye
    sfx.hit();
    screenShake();
    const target = S('target');
    if (target) target.classList.add('hit');
    burst(80, g.t.x, g.t.y);
    addScore(500, g.t.x, g.t.y, 'PERFECT SHOT! 🎯');

    setTimeout(() => { if (curId === 'bow') go('wish'); }, 550);
  })(t0);
}

/* =========================================================
   STAGE 2 · MAKE A WISH (FALLING STARS CATCHER)
   ========================================================= */
hooks.wish = () => {
  const container = S('wishStarsZone');
  if (!container) return;
  container.innerHTML = '';
  
  // Spawn falling stars you can tap to collect wish points
  const spawnStar = () => {
    if (curId !== 'wish') return;
    const star = document.createElement('div');
    star.className = 'wish-star';
    star.textContent = pick(['⭐', '✨', '🌟']);
    star.style.left = `${rand(10, 90)}%`;
    star.style.animationDuration = `${rand(3.5, 6)}s`;
    
    star.addEventListener('click', e => {
      e.stopPropagation();
      sfx.sparkle();
      star.style.animationPlayState = 'paused';
      star.style.transform = 'scale(1.8)';
      star.style.opacity = '0';
      burst(18, e.clientX, e.clientY, ['#ffd166', '#fff', '#ff9ec0']);
      addScore(50, e.clientX, e.clientY, 'WISH COLLECTED! 🌟');
      setTimeout(() => star.remove(), 200);
    });

    container.appendChild(star);
    setTimeout(() => { star.remove(); }, 6000);
  };

  loop(spawnStar, 900);
};

/* =========================================================
   STAGE 3 · BLOSSOM GARDEN (HEART TREE)
   ========================================================= */
let blossomsGrown = 0;

hooks.tree = () => {
  blossomsGrown = 0;
  const countEl = S('bloomCount');
  if (countEl) countEl.textContent = '0';
  const host = S('canopy');
  if (host) {
    host.innerHTML = '';
    const cols = ['#ff4f93', '#ff6b97', '#ff9ec0', '#ffa24d', '#ffc94d', '#f783ac', '#ff8c6b'];
    const N = innerWidth < 500 ? 190 : 260;
    for (let i = 0; i < N; i++) {
      const t = rand(0, Math.PI * 2), k = Math.pow(Math.random(), .38);
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const el = document.createElement('i');
      el.textContent = '♥';
      el.style.cssText = `left:${50 + x / 17 * k * 48}%;top:${50 + (y - 2.5) / 16 * k * 46}%;font-size:${rand(16, 34)}px;color:${pick(cols)};animation-delay:${1.1 + i * .01}s;text-shadow:0 2px 4px rgba(160,20,70,.25)`;
      
      el.addEventListener('click', e => {
        e.stopPropagation();
        sfx.pop(rand(1.2, 1.8));
        el.style.transform = 'translate(-50%, -50%) scale(1.6)';
        setTimeout(() => el.style.transform = 'translate(-50%, -50%) scale(1)', 200);
        blossomsGrown++;
        if (countEl) countEl.textContent = blossomsGrown;
        addScore(10, e.clientX, e.clientY, 'BLOOM! 🌸');
      });

      host.appendChild(el);
    }
  }

  // Floating ambient hearts
  const fl = $('#s-tree .floaters');
  if (fl) {
    fl.innerHTML = '';
    const cols = ['#ff4f93', '#ff6b97', '#ff9ec0', '#ffa24d', '#ffc94d', '#f783ac'];
    loop(() => {
      const s = document.createElement('span');
      s.className = 'fl'; s.textContent = pick(['♥', '🌸', '✨']);
      s.style.cssText = `left:${rand(0, 100)}%;font-size:${rand(12, 24)}px;color:${pick(cols)};animation-duration:${rand(6, 11)}s`;
      s.addEventListener('click', e => {
        e.stopPropagation();
        sfx.sparkle();
        burst(14, e.clientX, e.clientY);
        addScore(25, e.clientX, e.clientY, 'SWEET SPARK! ✨');
        s.remove();
      });
      fl.appendChild(s);
      setTimeout(() => s.remove(), 12000);
    }, 650);
  }
};

// Water & Bloom button
const waterBtn = S('waterTreeBtn');
if (waterBtn) {
  waterBtn.addEventListener('click', e => {
    e.stopPropagation();
    sfx.sparkle();
    burst(35, innerWidth / 2, innerHeight * 0.45);
    addScore(50, e.clientX, e.clientY, 'GARDEN BLOOM! 🌸');
    blossomsGrown += 5;
    const countEl = S('bloomCount');
    if (countEl) countEl.textContent = blossomsGrown;
  });
}

/* =========================================================
   STAGE 4 · CAKE BAKERY & CANDLE BLOW GAME
   ========================================================= */
let candleBlown = false;

function blowOutCandle() {
  if (candleBlown || curId !== 'cake') return;
  candleBlown = true;
  sfx.blow();
  
  const flame = S('candleFlame');
  if (flame) flame.classList.add('out');
  
  const cake = S('cake');
  const r = cake ? cake.getBoundingClientRect() : { left: innerWidth / 2 - 50, width: 100, top: 200, height: 100 };
  burst(90, r.left + r.width / 2, r.top + r.height * .25, ['#fff', '#ffd166', '#ffa51f', '#ff85a2', '#7b61ff']);
  addScore(300, r.left + r.width / 2, r.top + r.height * .25, 'WISH MADE! 🕯️✨');

  const status = S('cakeStatus');
  if (status) status.textContent = 'Wish made! ✨';
  
  const blowBtn = S('blowBtn');
  if (blowBtn) blowBtn.classList.add('hide');

  later(() => {
    typeInto(S('greet'), tpl(CONFIG.cakeGreeting), 45, () => {
      sfx.fanfare();
      if (status) status.classList.add('hide');
      const nextBtn = S('cakeNextBtn');
      if (nextBtn) nextBtn.classList.remove('hide');
      rain(60);
    });
  }, 350);
}

hooks.cake = () => {
  candleBlown = false;
  const flame = S('candleFlame');
  if (flame) flame.classList.remove('out');
  const greet = S('greet');
  if (greet) greet.textContent = '';
  const status = S('cakeStatus');
  if (status) {
    status.textContent = 'Baking something sweet…';
    status.classList.remove('hide');
  }
  const nextBtn = S('cakeNextBtn');
  if (nextBtn) nextBtn.classList.add('hide');
  const blowBtn = S('blowBtn');
  if (blowBtn) blowBtn.classList.remove('hide');
  const toppingsGroup = S('cakeToppingsGroup');
  if (toppingsGroup) toppingsGroup.innerHTML = '';

  later(() => {
    if (candleBlown) return;
    sfx.sparkle();
    const cake = S('cake');
    const r = cake ? cake.getBoundingClientRect() : { left: innerWidth / 2 - 50, width: 100, top: 200, height: 100 };
    burst(40, r.left + r.width / 2, r.top + r.height * .25);
    if (status) status.textContent = 'Make a wish & blow out the candle 🕯️';
  }, 2000);
};

// Candle Controls & Topping Buttons
(function bindCakeControls() {
  const blowBtn = S('blowBtn');
  if (blowBtn) blowBtn.addEventListener('click', e => {
    e.stopPropagation();
    blowOutCandle();
  });

  const cake = S('cake');
  if (cake) cake.addEventListener('click', () => {
    if (curId === 'cake' && !candleBlown) blowOutCandle();
  });

  // Interactive cake topping buttons
  $$('.top-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      sfx.pop(rand(1.2, 1.6));
      const topping = btn.dataset.topping || '🍓';
      const toppingsGroup = S('cakeToppingsGroup');
      if (toppingsGroup) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.textContent = topping;
        text.setAttribute('x', `${rand(45, 205)}`);
        text.setAttribute('y', `${rand(115, 175)}`);
        text.setAttribute('font-size', '18');
        text.setAttribute('text-anchor', 'middle');
        toppingsGroup.appendChild(text);
        addScore(20, e.clientX, e.clientY, `${topping} TOPPING!`);
      }
    });
  });
})();

/* =========================================================
   STAGE 5 · BALLOON CARNIVAL ARCADE
   ========================================================= */
const BAL = [
  { c1: '#ff9ec0', c2: '#ff4f93', nc: '#ff5d9e', rarity: 'LEGENDARY 🌟' },
  { c1: '#ffe27a', c2: '#ffb52e', nc: '#ffc13c', rarity: 'EPIC 💖' },
  { c1: '#b8a8ff', c2: '#7b61ff', nc: '#8b7cff', rarity: 'RARE ✨' },
  { c1: '#7ff3e6', c2: '#16c1b2', nc: '#1fd1c1', rarity: 'SPECIAL 💎' },
  { c1: '#ff9a8a', c2: '#ff4a3a', nc: '#ff5a4a', rarity: 'SECRET 👑' }
];

hooks.balloons = () => {
  const sky = S('sky');
  if (!sky) return;
  sky.innerHTML = ''; sky.classList.remove('gone');
  const reasonList = S('reasonList');
  if (reasonList) reasonList.innerHTML = '';
  const thousand = S('thousand'), bNext = S('bNext');
  if (thousand) thousand.classList.add('hide');
  if (bNext) bNext.classList.add('hide');
  const poppedCountEl = S('poppedCount');
  if (poppedCountEl) poppedCountEl.textContent = '0';
  const comboPill = S('comboPill');
  if (comboPill) comboPill.textContent = 'COMBO x1 🔥';

  const spots = [[6, 8, 68], [27, 32, 76], [50, 4, 70], [72, 28, 72], [38, 58, 64]];
  let popped = 0;
  const reasons = (CONFIG.reasons && CONFIG.reasons.length) ? CONFIG.reasons : [
    'Your laugh is my favourite sound',
    'You make ordinary days feel special',
    'You are kind when nobody is watching',
    'Home feels like wherever you are',
    'You believe in me before I do'
  ];
  const total = Math.min(5, reasons.length);

  BAL.slice(0, total).forEach((b, i) => {
    const el = document.createElement('button');
    el.className = 'balloon';
    el.setAttribute('aria-label', `Pop balloon ${i + 1}`);
    el.style.cssText = `--x:${spots[i][0]}%;--y:${spots[i][1]}%;--w:${spots[i][2]}px;--c1:${b.c1};--c2:${b.c2};--dl:${-i * .6}s`;
    
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (el.dataset.popped) return;
      el.dataset.popped = '1';
      el.classList.add('pop');
      
      popped++;
      sfx.pop(1 + popped * 0.15); // Ascending pop sounds!
      
      if (poppedCountEl) poppedCountEl.textContent = popped;
      if (comboPill) comboPill.textContent = `COMBO x${popped} 🔥`;

      const r = el.getBoundingClientRect();
      burst(32, r.left + r.width / 2, r.top + r.height / 2, [b.c1, b.c2, '#fff', '#ffd166']);
      addScore(100 * popped, r.left + r.width / 2, r.top + r.height / 2, `COMBO x${popped}! 🎈`);

      const card = document.createElement('div');
      card.className = 'rcard'; card.style.setProperty('--nc', b.nc);
      card.innerHTML = `<span class="rbadge">${b.rarity} · REASON #${popped}</span><p>${esc(tpl(reasons[popped - 1]))}</p><span class="sp">✨</span>`;
      if (reasonList) {
        reasonList.appendChild(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (popped === total) {
        sfx.fanfare();
        setTimeout(() => {
          sky.classList.add('gone');
          if (thousand) thousand.classList.remove('hide');
          if (bNext) bNext.classList.remove('hide');
          rain(50);
        }, 500);
      }
    });
    sky.appendChild(el);
  });
};

/* =========================================================
   STAGE 6 · MEMORY VAULT & STICKER STUDIO
   ========================================================= */
let activeStamp = '💖';
const PH = ['#ffb4c6', '#ffd29e', '#e8a0bf', '#ffe08a', '#f4a6a0'];
function placeholder(i) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${PH[i % 5]}'/><stop offset='1' stop-color='#fff4e0'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><circle cx='200' cy='190' r='62' fill='#e0316d' opacity='.75'/><path d='M80 420c0-80 55-120 120-120s120 40 120 120z' fill='#e0316d' opacity='.75'/><text x='200' y='470' font-family='sans-serif' font-size='24' text-anchor='middle' fill='#7a2a45'>Your photo ${i + 1}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const CAPS = ['wow', 'good', 'love', 'smile', 'us'];
const photos = Array.from({ length: 5 }, (_, i) => {
  let p = CONFIG.photos[i]; if (typeof p === 'string') p = { src: p }; p = p || {};
  return { src: p.src || placeholder(i), caption: p.caption || CAPS[i] };
});

hooks.memory = () => {
  const rail = S('rail'), dots = S('pdots');
  if (!rail || !dots) return;
  rail.innerHTML = ''; dots.innerHTML = '';
  
  photos.forEach((p, i) => {
    const it = document.createElement('div');
    it.className = 'pitem' + (i === 0 ? ' on' : '');
    it.innerHTML = `<div class="pol" style="--r:${rand(-3, 3).toFixed(1)}deg"><span class="pin"></span><img alt="" src="${p.src}" draggable="false"><span class="cap">${esc(p.caption)}</span></div>`;
    
    // Interactive sticker stamping onto polaroid
    const pol = it.querySelector('.pol');
    it.addEventListener('click', e => {
      sfx.stamp();
      const rect = pol.getBoundingClientRect();
      const stamp = document.createElement('span');
      stamp.className = 'stamped-badge';
      stamp.textContent = activeStamp;
      stamp.style.left = `${Math.max(10, Math.min(rect.width - 40, e.clientX - rect.left - 15))}px`;
      stamp.style.top = `${Math.max(10, Math.min(rect.height - 40, e.clientY - rect.top - 15))}px`;
      stamp.style.setProperty('--rot', `${rand(-25, 25)}deg`);
      pol.appendChild(stamp);

      addScore(50, e.clientX, e.clientY, `${activeStamp} STAMP!`);
      it.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });

    rail.appendChild(it);

    const dot = document.createElement('i');
    dot.className = i === 0 ? 'on' : '';
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', e => {
      e.stopPropagation();
      sfx.pop(1.4);
      it.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dots.appendChild(dot);
  });

  rail.scrollLeft = 0;
  let raf = 0;
  rail.onscroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const items = $$('.pitem', rail), mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0, bd = 1e9;
      items.forEach((it, i) => {
        const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid);
        if (d < bd) { bd = d; best = i; }
      });
      items.forEach((it, i) => it.classList.toggle('on', i === best));
      $$('#pdots i').forEach((d, i) => d.classList.toggle('on', i === best));
    });
  };

  // Desktop mouse drag scrolling
  let isDown = false, startX = 0, scrollLeft = 0;
  rail.onmousedown = e => {
    isDown = true;
    startX = e.pageX - rail.offsetLeft;
    scrollLeft = rail.scrollLeft;
  };
  window.addEventListener('mouseup', () => { isDown = false; });
  rail.onmousemove = e => {
    if (!isDown) return;
    const x = e.pageX - rail.offsetLeft;
    const walk = (x - startX) * 1.4;
    rail.scrollLeft = scrollLeft - walk;
  };
};

// Sticker Station chips
$$('.stamp-chip').forEach(chip => {
  chip.addEventListener('click', e => {
    e.stopPropagation();
    sfx.pop(1.5);
    $$('.stamp-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeStamp = chip.dataset.stamp || '💖';
  });
});

/* =========================================================
   STAGE 7 · PHOTO PUZZLE QUEST ENGINE
   ========================================================= */
function getBirthdayMemoryArtwork() {
  const name = esc(tpl(CONFIG.you));
  const sender = esc(tpl(CONFIG.me));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>
    <defs>
      <linearGradient id='bgGrad' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#3b114d'/>
        <stop offset='50%' stop-color='#691b4f'/>
        <stop offset='100%' stop-color='#ff4b72'/>
      </linearGradient>
      <radialGradient id='cakeGlow' cx='50%' cy='60%' r='50%'>
        <stop offset='0%' stop-color='#ffe79a' stop-opacity='0.4'/>
        <stop offset='100%' stop-color='#ffe79a' stop-opacity='0'/>
      </radialGradient>
      <filter id='dropShadow' x='-20%' y='-20%' width='140%' height='140%'>
        <feDropShadow dx='0' dy='6' stdDeviation='6' flood-color='#000000' flood-opacity='0.4'/>
      </filter>
    </defs>
    <rect width='600' height='600' fill='url(#bgGrad)'/>
    <circle cx='300' cy='320' r='240' fill='url(#cakeGlow)'/>
    <circle cx='90' cy='90' r='5' fill='#fff' opacity='0.8'/>
    <circle cx='510' cy='110' r='6' fill='#ffd166' opacity='0.9'/>
    <circle cx='120' cy='480' r='4' fill='#ff9ec0' opacity='0.7'/>
    <circle cx='490' cy='460' r='5' fill='#fff' opacity='0.85'/>
    <circle cx='70' cy='280' r='3' fill='#ffe08a' opacity='0.75'/>
    <circle cx='530' cy='290' r='4' fill='#fff' opacity='0.8'/>
    <g filter='url(#dropShadow)'>
      <path d='M80 180c-25-35-15-75 15-85s65 15 50 65c-8 25-35 40-50 40-5 0-10-8-15-20z' fill='#ff3d7f'/>
      <path d='M95 200 Q92 250 110 310' stroke='#ffc2d4' stroke-width='2' fill='none' opacity='0.6'/>
      <path d='M500 160c25-35 15-75-15-85s-65 15-50 65c8 25 35 40 50 40 5 0 10-8 15-20z' fill='#ffd166'/>
      <path d='M485 180 Q495 240 480 300' stroke='#ffe8a3' stroke-width='2' fill='none' opacity='0.6'/>
    </g>
    <path d='M20 70 Q 300 120 580 70' stroke='rgba(255,255,255,0.4)' stroke-width='2' fill='none'/>
    <polygon points='70,80 100,83 85,120' fill='#ff3d7f'/>
    <polygon points='150,91 180,94 165,130' fill='#ffd166'/>
    <polygon points='230,98 260,99 245,138' fill='#1fd1c1'/>
    <polygon points='310,99 340,98 325,138' fill='#ff7aa6'/>
    <polygon points='390,94 420,91 405,130' fill='#b8a8ff'/>
    <polygon points='470,83 500,80 485,120' fill='#ff9a8a'/>
    <g filter='url(#dropShadow)' transform='translate(0, 30)'>
      <ellipse cx='300' cy='430' rx='190' ry='22' fill='#ffffff' opacity='0.9'/>
      <path d='M150 350 h300 v60 c0 18 -65 32 -150 32 s-150 -14 -150 -32 z' fill='#f2638f'/>
      <ellipse cx='300' cy='350' rx='150' ry='20' fill='#ff82a8'/>
      <path d='M150 350 c20 15 40 5 60 16 c20-10 40 10 60 0 c20 10 40-10 60 14 c20-12 40 12 60 0 v-10 H150 z' fill='#fff5ea'/>
      <path d='M190 280 h220 v60 c0 15 -50 26 -110 26 s-110 -11 -110 -26 z' fill='#ff9dbd'/>
      <ellipse cx='300' cy='280' rx='110' ry='16' fill='#ffb8d0'/>
      <path d='M190 280 c15 12 30 4 45 12 c15-8 30 8 45 0 c15 8 30-8 45 10 c15-10 30 8 45 0 v-8 H190 z' fill='#fff5ea'/>
      <path d='M230 220 h140 v50 c0 12 -30 20 -70 20 s-70 -8 -70 -20 z' fill='#f2638f'/>
      <ellipse cx='300' cy='220' rx='70' ry='12' fill='#ff82a8'/>
      <rect x='294' y='160' width='12' height='55' rx='4' fill='#ffe0ea'/>
      <path d='M294 175 l12 -6 M294 195 l12 -6' stroke='#ff5c92' stroke-width='2'/>
      <ellipse cx='300' cy='145' rx='9' ry='14' fill='#ffb02e'/>
      <ellipse cx='300' cy='147' rx='5' ry='8' fill='#fff3a8'/>
      <rect x='255' y='175' width='10' height='40' rx='3' fill='#e0f7fa'/>
      <ellipse cx='260' cy='163' rx='7' ry='11' fill='#ffb02e'/>
      <ellipse cx='260' cy='165' rx='4' ry='6' fill='#fff3a8'/>
      <rect x='335' y='175' width='10' height='40' rx='3' fill='#ffebee'/>
      <ellipse cx='340' cy='163' rx='7' ry='11' fill='#ffb02e'/>
      <ellipse cx='340' cy='165' rx='4' ry='6' fill='#fff3a8'/>
    </g>
    <rect x='85' y='490' width='430' height='74' rx='18' fill='#1b0b2e' opacity='0.78' stroke='#ffd27a' stroke-width='2' filter='url(#dropShadow)'/>
    <text x='300' y='525' font-family='sans-serif' font-weight='800' font-size='23' fill='#ffd27a' text-anchor='middle' letter-spacing='1'>HAPPY BIRTHDAY, ${name}!</text>
    <text x='300' y='550' font-family='sans-serif' font-weight='600' font-size='15' fill='#ff9ec0' text-anchor='middle'>💖 With all my love from ${sender} 💖</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

let puzzleGrid = 3;
let puzzleBoardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let selectedPieceId = null;
let puzzleMoves = 0;
let puzzleTimerStart = null;
let puzzleTimerInterval = null;
let puzzleSolved = false;
let puzzleShowNumbers = true;
let puzzlePhotosList = [];
let puzzleCurrentIdx = 0;

function buildPuzzlePhotoList() {
  puzzlePhotosList = [
    { src: getBirthdayMemoryArtwork(), caption: `Happy Birthday, ${tpl(CONFIG.you)}! ✨`, label: 'Celebration' },
    ...photos.map((p, i) => ({
      src: p.src,
      caption: p.caption || `Memory #${i + 1}`,
      label: `Photo ${i + 1}`
    }))
  ];
}

function renderPuzzleThumbnails() {
  const container = S('puzzlePhotoList');
  if (!container) return;
  container.innerHTML = '';
  puzzlePhotosList.forEach((item, idx) => {
    const thumb = document.createElement('button');
    thumb.className = 'puzzle-thumb' + (idx === puzzleCurrentIdx ? ' active' : '');
    thumb.title = item.caption || item.label;
    thumb.innerHTML = `<img src="${item.src}" alt="${item.label}">`;
    thumb.onclick = () => {
      sfx.pop(1.4);
      initPuzzle(idx);
    };
    container.appendChild(thumb);
  });
}

function startPuzzleTimer() {
  if (puzzleTimerStart !== null) return;
  puzzleTimerStart = Date.now();
  if (puzzleTimerInterval) clearInterval(puzzleTimerInterval);
  puzzleTimerInterval = setInterval(() => {
    if (puzzleSolved || !puzzleTimerStart) return;
    const sec = Math.floor((Date.now() - puzzleTimerStart) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    const timerEl = S('puzzleTimer');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function createPieceElement(pieceId, inSlot = false) {
  const curPhoto = puzzlePhotosList[puzzleCurrentIdx] ? puzzlePhotosList[puzzleCurrentIdx].src : getBirthdayMemoryArtwork();
  const el = document.createElement('div');
  el.className = 'drag-piece' + (selectedPieceId === pieceId ? ' selected-piece' : '');
  el.dataset.pieceId = pieceId;
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Puzzle piece ${pieceId + 1}`);

  const origRow = Math.floor(pieceId / puzzleGrid);
  const origCol = pieceId % puzzleGrid;
  const posX = origCol * 50;
  const posY = origRow * 50;

  el.style.backgroundImage = `url("${curPhoto}")`;
  el.style.backgroundSize = `300% 300%`;
  el.style.backgroundPosition = `${posX}% ${posY}%`;

  if (puzzleShowNumbers && !puzzleSolved) {
    const num = document.createElement('span');
    num.className = 'piece-num';
    num.textContent = pieceId + 1;
    el.appendChild(num);
  }

  attachDragEvents(el, pieceId);
  return el;
}

function renderDropBoard() {
  const board = S('dropBoard');
  if (!board) return;
  board.innerHTML = '';
  
  let matchedCount = 0;
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.slotId = i;

    const ghost = document.createElement('span');
    ghost.className = 'slot-ghost-num';
    ghost.textContent = i + 1;
    slot.appendChild(ghost);

    const pieceId = puzzleBoardState[i];
    if (pieceId !== null) {
      const isMatched = pieceId === i;
      if (isMatched) matchedCount++;

      const pieceEl = createPieceElement(pieceId, true);
      if (isMatched) pieceEl.classList.add('is-matched');
      slot.appendChild(pieceEl);

      // Tap-to-swap fallback
      pieceEl.addEventListener('click', e => {
        if (puzzleSolved) return;
        e.stopPropagation();
        startPuzzleTimer();

        if (selectedPieceId === null) {
          selectedPieceId = i;
          sfx.pop(1.2);
          renderDropBoard();
        } else if (selectedPieceId === i) {
          selectedPieceId = null;
          renderDropBoard();
        } else {
          // Swap piece at selectedPieceId and piece at i
          const prev = selectedPieceId;
          const temp = puzzleBoardState[prev];
          puzzleBoardState[prev] = puzzleBoardState[i];
          puzzleBoardState[i] = temp;

          puzzleMoves++;
          selectedPieceId = null;
          sfx.stamp();

          if (puzzleBoardState[i] === i || puzzleBoardState[prev] === prev) {
            sfx.sparkle();
          }

          renderDropBoard();
          checkWinCondition();
        }
      });
    }

    board.appendChild(slot);
  }

  const matchedEl = S('puzzleMatched');
  if (matchedEl) matchedEl.textContent = `${matchedCount}/9`;

  const movesEl = S('puzzleMoves');
  if (movesEl) movesEl.textContent = puzzleMoves;
}

// Universal Pointer / Touch Drag & Drop System
let activeDrag = null;

function attachDragEvents(el, pieceId) {
  el.addEventListener('pointerdown', e => {
    if (puzzleSolved) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startPuzzleTimer();

    const parentSlot = el.closest('.drop-slot');
    if (!parentSlot) return;
    const origin = parseInt(parentSlot.dataset.slotId, 10);

    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const ghost = el.cloneNode(true);
    ghost.className = 'floating-drag-ghost drag-piece';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);

    el.classList.add('is-dragging');
    sfx.pop(1.2);

    activeDrag = {
      el,
      ghost,
      pieceId,
      origin,
      offsetX,
      offsetY
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  });
}

function onPointerMove(e) {
  if (!activeDrag) return;
  e.preventDefault();
  const { ghost, offsetX, offsetY, origin } = activeDrag;
  ghost.style.left = `${e.clientX - offsetX}px`;
  ghost.style.top = `${e.clientY - offsetY}px`;

  // Highlight candidate drop targets
  $$('.drop-slot').forEach(drop => drop.classList.remove('drag-over'));
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const target = under ? under.closest('.drop-slot') : null;
  if (target && target.dataset.slotId != origin) {
    target.classList.add('drag-over');
  }
}

function onPointerUp(e) {
  if (!activeDrag) return;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);

  const { el, ghost, origin } = activeDrag;
  ghost.remove();
  el.classList.remove('is-dragging');
  $$('.drop-slot').forEach(drop => drop.classList.remove('drag-over'));

  const under = document.elementFromPoint(e.clientX, e.clientY);
  const targetSlot = under ? under.closest('.drop-slot') : null;

  if (targetSlot) {
    const targetId = parseInt(targetSlot.dataset.slotId, 10);
    if (targetId !== origin) {
      // Swap the two photo pieces!
      const temp = puzzleBoardState[origin];
      puzzleBoardState[origin] = puzzleBoardState[targetId];
      puzzleBoardState[targetId] = temp;

      puzzleMoves++;
      if (puzzleBoardState[targetId] === targetId || puzzleBoardState[origin] === origin) {
        sfx.sparkle();
      } else {
        sfx.stamp();
      }

      renderDropBoard();
      checkWinCondition();
    }
  }

  activeDrag = null;
}

function checkWinCondition() {
  if (puzzleBoardState.every((val, i) => val === i)) {
    triggerPuzzleWin();
  }
}

function triggerPuzzleWin() {
  puzzleSolved = true;
  if (puzzleTimerInterval) clearInterval(puzzleTimerInterval);
  puzzleTimerInterval = null;

  sfx.fanfare();
  screenShake();
  addScore(500, innerWidth / 2, innerHeight / 2, 'PUZZLE RESTORED! 🧩');
  rain(65);
  burst(36, innerWidth / 2, innerHeight / 2, ['#ffd166', '#ff3d7f', '#ff7aa6', '#1fd1c1', '#ffffff']);

  const board = S('dropBoard');
  if (board) board.classList.add('puzzle-solved-glow');

  const solvedCard = S('puzzleSolvedCard');
  if (solvedCard) solvedCard.classList.remove('hide');

  const nextBtn = S('puzzleNextBtn');
  if (nextBtn) nextBtn.classList.remove('hide');

  renderDropBoard();
}

function initPuzzle(photoIdx = 0) {
  puzzleCurrentIdx = photoIdx;
  puzzleSolved = false;
  selectedPieceId = null;
  puzzleMoves = 0;
  puzzleTimerStart = null;
  if (puzzleTimerInterval) clearInterval(puzzleTimerInterval);
  puzzleTimerInterval = null;

  const timerEl = S('puzzleTimer');
  if (timerEl) timerEl.textContent = '00:00';

  const board = S('dropBoard');
  if (board) board.classList.remove('puzzle-solved-glow');

  const solvedCard = S('puzzleSolvedCard');
  if (solvedCard) solvedCard.classList.add('hide');

  const nextBtn = S('puzzleNextBtn');
  if (nextBtn) nextBtn.classList.add('hide');

  // Scramble pieces on the 3x3 board
  puzzleBoardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let scrambled = false;
  let attempts = 0;
  while (!scrambled && attempts < 100) {
    attempts++;
    for (let k = 0; k < 22; k++) {
      const a = Math.floor(Math.random() * 9);
      const b = Math.floor(Math.random() * 9);
      if (a !== b) {
        const tmp = puzzleBoardState[a];
        puzzleBoardState[a] = puzzleBoardState[b];
        puzzleBoardState[b] = tmp;
      }
    }
    const misplaced = puzzleBoardState.filter((v, i) => v !== i).length;
    if (misplaced >= 4) scrambled = true;
  }

  renderPuzzleThumbnails();
  renderDropBoard();
}

hooks.puzzle = () => {
  if (!puzzlePhotosList.length) {
    buildPuzzlePhotoList();
  }
  initPuzzle(puzzleCurrentIdx);
};

// Bind Toolbar and Control buttons
(function initPuzzleControls() {
  const shuffleBtn = S('puzzleShuffleBtn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      sfx.pop(1.3);
      initPuzzle(puzzleCurrentIdx);
    });
  }

  const numBtn = S('puzzleNumbersBtn');
  if (numBtn) {
    numBtn.addEventListener('click', () => {
      puzzleShowNumbers = !puzzleShowNumbers;
      numBtn.innerHTML = `<span>🔢</span> Numbers: ${puzzleShowNumbers ? 'ON' : 'OFF'}`;
      sfx.pop(1.4);
      renderDropBoard();
    });
  }

  const solveBtn = S('puzzleSolveBtn');
  if (solveBtn) {
    solveBtn.addEventListener('click', () => {
      puzzleBoardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      renderDropBoard();
      triggerPuzzleWin();
    });
  }

  const previewBtn = S('puzzlePreviewBtn'), previewModal = S('puzzlePreviewModal');
  const previewClose = S('previewCloseBtn'), previewBackdrop = S('previewBackdrop');
  if (previewBtn && previewModal) {
    previewBtn.addEventListener('click', () => {
      sfx.sparkle();
      const cur = puzzlePhotosList[puzzleCurrentIdx] || { src: getBirthdayMemoryArtwork(), caption: 'Our Special Memory' };
      const img = S('puzzlePreviewImg');
      const cap = S('puzzlePreviewCap');
      if (img) img.src = cur.src;
      if (cap) cap.textContent = cur.caption || 'Our Special Memory';
      previewModal.classList.remove('hide');
    });
  }
  const hidePreview = () => { if (previewModal) previewModal.classList.add('hide'); };
  if (previewClose) previewClose.addEventListener('click', hidePreview);
  if (previewBackdrop) previewBackdrop.addEventListener('click', hidePreview);
})();

/* =========================================================
   STAGE 8 · THE SECRET LETTER & FINAL CELEBRATION
   ========================================================= */
let opening = false;

hooks.letter = () => {
  opening = false;
  const envPhase = S('envPhase'), notePhase = S('notePhase'), env2 = S('env2');
  const noteText = S('noteText'), noteSign = S('noteSign'), replayBtn = S('replayBtn');
  if (envPhase) envPhase.classList.remove('hide');
  if (notePhase) notePhase.classList.add('hide');
  if (env2) env2.classList.remove('open');
  if (noteText) noteText.textContent = '';
  if (noteSign) noteSign.classList.add('hide');
  if (replayBtn) replayBtn.classList.add('hide');
};

function openLetter() {
  if (opening || curId !== 'letter') return;
  opening = true;
  sfx.sparkle();
  
  const env = S('env2');
  if (env) env.classList.add('open');
  
  const r = env ? env.getBoundingClientRect() : { left: innerWidth / 2 - 50, width: 100, top: 300, height: 100 };
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.className = 'spark'; s.textContent = pick(['✨', '🎈', '🎂', '💖', '👑', '🎉', '⭐']);
    s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height * .35}px;font-size:${rand(14, 26)}px;--dx:${rand(-140, 140)}px;--dy:${rand(-200, -40)}px;--rot:${rand(-90, 90)}deg`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 1500);
  }

  addScore(1000, r.left + r.width / 2, r.top + r.height * .35, 'LETTER UNLOCKED! 💌');

  later(() => {
    const envPhase = S('envPhase'), notePhase = S('notePhase'), noteText = S('noteText');
    const noteSign = S('noteSign'), replayBtn = S('replayBtn'), letterScene = $('#s-letter');
    if (envPhase) envPhase.classList.add('hide');
    if (notePhase) notePhase.classList.remove('hide');
    if (letterScene) letterScene.scrollTop = 0;

    const finalScoreVal = S('finalScoreVal');
    if (finalScoreVal) finalScoreVal.textContent = score.toLocaleString();

    const skip = typeInto(noteText, tpl(CONFIG.letter), 28, () => {
      sfx.fanfare();
      const note = S('note');
      if (note) note.onclick = null;
      if (noteSign) noteSign.classList.remove('hide');
      if (replayBtn) replayBtn.classList.remove('hide');
      rain(55);
    });

    const note = S('note');
    if (note) note.onclick = () => {
      sfx.sparkle();
      skip(); // Instant finish on tap
    };
  }, 1400);
}

(function bindLetter() {
  const env2 = S('env2');
  if (env2) env2.addEventListener('click', openLetter);
  const envHint = S('envHint');
  if (envHint) envHint.addEventListener('click', openLetter);
})();

/* ---------- start game ---------- */
const initHash = window.location.hash.replace('#', '');
go(ORDER.includes(initHash) ? initHash : 'bow');
