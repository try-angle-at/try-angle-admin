// 레퍼런스 도메인(패션/미감) 분류 — kwd 배열 안의 DOMAIN_* 코드 규약 (SDK 3모드 제안서 §3-3)
// 서버는 kwd를 무검증 저장하므로, 코드 목록·표시는 여기서만 관리한다.
export const REF_DOMAIN_OPTIONS = [
  { value: 'DOMAIN_FASHION', label: '패션 커머스', color: 'indigo', icon: 'mdi-hanger' },
  { value: 'DOMAIN_AESTHETIC', label: '미감 · 예쁜사진', color: 'pink-darken-1', icon: 'mdi-image-filter-vintage' },
];

export const REF_DOMAIN_CODES = REF_DOMAIN_OPTIONS.map((o) => o.value);

/** kwd 배열을 도메인 코드와 나머지 태그로 분리 */
export function splitDomainCodes(kwd) {
  const arr = Array.isArray(kwd) ? kwd : [];
  return {
    domains: arr.filter((c) => REF_DOMAIN_CODES.includes(c)),
    rest: arr.filter((c) => !REF_DOMAIN_CODES.includes(c)),
  };
}

/** 도메인 코드 → 표시 메타 (미지 코드는 null) */
export function domainMeta(code) {
  return REF_DOMAIN_OPTIONS.find((o) => o.value === code) || null;
}
