# 입퇴실 도우미 — Claude 작업 지침

## 비즈니스 컨텍스트

### 제품 정의
임대인이 임차인의 입실·퇴실을 링크 하나로 처리하는 SaaS 도구.
임차인은 앱 설치 없이 링크로 참여하고, 임대인은 방 상태 기록·비밀번호 전달·보증금 정산까지 한 곳에서 관리한다.

### 핵심 가치 제안
- **앱 설치 없음**: 임차인에게 링크만 보내면 끝 — 마찰 0
- **분쟁 예방**: 입주 전/후 사진을 나란히 비교해 보증금 분쟁을 근거로 막음
- **자동 전달**: 현관 비밀번호, 안내사항, 반환 계좌를 링크에 담아 자동 전달

### 타깃 유저
- **1순위**: 단기임대·에어비앤비 운영 개인 임대인 (1~10채)
- **2순위**: 고시원·다가구 소규모 임대 사업자
- **공통 페인포인트**: 퇴실 사진 수거 번거로움, 카톡으로 비밀번호 전달하는 불편함, 보증금 분쟁

### 성장 전략
- 무료로 시작 → 임차인 제출 완료 시 후기 수집 → 랜딩 사회적 증거로 전환
- 공유 탭으로 임대인 바이럴 유도
- 채널 탭 "임대인클래스 콘텐츠" 섹션 → 운영 중인 임대인클래스 브랜드와 연계

### 비즈니스 퍼널 (Admin 탭에 구현됨)
가입 → 매물 등록 → 링크 발급 → 임차인 제출 → 계약 종료

---

## 앱 구조 (현재 상태)

### 기술 스택
- React 19 + Vite 8, 단일 파일 `src/App.jsx` (1482줄)
- 라우팅: React Router 없음. 자체 `push(view, ctx)` / `pop()` 스택 사용
- 데이터: 전부 `useState` in-memory (새로고침하면 날아감 — Supabase 미연결)
- 스타일: 100% inline style (CSS 파일 미사용)
- 배포: Vercel — https://ipteosil.vercel.app

### 화면 목록
| 화면 | 컴포넌트 | 진입 경로 |
|------|----------|-----------|
| 랜딩 | `LandingPage` | 비로그인 최초 방문 |
| 로그인/가입 | `AuthPage` | 랜딩 → "시작하기" |
| 홈 | `HomeTab` | 로그인 후 기본 탭 |
| 방 상세 | `PropDetailPage` | 홈 → 방 클릭 |
| 방 추가/수정 | `AddPropPage` | push("addProp") |
| 새 계약 | `NewContractPage` | push("newContract") |
| 계약 기록 | `RecordPage` | push("record") |
| 입실 폼 (임차인) | `CheckinForm` | `?token=...` URL |
| 퇴실 폼 (임차인) | `CheckoutForm` | `?token=...` URL |
| 채널 | `ChannelTab` | 하단 탭 |
| 공유 | `ShareTab` | 하단 탭 |
| 설정 | `SettingsTab` | 하단 탭 |
| 관리자 | `AdminTab` | 하단 탭 (isAdmin 전용) |

### 디자인 시스템 상수 (App.jsx 상단)
```js
C   // 색상: primary(#3366FF), success, warning, danger, gray 계열
R   // 둥근 반경: sm(10) md(12) lg(16) full(999)
F   // 폰트 크기: xs(11) sm(13) base(15) lg(17) xl(20) xxl(24)
```
새 UI를 만들 때 이 상수를 반드시 사용한다.

### 공용 컴포넌트 (App.jsx 상단)
`Page`, `NavBar`, `SCard`, `DataRow`, `PrimaryBtn`, `OutlineBtn`, `GhostBtn`,
`FixedBottom`, `Inp`, `Textarea`, `Toggle`, `ErrBox`, `InfoBanner`, `Empty`,
`StatCard`, `DatePicker`, `PhotoGrid`, `PhotoModal`, `StepBar`

새 컴포넌트를 만들기 전에 이 목록을 먼저 확인한다.

### 계약 상태 흐름
```
checkin_waiting → (임차인 입실 제출) → checkout_waiting
                → (임차인 퇴실 제출) → checkout_done
                → (임대인 마무리)    → ended
```

---

## 완료된 작업

