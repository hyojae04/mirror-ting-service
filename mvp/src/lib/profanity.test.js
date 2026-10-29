import assert from 'node:assert/strict';
import test from 'node:test';
import { containsProfanity } from './profanity.js';

test('blocks Korean profanity, abbreviations and separator evasion', () => {
  for (const text of ['ㅈ까', 'ㅈ 까', 'ㅅㅂ', '씨발', '시.발', '병\u200b신', '개새끼', '꺼져', 'ＦＵＣＫ', 'f u c k']) {
    assert.equal(containsProfanity(text), true, text);
  }
});

test('allows ordinary workplace speech without treating disagreement as profanity', () => {
  for (const text of ['팀장님 제가 몸이 아파서 먼저 가봐야 할 것 같아요', '네 알겠어요', '니가뭔데', '개발 일정과 시발점을 확인했어요', '시발역에서 출근합니다']) {
    assert.equal(containsProfanity(text), false, text);
  }
});
