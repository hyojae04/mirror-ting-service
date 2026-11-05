import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreWorkplaceConversation } from './workplaceScore.js';
import { workplaceDemoAnswers, workplaceDemoReplies, workplaceDemoRequest } from './workplaceDemo.js';

test('the prepared three-turn conversation ends with a complete content score', async () => {
  const messages = [];
  for (let turn = 0; turn < 3; turn++) {
    const reply = await workplaceDemoRequest('reply', { messages });
    assert.equal(reply.done, false);
    assert.equal(reply.message, workplaceDemoReplies[turn]);
    messages.push({ role: 'assistant', content: reply.message }, { role: 'user', content: workplaceDemoAnswers[turn] });
  }
  assert.equal((await workplaceDemoRequest('reply', { messages })).done, true);
  const result = scoreWorkplaceConversation(messages);
  assert.equal(result.total, 100);
  assert.deepEqual(result.turns.map(turn => turn.score), [30, 40, 30]);
});
test('unrelated answers still end the scenario but do not receive an invented score', async () => {
  const messages = workplaceDemoReplies.flatMap(content => [{ role: 'assistant', content }, { role: 'user', content: '네 알겠습니다' }]);
  assert.equal((await workplaceDemoRequest('reply', { messages })).done, true);
  assert.equal(scoreWorkplaceConversation(messages).total, 0);
});
test('missing or partial answers only receive credit for matched criteria', () => {
  assert.equal(scoreWorkplaceConversation([]).total, 0);
  const result = scoreWorkplaceConversation([{role:'user',content:'긴급 업무 때문에 마감이 어렵습니다.'}]);
  assert.equal(result.total, 30);
  assert.equal(result.turns[2].score, 0);
});
