// Explicit opt-in recording scenario. No request leaves the browser.
export function isWorkplaceDemo() {
  return new URLSearchParams(window.location.search).get('recording') === 'workplace';
}

export const workplaceDemoAnswers = [
  '긴급 업무가 추가돼서 기존 마감일까지 두 업무를 모두 끝내기 어려운 상황입니다.',
  '고객에게 영향이 큰 긴급 업무를 먼저 처리하고, 보고서는 다음 주 화요일까지 마무리하고 싶습니다.',
  '네, 오늘 중으로 공유하고 진행 상황도 중간에 보고드리겠습니다.',
];

export const workplaceDemoReplies = [
  '일정 조정이 필요하다고 했죠. 어떤 상황인지 먼저 설명해 줄래요?',
  '그렇군요. 어떤 업무를 먼저 처리하고, 일정은 어떻게 조정하면 좋을까요?',
  '좋아요. 그 순서대로 진행하고, 변경된 일정은 관련 팀에도 공유해 주세요.',
];

export async function workplaceDemoRequest(step, payload) {
  if (step === 'prepare') {
    const base = { ...payload.draft, situation:'업무 일정 조율', target:'팀장', difficulty:'basic', personality:'차분하고 근거를 확인하는 성격', persona:'팀 일정과 업무 배분을 담당하는 팀장' };
    const answer = payload.messages.at(-1)?.content?.trim() || '';
    const draft = { ...base };
    if (payload.answer_field === 'job_role') draft.job_role = answer;
    if (payload.answer_field === 'context') draft.context = answer;
    if (payload.answer_field === 'goal') draft.goal = answer;
    if (payload.answer_field === 'additional_notes') {
      draft.additional_notes = ['추가 사항 없어요','없어요','없음','건너뛰기'].includes(answer) ? '' : answer;
      draft.additional_notes_confirmed = true;
      return {message:'말씀하신 내용을 반영했어요. 설정을 확인하고 대화를 시작해 보세요.', draft, question:null, ready:true};
    }
    const questions = {
      job_role:{field:'job_role',title:'어떤 직무에서 일하고 계신가요?',choices:['서비스 기획자예요','개발자로 일하고 있어요']},
      context:{field:'context',title:'일정을 조정해야 하는 이유는 무엇인가요?',choices:['긴급 업무가 추가돼 기존 마감이 어려워졌어요','예상보다 작업이 오래 걸리고 있어요']},
      goal:{field:'goal',title:'팀장과 어떤 결과를 얻고 싶나요?',choices:['업무 우선순위와 마감일을 함께 조정하고 싶어요','일정을 지킬 수 있도록 도움을 요청하고 싶어요']},
      additional_notes:{field:'additional_notes',title:'추가로 반영하고 싶은 내용이 있나요?',choices:['추가 사항 없어요','추가 사항을 직접 적을게요']},
    };
    const field = !draft.job_role ? 'job_role' : !draft.context ? 'context' : !draft.goal ? 'goal' : 'additional_notes';
    const message = payload.answer_field ? '알려주신 내용을 반영했어요. 이어서 확인할게요.' : '팀장과 업무 일정을 조율하는 대화를 준비해볼게요. 몇 가지 상황을 알려주세요.';
    return {message,draft,question:questions[field],ready:false};
  }
  const answered = payload.messages.filter(message => message.role === 'user').length;
  return {message:workplaceDemoReplies[answered] || '', answered_turns:answered, done:answered >= 3};
}
