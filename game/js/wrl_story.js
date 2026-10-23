// 《未入流》的戏：五折，十几场。每一场开头写回目；台词出自原著，只做了挑选和删节。

Object.assign(ANIMS.wukong, {
  // 唱个大喏：两手抱拳举过胸，腰往下一躬
  nuo: { fps: 2.2, snap: 0.35, base: WK_BASE, frames: [
    { armF_u: 100, armF_l: 70, prop: 0, armB_u: 95, armB_l: 75, chest: 4, head: -2 },
    { armF_u: 85, armF_l: 85, prop: 0, armB_u: 80, armB_l: 85, chest: 30, head: 22, dy: 8, legF_u: 4, legB_u: -4 },
    { armF_u: 85, armF_l: 85, prop: 0, armB_u: 80, armB_l: 85, chest: 32, head: 24, dy: 9, legF_u: 4, legB_u: -4 },
  ] },
  sit: { fps: 1.5, loop: 1, snap: 0.25, base: WK_BASE, frames: [
    { chest: 8, head: 6, legF_u: 85, legF_l: -80, legB_u: 75, legB_l: -85, dy: 92, armF_u: 40, armF_l: 60 },
    { chest: 10, head: 9, legF_u: 85, legF_l: -80, legB_u: 75, legB_l: -85, dy: 94, armF_u: 42, armF_l: 62 },
  ] },
});

// ===================== 第一折　入流 =====================
function* s_shouguan() {
  stage({ hx: 300, ctrl: '' }); G.hero.setBare(true); G.mk = '猴王'; G.rank = ''; G.tags = []; moodReset();
  heaven();
  G.add(P('p_yudi', 1020, { face: -1, s: 0.9 }));
  G.add(P('p_guan', 720, { face: -1 }));
  G.add(P('p_bing', 1180, { face: -1, s: 0.7, alpha: 0.8 }));
  lock(true);
  yield* fade(0, 1.0);
  yield* title('第四回', '官封弼马');
  yield 1.2;
  yield* L('武曲星君', '天宫里各宫各殿，各方各处，都不少官，只是御马监缺个正堂管事。');
  yield* L('玉帝', '就除他做个弼马温罢。');
  yield* L('众臣', '谢恩。');
  G.hero.frozen = true;
  yield* waitAct('朝上唱个大喏');
  G.hero.prop = false; yield* nuo(); G.hero.prop = true; G.hero.frozen = false;
  setRank('弼马温　品从：？');
  yield 1.2;
  yield* fade(1);
}

function* s_yumajian() {
  stage({ w: 2600, hx: 160, ctrl: 'A D 行走　W 腾跃' }); G.mk = '猴王'; G.hero.setBare(true);
  G.tint = 'rgba(150,160,215,1)';
  heaven({ hall: false });
  const troughs = [640, 1380, 2120];
  for (const x of troughs) G.scen.push(scn('scn_cao', x, 'main', { s: 1.2 }));
  G.hero.noAttack = true;
  // 六匹马：两匹瘦的在槽边，两匹睡倒的，两匹走散的
  const spec = [
    { x: 560, st: 'thin', home: 560 }, { x: 760, st: 'sleep', home: 720 }, { x: 1300, st: 'thin', home: 1300 },
    { x: 1700, st: 'roam', home: 1460 }, { x: 2040, st: 'sleep', home: 2060 }, { x: 2480, st: 'roam', home: 2200 },
  ];
  const horses = spec.map((o, i) => {
    const hz = G.add(P('b_horse', o.x, { face: i % 2 ? 1 : -1, sx: 0.74, sy: 0.96, z: 2 }));
    hz.st = o.st; hz.home = o.home; hz.fed = false;
    if (o.st === 'sleep') { hz.rot = 0.32 * (hz.face === hz.artFace ? -1 : 1); hz.y += 24; hz.bob = 0; }
    return hz;
  });
  const label = hz => ({ thin: '添些草料', sleep: '赶起来吃草', roam: '捉将来靠槽' })[hz.st];
  const fatten = hz => { G.tween(hz, 'sx', 1.08, 2.2); G.tween(hz, 'sy', 1.03, 2.2); burst(hz.x, GROUND - 60, 10, 'paper', { col: '#8a6a2a', size: 0.7 }); Sound.sfx('pickup'); G.after(2.3, () => { hz.fed = true; }); };
  for (const hz of horses) {
    act(label(hz), () => hz.x, () => {
      if (hz.st === 'sleep') { G.tween(hz, 'rot', 0, 0.4); G.tween(hz, 'y', GROUND + 6, 0.4); hz.bob = 2; Sound.sfx('jump'); G.after(0.5, () => fatten(hz)); }
      else if (hz.st === 'roam') { hz.goto(hz.home, 260); G.after(1.4, () => fatten(hz)); }
      else fatten(hz);
      hz.st = 'done';
    }, { r: 120 });
  }
  G.hooks.tick = dt => { for (const hz of horses) if (hz.st === 'roam' && hz.gotoX === null && Math.random() < dt * 0.6) hz.goto(hz.home + rand(200, 420), 70); };
  yield* fade(0);
  yield* title('第四回', '御马监');
  yield* N('弼马昼夜不睡，滋养马匹。日间舞弄犹可，夜间看管殷勤：但是马睡的，赶起来吃草；走的，捉将来靠槽。');
  G.botGoal = { x: () => { const n = horses.filter(h => h.st !== 'done').sort((a, b) => Math.abs(a.x - G.hero.x) - Math.abs(b.x - G.hero.x))[0]; return n ? n.x : null; }, key: 'act', delay: 0.4 };
  yield () => horses.every(h => h.fed);
  G.botGoal = null;
  yield* N('那些天马见了他，泯耳攒蹄，倒养得肉肥膘满。');
  yield 1;
  yield* cards(['不觉的半月有余。'], { hold: 1.2 });
}

