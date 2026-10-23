// 角色：悟空、师父、村民（真的假的）、小妖、守门将、毫毛分身、白骨夫人
const SC = { wukong: 0.53, tangseng: 0.45, cungu: 0.47, laofu: 0.46, laoweng: 0.46, skel: 0.42, bat: 0.5, baigu: 0.62, guard: 1.05 };
const HT = { wukong: 245, tangseng: 265, cungu: 240, laofu: 215, laoweng: 245, skel: 220, bat: 100, baigu: 440 };

function overlap(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }

// 远离幕布的影子：变大、发虚、颜色褪掉
function depthFilter(d) {
  if (d < 0.02) return '';
  return `blur(${(d * 5.5).toFixed(1)}px) grayscale(${(d * 0.85).toFixed(2)}) brightness(${(1 - d * 0.5).toFixed(2)})`;
}

// 签子：从脖子和手伸到幕布下面。Rod.grip 有值时，所有签子都汇到同一只手里；yank = 那只手在用力拽
const Rod = { grip: null, mix: 0, yank: 0 };
function drawRods(g, pts, face, lag, depth = 0, skip = 0) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.filter = `blur(${1.2 + depth * 4}px)`;
  g.strokeStyle = `rgba(40,20,8,${Math.min(0.95, 0.5 - depth * 0.2 + Rod.yank * 0.4)})`;
  g.lineWidth = 3 + depth * 3 + Rod.yank * 2; g.lineCap = 'round';
  pts.forEach((p, i) => {
    if (!p) return;
    // 断了的签子：只剩一小截挂着
    if (skip && i >= pts.length - skip) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] - face * 8, p[1] + 46); g.stroke(); return; }
    let ex = p[0] - face * 30 + lag, ey = H + 20;
    if (Rod.grip && Rod.mix > 0) { ex = lerp(ex, Rod.grip.x + (i - 1) * 6, Rod.mix); ey = lerp(ey, Rod.grip.y, Rod.mix); }
    g.beginPath(); g.moveTo(p[0], p[1]);
    g.lineTo(ex, ey);
    g.stroke();
  });
  g.restore();
}

class Ent {
  constructor(x) { this.x = x; this.y = GROUND; this.face = -1; this.dead = false; this.hittable = false; this.inv = 0; }
  box() { const w = this.w || 70, h = this.h || 200; return { x0: this.x - w / 2, x1: this.x + w / 2, y0: this.y - h, y1: this.y }; }
  update() { }
  draw() { }
}

