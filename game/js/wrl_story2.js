// 第三折：白虎岭接宝象国（第二十七至三十一回）

// 她变的人：按住 L 用火眼看，才看得见身后飘着的那副骨头
class Disg extends Pup {
  constructor(kind, x, o = {}) { super(kind, ANIMS.robe, x, { face: -1, ...o }); this.ghost = new Puppet('baigu', ANIMS.baigu); this.ghost.play('float'); this.w = 90; this.hh = 120; }
  update(dt) { super.update(dt); this.ghost.step(dt); }
  draw(g) {
    if (this.hidden) return;
    const e = G.eyesAmt || 0;
    this.alpha = 1 - e * 0.55;
    super.draw(g);
    if (e > 0) this.ghost.draw(g, SX(this.x) + 10, this.y - 10, SC.baigu * (HT[this.rig] || 240) / HT.baigu * 1.05, -1,
      { comp: 'source-over', alpha: 0.85 * e, filter: 'sepia(1) hue-rotate(70deg) saturate(2.5) brightness(1.15) drop-shadow(0 0 8px rgba(120,255,150,0.9))' });
  }
}
// 打下去留下的「假尸首」
class Husk extends Pup {
  constructor(d) { super(d.rig, ANIMS.robe, d.x, { face: d.face, rods: [] }); this.forceAnim = 'knocked'; for (let i = 0; i < 30; i++) this.p.step(0.05); this.filter = 'grayscale(0.8) brightness(1.1)'; this.alpha = 0.7; this.z = 1; }
}
function wisp(x, y) {
  for (let i = 0; i < 30; i++) G.after(i * 0.04, () => Parts.push({ kind: 'spark', x: x + i * 14, y: y - i * 9 + rand(-10, 10), vx: rand(-40, 40), vy: rand(-40, 40), t: 0, life: 0.7, s: rand(8, 16), r: 0, vr: 0 }));
}
// 一堆粉骷髅，脊梁上一行字
function drawBones(g, x, k = 1, lit = 0) {
  const sx = SX(x); if (sx < -300 || sx > W + 300) return;
  g.save(); g.globalAlpha = k; g.globalCompositeOperation = 'multiply';
  if (IMG.scn_bones) { const im = IMG.scn_bones, s = 1.25; g.drawImage(im, sx - im.width * s / 2, GROUND + 8 - im.height * s, im.width * s, im.height * s); }
  g.restore();
  g.save(); g.globalAlpha = k;
  if (lit > 0) { g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(sx, GROUND - 30, 0, sx, GROUND - 30, 200); gr.addColorStop(0, `rgba(255,236,190,${0.35 * lit})`); gr.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = gr; g.fillRect(sx - 220, GROUND - 230, 440, 300); }
  g.globalCompositeOperation = 'source-over'; g.font = `24px ${FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeStyle = 'rgba(30,10,4,0.8)'; g.lineWidth = 3; g.strokeText('白骨夫人', sx + 4, GROUND - 22);
  g.fillStyle = `rgba(232,200,150,${0.75 + 0.25 * lit})`; g.fillText('白骨夫人', sx + 4, GROUND - 22);
  g.restore();
}
function ridge() {
  G.scen.push(scn('scn_mountains', 400, 'sky', { s: 2.0, filter: 'saturate(0.5)' }), scn('scn_mountains', 1400, 'sky', { s: 1.8, flip: -1, filter: 'saturate(0.5)' }));
  for (let x = 150; x < G.worldW; x += 520) G.scen.push(scn(x % 1040 < 520 ? 'scn_deadtree' : 'scn_bigrock', x, 'mid', { s: 1.1, flip: x % 3 ? 1 : -1 }));
  for (let x = 60; x < G.worldW; x += 330) G.scen.push(scn('scn_grass', x, 'front', { s: 0.9, a: 0.7 }));
}
// 一打、二打、三打共用：她走过来，棒子落下去，只剩一个假尸首
function* strikeOne(d, o) {
  let hit = false;
  const H_ = { get x() { return d.x; }, w: 90, hh: 120, y: GROUND, onHit() { if (hit) return; hit = true; this.off = true; } };
  G.hits.push(H_);
  G.botGoal = { fight: true, holdFirst: o.holdFirst ?? 1.6 };
  G.eyesOK = true;
  yield () => hit;
  G.botGoal = null;
  G.eyesOK = false;
  Sound.sfx('hit'); G.shake(10); burst(d.x, d.y - 140, 10, 'paper');
  G.remove(d);
  const husk = G.add(new Husk(d));
  wisp(d.x, d.y - 160); Sound.sfx('poof');
  return husk;
}

function* s_baihu() {
  stage({ w: 2400, hx: 900 }); G.mk = '行者'; setRank('行者');
  ridge();
  const tang = G.tang = G.add(new Pup('tangseng', ANIMS.robe, 700, { face: 1 }));
  const ba = G.ba = G.add(new Pup('bajie', ANIMS.robe, 560, { face: 1, s: 0.45 }));
  G.camFix = 400;
  lock(true);
  yield* fade(0, 1);
  yield* zhe('第三折', '白虎岭');
  yield* title('第二十七回', '尸魔三戏唐三藏');
  // 云端里
  yield* M('妖精', '造化，造化。几年家人都讲东土的唐和尚取大乘，他本是金蝉子化身，十世修行的原体，有人吃他一块肉，长寿长生。真个今日到了。');
  // 一打
  const d1 = G.add(new Disg('cungu', 1800));
  d1.goto(1180, 70);
  yield 2.5;
  yield* L('八戒', '女菩萨，往那里去？手里提着是什么东西？');
  yield () => d1.gotoX === null;
  d1.forceAnim = 'offer';
  yield* L('女子', '长老，我这青罐里是香米饭，绿瓶里是炒面觔。特来此处无他故，因还誓愿要斋僧。');
  lock(false); G.camFix = null;
  G.hint('按定 L　火眼金睛', 5);
  G.eyesOK = true; G.botGoal = { hold: 'eyes' }; yield 2.4;
  const catchUp = () => { const x = Math.min(G.hero.x, G.worldW - 500); tang.goto(x - 240, 110); ba.goto(x - 370, 110); };
  const husk1 = yield* strikeOne(d1, {});
  lock(true); catchUp();
  yield* N('那怪物有些手段，使个『解尸法』，见行者棍子来时，他却抖擞精神，预先走了，把一个假尸首打死在地下。');
  yield* L('唐僧', '这猴着然无礼，屡劝不从，无故伤人性命。');
  yield* L('行者', '师父莫怪，你且来看看这罐子里是甚东西？');
  for (let i = 0; i < 8; i++) Parts.push({ kind: 'paper', x: husk1.x + rand(-30, 30), y: GROUND - 10, vx: rand(-160, 160), vy: rand(-380, -200), r: 0, vr: rand(-6, 6), t: 0, life: 1.4, s: 8, col: '#2f5d2a' });
  yield* N('那里是甚香米饭，却是一罐子拖尾巴的长蛆；也不是面觔，却是几个青蛙、癞虾蟆，满地乱跳。');
  yield* L('八戒', '师父，说起这个女子，他是此间农妇，因为送饭下田，路遇我等，却怎么栽他是个妖怪？');
  yield* L('八戒', '怕你念什么紧箍儿咒，故意的使个障眼法儿，变做这等样东西，演幌你眼，使不念咒哩。');
  yield* N('三藏自此一言，就是晦气到了。果然信那呆子撺唆，手中捻诀，口里念咒。');
  yield* chant(2);
  yield* L('行者', '头疼，头疼。莫念，莫念，有话便说。');
  yield* L('唐僧', '有甚话说？出家人时时常要方便，念念不离善心，扫地恐伤蝼蚁命，爱惜飞蛾纱罩灯。你怎么步步行凶，打死这个无故平人，取将经来何用？你回去罢。');
  yield* L('唐僧', '既如此说，且饶你这一次，再休无礼。如若仍前作恶，这咒语颠倒就念二十遍。');
  yield* L('行者', '三十遍也由你，只是我不打人了。');
  // 二打
  G.remove(husk1);
  const d2 = G.add(new Disg('laofu', 2300));
  d2.goto(1250, 60);
  yield 3;
  lock(false);
  G.eyesOK = true; G.botGoal = { hold: 'eyes' }; yield 2.4;
  const husk2 = yield* strikeOne(d2, { holdFirst: 1.2 });
  lock(true); catchUp();
  yield* N('那怪见棍子起时，依然抖擞，又出化了元神，脱真儿去了，把个假尸首又打死在山路傍之下。');
  yield* N('唐僧一见，惊下马来，睡在路傍，更无二话，只是把紧箍儿咒颠倒足足念了二十遍。');
  yield* chant(4, true);
  yield* L('行者', '师父莫念了，有甚话说了罢。');
  yield* L('唐僧', '有甚话说？出家人耳听善言，不堕地狱。我这般劝化你，你怎么只是行凶？把平人打死一个，又打死一个，此是何说？');
  yield* L('行者', '他是妖精。');
  yield* L('唐僧', '你且起来，我再饶你这一次，却不可再行凶了。');
  yield* L('行者', '再不敢了。再不敢了。');
  G.remove(husk2);
  yield* M('妖精', '好个猴王，着然有眼，我那般变了去，他也还认得我。这些和尚他去得快，若过此山，西下四十里，就不伏我所管了。');
  yield* M('妖精', '我还下去戏他一戏。');
  // 三打
  const d3 = G.add(new Disg('laoweng', 2300));
  d3.goto(1300, 55);
  yield () => d3.gotoX === null;
  yield* waitAct('迎著他叫声：老官儿', () => d3.x, { r: 260 });
  yield* L('行者', '老官儿，往那里去？怎么又走路，又念经？');
  yield* L('老公公', '长老呵，我老汉祖居此地，一生好善斋僧，看经念佛。命里无儿，止生得一个小女，招了个女婿。今早送饭下田，想是遭逢虎口。');
  yield* L('行者', '我是个做虎的祖宗，你怎么袖子里笼了个鬼儿来哄我？你瞒了诸人，瞒不过我，我认得你是个妖精。');
  yield* M('行者', '若要不打他，显得他倒弄个风儿；若要打他，又怕师父念那话儿咒语。');
  yield* waitAct('念动咒语，叫当坊土地、本处山神');
  const gods = [G.add(P('p_tudi', 900, { s: 0.55, y: 250, face: 1, cloud: 0.8, alpha: 0 })), G.add(P('p_tudi', 1500, { s: 0.55, y: 240, face: -1, cloud: 0.8, alpha: 0, filter: 'hue-rotate(40deg)' }))];
  for (const q of gods) G.tween(q, 'alpha', 0.85, 1.2);
  yield* L('行者', '这妖精三番来戏弄我师父，这一番却要打杀他。你与我在半空中作证，不许走了。');
  yield* N('众神听令，谁敢不从，都在云端里照应。');
  lock(false);
  let hit = false;
  G.hits.push({ get x() { return d3.x; }, w: 90, hh: 120, y: GROUND, onHit() { if (hit) return; hit = true; this.off = true; } });
  G.botGoal = { fight: true }; G.eyesOK = true;
  yield () => hit;
  G.botGoal = null; G.eyesOK = false;
  Sound.sfx('smash'); G.shake(16); G.flash = 0.6;
  G.remove(d3);
  const bx = d3.x; G.bonesX = bx;
  G.hooks.back = g => drawBones(g, bx, 1);
  lock(true);
  G.hero.face = 1; G.tween(G.hero, 'x', Math.min(G.hero.x, bx - 230), 0.5);
  yield 0.5; catchUp();
  yield* N('那大圣棍起处，打倒妖魔，才断绝了灵光。');
  yield* L('八戒', '好行者，风发了，只行了半日路，倒打死三个人。');
  yield* L('行者', '师父莫念，莫念，你且来看看他的模样。');
  G.camFix = clamp(bx - 940, 0, G.worldW - W);
  yield* N('却是一堆粉骷髅在那里。');
  yield* L('唐僧', '悟空，这个人才死了，怎么就化作一堆骷髅？');
  yield* L('行者', '他是个潜灵作怪的僵尸，在此迷人败本，被我打杀，他就现了本相。他那脊梁上有一行字，叫做『白骨夫人』。');
  yield* N('唐僧闻说，倒也信了。');
  yield* L('八戒', '师父，他的手重棍凶，把人打死，只怕你念那话儿，故意变化这个模样，掩你的眼目哩。');
  yield* N('唐僧果然耳软，又信了他，随复念起。');
  yield* chant(3, true);
  yield* L('行者', '莫念，莫念，有话快说了罢。');
  yield* L('唐僧', '猴头，还有甚说话？你在这荒郊野外，一连打死三人，还是无人检举，没有对头；倘到城市之中，人烟凑集之所，你拿了那哭丧棒，一时不知好歹，乱打起人来，撞出大祸，教我怎的脱身？你回去罢。');
  yield* N('写了一纸贬书，递于行者道：');
  const paper = { x: tang.x + 60, k: 1 };
  G.hooks.front = g => { if (paper.k > 0) drawPaper(g, SX(paper.x), GROUND - 150, 1.2, 0.1); };
  yield* L('唐僧', '猴头，执此为照，再不要你做徒弟了；如再与你相见，我就堕了阿鼻地狱。');
  yield* L('行者', '师父，不消发誓，老孙去罢。');
  G.hero.frozen = true;
  yield* waitAct('将书折了，留在袖内');
  G.tween(paper, 'x', G.hero.x, 0.4); yield 0.45; paper.k = 0; Sound.sfx('pickup');
  tag('袖里一纸贬书');
  yield* N('他将书折了，留在袖内。');
  yield* waitAct('请师父坐，受我一拜');
  G.hero.face = tang.x < G.hero.x ? -1 : 1;
  G.hero.prop = false; G.hero.anim = 'kneel'; yield 0.6;
  tang.face = tang.x < G.hero.x ? -1 : 1;
  yield* N('唐僧转回身不睬。');
  yield* L('唐僧', '我是个好和尚，不受你歹人的礼。');
  yield 1.2;
  G.hero.anim = null; G.hero.prop = true; G.hero.frozen = false;
  // 师父和八戒往西走了；山神土地在云里看着，一声不出
  tang.goto(G.worldW + 200, 70); ba.goto(G.worldW + 260, 70);
  yield 4;
  for (const q of gods) G.tween(q, 'alpha', 0, 3);
  yield 3.5;
  G.camFix = clamp(bx - 940, 0, G.worldW - W);
  lock(false); G.ctrlBase = 'A D 行走';
  const t0 = G.t;
  G.botGoal = { x: () => (G.t - t0 < 4 ? null : 0) };
  yield () => G.hero.x < 120;
  G.botGoal = null;
  yield* fade(1, 1.4);
}

function* s_baoxiang() {
  // 宝象国　夜宴
  stage({ hx: -300, ctrl: '', noHero: true }); G.mk = '行者';
  G.tint = 'rgba(160,140,200,1)';
  G.scen.push(scn('scn_dian', 640, 'far', { s: 0.95 }), scn('scn_yan', 640, 'main', { s: 1.0 }));
  const hp = G.add(P('p_huangpao', 760, { face: -1 }));
  const pp = G.add(P('p_pipa', 520, { face: 1 }));
  const pp2 = G.add(P('p_pipa', 380, { face: 1, filter: 'hue-rotate(60deg)', alpha: 0.9 }));
  lock(true); G.camFix = 0;
  yield* fade(0, 1);
  yield* title('第二十九回', '宝象国');
  Sound.phrase('扎 - 台 - 令 - 台 - 令 台 扎', 140, 0.5);
  yield* N('那怪物独坐上席，左右排列的都是那艳质娇姿。');
  yield* N('至二更时分，醉将上来，忍不住胡为，现了本相，陡发凶心，伸开簸箕大手，把一个弹琵琶的女子抓将过来，扢咋的把头咬了一口。');
  hp.goto(560, 600); yield 0.3; Sound.sfx('smash'); G.shake(12); G.flash = 0.5;
  pp.rot = -1.3; pp.y += 30; pp.filter = 'grayscale(1)'; pp.bob = 0; pp2.goto(-200, 300);
  yield 2.5;
  yield* fade(1, 1);

  // 花果山　八戒来请
  stage({ w: 1800, hx: 900, ctrl: '' }); G.mk = '行者';
  hills({ tree: 'scn_peach' });
  G.scen.push(scn('scn_cliff', 1400, 'main', { s: 1.2 }), scn('scn_stone', 1100, 'main', { s: 1.0 }));
  for (const [x, im] of [[300, 'scn_mk_cheer'], [520, 'scn_mk_peach'], [1250, 'scn_mk_scratch'], [1560, 'scn_mk_crouch']]) G.add(P(im, x, { s: 0.5, face: x < 900 ? 1 : -1 }));
  const ba = G.add(new Pup('bajie', ANIMS.robe, -100, { face: 1, s: 0.45 }));
  G.hero.face = -1;
  yield* fade(0, 1);
  yield* title('第三十一回', '猪八戒义激猴王');
  ba.goto(680, 110);
  yield () => ba.gotoX === null;
  lock(true);
  yield* L('行者', '你不跟唐僧取经去，却来这里怎的？想是你冲撞了师父，师父也贬你回来了。有甚贬书，拿来我看。');
  glowTag('袖里一纸贬书', true);
  yield* L('八戒', '不曾冲撞他，他也没什么贬书，也不曾赶我。');
  yield* L('行者', '既无贬书，又不曾赶你，你来我这里怎的？');
  yield* L('八戒', '师父想你，着我来请你的。');
  yield* L('行者', '他也不请我，他也不想我。他那日对天发誓，亲笔写了贬书，怎么又肯想我，又肯着你远来请我？我断然也是不好去的。');
  yield* L('八戒', '委是想你，委是想你。');
  glowTag('袖里一纸贬书', false);
  yield 1;
  yield* fade(1, 1);

  // 碗子山　打黄袍
  stage({ w: 1800, hx: 300 }); G.mk = '行者';
  hills();
  G.scen.push(scn('scn_cave', 1500, 'main', { s: 1.3 }));
  const f = new Foe('p_huangpao', 1200, { hp: 4, lowAt: 0, speed: 160 }); G.add(f); G.foes.push(f);
  yield* fade(0, 0.8);
  G.botGoal = { fight: true };
  yield () => f.hp <= 1;
  G.botGoal = null; lock(true);
  smoke(f.x, f.y - 120, 14, 1.5); Sound.sfx('poof'); f.dead = true; G.remove(f);
  yield 1;
  yield* N('原来他是孙大圣大闹天宫时打怕了的神将，闪在那山涧里潜灾，被水汽隐住妖云，所以不曾看见他。');
  yield* fade(1, 0.8);

  // 南天门　要打，被众星劝住
  stage({ w: 1600, hx: 200 }); G.mk = '行者';
  heaven({ hall: false });
  G.scen.push(scn('scn_tianmen', 1100, 'main', { s: 0.85 }));
  const kui = G.add(P('p_kui', 1000, { face: 1 }));
  const stars = [1180, 1300, 900].map((x, i) => G.add(P('p_bing', x, { face: -1, s: 0.75, filter: i === 2 ? 'hue-rotate(200deg)' : '' })));
  yield* fade(0, 0.8);
  let blocked = false;
  G.hits.push({ x: 1000, w: 260, hh: 120, y: GROUND, onHit() { if (blocked) return; blocked = true; Sound.sfx('clang'); G.shake(6); for (const s of stars) s.goto(s.x < 1000 ? 940 : 1060, 300); } });
  G.botGoal = { fight: true };
  yield () => blocked;
  G.botGoal = null; lock(true);
  yield* N('被大圣拦住天门要打，幸亏众星劝住，押见玉帝。');
  yield* fade(1, 0.8);

  // 灵霄殿
  stage({ hx: 360, hface: 1, ctrl: '' }); G.mk = '行者';
  heaven();
  G.add(P('p_yudi', 1040, { face: -1, s: 0.9 }));
  const ts = G.add(P('p_tianshi', 860, { face: -1 }));
  const kneel = G.add(P('p_kui', 600, { face: 1 }));
  lock(true); G.camFix = 0;
  yield* fade(0, 0.8);
  yield* title('第三十一回', '灵霄殿');
  yield* L('天师', '奎木狼下界了。');
  yield* L('玉帝', '多少时不在天了？');
  yield* L('天师', '四卯不到，三日点卯一次，今已十三日了。');
  yield* L('玉帝', '天上十三日，下界已是十三年。');
  yield* L('玉帝', '奎木狼，上界有无边的胜景，你不受用，却私走一方，何也？');
  yield* L('奎木狼', '万岁，赦臣死罪。是臣不负前期，变作妖魔，占了名山，摄他到洞府，与他配了一十三年夫妻。『一饮一啄，莫非前定。』今被孙大圣到此成功。');
  yield* N('玉帝闻言，收了金牌，贬他去兜率宫与太上老君烧火，带俸差操，有功复职，无功重加其罪。');
  kneel.goto(-200, 120);
  G.hero.frozen = true; G.hero.noAttack = true;
  yield* waitAct('朝上唱个大喏');
  G.hero.prop = false; yield* nuo(); G.hero.prop = true;
  yield* L('行者', '列位，起动了。');
  yield* L('天师', '那个猴子还是这等村俗，替他收了怪神，也倒不谢天恩，却就唱喏而退。');
  yield* L('玉帝', '只得他无事，落得天上清平是幸。');
  yield 1;
  yield* fade(1, 1);
}
