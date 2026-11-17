/* 캔버스 렌더링: 보관소(정렬된 대기열) + 핀볼 필드 + 파티클 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const TAU = Math.PI * 2;

  function seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }
  function star5(ctx, x, y, R, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }

  /* ---------- 구슬 외형 20종 ---------- */
  function paintMarble(ctx, cx, cy, r, base, star) {
    const rnd = seeded(base * 97 + 13);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    const rg = (c0, c1, c2) => { const g = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .1, cx, cy, r * 1.05); g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); };
    const chrome = (a, b, c, d) => { const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r); g.addColorStop(0, a); g.addColorStop(.48, b); g.addColorStop(.52, c); g.addColorStop(1, d); ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); };
    const facets = (cols) => {
      const n = 8, ox = cx - r * .1, oy = cy - r * .12;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx + Math.cos(a0) * r * 1.2, cy + Math.sin(a0) * r * 1.2); ctx.lineTo(cx + Math.cos(a1) * r * 1.2, cy + Math.sin(a1) * r * 1.2); ctx.closePath();
        ctx.fillStyle = cols[i % cols.length]; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .4; ctx.lineTo(ox + Math.cos(a) * r * .42, oy + Math.sin(a) * r * .42); }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = r * .05; ctx.stroke();
    };
    const dots = (n, col, maxR) => { for (let i = 0; i < n; i++) { ctx.fillStyle = col; ctx.globalAlpha = .4 + rnd() * .6; ctx.beginPath(); ctx.arc(cx + (rnd() * 2 - 1) * r, cy + (rnd() * 2 - 1) * r, rnd() * maxR + r * .02, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; };
    const blob = (x, y, rr, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
    switch (base) {
      case 0: // 유리 + 캣츠아이
        rg('rgba(240,252,255,.9)', 'rgba(170,225,255,.55)', 'rgba(90,170,230,.75)');
        ctx.fillStyle = '#29a8ff'; ctx.beginPath(); ctx.moveTo(cx - r * .8, cy + r * .3); ctx.bezierCurveTo(cx - r * .2, cy - r * .6, cx + r * .2, cy + r * .6, cx + r * .8, cy - r * .3); ctx.bezierCurveTo(cx + r * .2, cy + r * .2, cx - r * .2, cy - r * .2, cx - r * .8, cy + r * .3); ctx.fill();
        ctx.fillStyle = '#ff6fae'; ctx.beginPath(); ctx.moveTo(cx - r * .3, cy - r * .8); ctx.bezierCurveTo(cx + r * .4, cy - r * .2, cx - r * .4, cy + r * .2, cx + r * .3, cy + r * .8); ctx.bezierCurveTo(cx - r * .1, cy + r * .2, cx + r * .1, cy - r * .2, cx - r * .3, cy - r * .8); ctx.fill();
        break;
      case 1: chrome('#ffd8ad', '#c8692c', '#5a2a10', '#e3955a'); break;
      case 2: chrome('#f7fbff', '#9aa6b8', '#4a5566', '#d8e1ee'); break;
      case 3: chrome('#fff6c8', '#f0b830', '#7a4c00', '#ffd76a'); break;
      case 4: rg('#b9ffd8', '#18b45f', '#04401f'); facets(['rgba(255,255,255,.18)', 'rgba(0,60,20,.25)', 'rgba(120,255,170,.2)', 'rgba(0,0,0,.15)']); break;
      case 5: rg('#bcd0ff', '#2752e8', '#06134d'); facets(['rgba(255,255,255,.18)', 'rgba(0,10,80,.3)', 'rgba(110,160,255,.25)', 'rgba(0,0,0,.18)']); break;
      case 6: rg('#ffc0c8', '#d41634', '#4a0010'); facets(['rgba(255,255,255,.2)', 'rgba(80,0,10,.3)', 'rgba(255,120,140,.22)', 'rgba(0,0,0,.18)']); break;
      case 7: rg('#ffffff', '#d8faff', '#8fc8e8'); facets(['rgba(255,255,255,.5)', 'rgba(150,200,255,.3)', 'rgba(255,190,240,.3)', 'rgba(190,255,220,.3)', 'rgba(255,250,170,.3)']); break;
      case 8: // 오팔
        rg('#ffffff', '#f2e8ff', '#c9b8e8');
        ['#ff9ad5', '#9af0ff', '#c4ff9a', '#fff19a', '#b49aff', '#ffb38a'].forEach((c, i) => blob(cx + (rnd() * 2 - 1) * r * .7, cy + (rnd() * 2 - 1) * r * .7, r * (.35 + rnd() * .3), hexA(c, .75)));
        break;
      case 9: // 플라즈마
        rg('#ffd6ff', '#9b1fd6', '#1a0230');
        ctx.strokeStyle = 'rgba(255,140,250,.85)'; ctx.lineWidth = r * .07;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); let x = cx, y = cy; const a = rnd() * TAU; for (let k = 1; k <= 4; k++) { x = cx + Math.cos(a + (rnd() - .5)) * r * k / 4; y = cy + Math.sin(a + (rnd() - .5)) * r * k / 4; ctx.lineTo(x, y); } ctx.stroke(); }
        blob(cx, cy, r * .5, 'rgba(255,255,255,.9)');
        break;
      case 10: // 용암
        rg('#5a2410', '#2b0d05', '#120400');
        ctx.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) {
          const r2 = seeded(777);
          ctx.strokeStyle = pass ? '#ffd040' : 'rgba(255,100,20,.7)'; ctx.lineWidth = pass ? r * .07 : r * .2;
          for (let i = 0; i < 5; i++) { ctx.beginPath(); let x = cx + (r2() * 2 - 1) * r, y = cy + (r2() * 2 - 1) * r; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r2() - .5) * r * .9; y += (r2() - .5) * r * .9; ctx.lineTo(x, y); } ctx.stroke(); }
        }
        break;
      case 11: // 냉기
        rg('#ffffff', '#a8e6ff', '#3b8fc4');
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = r * .08;
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * .7, cy + Math.sin(a) * r * .7); ctx.stroke(); const mx = cx + Math.cos(a) * r * .4, my = cy + Math.sin(a) * r * .4; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a + .8) * r * .2, my + Math.sin(a + .8) * r * .2); ctx.lineTo(mx, my); ctx.lineTo(mx + Math.cos(a - .8) * r * .2, my + Math.sin(a - .8) * r * .2); ctx.stroke(); }
        break;
      case 12: // 번개
        rg('#4a7dff', '#1636a8', '#050f3a');
        ctx.fillStyle = '#ffe94a'; ctx.beginPath(); ctx.moveTo(cx + r * .15, cy - r * .85); ctx.lineTo(cx - r * .45, cy + r * .1); ctx.lineTo(cx - r * .02, cy + r * .1); ctx.lineTo(cx - r * .2, cy + r * .85); ctx.lineTo(cx + r * .5, cy - r * .15); ctx.lineTo(cx + r * .05, cy - r * .15); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .06; ctx.stroke();
        break;
      case 13: // 태양
        rg('#ffffff', '#ffc93a', '#ff6a00');
        dots(5, 'rgba(200,80,0,.5)', r * .08); blob(cx, cy, r * .6, 'rgba(255,255,220,.8)');
        break;
      case 14: // 달
        rg('#fbfbf3', '#c6c6bc', '#6e6e66');
        for (let i = 0; i < 6; i++) { const x = cx + (rnd() * 1.6 - .8) * r, y = cy + (rnd() * 1.6 - .8) * r, rr = r * (.08 + rnd() * .16); ctx.fillStyle = 'rgba(90,90,80,.35)'; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = r * .03; ctx.beginPath(); ctx.arc(x + rr * .15, y + rr * .15, rr, Math.PI * .1, Math.PI * .9); ctx.stroke(); }
        break;
      case 15: // 별
        rg('#4a5cc8', '#1a2672', '#060a2a');
        dots(10, '#fff', r * .04); blob(cx, cy, r * .8, 'rgba(255,230,120,.5)');
        ctx.fillStyle = '#ffe27a'; star5(ctx, cx, cy, r * .62, r * .26, 0); ctx.fill(); ctx.strokeStyle = '#fff8d0'; ctx.lineWidth = r * .05; ctx.stroke();
        break;
      case 16: // 성운
        rg('#3a1060', '#16052c', '#05010d');
        blob(cx - r * .3, cy - r * .2, r * .8, 'rgba(255,90,170,.8)'); blob(cx + r * .35, cy + r * .2, r * .7, 'rgba(140,80,255,.8)'); blob(cx, cy + r * .45, r * .5, 'rgba(60,210,255,.6)');
        dots(14, '#fff', r * .04);
        break;
      case 17: // 은하 (나선팔)
        rg('#1a1a40', '#07071a', '#000005');
        for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 60; i++) {
          const tt = i / 60, a = arm * Math.PI + tt * 4.2, rr = tt * r * .95;
          ctx.fillStyle = tt < .3 ? '#fff6d8' : (i % 3 ? '#a8b8ff' : '#ffb8f0'); ctx.globalAlpha = 1 - tt * .6;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr + (rnd() - .5) * r * .12, cy + Math.sin(a) * rr * .8 + (rnd() - .5) * r * .12, r * (.05 - tt * .03), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1; blob(cx, cy, r * .35, 'rgba(255,250,220,.95)');
        break;
      case 18: // 블랙홀
        ctx.fillStyle = '#05000a'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        blob(cx, cy, r * 1.1, 'rgba(140,40,220,.5)');
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .38);
        const ag = ctx.createRadialGradient(0, 0, r * .4, 0, 0, r * 1.0); ag.addColorStop(0, '#fff2c0'); ag.addColorStop(.4, '#ff9a2a'); ag.addColorStop(.75, '#c03cff'); ag.addColorStop(1, 'rgba(80,0,120,0)');
        ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, r * 1.0, 0, TAU); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, r * .38, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,230,180,.9)'; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.arc(cx, cy, r * .42, 0, TAU); ctx.stroke();
        break;
      case 19: // 우주
        rg('#3a1488', '#120638', '#02010a');
        blob(cx - r * .4, cy + r * .1, r * .7, 'rgba(255,80,180,.55)'); blob(cx + r * .4, cy - r * .3, r * .6, 'rgba(60,200,255,.5)'); blob(cx + r * .2, cy + r * .5, r * .5, 'rgba(255,210,90,.45)');
        dots(26, '#fff', r * .045);
        ctx.fillStyle = '#fff'; star5(ctx, cx - r * .2, cy - r * .25, r * .22, r * .06, .2); ctx.fill();
        blob(cx - r * .2, cy - r * .25, r * .3, 'rgba(255,255,255,.7)');
        break;
    }
    // 공통 음영 + 하이라이트
    const sh = ctx.createRadialGradient(cx - r * .3, cy - r * .35, r * .2, cx, cy, r);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.75, 'rgba(0,0,0,.08)'); sh.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = sh; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    const hl = ctx.createRadialGradient(cx - r * .38, cy - r * .42, 0, cx - r * .38, cy - r * .42, r * .45);
    hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.restore();
    // 별 등급 테두리
    const sc = PM.starColor(star, 0);
    if (sc) {
      ctx.strokeStyle = sc; ctx.lineWidth = Math.max(1.2, r * .16);
      ctx.beginPath(); ctx.arc(cx, cy, r * .93, 0, TAU); ctx.stroke();
      if (star >= 3) { ctx.lineWidth = Math.max(.8, r * .06); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx, cy, r * .78, 0, TAU); ctx.stroke(); }
      // 테두리 위 작은 별 점
      const n = Math.min(star, 8);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * .42; star5(ctx, cx + Math.cos(a) * r * .93, cy + Math.sin(a) * r * .93, r * .17, r * .07, 0); ctx.fill(); }
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(.6, r * .05); ctx.beginPath(); ctx.arc(cx, cy, r * .97, 0, TAU); ctx.stroke();
    }
  }

  const spriteCache = new Map();
  function marbleSprite(tier, pr) {
    const info = PM.tierInfo(tier);
    const star = Math.min(info.star, 40);
    pr = Math.max(4, Math.round(pr));
    const key = info.base + '_' + star + '_' + pr;
    let c = spriteCache.get(key);
    if (!c) {
      if (spriteCache.size > 400) spriteCache.clear();
      c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(pr * 2 + 4, pr * 2 + 4) : Object.assign(document.createElement('canvas'), { width: pr * 2 + 4, height: pr * 2 + 4 });
      paintMarble(c.getContext('2d'), pr + 2, pr + 2, pr, info.base, star);
      spriteCache.set(key, c);
    }
    return c;
  }
  const glowCache = new Map();
  function glowSprite(color) {
    let c = glowCache.get(color);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, hexA(color, .9)); g.addColorStop(.35, hexA(color, .35)); g.addColorStop(1, hexA(color, 0));
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowCache.set(color, c);
    }
    return c;
  }
  PM.marbleDataURL = function (tier, px) {
    const c = document.createElement('canvas'); c.width = c.height = px * 2 + 4;
    paintMarble(c.getContext('2d'), px + 2, px + 2, px, PM.tierInfo(tier).base, PM.tierInfo(tier).star);
    return c.toDataURL();
  };

  /* ---------- 렌더러 ---------- */
  class Renderer {
    constructor(canvas, game) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.game = game;
      this.parts = []; this.texts = []; this.storeFx = []; this.returns = [];
      this.items = new Map(); this.slotPos = {}; this.heldPos = {};
      this.time = 0; this.showHit = false; this.highlightSlot = -1;
      this.resize();
    }
    get pmax() { const p = this.game.settings.particles; return p === 'low' ? 120 : p === 'high' ? 650 : 320; }
    resize() {
      const r = this.cv.getBoundingClientRect();
      const low = this.game.settings.particles === 'low';
      this.dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2);
      this.w = Math.max(200, r.width); this.h = Math.max(300, r.height);
      this.cv.width = Math.round(this.w * this.dpr); this.cv.height = Math.round(this.h * this.dpr);
      // 필드 비율(360:400)을 우선 확보하고 남는 높이는 보관소에 배정 (보관소 20~32%)
      const need = this.w / PM.FIELD_W * PM.FIELD_H + 4;
      this.storeH = Math.round(Math.min(this.h * 0.32, Math.max(this.h * 0.2, this.h - need)));
      const fh = this.h - this.storeH - 4;
      this.sc = Math.min(this.w / PM.FIELD_W, fh / PM.FIELD_H);
      this.fx0 = (this.w - PM.FIELD_W * this.sc) / 2; this.fy0 = this.storeH + 2 + (fh - PM.FIELD_H * this.sc) / 2;
      this.bg = null;
    }
    toScreen(x, y) { return [this.fx0 + x * this.sc, this.fy0 + y * this.sc]; }

    /* ---------- 이벤트 훅 ---------- */
    onHit(b, d, v) {
      const info = PM.tierInfo(b.tier);
      this.spawnHitFx(info, b.x, b.y, d);
      if (this.game.settings.texts && this.texts.length < 36) this.texts.push({ x: b.x, y: b.y - 10, s: '+' + PM.fmt(v), c: info.m.g, life: .8, max: .8, size: 9, field: true });
    }
    onGoal(b, gain, reason) {
      const info = PM.tierInfo(b.tier);
      const label = reason === 'goal' ? '+' + PM.fmt(gain) : (reason === 'safe' ? '안전 복귀 +' : '복구 +') + PM.fmt(gain);
      this.texts.push({ x: Math.min(300, Math.max(60, b.x)), y: 372, s: label, c: reason === 'goal' ? '#fff3a0' : '#ffb070', life: 1.3, max: 1.3, size: reason === 'goal' ? 15 : 12, field: true, bold: true });
      this.ring(Math.min(220, Math.max(140, b.x)), 392, info.m.g, 34, .5, 3);
      for (let i = 0; i < 8; i++) this.addP({ k: 'dot', x: b.x, y: 390, vx: (Math.random() - .5) * 160, vy: -Math.random() * 160, life: .6, size: 2, c: info.m.g, g: 300 });
      const [sx, sy] = this.toScreen(Math.min(220, Math.max(140, b.x)), 392);
      this.returns.push({ tier: b.tier, sx, sy, t: 0 });
      if (this.returns.length > 14) this.returns.shift();
    }
    onMerge(t, m) {
      if (this.storeFx.length < 8) this.storeFx.push({ tier: t, m, t: 0 });
    }
    onLaunch(b) {
      const p = this.slotPos[b.tier];
      b.fromX = p ? p[0] : this.w / 2; b.fromY = p ? p[1] : this.storeH / 2;
    }
    onUnlock(d) { if (d) { const x = d.x !== undefined ? d.x : (d.x1 + d.x2) / 2, y = d.y !== undefined ? d.y : (d.y1 + d.y2) / 2; this.ring(x, y, '#ffffff', 60, .8, 4); this.ring(x, y, '#ffd34a', 40, .6, 3); } }

    addP(p) { if (this.parts.length >= this.pmax) return; p.max = p.life; this.parts.push(p); }
    ring(x, y, c, R, life, w, shrink) { this.addP({ k: 'ring', x, y, c, R, life, w: w || 2, shrink: !!shrink }); }

    spawnHitFx(info, x, y, d) {
      const it = this.game.settings.fx;
      if (it <= 0) return;
      const load = this.parts.length / this.pmax;
      let n = Math.round((3 + Math.min(info.star, 4)) * it * (load > .7 ? .4 : 1));
      const R = Math.random, c = info.m.g, fx = info.m.fx;
      const burst = (k, cnt, sp, life, size, col, extra) => { for (let i = 0; i < cnt; i++) { const a = R() * TAU, s = sp * (.4 + R() * .6); this.addP(Object.assign({ k, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (.6 + R() * .4), size, c: col, rot: R() * TAU, vr: (R() - .5) * 12 }, extra || {})); } };
      switch (fx) {
        case 'glass': burst('glint', n, 60, .45, 3, '#ffffff'); break;
        case 'copper': burst('spark', n + 2, 220, .35, 1.4, '#ff9a4a', { g: 500 }); break;
        case 'silver': burst('spark', n + 2, 240, .35, 1.3, '#eaf4ff', { g: 400 }); break;
        case 'gold': burst('spark', n + 1, 220, .4, 1.5, '#ffd75e', { g: 400 }); burst('glint', 1, 10, .4, 4, '#fff6c0'); break;
        case 'emerald': burst('shard', n, 150, .55, 3, '#4dff9a', { g: 300 }); break;
        case 'sapphire': burst('shard', n, 150, .55, 3, '#6d95ff', { g: 300 }); break;
        case 'ruby': burst('shard', n, 150, .55, 3, '#ff4a64', { g: 300 }); break;
        case 'diamond': for (let i = 0; i < n; i++) burst('shard', 1, 170, .6, 3, ['#ff9ad5', '#9af0ff', '#fff19a', '#c4ff9a', '#ffffff'][i % 5], { g: 250 }); burst('glint', 1, 0, .35, 7, '#ffffff'); break;
        case 'opal': burst('bubble', n, 50, .8, 3.5, ['#ff9ad5', '#9af0ff', '#c4ff9a', '#fff19a'][Math.floor(R() * 4)], { g: -40 }); break;
        case 'plasma': for (let i = 0; i < Math.max(2, n >> 1); i++) this.addP({ k: 'arc', x, y, a: R() * TAU, L: 14 + R() * 10, life: .2, c: '#ff8cf8', seed: R() * 1e9 }); this.ring(x, y, '#ff6cf7', 14, .25, 1.5); break;
        case 'lava': burst('ember', n + 2, 70, .9, 2, '#ff8a2a', { g: -90 }); burst('cloud', 1, 15, .8, 7, '#553322', { g: -30 }); break;
        case 'ice': burst('flake', n, 70, .8, 4, '#dff8ff', { g: 40 }); this.ring(x, y, '#c9f4ff', 16, .35, 2); break;
        case 'bolt': for (let i = 0; i < 2; i++) this.addP({ k: 'arc', x, y, a: R() * TAU, L: 22 + R() * 14, life: .18, c: '#fff36b', seed: R() * 1e9 }); this.addP({ k: 'flash', x, y, life: .12, size: 22, c: '#fff6a0' }); break;
        case 'sun': this.ring(x, y, '#ffd34a', 26, .45, 3); burst('ray', 6, 0, .35, 16, '#ffe680'); break;
        case 'moon': burst('mote', n, 30, 1.0, 2.2, '#f0efff', { g: -15 }); this.ring(x, y, '#e8e6ff', 18, .5, 1.2); break;
        case 'star': burst('star', n, 120, .6, 3.5, '#fff0a0', { g: 120 }); break;
        case 'nebula': burst('cloud', 3, 30, .9, 8, ['#ff5fae', '#a07bff', '#55d8ff'][Math.floor(R() * 3)]); burst('mote', n, 50, .8, 1.6, '#ffffff'); break;
        case 'galaxy': for (let i = 0; i < n + 3; i++) this.addP({ k: 'orbit', x, y, a: i / (n + 3) * TAU, rad: 4, life: .7, c: i % 2 ? '#b9c4ff' : '#ffd0f4', size: 1.8 }); break;
        case 'blackhole': this.ring(x, y, '#b05cff', 26, .45, 3, true); this.ring(x, y, '#ffb050', 16, .35, 1.5, true); break;
        case 'cosmos': burst('ray', 8, 0, .4, 22, '#ffffff'); burst('star', n, 140, .7, 3, ['#ffffff', '#ffd86a', '#9af0ff', '#ff9ad5'][Math.floor(R() * 4)], { g: 60 }); this.ring(x, y, '#c8b8ff', 24, .4, 2); break;
      }
      if (info.star >= 2) this.ring(x, y, PM.starColor(info.star, this.time), 10 + info.star * 4, .3, 1.5);
    }

    /* ---------- 그리기 ---------- */
    draw(dt) {
      this.time += dt;
      const ctx = this.ctx, g = this.game;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      this.drawStorage(ctx, dt);
      // 필드 (논리 좌표)
      ctx.setTransform(this.dpr * this.sc, 0, 0, this.dpr * this.sc, this.dpr * this.fx0, this.dpr * this.fy0);
      if (!this.bg) this.bg = this.makeBg();
      ctx.drawImage(this.bg, 0, 0, PM.FIELD_W, PM.FIELD_H);
      this.drawGoal(ctx);
      this.drawDevices(ctx);
      this.drawLauncher(ctx);
      this.drawBalls(ctx, dt);
      this.drawParticles(ctx, dt);
      this.drawTexts(ctx, dt);
      // 보관소 연출(화면 좌표)
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.drawReturns(ctx, dt);
    }
    makeBg() {
      const c = document.createElement('canvas'), s = Math.min(3, this.sc * this.dpr);
      c.width = Math.round(PM.FIELD_W * s); c.height = Math.round(PM.FIELD_H * s);
      const x = c.getContext('2d'); x.scale(s, s);
      const g = x.createLinearGradient(0, 0, 0, PM.FIELD_H); g.addColorStop(0, '#0d1033'); g.addColorStop(.6, '#160c36'); g.addColorStop(1, '#1d0a2e');
      x.fillStyle = g; x.fillRect(0, 0, PM.FIELD_W, PM.FIELD_H);
      x.fillStyle = 'rgba(140,160,255,.07)';
      for (let yy = 10; yy < PM.FIELD_H; yy += 20) for (let xx = (yy / 20 % 2) * 10 + 10; xx < PM.FIELD_W; xx += 20) { x.beginPath(); x.arc(xx, yy, 1, 0, TAU); x.fill(); }
      const rnd = seeded(5); x.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) { x.globalAlpha = rnd() * .4; x.beginPath(); x.arc(rnd() * PM.FIELD_W, rnd() * PM.FIELD_H, rnd() * 1.1, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
      // 외벽과 깔때기
      x.lineCap = 'round';
      const wall = (pts, col) => { x.strokeStyle = hexA(col, .25); x.lineWidth = 9; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.strokeStyle = col; x.lineWidth = 2.5; x.stroke(); };
      wall([[1, 0], [1, 328], [140, 384]], '#5fd0ff');
      wall([[359, 0], [359, 328], [220, 384]], '#5fd0ff');
      x.strokeStyle = 'rgba(95,208,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 1); x.lineTo(360, 1); x.stroke();
      return c;
    }
    drawGoal(ctx) {
      const p = .5 + .5 * Math.sin(this.time * 3);
      const g = ctx.createLinearGradient(0, 380, 0, 400); g.addColorStop(0, `rgba(255,220,90,${.15 + p * .2})`); g.addColorStop(1, 'rgba(255,140,40,.55)');
      ctx.fillStyle = g; ctx.fillRect(140, 384, 80, 16);
      ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 1.5; ctx.strokeRect(140.5, 384.5, 79, 15);
      ctx.fillStyle = '#fff6c8'; ctx.font = 'bold 11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('GOAL', 180, 393);
    }
    drawDevices(ctx) {
      const t = this.time;
      for (const d of this.game.field.devices) {
        if (d.locked) {
          const next = d.slot === this.game.unlocked;
          const hl = d.slot === this.highlightSlot;
          ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = hl ? '#ffd34a' : `rgba(200,210,255,${next ? .28 + .15 * Math.sin(t * 4) : .13})`; ctx.lineWidth = hl ? 2 : 1;
          if (d.kind === 'slope') { ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke(); }
          else if (d.kind === 'spinner') { ctx.beginPath(); ctx.arc(d.x, d.y, d.len, 0, TAU); ctx.stroke(); }
          else { ctx.beginPath(); ctx.arc(d.x, d.y, d.r + 1, 0, TAU); ctx.stroke(); }
          ctx.restore();
          if (next || hl) { const cx = d.x !== undefined ? d.x : (d.x1 + d.x2) / 2, cy = d.y !== undefined ? d.y : (d.y1 + d.y2) / 2; ctx.fillStyle = 'rgba(255,220,120,.6)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🔒', cx, cy + 3); }
          continue;
        }
        const f = d.flash, ua = d.unlockAnim, sc = 1 - ua * ua * .8;
        if (d.kind === 'bumper') {
          const r = d.r * (1 + f * .12) * sc;
          ctx.drawImage(glowSprite('#ff4fd8'), d.x - r * 2, d.y - r * 2, r * 4, r * 4);
          const g = ctx.createRadialGradient(d.x - r * .3, d.y - r * .3, 1, d.x, d.y, r);
          g.addColorStop(0, f > .1 ? '#ffffff' : '#ffb3f0'); g.addColorStop(.6, '#d62fae'); g.addColorStop(1, '#5a0f5a');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, TAU); ctx.fill();
          ctx.strokeStyle = f > .1 ? '#ffffff' : '#ff9cf0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(d.x, d.y, r - 1, 0, TAU); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(d.x, d.y, r * .55, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#fff'; star5(ctx, d.x, d.y, r * .32, r * .13, t * .8); ctx.fill();
        } else if (d.kind === 'pin') {
          const r = d.r * sc;
          if (f > 0) ctx.drawImage(glowSprite('#9fe3ff'), d.x - 12, d.y - 12, 24, 24);
          const g = ctx.createRadialGradient(d.x - 1.5, d.y - 1.5, .5, d.x, d.y, r);
          g.addColorStop(0, '#ffffff'); g.addColorStop(.5, f > .1 ? '#e8fbff' : '#9fb4d8'); g.addColorStop(1, '#3a4a70');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, TAU); ctx.fill();
        } else if (d.kind === 'slope') {
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(255,190,70,${.25 + f * .4})`; ctx.lineWidth = d.th * 2 + 6 * sc; ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
          ctx.strokeStyle = f > .1 ? '#fff4c0' : '#ffb840'; ctx.lineWidth = d.th * 2 * sc; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
        } else if (d.kind === 'spinner') {
          const c = Math.cos(d.ang) * d.len * sc, s = Math.sin(d.ang) * d.len * sc;
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(150,110,255,${.3 + f * .4})`; ctx.lineWidth = d.th * 2 + 6; ctx.beginPath(); ctx.moveTo(d.x - c, d.y - s); ctx.lineTo(d.x + c, d.y + s); ctx.stroke();
          ctx.strokeStyle = f > .1 ? '#ffffff' : '#b49aff'; ctx.lineWidth = d.th * 2; ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(180,154,255,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(d.x, d.y, d.len + 2, 0, TAU); ctx.stroke();
        }
        if (this.showHit) { ctx.strokeStyle = 'lime'; ctx.lineWidth = .5; if (d.r) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.stroke(); } }
      }
    }
    drawLauncher(ctx) {
      const x = this.game.field.launcherX(this.game.time);
      ctx.strokeStyle = 'rgba(120,200,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, 6); ctx.lineTo(300, 6); ctx.stroke();
      ctx.fillStyle = '#7fd8ff'; ctx.beginPath(); ctx.moveTo(x - 10, 2); ctx.lineTo(x + 10, 2); ctx.lineTo(x + 5, 12); ctx.lineTo(x - 5, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, 4, 4, 5);
    }
    drawBalls(ctx, dt) {
      const g = this.game, pr = g.cfg.ballR * this.sc * this.dpr, trails = g.settings.trails;
      const prev = ctx.globalCompositeOperation;
      for (const b of g.balls) {
        const info = PM.tierInfo(b.tier), r = b.r;
        if (b.delay > 0) { // 보관소 → 발사대 비행 (화면 좌표 → 논리 좌표)
          const k = 1 - b.delay / 0.22, ex = b.sx, ey = b.sy;
          const fx = ((b.fromX || this.w / 2) - this.fx0) / this.sc, fy = ((b.fromY || 0) - this.fy0) / this.sc;
          const x = fx + (ex - fx) * k, y = fy + (ey - fy) * k - Math.sin(k * Math.PI) * 20;
          const spr0 = marbleSprite(b.tier, pr), sz0 = spr0.width / pr * r;
          ctx.drawImage(spr0, x - sz0 / 2, y - sz0 / 2, sz0, sz0);
          continue;
        }
        if (trails) {
          b.trail.push(b.x, b.y);
          const maxL = (4 + Math.min(10, info.base / 2 + info.star * 2)) * 2;
          while (b.trail.length > maxL) b.trail.splice(0, 2);
          ctx.globalCompositeOperation = 'lighter';
          const n = b.trail.length / 2;
          for (let i = 0; i < n - 1; i++) {
            const a = (i + 1) / n;
            ctx.globalAlpha = a * .35; ctx.fillStyle = info.m.g;
            ctx.beginPath(); ctx.arc(b.trail[i * 2], b.trail[i * 2 + 1], r * (.3 + a * .55), 0, TAU); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // 광채
        ctx.globalCompositeOperation = 'lighter';
        const gl = r * (1.6 + Math.min(1.6, info.base * .05 + info.star * .25));
        ctx.globalAlpha = .45 + (info.base >= 9 ? .2 * Math.sin(this.time * 8 + b.id) : 0);
        ctx.drawImage(glowSprite(info.m.g), b.x - gl, b.y - gl, gl * 2, gl * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = prev;
        const spr = marbleSprite(b.tier, pr), sz = (spr.width / pr) * r;
        if (info.base >= 17 || info.base === 9) {
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(this.time * (info.base === 18 ? 2.5 : 1.2)); ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
        } else ctx.drawImage(spr, b.x - sz / 2, b.y - sz / 2, sz, sz);
        if (info.base === 12 && Math.random() < .04) this.addP({ k: 'arc', x: b.x, y: b.y, a: Math.random() * TAU, L: 12, life: .1, c: '#fff36b', seed: Math.random() * 1e9 });
        if (b.reserved) { ctx.strokeStyle = 'rgba(120,255,170,.8)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(b.x, b.y, r + 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        if (b.guided) { ctx.strokeStyle = 'rgba(255,170,80,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, r + 5, 0, TAU); ctx.stroke(); }
      }
    }
    drawParticles(ctx, dt) {
      const ps = this.parts; let w = 0;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]; p.life -= dt;
        if (p.life <= 0) continue;
        ps[w++] = p;
        const a = p.life / p.max;
        if (p.vx !== undefined) { p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; }
        if (p.rot !== undefined) p.rot += (p.vr || 0) * dt;
        ctx.globalAlpha = Math.min(1, a * 1.3);
        ctx.fillStyle = ctx.strokeStyle = p.c;
        switch (p.k) {
          case 'dot': case 'mote': case 'ember': ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.k === 'ember' ? a : 1), 0, TAU); ctx.fill(); break;
          case 'spark': ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke(); break;
          case 'glint': { const s = p.size * (0.5 + a); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s); ctx.stroke(); break; }
          case 'shard': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size * .6, p.size * .5); ctx.lineTo(-p.size * .6, p.size * .5); ctx.closePath(); ctx.fill(); ctx.restore(); break;
          case 'bubble': ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - a * .4), 0, TAU); ctx.stroke(); break;
          case 'flake': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = .7; ctx.beginPath(); for (let k = 0; k < 3; k++) { const an = k * Math.PI / 3; ctx.moveTo(Math.cos(an) * p.size, Math.sin(an) * p.size); ctx.lineTo(-Math.cos(an) * p.size, -Math.sin(an) * p.size); } ctx.stroke(); ctx.restore(); break;
          case 'cloud': ctx.globalAlpha = a * .35; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - a * .6), 0, TAU); ctx.fill(); break;
          case 'star': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); star5(ctx, 0, 0, p.size, p.size * .42, 0); ctx.fill(); ctx.restore(); break;
          case 'ring': { const R = p.shrink ? p.R * a : p.R * (1 - a * .8); ctx.lineWidth = p.w * a + .3; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, R), 0, TAU); ctx.stroke(); break; }
          case 'ray': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.size * .3 * (1 - a), 0); ctx.lineTo(p.size * (1.2 - a * .6), 0); ctx.stroke(); ctx.restore(); break;
          case 'flash': ctx.globalAlpha = a; ctx.drawImage(glowSprite('#fff6a0'), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); break;
          case 'orbit': { p.a += dt * 7; p.rad += dt * 30; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.a) * p.rad, p.y + Math.sin(p.a) * p.rad * .7, p.size, 0, TAU); ctx.fill(); break; }
          case 'arc': { const r = seeded(p.seed + Math.floor(this.time * 30)); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(p.x, p.y); for (let k = 1; k <= 5; k++) { const d = p.L * k / 5; ctx.lineTo(p.x + Math.cos(p.a) * d + (r() - .5) * 6, p.y + Math.sin(p.a) * d + (r() - .5) * 6); } ctx.stroke(); break; }
        }
      }
      ps.length = w;
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    drawTexts(ctx, dt) {
      const ts = this.texts; let w = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const t of ts) {
        t.life -= dt; if (t.life <= 0) continue; ts[w++] = t;
        const a = t.life / t.max; t.y -= dt * (t.bold ? 22 : 30);
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.font = `${t.bold ? '800' : '700'} ${t.size}px system-ui,sans-serif`;
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.s, t.x, t.y);
        ctx.fillStyle = t.c; ctx.fillText(t.s, t.x, t.y);
      }
      ts.length = w; ctx.globalAlpha = 1;
    }

    /* ---------- 보관소 ---------- */
    storageLayout() {
      const g = this.game, out = [], held = [];
      for (let t = g.s.length - 1; t >= 1; t--) {
        const fr = g.free(t), h = g.held(t);
        if (fr > 0) {
          if (fr <= 3) for (let i = 0; i < fr; i++) out.push({ key: 'f' + t + '_' + i, tier: t, n: 1, first: i === 0 });
          else out.push({ key: 'g' + t, tier: t, n: fr, first: true });
        }
        if (g.mergeOn && g.quota(t) > 0) held.push({ tier: t, h, quota: g.quota(t) });
      }
      return { out, held };
    }
    drawStorage(ctx, dt) {
      const g = this.game, W = this.w, H = this.storeH;
      // 패널
      const pg = ctx.createLinearGradient(0, 0, 0, H); pg.addColorStop(0, '#171a44'); pg.addColorStop(1, '#0d0f2c');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(120,170,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, H - .5); ctx.lineTo(W, H - .5); ctx.stroke();
      ctx.font = '600 11px system-ui,sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillStyle = '#9fb4ff'; ctx.fillText('보관소 · 높은 티어 우선 발사', 10, 6);
      ctx.textAlign = 'right'; ctx.fillStyle = '#c8d4ff';
      const fieldN = g.balls.length;
      ctx.fillText(`필드 ${fieldN} · 대기 ${PM.fmt(g.totalBalls - fieldN)}`, W - 10, 6);

      const { out, held } = this.storageLayout();
      const heldW = g.mergeOn ? Math.min(150, W * .36) : Math.min(110, W * .3);
      const qx0 = 10, qx1 = W - heldW - 12, top = 24;
      const rr = Math.max(8, Math.min(13, (H - top - 22) / 5));
      const step = rr * 2 + 8, perRow = Math.max(1, Math.floor((qx1 - qx0) / step));
      const rows = Math.max(1, Math.floor((H - top - 6) / (rr * 2 + 16)));
      const cap = perRow * rows;
      const vis = out.slice(0, out.length > cap ? cap - 1 : cap);
      const more = out.length - vis.length;
      // 트레이
      ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.strokeStyle = 'rgba(160,190,255,.18)';
      roundRect(ctx, qx0 - 4, top - 2, qx1 - qx0 + 4, H - top - 6, 8); ctx.fill(); ctx.stroke();
      const pr = rr * this.dpr, seen = new Set();
      this.slotPos = {};
      vis.forEach((it, i) => {
        const row = Math.floor(i / perRow), col = i % perRow;
        const tx = qx0 + rr + 4 + col * step, ty = top + rr + 4 + row * (rr * 2 + 16);
        let p = this.items.get(it.key);
        if (!p) { p = { x: tx + 30, y: ty, s: 0 }; this.items.set(it.key, p); }
        p.x += (tx - p.x) * Math.min(1, dt * 10); p.y += (ty - p.y) * Math.min(1, dt * 10); p.s += (1 - p.s) * Math.min(1, dt * 8);
        seen.add(it.key);
        if (!this.slotPos[it.tier]) this.slotPos[it.tier] = [p.x, p.y];
        const info = PM.tierInfo(it.tier), r = rr * p.s;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35;
        ctx.drawImage(glowSprite(info.m.g), p.x - r * 1.8, p.y - r * 1.8, r * 3.6, r * 3.6);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        const spr = marbleSprite(it.tier, pr), sz = spr.width / pr * r;
        ctx.drawImage(spr, p.x - sz / 2, p.y - sz / 2, sz, sz);
        if (i === 0) { ctx.fillStyle = '#7fffb0'; ctx.font = '800 8px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('NEXT', p.x, p.y - rr - 1); }
        if (it.first || it.n > 1) {
          ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '700 9px system-ui';
          ctx.fillStyle = '#dfe6ff'; ctx.fillText('T' + it.tier + (it.n > 1 ? ' ×' + PM.fmt(it.n) : ''), p.x, p.y + rr + 2);
        }
      });
      for (const k of this.items.keys()) if (!seen.has(k)) this.items.delete(k);
      if (more > 0) { ctx.fillStyle = '#9fb4ff'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const i = vis.length, row = Math.floor(i / perRow), col = i % perRow; ctx.fillText('+' + more + '종', qx0 + rr + 4 + col * step, top + rr + 4 + row * (rr * 2 + 16)); }
      if (!vis.length) { ctx.fillStyle = 'rgba(200,210,255,.5)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('모든 구슬이 주행/대기 중', (qx0 + qx1) / 2, (top + H) / 2); }
      // 병합 대기 구역
      const hx = W - heldW - 4, hw = heldW - 6;
      ctx.fillStyle = g.mergeOn ? 'rgba(80,255,160,.06)' : 'rgba(255,255,255,.03)'; ctx.strokeStyle = g.mergeOn ? 'rgba(110,255,170,.35)' : 'rgba(160,160,190,.2)';
      roundRect(ctx, hx, top - 2, hw, H - top - 6, 8); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '700 10px system-ui';
      ctx.fillStyle = g.mergeOn ? '#8dffbd' : '#9a9ab8';
      ctx.fillText(g.mergeOn ? '병합 대기 (3→1)' : '자동 병합 OFF', hx + hw / 2, top + 2);
      this.heldPos = {};
      if (g.mergeOn) {
        const hr = Math.max(6, rr * .62), lineH = hr * 2 + 6, maxL = Math.max(1, Math.floor((H - top - 24) / lineH));
        if (!held.length) { ctx.fillStyle = 'rgba(200,255,220,.45)'; ctx.font = '10px system-ui'; ctx.textBaseline = 'middle'; ctx.fillText('같은 티어 3개 이상 시 예약', hx + hw / 2, (top + 18 + H) / 2); }
        held.slice(0, maxL).forEach((h, i) => {
          const y = top + 18 + hr + i * lineH, x0 = hx + 8;
          for (let k = 0; k < 3; k++) {
            const cx = x0 + hr + k * (hr * 2 + 2);
            if (k < h.h) { const spr = marbleSprite(h.tier, hr * this.dpr), sz = spr.width / (hr * this.dpr) * hr; ctx.drawImage(spr, cx - sz / 2, y - sz / 2, sz, sz); }
            else { ctx.strokeStyle = 'rgba(160,255,200,.35)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(cx, y, hr - 1, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
          }
          this.heldPos[h.tier] = [x0 + hr * 3 + 2, y];
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '700 10px system-ui'; ctx.fillStyle = '#e8fff0';
          ctx.fillText(`T${h.tier} ${h.h}/3`, x0 + hr * 6 + 10, y - 5);
          ctx.font = '9px system-ui'; ctx.fillStyle = '#9fd8b8';
          ctx.fillText(`예약 ${PM.fmt(h.quota)}`, x0 + hr * 6 + 10, y + 6);
        });
        if (held.length > maxL) { ctx.fillStyle = '#9fd8b8'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('+' + (held.length - maxL), hx + hw - 4, H - 8); }
      } else {
        ctx.fillStyle = 'rgba(200,200,230,.45)'; ctx.font = '10px system-ui'; ctx.textBaseline = 'middle'; ctx.fillText('모든 구슬 정상 발사', hx + hw / 2, (top + 18 + H) / 2);
      }
      // 병합 연출 (3 → 1)
      ctx.globalCompositeOperation = 'source-over';
      for (let i = this.storeFx.length - 1; i >= 0; i--) {
        const f = this.storeFx[i]; f.t += dt;
        const pos = this.heldPos[f.tier] || [hx + hw / 2, (top + H) / 2], [cx, cy] = pos, rr2 = rr * .9;
        if (f.t < .35) {
          const k = f.t / .35, e = k * k;
          for (let j = 0; j < 3; j++) { const a = j / 3 * TAU - Math.PI / 2, d = (1 - e) * rr * 2.2; const spr = marbleSprite(f.tier, rr2 * this.dpr), sz = spr.width / (rr2 * this.dpr) * rr2; ctx.drawImage(spr, cx + Math.cos(a) * d - sz / 2, cy + Math.sin(a) * d - sz / 2, sz, sz); }
        } else if (f.t < 1.1) {
          const k = (f.t - .35) / .75, info = PM.tierInfo(f.tier + 1);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k;
          const gr = rr * (1.5 + k * 3); ctx.drawImage(glowSprite(info.m.g), cx - gr, cy - gr, gr * 2, gr * 2);
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
          const r3 = rr * (1.3 - k * .3), spr = marbleSprite(f.tier + 1, r3 * this.dpr), sz = spr.width / (r3 * this.dpr) * r3;
          ctx.drawImage(spr, cx - sz / 2, cy - sz / 2, sz, sz);
          ctx.globalAlpha = Math.min(1, (1 - k) * 2); ctx.font = '800 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; const label = (f.m > 1 ? `×${PM.fmt(f.m)} ` : '') + `T${f.tier + 1}!` + (info.star > 1 && (f.tier % 20 === 0) ? ' ★' + info.star : '');
          ctx.strokeText(label, cx, cy - rr - 2 - k * 8); ctx.fillStyle = '#9dffc8'; ctx.fillText(label, cx, cy - rr - 2 - k * 8); ctx.globalAlpha = 1;
        } else this.storeFx.splice(i, 1);
      }
    }
    drawReturns(ctx, dt) {
      // GOAL → 보관소로 복귀하는 빛줄기
      for (let i = this.returns.length - 1; i >= 0; i--) {
        const r = this.returns[i]; r.t += dt * 2.2;
        if (r.t >= 1) { this.returns.splice(i, 1); continue; }
        const tx = this.w - 20, ty = this.storeH - 10, k = r.t, e = 1 - (1 - k) * (1 - k);
        const x = r.sx + (tx - r.sx) * e + Math.sin(k * Math.PI) * 30, y = r.sy + (ty - r.sy) * e;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k * .5;
        ctx.drawImage(glowSprite(PM.tierInfo(r.tier).m.g), x - 9, y - 9, 18, 18);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    }
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  PM.Renderer = Renderer;
  PM.marbleSprite = marbleSprite;
})(typeof window !== 'undefined' ? window : globalThis);
