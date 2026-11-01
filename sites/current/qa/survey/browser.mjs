import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from '/Users/yanghyojae/Documents/Expo Design/_workspace/mirror-ting-service/mvp/node_modules/playwright/index.mjs';
const base=process.env.MIRROR_TING_QA_URL || 'http://127.0.0.1:5192/';
const output='/private/tmp/mirror-survey-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const records=[];
try{for(const width of [1440,1024,768,720,390,320]){
 const context=await browser.newContext({viewport:{width,height:width===720?450:900},deviceScaleFactor:width===720?2:1,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];let calls=0,fail=false;page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/scenario-design',async route=>{
  calls++;await new Promise(r=>setTimeout(r,350));
  if(fail)return route.fulfill({status:503,json:{detail:'시나리오를 만들지 못했어요. 답변은 그대로 있으니 다시 시도해주세요.'}});
  const body=route.request().postDataJSON();assert.equal(body.consent,true);assert.equal(body.draft.turns,10);
  return route.fulfill({json:{ready:true,draft:body.draft,scenario:{title:'팀장과 배포 일정 조율',scene:'결제 오류 수정이 추가되어 금요일 배포가 어려워졌어요. 다음 주 화요일 배포를 제안하는 장면이에요.',counterpart:'가상 인물인 개발팀장. 일정 변경의 이유를 꼼꼼히 확인해요.'}}});
 });
 await page.goto(base);const frame=page.frameLocator('iframe[title="Mirror-Ting 원본"]');await frame.locator('.home-page').waitFor();assert.equal(await frame.locator('textarea').count(),0);
 await frame.getByRole('button',{name:'연습해보기'}).first().click();await frame.getByRole('heading',{name:'어떤 대화를 준비할까요?'}).waitFor();
 assert.equal(await frame.locator('[role=log],.simulation-context').count(),0);assert.equal(calls,0);
 const checkLayout=async stage=>{
  const geometry=await frame.locator('.survey-main').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(geometry.overflow,false);assert(Math.abs(geometry.left-(geometry.viewport-geometry.right))<2);
  await page.screenshot({path:`${output}/${width}-${stage}.png`,fullPage:true});
  if(width===1440){const source=await readFile('node_modules/axe-core/axe.min.js','utf8');const violations=await frame.locator('body').evaluate(async(_,src)=>{if(!window.axe){const s=document.createElement('script');s.textContent=src;document.head.append(s);}const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));},source);assert.deepEqual(violations,[],`${stage} accessibility`);}
 };
 await checkLayout('situation');
 await frame.getByRole('button',{name:'다음',exact:true}).click();await frame.locator('[aria-invalid=true]').first().waitFor();assert.equal(calls,0);
 await frame.getByRole('radio',{name:/^직장 대화/}).locator('..').click();await frame.getByRole('combobox',{name:'연습하고 싶은 상황',exact:true}).selectOption('업무 일정·우선순위 조율');await frame.getByRole('button',{name:'다음',exact:true}).click();
 await frame.locator('input[name=job_role]').fill('프론트엔드 개발자');await frame.locator('textarea[name=context]').fill('ㅈ까');await frame.getByRole('radio',{name:'상대와 합의점 찾기',exact:true}).locator('..').click();await frame.getByRole('button',{name:'다음',exact:true}).click();await frame.locator('[aria-invalid=true]').first().waitFor();assert.equal(calls,0);
 await frame.locator('textarea[name=context]').fill('결제 오류 수정이 추가되어 금요일 배포가 어려워졌어요. 다음 주 화요일로 일정을 조율하려고 해요.');await checkLayout('context');await frame.getByRole('button',{name:'다음',exact:true}).click();
 await frame.getByRole('radio',{name:'팀장·상사',exact:true}).locator('..').click();await frame.getByRole('radio',{name:/^심화/}).locator('..').click();await frame.getByRole('radio',{name:/^10턴/}).locator('..').click();await checkLayout('preferences');await frame.getByRole('button',{name:'다음',exact:true}).click();
 assert.equal(calls,0);assert.equal(await frame.getByRole('button',{name:'시나리오 만들기',exact:true}).isDisabled(),false);await frame.getByRole('button',{name:'시나리오 만들기',exact:true}).click();assert.equal(await frame.getByRole('checkbox').getAttribute('aria-invalid'),'true');assert(await frame.getByRole('checkbox').evaluate(e=>e===document.activeElement));assert.equal(calls,0);
 await frame.getByRole('button',{name:'내 상황과 목표 수정',exact:true}).click();assert.equal(await frame.locator('input[name=job_role]').inputValue(),'프론트엔드 개발자');await frame.getByRole('button',{name:'다음',exact:true}).click();assert(await frame.getByRole('radio',{name:/^10턴/}).isChecked());await frame.getByRole('button',{name:'다음',exact:true}).click();
 await frame.getByRole('checkbox').check();await checkLayout('review');
 if(width===1440){fail=true;await frame.getByRole('button',{name:'시나리오 만들기',exact:true}).click();await frame.getByRole('alert').waitFor();assert(await frame.getByText('프론트엔드 개발자',{exact:true}).isVisible());fail=false;}
 const countBefore=calls;await frame.getByRole('button',{name:'시나리오 만들기',exact:true}).click();assert(await frame.getByRole('button',{name:'시나리오 만들기',exact:true}).isDisabled());await frame.getByRole('heading',{name:'시나리오가 준비됐어요.'}).waitFor();assert.equal(calls,countBefore+1);await checkLayout('result');
 await frame.getByRole('button',{name:'답변 수정하기',exact:true}).click();assert(await frame.getByText('프론트엔드 개발자',{exact:true}).isVisible());assert.equal(await frame.locator('.survey-result').count(),0);
 assert.deepEqual(errors,[]);records.push({width,centered:true,apiOnlyOnSubmit:true,answerPreserved:true,overflow:false,runtimeErrors:errors});await context.close();
}await writeFile(`${output}/results.json`,JSON.stringify(records,null,2));console.log(JSON.stringify({status:'PASS',viewports:records.length,statesPerViewport:5,axeStates:5,records}));}finally{await browser.close();}
