# 설문·사용 방법 인터페이스 리뷰 · 2026-10-31

## Scope and coverage

검토 범위는 현재 대화형 Sites의 **설문 네 단계 → 생성 중/오류/완료 → 답변 수정**, **사용 방법 목록 → 검색·분류·빈 결과 → 상세 가이드 5개 → 설문 시작**, 신규 **설문 A/B 비교 화면**이다. 홈·FAQ·요금제 및 공통 CSS는 디자인 시스템과 용어의 비교 기준으로 확인했다. FAQ의 시작 안내 한 항목도 설문과 일치하도록 수정했다. 나머지 페이지의 기능 전체, 기존 3열 사이트, 개발 원본 체크아웃, 실제 시뮬레이션은 검토·변경 범위 밖이다.

React 19 / Vite 기반 원본 UI, 일반 CSS, hex 시맨틱 토큰, reicon-react, 기존 Framer Motion을 유지한다. Sites는 Vinext와 같은 출처 iframe으로 제공한다. README와 `web/src/styles/design-system-runtime.css`, `lovable-layout.css`의 기존 규칙을 확인했다. 별도 CONTRIBUTING/CODING_STANDARDS/CLAUDE/디자인 문서는 찾지 못했다. 사용자가 제공한 AGENTS.md와 개인 설정을 적용했다.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Native radio·label·오류 연결·필수값·동의·키보드·포커스·페이지 이탈 확인·axe·forced colors | 오류 연결 및 이탈 보호 수정. 검사 상태의 자동 위반 0 |
| Layout | 중앙 760px 설문, 도움말 목록/상세/빈 결과, 비교 iframe, 320–1440px, 확대 상당 reflow, 긴 문구·RTL smoke | 비교 화면 좁은 너비 넘침 수정, 검사 상태 넘침 0 |
| Writing | 가이드 5개 전체·추천 링크·빈 결과·설문 동작 이름·FAQ 시작 안내 | 이전 채팅 설명을 현재 설문/설계 체험 범위로 교체 |
| Typography | 실제 H1/H2 크기, 본문·캡션·입력·줄바꿈 | 공통 제목 스케일과 본문 16px/400, 모바일 단계 라벨 12px 적용 |
| Colors | 실제 렌더링 단색 배경의 13쌍, 이전 공개 도움말의 본문 | WCAG 최소 4.6967:1, 본문 APCA 최소 86.9149 |
| UI | reicon 크기/색상/선택 체크, 표면·컨트롤 반경, hover/focus/disabled/loading, 0.1배 속도·reduced motion | 기존 라이브러리·시맨틱 토큰 유지. 요청한 아이콘 안내와 A/B 구현 |

## Findings

수정 전은 공개 버전과 첫 로컬 검증 결과이며, 위치는 수정 후 소스 기준이다. 아래 문제는 모두 수정했다.

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Writing | `web/src/pages/UsagePage.jsx:10`, `web/src/pages/FaqPage.jsx:3` | AI 질문에 답하기·오른쪽 미리보기·실제 대화 시작을 안내했지만 공개 버전은 설문 설계까지만 제공 | 설문 4단계·최종 동의·단일 생성·설계 체험 한계를 안내. 도움말의 시작 버튼도 설문으로 직접 연결 | 실제로 없는 화면과 기능으로 사용자를 안내함 |
| HIGH | Accessibility | `web/src/pages/ScenarioSurveyPage.jsx:75` | 입력 후 홈으로 나가면 답변을 경고 없이 버림 | 작성 중 홈 이동에는 native 확인, 새로고침/이탈에는 beforeunload 보호. 취소 시 선택 유지 확인 | 실수로 페이지를 떠나 작성한 내용을 잃을 위험 |
| HIGH | Layout | `web/src/styles/survey-comparison.css:28` | 비교 화면 초기 구현에서 320px 부모 안의 iframe 너비가 278px, 문서 최소 너비는 320px라 가로 넘침 | 좁은 화면에서 미리보기 콘텐츠만 부모 너비로 확장, 조작 버튼·본문은 인셋 유지 | 새 비교 화면에서 내용을 잘라 보이게 함. 수정 후 A/B 모두 넘침 0 |
| MEDIUM | Accessibility | `web/src/pages/ScenarioSurveyPage.jsx:41`, `web/src/pages/ScenarioSurveyPage.jsx:53`, `web/src/pages/ScenarioSurveyPage.jsx:85` | 선택 오류는 폼 하단에만 표시. 실패 항목 포커스/aria-invalid/설명 연결 없음. 동의 전 제출 불가로 이유를 안내받기 어려움 | 필드 옆 오류, aria-invalid/describedby, 첫 오류로 포커스, 제출 시 동의 안내. 수정하면 오류 상태 해제 | 오류 위치와 해결 경로를 명확히 알리기 |
| MEDIUM | Typography | `web/src/styles/design-system-runtime.css:39`, `web/src/styles/usage-guide.css:3`, `web/src/styles/scenario-survey.css:94` | 가이드는 별도 클론의 48/36px 제목·27px 소제목, 설문은 36/26px 제목. 작은 화면 단계 설명은 11px | 공통 H1 28–36px, 상세 H2 22px, 본문 16px/400, 모바일 단계 라벨 12px. 역할별 여백·줄바꿈 보정 | 같은 제품의 기능 화면 사이에서 제목·본문 위계가 달랐음 |
| MEDIUM | Colors | `web/src/styles/usage-guide.css:5`, `web/src/styles/usage-guide.css:27` | 읽는 본문에 캡션용 `#707070` 재사용. 실제 공개 화면 흰 배경에서 APCA Lc 74.3097 | 본문 역할 `--color-text-secondary` 사용. 측정한 본문 최저 Lc 86.9149 | WCAG 위반은 아니지만 본문 권장 읽기 기준 Lc 75 미만. 배경·브랜드 팔레트는 유지 |