function* s_jiefeng() {
  stage({ w: 2700, hx: 380, ctrl: '' }); G.mk = '猴王'; G.hero.setBare(true);
  heaven({ hall: false });
  G.scen.push(scn('scn_cao', 160, 'mid', { s: 1.1 }), scn('scn_tianmen', 2420, 'main', { s: 0.85 }));
  for (const x of [80, 260]) G.add(P('b_horse', x, { face: 1, sx: 1.08, sy: 1.03, alpha: 0.75, z: 1, rods: false }));
  G.scen.push(scn('scn_yan', 640, 'main', { s: 1.0 }));
  const an = G.add(P('scn_an', 1020, { s: 0.8, bob: 0, rods: false, z: 2 }));
  const j1 = G.add(P('p_guan', 760, { face: -1 })), j2 = G.add(P('p_guan', 880, { face: -1, filter: 'hue-rotate(70deg)' }));
  const tiand = [2250, 2330, 2600].map(x => G.add(P('p_bing', x, { face: -1, s: 0.75 })));
  G.camFix = 0; lock(true);
  yield* fade(0);
  yield* N('一朝闲暇，众监官都安排酒席，一则与他接风，二则与他贺喜。');
  G.hero.frozen = true;
  yield* waitAct('停杯问曰');
  yield* L(G.mk, '我这弼马温是个什么官衔？');
  yield* L('众监官', '官名就是此了。');
  yield* waitAct('又问：此官是个几品？');
  yield* L(G.mk, '此官是个几品？');
  yield* L('众监官', '没有品从。');
  yield* waitAct('没品，想是大之极也？');
  yield* L(G.mk, '没品，想是大之极也？');
  yield* L('众监官', '不大，不大，只唤做未入流。');
  stamp('未入流'); setRank('弼马温　未入流');
  yield 1.6;
  yield* waitAct('怎么叫做「未入流」？');
  yield* L(G.mk, '怎么叫做『未入流』？');
  yield* L('众监官', '末等。这样官儿最低最小，只可与他看马。似堂尊到任之后，这等殷勤，喂得马肥，只落得道声『好』字；如稍有些尪羸，还要见责；再十分伤损，还要罚赎问罪。');
  yield* N('猴王闻此，不觉心头火起，咬牙大怒道：');
  G.shake(4);
  yield* L(G.mk, '这般藐视老孙！老孙在那花果山称王称祖，怎么哄我来替他养马？养马者，乃后生小辈下贱之役，岂是待我的？不做他，不做他，我将去也。');
  G.hero.frozen = false; G.camFix = null; G.ctrlBase = CTRL_WALK; lock(false);
  let down = false;
  G.hits.push({ x: an.x, w: 220, hh: 80, y: GROUND, onHit() { if (down) return; down = true; this.off = true; Sound.sfx('smash'); G.shake(14); burst(an.x, GROUND - 80, 18, 'paper'); G.tween(an, 'rot', 1.35, 0.35); G.tween(an, 'x', an.x + 90, 0.35); } });
  G.hint('J　把公案推倒', 4);
  G.botGoal = { fight: true };
  yield () => down;
  G.botGoal = null;
  j1.goto(-200, 320); j2.goto(-260, 300);
  yield* N('忽喇的一声，把公案推倒，耳中取出宝贝，幌一幌，碗来粗细，一路解数，直打出御马监，径至南天门。');
  G.botGoal = { x: 2660 };
  yield () => G.hero.x > 2000;
  tiand[0].goto(2120, 160); tiand[1].goto(2180, 160);
  yield* N('众天丁知他受了仙箓，乃是个弼马温，不敢阻当，让他打出天门去了。');
  yield () => G.hero.x > 2560;
  G.botGoal = null;
  yield* fade(1);
}

