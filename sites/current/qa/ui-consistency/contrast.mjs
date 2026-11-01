import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const {chromium}=await import(process.env.MIRROR_TING_BROWSER_MODULE||'playwright');
const {APCAcontrast,sRGBtoY}=await import(process.env.MIRROR_TING_APCA_MODULE||'apca-w3');
const base=process.env.MIRROR_TING_QA_URL||'http://127.0.0.1:5192/';
const output=process.env.MIRROR_TING_QA_OUTPUT||'/private/tmp/mirror-ui-qa';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const luminance=a=>a.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(fg,bg)=>{const l=[luminance(fg),luminance(bg)].sort((a,b)=>b-a);return(l[0]+.05)/(l[1]+.05);};
const rows=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.goto(base);const frame=page.frameLocator('iframe[title="Mirror-Ting 원본"]');await frame.locator('.home-page').waitFor();
 async function measure(selector,role='body',index=0){
  const el=frame.locator(selector).nth(index);if(!await el.count())return;
  await el.scrollIntoViewIfNeeded();
  const data=await el.evaluate(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();let opacity=1;for(let p=e;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);return{text:e.textContent.trim().slice(0,80),color:c.color,size:parseFloat(c.fontSize),weight:c.fontWeight,opacity,rect:{x:r.x,y:r.y,width:r.width,height:r.height},oldColor:e.style.getPropertyValue('color'),oldPriority:e.style.getPropertyPriority('color')};});
  if(data.rect.height<1||data.opacity!==1)return;
  await el.evaluate(e=>e.style.setProperty('color','transparent','important'));
  const clip={x:Math.max(0,Math.ceil(data.rect.x)),y:Math.max(0,Math.ceil(data.rect.y)),width:Math.max(1,Math.min(Math.floor(data.rect.width)-2,1438)),height:Math.max(1,Math.min(Math.floor(data.rect.height)-2,998))};
  const screenshot=await page.screenshot({clip});await el.evaluate((e,d)=>{if(d.oldColor)e.style.setProperty('color',d.oldColor,d.oldPriority);else e.style.removeProperty('color');},data);
  const image=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const fg=data.color.match(/[\d.]+/g).map(Number);const alpha=fg[3]??1;
  let minRatio=Infinity,minAPCA=Infinity,worst;
  for(let i=0;i<image.data.length;i+=image.info.channels){const bg=[image.data[i],image.data[i+1],image.data[i+2]],blend=fg.slice(0,3).map((v,k)=>v*alpha+bg[k]*(1-alpha));const value=ratio(blend,bg),lc=Math.abs(APCAcontrast(sRGBtoY(blend),sRGBtoY(bg)));if(value<minRatio){minRatio=value;worst=bg;}minAPCA=Math.min(minAPCA,lc);}
  rows.push({selector,index,role,text:data.text,color:data.color,size:data.size,weight:data.weight,worstBackground:worst,wcagMinimum:minRatio,apcaMinimum:minAPCA});
 }
 await measure('.prompt-home-description');await measure('.hero-typing-word','large');
 for(let i=0;i<await frame.locator('.intro-story-copy p').count();i++)await measure('.intro-story-copy p','body',i);
 await measure('.mode-footer-cta--prompt > div > p');
 for(const selector of ['.fit-scroll-copy p','.section-intro > p','.home-fit-overview__item p','.workplace-scenario-card p','.dialogue-version > p','.coaching-card p','.home-site-footer__project p']){for(let i=0;i<await frame.locator(selector).count();i++)await measure(selector,'body',i);}
 await page.route('**/api/simulation-chat/prepare',r=>r.fulfill({json:{message:'상황을 확인했어요. 구체적으로 어떤 일이 있었는지 알려주세요.',draft:{turns:5},question:{field:'job_role',title:'어떤 직무를 준비하고 있나요?',choices:['개발자','마케팅']},ready:false}}));
 await frame.getByLabel('연습하고 싶은 상황',{exact:true}).first().fill('면접 연습');await frame.getByRole('button',{name:'입력한 상황으로 연습 준비하기',exact:true}).first().click();await frame.getByRole('heading',{name:'어떤 직무를 준비하고 있나요?'}).waitFor();
 await measure('.simulation-message--assistant p');await measure('.simulation-question-card h2','label');await measure('.simulation-question-card-top','label');await measure('.simulation-chat-toolbar > span','label');await measure('.editor-context-persona p','label');
 await writeFile(`${output}/contrast.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
}finally{await browser.close();}
