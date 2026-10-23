// 第四折：都领回去了（第三十五、三十九、五十二、七十七回）
// 第五折：品级（第九十八至一百回），和结尾

// 打到最后一下，棒子举在半空，天上下来一位，把它领走
function* fightTill(foes, o = {}) {
  for (const f of foes) { G.add(f); G.foes.push(f); }
  lock(false); G.hero.frozen = false;
  G.botGoal = { fight: true };
  yield () => foes.every(f => f.held || f.dead);
  G.botGoal = null; lock(true);
  const h = G.hero; h.frozen = true; h.anim = 'pose'; h.face = 1;
  h.x = Math.min(h.x, G.worldW - 900); G.camFix = clamp(h.x - 300, 0, G.worldW - W);
  foes.forEach((f, i) => { if (!f.dead && (f.x < h.x + 200 || f.x > h.x + 800)) f.x = h.x + 520 + i * 140; });
  Sound.sfx('clang'); G.shake(5);
  yield 0.6;
}
function patron(img, x, o = {}) { return G.add(P(img, x, { y: SCR.t - 40, cloud: o.cloud ?? 1.1, face: o.face ?? -1, z: 4, bob: 3, ...o })); }
function* leave(p, extra = []) { G.tween(p, 'y', SCR.t - 120, 2.6); for (const e of extra) G.tween(e, 'alpha', 0, 2.6); Sound.phrase('台 令 台 令', 200, 0.6); yield 2.8; }

function* s_lianhua() {
  stage({ w: 1800, hx: 300 }); G.mk = '行者'; setRank('行者');
  hills();
  G.scen.push(scn('scn_cave', 1500, 'main', { s: 1.3 }), scn('scn_lotus', 1200, 'mid', { s: 1.2 }));
  yield* fade(0, 1);
  yield* zhe('第四折', '都领回去了');
  yield* title('第三十五回', '莲花洞');
  const jin = new Foe('p_jinjiao', 1100, { hp: 3, lowAt: 1 }), yin = new Foe('p_yinjiao', 1350, { hp: 3, lowAt: 1, speed: 120 });
  yield* fightTill([jin, yin]);
  const lj = patron('p_laojun', G.hero.x + 330);
  yield* descend(lj, GROUND - 150, 2.2);
  yield* L('老君', '孙行者，还我宝贝。');
  yield* L('行者', '什么宝贝？');
  yield* L('老君', '葫芦是我盛丹的，净瓶是我盛水的，宝剑是我炼魔的，扇子是我搧火的，绳子是我一根勒袍的带。');
  yield* L('老君', '那两个怪：一个是我看金炉的童子，一个是我看银炉的童子。只因他偷了我的宝贝，走下界来，正无觅处，却是你今拿住，得了功绩。');
  yield* L('行者', '你这老官儿，着实无礼。纵放家属为邪，该问个钤束不严的罪名。');
  yield* L('老君', '不干我事，不可错怪了人。此乃海上菩萨问我借了三次，送他在此，托化妖魔，试你师徒可有真心往西去也。');
  yield* M('行者', '这菩萨也老大惫懒。当时解逃老孙，教保唐僧西去取经，我说路途艰涩难行，他曾许我到急难处，亲来相救；如今反使精邪掯害。');
  yield* waitAct('若不是老官儿亲来，我决不与他');
  G.hero.anim = null;
  yield* L('行者', '若不是老官儿亲来，我决不与他。既是你这等说，拿去罢。');
  yield* N('那老君收得五件宝贝，揭开葫芦与净瓶盖口，倒出两股仙气。用手一指，仍化为金、银二童子，相随左右。');
  transform(jin, 'b_tong1'); transform(yin, 'b_tong2');
  yield 0.8;
  jin.goto(lj.x - 90, 200); yin.goto(lj.x + 90, 200);
  yield 1.2;
  follow(jin, lj, -90, 0); follow(yin, lj, 90, 0);
  jin.cloud = yin.cloud = 0.8;
  yield* leave(lj);
  G.hero.frozen = false;
  yield 0.8;
  yield* fade(1);
}

