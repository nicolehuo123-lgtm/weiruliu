// 《未入流》的工具：换场、K 键要做的事、对手、找名字的簿子、台词。
// 台词全部出自原著，回目写在每一场开头。

G.title = '未入流';
KEYMAP.act = ['KeyK', 'KeyE'];
KEYMAP.down = ['ArrowDown', 'KeyS'];
KEYMAP.skip = ['Enter'];
const CTRL_WALK = 'A D 行走　W 腾跃　J 抡棒';
const CTRL_FLY = 'A D 翻筋斗　W S 升降';

Object.assign(WHO_COLOR, {
  '猴王': '#b3261e', '大圣': '#b3261e', '行者': '#b3261e', '玉帝': '#8a5a10', '太白金星': '#2f6d3a', '武曲星君': '#5a3a12',
  '众臣': '#3a2410', '众监官': '#3a2410', '仙女': '#9a2a4a', '众仙': '#8a5a10', '如来': '#8a5a10', '观音': '#2f6d5a',
  '老君': '#8a6a10', '文殊': '#2f6d5a', '阿傩': '#6a3a12', '二尊者': '#6a3a12', '天师': '#3a2a5a', '奎木狼': '#1f3d7a',
  '大鹏': '#8a5a10', '小钻风': '#2a2a2a', '老鼋': '#1f4d5a', '众': '#3a2410', '八戒': '#2a2a2a', '唐僧': '#7a4a12',
  '女子': '#2f7d4a', '老妇人': '#1f3d7a', '老公公': '#1f3d7a', '妖精': '#2f6d5a',
});

// 一整片皮影朝哪边画的（其余都朝左）
const AF = { p_taibai: 1, p_xiannv: 1, p_pipa: 1, p_bing: 1, p_kui: 1, p_tudi: 1 };
function P(img, x, o = {}) { return new Spr(img, x, { s: 0.8, artFace: AF[img] ?? -1, bob: 2, hop: 10, ...o }); }

// ---------------- 台词 ----------------
// 长句按句号拆成几张纸条，太长的再按逗号拆
function chunks(text, max = 30) {
  const out = []; let cur = '';
  for (const ch of text) { cur += ch; if ('。！？；'.includes(ch) && [...cur].length >= 4) { out.push(cur); cur = ''; } }
  if (cur) out.push(cur);
  const res = [];
  for (let s of out) {
    while ([...s].length > max) {
      const a = [...s]; let cut = -1;
      for (let i = Math.min(max, a.length - 2); i > 6; i--) if ('，、：'.includes(a[i])) { cut = i + 1; break; }
      if (cut < 0) cut = max;
      res.push(a.slice(0, cut).join('')); s = a.slice(cut).join('');
    }
    if (s) res.push(s);
  }
  return res;
}
function* L(who, text) { for (const c of chunks(text)) say(who, c); yield waitSay(); }
function* M(who, text) { for (const c of chunks(text)) mutter(who, c); yield waitSay(); }
function* N(text) { for (const c of chunks(text, 34)) mutter('', c); yield waitSay(); }

