// 舞台：场景、角色、瀑布、河、簿子、幕后那只手。
// 底子在 core.js（灯、幕布、字幕、粒子）、rig.js（皮影关节）、audio.js（锣鼓）。

const HS_IMAGES = ['wukong_head_bare', 'hand_open', 'hand_grip', 'yuan_body', 'yuan_head'];
// 五指山：hand_open.png 里指缝底那一行、四根手指的中线
const PALM = { base: 600, fingers: [129, 300, 468, 645], mid: 468, thumb: 946 };

Object.assign(WHO_COLOR, {
  '通背老猿': '#5a4a2a', '小猴': '#7a4a12', '猴子': '#7a4a12', '如来': '#8a5a10', '八戒': '#2a2a2a',
  '老鼋': '#1f4d5a', '阿傩': '#6a3a12', '天上': '#8a5a10', '菩萨': '#2f6d5a', '她': '#2f6d5a', '老公公': '#1f3d7a',
});

// 悟空没戴箍的样子：同一套骨头，换一个头
RIGS.wukong_bare = JSON.parse(JSON.stringify(RIGS.wukong));
RIGS.wukong_bare.bones.find(b => b.n === 'head').img = 'wukong_head_bare';

// 这出戏另用的几个姿势
Object.assign(ANIMS.wukong, {
  grieve: { fps: 2, loop: 1, snap: 0.25, base: WK_BASE, frames: [
    { chest: 22, head: 30, armF_u: 135, armF_l: 120, prop: 0, armB_u: 120, armB_l: 120, legF_u: 18, legF_l: -10, legB_u: -8, dy: 10 },
    { chest: 24, head: 34, armF_u: 140, armF_l: 118, prop: 0, armB_u: 124, armB_l: 124, legF_u: 18, legF_l: -10, legB_u: -8, dy: 14 },
  ] },
  kneel: { fps: 2, loop: 1, snap: 0.2, base: WK_BASE, frames: [
    { chest: 30, head: 22, armF_u: 70, armF_l: 70, prop: 0, armB_u: 60, armB_l: 70, legF_u: 88, legF_l: -88, legB_u: -6, legB_l: -88, dy: 128 },
    { chest: 32, head: 24, armF_u: 72, armF_l: 72, prop: 0, armB_u: 62, armB_l: 72, legF_u: 88, legF_l: -88, legB_u: -6, legB_l: -88, dy: 130 },
  ] },
  touch: { fps: 3, loop: 1, snap: 0.3, base: WK_BASE, frames: [
    { armF_u: 175, armF_l: 140, prop: 0, head: 8, chest: 2 },
    { armF_u: 168, armF_l: 146, prop: 0, head: 12, chest: 4 },
  ] },
  look: { fps: 2, loop: 1, snap: 0.25, base: WK_BASE, frames: [
    { chest: 16, head: 34, armF_u: 55, armF_l: 95, prop: 0, armB_u: 45, armB_l: 95 },
    { chest: 18, head: 36, armF_u: 58, armF_l: 92, prop: 0, armB_u: 48, armB_l: 98, dy: 3 },
  ] },
  fly: { fps: 4, loop: 1, snap: 0.4, base: WK_BASE, frames: [
    { chest: 18, head: -14, armF_u: 120, armF_l: 10, prop: 85, armB_u: -40, armB_l: 20, legF_u: 40, legF_l: -70, legB_u: -30, legB_l: -40 },
    { chest: 20, head: -12, armF_u: 125, armF_l: 10, prop: 85, armB_u: -45, armB_l: 20, legF_u: 44, legF_l: -74, legB_u: -34, legB_l: -40, dy: 6 },
  ] },
});

// ---------------- 状态 ----------------
const G = {
  mode: 'title', t: 0, camX: 0, worldW: W, actors: [], scen: [], lock: null, inputLock: false,
  hintObj: null, area: null, shakeAmt: 0, flash: 0, fade: 0, tweens: [], hooks: {}, ctrl: '',
  bot: Q.has('auto'), botAct: null, behind: false, overlay: null, sceneName: '',
  D: { crossed: [], crossedApe: false, promise: false, asked: false, letGo: false, night: 1 },
  add(a) { this.actors.push(a); return a; },
  remove(a) { this.actors = this.actors.filter(x => x !== a); },
  shake(n) { this.shakeAmt = Math.max(this.shakeAmt, n); },
  hint(text, dur = 5) { this.hintObj = { text, t: 0, dur }; },
  tween(obj, key, to, dur, ease) { this.tweens = this.tweens.filter(t => !(t.obj === obj && t.key === key)); this.tweens.push({ obj, key, from: obj[key], to, dur, t: 0, ease }); },
  areaTitle(a, b, c) { logEv('area:' + b); this.area = { a, b, c, t: 0 }; this.sceneName = b; Sound.phrase('台 令 台 令 仓', 220, 0.8); },
};
const smooth = k => k * k * (3 - 2 * k);

