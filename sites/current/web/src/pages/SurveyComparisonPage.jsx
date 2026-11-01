import { useState } from 'react';
import '../styles/survey-comparison.css';
const variants=[{id:'icons',name:'A · 아이콘 중심',description:'작은 아이콘과 가로 카드로 빠르게 읽고 선택하는 안이에요.'},{id:'visual',name:'B · 생성 시안 기반',description:'생성 이미지의 큰 아이콘 타일과 세로 카드 구성을 실제 UI로 옮긴 안이에요.'},{id:'reference',name:'생성 이미지',description:'B안의 원본 이미지 시안이에요. 이미지 속 일부 문구는 실제 설문의 질문으로 맞춰 구현했어요.'}];
export function SurveyComparisonPage(){
 const [active,setActive]=useState('icons');const [reset,setReset]=useState(0);
 return <div className="app-shell survey-comparison"><a className="skip-link" href="#comparison-main">비교 화면으로 건너뛰기</a><main id="comparison-main">
  <header className="comparison-heading"><div><p>Mirror-Ting · 설문 디자인 비교</p><h1>같은 질문, 두 가지 선택 방식</h1><p>질문·색상·기능은 같게 두고 선택 카드의 표현을 비교해보세요.</p></div><a href="/" target="_top">서비스로 돌아가기</a></header>
  <div className="comparison-controls"><div role="group" aria-label="비교할 디자인">{variants.map(item=><button key={item.id} type="button" aria-pressed={active===item.id} onClick={()=>setActive(item.id)}>{active===item.id&&<span aria-hidden="true">✓</span>}{item.name}</button>)}</div>{active!=='reference'&&<button className="comparison-reset" type="button" onClick={()=>setReset(reset+1)}>미리보기 처음부터</button>}</div>
  <p className="comparison-description" role="status">{variants.find(item=>item.id===active).description} {active!=='reference'&&'비교 화면에서는 AI를 호출하지 않아요.'}</p>
  {variants.slice(0,2).map(item=><section key={item.id} hidden={active!==item.id} className="comparison-preview" aria-label={item.name}><iframe key={`${item.id}-${reset}`} title={`${item.name} 설문 미리보기`} src={`/original/index.html?survey-preview=${item.id}`}/></section>)}
  <figure hidden={active!=='reference'} className="comparison-reference"><img src="/original/design/survey-visual-reference.png" alt="큰 면접·직장 대화 아이콘을 세로 카드 중앙에 배치한 Mirror-Ting 설문 이미지 시안"/><figcaption>생성 이미지 시안 · 실제 구현은 텍스트·아이콘·입력 컨트롤로 구성했어요.</figcaption></figure>
  <details className="comparison-analysis" open><summary>두 안의 차이와 선택 기준</summary><div className="comparison-table-wrap"><table><caption>설문 선택 카드 비교</caption><thead><tr><th scope="col">비교 기준</th><th scope="col">A · 아이콘 중심</th><th scope="col">B · 생성 시안 기반</th></tr></thead><tbody><tr><th scope="row">정보 밀도</th><td>작은 아이콘과 설명을 가로로 읽어요.</td><td>큰 아이콘을 먼저 보고 아래 설명을 읽어요.</td></tr><tr><th scope="row">적합한 사용</th><td>빠른 설정과 반복 방문에 권장해요.</td><td>처음 방문해 선택지를 구분하는 데 초점을 둬요.</td></tr><tr><th scope="row">화면 사용량</th><td>같은 화면에 더 많은 선택지를 보여줘요.</td><td>여백과 시각 요소가 커서 더 스크롤할 수 있어요.</td></tr><tr><th scope="row">같은 조건</th><td colSpan={2}>질문·선택지·네 단계 진행·키보드 조작·선택 표시를 동일하게 유지했어요.</td></tr></tbody></table></div><p>사용성 테스트 결과가 아닌 설계 비교예요. 실제 서비스에는 큰 아이콘의 B안을 적용하고 A안은 비교용으로 제공해요.</p></details>
 </main></div>;
}
