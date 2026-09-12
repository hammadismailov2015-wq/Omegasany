/* ============================================================
   Главы 4-7: работа в бочке, сон, кактусы, возвращение
   ============================================================ */
(function () {

  /* =========================================================
     ГЛАВА 4. Работа — долбим бочку изнутри
     ========================================================= */
  const ch4 = {
    enter: function (p) {
      this.t = 0;
      this.mode = 'play';
      this.tool = 'nail';
      this.progress = (p && p.progress) || 0;
      this.checkpoint = this.progress;
      this.water = 100; this.food = 100; this.energy = 100;
      this.guilt = 0;
      this.hours = 0;
      this.swing = 0; this.sdir = 1;
      this.zone = 0.42; this.zoneW = 0.16;
      this.shake = 0;
      this.flash = 0;
      this.hit = 0;
      this.msg = ''; this.msgT = 0;
      this.mile = { c15: this.progress >= 15, c35: this.progress >= 35, c60: false };
      this.sleeping = 0;
      if (!p || !p.silent) {
        G.say([
          'Бочка была тесная. В ней ничего не было, кроме досок и гвоздей.',
          'Омега|Воздуха нет... голова болит... пить...',
          'Вдруг ему стало больно — прямо впивалось что-то в ногу. Он посмотрел: это был камень. Его любимый Лысый!',
          'Омега|Точно! Выдолблю дырку и выберусь!',
          'Пробел — удар (лови зелёную зону). 1 — гвоздь, 2 — Лысый (быстро, но стыдно). S — поспать.'
        ]);
      }
    },

    air: function () {
      return G.clamp(0.22 + this.progress / 100 * 0.9, 0, 1);
    },

    strike: function () {
      this.hit = 1;                     // рука пошла вперёд, гаснет в update
      const hitQ = Math.abs(this.swing - (this.zone + this.zoneW / 2));
      const good = this.swing > this.zone && this.swing < this.zone + this.zoneW;
      const near = hitQ < this.zoneW;
      let gain = 0;
      if (good) { gain = this.tool === 'stone' ? 3.0 : 1.3; G.sfx('good'); }
      else if (near) { gain = this.tool === 'stone' ? 1.2 : 0.5; G.sfx('hit'); }
      else { gain = 0; this.energy -= 2.5; G.sfx('bad'); this.shake = 0.2; }
      this.progress = G.clamp(this.progress + gain, 0, 100);
      this.energy -= 1.4;
      this.hours += 0.06;
      if (this.tool === 'stone') {
        this.guilt = G.clamp(this.guilt + 7, 0, 100);
        if (this.guilt >= 100) {
          this.tool = 'nail';
          G.say(['Омега|Нет. Лучше уж долго делать, а не мой камень ломать. Мне его жалко.',
                 'Он взял гвоздь.']);
        } else if (this.guilt > 40 && !this.shamed) {
          this.shamed = true;
          G.say(['Он посмотрел на камень и осознал, что делает со своим любимым камнем. Ему стало стыдно.',
                 'Лысый|...',
                 'Омега|Прости. Попробую гвоздём. (нажми 1)']);
        }
      }
      // новая зона
      this.zoneW = G.clamp(0.19 - this.progress * 0.0006, 0.09, 0.19);
      this.zone = G.rnd(0.05, 0.95 - this.zoneW);
      this.checkMiles();
    },

    checkMiles: function () {
      // контрольная точка — чтобы после смерти не начинать всё заново
      if (this.progress >= 35) this.checkpoint = 35;
      else if (this.progress >= 15) this.checkpoint = 15;
      if (!this.mile.c15 && this.progress >= 15) {
        this.mile.c15 = true;
        G.say(['Небольшая трещина появилась на бочке!',
               'Омега|Свет! Кислород! Настоящий!',
               'Он совал туда нос, чтобы подышать. Он забыл, что хочет пить и есть.']);
      } else if (!this.mile.c35 && this.progress >= 35) {
        this.mile.c35 = true;
        G.say(['Дырка стала такой, что туда пролезает палец.',
               'Омега|Так... прикладываю палец... сто одиннадцать раз. По десять часов в день — тысяча сто десять часов. Делим на двадцать четыре...',
               'Омега|Сорок шесть дней?! ЧЁ?!',
               'Омега|Так я же умру от жажды за несколько дней... Ладно, не надо терять время.']);
      } else if (!this.mile.c60 && this.progress >= 60) {
        this.mile.c60 = true;
        G.say(['Вскоре он сделал дырку, куда уже просовывалась рука.',
               'Омега|Заслужил поспать.'], function () { G.go('ch5'); });
      }
    },

    sleep: function () {
      if (this.sleeping > 0) return;
      this.sleeping = 1.6;
      this.energy = G.clamp(this.energy + 55, 0, 100);
      this.water -= 10; this.food -= 9;
      this.hours += 6;
      G.sfx('drip');
      this.msg = 'Он спал сидя, свернувшись в рогалик. Было душно.';
      this.msgT = 2.6;
    },

    update: function (dt) {
      this.t += dt;
      if (this.shake > 0) this.shake -= dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.hit > 0) this.hit = Math.max(0, this.hit - dt * 5);
      if (G.dlg.active) { G.dlg.update(dt); return; }
      if (this.mode === 'dead') {
        if (G.just['Space'] || G.mouse.click) {
          this.enter({ progress: this.checkpoint, silent: true });
        }
        return;
      }
      if (this.sleeping > 0) { this.sleeping -= dt; return; }

      // маятник силы удара
      this.swing += this.sdir * dt * 0.95;
      if (this.swing > 1) { this.swing = 1; this.sdir = -1; }
      if (this.swing < 0) { this.swing = 0; this.sdir = 1; }

      // расход
      const airPenalty = 1.6 - this.air();
      this.water -= dt * 0.62;
      this.food -= dt * 0.34;
      this.energy -= dt * 0.9 * airPenalty;
      this.hours += dt * 0.12;
      this.water = G.clamp(this.water, 0, 100);
      this.food = G.clamp(this.food, 0, 100);
      this.energy = G.clamp(this.energy, 0, 100);

      if (G.just['Digit1']) { this.tool = 'nail'; G.sfx('blip'); }
      if (G.just['Digit2'] && this.guilt < 100) { this.tool = 'stone'; G.sfx('blip'); }
      if (G.just['KeyS']) this.sleep();
      if ((G.just['Space'] || G.mouse.click) && this.energy > 2) this.strike();

      if (this.water <= 0 || this.energy <= 0 || this.food <= 0) {
        this.mode = 'dead';
        G.sfx('bad');
        this.deadReason = this.water <= 0 ? 'Ты умер от жажды.' :
          (this.food <= 0 ? 'Ты умер от голода.' : 'Силы кончились. Ты не смог поднять руку.');
      }
    },

    draw: function (ctx) {
      ctx.save();
      if (this.shake > 0) ctx.translate(G.rnd(-5, 5), G.rnd(-5, 5));
      // внутренность бочки
      ART.barrelInside(ctx, this.t);
      const hole = this.progress / 100;
      if (hole > 0.12) {
        ART.holeLight(ctx, 700, 250, hole, this.t);
      } else if (hole > 0.02) {
        ctx.strokeStyle = 'rgba(255,240,190,' + (hole * 6) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(690, 206); ctx.quadraticCurveTo(706, 250, 712, 292); ctx.stroke();
      }
      // гвоздь
      ctx.strokeStyle = '#aeb4bd'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(620, 150); ctx.lineTo(634, 170); ctx.stroke();
      ctx.fillStyle = '#d5d9e0';
      ctx.beginPath(); ctx.arc(619, 148, 6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.arc(617, 146, 2, 0, 7); ctx.fill();

      // вид от первого лица: своя рука с инструментом, Лысый рядом
      const sleepNow = this.sleeping > 0;
      if (!sleepNow) {
        if (this.tool !== 'stone') {
          ART.stone(ctx, 118, 432, 19, DATA.balid.color, { face: true, sad: this.guilt > 40 });
          G.text('Лысый', 118, 468, { size: 13, align: 'center', color: '#e2a79c' });
        }
        ART.handFP(ctx, 848, 560, 2.1, {
          tool: this.tool, swing: Math.max(0, this.hit || 0), guilt: this.guilt
        });
      }
      ctx.restore();

      // HUD-шкалы
      G.panel(16, 14, 300, 158, { fill: 'rgba(10,12,16,.72)' });
      G.bar(32, 44, 268, 14, this.water / 100, { color: '#5ab6e0', label: 'Вода' });
      G.bar(32, 80, 268, 14, this.food / 100, { color: '#d8a341', label: 'Еда' });
      G.bar(32, 116, 268, 14, this.energy / 100, { color: '#6ec07a', label: 'Силы' });
      G.bar(32, 152, 268, 14, this.air(), { color: '#b8c8ff', label: 'Воздух' });

      G.panel(G.W - 316, 14, 300, 122, { fill: 'rgba(10,12,16,.72)' });
      G.bar(G.W - 300, 44, 268, 14, this.progress / 100, { color: '#ffd35e', label: 'Дырка в бочке' });
      G.bar(G.W - 300, 84, 268, 14, this.guilt / 100, { color: '#d66a6a', label: 'Стыд перед Лысым' });
      G.text('В бочке уже ' + Math.floor(this.hours) + ' ч.', G.W - 300, 124, { size: 15, color: '#c9d3de' });

      // инструмент
      const tn = this.tool === 'nail' ? 'ГВОЗДЬ (медленно, честно)' : 'ЛЫСЫЙ (быстро, но стыдно)';
      G.text('Инструмент: ' + tn, G.W / 2, 206, { size: 17, align: 'center', color: this.tool === 'nail' ? '#cfe4ff' : '#ffb3a7' });
      G.text('1 — гвоздь   2 — Лысый   S — поспать', G.W / 2, 230, { size: 14, align: 'center', color: '#9fb0c2' });

      // полоса удара
      if (this.mode === 'play' && this.sleeping <= 0) {
        const bx = 200, by = G.H - 78, bw = G.W - 400, bh = 26;
        ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(120,220,140,.85)';
        ctx.fillRect(bx + this.zone * bw, by, this.zoneW * bw, bh);
        ctx.fillStyle = '#fff';
        ctx.fillRect(bx + this.swing * bw - 2, by - 7, 4, bh + 14);
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        G.text('ПРОБЕЛ — бей', G.W / 2, G.H - 20, { size: 16, align: 'center', color: '#fff6e0' });
      }

      if (this.msgT > 0) {
        G.panel(G.W / 2 - 260, 274, 520, 48);
        G.text(this.msg, G.W / 2, 304, { size: 17, align: 'center', color: '#f2ecdf' });
      }
      if (this.sleeping > 0) {
        ctx.fillStyle = 'rgba(0,0,0,' + G.clamp(this.sleeping, 0, 0.75) + ')';
        ctx.fillRect(0, 0, G.W, G.H);
        G.text('Z-z-z...', G.W / 2, G.H / 2, { size: 40, align: 'center', color: '#cfd8e3' });
      }

      ART.vignette(ctx, 0.62 - this.air() * 0.3);

      if (this.mode === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fillRect(0, 0, G.W, G.H);
        G.text(this.deadReason, G.W / 2, 240, { size: 34, align: 'center', color: '#e8a0a0' });
        G.text('Пробел — попробовать снова', G.W / 2, 300, { size: 20, align: 'center', color: '#fff6e0' });
      }
      G.dlg.draw();
      G.chapterTitle(ctx, 4, 'Работа', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 5. Сон — стиральная машина
     ========================================================= */
  const ch5 = {
    enter: function () {
      G.unlock(5);
      this.t = 0;
      this.spin = 0;
      this.qte = null;
      this.left = 7;
      this.dizzy = 0;
      this.mode = 'intro';
      const self = this;
      G.say([
        'Он очень быстро заснул, несмотря на жару, голод и неудобное положение.',
        'Саня|Ты уже провонялся своими камнями! А ну полезай!',
        'Саня насильно засовывает его в стиральную машину и наливает в глаза средство для стирки.',
        'Держись! Нажимай стрелку, которая горит.'
      ], function () { self.mode = 'spin'; self.next(); });
    },
    next: function () {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      this.qte = { key: G.pick(keys), time: 1.5 };
    },
    update: function (dt) {
      this.t += dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }
      if (this.mode !== 'spin') return;
      this.spin += dt * 3.4;
      if (this.qte) {
        this.qte.time -= dt;
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        let pressed = null;
        keys.forEach(function (k) { if (G.just[k]) pressed = k; });
        if (pressed) {
          if (pressed === this.qte.key) { G.sfx('good'); this.left--; }
          else { G.sfx('bad'); this.dizzy = Math.min(1, this.dizzy + 0.34); }
          this.qte = null;
          if (this.left <= 0) this.wake(); else this.next();
        } else if (this.qte.time <= 0) {
          G.sfx('bad'); this.dizzy = Math.min(1, this.dizzy + 0.34);
          this.qte = null; this.next();
        }
      }
    },
    wake: function () {
      this.mode = 'wake';
      G.say([
        'Омега|А-а! ...это был сон.',
        'Он проснулся и посмотрел в дыру. Вокруг была пустыня.',
        'Омега|Ночью бочка прикатилась сюда... Кактусы! Где кактусы — там и Саня!',
        'Омега|СА-А-АНЯ! ...Ни души.'
      ], function () { G.finishChapter(5); });
    },
    draw: function (ctx) {
      const cx = G.W / 2, cy = G.H / 2;
      const spin = this.spin;

      // мы внутри барабана и крутимся вместе с ним
      const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, 580);
      g.addColorStop(0, '#7d94a6'); g.addColorStop(.45, '#46586a'); g.addColorStop(1, '#1e2833');
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);

      // перфорация барабана
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(spin * 0.3);
      for (let ring = 0; ring < 7; ring++) {
        const r = 190 + ring * 58, n = 12 + ring * 5;
        for (let i = 0; i < n; i++) {
          const a = i * 2 * Math.PI / n + ring * 0.35;
          const hx = Math.cos(a) * r, hy = Math.sin(a) * r * 0.92;
          ctx.fillStyle = 'rgba(8,12,17,.85)';
          ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(hx, hy - 1, 7, Math.PI, 0); ctx.stroke();
        }
      }
      // рёбра барабана
      ctx.strokeStyle = 'rgba(190,205,220,.25)'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = spin * 0 + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 210, Math.sin(a) * 200);
        ctx.lineTo(Math.cos(a) * 520, Math.sin(a) * 500);
        ctx.stroke();
      }
      ctx.restore();

      // люк: смотрим наружу, и мир за стеклом крутится
      const R = 178;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-spin);
      // комната Сани за стеклом
      const room = ctx.createLinearGradient(0, -420, 0, 420);
      room.addColorStop(0, '#f3f7fb'); room.addColorStop(.55, '#dbe4ee'); room.addColorStop(1, '#a9b6c4');
      ctx.fillStyle = room; ctx.fillRect(-460, -460, 920, 920);
      ctx.fillStyle = '#9aa7b5';
      for (let i = -5; i <= 5; i++) {
        ctx.fillRect(-460, i * 70, 920, 3);
        ctx.fillRect(i * 70, -460, 3, 920);
      }
      ctx.fillStyle = '#8492a1'; ctx.fillRect(-460, 150, 920, 310);
      ART.cactus(ctx, -170, 176, 0.8, { pot: true, flower: true });
      ART.sanya(ctx, 52, 168, 1.9, { flip: true });
      ctx.restore();
      // мутное стекло и блик
      ctx.fillStyle = 'rgba(190,220,238,.16)';
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath();
      ctx.ellipse(cx - 58, cy - 62, 62, 38, -0.7 + spin * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // резинка люка
      const seal = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      seal.addColorStop(0, '#2f3742'); seal.addColorStop(.5, '#59636f'); seal.addColorStop(1, '#1d232b');
      ctx.strokeStyle = seal; ctx.lineWidth = 30;
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.stroke();

      // вода с порошком плещется вокруг нас
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(spin);
      ctx.fillStyle = 'rgba(150,200,225,.5)';
      ctx.beginPath();
      ctx.moveTo(-600, 150 + Math.sin(this.t * 4) * 10);
      for (let x = -600; x <= 600; x += 40) {
        ctx.lineTo(x, 150 + Math.sin(x * 0.02 + this.t * 5) * 16);
      }
      ctx.lineTo(600, 600); ctx.lineTo(-600, 600); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 26; i++) {
        const a = this.t * 1.6 + i * 1.7;
        const bx = Math.cos(a) * (90 + (i % 6) * 62);
        const by = Math.sin(a * 1.2) * (80 + (i % 5) * 58);
        const r2 = 6 + (i % 4) * 5;
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.beginPath(); ctx.arc(bx, by, r2, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(bx - r2 * .3, by - r2 * .35, r2 * .3, 0, 7); ctx.fill();
      }
      ctx.restore();

      // держимся руками за барабан
      ART.handFP(ctx, 186, 572, 2.3, { tool: 'none', swing: 0.12 + Math.sin(this.t * 6) * 0.05 });
      ctx.save();
      ctx.translate(G.W, 0); ctx.scale(-1, 1);
      ART.handFP(ctx, 176, 578, 2.3, { tool: 'none', swing: 0.1 + Math.cos(this.t * 6) * 0.05 });
      ctx.restore();

      // порошок в глазах
      ctx.fillStyle = 'rgba(230,255,235,.4)';
      for (let i = 0; i < 5; i++) {
        const a = i * 1.9 + Math.sin(this.t + i) * 0.2;
        const px2 = cx + Math.cos(a) * 420, py2 = cy + Math.sin(a) * 250;
        ctx.beginPath();
        ctx.ellipse(px2, py2, 60 + Math.sin(this.t * 2 + i) * 8, 42, a, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.qte) {
        const arrow = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[this.qte.key];
        G.panel(cx - 60, 36, 120, 90, { fill: 'rgba(14,18,26,.9)' });
        G.text(arrow, cx, 104, { size: 62, align: 'center', color: '#ffe9b0' });
        G.bar(cx - 50, 118, 100, 8, this.qte.time / 1.5, { color: '#ffd35e' });
      }
      G.text('Осталось продержаться: ' + this.left, G.W - 30, 40, { size: 17, align: 'right', color: '#eaf2fa' });

      if (this.dizzy > 0) {
        ctx.fillStyle = 'rgba(120,200,120,' + this.dizzy * 0.35 + ')';
        ctx.fillRect(0, 0, G.W, G.H);
      }
      ART.vignette(ctx, .45);
      G.dlg.draw();
      G.chapterTitle(ctx, 5, 'Сон', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 6. Кактус — тянем руку через дырку
     ========================================================= */
  const ch6 = {
    enter: function () {
      this.t = 0;
      this.water = 8; this.food = 14; this.balid = 0;
      this.mode = 'grab';
      this.marker = 0; this.dir = 1;
      this.newZones();
      this.hurt = 0;
      this.piece = null;
      this.count = 0;
      G.say([
        'Вдруг он увидел кактус прямо рядом с дыркой. Тёмно-зелёный, и на нём цветочек.',
        'Омега|Ну ладно... Саня, не смотри.',
        'Хватай кактус за мякоть (зелёное), не за колючки (красное). Пробел.'
      ]);
    },
    newZones: function () {
      this.zones = [];
      const n = 3 + Math.floor(Math.random() * 2);
      let x = 0.03;
      for (let i = 0; i < n; i++) {
        const w = G.rnd(0.10, 0.20);
        this.zones.push({ a: x, b: x + w, good: i % 2 === (Math.random() < 0.5 ? 0 : 1) });
        x += w + G.rnd(0.03, 0.09);
        if (x > 0.92) break;
      }
      if (!this.zones.some(function (z) { return z.good; })) this.zones[0].good = true;
    },
    update: function (dt) {
      this.t += dt;
      if (this.hurt > 0) this.hurt -= dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }

      if (this.mode === 'grab') {
        this.marker += this.dir * dt * (0.6 + this.count * 0.045);
        if (this.marker > 1) { this.marker = 1; this.dir = -1; }
        if (this.marker < 0) { this.marker = 0; this.dir = 1; }
        if (G.just['Space'] || G.mouse.click) {
          const m = this.marker;
          let z = null;
          for (let i = 0; i < this.zones.length; i++) {
            if (m >= this.zones[i].a && m <= this.zones[i].b) { z = this.zones[i]; break; }
          }
          if (z && z.good) {
            G.sfx('good');
            this.count++;
            this.piece = true;
            this.mode = 'use';
          } else {
            G.sfx('bad');
            this.hurt = 0.6;
            this.newZones();
          }
        }
      } else if (this.mode === 'use') {
        let done = false;
        if (G.just['Digit1'] || (G.hit(120, 436, 220, 60) && G.mouse.click)) {
          this.water = G.clamp(this.water + 17, 0, 100); G.sfx('drip'); done = true;
        } else if (G.just['Digit2'] || (G.hit(370, 436, 220, 60) && G.mouse.click)) {
          this.food = G.clamp(this.food + 20, 0, 100); G.sfx('blip'); done = true;
        } else if (G.just['Digit3'] || (G.hit(620, 436, 220, 60) && G.mouse.click)) {
          this.balid = G.clamp(this.balid + 26, 0, 100); G.sfx('drip'); done = true;
        }
        if (done) {
          this.piece = null;
          this.newZones();
          this.mode = 'grab';
          if (this.water >= 100 && this.food >= 100 && this.balid >= 60) this.finish();
        }
      }
    },
    finish: function () {
      this.mode = 'end';
      G.say([
        'Вода была тёплая, со слизкими частичками мякоти. Ему стало хорошо.',
        'Омега|Ну, нормально. Как кабачок.',
        'Он увлажнил Лысого мякотью и поставил обратно в карман.',
        'Омега|Только Сане не скажу. Никогда.',
        'Теперь он был сыт и доволен. Только жарко было и спина болела.'
      ], function () { G.finishChapter(6); });
    },
    draw: function (ctx) {
      // вид изнутри бочки на дырку
      ART.barrelInside(ctx, this.t);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(G.W / 2, 214, 300, 186, 0, 0, Math.PI * 2);
      ctx.clip();
      ART.desertBg(ctx, this.t);
      ART.cactus(ctx, G.W / 2 - 200, 386, 0.9, { flower: true });
      ART.cactus(ctx, G.W / 2 + 205, 396, 0.75, {});
      ctx.restore();
      const rim = ctx.createLinearGradient(0, 20, 0, 400);
      rim.addColorStop(0, '#5a3d22'); rim.addColorStop(1, '#231609');
      ctx.strokeStyle = rim; ctx.lineWidth = 28;
      ctx.beginPath(); ctx.ellipse(G.W / 2, 214, 300, 186, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,228,170,.25)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(G.W / 2, 214, 286, 173, 0, 0, Math.PI * 2); ctx.stroke();

      // кактус крупным планом с зонами
      const cx = G.W / 2, cy = 352;
      ART.cactus(ctx, cx, cy, 1.3, { flower: true });
      if (this.mode === 'grab') {
        const bx = cx - 210, bw = 420, by = 386, bh = 26;
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh);
        this.zones.forEach(function (z) {
          ctx.fillStyle = z.good ? 'rgba(110,210,130,.9)' : 'rgba(220,90,80,.9)';
          ctx.fillRect(bx + z.a * bw, by, (z.b - z.a) * bw, bh);
        });
        ctx.fillStyle = '#fff';
        ctx.fillRect(bx + this.marker * bw - 2, by - 8, 4, bh + 16);
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        G.text('зелёное — мякоть, красное — колючки (пробел)', cx, by - 16, { size: 15, align: 'center', color: '#e6eef8' });
      }

      // шкалы
      G.panel(16, 14, 280, 128, { fill: 'rgba(10,12,16,.72)' });
      G.bar(32, 44, 248, 14, this.water / 100, { color: '#5ab6e0', label: 'Вода' });
      G.bar(32, 84, 248, 14, this.food / 100, { color: '#d8a341', label: 'Еда' });
      G.bar(32, 124, 248, 14, this.balid / 100, { color: '#c05a4a', label: 'Влага для Лысого' });
      G.text('Сорвано кактусов: ' + this.count, G.W - 30, 40, { size: 16, align: 'right', color: '#cfd8e3' });

      if (this.mode === 'use') {
        G.panel(100, 404, 760, 104, { fill: 'rgba(14,18,26,.95)' });
        G.text('Что сделать с мякотью?', G.W / 2, 428, { size: 16, align: 'center', color: '#fff6e0' });
        G.btn(120, 436, 220, 60, '1. Выпить воду');
        G.btn(370, 436, 220, 60, '2. Съесть мякоть');
        G.btn(620, 436, 220, 60, '3. Полить Лысого');
      }
      if (this.hurt > 0) {
        ctx.fillStyle = 'rgba(220,80,70,' + this.hurt * 0.4 + ')';
        ctx.fillRect(0, 0, G.W, G.H);
        G.text('Ай! Заноза!', G.W / 2, 180, { size: 30, align: 'center', color: '#ffd6d0' });
      }
      ART.vignette(ctx, .5);
      G.dlg.draw();
      G.chapterTitle(ctx, 6, 'Кактус', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 7. Возвращение — бочка разбилась, разгибаемся
     ========================================================= */
  const ch7 = {
    enter: function () {
      this.t = 0;
      this.mode = 'roll';
      this.rollT = 0;
      this.vert = 0;         // разогнутых позвонков
      this.hold = 0;
      this.holding = false;
      this.zoneA = 0.62; this.zoneB = 0.82;
      this.pain = 0;
      G.say([
        'Он ударил бочку гвоздём, и она снова покатилась. Бочка начала биться о камни.',
        'Крышка была сломана и почти не держалась. Он надавил — и она открылась!'
      ]);
    },
    update: function (dt) {
      this.t += dt;
      if (this.pain > 0) this.pain -= dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }

      if (this.mode === 'roll') {
        this.rollT += dt;
        if (this.rollT > 2.6) {
          this.mode = 'stretch';
          G.say([
            'Он резко встал — и упал на песок. Голова закружилась.',
            'Омега|Надо постепенно. По одному позвонку.',
            'Держи ПРОБЕЛ и отпусти, когда полоска будет в зелёной зоне. Медленно!'
          ]);
        }
      } else if (this.mode === 'stretch') {
        const down = G.keys['Space'] || G.mouse.down;
        if (down) { this.holding = true; this.hold += dt * 0.55; }
        else if (this.holding) {
          this.holding = false;
          if (this.hold >= this.zoneA && this.hold <= this.zoneB) {
            this.vert++;
            G.sfx('good');
            if (this.vert >= 5) { this.done(); return; }
            this.zoneA = G.rnd(0.35, 0.72); this.zoneB = this.zoneA + G.rnd(0.12, 0.2);
          } else {
            this.pain = 0.6; G.sfx('hit');
          }
          this.hold = 0;
        }
        if (this.hold > 1) { this.hold = 0; this.holding = false; this.pain = 0.6; G.sfx('hit'); }
      }
    },
    done: function () {
      this.mode = 'up';
      G.say([
        'Вскоре спина перестала болеть. Он наконец выпрямился во весь рост!',
        'Омега|Я... я стою! Я бегаю!',
        'Вдали он увидел лес.',
        'Омега|Там моё логово. И Саня.'
      ], function () { G.go('ch7b'); });
    },
    draw: function (ctx) {
      ART.desertBg(ctx, this.t);
      if (this.mode === 'roll') {
        const x = -100 + this.rollT * 330;
        ART.barrel(ctx, Math.min(x, 520), 400, 1, { rot: this.rollT * 4, hole: 0.7 });
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = 'rgba(200,170,120,' + (0.5 - i * 0.07) + ')';
          ctx.beginPath(); ctx.arc(Math.min(x, 520) - 40 - i * 26, 460, 10 + i * 3, 0, 7); ctx.fill();
        }
      } else {
        ART.barrel(ctx, 760, 430, 0.9, { rot: 1.5, hole: 1 });
        const stand = this.mode === 'up';
        const crouchScale = stand ? 0 : 1;
        ART.omega(ctx, 380, 470, 1.5, {
          pose: stand ? 'stand' : (this.vert >= 3 ? 'crouch' : 'ball'),
          dirty: true
        });
        ART.stone(ctx, 452, 492, 16, DATA.balid.color, { face: true });
        if (this.mode === 'stretch') {
          const bx = G.W / 2 - 180, by = G.H - 110, bw = 360, bh = 26;
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(120,220,140,.85)';
          ctx.fillRect(bx + this.zoneA * bw, by, (this.zoneB - this.zoneA) * bw, bh);
          ctx.fillStyle = '#ffd35e';
          ctx.fillRect(bx, by, G.clamp(this.hold, 0, 1) * bw, bh);
          ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);
          G.text('Позвонок ' + (this.vert + 1) + ' из 5 — держи и отпусти в зелёной зоне', G.W / 2, by - 14,
            { size: 17, align: 'center', color: '#fff6e0' });
          void crouchScale;
        }
      }
      if (this.pain > 0) {
        G.text('ХРУСТЬ!', G.W / 2, 200, { size: 42, align: 'center', color: '#ff9d9d' });
      }
      G.dlg.draw();
      G.chapterTitle(ctx, 7, 'Возвращение', this.t);
    }
  };

  /* ---------- 7б: возвращение в лес и разговор с Саней ---------- */
  const ch7b = {
    enter: function () {
      this.t = 0;
      G.say([
        'Через пять минут он добрался до леса. У входа в логово сидели бобры.',
        'Омега|Бобры? Ну и ладно.',
        'Камни ласково приветствовали его. Он обнялся со своими камнями и пошёл к Сане.',
        'Омега|Саня, знаешь, что со мной случилось?!',
        'Саня|Я это всё поделал.',
        'Омега|Что ты поделал?! Бобров мне у входа поставил?',
        'Саня|Нет. Я нашёл камень, поставил на дерево, поставил бочку. Ты туда попался — я её катил. А ты даже не заметил.',
        'Саня|Ну что, теперь признаёшь? Кактусы лучше камней. Ты же их ел и пил из них воду.',
        'Омега|Нет, не признаю! Камень меня успокаивал и давал надежду. И его тоже можно съесть — просто мне его жалко.',
        'Саня|Пошёл нафиг, лысая свинья!',
        'Омега|Ну и пошёл ты тоже нафиг!',
        'И они больше не дружили.'
      ], function () { G.finishChapter(7); });
    },
    update: function (dt) { this.t += dt; G.dlg.update(dt); },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      ART.tree(ctx, 120, 400, 1.1); ART.tree(ctx, 860, 396, 1);
      ctx.fillStyle = '#3a2c1e';
      ctx.beginPath(); ctx.ellipse(200, 420, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
      ART.beaver(ctx, 260, 440, 0.8); ART.beaver(ctx, 150, 452, 0.7);
      ART.omega(ctx, 430, 470, 1.3, { dirty: true });
      ART.sanya(ctx, 640, 470, 1.3, { flip: true, smug: true });
      ART.cactus(ctx, 790, 470, 0.6, { pot: true, flower: true });
      G.dlg.draw();
    }
  };

  G.addScene('ch4', ch4);
  G.addScene('ch5', ch5);
  G.addScene('ch6', ch6);
  G.addScene('ch7', ch7);
  G.addScene('ch7b', ch7b);
})();
