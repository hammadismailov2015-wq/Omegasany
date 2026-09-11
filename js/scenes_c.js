/* ============================================================
   Главы 8-10 и финал: Саня, месть Омеги, мяу-дуэль
   ============================================================ */
(function () {

  /* =========================================================
     ГЛАВА 8. Саня — приносит камень и скучает
     ========================================================= */
  const ch8 = {
    enter: function () {
      this.t = 0;
      this.interest = 55;
      this.shown = 0;
      this.mode = 'intro';
      this.newStones = [
        { name: 'Пик', color: '#4b3a6b', note: 'черно-фиолетовый' },
        { name: 'Хамелеон', color: '#5b8ab5', stripes: '#d86a6a', note: 'голубые, жёлтые и красные размытые полосочки' },
        { name: 'Лысая свинья', color: '#d38fb0', stripes: '#f6d0e0', note: 'тот самый, с дерева' }
      ];
      const self = this;
      G.say([
        'Когда Омега и Саня перестали дружить, Сане стало скучно и одиноко.',
        'Саня|На. Держи свою лысую свинью.',
        'Омега|О! А я тебе покажу, что нашёл за это время!',
        'Показывай камни (пробел / клик). Только Саню это не очень интересовало.'
      ], function () { self.mode = 'show'; });
    },
    update: function (dt) {
      this.t += dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }
      if (this.mode !== 'show') return;
      this.interest = G.clamp(this.interest - dt * 4.5, 0, 100);
      if (G.just['Space'] || G.mouse.click) {
        if (this.shown < this.newStones.length) {
          const st = this.newStones[this.shown];
          this.shown++;
          this.interest = G.clamp(this.interest + 12, 0, 100);
          G.sfx('blip');
          G.save.stones.push({ name: st.name, color: st.color, stripes: st.stripes, group: G.pick(DATA.groups) });
          G.store();
          const reply = ['Саня|Угу.', 'Саня|Ага, камень.', 'Саня|Слушай, а у меня кактус зацвёл...'][this.shown - 1];
          G.say(['Омега|Смотри! Это ' + st.name + '. ' + st.note + '!', reply]);
        } else {
          this.mode = 'end';
          G.say([
            'Саня|Ну ладно, я пошёл.',
            'Омега|Стой! Я ещё про беспозвоночных не рассказал!',
            'Но Сане не очень это интересовало.'
          ], function () { G.finishChapter(8); });
        }
      }
    },
    draw: function (ctx) {
      ART.lairBg(ctx, this.t);
      ART.hangman(ctx, 90, 400, .8, [{ color: '#4f9e5a' }, { color: '#8a8f99' }]);
      ART.table(ctx, 430, 390, 1, G.save.stones.slice(0, 5));
      ART.omega(ctx, 380, 470, 1.2, {});
      ART.sanya(ctx, 640, 470, 1.2, { flip: true });
      G.bar(G.W - 330, 44, 280, 16, this.interest / 100, { color: '#d8b341', label: 'Интерес Сани' });
      for (let i = 0; i < this.shown; i++) {
        const st = this.newStones[i];
        ART.stone(ctx, 200 + i * 90, 200, 30, st.color, { face: true, stripes: st.stripes, seed: i });
        G.text(st.name, 200 + i * 90, 250, { size: 14, align: 'center', color: '#ffe9b0' });
      }
      if (this.mode === 'show' && !G.dlg.active) {
        G.text('[Пробел] Показать следующий камень', G.W / 2, G.H - 30, { size: 18, align: 'center', color: '#fff6e0' });
      }
      ART.vignette(ctx, .45);
      G.dlg.draw();
      G.chapterTitle(ctx, 8, 'Саня', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 9. Месть Омеги — слежка и ловушка
     ========================================================= */
  const ch9 = {
    enter: function () {
      this.t = 0;
      this.mode = 'intro';
      this.data = 0;            // собранные данные слежки
      this.susp = 0;            // подозрение Сани
      this.sx = 300; this.sdir = 1;
      this.turn = 0;            // 0 — идёт, 1 — оборачивается
      this.turnT = G.rnd(2, 3.5);
      this.warn = 0;
      this.hidden = false;
      this.fail = 0;
      const self = this;
      G.say([
        'Омега|Он засунул меня в бочку без еды и воды. Ну ладно...',
        'Омега|Я кину его в речку. Воды сколько хочешь — пусть о еде думает. А под водой кактусов нет. Только камни.',
        'Омега|Сначала выясню, где он ходит. Надо следить за каждым его шагом.',
        'Следи за Саней: ПРОБЕЛ — спрятаться за дерево. Когда он оборачивается — прячься!'
      ], function () { self.mode = 'spy'; });
    },
    update: function (dt) {
      this.t += dt;
      if (this.fail > 0) this.fail -= dt;
      if (G.dlg.active) { G.dlg.update(dt); return; }

      if (this.mode === 'spy') {
        this.hidden = G.keys['Space'] || G.mouse.down;
        this.sx += this.sdir * dt * (this.turn ? 0 : 70);
        if (this.sx > 780) { this.sx = 780; this.sdir = -1; }
        if (this.sx < 180) { this.sx = 180; this.sdir = 1; }

        this.turnT -= dt;
        if (this.turnT <= 0) {
          if (this.turn) { this.turn = 0; this.turnT = G.rnd(2.2, 4); }
          else if (this.warn > 0) {
            this.warn -= dt;
            if (this.warn <= 0) { this.turn = 1; this.turnT = 1.4; }
          } else { this.warn = 0.85; this.turnT = 0.001; }
        }
        if (this.warn > 0 && !this.turn) this.warn -= dt;

        if (this.turn && !this.hidden) {
          this.susp += dt * 46;
          if (this.susp >= 100) {
            this.susp = 0; this.data = Math.max(0, this.data - 25); this.fail = 1.4;
            G.sfx('bad');
          }
        } else if (!this.turn && !this.hidden) {
          this.data += dt * 13;
          this.susp = Math.max(0, this.susp - dt * 22);
        } else {
          this.susp = Math.max(0, this.susp - dt * 30);
        }

        if (this.data >= 100) {
          this.mode = 'plan';
          G.say([
            'Один час в своём логове. Семь часов в МОЁМ логове. И восемь часов на крыше моего логова.',
            'Омега|Он вообще... Ладно. Большую часть времени он на моём логове.',
            'Ночью Омега положил банан у входа и поставил рядом ту самую дырявую бочку.',
            'Кликни, куда положить банан.'
          ], (function () { this.mode = 'trap'; }).bind(this));
        }
      } else if (this.mode === 'trap') {
        const spots = [[260, 430], [470, 430], [700, 430]];
        for (let i = 0; i < spots.length; i++) {
          if (G.mouse.click && Math.hypot(G.mouse.x - spots[i][0], G.mouse.y - spots[i][1]) < 70) {
            this.banana = spots[i];
            this.mode = 'wait';
            this.waitT = 0;
            G.sfx('good');
            break;
          }
        }
      } else if (this.mode === 'wait') {
        this.waitT += dt;
        if (this.waitT > 2.2 && !this.sprung) {
          this.sprung = true;
          G.sfx('hit');
          G.say([
            'Вдруг Саня поскользнулся об банан и упал в бочку, шибанувшись головой.',
            'Омега|(не может сдержать смеха)',
            'Омега быстро закрыл бочку и покатил её к речке.',
            'Омега|Дальше сам. Выбирайся, кактусовод.'
          ], function () { G.finishChapter(9); });
        }
      }
    },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      // логово с крышей
      ctx.fillStyle = '#3a2c1e';
      ctx.beginPath(); ctx.ellipse(470, 420, 60, 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#53422f'; ctx.fillRect(420, 414, 100, 8);
      G.text('вход в логово', 470, 392, { size: 13, align: 'center', color: '#ffe9b0' });

      if (this.mode === 'spy') {
        // Омега прячется за толстым деревом
        ART.omega(ctx, this.hidden ? 128 : 232, 486, 1.15, { flip: false });
        ctx.fillStyle = '#4a3421';
        ctx.fillRect(92, 250, 76, 250);
        ctx.fillStyle = 'rgba(30,20,10,.35)';
        ctx.fillRect(148, 250, 20, 250);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = ['#2f6b3c', '#3b8148', '#4a9755'][i];
          ctx.beginPath();
          ctx.ellipse(130, 250 - i * 34, 110 - i * 22, 58 - i * 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (this.hidden) { // подглядывает из-за ствола
          ctx.fillStyle = '#f6d3ab';
          ctx.beginPath(); ctx.ellipse(176, 424, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2b2b33';
          ctx.beginPath(); ctx.arc(178, 421, 2.4, 0, 7); ctx.fill();
        }
        ART.sanya(ctx, this.sx, 470, 1.2, { flip: this.turn ? false : this.sdir < 0, pose: this.turn ? 'stand' : 'walk', frame: this.t * 9, smug: true });
        if (this.warn > 0 && !this.turn) {
          G.text('!', this.sx, 370, { size: 40, align: 'center', color: '#ffd35e' });
        }
        if (this.turn) {
          ctx.fillStyle = 'rgba(255,120,110,.22)';
          ctx.beginPath();
          ctx.moveTo(this.sx, 430);
          ctx.lineTo(this.sx - 400, 330);
          ctx.lineTo(this.sx - 400, 530);
          ctx.fill();
          G.text('ОБОРАЧИВАЕТСЯ!', this.sx, 356, { size: 20, align: 'center', color: '#ff9d9d' });
        }
        G.bar(60, 44, 320, 16, this.data / 100, { color: '#8fd36a', label: 'Слежка' });
        G.bar(G.W - 380, 44, 320, 16, this.susp / 100, { color: '#d66a6a', label: 'Подозрение Сани' });
        G.text(this.hidden ? 'Спрятался' : 'На виду', G.W / 2, 60, { size: 17, align: 'center', color: this.hidden ? '#9fd8a8' : '#ffd6a0' });
        G.text('Держи ПРОБЕЛ, чтобы прятаться', G.W / 2, G.H - 26, { size: 16, align: 'center', color: '#fff6e0' });
        if (this.fail > 0) G.text('Он тебя заметил! Данные потеряны.', G.W / 2, 120, { size: 22, align: 'center', color: '#ff9d9d' });
      } else {
        ART.barrel(ctx, 620, 470, 0.8, { hole: 1 });
        if (this.banana) {
          ctx.save(); ctx.translate(this.banana[0], this.banana[1]);
          ctx.fillStyle = '#ffd94a';
          ctx.beginPath(); ctx.ellipse(0, 0, 22, 9, 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        if (this.mode === 'trap') {
          const spots = [[260, 430], [470, 430], [700, 430]];
          const self = this;
          spots.forEach(function (s) {
            const hov = Math.hypot(G.mouse.x - s[0], G.mouse.y - s[1]) < 70;
            ctx.strokeStyle = hov ? '#ffe9b0' : 'rgba(255,235,150,.5)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(s[0], s[1], 34 + Math.sin(self.t * 3) * 3, 0, Math.PI * 2); ctx.stroke();
          });
          G.text('Куда положить банан?', G.W / 2, 120, { size: 22, align: 'center', color: '#fff6e0' });
          ART.omega(ctx, 120, 500, 1.1, {});
        }
        if (this.mode === 'wait') {
          const x = 900 - this.waitT * 130;
          if (!this.sprung) ART.sanya(ctx, x, 470, 1.2, { flip: true, pose: 'walk', frame: this.t * 9 });
          else {
            ART.barrel(ctx, this.banana ? this.banana[0] + 60 : 620, 470, 0.8, { rot: Math.sin(this.t * 4) * 0.2, hole: 1 });
            G.text('БУХ!', G.W / 2, 180, { size: 40, align: 'center', color: '#ffd35e' });
          }
          ART.omega(ctx, 120, 500, 1.1, {});
        }
      }
      G.dlg.draw();
      G.chapterTitle(ctx, 9, 'Месть Омеги', this.t);
    }
  };

  /* =========================================================
     ГЛАВА 10. Возвращение Сани — мяу-дуэль
     ========================================================= */
  const ch10 = {
    enter: function () {
      this.t = 0;
      this.mode = 'intro';
      this.round = 0;
      this.seq = [];
      this.playIdx = 0;
      this.playT = 0;
      this.userIdx = 0;
      this.lit = -1;
      this.litT = 0;
      const self = this;
      G.say([
        'Однажды Саня зашёл в логово Омеги.',
        'Саня|...миу.',
        'Омега|мау.',
        'Повторяй за Саней его мяуканье: клавиши 1-4 или клик.'
      ], function () { self.startRound(); });
    },
    startRound: function () {
      this.round++;
      if (this.round > 5) { this.finish(); return; }
      this.seq = [];
      for (let i = 0; i < this.round + 1; i++) this.seq.push(Math.floor(Math.random() * 4));
      this.mode = 'play';
      this.playIdx = 0; this.playT = 0.6;
      this.userIdx = 0;
    },
    finish: function () {
      this.mode = 'end';
      G.say([
        'Потом они начали шипеть друг на друга.',
        'Саня|Ладно, давай признаем, что и камни, и кактусы хорошие. Где-то нет кактусов, где-то нет камней. И не будем спорить, что лучше.',
        'Омега|Ну ты чё, скучно будет! У нас будет одинаковое мнение. А так можно спорить, доказывать.',
        'Омега|Если ты признал, что камни лучше кактусов, то и смысла нет.',
        'Саня|Нет, я не признал! Кактусы лучше камней. Давай спорить.',
        'И так они продолжали дружить и полемить.'
      ], function () { G.go('final'); });
    },
    update: function (dt) {
      this.t += dt;
      if (this.litT > 0) { this.litT -= dt; if (this.litT <= 0) this.lit = -1; }
      if (G.dlg.active) { G.dlg.update(dt); return; }

      if (this.mode === 'play') {
        this.playT -= dt;
        if (this.playT <= 0) {
          if (this.playIdx < this.seq.length) {
            this.lit = this.seq[this.playIdx];
            this.litT = 0.42;
            G.meow(this.lit);
            this.playIdx++;
            this.playT = 0.66;
          } else {
            this.mode = 'repeat';
          }
        }
      } else if (this.mode === 'repeat') {
        let p = -1;
        ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach(function (k, i) { if (G.just[k]) p = i; });
        if (p < 0 && G.mouse.click) {
          for (let i = 0; i < 4; i++) {
            if (G.hit(120 + i * 190, 418, 170, 86)) p = i;
          }
        }
        if (p >= 0) {
          this.lit = p; this.litT = 0.3;
          G.meow(p);
          if (this.seq[this.userIdx] === p) {
            this.userIdx++;
            if (this.userIdx >= this.seq.length) {
              this.mode = 'good';
              const self = this;
              G.say(['Саня|' + DATA.meowSyllables[this.seq[this.seq.length - 1]] + '!',
                     'Омега|' + DATA.meowSyllables[G.pick([0, 1, 2, 3])] + '!'],
                function () { self.startRound(); });
            }
          } else {
            this.mode = 'bad';
            G.sfx('bad');
            const self = this;
            G.say(['Саня|Не-не-не, ты сбился. Слушай ещё раз.'], function () {
              self.mode = 'play'; self.playIdx = 0; self.playT = 0.6; self.userIdx = 0;
            });
          }
        }
      }
    },
    draw: function (ctx) {
      ART.lairBg(ctx, this.t);
      ART.table(ctx, 470, 300, .8, G.save.stones.slice(0, 5));
      ART.omega(ctx, 210, 396, 1.25, {});
      ART.sanya(ctx, 750, 396, 1.25, { flip: true, cactus: false });
      G.text('Раунд ' + Math.min(this.round, 5) + ' / 5', G.W / 2, 44, { size: 20, align: 'center', color: '#ffe9b0' });
      G.text(this.mode === 'play' ? 'Саня мяукает — слушай' :
        (this.mode === 'repeat' ? 'Повторяй!' : ' '), G.W / 2, 72, { size: 17, align: 'center', color: '#cfd8e3' });

      for (let i = 0; i < 4; i++) {
        const x = 120 + i * 190, y = 418, w = 170, h = 86;
        const on = this.lit === i;
        const hov = G.hit(x, y, w, h);
        G.panel(x, y, w, h, {
          fill: on ? 'rgba(255,215,90,.9)' : (hov ? 'rgba(70,92,66,.95)' : 'rgba(24,30,38,.9)'),
          stroke: on ? '#fff' : 'rgba(255,225,160,.5)'
        });
        G.text(DATA.meowSyllables[i], x + w / 2, y + 50, {
          size: 24, align: 'center', color: on ? '#2a2218' : '#fff6e0'
        });
        G.text(String(i + 1), x + 14, y + 24, { size: 14, color: '#ffd98a' });
      }
      if (this.mode === 'repeat') {
        for (let i = 0; i < this.seq.length; i++) {
          ctx.fillStyle = i < this.userIdx ? '#8fd36a' : 'rgba(255,255,255,.25)';
          ctx.beginPath(); ctx.arc(G.W / 2 - (this.seq.length - 1) * 10 + i * 20, 110, 6, 0, 7); ctx.fill();
        }
      }
      ART.vignette(ctx, .45);
      G.dlg.draw();
      G.chapterTitle(ctx, 10, 'Возвращение Сани', this.t);
    }
  };

  /* =========================================================
     ФИНАЛ
     ========================================================= */
  const final = {
    enter: function () {
      this.t = 0;
      G.unlock(11);
      G.save.flags.finished = true;
      G.store();
      G.sfx('win');
    },
    update: function (dt) {
      this.t += dt;
      if (G.just['Space'] && this.t > 1) G.go('menu');
    },
    draw: function (ctx) {
      ART.forestBg(ctx, this.t);
      ctx.fillStyle = 'rgba(10,14,20,.55)'; ctx.fillRect(0, 0, G.W, G.H);
      ART.omega(ctx, 380, 420, 1.4, {});
      ART.sanya(ctx, 580, 420, 1.4, { flip: true, cactus: true });
      ART.stone(ctx, 430, 436, 18, DATA.balid.color, { face: true });
      G.text('КОНЕЦ', G.W / 2, 130, { size: 56, align: 'center', color: '#ffe9b0' });
      G.text('И так они продолжали дружить и полемить.', G.W / 2, 176, { size: 22, align: 'center', color: '#f2ecdf' });
      G.text('Камней в коллекции: ' + (G.save.stones ? G.save.stones.length : 0), G.W / 2, 470, { size: 20, align: 'center', color: '#a8d8a8' });
      if (G.btn(G.W / 2 - 110, 492, 220, 40, 'В меню')) G.go('menu');
      G.text('по рассказу «Омега и его камни»', G.W / 2, 210, { size: 15, align: 'center', color: '#c9d3de' });
    }
  };

  G.addScene('ch8', ch8);
  G.addScene('ch9', ch9);
  G.addScene('ch10', ch10);
  G.addScene('final', final);
})();
