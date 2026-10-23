// 姿势表。角度单位是度，正数=往前摆。fps 低 = 一顿一顿。
const WK_BASE = { chest: 4, head: -4, armF_u: 30, armF_l: 70, prop: 0, armB_u: -12, armB_l: 25, legF_u: 10, legF_l: -8, legB_u: -10, legB_l: -6 };
const ANIMS = {
  wukong: {
    idle: { fps: 2.5, loop: 1, snap: 0.25, base: WK_BASE, frames: [
      { dy: 0 }, { dy: 4, chest: 2, head: 0, armB_l: 35 },
    ] },
    walk: { fps: 8, loop: 1, snap: 0.55, base: { ...WK_BASE, chest: 9, head: -8 }, frames: [
      { legF_u: 28, legF_l: -6, legB_u: -22, legB_l: -18, armB_u: 24, dy: 0 },
      { legF_u: 10, legF_l: -38, legB_u: -6, legB_l: -4, armB_u: 4, dy: -8 },
      { legF_u: -22, legF_l: -18, legB_u: 28, legB_l: -6, armB_u: -24, dy: 0 },
      { legF_u: -6, legF_l: -4, legB_u: 10, legB_l: -38, armB_u: 4, dy: -8 },
    ] },
    jump: { fps: 12, snap: 0.6, base: WK_BASE, frames: [
      { legF_u: 45, legF_l: -80, legB_u: 30, legB_l: -70, dy: 50, chest: 15 },
      { legF_u: 60, legF_l: -95, legB_u: -15, legB_l: -50, armB_u: 150, armB_l: 30, dy: 0, chest: 10 },
    ] },
    fall: { fps: 6, snap: 0.4, base: WK_BASE, frames: [
      { legF_u: 25, legF_l: -35, legB_u: -30, legB_l: -25, armB_u: 110, armB_l: 20 },
    ] },
    attack: { fps: 16, snap: 0.75, base: WK_BASE, frames: [
      { chest: -12, head: -10, armF_u: 205, armF_l: 30, prop: 70, legF_u: 30, legF_l: -25, legB_u: -25, legB_l: -10, armB_u: -40 },
      { chest: 24, head: -6, armF_u: 100, armF_l: 4, prop: 95, legF_u: 50, legF_l: -40, legB_u: -35, legB_l: -12, dy: 18, armB_u: -60 },
      { chest: 28, head: -6, armF_u: 70, armF_l: 0, prop: 95, legF_u: 50, legF_l: -40, legB_u: -35, legB_l: -12, dy: 18, armB_u: -60 },
      { chest: 20, head: -6, armF_u: 60, armF_l: 10, prop: 90, legF_u: 40, legF_l: -30, legB_u: -30, legB_l: -10, dy: 12, armB_u: -40 },
      { chest: 10, armF_u: 40, armF_l: 50, prop: 30, dy: 4 },
    ] },
    stomp: { fps: 9, snap: 0.6, base: WK_BASE, frames: [
      { legF_u: 85, legF_l: -70, chest: -8, armF_u: 170, armF_l: 40, prop: 60, armB_u: 120 },
      { legF_u: 95, legF_l: -60, chest: -12, armF_u: 190, armF_l: 30, prop: 60, armB_u: 140 },
      { legF_u: 20, legF_l: -10, legB_u: -25, chest: 25, armF_u: 80, armF_l: 0, prop: 95, dy: 24, armB_u: -50 },
      { legF_u: 20, legF_l: -10, legB_u: -25, chest: 25, armF_u: 70, armF_l: 0, prop: 95, dy: 24, armB_u: -50 },
      { dy: 8 },
    ] },
    hurt: { fps: 8, snap: 0.7, base: WK_BASE, frames: [
      { chest: -22, head: -18, armF_u: 50, armB_u: 70, legF_u: 25, legB_u: -25, rot: -10, dy: 6 },
      { chest: -10, head: -8, armF_u: 40, armB_u: 40, rot: -4 },
    ] },
    headache: { fps: 6, loop: 1, snap: 0.6, base: WK_BASE, frames: [
      { armF_u: 160, armF_l: 120, prop: 40, armB_u: 165, armB_l: 115, chest: 20, head: 18, rot: 8, dy: 40, legF_u: 40, legF_l: -60, legB_u: 20, legB_l: -60 },
      { armF_u: 170, armF_l: 110, prop: 40, armB_u: 155, armB_l: 125, chest: 10, head: -10, rot: -8, dy: 46, legF_u: 30, legF_l: -70, legB_u: 30, legB_l: -50 },
    ] },
    flip: { fps: 10, snap: 0.8, base: WK_BASE, frames: [
      { rot: 0, legF_u: 70, legF_l: -110, legB_u: 60, legB_l: -110, dy: -40 },
      { rot: 100, legF_u: 80, legF_l: -120, legB_u: 70, legB_l: -120, dy: -120 },
      { rot: 200, legF_u: 80, legF_l: -120, legB_u: 70, legB_l: -120, dy: -120 },
      { rot: 300, legF_u: 70, legF_l: -110, legB_u: 60, legB_l: -110, dy: -60 },
      { rot: 360, legF_u: 40, legF_l: -70, legB_u: 30, legB_l: -60, dy: 30 },
    ] },
    taunt: { fps: 5, loop: 1, snap: 0.5, base: WK_BASE, frames: [
      { armB_u: 165, armB_l: 120, head: 10, chest: -4, legF_u: 20, dy: 0 },
      { armB_u: 150, armB_l: 140, head: -6, chest: 4, legF_u: 0, dy: 6 },
    ] },
    // 签子断了：没人提着，整张皮软倒在幕上
    collapse: { fps: 3, snap: 0.18, base: WK_BASE, frames: [
      { chest: 20, head: 30, armF_u: 10, armF_l: 20, prop: 30, armB_u: -5, armB_l: 10, legF_u: 30, legF_l: -60, legB_u: 20, legB_l: -60, dy: 50, rot: -10 },
      { chest: 10, head: 35, armF_u: -20, armF_l: 10, prop: 10, armB_u: -30, armB_l: 0, legF_u: 10, legF_l: -10, legB_u: 0, legB_l: -5, dy: 105, rot: -82 },
    ] },
    pose: { fps: 4, snap: 0.5, base: WK_BASE, frames: [
      { armF_u: 150, armF_l: 20, prop: 90, armB_u: 70, armB_l: 60, chest: -4, head: -10, legF_u: 30, legF_l: -10, legB_u: -25, legB_l: 0 },
    ] },
  },
  robe: {
    idle: { fps: 2, loop: 1, snap: 0.25, frames: [{ body: 0, head: 0 }, { body: 1.5, head: 3, dy: 1 }] },
    walk: { fps: 6, loop: 1, snap: 0.5, frames: [
      { body: 3, head: -2, armF_u: 10, armB_u: -12, dy: 0 },
      { body: 0, head: 0, armF_u: 0, armB_u: 0, dy: -5 },
      { body: -2, head: 2, armF_u: -10, armB_u: 12, dy: 0 },
      { body: 0, head: 0, armF_u: 0, armB_u: 0, dy: -5 },
    ] },
    bow: { fps: 4, snap: 0.4, frames: [{ body: 12, head: 14, armF_u: 30 }, { body: 16, head: 18, armF_u: 40 }] },
    offer: { fps: 3, loop: 1, snap: 0.4, frames: [{ body: 6, head: 6, armF_u: 50, prop: -50 }, { body: 8, head: 10, armF_u: 55, prop: -55, dy: 2 }] },
    knocked: { fps: 8, snap: 0.5, frames: [{ rot: -30, body: -10, armF_u: 60, armB_u: 80 }, { rot: -80, body: -10, armF_u: 90, armB_u: 100, dy: -10 }] },
    chant: { fps: 6, loop: 1, snap: 0.6, frames: [{ head: 8, body: 2, armF_u: 30 }, { head: -4, body: 0, armF_u: 40 }] },
    angry: { fps: 5, loop: 1, snap: 0.6, frames: [{ head: -10, body: -6, armF_u: 90 }, { head: -6, body: -4, armF_u: 70 }] },
  },
  skel: {
    idle: { fps: 3, loop: 1, snap: 0.3, base: { armF_u: 40, prop: -40, armB_u: -10 }, frames: [{ head: 0, dy: 0 }, { head: 8, dy: 3, chest: 3 }] },
    walk: { fps: 7, loop: 1, snap: 0.6, base: { armF_u: 40, prop: -40, chest: 6 }, frames: [
      { legF_u: 25, legB_u: -25, armB_u: 20, dy: 0 }, { legF_u: 0, legB_u: 0, dy: -8 },
      { legF_u: -25, legB_u: 25, armB_u: -20, dy: 0 }, { legF_u: 0, legB_u: 0, dy: -8 },
    ] },
    attack: { fps: 10, snap: 0.7, base: { chest: 6 }, frames: [
      { armF_u: 20, prop: -20, chest: -10, legF_u: 20, legB_u: -15 },
      { armF_u: 95, prop: -95, chest: 20, legF_u: 35, legB_u: -30, dy: 10 },
      { armF_u: 95, prop: -95, chest: 20, legF_u: 35, legB_u: -30, dy: 10 },
      { armF_u: 40, prop: -40 },
    ] },
    flee: { fps: 12, loop: 1, snap: 0.7, base: { chest: -15, head: -20, armF_u: 160, armB_u: 150, prop: 0 }, frames: [
      { legF_u: 40, legB_u: -40, dy: 0 }, { legF_u: -40, legB_u: 40, dy: -10 },
    ] },
    hurt: { fps: 8, snap: 0.7, frames: [{ chest: -25, head: -20, armF_u: 60, rot: 10 }, { chest: -10, rot: 4 }] },
  },
  bat: {
    fly: { fps: 9, loop: 1, snap: 0.75, frames: [
      { wingF: -40, wingB: 40, dy: 0 }, { wingF: 10, wingB: -10, dy: 6 }, { wingF: 50, wingB: -50, dy: 10 }, { wingF: 10, wingB: -10, dy: 4 },
    ] },
  },
  baigu: {
    float: { fps: 3, loop: 1, snap: 0.3, frames: [
      { hip: 0, chest: 4, head: -6, armF_u: 40, armF_l: 30, armB_u: 20, armB_l: 20, dy: 0 },
      { hip: 4, chest: 8, head: 0, armF_u: 55, armF_l: 45, armB_u: 35, armB_l: 30, dy: 14 },
    ] },
    cast: { fps: 8, snap: 0.6, frames: [
      { chest: -10, head: -12, armF_u: 170, armF_l: 30, armB_u: 150, armB_l: 30 },
      { chest: 15, head: 6, armF_u: 80, armF_l: 0, armB_u: 60, armB_l: 0 },
    ] },
    slash: { fps: 10, snap: 0.7, frames: [
      { chest: -15, armF_u: 190, armF_l: 40, armB_u: 160 },
      { chest: -15, armF_u: 200, armF_l: 50, armB_u: 170 },
      { chest: 25, armF_u: 40, armF_l: 10, armB_u: 30, dy: 30 },
      { chest: 25, armF_u: 30, armF_l: 10, armB_u: 20, dy: 30 },
    ] },
    hurt: { fps: 8, snap: 0.7, frames: [{ chest: -25, head: -25, armF_u: 120, armB_u: 140, rot: 8 }, { chest: -10, head: -10, rot: 3 }] },
  },
};
