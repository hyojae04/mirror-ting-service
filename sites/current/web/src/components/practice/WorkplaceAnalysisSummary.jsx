import { Card } from '../ui/shadcn';

function AnalysisGraphic({ kind, available, ratio = 0 }) {
  return <svg viewBox="0 0 200 96" aria-hidden="true" className="report-analysis-graphic" data-available={available}>
    {kind==='face' ? <><path d="M57 19v-8h15m56 0h15v8M57 77v8h15m56 0h15v-8"/><ellipse cx="100" cy="46" rx="25" ry="31"/><path d="M85 40h5m20 0h5m-23 22q8 5 16 0"/><circle cx="87" cy="40" r="2"/><circle cx="113" cy="40" r="2"/></> : kind==='posture' ? <><circle cx="100" cy="21" r="10"/><path d="M100 31v36m-34-23 34-8 34 8M76 44l-7 34m55-34 7 34M100 67 87 88m13-21 13 21"/><path className="report-graphic-guide" d="M45 44h110M100 5v84"/></> : kind==='voice' ? <><path className="report-graphic-guide" d="M26 48h148"/>{[10,22,34,18,46,58,38,20,42,26,12].map((h,i)=><path key={i} d={`M${40+i*12} ${48-(available?h:4)/2}v${available?h:4}`}/>)}</> : <><path className="report-graphic-guide" d="M25 25h150M25 48h150M25 71h150"/>{[0,1,2].map(i=><path key={i} d={`M25 ${25+i*23}h${Math.max(0,Math.min(1,ratio))*150}`} strokeWidth="6"/>)}</>}
  </svg>;
}

export function WorkplaceAnalysisSummary({ report, measurements = [] }) {
  const expressions=measurements.filter(item=>item?.expression_model?.samples>0);
  const poses=measurements.filter(item=>item?.posture_samples?.avg_shoulder_tilt_deg>0);
  const samples=expressions.reduce((n,item)=>n+item.expression_model.samples,0);
  const poseSamples=poses.reduce((n,item)=>n+item.posture_samples.avg_shoulder_tilt_deg,0);
  const tilt=poseSamples ? poses.reduce((n,item)=>n+item.avg_shoulder_tilt_deg*item.posture_samples.avg_shoulder_tilt_deg,0)/poseSamples : null;
  const answered=report.turns.filter(turn=>turn.answer).length;
  const panels=[
    {kind:'face',title:'표정',available:samples>0,value:samples?`${samples}개`:'—',unit:samples?'얼굴 표본':'분석 데이터 없음',status:samples?'측정 완료':'미분석',copy:samples?'얼굴 표정 모델의 유효 표본을 확인했어요. 표정에 대한 좋고 나쁨은 판정하지 않아요.':'이번 대화에서 표정 표본이 수집되지 않았어요.'},
    {kind:'posture',title:'자세',available:tilt!==null,value:tilt!==null?`${tilt.toFixed(1)}°`:'—',unit:tilt!==null?'평균 어깨 기울기':'분석 데이터 없음',status:tilt!==null?'측정 완료':'미분석',copy:tilt!==null?`${poseSamples}개 표본에서 측정한 개인 기준 대비 어깨 기울기예요.`:'상체가 인식된 표본이 없어 자세를 평가하지 않았어요.'},
    {kind:'voice',title:'목소리',available:false,value:'—',unit:'음성 특성 미분석',status:'미분석',copy:'인식된 답변은 내용 분석에 사용했어요. 말의 속도·음높이·음량은 평가하지 않았어요.'},
    {kind:'response',title:'응답',available:answered>0,value:`${report.matched}/${report.totalChecks}`,unit:'핵심 항목 전달',status:answered?'분석 완료':'답변 없음',ratio:report.matched/report.totalChecks,copy:`${answered}개 답변에서 상황 설명, 일정 제안, 후속 조치를 확인했어요.`},
  ];
  return <section className="report-section" aria-labelledby="report-analysis-title">
    <div className="report-section-heading"><h3 id="report-analysis-title">분석 항목</h3><p>표정·자세·목소리·응답을 나누어 확인해요. 측정값이 없는 항목은 점수에 반영하지 않아요.</p></div>
    <div className="report-analysis-grid">{panels.map(panel=><Card key={panel.kind} className="report-analysis-panel" data-available={panel.available}>
      <div className="report-analysis-heading"><h4>{panel.title}</h4><span>{panel.status}</span></div>
      <AnalysisGraphic {...panel}/><div className="report-analysis-value"><strong>{panel.value}</strong><span>{panel.unit}</span></div><p>{panel.copy}</p>
    </Card>)}</div>
  </section>;
}