// ---------------- 悟空 ----------------
class Player extends Ent {
  constructor(x) {
    super(x);
    this.p = new Puppet('wukong', ANIMS.wukong); this.p.play('idle');
    this.face = 1; this.vx = 0; this.vy = 0; this.onG = true;
    this.hp = 6; this.maxHp = 6; this.mana = 100;
    this.depth = 0; this.state = 'idle'; this.st = 0; this.hitSet = new Set();
    this.eyesOn = false; this.eyesAmt = 0; this.wasGiant = false; this.w = 70;
    this.forceDepth = null; this.ghost = false;
  }
  get size() { return 1 + 0.8 * this.depth; }
  get h() { return HT.wukong * this.size; }
  get giant() { return this.depth > 0.8; }
  damage(n, fromX, kb = 380) {
    if (this.inv > 0 || this.state === 'headache' || G.god) return;
    this.hp = Math.max(0, this.hp - n);
    if (G.bot && this.hp < 2) this.hp = 2;
    this.inv = 1.2; this.state = 'hurt'; this.st = 0; this.p.play('hurt', true);
    this.vx = Math.sign(this.x - fromX || -this.face) * kb; this.vy = -360; this.onG = false;
    Sound.sfx('hurt'); G.shake(10); burst(this.x, this.y - 140, 10, 'paper');
    if (this.hp <= 0) G.fail('悟空倒在了幕上。戏还没演完——重来。');
  }
  headache(dur = 2.4) {
    this.state = 'headache'; this.st = 0; this.headT = dur; this.p.play('headache', true); this.vx = 0;
    this.hp = Math.max(G.bot ? 2 : 1, this.hp - 1);
    G.shake(6);
  }
  update(dt) {
    const I = G.inputLock ? {} : null;
    const down = a => I ? false : Input.down(a), hit = a => I ? false : Input.hit(a);
    this.st += dt; this.inv -= dt;
    const inGate = G.solids.some(s => s.kind === 'gate' && Math.abs(this.x - s.x) < s.half + 40);
    // 近灯 / 贴幕
    let target = down('lamp') ? 1 : 0;
    if (inGate) target = 0;
    if (this.forceDepth !== null) target = this.forceDepth;
    const dd = clamp(target - this.depth, -2.6 * dt, 2.6 * dt);
    this.depth = clamp(this.depth + dd, 0, 1);
    if (this.giant && !this.wasGiant) { Sound.sfx('grow'); G.shake(4); }
    this.wasGiant = this.giant;
    // 火眼金睛
    this.eyesOn = down('eyes') && this.mana > 1 && this.depth < 0.4;
    if (this.eyesOn) { this.mana -= 22 * dt; if (!this.eyesWas) Sound.sfx('eye'); }
    else this.mana = Math.min(100, this.mana + 11 * dt);
    this.eyesWas = this.eyesOn;
    this.eyesAmt = clamp(this.eyesAmt + (this.eyesOn ? 4 : -4) * dt, 0, 1);

    const busy = this.state === 'headache' || this.state === 'hurt';
    if (this.state === 'headache') {
      if (this.st > (this.headT || 2.4)) { this.state = 'idle'; }
    } else if (this.state === 'hurt') {
      if (this.st > 0.4) this.state = 'idle';
    }
    let dir = 0;
    if (!busy) {
      dir = (down('right') ? 1 : 0) - (down('left') ? 1 : 0);
      const speed = lerp(300, 200, this.depth);
      const attacking = this.state === 'attack' || this.state === 'stomp';
      this.vx = dir * speed * (attacking && this.onG ? 0.35 : 1);
      if (dir && !attacking) this.face = dir;
      if (hit('jump') && this.onG) { this.vy = -lerp(1000, 820, this.depth); this.onG = false; Sound.sfx('jump'); this.p.play('jump', true); }
      if (hit('attack') && !attacking) {
        this.state = this.giant ? 'stomp' : 'attack'; this.st = 0; this.hitSet.clear();
        this.p.play(this.state, true); Sound.sfx('swing');
      }
      if (hit('hair')) G.spawnDecoy();
    } else if (this.state === 'hurt') {
      this.vx *= Math.pow(0.05, dt);
    } else this.vx = 0;

    // 物理
    this.vy += 2500 * dt;
    const oy = this.y;
    this.y += this.vy * dt;
    let landed = false;
    if (this.y >= GROUND) { this.y = GROUND; landed = true; }
    for (const pl of G.plats) {
      if (this.vy >= 0 && oy <= pl.top + 1 && this.y >= pl.top && Math.abs(this.x - pl.x) < pl.w / 2) { this.y = pl.top; landed = true; }
    }
    if (landed) { if (!this.onG && this.vy > 300) Sound.sfx('land'); this.vy = 0; this.onG = true; }
    else if (this.onG && this.y < GROUND) {
      // 从石头上走下去
      if (!G.plats.some(pl => Math.abs(this.y - pl.top) < 2 && Math.abs(this.x - pl.x) < pl.w / 2)) this.onG = false;
    }
    let nx = this.x + this.vx * dt;
    for (const s of G.solids) {
      let blockL = null, blockR = null;
      if (s.kind === 'barricade' && !s.broken) { blockL = s.x - s.w / 2; blockR = s.x + s.w / 2; }
      if (s.kind === 'gate' && this.h > s.openH) { blockL = s.x - s.half - 30; blockR = s.x + s.half + 30; }
      if (blockL === null) continue;
      if (this.x <= blockL && nx > blockL - 30) { nx = blockL - 30; if (s.kind === 'gate') G.onGateBlocked(); }
      if (this.x >= blockR && nx < blockR + 30) nx = blockR + 30;
    }
    if (G.lock) nx = clamp(nx, G.lock[0] + 50, G.lock[1] - 50);
    nx = clamp(nx, 60, G.worldW - 60);
    this.x = nx;

    // 打
    if (this.state === 'attack') {
      if (this.st > 0.07 && this.st < 0.26) {
        const reach = 225 * this.size;
        const b = { x0: Math.min(this.x, this.x + this.face * reach), x1: Math.max(this.x, this.x + this.face * reach), y0: this.y - 250 * this.size, y1: this.y - 20 };
        G.hitTest(this, b, 'staff');
      }
      if (this.p.done) this.state = 'idle';
    } else if (this.state === 'stomp') {
      if (this.st > 0.24 && !this.stomped) {
        this.stomped = true; Sound.sfx('stomp'); G.shake(16);
        smoke(this.x + this.face * 160, GROUND - 20, 10, 1.4);
      }
      if (this.st > 0.24 && this.st < 0.42) {
        const b = { x0: this.x - (this.face > 0 ? 80 : 380), x1: this.x + (this.face > 0 ? 380 : 80), y0: this.y - 460, y1: this.y + 10 };
        G.hitTest(this, b, 'stomp');
      }
      if (this.p.done) { this.state = 'idle'; this.stomped = false; }
    }
    // 动画
    if (this.state === 'idle' && !this.introAnim) {
      if (!this.onG) this.p.play(this.vy < 0 ? 'jump' : 'fall');
      else if (Math.abs(this.vx) > 10) this.p.play('walk');
      else this.p.play('idle');
    }
    if (this.introAnim) this.p.play(this.introAnim);
    this.p.step(dt);
  }
  draw(g, camX) {
    const blink = this.inv > 0 && this.state !== 'headache' && Math.floor(this.inv * 12) % 2 === 0;
    const s = SC.wukong * this.size;
    // 紧箍念过之后，影子一直在抖
    const tr = Mood.tremble + (this.state === 'headache' ? 0.8 : 0);
    const x = this.x - camX + rand(-1, 1) * 4 * tr;
    const f = depthFilter(this.depth);
    const r0 = this.p.cur.rot; this.p.cur.rot += rand(-1, 1) * 3 * tr;
    this.p.draw(g, x, this.y + rand(-1, 1) * 2 * tr, s, this.face, { filter: f, alpha: blink ? 0.45 : 1 });
    this.p.cur.rot = r0;
    drawRods(g, [this.p.joints.head, this.p.joints.armF_l_tip, this.p.joints.armB_l_tip], this.face, -this.vx * 0.08, this.depth, this.snapped || 0);
    // 火眼：眼睛发金光
    if (this.eyesAmt > 0) {
      const hm = this.p.mats.head; if (!hm) return;
      const e = apply(hm, [62, -78]);
      g.save(); g.globalCompositeOperation = 'screen';
      const gr = g.createRadialGradient(e[0], e[1], 0, e[0], e[1], 70 * this.eyesAmt);
      gr.addColorStop(0, `rgba(255,230,120,${this.eyesAmt})`); gr.addColorStop(1, 'rgba(255,120,0,0)');
      g.fillStyle = gr; g.fillRect(e[0] - 80, e[1] - 80, 160, 160);
      g.restore();
    }
  }
}

