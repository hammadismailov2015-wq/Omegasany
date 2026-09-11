/* ============================================================
   Омега и камни — рисование (всё нарисовано кодом, без картинок)
   ============================================================ */
(function () {
  const ART = {};
  window.ART = ART;

  const rr = function (ctx, x, y, w, h, r) { G.rr(ctx, x, y, w, h, r); };

  /* ---------- фоны ---------- */
  ART.skyGrad = function (ctx, c1, c2, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h || G.H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    return g;
  };

  ART.tree = function (ctx, x, y, s, hue) {
    ctx.fillStyle = '#4a3421';
    ctx.fillRect(x - 7 * s, y - 70 * s, 14 * s, 70 * s);
    const greens = hue || ['#2f6b3c', '#3b8148', '#4a9755'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = greens[i % greens.length];
      ctx.beginPath();
      ctx.ellipse(x, y - (86 + i * 26) * s, (46 - i * 8) * s, (30 - i * 4) * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  ART.forestBg = function (ctx, t) {
    ctx.fillStyle = ART.skyGrad(ctx, '#8fd3e8', '#d7eec8');
    ctx.fillRect(0, 0, G.W, G.H);
    // солнце
    ctx.fillStyle = 'rgba(255,240,180,.85)';
    ctx.beginPath(); ctx.arc(820, 80, 34, 0, Math.PI * 2); ctx.fill();
    // дальние холмы
    ctx.fillStyle = '#7fb886';
    ctx.beginPath();
    ctx.moveTo(0, 330);
    for (let x = 0; x <= G.W; x += 40) ctx.lineTo(x, 320 + Math.sin(x * 0.012) * 26);
    ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    // дальние ёлки
    for (let i = 0; i < 14; i++) {
      const x = 30 + i * 72 + Math.sin(i * 3.1) * 12;
      ctx.fillStyle = '#4c8a5b';
      ctx.beginPath();
      ctx.moveTo(x, 330); ctx.lineTo(x - 20, 372); ctx.lineTo(x + 20, 372); ctx.fill();
    }
    // земля
    ctx.fillStyle = '#5aa05f'; ctx.fillRect(0, 366, G.W, G.H - 366);
    ctx.fillStyle = '#4e9155'; ctx.fillRect(0, 366, G.W, 10);
    // травинки
    ctx.strokeStyle = 'rgba(40,90,50,.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = (i * 97) % G.W, y = 386 + ((i * 53) % 140);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(t + i) * 3, y - 8); ctx.stroke();
    }
  };

  ART.desertBg = function (ctx, t) {
    ctx.fillStyle = ART.skyGrad(ctx, '#f7c46b', '#f7e7b8');
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.fillStyle = 'rgba(255,250,200,.9)';
    ctx.beginPath(); ctx.arc(760, 92, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c98a';
    ctx.beginPath();
    ctx.moveTo(0, 330);
    for (let x = 0; x <= G.W; x += 30) ctx.lineTo(x, 330 + Math.sin(x * 0.008 + 1) * 22);
    ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    ctx.fillStyle = '#dfba74';
    ctx.beginPath();
    ctx.moveTo(0, 402);
    for (let x = 0; x <= G.W; x += 30) ctx.lineTo(x, 402 + Math.sin(x * 0.011 + 3) * 14);
    ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    // марево
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = 300 + i * 9;
      ctx.beginPath();
      for (let x = 0; x <= G.W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + t * 2 + i) * 2);
      ctx.stroke();
    }
  };

  /* ---------- персонажи ---------- */
  // Омега: зелёная рубаха, растрёпанные волосы
  ART.omega = function (ctx, x, y, s, o) {
    o = o || {};
    const pose = o.pose || 'stand';
    const f = o.frame || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.flip ? -s : s, s);
    const legSwing = pose === 'walk' ? Math.sin(f) * 7 : 0;
    const crouch = pose === 'crouch' ? 12 : 0;

    // тень
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2); ctx.fill();

    if (pose !== 'ball') {
      // ноги
      ctx.strokeStyle = '#3b4152'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -22 + crouch); ctx.lineTo(-6 - legSwing, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -22 + crouch); ctx.lineTo(6 + legSwing, -2); ctx.stroke();
      // туловище
      ctx.fillStyle = o.dirty ? '#7a5f3c' : '#5f8f46';
      rr(ctx, -13, -52 + crouch, 26, 32, 8); ctx.fill();
      if (o.dirty) { // пятна вишни
        ctx.fillStyle = 'rgba(150,30,50,.75)';
        ctx.beginPath(); ctx.arc(-5, -40 + crouch, 4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -30 + crouch, 3, 0, 7); ctx.fill();
      }
      // руки
      ctx.strokeStyle = '#f0c8a0'; ctx.lineWidth = 6;
      const armA = o.armUp ? -1.2 : (pose === 'walk' ? Math.sin(f + 3) * 0.5 : 0.2);
      ctx.beginPath(); ctx.moveTo(-12, -46 + crouch);
      ctx.lineTo(-12 - Math.cos(armA) * 14, -46 + crouch + Math.sin(armA) * 14 + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -46 + crouch);
      ctx.lineTo(12 + Math.cos(armA) * 14, -46 + crouch + Math.sin(armA) * 14 + 14); ctx.stroke();
      // голова
      ctx.fillStyle = '#f6d3ab';
      ctx.beginPath(); ctx.arc(0, -64 + crouch, 14, 0, Math.PI * 2); ctx.fill();
      // волосы
      ctx.fillStyle = '#6b4a2a';
      ctx.beginPath(); ctx.arc(0, -68 + crouch, 14, Math.PI * 1.05, Math.PI * 2.0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, -80 + crouch); ctx.lineTo(4, -88 + crouch); ctx.lineTo(7, -76 + crouch); ctx.fill();
      // лицо
      ctx.fillStyle = '#2b2b33';
      const blink = (Math.sin(G.time * 1.7) > 0.97) ? 1 : 0;
      if (o.sleep || blink) {
        ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-8, -66 + crouch); ctx.lineTo(-2, -66 + crouch);
        ctx.moveTo(3, -66 + crouch); ctx.lineTo(9, -66 + crouch); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(-5, -66 + crouch, 2.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -66 + crouch, 2.2, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (o.sad) ctx.arc(0, -56 + crouch, 5, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(0, -60 + crouch, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      // свернулся рогаликом
      ctx.strokeStyle = 'rgba(12,8,4,.75)'; ctx.lineWidth = 3;
      ctx.fillStyle = o.dirty ? '#8a6f48' : '#5f8f46';
      ctx.beginPath(); ctx.ellipse(0, -20, 22, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6d3ab';
      ctx.beginPath(); ctx.arc(-14, -30, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6b4a2a';
      ctx.beginPath(); ctx.arc(-14, -34, 13, Math.PI * 1.0, Math.PI * 2.0); ctx.fill();
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(-14, -30);
      ctx.moveTo(-10, -30); ctx.lineTo(-5, -30); ctx.stroke();
      ctx.strokeStyle = '#3b4152'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(18, -6); ctx.stroke();
      ctx.strokeStyle = '#f0c8a0'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(16, -22); ctx.stroke();
    }
    ctx.restore();
  };

  // Саня: жёлтая рубаха, кепка
  ART.sanya = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.flip ? -s : s, s);
    const f = o.frame || 0;
    const legSwing = o.pose === 'walk' ? Math.sin(f) * 7 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4b3a5a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(-6 - legSwing, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(6 + legSwing, -2); ctx.stroke();
    ctx.fillStyle = '#d8b341';
    rr(ctx, -13, -52, 26, 32, 8); ctx.fill();
    ctx.strokeStyle = '#f0c8a0'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-12, -46); ctx.lineTo(-24, -32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -46); ctx.lineTo(24, -34); ctx.stroke();
    ctx.fillStyle = '#f6d3ab';
    ctx.beginPath(); ctx.arc(0, -64, 14, 0, Math.PI * 2); ctx.fill();
    // кепка
    ctx.fillStyle = '#2f6b3c';
    ctx.beginPath(); ctx.arc(0, -68, 14, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-14, -69, 26, 4);
    ctx.fillRect(6, -70, 18, 4);
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath(); ctx.arc(-5, -64, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -64, 2.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (o.smug) ctx.arc(3, -58, 5, 0.1, Math.PI - 0.5);
    else ctx.arc(0, -58, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    if (o.cactus) ART.cactus(ctx, 30, -22, 0.35, { pot: true });
    ctx.restore();
  };

  ART.portrait = function (ctx, who, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, 40 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,40,52,.9)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,225,160,.6)'; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, 38 * s, 0, Math.PI * 2); ctx.clip();
    const w = String(who).toLowerCase();
    if (w.indexOf('саня') === 0 || w.indexOf('санёк') === 0) ART.sanya(ctx, 0, 48 * s, 1.05 * s, { smug: true });
    else if (w.indexOf('лысый') >= 0) ART.stone(ctx, 0, 8 * s, 26 * s, '#c05a4a', { face: true });
    else if (w.indexOf('камн') >= 0 || w.indexOf('камень') >= 0) ART.stone(ctx, 0, 8 * s, 26 * s, '#8a8f99', { face: true });
    else ART.omega(ctx, 0, 48 * s, 1.05 * s, {});
    ctx.restore();
    ctx.restore();
  };

  /* ---------- предметы ---------- */
  ART.stone = function (ctx, x, y, r, color, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(0, r * 0.85, r * 1.05, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.2);
    ctx.quadraticCurveTo(-r * 1.05, -r * 0.7, -r * 0.2, -r * 0.95);
    ctx.quadraticCurveTo(r * 0.7, -r * 1.1, r * 0.98, -r * 0.15);
    ctx.quadraticCurveTo(r * 1.05, r * 0.75, 0, r * 0.8);
    ctx.quadraticCurveTo(-r * 0.85, r * 0.8, -r, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = color || '#8a8f99';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.45, r * 0.32, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
    if (o.stripes) {
      ctx.strokeStyle = o.stripes; ctx.lineWidth = Math.max(2, r * 0.13);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, i * r * 0.35);
        ctx.quadraticCurveTo(0, i * r * 0.35 - r * 0.2, r * 0.8, i * r * 0.3);
        ctx.stroke();
      }
    }
    if (o.face) {
      ctx.fillStyle = '#20242c';
      const blink = (Math.sin(G.time * 2 + (o.seed || 0)) > 0.96) ? 1 : 0;
      if (blink) {
        ctx.fillRect(-r * 0.42, -r * 0.16, r * 0.22, r * 0.06);
        ctx.fillRect(r * 0.2, -r * 0.16, r * 0.22, r * 0.06);
      } else {
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.16, r * 0.11, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.16, r * 0.11, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = '#20242c'; ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      if (o.sad) ctx.arc(0, r * 0.45, r * 0.24, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(0, r * 0.22, r * 0.24, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
    ctx.restore();
  };

  ART.cactus = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    if (o.pot) {
      ctx.fillStyle = '#a9603f';
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(19, 34); ctx.lineTo(-19, 34); ctx.fill();
    }
    ctx.fillStyle = o.color || '#2f7d43';
    rr(ctx, -18, -94, 36, 96, 18); ctx.fill();
    rr(ctx, -44, -70, 26, 16, 8); ctx.fill();
    rr(ctx, -44, -70, 16, 44, 8); ctx.fill();
    rr(ctx, 18, -56, 26, 16, 8); ctx.fill();
    rr(ctx, 28, -80, 16, 40, 8); ctx.fill();
    // колючки
    ctx.strokeStyle = 'rgba(240,240,220,.85)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const yy = -88 + i * 9;
      ctx.beginPath(); ctx.moveTo(-18, yy); ctx.lineTo(-24, yy - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, yy); ctx.lineTo(24, yy - 3); ctx.stroke();
    }
    if (o.flower) {
      ctx.fillStyle = '#e85f8a';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 9, -100 + Math.sin(a) * 9, 6, 4, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd35e';
      ctx.beginPath(); ctx.arc(0, -100, 5, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  ART.barrel = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath(); ctx.ellipse(0, 62, 54, 10, 0, 0, Math.PI * 2); ctx.fill();
    const grd = ctx.createLinearGradient(-56, 0, 56, 0);
    grd.addColorStop(0, '#6b4626'); grd.addColorStop(.5, '#9a6a3c'); grd.addColorStop(1, '#5e3d22');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(-40, -58);
    ctx.quadraticCurveTo(-62, 0, -40, 58);
    ctx.lineTo(40, 58);
    ctx.quadraticCurveTo(62, 0, 40, -58);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,25,12,.6)'; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14, -58 + Math.abs(i) * 3);
      ctx.quadraticCurveTo(i * 18, 0, i * 14, 58 - Math.abs(i) * 3);
      ctx.stroke();
    }
    ctx.strokeStyle = '#4a4f57'; ctx.lineWidth = 7;
    [-38, 0, 38].forEach(function (yy) {
      ctx.beginPath();
      ctx.moveTo(-52 + Math.abs(yy) * 0.18, yy);
      ctx.quadraticCurveTo(0, yy + 2, 52 - Math.abs(yy) * 0.18, yy);
      ctx.stroke();
    });
    if (o.hole) {
      ctx.fillStyle = '#1b1410';
      ctx.beginPath(); ctx.ellipse(6, -6, 5 + 16 * o.hole, 4 + 13 * o.hole, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  ART.hangman = function (ctx, x, y, s, stones) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -90); ctx.lineTo(120, -90); ctx.stroke();
    (stones || []).forEach(function (st, i) {
      const lx = 26 + i * 34;
      ctx.strokeStyle = '#c9c2a8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, -90); ctx.lineTo(lx, -60); ctx.stroke();
      ART.stone(ctx, lx, -48, 13, st.color, { face: true, sad: true, shadow: false, seed: i });
    });
    ctx.restore();
  };

  ART.lairBg = function (ctx, t) {
    // подземное логово в разрезе
    ctx.fillStyle = '#2a2119'; ctx.fillRect(0, 0, G.W, G.H);
    ctx.fillStyle = '#3b2f22'; ctx.fillRect(0, 120, G.W, G.H - 120);
    ctx.fillStyle = '#4a3a29'; ctx.fillRect(0, 120, G.W, 14);
    // трава сверху
    ctx.fillStyle = '#5aa05f'; ctx.fillRect(0, 92, G.W, 30);
    ctx.fillStyle = '#4e9155'; ctx.fillRect(0, 92, G.W, 8);
    ctx.fillStyle = ART.skyGrad(ctx, '#8fd3e8', '#bfe6de', 92);
    ctx.fillRect(0, 0, G.W, 92);
    // ступеньки
    ctx.fillStyle = '#53422f';
    for (let i = 0; i < 5; i++) ctx.fillRect(60 + i * 26, 134 + i * 26, 26 * (5 - i) + 26, 26);
    // факелы
    for (let i = 0; i < 3; i++) {
      const fx = 330 + i * 220;
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(fx - 3, 160, 6, 26);
      const fl = 8 + Math.sin(t * 8 + i) * 3;
      ctx.fillStyle = 'rgba(255,180,60,.9)';
      ctx.beginPath(); ctx.ellipse(fx, 154, fl * 0.6, fl, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,160,.9)';
      ctx.beginPath(); ctx.ellipse(fx, 156, fl * 0.3, fl * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
    // пол
    ctx.fillStyle = '#54402c'; ctx.fillRect(0, 440, G.W, G.H - 440);
    ctx.fillStyle = '#4a3826';
    for (let i = 0; i < 24; i++) ctx.fillRect(i * 42, 440, 40, 6);
  };

  ART.table = function (ctx, x, y, s, stones) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#8a6234'; ctx.fillRect(-90, 0, 180, 12);
    ctx.fillRect(-80, 12, 10, 46); ctx.fillRect(70, 12, 10, 46);
    (stones || []).forEach(function (st, i) {
      ART.stone(ctx, -66 + i * 34, -12, 14, st.color, { face: true, seed: i * 2 });
    });
    ctx.restore();
  };

  ART.cage = function (ctx, x, y, s, n) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(20,16,12,.8)'; ctx.fillRect(-50, -70, 100, 70);
    ctx.strokeStyle = '#7c848f'; ctx.lineWidth = 4;
    for (let i = -50; i <= 50; i += 14) { ctx.beginPath(); ctx.moveTo(i, -70); ctx.lineTo(i, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-50, -70); ctx.lineTo(50, -70); ctx.stroke();
    for (let i = 0; i < (n || 2); i++) ART.stone(ctx, -26 + i * 26, -12, 12, '#7d8490', { face: true, sad: true, seed: i });
    ctx.restore();
  };

  ART.beaver = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7a4f2a';
    ctx.beginPath(); ctx.ellipse(0, -16, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-18, -30, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath(); ctx.ellipse(24, -8, 14, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20242c';
    ctx.beginPath(); ctx.arc(-22, -33, 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-30, -26, 8, 7);
    ctx.restore();
  };

  ART.vignette = function (ctx, strength) {
    const g = ctx.createRadialGradient(G.W / 2, G.H / 2, 120, G.W / 2, G.H / 2, 560);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength === undefined ? 0.55 : strength) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);
  };
})();
