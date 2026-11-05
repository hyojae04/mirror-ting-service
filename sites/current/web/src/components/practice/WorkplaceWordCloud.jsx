import { layoutWorkplaceWords } from '../../lib/workplaceWordCloud';

export function WorkplaceWordCloud({ words }) {
  const cloud = layoutWorkplaceWords(words);
  if (!cloud.length) return <div className="report-cloud-empty">답변이 쌓이면 주요 표현을 보여드려요.</div>;
  const left = Math.min(...cloud.map(item=>item.box.left)) - 12;
  const top = Math.min(...cloud.map(item=>item.box.top)) - 12;
  const width = Math.max(...cloud.map(item=>item.box.right)) - left + 12;
  const height = Math.max(...cloud.map(item=>item.box.bottom)) - top + 12;
  return <figure className="report-word-cloud">
    <svg viewBox={`${left} ${top} ${width} ${height}`} role="img" aria-labelledby="report-cloud-title report-cloud-description">
      <title id="report-cloud-title">답변 어휘 워드클라우드</title>
      <desc id="report-cloud-description">{words.map(item=>`${item.word} ${item.count}회`).join(', ')}. 많이 사용한 표현일수록 크게 표시합니다.</desc>
      {cloud.map((item,index)=><text key={item.word} x={item.x} y={item.y} fontSize={item.size} textAnchor="middle" dominantBaseline="central" className={`report-cloud-tone-${index%3}`}><title>{item.word} · {item.count}회</title>{item.word}</text>)}
    </svg>
    <figcaption>단어 크기는 사용 횟수에 비례해요. <span>업무 관련 표현 {words.length}개</span></figcaption>
  </figure>;
}