G.cuts = { area: null, ev: null }; G.waits = { area: null, ev: null };
function runCut(gen, ch = 'ev') { G.cuts[ch] = gen; G.waits[ch] = null; stepCut(ch, 0); }
function stepCut(ch, dt) {
  const gen = G.cuts[ch];
  if (!gen) return;
  const w = G.waits[ch];
  if (w !== null) {
    if (typeof w === 'number') { G.waits[ch] = w - dt; if (G.waits[ch] > 0) return; }
    else if (!w()) return;
  }
  const r = gen.next();
  if (G.cuts[ch] !== gen) return;
  if (r.done) { G.cuts[ch] = null; G.waits[ch] = null; return; }
  G.waits[ch] = r.value === undefined ? 0 : r.value;
}
const waitSay = () => () => !captionsBusy();
function* sayW(who, text, dur) { say(who, text, dur); yield waitSay(); }
function* mutW(who, text, dur) { mutter(who, text, dur); yield waitSay(); }

// 屏幕坐标：站到幕后时，整个世界左右反过来
const SX = x => G.behind ? W - (x - G.camX) : x - G.camX;
const SF = f => G.behind ? -f : f;

// ---------------- 景片 ----------------
const blurCache = {};
function blurred(name, px) {
  const key = name + '|' + px;
  if (blurCache[key]) return blurCache[key];
  const im = IMG[name]; if (!im) return null;
  const pad = Math.ceil(px * 3);
  const c = document.createElement('canvas'); c.width = im.width + pad * 2; c.height = im.height + pad * 2;
  const x = c.getContext('2d'); x.filter = `blur(${px}px) grayscale(0.35)`; x.drawImage(im, pad, pad);
  c.pad = pad;
  return (blurCache[key] = c);
}
const PARA = { sky: 0.15, far: 0.3, mid: 0.65, main: 1, front: 1.25 };
function drawScn(g, item) {
  const P = PARA[item.layer];
  const B = { sky: 4, far: 3.2, mid: 1.6, main: 0, front: 0 }[item.layer];
  const A = { sky: 0.35, far: 0.42, mid: 0.62, main: 1, front: 0.95 }[item.layer];
  const name = IMG[item.img] ? item.img : item.fb;
  if (!name || !IMG[name]) return;
  const im = B ? blurred(name, B) : IMG[name];
  const base = IMG[name];
  const w = base.width * item.s, h = base.height * item.s;
  let x = item.x - G.camX * P;
  if (G.behind) x = W - x;
  if (x + w < -50 || x - w > W + 50) return;
  g.save();
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = item.a ?? A;
  if (item.filter) g.filter = item.filter;
  g.translate(x, item.y); g.scale(item.flip * (G.behind ? -1 : 1), 1);
  const pad = (im.pad || 0) * item.s;
  g.drawImage(im, -w / 2 - pad, -h - pad, w + pad * 2, h + pad * 2);
  g.restore();
}
function scn(img, x, layer, opt = {}) { return { img, x, layer, s: opt.s || 1, y: opt.y ?? GROUND + 8, flip: opt.flip || 1, a: opt.a, fb: opt.fb, filter: opt.filter }; }