function* s_zhaoan() {
  stage({ hx: -200, ctrl: '', noHero: true }); G.mk = '猴王';
  heaven();
  G.add(P('p_yudi', 1020, { face: -1, s: 0.9 }));
  const tb = G.add(P('p_taibai', 760, { face: 1 }));
  lock(true); G.camFix = 0;
  yield* fade(0);
  yield* title('第四回', '有官无禄');
  yield* L('太白金星', '那妖猴只知出言，不知大小。欲加兵与他争斗，想一时不能收伏，反又劳师。不若万岁大舍恩慈，还降招安旨意，就教他做个齐天大圣。只是加他个空衔，有官无禄便了。');
  yield* L('玉帝', '怎么唤做『有官无禄』？');
  yield* L('太白金星', '名是齐天大圣，只不与他事管，不与他俸禄，且养在天壤之间，收他的邪心，使不生狂妄，庶乾坤安靖，海宇得清宁也。');
  yield* L('玉帝', '依卿所奏。');
  yield* fade(1, 0.6);
  G.hero.hidden = false; G.hero.x = 200; tb.x = 380; tb.face = 1;
  yield* fade(0, 0.6);
  yield* walkHero(600);
  yield* L('太白金星', '臣奉诏宣弼马温孙悟空已到。');
  yield* L('玉帝', '那孙悟空过来，今宣你做个齐天大圣，官品极矣，但切不可胡为。');
  G.mk = '大圣'; G.hero.frozen = true;
  yield* waitAct('朝上唱个喏，道声「谢恩」');
  G.hero.prop = false; yield* nuo(); G.hero.prop = true;
  yield* L('大圣', '谢恩。');
  setRank('齐天大圣　官品极矣');
  yield 1;
  yield* N('那齐天府下二司仙吏，早晚伏侍，只知日食三餐，夜眠一榻，无事牵萦，自由自在。');
  yield* L('玉帝', '朕见你身闲无事，与你件执事：你且权管那蟠桃园，早晚好生在意。');
  yield* waitAct('欢喜谢恩，朝上唱喏而退');
  G.hero.prop = false; yield* nuo(); G.hero.prop = true;
  yield 0.6;
  yield* fade(1);
}

const PANTAO_LIST = ['西天佛老', '菩萨', '圣僧', '罗汉', '南方南极观音', '东方崇恩圣帝', '十洲三岛仙翁', '北方北极玄灵', '中央黄极黄角大仙',
  '这个是五方五老', '还有五斗星君', '上八洞三清', '四帝', '太乙天仙等众', '中八洞玉皇', '九垒', '海岳神仙', '下八洞幽冥教主', '注世地仙', '各宫各殿大小尊神'];
function* s_pantao() {
  stage({ w: 2600, hx: 160 }); G.mk = '大圣'; G.hero.setBare(true);
  heaven({ hall: false });
  const trees = [420, 820, 1240, 1660, 2380];
  trees.forEach((x, i) => G.scen.push(scn('scn_peach', x, 'main', { s: 1.15, flip: i % 2 ? -1 : 1 })));
  G.scen.push(scn('scn_yan', 2060, 'main', { s: 1.0 }));
  let ate = 0;
  for (const x of trees.slice(0, 3)) act('拣那熟透的大桃', x, () => { ate++; burst(x, GROUND - 220, 6, 'paper', { col: '#d8452f', size: 0.8 }); Sound.sfx('pickup'); G.hero.anim = 'touch'; G.after(0.6, () => { G.hero.anim = null; }); }, { r: 120 });
  yield* fade(0);
  yield* title('第五回', '蟠桃园');
  G.botGoal = { x: 1240, key: 'act', delay: 0.3 };
  yield () => G.hero.x > 1150 || ate >= 3;
  G.botGoal = null;
  yield* N('原来大圣耍了一会，吃了几个桃子，变做二寸长的个人儿，在那大树梢头浓叶之下睡著了。');
  lock(true);
  const h = G.hero; h.x = 1660; G.tween(h, 'scale', 0.3, 0.5); h.floor = GROUND - 190; h.y = h.floor; h.anim = 'sit'; h.face = -1;
  smoke(1660, GROUND - 200, 6, 0.6); Sound.sfx('poof');
  G.camFix = 1660 - W / 2;
  const xn = [G.add(P('p_xiannv', 1000, { face: 1 })), G.add(P('p_xiannv', 900, { face: 1, filter: 'hue-rotate(150deg)' })), G.add(P('p_xiannv', 800, { face: 1, filter: 'hue-rotate(-60deg)' }))];
  xn.forEach((x, i) => x.goto(1480 - i * 110, 120));
  yield 4.5;
  yield* N('七仙女张望东西，只见向南枝上止有一个半红半白的桃子。青衣女用手扯下枝来，红衣女摘了，却将枝子望上一放。');
  smoke(1660, GROUND - 200, 8, 0.9); Sound.sfx('poof');
  G.tween(h, 'scale', 1, 0.4); h.floor = GROUND; h.anim = null; h.vy = -400; h.onG = false;
  yield 0.8;
  yield* L('大圣', '你是那方怪物，敢大胆偷摘我桃。');
  yield* L('仙女', '大圣息怒。我等不是妖怪，乃王母娘娘差来的七衣仙女，摘取仙桃，大开宝阁，做蟠桃胜会。');
  yield* waitAct('问：请的是谁？');
  yield* L('大圣', '仙娥请起。王母开阁设宴，请的是谁？');
  yield* L('仙女', '上会自有旧规，请的是……');
  yield* search('蟠桃嘉会', PANTAO_LIST, { per: 10, pauseAt: [19] });
  yield* L('仙女', '俱一齐赴蟠桃嘉会。');
  yield* L('大圣', '可请我么？');
  yield* L('仙女', '不曾听得说。');
  yield 1.2;
  yield* L('大圣', '我乃齐天大圣，就请我老孙做个席尊，有何不可？');
  yield* L('仙女', '此是上会旧规，今会不知如何。');
  yield* waitAct('使个定身法');
  Sound.sfx('eye');
  for (const x of xn) { x.filter = (x.filter || '') + ' grayscale(0.8) brightness(0.85)'; x.bob = 0; x.t = 0; }
  yield* N('那七衣仙女，一个个睖睖睁睁，白着眼，都站在桃树之下。');
  G.camFix = null; lock(false);
  yield* waitAct('偷吃仙殽仙酒', 2060, { r: 160 });
  G.hero.anim = 'touch'; Sound.sfx('pickup'); G.sway = 1; yield 1.2; G.hero.anim = null;
  yield 1.5;
  yield* fade(1);
  G.sway = 0;
}

