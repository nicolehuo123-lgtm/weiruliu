// 《未入流》：开场、主循环、镜头、录像、结尾

const cv = document.getElementById('game'), g = cv.getContext('2d');

let recT0 = 0;
function logEv(name) { if (window.__ev) window.__ev.push({ t: +(performance.now() / 1000 - recT0).toFixed(2), name }); }
function startRecording() {
  window.__ev = []; recT0 = performance.now() / 1000;
  const vs = cv.captureStream(30);
  const tracks = [...vs.getVideoTracks()];
  if (Sound.stream) tracks.push(...Sound.stream.getAudioTracks());
  const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 3.5e6 });
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = () => { window.__recBlob = new Blob(chunks, { type: 'video/webm' }); window.__recDone = true; };
  rec.start(1000);
  window.__recorder = rec;
}
window.__getRecChunk = async (i, size) => {
  const b = window.__recBlob.slice(i * size, (i + 1) * size);
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = ''; for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
  return btoa(s);
};
window.__state = () => ({ mode: G.mode, scene: G.sceneIdx, name: SCENES[G.sceneIdx] && SCENES[G.sceneIdx][0], cap: Captions.cur && Captions.cur.text, ctrl: G.ctrl, x: G.hero && Math.round(G.hero.x), t: +G.t.toFixed(1) });

// ---------------- 开场 ----------------
let titleWk = null;
function renderTitle(dt) {
  drawScreen(g, null);
  g.save(); g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  if (!titleWk) { titleWk = new Puppet('wukong_bare', ANIMS.wukong); titleWk.play('pose'); }
  titleWk.step(dt);
  titleWk.draw(g, 880, GROUND + 6, SC.wukong * 1.25, -1, {});
  drawRods(g, [titleWk.joints.head, titleWk.joints.armF_l_tip, titleWk.joints.armB_l_tip], -1, 0);
  drawGroundBand(g, 0);
  g.restore();
  drawVignette(g, 0); drawFrame(g);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalCompositeOperation = 'multiply';
  g.fillStyle = '#4a1408'; g.font = `128px ${FONT_BRUSH}`;
  [...'未入流'].forEach((c, i) => g.fillText(c, 380, 190 + i * 130));
  g.font = `28px ${FONT_KAI}`; g.fillStyle = '#5a2a10';
  [...'皮影戏·西游记'].forEach((c, i) => g.fillText(c, 520, 200 + i * 34));
  if (LANG === 'ja') { g.font = `17px ${FONT_KAI}`; g.fillStyle = '#6a3a18'; [...ja('皮影戏·西游记')].forEach((c, i) => g.fillText(c, 556, 204 + i * 22)); }
  g.restore();
  g.save(); g.textAlign = 'center'; g.font = `22px ${FONT_KAI}`;
  g.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 3); g.fillStyle = '#e0b060';
  g.fillText('击 回车　开锣', W / 2, LANG === 'ja' ? H - 38 : H - 28);
  if (LANG === 'ja') { g.font = `15px ${FONT_KAI}`; g.fillText(ja('击 回车　开锣'), W / 2, H - 14); }
  g.restore();
}

// ---------------- 结尾 ----------------
function renderEnd(dt) {
  G.endT = (G.endT || 0) + dt;
  g.fillStyle = '#050201'; g.fillRect(0, 0, W, H);
  const a = clamp(G.endT / 2, 0, 1);
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#a8946c'; g.font = `64px ${FONT_BRUSH}`;
  g.fillText('未入流', W / 2, H / 2 - 30);
  g.font = `26px ${FONT_KAI}`; g.fillStyle = '#7a6a4c';
  g.fillText('终', W / 2, H / 2 + 40);
  if (G.endT > 3) { g.globalAlpha = 0.5 + 0.3 * Math.sin(G.t * 3); g.font = `20px ${FONT_KAI}`; g.fillText('击 回车　再演一场', W / 2, H - 40); if (LANG === 'ja') { g.font = `15px ${FONT_KAI}`; g.fillText(ja('击 回车　再演一场'), W / 2, H - 18); } }
  g.restore();
}