// ---------------- 毫毛分身 ----------------
class Decoy extends Ent {
  constructor(x, face) {
    super(x); this.face = face; this.p = new Puppet('wukong', ANIMS.wukong); this.p.play('taunt');
    this.life = 7; this.t = 0; this.hp = 4; this.w = 70; this.h = 240; this.isDecoy = true;
    smoke(x, GROUND - 120, 8); burst(x, GROUND - 160, 10, 'hair', { size: 1.4 });
    Sound.sfx('poof');
  }
  damage() { this.hp--; burst(this.x, this.y - 150, 6, 'hair'); if (this.hp <= 0) this.t = this.life; }
  update(dt) {
    this.t += dt; this.p.step(dt);
    if (this.t >= this.life) { this.dead = true; smoke(this.x, GROUND - 120, 8); burst(this.x, GROUND - 150, 14, 'hair', { size: 1.4 }); Sound.sfx('poof'); }
  }
  draw(g, camX) {
    const a = this.t > this.life - 1 ? (Math.floor(this.t * 10) % 2 ? 0.25 : 0.6) : 0.62;
    this.p.draw(g, this.x - camX, this.y, SC.wukong, this.face, { filter: 'grayscale(0.7) contrast(0.8) brightness(1.15)', alpha: a });
  }
}

// ---------------- 师父 ----------------
class Tang extends Ent {
  constructor(x) {
    super(x); this.face = 1; this.p = new Puppet('tangseng', ANIMS.robe); this.p.play('idle');
    this.maxX = 1e9; this.mode = 'follow'; this.w = 70; this.h = 260;
  }
  update(dt) {
    const pl = G.player;
    let vx = 0;
    if (this.mode === 'follow') {
      const want = Math.min(pl.x - 230, this.maxX);
      if (want - this.x > 30) vx = Math.min(130, (want - this.x) * 1.5);
    } else if (this.mode === 'goto') {
      if (Math.abs(this.gotoX - this.x) > 6) vx = Math.sign(this.gotoX - this.x) * 120;
    }
    this.x += vx * dt;
    if (vx) this.face = Math.sign(vx);
    else if (this.faceLock) this.face = this.faceLock;
    if (this.forceAnim) this.p.play(this.forceAnim);
    else this.p.play(Math.abs(vx) > 5 ? 'walk' : 'idle');
    this.p.step(dt);
  }
  draw(g, camX) {
    this.p.draw(g, this.x - camX, this.y, SC.tangseng, this.face);
    drawRods(g, [this.p.joints.head, this.p.joints.armF_u], this.face, 0);
  }
}

