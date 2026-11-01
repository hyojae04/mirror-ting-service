import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['lib/survey-design.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'node22'});
const {generateSurveyDesign}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const draft={job_role:'개발자',situation:'업무 일정 조율',context:'결제 오류 수정이 추가되어 금요일 배포가 어려움. 다음 주 화요일로 조율하려고 함.',goal:'다음 주 화요일 배포 합의',target:'팀장',personality:'꼼꼼하게 근거를 묻는 상대',difficulty:'pressure',turns:5,additional_notes:'일정 변경 근거를 설명하기'};
const request={service_mode:'workplace',draft,consent:true};
const scenario={title:'팀장과 배포 일정 조율',scene:'추가된 수정 업무를 설명하고 일정 조정을 제안한다.',counterpart:'가상 인물인 개발팀장. 구체적인 근거를 확인한다.'};
const reply=data=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(data)}}]}));
test('한 번의 호출, temperature 0.4, 설문 값 보존, 추가 질문 없이 완료',async()=>{
 const calls=[];const out=await generateSurveyDesign(request,'test-key',async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return reply({...scenario,turns:20,goal:'AI가 임의 변경'});});
 assert.equal(calls.length,1);assert.equal(calls[0].body.temperature,.4);assert.match(calls[0].body.messages[0].content,/질문하거나 추가 답변을 요구하지 않는다/);
 assert.equal(out.ready,true);assert.equal(out.draft.turns,5);assert.equal(out.draft.goal,draft.goal);assert.equal(out.draft.additional_notes,draft.additional_notes);assert.equal(out.draft.additional_notes_confirmed,true);assert.equal(out.question,undefined);
});
test('동의 누락·필수 답변 누락·비속어는 외부 호출 전에 거부',async()=>{
 let calls=0;const call=async()=>{calls++;return reply(scenario);};
 for(const body of [{...request,consent:false},{...request,draft:{...draft,job_role:''}},{...request,draft:{...draft,context:'ㅈ까'}}])await assert.rejects(generateSurveyDesign(body,'test-key',call),e=>e.status===422);
 assert.equal(calls,0);
});
test('오류·잘린 응답·비정상 JSON 처리',async()=>{
 await assert.rejects(generateSurveyDesign(request,undefined),e=>e.status===503);
 await assert.rejects(generateSurveyDesign(request,'test-key',async()=>new Response('',{status:500})),e=>e.status===503);
 await assert.rejects(generateSurveyDesign(request,'test-key',async()=>reply({title:'제목만 있음'})),e=>e.status===502);
 await assert.rejects(generateSurveyDesign(request,'test-key',async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'{}'}}]}))),e=>e.status===503);
});
