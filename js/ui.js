/* DOM UI: HUD, 하단 버튼, 모달(강화/도감/뽑기/설정/디버그) */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CARD_NO = {}; PM.CARDS.forEach((c, i) => CARD_NO[c.id] = i + 1);

  class UI {
    constructor(app) {
      this.app = app; this.g = app.game; this.view = null; this.dbgTap = 0;
      this.bind();
    }
    get sfx() { return this.app.sfx; }
    bind() {
      const g = this.g, on = (id, f) => $(id).addEventListener('click', e => { this.sfx.unlock(); this.sfx.click(); f(e); });
      on('buy1', () => this.buy(1));
      on('buy10', () => this.buy(10));
      on('buyMax', () => { const q = g.maxBuyable(); if (q > 0) this.buy(q); });
      on('btnMerge', () => { g.setMerge(!g.mergeOn); this.toast(g.mergeOn ? '자동 병합 ON — 같은 티어 3개 단위로 예약' : '자동 병합 OFF — 예약 해제, 모두 정상 발사'); this.refresh(true); });
      on('btnDraw', () => this.openCards());
      on('btnUpg', () => this.openUpgrades());
      on('btnCards', () => this.openCards());
      on('btnSettings', () => this.openSettings());
      $('mClose').addEventListener('click', () => this.close());
      $('modal').addEventListener('click', e => { if (e.target.id === 'modal') this.close(); });
      document.addEventListener('keydown', e => {
        if (e.key === '`' || e.key === 'F9') this.openDebug();
        if (e.key === 'Escape') this.close();
        if (this.view) return;
        if (e.key === '1') this.buy(1); if (e.key === '2') this.buy(10); if (e.key === 'm') $('btnMerge').click();
      });
    }
    buy(q) {
      if (this.g.buy(q)) { this.sfx.buy(); this.refresh(true); }
      else this.toast('점수가 부족합니다');
    }
    toast(msg, cls) {
      const t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.textContent = msg;
      const box = $('toast'); box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
      setTimeout(() => t.remove(), 2700);
    }
    pulseMoney() { const m = $('money'); m.classList.add('pulse'); clearTimeout(this._pt); this._pt = setTimeout(() => m.classList.remove('pulse'), 120); }

    refresh(force) {
      const g = this.g, f = PM.fmt;
      $('money').textContent = f(g.money);
      $('rate').textContent = '+' + f(g.rate) + '/s';
      $('ballsInfo').textContent = `구슬 ${f(g.totalBalls)}개 · 발사 ${g.launchInterval().toFixed(2)}s`;
      $('nInfo').textContent = `T1환산 ${f(g.N)} · 최고 T${g.stats.bestTier}`;
      const bt = g.buyTier, tl = bt > 1 ? ` T${bt}` : '';
      const c1 = g.costBalls(1), c10 = g.costBalls(10);
      $('p1').textContent = f(c1); $('buy1').classList.toggle('off', c1.gt(g.money));
      $('buy1').querySelector('.t').textContent = '구슬 구매' + tl + ' ×1';
      $('p10').textContent = f(c10); $('buy10').classList.toggle('off', c10.gt(g.money));
      const q = g.maxBuyable();
      $('tMax').textContent = q > 0 ? 'MAX ×' + f(q) : 'MAX';
      $('pMax').textContent = q > 0 ? f(g.costBalls(q)) : '-'; $('buyMax').classList.toggle('off', q <= 0);
      $('btnMerge').classList.toggle('on', g.mergeOn); $('mergeState').textContent = g.mergeOn ? 'ON · 예약중' : 'OFF';
      $('drawBadge').textContent = g.drawsAvail; $('drawBadge').classList.toggle('zero', !g.drawsAvail);
      $('btnDraw').classList.toggle('ready', g.drawsAvail > 0);
      const req = g.gaugeReq(), pct = Math.min(100, g.gauge.div(req).toNumber() * 100);
      $('gaugeFill').style.width = pct + '%'; $('gaugeTxt').textContent = `게이지 ${f(g.gauge)}/${f(req)}`;
      const canUp = (g.unlocked < PM.LAYOUT_UNLOCK.length && g.deviceCost(g.unlocked).lte(g.money)) || (g.launcherLv < g.cfg.launcherLvMax && g.launcherCost().lte(g.money));
      $('btnUpg').classList.toggle('dot-note', canUp);
      $('upgHint').textContent = `장치 ${g.unlocked}/${PM.LAYOUT_UNLOCK.length} · Lv${g.launcherLv}`;
      $('cardHint').textContent = `수집 ${Object.keys(g.cards).length}/${PM.CARDS.length}`;
      $('btnCards').classList.toggle('dot-note', PM.CARDS.some(c => g.canBreak(c.id)));
      if (this.view && this.view.update) this.view.update();
    }

    /* ---------- 모달 ---------- */
    open(title, html, view) {
      $('mTitle').textContent = title; $('mBody').innerHTML = html; $('modal').classList.remove('hidden');
      this.view = view || {}; if (this.view.mount) this.view.mount($('mBody'));
      this.app.renderer.highlightSlot = -1;
    }
    close() { $('modal').classList.add('hidden'); if (this.view && this.view.onClose) this.view.onClose(); this.view = null; this.app.renderer.highlightSlot = -1; }

    openUpgrades() {
      const g = this.g, f = PM.fmt;
      let html = `<div class="sec"><h3>발사기</h3><div class="item" id="uLaunch"><div class="info"><b>발사 간격 강화</b><span id="uLaunchTxt"></span></div><button class="btn mini" id="uLaunchBtn"><span class="t">강화</span><span class="p" id="uLaunchCost"></span></button></div></div>`;
      html += `<div class="sec"><h3>직접 구매 티어 <span class="note">(최고 티어 − ${g.cfg.buyTierGap} 까지 해금)</span></h3><div class="item"><div class="info"><b id="uTier"></b><span class="note">높은 티어 1개 = T1 3^(t−1)개 분량의 가격 (환산량 기준 동일 가격 곡선)</span></div><div class="seg" style="flex:0 0 110px"><button id="tDown">−</button><button id="tUp">＋</button></div></div></div>`;
      html += `<div class="sec"><h3>장치 슬롯 해금 <span class="note">(순서대로 해금 · 궤적과 충돌 기회 증가)</span></h3>`;
      PM.LAYOUT_UNLOCK.forEach((d, i) => {
        html += `<div class="item" data-slot="${i}"><div class="info"><b>${i + 1}. ${esc(d.name)}</b><span>${PM.KIND_NAME[d.kind]}</span></div><button class="btn mini" data-unl="${i}"><span class="t">해금</span><span class="p">${f(g.deviceCost(i))}</span></button></div>`;
      });
      html += `</div><p class="note">장치는 점수 배율 없이 궤적을 바꾸고 충돌 기회를 늘립니다. 모든 장치 접촉 시 점수 = 구슬 티어의 충돌당 점수. 외벽·깔때기는 득점하지 않습니다.</p>`;
      const ui = this;
      this.open('강화', html, {
        mount(el) {
          el.querySelector('#uLaunchBtn').onclick = () => { if (g.upgradeLauncher()) { ui.sfx.unlockSfx(); ui.toast('발사기 강화!', 'good'); } ui.refresh(); };
          el.querySelector('#tDown').onclick = () => { g.buyTier = Math.max(1, g.buyTier - 1); ui.refresh(); };
          el.querySelector('#tUp').onclick = () => { g.buyTier = Math.min(g.maxBuyTier(), g.buyTier + 1); ui.refresh(); };
          el.querySelectorAll('[data-unl]').forEach(b => b.onclick = () => {
            if (+b.dataset.unl !== g.unlocked) return;
            if (g.unlockNext()) { ui.sfx.unlockSfx(); ui.toast(PM.LAYOUT_UNLOCK[g.unlocked - 1].name + ' 해금!', 'gold'); }
            ui.refresh();
          });
          el.querySelectorAll('[data-slot]').forEach(it => {
            it.addEventListener('pointerenter', () => ui.app.renderer.highlightSlot = +it.dataset.slot);
            it.addEventListener('pointerleave', () => ui.app.renderer.highlightSlot = -1);
          });
          this.update();
        },
        update() {
          const el = $('mBody'), max = g.launcherLv >= g.cfg.launcherLvMax;
          el.querySelector('#uLaunchTxt').textContent = `Lv ${g.launcherLv}/${g.cfg.launcherLvMax} · 현재 ${g.launchInterval().toFixed(2)}s`;
          const lb = el.querySelector('#uLaunchBtn'); lb.disabled = max || g.launcherCost().gt(g.money);
          el.querySelector('#uLaunchCost').textContent = max ? 'MAX' : f(g.launcherCost());
          el.querySelector('#uTier').textContent = `구매 티어: T${g.buyTier} ${PM.tierInfo(g.buyTier).name} (최대 T${g.maxBuyTier()})`;
          el.querySelectorAll('[data-unl]').forEach(b => {
            const i = +b.dataset.unl, it = b.parentElement;
            it.classList.toggle('done', i < g.unlocked); it.classList.toggle('locked2', i > g.unlocked);
            b.disabled = i !== g.unlocked || g.deviceCost(i).gt(g.money);
            b.querySelector('.t').textContent = i < g.unlocked ? '완료' : i === g.unlocked ? '해금' : '잠김';
          });
        },
      });
    }

    cardHTML(id, opt) {
      opt = opt || {};
      const c = PM.CARD_BY_ID[id], st = this.g.cards[id], own = !!st || opt.force;
      const brk = st ? st.brk : 0;
      return `<div class="card r-${c.rarity} ${own ? '' : 'lock'} ${opt.cls || ''}" data-card="${id}" style="${opt.style || ''}">
        <span class="rar rc-${c.rarity}">${c.rarity}</span>
        ${st && st.dup && !opt.noDup ? `<span class="dupc">+${st.dup}</span>` : ''}
        ${(opt.isNew || (!opt.noNew && this.g.newCards[id])) ? '<span class="newb">NEW</span>' : ''}
        <div class="face"><div class="num">${own ? CARD_NO[id] : '?'}</div><div class="nm">${own ? esc(c.name) : '???'}</div></div>
        ${own ? `<span class="brk">${'★'.repeat(brk)}${'☆'.repeat(5 - brk)}</span>` : ''}
      </div>`;
    }
    effText(c, brk) { return c.eff.map(e => `${PM.EFF_NAME[e.type]} +${PM.fmtPct(this.g.effValue(e, brk))}`).join(', '); }

    openCards() {
      const g = this.g, f = PM.fmt, b = g.bonus;
      const rates = PM.RATES.map(([r, p]) => `<span class="rc-${r}">${r} ${(p * 100).toFixed(0)}%</span>`).join('');
      let html = `<div class="sec"><h3>카드 뽑기</h3>
        <div class="kv"><span>보유 뽑기 횟수</span><span>${g.drawsAvail}회</span><span>게이지</span><span>${f(g.gauge)} / ${f(g.gaugeReq())}</span></div>
        <div class="btnrow"><button class="btn draw" id="d1" ${g.drawsAvail < 1 ? 'disabled' : ''}><span class="t">1회 뽑기</span></button><button class="btn draw" id="d10" ${g.drawsAvail < 1 ? 'disabled' : ''}><span class="t">${Math.min(10, Math.max(1, g.drawsAvail))}회 뽑기</span></button></div>
        <div class="rates">${rates}</div>
        <p class="note">병합할 때 게이지가 찹니다: T(t)→T(t+1) 병합 1회당 ${g.cfg.gaugeBase}^(t−1) (T1→T2 +1, T2→T3 +${g.cfg.gaugeBase}, T3→T4 +${g.cfg.gaugeBase ** 2}). 뽑기를 적립할 때마다 다음 요구량이 ×${g.cfg.gaugeGrowth}. 꽝 없음, 같은 희귀도 안에서 균등 확률.</p></div>
        <div class="sec"><h3>적용 중인 패시브 합계</h3><div class="kv">
          <span>충돌 점수</span><span>×${b.score.toFixed(2)}</span><span>구매 할인</span><span>${PM.fmtPct(b.discount)} (최대 60%)</span>
          <span>카드 게이지</span><span>×${b.gauge.toFixed(2)}</span><span>발사 속도</span><span>간격 −${PM.fmtPct(b.launch)} (최대 40%)</span></div></div>
        <div class="sec"><h3>도감 ${Object.keys(g.cards).length}/${PM.CARDS.length} <span class="note">카드를 눌러 상세/돌파</span></h3><div class="grid">${PM.CARDS.map(c => this.cardHTML(c.id)).join('')}</div></div>`;
      this.open('캐릭터 카드', html, {
        mount: el => {
          const dr = n => { const r = g.draw(n); if (r.length) this.showDraw(r); };
          el.querySelector('#d1').onclick = () => dr(1);
          el.querySelector('#d10').onclick = () => dr(10);
          el.querySelectorAll('[data-card]').forEach(c => c.onclick = () => this.openCard(c.dataset.card));
        },
      });
    }
    showDraw(res) {
      const g = this.g;
      let best = 'R'; res.forEach(r => { const rr = PM.CARD_BY_ID[r.id].rarity; if (PM.RARITY_ORDER[rr] > PM.RARITY_ORDER[best]) best = rr; });
      this.sfx.draw(best);
      const one = res.length === 1;
      const html = `<div class="bigfx rc-${best}">${best === 'UR' ? '✦ UR 획득! ✦' : best === 'SSR' ? '★ SSR 획득! ★' : '뽑기 결과'}</div>
        <div class="reveal ${one ? 'one' : ''}">${res.map((r, i) => this.cardHTML(r.id, { isNew: r.isNew, noNew: true, noDup: true, cls: r.isNew ? 'isnew' : '', style: `animation-delay:${i * .12}s` })).join('')}</div>
        <p class="note" style="text-align:center">${res.filter(r => r.isNew).length}장 신규 · ${res.filter(r => !r.isNew).length}장 중복(돌파 재료로 적립)</p>
        <div class="btnrow"><button class="btn" id="back"><span class="t">도감으로</span></button>${g.drawsAvail ? `<button class="btn draw" id="again"><span class="t">한 번 더 (${Math.min(res.length, g.drawsAvail)}회)</span></button>` : ''}</div>`;
      this.open('뽑기 결과', html, {
        mount: el => {
          el.querySelector('#back').onclick = () => this.openCards();
          const a = el.querySelector('#again'); if (a) a.onclick = () => { const r = g.draw(res.length); if (r.length) this.showDraw(r); };
          el.querySelectorAll('[data-card]').forEach(c => c.onclick = () => this.openCard(c.dataset.card));
        },
      });
      this.refresh();
    }
    openCard(id) {
      const g = this.g, c = PM.CARD_BY_ID[id], st = g.cards[id];
      delete g.newCards[id];
      const need = g.breakNeed(id);
      const html = `<div class="detail">${this.cardHTML(id, { noNew: true })}<div class="txt">
        <b class="n">${st ? esc(c.name) : '???'}</b><span class="rc-${c.rarity}">${c.rarity}</span> · ${st ? esc(c.title) : '미획득'}<br>
        ${st ? `${esc(c.desc)}<br><span class="note">좋아하는 구슬: ${esc(c.fav)}</span>` : '<span class="note">뽑기로 획득하면 도감에 등록됩니다.</span>'}
        </div></div>
        <div class="sec" style="margin-top:12px"><h3>보유 패시브 (획득 즉시 자동 적용)</h3><div class="kv">
          <span>현재 (${st ? st.brk : 0}돌파)</span><span>${st ? this.effText(c, st.brk) : '-'}</span>
          ${st && st.brk < 5 ? `<span>다음 (${st.brk + 1}돌파)</span><span>${this.effText(c, st.brk + 1)}</span>` : ''}
          <span>기본 → 5돌파</span><span>${this.effText(c, 0)} → ${this.effText(c, 5)}</span>
          <span>중복 보유</span><span>${st ? st.dup : 0}장${need ? ` / 필요 ${need}장` : ''}</span>
          <span>누적 획득</span><span>${st ? st.n : 0}장</span></div></div>
        <div class="btnrow"><button class="btn" id="back"><span class="t">도감으로</span></button>
        <button class="btn draw" id="brk" ${g.canBreak(id) ? '' : 'disabled'}><span class="t">${st && st.brk >= 5 ? '최대 돌파' : '돌파'}</span><span class="p small">${need ? `중복 ${need}장 사용` : ''}</span></button></div>`;
      this.open('카드 상세', html, {
        mount: el => {
          el.querySelector('#back').onclick = () => this.openCards();
          el.querySelector('#brk').onclick = () => { if (g.doBreak(id)) { this.sfx.brk(); this.toast(`${c.name} ${g.cards[id].brk}돌파 성공!`, 'gold'); this.openCard(id); this.refresh(); } };
        },
      });
    }

    openSettings() {
      const g = this.g, s = g.settings, st = g.stats, f = PM.fmt;
      const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(s[key]) === String(v) ? 'sel' : ''}">${l}</button>`).join('')}</div>`;
      const html = `<div class="sec"><h3>사운드</h3>${seg('sound', [[true, 'ON'], [false, 'OFF']])}</div>
        <div class="sec"><h3>파티클 수 제한</h3>${seg('particles', [['low', '낮음'], ['mid', '보통'], ['high', '높음']])}</div>
        <div class="sec"><h3>이펙트 강도 <span id="fxv">${s.fx.toFixed(1)}</span></h3><input type="range" min="0" max="1.6" step="0.1" value="${s.fx}" id="fxr"></div>
        <div class="sec"><h3>충돌 점수 숫자</h3>${seg('texts', [[true, '표시'], [false, '숨김']])}</div>
        <div class="sec"><h3>구슬 잔상</h3>${seg('trails', [[true, '표시'], [false, '숨김']])}</div>
        <div class="sec"><h3>누적 통계</h3><div class="kv">
          <span>총 획득 점수</span><span>${f(st.earned)}</span><span>주행 횟수</span><span>${f(st.runs)}</span><span>충돌 횟수</span><span>${f(st.hits)}</span>
          <span>병합 횟수</span><span>${f(st.merges)}</span><span>최고 티어</span><span>T${st.bestTier} ${PM.tierInfo(st.bestTier).name}</span>
          <span>구매한 구슬</span><span>${f(st.bought)}</span><span>카드 뽑기</span><span>${st.draws}</span><span>안전 복귀</span><span>${st.safe}</span>
          <span>플레이 시간</span><span>${Math.floor(st.play / 3600)}h ${Math.floor(st.play / 60) % 60}m</span></div></div>
        <div class="sec"><h3>규칙 안내</h3><p class="note">• 구슬은 GOAL에 들어갈 때 주행 중 누적 점수를 정산하고 보관소로 돌아옵니다.<br>• ${g.cfg.runSafeTime}초 넘게 내려오지 못하면 주황 테두리로 GOAL 유도 후 <b>안전 복귀</b>되며 누적 점수는 그대로 정산됩니다. 필드 이탈 시에도 같은 규칙으로 복구됩니다.<br>• 오프라인 수익: 최근 초당 수익 × ${Math.round(g.cfg.offlineEff * 100)}% × 경과 시간(최대 ${g.cfg.offlineMaxH}시간).<br>• 자동 저장: 5초마다 및 화면 전환 시.</p></div>
        <div class="btnrow"><button class="btn" id="saveNow"><span class="t">지금 저장</span></button><button class="btn danger" id="reset"><span class="t">게임 초기화</span></button></div>
        <p class="note" id="ver" style="text-align:center">Pinball Merge v1.0 · 저장 버전 ${PM.SAVE_VERSION}</p>`;
      this.open('설정', html, {
        mount: el => {
          el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => {
            const k = sg.dataset.key, v = b.dataset.v; s[k] = v === 'true' ? true : v === 'false' ? false : v;
            sg.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
            this.app.applySettings();
          }));
          el.querySelector('#fxr').oninput = e => { s.fx = parseFloat(e.target.value); el.querySelector('#fxv').textContent = s.fx.toFixed(1); };
          el.querySelector('#saveNow').onclick = () => { this.app.save(); this.toast('저장 완료', 'good'); };
          el.querySelector('#reset').onclick = () => this.confirmReset();
          el.querySelector('#ver').onclick = () => { if (++this.dbgTap >= 5) { this.dbgTap = 0; this.openDebug(); } };
        },
      });
    }
    confirmReset() {
      const html = `<p>모든 진행(점수, 구슬, 장치, 카드, 통계)이 삭제됩니다. 되돌릴 수 없습니다.</p>
        <p class="note">확인을 위해 아래 칸에 <b>초기화</b> 라고 입력하세요.</p>
        <div class="dbg" style="grid-template-columns:1fr"><input id="rtxt" placeholder="초기화"></div>
        <div class="btnrow"><button class="btn" id="no"><span class="t">취소</span></button><button class="btn danger" id="yes" disabled><span class="t">영구 삭제</span></button></div>`;
      this.open('게임 초기화', html, {
        mount: el => {
          const yes = el.querySelector('#yes');
          el.querySelector('#rtxt').oninput = e => yes.disabled = e.target.value.trim() !== '초기화';
          el.querySelector('#no').onclick = () => this.openSettings();
          yes.onclick = () => { this.app.resetGame(); this.close(); this.toast('새 게임을 시작합니다', 'good'); };
        },
      });
    }

    openDebug() {
      const g = this.g, c = g.cfg;
      const keys = ['scoreBase', 'launchInterval', 'priceBase', 'priceK1', 'priceK2', 'gaugeBase', 'gaugeReq0', 'gaugeGrowth', 'devCostL0', 'devCostStep', 'gravity', 'hitCooldown', 'runSafeTime', 'timeScale'];
      const html = `<div class="sec"><h3>밸런스 값 (즉시 적용, 이 세션 한정)</h3><div class="dbg">${keys.map(k => `<label for="c_${k}">${k}</label><input id="c_${k}" data-k="${k}" type="number" step="any" value="${c[k]}">`).join('')}</div>
        <div class="btnrow"><button class="btn" id="cfgReset"><span class="t">기본값 복원</span></button></div></div>
        <div class="sec"><h3>치트/시험</h3><div class="dbg">
          <label>점수 설정 (log10)</label><input id="dMoney" type="number" value="${Math.max(0, Math.round(g.money.l || 0))}">
          <label>구슬 추가: 티어</label><input id="dTier" type="number" value="1" min="1">
          <label>구슬 추가: 개수</label><input id="dCnt" type="number" value="3" min="1"></div>
          <div class="btnrow"><button class="btn" id="dSetMoney"><span class="t">점수 적용</span></button><button class="btn" id="dAdd"><span class="t">구슬 추가</span></button></div>
          <div class="btnrow"><button class="btn" id="dUnlock"><span class="t">장치 전부 해금</span></button><button class="btn" id="dDraw"><span class="t">뽑기 +10</span></button><button class="btn" id="dHit"><span class="t">판정 표시</span></button></div></div>
        <div class="sec"><h3>가격 곡선 미리보기 (T1 1개)</h3><pre class="log" id="curve"></pre></div>
        <div class="sec"><h3>자동 테스트</h3><div class="btnrow"><button class="btn" id="dTest"><span class="t">필수 시나리오 실행</span></button><button class="btn" id="dPhys"><span class="t">물리 통계</span></button></div><pre class="log" id="tlog">-</pre></div>`;
      const ui = this;
      this.open('디버그 / 밸런스', html, {
        mount: el => {
          const curve = () => { const lines = []; for (const n of [1, 10, 100, 1e3, 1e4, 1e6, 1e9, 1e12, 1e20, 1e40]) lines.push(`N=${PM.fmt(n).padEnd(7)} P=${PM.fmt(g.costUnits(1, PM.D.num(n)))}`); el.querySelector('#curve').textContent = lines.join('\n'); };
          curve();
          el.querySelectorAll('[data-k]').forEach(i => i.onchange = () => { const v = parseFloat(i.value); if (Number.isFinite(v)) { c[i.dataset.k] = v; g.recompute(); curve(); } });
          el.querySelector('#cfgReset').onclick = () => { Object.assign(c, PM.CFG_DEFAULT); g.recompute(); ui.openDebug(); };
          el.querySelector('#dSetMoney').onclick = () => { g.money = PM.D.fromLog(parseFloat(el.querySelector('#dMoney').value) || 0); ui.refresh(); };
          el.querySelector('#dAdd').onclick = () => { const t = Math.max(1, Math.floor(+el.querySelector('#dTier').value || 1)), n = Math.max(1, Math.floor(+el.querySelector('#dCnt').value || 1)); g.ensure(t); g.s[t] += n; g.recompute(); g.processMerges(); ui.refresh(); };
          el.querySelector('#dUnlock').onclick = () => { g.unlocked = PM.LAYOUT_UNLOCK.length; g.field.setUnlocked(g.unlocked); };
          el.querySelector('#dDraw').onclick = () => { g.drawsAvail += 10; ui.refresh(); };
          el.querySelector('#dHit').onclick = () => { ui.app.renderer.showHit = !ui.app.renderer.showHit; };
          el.querySelector('#dTest').onclick = () => { const r = PM.runTests(); el.querySelector('#tlog').textContent = r.map(x => (x.ok ? '✅ ' : '❌ ') + x.name + '\n   ' + x.detail).join('\n') + `\n\n${r.filter(x => x.ok).length}/${r.length} 통과`; };
          el.querySelector('#dPhys').onclick = () => { const lines = [0, g.unlocked, PM.LAYOUT_UNLOCK.length].map(u => { const s = PM.physicsStats(u, 120); return `장치 ${u}개 해금: 평균 ${s.avgT.toFixed(2)}s 최대 ${s.maxT.toFixed(1)}s 충돌 ${s.avgHits.toFixed(1)}회 안전복귀 ${s.safe}`; }); el.querySelector('#tlog').textContent = lines.join('\n'); };
        },
      });
    }
    showOffline(sec, gain) {
      const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
      this.open('다시 오신 것을 환영해요', `<div class="bigfx" style="color:#fff3b0">+${PM.fmt(gain)}</div>
        <p class="note" style="text-align:center">부재 ${h}시간 ${m}분 동안의 오프라인 수익<br>(최근 초당 수익 × ${Math.round(this.g.cfg.offlineEff * 100)}% 효율, 최대 ${this.g.cfg.offlineMaxH}시간까지 보수적으로 계산)</p>
        <div class="btnrow"><button class="btn buy" id="okk"><span class="t">받기</span></button></div>`, { mount: el => el.querySelector('#okk').onclick = () => this.close() });
    }
  }
  PM.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