// 从中间开演时，把前面该有的东西补上
function prime(cp) {
  const h = G.hero;
  moodReset();
  G.tags = []; G.rank = ''; G.mk = '大圣';
  h.setBare(true);
  if (cp >= 1) G.rank = '弼马温　品从：？';
  if (cp >= 3) G.rank = '弼马温　未入流';
  if (cp >= 4) G.rank = '齐天大圣　官品极矣';
  if (cp >= 6) G.rank = '齐天大圣　无禄人员';
  if (cp >= 8) G.rank = '五行山下';
  if (cp >= 9) {
    h.setBare(false); G.mk = '行者'; G.rank = '行者'; G.tags = [{ text: '紫金钵盂' }];
    Mood.chants = 3; Mood.cap = 0.9; Mood.gloom = 0.21; for (let i = 0; i < 3; i++) addTear();
  }
  if (cp >= 10) { G.tags.push({ text: '袖里一纸贬书' }); Mood.chants = 6; Mood.cap = 0.8; Mood.gloom = 0.42; for (let i = 0; i < 6; i++) addTear(); }
  if (cp >= 16) G.tags = G.tags.filter(t => t.text !== '紫金钵盂');
  if (cp >= 17) G.rank = '斗战胜佛';
  if (cp >= 18) h.setBare(true);
}

function startGame() {
  Sound.resume();
  G.mode = 'play'; G.endT = 0; G.huiSeen = new Set();
  const cp = Q.has('cp') ? +Q.get('cp') : 0;
  if (!G.hero) G.hero = new Hero(200);
  prime(cp);
  G.fade = 1;
  runCut(play(cp));
  logEv('start');
}

