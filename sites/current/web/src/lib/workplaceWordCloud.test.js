import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutWorkplaceWords } from './workplaceWordCloud.js';
import { buildWorkplaceReport } from './workplaceReport.js';
import { recordedMessages } from '../../../qa/simulation-chat/results/recorded-messages.js';
test('recorded vocabulary is frequency sized, within bounds and does not overlap',()=>{
 const words=buildWorkplaceReport(recordedMessages).words;
 const layout=layoutWorkplaceWords(words);
 assert.equal(layout.length,words.length);
 assert.ok(layout[0].size>layout.at(-1).size);
 for(const [i,item] of layout.entries()){
  assert.ok(item.box.left>=12 && item.box.right<=788 && item.box.top>=12 && item.box.bottom<=308);
  for(const other of layout.slice(i+1)) assert.ok(item.box.right<=other.box.left || item.box.left>=other.box.right || item.box.bottom<=other.box.top || item.box.top>=other.box.bottom);
 }
 assert.deepEqual(layoutWorkplaceWords(words),layout);
});
test('empty vocabulary does not invent words',()=>assert.deepEqual(layoutWorkplaceWords([]),[]));
