# Mirror-Ting current site and workplace recording flow

The retained React app supports scenario preparation and conversation simulation. Open `/original/index.html?recording=workplace` for the fixed three-turn workplace recording flow.

The recording flow uses three locally served Veo clips with Korean audio, generated from the same GPT Image reference. It checks camera and microphone permissions before starting, tracks the user locally, listens automatically after each clip ends, and advances after recognized speech pauses. Any non-empty recognized answer advances the recording scenario; silence does not. The third answer ends the session. Automatic speech recognition requires Chrome or Edge support and microphone permission.

Source media and the reference image are in `web/public/demo-workplace/`. Recognition transcripts stay in the recording conversation; the prepared scenario does not call the conversation API. Browser speech recognition may use the browser provider's recognition service. Camera frames are analyzed locally.

The normal conversation reply endpoint is `/api/simulation-chat/reply`. Server AI features require `OPENAI_API_KEY`; never commit credentials or local environment files.

Run `npm ci`, then `npm run dev` from this directory. Build with `npm run build`. Frontend-only build: `node web/build.mjs`. Checks: `node --test web/src/lib/automaticAnswer.test.js qa/simulation-chat/reply.test.mjs`.
