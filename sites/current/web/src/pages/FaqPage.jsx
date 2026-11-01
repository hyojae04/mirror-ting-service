export const faqItems = [
  { id: 'payment', category: '요금제', question: '지금 요금제를 결제할 수 있나요?', answer: '현재 시연 단계로, 요금과 결제 기능은 준비 중이에요. 확정된 금액과 이용 조건은 출시 때 안내할 예정이에요.' },
  { id: 'practice', category: '연습 시작', question: '어떤 대화를 연습할 수 있나요?', answer: '면접과 직장 생활에서 필요한 대화를 준비할 수 있어요. 홈의 ‘연습해보기’를 선택하고 설문에서 상황·목표·상대·난이도를 정해주세요. 마지막에 답변을 확인하고 동의하면 AI가 시나리오를 만들어요. 현재 공개 체험은 시나리오 설계까지만 제공해요.' },
  { id: 'billing', category: '요금제', question: '월간과 연간의 차이는 무엇인가요?', answer: '월간과 연간은 결제 주기를 뜻해요. 주기에 따른 기능과 금액은 아직 정하지 않았으며, 출시 때 안내할 예정이에요.' },
  { id: 'business', category: '기업 서비스', question: '기업 서비스도 이용할 수 있나요?', answer: '팀 관리와 맞춤형 기업 서비스는 준비 중이에요. 기업별 요구사항과 연결할 시스템, 도입 범위와 일정은 별도로 협의할 예정이에요.' },
];
export const faqHref = id => `?help=${id || 'faq'}`;
export function FaqPage() {
  const item = faqItems.find(item => item.id === new URLSearchParams(window.location.search).get('help'));
  return <section className="page faq-page" aria-labelledby="faq-title">
    <nav className="faq-breadcrumb" aria-label="현재 위치"><a href="?">홈</a><span aria-hidden="true">/</span>{item ? <><a href={faqHref()}>자주 묻는 질문</a><span aria-hidden="true">/</span><span>{item.category}</span></> : <span>자주 묻는 질문</span>}</nav>
    <header><p className="faq-eyebrow">도움말</p><h1 id="faq-title">{item ? item.question : '자주 묻는 질문'}</h1>{!item && <p>시나리오 설계와 요금제에 대해 알아보세요.</p>}</header>
    {item ? <><article className="faq-answer"><h2>{item.category}</h2><p>{item.answer}</p><a href={faqHref()}>모든 질문 보기</a></article><section className="faq-related" aria-labelledby="faq-related-title"><h2 id="faq-related-title">관련 질문</h2><div className="faq-list">{faqItems.filter(other => other.id !== item.id).map(other => <a key={other.id} href={faqHref(other.id)}>{other.question}</a>)}</div></section></> : <div className="faq-list">{faqItems.map(item => <a key={item.id} href={faqHref(item.id)}><span><small>{item.category}</small>{item.question}</span></a>)}</div>}
  </section>;
}