// ---------------- 村民（可能是白骨精变的） ----------------
const VNAME = { cungu: '村姑', laofu: '老婆婆', laoweng: '老公公' };
class Villager extends Ent {
  constructor(kind, x, demon, opt = {}) {
    super(x); this.kind = kind; this.demon = demon; this.face = -1;
    this.p = new Puppet(kind, ANIMS.robe); this.p.play('walk');
    this.state = 'walk'; this.st = 0; this.w = 80; this.h = HT[kind]; this.hittable = true;
    this.speed = opt.speed || 60; this.seen = 0; this.marked = false; this.tint = opt.tint || '';
    this.ghost = new Puppet('baigu', ANIMS.baigu); this.ghost.play('float');
    this.line = opt.line; this.said = false; this.capT = 0; this.plea = opt.plea; this.pleaSaid = false;
  }
  update(dt) {
    this.st += dt; this.p.step(dt); this.ghost.step(dt);
    const tang = G.tang;
    if (G.player.eyesOn && Math.abs(this.x - G.camX - W / 2) < W / 2) { this.seen += dt; if (this.seen > 0.25 && !this.marked) { this.marked = true; if (this.demon) { Sound.sfx('eye'); burst(this.x, this.y - 160, 12, 'spark', { col: '#7fffa0' }); } } }
    if (this.state === 'walk') {
      this.x -= this.speed * dt; this.face = -1; this.p.play('walk');
      if (this.x - tang.x < 120) {
        this.state = this.demon ? 'offer' : 'bow'; this.st = 0;
        if (this.line && !this.said) { say(VNAME[this.kind], this.line); this.said = true; }
      }
    } else if (this.state === 'bow') {
      this.p.play('bow');
      if (this.st > 1.6) { this.state = 'leave'; this.st = 0; }
    } else if (this.state === 'leave') {
      this.x -= this.speed * 1.2 * dt; this.p.play('walk');
      if (this.x < G.camX - 200) this.dead = true;
    } else if (this.state === 'offer') {
      this.p.play('offer');
      this.capT += dt;
      if (this.capT > (this.kind === 'cungu' ? 6 : 4.5)) G.villagerArrived(this);
    } else if (this.state === 'knocked') {
      this.p.play('knocked');
      if (this.st > 1.3) { this.state = 'flee'; this.st = 0; this.p.play('walk'); }
    } else if (this.state === 'flee') {
      this.x -= 260 * dt; this.p.cur.rot = 0; this.p.target.rot = 0;
      if (this.x < G.camX - 200) this.dead = true;
    }
    if (this.line2 && this.state === 'walk' && this.x - G.camX < W - 150 && !this.said2) { this.said2 = true; say(VNAME[this.kind], this.line2); }
    // 悟空一走近，她就小声求他（只有他听得见）
    if (this.plea && !this.pleaSaid && !G.inputLock && (this.state === 'walk' || this.state === 'offer') && Math.abs(G.player.x - this.x) < 330 && this.x - G.camX < W - 120) {
      this.pleaSaid = true; sayClear(); mutter('她', this.plea); G.onPlea && G.onPlea(this);
    }
  }
  onHit(pl) {
    if (this.state === 'knocked' || this.state === 'flee') return;
    if (this.demon) G.demonStruck(this);
    else {
      this.state = 'knocked'; this.st = 0; this.hittable = false; this.p.play('knocked', true);
      Sound.sfx('hit'); burst(this.x, this.y - 120, 8, 'paper');
      G.wrongHit(this);
    }
  }
  draw(g, camX) {
    const x = this.x - camX;
    const eyes = G.player.eyesAmt;
    const showGhost = this.demon && (eyes > 0 || (this.marked && (this.st % 1.8) < 0.3));
    const a = this.demon ? 1 - eyes * 0.6 : 1;
    // 身后那层淡影子（灯从另一边照过来）：人会骗人，影子不会——妖精的影子是飘着的一副骨头
    if (this.state !== 'flee') {
      const sx = x + (x - LAMP.x) * 0.1 + 22, so = { alpha: 0.3 * (1 - eyes), filter: 'blur(4px) grayscale(1) brightness(0.6)' };
      if (this.demon) this.ghost.draw(g, sx, this.y - 6, SC.baigu * this.h / HT.baigu * 1.3, -1, so);
      else this.p.draw(g, sx, this.y + 6, SC[this.kind] * 1.22, this.face, so);
    }
    if (!this.demon && eyes > 0) {
      // 好人：一圈暖光
      g.save(); g.globalCompositeOperation = 'screen';
      const gr = g.createRadialGradient(x, this.y - this.h / 2, 10, x, this.y - this.h / 2, this.h * 0.7);
      gr.addColorStop(0, `rgba(255,220,140,${0.45 * eyes})`); gr.addColorStop(1, 'rgba(255,200,100,0)');
      g.fillStyle = gr; g.fillRect(x - 200, this.y - this.h - 80, 400, this.h + 120);
      g.restore();
    }
    this.p.draw(g, x, this.y, SC[this.kind], this.face, { alpha: a, filter: this.tint });
    drawRods(g, [this.p.joints.head, this.p.joints.armF_u_tip || this.p.joints.armB_u], this.face, 0);
    if (showGhost) {
      const k = eyes > 0 ? eyes : 0.5;
      this.ghost.draw(g, x + 10, this.y - 10, SC.baigu * this.h / HT.baigu * 1.05, -1,
        { comp: 'source-over', alpha: 0.85 * k, filter: 'sepia(1) hue-rotate(70deg) saturate(2.5) brightness(1.15) drop-shadow(0 0 8px rgba(120,255,150,0.9))' });
    }
  }
}

