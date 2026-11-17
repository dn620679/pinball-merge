const PM = require('./load')(['bignum.js', 'config.js', 'data.js', 'physics.js', 'core.js']);
function runStats(unlocked, n) {
  const g = new PM.Game(); g.unlocked = unlocked; g.field.setUnlocked(unlocked);
  g.s[1] = n; g.recompute(); g.mergeOn = false;
  const times = [], hits = []; let safe = 0;
  g.fx.onGoal = (b, gain, r) => { times.push(b.t); hits.push(b.hits); if (r !== 'goal') safe++; };
  const dt = 1 / 120;
  for (let i = 0; i < 120 * 600 && times.length < 400; i++) g.update(dt);
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  times.sort((a, b) => a - b);
  console.log(`unlocked=${unlocked} runs=${times.length} avgT=${avg(times).toFixed(2)} p10=${times[Math.floor(times.length*.1)].toFixed(1)} p90=${times[Math.floor(times.length*.9)].toFixed(1)} max=${times[times.length-1].toFixed(1)} avgHits=${avg(hits).toFixed(1)} safe=${safe}`);
}
for (const u of [0, 4, 8, 12, 16]) runStats(u, 30);
