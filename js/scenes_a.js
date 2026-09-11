/* ============================================================
   Главы 1-3: логово и поиск камней, спор с Саней, дерево и бочка
   ============================================================ */
(function () {

  /* =========================================================
     ГЛАВА 1. Омега и его камни — поиск редких камней
     ========================================================= */
  const ch1 = {
    enter: function () {
      this.t = 0;
      this.mode = 'walk';
      this.player = { x: 140, y: 440, frame: 0, flip: false };
      this.spots = [
        { x: 205, y: 470, name: 'песок', hint: 'Копать в песке' },
        { x: 505, y: 415, name: 'речка', hint: 'Пошарить в речке' },
        { x: 795, y: 500, name: 'гора',  hint: 'Лазить по горе' }
      ];
      this.found = [];
      this.pool = G.shuffle(DATA.stonePool.slice(0, 14));
      this.needle = 0; this.dir = 1; this.zone = 0; this.zoneW = 0;
      this.card = null;
      this.msg = '';
      this.msgT = 0;
      this.near = null;
      this.intro = true;
      G.say([
        'Омега жил в лесу. У него там было логово — совсем незаметное, со ступеньками.',
        'Омега|Сегодня найду редких камней! Пять штук, не меньше.',
        'Ходи по лесу (← →, ↑ ↓) и ищи камни в песке, в речке и на горе. Пробел — искать.'
      ], (function () { this.intro = false; }).bind(this));
    },

    update: function (dt) {
      this.t += dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }
      if (this.msgT > 0) this.msgT -= dt;

      if (this.mode === 'walk') {
        const p = this.player;
        let dx = 0, dy = 0;
        if (G.keys['ArrowLeft'] || G.keys['KeyA']) dx -= 1;
        if (G.keys['ArrowRight'] || G.keys['KeyD']) dx += 1;
        if (G.keys['ArrowUp'] || G.keys['KeyW']) dy -= 1;
        if (G.keys['ArrowDown'] || G.keys['KeyS']) dy += 1;
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1;
          p.x = G.clamp(p.x + dx / len * 190 * dt, 40, G.W - 40);
          p.y = G.clamp(p.y + dy / len * 130 * dt, 392, 512);
          p.frame += dt * 11;
          if (dx) p.flip = dx < 0;
        } else p.frame = 0;

        // ближайшее место поиска
        this.near = null;
        for (let i = 0; i < this.spots.length; i++) {
          const s = this.spots[i];
          if (Math.hypot(s.x - p.x, s.y - p.y) < 70) { this.near = s; break; }
        }
        const atLair = p.x > G.W - 130 && p.y < 430;
        this.atLair = atLair;

        if (this.near && (G.just['Space'] || G.just['KeyE'])) this.startDig();
        else if (atLair && this.found.length >= 5 && G.just['Space']) {
          G.go('lair', { stones: this.found });
        }
      } else if (this.mode === 'dig') {
        this.needle += this.dir * dt * 1.55;
        if (this.needle > 1) { this.needle = 1; this.dir = -1; }
        if (this.needle < 0) { this.needle = 0; this.dir = 1; }
        if (G.just['Space'] || G.mouse.click) {
          const ok = this.needle > this.zone && this.needle < this.zone + this.zoneW;
          if (ok) {
            const st = this.pool.pop() || { name: 'Безымянный', color: '#8a8f99', note: 'просто камень' };
            st.group = G.pick(DATA.groups);
            this.found.push(st);
            this.card = st;
            this.mode = 'card';
            G.sfx('good');
          } else {
            this.mode = 'walk';
            this.msg = G.pick(['Просто грязь...', 'Опять не то. Обычный булыжник.', 'Мимо! Это вообще коряга.']);
            this.msgT = 1.8;
            G.sfx('bad');
          }
        }
      } else if (this.mode === 'card') {
        if (G.just['Space'] || G.mouse.click) {
          this.mode = 'walk';
          this.card = null;
          if (this.found.length === 5) {
            this.msg = 'Пять камней! Пора домой — логово справа вверху.';
            this.msgT = 4;
          }
        }
      }
    },

    startDig: function () {
      this.mode = 'dig';
      this.needle = 0; this.dir = 1;
      this.zoneW = G.clamp(0.30 - this.found.length * 0.035, 0.12, 0.3);
      this.zone = G.rnd(0.08, 0.92 - this.zoneW);
      G.sfx('step');
    },

    draw: function (ctx) {
      ART.forestBg(ctx, this.t);

      // песок
      ctx.fillStyle = '#e2c58b';
      ctx.beginPath(); ctx.ellipse(205, 475, 92, 36, 0, 0, Math.PI * 2); ctx.fill();
      // речка
      ctx.fillStyle = '#5aa8d8';
      ctx.beginPath();
      ctx.moveTo(380, 396); ctx.quadraticCurveTo(505, 372, 640, 400);
      ctx.quadraticCurveTo(505, 442, 380, 420); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x = 410 + i * 60 + Math.sin(this.t * 2 + i) * 6;
        ctx.beginPath(); ctx.moveTo(x, 404); ctx.lineTo(x + 22, 404); ctx.stroke();
      }
      // гора
      ctx.fillStyle = '#8d8779';
      ctx.beginPath(); ctx.moveTo(700, 512); ctx.lineTo(800, 420); ctx.lineTo(900, 512); ctx.fill();
      ctx.fillStyle = '#a49d8d';
      ctx.beginPath(); ctx.moveTo(760, 466); ctx.lineTo(800, 420); ctx.lineTo(840, 466); ctx.fill();

      // деревья
      ART.tree(ctx, 80, 400, 1); ART.tree(ctx, 320, 392, .9); ART.tree(ctx, 620, 386, .8);

      // вход в логово
      ctx.fillStyle = '#3a2c1e';
      ctx.beginPath(); ctx.ellipse(G.W - 80, 400, 46, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#53422f';
      ctx.fillRect(G.W - 118, 396, 76, 8);
      G.text('логово', G.W - 80, 372, { size: 14, align: 'center', color: '#ffe9b0' });

      // подсказки у мест
      const self = this;
      this.spots.forEach(function (s) {
        const glow = 0.5 + 0.5 * Math.sin(self.t * 3 + s.x);
        ctx.fillStyle = 'rgba(255,235,150,' + (0.25 + glow * 0.35) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y - 8, 12 + glow * 4, 0, Math.PI * 2); ctx.fill();
        G.text(s.name, s.x, s.y - 30, { size: 14, align: 'center', color: '#fff6e0' });
      });

      const p = this.player;
      const sc = 0.75 + (p.y - 392) / 420;
      ART.omega(ctx, p.x, p.y, sc, { pose: p.frame ? 'walk' : 'stand', frame: p.frame, flip: p.flip });

      // HUD
      G.panel(18, 16, 250, 52, { fill: 'rgba(14,18,26,.7)' });
      G.text('Найдено камней: ' + this.found.length + ' / 5', 34, 48, { size: 20, color: '#ffe9b0' });
      for (let i = 0; i < this.found.length; i++) {
        ART.stone(ctx, 290 + i * 34, 44, 13, this.found[i].color, { face: true, seed: i });
      }

      if (this.mode === 'walk') {
        if (this.near) {
          G.text('[Пробел] ' + this.near.hint, G.W / 2, G.H - 40, { size: 20, align: 'center', color: '#fff6e0' });
        } else if (this.atLair && this.found.length >= 5) {
          G.text('[Пробел] Зайти в логово', G.W / 2, G.H - 40, { size: 20, align: 'center', color: '#ffe9b0' });
        } else if (this.atLair) {
          G.text('Сначала найди 5 камней', G.W / 2, G.H - 40, { size: 18, align: 'center', color: '#e8d8b0' });
        }
        if (this.msgT > 0) {
          G.panel(G.W / 2 - 220, 92, 440, 44);
          G.text(this.msg, G.W / 2, 121, { size: 18, align: 'center', color: '#fff6e0' });
        }
      }

      if (this.mode === 'dig') {
        const bx = G.W / 2 - 220, by = 380, bw = 440, bh = 34;
        G.panel(bx - 20, by - 60, bw + 40, bh + 100, { fill: 'rgba(14,18,26,.9)' });
        G.text('Ищи камень: останови стрелку в жёлтой зоне (пробел)', G.W / 2, by - 24, { size: 17, align: 'center', color: '#fff6e0' });
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(255,215,90,.85)';
        ctx.fillRect(bx + this.zone * bw, by, this.zoneW * bw, bh);
        ctx.fillStyle = '#fff';
        ctx.fillRect(bx + this.needle * bw - 2, by - 8, 4, bh + 16);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
      }

      if (this.mode === 'card' && this.card) {
        G.panel(G.W / 2 - 200, 140, 400, 260);
        G.text('НОВЫЙ КАМЕНЬ!', G.W / 2, 184, { size: 24, align: 'center', color: '#ffd98a' });
        ART.stone(ctx, G.W / 2, 262, 44, this.card.color, { face: true, stripes: this.card.stripes });
        G.text(this.card.name, G.W / 2, 330, { size: 26, align: 'center', color: '#fff6e0' });
        G.text('группа: ' + this.card.group, G.W / 2, 358, { size: 17, align: 'center', color: '#a8d8a8' });
        G.text(this.card.note, G.W / 2, 382, { size: 15, align: 'center', color: '#c9d3de' });
      }

      G.dlg.draw();
      G.chapterTitle(ctx, 1, 'Омега и его камни', this.t);
    }
  };

  /* =========================================================
     Логово — маленькая сцена-экскурсия, финал главы 1
     ========================================================= */
  const lair = {
    enter: function (p) {
      this.t = 0;
      this.stones = (p && p.stones) || [];
      const s = this.stones;
      G.save.stones = (G.save.stones || []).concat(s.map(function (x) {
        return { name: x.name, color: x.color, group: x.group, stripes: x.stripes };
      }));
      G.store();
      G.say([
        'В логове было множество камней: какие-то висели на виселице, какие-то сидели за столом, какие-то просто валялись.',
        'Омега|Так, лентяи! Кто на меня посмотрит — сразу на виселицу.',
        'Камни|...',
        'Омега|А ты, Лысый, иди сюда. Ты со мной спишь, ты со мной ешь. Тебя я на виселицу никогда не поставлю.',
        'У Омеги была целая цивилизация камней.'
      ], function () { G.finishChapter(1); });
    },
    update: function (dt) { this.t += dt; G.dlg.update(dt); },
    draw: function (ctx) {
      ART.lairBg(ctx, this.t);
      ART.hangman(ctx, 120, 400, 1, [
        { color: '#4f9e5a' }, { color: '#8a8f99' }, { color: '#6e6257' }
      ]);
      ART.table(ctx, 470, 380, 1, this.stones.slice(0, 5).concat([{ color: '#c2a45c' }]));
      ART.cage(ctx, 820, 440, 1, 2);
      G.text('виселица', 175, 430, { size: 13, align: 'center', color: '#c9b08a' });
      G.text('стол', 470, 452, { size: 13, align: 'center', color: '#c9b08a' });
      G.text('тюрьма', 820, 460, { size: 13, align: 'center', color: '#c9b08a' });
      ART.omega(ctx, 640, 440, 1.1, { pose: 'stand' });
      ART.stone(ctx, 690, 430, 16, DATA.balid.color, { face: true });
      G.text('Лысый', 690, 400, { size: 13, align: 'center', color: '#ffb3a7' });
      ART.vignette(ctx, .5);
      G.dlg.draw();
    }
  };

  /* =========================================================
     ГЛАВА 2. Споры с Саней — словесная дуэль
     ========================================================= */
  const ch2 = {
    enter: function () {
      this.t = 0;
      this.rounds = G.shuffle(DATA.debate).slice(0, 5);
      this.i = 0;
      this.pridO = 100; this.pridS = 100;
      this.mode = 'intro';
      this.cards = [];
      this.flash = 0; this.flashColor = '';
      this.result = '';
      G.say([
        'У Омеги был друг Санёк. У него была коллекция кактусов: Кактус 1, Кактус 2... а любимый — 4,6.',
        'Саня|Ну что, признаёшь уже, что кактусы лучше камней?',
        'Омега|Никогда!',
        'Выбирай контраргумент по теме, которую поднял Саня. Клик или клавиши 1 / 2 / 3.'
      ], (function () { this.startRound(); }).bind(this));
    },
    startRound: function () {
      if (this.i >= this.rounds.length) { this.finish(); return; }
      const r = this.rounds[this.i];
      this.cards = G.shuffle(r.cards);
      this.mode = 'play';
    },
    answer: function (card) {
      const r = this.rounds[this.i];
      if (card.t === r.topic) {
        this.pridS = Math.max(0, this.pridS - 24);
        this.flash = 0.5; this.flashColor = 'rgba(120,220,140,.35)';
        G.sfx('good');
        G.say(['Омега|' + card.text, 'Саня|Э-э... ну... зато!..'], (function () { this.i++; this.startRound(); }).bind(this));
      } else {
        this.pridO = Math.max(0, this.pridO - 20);
        this.flash = 0.5; this.flashColor = 'rgba(230,120,110,.35)';
        G.sfx('bad');
        G.say(['Омега|' + card.text, 'Саня|Чё? Это вообще не про то. Я тебе про другое говорю!'], (function () { this.i++; this.startRound(); }).bind(this));
      }
    },
    finish: function () {
      this.mode = 'end';
      let lines;
      if (this.pridS <= 0) {
        lines = ['Саня|Ладно... ЛАДНО! Но я всё равно не признаю!',
                 'Так они спорят, и никто никогда не выигрывает.'];
      } else if (this.pridO <= 0) {
        lines = ['Омега|Я... я не признаю! Просто аргументы кончились!',
                 'Так они спорят, и никто никогда не выигрывает.'];
      } else {
        lines = ['Саня|Ничья, что ли?', 'Омега|Никакая не ничья. Завтра продолжим.',
                 'Каждый приводит ещё аргументы, и никто не хочет признавать, что он проиграл.'];
      }
      G.say(lines, function () { G.finishChapter(2); });
    },
    update: function (dt) {
      this.t += dt;
      if (this.flash > 0) this.flash -= dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }
      if (this.mode !== 'play') return;
      const keys = ['Digit1', 'Digit2', 'Digit3'];
      for (let i = 0; i < this.cards.length; i++) {
        if (G.just[keys[i]]) { this.answer(this.cards[i]); return; }
      }
      for (let i = 0; i < this.cards.length; i++) {
        const y = 300 + i * 68;
        if (G.hit(60, y, G.W - 120, 60) && G.mouse.click) { this.answer(this.cards[i]); return; }
      }
    },
    draw: function (ctx) {
      // логово Сани
      ctx.fillStyle = '#2e2a20'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.fillStyle = '#3e3627'; ctx.fillRect(0, 120, G.W, G.H - 120);
      ctx.fillStyle = ART.skyGrad(ctx, '#8fd3e8', '#c6e6cf', 120); ctx.fillRect(0, 0, G.W, 120);
      ctx.fillStyle = '#5aa05f'; ctx.fillRect(0, 104, G.W, 20);
      for (let i = 0; i < 6; i++) ART.cactus(ctx, 70 + i * 165, 268, 0.5 + (i % 3) * 0.12, { pot: true, flower: i % 2 === 0 });
      ART.omega(ctx, 250, 262, 1.15, {});
      ART.sanya(ctx, 700, 262, 1.15, { flip: true, smug: true });

      // шкалы гордости
      G.bar(60, 40, 300, 18, this.pridO / 100, { color: '#6ec07a', label: 'Гордость Омеги' });
      G.bar(G.W - 360, 40, 300, 18, this.pridS / 100, { color: '#d8b341', label: 'Гордость Сани' });

      if (this.mode === 'play') {
        const r = this.rounds[this.i];
        G.panel(60, 190, G.W - 120, 84, { fill: 'rgba(14,18,26,.92)' });
        G.text('Саня:', 80, 218, { size: 15, color: '#ffd98a' });
        G.wrap(r.sanya, G.W - 180, 20).forEach(function (l, i) {
          G.text(l, 80, 244 + i * 24, { size: 20, color: '#f2ecdf' });
        });
        G.text('тема: ' + r.topic, G.W - 90, 218, { size: 14, align: 'right', color: '#9fd8a8' });
        const self = this;
        this.cards.forEach(function (c, i) {
          const y = 300 + i * 68;
          const hov = G.hit(60, y, G.W - 120, 60);
          G.panel(60, y, G.W - 120, 60, {
            fill: hov ? 'rgba(60,84,56,.95)' : 'rgba(20,26,34,.9)',
            stroke: hov ? '#ffe9b0' : 'rgba(255,225,160,.35)'
          });
          G.text((i + 1) + '.', 80, y + 38, { size: 20, color: '#ffd98a' });
          const lines = G.wrap(c.text, G.W - 220, 18);
          lines.slice(0, 2).forEach(function (l, k) {
            G.text(l, 110, y + (lines.length > 1 ? 26 : 37) + k * 22, { size: 18, color: '#f2ecdf' });
          });
        });
        G.text('Раунд ' + (this.i + 1) + ' из ' + this.rounds.length, G.W / 2, 526, { size: 15, align: 'center', color: '#c9d3de' });
      }

      if (this.flash > 0) {
        ctx.fillStyle = this.flashColor;
        ctx.globalAlpha = G.clamp(this.flash * 2, 0, 1);
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.globalAlpha = 1;
      }
      G.dlg.draw();
      G.chapterTitle(ctx, 2, 'Споры с Саней', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 3. Бочка — лезем на дерево за редким камнем
     ========================================================= */
  const ch3 = {
    enter: function () {
      this.t = 0;
      this.mode = 'climb';
      this.height = 0;          // 0..100
      this.x = 0;               // -70..70 от ствола
      this.hits = 0;
      this.dirty = false;
      this.shake = 0;
      this.branches = [];
      this.scroll = 0;
      this.fall = 0;
      for (let i = 0; i < 26; i++) this.spawnBranch(i);
      G.say([
        'Вдруг Омега увидел на дереве продолговатый камень с блестящими розовыми полосочками.',
        'Омега|Вот это редкость! Уже придумываю ему имя...',
        'Лезь вверх: ← → уклоняйся от веток. Пробел — рывок вверх.'
      ]);
    },
    spawnBranch: function (i) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.branches.push({
        y: 560 - i * 160,
        side: side,
        len: G.rnd(50, 96),
        cherry: Math.random() < 0.55,
        hit: false
      });
    },
    update: function (dt) {
      this.t += dt;
      if (this.shake > 0) this.shake -= dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }

      if (this.mode === 'climb') {
        const speed = (G.keys['Space'] ? 150 : 92);
        this.height += dt * speed / 12;
        this.scroll += dt * speed;
        if (G.keys['ArrowLeft'] || G.keys['KeyA']) this.x -= dt * 220;
        if (G.keys['ArrowRight'] || G.keys['KeyD']) this.x += dt * 220;
        this.x = G.clamp(this.x, -78, 78);

        const py = 380;
        const self = this;
        this.branches.forEach(function (b) {
          const by = b.y + self.scroll;
          if (!b.hit && Math.abs(by - py) < 18) {
            const bx0 = b.side < 0 ? -b.len : 0;
            const bx1 = b.side < 0 ? 0 : b.len;
            if (self.x + 14 > bx0 && self.x - 14 < bx1) {
              b.hit = true;
              if (b.cherry) { self.dirty = true; G.sfx('drip'); }
              else {
                self.hits++;
                self.height = Math.max(0, self.height - 8);
                self.shake = 0.35;
                G.sfx('hit');
              }
            }
          }
        });
        if (this.height >= 100) {
          this.mode = 'top';
          G.say([
            'Омега|Достал! Розовые полосочки... Назову тебя Лысая свинья!',
            'Вдруг ветка сломалась, и он упал вниз.'
          ], (function () { this.mode = 'fall'; this.fall = 0; }).bind(this));
        }
      } else if (this.mode === 'fall') {
        this.fall += dt;
        if (this.fall > 1.6) {
          this.mode = 'barrel';
          G.sfx('bad');
          G.say([
            'Он оказался в какой-то бочке.',
            'Не успел он прийти в сознание, как дунул сильный ветер, и бочка сквозняком захлопнулась.',
            'Омега|Эй! ЭЙ! Откройте! Я тут!',
            'Крышка была прибита гвоздями. Бочка покатилась, и его растрясло.'
          ], function () { G.finishChapter(3); });
        }
      }
    },
    draw: function (ctx) {
      ctx.save();
      if (this.shake > 0) ctx.translate(G.rnd(-6, 6), G.rnd(-6, 6));
      ctx.fillStyle = ART.skyGrad(ctx, '#7fc6e8', '#cfeacd');
      ctx.fillRect(0, 0, G.W, G.H);
      // облака
      for (let i = 0; i < 5; i++) {
        const cy = ((i * 190 + this.scroll * 0.25) % 700) - 80;
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath();
        ctx.ellipse(120 + i * 180, cy, 54, 22, 0, 0, Math.PI * 2); ctx.fill();
      }
      const cx = G.W / 2;
      // ствол
      ctx.fillStyle = '#4a3421';
      ctx.fillRect(cx - 90, 0, 180, G.H);
      ctx.strokeStyle = 'rgba(20,12,6,.4)'; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const y0 = ((i * 120 + this.scroll) % (G.H + 200)) - 100;
        ctx.beginPath(); ctx.moveTo(cx - 70 + i * 20, y0); ctx.lineTo(cx - 60 + i * 20, y0 + 90); ctx.stroke();
      }
      // ветки
      const self = this;
      this.branches.forEach(function (b) {
        const by = b.y + self.scroll;
        if (by < -60 || by > G.H + 60) return;
        ctx.strokeStyle = b.hit ? '#6d5333' : '#3c2a18';
        ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, by);
        ctx.lineTo(cx + b.side * b.len, by - 12);
        ctx.stroke();
        if (b.cherry) {
          ctx.fillStyle = '#b8283f';
          ctx.beginPath(); ctx.arc(cx + b.side * b.len, by - 6, 8, 0, 7); ctx.fill();
          ctx.fillStyle = '#2f7d43';
          ctx.fillRect(cx + b.side * b.len - 1, by - 20, 2, 8);
        }
      });
      // камень на вершине
      if (this.height > 72) {
        const ty = 380 - (100 - this.height) * 8;
        ART.stone(ctx, cx + 40, ty - 120, 18, '#d38fb0', { stripes: '#f6d0e0', shadow: false });
      }

      if (this.mode === 'fall') {
        const y = 120 + this.fall * this.fall * 300;
        ART.omega(ctx, cx + 20, Math.min(y, 470), 1.1, { pose: 'ball', dirty: this.dirty });
        if (y > 380) ART.barrel(ctx, cx + 20, 470, 1, {});
      } else if (this.mode === 'barrel') {
        ART.barrel(ctx, cx + 20, 470, 1, {});
      } else {
        ART.omega(ctx, cx + this.x, 380, 1.1, { pose: 'crouch', armUp: true, dirty: this.dirty });
      }
      ctx.restore();

      // HUD
      G.bar(60, 44, G.W - 120, 18, this.height / 100, { color: '#8fd36a', label: 'Высота' });
      if (this.hits > 0) G.text('Царапин: ' + this.hits, G.W - 60, 36, { size: 15, align: 'right', color: '#e8a0a0' });
      if (this.dirty) G.text('Весь в вишне', 60, 36, { size: 15, color: '#f0a8b8' });
      if (this.mode === 'climb') {
        G.text('Пробел — лезть быстрее, ← → — уворот', G.W / 2, G.H - 24, { size: 16, align: 'center', color: '#fff6e0' });
      }
      G.dlg.draw();
      G.chapterTitle(ctx, 3, 'Бочка', this.t);
    }
  };

  G.addScene('ch1', ch1);
  G.addScene('lair', lair);
  G.addScene('ch2', ch2);
  G.addScene('ch3', ch3);
})();