// ---------------- 角色 ----------------
// 悟空：玩家提着的那一个
class Hero {
  constructor(x, opt = {}) {
    this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0; this.onG = true; this.face = 1;
    this.p = new Puppet('wukong', ANIMS.wukong); this.p.play('idle');
    this.scale = opt.scale || 1; this.prop = opt.prop ?? true; this.setBare(opt.bare ?? false);
    this.state = 'idle'; this.st = 0; this.rods = true; this.frozen = false; this.anim = null; this.hidden = false;
    this.floor = GROUND; this.sink = 0; this.speed = 300; this.ride = null; this.alpha = 1; this.filter = '';
    this.tremble = 0; this.hitSet = new Set(); this.snapped = 0; this.fly = false;
  }
  setBare(b) { this.bare = b; this.p.rig = RIGS[b && IMG.wukong_head_bare ? 'wukong_bare' : 'wukong']; }
  get ctl() { return !G.inputLock && !this.frozen; }
  update(dt) {
    const ctl = this.ctl, down = a => ctl && Input.down(a), hit = a => ctl && Input.hit(a);
    this.st += dt;
    if (this.state === 'headache' && this.st > this.headT) this.state = 'idle';
    const busy = this.state === 'headache';
    let dir = 0;
    if (!busy) {
      dir = (down('right') ? 1 : 0) - (down('left') ? 1 : 0);
      const atk = this.state === 'attack';
      this.vx = dir * this.speed * (atk && this.onG ? 0.35 : 1);
      if (dir && !atk) this.face = dir;
      if (hit('jump') && this.onG && !this.fly && !this.noJump) { this.vy = -1000 * Math.sqrt(this.scale); this.onG = false; Sound.sfx('jump'); this.p.play('jump', true); }
      if (hit('attack') && !atk && !this.noAttack) this.swing();
    } else this.vx = 0;
    if (this.ride) this.x += this.ride.vx * dt;
    if (!this.fly) {
      this.vy += 2500 * dt; this.y += this.vy * dt;
      if (this.y >= this.floor) { if (!this.onG && this.vy > 300) Sound.sfx('land'); this.y = this.floor; this.vy = 0; this.onG = true; }
    }
    let nx = this.x + this.vx * dt;
    for (const w of G.walls || []) {
      if (w.open && w.open(this)) continue;
      if (this.x <= w.x && nx > w.x) nx = w.x;
      if (this.x >= w.x && nx < w.x) nx = w.x;
    }
    if (G.lock) nx = clamp(nx, G.lock[0] + 40, G.lock[1] - 40);
    this.x = clamp(nx, 40, G.worldW - 40);
    if (this.state === 'attack') {
      if (this.st > 0.07 && this.st < 0.26 && G.hooks.hit) G.hooks.hit(this);
      if (this.p.done) this.state = 'idle';
    }
    if (this.anim) this.p.play(this.anim);
    else if (this.state === 'idle') {
      if (this.fly) this.p.play('fly');
      else if (!this.onG) this.p.play(this.vy < 0 ? 'jump' : 'fall');
      else if (Math.abs(this.vx) > 10) this.p.play('walk');
      else this.p.play('idle');
    }
    this.p.step(dt);
  }
  swing() { this.state = 'attack'; this.st = 0; this.hitSet.clear(); this.p.play('attack', true); Sound.sfx('swing'); G.hooks.swing && G.hooks.swing(this); }
  headache(dur = 2.4) { this.state = 'headache'; this.st = 0; this.headT = dur; this.p.play('headache', true); this.vx = 0; G.shake(6); }
  reach() { const r = 225 * this.scale; return { x0: Math.min(this.x, this.x + this.face * r), x1: Math.max(this.x, this.x + this.face * r) }; }
  draw(g) {
    if (this.hidden) return;
    const tr = this.tremble + (this.state === 'headache' ? 0.8 : 0);
    const x = SX(this.x) + rand(-1, 1) * 4 * tr;
    const s = SC.wukong * this.scale;
    this.p.draw(g, x, this.y + this.sink + rand(-1, 1) * 2 * tr, s, SF(this.face), { alpha: this.alpha, filter: this.filter, hide: this.prop ? null : { prop: 1 } });
    if (this.hat > 0) drawHat(g, this.p.mats.head, this.hat);
    if (this.rods && G.hooks.rods !== false) {
      const j = this.p.joints;
      if (G.rodGrip) drawRodsTo(g, [j.head, j.armF_l_tip, j.armB_l_tip], G.rodGrip, this.rodDrop || 0);
      else drawRods(g, [j.head, j.armF_l_tip, j.armB_l_tip], SF(this.face), -this.vx * 0.08, 0, this.snapped);
    }
  }
}

// 用骨头的皮影（师父、八戒、阿傩、老公公……）
class Pup {
  constructor(rig, anims, x, opt = {}) {
    this.p = new Puppet(rig, anims); this.p.play('idle'); this.rig = rig;
    this.x = x; this.y = opt.y ?? GROUND; this.face = opt.face ?? 1; this.s = opt.s ?? SC[rig] ?? 0.45;
    this.rodJ = opt.rods === undefined ? ['head', 'armF_u'] : opt.rods; this.filter = opt.filter || ''; this.alpha = opt.alpha ?? 1;
    this.gotoX = null; this.speed = opt.speed || 120; this.forceAnim = null; this.vx = 0; this.ride = null; this.hidden = false; this.z = opt.z || 0;
  }
  goto(x, speed) { this.gotoX = x; if (speed) this.speed = speed; }
  update(dt) {
    this.vx = 0;
    if (this.gotoX !== null) {
      const d = this.gotoX - this.x;
      if (Math.abs(d) > 6) { this.vx = Math.sign(d) * this.speed; this.face = Math.sign(d); } else this.gotoX = null;
    }
    this.x += this.vx * dt + (this.ride ? this.ride.vx * dt : 0);
    this.p.play(this.forceAnim || (Math.abs(this.vx) > 5 ? 'walk' : 'idle'));
    this.p.step(dt);
  }
  draw(g) {
    if (this.hidden) return;
    this.p.draw(g, SX(this.x), this.y, this.s, SF(this.face), { filter: this.filter, alpha: this.alpha });
    if (this.rodJ && this.rodJ.length && !G.behind) drawRods(g, this.rodJ.map(n => this.p.joints[n + '_tip'] || this.p.joints[n]), SF(this.face), 0);
  }
}

