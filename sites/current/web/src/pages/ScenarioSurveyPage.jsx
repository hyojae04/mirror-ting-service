import { useEffect, useRef, useState } from 'react';
import { Briefcase } from 'reicon-react/icons/Briefcase';
import { Messages2 } from 'reicon-react/icons/Messages2';
import { User } from 'reicon-react/icons/User';
import { Pen2 } from 'reicon-react/icons/Pen2';
import { CheckList } from 'reicon-react/icons/CheckList';
import { CheckCircle } from 'reicon-react/icons/CheckCircle';
import { Chart } from 'reicon-react/icons/Chart';
import { Flash2 } from 'reicon-react/icons/Flash2';
import { Clock } from 'reicon-react/icons/Clock';
import { Heart } from 'reicon-react/icons/Heart';
import { Search } from 'reicon-react/icons/Search';
import { InfoCircle } from 'reicon-react/icons/InfoCircle';
import { Check } from 'reicon-react/icons/Check';
import { containsProfanity, PROFANITY_MESSAGE } from '../lib/profanity';
import { resolveApiBase } from '../lib/pocApi';
import '../styles/scenario-survey.css';

const modes = [{value:'interview', label:'면접', description:'자기소개부터 예상하지 못한 질문까지 준비해요.'}, {value:'workplace', label:'직장 대화', description:'회의, 회식, 어려운 부탁을 내 말로 연습해요.'}];
const situations = {
  interview: ['자기소개와 지원 동기', '프로젝트·업무 경험 설명', '예상 밖 질문에 답하기'],
  workplace: ['업무 일정·우선순위 조율', '회의에서 의견 전달', '첫 회식·동료와 대화'],
};
const goals = {interview:['내 경험을 명확히 설명하기', '질문에 차분하게 답하기', '강점과 지원 이유 전달하기'], workplace:['상대와 합의점 찾기', '내 의견을 명확히 전달하기', '부담스러운 부탁 거절하기']};
const stepNames = ['연습 상황', '내 상황과 목표', '연습 방식', '최종 확인'];
const labels = {job_role:'직무·직종', situation:'연습 상황', context:'구체적인 상황', goal:'연습 목표', target:'대화 상대', personality:'상대의 태도', difficulty:'난이도', turns:'연습 턴 수', additional_notes:'추가 사항'};
const difficultyLabels = {basic:'기본', pressure:'심화', ultra_pressure:'압박'};

const choiceIcons = {
  'service-mode':[Briefcase,Messages2],
  'goal-choice':[CheckList,Messages2,CheckCircle,Pen2],
  'target-choice':[Briefcase,User,User,Messages2],
  personality:[Heart,Search,Messages2], difficulty:[CheckCircle,Chart,Flash2], turns:[Clock,Clock],
};
function ChoiceGroup({legend, name, field = name, options, value, onChange, cards = false, error = ''}) {
  return <fieldset data-field={field} className={`survey-choice-group ${cards ? 'survey-card-group' : ''}`} aria-describedby={error ? `survey-error-${field}` : undefined} aria-invalid={error ? true : undefined}><legend>{legend}</legend><div className={cards ? 'survey-cards' : 'survey-segments'}>{options.map((option,index) => {
    const item = typeof option === 'string' ? {value:option,label:option} : option;
    const Icon = choiceIcons[name]?.[index] || CheckList;
    return <label key={item.value} className={`survey-choice ${value === item.value ? 'is-selected' : ''}`}>
      <input type="radio" name={name} value={item.value} checked={value === item.value} required aria-invalid={error ? true : undefined} aria-describedby={error ? `survey-error-${field}` : undefined} onChange={() => onChange(item.value)} />
      <span className="survey-choice-icon" aria-hidden="true"><Icon size={cards ? 24 : 20}/></span>
      <span className="survey-choice-copy"><strong>{item.label}</strong>{item.description && <span>{item.description}</span>}</span>
      <span className="survey-choice-check" aria-hidden="true">{value === item.value && <Check size={12}/>}</span>
    </label>;
  })}</div>{error && <p id={`survey-error-${field}`} className="survey-field-error">{error}</p>}</fieldset>;
}
function SurveyField({field, label, hint, value, onChange, error = '', multiline = false, maxLength, placeholder, optional = false, autoComplete}) {
  const id = `survey-${field}`;
  const props = {id, name:field, value, required:!optional, maxLength, placeholder, autoComplete, onChange:event=>onChange(event.target.value), 'aria-invalid':error ? true : undefined, 'aria-describedby':[hint && `${id}-hint`,error && `survey-error-${field}`].filter(Boolean).join(' ') || undefined};
  return <div className="survey-field" data-field={field}><label htmlFor={id}>{label}</label>{hint && <p id={`${id}-hint`} className="survey-field-hint">{hint}</p>}{multiline ? <textarea {...props} rows={optional?2:4}/> : <input {...props}/>}{multiline && <span className="survey-counter">{value.length} / {maxLength.toLocaleString('en-US')}</span>}{error && <p id={`survey-error-${field}`} className="survey-field-error">{error}</p>}</div>;
}

