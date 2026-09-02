// 촬영 방식(셀카/내찍사/남찍사) — 카테고리에 섞여 있던 축을 분리한 것 (2026-09-01).
// 프레이밍(전신/상체/하체)과 조합 가능한 독립 축이므로 kwd의 SHOT_* 코드로 저장한다.
// (어드민이 원래 SHOT_ROOT 태그 그룹을 조회하던 설계의 확정판, 서버 무변경)
export const SHOT_TYPE_OPTIONS = [
  { value: 'SHOT_SELFIE', label: '셀카', icon: 'mdi-camera-front-variant' },
  { value: 'SHOT_BY_ME', label: '내찍사', icon: 'mdi-camera' },
  { value: 'SHOT_BY_OTHER', label: '남찍사', icon: 'mdi-camera-account' },
  // 출처상 알 수 없는 경우(수집 레퍼런스 등) — 억지 추정 대신 정직한 값
  { value: 'SHOT_UNKNOWN', label: '미상', icon: 'mdi-help-circle-outline' },
];

export const SHOT_CODES = SHOT_TYPE_OPTIONS.map((o) => o.value);

/** kwd에서 촬영 방식 코드(첫 번째)와 나머지를 분리 — 촬영 방식은 1장당 1개 */
export function splitShotCode(kwd) {
  const arr = Array.isArray(kwd) ? kwd : [];
  return {
    shot: arr.find((c) => SHOT_CODES.includes(c)) || null,
    rest: arr.filter((c) => !SHOT_CODES.includes(c)),
  };
}

export function shotMeta(code) {
  return SHOT_TYPE_OPTIONS.find((o) => o.value === code) || null;
}
