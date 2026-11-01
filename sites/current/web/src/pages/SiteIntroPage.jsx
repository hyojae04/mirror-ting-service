import { Button, Card, CardContent } from "../components/ui/shadcn";
import { homeFitSnapshot } from "../data/homeContent";

export function SiteIntroPage({ onPractice }) {
  return (
    <section className="page public-page site-intro-page">
      <header className="public-hero public-hero--compact">
        <p className="public-eyebrow">MIRROR-TING / 서비스 소개</p>
        <h1>중요한 대화 전에,<br />먼저 연습해요.</h1>
        <p>Mirror-Ting은 면접과 직장 대화를 미리 준비하는 서비스예요. 현재 공개 체험은 시나리오 설계까지만 제공해요. 설문을 작성하고 AI가 만든 연습 장면과 가상의 상대를 확인할 수 있어요.</p>
        <Button size="lg" type="button" onClick={onPractice}>홈에서 연습 준비하기</Button>
      </header>

      <section className="public-section" aria-labelledby="intro-fit-title">
        <div className="public-section__copy">
          <p className="public-eyebrow">4-Fit 피드백 미리보기</p>
          <h2 id="intro-fit-title">내 말과 행동을 돌아봐요</h2>
          <p>답변·목소리·표정·자세를 함께 살펴보는 기능이에요. 현재 공개 체험에서는 실제 대화 연습과 4-Fit 분석을 실행하지 않아요.</p>
        </div>
        <div className="public-card-grid public-card-grid--four">
          {homeFitSnapshot.map((fit) => (
            <Card className="public-feature-card public-feature-card--fit" key={fit.label}>
              <CardContent>
                <img className="public-fit-image" src={fit.image} alt="" width="72" height="72" loading="lazy" />
                <h3>{fit.short === "응답" ? "답변" : fit.short}</h3>
                <p>{fit.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
