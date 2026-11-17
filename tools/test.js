const PM = require('./load')(['bignum.js', 'config.js', 'data.js', 'physics.js', 'core.js', 'tests.js']);
let fail = 0;
for (const r of PM.runTests()) { console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + ' — ' + r.detail); if (!r.ok) fail++; }
for (const u of [0, 16]) { const s = PM.physicsStats(u, 200); console.log(`physics unlocked=${u}: runs=${s.runs} avg=${s.avgT.toFixed(2)}s max=${s.maxT.toFixed(1)}s hits=${s.avgHits.toFixed(1)} safe=${s.safe}`); }
process.exit(fail ? 1 : 0);
