/* 부트스트랩: 저장/불러오기, 고정 타임스텝 루프, 이벤트 연결 */
(function (G) {
  'use strict';
  const PM = G.PM;
  const STEP = 1 / 120;
  const app = {};
  PM.app = app;

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  const game = new PM.Game({ fx: {} });
  app.game = game;
  app.sfx = new PM.Sfx();
  app.renderer = new PM.Renderer(document.getElementById('cv'), game);
  app.ui = new PM.UI(app);
  const R = app.renderer, U = app.ui, S = app.sfx;

  game.fx.onHit = (b, d, v) => { R.onHit(b, d, v); S.hit(d.kind, b.tier); };
  game.fx.onGoal = (b, gain, reason) => { R.onGoal(b, gain, reason); S.goal(); U.pulseMoney(); };
  game.fx.onMerge = (t, m) => {
    R.onMerge(t, m); S.merge(t + 1);
    const info = PM.tierInfo(t + 1);
    if (t % 20 === 0) U.toast(`★ ${info.name} 탄생! 별 등급 상승 ★`, 'gold');
    else if (t + 1 >= game.stats.bestTier && t + 1 >= 3 && !app._loading) U.toast(`병합! T${t + 1} ${info.name}`, 'good');
  };
  game.fx.onLaunch = b => R.onLaunch(b);
  game.fx.onUnlock = d => R.onUnlock(d);
  game.fx.onDrawReady = () => { if (!app._loading) U.toast('카드 뽑기 가능!', 'gold'); };

  app.save = function () {
    if (app._noSave) return;
    try { storageSet(PM.SAVE_KEY, JSON.stringify(game.serialize())); } catch (e) { console.warn('save failed', e); }
  };
  app.applySettings = function () { S.on = !!game.settings.sound; R.resize(); };
  app.resetGame = function () {
    try { localStorage.removeItem(PM.SAVE_KEY); } catch (e) { }
    game.newState(); R.parts.length = 0; R.items.clear(); app.applySettings(); app.save(); U.refresh(true);
  };

  // 불러오기 (손상 시 백업 후 새 게임)
  app._loading = true;
  const raw = storageGet(PM.SAVE_KEY);
  let offline = null;
  if (raw) {
    try {
      const at = game.load(JSON.parse(raw));
      const sec = (Date.now() - at) / 1000;
      if (sec > 60) { const o = game.offlineGain(sec); if (!o.gain.isZero) { game.money = game.money.add(o.gain); offline = o; } }
    } catch (e) {
      console.warn('save corrupted', e);
      storageSet(PM.SAVE_KEY + '.corrupt.' + Date.now(), raw);
      game.newState();
      setTimeout(() => U.toast('저장 데이터가 손상되어 새 게임을 시작합니다 (백업 보관됨)'), 300);
    }
  }
  app._loading = false;
  app.applySettings();
  if (offline) U.showOffline(offline.sec, offline.gain);
  else if (!raw) setTimeout(() => U.toast('구슬이 GOAL에 들어가면 점수가 정산됩니다. 구슬을 사서 3개씩 병합해보세요!'), 600);

  // 루프
  let last = performance.now(), acc = 0, uiT = 0, saveT = 0;
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0;
    dt = Math.min(dt, 0.1); // 탭 복귀/렉 시 물리 폭주 방지
    acc += dt * Math.max(0, Math.min(16, game.cfg.timeScale || 1));
    let steps = 0;
    while (acc >= STEP && steps < 200) { game.update(STEP); acc -= STEP; steps++; }
    if (steps >= 200) acc = 0;
    R.draw(dt);
    uiT += dt; if (uiT > 0.2) { uiT = 0; U.refresh(); }
    saveT += dt; if (saveT > 5) { saveT = 0; app.save(); }
    requestAnimationFrame(frame);
  }
  U.refresh(true);
  requestAnimationFrame(t => { last = t; frame(t); });

  // 백그라운드 전환: 저장, 복귀 시 보수적 오프라인 정산
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); app.save(); }
    else if (hiddenAt) {
      const sec = (Date.now() - hiddenAt) / 1000; hiddenAt = 0; last = performance.now(); acc = 0;
      if (sec > 30) { const o = game.offlineGain(sec); if (!o.gain.isZero) { game.money = game.money.add(o.gain); U.toast(`자리 비운 동안 +${PM.fmt(o.gain)} (${Math.round(game.cfg.offlineEff * 100)}% 효율)`, 'gold'); } }
    }
  });
  window.addEventListener('pagehide', app.save);
  window.addEventListener('beforeunload', app.save);
  window.addEventListener('resize', () => R.resize());
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => S.unlock(), { once: false, passive: true }));
  if (/[?&]debug/.test(location.search)) setTimeout(() => U.openDebug(), 200);
})(window);
