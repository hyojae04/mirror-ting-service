import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.MIRROR_TING_BROWSER_MODULE || 'playwright');
const base=process.env.MIRROR_TING_QA_URL || 'http://127.0.0.1:5192/';
const output=process.env.MIRROR_TING_QA_OUTPUT || '/private/tmp/mirror-ui-qa';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const fullDraft={job_role:'프론트엔드 개발자',situation:'금요일 배포 일정 조정',context:'결제 오류 수정이 추가되어 배포 일정 조율이 필요한 상황',goal:'다음 주 화요일 배포 합의',turns:5,target:'팀장',difficulty:'basic',personality:'꼼꼼하고 현실적인 상대',persona:'개발팀을 이끄는 팀장',additional_notes:'',additional_notes_confirmed:false};
const records=[];
const axes=[];
try{
 for(const [width,height] of [[1440,900],[1024,768],[768,900],[720,450],[390,844],[320,568],[320,900]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width===720?2:1,reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let state='question',calls=0,captures=0;
  await context.exposeBinding('qaCapture',()=>captures++);await context.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{window.qaCapture();throw Error('capture forbidden in design-only QA');};});
  await page.route('**/api/simulation-chat/prepare',async route=>{
   calls++;
   if(state==='loading')await new Promise(r=>setTimeout(r,1200));
   if(state==='error')return route.fulfill({status:503,json:{detail:'AI 답변을 받지 못했어요. 입력한 내용을 유지했으니 다시 시도해주세요.'}});
   const ready=state==='ready',optional=state==='optional';
   return route.fulfill({json:{message:ready?'설계를 마쳤어요.':'직무와 상황을 확인했어요. 구체적으로 있었던 일을 알려주세요.',draft:ready?{...fullDraft,additional_notes_confirmed:true}:optional?fullDraft:{...fullDraft,context:''},question:ready?null:optional?{field:'additional_notes',title:'추가로 반영할 내용이 있나요?',choices:['추가 사항 없어요','추가 사항을 직접 적을게요']}:{field:'context',title:'현재 일정과 업무 상황을 조금 더 구체적으로 설명해주시겠어요?',choices:['결제 오류 수정이 추가되어 금요일 배포가 어려워졌어요. 다음 주 화요일로 조율하려고 해요.','테스트 과정에서 예상하지 못한 문제가 발견되어 팀장님과 우선순위를 다시 정하려고 해요.']},ready}});
  });
  await page.goto(base);const frame=page.frameLocator('iframe[title="Mirror-Ting 원본"]');await frame.locator('.home-page').waitFor();
  await frame.locator('.brand-mark img').first().evaluate(img=>img.decode());
  const homeInput=frame.getByLabel('연습하고 싶은 상황',{exact:true}).first();
  assert(await homeInput.evaluate(e=>e.labels?.[0]&&getComputedStyle(e.labels[0]).position!=='absolute'));
  await homeInput.focus();assert(await homeInput.evaluate(e=>{const s=getComputedStyle(e.closest('form'));return s.outlineStyle==='solid'&&parseFloat(s.outlineWidth)>=2;}));
  const homeOverflow=await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(homeOverflow,false);
  await page.screenshot({path:`${output}/home-${width}.png`});
  if(width===1440){
   const mode=frame.getByRole('combobox',{name:'연습 종류',exact:true}).first();await mode.press('Home');await mode.press('Enter');assert.match(await mode.innerText(),/면접/);
   await page.keyboard.press('Tab');
   await frame.getByRole('button',{name:'로그인',exact:true}).click();await frame.getByRole('status').filter({hasText:'아직 구현되지 않았어요'}).waitFor();await page.keyboard.press('Escape');
  }
  await homeInput.fill('팀장님과 배포 일정을 조율하고 싶어요.');await homeInput.press('Enter');
  await frame.getByRole('heading',{name:'현재 일정과 업무 상황을 조금 더 구체적으로 설명해주시겠어요?'}).waitFor();
  assert.equal(await frame.locator('input:not([type=hidden]),textarea').count(),1,'one answer field');
  const input=frame.getByLabel('준비 도우미에게 답하기',{exact:true});
  assert.equal(await frame.locator('.simulation-chat-input-area .simulation-question-card').count(),0,'questions belong to transcript');
  assert.equal(await frame.locator('.simulation-chat-transcript .simulation-question-card').count(),1);
  const text=await frame.locator('.simulation-message p').first().evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),weight:parseInt(getComputedStyle(e).fontWeight)}));assert(text.size>=16&&text.weight>=400);
  await frame.getByRole('button',{name:/결제 오류 수정이 추가되어/}).click();assert.equal(await input.inputValue(),'결제 오류 수정이 추가되어 금요일 배포가 어려워졌어요. 다음 주 화요일로 조율하려고 해요.');
  assert(await input.evaluate(e=>e===document.activeElement));
  const focus=await input.evaluate(e=>{const s=getComputedStyle(e.closest('form'));return {style:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor};});assert.equal(focus.style,'solid');assert(parseFloat(focus.width)>=2);
  if(width===1440){const source=await readFile(new URL('../../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');const result=await frame.locator('body').evaluate(async(_,src)=>{const script=document.createElement('script');script.textContent=src;document.head.append(script);return await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});},source);axes.push({state:'question-with-settings-and-selection',violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});}
  await input.press('Shift+Enter');assert.equal(calls,1);for(const extra of [{isComposing:true},{keyCode:229},{repeat:true}]){await input.dispatchEvent('keydown',{key:'Enter',...extra});assert.equal(calls,1);}
  await page.screenshot({path:`${output}/chat-${width}-${height}.png`});
  await input.fill('ㅈ까');await input.press('Enter');await frame.getByRole('alert').waitFor();assert.equal(calls,1);
  await input.fill('작성 중인 답변');state='loading';const sending=frame.getByRole('button',{name:'입력한 답변 보내기',exact:true}).click();await input.waitFor();await page.waitForTimeout(80);assert(await input.isDisabled());await sending;
  await input.waitFor({state:'visible'});await page.waitForTimeout(1300);assert.equal(await input.isDisabled(),false);
  state='error';await input.fill('오류가 나도 유지할 내용');await input.press('Enter');await frame.getByRole('alert').filter({hasText:'다시 시도'}).waitFor();assert.equal(await input.inputValue(),'오류가 나도 유지할 내용');
  const toggle=frame.locator('.editor-context-toggle');
  if(await toggle.getAttribute('aria-expanded')==='true')await toggle.click();
  await toggle.click();const panel=frame.getByRole('dialog',{name:'연습 설정',exact:true});await panel.waitFor();
  if(width<=800){
   assert.equal(await panel.getAttribute('aria-modal'),'true');
   for(let i=0;i<7;i++){await page.keyboard.press('Tab');assert(await panel.evaluate(e=>e.contains(document.activeElement)||document.activeElement===document.body),'focus never enters covered controls');}
   await input.focus();assert.equal(await input.evaluate(e=>e===document.activeElement),false,'native modal makes the composer inert');
   await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});assert(await toggle.evaluate(e=>e===document.activeElement));
  }else await panel.getByRole('button',{name:'설정 닫기',exact:true}).click();
  state='optional';await input.fill('업무 상황을 모두 설명했어요');await input.press('Enter');await frame.getByRole('button',{name:'추가 사항 없이 완료하기',exact:true}).waitFor();state='ready';await frame.getByRole('button',{name:'추가 사항 없이 완료하기',exact:true}).click();await frame.getByRole('heading',{name:'시나리오 설계를 마쳤어요'}).waitFor();
  assert(await frame.getByRole('button',{name:'설정 변경사항 보내기',exact:true}).isDisabled(),'ready revision requires an actual edit');
  const complete=frame.getByRole('button',{name:'설계 체험 마치고 돌아가기',exact:true});await complete.scrollIntoViewIfNeeded();assert(await complete.isVisible());
  const geometry=await frame.locator('body').evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,viewport:innerHeight,inputBottom:document.querySelector('.simulation-chat-input-area').getBoundingClientRect().bottom}));assert.equal(geometry.overflow,false);assert(geometry.inputBottom<=geometry.viewport+1);
  if(width<=800)assert(parseFloat(await input.evaluate(e=>getComputedStyle(e).fontSize))>=16);
  if(width===1440){
   const axeSource=await readFile(new URL('../../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
   const result=await frame.locator('body').evaluate(async(_,source)=>{const script=document.createElement('script');script.textContent=source;document.head.append(script);return await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});},axeSource);
   axes.push({state:'ready',violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
  }
  await page.screenshot({path:`${output}/ready-${width}.png`});assert.equal(captures,0);assert.deepEqual(errors,[]);
  records.push({width,height,oneAnswerField:true,focus,geometry,captures,runtimeErrors:errors});
  await context.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify({records,axe:axes},null,2));console.log(JSON.stringify({viewports:records.length,checks:'PASS',axe:axes}));
}finally{await browser.close();}
