> 현재 공개 체험은 네 단계 설문과 `/api/scenario-design`을 통한 시나리오 생성까지 제공해요. 실제 대화 시뮬레이션과 4-Fit 분석은 실행하지 않아요. 아래 이전 채팅형 API 설명과 구분해주세요.
> 문구 기준과 이번 변경 기록: [UX 라이팅 기준](docs/ux-writing-review.md)

# Mirror-Ting current original — design-only Sites deployment

Frontend source is retained from `hyojae04/mirror-ting-service` at the commit in `web/provenance.json`. The existing home, scroll story, navigation and scenario designer are preserved. This is not the superseded A/B prototype.

Deployment-only changes stop at scenario design completion. No session creation, simulation replies, recording, camera permission or microphone permission is exposed. The existing Python preparation contract and system prompt are ported to the Sites server, retaining gpt-4o, JSON responses, 1800 output tokens and a 15-second timeout. Additional question correction uses at most one extra request, matching the original.

`OPENAI_API_KEY` is a Sites runtime secret. The original development backend calls the same setting `MIRROR_TING_OPENAI_API_KEY`. Never add either value to source or browser configuration.

Build with the Sites build helper. `web/build.mjs` builds the retained React app into the server's public assets, then Vinext builds the server. The root presents that same-origin original app full-screen. Only the preparation endpoint is implemented by the server.

Checks: `node --test tests/design.test.mjs`; `node node_modules/typescript/bin/tsc --noEmit`. Chrome QA covers the original current home, preparation, profanity rejection, Enter, design-only completion, mobile overflow and zero media capture requests. Live hosted preparation is checked separately after publication.
