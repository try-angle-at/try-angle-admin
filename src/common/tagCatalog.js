// 레퍼런스 태그 분류 카탈로그 — 전 개발자가 시드(tryangle-seed.sql 보류분)에 설계해둔
// 분위기/옷 체계의 정적 사본. 서버 /tag/* API가 아직 없어 어드민 선택지로 직접 제공한다.
// fetchTagCategory가 서버 태그 API를 먼저 시도하고, 실패/빈 응답이면 이 카탈로그로 폴백
// (나중에 태그 API가 구현되면 자동으로 서버 값이 우선된다).
export const TAG_GROUPS = [
  {
    header: '분위기',
    codes: [
      { value: 'MOOD_CASUAL', label: '캐주얼' },
      { value: 'MOOD_CUTE', label: '러블리' },
      { value: 'MOOD_Y2K', label: 'Y2K' },
      { value: 'MOOD_STREET', label: '스트릿' },
      { value: 'MOOD_CHIC', label: '시크' },
      { value: 'MOOD_REFRESH', label: '청량' },
      { value: 'MOOD_VINTAGE', label: '빈티지' },
    ],
  },
  {
    // 장소·공간 축 — 레퍼런스 aiDoc(meta.scene)에서 확인된 값부터 시작.
    // reference-lab 가족 분류(자연/물가/상점실내/주거…)는 협의 후 확장
    header: '장소',
    codes: [
      { value: 'SCENE_CAFE', label: '카페' },
      { value: 'SCENE_STREET', label: '거리' },
    ],
  },
  {
    header: '옷 (대분류)',
    codes: [
      { value: 'CLOTH_TOP', label: '상의' },
      { value: 'CLOTH_BOTTOM', label: '하의' },
      { value: 'CLOTH_OUTER', label: '아우터' },
      { value: 'CLOTH_DRESS', label: '원피스' },
      { value: 'CLOTH_SKIRT', label: '치마' },
      { value: 'CLOTH_SHOES', label: '신발' },
      { value: 'CLOTH_BAG', label: '가방' },
      { value: 'CLOTH_ACC', label: '잡화' },
    ],
  },
];

// v-select용: 그룹 제목(subheader) + 선택 항목의 평탄화 목록
export const TAG_SELECT_ITEMS = TAG_GROUPS.flatMap((g) => [
  { type: 'subheader', title: g.header },
  ...g.codes.map((c) => ({ value: c.value, label: c.label })),
]);

// 코드 → 표시 이름 (목록 카드 칩 렌더용)
export const TAG_LABEL_BY_CODE = Object.fromEntries(
  TAG_GROUPS.flatMap((g) => g.codes.map((c) => [c.value, c.label])),
);