function* s_wuji() {
  stage({ w: 1800, hx: 300 }); G.mk = '行者';
  hills();
  G.scen.push(scn('scn_pavilion', 1450, 'main', { s: 1.2 }), scn('scn_gate', 300, 'mid', { s: 1.1 }));
  yield* fade(0, 0.8);
  yield* title('第三十九回', '乌鸡国');
  const qs = new Foe('p_qingshi', 1200, { hp: 4, lowAt: 1 });
  yield* fightTill([qs]);
  const ws = patron('p_wenshu', G.hero.x + 330);
  yield* L('文殊', '孙悟空，且休下手。');
  yield* descend(ws, GROUND - 160, 2);
  yield* L('行者', '菩萨，那里去？');
  yield* L('文殊', '我来替你收这个妖怪的。');
  yield* N('那菩萨袖中取出照妖镜，照住了那怪的原身。');
  G.flash = 0.6; transform(qs, 'b_lion');
  yield 1;
  yield* L('行者', '菩萨，这是你坐下的一个青毛狮子，却怎么走将来成精，你就不收服他？');
  yield* L('文殊', '悟空，他不曾走，他是佛旨差来的。');
  yield* L('行者', '这畜类成精，侵夺帝位，还奉佛旨差来。似老孙保唐僧受苦，就该领几道敕书。');
  yield* L('文殊', '当初这乌鸡国王好善斋僧，佛差我来度他归西。被吾几句言语相难，他不识我是个好人，把我一条绳捆了，送在那御水河中，浸了我三日三夜。');
  yield* L('文殊', '如来将此怪令到此处推他下井，浸他三年，以报吾三日水灾之恨。『一饮一啄，莫非前定。』今得汝等来此，成了功绩。');
  yield* L('行者', '你虽报了什么『一饮一啄』的私仇，但那怪物不知害了多少人也。');
  yield* L('文殊', '也不曾害人。自他到后，这三年间，风调雨顺，国泰民安，何害人之有？');
  yield* waitAct('既如此，收了去罢');
  G.hero.anim = null;
  yield* L('行者', '既如此，收了去罢。若不是菩萨亲来，决不饶他性命。');
  yield* N('菩萨放莲花罩定妖魔，坐在背上，踏祥光辞了行者。');
  qs.goto(ws.x, 200); yield 1.2;
  follow(qs, ws, 0, 40); qs.z = 3; qs.cloud = 1.0; ws.cloud = 0;
  yield* leave(ws);
  G.hero.frozen = false;
  yield 0.6;
  yield* fade(1);
}

function* s_jindou() {
  stage({ w: 2000, hx: 300 }); G.mk = '行者';
  hills({ tree: 'scn_deadtree' });
  G.scen.push(scn('scn_cave', 1700, 'main', { s: 1.4 }), scn('scn_cliff', 1880, 'main', { s: 1.0 }));
  G.tint = 'rgba(225,215,235,1)';
  yield* fade(0, 0.8);
  yield* title('第五十二回', '金兜洞');
  fallParts('snow', 60);
  const qn = new Foe('p_qingniu', 1200, { hp: 4, lowAt: 1, speed: 130 });
  yield* fightTill([qn]);
  const lj = patron('p_laojun', G.hero.x + 330);
  yield* L('老君', '那牛儿还不归家，更待何日？');
  yield* descend(lj, GROUND - 170, 2);
  G.flash = 0.4; transform(qn, 'b_ox');
  yield* N('老君将金钢琢吹口仙气，穿了那怪的鼻子，解下勒袍带，系于琢上，牵在手中。');
  qn.goto(lj.x, 160); yield 1.4;
  yield* N('老君辞了众神，跨上青牛背上，驾彩云，径归兜率院。');
  follow(qn, lj, 0, 40); qn.cloud = 1.0; lj.cloud = 0;
  yield* leave(lj);
  G.hero.anim = null; G.hero.frozen = false; G.camFix = null;
  yield* N('孙大圣才同天王等众打入洞里，把那百十个小妖尽皆打死。');
  const small = [];
  for (let i = 0; i < 7; i++) { const s = new Foe('p_xiaoyao', 1500 + (i % 3) * 120 + i * 30, { hp: 1, minion: true, speed: 140 + i * 10, filter: i % 2 ? 'hue-rotate(40deg)' : '' }); small.push(s); G.after(i * 0.7, () => { G.add(s); G.foes.push(s); }); }
  lock(false);
  G.botGoal = { fight: true };
  yield () => small.every(s => s.dead) && G.timers.length === 0;
  G.botGoal = null;
  yield 1.6;
  yield* fade(1);
}