## 요청한 설문 디자인 비교

- **A · 아이콘 중심 (서비스 기본)**: 기존 reicon-react의 면접/대화/일정/경험/직접 입력/난이도 아이콘을 실제 SVG로 표시한다. 모든 선택지에 텍스트를 남기고 장식 아이콘은 접근성 트리에서 제외한다. 선택 상태는 색상과 체크를 함께 사용한다.
- **B · 생성 시안 기반 (비교용)**: 이미지의 큰 아이콘 타일·세로 카드·단계 표시를 반응형 코드로 구현했다. 질문, 데이터, 키보드 동작은 A와 동일하다. 이미지 속 부정확한 선택 문구는 실제 질문으로 맞췄다.
- 비교 페이지 `/compare/survey`에서 A/B/생성 이미지를 전환하고 차이를 표로 볼 수 있다. 미리보기는 AI를 호출하지 않는다. B를 자동으로 서비스 기본으로 바꾸지 않았다.
- 디자인 관점에서는 반복 설정·빠른 읽기에는 A, 처음 방문해 선택지를 구분하기에는 B를 제안한다. 실제 사용자 A/B 테스트의 성과를 측정했다는 뜻은 아니다.
- 원본 생성 시안: `web/public/design/survey-visual-reference.png`. built-in image_gen으로 생성했으며 API 키는 사용하지 않았다. 생성 프롬프트는 [image-prompt.txt](image-prompt.txt)에 기록했다. 시안을 배경 이미지로 붙이지 않고 실제 라디오·텍스트·SVG·레이아웃으로 구현했다.

## Verification

### Passed

- `node qa/survey/browser.mjs`: 1440/1024/768/720/390/320px × 5상태. 720×450 DPR 2는 1440×900에서 200% 확대에 상당하는 CSS reflow 조건이다. 단일 최종 호출, 입력 보존, 수정, 로딩, 오류 재시도, 비속어 차단, 동의 검증, 가로 넘침 0, 런타임 오류 0. 질문·선택/경험·연습방식·검토·완료의 5상태에서 axe 위반 0.
- `node qa/better-survey-help/help.mjs`: 같은 6개 너비/높이 조건의 목록·빈 결과·상세 3상태, 검색/분류/초기화/설문 이동 통과. 1440·320px에서 해당 3상태의 axe 위반 0. 가이드 5개의 내용과 링크도 확인했다. H1/H2 실제 크기: 1440px 36/22px, 320px 28/22px.
- `node qa/better-survey-help/compare.mjs`: 1440/320px의 A/B 선택 카드와 원본 이미지 로드 통과, 질문 데이터 동일, axe 위반 0, 실제 AI 호출 0, 가로 넘침 0.
- `node qa/better-survey-help/keyboard.mjs`: Tab·방향키·Space·Enter로 설문 선택/이동, 오류 시 포커스, 입력 수정 후 오류 제거, 가이드 링크, 320px에서 길어진 문구와 RTL 방향의 넘침 smoke 통과. 의미가 맞는 다른 언어 번역을 검증한 것은 아니다.
- `node qa/better-survey-help/contrast.mjs`: 실제 조상 표면색을 확인한 단색 배경 13쌍. WCAG 최소 4.696661:1(4.5 기준), 본문 APCA 최소 86.914934(Lc 75 기준), 라벨 최소 72.447528(Lc 60 기준). 공식 apca-w3 계산 사용. 이미지/그라데이션을 가정한 측정이 아니다.
- `node qa/better-survey-help/states.mjs`: native 이탈 확인 취소 후 선택 유지, forced-colors의 2px 포커스, CDP Animation 0.1배 속도에서 누름 scale .96, reduced-motion 시 전환 0.000001초 확인.
- 타입 검사 `npx tsc --noEmit` 통과. Sites 전체 빌드 검증. 기존 대형 청크 경고는 이번 검토에서 번들 구조를 바꾸지 않아 유지된다.

브라우저 스크립트는 호스트의 기존 Playwright를 사용한다. 대비 검증은 `/private/tmp/mirror-ui-tools`의 apca-w3가 필요하다. 새 런타임 의존성은 추가하지 않았다.

### Not verified

- 실제 VoiceOver/NVDA, Safari/Firefox, 물리 iOS 키보드, OS 고대비, 브라우저 메뉴에서 실제 zoom 200%, 실제 번역/RTL 언어의 의미.
- 브라우저 뒤로가기 등 모든 히스토리 경로의 이탈 보호. 확인한 보호 범위는 화면의 홈 버튼과 beforeunload다.
- 실제 사용자 대상 A/B 전환율·완료율 측정. 비교표는 설계 가설이며 성과 증거가 아니다.
- 제품 전체 페이지의 완전한 접근성 인증, 실제 시뮬레이션·계정·결제·분석 기능. 공개 설계 체험 범위를 유지한다.

### Evidence


[설문 결과](evidence/survey-results.json) · [도움말 결과](evidence/help-results.json) · [대비 측정](evidence/contrast.json) · [수정 전 기준](evidence/baseline.json)

## Verdict

검토한 두 주요 흐름과 비교 화면에서 남은 HIGH 없음. 위 Not verified 범위로 판정을 확대하지 않는다.

**Approve**

비교·검증용 캡처 이미지는 사용자 요청으로 삭제했어요. 텍스트 검증 기록은 유지해요.
