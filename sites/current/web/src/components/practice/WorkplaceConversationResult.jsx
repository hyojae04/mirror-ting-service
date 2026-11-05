import { useEffect, useRef, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Check } from 'reicon-react/icons/Check';
import { ArrowRight } from 'reicon-react/icons/ArrowRight';
import { Button, Card } from '../ui/shadcn';
import { buildWorkplaceReport } from '../../lib/workplaceReport';
import { WorkplaceWordCloud } from './WorkplaceWordCloud';
import { WorkplaceAnalysisSummary } from './WorkplaceAnalysisSummary';
import { workplaceDemoReplies } from '../../lib/workplaceDemo';
import '../../styles/workplace-conversation-result.css';

export function WorkplaceConversationResult({ messages, onRetry, onBack, measurements = [] }) {
  const heading = useRef(null);
  const report = buildWorkplaceReport(messages);
  const [activeTurn, setActiveTurn] = useState(() => report.flow.findIndex(point => point.rate === Math.min(...report.flow.map(item => item.rate))));
  const [openTurns, setOpenTurns] = useState([]);
  const selected = report.turns[activeTurn];
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="workplace-result" aria-labelledby="workplace-result-title">
    <div className="workplace-result-inner">
      <header className="workplace-result-heading">
        <div><p>업무 일정 조율 <span>·</span> 3턴 완료</p><h2 ref={heading} tabIndex={-1} id="workplace-result-title">대화 분석 리포트</h2><p>이번 대화에서 잘 전달한 내용과 다음에 보완할 내용을 살펴보세요.</p></div>
        <Button variant="outline" onClick={onBack}>연습 공간으로</Button>
      </header>

      <Card className="report-overview" id="report-overview">
        <div className="report-score" role="img" aria-label={`대화 내용 점수 ${report.total}점, 100점 만점`}>
          <svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="76" className="report-score-track"/><circle cx="90" cy="90" r="76" className="report-score-arc" pathLength="100" strokeDasharray={`${report.total} 100`} transform="rotate(-90 90 90)"/></svg>
          <div><strong>{report.total}<small>점</small></strong><span>대화 내용 점수</span></div>
        </div>
        <div className="report-overview-copy"><span className="report-eyebrow">종합 피드백</span><h3>{report.gaps.length ? `${report.strongest.score ? report.strongest.title+'은 전달했어요.' : '상황과 원하는 결과를 먼저 말해보세요.'}\n${report.weakest.title}을 더 구체적으로 말해보세요.` : '상황 설명부터 후속 조치까지,\n필요한 내용을 모두 전했어요.'}</h3><p>{report.gaps.length ? report.gaps[0].advice : '상황을 설명하고, 업무 순서와 마감일을 제안한 뒤 공유할 시점까지 정했어요. 이 흐름을 다음 대화에서도 이어가세요.'}</p><div className="report-overview-meta"><span><Check size={16} aria-hidden="true"/><span>핵심 항목</span><b>{report.matched} / {report.totalChecks}</b><span>확인</span></span><span>평가 기준: 답변 내용</span></div></div>
      </Card>

      <WorkplaceAnalysisSummary report={report} measurements={measurements} />

      <section className="report-section" aria-labelledby="report-breakdown-title">
        <div className="report-section-heading"><h3 id="report-breakdown-title">핵심 내용 전달</h3><p>각 턴에서 필요한 내용이 얼마나 담겼는지 확인했어요.</p></div>
        <Card className="report-breakdown">{report.turns.map((turn,index)=><div key={turn.title} className="report-bar-row"><div><span>{String(index+1).padStart(2,'0')}</span><strong>{turn.title}</strong></div><div className="report-bar-track"><span style={{width:`${turn.score/turn.max*100}%`}}/></div><span className="report-bar-value"><b>{turn.score}</b> / {turn.max}점</span></div>)}</Card>
      </section>

      <div className="report-coaching-grid" id="report-coaching">
        <Card className="report-coaching"><span className="report-eyebrow">잘 전달한 내용</span><h3>{report.strongest.score ? report.strongest.title : '핵심부터 짧게 말해보세요'}</h3><p>{report.strongest.score ? report.strongest.checks.filter(check=>check.met).map(check=>check.label).join(' · ') : '현재 상황과 원하는 결과를 한 문장씩 나누어 설명해보세요.'}</p>{report.strongest.answer && <blockquote>“{report.strongest.answer}”</blockquote>}</Card>
        <Card className="report-coaching"><span className="report-eyebrow">다음에 보완할 내용</span><h3>{report.gaps.length ? report.gaps[0].label : '합의한 내용을 한 번 더 정리하세요'}</h3><p>{report.gaps.length ? report.gaps[0].advice : '대화를 마칠 때 업무 순서, 마감일, 공유 시점을 짧게 정리해두면 좋아요.'}</p>{report.gaps.length > 1 && <p className="report-secondary-tip">함께 확인할 내용: {report.gaps.slice(1,3).map(gap=>gap.label).join(' · ')}</p>}</Card>
      </div>

      <section className="report-section" id="report-vocabulary" aria-labelledby="report-vocabulary-title">
        <div className="report-section-heading"><h3 id="report-vocabulary-title">답변 어휘</h3><p>실제 답변 텍스트에 담긴 업무 관련 표현이에요.</p></div>
        <Card className="report-vocabulary">
          <WorkplaceWordCloud words={report.words} />
          <div className="report-vocabulary-notes"><div><h4>자주 사용한 표현</h4><p>{report.words.length ? report.words.slice(0,3).map(item=>`‘${item.word}’ ${item.count}회`).join(', ') : '상황에 맞는 업무명을 구체적으로 말해보세요.'}</p></div><div><h4>습관적 표현 확인</h4><p>{report.fillers.some(item=>item.count) ? report.fillers.filter(item=>item.count).map(item=>`‘${item.word}’ ${item.count}회`).join(', ')+' 확인했어요. 문장 사이에 잠깐 쉬어보세요.' : '‘음·어·그·그런’은 답변 텍스트에서 확인되지 않았어요.'}</p></div></div>
        </Card>
      </section>

      <section className="report-section" id="report-flow" aria-labelledby="report-flow-title">
        <div className="report-section-heading"><h3 id="report-flow-title">대화 흐름 분석</h3><p>감정 추정 대신, 턴별 핵심 항목의 충족률을 보여드려요.</p></div>
        <Card className="report-flow-card"><div className="report-flow-chart" role="img" aria-label={report.flow.map(point=>`${point.name} ${point.rate}%`).join(', ')}><ResponsiveContainer width="100%" height={220}><LineChart data={report.flow} margin={{top:20,right:30,bottom:4,left:-20}}><CartesianGrid vertical={false} stroke="var(--mode-border)" strokeDasharray="3 4"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12,fill:'var(--mode-muted)'}} dy={10}/><YAxis domain={[0,100]} ticks={[0,50,100]} axisLine={false} tickLine={false} tickFormatter={value=>`${value}%`} tick={{fontSize:11,fill:'var(--mode-muted)'}}/><Line type="linear" dataKey="rate" stroke="var(--mode-accent)" strokeWidth={2.5} dot={{r:5,fill:'var(--mode-card)',strokeWidth:2.5}} isAnimationActive={false}/></LineChart></ResponsiveContainer><p>핵심 항목 충족률</p></div><div className="report-flow-detail"><div className="report-turn-selector" role="group" aria-label="턴별 분석 선택">{report.turns.map((turn,index)=><Button key={turn.title} size="sm" variant={index===activeTurn?'default':'outline'} aria-pressed={index===activeTurn} onClick={()=>setActiveTurn(index)}>{index+1}턴</Button>)}</div><h4>{selected.title}</h4><p>{selected.checks.every(check=>check.met) ? '필요한 내용을 빠짐없이 전달했어요.' : selected.checks.filter(check=>!check.met).map(check=>check.label).join(', ')+' 내용을 더해보세요.'}</p><blockquote>“{selected.answer || '답변이 없어요.'}”</blockquote></div></Card>
      </section>

      <section className="report-section" aria-labelledby="report-turns-title"><div className="report-section-heading"><h3 id="report-turns-title">턴별 상세 피드백</h3><p>답변과 평가 근거를 함께 확인할 수 있어요.</p></div><Card className="report-turn-details">{report.turns.map((turn,index)=><details key={turn.title} onToggle={event => { const open = event.currentTarget.open; setOpenTurns(previous => open ? [...new Set([...previous,index])] : previous.filter(item => item !== index)); }}><summary><span><b>{index+1}턴</b>{turn.title}</span><strong>{turn.score} / {turn.max}점</strong></summary>{openTurns.includes(index) && <><p className="report-counterpart">팀장 · {workplaceDemoReplies[index]}</p><blockquote>“{turn.answer || '답변이 없어요.'}”</blockquote><ul>{turn.checks.map(check=><li key={check.label} data-met={check.met}><span>{check.met ? '확인' : '보완'}</span>{check.label}</li>)}</ul></>}</details>)}</Card></section>
      <footer className="report-footer"><p>점수는 답변의 핵심 표현을 기준으로 산정해요. 표정·자세 측정값은 참고용이며, 다른 사용자의 평균·순위는 비교하지 않아요.</p><Button onClick={onRetry}>같은 상황 다시 연습하기<ArrowRight size={16} aria-hidden="true"/></Button></footer>
    </div>
  </section>;
}
