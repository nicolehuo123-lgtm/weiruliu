// 皮影关节：每个部件一张图，绕关节钉转。姿势按「一下一下」的节拍切换，像艺人手里的签子。
const IMG = {};
const IMG_DARK = {};

function loadImages(list, done) {
  let left = list.length;
  if (!left) return done();
  list.forEach(name => {
    const im = new Image();
    im.onload = () => {
      IMG[name] = im;
      // 远侧的胳膊腿压暗一点，好分前后
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.filter = 'brightness(0.72) saturate(0.9)'; g.drawImage(im, 0, 0);
      IMG_DARK[name] = c;
      if (--left === 0) done();
    };
    im.onerror = () => { console.warn('缺图', name); if (--left === 0) done(); };
    im.src = 'assets/' + name + '.png';
  });
}

// 角度约定：正数 = 往前摆（不管朝哪边）。up 的骨头（身子、头）往前是顺时针，挂着的肢体往前是逆时针。
const UP_BONES = { chest: 1, head: 1, body: 1, hip: 0 };

class Puppet {
  constructor(rigName, anims) {
    this.rig = RIGS[rigName];
    this.anims = anims;
    this.cur = {};       // 正在显示的角度
    this.target = {};
    this.anim = null; this.animName = ''; this.t = 0; this.frame = 0; this.done = false;
    this.joints = {};    // 世界坐标里的关节位置（画签子用）
    this.rig.bones.forEach(b => { this.cur[b.n] = 0; this.target[b.n] = 0; });
    this.cur.dy = 0; this.target.dy = 0; this.cur.rot = 0; this.target.rot = 0;
  }
  play(name, restart = false) {
    if (this.animName === name && !restart) return;
    const a = this.anims[name];
    if (!a) return;
    this.anim = a; this.animName = name; this.t = 0; this.frame = -1; this.done = false;
    this.step(0);
  }
  step(dt) {
    if (!this.anim) return;
    const a = this.anim;
    this.t += dt;
    let f = Math.floor(this.t * a.fps);
    if (f >= a.frames.length) {
      if (a.loop) f %= a.frames.length; else { f = a.frames.length - 1; this.done = true; }
    }
    if (f !== this.frame) {
      this.frame = f;
      const p = a.frames[f];
      for (const k in this.target) this.target[k] = (p[k] !== undefined ? p[k] : (a.base && a.base[k] !== undefined ? a.base[k] : 0));
    }
    // 拍子到了就「甩」过去：很快，但不是瞬间
    const k = 1 - Math.pow(1 - (a.snap || 0.5), dt * 60);
    for (const n in this.target) this.cur[n] += (this.target[n] - this.cur[n]) * k;
  }
  // x,y = 脚底；s = 屏幕像素/图像素；face = 1 朝右 -1 朝左
  draw(g, x, y, s, face, opt = {}) {
    const rig = this.rig;
    const flip = face * rig.face;
    const list = [];
    const world = {};
    const deg = Math.PI / 180;
    // 先算每根骨头的变换
    for (const b of rig.bones) {
      let a = (this.cur[b.n] || 0) * deg;
      a = UP_BONES[b.n] ? a : -a;
      if (b.rest) a += b.rest * deg;
      let M;
      if (!b.par) {
        M = [1, 0, 0, 1, 0, 0];
        M = mul(M, [1, 0, 0, 1, 0, -rig.hipH + (this.cur.dy || 0)]);
        M = mul(M, rot((this.cur.rot || 0) * deg));
      } else {
        const P = world[b.par];
        const pb = rig.byName[b.par];
        M = mul(P, [1, 0, 0, 1, b.at[0] - pb.pv[0], b.at[1] - pb.pv[1]]);
      }
      M = mul(M, rot(a));
      world[b.n] = M;
      list.push(b);
    }
    // 整个人：先移到脚底，翻面，缩放
    const base = [flip * s, 0, 0, s, x, y];
    list.sort((p, q) => p.z - q.z);
    g.save();
    if (opt.alpha !== undefined) g.globalAlpha = opt.alpha;
    if (opt.filter) g.filter = opt.filter;
    g.globalCompositeOperation = opt.comp || 'multiply';
    for (const b of list) {
      const im = (b.back ? IMG_DARK : IMG)[b.img];
      if (!im) continue;
      if (opt.hide && opt.hide[b.n]) continue;
      const M = mul(base, world[b.n]);
      g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
      g.drawImage(im, -b.pv[0], -b.pv[1]);
    }
    g.restore();
    // 关节世界坐标
    this.mats = {};
    for (const b of rig.bones) {
      const M = mul(base, world[b.n]);
      this.mats[b.n] = M;
      this.joints[b.n] = [M[4], M[5]];
      if (b.tip) {
        const t = apply(M, [b.tip[0] - b.pv[0], b.tip[1] - b.pv[1]]);
        this.joints[b.n + '_tip'] = t;
      }
    }
  }
}

function mul(A, B) {
  return [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
}
function rot(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; }
function apply(M, p) { return [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]]; }

function prepRigs() {
  for (const k in RIGS) {
    const r = RIGS[k];
    r.byName = {};
    r.bones.forEach(b => r.byName[b.n] = b);
  }
}
