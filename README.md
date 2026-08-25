# TryAngle Admin

TryAngle 서비스 운영용 어드민 웹 콘솔.
레퍼런스 이미지·카테고리·상품·스냅·회원을 관리하며, 백엔드로
[try-angle-server](https://github.com/try-angle-at/try-angle-server)의 REST API를 사용한다.

- **운영 주소: https://d3qnwc4wvz8vwf.cloudfront.net** (CloudFront — 어드민 정적 파일 + `/api/*`를 EC2로 프록시, HTTPS)
- 스택: Vue 3 · Vuetify 3 · Vite (SPA)
- 인증: 서버 발급 JWT (Bearer) — 어드민 기능은 ADMIN 이상 계정으로 로그인
- 배포 갱신: `npm run build` → `docs/`를 S3 `s3://project9-83-seoul-s3-541673202328-ap-northeast-2-an/admin/`에 sync (EC2의 IAM Role로) → CloudFront 캐시 무효화(`/*`)

## 실행 방법

Node.js 18+ 필요.

```bash
cp .env.example .env      # 필요하면 값 수정 (기본값 = 운영 EC2 서버)
npm install
npm run dev               # http://localhost:5173
```

빌드(정적 파일 생성)는 `npm run build` → `dist/` 폴더가 결과물이다.

## 환경 변수 (.env)

| 변수 | 의미 |
|---|---|
| `VITE_API_BASE_URL` | API 서버 주소, **끝에 `/api` 포함** (예: `http://52.78.214.200:8080/api`) |
| `VITE_IMAGE_BASE_URL` | 이미지 공개 URL 베이스 — 서버가 저장한 파일 경로 앞에 붙음 |
| `VITE_API_TIMEOUT` | API 타임아웃(ms) |

## 화면 구성

| 경로 | 화면 |
|---|---|
| `/login`, `/register`, `/user` | 로그인 · 가입 · 내 정보 |
| `/ref-images` | 레퍼런스 이미지 목록/등록/상세(AI 문서 포함) |
| `/category` | 이미지 카테고리 관리 |
| `/products` | 상품 관리 |
| `/snaps` | 스냅(촬영 결과) 관리 |
| `/tag` | 태그 관리 — ⚠️ 아래 "알려진 공백" 참고 |
| `/system`, `/system-stats` | 시스템/통계 |
| `/simulator` | 카메라 시뮬레이터(디버그) |

## 서버 연동 메모

- API 명세: 서버의 Swagger(`{서버주소}/docs`)와 `try-angle-server/docs/STARTGUID.md` 기준.
- **알려진 공백** (2026-08 기준, 서버 쪽 미구현):
  - 태그 화면이 부르는 `/tag/*` API — 서버에 라우트·`tb_tag` 테이블이 아직 없음
  - `/auth/token` (폼 로그인) — 서버에 라우트 없음 (JSON `/auth/login`은 정상)
- `src/common/Firebase.js`는 어디서도 import하지 않는 잔재 코드(미사용).

## 이력

- 이 저장소는 이전 개발자의 다른 프로젝트 템플릿을 기반으로 시작되어
  패키지명 등에 옛 이름(DungDong/Fooding)이 남아 있었고, 2026-08에 정리했다.
