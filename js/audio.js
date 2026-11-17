/* Web Audio 효과음 (오리지널 합성음) — 첫 사용자 입력 후 활성화 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  class Sfx {
    constructor() { this.ctx = null; this.on = true; this.last = {}; this.count = 0; this.win = 0; }
    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = .32; this.master.connect(this.ctx.destination);
    }
    ok(type, gap) {
      if (!this.on || !this.ctx || this.ctx.state !== 'running') return false;
      const now = this.ctx.currentTime;
      if (now - (this.last[type] || 0) < gap) return false;
      if (now - this.win > .1) { this.win = now; this.count = 0; }
      if (++this.count > 4) return false;
      this.last[type] = now; return true;
    }
    tone(freq, dur, type, vol, slide, delay) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .2, t + .005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .02);
    }
    hit(kind, tier) {
      if (!this.ok('hit' + kind, .035)) return;
      const base = (tier - 1) % 20, f = 440 * Math.pow(2, PENTA[base % 10] / 12) * (base >= 10 ? 2 : 1);
      if (kind === 'bumper') { this.tone(f * .5, .16, 'triangle', .22, .55); this.tone(f, .08, 'square', .05); }
      else if (kind === 'pin') this.tone(f * 1.5, .06, 'sine', .12);
      else if (kind === 'slope') this.tone(f * .75, .07, 'triangle', .1, 1.3);
      else this.tone(f, .1, 'sawtooth', .05, 1.8);
    }
    goal() { if (!this.ok('goal', .08)) return; [660, 880, 1320].forEach((f, i) => this.tone(f, .14, 'sine', .14, null, i * .05)); }
    merge(t) { if (!this.ok('merge', .12)) return; const b = 330 * Math.pow(2, PENTA[(t - 1) % 10] / 12); [1, 1.25, 1.5, 2].forEach((m, i) => this.tone(b * m, .2, 'triangle', .16, null, i * .06)); this.tone(b * 4, .4, 'sine', .06, 1.5, .24); }
    buy() { if (!this.ok('buy', .05)) return; this.tone(990, .06, 'square', .06); this.tone(1480, .09, 'sine', .1, null, .04); }
    unlockSfx() { if (!this.ok('unl', .1)) return; [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .25, 'triangle', .15, null, i * .08)); }
    draw(rar) {
      if (!this.ok('draw', .05)) return;
      const n = { R: 2, SR: 3, SSR: 4, UR: 6 }[rar] || 2;
      for (let i = 0; i < n; i++) this.tone(700 * Math.pow(1.19, i), .25, 'sine', .14, null, i * .07);
      if (rar === 'UR' || rar === 'SSR') this.tone(2400, .7, 'triangle', .07, .5, n * .07);
    }
    brk() { if (!this.ok('brk', .1)) return; [392, 523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, .3, 'square', .07, null, i * .06)); }
    click() { if (!this.ok('click', .03)) return; this.tone(1200, .03, 'sine', .08); }
  }
  PM.Sfx = Sfx;
})(typeof window !== 'undefined' ? window : globalThis);
