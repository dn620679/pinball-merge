/* 구슬 20종, 캐릭터 카드 12종, 필드 장치 슬롯 */
(function (G) {
  'use strict';
  const PM = G.PM || (G.PM = {});

  // c: 주색, g: 광채/잔상색, fx: 충돌 이펙트 종류
  PM.MARBLES = [
    { name: '유리', c: '#bfe9ff', g: '#9fe3ff', fx: 'glass' },
    { name: '구리', c: '#d9783a', g: '#ff9a52', fx: 'copper' },
    { name: '은', c: '#cfd7e3', g: '#e6f0ff', fx: 'silver' },
    { name: '금', c: '#f2c444', g: '#ffd75e', fx: 'gold' },
    { name: '에메랄드', c: '#22c46e', g: '#4dff9a', fx: 'emerald' },
    { name: '사파이어', c: '#2f63ff', g: '#5d8bff', fx: 'sapphire' },
    { name: '루비', c: '#e0233f', g: '#ff4a64', fx: 'ruby' },
    { name: '다이아몬드', c: '#eaffff', g: '#bffcff', fx: 'diamond' },
    { name: '오팔', c: '#f3e6ff', g: '#ffc6f2', fx: 'opal' },
    { name: '플라즈마', c: '#c13cff', g: '#ff6cf7', fx: 'plasma' },
    { name: '용암', c: '#ff5a14', g: '#ff7a1a', fx: 'lava' },
    { name: '냉기', c: '#9fe2ff', g: '#c9f4ff', fx: 'ice' },
    { name: '번개', c: '#ffe23a', g: '#fff36b', fx: 'bolt' },
    { name: '태양', c: '#ffb21e', g: '#ffd34a', fx: 'sun' },
    { name: '달', c: '#d8d8cf', g: '#f3f1ff', fx: 'moon' },
    { name: '별', c: '#ffe27a', g: '#fff0a0', fx: 'star' },
    { name: '성운', c: '#ff5fae', g: '#d27bff', fx: 'nebula' },
    { name: '은하', c: '#8fa0ff', g: '#b9c4ff', fx: 'galaxy' },
    { name: '블랙홀', c: '#2a0b3d', g: '#b05cff', fx: 'blackhole' },
    { name: '우주', c: '#6a3cff', g: '#ffffff', fx: 'cosmos' },
  ];
  PM.STAR_COLORS = [null, null, '#dfe7f2', '#ffd34d', '#ff7ab8', '#6ff0ff', '#b88cff'];
  PM.tierInfo = function (t) {
    const base = (t - 1) % 20; const star = Math.floor((t - 1) / 20) + 1;
    const m = PM.MARBLES[base];
    return { base, star, name: (star > 1 ? star + '성 ' : '') + m.name + ' 구슬', m };
  };
  PM.starColor = function (star, time) {
    if (star < 2) return null;
    if (star < PM.STAR_COLORS.length) return PM.STAR_COLORS[star];
    return 'hsl(' + ((star * 47 + (time || 0) * 60) % 360) + ',100%,70%)';
  };

  /* ---------- 미소녀 캐릭터 카드 (오리지널) ---------- */
  // eff: [{type, base}] type: score(충돌 점수) / discount(구매 할인) / gauge(카드 게이지) / launch(발사 속도)
  PM.CARDS = [
    { id: 'gla', name: '글라 크리스', rarity: 'R', title: '유리공방 견습생',
      eff: [{ type: 'score', base: 0.08 }],
      desc: '투명한 유리구슬을 불어 만드는 공방의 막내. 햇빛에 구슬을 비춰보는 게 취미. 안경 너머로 모든 반짝임을 기록한다.',
      fav: '유리 구슬', art: { hair: '#a9dcff', hair2: '#5fa8e8', style: 'bob', eye: '#3aa0ff', skin: '#ffe6d8', outfit: '#ffffff', outfit2: '#3b7fd9', collar: 'sailor', acc: ['glasses', 'sparkpin'], mouth: 'smile', bg: ['#dff4ff', '#8fc8ff'], pat: 'bubbles' } },
    { id: 'rina', name: '코퍼 리나', rarity: 'R', title: '구리 레일 정비사',
      eff: [{ type: 'discount', base: 0.03 }],
      desc: '핀볼 레일을 닦고 조이는 정비 담당. 고글은 절대 벗지 않는다. 값을 깎는 협상의 달인.',
      fav: '구리 구슬', art: { hair: '#e8823e', hair2: '#a84a1c', style: 'short', eye: '#ffa338', skin: '#ffe0cc', outfit: '#7a4a2c', outfit2: '#f2c27a', collar: 'hoodie', acc: ['goggles'], mouth: 'grin', bg: ['#ffe2c2', '#d9884a'], pat: 'gears' } },
    { id: 'silvi', name: '실비 벨', rarity: 'R', title: '은방울 안내원',
      eff: [{ type: 'gauge', base: 0.10 }],
      desc: '보관소 앞에서 방울을 울려 다음 구슬을 알려주는 안내원. 쌍둥이 꼬리머리가 방울처럼 흔들린다.',
      fav: '은 구슬', art: { hair: '#e7ebf5', hair2: '#9aa3ba', style: 'twin', eye: '#7a7cff', skin: '#ffeade', outfit: '#25305c', outfit2: '#e6eaff', collar: 'sailor', acc: ['bell', 'ribbon'], mouth: 'open', bg: ['#eef1ff', '#9fa8d8'], pat: 'bells' } },
    { id: 'mint', name: '민트 페블', rarity: 'R', title: '정원의 조약돌 수집가',
      eff: [{ type: 'score', base: 0.08 }],
      desc: '정원에서 동글동글한 돌과 구슬을 모으는 소녀. 포니테일에 꽂은 꽃은 매일 바뀐다.',
      fav: '금 구슬', art: { hair: '#86e6c6', hair2: '#36a884', style: 'pony', eye: '#21a87e', skin: '#ffe6d6', outfit: '#fff6e0', outfit2: '#f08aa0', collar: 'dress', acc: ['flower'], mouth: 'smile', bg: ['#e9fff3', '#8fdcb8'], pat: 'leaves' } },
    { id: 'lyla', name: '에메 라일라', rarity: 'SR', title: '숲의 보석술사',
      eff: [{ type: 'gauge', base: 0.20 }],
      desc: '에메랄드 숲에서 온 엘프 보석술사. 구슬의 결을 읽어 다음 병합을 예언한다고 한다.',
      fav: '에메랄드 구슬', art: { hair: '#3ccf7a', hair2: '#137a45', style: 'long', eye: '#1fbf6a', skin: '#ffeede', outfit: '#1f6e46', outfit2: '#e8d27a', collar: 'cape', acc: ['elf', 'flowercrown'], mouth: 'calm', bg: ['#d8ffe6', '#2f9f63'], pat: 'gems' } },
    { id: 'sapi', name: '사피 블루노트', rarity: 'SR', title: '심해의 리듬 메이커',
      eff: [{ type: 'launch', base: 0.05 }],
      desc: '구슬이 튀는 소리로 비트를 만드는 DJ. 사파이어색 사이드테일과 헤드폰이 트레이드마크.',
      fav: '사파이어 구슬', art: { hair: '#3a6bff', hair2: '#1b2f99', style: 'side', eye: '#38c8ff', skin: '#ffe4d4', outfit: '#1a2148', outfit2: '#38c8ff', collar: 'hoodie', acc: ['headphones'], mouth: 'wink', bg: ['#d6e4ff', '#2a49c9'], pat: 'notes' } },
    { id: 'rose', name: '루비 로제', rarity: 'SR', title: '진홍의 영애',
      eff: [{ type: 'score', base: 0.15 }],
      desc: '루비 가문의 아가씨. 우아하지만 승부욕이 강해 점수판에서 눈을 떼지 않는다.',
      fav: '루비 구슬', art: { hair: '#e0344c', hair2: '#7a0f22', style: 'long', eye: '#ff3d5e', skin: '#fff0e8', outfit: '#1c1016', outfit2: '#e0344c', collar: 'dress', acc: ['rose', 'ribbon'], mouth: 'calm', bg: ['#ffe0e6', '#a0142e'], pat: 'roses' } },
    { id: 'opal', name: '오팔 미뇽', rarity: 'SR', title: '무지갯빛 몽상가',
      eff: [{ type: 'discount', base: 0.05 }],
      desc: '보는 각도마다 머리색이 달라 보이는 신비한 소녀. 상점 주인과 친해서 할인을 받아온다.',
      fav: '오팔 구슬', art: { hair: '#f7b8ff', hair2: '#8fd8ff', style: 'twin', eye: '#c07bff', skin: '#fff0ea', outfit: '#ffffff', outfit2: '#ffb8e0', collar: 'dress', acc: ['starpin'], mouth: 'open', bg: ['#fff0fb', '#b8c8ff'], pat: 'bubbles', rainbow: true } },
    { id: 'raika', name: '라이카 볼트', rarity: 'SSR', title: '번개 고양이 레이서',
      eff: [{ type: 'launch', base: 0.10 }, { type: 'score', base: 0.10 }],
      desc: '번개처럼 빠른 발사대 레이서. 고양이 귀는 진짜인지 아무도 모른다. 정전기 주의.',
      fav: '번개 구슬', art: { hair: '#ffe14a', hair2: '#d89a00', style: 'short', eye: '#ffd000', skin: '#ffe6d2', outfit: '#16161f', outfit2: '#ffe14a', collar: 'hoodie', acc: ['catears', 'bolt'], mouth: 'cat', bg: ['#fff7c2', '#3a2c78'], pat: 'bolts' } },
    { id: 'soleil', name: '솔레이 아우라', rarity: 'SSR', title: '태양의 무녀',
      eff: [{ type: 'score', base: 0.30 }],
      desc: '태양 구슬의 빛을 지키는 무녀. 그녀가 미소 지으면 필드 전체가 따뜻하게 빛난다.',
      fav: '태양 구슬', art: { hair: '#ffc23a', hair2: '#d06a00', style: 'long', eye: '#ff8a00', skin: '#fff0e0', outfit: '#ffffff', outfit2: '#ff8a00', collar: 'cape', acc: ['halo', 'sunpin'], mouth: 'smile', bg: ['#fff4cf', '#ff9a3a'], pat: 'rays' } },
    { id: 'lunaria', name: '루나리아', rarity: 'UR', title: '월광의 수호자',
      eff: [{ type: 'score', base: 0.40 }, { type: 'gauge', base: 0.20 }],
      desc: '달 구슬에 깃든 정령. 밤마다 보관소의 구슬들을 조용히 닦아준다. 초승달 머리핀은 천 년 된 보물.',
      fav: '달 구슬', art: { hair: '#f4f2ff', hair2: '#a99adf', style: 'long', eye: '#9b7bff', skin: '#fff3ee', outfit: '#151a3d', outfit2: '#c9bcff', collar: 'cape', acc: ['crescent', 'starpin'], mouth: 'calm', bg: ['#2a2f6a', '#0b0e2a'], pat: 'moon' } },
    { id: 'astra', name: '아스트라 코스모스', rarity: 'UR', title: '우주를 품은 별의 여왕',
      eff: [{ type: 'score', base: 0.50 }, { type: 'discount', base: 0.08 }],
      desc: '머리카락 속에 은하가 흐르는 별의 여왕. 우주 구슬이 탄생하는 순간을 지켜본다는 전설이 있다.',
      fav: '우주 구슬', art: { hair: '#5a3cff', hair2: '#1a0a55', style: 'long', eye: '#ff7af0', skin: '#fff0f0', outfit: '#120a30', outfit2: '#ffd86a', collar: 'cape', acc: ['starcrown', 'starhair'], mouth: 'smile', bg: ['#2b1466', '#050418'], pat: 'galaxy' } },
  ];
  PM.CARD_BY_ID = {}; PM.CARDS.forEach(c => PM.CARD_BY_ID[c.id] = c);
  PM.EFF_NAME = { score: '충돌 점수', discount: '구매 할인', gauge: '카드 게이지', launch: '발사 속도' };
  PM.RARITY_ORDER = { R: 0, SR: 1, SSR: 2, UR: 3 };

  /* ---------- 필드 장치 (논리 좌표 360 x 400) ---------- */
  // kind: bumper(r) / pin(r) / slope(x1,y1,x2,y2) / spinner(x,y,len,w)
  PM.LAYOUT_INIT = [
    { kind: 'pin', x: 180, y: 58, r: 4.5 },
    { kind: 'bumper', x: 108, y: 108, r: 16 },
    { kind: 'bumper', x: 252, y: 108, r: 16 },
    { kind: 'bumper', x: 180, y: 190, r: 18 },
    { kind: 'pin', x: 42, y: 190, r: 4.5 },
    { kind: 'pin', x: 318, y: 190, r: 4.5 },
    { kind: 'slope', x1: 0, y1: 226, x2: 78, y2: 252 },
    { kind: 'slope', x1: 360, y1: 226, x2: 282, y2: 252 },
    { kind: 'pin', x: 122, y: 272, r: 4.5 },
    { kind: 'pin', x: 238, y: 272, r: 4.5 },
    { kind: 'spinner', x: 180, y: 300, len: 24, w: 2.6 },
  ];
  PM.LAYOUT_UNLOCK = [
    { kind: 'pin', x: 180, y: 150, r: 4.5, name: '중앙 핀' },
    { kind: 'bumper', x: 40, y: 108, r: 12, name: '좌측 소형 범퍼' },
    { kind: 'bumper', x: 320, y: 108, r: 12, name: '우측 소형 범퍼' },
    { kind: 'pin', x: 100, y: 192, r: 4.5, name: '좌측 핀' },
    { kind: 'pin', x: 260, y: 192, r: 4.5, name: '우측 핀' },
    { kind: 'slope', x1: 58, y1: 146, x2: 82, y2: 160, name: '좌측 반사판' },
    { kind: 'slope', x1: 302, y1: 146, x2: 278, y2: 160, name: '우측 반사판' },
    { kind: 'pin', x: 180, y: 244, r: 4.5, name: '하단 중앙 핀' },
    { kind: 'spinner', x: 180, y: 106, len: 20, w: -3.2, name: '상단 회전 반사기' },
    { kind: 'pin', x: 100, y: 52, r: 4.5, name: '상단 좌측 핀' },
    { kind: 'pin', x: 260, y: 52, r: 4.5, name: '상단 우측 핀' },
    { kind: 'spinner', x: 70, y: 302, len: 18, w: 3.0, name: '좌측 회전 반사기' },
    { kind: 'spinner', x: 290, y: 302, len: 18, w: -3.0, name: '우측 회전 반사기' },
    { kind: 'pin', x: 110, y: 336, r: 4.5, name: '골 좌측 핀' },
    { kind: 'pin', x: 250, y: 336, r: 4.5, name: '골 우측 핀' },
    { kind: 'bumper', x: 180, y: 346, r: 10, name: '골 앞 범퍼' },
  ];
  PM.KIND_NAME = { bumper: '범퍼', pin: '핀', slope: '경사 반사벽', spinner: '회전 반사기' };
})(typeof window !== 'undefined' ? window : globalThis);
