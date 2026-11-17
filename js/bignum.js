/* 큰 수 표현: 1e15 미만은 정확한 Number, 그 이상은 log10 값으로 보관 (Infinity/NaN 방지) */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const SMALL = 1e15;

  class D {
    constructor(v, l) { this.v = v; this.l = l; } // v: number|null, l: log10
    static zero() { return new D(0, -Infinity); }
    static num(x) {
      if (typeof x !== 'number' || !(x > 0)) return D.zero();
      if (x === Infinity) return new D(null, 308.25);
      if (x < SMALL) return new D(x, Math.log10(x));
      return new D(null, Math.log10(x));
    }
    static fromLog(l) {
      if (l === -Infinity || Number.isNaN(l)) return D.zero();
      if (l === Infinity) l = 1e300;
      if (l < 15) { const v = Math.pow(10, l); if (v < SMALL) return new D(v, l); }
      return new D(null, l);
    }
    static pow(base, exp) {
      if (exp === 0) return D.num(1);
      const l = exp * Math.log10(base);
      if (l < 15) return D.num(Math.pow(base, exp));
      return D.fromLog(l);
    }
    static of(x) {
      if (x instanceof D) return x;
      if (typeof x === 'number') return D.num(x);
      return D.parse(x);
    }
    static parse(s) {
      if (s instanceof D) return s;
      if (typeof s === 'number') return D.num(s);
      if (typeof s === 'string') {
        if (s[0] === 'L') { const l = parseFloat(s.slice(1)); return Number.isFinite(l) ? D.fromLog(l) : D.zero(); }
        return D.num(parseFloat(s));
      }
      return D.zero();
    }
    get isZero() { return this.v === 0; }
    get small() { return this.v !== null; }
    toNumber() { return this.v !== null ? this.v : (this.l < 308 ? Math.pow(10, this.l) : Infinity); }
    add(b) {
      b = D.of(b);
      if (this.v !== null && b.v !== null) return D.num(this.v + b.v);
      let hi = this, lo = b;
      if (lo.l > hi.l) { hi = b; lo = this; }
      if (lo.l === -Infinity) return hi;
      const d = lo.l - hi.l;
      if (d < -17) return hi;
      return D.fromLog(hi.l + Math.log10(1 + Math.pow(10, d)));
    }
    sub(b) { // 결과는 0 미만이 되지 않음
      b = D.of(b);
      if (this.v !== null && b.v !== null) return D.num(Math.max(0, this.v - b.v));
      if (b.l >= this.l) return D.zero();
      const d = b.l - this.l;
      if (d < -17) return this;
      return D.fromLog(this.l + Math.log10(1 - Math.pow(10, d)));
    }
    mul(b) {
      b = D.of(b);
      if (this.v === 0 || b.v === 0) return D.zero();
      if (this.v !== null && b.v !== null) { const p = this.v * b.v; if (p < SMALL) return D.num(p); }
      return D.fromLog(this.l + b.l);
    }
    div(b) {
      b = D.of(b);
      if (b.v === 0 || this.v === 0) return D.zero();
      if (this.v !== null && b.v !== null) return D.num(this.v / b.v);
      return D.fromLog(this.l - b.l);
    }
    cmp(b) {
      b = D.of(b);
      if (this.v !== null && b.v !== null) return this.v < b.v ? -1 : this.v > b.v ? 1 : 0;
      return this.l < b.l ? -1 : this.l > b.l ? 1 : 0;
    }
    gte(b) { return this.cmp(b) >= 0; }
    gt(b) { return this.cmp(b) > 0; }
    lt(b) { return this.cmp(b) < 0; }
    lte(b) { return this.cmp(b) <= 0; }
    floor() { return this.v !== null ? D.num(Math.floor(this.v + 1e-7)) : this; }
    ceil() { return this.v !== null ? D.num(Math.ceil(this.v - 1e-7)) : this; }
    toJSON() { return this.v !== null ? this.v : ('L' + this.l); }
  }

  const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];
  function sci(l) {
    let e = Math.floor(l); let m = Math.pow(10, l - e);
    let s = m.toFixed(2);
    if (parseFloat(s) >= 10) { e++; s = (m / 10).toFixed(2); }
    return s + 'e' + (e >= 1e9 ? e.toExponential(3) : e);
  }
  function fmt(x) {
    const d = D.of(x);
    if (d.v === 0) return '0';
    if (d.v !== null && d.v < 1000) {
      const v = d.v;
      if (v < 1) return v.toFixed(2);
      if (v < 10 && Math.abs(v - Math.round(v)) > 1e-6) return (Math.floor(v * 10) / 10).toString();
      return String(Math.floor(v + 1e-7));
    }
    const l = d.l;
    if (!Number.isFinite(l)) return '∞';
    let g = Math.floor(l / 3 + 1e-12);
    if (g < SUF.length) {
      let m = Math.pow(10, l - g * 3);
      let s = m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0);
      if (parseFloat(s) >= 1000) { g++; if (g >= SUF.length) return sci(l); s = (m / 1000).toFixed(2); }
      return s + SUF[g];
    }
    return sci(l);
  }
  function fmtPct(x) { return (Math.round(x * 1000) / 10) + '%'; }

  PM.D = D; PM.fmt = fmt; PM.fmtPct = fmtPct;
})(typeof window !== 'undefined' ? window : globalThis);