function* s_wulu() {
  stage({ hx: -200, ctrl: '', noHero: true });
  heaven();
  G.add(P('p_yudi', 1020, { face: -1, s: 0.9 }));
  G.add(P('p_guanyin', 640, { face: 1 }));
  lock(true); G.camFix = 0;
  yield* fade(0);
  yield* title('第六回', '无禄人员');
  yield* L('观音', '蟠桃盛会如何？');
  yield* L('玉帝', '每年请会，喜喜欢欢；今年被妖猴作乱，甚是虚邀也。');
  yield* L('玉帝', '宣他上界，封为御马监弼马温官。那厮嫌恶官小，反了天宫。');
  yield* L('玉帝', '就封他做个齐天大圣，只是有官无禄。他因没事干管理，东游西荡。朕又恐别生事端，着他代管蟠桃园。');
  yield* L('玉帝', '他又不遵法律，将老树大桃，尽行偷吃。及至设会，他乃无禄人员，不曾请他。');
  setRank('齐天大圣　无禄人员');
  yield 1.2;
  yield* L('玉帝', '朕心为此烦恼，故调十万天兵，天罗地网收伏。');
  yield* fade(1);
}

// 第七回：先打天兵，再到如来手心里翻筋斗，写字，翻掌，压山，开宴
const PILL = { x0: 4520, gap: 150, w: 86 };
function* s_shouxin() {
  stage({ w: 5300, hx: 900 }); G.mk = '大圣'; G.hero.setBare(true);
  heaven({ hall: false });
  for (let x = 1300; x < 5200; x += 380) G.scen.push(scn('scn_cloud', x, 'mid', { s: 1.4 + (x % 3) * 0.2, y: 200 + (x % 5) * 50 }));
  const bud = G.add(P('scn_buddha', 300, { s: 0.6, bob: 0, rods: false, z: 1, alpha: 0 }));
  yield* fade(0);
  yield* title('第七回', '如来手心');
  // 十万天兵
  const bings = [1250, 1400, 1550, 700].map(x => G.foes.push(new Foe('p_bing', x, { hp: 2, minion: true, speed: 170 })) && G.foes[G.foes.length - 1]);
  bings.forEach(b => G.add(b));
  G.botGoal = { fight: true };
  yield () => bings.every(b => b.dead);
  G.botGoal = null;
  yield 1;
  G.tween(bud, 'alpha', 1, 2.0); Sound.phrase('台 令 台 令 仓', 180, 0.7);
  yield 2;
  lock(true); G.hero.face = -1;
  yield* walkHero(620);
  G.hero.face = -1;
  yield* L('如来', '我与你打个赌赛：你若有本事，一斤斗打出我这右手掌中，算你赢，再不用动刀兵，苦争战，就请玉帝到西方居住，把天宫让你；若不能打出手掌，你还下界为妖，再修几劫，却来争吵。');
  yield* M('大圣', '这如来十分好呆。我老孙一斤斗去十万八千里，他那手掌方圆不满一尺，如何跳不出去？');
  yield* L('大圣', '既如此说，你可做得主张？');
  yield* L('如来', '做得，做得。');
  yield* waitAct('将身一纵：我出去也');
  yield* L('大圣', '我出去也。');
  const h = G.hero; h.fly = true; h.speed = 900; h.face = 1; h.floor = GROUND; G.ctrlBase = CTRL_FLY;
  h.y = GROUND - 120; smoke(h.x, h.y, 6); lock(false); h.frozen = false;
  G.pillarText = 0;
  G.hooks.back = g => drawPillars(g);
  G.botGoal = { x: PILL.x0 + PILL.gap * 2 - 40 };
  yield () => h.x > PILL.x0 - 500;
  G.botGoal = null; h.speed = 300;
  yield* N('大圣行时，忽见有五根肉红柱子，撑著一股青气。');
  yield* M('大圣', '此间乃尽头路了。这番回去，如来作证，灵霄宫定是我坐也。');
  yield* M('大圣', '且住，等我留下些记号，方好与如来说话。');
  yield* waitAct('拔下毫毛，柱上写字', PILL.x0 + PILL.gap * 2, { r: 140 });
  h.frozen = true; h.anim = 'touch'; Sound.sfx('poof');
  G.tween(G, 'pillarText', 1, 3.2); yield 3.4;
  h.frozen = false; h.anim = null;
  yield* N('写毕，收了毫毛。翻转斤斗云，径回本处。');
  h.speed = 900;
  G.botGoal = { x: 600 };
  yield () => h.x < 820;
  G.botGoal = null; h.speed = 300;
  lock(true); h.fly = false; h.face = -1;
  yield 0.6;
  yield* L('大圣', '我已去，今来了。你教玉帝让天宫与我。');
  yield* L('如来', '我把你这个尿精猴子，你正好不曾离了我掌哩。');
  yield* L('大圣', '你是不知。我去到天尽头，见五根肉红柱，撑著一股青气，我留个记在那里，你敢和我同去看么？');
  yield* L('如来', '不消去，你只自低头看看。');
  h.frozen = true;
  yield* waitAct('低头看看');
  h.anim = 'look';
  // 手：五根柱子原来是五根手指
  G.palm = { k: 0, rot: 0, drop: 0 };
  G.hooks.top = g => drawPalm(g);
  G.tween(G.palm, 'k', 1, 1.6); Sound.phrase('仓 - - 仓', 160, 0.9);
  yield 2.2;
  yield* N('原来佛祖右手中指写着『齐天大圣，到此一游』。');
  yield* L('大圣', '有这等事？有这等事？我将此字写在撑天柱子上，如何却在他手指上？');
  yield* L('大圣', '莫非有个未卜先知的法术？我决不信，不信。等我再去来。');
  h.anim = null; h.frozen = false;
  yield* waitAct('急纵身，又要跳出');
  G.tween(G.palm, 'rot', Math.PI, 0.5); G.tween(G.palm, 'drop', 1, 0.5); Sound.sfx('smash');
  yield 0.5;
  G.flash = 1; G.shake(30); Sound.sfx('stomp');
  yield* fade(1, 0.3);
  G.hooks.top = null;
}