### ✅ 브라우저 뒤로가기 버그 (2026-06-22)
- `push()` → `history.pushState()` 동시 호출로 브라우저 히스토리 동기화
- `pop()` → `history.back()` 으로 변경, `popstate` 이벤트로 스택 감소
- 앱 진입 시 센티널 푸시 + 항상 재푸시 → 루트에서 실수로 앱 밖으로 나가는 것 방지
- 루트 화면에서 첫 뒤로가기 → "한 번 더 누르면 앱이 종료돼요" 토스트
- 2초 안에 두 번째 뒤로가기 → `window.close()` (카카오 인앱브라우저 WebView 닫힘)
- 관련 커밋: `b26e14f`, `ef7a2ec`

---

## 남은 작업 (우선순위 순)

### 1. Supabase DB 연결 (다음 작업)
- **현재**: 모든 상태가 `useState` in-memory — 새로고침하면 전부 초기화
- `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 필요
- Supabase 코드는 `src/lib/supabase.js`에 집중
- 테이블 설계 논의 후 진행
- **필요 테이블**: users, properties, contracts, channels, logs, reviews

### 2. PWA 설정
- `vite-plugin-pwa` 설치, `manifest.json` 한국어 앱 이름
- 홈 화면 추가 시 아이콘, 스플래시 스크린
- iOS Safari 지원 메타태그 확인

### 3. 소셜 로그인 실제 연동
- 현재 카카오/네이버 버튼은 UI만 있고 실제로 DEMO 계정으로 연결됨
- Supabase Auth로 카카오/네이버 OAuth 연동 필요

---

## UX 원칙

### 임대인 UX
- **액션 하나에 화면 하나**: 방 추가, 계약 시작, 링크 복사 — 각각 별도 흐름
- **진행 상태 항상 보임**: `StepBar`로 현재 계약이 어느 단계인지 즉시 인지
- **다가오는 만료 먼저**: 홈 탭 상단에 30일 이내 만료 계약 타임라인 표시
- **링크 복사 = 핵심 액션**: 메시지 + 링크 한 번에 복사되도록 구현됨

### 임차인 UX (입실/퇴실 폼)
- **앱 설치 불필요**: URL 파라미터(`?token=...`)로 직접 폼 진입
- **단계별 안내**: 무엇을 해야 하는지 텍스트로 명확히 안내
- **오류는 자동 스크롤**: 빠뜨린 필드로 부드럽게 스크롤 이동 (`scrollIntoView`)
- **한 번만 제출**: 이미 제출한 토큰 재접근 시 "이미 제출됐어요" 안내

### 모바일 우선 규칙
- 기준 너비: `max-width: 480px` (index.css의 `#root`)
- 터치 타겟 최소 44px (버튼 padding 기준)
- 하단 고정 주요 버튼: `FixedBottom` 컴포넌트 사용
- 바텀시트 패턴: `DatePicker`처럼 하단에서 올라오는 오버레이

---

## 코딩 규칙

### 핵심 원칙
- **기능 하나씩**: 한 번에 하나의 기능만 수정. 관련 없는 코드는 건드리지 않는다
- **설명은 한국어**: 모든 질문, 제안, 변경 설명을 한국어로 한다
- **기존 패턴 먼저**: 공용 컴포넌트와 디자인 상수(C, R, F)를 재사용한다

### 파일 구조 (현재 → 목표)
```
src/
  App.jsx          # 현재 모든 코드가 여기 (1482줄)
  main.jsx
  index.css
  lib/
    supabase.js    # Supabase 클라이언트 (연결 후 생성)
  components/      # 공용 컴포넌트 분리 시 여기로
  pages/           # 페이지 컴포넌트 분리 시 여기로
```
지금은 App.jsx 단일 파일 유지. 분리는 Supabase 연결 이후에 논의.

### 데이터 변경 방법
- `updateDb(s => ({...s, ...}))` — 클로저 안전, 비동기 배치 처리
- `upDb({key: value})` — 최상위 키만 바꿀 때 단순 패치
- `useState` 직접 조작 금지 — 반드시 위 두 함수 경유

### 인증·권한
- `user.isAdmin === true` 이면 Admin 탭 표시
- 데모 계정: `DEMO = { id:"demo", email:"demo@test.com", pw:"1234", isAdmin:true }`
- 임차인(토큰 사용자)은 계정 없이 접근 — `linkToken` 상태로 처리

### 환경변수 (.env.local, git 제외)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 검사
```
