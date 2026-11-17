/* 핀볼 물리: 고정 타임스텝, 공-장치/벽 충돌만 처리 (공끼리 충돌 없음) */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const W = 360, H = 400;
  const GOAL_X1 = 140, GOAL_X2 = 220, GOAL_Y = 388;

  function makeDevice(def, id, locked) {
    const d = Object.assign({ id, flash: 0, locked, unlockAnim: 0, hits: 0 }, def);
    if (d.kind === 'spinner') { d.ang = 0; d.th = 3; }
    if (d.kind === 'slope') { d.th = 3.5; }
    return d;
  }

  class Field {
    constructor() {
      this.W = W; this.H = H;
      this.goal = { x1: GOAL_X1, x2: GOAL_X2, y: GOAL_Y };
      this.devices = [];
      PM.LAYOUT_INIT.forEach((d, i) => this.devices.push(makeDevice(d, 'i' + i, false)));
      PM.LAYOUT_UNLOCK.forEach((d, i) => { const dv = makeDevice(d, 'u' + i, true); dv.slot = i; this.devices.push(dv); });
      // 비득점 정적 벽: 하단 깔때기
      this.walls = [
        { x1: 0, y1: 328, x2: GOAL_X1, y2: 384, th: 3, e: 0.35 },
        { x1: W, y1: 328, x2: GOAL_X2, y2: 384, th: 3, e: 0.35 },
      ];
      this.launcherPhase = 0;
    }
    setUnlocked(n) {
      this.devices.forEach(d => { if (d.slot !== undefined) d.locked = d.slot >= n; });
    }
    launcherX(time) { return 180 + Math.sin(time * 1.3) * 120; }

    /* cb.hit(ball, device), cb.goal(ball) */
    step(balls, dt, time, cfg, cb) {
      const devs = this.devices;
      for (let i = 0; i < devs.length; i++) {
        const d = devs[i];
        if (d.flash > 0) d.flash = Math.max(0, d.flash - dt * 4);
        if (d.unlockAnim > 0) d.unlockAnim = Math.max(0, d.unlockAnim - dt * 1.2);
        if (d.kind === 'spinner') d.ang += d.w * dt;
      }
      const g = cfg.gravity, drag = cfg.drag, vmax = cfg.vmax;
      for (let bi = balls.length - 1; bi >= 0; bi--) {
        const b = balls[bi];
        if (b.delay > 0) { b.delay -= dt; if (b.delay <= 0) { b.x = b.sx; b.y = b.sy; } continue; }
        b.t += dt;
        b.vy += g * dt;
        // 장시간 주행 시 GOAL 유도
        if (b.t > cfg.runGuideTime) {
          b.guided = true;
          const gx = 180 - b.x, gy = (H + 10) - b.y; const gl = Math.hypot(gx, gy) || 1;
          b.vx += gx / gl * 420 * dt; b.vy += gy / gl * 420 * dt;
        }
        const dk = 1 - drag * dt; b.vx *= dk; b.vy *= dk;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > vmax) { b.vx *= vmax / sp; b.vy *= vmax / sp; }
        b.x += b.vx * dt; b.y += b.vy * dt;
        const r = b.r;
        // 외벽 (비득점)
        if (b.x < r) { b.x = r; if (b.vx < 0) b.vx = -b.vx * 0.55; }
        else if (b.x > W - r) { b.x = W - r; if (b.vx > 0) b.vx = -b.vx * 0.55; }
        if (b.y < r) { b.y = r; if (b.vy < 0) b.vy = -b.vy * 0.5; }
        for (let wi = 0; wi < this.walls.length; wi++) {
          const w = this.walls[wi];
          if (!b.guided) collideSeg(b, w.x1, w.y1, w.x2, w.y2, w.th, w.e, 0.02, 0, 0);
        }
        for (let i = 0; i < devs.length; i++) {
          const d = devs[i];
          if (d.locked) continue;
          let hit = false;
          if (d.kind === 'bumper' || d.kind === 'pin') {
            const dx = b.x - d.x, dy = b.y - d.y, R = d.r + r, d2 = dx * dx + dy * dy;
            if (d2 < R * R) {
              let dd = Math.sqrt(d2), nx, ny;
              if (dd < 1e-6) { nx = 0; ny = -1; dd = 0; } else { nx = dx / dd; ny = dy / dd; }
              b.x = d.x + nx * R; b.y = d.y + ny * R;
              const vn = b.vx * nx + b.vy * ny;
              if (d.kind === 'bumper') {
                if (vn < 0) { b.vx -= 1.9 * vn * nx; b.vy -= 1.9 * vn * ny; }
                const vn2 = b.vx * nx + b.vy * ny, kick = 250;
                if (vn2 < kick) { b.vx += (kick - vn2) * nx; b.vy += (kick - vn2) * ny; }
              } else if (vn < 0) {
                const tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty;
                const nvn = -vn * 0.55, nvt = vt * 0.97;
                b.vx = nx * nvn + tx * nvt; b.vy = ny * nvn + ty * nvt;
              }
              hit = true;
            }
          } else if (d.kind === 'slope') {
            hit = collideSeg(b, d.x1, d.y1, d.x2, d.y2, d.th, 0.45, 0.03, 0, 0);
          } else if (d.kind === 'spinner') {
            const c = Math.cos(d.ang) * d.len, s = Math.sin(d.ang) * d.len;
            const ax = d.x - c, ay = d.y - s, bx = d.x + c, by = d.y + s;
            hit = collideSeg(b, ax, ay, bx, by, d.th, 0.6, 0.0, d.w, d);
          }
          if (hit) {
            const last = b.contact[d.id];
            if (last === undefined || time - last > cfg.hitCooldown) { d.flash = 1; d.hits++; cb.hit(b, d); }
            b.contact[d.id] = time; // 연속 접촉 중에는 계속 갱신 → 재득점 없음
          }
        }
        // 정지/끼임 방지 흔들기
        if (Math.abs(b.vx) + Math.abs(b.vy) < 18) {
          b.slow += dt;
          if (b.slow > 0.6) { b.slow = 0; b.vx += (b.x < 180 ? 1 : -1) * (40 + Math.random() * 60); b.vy -= 60; }
        } else b.slow = 0;
        // GOAL 판정
        if (b.y > GOAL_Y && b.x > GOAL_X1 - 4 && b.x < GOAL_X2 + 4) { cb.goal(b, 'goal'); continue; }
        if (b.y > H + 6) { cb.goal(b, 'goal'); continue; }
        // 비정상 상태/필드 이탈 복구
        if (!Number.isFinite(b.x) || !Number.isFinite(b.y) || b.x < -30 || b.x > W + 30 || b.y < -40) { cb.goal(b, 'recover'); continue; }
        if (b.t > cfg.runSafeTime) { cb.goal(b, 'safe'); continue; }
      }
    }
  }

  // 공 vs 선분(두께 th). sw: 회전 각속도, dev: 회전 중심
  function collideSeg(b, ax, ay, bx, by, th, e, fric, sw, dev) {
    const abx = bx - ax, aby = by - ay, len2 = abx * abx + aby * aby;
    let t = ((b.x - ax) * abx + (b.y - ay) * aby) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + abx * t, py = ay + aby * t;
    const dx = b.x - px, dy = b.y - py, d2 = dx * dx + dy * dy, R = b.r + th;
    if (d2 >= R * R) return false;
    let d = Math.sqrt(d2), nx, ny;
    if (d < 1e-6) { const l = Math.sqrt(len2); nx = -aby / l; ny = abx / l; } else { nx = dx / d; ny = dy / d; }
    b.x = px + nx * R; b.y = py + ny * R;
    let svx = 0, svy = 0;
    if (sw && dev) { svx = -sw * (py - dev.y); svy = sw * (px - dev.x); }
    const rvx = b.vx - svx, rvy = b.vy - svy, vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      const tx = -ny, ty = nx, vt = rvx * tx + rvy * ty;
      const nvn = -vn * e + (sw ? 20 : 0), nvt = vt * (1 - fric);
      b.vx = svx + nx * nvn + tx * nvt; b.vy = svy + ny * nvn + ty * nvt;
    }
    return true;
  }

  PM.Field = Field;
  PM.FIELD_W = W; PM.FIELD_H = H;
})(typeof window !== 'undefined' ? window : globalThis);