function* s_shituo() {
  stage({ w: 1800, hx: 300 }); G.mk = '行者';
  ridge();
  G.scen.push(scn('scn_gate', 1600, 'main', { s: 1.2 }), scn('scn_flag', 1400, 'mid', { s: 1.0 }));
  G.tint = 'rgba(230,200,180,1)';
  const zf = G.add(P('p_xiaoyao', 800, { face: -1 }));
  yield* fade(0, 0.8);
  yield* title('第七十四回', '狮驼岭');
  yield* waitAct('变作小妖，著实盘问', () => zf.x, { r: 220 });
  yield* L('小钻风', '三大王不在这里住，他原住处离此西下有四百里远近。那厢有座城，唤做狮驼国。');
  yield* L('小钻风', '他五百年前吃了这城国王及文武官僚，满城大小男女也尽被他吃了干净，因此上夺了他的江山。如今尽是些妖怪。');
  zf.goto(2000, 200);
  const dp = new Foe('p_dapeng', 1300, { hp: 99, lowAt: 0, speed: 220 });
  G.add(dp); G.foes.push(dp);
  lock(false);
  G.botGoal = { fight: true };
  let n = 0;
  const hurt0 = dp.hurt.bind(dp);
  dp.hurt = from => { n++; hurt0(from); };
  yield () => n >= 4;
  G.botGoal = null; lock(true);
  dp.ai = false; hurtHero(dp); G.hero.kb *= 1.6;
  yield 0.4;
  G.tween(dp, 'y', SCR.t - 100, 1.0); smoke(dp.x, dp.y - 100, 10); Sound.sfx('poof');
  yield 1.4;
  yield* fade(1);

  // 灵山
  stage({ hx: 380, ctrl: '' }); G.mk = '行者';
  G.scen.push(scn('scn_cloud', 300, 'sky', { s: 2.4, y: 300 }), scn('scn_cloud', 1000, 'sky', { s: 2.4, y: 260 }));
  for (let x = 100; x < W; x += 180) G.scen.push(scn('scn_lotus', x, 'front', { s: 0.9, a: 0.7 }));
  const rl = G.add(P('scn_buddha', 900, { s: 0.62, bob: 0, rods: false, z: 1 }));
  G.add(P('p_anan', 640, { face: -1, s: 0.7 })); G.add(P('p_jiaye', 1160, { face: -1, s: 0.7 }));
  lock(true); G.camFix = 0;
  G.hero.anim = 'kneel'; G.hero.prop = false; G.hero.frozen = true;
  yield* fade(0, 0.8);
  yield* title('第七十七回', '灵山');
  yield* L('如来', '你且休恨，那妖精我认得他。');
  yield* L('行者', '如来，我听见人讲说，那妖精与你有亲哩。');
  yield* L('如来', '这个刁猢狲，怎么个妖精与我有亲？');
  yield* L('行者', '不与你有亲，如何认得？');
  yield* L('如来', '孔雀出世之时最恶，能吃人。我在雪山顶上，修成丈六金身，早被他也把我吸下肚去。是我剖开他脊背，跨上灵山。');
  yield* L('如来', '欲伤他命，当被诸佛劝解：伤孔雀如伤我母。故此留他在灵山会上，封他做佛母孔雀大明王菩萨。大鹏是与他一母所生，故此有些亲处。');
  yield* waitAct('笑道：你还是妖精的外甥哩');
  yield* L('行者', '如来，若这般比论，你还是妖精的外甥哩。');
  yield* L('如来', '那怪须是我去，方可收得。');
  yield* fade(1, 0.8);

  // 狮驼城上空
  stage({ hx: 360 }); G.mk = '行者';
  ridge();
  G.scen.push(scn('scn_gate', 1000, 'mid', { s: 1.3 }));
  const fo = G.add(P('scn_buddha', 760, { s: 0.42, y: SCR.t - 20, bob: 0, rods: false, cloud: 2.4 }));
  const dp2 = G.add(P('p_dapeng', 900, { face: -1, y: GROUND - 160 }));
  lock(true); G.camFix = 0;
  yield* fade(0, 0.8);
  yield* descend(fo, GROUND - 140, 2.2);
  G.tween(dp2, 'y', GROUND - 420, 0.6); dp2.x = 760; yield 0.8;
  G.flash = 0.5;
  yield* N('被佛爷把手往上一指，那妖翅膊上就了筋，飞不去，只在佛顶上不能远遁，现了本相，乃是一个大鹏金翅雕。');
  yield* L('大鹏', '如来，你怎么使大法力困住我也？');
  yield* L('如来', '你在此处多生孽障，跟我去，有进益之功。');
  yield* L('大鹏', '你那里持斋把素，极贫极苦；我这里吃人肉，受用无穷。你若饿坏了我，你有罪愆。');
  yield* L('如来', '我管四大部洲，无数众生瞻仰，凡做好事，我教他先祭汝口。');
  yield* N('那大鹏欲脱难脱，要走怎走，是以没奈何，只得皈依。');
  follow(dp2, fo, 0, -280);
  yield* N('佛祖不敢松放了大鹏，也只教他在光焰上做个护法，引众回云，径归宝刹。');
  yield* leave(fo);
  yield 0.6;
  yield* fade(1);
}

