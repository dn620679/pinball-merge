/* 밸런스/설정값 — 디버그 패널에서 실시간 조정 가능 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const DEFAULT = {
    scoreBase: 4,            // 티어당 충돌 점수 배율 (T1=1, T2=4, T3=16 ...)
    launchInterval: 0.85,    // 기본 발사 간격(초)
    launchIntervalMin: 0.22,
    launcherDecay: 0.9,      // 발사기 강화 1레벨당 간격 배수
    launcherLvMax: 12,
    launchCostL0: 2.0,       // 발사기 강화 비용 log10 시작값
    launchCostStep: 1.4,
    priceBase: 10,           // 구매가 P(N) = base * (N+1)^k1 * (1+log10(N+1))^k2
    priceK1: 0.42,
    priceK2: 1.25,
    devCostL0: 2.0,         // 장치 해금 비용 log10 시작값
    devCostStep: 1.0,
    gaugeBase: 3,            // 병합 게이지: T(t)->T(t+1) 1회당 gaugeBase^(t-1)
    gaugeReq0: 6,            // 첫 뽑기 게이지 요구량
    gaugeGrowth: 1.3,       // 뽑기 1회 적립마다 요구량 배수
    gravity: 300,
    drag: 0.06,
    vmax: 620,
    ballR: 8,
    hitCooldown: 0.2,        // 같은 장치 재접촉 판정 쿨다운(초) - 연속 접촉은 재득점 없음
    runGuideTime: 12,        // 이 시간 이후 GOAL 유도력 적용
    runSafeTime: 20,         // 이 시간 이후 안전 복귀 (누적 점수 그대로 정산)
    offlineEff: 0.25,        // 오프라인 수익 효율
    offlineMaxH: 8,
    timeScale: 1,
    startBalls: 2,
    buyTierGap: 8,           // 최고 티어 - gap 까지 직접 구매 가능
  };
  PM.CFG_DEFAULT = DEFAULT;
  PM.CFG = Object.assign({}, DEFAULT);
  PM.RATES = [['UR', 0.03], ['SSR', 0.10], ['SR', 0.30], ['R', 0.57]];
  PM.BREAK_NEED = [1, 2, 3, 4, 5]; // n돌파 -> n+1돌파에 필요한 중복 수
  PM.SAVE_KEY = 'pinballMerge.save.v1';
  PM.SAVE_VERSION = 1;
})(typeof window !== 'undefined' ? window : globalThis);
