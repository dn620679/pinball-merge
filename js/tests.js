/* 필수 테스트 시나리오 — 디버그 패널 또는 node tools/test.js 로 실행 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  PM.runTests = function () {
    const D = PM.D, out = [];
    const T = (name, fn) => { try { const r = fn(); out.push({ name, ok: r === true || (r && r.ok), detail: r && r.detail || '' }); } catch (e) { out.push({ name, ok: false, detail: 'EXC ' + e.message }); } };
    const mk = (counts, merge) => { const g = new PM.Game(); g.s = [0]; g.f = [0]; g.h = [0]; for (const t in counts) { g.ensure(+t); g.s[+t] = counts[t]; } g.mergeOn = !!merge; g.recompute(); g.processMerges(); return g; };
    const launchAll = g => { let n = 0; while (g.launch()) n++; return n; };
    const ballsOf = (g, t) => g.balls.filter(b => b.tier === t);

    T('T1 3개 주행 중 병합 ON → GOAL 후 T2로 병합', () => {
      const g = mk({ 1: 3 }, false); launchAll(g); g.setMerge(true);
      const bs = ballsOf(g, 1); g.settle(bs[0], 'goal'); g.settle(bs[1], 'goal');
      const mid = g.s[1] === 2 && !g.s[2] && g.pickLaunchTier() === 0;
      g.settle(bs[2], 'goal');
      return { ok: mid && g.s[1] === 0 && g.s[2] === 1, detail: `중간 대기 ${mid}, 결과 T1=${g.s[1]} T2=${g.s[2]}` };
    });
    T('T1 4개 → 3개만 예약, 1개 계속 발사', () => {
      const g = mk({ 1: 4 }, false); launchAll(g); g.setMerge(true);
      const reserved = g.balls.filter(b => b.reserved).length;
      const bs = ballsOf(g, 1).sort((a, b) => a.id - b.id);
      g.settle(bs[3], 'goal'); // 예약되지 않은 공 복귀 → 즉시 발사 가능해야 함
      const canLaunch = g.pickLaunchTier() === 1;
      const g2 = mk({ 1: 4 }, true);
      return { ok: reserved === 3 && canLaunch && g2.s[1] === 1 && g2.s[2] === 1 && g2.free(1) === 1, detail: `예약 ${reserved}, 비예약 복귀 발사가능 ${canLaunch}, 보관소 직병합 T1=${g2.s[1]} T2=${g2.s[2]}` };
    });
    T('T1 2개 병합 ON → 둘 다 정상 순환', () => {
      const g = mk({ 1: 2 }, true); const n = launchAll(g);
      return { ok: n === 2 && g.quota(1) === 0, detail: `발사 ${n}` };
    });
    T('T1 7개 → 6개 예약, 1개 순환 (물리 60초)', () => {
      const g = mk({ 1: 7 }, false); launchAll(g); g.setMerge(true);
      const reserved = g.balls.filter(b => b.reserved).length;
      let t1Launch = 0; g.fx.onLaunch = b => { if (b.tier === 1) t1Launch++; };
      for (let i = 0; i < 120 * 60; i++) g.update(1 / 120);
      const c1 = g.s[1] + g.f[1], c2 = g.s[2] + g.f[2], c3 = (g.s[3] || 0) + (g.f[3] || 0);
      return { ok: reserved === 6 && c1 === 1 && c2 === 2 && t1Launch > 0, detail: `예약 ${reserved}, T1=${c1} T2=${c2} T3=${c3}, 남은 T1 재발사 ${t1Launch}회` };
    });
    T('높은 티어 복귀 시 저티어보다 먼저 발사', () => {
      const g = mk({ 1: 2, 5: 1 }, false);
      const first = g.pickLaunchTier(); g.launch();
      const b5 = ballsOf(g, 5)[0]; g.settle(b5, 'goal');
      return { ok: first === 5 && g.pickLaunchTier() === 5, detail: `첫 발사 T${first}, 복귀 후 다음 T${g.pickLaunchTier()}` };
    });
    T('필드 구슬끼리 충돌 없음', () => {
      const g = mk({ 1: 2 }, false); launchAll(g);
      const [a, b] = g.balls; a.delay = b.delay = 0;
      a.x = b.x = 180; a.y = b.y = 30; a.vx = b.vx = 0; a.vy = b.vy = 0;
      for (let i = 0; i < 30; i++) g.field.step(g.balls, 1 / 120, i / 120, g.cfg, { hit() { }, goal() { } });
      return { ok: a.x === b.x && a.y === b.y, detail: `겹친 두 공 위치 동일 유지 (${a.x.toFixed(2)},${a.y.toFixed(2)})` };
    });
    T('병합 전후 T1 환산 보유량 보존', () => {
      const g = mk({ 1: 25, 2: 7, 3: 4, 6: 5 }, false); const before = g.N.toNumber();
      g.setMerge(true); const after = g.N.toNumber();
      return { ok: before === after && g.stats.merges > 0, detail: `${before} → ${after}, 병합 ${g.stats.merges}회` };
    });
    T('T20 3개 병합 → T21 2성 유리 구슬', () => {
      const g = mk({ 20: 3 }, true); const info = PM.tierInfo(21);
      return { ok: g.s[21] === 1 && info.base === 0 && info.star === 2 && info.name === '2성 유리 구슬' && PM.tierInfo(41).star === 3, detail: `${info.name}, T41=${PM.tierInfo(41).name}` };
    });
    T('연속 접촉 시 프레임마다 중복 득점 없음', () => {
      const g = mk({ 1: 1 }, false); g.launch(); const b = g.balls[0]; b.delay = 0;
      // 경사 반사벽 위에 올려 1초간 연속 접촉
      let hits = 0, frames = 0; const slope = g.field.devices.find(d => d.kind === 'slope');
      for (let i = 0; i < 120; i++) {
        b.x = 40; b.y = slope.y1 + (slope.y2 - slope.y1) * (40 / 78) - 11; b.vx = 0; b.vy = 30; b.t = 0;
        g.field.step([b], 1 / 120, i / 120, g.cfg, { hit: () => hits++, goal() { } }); frames++;
      }
      return { ok: hits === 1, detail: `${frames}프레임 접촉, 득점 ${hits}회` };
    });
    T('카드 중복/돌파 + 저장 후 재접속', () => {
      const g = mk({ 1: 2 }, true); g.cards = { gla: { dup: 3, brk: 0, n: 4 } }; g.recompute();
      const s0 = g.bonus.score; const ok1 = g.doBreak('gla') && g.doBreak('gla'); const s1 = g.bonus.score;
      g.money = D.fromLog(123.4); g.drawsAvail = 5;
      const res = g.draw(3);
      const json = JSON.stringify(g.serialize());
      const h = new PM.Game(); h.load(JSON.parse(json));
      const same = h.cards.gla.brk === 2 && h.money.cmp(g.money) === 0 && h.drawsAvail === 2 && Object.keys(h.cards).length === Object.keys(g.cards).length;
      return { ok: ok1 && s1 > s0 && same && res.length === 3, detail: `돌파 2, 점수배율 ${s0.toFixed(2)}→${s1.toFixed(2)}, 복원 ${same}` };
    });
    T('큰 수/고티어 NaN·Infinity 없음', () => {
      const g = mk({ 300: 2, 1: 1 }, true);
      const v = g.perHit(5000), f1 = PM.fmt(v), N = g.N, p = g.costBalls(1), pm = g.costUnits(D.fromLog(200));
      g.money = D.fromLog(1e6); const q = g.maxBuyable();
      const big = D.fromLog(5000).add(D.fromLog(4999)).mul(D.num(3)).sub(D.fromLog(10));
      const strs = [f1, PM.fmt(N), PM.fmt(p), PM.fmt(pm), PM.fmt(big), PM.fmt(g.money)];
      const bad = strs.some(s => /NaN|Infinity|undefined/.test(s)) || !Number.isFinite(v.l) || !Number.isFinite(big.l);
      const rt = D.parse(JSON.parse(JSON.stringify(big.toJSON())));
      return { ok: !bad && q > 0 && rt.cmp(big) === 0 && D.num(5).sub(D.num(9)).isZero, detail: strs.join(' | ') + ` | MAX=${q}` };
    });
    T('구매 원자성/점수 음수 없음', () => {
      const g = mk({ 1: 1 }, false); g.money = D.num(5); const r = g.buy(1);
      g.money = g.costBalls(10); const r2 = g.buy(10);
      return { ok: !r && r2 && g.money.isZero && g.s[1] === 11, detail: `돈 부족 구매 ${r}, 정확한 금액 구매 ${r2}, 잔액 ${PM.fmt(g.money)}` };
    });
    T('병합 OFF → 예약 해제, 모두 발사', () => {
      const g = mk({ 1: 2 }, false); launchAll(g); g.setMerge(true); g.s[1] += 1; g.recompute();
      const heldOn = g.held(1); g.setMerge(false);
      return { ok: heldOn === 1 && g.held(1) === 0 && g.pickLaunchTier() === 1, detail: `ON 대기 ${heldOn} → OFF 대기 ${g.held(1)}` };
    });
    return out;
  };
  PM.physicsStats = function (unlocked, runs) {
    const g = new PM.Game(); g.unlocked = unlocked; g.field.setUnlocked(unlocked); g.s[1] = 25; g.mergeOn = false; g.recompute();
    const ts = [], hs = []; let safe = 0;
    g.fx.onGoal = (b, x, r) => { ts.push(b.t); hs.push(b.hits); if (r !== 'goal') safe++; };
    for (let i = 0; i < 120 * 900 && ts.length < runs; i++) g.update(1 / 120);
    const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    return { runs: ts.length, avgT: avg(ts), maxT: Math.max(...ts), avgHits: avg(hs), safe };
  };
})(typeof window !== 'undefined' ? window : globalThis);
