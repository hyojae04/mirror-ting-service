# 현재 대화형 사이트 UI QA · 2026-10-30

## 범위와 커버리지

공개된 **현재 대화형 사이트의 홈(상황 입력·면접/회식/미팅 이야기·4-Fit 소개·푸터) → AI 설계 질문 → 추가 사항 확인 → 설계 완료** 흐름을 검토하고 수정했다. 로그인/회원가입의 준비 중 알림, 설정 패널의 열림/닫힘, 빈 입력·로딩·오류·선택 상태도 포함했다. **기존 3컬럼 사이트는 변경하지 않았다.** 실제 시뮬레이션·계정·요금제·결과 기록 페이지는 이번 검토 범위 밖이다.

React 19 / Vite, 기존 Radix·shadcn 구성, Framer Motion, reicon-react, 일반 CSS와 hex 기반 시맨틱 토큰을 유지했다. Sites 서버는 Vinext이며 원본 React 화면을 같은 출처의 프레임으로 제공한다. 배포 README와 `web/src/styles/design-system-runtime.css`의 토큰을 확인했다. 별도 CONTRIBUTING·CODING_STANDARDS·CLAUDE·UI 디자인 가이드는 찾지 못했고, 사용자가 제공한 AGENTS 지침과 개인 설정을 적용했다.

배포본의 공통 UI 수정은 개발 원본 `../mirror-ting-service/mvp/src`에도 반영했다. 개발 원본의 장치 확인·실제 시뮬레이션 기능은 유지했다. 배포본은 기존처럼 설계 완료에서 끝난다.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | 홈/대화 입력의 포커스·라벨, 키보드 선택, 모바일 설정 패널, Escape·포커스 복원, axe 질문/완료 상태, 동작 줄이기 | 확인된 포커스·대비 문제 수정; 검사한 두 상태의 axe 위반 0 |
| Layout | 1440·1024·768·720·390·320px, 낮은 높이, 질문·입력 정렬, 일반 스크롤 18단계 | 중복 입력 제거, 공통 정렬선 적용, 잘림 0 |
| Writing | 입력 라벨·placeholder·전송/완료 동작·오류 복구 안내 | 질문 중 수정용 문구가 나오던 조건 보정, 빈 변경 전송 차단 |
| Typography | 실제 렌더링 크기·두께, 제목 위계, 숫자 폭, 모바일 입력 | 본문/캡션/입력 크기 통일, 4-Fit 제목 역전 수정 |
| Colors | 렌더링 배경 픽셀 18쌍, 선택·설정 상태의 단색 조합, 그라데이션·어두운 소개 영역 | 본문 APCA 최저 76.84, 검사한 작은 일반 글자 WCAG 최저 4.55:1 |
| UI | 입력·카드 반경, 액션 색상, 버튼 크기, 선택/비활성/로딩/알림 상태 | 공통 액션·반경·크기 토큰 사용; 기존 사진과 스크롤 구성 유지 |

## 확인한 문제와 적용한 수정