// ---------------- 换场 ----------------
G.timers = []; G.acts = []; G.foes = []; G.hits = [];
G.after = (t, fn) => G.timers.push({ t, fn });
function stage(o = {}) {
  G.actors = []; G.scen = []; G.acts = []; G.foes = []; G.hits = []; G.walls = []; G.lock = null; G.timers = [];
  G.noHud = !!o.noHud;
  G.worldW = o.w || W; G.camX = o.camX || 0; G.camFix = o.camFix ?? null; G.hooks = {}; G.tint = o.tint || null;
  G.noGround = !!o.noGround; G.overlay = null; G.book = null; G.botGoal = null; G.eyesOK = false; G.eyesAmt = 0;
  G.inputLock = false; G.flash = 0; G.sway = 0; G.camSnap = true;
  Parts.length = 0; Lamp.power = 1; LAMP.x = 640; LAMP.y = 300;
  const h = G.hero;
  Object.assign(h, { x: o.hx ?? 200, y: o.floor ?? GROUND, floor: o.floor ?? GROUND, vx: 0, vy: 0, face: o.hface ?? 1, state: 'idle', anim: null,
    frozen: false, noAttack: false, noJump: false, fly: false, sink: 0, hidden: !!o.noHero, alpha: 1, filter: '', ride: null, scale: 1,
    tremble: 0, hat: 0, autoX: null, kb: 0, speed: 300, z: 5, onG: true });
  G.add(h);
  G.ctrlBase = o.ctrl ?? CTRL_WALK;
  G.hooks.hit = hitCheck;
  sayClear();
}
function lock(on = true) { G.inputLock = on; }
function setRank(text) { if (G.rank !== text) { G.rank = text; G.rankGlow = 2.5; } }
function tag(text, on = true) { G.tags = (G.tags || []).filter(t => t.text !== text); if (on) G.tags.push({ text }); }
function glowTag(text, on) { const t = (G.tags || []).find(t => t.text === text); if (t) t.glow = on; }
function* fade(to, t = 0.8) { G.tween(G, 'fade', to, t); yield t; }
// 回目原文（每回头一场挂成楹联：上联在右，下联在左）
const HUIMU = {
  '第四回': ['官封弼马心何足', '名注齐天意未宁'], '第五回': ['乱蟠桃大圣偷丹', '反天宫诸神捉怪'],
  '第六回': ['观音赴会问原因', '小圣施威降大圣'], '第七回': ['八卦炉中逃大圣', '五行山下定心猿'],
  '第十四回': ['心猿归正', '六贼无踪'], '第二十七回': ['尸魔三戏唐三藏', '圣僧恨逐美猴王'],
  '第二十九回': ['脱难江流来国土', '承恩八戒转山林'], '第三十一回': ['猪八戒义激猴王', '孙行者智降妖怪'],
  '第三十五回': ['外道施威欺正性', '心猿获宝伏邪魔'], '第三十九回': ['一粒丹砂天上得', '三年故主世间生'],
  '第五十二回': ['悟空大闹金兜洞', '如来暗示主人公'], '第七十四回': ['长庚传报魔头狠', '行者施为变化能'],
  '第七十七回': ['群魔欺本性', '一体拜真如'], '第九十八回': ['猿熟马驯方脱壳', '功成行满见真如'],
  '第九十九回': ['九九数完魔灭尽', '三三行满道归根'], '第一百回': ['径回东土', '五圣成真'],
};
G.huiSeen = new Set();
function* title(a, b) {
  const c = HUIMU[a] && !G.huiSeen.has(a) ? HUIMU[a] : null;
  if (c) G.huiSeen.add(a);
  G.areaTitle(a, b, c); yield 0.4;
}
function* zhe(n, name) { G.sceneName = ''; yield* cards([n, name], { gap: 0.5, hold: 1.0, bigLast: true, ja: ja(n + '　' + name) }); }
function* walkHero(x, speed = 260) { const h = G.hero; h.autoX = x; h.autoSpeed = speed; yield () => h.autoX === null; }
function* nuo() { const h = G.hero; h.anim = 'nuo'; Sound.phrase('仓 - 才', 220, 0.7); yield 1.3; h.anim = null; }
function* chant(n = 1, long = false) {
  const h = G.hero, t = G.tang;
  if (t) t.forceAnim = 'chant';
  Sound.sfx(long ? 'chantLong' : 'chant');
  Mood.chants++; Mood.cap = Math.max(0.7, Mood.cap - 0.035); Mood.gloom = Math.min(0.85, Mood.gloom + 0.07);
  for (let i = 0; i < n; i++) G.after(i * 0.5, () => { if (Mood.tears.length < 9) addTear(); Sound.sfx('tear'); });
  h.headache(long ? 5.5 : 2.6);
  yield long ? 5.5 : 2.6;
  if (t) t.forceAnim = null;
}

// 天上：云、殿门
function heaven(o = {}) {
  G.scen.push(scn('scn_cloud', 200, 'sky', { s: 2.2, y: 260 }), scn('scn_cloud', 900, 'sky', { s: 2.6, y: 220 }), scn('scn_cloud', 1500, 'sky', { s: 2.2, y: 280 }));
  if (o.hall !== false) G.scen.push(scn('scn_dian', o.hallX ?? 640, 'far', { s: 0.95 }));
  for (let x = -100; x < (G.worldW + 300); x += 260) G.scen.push(scn('scn_cloud', x, 'front', { s: 1.1, y: GROUND + 60, a: 0.55 }));
}
function hills(o = {}) {
  G.scen.push(scn('scn_mountains', 500, 'sky', { s: 1.8 }), scn('scn_mountains', 1500, 'sky', { s: 1.6, flip: -1 }));
  for (let x = 200; x < G.worldW; x += 700) G.scen.push(scn(o.tree || 'scn_pine', x, 'mid', { s: 1.0, flip: x % 1400 ? 1 : -1 }));
}

