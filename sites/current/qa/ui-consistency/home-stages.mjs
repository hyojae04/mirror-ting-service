import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.MIRROR_TING_BROWSER_MODULE||'playwright');
const base=process.env.MIRROR_TING_QA_URL||'http://127.0.0.1:5192/';
const output=process.env.MIRROR_TING_QA_OUTPUT||'/private/tmp/mirror-ui-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const rows=[];
try{
 for(const [width,height] of [[1440,900],[320,568]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});await page.goto(base);const frame=page.frameLocator('iframe[title="Mirror-Ting 원본"]');await frame.locator('.home-page').waitFor();
  for(const [selector,count,stageSelector,panelSelector] of [['.intro-story-track',4,'.intro-story-stage','.intro-story-panel'],['.fit-scroll',5,'.fit-scroll-stage','.fit-scroll-panel']]){
   const geometry=await frame.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect(),stage=e.matches('.intro-story-track')?e.querySelector('.intro-story-stage'):e.firstElementChild;return{top:r.top+scrollY,height:r.height,stageHeight:stage.getBoundingClientRect().height,inset:parseFloat(getComputedStyle(stage).top)||0};});
   for(let i=0;i<count;i++){
    await frame.locator('body').evaluate((_,value)=>window.scrollTo(0,value),geometry.top-geometry.inset+(geometry.height-geometry.stageHeight)*(i+.5)/count);
    await page.waitForTimeout(800);
    const panel=frame.locator(`${panelSelector}.is-active`);assert.equal(await panel.count(),1);
    const result=await panel.evaluate((el,stageSelector)=>{const stage=document.querySelector(stageSelector).getBoundingClientRect();return [...el.querySelectorAll('h2,h3,p,button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent.slice(0,70),top:r.top,bottom:r.bottom,left:r.left,right:r.right,inside:r.top>=stage.top-1&&r.bottom<=stage.bottom+1&&r.left>=-1&&r.right<=innerWidth+1};});},stageSelector);
    rows.push({width,height,selector,index:i,content:result});
    await page.screenshot({path:`${output}/home-stage-${width}-${selector.includes('intro')?'story':'fit'}-${i}.png`});
    assert(result.every(r=>r.inside),JSON.stringify(rows.at(-1)));
   }
  }
  const sizes=await frame.locator('.fit-scroll').evaluate(e=>({h2:parseFloat(getComputedStyle(e.querySelector('h2')).fontSize),h3:parseFloat(getComputedStyle(e.querySelector('h3')).fontSize)}));console.log(JSON.stringify({width,sizes}));assert(sizes.h2>=sizes.h3,JSON.stringify({width,sizes}));
  await page.close();
 }
 await writeFile(`${output}/home-stages.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify({normalMotionStages:rows.length,clippedContent:rows.flatMap(r=>r.content).filter(r=>!r.inside).length}));
}finally{await browser.close();}