기준 화면은 수정 전 공개 버전이며, 파일 위치는 수정 후 소스다. 각 행은 하나의 근본 원인이다.

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Accessibility | `web/src/styles/simulation-editor.css:105`, `web/src/styles/prompt-home.css:104` | 직접 입력칸과 textarea의 outline을 제거하고 대체 표시가 없었음 | 실제 입력기를 둘러싼 form에 2px focus-within 테두리, 버튼 focus-visible, 강제 색상 모드 지원 | 키보드로 현재 입력 위치를 확인할 수 없었음 |
| HIGH | Accessibility | `web/src/pages/SimulationChatPage.jsx:124` | 모바일의 aside+scrim이 화면을 가렸지만 Tab이 뒤의 예시 버튼으로 이동했음 | 모바일은 네이티브 dialog.showModal(), 배경 비활성화, Escape 및 트리거 포커스 복원; 데스크톱은 비모달 패널 | 포인터와 키보드의 접근 가능 영역이 달랐음 |
| HIGH | Colors | `web/src/styles/simulation-editor.css:15`, `web/src/styles/prompt-home.css:95`, `web/src/styles/design-system-runtime.css:34` | 선택 글자/설정 캡션의 `#0071e3` 조합은 4.31–4.40:1, 선택 메뉴는 4.496:1로 작은 글자의 4.5:1 미만 | 인터랙티브 선택 글자는 역할 토큰을 통해 `#0066cc`, 읽기 전용 캡션은 중립색; 대표 선택 조합 5.21:1 | 배경용 액센트를 작은 글자에도 사용한 역할 혼용 |
| MEDIUM | Layout | `web/src/pages/SimulationChatPage.jsx:168`, `web/src/styles/simulation-editor.css:96` | 같은 state에 연결된 input과 textarea, 전송 버튼 두 개가 하단에 쌓였음; 질문과 입력의 시작선도 달랐음 | 답변 textarea 하나로 통합하고 질문·예시는 스크롤되는 대화 영역으로 이동; 24px/16px 정렬선 공유 | 좁은 화면에서 대화 공간을 빼앗고 답변 위치를 혼동시켰음 |
| MEDIUM | Writing | `web/src/pages/HomePage.jsx:88`, `web/src/pages/SimulationChatPage.jsx:182` | 입력 라벨이 시각적으로 숨겨져 있었고, 질문이 남아 있는데 설정 수정용 placeholder가 나올 수 있었음 | 지속적으로 보이는 라벨, 질문/수정 상태에 맞는 placeholder와 설명 연결 | 입력 후에도 필드의 목적이 유지되어야 함 |
| MEDIUM | Writing | `web/src/pages/SimulationChatPage.jsx:184` | 설계 완료 후 빈 수정 전송이 가능하고 완료·수정 버튼이 모두 강조됨 | 실제 변경 내용이 있을 때만 수정 전송, 완료는 기본 강조·수정은 보조 액션 | 동작을 이름과 상태에 맞추고 완료 흐름의 우선순위를 명확히 함 |
| MEDIUM | Typography | `web/src/styles/simulation-editor.css:96`, `web/src/styles/home-motion.css:19`, `web/src/styles/service-introduction.css:6` | 대화 14px/350, 캡션 11px, 푸터 보조 라벨 9px, 설명 350 두께가 혼재 | 대화·입력 16px/400, 캡션 12px, 설명 400; 공통 글꼴·역할 크기와 tabular-nums 사용 | 작은 글자의 얇은 획과 불규칙한 위계가 가독성을 해쳤음 |
| MEDIUM | Typography | `web/src/styles/lovable-layout.css:11` | 320px에서 상위 h2 27px보다 하위 h3 28px이 컸고 공통 CSS가 컴포넌트 값을 덮었음 | 실제 적용 지점에서 모바일 h3 24px, h2 27px; 데스크톱 40px/52px 유지 | 제목 단계가 시각적으로 역전됨 |
| MEDIUM | Colors | `web/src/styles/intro-scroll-story.css:3`, `web/src/styles/prompt-home.css:109`, `web/src/styles/service-introduction.css:6` | 설명에 캡션 색을 재사용; 측정 본문 APCA 최저 67.00, 밝은 설명 영역 일부 75 미만 | 기존 팔레트의 역할 토큰으로 설명을 구분하고 어두운 영역의 파란 중립색 명도를 보정; 최저 76.84 | WCAG 합격 여부와 별개로 요청한 읽기 대비 개선 기준을 충족하도록 수정 |
| LOW | UI | `web/src/styles/design-system-runtime.css:34`, `web/src/styles/simulation-editor.css:100`, `web/src/styles/prompt-home.css:35` | 전송 버튼 34/36px, 다른 액션 색상, 카드·입력기 반경/간격이 혼재 | 데스크톱 40px/작은 화면 44px, 액션 단색/글자 역할 분리, 입력기 24px 반경과 질문의 16px inset | 같은 작업을 하는 요소가 서로 다른 계층처럼 보였음 |

## 검증

### 통과