// 一整片的皮影（小猴、老猿、如来、景片里会动的东西）
class Spr {
  constructor(img, x, opt = {}) {
    this.img = img; this.fb = opt.fb; this.x = x; this.y = opt.y ?? GROUND + 6; this.s = opt.s ?? 0.5; this.face = opt.face ?? -1; this.artFace = opt.artFace ?? -1;
    this.bob = opt.bob ?? 4; this.t = rand(0, 6); this.rods = opt.rods ?? true; this.filter = opt.filter || ''; this.alpha = opt.alpha ?? 1;
    this.gotoX = null; this.speed = opt.speed || 140; this.hop = opt.hop ?? 14; this.vx = 0; this.rot = 0; this.z = opt.z || 0; this.hidden = false;
    this.blur = opt.blur || 0; this.ride = null; this.sx = opt.sx ?? 1; this.sy = opt.sy ?? 1; this.cloud = opt.cloud || 0;
  }
  goto(x, speed) { this.gotoX = x; if (speed) this.speed = speed; }
  update(dt) {
    this.t += dt; this.vx = 0;
    if (this.gotoX !== null) {
      const d = this.gotoX - this.x;
      if (Math.abs(d) > 6) { this.vx = Math.sign(d) * this.speed; this.face = Math.sign(d); } else this.gotoX = null;
    }
    this.x += this.vx * dt + (this.ride ? this.ride.vx * dt : 0);
  }
  get im() { return IMG[this.img] || IMG[this.fb]; }
  draw(g) {
    const im = this.im; if (!im || this.hidden) return;
    const moving = Math.abs(this.vx) > 5;
    // 一顿一顿地跳着走，站着时轻轻晃
    const ph = Math.floor(this.t * (moving ? 6 : 2.2));
    const dy = moving ? -(ph % 2) * this.hop : (ph % 2) * this.bob;
    const w = im.width * this.s * this.sx, h = im.height * this.s * this.sy;
    const x = SX(this.x), sx = (SF(this.face) === this.artFace ? 1 : -1);
    g.save();
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = this.alpha;
    let f = this.filter; if (this.blur) f = (f ? f + ' ' : '') + `blur(${this.blur}px)`;
    if (f) g.filter = f;
    g.translate(x, this.y + dy); g.rotate(this.rot); g.scale(sx, 1);
    g.drawImage(im, -w / 2, -h, w, h);
    if (this.cloud && IMG.scn_cloud) {
      const c = IMG.scn_cloud, cw = c.width * this.cloud, ch = c.height * this.cloud;
      g.drawImage(c, -cw / 2, -ch * 0.55, cw, ch);
    }
    g.restore();
    if (this.rods && !G.behind) drawRods(g, [[x - sx * w * 0.08, this.y + dy - h * 0.82]], SF(this.face), 0);
  }
}

// 签子都攥在同一只手里（幕后那一幕）
function drawRodsTo(g, pts, grip, drop = 0) {
  g.save(); g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
  pts.forEach((p, i) => {
    if (!p) return;
    const gx = grip.x + (i - 1) * 7, gy = grip.y;
    // 松手：签子从手里滑出去，往下倒
    const ex = lerp(gx, p[0] + (i - 1) * 40, drop), ey = lerp(gy, H + 80, drop);
    g.strokeStyle = 'rgba(60,34,14,0.95)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(ex, ey); g.stroke();
    g.strokeStyle = 'rgba(190,150,90,0.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(p[0] + 1, p[1]); g.lineTo(ex + 1, ey); g.stroke();
  });
  g.restore();
}

// 一顶花帽子（观音给的那顶）
function drawHat(g, M, k) {
  if (!M) return;
  g.save(); g.globalAlpha = Math.min(1, k);
  g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  g.globalCompositeOperation = 'multiply';
  g.translate(50, -112);
  g.fillStyle = '#c0392b'; g.strokeStyle = '#2a1408'; g.lineWidth = 4;
  g.beginPath(); g.ellipse(0, 0, 70, 44, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e6b33a';
  g.beginPath(); g.rect(-74, -4, 148, 14); g.fill(); g.stroke();
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 26, -20 - Math.abs(i) * -4, 9, 0, Math.PI * 2); g.fill(); g.stroke(); }
  g.restore();
}

// ---------------- 影子手 ----------------
// 灯后的手投到幕上：离灯越近，影子越大越糊
function drawShadowImg(g, name, x, y, s, opt = {}) {
  const im = IMG[name]; if (!im) return;
  const ax = opt.ax ?? im.width / 2, ay = opt.ay ?? 0;
  g.save();
  g.globalCompositeOperation = opt.comp || 'multiply';
  g.globalAlpha = (opt.alpha ?? 0.95) * (opt.lit ?? (0.4 + 0.6 * Lamp.power * lampFlick));
  if (opt.blur) g.filter = `blur(${opt.blur.toFixed(1)}px)`;
  if (opt.filter) g.filter = opt.filter;
  g.translate(x, y); g.rotate(opt.rot || 0); g.scale(s * (opt.sx ?? 1), s * (opt.sy ?? 1));
  g.drawImage(im, -ax, -ay);
  g.restore();
}

