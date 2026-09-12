/* ============================================================
   Омега и камни — игровой движок
   Простой сценовый движок на canvas: ввод, диалоги, UI, звук.
   ============================================================ */
(function () {
  const W = 960, H = 540;
  const G = {
    W, H,
    scenes: {}, scene: null, sceneName: '',
    keys: {}, just: {},
    mouse: { x: 0, y: 0, down: false, click: false },
    time: 0, paused: false, muted: false,
    ctx: null, canvas: null
  };
  window.G = G;

  /* ---------- сохранение ---------- */
  const SAVE_KEY = 'omega_stones_save_v1';
  G.save = { chapter: 1, stones: [], flags: {} };
  G.storageOK = true;
  G.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          G.save.chapter = s.chapter || 1;
          G.save.stones = Array.isArray(s.stones) ? s.stones : [];
          G.save.flags = s.flags || {};
        }
      }
    } catch (e) { G.storageOK = false; /* приватный режим — играем без сохранения */ }
  };
  G.store = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); }
    catch (e) { G.storageOK = false; }
  };
  G.unlock = function (chapter) {
    if (chapter > G.save.chapter) G.save.chapter = chapter;
    G.store();
  };
  G.reset = function () {
    G.save = { chapter: 1, stones: [], flags: {} };
    G.store();
  };

  /* ---------- ввод ---------- */
  const KEYS_BLOCK = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

  function keyDown(code) {
    if (!G.keys[code]) G.just[code] = true;
    G.keys[code] = true;
  }
  G.keyDown = keyDown;

  function relPos(clientX, clientY) {
    const r = G.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * W / r.width,
      y: (clientY - r.top) * H / r.height
    };
  }

  /* ---------- масштаб холста и полный экран ---------- */
  G.k = 1;
  G.resize = function () {
    if (!G.canvas) return;
    const rect = G.canvas.getBoundingClientRect();
    const cssW = rect.width || W;
    let k = (cssW / W) * (window.devicePixelRatio || 1);
    k = Math.max(1, Math.min(2, k));
    if (window.ART && ART.setScale) ART.setScale(k);
    k = (window.ART && ART.scale) ? ART.scale() : k;
    const bw = Math.round(W * k), bh = Math.round(H * k);
    if (G.canvas.width !== bw || G.canvas.height !== bh) {
      G.canvas.width = bw; G.canvas.height = bh;
    }
    G.k = k;
  };
  G.isFullscreen = function () {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  };
  function stageEl() { return document.getElementById('stage'); }
  // запасной режим: игра растягивается на всю страницу (работает и там,
  // где встроенной странице запрещён настоящий полный экран)
  G.isMaxi = function () {
    const el = stageEl();
    return !!(el && el.classList.contains('maxi'));
  };
  G.isBig = function () { return G.isFullscreen() || G.isMaxi(); };
  function setMaxi(on) {
    const el = stageEl();
    if (!el) return;
    el.classList.toggle('maxi', !!on);
    document.documentElement.classList.toggle('maxi-lock', !!on);
    G.resize();
  }
  G.fullscreenAvailable = function () { return !!stageEl(); };
  // на телефоне игре удобнее в альбомной ориентации (где браузер это разрешает)
  function lockLandscape() {
    try {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (coarse && screen.orientation && screen.orientation.lock) {
        const r = screen.orientation.lock('landscape');
        if (r && r.catch) r.catch(function () {});
      }
    } catch (e) { /* не поддерживается — не беда */ }
  }
  G.toggleFullscreen = function () {
    const el = stageEl() || document.documentElement;
    // выключение
    if (G.isFullscreen()) {
      try {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) { const r = exit.call(document); if (r && r.catch) r.catch(function () {}); }
      } catch (e) { /* уже вышли */ }
      setMaxi(false);
      return;
    }
    if (G.isMaxi()) { setMaxi(false); return; }
    // включение: сначала пробуем настоящий полный экран
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    const fallback = function () {
      setMaxi(true);
      G.notice('Полный экран здесь запрещён — растянул игру на всю страницу. Для настоящего открой игру в отдельной вкладке.', 5);
    };
    if (document.fullscreenEnabled === false || !req) { fallback(); return; }
    try {
      const r = req.call(el, { navigationUI: 'hide' });
      if (r && r.then) r.then(lockLandscape, fallback); else lockLandscape();
    } catch (e) { fallback(); }
  };

  G.init = function () {
    G.canvas = document.getElementById('game');
    G.canvas.width = W; G.canvas.height = H;
    G.ctx = G.canvas.getContext('2d');
    G.load();

    window.addEventListener('keydown', function (e) {
      if (KEYS_BLOCK.indexOf(e.code) >= 0) e.preventDefault();
      if (e.code === 'KeyF') { G.toggleFullscreen(); return; }
      if (e.code === 'Escape') {
        if (G.isFullscreen()) return;   // Esc выходит из полного экрана
        if (G.isMaxi()) { G.toggleFullscreen(); return; }
        const menus = ['menu', 'chapters', 'collection', 'outro', 'final'];
        if (menus.indexOf(G.sceneName) >= 0) { keyDown('Escape'); return; }
        G.paused = !G.paused; return;
      }
      keyDown(e.code);
    });
    window.addEventListener('keyup', function (e) { G.keys[e.code] = false; });

    G.canvas.addEventListener('mousemove', function (e) {
      const p = relPos(e.clientX, e.clientY); G.mouse.x = p.x; G.mouse.y = p.y;
    });
    G.canvas.addEventListener('mousedown', function (e) {
      const p = relPos(e.clientX, e.clientY); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.down = true;
    });
    window.addEventListener('mouseup', function () { G.mouse.down = false; });
    G.canvas.addEventListener('click', function (e) {
      const p = relPos(e.clientX, e.clientY); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.click = true;
    });
    G.canvas.addEventListener('touchstart', function (e) {
      const t = e.changedTouches[0];
      const p = relPos(t.clientX, t.clientY);
      G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.click = true; G.mouse.down = true;
      keyDown('Space');
      e.preventDefault();
    }, { passive: false });
    G.canvas.addEventListener('touchend', function (e) {
      G.mouse.down = false; G.keys['Space'] = false; e.preventDefault();
    }, { passive: false });

    // экранные кнопки для телефона
    document.querySelectorAll('[data-key]').forEach(function (btn) {
      const code = btn.getAttribute('data-key');
      const on = function (e) { e.preventDefault(); keyDown(code); btn.classList.add('on'); };
      const off = function (e) { e.preventDefault(); G.keys[code] = false; btn.classList.remove('on'); };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });

    const onResize = function () { G.resize(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('fullscreenchange', onResize);
    document.addEventListener('webkitfullscreenchange', onResize);
    const fsBtn = document.getElementById('fs');
    if (fsBtn) fsBtn.addEventListener('click', function () { G.toggleFullscreen(); });
    G.resize();

    requestAnimationFrame(loop);
  };

  /* ---------- цикл ---------- */
  let last = 0, frame = 0;
  function loop(ts) {
    let dt = (ts - last) / 1000;
    if (!last || !isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05);
    last = ts;
    G.time += dt;

    frame++;
    if (frame % 20 === 0) G.resize();   // страховка, если событие resize не пришло

    const ctx = G.ctx;
    ctx.setTransform(G.k, 0, 0, G.k, 0, 0);
    if (G.scene) {
      if (!G.paused && G.scene.update) G.scene.update(dt);
      if (G.scene.draw) G.scene.draw(ctx);
    }
    if (G.paused) drawPause(ctx);
    drawNotice(ctx, dt);

    G.just = {};
    G.mouse.click = false;
    requestAnimationFrame(loop);
  }

  function drawPause(ctx) {
    ctx.fillStyle = 'rgba(10,14,20,.72)';
    ctx.fillRect(0, 0, W, H);
    G.text('ПАУЗА', W / 2, 190, { size: 54, align: 'center', color: '#ffe9b0' });
    G.text('Esc — продолжить', W / 2, 235, { size: 18, align: 'center', color: '#cfd8e3' });
    if (G.btn(W / 2 - 110, 280, 220, 44, 'Продолжить')) G.paused = false;
    if (G.btn(W / 2 - 110, 336, 220, 44, 'В главное меню')) { G.paused = false; G.go('menu'); }
    if (G.fullscreenAvailable() &&
        G.btn(W / 2 - 110, 392, 220, 38, G.isBig() ? 'Выйти из полного экрана' : 'На весь экран (F)', { size: 15 })) {
      G.toggleFullscreen();
    }
    if (G.btn(W / 2 - 80, 442, 160, 34, G.muted ? 'Включить звук' : 'Выключить звук', { size: 14 })) G.muted = !G.muted;
  }

  /* ---------- всплывающая подсказка поверх игры ---------- */
  G.noticeText = ''; G.noticeT = 0;
  G.notice = function (text, secs) {
    G.noticeText = text; G.noticeT = secs || 4;
  };
  function drawNotice(ctx, dt) {
    if (G.noticeT <= 0) return;
    G.noticeT -= dt;
    const a = Math.min(1, G.noticeT);
    ctx.save();
    ctx.globalAlpha = a;
    const lines = G.wrap(G.noticeText, 500, 16);
    const h = 20 + lines.length * 22;
    G.panel(W / 2 - 270, 12, 540, h, { fill: 'rgba(12,16,22,.92)' });
    lines.forEach(function (l, i) {
      G.text(l, W / 2, 36 + i * 22, { size: 16, align: 'center', color: '#ffe9b0' });
    });
    ctx.restore();
  }

  /* ---------- сцены ---------- */
  G.addScene = function (name, scene) { G.scenes[name] = scene; };
  G.go = function (name, params) {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.dlg.active = false;
    G.scene = G.scenes[name];
    G.sceneName = name;
    if (!G.scene) { console.error('нет сцены', name); return; }
    if (G.scene.enter) G.scene.enter(params || {});
  };

  /* ---------- рисование: текст и панели ---------- */
  G.font = function (size, weight) {
    return (weight || 600) + ' ' + size + 'px "Trebuchet MS", "Segoe UI", system-ui, Arial, sans-serif';
  };
  G.text = function (s, x, y, o) {
    o = o || {};
    const ctx = G.ctx;
    ctx.font = G.font(o.size || 18, o.weight);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillText(s, x + 2, y + 2);
    }
    ctx.fillStyle = o.color || '#ffffff';
    ctx.fillText(s, x, y);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  };
  G.measure = function (s, size, weight) {
    G.ctx.font = G.font(size || 18, weight);
    return G.ctx.measureText(s).width;
  };
  G.wrap = function (s, maxw, size, weight) {
    const ctx = G.ctx;
    ctx.font = G.font(size || 18, weight);
    const out = [];
    String(s).split('\n').forEach(function (para) {
      const words = para.split(' ');
      let line = '';
      words.forEach(function (w) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxw && line) { out.push(line); line = w; }
        else line = test;
      });
      out.push(line);
    });
    return out;
  };
  G.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  G.panel = function (x, y, w, h, o) {
    o = o || {};
    const ctx = G.ctx;
    G.rr(ctx, x, y, w, h, o.r === undefined ? 14 : o.r);
    ctx.fillStyle = o.fill || 'rgba(18,22,30,.86)';
    ctx.fill();
    ctx.lineWidth = o.lw || 3;
    ctx.strokeStyle = o.stroke || 'rgba(255,225,160,.55)';
    ctx.stroke();
  };
  G.hit = function (x, y, w, h) {
    const m = G.mouse;
    return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
  };
  G.btn = function (x, y, w, h, label, o) {
    o = o || {};
    const ctx = G.ctx;
    const hov = G.hit(x, y, w, h);
    G.rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = o.disabled ? 'rgba(40,44,52,.8)' : (hov ? 'rgba(96,132,84,.95)' : 'rgba(46,60,44,.92)');
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = o.disabled ? 'rgba(120,125,135,.5)' : (hov ? '#ffe9b0' : 'rgba(255,225,160,.6)');
    ctx.stroke();
    G.text(label, x + w / 2, y + h / 2 + (o.size || 17) * 0.35, {
      size: o.size || 17, align: 'center',
      color: o.disabled ? '#8d94a0' : '#fff6e0'
    });
    if (o.disabled) return false;
    return hov && G.mouse.click;
  };
  G.bar = function (x, y, w, h, v, o) {
    o = o || {};
    const ctx = G.ctx;
    v = Math.max(0, Math.min(1, v));
    G.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
    if (v > 0.001) {
      ctx.save();
      G.rr(ctx, x, y, w, h, h / 2); ctx.clip();
      ctx.fillStyle = o.color || '#6ec07a';
      ctx.fillRect(x, y, w * v, h);
      ctx.restore();
    }
    G.rr(ctx, x, y, w, h, h / 2);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    if (o.label) G.text(o.label, x, y - 6, { size: 13, color: o.labelColor || '#e6eef8' });
  };

  /* ---------- диалоги ---------- */
  G.dlg = {
    active: false, lines: [], i: 0, chars: 0, cb: null, speed: 55
  };
  // lines: массив строк "Кто|Текст" или просто "Текст" (рассказчик)
  G.say = function (lines, cb) {
    G.dlg.lines = lines.slice();
    G.dlg.i = 0; G.dlg.chars = 0; G.dlg.active = true; G.dlg.cb = cb || null;
  };
  function cur() {
    const raw = G.dlg.lines[G.dlg.i] || '';
    const k = raw.indexOf('|');
    if (k > 0 && k < 22) return { who: raw.slice(0, k), text: raw.slice(k + 1) };
    return { who: '', text: raw };
  }
  G.dlg.update = function (dt) {
    if (!G.dlg.active) return;
    const c = cur();
    const advance = G.just['Space'] || G.just['Enter'] || G.mouse.click;
    if (G.dlg.chars < c.text.length) {
      G.dlg.chars += G.dlg.speed * dt * (G.keys['Space'] ? 3 : 1);
      if (advance) G.dlg.chars = c.text.length;
    } else if (advance) {
      G.dlg.i++;
      G.dlg.chars = 0;
      G.sfx('blip');
      if (G.dlg.i >= G.dlg.lines.length) {
        G.dlg.active = false;
        const cb = G.dlg.cb; G.dlg.cb = null;
        if (cb) cb();
      }
    }
  };
  G.dlg.draw = function () {
    if (!G.dlg.active) return;
    const ctx = G.ctx;
    const c = cur();
    const y = H - 152, h = 132;
    G.panel(24, y, W - 48, h, { fill: 'rgba(14,18,26,.92)' });
    let tx = 48;
    if (c.who) {
      ART.portrait(ctx, c.who, 84, y + 62, 1);
      tx = 148;
      G.text(c.who, 84, y + 118, { size: 15, align: 'center', color: '#ffd98a' });
    }
    const shown = c.text.slice(0, Math.floor(G.dlg.chars));
    const lines = G.wrap(shown, W - tx - 70, 20);
    lines.slice(-4).forEach(function (l, i) {
      G.text(l, tx, y + 38 + i * 27, { size: 20, color: '#f2ecdf' });
    });
    if (G.dlg.chars >= c.text.length && Math.sin(G.time * 6) > 0) {
      G.text('▶ пробел', W - 70, y + h - 14, { size: 14, align: 'right', color: '#9fb0c2' });
    }
  };

  /* ---------- звук ---------- */
  let actx = null;
  function ac() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = false; }
    }
    return actx;
  }
  G.sfx = function (type) {
    if (G.muted) return;
    const a = ac(); if (!a) return;
    if (a.state === 'suspended') a.resume();
    const presets = {
      blip:  { f: 520, f2: 560, d: 0.05, t: 'square', v: 0.05 },
      step:  { f: 160, f2: 120, d: 0.06, t: 'triangle', v: 0.05 },
      hit:   { f: 220, f2: 90,  d: 0.12, t: 'square', v: 0.10 },
      good:  { f: 660, f2: 990, d: 0.16, t: 'triangle', v: 0.10 },
      bad:   { f: 200, f2: 70,  d: 0.30, t: 'sawtooth', v: 0.10 },
      win:   { f: 520, f2: 1320, d: 0.45, t: 'triangle', v: 0.11 },
      drip:  { f: 900, f2: 400, d: 0.14, t: 'sine', v: 0.10 },
      meow:  { f: 380, f2: 620, d: 0.28, t: 'sawtooth', v: 0.07 }
    };
    const p = presets[type] || presets.blip;
    const o = a.createOscillator(), g = a.createGain();
    o.type = p.t;
    o.frequency.setValueAtTime(p.f, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, p.f2), a.currentTime + p.d);
    g.gain.setValueAtTime(p.v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + p.d);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + p.d + 0.02);
  };
  G.meow = function (n) {
    if (G.muted) return;
    const a = ac(); if (!a) return;
    if (a.state === 'suspended') a.resume();
    const base = [300, 380, 460, 560][n % 4];
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, a.currentTime);
    o.frequency.linearRampToValueAtTime(base * 1.5, a.currentTime + 0.12);
    o.frequency.linearRampToValueAtTime(base * 0.9, a.currentTime + 0.34);
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.linearRampToValueAtTime(0.09, a.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + 0.38);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.4);
  };

  /* ---------- мелочи ---------- */
  G.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  G.lerp = function (a, b, t) { return a + (b - a) * t; };
  G.rnd = function (a, b) { return a + Math.random() * (b - a); };
  G.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  G.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  // общий заголовок главы поверх сцены
  G.chapterTitle = function (ctx, num, name, t) {
    if (t > 3) return;
    const a = t < 2.2 ? 1 : 1 - (t - 2.2) / 0.8;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    G.panel(W / 2 - 240, 110, 480, 80, { fill: 'rgba(12,16,22,.72)' });
    G.text('Глава ' + num, W / 2, 144, { size: 19, align: 'center', color: '#ffd98a' });
    G.text(name, W / 2, 176, { size: 26, align: 'center', color: '#fff6e0' });
    ctx.restore();
  };
})();
