import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'reicon-react/icons/ArrowUp';
import { ArrowLeft } from 'reicon-react/icons/ArrowLeft';
import { Pen2 } from 'reicon-react/icons/Pen2';
import { Microphone } from 'reicon-react/icons/Microphone';
import { Sidebar } from 'reicon-react/icons/Sidebar';
import { simulationChatRequest } from '../lib/simulationChatApi';
import { containsProfanity, PROFANITY_MESSAGE } from '../lib/profanity';
import { SimulationMediaStage } from '../components/practice/SimulationMediaStage';
import { SimulationDeviceModal } from '../components/practice/SimulationDeviceModal';
import { useSimulationDevices } from '../lib/useSimulationDevices';
import '../styles/simulation-chat.css';
import '../styles/simulation-editor.css';
import '../styles/simulation-media.css';

const fields = [['job_role', '직무·직종'], ['situation', '상황'], ['context', '사건의 맥락'], ['goal', '연습 목적'], ['turns', '턴 수'], ['target', '대화 상대'], ['difficulty', '난이도'], ['personality', '상대의 성격'], ['persona', '상대 페르소나']];
const emptyDraft = { job_role: '', context: '', goal: '', turns: null, situation: '', target: '', difficulty: '', personality: '', persona: '', additional_notes: '', additional_notes_confirmed: false };