// ---------------- 瀑布 ----------------
function drawWaterfall(g, wx, width, opt = {}) {
  const x = SX(wx);
  if (x < -width - 40 || x > W + width + 40) return;
  const top = SCR.t, bot = GROUND + 6, thin = opt.thin || 1;
  g.save();
  g.beginPath(); g.rect(x - width / 2, top, width, bot - top); g.clip();
  g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
  gr.addColorStop(0, 'rgba(70,110,120,0.55)'); gr.addColorStop(0.5, 'rgba(110,150,150,0.35)'); gr.addColorStop(1, 'rgba(70,110,120,0.55)');
  g.fillStyle = gr; g.fillRect(x - width / 2, top, width, bot - top);
  // 一道一道往下流的刻线
  g.strokeStyle = 'rgba(30,60,70,0.55)'; g.lineWidth = 3;
  const n = Math.round(9 * thin);
  for (let i = 0; i < n; i++) {
    const lx = x - width / 2 + (i + 0.5) * width / n;
    const off = ((G.t * 260 + i * 97) % 120);
    for (let y = top - 120 + off; y < bot; y += 120) {
      g.beginPath(); g.moveTo(lx, y); g.quadraticCurveTo(lx + 5, y + 30, lx, y + 70); g.stroke();
    }
  }
  g.globalCompositeOperation = 'screen';
  g.strokeStyle = `rgba(255,250,230,${0.35 * Lamp.power})`; g.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const lx = x - width / 2 + (i + 0.2) * width / n;
    const off = ((G.t * 320 + i * 53) % 90);
    for (let y = top - 90 + off; y < bot; y += 90) { g.beginPath(); g.moveTo(lx, y); g.lineTo(lx, y + 28); g.stroke(); }
  }
  g.restore();
  // 底下翻起来的水花
  g.save(); g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 6; i++) {
    const k = ((G.t * 1.3 + i / 6) % 1), r = 20 + k * 40;
    g.strokeStyle = `rgba(40,70,80,${0.5 * (1 - k)})`; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x + (i - 2.5) * 22, bot - 4, r, r * 0.3, 0, Math.PI, 0); g.stroke();
  }
  g.restore();
}

// ---------------- 河 ----------------
const WATER_Y = GROUND - 30;
function drawWater(g, front) {
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  g.globalCompositeOperation = 'multiply';
  const wave = (x, k) => Math.sin((x + G.camX * 1.0) * 0.012 + G.t * 1.6 + k) * 8 + Math.sin((x + G.camX) * 0.031 - G.t * 2.2 + k) * 4;
  if (front) {
    g.fillStyle = 'rgba(60,90,100,0.62)';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, WATER_Y + 30 + wave(x, 0));
    g.lineTo(W, H); g.closePath(); g.fill();
    // 回纹一样的浪头
    g.strokeStyle = 'rgba(20,40,50,0.7)'; g.lineWidth = 3;
    for (let row = 0; row < 3; row++) {
      g.beginPath();
      for (let x = 0; x <= W; x += 16) { const y = WATER_Y + 30 + row * 26 + wave(x, row * 1.7); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      for (let x = ((-G.camX * (1 + row * 0.15)) % 140 + 140) % 140 - 140; x < W; x += 140) {
        const y = WATER_Y + 30 + row * 26 + wave(x, row * 1.7);
        g.beginPath(); g.arc(x, y - 6, 9, Math.PI * 0.2, Math.PI * 1.6); g.stroke();
      }
    }
  } else {
    g.fillStyle = 'rgba(80,110,120,0.35)';
    g.fillRect(0, WATER_Y - 20, W, H);
  }
  g.restore();
}

