/* ============================================================
   Омега и камни — меню, выбор глав, коллекция, запуск
   ============================================================ */
(function () {
  G.CHAPTERS = [
    { n: 1,  name: 'Омега и его камни',  scene: 'ch1' },
    { n: 2,  name: 'Споры с Саней',      scene: 'ch2' },
    { n: 3,  name: 'Бочка',              scene: 'ch3' },
    { n: 4,  name: 'Работа',             scene: 'ch4' },
    { n: 5,  name: 'Сон',                scene: 'ch5' },
    { n: 6,  name: 'Кактус',             scene: 'ch6' },
    { n: 7,  name: 'Возвращение',        scene: 'ch7' },
    { n: 8,  name: 'Саня',               scene: 'ch8' },
    { n: 9,  name: 'Месть Омеги',        scene: 'ch9' },
    { n: 10, name: 'Возвращение Сани',   scene: 'ch10' }
  ];

  G.startChapter = function (n) {
    const c = G.CHAPTERS[n - 1];
    if (c) G.go(c.scene);
  };
  G.finishChapter = function (n) {
    G.unlock(n + 1);
    G.go('outro', { n: n });
  };

  /* ---------- меню ---------- */
  const menu = {
    enter: function () { this.t = 0; },
    update: function (dt) {
      this.t += dt;
      if (G.just['Space'] || G.just['Enter']) G.startChapter(Math.min(G.save.chapter, 10));
    },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      // мягкая подложка под текст, чтобы лес остался светлым
      const veil = ctx.createLinearGradient(0, 200, 0, G.H);
      veil.addColorStop(0, 'rgba(8,14,20,0)');
      veil.addColorStop(.28, 'rgba(8,14,20,.55)');
      veil.addColorStop(1, 'rgba(8,14,20,.45)');
      ctx.fillStyle = veil; ctx.fillRect(0, 180, G.W, G.H - 180);

      // летающие камушки
      for (let i = 0; i < 7; i++) {
        const x = 90 + i * 128;
        const y = 150 + Math.sin(this.t * 1.2 + i) * 16;
        ART.stone(ctx, x, y, 16 + (i % 3) * 4, ['#8a8f99', '#4f9e5a', '#b9a06a', '#c05a4a', '#4b3a6b', '#5b8ab5', '#c9a227'][i],
          { face: true, seed: i, shadow: false });
      }

      G.text('ОМЕГА И ЕГО КАМНИ', G.W / 2, 262, { size: 54, align: 'center', color: '#ffe9b0' });
      G.text('игра по рассказу в десяти главах', G.W / 2, 296, { size: 19, align: 'center', color: '#e6eef8' });

      const prog = Math.min(G.save.chapter, 10);
      const label = G.save.flags.finished ? 'Играть заново' :
        (G.save.chapter > 1 ? 'Продолжить — глава ' + prog : 'Начать игру');
      if (G.btn(G.W / 2 - 150, 330, 300, 52, label, { size: 21 })) G.startChapter(prog);
      if (G.btn(G.W / 2 - 150, 392, 300, 42, 'Выбор главы')) G.go('chapters');
      if (G.btn(G.W / 2 - 150, 442, 145, 42, 'Коллекция', { size: 16 })) G.go('collection');
      if (G.btn(G.W / 2 + 5, 442, 145, 42, G.muted ? 'Звук: выкл' : 'Звук: вкл', { size: 16 })) G.muted = !G.muted;

      G.text('← → ↑ ↓ — движение · Пробел — действие · Esc — пауза', G.W / 2, 516, { size: 15, align: 'center', color: '#cfd8e3' });
      ART.omega(ctx, 140, 470, 1.3, {});
      ART.sanya(ctx, 820, 470, 1.3, { flip: true, cactus: true });
    }
  };

  /* ---------- выбор главы ---------- */
  const chapters = {
    enter: function () { this.t = 0; },
    update: function (dt) {
      this.t += dt;
      if (G.just['Escape']) G.go('menu');
    },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      ctx.fillStyle = 'rgba(10,14,20,.52)'; ctx.fillRect(0, 0, G.W, G.H);
      G.text('ВЫБОР ГЛАВЫ', G.W / 2, 66, { size: 34, align: 'center', color: '#ffe9b0' });
      for (let i = 0; i < G.CHAPTERS.length; i++) {
        const c = G.CHAPTERS[i];
        const col = i % 2, row = Math.floor(i / 2);
        const x = 80 + col * 420, y = 100 + row * 66;
        const locked = c.n > G.save.chapter;
        if (G.btn(x, y, 400, 52, (locked ? '🔒 ' : c.n + '. ') + c.name, { disabled: locked, size: 19 })) {
          G.startChapter(c.n);
        }
      }
      if (G.btn(G.W / 2 - 100, 466, 200, 44, 'Назад')) G.go('menu');
      if (G.btn(G.W - 190, 24, 166, 34, 'Сбросить прогресс', { size: 14 })) { G.reset(); }
    }
  };

  /* ---------- коллекция камней ---------- */
  const collection = {
    enter: function () { this.t = 0; },
    update: function (dt) {
      this.t += dt;
      if (G.just['Escape']) G.go('menu');
    },
    draw: function (ctx) {
      ART.lairBg(ctx, this.t);
      ctx.fillStyle = 'rgba(10,14,20,.55)'; ctx.fillRect(0, 0, G.W, G.H);
      G.text('КОЛЛЕКЦИЯ КАМНЕЙ', G.W / 2, 56, { size: 32, align: 'center', color: '#ffe9b0' });
      const st = G.save.stones || [];
      if (!st.length) {
        G.text('Пока пусто. Иди копать в песке!', G.W / 2, 260, { size: 22, align: 'center', color: '#e6eef8' });
      }
      const all = [{ name: DATA.balid.name, color: DATA.balid.color, group: 'лысые' }].concat(st);
      all.slice(0, 24).forEach(function (s, i) {
        const x = 110 + (i % 6) * 148, y = 140 + Math.floor(i / 6) * 110;
        ART.stone(ctx, x, y, 30, s.color, { face: true, stripes: s.stripes, seed: i });
        G.text(s.name, x, y + 48, { size: 14, align: 'center', color: '#fff6e0' });
        G.text(s.group || '', x, y + 66, { size: 12, align: 'center', color: '#a8d8a8' });
      });
      if (G.btn(G.W / 2 - 100, 490, 200, 40, 'Назад')) G.go('menu');
    }
  };

  /* ---------- экран между главами ---------- */
  const outro = {
    enter: function (p) {
      this.t = 0;
      this.n = p.n || 1;
      G.sfx('win');
    },
    update: function (dt) {
      this.t += dt;
      if ((G.just['Space'] || G.just['Enter']) && this.t > 0.4) this.next();
    },
    next: function () {
      if (this.n >= 10) G.go('final');
      else G.startChapter(this.n + 1);
    },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      ctx.fillStyle = 'rgba(10,14,20,.52)'; ctx.fillRect(0, 0, G.W, G.H);
      const c = G.CHAPTERS[this.n - 1];
      G.text('Глава ' + c.n + ' пройдена', G.W / 2, 200, { size: 40, align: 'center', color: '#ffe9b0' });
      G.text('«' + c.name + '»', G.W / 2, 244, { size: 24, align: 'center', color: '#f2ecdf' });
      const nx = G.CHAPTERS[this.n];
      if (nx) G.text('Дальше: глава ' + nx.n + '. ' + nx.name, G.W / 2, 300, { size: 20, align: 'center', color: '#a8d8a8' });
      if (G.btn(G.W / 2 - 150, 340, 300, 50, nx ? 'Дальше' : 'Финал', { size: 20 })) this.next();
      if (G.btn(G.W / 2 - 100, 404, 200, 40, 'В меню', { size: 16 })) G.go('menu');
      G.text('(пробел)', G.W / 2, 470, { size: 14, align: 'center', color: '#9fb0c2' });
      ART.omega(ctx, 160, 500, 1.2, {});
    }
  };

  G.addScene('menu', menu);
  G.addScene('chapters', chapters);
  G.addScene('collection', collection);
  G.addScene('outro', outro);

  window.addEventListener('load', function () {
    G.init();
    G.go('menu');
  });
})();
