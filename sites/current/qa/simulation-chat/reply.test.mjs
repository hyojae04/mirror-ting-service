import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled=await build({entryPoints:['lib/simulation-reply.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'node22'});
const {simulationReply}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const draft={job_role:'개발자',situation:'일정 조율',context:'업무 증가',goal:'일정 합의',turns:1,target:'팀장',difficulty:'basic',personality:'차분함',persona:'개발팀장',additional_notes_confirmed:true};
const input={prompt:'일정을 조율하고 싶어요',draft,service_mode:'workplace',messages:[],consent:true};
test('시작과 마지막 답변에서 턴과 종료 상태를 반환',async()=>{
 const call=async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'일정을 이야기해 봅시다.'}}]});
 assert.deepEqual(await simulationReply(input,'test',call),{message:'일정을 이야기해 봅시다.',answered_turns:0,done:false});
 assert.deepEqual(await simulationReply({...input,messages:[{role:'assistant',content:'안녕하세요'},{role:'user',content:'일정 조율을 원해요'}]},'test',call),{message:'일정을 이야기해 봅시다.',answered_turns:1,done:true});
});
test('동의 누락과 대화 순서 오류는 외부 호출 없이 거부',async()=>{
 let calls=0;const call=async()=>{calls++;};
 for(const body of [{...input,consent:false},{...input,messages:[{role:'user',content:'안녕하세요'}]},{...input,draft:{...draft,job_role:''}}]) await assert.rejects(simulationReply(body,'test',call),e=>e.status===422);
 assert.equal(calls,0);
});
test('키 누락과 응답 오류를 안내',async()=>{
 await assert.rejects(simulationReply(input,undefined),e=>e.status===503);
 await assert.rejects(simulationReply(input,'test',async()=>new Response('',{status:500})),e=>e.status===503);
});
