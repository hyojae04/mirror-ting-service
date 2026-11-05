import { scoreWorkplaceConversation } from './workplaceScore.js';

const advice = {
  '긴급 업무 발생': '새로 추가된 업무가 무엇인지 먼저 밝혀보세요.',
  '기존 마감의 어려움': '현재 마감일과 어려운 이유를 함께 말해보세요.',
  '업무 부담 설명': '동시에 처리해야 하는 업무의 부담을 설명해보세요.',
  '고객 영향 고려': '고객에게 미치는 영향을 우선순위의 근거로 제시해보세요.',
  '처리 순서 제안': '어떤 업무를 먼저 처리할지 순서를 제안해보세요.',
  '조정할 업무 명시': '일정을 조정할 보고서를 구체적으로 짚어보세요.',
  '구체적인 마감 제안': '“다음 주 화요일까지”처럼 새로운 마감일을 말해보세요.',
  '일정 공유': '합의한 내용을 관련 팀에 공유하겠다고 말해보세요.',
  '공유 시점 명시': '“오늘 중으로”처럼 공유할 시점을 정해보세요.',
  '진행 상황 보고': '중간에 진행 상황을 보고하겠다고 약속해보세요.',
};
const terms = ['업무', '긴급', '마감', '일정', '고객', '우선순위', '보고서', '공유', '진행', '보고', '화요일'];

export function buildWorkplaceReport(messages) {
  const result = scoreWorkplaceConversation(messages);
  const text = result.turns.map(turn => turn.answer).join(' ');
  const tokens = text.match(/[가-힣A-Za-z0-9]+/g) || [];
  const words = terms.map(word => ({word, count: tokens.filter(token => token.startsWith(word) && !terms.some(other => other.length > word.length && token.startsWith(other))).length}))
    .filter(item => item.count).sort((a,b) => b.count-a.count || terms.indexOf(a.word)-terms.indexOf(b.word));
  const fillers = ['음', '어', '그', '그런'].map(word => ({word,count:tokens.filter(token => token === word).length}));
  const gaps = result.turns.flatMap((turn,index) => turn.checks.filter(check => !check.met).map(check => ({turn:index+1,label:check.label,advice:advice[check.label]})));
  const matched = result.turns.reduce((n,turn) => n+turn.checks.filter(check => check.met).length,0);
  const strongest = [...result.turns].sort((a,b) => b.score/b.max-a.score/a.max)[0];
  const weakest = [...result.turns].sort((a,b) => a.score/a.max-b.score/b.max)[0];
  return {...result,words,fillers,gaps,matched,totalChecks:10,strongest,weakest,
    flow:result.turns.map((turn,index)=>({name:`${index+1}턴`,title:turn.title,rate:Math.round(turn.score/turn.max*100)}))};
}
