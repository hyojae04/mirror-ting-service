import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import interview from "../../assets/scenario-story/interview.jpg";
import dinner from "../../assets/scenario-story/dinner.jpg";
import meeting from "../../assets/scenario-story/meeting.jpg";
import "../../styles/intro-scroll-story.css";

const staticQuery = "(prefers-reduced-motion: reduce), (max-height: 560px)";
const scenes = [
  { label: "면접", text: "나의 경험을 나의 말로 전할 수 있도록, 먼저 연습해요.", title: <>머릿속이 하얘지는<br />면접 질문도.</>, image: interview, alt: "한국 사무실에서 맞은편 평가관 네 명 앞에 앉은 지원자의 오른쪽 허리 뒤에서 바라본 면접 장면" },
  { label: "회식", text: "처음 만난 동료와 자연스럽게 이야기할 수 있도록, 먼저 연습해요.", title: <>무슨 말을 할지 망설이는<br />첫 회식도.</>, image: dinner, alt: "테이블 중앙에서 건배하는 직장 동료들의 손과 잔을 위에서 가까이 바라본 회식 장면" },
  { label: "미팅", text: "처음 꺼내는 제안부터 함께 의견을 맞추는 순간까지, 먼저 연습해요.", title: <>내 생각을 또렷하게<br />전하고 싶은 미팅도.</>, image: meeting, alt: "오른쪽 여성의 뒷모습 너머로 얼굴이 흐리게 보이는 동료들과 노트북을 두고 대화하는 미팅 장면" },
  { label: "Mirror-Ting", text: "면접부터 회식, 미팅까지. 한 번의 연습이 다음 대화를 바꿔요.", title: <>중요한 대화 전에,<br /><em>미러팅과 먼저 연습하세요.</em></> },
];

export function IntroScrollStory({ mode, onNext }) {
  const [active, setActive] = useState(0);
  const [staticMode, setStaticMode] = useState(() => matchMedia(staticQuery).matches);
  const track = useRef(null);
  useEffect(() => {
    const media = matchMedia(staticQuery);
    let frame = 0;
    const update = () => {
      frame = 0;
      setStaticMode(media.matches);
      if (!track.current || media.matches) return;
      const node = track.current;
      const stage = node.firstElementChild;
      const inset = parseFloat(getComputedStyle(stage).top) || 0;
      const progress = (inset - node.getBoundingClientRect().top) / Math.max(1, node.offsetHeight - stage.offsetHeight);
      setActive(Math.max(0, Math.min(scenes.length - 1, Math.floor(progress * scenes.length))));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, []);
  return <section className="intro-story" id={`${mode}-overview`} aria-label="중요한 대화 전에 미리 연습해요">
    <div className="intro-story-track" ref={track} id={`${mode}-practice-preview`}>
      <div className="intro-story-stage" data-step={active} data-phase={active === 3 ? "finale" : "story"}>
        <div className="intro-story-collage" aria-hidden="true">
          {scenes.slice(0, -1).map((scene, index) => <figure key={scene.label} className={`intro-story-photo intro-story-photo--${index} ${active >= index ? "has-entered" : ""} ${active === index ? "is-current" : ""}`}><img src={scene.image} alt="" width="1100" height="734" loading="lazy" /></figure>)}
        </div>
        <div className="intro-story-panels">
          {scenes.map((scene, index) => <article key={scene.label} className={`intro-story-panel ${active === index ? "is-active" : ""}`} aria-hidden={!staticMode && active !== index} inert={!staticMode && active !== index}>
            <div className="intro-story-copy">
              <h2>{scene.title}</h2>
              <p>{scene.text}</p>
              {index === scenes.length - 1 && <button className="intro-story-cta" type="button" onClick={onNext}>내 상황으로 연습하기 <ArrowRight size={18} aria-hidden="true" /></button>}
            </div>
            {scene.image && <img className="intro-story-inline-photo" src={scene.image} alt={scene.alt} width="1100" height="734" loading="lazy" />}
          </article>)}
        </div>
      </div>
    </div>
  </section>;
}
