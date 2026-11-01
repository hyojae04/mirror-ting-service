import { ServiceIntroduction } from "./ServiceIntroduction";
import { FooterCta } from "./HomeSections";

export function WorkplaceHome({ onNext, composer }) {
  return (
    <>
      <ServiceIntroduction mode="workplace" onNext={onNext} />
      <FooterCta composer={composer} title="어떤 대화를 연습하고 싶나요?" text="설문에서 직장 대화 상황을 정하고 AI가 만든 연습 장면과 가상의 상대를 확인해요." button="연습 시작하기" onNext={onNext} />
    </>
  );
}
