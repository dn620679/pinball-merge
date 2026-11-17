const PM = require('./load')(['bignum.js', 'config.js', 'data.js', 'physics.js', 'core.js']);
const hours = parseFloat(process.argv[2] || '1');
const g = new PM.Game();
const dt = 1 / 60; let next = 0, lastTier = 0; const t0 = Date.now();
for (let step = 0; step < hours * 3600 * 60; step++) {
  g.update(dt);
  if (g.time >= next) {
    next += 1;
    if (g.drawsAvail) g.draw(g.drawsAvail);
    for (const id in g.cards) while (g.doBreak(id));
    // 업그레이드는 "현재 돈의 대부분"일 때만 구매
    g.unlockNext();
    if (g.launcherCost().lte(g.money)) g.upgradeLauncher();
    if (g.maxBuyTier() > g.buyTier) g.buyTier = g.maxBuyTier();
    const q = g.maxBuyable(); if (q > 0) g.buy(q);
    if (g.topTier > lastTier || Math.floor(g.time) % 600 === 0) {
      lastTier = Math.max(lastTier, g.topTier);
      console.log(`t=${(g.time/60).toFixed(1)}m top=T${g.topTier} N=${PM.fmt(g.N)} money=${PM.fmt(g.money)} rate=${PM.fmt(g.rate)}/s balls=${g.totalBalls} dev=${g.unlocked} lv=${g.launcherLv} draws=${g.stats.draws} cards=${Object.keys(g.cards).length} bonus=${g.bonus.score.toFixed(2)} price1=${PM.fmt(g.costBalls(1))} bt=${g.buyTier}`);
    }
  }
}
console.log('wall', (Date.now() - t0) / 1000, 's');
