import { useEffect, useState } from 'react';
import { BookOpen } from 'reicon-react/icons/BookOpen';
import { CheckList } from 'reicon-react/icons/CheckList';
import { HelpCircle } from 'reicon-react/icons/HelpCircle';
import { Search } from 'reicon-react/icons/Search';
import '../styles/usage-guide.css';

const guides = [
 {id:'quickstart',category:'시작하기',title:'시나리오 만드는 순서',description:'네 단계의 설문을 작성하고 AI가 만든 연습 장면을 확인해요.',icon:BookOpen,sections:[['연습 상황을 골라요','홈의 ‘연습해보기’를 선택하세요. 면접 또는 직장 대화를 고르고, 연습하고 싶은 상황을 선택해요. 목록에 없다면 ‘직접 정할게요’로 적을 수 있어요.'],['내 상황과 연습 방식을 정해요','직무와 구체적인 경험·사건, 대화 목표를 적어요. 다음 단계에서 상대, 상대의 태도, 난이도와 턴 수를 선택해요. 추가 사항은 필요한 경우에만 적어주세요.'],['확인하고 시나리오를 만들어요','마지막 화면에서 답변을 확인하세요. 바꿀 내용은 항목 옆 ‘수정’을 선택해 고칠 수 있어요. OpenAI로 답변을 전송하는 데 동의한 뒤 ‘시나리오 만들기’를 선택하면 연습 장면과 가상의 상대가 준비돼요.']]},
 {id:'prompt',category:'설문 작성',title:'상황과 목표 작성하기',description:'어떤 일이 있었고 대화 후 무엇을 얻고 싶은지 적어주세요.',icon:CheckList,sections:[['구체적으로 어떤 일이 있었나요?','직장 대화라면 맡은 일, 생긴 문제, 상대와 이야기할 이유를 적어요. 예를 들어 ‘추가 업무 때문에 금요일 마감이 어려워져 팀장과 다음 주 화요일로 조율하고 싶어요’처럼 쓰면 돼요. 면접이라면 설명할 프로젝트나 경험을 적어주세요.'],['목표는 원하는 결과예요','‘내 경험을 명확히 설명하기’, ‘상대와 합의점 찾기’처럼 대화에서 이루고 싶은 목표를 고르세요. 원하는 목표가 없다면 직접 적을 수 있어요.'],['민감한 정보는 빼도 돼요','실명, 회사 이름이나 내부 자료를 적지 않아도 시나리오를 만들 수 있어요. 설문을 작성하는 동안에는 AI를 호출하지 않아요. 마지막에 동의하고 생성 버튼을 선택할 때 답변을 전송해요.']]},
 {id:'editor',category:'설문 작성',title:'상대·난이도·턴 수 정하기',description:'선택 카드와 버튼으로 원하는 연습 방식을 정해요.',icon:CheckList,sections:[['상대와 태도를 골라요','면접에서는 실무·인사·임원 면접관을, 직장 대화에서는 상사·동료·후배·고객 등을 고를 수 있어요. 상대의 태도는 차분함, 꼼꼼함, 직설적인 말투 중 원하는 쪽을 선택하세요.'],['난이도는 질문의 깊이예요','기본은 친숙한 질문으로 차근차근, 심화는 구체적인 이유와 근거까지, 압박은 반론과 예상 밖 질문까지 연습하는 설정이에요.'],['1턴은 내가 답변하는 한 번이에요','5턴은 짧게 핵심을, 10턴은 충분히 대화를 이어가는 설정이에요. 현재 공개 체험에서는 턴 수를 포함한 시나리오를 설계하며 실제 대화는 시작하지 않아요.']]},
 {id:'records',category:'완료와 수정',title:'완성된 시나리오 확인·수정하기',description:'연습 장면과 가상의 상대를 확인하고 답변을 수정해요.',icon:BookOpen,sections:[['어떤 내용이 만들어지나요?','입력한 답변을 바탕으로 시나리오 제목, 연습할 장면, 가상의 대화 상대와 연습 목표를 보여줘요. 상대는 실제 사람이 아닌 가상 인물이에요.'],['답변을 바꾸고 싶다면','결과 화면의 ‘답변 수정하기’를 선택하세요. 최종 확인 화면으로 돌아가 항목별로 수정할 수 있어요. 수정한 내용으로 다시 만들려면 ‘시나리오 만들기’를 선택해주세요.'],['현재 체험 범위','이번 공개 버전은 시나리오 설계까지만 제공해요. 카메라·마이크를 사용하는 실제 시뮬레이션, 4-Fit 분석과 연습 결과 저장은 실행하지 않아요. 답변은 이 화면에서만 유지되며 새로고침하거나 페이지를 떠나면 사라질 수 있어요.']]},
 {id:'troubleshooting',category:'문제 해결',title:'다음 단계나 생성이 진행되지 않을 때',description:'필수 항목과 입력 안내를 확인하고 생성을 다시 시도해요.',icon:HelpCircle,sections:[['입력 안내가 보일 때','안내가 표시된 항목을 선택하거나 입력한 뒤 ‘다음’을 선택하세요. ‘직접 정할게요’를 골랐다면 바로 아래 입력칸도 채워주세요. 비속어가 포함된 경우에는 표현을 바꿔주세요.'],['시나리오 생성에 실패했을 때','오류 안내를 확인한 뒤 ‘시나리오 만들기’를 다시 선택하세요. 생성 오류가 나도 작성한 답변은 유지돼요. 생성 중에는 중복 요청을 막기 위해 버튼이 잠시 비활성화돼요.'],['이전 답변을 바꾸고 싶을 때','‘이전’ 또는 최종 확인 화면의 ‘수정’을 선택하세요. 연습 종류를 바꾸면 이전 종류에 속한 상황·목표·상대는 다시 골라야 해요. 새로고침하면 답변이 사라질 수 있으니 화면 안의 이동 버튼을 이용해주세요.']]},
];
const categories=['전체','시작하기','설문 작성','완료와 수정','문제 해결'];

