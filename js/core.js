/* 게임 상태/규칙: 보관소, 발사 우선순위, 병합 예약, 경제, 카드, 저장 — DOM 비의존 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const D = PM.D;
  const LOG3 = Math.log10(3), LOGLN10 = Math.log10(Math.LN10);
  let ballSeq = 1;

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.cfg = PM.CFG;
      this.fx = opts.fx || {};
      this.rand = opts.rand || Math.random;
      this.field = new PM.Field();
      this.newState();
    }
    newState() {
      this.time = 0;
      this.money = D.zero();
      this.s = [0, this.cfg.startBalls]; // 보관소 보유 수 (index = tier)
      this.f = [0, 0];                    // 필드 주행 중 수
      this.h = [0, 0];                    // 보관소 안의 병합 예약(대기) 수
      this.balls = [];
      this.mergeOn = true;
      this.unlocked = 0;
      this.launcherLv = 0;
      this.buyTier = 1;
      this.cards = {};                   // id -> {dup, brk, n}
      this.gauge = D.zero();
      this.drawsAvail = 0;
      this.drawsEarned = 0;
      this.launchTimer = 0;
      this.rate = D.zero();              // 초당 수익(EMA)
      this._secAcc = 0; this._secEarn = D.zero();
      this.stats = { earned: D.zero(), runs: 0, hits: 0, merges: 0, bestTier: 1, bought: 0, draws: 0, safe: 0, play: 0 };
      this.settings = { sound: true, particles: 'mid', fx: 1, texts: true, trails: true };
      this.newCards = {};
      this.field.setUnlocked(0);
      this.recompute();
      this.processMerges();
    }

    /* ---------------- 파생 값 ---------------- */
    ensure(t) { while (this.s.length <= t) { this.s.push(0); this.f.push(0); this.h.push(0); } }
    recompute() {
      // 환산 보유량 N = Σ count[t] * 3^(t-1)
      let N = D.zero(), total = 0, maxT = 1;
      for (let t = 1; t < this.s.length; t++) {
        const c = this.s[t] + this.f[t];
        if (c > 0) { N = N.add(D.pow(3, t - 1).mul(c)); total += c; maxT = t; }
      }
      this.N = N; this.totalBalls = total; this.topTier = maxT;
      if (maxT > this.stats.bestTier) this.stats.bestTier = maxT;
      this.bonus = this.computeBonus();
      this._perHit = [];
      const byTier = this.fieldByTier();
      for (let t = 1; t < this.s.length; t++) this.reassign(t, byTier[t] || []);
    }
    fieldByTier() {
      const m = {};
      for (const b of this.balls) (m[b.tier] || (m[b.tier] = [])).push(b);
      for (const k in m) m[k].sort((a, b) => a.id - b.id);
      return m;
    }
    /* 예약 지정(결정적): 전체 보유량 기준 3의 배수만큼 예약.
       부족하면 보관소 구슬 → 먼저 발사된 필드 구슬 순서로 지정, 초과하면 나중 발사된 필드 구슬부터 해제 */
    reassign(t, fb) {
      const want = this.mergeOn ? this.quota(t) : 0;
      const res = fb.filter(b => b.reserved);
      let cnt = this.h[t] + res.length;
      if (cnt > want) {
        let ex = cnt - want;
        for (let i = res.length - 1; i >= 0 && ex > 0; i--) { res[i].reserved = false; ex--; }
        this.h[t] -= Math.min(ex, this.h[t]);
      } else if (cnt < want) {
        let need = want - cnt;
        const add = Math.min(need, this.s[t] - this.h[t]); this.h[t] += add; need -= add;
        for (const b of fb) { if (need <= 0) break; if (!b.reserved) { b.reserved = true; need--; } }
      }
    }
    quota(t) { return 3 * Math.floor(((this.s[t] || 0) + (this.f[t] || 0)) / 3); }
    held(t) { return this.mergeOn ? (this.h[t] || 0) : 0; }
    free(t) { return (this.s[t] || 0) - this.held(t); }
    perHit(t) {
      let v = this._perHit[t];
      if (!v) { v = D.pow(this.cfg.scoreBase, t - 1).mul(this.bonus.score).floor(); if (v.isZero) v = D.num(1); this._perHit[t] = v; }
      return v;
    }
    launchInterval() {
      const c = this.cfg;
      return Math.max(c.launchIntervalMin, c.launchInterval * Math.pow(c.launcherDecay, this.launcherLv)) * (1 - this.bonus.launch);
    }
    computeBonus() {
      const b = { score: 1, discount: 0, gauge: 1, launch: 0 };
      for (const id in this.cards) {
        const card = PM.CARD_BY_ID[id]; if (!card) continue;
        for (const e of card.eff) {
          const v = this.effValue(e, this.cards[id].brk);
          if (e.type === 'score') b.score += v; else if (e.type === 'gauge') b.gauge += v;
          else if (e.type === 'discount') b.discount += v; else if (e.type === 'launch') b.launch += v;
        }
      }
      b.discount = Math.min(0.6, b.discount); b.launch = Math.min(0.4, b.launch);
      return b;
    }
    effValue(e, brk) { return e.base * (1 + 0.5 * (brk || 0)); }

    /* ---------------- 진행 ---------------- */
    update(dt) {
      this.time += dt; this.stats.play += dt;
      const fx = this.fx;
      this.field.step(this.balls, dt, this.time, this.cfg, {
        hit: (b, d) => {
          const v = this.perHit(b.tier);
          b.run = b.run.add(v); b.hits++; this.stats.hits++;
          if (fx.onHit) fx.onHit(b, d, v);
        },
        goal: (b, reason) => this.settle(b, reason),
      });
      // 발사
      this.launchTimer += dt;
      const iv = this.launchInterval();
      if (this.launchTimer >= iv) {
        if (this.launch()) this.launchTimer = 0; else this.launchTimer = iv;
      }
      // 초당 수익 EMA
      this._secAcc += dt;
      if (this._secAcc >= 1) {
        this._secAcc -= 1;
        this.rate = this.rate.mul(0.9).add(this._secEarn.mul(0.1));
        this._secEarn = D.zero();
      }
    }
    pickLaunchTier() {
      for (let t = this.s.length - 1; t >= 1; t--) if (this.free(t) > 0) return t;
      return 0;
    }
    launch() {
      this.processMerges();
      const t = this.pickLaunchTier();
      if (!t) return false;
      this.s[t]--; this.f[t]++;
      const lx = this.field.launcherX(this.time);
      const b = { id: ballSeq++, tier: t, x: lx, y: 10, sx: lx, sy: 10, vx: Math.sin(this.time * 1.3 + 1.2) * 90 + (this.rand() - 0.5) * 60, vy: 40,
        r: this.cfg.ballR, t: 0, run: D.zero(), hits: 0, contact: {}, slow: 0, delay: 0.22, trail: [], reserved: false };
      this.balls.push(b);
      this.recompute();
      if (this.fx.onLaunch) this.fx.onLaunch(b);
      return true;
    }
    settle(b, reason) {
      const i = this.balls.indexOf(b); if (i < 0) return;
      this.balls.splice(i, 1);
      const gain = b.run;
      this.money = this.money.add(gain);
      this.stats.earned = this.stats.earned.add(gain);
      this._secEarn = this._secEarn.add(gain);
      this.stats.runs++;
      if (reason !== 'goal') this.stats.safe++;
      this.f[b.tier]--; this.s[b.tier]++;
      if (b.reserved && this.mergeOn) this.h[b.tier]++; // 예약된 구슬만 보관소에서 대기
      if (this.fx.onGoal) this.fx.onGoal(b, gain, reason);
      this.processMerges();
      this.recompute();
    }
    /* 보관소에 모인 예약 구슬 병합. 전체 보유량(보관+필드) 기준 3개 단위 예약 */
    processMerges() {
      if (!this.mergeOn) return 0;
      let total = 0;
      const byTier = this.fieldByTier();
      for (let t = 1; t < this.s.length; t++) {
        this.reassign(t, byTier[t] || []);
        const m = Math.floor(this.h[t] / 3);
        if (m <= 0) continue;
        this.ensure(t + 1);
        this.s[t] -= 3 * m; this.h[t] -= 3 * m; this.s[t + 1] += m;
        total += m; this.stats.merges += m;
        if (t + 1 > this.stats.bestTier) this.stats.bestTier = t + 1;
        this.addGauge(D.pow(this.cfg.gaugeBase, t - 1).mul(m).mul(this.bonus.gauge));
        if (this.fx.onMerge) this.fx.onMerge(t, m);
      }
      if (total) this.recompute();
      return total;
    }
    setMerge(on) {
      this.mergeOn = !!on;
      if (!this.mergeOn) { this.h = this.h.map(() => 0); this.balls.forEach(b => b.reserved = false); }
      this.processMerges();
      this.recompute();
    }

    /* ---------------- 경제 ---------------- */
    logP(z) { // z = log10(N+1)
      const c = this.cfg;
      return Math.log10(c.priceBase) + c.priceK1 * z + c.priceK2 * Math.log10(1 + z) + Math.log10(1 - this.bonus.discount);
    }
    // N(환산 보유량)에서 units 만큼 T1 단위를 추가할 때의 총 비용 = Σ P(N+i)
    costUnits(units, N) {
      units = D.of(units); N = N || this.N;
      if (units.isZero) return D.zero();
      if (N.small && units.small && units.v <= 400 && N.v + units.v < 1e6) {
        let s = 0;
        for (let i = 0; i < units.v; i++) s += Math.ceil(Math.pow(10, this.logP(Math.log10(N.v + i + 1))));
        return D.num(s);
      }
      const lp1 = x => x.small ? Math.log10(x.v + 1) : x.l;
      const z0 = lp1(N), z1 = lp1(N.add(units));
      if (z1 - z0 < 1e-7) return D.fromLog(this.logP(z0) + units.l);
      // ∫ P(x) dx, x=10^z → dx = 10^z ln10 dz (심프슨, 로그 공간 합산)
      const n = 32, h = (z1 - z0) / n, L = [];
      let M = -Infinity;
      for (let j = 0; j <= n; j++) { const z = z0 + h * j; const v = this.logP(z) + z + LOGLN10; L.push(v); if (v > M) M = v; }
      let sum = 0;
      for (let j = 0; j <= n; j++) { const w = (j === 0 || j === n) ? 1 : (j % 2 ? 4 : 2); sum += w * Math.pow(10, L[j] - M); }
      return D.fromLog(M + Math.log10(sum * h / 3));
    }
    unitsOf(q, tier) { return D.pow(3, tier - 1).mul(q); }
    costBalls(q, tier) { tier = tier || this.buyTier; return this.costUnits(this.unitsOf(q, tier)); }
    maxBuyable(tier) {
      tier = tier || this.buyTier;
      if (this.costBalls(1, tier).gt(this.money)) return 0;
      let lo = 1, hi = 2;
      const CAP = 1e12;
      while (hi < CAP && this.costBalls(hi, tier).lte(this.money)) { lo = hi; hi *= 2; }
      if (hi >= CAP && this.costBalls(CAP, tier).lte(this.money)) return CAP;
      while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (this.costBalls(mid, tier).lte(this.money)) lo = mid; else hi = mid; }
      return lo;
    }
    buy(q, tier) {
      tier = tier || this.buyTier;
      q = Math.floor(q);
      if (!(q > 0)) return false;
      const cost = this.costBalls(q, tier);
      if (cost.gt(this.money)) return false;
      // 원자적 처리: 비용 차감과 구슬 추가를 한 번에
      this.money = this.money.sub(cost);
      this.ensure(tier);
      this.s[tier] += q; this.stats.bought += q;
      this.recompute();
      this.processMerges();
      if (this.fx.onBuy) this.fx.onBuy(tier, q);
      return true;
    }
    maxBuyTier() { return Math.max(1, this.stats.bestTier - this.cfg.buyTierGap); }
    deviceCost(i) { return D.fromLog(this.cfg.devCostL0 + this.cfg.devCostStep * i).ceil(); }
    unlockNext() {
      if (this.unlocked >= PM.LAYOUT_UNLOCK.length) return false;
      const c = this.deviceCost(this.unlocked);
      if (c.gt(this.money)) return false;
      this.money = this.money.sub(c);
      const d = this.field.devices.find(x => x.slot === this.unlocked);
      this.unlocked++;
      this.field.setUnlocked(this.unlocked);
      if (d) d.unlockAnim = 1;
      if (this.fx.onUnlock) this.fx.onUnlock(d);
      return true;
    }
    launcherCost() { return D.fromLog(this.cfg.launchCostL0 + this.cfg.launchCostStep * this.launcherLv).ceil(); }
    upgradeLauncher() {
      if (this.launcherLv >= this.cfg.launcherLvMax) return false;
      const c = this.launcherCost();
      if (c.gt(this.money)) return false;
      this.money = this.money.sub(c); this.launcherLv++;
      return true;
    }

    /* ---------------- 카드 ---------------- */
    gaugeReq(k) { return D.fromLog(Math.log10(this.cfg.gaugeReq0) + Math.log10(this.cfg.gaugeGrowth) * (k === undefined ? this.drawsEarned : k)).ceil(); }
    addGauge(v) {
      this.gauge = this.gauge.add(v);
      let guard = 0;
      while (guard++ < 2000) {
        const req = this.gaugeReq();
        if (this.gauge.lt(req)) break;
        this.gauge = this.gauge.sub(req); this.drawsAvail++; this.drawsEarned++;
      }
      if (guard > 1 && this.fx.onDrawReady) this.fx.onDrawReady();
    }
    draw(n) {
      n = Math.min(n, this.drawsAvail);
      if (n <= 0) return [];
      const res = [];
      for (let i = 0; i < n; i++) {
        let r = this.rand(), rar = 'R';
        for (const [k, p] of PM.RATES) { if (r < p) { rar = k; break; } r -= p; }
        const pool = PM.CARDS.filter(c => c.rarity === rar);
        const card = pool[Math.floor(this.rand() * pool.length) % pool.length];
        const st = this.cards[card.id];
        let isNew = false;
        if (!st) { this.cards[card.id] = { dup: 0, brk: 0, n: 1 }; isNew = true; this.newCards[card.id] = true; }
        else { st.dup++; st.n++; }
        res.push({ id: card.id, isNew });
      }
      this.drawsAvail -= n; this.stats.draws += n;
      this.recompute();
      return res;
    }
    breakNeed(id) { const st = this.cards[id]; if (!st || st.brk >= 5) return 0; return PM.BREAK_NEED[st.brk]; }
    canBreak(id) { const st = this.cards[id]; return !!st && st.brk < 5 && st.dup >= PM.BREAK_NEED[st.brk]; }
    doBreak(id) {
      if (!this.canBreak(id)) return false;
      const st = this.cards[id]; st.dup -= PM.BREAK_NEED[st.brk]; st.brk++;
      this.recompute();
      return true;
    }

    /* ---------------- 오프라인 ---------------- */
    offlineGain(sec) {
      const cap = this.cfg.offlineMaxH * 3600;
      const s = Math.min(Math.max(0, sec), cap);
      return { sec: s, gain: this.rate.mul(s * this.cfg.offlineEff).floor() };
    }

    /* ---------------- 저장/불러오기 ---------------- */
    serialize() {
      // 주행 중인 구슬은 보관소로 복귀시키고 주행 점수를 정산한 형태로 저장
      const s = this.s.slice(); let money = this.money;
      for (const b of this.balls) { s[b.tier] = (s[b.tier] || 0) + 1; money = money.add(b.run); }
      const st = Object.assign({}, this.stats, { earned: this.stats.earned.toJSON() });
      return {
        v: PM.SAVE_VERSION, at: Date.now(), money: money.toJSON(), s, mergeOn: this.mergeOn,
        unlocked: this.unlocked, launcherLv: this.launcherLv, buyTier: this.buyTier,
        cards: this.cards, gauge: this.gauge.toJSON(), drawsAvail: this.drawsAvail, drawsEarned: this.drawsEarned,
        stats: st, settings: this.settings, rate: this.rate.toJSON(), newCards: this.newCards,
      };
    }
    load(o) {
      if (!o || typeof o !== 'object' || o.v !== PM.SAVE_VERSION) throw new Error('bad save');
      const nn = (x, d) => (typeof x === 'number' && Number.isFinite(x) && x >= 0) ? Math.floor(x) : d;
      this.newState();
      this.money = D.parse(o.money);
      const s = Array.isArray(o.s) ? o.s.map(x => nn(x, 0)) : [0, 3];
      s[0] = 0;
      this.s = s.length > 1 ? s : [0, 3]; this.f = this.s.map(() => 0); this.h = this.s.map(() => 0);
      if (this.s.reduce((a, b) => a + b, 0) === 0) this.s[1] = this.cfg.startBalls;
      this.mergeOn = o.mergeOn !== false;
      this.unlocked = Math.min(nn(o.unlocked, 0), PM.LAYOUT_UNLOCK.length);
      this.launcherLv = Math.min(nn(o.launcherLv, 0), this.cfg.launcherLvMax);
      this.cards = {};
      if (o.cards && typeof o.cards === 'object') for (const id in o.cards) {
        if (!PM.CARD_BY_ID[id]) continue; const c = o.cards[id] || {};
        this.cards[id] = { dup: nn(c.dup, 0), brk: Math.min(5, nn(c.brk, 0)), n: nn(c.n, 1) };
      }
      this.gauge = D.parse(o.gauge);
      this.drawsAvail = nn(o.drawsAvail, 0); this.drawsEarned = nn(o.drawsEarned, 0);
      const st = o.stats || {};
      for (const k of ['runs', 'hits', 'merges', 'bestTier', 'bought', 'draws', 'safe', 'play']) this.stats[k] = nn(st[k], this.stats[k]);
      this.stats.earned = D.parse(st.earned);
      if (o.settings && typeof o.settings === 'object') Object.assign(this.settings, o.settings);
      this.rate = D.parse(o.rate);
      this.newCards = (o.newCards && typeof o.newCards === 'object') ? o.newCards : {};
      this.field.setUnlocked(this.unlocked);
      this.recompute();
      this.buyTier = Math.min(Math.max(1, nn(o.buyTier, 1)), this.maxBuyTier());
      this.processMerges();
      this.recompute();
      return o.at || Date.now();
    }
  }
  PM.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