// ---------------- 主循环 ----------------
// 每场的锣鼓：[平时, 打起来]。前半出天上热闹，走路才有点子；戴上箍以后板和小锣吊着；后半出只剩堂鼓
const SCENE_MUSIC = {
  御马监: ['walk'], 蟠桃园: ['walk'], 五行山: ['tense'], 心猿归正: ['tense'],
  白虎岭: ['tense'], 宝象国: ['dirge'], 莲花洞: ['tense'], 乌鸡国: ['tense'], 金兜洞: ['tense'], 狮驼岭: ['tense', 'boss'],
  宝阁: ['dirge'], 通天河: ['dirge'], 封佛: ['dirge'], 难簿: ['dirge'],
};
function updatePlay(dt) {
  const h = G.hero;
  stepCut('ev', dt);
  // 自己走（换场时被领着走几步）
  if (h.autoX !== null && h.autoX !== undefined) {
    const d = h.autoX - h.x;
    if (Math.abs(d) < 6) { h.autoX = null; if (h.anim === 'walk') h.anim = null; }
    else { h.x += Math.sign(d) * Math.min(Math.abs(d), (h.autoSpeed || 260) * dt); h.face = Math.sign(d); h.anim = 'walk'; }
  }
  for (const a of G.actors) a.update(dt);
  if (h.kb) { h.x = clamp(h.x + h.kb * dt, 40, G.worldW - 40); h.kb *= Math.pow(0.002, dt); if (Math.abs(h.kb) < 10) h.kb = 0; }
  // 翻筋斗：W S 上下
  if (h.fly) {
    const ctl = h.ctl;
    const vy = ctl ? ((Input.down('down') ? 1 : 0) - (Input.down('jump') ? 1 : 0)) * 340 : 0;
    h.y = clamp(h.y + vy * dt, SCR.t + 230, GROUND - 20);
  }
  // 火眼金睛
  const want = G.eyesOK && !G.inputLock && Input.down('eyes') ? 1 : 0;
  G.eyesAmt = clamp((G.eyesAmt || 0) + (want ? 3 : -3) * dt, 0, 1);
  for (const a of G.actors) if (a.follow) { a.x = a.follow.t.x + a.follow.dx; a.y = a.follow.t.y + a.follow.dy; }
  G.hooks.tick && G.hooks.tick(dt);
  updateActs();
  for (let i = G.timers.length - 1; i >= 0; i--) { const tm = G.timers[i]; tm.t -= dt; if (tm.t <= 0) { G.timers.splice(i, 1); tm.fn(); } }
  updateParts(dt);
  if (Captions.cur && Input.hit('skip') && !G.bot && Captions.t > 0.4) Captions.t = Captions.cur.dur;
  updateCaptions(dt);
  // 镜头
  let wantX = G.camFix !== null && G.camFix !== undefined ? G.camFix : h.x - W * 0.45 + h.face * 60;
  wantX = clamp(wantX, 0, Math.max(0, G.worldW - W));
  if (G.camSnap) { G.camX = wantX; G.camSnap = false; }
  G.camX += (wantX - G.camX) * Math.min(1, dt * 3.2);
  G.shakeAmt = Math.max(0, G.shakeAmt - dt * 40);
  G.flash = Math.max(0, G.flash - dt * 1.5);
  G.rankGlow = Math.max(0, (G.rankGlow || 0) - dt);
  Mood.tremble = Math.max(Math.min(0.45, Mood.chants * 0.05), Mood.tremble - dt * 0.7);
  // 锣鼓：每场垫自己的点子，有人在打就换成打的点子
  const fighting = G.foes.some(f => !f.dead && !f.held && G.actors.includes(f)) && !G.inputLock;
  const [calm, fight = 'fight'] = SCENE_MUSIC[SCENES[G.sceneIdx] && SCENES[G.sceneIdx][0]] || [];
  Sound.setLoop(fighting ? fight : calm || null);
  Sound.setDrone(Math.min(0.35, Mood.gloom * 0.4));
  G.ctrl = ctrlLine();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  G.t += dt;
  lampFlick = 0.94 + 0.03 * Math.sin(G.t * 7.3) + 0.02 * Math.sin(G.t * 13.1 + 1) + 0.015 * Math.sin(G.t * 23.7);
  Input.bot = G.bot && G.mode === 'play' ? botInput() : {};
  Input.update();
  Sound.tick();
  for (let i = G.tweens.length - 1; i >= 0; i--) {
    const tw = G.tweens[i]; tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.obj[tw.key] = lerp(tw.from, tw.to, tw.ease ? tw.ease(k) : k);
    if (k >= 1) G.tweens.splice(i, 1);
  }
  if (G.mode === 'title') {
    renderTitle(dt);
    if (Q.has('rec') && !window.__recorder && !+(Q.get('cp') || 0)) { Sound.resume(); startRecording(); }
    if (Input.hit('start') || (G.bot && G.t > (Q.has('rec') ? 4 : 1.5))) {
      Sound.resume();
      if (Q.has('rec') && !window.__recorder) startRecording();
      Sound.phrase('仓 才 仓 才 仓 才 八大 仓 - 令才 令才 仓', 260);
      startGame();
    }
  } else if (G.mode === 'play') {
    updatePlay(dt);
    render(dt);
    if (G.mode === 'end') { if (window.__recorder) setTimeout(() => window.__recorder.stop(), Q.has('until') ? 200 : 6000); }
  } else if (G.mode === 'end') {
    renderEnd(dt);
    if (Input.hit('start') && G.endT > 3 && !G.bot) { G.mode = 'title'; G.t = 0; G.endT = 0; }
  }
  requestAnimationFrame(frame);
}

function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px';
}
addEventListener('resize', fit);
makeCloth(); prepRigs(); fit();
RIGS.wukong_bare.bones.find(b => b.n === 'head').img = 'wukong_head_bare';
// 图和字体都到了再开戏，免得头几帧字体还没换上
const fontsReady = document.fonts ? Promise.all([document.fonts.load(`40px ${FONT_BRUSH}`, '未入流'), document.fonts.load(`20px ${FONT_KAI}`, '皮影')]).catch(() => {}) : Promise.resolve();
loadImages([...new Set([...RIG_IMAGES, ...HS_IMAGES])], () => fontsReady.then(() => {
  document.getElementById('loading').style.display = 'none';
  requestAnimationFrame(t => { last = t; frame(t); });
}));
