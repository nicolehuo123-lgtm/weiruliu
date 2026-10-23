// 锣鼓经：全部用 WebAudio 现场合成（大锣、小锣、铙钹、单皮鼓、板、堂鼓），不用任何音频文件。
const Sound = (() => {
  let ctx = null, master = null, musicBus = null, sfxBus = null, recDest = null;
  let muted = false;
  let noiseBuf = null;
  let loop = null; // 当前锣鼓点循环

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    recDest = ctx.createMediaStreamDestination();
    comp.connect(recDest);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function resume() { init(); if (ctx.state === 'suspended') ctx.resume(); }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function noise(t, dur, type, freq, q, peak, dec, bus) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); env(g, t, 0.002, peak, dec);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random()); s.stop(t + dur);
  }
  function partials(t, base, ratios, amps, dec, bend, bus, peak = 0.3, bendTime = 0.25) {
    ratios.forEach((r, i) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(base * r, t);
      if (bend) o.frequency.exponentialRampToValueAtTime(base * r * bend, t + bendTime);
      const g = ctx.createGain(); env(g, t, 0.004, peak * amps[i], dec * (1 - i * 0.08));
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + dec + 0.1);
    });
  }

  const inst = {
    // 大锣「仓」：京锣音高往下走
    daluo(t, bus, v = 1) {
      partials(t, 210, [1, 1.52, 2.11, 2.73, 3.41, 4.6], [1, .7, .55, .4, .3, .2], 1.6, 0.82, bus, 0.22 * v, 0.35);
      noise(t, 0.5, 'bandpass', 2400, 0.8, 0.18 * v, 0.35, bus);
    },
    // 小锣「台」：音高往上挑
    xiaoluo(t, bus, v = 1) {
      partials(t, 620, [1, 1.48, 2.3, 3.1], [1, .5, .35, .2], 0.55, 1.18, bus, 0.16 * v, 0.06);
    },
    // 铙钹「才」
    nao(t, bus, v = 1) {
      noise(t, 0.6, 'highpass', 3800, 0.7, 0.28 * v, 0.42, bus);
      partials(t, 1180, [1, 1.33, 1.77, 2.41], [1, .8, .6, .4], 0.35, 0, bus, 0.04 * v);
    },
    // 单皮鼓「八/大」
    gu(t, bus, v = 1) {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.06);
      const g = ctx.createGain(); env(g, t, 0.001, 0.35 * v, 0.09);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.15);
      noise(t, 0.05, 'bandpass', 2600, 1.5, 0.25 * v, 0.03, bus);
    },
    // 檀板「扎」
    ban(t, bus, v = 1) {
      noise(t, 0.05, 'bandpass', 1700, 6, 0.6 * v, 0.025, bus);
      partials(t, 1900, [1, 2.7], [1, .4], 0.04, 0, bus, 0.08 * v);
    },
    // 堂鼓：重的「咚」
    tanggu(t, bus, v = 1) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.25);
      const g = ctx.createGain(); env(g, t, 0.003, 0.7 * v, 0.45);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.6);
      noise(t, 0.08, 'lowpass', 900, 0.7, 0.2 * v, 0.06, bus);
    },
  };

  // 锣鼓字谱：仓=大锣+铙钹，才=铙钹，台=小锣，令=小锣轻，七=铙钹轻，八/大=鼓，扎=板，咚=堂鼓，-=空
  const WORD = {
    '仓': [['daluo', 1], ['nao', .8]], '才': [['nao', 1]], '台': [['xiaoluo', 1]], '令': [['xiaoluo', .45]],
    '七': [['nao', .45]], '八': [['gu', 1]], '大': [['gu', .7]], '扎': [['ban', 1]], '咚': [['tanggu', 1]],
    '顷': [['daluo', .55]], '-': [],
  };
  function playWord(w, t, bus, vol = 1) {
    (WORD[w] || []).forEach(([n, v]) => inst[n](t, bus, v * vol));
  }
  // 一串字谱，每个字一拍
  function phrase(str, bpm = 200, vol = 1, bus) {
    if (!ctx || muted) return 0;
    const beat = 60 / bpm; let t = ctx.currentTime + 0.03;
    const words = str.split(' ').filter(Boolean);
    words.forEach(w => {
      // 「八大」这类两个字挤一拍
      const sub = [...w]; const step = beat / sub.length;
      sub.forEach((c, i) => playWord(c, t + i * step, bus || sfxBus, vol));
      t += beat;
    });
    return words.length * beat;
  }

  const LOOPS = {
    // 走路：慢长锤味道，轻
    walk: { bpm: 132, vol: 0.5, seq: '扎 - 大 - 台 - 令 - 台 - 令 台 扎 - 台 -' },
    // 打斗：急急风
    fight: { bpm: 300, vol: 0.55, seq: '仓 才 仓 才 仓 才 仓 才 八大 仓 才 仓 令才 令才 仓 -' },
    // 紧张：只有板和小锣
    tense: { bpm: 110, vol: 0.5, seq: '扎 - - 令 - - 扎 - 令 - 扎 扎 令 - - -' },
    boss: { bpm: 280, vol: 0.6, seq: '咚 才 仓 才 咚 咚 仓 才 八大 八大 仓 - 顷 才 仓 才' },
    // 后半出：只剩堂鼓和一声闷锣，空得很
    dirge: { bpm: 66, vol: 0.55, seq: '咚 - - - 顷 - - - 扎 - - - - - 令 -' },
  };
  // 底下一层很低的嗡声，越往后越响
  let drone = null;
  function setDrone(v) {
    if (!ctx) return;
    if (!drone) {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.23; lg.gain.value = 0.35; lfo.connect(lg);
      const amp = ctx.createGain(); amp.gain.value = 0.65; lg.connect(amp.gain); amp.connect(g);
      for (const [f, a] of [[55, 1], [82.6, 0.5], [110.3, 0.25]]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(amp); o.start();
      }
      lfo.start(); drone = g;
    }
    drone.gain.setTargetAtTime(muted ? 0 : v, ctx.currentTime, 1.2);
  }
  function setLoop(name) {
    if (!ctx) return;
    if (loop && loop.name === name) return;
    loop = name ? { name, i: 0, next: ctx.currentTime + 0.1 } : null;
  }
  function tick() {
    if (!ctx || !loop || muted) return;
    const L = LOOPS[loop.name]; const beat = 60 / L.bpm;
    const words = L.seq.split(' ');
    while (loop.next < ctx.currentTime + 0.12) {
      const w = words[loop.i % words.length];
      const sub = [...w];
      sub.forEach((c, k) => playWord(c, loop.next + k * beat / sub.length, musicBus, L.vol));
      loop.next += beat; loop.i++;
    }
  }

  // 紧箍咒的耳鸣：两个挨得很近的高音互相打架
  function ring(t, dur) {
    for (const f of [2760, 2773]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.1);
    }
  }
  function sfx(name) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case 'swing': noise(t, 0.2, 'bandpass', 900, 1.2, 0.25, 0.16, sfxBus); break;
      case 'hit': inst.gu(t, sfxBus, 1.3); inst.nao(t + 0.02, sfxBus, .5); break;
      case 'clang': partials(t, 900, [1, 2.4, 3.9], [1, .6, .3], 0.3, 0, sfxBus, .2); break;
      case 'stomp': inst.tanggu(t, sfxBus, 1.4); inst.daluo(t + .02, sfxBus, .5); break;
      case 'jump': inst.ban(t, sfxBus, .7); break;
      case 'land': inst.gu(t, sfxBus, .5); break;
      case 'hurt': inst.daluo(t, sfxBus, .7); inst.nao(t, sfxBus, .8); break;
      case 'poof': noise(t, 0.5, 'lowpass', 1800, 0.6, 0.3, 0.4, sfxBus); inst.xiaoluo(t, sfxBus, .6); break;
      case 'eye': partials(t, 330, [1, 1.5, 2], [1, .5, .3], 0.8, 1.6, sfxBus, .08, .5); break;
      case 'grow': partials(t, 90, [1, 1.5], [1, .5], 0.6, 0.6, sfxBus, .2, .5); break;
      case 'smash': inst.tanggu(t, sfxBus, 1.5); noise(t, 0.6, 'lowpass', 2500, .5, .5, .5, sfxBus); inst.daluo(t + .05, sfxBus, .8); break;
      case 'chant': phrase('令 令 令 令 令 令 令 令', 420, .9); ring(t, 2.6); break;
      case 'chantLong': phrase('令 令 令 令 令 令 令 令 令 令 令 令 令 令 令 令 令 令 令 令', 420, 1); ring(t, 5.5); break;
      case 'tear': {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.45);
        const g = ctx.createGain(); env(g, t, 0.01, 0.5, 0.5);
        s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + 0.6);
        break;
      }
      case 'snap': inst.ban(t, sfxBus, 1.4); noise(t, 0.12, 'highpass', 5000, 0.7, 0.5, 0.08, sfxBus); inst.daluo(t + 0.03, sfxBus, 0.9); break;
      case 'snuff': noise(t, 0.7, 'lowpass', 700, 0.5, 0.35, 0.6, sfxBus); break;
      case 'pickup': inst.xiaoluo(t, sfxBus, .8); inst.xiaoluo(t + .09, sfxBus, .8); break;
    }
  }

  return {
    init, resume, phrase, setLoop, tick, sfx, setDrone,
    get stream() { return recDest ? recDest.stream : null; },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.9; return muted; },
    get muted() { return muted; },
  };
})();