// ===================== 第五折　品级 =====================
const SUTRAS = ['涅槃经', '菩萨经', '虚空藏经', '首楞严经', '恩意经大集', '决定经', '宝藏经', '华严经', '礼真如经', '大般若经', '宝威经', '本阁经', '正律文经', '大孔雀经', '维识论经', '具舍论经'];
function* s_baoge() {
  stage({ hx: 300, ctrl: '' }); G.mk = '行者'; setRank('行者');
  G.tint = 'rgba(255,236,190,1)';
  G.scen.push(scn('scn_dian', 640, 'far', { s: 0.95 }), scn('scn_jing', 1080, 'mid', { s: 0.9 }));
  for (let x = 100; x < W; x += 180) G.scen.push(scn('scn_lotus', x, 'front', { s: 0.9, a: 0.6 }));
  const an = G.add(P('p_anan', 760, { face: -1 })), jy = G.add(P('p_jiaye', 900, { face: -1 }));
  const tang = G.tang = G.add(new Pup('tangseng', ANIMS.robe, 520, { face: 1 }));
  const ba = G.add(new Pup('bajie', ANIMS.robe, 160, { face: 1, s: 0.45 }));
  lock(true); G.camFix = 0; G.hero.frozen = true;
  yield* fade(0, 1);
  yield* zhe('第五折', '品级');
  yield* title('第九十八回', '珍楼宝阁');
  yield* L('二尊者', '圣僧东土到此，有些什么人事送我们？快拿出来，好传经与你去。');
  yield* L('唐僧', '弟子玄奘，来路迢遥，不曾备得。');
  yield* L('二尊者', '好好好，白手传经继世，后人当饿死矣。');
  yield* L('行者', '师父，我们去告如来，教他自家来把经与老孙也。');
  yield* L('阿傩', '莫嚷，此是什么去处，你还撒野放刁？到这边来接着经。');
  yield* waitAct('转身接经', 760, { r: 600 });
  Sound.sfx('pickup');
  yield* peek('经', Array.from({ length: 12 }, () => '　'), 3.5);
  yield* N('打开看时，原来雪白，并无半点字迹。');
  yield* L('唐僧', '我东土人果是没福，似这般无字的空本，取去何用？怎么敢见唐王？诳君之罪，诚不容诛也。');
  yield* L('行者', '师父，不消说了，这就是阿傩、伽叶那厮问我要人事，没有，故将此白纸本子与我们来了。快回去告在如来之前，问他掯财作弊之罪。');
  yield* fade(1, 0.6);
  // 大雄殿
  G.actors = G.actors.filter(a => a === G.hero || a === tang || a === ba);
  G.scen = G.scen.filter(s => s.layer === 'front');
  G.scen.push(scn('scn_cloud', 300, 'sky', { s: 2.4, y: 300 }));
  const rl = G.add(P('scn_buddha', 980, { s: 0.62, bob: 0, rods: false, z: 1 }));
  yield* fade(0, 0.6);
  yield* waitAct('拜告如来');
  yield* L('行者', '如来，我师徒们受了万蜇千魔，千辛万苦，自东土拜到此处，蒙如来分付传经，被阿傩、伽叶掯财不遂，通同作弊，故意将无字的白纸本儿教我们拿去。我们拿他去何用？望如来敕治。');
  yield* L('如来', '你且休嚷。他两个问你要人事之情，我已知矣。但只是经不可轻传，亦不可以空取。');
  yield* L('如来', '向时众比丘圣僧下山，曾将此经在舍卫国赵长者家与他诵了一遍，保他家生者安全，亡者超脱，只讨得他三斗三升米粒黄金回来。');
  yield* L('如来', '我还说他们忒卖贱了，教后代儿孙没钱使用。你如今空手来取，是以传了白本。白本者，乃无字真经，倒也是好的。因你那东土众生愚迷不悟，只可以此传之耳。');
  yield* fade(1, 0.6);
  // 回宝阁
  G.remove(rl);
  G.scen.push(scn('scn_dian', 640, 'far', { s: 0.95 }), scn('scn_jing', 900, 'main', { s: 1.0 }));
  G.add(an); G.add(jy);
  yield* fade(0, 0.6);
  yield* N('二尊者复领四众，到珍楼宝阁之下，仍问唐僧要些人事。');
  yield* waitAct('取出紫金钵盂', 760, { r: 600 });
  tag('紫金钵盂', false);
  const bowl = { x: G.hero.x + 40, on: true };
  G.hooks.front = g => { if (bowl.on) drawBowl(g, SX(bowl.x), GROUND - 150, 1.2); };
  G.tween(bowl, 'x', an.x - 50, 1.2);
  yield* N('三藏无物奉承，取出紫金钵盂，双手奉上道：');
  yield* L('唐僧', '弟子委是穷寒路遥，不曾备得人事。这钵盂乃唐王亲手所赐，教弟子持此沿路化斋。今特奉上，聊表寸心。');
  yield* N('那阿傩接了，但微微而笑。');
  yield* L('众', '不羞，不羞，需索取经的人事。');
  yield* N('须臾，把脸皮都羞皱了，只是拿着钵盂不放。');
  yield* L('唐僧', '徒弟们，你们都好生看看，莫似前番。');
  yield* peek('经', SUTRAS.slice(0, 12), 3.5);
  yield* N('他三人接一卷，看一卷，却都是有字的。传了五千零四十八卷，乃一藏之数。');
  yield 0.6;
  yield* fade(1);
}