// ---------------- 簿子 ----------------
// cols：[{text, red, crossed(0..1), wob}]，从右往左一列一列竖着写
function makeBook(title, texts, opt = {}) {
  return {
    title, k: 0, cur: opt.cur ?? 0, brush: opt.brush ?? true, hand: null, writing: null,
    cols: texts.map(t => ({ text: t.text ?? t, red: !!t.red, dim: !!t.dim, crossed: 0, wob: Array.from({ length: 24 }, () => rand(-5, 5)) })),
  };
}
function drawBook(g, B) {
  if (!B || B.k <= 0) return;
  const k = smooth(B.k);
  const w = 900, h = 520, x0 = W / 2 - w / 2, y0 = lerp(H + 40, 110, k);
  g.save();
  g.globalAlpha = Math.min(1, B.k * 1.4);
  g.fillStyle = 'rgba(10,4,2,0.45)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ead9b0'; g.fillRect(x0, y0, w, h);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(clothTex, x0, y0, w, h);
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#7a2a12'; g.lineWidth = 4; g.strokeRect(x0 + 14, y0 + 14, w - 28, h - 28);
  g.lineWidth = 1.5; g.strokeRect(x0 + 22, y0 + 22, w - 44, h - 44);
  // 书名签
  g.fillStyle = '#7a2a12'; g.font = `40px ${FONT_BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  [...B.title].forEach((c, i) => g.fillText(c, x0 + w - 60, y0 + 70 + i * 46));
  const colW = 64, right = x0 + w - 120, top = y0 + 52;
  B.colX = i => right - i * colW;
  B.colTop = top; B.colBot = y0 + h - 40;
  B.cols.forEach((c, i) => {
    const cx = right - i * colW;
    g.strokeStyle = 'rgba(122,42,18,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - colW / 2, y0 + 30); g.lineTo(cx - colW / 2, y0 + h - 30); g.stroke();
    const chars = [...c.text], size = Math.min(34, (B.colBot - top) / Math.max(10, chars.length));
    g.font = `${size}px ${FONT_KAI}`; g.fillStyle = c.red ? '#9a1a0a' : c.dim ? 'rgba(42,20,8,0.45)' : '#2a1408';
    chars.forEach((ch, j) => g.fillText(ch, cx, top + size / 2 + j * size * 1.04));
    c.len = chars.length * size * 1.04;
    // 勾掉的那一道墨
    if (c.crossed > 0) {
      g.strokeStyle = 'rgba(18,8,4,0.92)'; g.lineCap = 'round';
      const n = 24, end = c.crossed * n;
      for (let s = 0; s < end; s++) {
        const a = s / n, b = Math.min(end, s + 1) / n;
        g.lineWidth = 11 - 5 * a + c.wob[s] * 0.3;
        g.beginPath(); g.moveTo(cx + c.wob[s], top + a * c.len); g.lineTo(cx + c.wob[Math.min(n - 1, s + 1)], top + b * c.len); g.stroke();
      }
    }
  });
  // 笔：玩家自己拿着（生死簿），或者一只手拿着（难簿）
  if (B.brush && B.cols[B.cur]) {
    const c = B.cols[B.cur], cx = right - B.cur * colW;
    const by = top + (c.crossed || 0) * (c.len || 300);
    g.strokeStyle = 'rgba(154,26,10,0.5)'; g.lineWidth = 2; g.strokeRect(cx - colW / 2 + 4, top - 10, colW - 8, (c.len || 300) + 20);
    drawBrush(g, cx + 6, by, B.hand);
  }
  if (B.writing) {
    const wr = B.writing, cx = right - wr.col * colW, chars = [...wr.text];
    g.font = `32px ${FONT_BRUSH}`; g.fillStyle = '#1a0a04';
    const n = Math.floor(wr.k * chars.length + 0.001);
    chars.slice(0, n).forEach((ch, j) => g.fillText(ch, cx, top + 18 + j * 34));
    if (wr.k < 1) drawBrush(g, cx + 8, top + 18 + n * 34, true);
  }
  g.restore();
}
function drawBrush(g, x, y, byHand) {
  g.save(); g.translate(x, y); g.rotate(-0.35);
  g.fillStyle = '#1a0a04'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -18, -5, -34); g.lineTo(5, -34); g.quadraticCurveTo(8, -18, 0, 0); g.fill();
  g.fillStyle = '#8a5a2a'; g.fillRect(-4, -150, 8, 118);
  g.restore();
  if (byHand && IMG.hand_grip) drawShadowImg(g, 'hand_grip', x + 40, y - 150, 0.55, { ax: 316, ay: 6, alpha: 0.85, blur: 2, rot: -0.35, lit: 1 });
}

// ---------------- 画一帧 ----------------
function render(dt) {
  drawScreen(g, G.tint || null);
  if (G.overlay && G.overlay.full) { G.overlay.draw(g, dt); drawFrame(g); drawCaption(g); drawHint(dt); return; }
  g.save();
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  const sh = G.shakeAmt; g.translate(rand(-sh, sh), rand(-sh, sh) * 0.6);
  for (const s of G.scen) if (s.layer === 'sky' || s.layer === 'far') drawScn(g, s);
  G.hooks.far && G.hooks.far(g);
  for (const s of G.scen) if (s.layer === 'mid') drawScn(g, s);
  G.hooks.mid && G.hooks.mid(g);
  for (const s of G.scen) if (s.layer === 'main') drawScn(g, s);
  G.hooks.back && G.hooks.back(g);
  const list = [...G.actors].sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const a of list) a.draw(g);
  G.hooks.front && G.hooks.front(g);
  for (const s of G.scen) if (s.layer === 'front') drawScn(g, s);
  if (!G.noGround) drawGroundBand(g, G.behind ? -G.camX : G.camX);
  drawParts(g, G.camX);
  g.restore();
  G.hooks.over && G.hooks.over(g);
  drawTears(g);
  drawVignette(g, G.eyesAmt || 0);
  drawBook(g, G.book);
  if (G.book && G.book.ja && G.book.k > 0.9) drawJaLine(g, G.book.ja, 646, 18);
  if (G.flash > 0) { g.fillStyle = `rgba(255,250,230,${G.flash})`; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); }
  if (G.fade > 0) { g.fillStyle = `rgba(5,2,1,${G.fade})`; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); }
  G.hooks.top && G.hooks.top(g);
  drawFrame(g);
  drawHUD();
  drawAreaTitle(dt);
  drawStamps(g, dt);
  drawCaption(g);
  drawHint(dt);
}

// 幕下那行提示的日语：按「　　」拆开逐段对
function jaCtrl(s) {
  if (LANG !== 'ja' || !s) return '';
  if (ja(s)) return ja(s);
  return s.split('　　').map(p => p.startsWith('K ') ? (ja(p.slice(2)) ? 'K ' + ja(p.slice(2)) : '') : ja(p)).filter(Boolean).join('　　');
}
function drawHUD() {
  if (G.noHud) return;
  g.save(); g.textBaseline = 'middle';
  g.font = `26px ${FONT_BRUSH}`; g.fillStyle = '#e0b060'; g.textAlign = 'left';
  g.fillText(G.title || '', 34, 24);
  const tw = g.measureText(G.title || '').width;
  g.font = `18px ${FONT_KAI}`; g.fillStyle = '#b08850';
  if (G.sceneName) g.fillText('· ' + G.sceneName, 34 + tw + 12, 25);
  // 右上：官衔，和袖子里揣着的东西
  let x = W - 30; g.textAlign = 'right';
  const tag = (text, glow, red) => {
    g.font = `18px ${FONT_KAI}`; const w = g.measureText(text).width + 24;
    g.fillStyle = glow ? `rgba(230,179,58,${0.6 + 0.4 * Math.sin(G.t * 5)})` : red ? '#7a1a0a' : '#5a2a10';
    g.fillRect(x - w, 11, w, 26);
    g.fillStyle = glow ? '#1b0b05' : '#e0c090'; g.fillText(text, x - 12, 25); x -= w + 10;
  };
  for (const t of G.tags || []) tag(t.text, t.glow, t.red);
  if (G.rank) tag(G.rank, G.rankGlow > 0, true);
  // 官衔刚换的那几秒，底下添一行日语
  const jr = G.rankGlow > 0 && ja(G.rank);
  if (jr) { g.font = `15px ${FONT_KAI}`; g.fillStyle = `rgba(240,216,160,${Math.min(1, G.rankGlow)})`; g.fillText(jr, W - 34, 60); }
  g.textAlign = 'center'; g.font = `17px ${FONT_KAI}`; g.fillStyle = '#b08850';
  const jc = jaCtrl(G.ctrl);
  if (G.ctrl) g.fillText(G.ctrl, W / 2, jc ? H - 38 : H - 28);
  if (jc) { g.font = `14px ${FONT_KAI}`; g.fillStyle = '#8a7050'; g.fillText(jc, W / 2, H - 16); }
  g.restore();
}
function drawAreaTitle(dt) {
  const A = G.area; if (!A) return;
  A.t += dt;
  const dur = A.c ? 6.4 : 3.6;
  if (A.t > dur) { G.area = null; return; }
  const a = Math.min(1, A.t * 3, (dur - A.t) * 2);
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'multiply';
  g.fillStyle = '#5a1a0a'; g.textAlign = 'center';
  if (A.c) {
    // 回目挂成戏台两边的楹联：红纸金字，先展纸，右上联、左下联一个字一个字写，下联底下落款回数
    const [up, dn] = A.c, S = 40, step = S * 1.14, top = SCR.t + 98, wd = 60;
    const roll = smooth(clamp(A.t / 0.6, 0, 1));
    g.globalCompositeOperation = 'source-over'; g.textBaseline = 'middle';
    const strip = (x, h) => {
      h *= roll;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
      g.fillStyle = '#86190e'; g.fillRect(x - wd / 2, top, wd, h); g.restore();
      if (h > 12) { g.strokeStyle = 'rgba(214,165,72,0.75)'; g.lineWidth = 1.5; g.strokeRect(x - wd / 2 + 5, top + 5, wd - 10, h - 10); }
    };
    const col = (s, x, t0) => [...s].forEach((c, i) => {
      const k = clamp((A.t - t0 - i * 0.16) / 0.3, 0, 1);
      if (k) { g.globalAlpha = a * k; g.fillText(c, x, top + 20 + step * (i + 0.5)); }
    });
    const nu = [...up].length, nd = [...dn].length, kuan = [...A.a];
    strip(SCR.r - 44, nu * step + 40);
    strip(SCR.l + 44, nd * step + 40 + kuan.length * 17 + 8);
    g.fillStyle = '#f0cd78'; g.font = `${S}px ${FONT_BRUSH}`;
    col(up, SCR.r - 44, 0.6);
    col(dn, SCR.l + 44, 0.8 + nu * 0.16);
    const k = clamp((A.t - 1.0 - (nu + nd) * 0.16) / 0.4, 0, 1);
    g.globalAlpha = a * k; g.fillStyle = '#d9b468'; g.font = `15px ${FONT_KAI}`;
    kuan.forEach((c, i) => g.fillText(c, SCR.l + 44, top + 22 + nd * step + 8 + i * 17));
    const jh = LANG === 'ja' && JA_HUI[A.a];
    if (jh) {
      g.font = `15px ${FONT_KAI}`;
      const vcol = (s, x, t0) => { g.globalAlpha = a * clamp((A.t - t0) / 0.6, 0, 1); drawJaColumn(g, s, x, top + 14, 16.5); };
      vcol(jh[0], SCR.r - 44 - wd / 2 - 15, 0.6 + nu * 0.16);
      vcol(jh[1], SCR.l + 44 + wd / 2 + 15, 0.8 + (nu + nd) * 0.16);
    }
  } else {
    g.font = `28px ${FONT_KAI}`;
    [...A.a].forEach((c, i) => g.fillText(c, SCR.l + 70, SCR.t + 120 + i * 32));
    g.font = `72px ${FONT_BRUSH}`;
    [...A.b].forEach((c, i) => g.fillText(c, SCR.l + 140, SCR.t + 140 + i * 78));
    const jb = ja(A.b);
    if (jb) { g.font = `16px ${FONT_KAI}`; drawJaColumn(g, jb, SCR.l + 196, SCR.t + 110, 18); }
  }
  g.restore();
}
function drawHint(dt) {
  const h = G.hintObj; if (!h) return;
  h.t += dt;
  if (h.t > h.dur) { G.hintObj = null; return; }
  const a = Math.min(1, h.t * 4, (h.dur - h.t) * 3);
  g.save(); g.globalAlpha = a;
  g.font = `24px ${FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(h.text).width + 50;
  const y = SCR.b - 30;
  g.fillStyle = 'rgba(27,11,5,0.82)'; g.fillRect(W / 2 - w / 2, y - 20, w, 40);
  g.strokeStyle = '#8a5a1c'; g.strokeRect(W / 2 - w / 2, y - 20, w, 40);
  g.fillStyle = '#f0d8a0'; g.fillText(h.text, W / 2, y + 1);
  const j = ja(h.text); if (j) drawJaLine(g, j, y - 36, 17);
  g.restore();
}

// 黑地上一行一行出字（换场、结尾）
function* cards(list, opt = {}) {
  const C = { t: 0, list: [], full: true };
  let t = 0.8;
  C.list = list.map(text => { const c = { text, t0: t }; t += (opt.gap ?? 1.3) + text.length * 0.12; return c; });
  C.end = t + (opt.hold ?? 1.6);
  C.draw = (g, dt) => {
    C.t += dt;
    g.fillStyle = '#050201'; g.fillRect(0, 0, W, H);
    const n = C.list.length, out = clamp((C.end - C.t) / 0.9, 0, 1);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    C.list.forEach((c, i) => {
      const k = clamp((C.t - c.t0) / 0.9, 0, 1); if (!k) return;
      const last = i === n - 1;
      g.globalAlpha = k * out * (C.t > (C.list[i + 1] || { t0: 1e9 }).t0 ? 0.55 : 1);
      g.font = `${last && opt.bigLast ? 34 : 30}px ${FONT_KAI}`; g.fillStyle = last && opt.bigLast ? '#d8c08a' : '#a8946c';
      g.fillText(c.text, W / 2, H / 2 - (n - 1) * 32 + i * 64);
      if (last && opt.ja) { g.font = `18px ${FONT_KAI}`; g.fillStyle = '#8a7a5c'; g.fillText(opt.ja, W / 2, H / 2 - (n - 1) * 32 + i * 64 + 46); }
    });
    g.restore();
  };
  G.overlay = C; logEv('cards');
  yield () => C.t >= C.end || (C.t > 1.5 && Input.hit('start') && !G.bot && (C.t = Math.max(C.t, C.end - 0.3), false));
  G.overlay = null;
}

// 落叶、雪、灰：几百年过去
function fallParts(kind, n) {
  for (let i = 0; i < n; i++) Parts.push({ kind, x: G.camX + rand(0, W), y: rand(SCR.t - 40, SCR.t), vx: rand(-30, 30), vy: rand(40, 110), t: 0, life: rand(5, 8), s: rand(4, 9), r: rand(0, 6), vr: rand(-3, 3) });
}
const _drawParts = drawParts;
drawParts = function (g, camX) {
  _drawParts(g, camX);
  g.save(); g.globalCompositeOperation = 'multiply';
  for (const p of Parts) {
    if (p.kind !== 'ash' && p.kind !== 'leaf' && p.kind !== 'snow') continue;
    const k = Math.min(1, (p.life - p.t) * 2, p.t * 2);
    const x = G.behind ? W - (p.x - camX) : p.x - camX;
    g.globalAlpha = k;
    g.fillStyle = p.kind === 'ash' ? '#3a2a20' : p.kind === 'leaf' ? '#8a3a12' : '#f8f0e0';
    if (p.kind === 'snow') { g.globalCompositeOperation = 'screen'; g.beginPath(); g.arc(x, p.y, p.s * 0.5, 0, 7); g.fill(); g.globalCompositeOperation = 'multiply'; continue; }
    g.save(); g.translate(x, p.y); g.rotate(p.r); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
  }
  g.restore();
};
const _updateParts = updateParts;
updateParts = function (dt) {
  _updateParts(dt);
  for (const p of Parts) if (p.kind === 'ash' || p.kind === 'leaf' || p.kind === 'snow') { p.vx += Math.sin(G.t + p.r) * 20 * dt; if (p.y > GROUND) { p.vy = 0; p.vx = 0; p.vr = 0; } }
};