// 篮子里倒出来的：一把小骨头，拿红绳一根根捆着
class BoneBundle extends Ent {
  constructor(x) { super(x); this.t = 0; this.bones = [[-26, -8, -0.35, 44], [-6, -12, 0.12, 52], [16, -7, 0.4, 40], [2, -20, -0.05, 36]]; }
  update(dt) { this.t += dt; }
  draw(g, camX) {
    const a = Math.min(1, this.t * 1.5);
    g.save(); g.translate(this.x - camX, GROUND + 2); g.globalAlpha = a; g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#efe4c4'; g.strokeStyle = '#3a2410'; g.lineWidth = 2.4;
    for (const [bx, by, r, l] of this.bones) {
      g.save(); g.translate(bx, by); g.rotate(r);
      g.beginPath(); g.rect(-l / 2, -3.5, l, 7); g.fill(); g.stroke();
      for (const sx of [-l / 2, l / 2]) for (const sy of [-4, 4]) { g.beginPath(); g.arc(sx, sy, 4.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
      g.restore();
    }
    g.strokeStyle = '#b3261e'; g.lineWidth = 3;
    for (const sx of [-12, 10]) { g.beginPath(); g.moveTo(sx - 3, -30); g.quadraticCurveTo(sx + 6, -12, sx - 2, 4); g.stroke(); }
    g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(26, 2, 34, -2); g.stroke();
    g.restore();
  }
}
// 被打死后留下的「假尸首」
class Corpse extends Ent {
  constructor(v) {
    super(v.x); this.kind = v.kind; this.face = v.face; this.p = new Puppet(v.kind, ANIMS.robe);
    this.p.play('knocked'); for (let i = 0; i < 30; i++) this.p.step(0.05); this.t = 0;
  }
  update(dt) { this.t += dt; this.p.step(dt); }
  draw(g, camX) {
    this.p.draw(g, this.x - camX, this.y + 6, SC[this.kind], this.face, { filter: 'grayscale(0.8) brightness(1.1)', alpha: 0.7 });
  }
}
// 一缕阴风逃走
class Wisp extends Ent {
  constructor(x, y) { super(x); this.y = y; this.t = 0; this.vx = 420; this.vy = -260; }
  update(dt) {
    this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 60 * dt;
    for (let i = 0; i < 2; i++) Parts.push({ kind: 'spark', x: this.x + rand(-10, 10), y: this.y + rand(-10, 10), vx: rand(-40, 40), vy: rand(-40, 40), t: 0, life: 0.6, s: rand(8, 16), r: 0, vr: 0 });
    if (this.t > 2.2) this.dead = true;
  }
  draw(g, camX) {
    g.save(); g.globalCompositeOperation = 'screen';
    const x = this.x - camX;
    const gr = g.createRadialGradient(x, this.y, 0, x, this.y, 60);
    gr.addColorStop(0, 'rgba(180,255,200,0.9)'); gr.addColorStop(1, 'rgba(120,255,160,0)');
    g.fillStyle = gr; g.fillRect(x - 60, this.y - 60, 120, 120);
    g.restore();
  }
}

// ---------------- 小妖 ----------------
function enemyTarget(e) {
  const d = G.decoy;
  if (d && !d.dead && Math.abs(d.x - e.x) < 800) return d;
  return G.player;
}
function fearCheck(e) {
  const pl = G.player;
  return pl.giant && Math.abs(pl.x - e.x) < 560;
}
class Bat extends Ent {
  constructor(x, y) {
    super(x); this.y0 = y || GROUND - 230; this.y = this.y0; this.t = rand(0, 6); this.p = new Puppet('bat', ANIMS.bat); this.p.play('fly');
    this.hp = 1; this.hittable = true; this.w = 90; this.h = 90; this.state = 'fly'; this.vx = 0; this.isEnemy = true;
  }
  box() { return { x0: this.x - 50, x1: this.x + 50, y0: this.y - 60, y1: this.y + 40 }; }
  update(dt) {
    this.t += dt; this.p.step(dt);
    if (this.frozen) { this.y = this.y0 + Math.sin(this.t * 3) * 12; return; }
    if (this.state === 'flee') {
      this.x += this.vx * dt; this.y -= 260 * dt;
      if (this.y < -100) { this.dead = true; }
      return;
    }
    if (fearCheck(this)) { this.state = 'flee'; this.vx = Math.sign(this.x - G.player.x) * 460; this.face = Math.sign(this.vx) || 1; G.onScared(this); return; }
    const tg = enemyTarget(this);
    const dx = tg.x - this.x;
    this.face = dx > 0 ? 1 : -1;
    const close = Math.abs(dx) < 180;
    const ty = close ? tg.y - 140 + Math.sin(this.t * 4) * 20 : this.y0 + Math.sin(this.t * 2.6) * 40;
    this.y += (ty - this.y) * Math.min(1, dt * 2.2);
    this.x += clamp(dx, -1, 1) * 150 * dt * (close ? 0.6 : 1) + Math.sin(this.t * 1.7) * 30 * dt;
    if (tg.isDecoy) { if (overlap(this.box(), tg.box())) tg.damage && (this.dmgT = (this.dmgT || 0) + dt) > 1 && (tg.damage(), this.dmgT = 0); }
    else if (overlap(this.box(), G.player.box())) G.player.damage(1, this.x);
  }
  onHit(pl) {
    this.dead = true; Sound.sfx('hit'); burst(this.x, this.y, 16, 'paper'); G.shake(4); G.onKill(this);
  }
  draw(g, camX) { this.p.draw(g, this.x - camX, this.y + 50, SC.bat, this.face); }
}
class Skel extends Ent {
  constructor(x, opt = {}) {
    super(x); this.p = new Puppet('skel', ANIMS.skel); this.p.play('walk');
    this.hp = 2; this.hittable = true; this.w = 80; this.h = 220; this.state = 'walk'; this.st = 0; this.cd = rand(0.3, 1.2); this.isEnemy = true;
    this.speed = opt.speed || 105; this.vx = 0;
  }
  update(dt) {
    this.st += dt; this.inv -= dt; this.cd -= dt; this.p.step(dt);
    if (this.state === 'flee') {
      this.x += this.vx * dt; this.p.play('flee');
      if (Math.abs(this.x - G.player.x) > 900) this.dead = true;
      return;
    }
    if (fearCheck(this)) { this.state = 'flee'; this.vx = Math.sign(this.x - G.player.x || 1) * 380; this.face = Math.sign(this.vx); G.onScared(this); return; }
    const tg = enemyTarget(this);
    const dx = tg.x - this.x;
    if (this.state === 'hurt') { this.x += this.vx * dt; this.vx *= Math.pow(0.02, dt); if (this.st > 0.35) this.state = 'walk'; return; }
    if (this.state === 'attack') {
      if (this.st > 0.12 && this.st < 0.32 && !this.struck && Math.abs(dx) < 160) {
        this.struck = true;
        if (tg.isDecoy) tg.damage(); else G.player.damage(1, this.x);
      }
      if (this.p.done) { this.state = 'walk'; this.cd = 1.3; }
      return;
    }
    this.face = dx > 0 ? 1 : -1;
    if (Math.abs(dx) > 125) { this.x += this.face * this.speed * dt; this.p.play('walk'); }
    else if (this.cd <= 0) { this.state = 'attack'; this.st = 0; this.struck = false; this.p.play('attack', true); Sound.sfx('swing'); }
    else this.p.play('idle');
  }
  onHit(pl, kind) {
    if (this.inv > 0) return;
    this.hp -= kind === 'stomp' ? 3 : 1; this.inv = 0.2;
    Sound.sfx('hit'); burst(this.x, this.y - 130, 8, 'paper'); G.shake(4);
    if (this.hp <= 0) { this.dead = true; burst(this.x, this.y - 120, 18, 'paper'); smoke(this.x, this.y - 80, 4); G.onKill(this); return; }
    this.state = 'hurt'; this.st = 0; this.vx = Math.sign(this.x - pl.x) * 260; this.p.play('hurt', true);
  }
  draw(g, camX) {
    this.p.draw(g, this.x - camX, this.y, SC.skel, this.face);
    drawRods(g, [this.p.joints.head, this.p.joints.armF_u_tip], this.face, 0);
  }
}
// 守门的骷髅将军：刀枪不入，只认动静
class Guard extends Skel {
  constructor(x) {
    super(x); this.post = x; this.state = 'post'; this.hp = 999; this.isEnemy = false; this.w = 140; this.h = 400; this.face = -1; this.speed = 150; this.clangT = 0;
  }
  update(dt) {
    this.st += dt; this.cd -= dt; this.clangT -= dt; this.p.step(dt);
    const pl = G.player, d = G.decoy && !G.decoy.dead ? G.decoy : null;
    if (this.state === 'attack') {
      if (this.st > 0.12 && !this.struck) {
        this.struck = true;
        if (this.tgt && this.tgt.isDecoy) this.tgt.damage();
        else if (Math.abs(pl.x - this.x) < 300) pl.damage(1, this.x, 650);
      }
      if (this.p.done) { this.state = d ? 'chase' : 'return'; this.cd = 1.1; }
      return;
    }
    if (d && Math.abs(d.x - this.x) < 1100) this.state = 'chase';
    if (this.state === 'chase') {
      if (!d) { this.state = 'return'; return; }
      const dx = d.x - this.x; this.face = dx > 0 ? 1 : -1;
      if (Math.abs(dx) > 150) { this.x += this.face * this.speed * dt; this.p.play('walk'); }
      else if (this.cd <= 0) { this.tgt = d; this.state = 'attack'; this.st = 0; this.struck = false; this.p.play('attack', true); }
      else this.p.play('idle');
    } else if (this.state === 'return') {
      const dx = this.post - this.x;
      if (Math.abs(dx) > 8) { this.face = dx > 0 ? 1 : -1; this.x += this.face * 120 * dt; this.p.play('walk'); }
      else { this.state = 'post'; }
    } else {
      this.face = -1; this.p.play('idle');
      if (pl.x > this.x - 300 && pl.x < this.x + 80 && this.cd <= 0) {
        this.tgt = pl; this.state = 'attack'; this.st = 0; this.struck = false; this.p.play('attack', true); Sound.sfx('swing');
        if (!this.warned) { this.warned = true; say('守门将', '门后是她的家。取经的，绕着走！'); mutter('悟空', '绕不开。路是人家画好的。'); }
      }
    }
  }
  onHit(pl) {
    if (this.clangT > 0) return;
    this.clangT = 0.3; Sound.sfx('clang'); burst(pl.x + pl.face * 150, pl.y - 150, 10, 'spark');
    if (!this.toldClang) { this.toldClang = true; G.hint('守门将刀枪不入——按 U 拔根毫毛，留个假影子把他引开', 6); }
  }
  draw(g, camX) {
    this.p.draw(g, this.x - camX, this.y, SC.guard, this.face, { filter: 'blur(1.5px) brightness(0.8) saturate(0.6)' });
    drawRods(g, [this.p.joints.head, this.p.joints.armF_u_tip], this.face, 0, 0.3);
  }
}

// ---------------- 白骨夫人 ----------------
class Dart extends Ent {
  constructor(x, y, vx, vy) { super(x); this.y = y; this.vx = vx; this.vy = vy; this.r = 0; this.t = 0; }
  update(dt) {
    this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 200 * dt; this.r += 14 * dt;
    if (this.y > GROUND + 10 || this.t > 4) { this.dead = true; burst(this.x, GROUND, 3, 'paper', { col: '#e8e0c8' }); }
    const pl = G.player, b = pl.box();
    const tg = G.decoy && !G.decoy.dead ? G.decoy : null;
    if (tg && Math.abs(tg.x - this.x) < 40 && this.y > tg.y - 230) { tg.damage(); this.dead = true; return; }
    if (this.x > b.x0 && this.x < b.x1 && this.y > b.y0 && this.y < b.y1) { pl.damage(1, this.x); this.dead = true; }
  }
  draw(g, camX) {
    g.save(); g.translate(this.x - camX, this.y); g.rotate(this.r);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#efe6cc'; g.strokeStyle = '#2a1a0a'; g.lineWidth = 3;
    g.beginPath(); g.rect(-24, -5, 48, 10); g.fill(); g.stroke();
    for (const sx of [-26, 26]) for (const sy of [-6, 6]) { g.beginPath(); g.arc(sx, sy, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.restore();
  }
}
class Debris extends Ent {
  constructor(img, M, camX) {
    super(M[4] + camX); this.img = img; this.y = M[5];
    this.sx = Math.hypot(M[0], M[1]); this.flip = (M[0] * M[3] - M[1] * M[2]) < 0 ? -1 : 1;
    this.r = Math.atan2(this.flip * M[1], M[3]); this.vx = rand(-260, 260); this.vy = rand(-600, -200); this.vr = rand(-6, 6); this.rest = false;
    this.pv = [0, 0];
  }
  update(dt) {
    if (this.rest) return;
    this.vy += 1600 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.r += this.vr * dt;
    if (this.y > GROUND - 10) { this.y = GROUND - 10; this.vy *= -0.3; this.vx *= 0.5; this.vr *= 0.5; if (Math.abs(this.vy) < 60) { this.rest = true; this.r = Math.round(this.r / Math.PI) * Math.PI + rand(-0.3, 0.3); } }
  }
  draw(g, camX) {
    const im = IMG[this.img]; if (!im) return;
    g.save(); g.globalCompositeOperation = 'multiply';
    g.translate(this.x - camX, this.y); g.rotate(this.r); g.scale(this.sx * this.flip, this.sx);
    g.drawImage(im, -this.pv[0], -this.pv[1]);
    g.restore();
  }
}

class Boss extends Ent {
  constructor(x, opt = {}) {
    super(x); this.p = new Puppet('baigu', ANIMS.baigu); this.p.play('float');
    this.face = -1; this.phase = 1; this.hp = 5; this.hittable = true; this.t = 0; this.st = 0;
    this.depth = 0; this.hover = 170; this.yb = GROUND - 170; this.y = this.yb;
    this.castT = 1.5; this.swoopT = 5; this.swoop = 0; this.fake = !!opt.fake; this.dying = false;
    this.slamT = 2; this.slamX = null; this.isBoss = true;
  }
  get size() { return 1 + 1.1 * this.depth; }
  box() {
    const s = this.size, w = 130 * s, h = 380 * s;
    return { x0: this.x - w / 2, x1: this.x + w / 2, y0: this.y - h, y1: this.y + 20 };
  }
  update(dt) {
    this.t += dt; this.st += dt; this.inv -= dt; this.p.step(dt);
    if (this.dying) return;
    const pl = G.player;
    if (this.phase === 1 || this.phase === 3) {
      // 在幕上飘
      this.depth = Math.max(0, this.depth - dt * 0.8);
      const want = pl.x + (this.x > pl.x ? 260 : -260);
      const wx = clamp(want, G.lock[0] + 120, G.lock[1] - 120);
      this.x += clamp(wx - this.x, -150 * dt, 150 * dt) + Math.sin(this.t * 0.9 + (this.seed || 0)) * 40 * dt;
      this.face = pl.x < this.x ? -1 : 1;
      this.swoopT -= dt; this.castT -= dt;
      if (this.swoop > 0) {
        this.swoop -= dt; this.hover += (0 - this.hover) * Math.min(1, dt * 4);
        this.x += this.face * 220 * dt;
        if (overlap(this.box(), pl.box()) && !this.fake) pl.damage(1, this.x);
      } else this.hover += (170 + Math.sin(this.t * 2) * 30 - this.hover) * Math.min(1, dt * 2);
      if (this.swoopT <= 0 && this.phase === 1) { this.swoop = 1.6; this.swoopT = 6; this.p.play('slash', true); Sound.phrase('八大 八大 仓', 300, 0.7); }
      if (this.castT <= 0) {
        this.castT = this.phase === 1 ? 2.8 : 3.4 + rand(0, 1.5); this.p.play('cast', true);
        const sx = this.x + this.face * 60, sy = this.y - 300;
        const n = this.phase === 1 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const ang = Math.atan2(pl.y - 120 - sy, pl.x - sx) + (i - (n - 1) / 2) * 0.22;
          G.add(new Dart(sx, sy, Math.cos(ang) * 430, Math.sin(ang) * 430));
        }
        Sound.sfx('swing');
      }
      if (this.p.done && this.p.animName !== 'float') this.p.play('float');
      this.y = GROUND - this.hover;
    } else if (this.phase === 2) {
      // 躲到灯前：巨大的虚影
      this.depth = Math.min(1, this.depth + dt * 0.7);
      const cx = G.camX + W / 2 + Math.sin(this.t * 0.5) * 220;
      this.x += (cx - this.x) * Math.min(1, dt * 1.2);
      this.y = GROUND - 40 + Math.sin(this.t * 1.3) * 10;
      this.face = pl.x < this.x ? -1 : 1;
      this.slamT -= dt;
      if (this.slamX === null && this.slamT <= 0) { this.slamX = pl.x; this.slamWarn = 0.95; this.p.play('slash', true); Sound.phrase('令 令 令', 400, 0.8); }
      if (this.slamX !== null) {
        this.slamWarn -= dt;
        if (this.slamWarn <= 0) {
          Sound.sfx('stomp'); G.shake(18); smoke(this.slamX, GROUND - 10, 10, 1.5);
          if (Math.abs(pl.x - this.slamX) < 140) pl.damage(1, this.slamX, 500);
          this.slamX = null; this.slamT = 2.0;
        }
      }
      if (this.p.done && this.p.animName !== 'float') this.p.play('float');
    }
  }
  onHit(pl, kind) {
    if (this.inv > 0 || this.dying) return;
    if (this.phase === 2 && !pl.giant) {
      Sound.sfx('clang');
      if (!this.toldGiant) { this.toldGiant = true; G.hint('她躲在灯前，影子比你大——按住 K，影子对影子打！', 6); }
      return;
    }
    if (this.fake) { G.illusionHit(this); return; }
    this.inv = 0.45; this.hp--; Sound.sfx('hit'); Sound.phrase('仓', 200); G.shake(10);
    burst(this.x, this.y - 200 * this.size, 16, 'paper', { col: '#e8e0c8' }); burst(this.x, this.y - 200 * this.size, 10, 'spark');
    this.p.play('hurt', true);
    if (this.hp <= 0) G.bossPhaseDone(this);
  }
  draw(g, camX) {
    const x = this.x - camX, s = SC.baigu * this.size;
    const eyes = G.player.eyesAmt;
    let alpha = 1, filter = depthFilter(this.depth);
    if (this.phase === 3) {
      if (this.fake) alpha = 1 - eyes * 0.75;
      else if (eyes > 0) filter = `drop-shadow(0 0 ${12 * eyes}px rgba(120,255,150,0.95))`;
    }
    if (this.phase === 2 && this.slamX !== null) {
      // 爪子落点预警
      const sx = this.slamX - camX, k = 1 - Math.max(0, this.slamWarn) / 0.95;
      g.save(); g.globalCompositeOperation = 'multiply';
      const gr = g.createLinearGradient(0, GROUND - 400, 0, GROUND);
      gr.addColorStop(0, 'rgba(140,0,0,0)'); gr.addColorStop(1, `rgba(140,0,0,${0.25 + 0.4 * k})`);
      g.fillStyle = gr; g.fillRect(sx - 140, GROUND - 400, 280, 410);
      g.restore();
    }
    this.p.draw(g, x, this.y, s, this.face, { filter, alpha, comp: this.phase === 3 && !this.fake && eyes > 0 ? 'source-over' : 'multiply' });
    drawRods(g, [this.p.joints.head, this.p.joints.armF_l_tip], this.face, 0, this.depth);
  }
  explode() {
    this.dying = true; this.dead = true;
    const cam = G.camX;
    const pieces = [];
    for (const b of this.p.rig.bones) {
      const M = this.p.mats[b.n]; if (!M) continue;
      const d = new Debris(b.img, M, cam); d.pv = b.pv; d.bone = b.n; pieces.push(d); G.add(d);
    }
    return pieces;
  }
}