- `check.mjs`: 1440×900, 1024×768, 768×900, 720×450(DPR 2), 390×844, 320×568, 320×900의 7조건. 720×450/DPR 2는 1440×900 디스플레이에서 200% 확대에 해당하는 CSS reflow 조건이다.
- 홈 입력 라벨·포커스, 키보드 모드 선택, 단일 답변, 예시 선택→입력 포커스, Shift+Enter/한글 IME/키 반복, 비속어의 네트워크 전송 차단, 로딩 잠금, 오류 시 입력 보존·재시도, 추가 사항 건너뛰기, 완료 후 빈 수정 차단을 확인했다.
- 모바일 설정창에서 가려진 입력기를 프로그램적으로도 포커스할 수 없으며 Escape 후 설정 버튼으로 돌아온다. 네이티브 Tab 동작은 브라우저 chrome으로의 이동을 허용하되 가려진 페이지의 컨트롤로 이동하지 않는다.
- 질문+설정+선택 상태 및 완료 상태의 axe WCAG 2 A/AA·2.1 AA 검사: 두 상태 모두 위반 0. 브라우저 런타임 오류 0, 장치 캡처 요청 0.
- `home-stages.mjs`: 일반 동작 모드에서 1440px/320px의 이야기 4단계+4-Fit 5단계, 총 18단계. 텍스트·CTA 잘림 0. 제목 크기는 각각 h2/h3 52/40px, 27/24px.
- 알림을 CDP Animation 재생 속도 0.1에서 확인했다. reduced-motion에서는 타이핑 문구가 바뀌지 않고 이야기 패널의 이동 transform이 없다. 기존 알림의 자동 종료는 사용자의 이전 요청을 유지했다.
- `contrast.mjs`: 글자를 일시적으로 숨겨 실제 배경 픽셀을 추출한 18쌍. 본문 APCA 최저 76.84(Lc 75 기준), 작은 일반 글자 WCAG 최저 4.55:1(4.5 기준), 큰 파란 제목 최저 3.85:1(3 기준). APCA는 [공식 apca-w3 구현](https://github.com/Myndex/apca-w3)으로 계산했다. 밝은 본문·어두운 소개·그라데이션을 각각 측정했다. 선택 상태는 별도로 단색 배경과 실제 CSS를 확인하고 axe로 재검증했다.
- 개발 원본의 `node --test --test-concurrency=1 src/lib/guestChat.browser.test.js src/lib/authNotice.browser.test.js`: 3개 통과. 기존 실제 시뮬레이션 진입 동작도 해당 회귀 검사 범위에서 유지된다.
- Sites 빌드와 개발 원본 `npm run build` 통과. 기존 큰 청크 경고는 남아 있으며 이번 작업에서 번들 구조를 바꾸지 않았다. 타입 검사 통과.

로컬 재현 예시(별도 API 키 불필요, AI 응답은 테스트용으로 대체):

```sh
MIRROR_TING_BROWSER_MODULE='/Users/yanghyojae/Documents/Expo Design/_workspace/mirror-ting-service/mvp/node_modules/playwright/index.mjs' node qa/ui-consistency/check.mjs
MIRROR_TING_BROWSER_MODULE='/Users/yanghyojae/Documents/Expo Design/_workspace/mirror-ting-service/mvp/node_modules/playwright/index.mjs' node qa/ui-consistency/home-stages.mjs
```

`contrast.mjs`는 별도 설치한 `apca-w3`의 모듈 경로를 `MIRROR_TING_APCA_MODULE`로 받는다. 출력은 `/private/tmp/mirror-ui-qa`이며 대표 증거는 아래에 보관했다.

### Not verified

- 실제 VoiceOver/NVDA 읽기, Safari/Firefox, 물리 iOS 키보드, 브라우저 메뉴의 실제 200% zoom, RTL/다른 언어, OS별 폰트 실물 선택.
- dark theme은 제품에 없으므로 새 테마를 만들지 않았다. 기존 어두운 소개 영역은 검증했다.
- 실제 시뮬레이션·계정·결제·저장/기록 기능 및 성능 점수는 이번 검토 범위 밖이다. 이번 결과는 전체 서비스의 접근성 인증을 뜻하지 않는다.

## 증거와 참고

- [흐름·접근성 결과](evidence/results.json), [수정 전 대비](evidence/contrast-before.json), [수정 후 대비](evidence/contrast-after.json), [동작 검증](evidence/motion.json), [스크롤 단계](evidence/home-stages.json)
- [Lazyweb 참고 리포트](https://www.lazyweb.com/report/lazyweb/343dc22e-4b55-430e-a382-0a7e2a88f9b1/?source=create). 참고용이며 실제 수정 판단은 위의 코드·브라우저 측정 증거를 기준으로 했다.

## 판정

검토·검증한 범위에서 남은 HIGH 없음. 위의 Not verified 범위에는 판정을 확장하지 않는다.

**Approve**

비교·검증용 캡처 이미지는 사용자 요청으로 삭제했어요. 텍스트 검증 기록은 유지해요.
