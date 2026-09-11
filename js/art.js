/* ============================================================
   Омега и камни — графика.
   Фоны и предметы рисуются «живописно» (градиенты, текстуры,
   кэшированные слои), а персонажи — честный пиксель-арт.
   ============================================================ */
(function () {
  const ART = {};
  window.ART = ART;

  /* ---------- утилиты ---------- */
  const rr = function (ctx, x, y, w, h, r) { G.rr(ctx, x, y, w, h, r); };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  ART.rng = rng;

  const layers = {};
  let SCALE = 1;   // во сколько раз холст крупнее логических 960x540
  // при смене масштаба перерисовываем кэш, чтобы текстуры оставались чёткими
  ART.setScale = function (k) {
    k = Math.max(1, Math.min(2, k || 1));
    if (Math.abs(k - SCALE) < 0.02) return;
    SCALE = k;
    for (const key in layers) delete layers[key];
    for (const key in spriteCache) delete spriteCache[key];
  };
  ART.scale = function () { return SCALE; };
  function layer(key, w, h, fn) {
    const ck = key + '@' + SCALE.toFixed(2);
    if (layers[ck]) return layers[ck];
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * SCALE); cv.height = Math.round(h * SCALE);
    const c = cv.getContext('2d');
    c.scale(cv.width / w, cv.height / h);
    fn(c, w, h);
    layers[ck] = cv;
    return cv;
  }

  function hex(c) {
    c = c.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }
  function shade(c, k) { // k>0 светлее, k<0 темнее
    const v = hex(c);
    const f = function (x) {
      return Math.round(k > 0 ? x + (255 - x) * k : x * (1 + k));
    };
    return 'rgb(' + f(v[0]) + ',' + f(v[1]) + ',' + f(v[2]) + ')';
  }
  function rgba(c, a) { const v = hex(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; }
  ART.shade = shade;

  ART.skyGrad = function (ctx, c1, c2, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h || G.H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    return g;
  };

  /* ============================================================
     ПИКСЕЛЬНЫЕ ЧЕЛОВЕЧКИ
     ============================================================ */
  const OM_STAND = [
    '..............',
    '....HHHHHH....',
    '...HhhhhhhH...',
    '...hssssssh...',
    '...hsessesh...',
    '...hsssssSh...',
    '...hssmmssh...',
    '....ssssss....',
    '.....SSSS.....',
    '....cccccc....',
    '...scccccCs...',
    '...scccccCs...',
    '...scccccCs...',
    '....ccccCC....',
    '....pppppp....',
    '....pp..pp....',
    '....pp..pp....',
    '....pp..pp....',
    '....bb..bb....',
    '...bbb..bbb...'
  ];
  const SA_STAND = [
    '..............',
    '....KKKKKK....',
    '...KkkkkkkK...',
    '...KKKKKKKKK..',
    '...ssessess...',
    '...sssssSSs...',
    '...sssmmsss...',
    '....ssssss....',
    '.....SSSS.....',
    '....cccccc....',
    '...scccccCs...',
    '...scccccCs...',
    '...scccccCs...',
    '....ccccCC....',
    '....pppppp....',
    '....pp..pp....',
    '....pp..pp....',
    '....pp..pp....',
    '....bb..bb....',
    '...bbb..bbb...'
  ];
  const LEGS_A = [
    '....pppppp....',
    '...ppp...pp...',
    '..ppp....pp...',
    '..pp.....pp...',
    '..bb.....bb...',
    '.bbb....bbb...'
  ];
  const LEGS_B = [
    '....pppppp....',
    '...pp...ppp...',
    '...pp....ppp..',
    '...pp.....pp..',
    '...bb.....bb..',
    '..bbb....bbb..'
  ];
  function withLegs(base, legs) { return base.slice(0, 14).concat(legs); }

  const OM_CLIMB = [
    '..............',
    '..ss.HHHH.ss..',
    '..ssHhhhhhHss.',
    '..sshssssshss.',
    '...hsessesh...',
    '...hsssssSh...',
    '...hssmmssh...',
    '....ssssss....',
    '.....SSSS.....',
    '....cccccc....',
    '....cccccc....',
    '....cccccC....',
    '....ccccCC....',
    '....pppppp....',
    '....pp..pp....',
    '....pp..pp....',
    '....pp..pp....',
    '....bb..bb....',
    '...bbb..bbb...',
    '..............'
  ];
  // свернулся рогаликом (18x14)
  const OM_BALL = [
    '.......HHHHH......',
    '.....HHhhhhhHccc..',
    '....Hhhhhhhhhccccc',
    '...hsssssssccccccc',
    '...hsessessccccccc',
    '...hsssssssccccccc',
    '...hssmmsssccccccc',
    '....sssssscccccccc',
    '.....ssssccccCCCCC',
    '....ssssscccCCCppp',
    '...ssspppppppppCCC',
    '..bbbbppppppppp...',
    '.bbbbbbppppppp....',
    '..bbbbbb..........'
  ];
  const OM_BALL_SLEEP = OM_BALL.slice();
  OM_BALL_SLEEP[4] = '...hsssssssccccccc';
  OM_BALL_SLEEP[5] = '...hsessessccccccc';

  const P_OMEGA = {
    H: '#54361d', h: '#6b4a2a', s: '#f3cda3', S: '#d8a97e', e: '#241d16',
    m: '#a35b52', c: '#5f8f46', C: '#47702f', p: '#3b4152', P: '#2b3140', b: '#2a2119'
  };
  const P_OMEGA_DIRTY = {
    H: '#4a2f19', h: '#5d4024', s: '#e0bb92', S: '#c2986f', e: '#241d16',
    m: '#9a544a', c: '#5c6e39', C: '#43522a', p: '#4d4638', P: '#39332a', b: '#2f261c'
  };
  const P_SANYA = {
    K: '#215029', k: '#2f6b3c', s: '#f3cda3', S: '#d8a97e', e: '#241d16',
    m: '#a35b52', c: '#d8b341', C: '#b08a24', p: '#4b3a5a', P: '#392c45', b: '#2a2119'
  };

  const spriteCache = {};
  const OUTLINE = 'rgba(18,12,6,.85)';
  function sprite(key, rows, pal, logicalPx) {
    const ck = key + '#' + logicalPx + '@' + SCALE.toFixed(2);
    if (spriteCache[ck]) return spriteCache[ck];
    const px = Math.max(1, Math.round(logicalPx * SCALE));
    const w = rows[0].length, h = rows.length;
    const cv = document.createElement('canvas');
    cv.width = (w + 2) * px; cv.height = (h + 2) * px;   // рамка в одну клетку под контур
    cv.logicalW = (w + 2) * logicalPx;
    cv.logicalH = (h + 2) * logicalPx;
    const c = cv.getContext('2d');
    const solid = function (x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      const ch = rows[y][x];
      return ch && ch !== '.' && pal[ch];
    };
    // контур
    c.fillStyle = OUTLINE;
    for (let y = -1; y <= h; y++) {
      for (let x = -1; x <= w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
          c.fillRect((x + 1) * px, (y + 1) * px, px, px);
        }
      }
    }
    // тело
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (!ch || ch === '.') continue;
        const col = pal[ch];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect((x + 1) * px, (y + 1) * px, px, px);
      }
    }
    spriteCache[ck] = cv;
    return cv;
  }

  function drawSprite(ctx, cv, x, y, flip, px) {
    const w = cv.logicalW, h = cv.logicalH;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const dy = Math.round(y - h + px);   // «ноги» стоят на y
    if (flip) {
      ctx.translate(Math.round(x), 0);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, -Math.round(w / 2), dy, w, h);
    } else {
      ctx.drawImage(cv, Math.round(x - w / 2), dy, w, h);
    }
    ctx.restore();
  }

  function groundShadow(ctx, x, y, w) {
    ctx.fillStyle = 'rgba(20,26,16,.28)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ART.omega = function (ctx, x, y, s, o) {
    o = o || {};
    s = s || 1;
    const px = Math.max(2, Math.round(4.9 * s));
    const pal = o.dirty ? P_OMEGA_DIRTY : P_OMEGA;
    const palId = o.dirty ? 'od' : 'oc';
    let rows, key, ball = false;
    if (o.pose === 'ball') {
      ball = true;
      rows = o.sleep ? OM_BALL_SLEEP : OM_BALL;
      key = 'om-ball' + (o.sleep ? 's' : '') + palId;
    } else if (o.pose === 'crouch' || o.armUp) {
      rows = OM_CLIMB; key = 'om-climb' + palId;
    } else if (o.pose === 'walk') {
      const f = Math.floor((o.frame || 0) / 2.2) % 2;
      rows = withLegs(OM_STAND, f ? LEGS_A : LEGS_B);
      key = 'om-walk' + f + palId;
    } else {
      rows = OM_STAND; key = 'om-stand' + palId;
    }
    const cv = sprite(key, rows, pal, px);
    if (o.shadow !== false) groundShadow(ctx, x, y, (ball ? 8 : 6) * px);
    drawSprite(ctx, cv, x, y, o.flip, px);
  };

  ART.sanya = function (ctx, x, y, s, o) {
    o = o || {};
    s = s || 1;
    const px = Math.max(2, Math.round(4.9 * s));
    let rows, key;
    if (o.pose === 'walk') {
      const f = Math.floor((o.frame || 0) / 2.2) % 2;
      rows = withLegs(SA_STAND, f ? LEGS_A : LEGS_B);
      key = 'sa-walk' + f;
    } else { rows = SA_STAND; key = 'sa-stand'; }
    const cv = sprite(key, rows, P_SANYA, px);
    if (o.shadow !== false) groundShadow(ctx, x, y, 6 * px);
    drawSprite(ctx, cv, x, y, o.flip, px);
    if (o.cactus) ART.cactus(ctx, x + (o.flip ? -34 : 34) * s, y, 0.34 * s, { pot: true, flower: true });
  };

  ART.portrait = function (ctx, who, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    const r = 40 * s;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#2b3545'); g.addColorStop(1, '#161d28');
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2); ctx.clip();
    const w = String(who).toLowerCase();
    if (w.indexOf('саня') === 0 || w.indexOf('санёк') === 0) ART.sanya(ctx, 0, 62 * s, 1.5 * s, { shadow: false });
    else if (w.indexOf('лысый') >= 0) ART.stone(ctx, 0, 10 * s, 26 * s, '#c05a4a', { face: true, shadow: false });
    else if (w.indexOf('камн') >= 0 || w.indexOf('камень') >= 0) ART.stone(ctx, 0, 10 * s, 26 * s, '#8a8f99', { face: true, shadow: false });
    else ART.omega(ctx, 0, 62 * s, 1.5 * s, { shadow: false });
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,225,160,.6)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };

  /* ============================================================
     ДЕРЕВО, КАМЕНЬ, КАКТУС, БОЧКА
     ============================================================ */
  ART.tree = function (ctx, x, y, s, seed) {
    const R = rng((seed || Math.round(x)) * 7717 + 13);
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(20,40,20,.22)';
    ctx.beginPath(); ctx.ellipse(6, 2, 42, 11, 0, 0, Math.PI * 2); ctx.fill();

    // ствол с корнями
    const tg = ctx.createLinearGradient(-10, 0, 12, 0);
    tg.addColorStop(0, '#3a2716'); tg.addColorStop(.45, '#6b4a2a'); tg.addColorStop(1, '#2f1f11');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(-9, -18, -7, -74);
    ctx.lineTo(8, -74);
    ctx.quadraticCurveTo(11, -18, 17, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(25,16,8,.5)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const bx = -8 + i * 3 + R() * 2;
      ctx.beginPath();
      ctx.moveTo(bx, -8 - R() * 10);
      ctx.quadraticCurveTo(bx + 2, -40, bx - 1 + R() * 2, -70);
      ctx.stroke();
    }
    // ветки
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, -70); ctx.quadraticCurveTo(-24, -84, -34, -96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -76); ctx.quadraticCurveTo(24, -90, 33, -102); ctx.stroke();

    // крона — три тона
    const blobs = [];
    for (let i = 0; i < 9; i++) {
      blobs.push({
        x: (R() - 0.5) * 78,
        y: -104 - R() * 52,
        r: 24 + R() * 20
      });
    }
    const paint = function (dx, dy, col, k) {
      ctx.fillStyle = col;
      blobs.forEach(function (b) {
        ctx.beginPath();
        ctx.ellipse(b.x + dx, b.y + dy, b.r * k, b.r * k * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    paint(4, 6, '#1f4a2a', 1.0);
    paint(0, 0, '#2f6b38', 0.96);
    paint(-5, -7, '#4b9450', 0.72);
    paint(-11, -14, '#6cb662', 0.40);
    // листочки-искорки
    ctx.fillStyle = 'rgba(180,225,150,.5)';
    for (let i = 0; i < 26; i++) {
      const b = blobs[Math.floor(R() * blobs.length)];
      ctx.fillRect(b.x + (R() - .5) * b.r * 1.4, b.y + (R() - .5) * b.r * 1.2, 2.5, 2.5);
    }
    ctx.restore();
  };

  ART.stone = function (ctx, x, y, r, color, o) {
    o = o || {};
    color = color || '#8a8f99';
    const R = rng(((o.seed || 0) + 3) * 9173 + Math.round(r * 10));
    ctx.save();
    ctx.translate(x, y);
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(20,20,20,.25)';
      ctx.beginPath(); ctx.ellipse(0, r * 0.86, r * 1.06, r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    }
    // силуэт
    const pts = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = r * (0.82 + R() * 0.3) * (1 - 0.12 * Math.sin(a));
      pts.push([Math.cos(a) * rad, Math.sin(a) * rad * 0.88]);
    }
    ctx.beginPath();
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.25);
    g.addColorStop(0, shade(color, 0.42));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, -0.45));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // крапинки и трещинка
    for (let i = 0; i < Math.max(8, r * 0.9); i++) {
      const px = (R() - .5) * r * 1.8, py = (R() - .5) * r * 1.6;
      ctx.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.15)';
      ctx.beginPath(); ctx.arc(px, py, r * (0.03 + R() * 0.06), 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, r * 0.1);
    ctx.lineTo(-r * 0.2, r * 0.3);
    ctx.lineTo(r * 0.3, r * 0.15);
    ctx.stroke();
    if (o.stripes) {
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = o.stripes;
        ctx.lineWidth = Math.max(2, r * 0.15);
        ctx.beginPath();
        ctx.moveTo(-r * 1.1, i * r * 0.42 + r * 0.04);
        ctx.quadraticCurveTo(0, i * r * 0.42 - r * 0.22, r * 1.1, i * r * 0.36);
        ctx.stroke();
      }
    }
    // блик
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.48, r * 0.3, r * 0.15, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (o.face) {
      ctx.fillStyle = '#20242c';
      const blink = (Math.sin(G.time * 2 + (o.seed || 0)) > 0.96) ? 1 : 0;
      if (blink) {
        ctx.fillRect(-r * 0.42, -r * 0.16, r * 0.24, r * 0.07);
        ctx.fillRect(r * 0.18, -r * 0.16, r * 0.24, r * 0.07);
      } else {
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.16, r * 0.12, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.16, r * 0.12, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(-r * 0.34, -r * 0.2, r * 0.04, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.26, -r * 0.2, r * 0.04, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = '#20242c'; ctx.lineWidth = Math.max(1.5, r * 0.08);
      ctx.beginPath();
      if (o.sad) ctx.arc(0, r * 0.46, r * 0.24, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(0, r * 0.2, r * 0.26, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
    ctx.restore();
  };

  ART.cactus = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(40,30,10,.22)';
    ctx.beginPath(); ctx.ellipse(4, 2, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
    if (o.pot) {
      const pg = ctx.createLinearGradient(-26, 0, 26, 0);
      pg.addColorStop(0, '#7c4327'); pg.addColorStop(.5, '#b8703f'); pg.addColorStop(1, '#6d3a21');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(19, 34); ctx.lineTo(-19, 34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-26, 0, 52, 5);
    }
    const base = o.color || '#2f7d43';
    const bodyGrad = function (x0, x1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, shade(base, -0.42));
      g.addColorStop(0.32, shade(base, 0.12));
      g.addColorStop(0.62, base);
      g.addColorStop(1, shade(base, -0.5));
      return g;
    };
    const seg = function (x0, y0, w, h, r) {
      ctx.fillStyle = bodyGrad(x0, x0 + w);
      rr(ctx, x0, y0, w, h, r); ctx.fill();
      // рёбра
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) {
        const gx = x0 + (w / 4) * i;
        ctx.beginPath(); ctx.moveTo(gx, y0 + r * 0.5); ctx.lineTo(gx, y0 + h - r * 0.5); ctx.stroke();
      }
      // колючки
      ctx.strokeStyle = 'rgba(245,240,215,.9)'; ctx.lineWidth = 1.4;
      for (let yy = y0 + 8; yy < y0 + h - 4; yy += 11) {
        for (let k = 0; k < 2; k++) {
          const sx = k ? x0 + w : x0, dir = k ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + dir * 6, yy - 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + dir * 6, yy + 3); ctx.stroke();
        }
      }
    };
    seg(-44, -70, 17, 44, 8);
    ctx.fillStyle = bodyGrad(-44, -18); rr(ctx, -44, -70, 26, 16, 8); ctx.fill();
    seg(28, -80, 16, 40, 8);
    ctx.fillStyle = bodyGrad(18, 44); rr(ctx, 18, -56, 26, 16, 8); ctx.fill();
    seg(-18, -94, 36, 96, 17);
    if (o.flower) {
      ctx.fillStyle = '#d94f7e';
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 9, -100 + Math.sin(a) * 8, 7, 4.4, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd35e';
      ctx.beginPath(); ctx.arc(0, -100, 5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.arc(-1.5, -101.5, 1.8, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  ART.barrel = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(30,20,8,.25)';
    ctx.beginPath(); ctx.ellipse(0, 64, 52, 10, 0, 0, Math.PI * 2); ctx.fill();
    // клёпки
    for (let i = -4; i <= 3; i++) {
      const x0 = i * 14, x1 = x0 + 14;
      const bulge = function (xx) { return 1 - Math.abs(xx) / 120; };
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      const lit = Math.max(0, 1 - Math.abs(x0 + 7 + 18) / 70);
      g.addColorStop(0, shade('#7c5330', -0.35 + lit * 0.3));
      g.addColorStop(.5, shade('#a3713f', -0.1 + lit * 0.45));
      g.addColorStop(1, shade('#6d4626', -0.3 + lit * 0.25));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, -58 * bulge(x0) - 2);
      ctx.quadraticCurveTo(x0 - 5, 0, x0, 58 * bulge(x0) + 2);
      ctx.lineTo(x1, 58 * bulge(x1) + 2);
      ctx.quadraticCurveTo(x1 - 5, 0, x1, -58 * bulge(x1) - 2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(35,22,10,.45)'; ctx.lineWidth = 1;
      ctx.stroke();
      // волокна
      const R = rng(i * 991 + 7);
      ctx.strokeStyle = 'rgba(60,38,18,.35)'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const gx = x0 + 3 + R() * 8;
        ctx.beginPath();
        ctx.moveTo(gx, -50); ctx.quadraticCurveTo(gx + 3, 0, gx - 1, 50); ctx.stroke();
      }
    }
    // обручи
    [-40, 0, 40].forEach(function (yy) {
      const hg = ctx.createLinearGradient(0, yy - 5, 0, yy + 5);
      hg.addColorStop(0, '#8c939d'); hg.addColorStop(.4, '#5d646d'); hg.addColorStop(1, '#33383f');
      ctx.strokeStyle = hg; ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-54 + Math.abs(yy) * 0.2, yy);
      ctx.quadraticCurveTo(0, yy + 3, 54 - Math.abs(yy) * 0.2, yy);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      for (let i = -2; i <= 2; i++) ctx.fillRect(i * 20 - 1, yy - 3, 3, 2);
    });
    if (o.hole) {
      const r = 5 + 17 * o.hole;
      ctx.fillStyle = '#160f0a';
      ctx.beginPath(); ctx.ellipse(6, -6, r, r * 0.8, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(180,140,90,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(6, -6, r, r * 0.8, 0.2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  ART.beaver = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(20,30,15,.25)';
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-6, -24, 4, 0, -14, 30);
    g.addColorStop(0, '#9c6a3a'); g.addColorStop(1, '#5b3a1d');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -16, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-18, -30, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2f18';
    ctx.beginPath(); ctx.ellipse(25, -8, 15, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(18 + i * 3, -14); ctx.lineTo(30 + i * 2, -2); ctx.stroke();
    }
    ctx.fillStyle = '#241d16';
    ctx.beginPath(); ctx.arc(-22, -33, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-28, -26, 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7f3e2';
    ctx.fillRect(-30, -25, 8, 8);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.moveTo(-26, -25); ctx.lineTo(-26, -17); ctx.stroke();
    ctx.restore();
  };

  /* ============================================================
     ФОНЫ
     ============================================================ */
  function grassField(c, w, h, y0, seed) {
    const R = rng(seed);
    const g = c.createLinearGradient(0, y0, 0, h);
    g.addColorStop(0, '#4f8f4f'); g.addColorStop(.35, '#5ea257'); g.addColorStop(1, '#3f7a41');
    c.fillStyle = g;
    c.fillRect(0, y0, w, h - y0);
    // кочки
    for (let i = 0; i < 90; i++) {
      const x = R() * w, y = y0 + 6 + R() * (h - y0 - 6);
      const rad = 14 + R() * 30;
      c.fillStyle = R() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)';
      c.beginPath(); c.ellipse(x, y, rad, rad * 0.3, 0, 0, Math.PI * 2); c.fill();
    }
    // травинки
    for (let i = 0; i < 1500; i++) {
      const x = R() * w, y = y0 + R() * (h - y0);
      const dep = (y - y0) / (h - y0);
      const len = 4 + dep * 9;
      c.strokeStyle = R() > .45
        ? 'rgba(40,92,44,' + (0.25 + dep * 0.4) + ')'
        : 'rgba(150,205,120,' + (0.15 + dep * 0.3) + ')';
      c.lineWidth = 1 + dep;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + (R() - .5) * 4, y - len * .6, x + (R() - .5) * 7, y - len);
      c.stroke();
    }
    // цветочки и камушки
    for (let i = 0; i < 60; i++) {
      const x = R() * w, y = y0 + 20 + R() * (h - y0 - 20);
      if (R() > .45) {
        c.fillStyle = ['#f7f0c8', '#ffd9e2', '#ffe89a'][Math.floor(R() * 3)];
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2;
          c.beginPath(); c.ellipse(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 2, 1.6, a, 0, 7); c.fill();
        }
        c.fillStyle = '#e0a83c';
        c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill();
      } else {
        c.fillStyle = 'rgba(120,120,110,.5)';
        c.beginPath(); c.ellipse(x, y, 3 + R() * 3, 2 + R() * 2, 0, 0, 7); c.fill();
      }
    }
  }

  ART.forestBg = function (ctx, t) {
    const bg = layer('forest', G.W, G.H, function (c, w, h) {
      const HZ = 330;
      // небо
      const sg = c.createLinearGradient(0, 0, 0, HZ + 40);
      sg.addColorStop(0, '#4f9fd0'); sg.addColorStop(.55, '#9ed3e6'); sg.addColorStop(1, '#e4f1d8');
      c.fillStyle = sg; c.fillRect(0, 0, w, HZ + 40);
      // солнце с ореолом
      const sun = c.createRadialGradient(806, 78, 10, 806, 78, 190);
      sun.addColorStop(0, 'rgba(255,250,220,.95)');
      sun.addColorStop(.12, 'rgba(255,244,190,.75)');
      sun.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = sun; c.beginPath(); c.arc(806, 78, 190, 0, 7); c.fill();
      // облака
      const R = rng(4242);
      for (let i = 0; i < 7; i++) {
        const cx = R() * w, cy = 40 + R() * 140, sc = .6 + R() * .9;
        c.beginPath();
        for (let k = 0; k < 7; k++) {
          const ex = cx + (k - 3) * 24 * sc;
          const ey = cy + Math.sin(k * 1.3) * 5 * sc;
          const rx = (36 - Math.abs(k - 3) * 6) * sc, ry = (17 - Math.abs(k - 3) * 1.6) * sc;
          c.moveTo(ex + rx, ey);
          c.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
        }
        c.fillStyle = 'rgba(255,255,255,' + (0.45 + R() * 0.35) + ')';
        c.fill();
        // подсветка снизу
        c.beginPath();
        for (let k = 0; k < 5; k++) {
          const ex = cx + (k - 2) * 24 * sc, ey = cy + 6 * sc;
          c.moveTo(ex + 26 * sc, ey);
          c.ellipse(ex, ey, 26 * sc, 9 * sc, 0, 0, Math.PI * 2);
        }
        c.fillStyle = 'rgba(210,225,240,.35)'; c.fill();
      }
      // дальние горы
      const mk = function (base, col, amp, freq, ph) {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(0, base);
        for (let x = 0; x <= w; x += 12) {
          c.lineTo(x, base - Math.abs(Math.sin(x * freq + ph)) * amp - Math.sin(x * freq * 2.3 + ph) * amp * 0.3);
        }
        c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
      };
      mk(300, '#8fb2b8', 60, 0.004, 1.2);
      mk(318, '#7ba48c', 44, 0.006, 3.1);
      // дымка
      const hz = c.createLinearGradient(0, 250, 0, 350);
      hz.addColorStop(0, 'rgba(230,244,240,0)');
      hz.addColorStop(1, 'rgba(226,242,232,.75)');
      c.fillStyle = hz; c.fillRect(0, 250, w, 100);
      // хвойная стена
      for (let pass = 0; pass < 2; pass++) {
        const base = 336 + pass * 16;
        const cols = pass === 0 ? ['#4f8a63', '#568f66', '#487f5b'] : ['#2f6b45', '#37744b', '#2a5f3d'];
        const R2 = rng(99 + pass * 7);
        for (let i = 0; i < 30; i++) {
          const x = -20 + i * (w + 40) / 29 + (R2() - .5) * 16;
          const hgt = (pass === 0 ? 52 : 74) + R2() * 34;
          const wid = hgt * 0.42;
          c.fillStyle = cols[Math.floor(R2() * cols.length)];
          for (let k = 0; k < 3; k++) {
            const yy = base - k * hgt * 0.28;
            c.beginPath();
            c.moveTo(x, yy - hgt * (0.55 + k * 0.22));
            c.lineTo(x - wid * (1 - k * 0.2), yy);
            c.lineTo(x + wid * (1 - k * 0.2), yy);
            c.closePath(); c.fill();
          }
          c.fillStyle = '#3d2b1a';
          c.fillRect(x - 2, base - 2, 4, 10);
        }
      }
      // земля
      grassField(c, w, h, 344, 7);
      // граница леса — тень
      const sh = c.createLinearGradient(0, 342, 0, 404);
      sh.addColorStop(0, 'rgba(22,46,26,.55)');
      sh.addColorStop(1, 'rgba(24,48,28,0)');
      c.fillStyle = sh; c.fillRect(0, 342, w, 62);
    });
    ctx.drawImage(bg, 0, 0, G.W, G.H);

    // анимация: колышущаяся трава на переднем плане и солнечные пятна
    ctx.save();
    for (let i = 0; i < 46; i++) {
      const x = (i * 137) % G.W, y = 430 + ((i * 71) % 110);
      const sway = Math.sin(t * 1.6 + i * 0.7) * 4;
      ctx.strokeStyle = 'rgba(46,96,48,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + sway * .5, y - 9, x + sway, y - 17);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const x = (i * 260 + t * 9) % (G.W + 200) - 100;
      ctx.fillStyle = 'rgba(255,248,200,.07)';
      ctx.beginPath(); ctx.ellipse(x, 420 + i * 28, 120, 26, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  ART.desertBg = function (ctx, t) {
    const bg = layer('desert', G.W, G.H, function (c, w, h) {
      const sg = c.createLinearGradient(0, 0, 0, 340);
      sg.addColorStop(0, '#e79b4a'); sg.addColorStop(.45, '#f4c06d'); sg.addColorStop(1, '#f8e3b0');
      c.fillStyle = sg; c.fillRect(0, 0, w, 360);
      const sun = c.createRadialGradient(756, 92, 14, 756, 92, 220);
      sun.addColorStop(0, 'rgba(255,253,236,1)');
      sun.addColorStop(.1, 'rgba(255,246,200,.8)');
      sun.addColorStop(1, 'rgba(255,235,160,0)');
      c.fillStyle = sun; c.beginPath(); c.arc(756, 92, 220, 0, 7); c.fill();
      // столовые горы вдали
      const R = rng(777);
      c.fillStyle = 'rgba(186,132,96,.55)';
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 210 + R() * 60, bw = 90 + R() * 90, bh = 40 + R() * 40;
        c.beginPath();
        c.moveTo(x - bw / 2, 320);
        c.lineTo(x - bw / 2 + 14, 320 - bh);
        c.lineTo(x + bw / 2 - 18, 320 - bh * (0.8 + R() * 0.3));
        c.lineTo(x + bw / 2, 320);
        c.closePath(); c.fill();
      }
      const hz = c.createLinearGradient(0, 272, 0, 330);
      hz.addColorStop(0, 'rgba(250,222,170,0)'); hz.addColorStop(1, 'rgba(250,226,176,.85)');
      c.fillStyle = hz; c.fillRect(0, 272, w, 60);
      // дюны
      const dune = function (base, amp, freq, ph, top, bottom) {
        const g = c.createLinearGradient(0, base - amp, 0, h);
        g.addColorStop(0, top); g.addColorStop(1, bottom);
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, base);
        for (let x = 0; x <= w; x += 10) c.lineTo(x, base + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.7 + ph) * amp * 0.25);
        c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
        // гребень
        c.strokeStyle = 'rgba(255,248,220,.5)'; c.lineWidth = 2;
        c.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const y = base + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.7 + ph) * amp * 0.25;
          if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      };
      dune(330, 22, 0.008, 1, '#efcb8e', '#e2b877');
      dune(398, 18, 0.011, 3.4, '#e8bf7d', '#d2a463');
      dune(462, 14, 0.015, 5.2, '#dcae69', '#c09353');
      // песчинки и рябь
      const R2 = rng(31337);
      for (let i = 0; i < 2600; i++) {
        const x = R2() * w, y = 330 + R2() * (h - 330);
        c.fillStyle = R2() > .5 ? 'rgba(255,245,215,.35)' : 'rgba(150,110,60,.22)';
        c.fillRect(x, y, 1.6, 1.6);
      }
      c.strokeStyle = 'rgba(180,138,80,.18)'; c.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const y = 348 + i * 8;
        c.beginPath();
        for (let x = 0; x <= w; x += 14) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 3);
        c.stroke();
      }
      // камешки
      for (let i = 0; i < 22; i++) {
        const x = R2() * w, y = 360 + R2() * 170, rr2 = 3 + R2() * 7;
        c.fillStyle = 'rgba(120,92,58,.45)';
        c.beginPath(); c.ellipse(x, y, rr2, rr2 * .6, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,240,200,.3)';
        c.beginPath(); c.ellipse(x - rr2 * .2, y - rr2 * .25, rr2 * .5, rr2 * .3, 0, 0, 7); c.fill();
      }
    });
    ctx.drawImage(bg, 0, 0, G.W, G.H);
    // марево
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const y = 292 + i * 10;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 - i * 0.02) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= G.W; x += 14) ctx.lineTo(x, y + Math.sin(x * 0.05 + t * 2.2 + i) * 2.2);
      ctx.stroke();
    }
    ctx.restore();
  };

  ART.lairBg = function (ctx, t) {
    const bg = layer('lair', G.W, G.H, function (c, w, h) {
      // небо и трава сверху
      const sg = c.createLinearGradient(0, 0, 0, 92);
      sg.addColorStop(0, '#5aa8d4'); sg.addColorStop(1, '#b9e0d8');
      c.fillStyle = sg; c.fillRect(0, 0, w, 92);
      const R = rng(5150);
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 4; i++) {
        c.beginPath(); c.ellipse(R() * w, 20 + R() * 40, 50, 14, 0, 0, 7); c.fill();
      }
      c.fillStyle = '#4e8f4c'; c.fillRect(0, 88, w, 34);
      for (let i = 0; i < 300; i++) {
        const x = R() * w, y = 90 + R() * 30;
        c.strokeStyle = R() > .5 ? 'rgba(40,90,44,.5)' : 'rgba(150,200,120,.4)';
        c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + (R() - .5) * 3, y - 4); c.stroke();
      }
      // земляной срез
      const dg = c.createLinearGradient(0, 120, 0, h);
      dg.addColorStop(0, '#5a4127'); dg.addColorStop(.25, '#4a3320'); dg.addColorStop(1, '#2e2015');
      c.fillStyle = dg; c.fillRect(0, 120, w, h - 120);
      c.fillStyle = '#6b4e2c'; c.fillRect(0, 120, w, 10);
      // земляная крошка
      for (let i = 0; i < 4200; i++) {
        const x = R() * w, y = 132 + R() * (h - 132);
        c.fillStyle = R() > .5 ? 'rgba(255,220,170,.07)' : 'rgba(0,0,0,.12)';
        c.fillRect(x, y, 2, 2);
      }
      // камни в срезе
      for (let i = 0; i < 46; i++) {
        const x = R() * w, y = 150 + R() * (h - 190), rr2 = 4 + R() * 12;
        c.fillStyle = 'rgba(130,120,105,.4)';
        c.beginPath(); c.ellipse(x, y, rr2, rr2 * .68, R() * 3, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,240,210,.13)';
        c.beginPath(); c.ellipse(x - rr2 * .25, y - rr2 * .3, rr2 * .5, rr2 * .3, 0, 0, 7); c.fill();
      }
      // корни
      c.strokeStyle = 'rgba(60,40,22,.75)';
      for (let i = 0; i < 14; i++) {
        const x = R() * w;
        c.lineWidth = 1 + R() * 3;
        c.beginPath();
        c.moveTo(x, 128);
        let yy = 128, xx = x;
        for (let k = 0; k < 4; k++) {
          const nx = xx + (R() - .5) * 40, ny = yy + 18 + R() * 26;
          c.quadraticCurveTo(xx + (R() - .5) * 20, (yy + ny) / 2, nx, ny);
          xx = nx; yy = ny;
        }
        c.stroke();
      }
      // ступеньки слева
      for (let i = 0; i < 5; i++) {
        const x = 56 + i * 28, y = 132 + i * 30, ww = 28 * (5 - i) + 30;
        const g = c.createLinearGradient(0, y, 0, y + 30);
        g.addColorStop(0, '#7c5a33'); g.addColorStop(1, '#4a3520');
        c.fillStyle = g; c.fillRect(x, y, ww, 30);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, y + 26, ww, 4);
        c.fillStyle = 'rgba(255,220,160,.12)'; c.fillRect(x, y, ww, 3);
      }
      // балки-подпорки
      [300, 640].forEach(function (x) {
        const g = c.createLinearGradient(x - 12, 0, x + 12, 0);
        g.addColorStop(0, '#4b3218'); g.addColorStop(.5, '#7d5730'); g.addColorStop(1, '#3d2814');
        c.fillStyle = g;
        c.fillRect(x - 12, 150, 24, 300);
        c.fillRect(x - 60, 150, 120, 16);
        c.strokeStyle = 'rgba(30,18,8,.5)'; c.lineWidth = 1;
        for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 8 + k * 5, 156); c.lineTo(x - 7 + k * 5, 446); c.stroke(); }
      });
      // пол
      const fg = c.createLinearGradient(0, 440, 0, h);
      fg.addColorStop(0, '#5c452c'); fg.addColorStop(1, '#3a2a1a');
      c.fillStyle = fg; c.fillRect(0, 440, w, h - 440);
      for (let i = 0; i < 900; i++) {
        const x = R() * w, y = 442 + R() * (h - 442);
        c.fillStyle = R() > .5 ? 'rgba(255,230,190,.08)' : 'rgba(0,0,0,.14)';
        c.fillRect(x, y, 3, 2);
      }
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 438, w, 5);
    });
    ctx.drawImage(bg, 0, 0, G.W, G.H);

    // факелы
    for (let i = 0; i < 3; i++) {
      const fx = 330 + i * 220, fy = 186;
      ctx.fillStyle = '#4a3218'; ctx.fillRect(fx - 3, fy - 4, 6, 26);
      const fl = 10 + Math.sin(t * 9 + i * 2) * 3.4;
      const gg = ctx.createRadialGradient(fx, fy - 12, 2, fx, fy - 12, 120);
      gg.addColorStop(0, 'rgba(255,190,90,.34)');
      gg.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(fx, fy - 12, 120, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,.95)';
      ctx.beginPath(); ctx.ellipse(fx, fy - 14, fl * .62, fl * 1.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,225,130,.95)';
      ctx.beginPath(); ctx.ellipse(fx, fy - 12, fl * .32, fl * .95, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,225,.9)';
      ctx.beginPath(); ctx.ellipse(fx, fy - 10, fl * .14, fl * .45, 0, 0, 7); ctx.fill();
    }
    // пылинки
    for (let i = 0; i < 22; i++) {
      const x = (i * 173 + Math.sin(t * .5 + i) * 30) % G.W;
      const y = 170 + ((i * 97 + t * 11) % 300);
      ctx.fillStyle = 'rgba(255,225,170,' + (0.12 + 0.1 * Math.sin(t * 2 + i)) + ')';
      ctx.fillRect(x, y, 2, 2);
    }
  };

  /* внутренность бочки — доски, гвозди, обручи */
  ART.barrelInside = function (ctx, t) {
    const bg = layer('inbarrel', G.W, G.H, function (c, w, h) {
      c.fillStyle = '#160f09'; c.fillRect(0, 0, w, h);
      const R = rng(20240);
      const n = 13, pw = (w - 60) / n;
      for (let i = 0; i < n; i++) {
        const x0 = 30 + i * pw;
        const k = 1 - Math.abs((x0 + pw / 2) - w / 2) / (w / 2);   // ближе к центру светлее
        const g = c.createLinearGradient(x0, 0, x0 + pw, 0);
        g.addColorStop(0, shade('#5a3c22', -0.45 + k * 0.3));
        g.addColorStop(.45, shade('#8a5f35', -0.35 + k * 0.55));
        g.addColorStop(1, shade('#4a3119', -0.4 + k * 0.25));
        c.fillStyle = g;
        c.fillRect(x0, 0, pw + 1, h);
        // волокна
        for (let q = 0; q < 7; q++) {
          const gx = x0 + 4 + R() * (pw - 8);
          c.strokeStyle = 'rgba(40,24,10,' + (0.18 + R() * 0.3) + ')';
          c.lineWidth = 1 + R() * 1.5;
          c.beginPath();
          c.moveTo(gx, -10);
          for (let y = 0; y <= h; y += 40) c.quadraticCurveTo(gx + (R() - .5) * 5, y + 20, gx + (R() - .5) * 3, y + 40);
          c.stroke();
        }
        // сучок
        if (R() > 0.6) {
          const ky = 60 + R() * (h - 120);
          const kg = c.createRadialGradient(x0 + pw / 2, ky, 1, x0 + pw / 2, ky, 12);
          kg.addColorStop(0, 'rgba(40,22,8,.9)'); kg.addColorStop(1, 'rgba(80,50,22,0)');
          c.fillStyle = kg;
          c.beginPath(); c.ellipse(x0 + pw / 2, ky, 9, 12, 0, 0, 7); c.fill();
        }
        c.fillStyle = 'rgba(10,6,3,.5)';
        c.fillRect(x0 + pw - 2, 0, 2.5, h);
      }
      // обручи сверху и снизу
      [46, h - 54].forEach(function (y) {
        const hg = c.createLinearGradient(0, y - 12, 0, y + 12);
        hg.addColorStop(0, '#4c525b'); hg.addColorStop(.35, '#79818c'); hg.addColorStop(1, '#31363d');
        c.fillStyle = hg; c.fillRect(0, y - 12, w, 24);
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, y - 11, w, 3);
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, y + 9, w, 4);
        for (let i = 0; i < 16; i++) {
          const x = 32 + i * 60;
          c.fillStyle = '#9aa2ad';
          c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.4)';
          c.beginPath(); c.arc(x + 1, y + 1, 2, 0, 7); c.fill();
        }
      });
      // общий сумрак по краям
      const vg = c.createLinearGradient(0, 0, w, 0);
      vg.addColorStop(0, 'rgba(0,0,0,.75)');
      vg.addColorStop(.5, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.75)');
      c.fillStyle = vg; c.fillRect(0, 0, w, h);
    });
    ctx.drawImage(bg, 0, 0, G.W, G.H);
  };

  /* луч света из дырки */
  ART.holeLight = function (ctx, x, y, k, t) {
    if (k <= 0.02) return;
    const r = 6 + k * 74;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 2, x, y, r * 3.4);
    g.addColorStop(0, 'rgba(255,248,214,.95)');
    g.addColorStop(.22, 'rgba(255,226,150,.42)');
    g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, 7); ctx.fill();
    // конус света внутрь бочки
    ctx.globalAlpha = 0.22 + 0.05 * Math.sin(t * 2);
    ctx.fillStyle = 'rgba(255,240,190,1)';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.6);
    ctx.lineTo(x - 360, y + 150);
    ctx.lineTo(x - 360, y + 300);
    ctx.lineTo(x, y + r * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6d2';
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.56, 0.25, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,30,.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.56, 0.25, 0, 7); ctx.stroke();
    ctx.restore();
  };

  /* ---------- мебель логова ---------- */
  ART.hangman = function (ctx, x, y, s, stones) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-8, 0, 8, 0);
    g.addColorStop(0, '#3d2814'); g.addColorStop(.5, '#7a5530'); g.addColorStop(1, '#33200f');
    ctx.fillStyle = g;
    ctx.fillRect(-7, -92, 14, 92);
    ctx.fillRect(-7, -98, 130, 12);
    ctx.fillStyle = '#2c1c0d';
    ctx.beginPath(); ctx.moveTo(7, -86); ctx.lineTo(34, -86); ctx.lineTo(7, -60); ctx.closePath(); ctx.fill();
    (stones || []).forEach(function (st, i) {
      const lx = 30 + i * 34;
      ctx.strokeStyle = '#cdbb92'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, -88); ctx.lineTo(lx, -62); ctx.stroke();
      ART.stone(ctx, lx, -48, 13, st.color, { face: true, sad: true, shadow: false, seed: i });
    });
    ctx.restore();
  };

  ART.table = function (ctx, x, y, s, stones) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, 62, 100, 10, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, 14);
    g.addColorStop(0, '#a67a43'); g.addColorStop(1, '#6d4a26');
    ctx.fillStyle = g; ctx.fillRect(-92, 0, 184, 14);
    ctx.fillStyle = 'rgba(255,230,180,.18)'; ctx.fillRect(-92, 0, 184, 3);
    ctx.fillStyle = '#5b3d20';
    ctx.fillRect(-80, 14, 12, 48); ctx.fillRect(68, 14, 12, 48);
    ctx.strokeStyle = 'rgba(50,30,12,.4)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-90 + i * 30, 1); ctx.lineTo(-90 + i * 30, 13); ctx.stroke(); }
    (stones || []).forEach(function (st, i) {
      ART.stone(ctx, -68 + i * 34, -12, 14, st.color, { face: true, seed: i * 2, stripes: st.stripes });
    });
    ctx.restore();
  };

  ART.cage = function (ctx, x, y, s, n) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(12,8,5,.82)'; ctx.fillRect(-52, -74, 104, 74);
    for (let i = 0; i < (n || 2); i++) ART.stone(ctx, -26 + i * 26, -14, 12, '#7d8490', { face: true, sad: true, seed: i, shadow: false });
    const bg2 = ctx.createLinearGradient(0, -74, 0, 0);
    bg2.addColorStop(0, '#99a2ad'); bg2.addColorStop(1, '#5b626b');
    ctx.strokeStyle = bg2; ctx.lineWidth = 4;
    for (let i = -52; i <= 52; i += 13) { ctx.beginPath(); ctx.moveTo(i, -74); ctx.lineTo(i, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-52, -74); ctx.lineTo(52, -74); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-52, -38); ctx.lineTo(52, -38); ctx.stroke();
    ctx.restore();
  };


  /* ---------- элементы ландшафта ---------- */
  ART.sandPatch = function (ctx, x, y, w, h, seed) {
    const R = rng(seed || 11);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x - w * .3, y - h * .4, 4, x, y, w);
    g.addColorStop(0, '#f0d9a6'); g.addColorStop(.6, '#e2c089'); g.addColorStop(1, '#c9a166');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 220; i++) {
      const px = x + (R() - .5) * w * 2, py = y + (R() - .5) * h * 2;
      ctx.fillStyle = R() > .5 ? 'rgba(255,246,214,.5)' : 'rgba(140,104,58,.3)';
      ctx.fillRect(px, py, 2, 2);
    }
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = 'rgba(170,132,80,.25)'; ctx.lineWidth = 2;
      ctx.beginPath();
      const yy = y - h + i * h * 0.45;
      for (let px = x - w; px <= x + w; px += 12) ctx.lineTo(px, yy + Math.sin(px * 0.05 + i) * 3);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(90,120,70,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };

  ART.river = function (ctx, x, y, w, h, t) {
    ctx.save();
    // берег
    ctx.fillStyle = 'rgba(120,96,58,.55)';
    ctx.beginPath(); ctx.ellipse(x, y, w + 14, h + 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, '#2e7fae'); g.addColorStop(.45, '#57aad6'); g.addColorStop(1, '#2b6f96');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // блики и рябь
    for (let i = 0; i < 8; i++) {
      const yy = y - h + 6 + i * (h * 2 - 12) / 7;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.16 + 0.16 * Math.abs(Math.sin(t + i))) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = x - w; px <= x + w; px += 10) ctx.lineTo(px, yy + Math.sin(px * 0.06 + t * 2 + i) * 2.4);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const px = x - w + ((i * 53 + t * 26) % (w * 2));
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.ellipse(px, y + Math.sin(i * 2 + t) * h * 0.5, 9, 2.4, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  };

  ART.rockHill = function (ctx, x, baseY, w, hgt, seed) {
    const R = rng(seed || 5);
    ctx.save();
    ctx.fillStyle = 'rgba(30,40,25,.25)';
    ctx.beginPath(); ctx.ellipse(x, baseY, w * 0.62, 12, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x - w / 2, baseY - hgt, x + w / 2, baseY);
    g.addColorStop(0, '#c6bda8'); g.addColorStop(.38, '#8d8577'); g.addColorStop(1, '#4d4841');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x - w * 0.18, baseY - hgt * 0.72);
    ctx.lineTo(x - w * 0.02, baseY - hgt);
    ctx.lineTo(x + w * 0.2, baseY - hgt * 0.66);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath(); ctx.fill();
    // грани
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.02, baseY - hgt);
    ctx.lineTo(x - w * 0.18, baseY - hgt * 0.72);
    ctx.lineTo(x - w * 0.06, baseY - hgt * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.02, baseY - hgt);
    ctx.lineTo(x + w * 0.2, baseY - hgt * 0.66);
    ctx.lineTo(x + w * 0.1, baseY - hgt * 0.18);
    ctx.closePath(); ctx.fill();
    // трещины и осыпь
    ctx.strokeStyle = 'rgba(40,36,30,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const sx = x + (R() - .5) * w * .7, sy = baseY - R() * hgt * .8;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (R() - .5) * 22, sy + 14 + R() * 20); ctx.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const sx = x + (R() - .5) * w, sy = baseY - R() * 18;
      const rr2 = 3 + R() * 7;
      const bg = ctx.createLinearGradient(sx - rr2, sy - rr2, sx + rr2, sy + rr2);
      bg.addColorStop(0, '#b0a795'); bg.addColorStop(1, '#635c52');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(sx, sy, rr2, rr2 * .7, R(), 0, 7); ctx.fill();
    }
    // мох на северной стороне
    ctx.fillStyle = 'rgba(90,140,70,.35)';
    for (let i = 0; i < 8; i++) {
      const sx = x - w * .35 + R() * w * .3, sy = baseY - 10 - R() * hgt * .5;
      ctx.beginPath(); ctx.ellipse(sx, sy, 10 + R() * 14, 5 + R() * 7, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  ART.lairEntrance = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1);
    // насыпь
    ctx.fillStyle = '#6b5233';
    ctx.beginPath(); ctx.ellipse(0, 6, 66, 28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#57402777';
    ctx.beginPath(); ctx.ellipse(0, 10, 66, 24, 0, 0, 7); ctx.fill();
    // дыра
    const g = ctx.createRadialGradient(0, -4, 3, 0, 0, 48);
    g.addColorStop(0, '#000'); g.addColorStop(1, '#20160d');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 23, 0, 0, 7); ctx.fill();
    // ступеньки внутри
    ctx.fillStyle = 'rgba(120,90,52,.8)';
    ctx.fillRect(-28, 2, 56, 5);
    ctx.fillStyle = 'rgba(120,90,52,.5)';
    ctx.fillRect(-20, 9, 40, 4);
    // доски-крышка
    const wg = ctx.createLinearGradient(0, -16, 0, -4);
    wg.addColorStop(0, '#8a6236'); wg.addColorStop(1, '#5b3f21');
    ctx.fillStyle = wg;
    ctx.fillRect(-42, -14, 84, 9);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-42 + i * 22, -14, 2, 9);
    // трава по краю
    ctx.strokeStyle = 'rgba(60,110,55,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = Math.PI + (i / 15) * Math.PI;
      const px = Math.cos(a) * 52, py = 6 + Math.sin(a) * 20;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 10); ctx.stroke();
    }
    ctx.restore();
  };

  /* колонна-ствол для главы с деревом */
  ART.trunkWall = function (ctx, cx, halfW, scroll) {
    const tile = layer('bark', halfW * 2, 320, function (c, w, h) {
      const R = rng(808);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#2c1d10'); g.addColorStop(.32, '#6d4a29');
      g.addColorStop(.55, '#8a6034'); g.addColorStop(1, '#27190d');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        const x = R() * w;
        c.strokeStyle = R() > .5 ? 'rgba(30,18,8,.55)' : 'rgba(190,150,100,.18)';
        c.lineWidth = 1 + R() * 3;
        c.beginPath();
        c.moveTo(x, -10);
        for (let y = 0; y <= h + 10; y += 40) c.quadraticCurveTo(x + (R() - .5) * 8, y + 20, x + (R() - .5) * 6, y + 40);
        c.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const x = R() * w, y = R() * h;
        const kg = c.createRadialGradient(x, y, 1, x, y, 14);
        kg.addColorStop(0, 'rgba(30,18,8,.85)'); kg.addColorStop(1, 'rgba(90,60,26,0)');
        c.fillStyle = kg; c.beginPath(); c.ellipse(x, y, 10, 14, 0, 0, 7); c.fill();
      }
    });
    const off = ((scroll % 320) + 320) % 320;
    ctx.save();
    ctx.drawImage(tile, cx - halfW, off - 320, halfW * 2, 320);
    ctx.drawImage(tile, cx - halfW, off, halfW * 2, 320);
    ctx.drawImage(tile, cx - halfW, off + 320, halfW * 2, 320);
    // объём ствола
    const vg = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
    vg.addColorStop(0, 'rgba(0,0,0,.55)');
    vg.addColorStop(.35, 'rgba(255,220,170,.12)');
    vg.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = vg; ctx.fillRect(cx - halfW, 0, halfW * 2, G.H);
    ctx.restore();
  };

  ART.vignette = function (ctx, strength) {
    const g = ctx.createRadialGradient(G.W / 2, G.H / 2, 120, G.W / 2, G.H / 2, 580);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength === undefined ? 0.55 : strength) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);
  };
})();