export function ScenarioSurveyPage({prompt = '', serviceMode = 'interview', initialTurns = 5, onBack, variant = 'visual', preview = false, onUnsavedChange}) {
  const [mode, setMode] = useState(serviceMode);
  const [answers, setAnswers] = useState({job_role:'', situation:'', context:prompt, goal:'', target:'', personality:'차분하고 협력적인 상대', difficulty:'basic', turns:initialTurns, additional_notes:''});
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const form = useRef(null);
  const [result, setResult] = useState(null);
  const heading = useRef(null);
  const inFlight = useRef(false);
  const controller = useRef(null);
  const update = (key, value) => {setAnswers(old => ({...old, [key]:value}));setError('');setErrorField('');};
  useEffect(() => {document.title = `${result ? '시나리오 완성' : '시나리오 설계'} · Mirror-Ting`;}, [result]);
  useEffect(() => {heading.current?.focus({preventScroll:true});window.scrollTo(0,0);}, [step, Boolean(result)]);
  useEffect(() => () => controller.current?.abort(), []);
  const dirty = ['job_role','situation','context','goal','target','additional_notes'].some(key=>Boolean(answers[key]));
  useEffect(()=>{onUnsavedChange?.(dirty && !result);},[dirty,Boolean(result),onUnsavedChange]);
  useEffect(()=>{
    if(!dirty || preview)return;
    const warn = event => {event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty,preview]);
  const leaveSurvey = () => {if(!preview && dirty && !result && !window.confirm('홈으로 돌아가면 작성한 답변이 사라져요. 돌아갈까요?'))return;onBack();};
  const changeMode = value => {if(value === mode)return;setMode(value);setAnswers(old => ({...old, situation:'', goal:'', target:''}));setError('');setErrorField('');};
  useEffect(() => {if(errorField){const control=form.current?.querySelector(`#survey-${errorField}`) || form.current?.querySelector(`[data-field="${errorField}"] :is(input,select)`);control?.focus();}}, [errorField,error,step]);
  const fieldError = key => errorField === key ? error : '';
  const showValidation = problem => {setErrorField(problem.field);setError(problem.message);};
  const validate = () => {
    const keys = step === 0 ? ['situation'] : step === 1 ? ['job_role','context','goal'] : step === 2 ? ['target','personality','difficulty','turns','additional_notes'] : Object.keys(labels);
    for (const key of keys) {
      if (key !== 'additional_notes' && (!String(answers[key] ?? '').trim() || answers[key] === '직접 정할게요')) return {field:key,message:`${labels[key]}을 입력하거나 선택해주세요.`};
      if (typeof answers[key] === 'string' && containsProfanity(answers[key])) return {field:key,message:PROFANITY_MESSAGE};
    }
    return null;
  };
  const generate = async () => {
    if(inFlight.current)return;
    const validation = validate();
    if(validation){showValidation(validation);return;}
    if(!consent){showValidation({field:'consent',message:'답변 전송에 동의한 뒤 시나리오 만들기를 선택해주세요.'});return;}
    if(preview){setError('디자인 비교 화면에서는 AI를 호출하지 않아요. 실제 생성은 서비스 화면에서 진행해주세요.');setErrorField('');return;}
    inFlight.current = true;setBusy(true);setError('');setErrorField('');controller.current = new AbortController();
    try {
      const base = resolveApiBase(globalThis.__MIRROR_TING_API_BASE__ || import.meta.env?.VITE_API_URL);
      const response = await fetch(`${base}/scenario-design`, {method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.current.signal, body:JSON.stringify({service_mode:mode, draft:{...answers, context_source:answers.context}, consent})});
      const data = await response.json().catch(() => null);
      if(!response.ok)throw new Error(typeof data?.detail === 'string' ? data.detail : '시나리오를 만들지 못했어요. 다시 시도해주세요.');
      if(!data?.ready || !data.scenario?.title || !data.scenario?.scene || !data.scenario?.counterpart)throw new Error('시나리오를 확인하지 못했어요. 다시 시도해주세요.');
      setResult(data);
    } catch(failure) {if(failure.name !== 'AbortError')setError(failure instanceof TypeError ? '시나리오를 만들지 못했어요. 답변은 그대로 있으니 다시 시도해주세요.' : failure.message);}
    finally {inFlight.current=false;setBusy(false);}
  };
  const next = event => {
    event.preventDefault();if(busy)return;
    const validation=validate();if(validation){showValidation(validation);return;}
    if(step===3){generate();return;}
    setError('');setErrorField('');setStep(step+1);
  };
  const display = key => key === 'difficulty' ? difficultyLabels[answers[key]] : key === 'turns' ? `${answers[key]}턴` : answers[key];
  const titles = ['어떤 대화를 준비할까요?', '지금 어떤 상황인가요?', '어떤 상대와 연습할까요?', '이렇게 연습을 준비할게요.'];
  const descriptions = ['연습할 대화와 상황을 골라주세요.', '내 이야기와 원하는 결과를 알려주세요.', '상대의 태도와 대화의 깊이를 정해주세요.', '답변을 확인하면 AI가 나만의 시나리오를 만들어요.'];
  const situationError = situations[mode].includes(answers.situation) || !answers.situation ? fieldError("situation") : "";
  return <section className={`scenario-survey survey-variant-${variant}`} aria-labelledby="survey-title" data-step={result ? "result" : step} data-preview={preview || undefined}>
    {preview && <header className="survey-header"><button type="button" className="survey-home" onClick={leaveSurvey} aria-label="홈으로 돌아가기"><img src="/icons/mirror-ting-mark-slim.png" width="24" height="24" alt=""/><span>Mirror-Ting</span></button><span>시나리오 설계</span></header>}
    <div className="survey-main">
      {!result && <nav className="survey-progress" aria-label="설문 진행 단계"><ol>{stepNames.map((name,index)=><li key={name} aria-current={step===index?'step':undefined}><span aria-hidden="true">{index<step?'✓':index+1}</span><span>{name}</span></li>)}</ol><div className="survey-progress-track"><span style={{width:`${(step+1)*25}%`}}/></div></nav>}
      <div className="survey-heading"><span className="survey-eyebrow">{result ? '나만의 연습 준비 완료' : `${String(step+1).padStart(2,'0')} / 04`}</span><h1 ref={heading} tabIndex={-1} id="survey-title">{result ? '시나리오가 준비됐어요.' : titles[step]}</h1><p>{result ? '이번 체험은 시나리오 설계까지만 제공해요.' : descriptions[step]}</p></div>
      {result ? <section className="survey-result" aria-label="완성된 시나리오"><span className="survey-result-tag">{mode==='interview'?'면접':'직장 대화'} · {difficultyLabels[answers.difficulty]} · {answers.turns}턴</span><h2>{result.scenario.title}</h2><h3>연습할 장면</h3><p>{result.scenario.scene}</p><h3>가상의 대화 상대</h3><p>{result.scenario.counterpart}</p><h3>내가 이루고 싶은 목표</h3><p>{answers.goal}</p><div className="survey-result-actions"><button type="button" className="survey-secondary" onClick={()=>{setResult(null);setStep(3);}}>답변 수정하기</button><button type="button" className="survey-primary" onClick={onBack}>체험 마치기 </button></div></section> : <form ref={form} noValidate onSubmit={next} className="survey-form" aria-busy={busy}>
        <fieldset disabled={busy} className="survey-fields">
        {step===0 && <>
          <ChoiceGroup legend="연습 종류" name="service-mode" options={modes} value={mode} onChange={changeMode} cards/>
          <div className="survey-field" data-field="situation">
            <label htmlFor="survey-situation-choice">연습하고 싶은 상황</label>
            <select id="survey-situation-choice" name="situation-choice" required value={situations[mode].includes(answers.situation)?answers.situation:answers.situation?'직접 정할게요':''} aria-invalid={situationError ? true : undefined} aria-describedby={situationError ? 'survey-error-situation' : undefined} onChange={event=>update('situation',event.target.value)}>
              <option value="" disabled>연습할 상황을 선택해주세요.</option>
              {situations[mode].map(situation=><option key={situation} value={situation}>{situation}</option>)}
              <option value="직접 정할게요">직접 정할게요</option>
            </select>
            {situationError && <p id="survey-error-situation" className="survey-field-error">{situationError}</p>}
          </div>
          {(!situations[mode].includes(answers.situation) && answers.situation) && <SurveyField field="situation" label="나만의 연습 상황" maxLength={1000} value={answers.situation==='직접 정할게요'?'':answers.situation} error={fieldError('situation')} onChange={value=>update('situation',value || '직접 정할게요')} placeholder="예: 상사에게 휴가 일정을 조율하는 대화"/>}
          <p className="survey-hint-row"><InfoCircle size={16} aria-hidden="true"/>구체적인 이야기는 다음 단계에서 적어요.</p>
        </>}
        {step===1 && <>
          <SurveyField field="job_role" label={mode==='interview'?'지원하는 직무':'내 직무·직종'} maxLength={300} autoComplete="organization-title" value={answers.job_role} error={fieldError('job_role')} onChange={value=>update('job_role',value)} placeholder="예: 프론트엔드 개발자, 마케팅 담당자"/>
          <SurveyField field="context" label={mode==='interview'?'연습에 담고 싶은 경험':'대화가 필요해진 이유'} hint={mode==='interview'?'어떤 일을 했고, 무엇을 설명하고 싶은지 적어주세요.':'어떤 일이 있었는지, 상대와 무엇을 이야기해야 하는지 적어주세요.'} multiline maxLength={2000} value={answers.context} error={fieldError('context')} onChange={value=>update('context',value)} placeholder={mode==='interview'?'예: 팀 프로젝트에서 결제 화면을 만들었어요. 오류를 해결한 과정을 설명하고 싶어요.':'예: 추가 업무로 금요일 마감이 어려워졌어요. 팀장님과 다음 주 화요일로 일정을 조율하려고 해요.'}/>
          <ChoiceGroup legend="대화에서 이루고 싶은 목표" name="goal-choice" field="goal" error={goals[mode].includes(answers.goal) || !answers.goal ? fieldError("goal") : ""} options={[...goals[mode],'직접 정할게요']} value={goals[mode].includes(answers.goal)?answers.goal:answers.goal?'직접 정할게요':''} onChange={value=>update('goal',value==='직접 정할게요'?'직접 정할게요':value)}/>
          {(!goals[mode].includes(answers.goal) && answers.goal) && <SurveyField field="goal" label="나만의 연습 목표" maxLength={500} value={answers.goal==='직접 정할게요'?'':answers.goal} error={fieldError('goal')} onChange={value=>update('goal',value || '직접 정할게요')} placeholder="대화 후 어떤 결과를 얻고 싶나요?"/>}
        </>}
        {step===2 && <>
          <ChoiceGroup legend="대화 상대" name="target-choice" field="target" error={fieldError("target")} options={mode==='interview'?['실무 면접관','인사 담당 면접관','임원 면접관']:['팀장·상사','동료','후배·신입','고객·거래처']} value={answers.target} onChange={value=>update('target',value)}/>
          <ChoiceGroup legend="상대의 태도" name="personality" error={fieldError("personality")} options={['차분하고 협력적인 상대','꼼꼼하게 근거를 묻는 상대','직설적으로 의견을 말하는 상대']} value={answers.personality} onChange={value=>update('personality',value)}/>
          <ChoiceGroup legend="연습 난이도" name="difficulty" error={fieldError("difficulty")} options={[{value:'basic',label:'기본',description:'친숙한 질문으로 차근차근'},{value:'pressure',label:'심화',description:'구체적인 이유와 근거까지'},{value:'ultra_pressure',label:'압박',description:'반론과 예상 밖 질문까지'}]} value={answers.difficulty} onChange={value=>update('difficulty',value)} cards/>
          <div className="survey-turns"><ChoiceGroup legend="연습 턴 수" name="turns" error={fieldError("turns")} options={[{value:5,label:'5턴',description:'짧게 핵심만 연습'},{value:10,label:'10턴',description:'충분히 대화를 이어가기'}]} value={answers.turns} onChange={value=>update('turns',value)}/><p className="survey-help">1턴은 내가 답변하는 한 번을 뜻해요.</p></div>
          <details className="survey-optional" open={errorField==='additional_notes' || undefined}><summary>추가로 반영할 내용 (선택)</summary><SurveyField field="additional_notes" label="추가 사항" optional multiline maxLength={2000} value={answers.additional_notes} error={fieldError('additional_notes')} onChange={value=>update('additional_notes',value)} placeholder="특별히 연습하고 싶은 부분이나 주의할 점이 있나요?"/></details>
        </>}
        {step===3 && <><section className="survey-review" aria-label="입력한 답변"><div className="survey-review-top"><strong>{mode==='interview'?'면접':'직장 대화'} 연습</strong><span>{answers.turns}턴</span></div><div className="survey-review-body">{[0,1,2].map(group=><div className="survey-review-group" key={group}><div className="survey-review-group-title"><h2>{stepNames[group]}</h2><button type="button" onClick={()=>{setStep(group);setError('');setErrorField('');}} aria-label={`${stepNames[group]} 수정`}>수정</button></div><dl>{(group===0?['situation']:group===1?['job_role','context','goal']:['target','personality','difficulty','turns',...(answers.additional_notes?['additional_notes']:[])]).map(key=><div className="survey-review-row" key={key}><dt>{labels[key]}</dt><dd>{display(key)}</dd></div>)}</dl></div>)}</div></section><label className="survey-consent"><input id="survey-consent" aria-invalid={errorField==='consent' || undefined} aria-describedby={errorField==='consent'?'survey-error-consent':undefined} type="checkbox" checked={consent} onChange={event=>{setConsent(event.target.checked);setError('');setErrorField('');}}/><span>입력한 답변을 시나리오 생성을 위해 OpenAI에 전송하는 데 동의해요.</span></label>{fieldError('consent') && <p id="survey-error-consent" className="survey-field-error">{error}</p>}<p className="survey-help">실명이나 회사의 민감한 정보는 적지 않아도 돼요. 실제 시뮬레이션은 시작하지 않아요.</p></>}
        </fieldset>
        {error && !errorField && <p className="survey-error" role="alert">{error}</p>}
        <p className="survey-loading" role="status">{busy?'답변을 바탕으로 연습 장면을 만들고 있어요…':''}</p>
        <footer className="survey-actions"><button type="button" className="survey-secondary" disabled={busy} onClick={()=>{if(step===0)leaveSurvey();else{setStep(step-1);setError('');setErrorField('');}}}>{step===0?'홈으로':'이전'}</button><button type="submit" className="survey-primary" disabled={busy}>{busy && <Clock size={18} aria-hidden="true"/>}{step===3?'시나리오 만들기':'다음'}</button></footer>
      </form>}
    </div>
  </section>;
}
