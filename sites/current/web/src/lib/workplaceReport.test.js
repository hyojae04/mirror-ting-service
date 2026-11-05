import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkplaceReport } from './workplaceReport.js';
import { recordedMessages } from '../../../qa/simulation-chat/results/recorded-messages.js';
test('recorded answers produce 80 points and specific missing schedule details',()=>{
 const r=buildWorkplaceReport(recordedMessages);
 assert.equal(r.total,80); assert.equal(r.matched,8);
 assert.deepEqual(r.flow.map(p=>p.rate),[100,50,100]);
 assert.deepEqual(r.gaps.map(p=>p.label),['조정할 업무 명시','구체적인 마감 제안']);
 assert.equal(r.words.find(w=>w.word==='업무').count,3);
 assert.equal(r.fillers.reduce((n,w)=>n+w.count,0),0);
});
test('assistant text is excluded from vocabulary and filler counts',()=>{
 const r=buildWorkplaceReport([{role:'assistant',content:'업무 업무 음 어 그'},{role:'user',content:'음 보고서를 오늘 공유합니다'}]);
 assert.equal(r.words.some(w=>w.word==='업무'),false);
 assert.equal(r.words.find(w=>w.word==='보고서').count,1);
 assert.equal(r.words.some(w=>w.word==='보고'),false);
 assert.equal(r.fillers.find(w=>w.word==='음').count,1);
});
test('empty answers have no invented vocabulary or satisfied checks',()=>{
 const r=buildWorkplaceReport([]);assert.equal(r.total,0);assert.equal(r.matched,0);assert.deepEqual(r.words,[]);
});