function drawPillars(g) {
  for (let i = 0; i < 5; i++) {
    const wx = PILL.x0 + i * PILL.gap, x = SX(wx);
    if (x < -200 || x > W + 200) continue;
    const top = SCR.t + 60 + Math.abs(i - 2) * 46 + (i === 0 ? 120 : 0), bot = GROUND + 8, w = PILL.w * (i === 0 ? 1.15 : 1);
    g.save(); g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgba(214,120,96,0.88)'; g.strokeStyle = 'rgba(90,30,16,0.9)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x - w / 2, bot); g.lineTo(x - w / 2, top + w / 2); g.arc(x, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, bot); g.closePath(); g.fill(); g.stroke();
    // 指节上的两道褶子，平时只当是柱子上的纹
    g.strokeStyle = 'rgba(90,30,16,0.45)'; g.lineWidth = 2;
    for (const k of [0.32, 0.62]) { const y = lerp(top, bot, k); g.beginPath(); g.moveTo(x - w * 0.35, y); g.quadraticCurveTo(x, y + 8, x + w * 0.35, y); g.stroke(); }
    g.restore();
    if (i === 2 && G.pillarText > 0) drawVText(g, '齐天大圣到此一游', x, top + 70, 40, '#1a0a04', G.pillarText);
  }
  if (G.pillarText > 0 && G.pillarText < 1) {
    const x = SX(PILL.x0 + PILL.gap * 2), y = SCR.t + 130 + G.pillarText * 8 * 42;
    drawBrush(g, x + 8, y, false);
  }
  // 一股青气
  g.save(); g.globalCompositeOperation = 'multiply';
  const x = SX(PILL.x0 + PILL.gap * 2);
  const gr = g.createLinearGradient(0, SCR.t, 0, SCR.t + 160);
  gr.addColorStop(0, 'rgba(60,110,110,0.45)'); gr.addColorStop(1, 'rgba(60,110,110,0)');
  g.fillStyle = gr; g.fillRect(x - 380, SCR.t, 760, 160); g.restore();
}
function drawPalm(g) {
  const P_ = G.palm, im = IMG.hand_open; if (!im) return;
  const k = smooth(P_.k), s = 0.46;
  g.save();
  g.fillStyle = `rgba(10,4,2,${0.35 * k})`; g.fillRect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t);
  g.beginPath(); g.rect(SCR.l, SCR.t, SCR.r - SCR.l, SCR.b - SCR.t); g.clip();
  const by = lerp(H + 760, H + 60, k) + P_.drop * 300;
  g.translate(W / 2, by); g.rotate(P_.rot); g.scale(s, s);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.92 * k; g.filter = 'blur(1.5px)';
  g.drawImage(im, -PALM.mid, -im.height);
  g.filter = 'none'; g.globalAlpha = k; g.globalCompositeOperation = 'source-over';
  g.font = `${76}px ${FONT_BRUSH}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c8402a';
  [...'齐天大圣到此一游'].forEach((c, i) => g.fillText(c, 0, -im.height + 140 + i * 72));
  g.restore();
}

// 五行山：五根手指翻过来变的五座山，跟柱子一个样子，只是压在猴子身上；只露个头
const WX = { k: 1, spread: 0 };
const WX_PEAKS = [[-300, 250, 150], [-150, 360, 150], [0, 420, 160], [150, 360, 150], [295, 230, 160]];
function wxPath(g, cx, top, w, bot) {
  g.beginPath(); g.moveTo(cx - w / 2 - 30, bot);
  g.quadraticCurveTo(cx - w / 2, top + w * 0.7, cx - w * 0.2, top + 14);
  g.quadraticCurveTo(cx, top - 8, cx + w * 0.22, top + 18);
  g.quadraticCurveTo(cx + w / 2, top + w * 0.6, cx + w / 2 + 30, bot); g.closePath();
}
function drawWuxingBack(g, x0) {
  if (WX.k <= 0) return;
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = WX.k;
  WX_PEAKS.forEach(([dx, hgt, w], i) => {
    const cx = SX(x0 + dx * (1 + WX.spread)), top = GROUND - hgt, bot = GROUND + 8;
    g.fillStyle = ['#8a5a32', '#7a4a2a', '#6a3a1e', '#7a4a2a', '#8a5a32'][i]; g.strokeStyle = 'rgba(40,16,6,0.9)'; g.lineWidth = 4;
    wxPath(g, cx, top, w, bot); g.fill(); g.stroke();
    // 皴：一道一道竖着的刻纹
    g.strokeStyle = 'rgba(40,16,6,0.4)'; g.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * w * 0.16, top + 40 + Math.abs(k) * 22); g.quadraticCurveTo(cx + k * w * 0.2 + 8, (top + bot) / 2, cx + k * w * 0.24, bot - 10); g.stroke(); }
    for (const kk of [0.35, 0.62]) { const y = lerp(top, bot, kk); g.beginPath(); g.moveTo(cx - w * 0.3, y); g.quadraticCurveTo(cx, y + 8, cx + w * 0.3, y); g.stroke(); }
  });
  g.restore();
}
function drawWuxingFront(g, x0) {
  if (WX.k <= 0) return;
  g.save(); g.globalAlpha = WX.k * 0.96;
  const cx = SX(x0), sp = 1 + WX.spread * 2.5;
  g.fillStyle = '#5a2e16'; g.strokeStyle = 'rgba(40,16,6,0.9)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx - 440 * sp, GROUND + 10);
  g.quadraticCurveTo(cx - 220 * sp, GROUND - 215, cx - 40, GROUND - 182);
  g.lineTo(cx - 30, GROUND - 172); g.quadraticCurveTo(cx, GROUND - 164, cx + 30, GROUND - 172); g.lineTo(cx + 40, GROUND - 182);
  g.quadraticCurveTo(cx + 220 * sp, GROUND - 215, cx + 440 * sp, GROUND + 10); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,16,6,0.4)'; g.lineWidth = 2;
  for (let k = -3; k <= 3; k++) { if (!k) continue; g.beginPath(); g.moveTo(cx + k * 70 * sp, GROUND - 160 + Math.abs(k) * 18); g.lineTo(cx + k * 80 * sp, GROUND); g.stroke(); }
  g.restore();
  // 压帖
  if (WX.tie) {
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#e8d090'; g.strokeStyle = '#7a2a12'; g.lineWidth = 2;
    const tx = SX(x0), ty = GROUND - 400; g.fillRect(tx - 14, ty, 28, 84); g.strokeRect(tx - 14, ty, 28, 84);
    g.fillStyle = '#d8a020'; for (let i = 0; i < 6; i++) g.fillRect(tx - 6, ty + 6 + i * 13, 12, 9);
    g.restore();
  }
}

function* s_wuxing() {
  stage({ hx: 640, ctrl: '' }); G.mk = '大圣'; G.hero.setBare(true);
  hills();
  WX.k = 1; WX.spread = 0; WX.tie = false;
  G.hooks.back = g => drawWuxingBack(g, 640);
  G.hooks.front = g => drawWuxingFront(g, 640);
  const h = G.hero; h.sink = 0; h.prop = false; h.frozen = true; h.anim = 'look';
  setRank('五行山下');
  // 天上：安天大会
  const sky = [
    G.add(P('scn_yan', 640, { s: 0.55, y: 250, bob: 0, rods: false, cloud: 1.3 })),
    G.add(P('scn_buddha', 330, { s: 0.22, y: 260, bob: 0, rods: false })),
    G.add(P('p_yudi', 950, { s: 0.4, y: 262, face: -1, cloud: 1.0 })),
    G.add(P('p_laojun', 470, { s: 0.4, y: 262, face: 1, cloud: 0.9 })),
    G.add(P('p_taibai', 820, { s: 0.4, y: 262, face: -1, cloud: 0.9 })),
    G.add(P('p_xiannv', 1090, { s: 0.38, y: 262, face: -1, cloud: 0.9 })),
  ];
  sky.forEach(s => { s.alpha = 0; s.z = 0; });
  lock(true);
  yield* fade(0, 0.6);
  yield* N('将五指化作金、木、水、火、土五座联山，唤名『五行山』，轻轻的把他压住。');
  for (const s of sky) G.tween(s, 'alpha', 0.9, 1.5);
  Sound.phrase('仓 才 仓 才 八大 仓', 240, 0.8);
  yield 1.6;
  yield* L('众仙', '感如来无量法力，收伏妖猴。蒙大天尊设宴，呼唤我等皆来陈谢。请如来将此会立一名如何？');
  yield* L('如来', '今欲立名，可作个安天大会。');
  G.hooks.tick = dt => { for (const s of sky) s.bob = 6; };
  Sound.phrase('仓 才 仓 才 仓 才 八大 仓 - 令才 令才 仓', 280, 0.9);
  yield* L('众仙', '好个『安天大会』！好个『安天大会』！');
  yield* N('言讫，各坐座位，走斝传觞，簪花鼓瑟，果好会也。');
  // 山底下能按的键，按了也只是摇一摇头
  lock(false); G.ctrlBase = '';
  G.hooks.tick = dt => { if (Input.hit('attack') || Input.hit('jump') || Input.hit('act') || Input.hit('left') || Input.hit('right')) { h.tremble = 1; G.shake(3); Sound.sfx('land'); } h.tremble = Math.max(0, h.tremble - dt * 2); };
  yield 2.5;
  for (const s of sky) G.tween(s, 'alpha', 0, 2);
  yield 2;
  const td = G.add(P('p_tudi', 1250, { face: -1 }));
  td.goto(800, 90);
  yield 4.5;
  yield* N('但他饥时，与他铁丸子吃；渴时，与他溶化的铜汁饮。');
  for (let i = 0; i < 6; i++) G.after(i * 0.7, () => { Parts.push({ kind: 'paper', x: td.x - 30, y: GROUND - 120, vx: -260, vy: -260, r: 0, vr: 0, t: 0, life: 0.6, s: 9, col: '#1b1b1b' }); Sound.sfx('land'); });
  yield 4.5;
  td.goto(1400, 90);
  for (let c = 0; c < 3; c++) { fallParts('leaf', 40); yield 2.4; fallParts('snow', 70); yield 2.4; }
  yield* fade(1, 1.2);
  h.prop = true;
}

// ===================== 第二折　自己戴上 =====================
function* s_maozi() {
  stage({ w: 1800, hx: 640, ctrl: '' }); G.mk = '大圣'; G.hero.setBare(true);
  hills();
  WX.k = 1; WX.spread = 0; WX.tie = true;
  G.hooks.back = g => drawWuxingBack(g, 640);
  G.hooks.front = g => drawWuxingFront(g, 640);
  const h = G.hero; h.sink = 0; h.frozen = true; h.anim = 'look';
  const tang = G.tang = G.add(new Pup('tangseng', ANIMS.robe, -100, { face: 1 }));
  lock(true); G.camFix = 0;
  yield* fade(0, 1);
  yield* title('第十四回', '心猿归正');
  tang.goto(150, 90);
  yield () => tang.gotoX === null;
  yield* N('三藏近前跪下，朝石头看着金字，拜了几拜……上前将六个金字轻轻揭下。');
  WX.tie = false; Sound.sfx('snuff');
  yield* L('唐僧', '揭了压帖矣，你出来罢。');
  yield* L('猴王', '师父，你请走开些，我好出来，莫惊了你。');
  tang.goto(40, 120);
  yield 2.2;
  G.shake(20); Sound.sfx('stomp'); G.flash = 0.8;
  G.tween(WX, 'k', 0, 1.2); G.tween(WX, 'spread', 0.8, 1.2);
  yield 0.8;
  h.sink = 0; h.anim = null; h.vy = -900; h.onG = false; h.frozen = false; Sound.sfx('jump');
  yield 1.4;
  G.mk = '行者'; setRank('行者'); tag('紫金钵盂');
  G.camFix = null;
  yield 0.6;
  const bundle = { x: 520, open: false };
  G.hooks.back = g => {
    drawBundle(g, bundle.x, GROUND + 4, bundle.open);
    if (bundle.open && !G.hatOn) { drawHatAt(g, bundle.x + 30, GROUND - 60 - Math.sin(G.t * 2) * 4, 0.5, 1); }
  };
  tang.goto(300); tang.face = 1;
  yield 1;
  yield* L('唐僧', '不用化斋，我那包袱里还有些干粮，是刘太保母亲送的。你去拿钵盂寻些水来，等我吃些儿走路罢。');
  yield* waitAct('解开包袱', bundle.x);
  bundle.open = true; Sound.sfx('pickup');
  yield* N('行者去解开包袱，在那包裹中间见有几个粗面烧饼，拿出来递与师父。又见那光艳艳的一领绵布直裰、一顶嵌金花帽。');
  yield* L('行者', '这衣帽是东土带来的？');
  yield* L('唐僧', '是我小时穿戴的。这帽子若戴了，不用教经，就会念经；这衣服若穿了，不用演礼，就会行礼。');
  yield* waitAct('好师父，把与我穿戴了罢', bundle.x);
  yield* L('行者', '好师父，把与我穿戴了罢。');
  yield* L('唐僧', '只怕长短不一，你若穿得，就穿了罢。');
  yield* waitAct('把帽儿戴上', bundle.x);
  G.hatOn = true; G.tween(h, 'hat', 1, 0.5); Sound.sfx('pickup');
  yield 1.6;
  lock(true);
  yield* N('三藏见他戴上帽子，就不吃干粮，却默默的念那紧箍咒一遍。');
  yield* chant(1);
  yield* L('行者', '头痛，头痛。');
  yield* chant(2);
  G.tween(h, 'hat', 0, 0.3); h.setBare(false); burst(h.x, h.y - 230, 14, 'paper', { col: '#c0392b' }); G.hatOn = false; bundle.open = false;
  yield* N('那师父不住的又念了几遍，把个行者痛得打滚，抓破了嵌金的花帽。');
  h.frozen = true; lock(false);
  yield* waitAct('伸手去头上摸摸');
  h.anim = 'touch';
  yield* N('伸手去头上摸摸，似一条金线儿模样，紧紧的勒在上面，取不下，揪不断，已此生了根了。');
  yield 1; h.anim = null; h.frozen = false;
  lock(true);
  yield* L('行者', '我这头，原来是师父咒我的？');
  yield* L('唐僧', '我念得是紧箍经，何曾咒你？');
  yield* L('行者', '你再念念看。');
  yield* chant(1);
  yield* L('行者', '莫念，莫念。念动我就痛了。这是怎么说？');
  yield* L('唐僧', '你今番可听我教诲了？');
  yield* L('行者', '听教了。');
  yield* L('唐僧', '你再可无礼了？');
  yield* L('行者', '不敢了。');
  // 这时候按 J 打师父，原书里他真打了，也真被念倒了
  lock(false);
  tang.goto(1900, 60);
  G.botGoal = { x: () => tang.x - 140, key: 'attack', delay: 1.5 };
  let tried = false;
  while (h.x <= 1700) {
    if (!tried && Input.hit('attack') && Math.abs(h.x - tang.x) < 260) {
      tried = true; lock(true); G.botGoal = null; tang.gotoX = null; tang.face = h.x < tang.x ? -1 : 1;
      yield* N('他口里虽然答应，心上还怀不善，把那针儿幌一幌，碗来粗细，望唐僧就欲下手。');
      yield* chant(2, true);
      yield* L('行者', '师父，我晓得了。再莫念，再莫念。');
      yield* L('唐僧', '你怎么欺心，就敢打我？');
      yield* L('行者', '我不曾敢打。');
      lock(false); tang.goto(1900, 60); G.botGoal = { x: 1780 };
    }
    yield;
  }
  G.botGoal = null;
  yield* fade(1);
}