function* s_tongtian() {
  stage({ w: 2400, hx: 360, ctrl: '' }); G.mk = '行者';
  G.tint = 'rgba(240,225,200,1)';
  G.scen.push(scn('scn_mountains', 500, 'sky', { s: 1.8 }), scn('scn_mountains', 1600, 'sky', { s: 1.6, flip: -1 }));
  for (let x = 0; x < 600; x += 180) G.scen.push(scn('scn_grass', x, 'front', { s: 0.9, a: 0.6 }));
  G.hooks.mid = g => drawWater(g, false);
  const tang = G.tang = G.add(new Pup('tangseng', ANIMS.robe, 260, { face: 1 }));
  const ba = G.add(new Pup('bajie', ANIMS.robe, 160, { face: 1, s: 0.45 }));
  G.hero.frozen = true; lock(true); G.camFix = 0;
  yield* fade(0, 1);
  yield* title('第九十九回', '九九数完魔灭尽');
  yield* L('观音', '佛门中九九归真。圣僧受过八十难，还少一难，不得完成此数。');
  yield* L('观音', '赶上金刚，还生一难者。');
  yield* N('八金刚闻得此言，刷的把风按下，将他四众连马与经坠落下地。');
  G.shake(10); Sound.sfx('stomp');
  yield* L('八戒', '只说凡人会作弊，原来这佛面前的金刚也会作弊。他奉佛旨，教送我们东回，怎么到此半路上就丢下我们？如今岂不进退两难？怎生过去？');
  yield* waitAct('频频的暗笑');
  yield* M('行者', '驾不去，驾不去。');
  yield* N('只因心里明白，知道唐僧九九之数未完，还该有一难，故羁留于此。');
  // 老鼋
  const yb = G.add(new Spr('yuan_body', 760, { s: 0.75, y: WATER_Y + 40, artFace: 1, face: 1, bob: 3, rods: false, z: 2 }));
  const yh = G.add(new Spr('yuan_head', 960, { s: 0.75, y: WATER_Y + 4, artFace: 1, face: 1, bob: 2, rods: false, z: 2 }));
  yh.follow = { t: yb, dx: 190, dy: -36 };
  yield* L('老鼋', '老师父，我等了你这几年，却才回也？');
  yield* L('行者', '老鼋，向年累你，今岁又得相逢。');
  tang.goto(700, 90); ba.goto(600, 90);
  yield* walkHero(840);
  for (const a of [tang, ba, G.hero]) { a.ride = yb; a.y = WATER_Y - 30; }
  G.hero.floor = WATER_Y - 30;
  yb.goto(2000, 110);
  G.camFix = null;
  yield 6;
  yield* L('老鼋', '老师父，我向年曾央到西方见我佛如来，与我问声归著之事，还有多少年寿，果曾问否？');
  yb.gotoX = null;
  yield* N('原来那长老……意念只在取经，他事一毫不理，所以不曾问得老鼋年寿，无言可答。却又不敢欺，打诳语，沉吟半晌，不曾答应。');
  yield 3.5;
  yield* N('老鼋即知不曾替他问了，就将身一幌，唿喇的淬下水去，把他四众连马并经，通皆落水。');
  G.tween(yb, 'y', WATER_Y + 260, 0.6); G.tween(yh, 'alpha', 0, 0.4); Sound.sfx('smash'); G.shake(10);
  for (const a of [tang, ba]) { a.ride = null; G.tween(a, 'y', WATER_Y + 90, 0.7); }
  G.hero.ride = null; G.hero.floor = WATER_Y + 90;
  for (let i = 0; i < 26; i++) Parts.push({ kind: 'paper', x: G.hero.x + rand(-200, 200), y: WATER_Y, vx: rand(-200, 200), vy: rand(-500, -200), r: 0, vr: rand(-6, 6), t: 0, life: 1.4, s: 10, col: '#e8e0c8' });
  yield 2;
  yield* fade(1, 1.2);
}