// ---------------- K 键 ----------------
function act(label, x, fn, o = {}) { const a = { label, x, r: o.r ?? 130, fn, once: o.once ?? true }; G.acts.push(a); return a; }
function nearAct() {
  const h = G.hero; let best = null, bd = 1e9;
  for (const a of G.acts) {
    const ax = typeof a.x === 'function' ? a.x() : a.x;
    const d = ax === null || ax === undefined ? 0 : Math.abs(ax - h.x);
    if (d <= a.r && d < bd) { bd = d; best = a; }
  }
  return best;
}
function updateActs() {
  if (G.inputLock) return;
  const a = nearAct();
  if (a && Input.hit('act')) { if (a.once) G.acts = G.acts.filter(q => q !== a); a.fn(); }
}
function* waitAct(label, x = null, o = {}) {
  let done = false;
  const a = act(label, x, () => { done = true; }, o);
  const was = G.inputLock; lock(false);
  G.botGoal = { x: () => (nearAct() === a ? null : typeof x === 'function' ? x() : x), key: 'act', delay: o.delay ?? 0.9 };
  yield () => done;
  G.acts = G.acts.filter(q => q !== a); G.botGoal = null; G.inputLock = was;
}
function ctrlLine() {
  if (G.inputLock && !G.searching) return '';
  const a = G.inputLock ? null : nearAct();
  const base = G.hero.frozen ? '' : G.ctrlBase || '';
  return [base, a ? 'K ' + a.label : ''].filter(Boolean).join('　　');
}

// ---------------- 打 ----------------
G.hooks = {};
function hitCheck(h) {
  const r = h.reach();
  for (const f of [...G.foes, ...G.hits]) {
    if (h.hitSet.has(f) || f.dead || f.off) continue;
    const w = (f.w || 100) / 2;
    if (f.x + w > r.x0 && f.x - w < r.x1 && Math.abs((f.y - (f.hh || 120)) - (h.y - 120)) < 220) { h.hitSet.add(f); f.hurt ? f.hurt(h) : f.onHit(h); }
  }
}
function hurtHero(from) {
  const h = G.hero; if (h.frozen || h.state === 'headache') return;
  h.kb = Math.sign(h.x - from.x || 1) * 560; h.anim = 'hurt'; G.after(0.35, () => { if (h.anim === 'hurt') h.anim = null; });
  Sound.sfx('hurt'); G.shake(8); burst(h.x, h.y - 150, 8, 'paper');
}
class Foe extends Spr {
  constructor(img, x, o = {}) {
    super(img, x, { s: 0.8, artFace: AF[img] ?? -1, bob: 3, hop: 12, ...o });
    this.hp = o.hp ?? 3; this.lowAt = o.lowAt ?? 1; this.minion = !!o.minion; this.flash = 0; this.kbx = 0;
    this.lunge = 0; this.cool = rand(0.8, 1.8); this.w = o.w ?? 120; this.hh = o.hh ?? 130; this.speed = o.speed ?? 150;
    this.held = false; this.dead = false; this.z = 3; this.face = -1; this.ai = o.ai ?? true; this.onHeld = o.onHeld;
  }
  update(dt) {
    super.update(dt);
    const h = G.hero;
    if (this.kbx) { this.x += this.kbx * dt; this.kbx *= Math.pow(0.004, dt); if (Math.abs(this.kbx) < 8) this.kbx = 0; }
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.dead) { this.rot = lerp(this.rot, -1.45 * this.face * (this.artFace), dt * 6); this.dy = (this.dy || 0) + dt * 40; return; }
    if (!this.ai || this.held || G.inputLock || h.frozen || this.gotoX !== null) return;
    const d = h.x - this.x; this.face = Math.sign(d) || this.face;
    if (this.lunge > 0) {
      this.lunge -= dt; this.x += this.face * 560 * dt; this.vx = 600;
      if (Math.abs(d) < 110 && !this.struck) { this.struck = true; hurtHero(this); }
    } else {
      this.cool -= dt;
      if (Math.abs(d) > 230) { this.x += Math.sign(d) * this.speed * dt; this.vx = this.speed; }
      else if (this.cool <= 0) { this.lunge = 0.26; this.cool = rand(1.3, 2.4) * (this.minion ? 1.4 : 1); this.struck = false; Sound.sfx('swing'); }
    }
    this.x = clamp(this.x, 60, G.worldW - 60);
  }
  hurt(from) {
    if (this.dead) return;
    if (this.held) { Sound.sfx('clang'); return; }
    this.hp--; this.flash = 1; this.kbx = Math.sign(this.x - from.x || 1) * 460;
    Sound.sfx('hit'); G.shake(7); burst(this.x, this.y - 150, 9, 'paper');
    if (this.hp <= 0) this.die();
    else if (this.hp <= this.lowAt && !this.minion) { this.held = true; this.kbx *= 0.5; if (this.onHeld) this.onHeld(this); }
  }
  die() { this.dead = true; this.hidden = false; Sound.sfx('smash'); burst(this.x, this.y - 100, 14, 'paper'); G.after(2.5, () => { this.alpha = 0.55; }); }
  draw(g) {
    const f = this.filter;
    if (this.flash > 0) this.filter = `brightness(${1 + this.flash})`;
    else if (this.held) this.filter = (f || '') + ' saturate(0.7)';
    const y0 = this.y; this.y += this.dy || 0;
    super.draw(g); this.y = y0; this.filter = f;
  }
}
// 被领走：本相跟在来人身边
function follow(a, t, dx, dy = 0) { a.follow = { t, dx, dy }; }
function* descend(p, y, t = 1.6) { G.tween(p, 'y', y, t); Sound.phrase('台 令 台 令', 200, 0.6); yield t; }
function transform(f, img, o = {}) {
  smoke(f.x, f.y - 100, 12, 1.4); Sound.sfx('poof');
  f.img = img; f.artFace = AF[img] ?? -1; f.held = true; f.ai = false; f.flash = 0; f.filter = ''; f.rot = 0;
  if (o.s) f.s = o.s;
}

