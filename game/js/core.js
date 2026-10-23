// 舞台、灯、幕布、输入、粒子、字幕
const W = 1280, H = 720;
const SCR = { l: 24, r: W - 24, t: 46, b: H - 58 };   // 幕布范围
const GROUND = 600;
const LAMP = { x: 640, y: 300 };
const Q = new URLSearchParams(location.search);
// 字体随游戏带着（assets/fonts，只截了戏里用到的字），谁的电脑上看都一样
const FONT_BRUSH = '"WRL Brush","WRL Kai","STXingkai","STKaiti","KaiTi",serif';
const FONT_KAI = '"WRL Kai","STKaiti","KaiTi","SimSun",serif';

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- 输入 ----------
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['ArrowUp', 'KeyW', 'Space'],
  attack: ['KeyJ', 'KeyZ'], lamp: ['KeyK', 'KeyX'], eyes: ['KeyL', 'KeyC'], hair: ['KeyU', 'KeyV'],
  start: ['Enter', 'Space', 'KeyJ'],
};
const Input = {
  keys: {}, bot: {}, prev: {}, now: {},
  down(a) { return this.now[a]; },
  hit(a) { return this.now[a] && !this.prev[a]; },
  update() {
    this.prev = this.now; this.now = {};
    for (const a in KEYMAP) this.now[a] = KEYMAP[a].some(k => this.keys[k]) || !!this.bot[a];
  },
};
addEventListener('keydown', e => {
  Input.keys[e.code] = true; Sound.resume();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyM') Sound.toggleMute();
});
addEventListener('keyup', e => { Input.keys[e.code] = false; });
addEventListener('blur', () => { Input.keys = {}; });

// ---------- 幕布 ----------
let clothTex = null, groundTex = null;
function makeCloth() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512);
  const id = g.getImageData(0, 0, 512, 512); const d = id.data;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const i = (y * 512 + x) * 4;
    // 经纬线 + 斑驳
    const v = 236 + (x % 3 === 0 ? -10 : 0) + (y % 3 === 0 ? -8 : 0) + Math.random() * 14;
    d[i] = v; d[i + 1] = v - 3; d[i + 2] = v - 10; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  // 几块水渍
  for (let k = 0; k < 14; k++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = rand(30, 120);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(200,170,120,0.10)'); gr.addColorStop(1, 'rgba(200,170,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  }
  clothTex = c;
  // 地面花边：回纹带
  const t = document.createElement('canvas'); t.width = 96; t.height = 40;
  const h = t.getContext('2d');
  h.strokeStyle = '#2b1408'; h.lineWidth = 5; h.lineCap = 'square';
  h.beginPath();
  h.moveTo(4, 34); h.lineTo(4, 6); h.lineTo(40, 6); h.lineTo(40, 28); h.lineTo(16, 28); h.lineTo(16, 16); h.lineTo(28, 16);
  h.moveTo(52, 6); h.lineTo(52, 34); h.lineTo(88, 34); h.lineTo(88, 12); h.lineTo(64, 12); h.lineTo(64, 24); h.lineTo(76, 24);
  h.stroke();
  groundTex = t;
}

