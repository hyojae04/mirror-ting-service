import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startAutomaticAnswer } from './automaticAnswer.js';

function setup() {
  const instances = [], answers = [], text = [], errors = [];
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.started = true; }
    stop() { this.stopped = true; this.onend?.(); }
    abort() { this.aborted = true; }
    result(value) { this.onresult?.({results: [[{transcript: value}]]}); }
  }
  const dispose = startAutomaticAnswer({ Recognition, onText: value => text.push(value),
    onAnswer: value => answers.push(value), onListening: () => {}, onError: value => errors.push(value), pauseMs: 10 });
  return { instances, answers, text, errors, dispose };
}
const wait = () => new Promise(resolve => setTimeout(resolve, 30));
test('submits the complete latest transcript once after speech pauses', async () => {
  const run = setup(), speech = run.instances[0];
  speech.result('일정'); speech.result('일정을 조정하고 싶습니다.');
  assert.deepEqual(run.answers, []);
  await wait();
  assert.deepEqual(run.answers, ['일정을 조정하고 싶습니다.']);
  speech.onend?.();
  assert.equal(run.answers.length, 1);
  run.dispose();
});
test('silence never advances a turn', async () => {
  const run = setup();
  run.instances[0].onend();
  await wait();
  assert.deepEqual(run.answers, []);
  run.dispose();
});
test('submits without waiting for a browser stop/onend event and ignores late callbacks', async () => {
  const run = setup(), speech = run.instances[0];
  speech.stop = () => {};
  const lateEnd = speech.onend;
  speech.result('네 오늘 중으로 공유하겠습니다');
  await wait();
  assert.deepEqual(run.answers, ['네 오늘 중으로 공유하겠습니다']);
  assert.equal(speech.aborted, true);
  assert.equal(speech.onresult, null);
  lateEnd();
  assert.equal(run.answers.length, 1);
  run.dispose();
});
test('cleanup cancels pending answers and aborts the microphone recognizer', async () => {
  const run = setup();
  run.instances[0].result('보내지 않을 답변');
  run.dispose(); await wait();
  assert.deepEqual(run.answers, []);
  assert.equal(run.instances[0].aborted, true);
});
test('permission errors stop listening without advancing', () => {
  const run = setup();
  run.instances[0].onerror({error: 'not-allowed'});
  run.instances[0].onend();
  assert.equal(run.errors.length, 1);
  assert.deepEqual(run.answers, []);
  run.dispose();
});

test('arbitrary recognized words advance the prepared scenario through all three turns', async () => {
  const { workplaceDemoRequest, workplaceDemoReplies } = await import('./workplaceDemo.js');
  const messages = [];
  for (const [index, utterance] of ['네', '바나나 테스트 hello', '오늘은 날씨가 좋아요'].entries()) {
    const run = setup();
    run.instances[0].result(utterance);
    await wait();
    assert.deepEqual(run.answers, [utterance]);
    messages.push({role: 'user', content: run.answers[0]});
    const result = await workplaceDemoRequest('reply', {messages});
    assert.equal(result.answered_turns, index + 1);
    assert.equal(result.done, index === 2);
    assert.equal(result.message, workplaceDemoReplies[index + 1] || '');
    run.dispose();
  }
});