// ---------------- 簿子：一行一行往下找 ----------------
function* search(title, entries, o = {}) {
  const per = o.per || 11;
  let idx = 0, page = 0;
  const B = makeBook(title, entries.slice(0, per)); B.brush = true; B.hand = true; B.cur = 0;
  G.book = B; G.tween(B, 'k', 1, 0.7); yield 0.7;
  G.searching = true; lock(true);
  const prev = G.ctrlBase; G.ctrlBase = '←  逐行细看　　→  回看前行';
  let bt = 0;
  while (true) {
    let fwd = Input.hit('left'), back = Input.hit('right');
    if (G.bot) { bt += 1 / 60; const need = (o.pauseAt && o.pauseAt.includes(idx)) ? 3.0 : 0.6; fwd = bt > need; back = false; if (fwd) bt = 0; }
    if (fwd) { idx++; if (idx >= entries.length) break; Sound.sfx('land'); }
    if (back && idx > 0) idx--;
    const np = Math.floor(idx / per);
    if (np !== page) { page = np; B.cols = makeBook('', entries.slice(page * per, page * per + per)).cols; Sound.sfx('swing'); }
    B.cur = idx - page * per; B.ja = ja(entries[idx]);
    if (o.onIdx) o.onIdx(idx);
    yield;
  }
  G.searching = false;
  G.tween(B, 'k', 0, 0.6); yield 0.6; G.book = null; G.ctrlBase = prev; lock(false);
}
// 打开看一眼就合上的簿子（经卷）
function* peek(title, entries, hold = 4) {
  const B = makeBook(title, entries); B.brush = false;
  G.book = B; G.tween(B, 'k', 1, 0.7); yield 0.7;
  const was = G.inputLock; lock(true);
  let t = 0; G.ctrlBase0 = G.ctrlBase;
  yield () => { t += 1 / 60; return t > hold || (t > 1.2 && (Input.hit('act') || Input.hit('skip'))); };
  G.tween(B, 'k', 0, 0.6); yield 0.6; G.book = null; G.inputLock = was;
}

