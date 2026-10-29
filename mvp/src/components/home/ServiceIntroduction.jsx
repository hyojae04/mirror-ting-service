import { IntroScrollStory } from "./IntroScrollStory";
import { FitGridBackground } from "./FitGridBackground";
import { FitAnalysisPages } from "./FitAnalysisPages";
import "../../styles/service-introduction.css";

export function ServiceIntroduction({ mode, onNext }) {
  return (
    <div className="service-introduction">
      <IntroScrollStory mode={mode} onNext={onNext} />
      <section className="intro-analysis" id={`${mode}-analysis`} aria-labelledby={`${mode}-fit-title`}>
        <FitAnalysisPages mode={mode} stageBackground={<FitGridBackground />} />
      </section>
    </div>
  );
}
