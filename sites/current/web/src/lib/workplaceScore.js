const rubric = [
  { title: '상황 설명', checks: [
    ['긴급 업무 발생', /긴급|추가.*업무|업무.*추가/, 10],
    ['기존 마감의 어려움', /마감|기한/, 10],
    ['업무 부담 설명', /어려|어렵|힘들|불가능|두\s*업무|모두.*끝/, 10],
  ] },
  { title: '우선순위와 일정 제안', checks: [
    ['고객 영향 고려', /고객|영향/, 10],
    ['처리 순서 제안', /먼저|우선/, 10],
    ['조정할 업무 명시', /보고서/, 10],
    ['구체적인 마감 제안', /화요일|화욜/, 10],
  ] },
  { title: '후속 조치 약속', checks: [
    ['일정 공유', /공유|전달/, 10],
    ['공유 시점 명시', /오늘|금일/, 10],
    ['진행 상황 보고', /보고|진행\s*상황/, 10],
  ] },
];

// This recording flow uses a transparent content checklist, not a model or media analysis.
export function scoreWorkplaceConversation(messages) {
  const answers = messages.filter(message => message.role === 'user').map(message => message.content);
  const turns = rubric.map((turn, index) => {
    const answer = answers[index] || '';
    const checks = turn.checks.map(([label, pattern, points]) => ({ label, points, met: pattern.test(answer) }));
    return { title: turn.title, answer, checks,
      score: checks.reduce((total, check) => total + (check.met ? check.points : 0), 0),
      max: checks.reduce((total, check) => total + check.points, 0) };
  });
  return { total: turns.reduce((total, turn) => total + turn.score, 0), turns };
}