export function UsagePage({ onPractice }) {
 const [topicsOpen,setTopicsOpen]=useState(()=>window.matchMedia('(min-width: 801px)').matches);
 const [query,setQuery]=useState('');const [category,setCategory]=useState('전체');
 const selected=guides.find(item=>item.id===new URLSearchParams(location.search).get('guide'));
 const normalized=query.trim().toLocaleLowerCase('ko');
 const visible=guides.filter(item=>(category==='전체'||item.category===category)&&`${item.title} ${item.description} ${item.sections.flat().join(' ')}`.toLocaleLowerCase('ko').includes(normalized));
 useEffect(()=>{document.title=`${selected?.title || '사용 방법'} · Mirror-Ting`;},[selected]);
 return <section className={`page help-center ${selected?'help-center--article':''}`} aria-labelledby="help-title">
 {selected ? <>
  <nav className="help-breadcrumb" aria-label="현재 위치"><a href="?guide=all">사용 방법</a><span aria-hidden="true">/</span><span>{selected.category}</span></nav>
  <div className="help-document-layout">
   <nav className="help-topics" aria-label="사용 방법 주제"><details open={topicsOpen} onToggle={event=>setTopicsOpen(event.currentTarget.open)}><summary>가이드 목록</summary>{guides.map(item=><a key={item.id} href={`?guide=${item.id}`} aria-current={item.id===selected.id?'page':undefined}>{item.title}</a>)}</details></nav>
   <article className="help-document"><header><p className="help-eyebrow">{selected.category}</p><h1 id="help-title">{selected.title}</h1><p>{selected.description}</p></header>{selected.sections.map(([title,content],index)=><section key={title} id={`guide-section-${index}`}><h2>{title}</h2><p>{content}</p></section>)}<footer><a href="?guide=all">모든 사용 방법 보기</a><button type="button" className="help-primary" onClick={onPractice}>연습해보기</button></footer></article>
  </div>
 </> : <>
  <header className="help-search-hero"><p className="help-eyebrow">Mirror-Ting 사용 방법</p><h1 id="help-title">어떤 도움이 필요한가요?</h1><p>설문 작성부터 시나리오 완성까지 알아보세요.</p><label htmlFor="guide-search">사용 방법 검색</label><div className="help-search-field"><Search size={20} aria-hidden="true"/><input type="search" id="guide-search" name="guide-search" placeholder="예: 난이도, 답변 수정, 생성 오류" value={query} onChange={event=>setQuery(event.target.value)}/></div></header>
  <nav className="help-shortcuts" aria-label="추천 가이드">{[{id:'quickstart',icon:BookOpen,title:'처음 시작하기',text:'네 단계로 시나리오 만들기'},{id:'editor',icon:CheckList,title:'연습 방식 정하기',text:'상대·난이도·턴 수 알아보기'},{id:'troubleshooting',icon:HelpCircle,title:'문제 해결하기',text:'입력·생성 오류 확인하기'}].map(({id,icon:Icon,title,text})=><a href={`?guide=${id}`} key={id}><span className="help-shortcut-icon" aria-hidden="true"><Icon size={24}/></span><strong>{title}</strong><span>{text}</span></a>)}</nav>
  <section className="help-guide-list" aria-labelledby="guide-list-title"><div className="help-list-heading"><h2 id="guide-list-title">주제별 사용 방법</h2><p className="help-result-count" role="status">{visible.length}개 가이드</p></div><div className="help-categories" role="group" aria-label="가이드 분류">{categories.map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}>{category===value&&<span aria-hidden="true">✓</span>}{value}</button>)}</div><div className="help-guide-grid">{visible.map(item=><a key={item.id} href={`?guide=${item.id}`}><small>{item.category}</small><h3>{item.title}</h3><p>{item.description}</p><span className="help-read-link">{item.title} 읽기 </span></a>)}</div>{!visible.length&&<div className="help-empty"><Search size={28} aria-hidden="true"/><h3>맞는 사용 방법을 찾지 못했어요</h3><p>{query?`‘${query}’ 대신 다른 검색어를 입력하거나 분류를 바꿔보세요.`:'다른 분류를 선택하거나 검색 조건을 초기화해보세요.'}</p><button type="button" onClick={()=>{setQuery('');setCategory('전체');}}>검색·분류 초기화</button></div>}</section>
 </>}
 </section>;
}