// ---------------- 画在幕上的小东西 ----------------
function drawBundle(g, x, y, open) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.translate(SX(x), y);
  g.fillStyle = '#3f6d8a'; g.strokeStyle = '#1b0b05'; g.lineWidth = 3;
  if (!open) { g.beginPath(); g.ellipse(0, -26, 46, 28, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-10, -52); g.lineTo(0, -66); g.lineTo(10, -52); g.stroke(); }
  else { g.beginPath(); g.moveTo(-80, 0); g.lineTo(-50, -18); g.lineTo(50, -18); g.lineTo(80, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c98a3a'; for (const dx of [-30, -6]) { g.beginPath(); g.ellipse(dx, -24, 14, 7, 0, 0, Math.PI * 2); g.fill(); g.stroke(); } }
  g.restore();
}
function drawHatAt(g, x, y, s, k = 1) { drawHat(g, [s, 0, 0, s, SX(x) - 50 * s, y + 112 * s], k); }
function drawBowl(g, x, y, s = 1) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#6a2a7a'; g.strokeStyle = '#1b0b05'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-34, -22); g.quadraticCurveTo(0, 26, 34, -22); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e6b33a'; g.fillRect(-36, -26, 72, 6); g.strokeRect(-36, -26, 72, 6);
  g.restore();
}
function drawPaper(g, x, y, s = 1, rot = 0) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#f2e6c8'; g.strokeStyle = '#3a2410'; g.lineWidth = 2; g.fillRect(-22, -30, 44, 60); g.strokeRect(-22, -30, 44, 60);
  g.fillStyle = '#2a1408'; for (let i = 0; i < 4; i++) g.fillRect(10 - i * 9, -22, 2, 40);
  g.restore();
}
// 竖着写的字（柱子上的、脊梁上的）
function drawVText(g, text, x, y, size, col, k = 1, opt = {}) {
  const ch = [...text], n = Math.floor(k * ch.length + 0.001);
  g.save(); g.font = `${size}px ${FONT_BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.globalCompositeOperation = opt.comp || 'multiply'; g.globalAlpha = opt.alpha ?? 1;
  ch.slice(0, n).forEach((c, i) => g.fillText(c, x, y + i * size * 1.05));
  g.restore();
  return y + n * size * 1.05;
}

// ---------------- 自动演示 ----------------
const BotS = { t: 0, goalRef: null };
function botInput() {
  const b = {}, h = G.hero, gl = G.botGoal;
  if (!gl || G.overlay) return b;
  if (BotS.goalRef !== gl) { BotS.goalRef = gl; BotS.t = 0; }
  BotS.t += 1 / 60;
  const pulse = Math.floor(BotS.t * 60) % 14 < 2;
  if (gl.hold) b[gl.hold] = 1;
  if (gl.fight) {
    let f = null, bd = 1e9;
    for (const q of [...G.foes, ...G.hits]) { if (q.dead || q.held || q.off) continue; const d = Math.abs(q.x - h.x); if (d < bd) { bd = d; f = q; } }
    if (f && !(gl.holdFirst && BotS.t < gl.holdFirst)) {
      const d = f.x - h.x;
      if (Math.abs(d) > 170) b[d > 0 ? 'right' : 'left'] = 1;
      else if (Math.sign(d) !== h.face) b[d > 0 ? 'right' : 'left'] = 1;
      else if (pulse) b.attack = 1;
    } else if (f && gl.holdFirst) { const d = f.x - h.x; if (Math.abs(d) > 260) b[d > 0 ? 'right' : 'left'] = 1; }
    return b;
  }
  const gx = typeof gl.x === 'function' ? gl.x() : gl.x;
  if (gx !== null && gx !== undefined && Math.abs(gx - h.x) > 60) { b[gx > h.x ? 'right' : 'left'] = 1; BotS.t = Math.min(BotS.t, 0.1); }
  else if (gl.key && pulse && BotS.t > (gl.delay ?? 0.8) && !captionsBusy()) b[gl.key] = 1;
  if (gl.up) b.jump = 1;
  if (gl.dy) b[gl.dy > 0 ? 'down' : 'jump'] = Math.abs(gl.dy) > 30 ? 1 : 0;
  return b;
}