const Lamp = { power: 1 }; let lampFlick = 1;
// 气氛：gloom 0 = 暖黄的幕，1 = 暗红枯骨黄；cap = 紧箍咒念一回，灯就再也亮不回去一点
const Mood = { gloom: 0, cap: 1, tremble: 0, chants: 0, tears: [] };
function moodReset() { Mood.gloom = 0; Mood.cap = 1; Mood.tremble = 0; Mood.chants = 0; Mood.tears = []; }
const PAL_WARM = [[255, 247, 222], [250, 222, 160], [222, 156, 76], [110, 46, 14]];
const PAL_DARK = [[238, 220, 178], [214, 178, 118], [140, 52, 30], [34, 6, 3]];
function palette(i) { return PAL_WARM[i].map((v, k) => Math.round(lerp(v, PAL_DARK[i][k], Mood.gloom))); }
// 紧箍咒一念，幕布撕开一道口子，灯光从口子里直接漏出来
function addTear(x0, y0) {
  const side = Math.random() < 0.5;
  if (x0 === undefined) { x0 = side ? rand(SCR.l + 80, SCR.r - 80) : (Math.random() < 0.5 ? SCR.l : SCR.r); y0 = side ? (Math.random() < 0.6 ? SCR.t : SCR.b) : rand(SCR.t + 60, SCR.b - 60); }
  const tx = rand(W * 0.3, W * 0.7), ty = rand(H * 0.3, H * 0.65);
  let a = Math.atan2(ty - y0, tx - x0);
  const len = rand(150, 280), pts = [[x0, y0]], kids = [];
  let x = x0, y = y0;
  for (let d = 0; d < len; d += rand(16, 34)) {
    a += rand(-0.55, 0.55); x += Math.cos(a) * 24; y += Math.sin(a) * 24; pts.push([x, y]);
    if (Math.random() < 0.16) kids.push({ at: pts.length - 1, pts: [[x, y]] });
  }
  for (const k of kids) {
    let kx = k.pts[0][0], ky = k.pts[0][1], ka = a + (Math.random() < 0.5 ? 1 : -1) * rand(0.6, 1.2);
    for (let i = 0; i < 4; i++) { ka += rand(-0.5, 0.5); kx += Math.cos(ka) * 18; ky += Math.sin(ka) * 18; k.pts.push([kx, ky]); }
  }
  Mood.tears.push({ pts, kids, t: 0 });
}
function drawTears(g) {
  if (!Mood.tears.length) return;
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  g.lineJoin = 'round'; g.lineCap = 'round';
  const lit = Lamp.power * lampFlick;
  const path = (pts, n) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < Math.min(n, pts.length); i++) g.lineTo(pts[i][0], pts[i][1]); };
  for (const T of Mood.tears) {
    T.t += 1 / 60;
    const n = Math.ceil(T.pts.length * Math.min(1, T.t / 0.35));
    g.globalCompositeOperation = 'multiply'; g.strokeStyle = 'rgba(40,10,2,0.7)'; g.lineWidth = 7;
    path(T.pts, n); g.stroke();
    for (const k of T.kids) if (k.at < n) { g.lineWidth = 4; path(k.pts, 9); g.stroke(); }
    g.globalCompositeOperation = 'screen';
    g.strokeStyle = `rgba(255,236,190,${0.35 * lit})`; g.lineWidth = 6; g.filter = 'blur(4px)';
    path(T.pts, n); g.stroke();
    g.filter = 'none'; g.strokeStyle = `rgba(255,248,225,${0.95 * lit})`; g.lineWidth = 1.6;
    path(T.pts, n); g.stroke();
    for (const k of T.kids) if (k.at < n) { g.lineWidth = 1; path(k.pts, 9); g.stroke(); }
  }
  g.restore();
}
function drawScreen(g, tint) {
  g.fillStyle = '#0c0503'; g.fillRect(0, 0, W, H);
  const f = lampFlick * Lamp.power * Mood.cap;
  const r = 760 * (0.96 + 0.04 * lampFlick) * (1 - Mood.gloom * 0.12);
  const gr = g.createRadialGradient(LAMP.x, LAMP.y, 20, LAMP.x, LAMP.y, r);
  const c = (p, al) => `rgba(${p[0]},${p[1]},${p[2]},${al})`;
  gr.addColorStop(0, c(palette(0), f));
  gr.addColorStop(0.3, c(palette(1), f));
  gr.addColorStop(0.62, c(palette(2), f * 0.95));
  gr.addColorStop(1, c(palette(3), f * 0.9));
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  g.fillStyle = '#1a0a04'; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t);
  g.fillStyle = gr; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5;
  g.drawImage(clothTex, SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (tint) { g.fillStyle = tint; g.globalCompositeOperation = 'multiply'; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.globalCompositeOperation = 'source-over'; }
  g.restore();
}
function drawGroundBand(g, camX) {
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgba(70,30,10,0.85)'; g.fillRect(SCR.l, GROUND + 4, SCR.r - SCR.l, 6);
  const off = -((camX) % 96);
  g.globalAlpha = 0.9;
  for (let x = off - 96; x < W; x += 96) g.drawImage(groundTex, x, GROUND + 14);
  g.fillStyle = 'rgba(70,30,10,0.85)'; g.fillRect(SCR.l, GROUND + 58, SCR.r - SCR.l, 4);
  g.restore();
}
function drawVignette(g, eyes) {
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  const gr = g.createRadialGradient(LAMP.x, LAMP.y, 200, LAMP.x, LAMP.y, 820);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(30,6,0,${0.55 + 0.3 * Mood.gloom})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 灯芯的热点
  g.globalCompositeOperation = 'screen';
  const hg = g.createRadialGradient(LAMP.x, LAMP.y, 0, LAMP.x, LAMP.y, 260);
  hg.addColorStop(0, `rgba(255,240,200,${0.22 * lampFlick * Lamp.power})`); hg.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = hg; g.fillRect(0, 0, W, H);
  if (eyes > 0) {
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = `rgba(255,${Math.round(150 - 40 * eyes)},${Math.round(110 - 80 * eyes)},${eyes})`;
    g.fillRect(0, 0, W, H);
  }
  g.restore();
}
function drawFrame(g) {
  g.save();
  g.fillStyle = '#1b0b05';
  g.fillRect(0, 0, W, SCR.t); g.fillRect(0, SCR.b, W, H - SCR.b); g.fillRect(0, 0, SCR.l, H); g.fillRect(SCR.r, 0, W - SCR.r, H);
  g.strokeStyle = '#8a5a1c'; g.lineWidth = 2;
  g.strokeRect(SCR.l - 5, SCR.t - 5, SCR.r - SCR.l + 10, SCR.b - SCR.t + 10);
  g.strokeStyle = '#4a2a0c'; g.lineWidth = 6;
  g.strokeRect(SCR.l - 1, SCR.t - 1, SCR.r - SCR.l + 2, SCR.b - SCR.t + 2);
  // 四角的如意头
  g.fillStyle = '#8a5a1c';
  for (const [x, y] of [[SCR.l, SCR.t], [SCR.r, SCR.t], [SCR.l, SCR.b], [SCR.r, SCR.b]]) {
    g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// ---------- 粒子 ----------
const Parts = [];
function burst(x, y, n, kind, opt = {}) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(80, 380) * (opt.sp || 1);
    Parts.push({
      kind, x, y, vx: Math.cos(a) * sp + (opt.vx || 0), vy: Math.sin(a) * sp - (opt.up || 150),
      r: rand(0, 6), vr: rand(-10, 10), life: rand(0.6, 1.3) * (opt.life || 1), t: 0,
      s: rand(5, 13) * (opt.size || 1),
      col: opt.col || ['#b3261e', '#2f7d4a', '#d9a520', '#1c1c1c'][i % 4],
    });
  }
}
function smoke(x, y, n = 8, size = 1) {
  for (let i = 0; i < n; i++) Parts.push({ kind: 'smoke', x: x + rand(-30, 30) * size, y: y + rand(-40, 20) * size, vx: rand(-40, 40), vy: rand(-80, -20), t: 0, life: rand(0.7, 1.2), s: rand(30, 60) * size, r: 0, vr: 0 });
}
function updateParts(dt) {
  for (let i = Parts.length - 1; i >= 0; i--) {
    const p = Parts[i];
    p.t += dt;
    if (p.t > p.life) { Parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    if (p.kind === 'paper' || p.kind === 'hair') { p.vy += 700 * dt; p.vx *= 0.98; if (p.y > GROUND + 10) { p.y = GROUND + 10; p.vy *= -0.3; p.vx *= 0.6; } }
    if (p.kind === 'spark') { p.vx *= 0.92; p.vy *= 0.92; }
    if (p.kind === 'smoke') { p.vx *= 0.97; p.s += 40 * dt; }
  }
}
function drawParts(g, camX) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  for (const p of Parts) {
    const k = 1 - p.t / p.life;
    const x = p.x - camX, y = p.y;
    if (p.kind === 'smoke') {
      const gr = g.createRadialGradient(x, y, 0, x, y, p.s);
      gr.addColorStop(0, `rgba(60,40,30,${0.35 * k})`); gr.addColorStop(1, 'rgba(60,40,30,0)');
      g.fillStyle = gr; g.fillRect(x - p.s, y - p.s, p.s * 2, p.s * 2);
    } else if (p.kind === 'paper') {
      g.save(); g.translate(x, y); g.rotate(p.r); g.globalAlpha = Math.min(1, k * 2);
      g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      g.restore();
    } else if (p.kind === 'hair') {
      g.save(); g.translate(x, y); g.rotate(p.r); g.globalAlpha = k;
      g.strokeStyle = '#3a1c08'; g.lineWidth = 2; g.beginPath(); g.moveTo(-p.s, 0); g.quadraticCurveTo(0, -4, p.s, 0); g.stroke();
      g.restore();
    }
  }
  g.globalCompositeOperation = 'screen';
  for (const p of Parts) {
    if (p.kind !== 'spark') continue;
    const k = 1 - p.t / p.life;
    g.fillStyle = `rgba(255,${190 + Math.random() * 60 | 0},90,${k})`;
    g.beginPath(); g.arc(p.x - camX, p.y, p.s * 0.4 * k + 1, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// ---------- 字幕 ----------
// 竖排一行小字日语：浅色字垫一条半透明深底，亮场暗场都看得清（字号用调用处设好的 g.font）
function drawJaColumn(g, text, x, y0, step) {
  const cs = [...text], w = step + 6;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(20,6,2,0.58)'; g.fillRect(x - w / 2, y0 - step / 2 - 5, w, cs.length * step + 10);
  g.fillStyle = '#f2e2bc'; cs.forEach((c, i) => g.fillText(c, x, y0 + i * step));
  g.restore();
}
// 中文纸条底下添一行小字日语（只在日语模式）
function drawJaLine(g, text, y, size = 19) {
  g.save(); g.font = `${size}px ${FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(text).width + 40;
  g.fillStyle = 'rgba(20,6,2,0.62)'; g.fillRect(W / 2 - w / 2, y - size * 0.75, w, size * 1.5);
  g.fillStyle = '#f2e2bc'; g.fillText(text, W / 2, y + 1);
  g.restore();
}
const Captions = { q: [], cur: null, t: 0 };
function say(who, text, dur) {
  Captions.q.push({ who, text, dur: dur || Math.max(2.2, text.length * 0.16 + 1.0) });
}
// 小声说的：自言自语，或者只说给悟空一个人听
function mutter(who, text, dur) {
  Captions.q.push({ who, text, soft: true, dur: dur || Math.max(2.6, text.length * 0.18 + 1.2) });
}
function sayClear() { Captions.q = []; Captions.cur = null; }
function captionsBusy() { return Captions.cur || Captions.q.length; }
function updateCaptions(dt) {
  if (!Captions.cur && Captions.q.length) { Captions.cur = Captions.q.shift(); Captions.t = 0; Sound.sfx('pickup'); }
  if (Captions.cur) { Captions.t += dt; if (Captions.t > Captions.cur.dur) Captions.cur = null; }
}
const WHO_COLOR = { '悟空': '#b3261e', '唐僧': '#7a4a12', '村姑': '#2f7d4a', '老婆婆': '#1f3d7a', '老公公': '#1f3d7a', '白骨精': '#2f6d5a', '旁白': '#3a2410', '小妖': '#2a2a2a' };
function drawCaption(g) {
  const c = Captions.cur;
  if (!c) return;
  const a = Math.min(1, Captions.t * 6, (c.dur - Captions.t) * 5);
  g.save(); g.globalAlpha = a;
  if (c.soft) {
    g.font = `30px ${FONT_KAI}`;
    const tw = g.measureText(c.text).width;
    const w = tw + (c.who ? 130 : 60), h = 52, x = W / 2 - w / 2, y = SCR.t + 24;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, 'rgba(20,6,2,0)'); gr.addColorStop(0.12, 'rgba(20,6,2,0.78)'); gr.addColorStop(0.88, 'rgba(20,6,2,0.78)'); gr.addColorStop(1, 'rgba(20,6,2,0)');
    g.fillStyle = gr; g.fillRect(x - 40, y, w + 80, h);
    g.textBaseline = 'middle';
    let tx = x + 26;
    if (c.who) { g.font = `22px ${FONT_KAI}`; g.fillStyle = '#9a7a56'; g.fillText(c.who, tx, y + h / 2 + 1); tx += g.measureText(c.who).width + 22; }
    g.font = `30px ${FONT_KAI}`; g.fillStyle = '#e8d6b0';
    g.fillText(c.text, tx, y + h / 2 + 1);
    const j = ja(c.text); if (j) drawJaLine(g, j, y + h + 16);
    g.restore();
    return;
  }
  g.font = `34px ${FONT_BRUSH}`;
  const tw = g.measureText(c.text).width;
  const w = Math.max(360, tw + (c.who ? 150 : 70)), h = 66;
  const x = W / 2 - w / 2, y = SCR.t + 18;
  // 纸条
  g.fillStyle = 'rgba(246,232,200,0.94)';
  g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + w - 10, y); g.lineTo(x + w, y + h / 2); g.lineTo(x + w - 10, y + h); g.lineTo(x + 10, y + h); g.lineTo(x, y + h / 2); g.closePath(); g.fill();
  g.strokeStyle = '#7a3a12'; g.lineWidth = 2; g.stroke();
  g.textBaseline = 'middle';
  let tx = x + 30;
  if (c.who) {
    g.fillStyle = WHO_COLOR[c.who] || '#3a2410';
    g.font = `bold 26px ${FONT_KAI}`;
    g.fillText(c.who, tx, y + h / 2 + 1);
    tx += g.measureText(c.who).width + 20;
    g.fillRect(tx - 12, y + 16, 2, h - 32);
  }
  g.fillStyle = '#2a1408'; g.font = `34px ${FONT_BRUSH}`;
  g.fillText(c.text, tx, y + h / 2 + 2);
  const j = ja(c.text); if (j) drawJaLine(g, j, y + h + 18);
  g.restore();
}

// 大字印章（一打、二打……）
const Stamps = [];
function stamp(text, col = '#b3261e') { if (typeof logEv === 'function') logEv('stamp:' + text); Stamps.push({ text, col, t: 0, life: 2.2 }); Sound.phrase('仓 - 才 仓', 260); }
function drawStamps(g, dt) {
  for (let i = Stamps.length - 1; i >= 0; i--) {
    const s = Stamps[i]; s.t += dt;
    if (s.t > s.life) { Stamps.splice(i, 1); continue; }
    const k = s.t < 0.15 ? 1.8 - s.t / 0.15 * 0.8 : 1;
    const a = Math.min(1, (s.life - s.t) * 3);
    g.save(); g.globalAlpha = a; g.translate(W / 2, 250); g.scale(k, k); g.rotate(-0.08);
    g.fillStyle = 'rgba(246,232,200,0.0)';
    g.strokeStyle = s.col; g.lineWidth = 6;
    g.font = `120px ${FONT_BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(s.text).width;
    g.strokeRect(-tw / 2 - 26, -78, tw + 52, 156);
    g.fillStyle = s.col; g.globalCompositeOperation = 'multiply';
    g.fillText(s.text, 0, 6);
    g.restore();
  }
}
