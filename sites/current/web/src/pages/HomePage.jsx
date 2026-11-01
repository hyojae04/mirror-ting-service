import { useEffect, useRef, useState } from "react";
import { HomeMotion, HomeFooter } from "../components/home/HomeMotion";
import { InterviewHome } from "../components/home/InterviewHome";
import { WorkplaceHome } from "../components/home/WorkplaceHome";
import { resolveServiceHomeContent } from "../data/serviceHomeContent";
import "../styles/home-motion.css";
import "../styles/prompt-home.css";
import "../styles/scenario-survey.css";

const heroWords = ["면접", "출근", "회식", "미팅", "회의"];

function HeroTypingWord() {
  const [text, setText] = useState(heroWords[0]);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    let index = 0;
    let count = heroWords[0].length;
    let erasing = true;
    const tick = () => {
      count += erasing ? -1 : 1;
      setText(heroWords[index].slice(0, count));
      let delay = erasing ? 85 : 150;
      if (count === 0) {
        index = (index + 1) % heroWords.length;
        erasing = false;
        delay = 260;
      } else if (count === heroWords[index].length) {
        erasing = true;
        delay = 1600;
      }
      timer = window.setTimeout(tick, delay);
    };
    const restart = () => {
      window.clearTimeout(timer);
      index = 0; count = heroWords[0].length; erasing = true;
      setText(heroWords[0]);
      if (!reduced.matches) timer = window.setTimeout(tick, 1600);
    };
    restart();
    reduced.addEventListener("change", restart);
    return () => { window.clearTimeout(timer); reduced.removeEventListener("change", restart); };
  }, []);
  return <span className="hero-typing-word">{text}</span>;
}

function SurveyStart({onNext, onUsage, inputRef}) {
  return <div className="survey-home-start"><button ref={inputRef} type="button" className="survey-primary" onClick={onNext}>연습해보기</button><button type="button" className="survey-secondary" onClick={onUsage}>사용 방법</button></div>;
}

export function HomePage({ serviceMode, prompt = "", onPrompt, onNext, onUsage, onModeSelect, onModePick, turns = 5, onTurns, dashboard = false, history = [], onRecords }) {
  const mode = resolveServiceHomeContent(serviceMode?.id);
  const input = useRef(null);
  const [projectTab, setProjectTab] = useState("내 연습");
  useEffect(() => { if (dashboard) window.scrollTo(0, 0); }, [dashboard]);
  const footerComposer = <SurveyStart onNext={onNext} onUsage={onUsage} />;
  const focusPrompt = () => {
    input.current?.scrollIntoView({ behavior: "auto", block: "center" });
    input.current?.focus({ preventScroll: true });
  };

  return (
    <section className={`page home-page mode-home-page mode-home-page--${mode.id} ${dashboard ? "lovable-dashboard" : ""}`}>
      <section className="prompt-home-hero" aria-labelledby="prompt-home-title">
        {dashboard && <button className="dashboard-announcement" type="button" onClick={() => { if (!prompt.trim()) onPrompt("어떤 대화를 연습하면 좋을지 함께 정하고 싶어요."); onNext(); }}>✦ AI와 함께 대화를 준비해요 </button>}
        <div className="prompt-home-inner">
          <h1 id="prompt-home-title"><span className="screen-reader-note">첫 면접, 출근, 회식, 미팅, 회의 전에 먼저 연습해요.</span><span aria-hidden="true">첫 <HeroTypingWord />전에,<br />먼저 연습해요.</span></h1>
          <p className="prompt-home-description">내 상황에 맞는 대화를 골라보세요.<br className="prompt-mobile-break" /> AI가 연습할 장면을 준비해요.</p>
          <SurveyStart onNext={onNext} onUsage={onUsage} inputRef={input} />
        </div>
      </section>
      {dashboard && <section className="member-recent dashboard-projects" aria-labelledby="member-recent-title">
        <header><div className="dashboard-project-tabs" role="group" aria-label="연습 목록">{["내 연습", "최근 연습", "연습 템플릿"].map(tab => <button type="button" key={tab} aria-pressed={projectTab === tab} onClick={() => setProjectTab(tab)}>{tab}</button>)}</div><button type="button" onClick={onRecords}>전체 둘러보기</button></header>
        <h2 id="member-recent-title" className="screen-reader-note">{projectTab}</h2>
        <div className="member-recent-grid">{projectTab === "연습 템플릿" ? ["첫 면접에서 자기소개하기", "팀장과 업무 일정 조율하기", "처음 만난 동료와 대화하기"].map((title,index) => <button className="dashboard-template" type="button" key={title} onClick={() => { onPrompt(title); focusPrompt(); }}><div className={`dashboard-project-cover cover-${index}`} aria-hidden="true">{["면접", "미팅", "대화"][index]}</div><h3>{title}</h3><p>이 상황으로 연습 준비하기</p></button>) : history.length ? history.slice(-4).reverse().map((item,index)=><article key={item.session_id || item.attempt_id || index}><div className={`dashboard-project-cover cover-${index % 3}`} aria-hidden="true">대화 연습</div><h3>{item.scenario_title || item.title || "대화 연습"}</h3><p>{String(item.started_at || item.finished_at || "").slice(0,10) || "연습 기록"}</p><button type="button" onClick={onRecords}>기록 보기</button></article>) : <article className="member-empty"><h3>아직 연습이 없어요</h3><p>설문이나 연습 템플릿으로 첫 대화를 준비해보세요.</p><button type="button" onClick={() => setProjectTab("연습 템플릿")}>연습 템플릿 둘러보기</button></article>}</div>
      </section>}
      {!dashboard && <HomeMotion key={mode.id}>
        {mode.id === "interview" && <InterviewHome onNext={focusPrompt} composer={footerComposer} />}
        {mode.id === "workplace" && <WorkplaceHome onNext={focusPrompt} composer={footerComposer} />}
      </HomeMotion>}
      <HomeFooter mode={mode.id} onNext={focusPrompt} onModeSelect={onModeSelect} />
    </section>
  );
}