export function SimulationChatPage({ prompt, serviceMode, initialTurns = 5, onBack }) {
  const [contextOpen, setContextOpen] = useState(() => window.matchMedia('(min-width: 801px)').matches);
  const [draft, setDraft] = useState(() => ({ ...emptyDraft, turns: initialTurns }));
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([{ role: 'user', content: prompt }]);
  const [simulation, setSimulation] = useState([]);
  const [confirmed, setConfirmed] = useState(null);
  const [phase, setPhase] = useState('prepare');
  const [preflightOpen, setPreflightOpen] = useState(false);
  const devices = useSimulationDevices();
  const [input, setInput] = useState('');
  const consent = true;
  const [begun, setBegun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answered, setAnswered] = useState(0);
  const inFlight = useRef(false);
  const controller = useRef(null);
  const inputRef = useRef(null);
  const questionInputRef = useRef(null);
  const speechRef = useRef(null);
  const [listening, setListening] = useState(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const missing = fields.filter(([key]) => key === "turns" ? !Number.isInteger(draft.turns) || draft.turns < 1 || draft.turns > 20 : !draft[key]?.trim());
  const preparing = phase === 'prepare';
  const optionalQuestion = question?.field === 'additional_notes';
  const visibleMessages = preparing ? messages : simulation;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (phase === 'done') devices.release(); }, [phase, devices.release]);
  useEffect(() => { document.title = `${phase === 'prepare' ? 'AI와 연습 준비' : phase === 'done' ? '연습 완료' : 'AI 시뮬레이션'} · Mirror-Ting`; }, [phase]);

  useEffect(() => () => {
    if (speechRef.current) {
      speechRef.current.onresult = speechRef.current.onend = speechRef.current.onerror = null;
      speechRef.current.abort();
    }
  }, []);
  const dictate = () => {
    if (speechRef.current) { speechRef.current.stop(); return; }
    if (!SpeechRecognition || busy) return;
    const speech = new SpeechRecognition();
    speech.lang = 'ko-KR';
    speech.interimResults = false;
    speech.onresult = event => {
      const text = Array.from(event.results).map(result => result[0].transcript).join(' ');
      setInput(value => `${value}${value ? ' ' : ''}${text}`.slice(0, optionalQuestion ? 2000 : undefined));
      setSelected(null);
    };
    speech.onend = () => { speechRef.current = null; setListening(false); };
    speech.onerror = () => { setError('음성을 인식하지 못했어요. 직접 입력하거나 다시 시도해주세요.'); };
    speechRef.current = speech;
    setError('');
    try { speech.start(); setListening(true); }
    catch { speechRef.current = null; setListening(false); setError('마이크를 시작하지 못했어요. 브라우저의 마이크 권한을 확인해주세요.'); }
  };

  const request = async (action, answer) => {
    if (inFlight.current || !consent) return;
    const content = (answer ?? input).trim();
    if (containsProfanity(content) || containsProfanity(prompt)) {
      setError(PROFANITY_MESSAGE);
      (preparing && question ? questionInputRef : inputRef).current?.focus({ preventScroll: true });
      return;
    }
    if (action === 'prepare' && begun && question && !content) { inputRef.current?.focus({ preventScroll: true }); return; }
    if (action === 'answer' && !content) { inputRef.current?.focus({ preventScroll: true }); return; }
    if (action === 'start' && (missing.length || question || !draft.additional_notes_confirmed)) return;
    if (action === 'start' && (!devices.ready || !preflightOpen)) { setPreflightOpen(true); return; }
    speechRef.current?.abort();
    inFlight.current = true; setBusy(true); setError('');
    controller.current = new AbortController();
    try {
      if (action === 'prepare') {
        const next = content || begun ? [...messages, { role: 'user', content }] : messages;
        const result = await simulationChatRequest('prepare', { prompt, service_mode: serviceMode, messages: next.slice(-20), draft, answer_field: question?.field ?? null, consent }, controller.current.signal);
        setMessages([...next, { role: 'assistant', content: result.message }]);
        setDraft(result.draft); setQuestion(result.question); setSelected(null); setBegun(true); setInput('');
        if (result.ready && !result.question) setPreflightOpen(true);
      } else {
        const settings = action === 'start' ? { ...draft } : confirmed;
        const next = action === 'start' ? [] : [...simulation, { role: 'user', content }];
        const result = await simulationChatRequest('reply', { prompt, draft: settings, service_mode: serviceMode, messages: next, consent }, controller.current.signal);
        setSimulation([...next, { role: 'assistant', content: result.message }]);
        setConfirmed(settings); setPhase(result.done ? 'done' : 'simulation'); setAnswered(result.answered_turns); setInput('');
        if (action === 'start') { setPreflightOpen(false); setContextOpen(false); }
      }
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  };

  const sendOnEnter = event => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    event.preventDefault();
    if (!event.repeat && input.trim()) request(preparing ? 'prepare' : 'answer');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => request('prepare'), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const cancelPreflight = () => {
    controller.current?.abort();
    setPreflightOpen(false); setError(''); devices.release();
  };

  return <section className={`simulation-chat-page lovable-central-chat ${preparing ? 'is-preparing' : 'is-simulation'} context-${contextOpen ? 'open' : 'closed'}`} aria-labelledby="simulation-chat-title">
    <header className="editor-toolbar">
      <div className="editor-project">
        <button type="button" className="editor-back" aria-label="연습 공간으로 돌아가기" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /></button>
        <img src="/icons/mirror-ting-mark-slim.png" alt="" width="22" height="22" />
        <h1 id="simulation-chat-title" title={draft.situation || 'AI와 연습 준비'}>{draft.situation || (preparing ? 'AI와 연습 준비' : 'AI 시뮬레이션')}</h1>
      </div>
      <button type="button" className="editor-context-toggle" aria-label={contextOpen ? '연습 설정 닫기' : '연습 설정 열기'} aria-expanded={contextOpen} aria-controls="simulation-context" onClick={() => setContextOpen(!contextOpen)}><Sidebar size={18} aria-hidden="true" /><span>연습 설정</span></button>
    </header>
    <div className="simulation-workbench">
    {!preparing && <SimulationMediaStage name={confirmed?.target || 'AI 상대'} message={simulation.at(-1)?.role === 'assistant' ? simulation.at(-1).content : ''} messageId={simulation.length} active={phase === 'simulation'} busy={busy} listening={listening} canDictate={Boolean(SpeechRecognition)} onDictate={dictate} devices={devices} answered={answered} turns={confirmed?.turns} />}
    <div className="simulation-chat-conversation">
      {!preparing && <div className="simulation-transcript-heading"><strong>대화 기록</strong><span>내 말로 답해보세요</span></div>}
      <div className="simulation-chat-transcript" role="log" aria-label={preparing ? '연습 준비 대화' : '시뮬레이션 대화'} aria-busy={busy}>
        <div className="simulation-transcript-inner">
        {visibleMessages.map((message, index) => <article key={`${phase}-${index}`} className={`simulation-message simulation-message--${message.role}`}><span>{message.role === 'user' ? '나' : preparing ? '준비 도우미' : 'AI 상대'}</span><p>{message.content}</p></article>)}
        {preparing && !begun && <div className="simulation-chat-intro"><p>직무와 구체적으로 있었던 일을 살펴보고, 더 필요한 내용만 물어볼게요.</p><p>예시를 고르거나 원하는 답을 직접 적을 수 있어요. 1턴은 내 답변 한 번을 뜻해요.</p></div>}
        {busy && <p className="simulation-chat-status" role="status">{preparing ? 'AI가 연습할 내용을 살펴보고 있어요' : 'AI가 답변하고 있어요'}</p>}
        {preparing && begun && !question && !missing.length && draft.additional_notes_confirmed && <section className="simulation-question simulation-question--ready" aria-label="최종 설정 확인">
          <h2>이 설정으로 연습할까요?</h2>
          <details><summary>확인한 설정 보기</summary><dl>{fields.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{key==='turns'?`${draft[key]}턴`:key==='difficulty'?{basic:'기본',pressure:'심화',ultra_pressure:'압박'}[draft[key]]:key==='context'?(draft.context_source || draft.context):draft[key]}</dd></div>)}</dl>{draft.additional_notes && <p className="simulation-additional-notes">추가 사항: {draft.additional_notes}</p>}</details>
          <button type="button" className="simulation-chat-start" disabled={busy || !consent} onClick={()=>setPreflightOpen(true)}>설정 확정하고 시작하기</button>
        </section>}
        {phase === 'done' && <p className="simulation-chat-status" role="status">{answered >= confirmed.turns ? `정한 ${confirmed.turns}턴을 마쳤어요.` : '직접 연습을 종료했어요.'} 대화는 이 화면에서 다시 읽을 수 있어요.</p>}
        </div>
      </div>
      <div className="simulation-chat-input-area">
        {error && <p id="simulation-input-error" className="simulation-chat-error" role="alert">{error}</p>}
        {preparing && begun && question && <section className="simulation-question simulation-question-card" aria-labelledby="simulation-question-title">
          <div className="simulation-question-card-top"><span><span aria-hidden="true">?</span> 질문</span><span>{optionalQuestion ? '마지막 질문 · 선택' : `필수 설정 ${fields.length - missing.length} / ${fields.length}`}</span></div>
          <h2 id="simulation-question-title">{question.title}</h2>
          <div className="simulation-question-choices" role="group" aria-label="예시 답변">
            {question.choices.map((choice,index)=><button type="button" key={choice} aria-pressed={selected===index} disabled={busy} onClick={()=>{setSelected(index);setInput(optionalQuestion && index === 1 ? '' : choice);questionInputRef.current?.focus({ preventScroll: true });}}><span aria-hidden="true">{index+1}</span>{choice}</button>)}
          </div>
          <div className="simulation-question-card-bottom">
            <label className="simulation-question-direct" htmlFor="simulation-question-answer"><Pen2 size={18} aria-hidden="true" /><span className="screen-reader-note">질문에 직접 답변하기</span><input ref={questionInputRef} id="simulation-question-answer" type="text" value={input} onChange={event => {setInput(event.target.value);setSelected(null);setError('');}} onKeyDown={sendOnEnter} maxLength={optionalQuestion ? 2000 : undefined} disabled={busy} placeholder="또는 직접 답변을 작성하세요" /></label>
            <button type="button" className="simulation-question-microphone" aria-label={listening ? '음성 입력 중지' : '음성으로 답변 입력'} aria-pressed={listening} disabled={busy || !SpeechRecognition} title={SpeechRecognition ? '음성으로 답변 입력' : '이 브라우저에서는 음성 입력을 지원하지 않아요'} onClick={dictate}><Microphone size={18} aria-hidden="true" /></button>
            <div className="simulation-question-actions"><button type="button" className="simulation-question-skip" disabled={busy || !optionalQuestion} title={optionalQuestion ? '추가 사항 없이 계속하기' : '시뮬레이션에 필요한 필수 질문이에요'} onClick={() => request('prepare', '추가 사항 없어요')}>건너뛰기</button><button type="button" onClick={() => request('prepare')} className="simulation-question-next" aria-label="준비 답변 보내기" disabled={busy || !input.trim()}>다음</button></div>
          </div>
        </section>}
        {phase !== 'done' && <form onSubmit={event => { event.preventDefault(); request(preparing ? 'prepare' : 'answer'); }}>
          <label htmlFor="simulation-chat-input" className="screen-reader-note">{preparing ? '준비 도우미에게 답하기' : 'AI 상대에게 답하기'}</label>
          <textarea ref={inputRef} id="simulation-chat-input" rows={2} value={input} aria-invalid={error === PROFANITY_MESSAGE || undefined} aria-describedby={error ? 'simulation-input-error' : undefined} onKeyDown={sendOnEnter} onChange={event => {setInput(event.target.value);setSelected(null);setError('');}} maxLength={optionalQuestion ? 2000 : undefined} disabled={busy || !consent} placeholder={optionalQuestion ? '추가 상황이나 주의할 점을 적어주세요.' : preparing ? begun && !missing.length ? '바꾸고 싶은 설정이 있다면 적어주세요.' : '예시 답변을 고르거나 원하는 내용을 직접 적어주세요.' : '상대에게 할 말을 적어주세요.'}/>
          <div className="simulation-chat-toolbar"><span>{preparing ? '설정을 확인한 뒤 연습을 시작해요' : `${answered} / ${confirmed?.turns}턴`}</span><button type="submit" disabled={busy || !consent || ((question || !preparing) && !input.trim())} aria-label={preparing ? begun ? question ? '입력한 답변 보내기' : '준비 답변 보내기' : '동의하고 AI와 준비하기' : '시뮬레이션 답변 보내기'}><ArrowUp size={18} aria-hidden="true"/></button></div>
          {!preparing && <p className="simulation-composer-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>}
        </form>}
      </div>
    </div>
    {contextOpen && <button type="button" className="editor-context-scrim" aria-label="연습 설정 패널 닫기" onClick={() => setContextOpen(false)} />}
    <aside id="simulation-context" className="simulation-context editor-context" aria-labelledby="simulation-context-title" hidden={!contextOpen}>
      <div className="editor-context-heading"><h2 id="simulation-context-title">연습 설정</h2><button type="button" aria-label="설정 닫기" onClick={() => setContextOpen(false)}>×</button></div>
      <div className="editor-context-content">
        <span className="editor-preview-badge">{preparing ? '나의 연습 시나리오' : phase === 'done' ? '연습 완료' : 'AI와 대화 연습'}</span>
        <h3>{draft.situation || '대화를 미리 준비해요'}</h3>
        <p className="simulation-context-prompt">{prompt}</p>
        <div className="editor-context-persona"><strong>{draft.target || 'AI 대화 상대'}</strong><p>{draft.persona || '대화를 통해 상황에 맞는 상대를 준비해요.'}</p></div>
        <details open><summary>연습 상황과 설정</summary>
          <div className="simulation-context-status">{preparing ? `확인한 설정 ${fields.length - missing.length} / ${fields.length}` : phase === 'done' ? '연습 완료' : `진행 ${answered} / ${confirmed?.turns}턴`}</div>
          <dl>{fields.map(([key,label]) => { const value=(confirmed || draft)[key]; return <div key={key}><dt>{label}</dt><dd>{key==='difficulty' ? ({basic:'기본',pressure:'심화',ultra_pressure:'압박'}[value] || '확인 중') : value ? `${value}${key==='turns'?'턴':''}` : '확인 중'}</dd></div>; })}</dl>
          {(confirmed || draft).additional_notes && <div className="simulation-additional-notes"><strong>추가 사항</strong><p>{(confirmed || draft).additional_notes}</p></div>}
        </details>
      </div>
    </aside>
    </div>
    <SimulationDeviceModal open={preflightOpen} devices={devices} onCancel={cancelPreflight} onStart={() => request('start')} busy={busy} error={error} />
  </section>;
}