function* s_fengfo() {
  stage({ hx: 400, ctrl: '' }); G.mk = '行者';
  G.tint = 'rgba(255,230,170,1)';
  G.scen.push(scn('scn_cloud', 300, 'sky', { s: 2.4, y: 300 }), scn('scn_cloud', 1000, 'sky', { s: 2.4, y: 260 }));
  for (let x = 60; x < W; x += 170) G.scen.push(scn('scn_lotus', x, 'front', { s: 0.95, a: 0.7 }));
  G.add(P('scn_buddha', 1000, { s: 0.62, bob: 0, rods: false, z: 1 }));
  const tang = G.tang = G.add(new Pup('tangseng', ANIMS.robe, 600, { face: 1 }));
  const ba = G.add(new Pup('bajie', ANIMS.robe, 220, { face: 1, s: 0.45 }));
  lock(true); G.camFix = 0; G.hero.frozen = true;
  yield* fade(0, 1);
  yield* title('第一百回', '五圣成真');
  yield* L('如来', '孙悟空，汝因大闹天宫，吾以甚深法力，压在五行山下，幸天灾满足，归于释教；且喜汝隐恶扬善，在途中炼魔降怪有功，全终全始，加升大职正果，汝为斗战胜佛。');
  stamp('斗战胜佛', '#b8860b'); setRank('斗战胜佛');
  yield 2.2;
  yield* L('如来', '猪悟能……因汝挑担有功，加升汝职正果，做净坛使者。');
  yield* L('八戒', '他们都成佛，如何把我做个净坛使者？');
  yield* L('如来', '因汝口壮身慵，食肠宽大。盖天下四大部洲，瞻仰吾教者甚多，凡诸佛事，教汝净坛，乃是个有受用的品级，如何不好？');
  yield* waitAct('又对唐僧道');
  yield* L('行者', '师父，此时我已成佛，与你一般，莫成还戴金箍儿，你还念什么紧箍咒掯勒我？');
  yield* L('行者', '趁早儿念个松箍儿咒，脱下来，打得粉碎，切莫叫那甚么菩萨再去捉弄他人。');
  yield* L('唐僧', '当时只为你难管，故以此法制之。今已成佛，自然去矣，岂有还在你头上之理？你试摸摸看。');
  yield* waitAct('举手去摸一摸');
  G.hero.anim = 'touch';
  yield 1.2;
  G.hero.setBare(true); Sound.sfx('snap');
  yield* N('行者举手去摸一摸，果然无之。');
  yield 1;
  G.hero.anim = null;
  yield* fade(1, 1);
  // 南无
  const C = { t: 0, full: true };
  C.draw = (g, dt) => {
    C.t += dt;
    g.fillStyle = '#050201'; g.fillRect(0, 0, W, H);
    g.save(); g.font = `30px ${FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const sp = 46, y0 = H + 20 - C.t * 80;
    NAMO_LIST.forEach((s, i) => {
      const y = y0 + i * sp; if (y < -40 || y > H + 40) return;
      const k = clamp(Math.min(y - 40, H - 40 - y) / 120, 0, 1);
      g.globalAlpha = k; g.fillStyle = s.includes('斗战胜') || s.includes('净坛') ? '#d8a040' : '#a8946c';
      g.fillText(s, W / 2, y);
    });
    g.restore();
  };
  G.overlay = C;
  Sound.setDrone(0.25);
  yield () => C.t > (NAMO_LIST.length * 46 + H + 60) / 80 || (C.t > 3 && Input.hit('skip') && !G.bot);
  G.overlay = null;
}

// 结尾：翻难簿找她
function* s_finale() {
  stage({ hx: -300, ctrl: '', noHero: true });
  G.tint = 'rgba(200,170,130,1)';
  G.scen.push(scn('scn_cloud', 300, 'sky', { s: 2.4, y: 300 }));
  yield* fade(0, 0.6);
  lock(true);
  yield* N('菩萨从头看了一遍，上写着：');
  yield* N(NAN_HEAD);
  const pause = [19, 20, 21, 22];
  yield* search('难簿', NAN_LIST, { per: 11, pauseAt: pause });
  yield 1.2;
  yield* fade(1, 1.6);
  // 灯回到白虎岭
  stage({ w: W, hx: -300, ctrl: '', noHero: true, noHud: true });
  ridge();
  const bx = 880;
  G.scen = G.scen.filter(s => !(s.layer === 'front' && Math.abs(s.x - bx) < 280));
  G.hooks.back = g => drawBones(g, bx, 1, Lamp.power);
  LAMP.x = 640; LAMP.y = 300;
  G.camFix = 0;
  Sound.setLoop(null); Sound.setDrone(0.3);
  yield 0.4;
  yield* fade(0, 2.2);
  G.tween(LAMP, 'x', bx, 4.5); G.tween(LAMP, 'y', GROUND - 60, 4.5);
  yield 7.5;
  G.tween(Lamp, 'power', 0, 4);
  yield 4.4;
  yield* fade(1, 1.2);
  Sound.setDrone(0);
}

// 整出戏的次序
const SCENES = [
  ['授官', s_shouguan], ['御马监', s_yumajian], ['接风', s_jiefeng], ['有官无禄', s_zhaoan], ['蟠桃园', s_pantao], ['无禄人员', s_wulu], ['如来手心', s_shouxin], ['五行山', s_wuxing],
  ['心猿归正', s_maozi],
  ['白虎岭', s_baihu], ['宝象国', s_baoxiang],
  ['莲花洞', s_lianhua], ['乌鸡国', s_wuji], ['金兜洞', s_jindou], ['狮驼岭', s_shituo],
  ['宝阁', s_baoge], ['通天河', s_tongtian], ['封佛', s_fengfo],
  ['难簿', s_finale],
];
const ZHE_AT = { 0: ['第一折', '入流'], 8: ['第二折', '自己戴上'] };
function* play(from = 0) {
  const until = Q.has('until') ? +Q.get('until') : SCENES.length;
  for (let i = from; i < until; i++) {
    G.sceneIdx = i; logEv('scene:' + SCENES[i][0]);
    if (ZHE_AT[i]) { G.fade = 1; yield* zhe(...ZHE_AT[i]); }
    yield* SCENES[i][1]();
    Sound.setLoop(null);
  }
  G.mode = 'end'; logEv('end');
}
